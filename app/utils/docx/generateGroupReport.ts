interface JournalColumn {
  scheduleEvent: {
    id: string;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    eventType: "theory" | "practice" | "assessment" | "other";
    academicHours: number;
    isRetake?: boolean;
    allowedStudentIds?: string[] | null;
    originalEventId?: string | null;
  };
  hasGrade: boolean;
}

interface JournalCell {
  studentId: string;
  scheduleEventId: string;
  attendance?: {
    id: string;
    hoursAttended: number;
    maxHours: number;
    notes: string | null;
  };
  grade?: {
    id: string;
    grade: number;
    notes: string | null;
    isFromTest?: boolean;
    isModified?: boolean;
    originalGrade?: number | null;
  };
  isHidden?: boolean;
}

interface FinalGrade {
  id: string;
  finalGrade?: number;
  attendancePercent?: number;
  status: "in_progress" | "passed" | "failed" | "not_allowed";
  notes?: string;
}

interface JournalRow {
  student: {
    id: string;
    fullName: string;
    organization: string | null;
  };
  cells: JournalCell[];
  totalHoursAttended: number;
  totalMaxHours: number;
  attendancePercent: number;
  averageGrade?: number;
  assessmentCount: number;
  finalGrade?: FinalGrade;
}

interface JournalData {
  groupCode: string;
  disciplineName: string;
  courseName?: string;
  instructorName: string;
  columns: JournalColumn[];
  rows: JournalRow[];
  startDate?: string;
  endDate?: string;
}

// Маппинг типов занятий (сокращенный)
const eventTypeShortMap: Record<string, string> = {
  theory: "т",
  practice: "пр",
  assessment: "пз",
  other: "др",
};

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
 * Форматирует дату для заголовка колонки (DD.MM)
 */
function formatColumnDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}`;
}

/**
 * Генерирует DOCX-ведомость учебной группы
 */
export async function generateGroupReportDocx(
  data: JournalData,
): Promise<void> {
  // Создаем HTML-шаблон для конвертации в DOCX
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
                th, td { border: 1px solid black; padding: 3px; text-align: center; vertical-align: middle; }
                th { background-color: #f0f0f0; font-weight: bold; }
                .student-name { text-align: left; }
                .footer { margin-top: 15px; font-size: 8pt; }
                .legend { margin-bottom: 10px; }
                .signature-block { margin-top: 10px; display: flex; justify-content: space-between; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>ЗАЧЕТНАЯ ВЕДОМОСТЬ</h1>
            </div>
            
            <div class="info">
                <div class="info-col">
                    ${data.courseName ? `<div class="info-row"><span class="info-label">Учебная программа:</span> ${data.courseName}</div>` : ""}
                    <div class="info-row"><span class="info-label">Дисциплина:</span> ${data.disciplineName}</div>
                    <div class="info-row"><span class="info-label">Группа:</span> ${data.groupCode}</div>
                </div>
                <div class="info-col">
                    <div class="info-row"><span class="info-label">Инструктор:</span> ${data.instructorName || "Не указан"}</div>
                    ${data.startDate && data.endDate ? `<div class="info-row"><span class="info-label">Период:</span> ${formatDate(data.startDate)} — ${formatDate(data.endDate)}</div>` : ""}
                </div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th style="width: 25px;">№</th>
                        <th style="width: 150px;">ФИО слушателя</th>
                        ${data.columns
                          .map((col) => {
                            const dateStr = formatColumnDate(
                              col.scheduleEvent.date,
                            );
                            const typeStr = col.scheduleEvent.isRetake
                              ? "пер"
                              : eventTypeShortMap[
                                  col.scheduleEvent.eventType
                                ] || "";
                            return `<th style="width: 35px;">${dateStr} ${typeStr}</th>`;
                          })
                          .join("")}
                        <th style="width: 50px;">Посещ. %</th>
                        <th style="width: 50px;">Ср. балл</th>
                        <th style="width: 50px;"><strong>Итог</strong></th>
                    </tr>
                </thead>
                <tbody>
                    ${data.rows
                      .map(
                        (row, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td class="student-name">${row.student.fullName}</td>
                            ${row.cells
                              .map((cell) => {
                                if (cell.isHidden) return "<td>-</td>";
                                let cellText = "";
                                if (cell.attendance) {
                                  cellText = `${cell.attendance.hoursAttended}`;
                                }
                                if (cell.grade) {
                                  if (cellText) cellText += "/";
                                  cellText += `${cell.grade.grade}`;
                                }
                                return `<td>${cellText || ""}</td>`;
                              })
                              .join("")}
                            <td>${row.attendancePercent.toFixed(0)}</td>
                            <td>${row.averageGrade ? row.averageGrade.toFixed(1) : "-"}</td>
                            <td>${row.finalGrade?.finalGrade ? row.finalGrade.finalGrade.toString() : "-"}</td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>
            
            <div class="footer">
                <div class="legend">
                    * Обозначения: т - теория, пр - практика, пз - проверка знаний, пер - пересдача. В ячейках: Часы / Оценка.
                </div>
                <div class="signature-block">
                    <div>Инструктор: ${data.instructorName || ""} _____________________</div>
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
  link.download = `Vedomost_${data.groupCode}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
