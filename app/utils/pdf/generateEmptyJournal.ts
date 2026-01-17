import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface EmptyJournalData {
    groupCode: string;
    courseName?: string;
    startDate?: string;
    endDate?: string;
    studentNames: string[];
    columnCount?: number; // Количество пустых колонок (по умолчанию 20)
}

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
 * Генерирует PDF-журнал с пустыми ячейками для ручного заполнения
 */
export async function generateEmptyJournal(data: EmptyJournalData): Promise<void> {
    // Создаем документ в КНИЖНОЙ ориентации (portrait)
    const doc = new jsPDF({
        orientation: 'portrait',
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
    const pageHeight = doc.internal.pageSize.getHeight();
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
    doc.text('ЖУРНАЛ ПОСЕЩАЕМОСТИ', pageWidth / 2, yPosition + 15, {
        align: 'center',
    });

    // Отступ после шапки (учитываем высоту увеличенного логотипа)
    yPosition += 35;

    // Информационный блок
    doc.setFontSize(9);
    doc.setTextColor(...blackColor);

    const labelWidth = 40;
    const valueWidth = pageWidth - margin * 2 - labelWidth - 5;

    // === Информация о курсе и группе ===
    let infoY = yPosition;

    // Учебная программа (курс)
    if (data.courseName) {
        doc.setFont('Montserrat', 'bold');
        doc.text('Учебная программа:', margin, infoY);

        doc.setFont('Montserrat', 'normal');
        const splitCourse = doc.splitTextToSize(data.courseName, valueWidth);
        doc.text(splitCourse, margin + labelWidth, infoY);
        infoY += Math.max(splitCourse.length * 4, 5);
    }

    // Группа
    doc.setFont('Montserrat', 'bold');
    doc.text('Группа:', margin, infoY);
    doc.setFont('Montserrat', 'normal');
    const splitGroup = doc.splitTextToSize(data.groupCode, valueWidth);
    doc.text(splitGroup, margin + labelWidth, infoY);
    infoY += 5;

    // Период
    if (data.startDate && data.endDate) {
        doc.setFont('Montserrat', 'bold');
        doc.text('Период:', margin, infoY);
        doc.setFont('Montserrat', 'normal');
        doc.text(
            `${formatDate(data.startDate)} — ${formatDate(data.endDate)}`,
            margin + labelWidth,
            infoY
        );
        infoY += 5;
    }

    // Обновляем позицию Y
    yPosition = infoY + 5;

    // === ТАБЛИЦА ===

    const columnCount = data.columnCount || 20; // По умолчанию 20 колонок
    const columnWidth = 6; // Ширина каждой колонки 5-7мм

    // Подготовка заголовков таблицы
    const headers: { content: string; styles?: any }[] = [
        { content: '№' },
        { content: 'ФИО слушателя' }
    ];

    // Добавляем пустые колонки для дат
    for (let i = 1; i <= columnCount; i++) {
        headers.push({ content: '' }); // Пустые заголовки для ручного заполнения
    }

    // Подготовка данных таблицы
    const tableData: any[][] = [];

    data.studentNames.forEach((name, index) => {
        const rowData: any[] = [
            index + 1,
            name,
        ];

        // Добавляем пустые ячейки для каждой даты
        for (let i = 0; i < columnCount; i++) {
            rowData.push('');
        }

        tableData.push(rowData);
    });

    // Генерируем таблицу
    autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: yPosition,
        theme: 'grid',
        styles: {
            font: 'Montserrat',
            fontSize: 8,
            cellPadding: 1,
            lineColor: [0, 0, 0],
            textColor: [0, 0, 0],
            lineWidth: 0.1,
            halign: 'center',
            valign: 'middle',
            minCellHeight: 8, // Минимальная высота ячейки для удобства заполнения
        },
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            lineWidth: 0.1,
            lineColor: [0, 0, 0],
            valign: 'middle',
            minCellHeight: 10,
        },
        columnStyles: {
            0: { cellWidth: 10 }, // №
            1: { cellWidth: 50, halign: 'left', overflow: 'linebreak' }, // ФИО
            // Остальные колонки будут иметь фиксированную ширину
            ...Object.fromEntries(
                Array.from({ length: columnCount }, (_, i) => [i + 2, { cellWidth: columnWidth }])
            ),
        },
    });

    // === ПОДВАЛ ===
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    let bottomY = finalY;

    // Проверяем, не выходим ли мы за пределы страницы
    if (bottomY + 30 > pageHeight - margin) {
        // Если места мало, добавляем новую страницу
        doc.addPage();
        bottomY = margin;
    }

    // Место для подписи инструктора
    doc.setFontSize(9);
    doc.setFont('Montserrat', 'normal');

    // Линия для подписи инструктора
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.line(margin, bottomY, margin + 80, bottomY);

    // Текст подписи
    doc.text('Инструктор:', margin, bottomY + 5);
    doc.text('___________________', margin + 25, bottomY + 5);

    bottomY += 10;

    // Линия для подписи
    doc.line(margin, bottomY, margin + 80, bottomY);
    doc.text('Подпись:', margin, bottomY + 5);

    // Дата формирования
    const currentDate = new Date();
    const formattedDate = formatDate(currentDate.toISOString());
    doc.text(
        `Дата формирования: ${formattedDate}`,
        pageWidth - margin,
        bottomY + 5,
        { align: 'right' }
    );

    // Сохраняем PDF
    const fileName = `Pustoy_Zhurnal_${data.groupCode}.pdf`;
    doc.save(fileName);
}
