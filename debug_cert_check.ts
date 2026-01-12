import "dotenv/config";
import { executeQuery } from "./server/utils/db";
import fs from "fs";
import path from "path";

async function run() {
  console.log("Checking certificate files...");
  const dir = path.join(process.cwd(), "storage", "Certificates");
  console.log("Directory:", dir);

  if (!fs.existsSync(dir)) {
    console.error("Directory does not exist!");
    return;
  }

  const files = fs.readdirSync(dir);
  console.log("Files found:", files);

  // Check DB for specific cert
  console.log("Checking DB records for 0003...");
  try {
    const rows = await executeQuery<any[]>(
      "SELECT id, certificate_number, pdf_file_url FROM issued_certificates WHERE certificate_number LIKE '%0003%'"
    );
    console.log("Found certificates:", rows);

    for (const row of rows) {
      console.log(`Cert: ${row.certificate_number}, URL: ${row.pdf_file_url}`);
      // Check if file exists for this URL
      if (row.pdf_file_url) {
        const cleanPath = row.pdf_file_url.startsWith("/")
          ? row.pdf_file_url.slice(1)
          : row.pdf_file_url;
        const fullPath = path.join(process.cwd(), cleanPath);
        if (fs.existsSync(fullPath)) {
          console.log("  -> File EXISTS at", fullPath);
        } else {
          console.log("  -> File MISSING at", fullPath);
        }
      }
    }
  } catch (e) {
    console.error("DB Error:", e);
  }
}

run();
