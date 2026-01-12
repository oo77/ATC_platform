import process from 'node:process';globalThis._importMeta_=globalThis._importMeta_||{url:"file:///_entry.js",env:process.env};import { createRequire } from 'module';
import { g as getStudentByPinfl, c as createStudent } from './studentRepository.mjs';
import { a as getCertificateByNumber, c as createStandaloneCertificate } from './certificateTemplateRepository.mjs';
import { g as getCourseById } from './courseRepository.mjs';

const require$1 = createRequire(globalThis._importMeta_.url);
const XLSX = require$1("xlsx");
const certificateImportJobs = /* @__PURE__ */ new Map();
const CERTIFICATE_HEADER_MAPPINGS = {
  // ПИНФЛ
  "\u043F\u0438\u043D\u0444\u043B": "\u041F\u0418\u041D\u0424\u041B",
  "pinfl": "\u041F\u0418\u041D\u0424\u041B",
  "\u043F\u0456\u043D\u0444\u043B": "\u041F\u0418\u041D\u0424\u041B",
  "\u0438\u043D\u043D": "\u041F\u0418\u041D\u0424\u041B",
  "\u0438\u0434\u0435\u043D\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0440": "\u041F\u0418\u041D\u0424\u041B",
  // ФИО
  "\u0444\u0438\u043E": "\u0424\u0418\u041E",
  "\u0444.\u0438.\u043E": "\u0424\u0418\u041E",
  "\u0444.\u0438.\u043E.": "\u0424\u0418\u041E",
  "\u043F\u043E\u043B\u043D\u043E\u0435 \u0438\u043C\u044F": "\u0424\u0418\u041E",
  "\u0438\u043C\u044F": "\u0424\u0418\u041E",
  "name": "\u0424\u0418\u041E",
  "fullname": "\u0424\u0418\u041E",
  "full_name": "\u0424\u0418\u041E",
  // Организация  
  "\u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F": "\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F",
  "organization": "\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F",
  "\u043A\u043E\u043C\u043F\u0430\u043D\u0438\u044F": "\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F",
  "\u043F\u0440\u0435\u0434\u043F\u0440\u0438\u044F\u0442\u0438\u0435": "\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F",
  "\u043C\u0435\u0441\u0442\u043E \u0440\u0430\u0431\u043E\u0442\u044B": "\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F",
  // Должность
  "\u0434\u043E\u043B\u0436\u043D\u043E\u0441\u0442\u044C": "\u0414\u043E\u043B\u0436\u043D\u043E\u0441\u0442\u044C",
  "position": "\u0414\u043E\u043B\u0436\u043D\u043E\u0441\u0442\u044C",
  "\u043F\u043E\u0437\u0438\u0446\u0438\u044F": "\u0414\u043E\u043B\u0436\u043D\u043E\u0441\u0442\u044C",
  "title": "\u0414\u043E\u043B\u0436\u043D\u043E\u0441\u0442\u044C",
  // Серия/Номер
  "\u0441\u0435\u0440\u0438\u044F/\u043D\u043E\u043C\u0435\u0440": "\u0421\u0435\u0440\u0438\u044F/\u041D\u043E\u043C\u0435\u0440",
  "\u0441\u0435\u0440\u0438\u044F": "\u0421\u0435\u0440\u0438\u044F/\u041D\u043E\u043C\u0435\u0440",
  "\u043D\u043E\u043C\u0435\u0440": "\u0421\u0435\u0440\u0438\u044F/\u041D\u043E\u043C\u0435\u0440",
  "\u043D\u043E\u043C\u0435\u0440 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430": "\u0421\u0435\u0440\u0438\u044F/\u041D\u043E\u043C\u0435\u0440",
  "certificate_number": "\u0421\u0435\u0440\u0438\u044F/\u041D\u043E\u043C\u0435\u0440",
  "certificate number": "\u0421\u0435\u0440\u0438\u044F/\u041D\u043E\u043C\u0435\u0440",
  "cert_number": "\u0421\u0435\u0440\u0438\u044F/\u041D\u043E\u043C\u0435\u0440",
  "number": "\u0421\u0435\u0440\u0438\u044F/\u041D\u043E\u043C\u0435\u0440",
  "\u2116": "\u0421\u0435\u0440\u0438\u044F/\u041D\u043E\u043C\u0435\u0440",
  // Дата выдачи
  "\u0434\u0430\u0442\u0430 \u0432\u044B\u0434\u0430\u0447\u0438": "\u0414\u0430\u0442\u0430 \u0432\u044B\u0434\u0430\u0447\u0438",
  "\u0434\u0430\u0442\u0430": "\u0414\u0430\u0442\u0430 \u0432\u044B\u0434\u0430\u0447\u0438",
  "date": "\u0414\u0430\u0442\u0430 \u0432\u044B\u0434\u0430\u0447\u0438",
  "issue_date": "\u0414\u0430\u0442\u0430 \u0432\u044B\u0434\u0430\u0447\u0438",
  "issued": "\u0414\u0430\u0442\u0430 \u0432\u044B\u0434\u0430\u0447\u0438",
  "\u0432\u044B\u0434\u0430\u043D": "\u0414\u0430\u0442\u0430 \u0432\u044B\u0434\u0430\u0447\u0438"
};
function normalizeHeader(header) {
  if (!header) return "";
  const trimmed = String(header).trim();
  const lowercased = trimmed.toLowerCase();
  if (CERTIFICATE_HEADER_MAPPINGS[lowercased]) {
    return CERTIFICATE_HEADER_MAPPINGS[lowercased];
  }
  return trimmed;
}
function parseDate(value) {
  if (!value) return null;
  if (typeof value === "number") {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1e3);
    return isNaN(date.getTime()) ? null : date;
  }
  const str = String(value).trim();
  const ddmmyyyy = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (ddmmyyyy) {
    const [, day, month, year] = ddmmyyyy;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return isNaN(date.getTime()) ? null : date;
  }
  const yyyymmdd = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (yyyymmdd) {
    const [, year, month, day] = yyyymmdd;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return isNaN(date.getTime()) ? null : date;
  }
  const parsed = new Date(str);
  return isNaN(parsed.getTime()) ? null : parsed;
}
function parseCertificateExcel(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
    raw: true
    // Получаем сырые данные для корректной обработки дат
  });
  if (data.length === 0) {
    throw new Error("\u0424\u0430\u0439\u043B \u043F\u0443\u0441\u0442\u043E\u0439");
  }
  const rawHeaders = data[0];
  const headers = rawHeaders.map((h) => normalizeHeader(String(h || "")));
  console.log("[CertificateImport] \u041D\u043E\u0440\u043C\u0430\u043B\u0438\u0437\u043E\u0432\u0430\u043D\u043D\u044B\u0435 \u0437\u0430\u0433\u043E\u043B\u043E\u0432\u043A\u0438:", headers);
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0 || !row.some((cell) => cell)) {
      continue;
    }
    const rowObj = {};
    headers.forEach((header, index) => {
      if (header) {
        const value = row[index];
        if (header === "\u0414\u0430\u0442\u0430 \u0432\u044B\u0434\u0430\u0447\u0438") {
          const parsed = parseDate(value);
          rowObj[header] = parsed ? parsed.toISOString().split("T")[0] : "";
        } else {
          rowObj[header] = value !== void 0 && value !== null ? String(value).trim() : "";
        }
      }
    });
    rows.push(rowObj);
  }
  return rows;
}
function validatePinfl(pinfl) {
  return /^\d{14}$/.test(pinfl.trim());
}
function validateCertificateRow(row, rowNumber) {
  const errors = [];
  const warnings = [];
  const pinfl = row.\u041F\u0418\u041D\u0424\u041B?.trim() || "";
  if (!pinfl) {
    errors.push("\u041F\u0418\u041D\u0424\u041B \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D");
  } else if (!validatePinfl(pinfl)) {
    errors.push(`\u041F\u0418\u041D\u0424\u041B \u0434\u043E\u043B\u0436\u0435\u043D \u0441\u043E\u0434\u0435\u0440\u0436\u0430\u0442\u044C 14 \u0446\u0438\u0444\u0440 (\u043D\u0430\u0439\u0434\u0435\u043D\u043E: ${pinfl.length})`);
  }
  const fullName = row.\u0424\u0418\u041E?.trim() || "";
  if (!fullName) {
    errors.push("\u0424\u0418\u041E \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u043E");
  } else if (fullName.length < 3) {
    errors.push("\u0424\u0418\u041E \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u043A\u043E\u0440\u043E\u0442\u043A\u043E\u0435");
  }
  const organization = row.\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F?.trim() || "";
  if (!organization) {
    warnings.push("\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u0430");
  }
  const position = row.\u0414\u043E\u043B\u0436\u043D\u043E\u0441\u0442\u044C?.trim() || "";
  if (!position) {
    warnings.push("\u0414\u043E\u043B\u0436\u043D\u043E\u0441\u0442\u044C \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u0430");
  }
  const certNumber = row["\u0421\u0435\u0440\u0438\u044F/\u041D\u043E\u043C\u0435\u0440"]?.trim() || "";
  if (!certNumber) {
    errors.push("\u041D\u043E\u043C\u0435\u0440 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D");
  }
  const issueDateStr = row["\u0414\u0430\u0442\u0430 \u0432\u044B\u0434\u0430\u0447\u0438"]?.trim() || "";
  if (!issueDateStr) {
    errors.push("\u0414\u0430\u0442\u0430 \u0432\u044B\u0434\u0430\u0447\u0438 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u0430");
  }
  return { errors, warnings };
}
function generateCertificateUrl(template, row) {
  if (!template) return "";
  return template.replace(/{NUM}/g, row.certificateNumber).replace(/{FIO}/g, row.fullName.replace(/\s+/g, "_")).replace(/{PINFL}/g, row.pinfl).replace(/{DATE}/g, row.issueDate.replace(/-/g, ""));
}
function calculateExpiryDate(issueDate, validityMonths) {
  const expiry = new Date(issueDate);
  expiry.setMonth(expiry.getMonth() + validityMonths);
  return expiry;
}
async function analyzeCertificateImportData(rows, config) {
  const processedRows = [];
  const errors = [];
  const existingPinfls = [];
  const existingCertNumbers = [];
  let validRows = 0;
  let errorRows = 0;
  let warningRows = 0;
  let existingStudents = 0;
  let newStudents = 0;
  let newCertificates = 0;
  let duplicateCertificates = 0;
  let courseInfo;
  if (config.courseSource === "existing" && config.courseId) {
    const course = await getCourseById(config.courseId);
    if (!course) {
      throw new Error("\u041A\u0443\u0440\u0441 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D");
    }
    courseInfo = {
      name: course.name,
      code: course.code,
      hours: course.totalHours
    };
  } else {
    courseInfo = {
      name: config.courseName || "\u041A\u0443\u0440\u0441 \u043F\u043E\u0432\u044B\u0448\u0435\u043D\u0438\u044F \u043A\u0432\u0430\u043B\u0438\u0444\u0438\u043A\u0430\u0446\u0438\u0438",
      code: config.courseCode,
      hours: config.courseHours
    };
  }
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNumber = i + 2;
    const validation = validateCertificateRow(row);
    if (validation.errors.length > 0) {
      errorRows++;
      errors.push({ rowNumber, errors: validation.errors });
      processedRows.push({
        rowNumber,
        pinfl: row.\u041F\u0418\u041D\u0424\u041B?.trim() || "",
        fullName: row.\u0424\u0418\u041E?.trim() || "",
        organization: row.\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F?.trim() || "",
        position: row.\u0414\u043E\u043B\u0436\u043D\u043E\u0441\u0442\u044C?.trim() || "",
        certificateNumber: row["\u0421\u0435\u0440\u0438\u044F/\u041D\u043E\u043C\u0435\u0440"]?.trim() || "",
        issueDate: row["\u0414\u0430\u0442\u0430 \u0432\u044B\u0434\u0430\u0447\u0438"]?.trim() || "",
        generatedUrl: "",
        status: "error",
        studentStatus: "not_found",
        certificateStatus: "new",
        errors: validation.errors,
        warnings: validation.warnings
      });
      continue;
    }
    const pinfl = row.\u041F\u0418\u041D\u0424\u041B.trim();
    const fullName = row.\u0424\u0418\u041E.trim();
    const organization = row.\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F?.trim() || "";
    const position = row.\u0414\u043E\u043B\u0436\u043D\u043E\u0441\u0442\u044C?.trim() || "";
    const certificateNumber = row["\u0421\u0435\u0440\u0438\u044F/\u041D\u043E\u043C\u0435\u0440"].trim();
    const issueDateStr = row["\u0414\u0430\u0442\u0430 \u0432\u044B\u0434\u0430\u0447\u0438"].trim();
    const existingStudent = await getStudentByPinfl(pinfl);
    let studentStatus;
    let studentId;
    if (existingStudent) {
      studentStatus = "exists";
      studentId = existingStudent.id;
      existingStudents++;
      existingPinfls.push(pinfl);
    } else if (config.createStudents) {
      studentStatus = "new";
      newStudents++;
    } else {
      studentStatus = "not_found";
      validation.errors.push("\u0421\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u0432 \u0431\u0430\u0437\u0435 \u0434\u0430\u043D\u043D\u044B\u0445");
      errorRows++;
      processedRows.push({
        rowNumber,
        pinfl,
        fullName,
        organization,
        position,
        certificateNumber,
        issueDate: issueDateStr,
        generatedUrl: "",
        status: "error",
        studentStatus,
        certificateStatus: "new",
        errors: validation.errors,
        warnings: validation.warnings
      });
      errors.push({ rowNumber, errors: validation.errors });
      continue;
    }
    const existingCert = await getCertificateByNumber(certificateNumber);
    let certificateStatus;
    let existingCertificateId;
    if (existingCert) {
      certificateStatus = "duplicate";
      existingCertificateId = existingCert.id;
      duplicateCertificates++;
      existingCertNumbers.push(certificateNumber);
      if (!config.updateExisting) {
        validation.warnings.push("\u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 \u0441 \u0442\u0430\u043A\u0438\u043C \u043D\u043E\u043C\u0435\u0440\u043E\u043C \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442");
        warningRows++;
      }
    } else {
      certificateStatus = "new";
      newCertificates++;
    }
    const tempRow = {
      rowNumber,
      pinfl,
      fullName,
      organization,
      position,
      certificateNumber,
      issueDate: issueDateStr,
      generatedUrl: "",
      status: "valid",
      studentStatus,
      studentId,
      certificateStatus,
      existingCertificateId,
      errors: [],
      warnings: validation.warnings
    };
    tempRow.generatedUrl = generateCertificateUrl(config.urlTemplate, tempRow);
    if (config.validityType === "months" && config.validityMonths) {
      const issueDate = new Date(issueDateStr);
      tempRow.expiryDate = calculateExpiryDate(issueDate, config.validityMonths).toISOString().split("T")[0];
    }
    if (validation.warnings.length > 0 || certificateStatus === "duplicate") {
      tempRow.status = "warning";
      warningRows++;
    } else {
      validRows++;
    }
    processedRows.push(tempRow);
  }
  return {
    totalRows: rows.length,
    validRows,
    errorRows,
    warningRows,
    existingStudents,
    newStudents,
    newCertificates,
    duplicateCertificates,
    preview: processedRows.slice(0, 50),
    // Первые 50 строк для предпросмотра
    errors,
    existingPinfls,
    existingCertNumbers,
    config,
    courseInfo
  };
}
function createCertificateImportJob(totalRecords) {
  const jobId = `cert_import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const job = {
    jobId,
    status: "pending",
    totalRecords,
    processedRecords: 0,
    createdStudents: 0,
    createdCertificates: 0,
    skippedDuplicates: 0,
    errors: [],
    startedAt: /* @__PURE__ */ new Date()
  };
  certificateImportJobs.set(jobId, job);
  return jobId;
}
function getCertificateImportJobStatus(jobId) {
  return certificateImportJobs.get(jobId) || null;
}
function updateCertificateJobProgress(jobId, updates) {
  const job = certificateImportJobs.get(jobId);
  if (job) {
    Object.assign(job, updates);
  }
}
async function executeCertificateImport(rows, config, courseInfo, jobId, issuedBy) {
  const job = certificateImportJobs.get(jobId);
  if (!job) {
    throw new Error("\u0417\u0430\u0434\u0430\u0447\u0430 \u0438\u043C\u043F\u043E\u0440\u0442\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430");
  }
  updateCertificateJobProgress(jobId, { status: "processing" });
  let createdStudents = 0;
  let createdCertificates = 0;
  let skippedDuplicates = 0;
  const importErrors = [];
  try {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.status === "error") {
        if (config.skipErrors) {
          continue;
        } else {
          importErrors.push({
            rowNumber: row.rowNumber,
            error: row.errors.join("; ")
          });
          continue;
        }
      }
      try {
        let studentId = row.studentId;
        if (row.studentStatus === "new" && config.createStudents) {
          const newStudent = await createStudent({
            pinfl: row.pinfl,
            fullName: row.fullName,
            organization: row.organization,
            position: row.position
          });
          studentId = newStudent.id;
          createdStudents++;
        }
        if (!studentId) {
          importErrors.push({
            rowNumber: row.rowNumber,
            error: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0438\u0442\u044C \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u0430"
          });
          continue;
        }
        if (row.certificateStatus === "duplicate") {
          if (!config.updateExisting) {
            skippedDuplicates++;
            continue;
          }
          skippedDuplicates++;
          continue;
        }
        const issueDate = new Date(row.issueDate);
        let expiryDate = null;
        if (row.expiryDate) {
          expiryDate = new Date(row.expiryDate);
        }
        await createStandaloneCertificate({
          studentId,
          certificateNumber: row.certificateNumber,
          issueDate,
          expiryDate,
          courseName: courseInfo.name,
          courseCode: courseInfo.code,
          courseHours: courseInfo.hours,
          sourceType: "import",
          pdfFileUrl: row.generatedUrl || void 0,
          issuedBy,
          notes: `\u0418\u043C\u043F\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u0430\u043D \u0438\u0437 Excel (\u0441\u0442\u0440\u043E\u043A\u0430 ${row.rowNumber})`
        });
        createdCertificates++;
      } catch (error) {
        importErrors.push({
          rowNumber: row.rowNumber,
          error: error instanceof Error ? error.message : "\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u0430\u044F \u043E\u0448\u0438\u0431\u043A\u0430"
        });
      }
      updateCertificateJobProgress(jobId, {
        processedRecords: i + 1,
        createdStudents,
        createdCertificates,
        skippedDuplicates,
        errors: importErrors
      });
    }
    updateCertificateJobProgress(jobId, {
      status: "completed",
      completedAt: /* @__PURE__ */ new Date(),
      processedRecords: rows.length,
      createdStudents,
      createdCertificates,
      skippedDuplicates,
      errors: importErrors
    });
  } catch (error) {
    updateCertificateJobProgress(jobId, {
      status: "failed",
      completedAt: /* @__PURE__ */ new Date(),
      errors: [{
        rowNumber: 0,
        error: error instanceof Error ? error.message : "\u041A\u0440\u0438\u0442\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u043E\u0448\u0438\u0431\u043A\u0430 \u0438\u043C\u043F\u043E\u0440\u0442\u0430"
      }]
    });
    throw error;
  }
}
function cleanupOldCertificateImportJobs() {
  const oneHourAgo = Date.now() - 60 * 60 * 1e3;
  for (const [jobId, job] of certificateImportJobs.entries()) {
    if (job.startedAt.getTime() < oneHourAgo) {
      certificateImportJobs.delete(jobId);
    }
  }
}

export { analyzeCertificateImportData as a, createCertificateImportJob as b, cleanupOldCertificateImportJobs as c, executeCertificateImport as e, getCertificateImportJobStatus as g, parseCertificateExcel as p };
//# sourceMappingURL=certificateImportUtils.mjs.map
