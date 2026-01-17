import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface JournalColumn {
    scheduleEvent: {
        id: string;
        title: string;
        date: string;
        startTime: string;
        endTime: string;
        eventType: 'theory' | 'practice' | 'assessment' | 'other';
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
    status: 'in_progress' | 'passed' | 'failed' | 'not_allowed';
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
    courseName?: string; // Название учебной программы
    instructorName: string;
    columns: JournalColumn[];
    rows: JournalRow[];
    startDate?: string;
    endDate?: string;
}

// Маппинг типов занятий (сокращенный)
const eventTypeShortMap: Record<string, string> = {
    theory: 'т',
    practice: 'пр',
    assessment: 'пз',
    other: 'др',
};

/**
 * Загрузка шрифта или изображения по URL
 */
async function loadResource(url: string): Promise<string> {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    // Конвертация в base64
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        const byte = bytes[i];
        // TypeScript требует явную проверку, хотя индекс всегда валиден
        binary += String.fromCharCode(byte ?? 0);
    }
    return window.btoa(binary);
}

/**
 * Форматирует дату в формат DD.MM.YYYY
 */
function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

/**
 * Форматирует дату для заголовка колонки (DD.MM)
 */
function formatColumnDate(dateStr: string): string {
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}.${month}`;
}

/**
 * Генерирует PDF-ведомость учебной группы
 */
export async function generateGroupReport(data: JournalData): Promise<void> {
    // Создаем документ в альбомной ориентации
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
    });

    // Загружаем шрифты Montserrat (Regular, Bold, Italic)
    try {
        const fontRegular = await loadResource('https://raw.githubusercontent.com/JulietaUla/Montserrat/master/fonts/ttf/Montserrat-Regular.ttf');
        const fontBold = await loadResource('https://raw.githubusercontent.com/JulietaUla/Montserrat/master/fonts/ttf/Montserrat-Bold.ttf');
        const fontItalic = await loadResource('https://raw.githubusercontent.com/JulietaUla/Montserrat/master/fonts/ttf/Montserrat-Italic.ttf');

        doc.addFileToVFS('Montserrat-Regular.ttf', fontRegular);
        doc.addFont('Montserrat-Regular.ttf', 'Montserrat', 'normal');

        doc.addFileToVFS('Montserrat-Bold.ttf', fontBold);
        doc.addFont('Montserrat-Bold.ttf', 'Montserrat', 'bold');

        doc.addFileToVFS('Montserrat-Italic.ttf', fontItalic);
        doc.addFont('Montserrat-Italic.ttf', 'Montserrat', 'italic');

        doc.setFont('Montserrat', 'normal');
    } catch (e) {
        console.error('Ошибка загрузки шрифта:', e);
    }

    // Загружаем логотип
    let logoData: string | null = null;
    try {
        logoData = await loadResource('/logo.png');
    } catch (e) {
        console.error('Ошибка загрузки логотипа:', e);
    }

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const blackColor: [number, number, number] = [0, 0, 0];

    // === ШАПКА ДОКУМЕНТА ===
    let yPosition = margin;

    // Логотип (слева сверху) - УВЕЛИЧЕН В 2 РАЗА (с сохранением пропорций)
    if (logoData) {
        try {
            // Получаем свойства изображения для сохранения пропорций
            const imgProps = doc.getImageProperties(logoData);
            const pdfWidth = 50; // Желаемая ширина 50мм
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            doc.addImage(logoData, 'PNG', margin, yPosition, pdfWidth, pdfHeight);
        } catch (e) {
            console.error('Ошибка при отрисовке логотипа:', e);
            // Fallback
            doc.addImage(logoData, 'PNG', margin, yPosition, 50, 30);
        }
    }

    // Заголовок документа (по центру)
    doc.setFontSize(14);
    doc.setFont('Montserrat', 'bold');
    doc.setTextColor(...blackColor);
    // Выравниваем заголовок относительно высоты логотипа (середина) или чуть выше
    doc.text('ЗАЧЕТНАЯ ВЕДОМОСТЬ', pageWidth / 2, yPosition + 15, {
        align: 'center',
    });

    // Отступ после шапки (учитываем высоту увеличенного логотипа)
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
    if (data.courseName) {
        doc.setFont('Montserrat', 'bold');
        doc.text('Учебная программа:', col1X, leftY);

        doc.setFont('Montserrat', 'normal');
        const splitCourse = doc.splitTextToSize(data.courseName, valueWidth);
        doc.text(splitCourse, col1X + labelWidth, leftY);
        leftY += Math.max(splitCourse.length * 4, 5);
    }

    // Дисциплина
    doc.setFont('Montserrat', 'bold');
    doc.text('Дисциплина:', col1X, leftY);

    doc.setFont('Montserrat', 'normal');
    const splitDiscipline = doc.splitTextToSize(data.disciplineName, valueWidth);
    doc.text(splitDiscipline, col1X + labelWidth, leftY);
    leftY += Math.max(splitDiscipline.length * 4, 5);

    // Группа
    doc.setFont('Montserrat', 'bold');
    doc.text('Группа:', col1X, leftY);
    doc.setFont('Montserrat', 'normal');
    const splitGroup = doc.splitTextToSize(data.groupCode, valueWidth);
    doc.text(splitGroup, col1X + labelWidth, leftY);
    leftY += 5;

    // === Правая колонка ===
    let rightY = yPosition;

    // Инструктор
    doc.setFont('Montserrat', 'bold');
    doc.text('Инструктор:', col2X, rightY);
    doc.setFont('Montserrat', 'normal');
    const splitInstructor = doc.splitTextToSize(data.instructorName || 'Не указан', valueWidth);
    doc.text(splitInstructor, col2X + labelWidth, rightY);
    rightY += Math.max(splitInstructor.length * 4, 5);

    // Период
    if (data.startDate && data.endDate) {
        doc.setFont('Montserrat', 'bold');
        doc.text('Период:', col2X, rightY);
        doc.setFont('Montserrat', 'normal');
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
        { content: '№' },
        { content: 'ФИО слушателя' }
    ];

    // Добавляем колонки для каждого занятия
    data.columns.forEach((col) => {
        const dateStr = formatColumnDate(col.scheduleEvent.date);
        // Тип занятия - теперь в одну строку, сокращенно
        const typeStr = col.scheduleEvent.isRetake
            ? 'пер'
            : (eventTypeShortMap[col.scheduleEvent.eventType] || '');

        // Формат: "02.03 пер" или "02.03 т"
        headers.push({ content: `${dateStr} ${typeStr}` });
    });

    // Итоговые колонки
    headers.push({ content: 'Посещ.\n%' });
    headers.push({ content: 'Ср.\nбалл' });
    headers.push({ content: 'Итог', styles: { fontStyle: 'bold' } });

    // Подготовка данных таблицы
    const tableData: any[][] = [];

    data.rows.forEach((row, index) => {
        const rowData: any[] = [
            index + 1,
            row.student.fullName,
        ];

        // Добавляем данные по каждому занятию
        row.cells.forEach((cell) => {
            if (cell.isHidden) {
                rowData.push('-');
            } else {
                let cellText = '';

                // Посещаемость
                if (cell.attendance) {
                    cellText = `${cell.attendance.hoursAttended}`;
                }

                // Оценка (если есть)
                if (cell.grade) {
                    if (cellText) cellText += '/';
                    cellText += `${cell.grade.grade}`;
                }

                rowData.push(cellText || '');
            }
        });

        // Итоговые данные
        rowData.push(row.attendancePercent.toFixed(0));
        rowData.push(row.averageGrade ? row.averageGrade.toFixed(1) : '-');

        // Итоговая оценка
        const finalGradeText = row.finalGrade?.finalGrade
            ? row.finalGrade.finalGrade.toString()
            : '-';
        rowData.push(finalGradeText);

        tableData.push(rowData);
    });

    // Генерируем таблицу
    autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: yPosition,
        theme: 'grid', // Сетка (обычная таблица)
        styles: {
            font: 'Montserrat',
            fontSize: 8,
            cellPadding: 1,
            lineColor: [0, 0, 0], // Черные линии
            textColor: [0, 0, 0], // Черный текст
            lineWidth: 0.1,
            halign: 'center', // Выравнивание по центру по умолчанию
            valign: 'middle'
        },
        headStyles: {
            fillColor: [255, 255, 255], // Белый фон
            textColor: [0, 0, 0], // Черный текст
            fontStyle: 'bold',
            lineWidth: 0.1, // Тонкая граница
            lineColor: [0, 0, 0], // Черные линии заголовка
            valign: 'middle',
            minCellHeight: 10 // Чуть меньше высота, так как теперь одна строка
        },
        columnStyles: {
            0: { cellWidth: 10 }, // №
            1: { cellWidth: 50, halign: 'left', overflow: 'linebreak' }, // ФИО
        },
        didDrawCell: (data) => {
            // Если это заголовок таблицы и НЕ колонка № и не ФИО - пытаемся отрисовать курсивом вторую строку
            // Но jspdf-autotable отрисовывает текст сам. 
            // Чтобы реально сделать курсив, нужно перехватывать отрисовку текста, что сложно.
            // Оставим просто кавычки как просили.
        }
    });

    // === ПОДВАЛ И ЛЕГЕНДА ===
    const finalY = (doc as any).lastAutoTable.finalY + 5;
    let bottomY = finalY;

    // Обозначения (Легенда)
    doc.setFontSize(7);
    doc.setFont('Montserrat', 'normal');

    const legendText = '* Обозначения: т - теория, пр - практика, пз - проверка знаний, пер - пересдача. В ячейках: Часы / Оценка.';
    doc.text(legendText, margin, bottomY);

    bottomY += 15;

    // Линия для подписи
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.line(margin, bottomY, margin + 60, bottomY);

    // Текст подписи
    doc.setFontSize(9);
    doc.setFont('Montserrat', 'normal');
    doc.text(`Инструктор: ${data.instructorName || ''}`, margin, bottomY + 5);

    // Дата формирования
    const currentDate = new Date();
    const formattedDate = formatDate(currentDate.toISOString());
    doc.text(
        `Дата: ${formattedDate}`,
        pageWidth - margin,
        bottomY + 5,
        { align: 'right' }
    );

    // Сохраняем PDF
    const fileName = `Vedomost_${data.groupCode}.pdf`;
    doc.save(fileName);
}
