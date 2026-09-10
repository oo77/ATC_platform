import { getDbPool } from "../../utils/db";
import {
  fetchCoursePlannerStudents,
  getCoursePlannerConfig,
  StudentResource,
} from "../../utils/coursePlanner";
import crypto from "crypto";

export default defineEventHandler(async (event) => {
  console.log("🚀 [SyncPlanner] Starting 10x streaming pipeline student sync...");

  let body: any = {};
  try {
    body = await readBody(event);
  } catch {
    body = {};
  }

  const isStream = Boolean(getHeader(event, "accept")?.includes("text/event-stream"));

  const overrideConfig = (body?.url || body?.token)
    ? { url: body.url, token: body.token }
    : undefined;

  const config = getCoursePlannerConfig();
  const effectiveUrl = overrideConfig?.url || config.url;
  const effectiveToken = overrideConfig?.token !== undefined ? overrideConfig.token : config.token;

  if (!effectiveUrl || !effectiveToken) {
    const errorMsg = "URL или API-токен для Course Planner 2 не настроены.";
    if (isStream) {
      setResponseHeader(event, "Content-Type", "text/event-stream");
      event.node.res.write(`event: error\ndata: ${JSON.stringify({ error: errorMsg })}\n\n`);
      event.node.res.end();
      return;
    }
    return { success: false, error: errorMsg };
  }

  // Setup SSE stream headers if requested
  const sendEvent = (eventName: string, data: any) => {
    if (!isStream) return;
    try {
      event.node.res.write(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`);
      if (typeof (event.node.res as any).flush === "function") {
        (event.node.res as any).flush();
      }
    } catch (e: any) {
      console.warn("⚠️ Failed to write to SSE stream:", e.message);
    }
  };

  if (isStream) {
    setResponseHeader(event, "Content-Type", "text/event-stream");
    setResponseHeader(event, "Cache-Control", "no-cache, no-transform");
    setResponseHeader(event, "Connection", "keep-alive");
    setResponseHeader(event, "X-Accel-Buffering", "no");
  }

  try {
    const startTime = Date.now();
    const pool = getDbPool();
    await pool.query("SET GLOBAL max_allowed_packet = 67108864").catch(() => {});

    // 1. Preload local organization mappings and existing PINFL set (O(1) lookups)
    sendEvent("status", { message: "Загрузка локального справочника организаций по ИНН..." });

    const [atcOrgs]: any = await pool.query("SELECT id, name, inn FROM organizations");
    const orgByInn = new Map<string, any>();
    const orgByName = new Map<string, any>();

    for (const org of atcOrgs) {
      if (org.inn) {
        orgByInn.set(String(org.inn).trim(), org);
      }
      if (org.name) {
        const cleanName = org.name.toLowerCase().replace(/[^a-zа-я0-9]/gi, "");
        orgByName.set(cleanName, org);
      }
    }

    const [existingStudents]: any = await pool.query("SELECT pinfl FROM students");
    const existingPinflSet = new Set<string>(
      existingStudents.map((s: any) => String(s.pinfl || "").trim())
    );

    // 2. Fetch Page 1 to inspect total count
    sendEvent("status", { message: "Подключение к API Course Planner 2..." });
    const PAGE_SIZE = 100;
    const firstPage = await fetchCoursePlannerStudents(
      { page: 1, limit: PAGE_SIZE },
      { url: effectiveUrl, token: effectiveToken }
    );

    if (!firstPage.success) {
      throw new Error(firstPage.error || "Не удалось загрузить данные из Course Planner 2 API");
    }

    const totalStudents = Number(firstPage.total) || (firstPage.data?.length || 0);
    const totalPages = Number(firstPage.totalPages) || Math.ceil(totalStudents / PAGE_SIZE);
    const targetPages = body?.maxPages ? Math.min(totalPages, Number(body.maxPages)) : totalPages;
    const effectiveTotal = Math.min(totalStudents, targetPages * PAGE_SIZE);

    console.log(`🚀 [Pipeline] ${totalStudents} total students found. Syncing ${targetPages} pages (${PAGE_SIZE}/page)...`);

    sendEvent("init", {
      total: effectiveTotal,
      totalPages: targetPages,
      pageSize: PAGE_SIZE,
    });

    // Tracking metrics
    let processedCount = 0;
    let createdCount = 0;
    let updatedCount = 0;
    let matchedOrgsCount = 0;
    let photosCount = 0;
    let multilingualDeptCount = 0;
    let multilingualPosCount = 0;
    const samples: any[] = [];
    const errors: any[] = [];

    // Helper: process and upsert a batch of students using multi-row INSERT ... ON DUPLICATE KEY UPDATE
    const processAndUpsertPage = async (studentsList: StudentResource[], pageNumber: number) => {
      if (!studentsList || studentsList.length === 0) return;

      const rowsToUpsert: any[][] = [];

      for (const pStudent of studentsList) {
        try {
          const pinfl = String(pStudent.pinfl || "").trim();
          if (!pinfl || !/^\d{14}$/.test(pinfl)) {
            errors.push({
              name: pStudent.name || "Без имени",
              pinfl: pinfl || "пусто",
              error: "Некорректный ПИНФЛ (требуется 14 цифр)",
            });
            continue;
          }

          // Match organization by INN first, then fallback to normalized name
          let targetOrg: any = null;
          const plannerTin = pStudent.organization?.tin ? String(pStudent.organization.tin).trim() : null;
          const plannerOrgName = pStudent.organization?.name ? String(pStudent.organization.name).trim() : null;

          if (plannerTin && orgByInn.has(plannerTin)) {
            targetOrg = orgByInn.get(plannerTin);
          } else if (plannerOrgName) {
            const cleanPName = plannerOrgName.toLowerCase().replace(/[^a-zа-я0-9]/gi, "");
            targetOrg = orgByName.get(cleanPName);
          }

          if (targetOrg) {
            matchedOrgsCount++;
          }

          const orgName = targetOrg?.name || plannerOrgName || null;
          const orgId = targetOrg?.id || null;

          // Process multilingual department
          let deptUz: string | null = null;
          let deptRu: string | null = null;
          let deptEn: string | null = null;
          let mainDept: string | null = null;

          if (pStudent.department && typeof pStudent.department === "object") {
            deptUz = pStudent.department.uz?.trim() || null;
            deptRu = pStudent.department.ru?.trim() || null;
            deptEn = pStudent.department.en?.trim() || null;
            mainDept = deptRu || deptUz || deptEn || null;
          } else if (typeof pStudent.department === "string") {
            mainDept = pStudent.department.trim() || null;
            deptRu = mainDept;
          }

          if ((deptUz && deptRu) || (deptRu && deptEn) || (deptUz && deptEn)) {
            multilingualDeptCount++;
          }

          // Process multilingual position
          let posUz: string | null = null;
          let posRu: string | null = null;
          let posEn: string | null = null;
          let mainPos = "Слушатель";

          if (pStudent.position && typeof pStudent.position === "object") {
            posUz = pStudent.position.uz?.trim() || null;
            posRu = pStudent.position.ru?.trim() || null;
            posEn = pStudent.position.en?.trim() || null;
            mainPos = posRu || posUz || posEn || "Слушатель";
          } else if (typeof pStudent.position === "string" && pStudent.position.trim()) {
            mainPos = pStudent.position.trim();
            posRu = mainPos;
          }

          if ((posUz && posRu) || (posRu && posEn) || (posUz && posEn)) {
            multilingualPosCount++;
          }

          const photoBase64 = pStudent.photo && typeof pStudent.photo === "string" && pStudent.photo.trim()
            ? pStudent.photo.trim()
            : null;

          if (photoBase64) {
            photosCount++;
          }

          const fullName = String(pStudent.name || "").trim() || "Слушатель";

          // Collect rich samples
          if (samples.length < 4 && ((deptUz && deptRu) || (posUz && posRu) || photoBase64)) {
            samples.push({
              name: fullName,
              pinfl,
              organization: orgName,
              department: { uz: deptUz, ru: deptRu, en: deptEn },
              position: { uz: posUz, ru: posRu, en: posEn },
              hasPhoto: Boolean(photoBase64),
            });
          }

          const isExisting = existingPinflSet.has(pinfl);
          if (isExisting) {
            updatedCount++;
          } else {
            createdCount++;
            existingPinflSet.add(pinfl);
          }

          const id = crypto.randomUUID();
          rowsToUpsert.push([
            id,
            fullName,
            pinfl,
            orgName,
            orgId,
            mainDept,
            deptUz,
            deptEn,
            deptRu,
            mainPos,
            posUz,
            posEn,
            posRu,
            photoBase64,
          ]);
        } catch (err: any) {
          errors.push({
            name: pStudent.name || "Ошибка",
            pinfl: pStudent.pinfl,
            error: err.message,
          });
        }
      }

      // Deduplicate rows by PINFL within the page to avoid ER_DUP_ENTRY
      const uniqueRowsMap = new Map<string, any[]>();
      for (const row of rowsToUpsert) {
        uniqueRowsMap.set(row[2], row);
      }
      const uniqueRows = Array.from(uniqueRowsMap.values());

      // Bulk Upsert in chunks of 20
      const CHUNK_SIZE = 20;
      for (let i = 0; i < uniqueRows.length; i += CHUNK_SIZE) {
        const chunk = uniqueRows.slice(i, i + CHUNK_SIZE);
        const sql = `
          INSERT INTO students 
          (id, full_name, pinfl, organization, organization_id, department, department_uz, department_en, department_ru, position, position_uz, position_en, position_ru, photo_base64, created_at, updated_at) 
          VALUES ${chunk.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())").join(", ")}
          ON DUPLICATE KEY UPDATE 
            full_name = VALUES(full_name),
            organization = VALUES(organization),
            organization_id = VALUES(organization_id),
            department = VALUES(department),
            department_uz = VALUES(department_uz),
            department_en = VALUES(department_en),
            department_ru = VALUES(department_ru),
            position = VALUES(position),
            position_uz = VALUES(position_uz),
            position_en = VALUES(position_en),
            position_ru = VALUES(position_ru),
            photo_base64 = COALESCE(VALUES(photo_base64), students.photo_base64),
            updated_at = NOW()
        `;

        try {
          await pool.query(sql, chunk.flat());
        } catch (chunkErr: any) {
          // Fallback item by item
          for (const item of chunk) {
            const singleSql = `
              INSERT INTO students 
              (id, full_name, pinfl, organization, organization_id, department, department_uz, department_en, department_ru, position, position_uz, position_en, position_ru, photo_base64, created_at, updated_at) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
              ON DUPLICATE KEY UPDATE 
                full_name = VALUES(full_name),
                organization = VALUES(organization),
                organization_id = VALUES(organization_id),
                department = VALUES(department),
                department_uz = VALUES(department_uz),
                department_en = VALUES(department_en),
                department_ru = VALUES(department_ru),
                position = VALUES(position),
                position_uz = VALUES(position_uz),
                position_en = VALUES(position_en),
                position_ru = VALUES(position_ru),
                photo_base64 = COALESCE(VALUES(photo_base64), students.photo_base64),
                updated_at = NOW()
            `;
            try {
              await pool.query(singleSql, item);
            } catch (singleErr: any) {
              if (singleErr.message?.includes("max_allowed_packet") && item[13]) {
                const noPhotoItem = [...item];
                noPhotoItem[13] = null;
                await pool.query(singleSql, noPhotoItem).catch((e: any) => {
                  errors.push({ name: item[1], pinfl: item[2], error: e.message });
                });
              } else {
                errors.push({ name: item[1], pinfl: item[2], error: singleErr.message });
              }
            }
          }
        }
      }

      processedCount += studentsList.length;
      const elapsedSec = Math.max(0.1, (Date.now() - startTime) / 1000);
      const speed = Math.round(processedCount / elapsedSec);
      const percentage = Math.min(100, Math.round((processedCount / effectiveTotal) * 100));

      sendEvent("progress", {
        processed: processedCount,
        total: effectiveTotal,
        created: createdCount,
        updated: updatedCount,
        photosCount,
        matchedOrgs: matchedOrgsCount,
        multilingualDeptCount,
        multilingualPosCount,
        percentage,
        speed,
        page: pageNumber,
        totalPages: targetPages,
      });
    };

    // 3. Process Page 1 immediately
    await processAndUpsertPage(firstPage.data || [], 1);

    // 4. Concurrently process remaining pages with worker queue (CONCURRENCY = 6)
    if (targetPages > 1) {
      const remainingPages: number[] = [];
      for (let p = 2; p <= targetPages; p++) {
        remainingPages.push(p);
      }

      const CONCURRENCY = 6;
      let currentIndex = 0;

      const worker = async () => {
        while (currentIndex < remainingPages.length) {
          const pageIndex = currentIndex++;
          const pageNum = remainingPages[pageIndex];
          if (!pageNum) break;

          try {
            const pageRes = await fetchCoursePlannerStudents(
              { page: pageNum, limit: PAGE_SIZE },
              { url: effectiveUrl, token: effectiveToken }
            );

            if (pageRes.success && pageRes.data) {
              await processAndUpsertPage(pageRes.data, pageNum);
            }
          } catch (pageErr: any) {
            console.error(`❌ Error fetching/processing page ${pageNum}:`, pageErr.message);
          }
        }
      };

      const workers = Array.from({ length: Math.min(CONCURRENCY, remainingPages.length) }, () => worker());
      await Promise.all(workers);
    }

    const totalElapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`🎉 [Pipeline Complete] Processed ${processedCount} students in ${totalElapsedSec}s. Created: ${createdCount}, Updated: ${updatedCount}, Photos: ${photosCount}`);

    const finalResult = {
      success: true,
      message: `Синхронизация через 10x Pipeline завершена за ${totalElapsedSec} сек. Обработано: ${processedCount} (Создано: ${createdCount}, Обновлено: ${updatedCount})`,
      total: processedCount,
      created: createdCount,
      updated: updatedCount,
      matchedOrgs: matchedOrgsCount,
      photosCount,
      multilingualDeptCount,
      multilingualPosCount,
      duration: totalElapsedSec,
      samples,
      errors: errors.slice(0, 15),
    };

    sendEvent("complete", finalResult);

    if (isStream) {
      event.node.res.end();
      return;
    }

    return finalResult;
  } catch (error: any) {
    console.error("❌ 10x Pipeline student sync error:", error);
    const errPayload = {
      success: false,
      error: error.message || "Ошибка во время синхронизации слушателей через API",
    };
    sendEvent("error", errPayload);
    if (isStream) {
      event.node.res.end();
      return;
    }
    return errPayload;
  }
});
