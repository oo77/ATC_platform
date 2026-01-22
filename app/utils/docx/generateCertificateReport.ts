interface CertificateReportStudent {
  fullName: string;
  organization: string;
  totalAttendancePercent: number;
  averageGrade: number | null;
  eligibility: {
    isEligible: boolean;
    completedDisciplines: number;
    totalDisciplines: number;
  };
  certificate: {
    status: "draft" | "issued" | "revoked";
    issueDate?: string;
    certificateNumber?: string;
  } | null;
}

interface CertificateReportData {
  groupCode: string;
  courseName: string;
  instructors: string[];
  students: CertificateReportStudent[];
  startDate?: string;
  endDate?: string;
  generatedBy: string;
}

/**
 * Форматирует дату в формат DD.MM.YYYY
 */
function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

/**
 * Генерирует DOCX-ведомость выдачи сертификатов
 */
export async function generateCertificateReportDocx(
  data: CertificateReportData,
): Promise<void> {
  const statusLabels: Record<string, string> = {
    draft: "Черновик",
    issued: "Выдан",
    revoked: "Отозван",
  };

  const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: 'Times New Roman', serif; font-size: 11pt; }
                .header { text-align: center; margin-bottom: 20px; }
                .header h1 { font-size: 14pt; font-weight: bold; margin: 10px 0; }
                .info { margin-bottom: 15px; display: flex; justify-content: space-between; }
                .info-col { flex: 1; }
                .info-row { margin: 5px 0; }
                .info-label { font-weight: bold; display: inline-block; width: 120px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 9pt; }
                th, td { border: 1px solid black; padding: 4px; text-align: center; vertical-align: middle; }
                th { background-color: #f0f0f0; font-weight: bold; }
                .student-name, .organization { text-align: left; }
                .footer { margin-top: 15px; font-size: 8pt; }
                .legend { margin-bottom: 10px; }
                .signature-block { margin-top: 10px; display: flex; justify-content: space-between; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>ВЕДОМОСТЬ ВЫДАЧИ СЕРТИФИКАТОВ</h1>
            </div>
            
            <div class="info">
                <div class="info-col">
                    <div class="info-row"><span class="info-label">Учебная программа:</span> ${data.courseName}</div>
                    <div class="info-row"><span class="info-label">Группа:</span> ${data.groupCode}</div>
                </div>
                <div class="info-col">
                    <div class="info-row"><span class="info-label">Инструкторы:</span> ${data.instructors.length > 0 ? data.instructors.join(", ") : "Не указаны"}</div>
                    ${data.startDate && data.endDate ? `<div class="info-row"><span class="info-label">Период:</span> ${formatDate(data.startDate)} — ${formatDate(data.endDate)}</div>` : ""}
                </div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th style="width: 25px;">№</th>
                        <th style="width: 120px;">ФИО слушателя</th>
                        <th style="width: 100px;">Организация</th>
                        <th style="width: 45px;">Посещ. %</th>
                        <th style="width: 45px;">Ср. балл</th>
                        <th style="width: 50px;">Дисц. пройдено</th>
                        <th style="width: 60px;">Допуск</th>
                        <th style="width: 60px;">Статус сертификата</th>
                        <th style="width: 60px;">Дата выдачи</th>
                        <th style="width: 70px;">№ сертификата</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.students
                      .map(
                        (student, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td class="student-name">${student.fullName}</td>
                            <td class="organization">${student.organization || "—"}</td>
                            <td>${student.totalAttendancePercent.toFixed(0)}%</td>
                            <td>${student.averageGrade !== null ? student.averageGrade.toFixed(1) : "—"}</td>
                            <td>${student.eligibility.completedDisciplines}/${student.eligibility.totalDisciplines}</td>
                            <td>${student.eligibility.isEligible ? "Допущен" : "Не допущен"}</td>
                            <td>${student.certificate ? statusLabels[student.certificate.status] : "Не выдан"}</td>
                            <td>${student.certificate?.issueDate ? formatDate(student.certificate.issueDate) : "—"}</td>
                            <td>${student.certificate?.certificateNumber || "—"}</td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>
            
            <div class="footer">
                <div class="legend">
                    * Статусы: Выдан — сертификат выдан студенту, Отозван — сертификат аннулирован, Не выдан — сертификат не был выдан.
                </div>
                <div class="signature-block">
                    <div>Ведомость сформирована: ${data.generatedBy}</div>
                    <div>Дата: ${formatDate(new Date().toISOString())}</div>
                </div>
            </div>
        </body>
        </html>
    `;

  // Конвертируем HTML в DOCX
  const blob = new Blob([htmlContent], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `Vedomost_Certificates_${data.groupCode}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
