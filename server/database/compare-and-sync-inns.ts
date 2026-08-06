import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  console.log("🔍 Connecting to MySQL databases...");

  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
  });

  try {
    // 1. Fetch organizations from course-planner2 (DB: planner)
    console.log("=== Organizations in 'planner' database (course-planner2) ===");
    const [plannerRows]: any = await connection.query(`
      SELECT * FROM planner.Organization
    `);

    console.log(`Found ${plannerRows.length} organizations in 'planner':\n`);
    for (const org of plannerRows) {
      console.log(`- ID: ${org.id}`);
      console.log(`  Name: "${org.name}"`);
      console.log(`  TIN (ИНН): "${org.tin || 'N/A'}"`);
      console.log(`  Contact Person: "${org.contactPerson || 'N/A'}"`);
      console.log(`  Legal Address: "${org.legalAddress || 'N/A'}"`);
      console.log(`----------------------------------------`);
    }

    // 2. Fetch organizations from ATC_platform (DB: atc)
    console.log("\n=== Organizations in 'atc' database (ATC_platform) ===");
    const [atcRows]: any = await connection.query(`
      SELECT id, code, inn, name, contact_phone, contact_email, contact_person, legal_address
      FROM atc.organizations
    `);

    console.log(`Found ${atcRows.length} organizations in 'atc':\n`);
    for (const org of atcRows) {
      console.log(`- ID: ${org.id}`);
      console.log(`  Name: "${org.name}"`);
      console.log(`  Code: "${org.code}"`);
      console.log(`  Current INN: "${org.inn || 'N/A'}"`);
      console.log(`----------------------------------------`);
    }

    // 3. Match and Sync
    console.log("\n=== Matching and Updating INNs in 'atc' database ===");
    let updatedCount = 0;

    for (const atcOrg of atcRows) {
      // Try matching by exact name, normalized name, or code
      const match = plannerRows.find((p: any) => {
        if (p.tin && p.tin.trim()) {
          // Normalize names for comparison
          const cleanAtcName = atcOrg.name.toLowerCase().replace(/[^a-zа-я0-9]/gi, "");
          const cleanPlannerName = p.name.toLowerCase().replace(/[^a-zа-я0-9]/gi, "");

          return (
            cleanAtcName === cleanPlannerName ||
            (atcOrg.code && p.code && atcOrg.code === p.code) ||
            cleanAtcName.includes(cleanPlannerName) ||
            cleanPlannerName.includes(cleanAtcName)
          );
        }
        return false;
      });

      if (match && match.tin) {
        console.log(`✅ MATCH FOUND for ATC Org: "${atcOrg.name}"`);
        console.log(`   Mapped Planner Org: "${match.name}" -> INN: ${match.tin}`);

        await connection.query(
          `
          UPDATE atc.organizations
          SET inn = ?,
              contact_person = COALESCE(contact_person, ?),
              legal_address = COALESCE(legal_address, ?)
          WHERE id = ?
        `,
          [
            match.tin.trim(),
            match.contactPerson || null,
            match.legalAddress || null,
            atcOrg.id,
          ]
        );
        updatedCount++;
      } else {
        console.log(`⚠️ NO INN MATCH for ATC Org: "${atcOrg.name}" (Code: ${atcOrg.code})`);
      }
    }

    console.log(`\n🎉 Synchronization finished! Updated ${updatedCount} organizations in ATC_platform.`);
  } catch (error) {
    console.error("❌ Error during execution:", error);
  } finally {
    await connection.end();
  }
}

main();
