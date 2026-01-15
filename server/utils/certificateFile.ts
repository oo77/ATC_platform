import * as fs from "fs";
import * as path from "path";

/**
 * Utility to find certificate files on disk
 */

const STORAGE_ROOT = path.join(process.cwd(), "storage");

/**
 * Find a certificate file by various strategies
 * @param certificate The certificate object containing pdfFileUrl and certificateNumber
 * @param format 'pdf' or 'docx'
 */
export function findCertificateFile(
  certificate: {
    pdfFileUrl?: string | null;
    docxFileUrl?: string | null;
    certificateNumber: string;
  },
  format: "pdf" | "docx" = "pdf"
): string | null {
  // Determine file name
  let fileName = "";
  if (format === "docx" && certificate.docxFileUrl) {
    fileName = path.basename(certificate.docxFileUrl);
  } else if (certificate.pdfFileUrl) {
    fileName = path.basename(certificate.pdfFileUrl);
  }

  // If no filename in URL, try generating from number
  if (!fileName && certificate.certificateNumber) {
    fileName = `${certificate.certificateNumber.replace(
      /[\/\\:*?"<>|]/g,
      "_"
    )}.${format}`;
  }

  if (!fileName) return null;

  const candidates: string[] = [];

  // 1. Direct path from DB
  if (format === "docx" && certificate.docxFileUrl)
    candidates.push(certificate.docxFileUrl);
  else if (certificate.pdfFileUrl) candidates.push(certificate.pdfFileUrl);

  // 2. storage/Certificates
  candidates.push(path.join("storage", "Certificates", fileName));

  // 3. storage/Certificates (generated name)
  const generatedName = `${certificate.certificateNumber.replace(
    /[\/\\:*?"<>|]/g,
    "_"
  )}.${format}`;
  candidates.push(path.join("storage", "Certificates", generatedName));

  // 4. storage/Certificates/generated (legacy)
  candidates.push(path.join("storage", "Certificates", "generated", fileName));
  candidates.push(
    path.join("storage", "Certificates", "generated", generatedName)
  );

  // 5. Lowercase 'certificates'
  candidates.push(path.join("storage", "certificates", fileName));
  candidates.push(path.join("storage", "certificates", "generated", fileName));

  for (const candidate of candidates) {
    if (!candidate) continue;

    // Remove leading slash for path.join
    const cleanCandidate =
      candidate.startsWith("/") || candidate.startsWith("\\")
        ? candidate.slice(1)
        : candidate;

    const absPath = path.join(process.cwd(), cleanCandidate);

    if (fs.existsSync(absPath)) {
      return absPath;
    }
  }

  // Recursive fallback
  const searchRoot = path.join(STORAGE_ROOT, "Certificates");
  return (
    findFileRecursively(searchRoot, fileName) ||
    findFileRecursively(searchRoot, generatedName)
  );
}

function findFileRecursively(dir: string, filename: string): string | null {
  if (!fs.existsSync(dir)) return null;

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile()) {
        if (entry.name.toLowerCase() === filename.toLowerCase()) {
          return path.join(dir, entry.name);
        }
      } else if (entry.isDirectory()) {
        // Prevent infinite loops in symlinks optionally, but usually fine for simple storage
        const found = findFileRecursively(path.join(dir, entry.name), filename);
        if (found) return found;
      }
    }
  } catch (e) {
    // console.warn(`Error scanning dir ${dir}:`, e);
  }
  return null;
}
