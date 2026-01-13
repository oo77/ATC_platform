import { e as executeQuery, p as executeTransaction } from '../nitro/nitro.mjs';
import { v4 } from 'uuid';

function mapRowToTemplate(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    templateFileUrl: row.template_file_url,
    originalFileUrl: row.original_file_url,
    variables: row.variables ? JSON.parse(row.variables) : null,
    qrSettings: row.qr_settings ? JSON.parse(row.qr_settings) : null,
    numberFormat: row.number_format || "ATC{YY}_{CODE}_{NUM}",
    lastNumber: row.last_number || 0,
    isActive: Boolean(row.is_active),
    // Новые поля для визуального редактора
    templateData: row.template_data ? JSON.parse(row.template_data) : null,
    layout: row.layout || null,
    backgroundUrl: row.background_url || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
function mapRowToIssuedCertificate(row) {
  const cert = {
    id: row.id,
    groupId: row.group_id,
    studentId: row.student_id,
    templateId: row.template_id,
    certificateNumber: row.certificate_number,
    issueDate: row.issue_date,
    // Standalone поля
    courseName: row.course_name,
    courseCode: row.course_code,
    courseHours: row.course_hours,
    groupCode: row.group_code,
    groupStartDate: row.group_start_date,
    groupEndDate: row.group_end_date,
    sourceType: row.source_type || "group_journal",
    // Файлы
    docxFileUrl: row.docx_file_url,
    pdfFileUrl: row.pdf_file_url,
    // Статус и данные
    status: row.status,
    variablesData: row.variables_data ? JSON.parse(row.variables_data) : null,
    warnings: row.warnings ? JSON.parse(row.warnings) : null,
    overrideWarnings: Boolean(row.override_warnings),
    // Срок действия
    expiryDate: row.expiry_date,
    // Telegram
    isSentViaTelegram: Boolean(row.is_sent_via_telegram),
    sentAt: row.sent_at,
    // Аудит
    issuedBy: row.issued_by,
    issuedAt: row.issued_at,
    revokedBy: row.revoked_by,
    revokedAt: row.revoked_at,
    revokeReason: row.revoke_reason,
    notes: row.notes,
    // Legacy
    legacyId: row.legacy_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
  if (row.student_full_name) {
    cert.student = {
      id: row.student_id,
      fullName: row.student_full_name,
      organization: row.student_organization || "",
      position: row.student_position || ""
    };
  }
  return cert;
}
async function getTemplates(filters) {
  let sql = "SELECT * FROM certificate_templates WHERE 1=1";
  const params = [];
  if (filters?.isActive !== void 0) {
    sql += " AND is_active = ?";
    params.push(filters.isActive);
  }
  sql += " ORDER BY name ASC";
  const rows = await executeQuery(sql, params);
  return rows.map(mapRowToTemplate);
}
async function getTemplateById(id) {
  const rows = await executeQuery(
    "SELECT * FROM certificate_templates WHERE id = ? LIMIT 1",
    [id]
  );
  return rows.length > 0 ? mapRowToTemplate(rows[0]) : null;
}
async function createTemplate(data) {
  const id = v4();
  const now = /* @__PURE__ */ new Date();
  await executeQuery(
    `INSERT INTO certificate_templates 
     (id, name, description, number_format, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, TRUE, ?, ?)`,
    [
      id,
      data.name,
      data.description || null,
      data.numberFormat || "ATC{YY}_{CODE}_{NUM}",
      now,
      now
    ]
  );
  return await getTemplateById(id);
}
async function updateTemplate(id, data) {
  const updates = [];
  const params = [];
  if (data.name !== void 0) {
    updates.push("name = ?");
    params.push(data.name);
  }
  if (data.description !== void 0) {
    updates.push("description = ?");
    params.push(data.description);
  }
  if (data.variables !== void 0) {
    updates.push("variables = ?");
    params.push(JSON.stringify(data.variables));
  }
  if (data.qrSettings !== void 0) {
    updates.push("qr_settings = ?");
    params.push(JSON.stringify(data.qrSettings));
  }
  if (data.numberFormat !== void 0) {
    updates.push("number_format = ?");
    params.push(data.numberFormat);
  }
  if (data.isActive !== void 0) {
    updates.push("is_active = ?");
    params.push(data.isActive);
  }
  if (data.templateData !== void 0) {
    updates.push("template_data = ?");
    params.push(JSON.stringify(data.templateData));
  }
  if (data.layout !== void 0) {
    updates.push("layout = ?");
    params.push(data.layout);
  }
  if (data.backgroundUrl !== void 0) {
    updates.push("background_url = ?");
    params.push(data.backgroundUrl);
  }
  if (updates.length === 0) {
    return getTemplateById(id);
  }
  updates.push("updated_at = ?");
  params.push(/* @__PURE__ */ new Date());
  params.push(id);
  await executeQuery(
    `UPDATE certificate_templates SET ${updates.join(", ")} WHERE id = ?`,
    params
  );
  return getTemplateById(id);
}
async function deleteTemplate(id) {
  const [countRow] = await executeQuery(
    "SELECT COUNT(*) as total FROM issued_certificates WHERE template_id = ?",
    [id]
  );
  if (countRow && countRow.total > 0) {
    throw new Error(`\u041D\u0435\u0432\u043E\u0437\u043C\u043E\u0436\u043D\u043E \u0443\u0434\u0430\u043B\u0438\u0442\u044C \u0448\u0430\u0431\u043B\u043E\u043D: \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442 ${countRow.total} \u0432\u044B\u0434\u0430\u043D\u043D\u044B\u0445 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432`);
  }
  const result = await executeQuery(
    "DELETE FROM certificate_templates WHERE id = ?",
    [id]
  );
  return result.affectedRows > 0;
}
async function generateCertificateNumber(templateId, courseCode) {
  return executeTransaction(async (connection) => {
    const [template] = await connection.query(
      "SELECT * FROM certificate_templates WHERE id = ? FOR UPDATE",
      [templateId]
    );
    if (!template || template.length === 0) {
      throw new Error("\u0428\u0430\u0431\u043B\u043E\u043D \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D");
    }
    const tpl = template[0];
    const nextNumber = (tpl.last_number || 0) + 1;
    const format = tpl.number_format || "ATC{YY}_{CODE}_{NUM}";
    const now = /* @__PURE__ */ new Date();
    const year = now.getFullYear().toString().slice(-2);
    const paddedNum = nextNumber.toString().padStart(4, "0");
    let certificateNumber = format.replace("{YY}", year).replace("{YYYY}", now.getFullYear().toString()).replace("{CODE}", courseCode).replace("{NUM}", paddedNum);
    await connection.query(
      "UPDATE certificate_templates SET last_number = ?, updated_at = ? WHERE id = ?",
      [nextNumber, /* @__PURE__ */ new Date(), templateId]
    );
    return certificateNumber;
  });
}
async function getIssuedCertificatesByGroup(groupId) {
  const rows = await executeQuery(
    `SELECT ic.*, 
            s.full_name as student_full_name,
            s.organization as student_organization,
            s.position as student_position
     FROM issued_certificates ic
     LEFT JOIN students s ON ic.student_id = s.id
     WHERE ic.group_id = ?
     ORDER BY s.full_name ASC`,
    [groupId]
  );
  return rows.map(mapRowToIssuedCertificate);
}
async function getIssuedCertificateById(id) {
  const rows = await executeQuery(
    `SELECT ic.*, 
            s.full_name as student_full_name,
            s.organization as student_organization,
            s.position as student_position
     FROM issued_certificates ic
     LEFT JOIN students s ON ic.student_id = s.id
     WHERE ic.id = ?
     LIMIT 1`,
    [id]
  );
  return rows.length > 0 ? mapRowToIssuedCertificate(rows[0]) : null;
}
async function getStudentCertificateInGroup(studentId, groupId) {
  const rows = await executeQuery(
    `SELECT * FROM issued_certificates 
     WHERE student_id = ? AND group_id = ?
     LIMIT 1`,
    [studentId, groupId]
  );
  return rows.length > 0 ? mapRowToIssuedCertificate(rows[0]) : null;
}
async function createIssuedCertificate(data) {
  const id = v4();
  const now = /* @__PURE__ */ new Date();
  await executeQuery(
    `INSERT INTO issued_certificates 
     (id, group_id, student_id, template_id, certificate_number, issue_date, expiry_date,
      source_type, status, variables_data, warnings, override_warnings, issued_by, issued_at, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'group_journal', 'issued', ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.groupId,
      data.studentId,
      data.templateId,
      data.certificateNumber,
      data.issueDate,
      data.expiryDate || null,
      data.variablesData ? JSON.stringify(data.variablesData) : null,
      data.warnings ? JSON.stringify(data.warnings) : null,
      data.overrideWarnings || false,
      data.issuedBy || null,
      now,
      data.notes || null,
      now,
      now
    ]
  );
  return await getIssuedCertificateById(id);
}
async function createStandaloneCertificate(data) {
  const id = v4();
  const now = /* @__PURE__ */ new Date();
  await executeQuery(
    `INSERT INTO issued_certificates 
     (id, student_id, certificate_number, issue_date, expiry_date,
      course_name, course_code, course_hours, group_code, group_start_date, group_end_date,
      source_type, status, pdf_file_url, issued_by, issued_at, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'issued', ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.studentId,
      data.certificateNumber,
      data.issueDate,
      data.expiryDate || null,
      data.courseName,
      data.courseCode || null,
      data.courseHours || null,
      data.groupCode || null,
      data.groupStartDate || null,
      data.groupEndDate || null,
      data.sourceType,
      data.pdfFileUrl || null,
      data.issuedBy || null,
      now,
      data.notes || null,
      now,
      now
    ]
  );
  return await getIssuedCertificateById(id);
}
async function getCertificateByNumber(certificateNumber) {
  const rows = await executeQuery(
    `SELECT ic.*, 
            s.full_name as student_full_name,
            s.organization as student_organization,
            s.position as student_position
     FROM issued_certificates ic
     LEFT JOIN students s ON ic.student_id = s.id
     WHERE ic.certificate_number = ?
     LIMIT 1`,
    [certificateNumber]
  );
  return rows.length > 0 ? mapRowToIssuedCertificate(rows[0]) : null;
}
async function updateCertificateFiles(id, docxFileUrl, pdfFileUrl) {
  await executeQuery(
    `UPDATE issued_certificates 
     SET docx_file_url = ?, pdf_file_url = ?, updated_at = ?
     WHERE id = ?`,
    [docxFileUrl, pdfFileUrl, /* @__PURE__ */ new Date(), id]
  );
}
async function revokeCertificate(id, revokedBy, reason) {
  const now = /* @__PURE__ */ new Date();
  await executeQuery(
    `UPDATE issued_certificates 
     SET status = 'revoked', revoked_by = ?, revoked_at = ?, revoke_reason = ?, updated_at = ?
     WHERE id = ?`,
    [revokedBy, now, reason, now, id]
  );
  return getIssuedCertificateById(id);
}
async function deleteCertificate(id) {
  const cert = await getIssuedCertificateById(id);
  if (!cert) {
    return false;
  }
  if (cert.status === "issued") {
    throw new Error("\u041D\u0435\u043B\u044C\u0437\u044F \u0443\u0434\u0430\u043B\u0438\u0442\u044C \u0432\u044B\u0434\u0430\u043D\u043D\u044B\u0439 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442. \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435 \u043E\u0442\u0437\u044B\u0432.");
  }
  const result = await executeQuery(
    "DELETE FROM issued_certificates WHERE id = ?",
    [id]
  );
  return result.affectedRows > 0;
}
async function reissueCertificate(existingCertId, data) {
  const now = /* @__PURE__ */ new Date();
  await executeQuery(
    `UPDATE issued_certificates 
     SET template_id = ?, 
         certificate_number = ?, 
         issue_date = ?, 
         expiry_date = ?,
         status = 'issued', 
         variables_data = ?, 
         warnings = ?, 
         override_warnings = ?, 
         issued_by = ?, 
         issued_at = ?,
         revoked_by = NULL,
         revoked_at = NULL,
         revoke_reason = NULL,
         notes = ?, 
         updated_at = ?
     WHERE id = ?`,
    [
      data.templateId,
      data.certificateNumber,
      data.issueDate,
      data.expiryDate || null,
      data.variablesData ? JSON.stringify(data.variablesData) : null,
      data.warnings ? JSON.stringify(data.warnings) : null,
      data.overrideWarnings || false,
      data.issuedBy || null,
      now,
      data.notes || null,
      now,
      existingCertId
    ]
  );
  return await getIssuedCertificateById(existingCertId);
}
const ELIGIBILITY_REQUIREMENTS = {
  minAttendancePercent: 75,
  // Минимальная посещаемость
  minGrade: 60};
async function checkStudentEligibility(studentId, groupId) {
  const [studentRow] = await executeQuery(
    "SELECT id, full_name FROM students WHERE id = ?",
    [studentId]
  );
  if (!studentRow) {
    throw new Error("\u0421\u0442\u0443\u0434\u0435\u043D\u0442 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D");
  }
  const existingCert = await getStudentCertificateInGroup(studentId, groupId);
  const [groupInfo] = await executeQuery(
    `SELECT sg.id, sg.course_id, c.total_hours as course_total_hours
     FROM study_groups sg
     JOIN courses c ON sg.course_id = c.id
     WHERE sg.id = ?`,
    [groupId]
  );
  if (!groupInfo) {
    throw new Error("\u0413\u0440\u0443\u043F\u043F\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430");
  }
  const disciplines = await executeQuery(
    `SELECT d.id, d.name, d.hours
     FROM disciplines d
     WHERE d.course_id = ?
     ORDER BY d.order_index`,
    [groupInfo.course_id]
  );
  const [attendanceStats] = await executeQuery(
    `SELECT 
       COALESCE(SUM(a.hours_attended), 0) as total_attended_hours,
       COALESCE(SUM(a.max_hours), 0) as total_max_hours,
       COUNT(DISTINCT a.schedule_event_id) as attended_events
     FROM attendance a
     JOIN schedule_events se ON a.schedule_event_id = se.id
     WHERE a.student_id = ? AND se.group_id = ?`,
    [studentId, groupId]
  );
  const [scheduledStats] = await executeQuery(
    `SELECT 
       COALESCE(SUM(TIMESTAMPDIFF(MINUTE, se.start_time, se.end_time) / 45), 0) as scheduled_hours,
       COUNT(*) as total_events
     FROM schedule_events se
     WHERE se.group_id = ?`,
    [groupId]
  );
  const gradesData = await executeQuery(
    `SELECT fg.discipline_id, fg.final_grade, fg.status
     FROM final_grades fg
     WHERE fg.student_id = ? AND fg.group_id = ?`,
    [studentId, groupId]
  );
  const totalAttendedHours = Number(attendanceStats?.total_attended_hours) || 0;
  let totalHours = Number(scheduledStats?.scheduled_hours) || 0;
  if (totalHours === 0) {
    totalHours = Number(groupInfo.course_total_hours) || 0;
  }
  const totalDisciplines = disciplines.length;
  let gradesSum = 0;
  let gradesCount = 0;
  let completedDisciplines = 0;
  const gradedDisciplineIds = /* @__PURE__ */ new Set();
  for (const grade of gradesData) {
    if (grade.final_grade !== null) {
      gradesSum += Number(grade.final_grade);
      gradesCount++;
      gradedDisciplineIds.add(grade.discipline_id);
      if (grade.status === "passed") {
        completedDisciplines++;
      }
    }
  }
  if (gradesCount === 0 && attendanceStats?.attended_events > 0) {
    const attendedDisciplines = await executeQuery(
      `SELECT DISTINCT se.discipline_id 
       FROM attendance a
       JOIN schedule_events se ON a.schedule_event_id = se.id
       WHERE a.student_id = ? AND se.group_id = ? AND a.hours_attended > 0`,
      [studentId, groupId]
    );
    completedDisciplines = attendedDisciplines.length;
  }
  const totalAttendancePercent = totalHours > 0 ? totalAttendedHours / totalHours * 100 : 0;
  const averageGrade = gradesCount > 0 ? gradesSum / gradesCount : null;
  const warnings = [];
  if (totalAttendancePercent < ELIGIBILITY_REQUIREMENTS.minAttendancePercent) {
    warnings.push({
      type: "low_attendance",
      message: `\u041F\u043E\u0441\u0435\u0449\u0430\u0435\u043C\u043E\u0441\u0442\u044C ${totalAttendancePercent.toFixed(1)}% \u043D\u0438\u0436\u0435 \u043C\u0438\u043D\u0438\u043C\u0430\u043B\u044C\u043D\u043E\u0439 (${ELIGIBILITY_REQUIREMENTS.minAttendancePercent}%)`,
      details: { actual: totalAttendancePercent, required: ELIGIBILITY_REQUIREMENTS.minAttendancePercent }
    });
  }
  if (completedDisciplines < totalDisciplines && totalDisciplines > 0) {
    warnings.push({
      type: "incomplete_disciplines",
      message: `\u041F\u0440\u043E\u0439\u0434\u0435\u043D\u043E ${completedDisciplines} \u0438\u0437 ${totalDisciplines} \u0434\u0438\u0441\u0446\u0438\u043F\u043B\u0438\u043D`,
      details: { completed: completedDisciplines, total: totalDisciplines }
    });
  }
  if (averageGrade !== null && averageGrade < ELIGIBILITY_REQUIREMENTS.minGrade) {
    warnings.push({
      type: "low_grade",
      message: `\u0421\u0440\u0435\u0434\u043D\u0438\u0439 \u0431\u0430\u043B\u043B ${averageGrade.toFixed(1)} \u043D\u0438\u0436\u0435 \u043C\u0438\u043D\u0438\u043C\u0430\u043B\u044C\u043D\u043E\u0433\u043E (${ELIGIBILITY_REQUIREMENTS.minGrade})`,
      details: { actual: averageGrade, required: ELIGIBILITY_REQUIREMENTS.minGrade }
    });
  }
  if (gradesCount < totalDisciplines && totalDisciplines > 0) {
    warnings.push({
      type: "missing_grades",
      message: `\u041E\u0446\u0435\u043D\u043A\u0438 \u0432\u044B\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u044B \u0442\u043E\u043B\u044C\u043A\u043E \u043F\u043E ${gradesCount} \u0438\u0437 ${totalDisciplines} \u0434\u0438\u0441\u0446\u0438\u043F\u043B\u0438\u043D`,
      details: { graded: gradesCount, total: totalDisciplines }
    });
  }
  console.log(`[Eligibility] Student ${studentId}: attendance=${totalAttendancePercent.toFixed(1)}% (${totalAttendedHours}/${totalHours}h), grades=${gradesCount}/${totalDisciplines}, avgGrade=${averageGrade?.toFixed(1) || "N/A"}`);
  return {
    studentId,
    studentName: studentRow.full_name,
    isEligible: warnings.length === 0,
    warnings,
    attendancePercent: totalAttendancePercent,
    completedDisciplines,
    totalDisciplines,
    averageGrade,
    hasCertificate: existingCert !== null,
    certificateStatus: existingCert?.status
  };
}

export { getCertificateByNumber as a, getTemplateById as b, createStandaloneCertificate as c, deleteCertificate as d, getIssuedCertificatesByGroup as e, checkStudentEligibility as f, getIssuedCertificateById as g, getStudentCertificateInGroup as h, generateCertificateNumber as i, reissueCertificate as j, createIssuedCertificate as k, deleteTemplate as l, updateTemplate as m, getTemplates as n, createTemplate as o, revokeCertificate as r, updateCertificateFiles as u };
//# sourceMappingURL=certificateTemplateRepository.mjs.map
