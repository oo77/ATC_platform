import pdfParse from "pdf-parse";
import { createRequire } from "module";

console.log("Import Default:", pdfParse);
console.log("Type of Import Default:", typeof pdfParse);

const require = createRequire(import.meta.url);
try {
  const pdfParseReq = require("pdf-parse");
  console.log("Require:", pdfParseReq);
  console.log("Type of Require:", typeof pdfParseReq);
} catch (e) {
  console.log("Require failed:", e.message);
}
