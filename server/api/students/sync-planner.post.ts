import { defineEventHandler } from "h3";
import mysql from "mysql2/promise";

export default defineEventHandler(async (event) => {
  console.log("🔄 Starting ultra-fast student sync from Course Planner...");

  let plannerConnection: mysql.Connection | null = null;
  let atcConnection: mysql.Connection | null = null;

  try {
    const host = process.env.DATABASE_HOST || "localhost";
    const port = Number(process.env.DATABASE_PORT) || 3306;
    const user = process.env.DATABASE_USER || "root";
    const password = process.env.DATABASE_PASSWORD || "";

    // 1. Connect to MySQL planner database safely
    plannerConnection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database: "planner",
    });

    atcConnection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database: "atc",
    });

    // 2. Fetch all active contingents with organization info
    const [plannerRows]: any = await plannerConnection.query(`
      SELECT 
        c.id, c.pinfl, c.name, c.organizationId,
        c.department, c.departmentUz, c.departmentEn, c.departmentRu,
        c.position, c.positionUz, c.positionEn, c.positionRu,
        c.photo, c.onecId, c.hireDate,
        o.name as organizationName, o.tin as organizationTin
      FROM Contingent c
      LEFT JOIN Organization o ON c.organizationId = o.id
      WHERE c.isActive = 1
      ORDER BY c.name ASC
    `);

    if (!plannerRows || plannerRows.length === 0) {
      return {
        success: true,
        message: "В курс-планировщике не найдено активных слушателей",
        total: 0,
        created: 0,
        updated: 0,
        matchedOrgs: 0,
        errors: [],
      };
    }

    // 3. Preload all organizations and existing PINFLs from ATC database
    const [atcOrgs]: any = await atcConnection.query(
      "SELECT id, name, inn FROM organizations"
    );

    const orgByInn = new Map<string, any>();
    const orgByName = new Map<string, any>();

    for (const org of atcOrgs) {
      if (org.inn) {
        orgByInn.set(org.inn.trim(), org);
      }
      if (org.name) {
        const cleanName = org.name.toLowerCase().replace(/[^a-zа-я0-9]/gi, "");
        orgByName.set(cleanName, org);
      }
    }

    const [existingStudents]: any = await atcConnection.query(
      "SELECT pinfl FROM students"
    );
    const existingPinflSet = new Set<string>(
      existingStudents.map((s: any) => String(s.pinfl).trim())
    );

    let created = 0;
    let updated = 0;
    let matchedOrgsCount = 0;
    const errors: any[] = [];

    const insertBatch: any[][] = [];
    const updateBatch: any[][] = [];

    for (const pStudent of plannerRows) {
      try {
        const pinfl = String(pStudent.pinfl || "").trim();
        if (!pinfl || pinfl.length !== 14) {
          errors.push({
            name: pStudent.name,
            error: "Некорректный ПИНФЛ (должно быть 14 цифр)",
          });
          continue;
        }

        // Match organization by INN (tin) first, then fallback to normalized name
        let targetOrg: any = null;
        const plannerTin = pStudent.organizationTin
          ? String(pStudent.organizationTin).trim()
          : null;

        if (plannerTin && orgByInn.has(plannerTin)) {
          targetOrg = orgByInn.get(plannerTin);
        } else if (pStudent.organizationName) {
          const cleanPName = pStudent.organizationName
            .toLowerCase()
            .replace(/[^a-zа-я0-9]/gi, "");
          targetOrg = orgByName.get(cleanPName);
        }

        if (targetOrg) {
          matchedOrgsCount++;
        }

        const orgName = targetOrg
          ? targetOrg.name
          : pStudent.organizationName || "Не указана";
        const orgId = targetOrg ? targetOrg.id : null;

        // Normalize photo
        let photoBase64 = pStudent.photo ? String(pStudent.photo).trim() : null;
        if (
          photoBase64 &&
          !photoBase64.startsWith("data:") &&
          !photoBase64.startsWith("http")
        ) {
          let mime = "image/jpeg";
          if (photoBase64.startsWith("iVBORw0KGgo")) mime = "image/png";
          photoBase64 = `data:${mime};base64,${photoBase64}`;
        }

        const deptRu = pStudent.departmentRu || pStudent.department || null;
        const posRu = pStudent.positionRu || pStudent.position || "Слушатель";

        if (existingPinflSet.has(pinfl)) {
          updateBatch.push([
            pStudent.name,
            orgName,
            orgId,
            pStudent.department || null,
            pStudent.departmentUz || null,
            pStudent.departmentEn || null,
            deptRu,
            pStudent.position || "Слушатель",
            pStudent.positionUz || null,
            pStudent.positionEn || null,
            posRu,
            photoBase64,
            pinfl,
          ]);
          updated++;
        } else {
          const id = crypto.randomUUID();
          insertBatch.push([
            id,
            pStudent.name,
            pinfl,
            orgName,
            orgId,
            pStudent.department || null,
            pStudent.departmentUz || null,
            pStudent.departmentEn || null,
            deptRu,
            pStudent.position || "Слушатель",
            pStudent.positionUz || null,
            pStudent.positionEn || null,
            posRu,
            photoBase64,
          ]);
          created++;
          existingPinflSet.add(pinfl);
        }
      } catch (err: any) {
        errors.push({
          name: pStudent.name,
          pinfl: pStudent.pinfl,
          error: err.message || "Ошибка обработки",
        });
      }
    }

    // Execute Bulk Inserts (in chunks of 250)
    const CHUNK_SIZE = 250;
    for (let i = 0; i < insertBatch.length; i += CHUNK_SIZE) {
      const chunk = insertBatch.slice(i, i + CHUNK_SIZE);
      await atcConnection.query(
        `INSERT INTO students 
         (id, full_name, pinfl, organization, organization_id, department, department_uz, department_en, department_ru, position, position_uz, position_en, position_ru, photo_base64, created_at, updated_at) 
         VALUES ${chunk.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())").join(", ")}`,
        chunk.flat()
      );
    }

    // Execute Parallel Bulk Updates (concurrency = 25)
    const CONCURRENCY = 25;
    const updateQuery = `
      UPDATE students 
      SET full_name = ?, organization = ?, organization_id = ?, 
          department = ?, department_uz = ?, department_en = ?, department_ru = ?, 
          position = ?, position_uz = ?, position_en = ?, position_ru = ?, 
          photo_base64 = ?, updated_at = NOW() 
      WHERE pinfl = ?
    `;

    for (let i = 0; i < updateBatch.length; i += CONCURRENCY) {
      const chunk = updateBatch.slice(i, i + CONCURRENCY);
      await Promise.all(
        chunk.map((item) => atcConnection!.query(updateQuery, item))
      );
    }

    console.log(
      `🎉 Student sync complete! Total: ${plannerRows.length}, Created: ${created}, Updated: ${updated}`
    );

    return {
      success: true,
      message: `Синхронизация успешно завершена. Создано новых: ${created}, Обновлено: ${updated}`,
      total: plannerRows.length,
      created,
      updated,
      matchedOrgs: matchedOrgsCount,
      errors: errors.slice(0, 10),
    };
  } catch (error: any) {
    console.error("❌ Student sync error:", error);
    return {
      success: false,
      error: error.message || "Ошибка во время синхронизации слушателей",
    };
  } finally {
    if (plannerConnection) await plannerConnection.end().catch(() => {});
    if (atcConnection) await atcConnection.end().catch(() => {});
  }
});
