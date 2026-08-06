import mysql from "mysql2/promise";
import crypto from "crypto";

async function runSync() {
  console.log("⚡ Starting fast batch sync execution...");
  const host = "localhost";
  const user = "root";
  const password = "";

  const plannerConn = await mysql.createConnection({ host, user, password, database: "planner" });
  const atcConn = await mysql.createConnection({ host, user, password, database: "atc" });

  const [plannerRows]: any = await plannerConn.query(
    "SELECT c.*, o.name as organizationName, o.tin as organizationTin FROM Contingent c LEFT JOIN Organization o ON c.organizationId = o.id WHERE c.isActive = 1"
  );
  console.log("Found planner contingents:", plannerRows.length);

  const [atcOrgs]: any = await atcConn.query("SELECT id, name, inn FROM organizations");
  const orgByInn = new Map<string, any>();
  atcOrgs.forEach((o: any) => {
    if (o.inn) orgByInn.set(o.inn.trim(), o);
  });

  const [existingStudents]: any = await atcConn.query("SELECT pinfl FROM students");
  const existingPinflSet = new Set<string>(existingStudents.map((s: any) => String(s.pinfl).trim()));

  let created = 0;
  let updated = 0;
  let matchedOrgs = 0;

  const insertBatch: any[][] = [];
  const updateBatch: any[][] = [];

  for (const p of plannerRows) {
    const pinfl = String(p.pinfl || "").trim();
    if (!pinfl || pinfl.length !== 14) continue;

    const targetOrg = orgByInn.get(p.organizationTin?.trim());
    if (targetOrg) matchedOrgs++;

    const orgId = targetOrg ? targetOrg.id : null;
    const orgName = targetOrg ? targetOrg.name : (p.organizationName || "Не указана");

    let photo = p.photo ? String(p.photo).trim() : null;
    if (photo && !photo.startsWith("data:") && !photo.startsWith("http")) {
      photo = "data:image/jpeg;base64," + photo;
    }

    if (existingPinflSet.has(pinfl)) {
      updateBatch.push([
        p.name,
        orgName,
        orgId,
        p.department || null,
        p.departmentUz || null,
        p.departmentEn || null,
        p.departmentRu || p.department || null,
        p.position || "Слушатель",
        p.positionUz || null,
        p.positionEn || null,
        p.positionRu || p.position || null,
        photo,
        pinfl,
      ]);
      updated++;
    } else {
      const id = crypto.randomUUID();
      insertBatch.push([
        id,
        p.name,
        pinfl,
        orgName,
        orgId,
        p.department || null,
        p.departmentUz || null,
        p.departmentEn || null,
        p.departmentRu || p.department || null,
        p.position || "Слушатель",
        p.positionUz || null,
        p.positionEn || null,
        p.positionRu || p.position || null,
        photo,
      ]);
      created++;
      existingPinflSet.add(pinfl);
    }
  }

  console.log(`Inserting ${insertBatch.length} new students, updating ${updateBatch.length} existing...`);

  // Bulk Insert in chunks of 500
  const CHUNK_SIZE = 500;
  for (let i = 0; i < insertBatch.length; i += CHUNK_SIZE) {
    const chunk = insertBatch.slice(i, i + CHUNK_SIZE);
    await atcConn.query(
      `INSERT INTO students 
       (id, full_name, pinfl, organization, organization_id, department, department_uz, department_en, department_ru, position, position_uz, position_en, position_ru, photo_base64, created_at, updated_at) 
       VALUES ${chunk.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())").join(", ")}`,
      chunk.flat()
    );
  }

  // Bulk Update
  for (const item of updateBatch) {
    await atcConn.query(
      `UPDATE students SET full_name = ?, organization = ?, organization_id = ?, department = ?, department_uz = ?, department_en = ?, department_ru = ?, position = ?, position_uz = ?, position_en = ?, position_ru = ?, photo_base64 = ?, updated_at = NOW() WHERE pinfl = ?`,
      item
    );
  }

  console.log(`🎉 Batch Sync successful! Matched Orgs: ${matchedOrgs}, Created: ${created}, Updated: ${updated}`);

  await plannerConn.end();
  await atcConn.end();
}

runSync();
