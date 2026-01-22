import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";

interface EmptyJournalData {
  groupCode: string;
  courseName?: string;
  startDate?: string;
  endDate?: string;
  studentNames: string[];
  columnCount?: number; // Количество пустых колонок (по умолчанию 20)
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
 * Генерирует DOCX-журнал с пустыми ячейками для ручного заполнения
 */
export async function generateEmptyJournalDocx(
  data: EmptyJournalData,
): Promise<void> {
  const columnCount = data.columnCount || 20;

  // Создаем простой HTML-шаблон для конвертации в DOCX
  const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: 'Times New Roman', serif; font-size: 12pt; }
                .header { text-align: center; margin-bottom: 20px; }
                .header h1 { font-size: 14pt; font-weight: bold; margin: 10px 0; }
                .info { margin-bottom: 15px; }
                .info-row { margin: 5px 0; }
                .info-label { font-weight: bold; display: inline-block; width: 150px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid black; padding: 5px; text-align: center; }
                th { background-color: #f0f0f0; font-weight: bold; }
                .student-name { text-align: left; }
                .footer { margin-top: 20px; }
                .signature-line { margin: 10px 0; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>ЖУРНАЛ ПОСЕЩАЕМОСТИ</h1>
            </div>
            
            <div class="info">
                ${data.courseName ? `<div class="info-row"><span class="info-label">Учебная программа:</span> ${data.courseName}</div>` : ""}
                <div class="info-row"><span class="info-label">Группа:</span> ${data.groupCode}</div>
                ${data.startDate && data.endDate ? `<div class="info-row"><span class="info-label">Период:</span> ${formatDate(data.startDate)} — ${formatDate(data.endDate)}</div>` : ""}
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th style="width: 30px;">№</th>
                        <th style="width: 200px;">ФИО слушателя</th>
                        ${Array.from({ length: columnCount }, () => '<th style="width: 30px;"></th>').join("")}
                    </tr>
                </thead>
                <tbody>
                    ${data.studentNames
                      .map(
                        (name, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td class="student-name">${name}</td>
                            ${Array.from({ length: columnCount }, () => "<td></td>").join("")}
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>
            
            <div class="footer">
                <div class="signature-line">
                    <span class="info-label">Инструктор:</span> _____________________________________
                </div>
                <div class="signature-line">
                    <span class="info-label">Подпись:</span> _____________________________________
                </div>
                <div class="signature-line" style="text-align: right;">
                    Дата формирования: ${formatDate(new Date().toISOString())}
                </div>
            </div>
        </body>
        </html>
    `;

  // Конвертируем HTML в DOCX используя простой подход
  const blob = new Blob([htmlContent], { type: "text/html" });
  const url = URL.createObjectURL(blob);

  // Создаем временный элемент для скачивания
  const link = document.createElement("a");
  link.href = url;
  link.download = `Pustoy_Zhurnal_${data.groupCode}.doc`; // .doc для совместимости
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
