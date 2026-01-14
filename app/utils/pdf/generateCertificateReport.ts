import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  instructors: string[]; // Массив всех инструкторов
  students: CertificateReportStudent[];
  startDate?: string;
  endDate?: string;
  generatedBy: string; // ФИО того, кто сформировал ведомость
}

/**
 * Загрузка шрифта или изображения по URL
 */
async function loadResource(url: string): Promise<string> {
  const response = await fetch(url);
  const buffer = await response.arrayBuffer();
  // Конвертация в base64
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return window.btoa(binary);
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
 * Генерирует PDF-ведомость выдачи сертификатов
 */
export async function generateCertificateReport(
  data: CertificateReportData
): Promise<void> {
  // Создаем документ в альбомной ориентации
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
  });

  // Загружаем шрифты Montserrat (Regular, Bold, Italic)
  try {
    const fontRegular = await loadResource(
      "https://raw.githubusercontent.com/JulietaUla/Montserrat/master/fonts/ttf/Montserrat-Regular.ttf"
    );
    const fontBold = await loadResource(
      "https://raw.githubusercontent.com/JulietaUla/Montserrat/master/fonts/ttf/Montserrat-Bold.ttf"
    );
    const fontItalic = await loadResource(
      "https://raw.githubusercontent.com/JulietaUla/Montserrat/master/fonts/ttf/Montserrat-Italic.ttf"
    );

    doc.addFileToVFS("Montserrat-Regular.ttf", fontRegular);
    doc.addFont("Montserrat-Regular.ttf", "Montserrat", "normal");

    doc.addFileToVFS("Montserrat-Bold.ttf", fontBold);
    doc.addFont("Montserrat-Bold.ttf", "Montserrat", "bold");

    doc.addFileToVFS("Montserrat-Italic.ttf", fontItalic);
    doc.addFont("Montserrat-Italic.ttf", "Montserrat", "italic");

    doc.setFont("Montserrat", "normal");
  } catch (e) {
    console.error("Ошибка загрузки шрифта:", e);
  }

  // Загружаем логотип
  let logoData: string | null = null;
  try {
    logoData = await loadResource("/logo.png");
  } catch (e) {
    console.error("Ошибка загрузки логотипа:", e);
  }

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const blackColor: [number, number, number] = [0, 0, 0];

  // === ШАПКА ДОКУМЕНТА ===
  let yPosition = margin;

  // Логотип (слева сверху)
  if (logoData) {
    try {
      const imgProps = doc.getImageProperties(logoData);
      const pdfWidth = 50;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      doc.addImage(logoData, "PNG", margin, yPosition, pdfWidth, pdfHeight);
    } catch (e) {
      console.error("Ошибка при отрисовке логотипа:", e);
      doc.addImage(logoData, "PNG", margin, yPosition, 50, 30);
    }
  }

  // Заголовок документа (по центру)
  doc.setFontSize(14);
  doc.setFont("Montserrat", "bold");
  doc.setTextColor(...blackColor);
  doc.text("ВЕДОМОСТЬ ВЫДАЧИ СЕРТИФИКАТОВ", pageWidth / 2, yPosition + 15, {
    align: "center",
  });

  // Отступ после шапки
  yPosition += 35;

  // Информационный блок
  doc.setFontSize(9);
  doc.setTextColor(...blackColor);

  const col1X = margin;
  const col2X = pageWidth / 2;
  const labelWidth = 40;
  const valueWidth = 90;

  // === Левая колонка ===
  let leftY = yPosition;

  // Учебная программа
  doc.setFont("Montserrat", "bold");
  doc.text("Учебная программа:", col1X, leftY);

  doc.setFont("Montserrat", "normal");
  const splitCourse = doc.splitTextToSize(data.courseName, valueWidth);
  doc.text(splitCourse, col1X + labelWidth, leftY);
  leftY += Math.max(splitCourse.length * 4, 5);

  // Группа
  doc.setFont("Montserrat", "bold");
  doc.text("Группа:", col1X, leftY);
  doc.setFont("Montserrat", "normal");
  const splitGroup = doc.splitTextToSize(data.groupCode, valueWidth);
  doc.text(splitGroup, col1X + labelWidth, leftY);
  leftY += 5;

  // === Правая колонка ===
  let rightY = yPosition;

  // Инструкторы (все)
  doc.setFont("Montserrat", "bold");
  doc.text("Инструкторы:", col2X, rightY);
  doc.setFont("Montserrat", "normal");

  if (data.instructors.length > 0) {
    const instructorsText = data.instructors.join(", ");
    const splitInstructors = doc.splitTextToSize(instructorsText, valueWidth);
    doc.text(splitInstructors, col2X + labelWidth, rightY);
    rightY += Math.max(splitInstructors.length * 4, 5);
  } else {
    doc.text("Не указаны", col2X + labelWidth, rightY);
    rightY += 5;
  }

  // Период
  if (data.startDate && data.endDate) {
    doc.setFont("Montserrat", "bold");
    doc.text("Период:", col2X, rightY);
    doc.setFont("Montserrat", "normal");
    doc.text(
      `${formatDate(data.startDate)} — ${formatDate(data.endDate)}`,
      col2X + labelWidth,
      rightY
    );
    rightY += 5;
  }

  // Обновляем позицию Y после самого высокого блока
  yPosition = Math.max(leftY, rightY) + 5;

  // === ТАБЛИЦА ===

  // Подготовка заголовков таблицы
  const headers: { content: string; styles?: any }[] = [
    { content: "№" },
    { content: "ФИО слушателя" },
    { content: "Организация" },
    { content: "Посещ.\n%" },
    { content: "Ср.\nбалл" },
    { content: "Дисц.\nпройдено" },
    { content: "Допуск" },
    { content: "Статус\nсертификата" },
    { content: "Дата\nвыдачи" },
    { content: "№\nсертификата" },
  ];

  // Подготовка данных таблицы
  const tableData: any[][] = [];

  const statusLabels: Record<string, string> = {
    draft: "Черновик",
    issued: "Выдан",
    revoked: "Отозван",
  };

  data.students.forEach((student, index) => {
    const rowData: any[] = [
      index + 1,
      student.fullName,
      student.organization || "—",
      student.totalAttendancePercent.toFixed(0) + "%",
      student.averageGrade !== null ? student.averageGrade.toFixed(1) : "—",
      `${student.eligibility.completedDisciplines}/${student.eligibility.totalDisciplines}`,
      student.eligibility.isEligible ? "Допущен" : "Не допущен",
      student.certificate
        ? statusLabels[student.certificate.status]
        : "Не выдан",
      student.certificate?.issueDate
        ? formatDate(student.certificate.issueDate)
        : "—",
      student.certificate?.certificateNumber || "—",
    ];

    tableData.push(rowData);
  });

  // Генерируем таблицу
  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: yPosition,
    theme: "grid",
    styles: {
      font: "Montserrat",
      fontSize: 8,
      cellPadding: 1.5,
      lineColor: [0, 0, 0],
      textColor: [0, 0, 0],
      lineWidth: 0.1,
      halign: "center",
      valign: "middle",
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      lineWidth: 0.1,
      lineColor: [0, 0, 0],
      valign: "middle",
      minCellHeight: 10,
    },
    columnStyles: {
      0: { cellWidth: 10 }, // №
      1: { cellWidth: 45, halign: "left", overflow: "linebreak" }, // ФИО
      2: { cellWidth: 40, halign: "left", overflow: "linebreak" }, // Организация
      3: { cellWidth: 15 }, // Посещ.
      4: { cellWidth: 15 }, // Ср. балл
      5: { cellWidth: 18 }, // Дисц.
      6: { cellWidth: 20 }, // Допуск
      7: { cellWidth: 22 }, // Статус
      8: { cellWidth: 20 }, // Дата выдачи
      9: { cellWidth: 25 }, // № сертификата
    },
  });

  // === ПОДВАЛ ===
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  let bottomY = finalY;

  // Легенда
  doc.setFontSize(7);
  doc.setFont("Montserrat", "normal");

  const legendText =
    "* Статусы: Выдан — сертификат выдан студенту, Отозван — сертификат аннулирован, Не выдан — сертификат не был выдан.";
  doc.text(legendText, margin, bottomY);

  bottomY += 15;

  // Линия для подписи
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);
  doc.line(margin, bottomY, margin + 80, bottomY);

  // Текст подписи
  doc.setFontSize(9);
  doc.setFont("Montserrat", "normal");
  doc.text(`Ведомость сформирована: ${data.generatedBy}`, margin, bottomY + 5);

  // Дата формирования
  const currentDate = new Date();
  const formattedDate = formatDate(currentDate.toISOString());
  doc.text(`Дата: ${formattedDate}`, pageWidth - margin, bottomY + 5, {
    align: "right",
  });

  // Сохраняем PDF
  const fileName = `Vedomost_Certificates_${data.groupCode}.pdf`;
  doc.save(fileName);
}
