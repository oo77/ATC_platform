import process from 'node:process';globalThis._importMeta_=globalThis._importMeta_||{url:"file:///_entry.js",env:process.env};import { createRequire } from 'module';
import { b as getAllStudents, e as batchUpsertStudentsWithProgress } from './studentRepository.mjs';

const require$1 = createRequire(globalThis._importMeta_.url);
const XLSX = require$1("xlsx");
const importJobs = /* @__PURE__ */ new Map();
const HEADER_MAPPINGS = {
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
  // Служба/Отдел
  "\u0441\u043B\u0443\u0436\u0431\u0430/\u043E\u0442\u0434\u0435\u043B": "\u0421\u043B\u0443\u0436\u0431\u0430/\u041E\u0442\u0434\u0435\u043B",
  "\u0441\u043B\u0443\u0436\u0431\u0430": "\u0421\u043B\u0443\u0436\u0431\u0430/\u041E\u0442\u0434\u0435\u043B",
  "\u043E\u0442\u0434\u0435\u043B": "\u0421\u043B\u0443\u0436\u0431\u0430/\u041E\u0442\u0434\u0435\u043B",
  "\u043F\u043E\u0434\u0440\u0430\u0437\u0434\u0435\u043B\u0435\u043D\u0438\u0435": "\u0421\u043B\u0443\u0436\u0431\u0430/\u041E\u0442\u0434\u0435\u043B",
  "department": "\u0421\u043B\u0443\u0436\u0431\u0430/\u041E\u0442\u0434\u0435\u043B",
  // Должность
  "\u0434\u043E\u043B\u0436\u043D\u043E\u0441\u0442\u044C": "\u0414\u043E\u043B\u0436\u043D\u043E\u0441\u0442\u044C",
  "position": "\u0414\u043E\u043B\u0436\u043D\u043E\u0441\u0442\u044C",
  "\u043F\u043E\u0437\u0438\u0446\u0438\u044F": "\u0414\u043E\u043B\u0436\u043D\u043E\u0441\u0442\u044C",
  "title": "\u0414\u043E\u043B\u0436\u043D\u043E\u0441\u0442\u044C"
};
function normalizeHeader(header) {
  if (!header) return "";
  const trimmed = String(header).trim();
  const lowercased = trimmed.toLowerCase();
  if (HEADER_MAPPINGS[lowercased]) {
    return HEADER_MAPPINGS[lowercased];
  }
  return trimmed;
}
function parseExcelFile(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: ""
  });
  if (data.length === 0) {
    throw new Error("\u0424\u0430\u0439\u043B \u043F\u0443\u0441\u0442\u043E\u0439");
  }
  const rawHeaders = data[0];
  const headers = rawHeaders.map((h) => normalizeHeader(String(h || "")));
  console.log("[ImportUtils] \u041D\u043E\u0440\u043C\u0430\u043B\u0438\u0437\u043E\u0432\u0430\u043D\u043D\u044B\u0435 \u0437\u0430\u0433\u043E\u043B\u043E\u0432\u043A\u0438:", headers);
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row.length === 0 || !row.some((cell) => cell)) {
      continue;
    }
    const rowObj = {};
    headers.forEach((header, index) => {
      if (header) {
        rowObj[header] = row[index] !== void 0 && row[index] !== null ? String(row[index]).trim() : "";
      }
    });
    rows.push(rowObj);
  }
  return rows;
}
function validatePinfl(pinfl) {
  return /^\d{14}$/.test(pinfl.trim());
}
function validateRow(row, rowNumber) {
  const errors = [];
  if (!row.\u041F\u0418\u041D\u0424\u041B || !row.\u041F\u0418\u041D\u0424\u041B.trim()) {
    errors.push("\u041F\u0418\u041D\u0424\u041B \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D");
  } else if (!validatePinfl(row.\u041F\u0418\u041D\u0424\u041B)) {
    errors.push("\u041F\u0418\u041D\u0424\u041B \u0434\u043E\u043B\u0436\u0435\u043D \u0441\u043E\u0434\u0435\u0440\u0436\u0430\u0442\u044C 14 \u0446\u0438\u0444\u0440");
  }
  if (!row.\u0424\u0418\u041E || !row.\u0424\u0418\u041E.trim()) {
    errors.push("\u0424\u0418\u041E \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u043E");
  } else if (row.\u0424\u0418\u041E.trim().length < 3) {
    errors.push("\u0424\u0418\u041E \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u043A\u043E\u0440\u043E\u0442\u043A\u043E\u0435");
  }
  if (!row.\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F || !row.\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F.trim()) {
    errors.push("\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u0430");
  }
  if (!row.\u0414\u043E\u043B\u0436\u043D\u043E\u0441\u0442\u044C || !row.\u0414\u043E\u043B\u0436\u043D\u043E\u0441\u0442\u044C.trim()) {
    errors.push("\u0414\u043E\u043B\u0436\u043D\u043E\u0441\u0442\u044C \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u0430");
  }
  if (errors.length > 0) {
    return {
      isValid: false,
      errors,
      rowNumber
    };
  }
  const data = {
    pinfl: row.\u041F\u0418\u041D\u0424\u041B.trim(),
    fullName: row.\u0424\u0418\u041E.trim(),
    organization: row.\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F.trim(),
    department: row["\u0421\u043B\u0443\u0436\u0431\u0430/\u041E\u0442\u0434\u0435\u043B"]?.trim() || null,
    position: row.\u0414\u043E\u043B\u0436\u043D\u043E\u0441\u0442\u044C.trim(),
    rowNumber
  };
  return {
    isValid: true,
    errors: [],
    rowNumber,
    data
  };
}
async function analyzeImportData(rows) {
  const validData = [];
  const errors = [];
  rows.forEach((row, index) => {
    const result = validateRow(row, index + 2);
    if (result.isValid && result.data) {
      validData.push(result.data);
    } else {
      errors.push({
        rowNumber: result.rowNumber,
        errors: result.errors
      });
    }
  });
  const existingStudents = await getAllStudents();
  const existingPinfls = new Set(existingStudents.map((s) => s.pinfl));
  let newStudents = 0;
  let existingStudentsCount = 0;
  const existingPinflsInImport = [];
  validData.forEach((data) => {
    if (existingPinfls.has(data.pinfl)) {
      existingStudentsCount++;
      existingPinflsInImport.push(data.pinfl);
    } else {
      newStudents++;
    }
  });
  return {
    totalRows: rows.length,
    validRows: validData.length,
    invalidRows: errors.length,
    newStudents,
    existingStudents: existingStudentsCount,
    existingPinfls: existingPinflsInImport,
    // Передаём список существующих ПИНФЛ
    errors,
    preview: validData.slice(0, 20)
    // Первые 20 строк для предпросмотра
  };
}
function createImportJob(totalRows) {
  const jobId = `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const job = {
    jobId,
    status: "pending",
    totalRows,
    processedRows: 0,
    successCount: 0,
    errorCount: 0,
    createdCount: 0,
    updatedCount: 0,
    errors: [],
    startedAt: /* @__PURE__ */ new Date()
  };
  importJobs.set(jobId, job);
  return jobId;
}
function getImportJobStatus(jobId) {
  return importJobs.get(jobId) || null;
}
function updateJobProgress(jobId, updates) {
  const job = importJobs.get(jobId);
  if (job) {
    Object.assign(job, updates);
  }
}
async function executeImport(data, jobId, batchSize = 100) {
  const job = importJobs.get(jobId);
  if (!job) {
    throw new Error("\u0417\u0430\u0434\u0430\u0447\u0430 \u0438\u043C\u043F\u043E\u0440\u0442\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430");
  }
  updateJobProgress(jobId, { status: "processing" });
  try {
    const result = await batchUpsertStudentsWithProgress(
      data.map((item) => ({
        pinfl: item.pinfl,
        fullName: item.fullName,
        organization: item.organization,
        department: item.department,
        position: item.position,
        rowNumber: item.rowNumber
      })),
      // Callback для отслеживания прогресса
      (processed, created, updated, errors) => {
        updateJobProgress(jobId, {
          processedRows: processed,
          createdCount: created,
          updatedCount: updated,
          errorCount: errors,
          successCount: created + updated
        });
      },
      batchSize
    );
    updateJobProgress(jobId, {
      status: "completed",
      completedAt: /* @__PURE__ */ new Date(),
      processedRows: data.length,
      createdCount: result.created,
      updatedCount: result.updated,
      errorCount: result.errors.length,
      successCount: result.created + result.updated,
      errors: result.errors.map((e) => ({
        rowNumber: 0,
        // У нас нет rowNumber в errors из репозитория
        pinfl: e.pinfl,
        error: e.error
      }))
    });
  } catch (error) {
    updateJobProgress(jobId, {
      status: "failed",
      completedAt: /* @__PURE__ */ new Date(),
      errors: [{
        rowNumber: 0,
        pinfl: "",
        error: error instanceof Error ? error.message : "\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u0430\u044F \u043E\u0448\u0438\u0431\u043A\u0430"
      }]
    });
    throw error;
  }
}
function getValidImportData(rows) {
  const validData = [];
  rows.forEach((row, index) => {
    const result = validateRow(row, index + 2);
    if (result.isValid && result.data) {
      validData.push(result.data);
    }
  });
  return validData;
}

export { analyzeImportData as a, getImportJobStatus as b, createImportJob as c, executeImport as e, getValidImportData as g, parseExcelFile as p };
//# sourceMappingURL=importUtils.mjs.map
