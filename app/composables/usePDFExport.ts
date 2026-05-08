import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Instructor } from '~/types/instructor';
import type { Student } from '~/types/student';

// ─── Кэш шрифтов: динамически импортируется один раз, переиспользуется ────────
// Dynamic import обеспечивает code splitting — ~800KB шрифтов не входят
// в основной бандл, а загружаются только при первом вызове PDF-экспорта.
let _fontCache: { regular: string; bold: string } | null = null;

async function getMontserratFonts(): Promise<{ regular: string; bold: string }> {
    if (_fontCache) return _fontCache;

    // Шрифты pre-bundled как base64-строки в TS-модулях.
    // Генерируются скриптом из TTF файлов (Google Fonts, полная кириллица).
    // Никакого fetch, никакого FileReader, никаких async-ошибок кодирования.
    const [{ MontserratRegular }, { MontserratBold }] = await Promise.all([
        import('~/assets/fonts/montserrat-regular'),
        import('~/assets/fonts/montserrat-bold'),
    ]);

    _fontCache = { regular: MontserratRegular, bold: MontserratBold };
    return _fontCache;
}

/**
 * Регистрирует шрифт Montserrat в экземпляре jsPDF.
 * Использует pre-bundled base64 — без сети, без runtime-кодирования.
 */
async function registerMontserrat(doc: jsPDF): Promise<void> {
    const { regular, bold } = await getMontserratFonts();

    doc.addFileToVFS('Montserrat-Regular.ttf', regular);
    doc.addFont('Montserrat-Regular.ttf', 'Montserrat', 'normal');

    doc.addFileToVFS('Montserrat-Bold.ttf', bold);
    doc.addFont('Montserrat-Bold.ttf', 'Montserrat', 'bold');

    doc.setFont('Montserrat', 'normal');
}

/**
 * Загружает PNG/JPEG изображение по URL и возвращает base64 data URL.
 * Используется только для логотипа (небольшой файл) — не для шрифтов.
 */
async function loadImageAsDataUrl(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
    const blob = await response.blob();

    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error(`FileReader failed: ${url}`));
        reader.readAsDataURL(blob);
    });
}

/**
 * Форматирует дату в формат DD.MM.YYYY
 */
function formatDate(dateStr?: string | Date | null): string {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU');
}

export const usePDFExport = () => {
    /**
     * Добавляет полупрозрачный водяной знак (логотип) на страницу
     */
    const addWatermark = (pdfDoc: any, logoDataUrl: string, pageWidth: number, pageHeight: number) => {
        if (!logoDataUrl) return;
        try {
            const imgProps = pdfDoc.getImageProperties(logoDataUrl);
            const logoWidth = 140;
            const logoHeight = (imgProps.height * logoWidth) / imgProps.width;

            pdfDoc.saveGraphicsState();

            const GState = (pdfDoc as any).GState || (pdfDoc.constructor as any).GState;
            if (GState) {
                pdfDoc.setGState(new GState({ opacity: 0.1 }));
            }

            pdfDoc.addImage(
                logoDataUrl,
                'PNG',
                (pageWidth - logoWidth) / 2,
                (pageHeight - logoHeight) / 2 - 15,
                logoWidth,
                logoHeight,
                undefined,
                'FAST'
            );

            pdfDoc.restoreGraphicsState();
        } catch (e) {
            console.warn('Ошибка добавления водяного знака:', e);
        }
    };

    /**
     * Экспорт квалификационной карточки инструктора в PDF
     */
    const exportInstructorProfile = async (instructor: Instructor) => {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        // Регистрируем шрифт через pre-bundled base64 (объединенный Latin + Cyrillic)
        try {
            await registerMontserrat(doc);
        } catch (e) {
            console.error('Не удалось загрузить шрифт Montserrat:', e);
            doc.setFont('helvetica');
        }

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        let y = 15;

        // Логотип для водяного знака
        let logoDataUrl = '';
        try {
            logoDataUrl = await loadImageAsDataUrl('/logo.png');
        } catch (_) { /* водяной знак необязателен */ }

        addWatermark(doc, logoDataUrl, pageWidth, pageHeight);

        // Заголовок (в точности как на рисунке)
        doc.setFont('Montserrat', 'bold');
        doc.setFontSize(14);
        doc.text('PERSONAL QUALIFICATION CARD', pageWidth / 2, y, { align: 'center' });
        doc.text('КВАЛИФИКАЦИОННАЯ КАРТОЧКА ПЕРСОНАЛА', pageWidth / 2, y + 6, { align: 'center' });

        y += 15;

        // Фотография (справа)
        const photoWidth = 28;
        const photoHeight = 36;
        const photoX = pageWidth - margin - photoWidth;
        const photoY = y + 5;

        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.rect(photoX, photoY, photoWidth, photoHeight);

        if (instructor.photo_base64) {
            try {
                let format: 'JPEG' | 'PNG' | 'WEBP' = 'JPEG';
                if (instructor.photo_base64.includes('image/png')) format = 'PNG';
                else if (instructor.photo_base64.includes('image/webp')) format = 'WEBP';
                doc.addImage(instructor.photo_base64, format, photoX, photoY, photoWidth, photoHeight);
            } catch (_) {
                doc.setFontSize(10);
                doc.text('Фото\n3х4', photoX + photoWidth / 2, photoY + photoHeight / 2, { align: 'center' });
            }
        } else {
            doc.setFontSize(10);
            doc.text('Фото\n3х4', photoX + photoWidth / 2, photoY + photoHeight / 2, { align: 'center' });
        }

        // Основные поля
        doc.setFontSize(10);
        const fieldWidth = photoX - margin - 5;
        const lineYOffset = 1;

        const drawField = (num: number, label: string, value: string, yPos: number) => {
            const prefix = `${num}.  ${label}: `;
            doc.setFont('Montserrat', 'normal');
            doc.text(prefix, margin, yPos);

            const labelWidth = doc.getTextWidth(prefix);
            const valueX = margin + labelWidth;

            doc.setFont('Montserrat', 'bold');
            doc.text(String(value || ''), valueX, yPos);

            doc.setDrawColor(0);
            doc.setLineWidth(0.1);
            doc.line(valueX, yPos + lineYOffset, margin + fieldWidth, yPos + lineYOffset);
        };

        drawField(1, 'Ф.И.О./Full Name', instructor.fullName, y + 5);
        drawField(2, 'Дата рождения/Date of birth', formatDate(instructor.birthDate), y + 12);
        drawField(3, 'Дата принятия на работу/Date of employment', formatDate(instructor.hireDate), y + 19);
        drawField(4, 'Должность/Position', instructor.academic_rank || 'Инструктор', y + 26);
        drawField(5, 'Мобильный телефон/Mobile phone', instructor.phone || '—', y + 33);
        drawField(6, 'E-mail', instructor.email || '—', y + 40);

        y += 50;
        doc.setFont('Montserrat', 'normal');
        doc.text('7.  Образование/Education:', margin, y);
        y += 4;

        // Таблица 7: Образование
        autoTable(doc, {
            startY: y,
            margin: { left: margin, right: margin },
            head: [[
                { content: 'Учебное заведение / Institution', styles: { halign: 'center' } },
                { content: 'Специальность / Specialty', styles: { halign: 'center' } },
                { content: 'Годы / Years', styles: { halign: 'center' } },
                { content: 'Диплом (\u0421ерия / \u2116)', styles: { halign: 'center' } },
            ]],
            body: (instructor.education_history?.length ? (instructor.education_history as any[]) : [{
                university: instructor.university || '—',
                specialty: instructor.specialty || '—',
                education: instructor.education || '—',
                diploma_series: '',
                diploma_number: '',
                year_start: null,
                year_end: null,
            }]).map(edu => {
                const universityLine = [edu.university, edu.education].filter(Boolean).join(', ') || '—';
                const specialtyLine = edu.specialty || '—';
                const yearsLine = (edu.year_start || edu.year_end)
                    ? `${edu.year_start || '?'} – ${edu.year_end || '?'}`
                    : (edu.date_start || edu.date_end
                        ? `${edu.date_start ? new Date(edu.date_start).getFullYear() : '?'} – ${edu.date_end ? new Date(edu.date_end).getFullYear() : '?'}`
                        : '—');
                const diplomaId = [edu.diploma_series, edu.diploma_number].filter(Boolean).join(' ') || '—';

                return [
                    universityLine,
                    specialtyLine,
                    yearsLine,
                    diplomaId,
                ];
            }),
            theme: 'grid',
            styles: { font: 'Montserrat', fontSize: 8, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1, halign: 'left', cellPadding: 2.5 },
            headStyles: { fillColor: [255, 255, 255], font: 'Montserrat', fontStyle: 'bold', halign: 'center', fontSize: 8 },
            columnStyles: {
                2: { cellWidth: 22, halign: 'center' },
                3: { cellWidth: 30, halign: 'center' },
            }
        });

        y = (doc as any).lastAutoTable.finalY + 10;
        doc.setFont('Montserrat', 'normal');
        doc.text('8.  Пройденные курсы/Completed Trainings:', margin, y);
        y += 4;

        // Таблица 8: Курсы
        autoTable(doc, {
            startY: y,
            margin: { left: margin, right: margin },
            head: [[
                { content: 'Наименование курса / Course names', styles: { halign: 'center' } },
                { content: 'Серия / Series', styles: { halign: 'center' } },
                { content: '№ сертификата / No.', styles: { halign: 'center' } },
                { content: 'Дата / Date', styles: { halign: 'center' } },
            ]],
            body: (instructor.certificates?.length ? (instructor.certificates as any[]) : [{ name: '—', date: '', series: '', certificate_number: '' }]).map(cert => [
                cert.name || '—',
                cert.series || '—',
                cert.certificate_number ? `№ ${cert.certificate_number}` : '—',
                formatDate(cert.date) || '—',
            ]),
            theme: 'grid',
            styles: { font: 'Montserrat', fontSize: 8, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1, halign: 'left', cellPadding: 2.5 },
            headStyles: { fillColor: [255, 255, 255], font: 'Montserrat', fontStyle: 'bold', halign: 'center', fontSize: 8 },
            columnStyles: {
                1: { cellWidth: 22, halign: 'center' },
                2: { cellWidth: 28, halign: 'center' },
                3: { cellWidth: 30, halign: 'center' },
            }
        });

        y = (doc as any).lastAutoTable.finalY + 10;
        doc.setFont('Montserrat', 'normal');
        doc.text('9.  Опыт работы/Work Experience:', margin, y);
        y += 4;

        // Таблица 9: Опыт
        autoTable(doc, {
            startY: y,
            margin: { left: margin, right: margin },
            head: [[
                { content: 'Работодатель / Employer', styles: { halign: 'center' } },
                { content: 'Должность / Position', styles: { halign: 'center' } },
                { content: 'Период / Period', styles: { halign: 'center' } },
            ]],
            body: (instructor.work_experience?.length ? instructor.work_experience : [{ employer: '—', position: '—', period: '—' }]).map(exp => [
                exp.employer || '—',
                exp.position || '—',
                exp.period || '—',
            ]),
            theme: 'grid',
            styles: { font: 'Montserrat', fontSize: 9, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1, halign: 'left', cellPadding: 3 },
            headStyles: { fillColor: [255, 255, 255], font: 'Montserrat', fontStyle: 'bold', halign: 'center' },
            columnStyles: { 2: { cellWidth: 40, halign: 'center' } }
        });

        // Футер
        doc.setFontSize(8);
        doc.setFont('Montserrat', 'normal');
        doc.text(`Документ сформирован через платформу ATC Platform. Дата: ${formatDate(new Date())}`, margin, pageHeight - 10);

        doc.save(`Qualification_Card_${instructor.fullName.replace(/\s+/g, '_')}.pdf`);
    };

    /**
     * Экспорт справки о слушателе в PDF
     */
    const exportStudentProfile = async (student: Student, courses: any[] = []) => {
        const doc = new jsPDF({
            orientation: 'landscape',
            unit: 'mm',
            format: 'a4',
        });

        // Регистрируем шрифт
        try {
            await registerMontserrat(doc);
        } catch (e) {
            console.error('Не удалось загрузить шрифт Montserrat:', e);
            doc.setFont('helvetica');
        }

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        let y = margin;

        // Логотип для водяного знака
        let logoDataUrl = '';
        try {
            logoDataUrl = await loadImageAsDataUrl('/logo.png');
        } catch (_) { }

        addWatermark(doc, logoDataUrl, pageWidth, pageHeight);

        // Шапка — Центрированный заголовок
        doc.setFont('Montserrat', 'bold');
        doc.setFontSize(14);
        doc.text('ИНДИВИДУАЛЬНАЯ КАРТОЧКА СЛУШАТЕЛЯ', pageWidth / 2, y + 5, { align: 'center' });
        y += 15;

        // 1. Общие сведения
        doc.setFontSize(10);
        doc.text('1.    Общие сведения:', margin, y);
        y += 7;

        // Фотография 3х4 (24х32мм) справа
        const photoWidth = 24;
        const photoHeight = 32;
        const photoX = pageWidth - margin - photoWidth;
        const photoY = y - 8;

        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.rect(photoX, photoY, photoWidth, photoHeight);

        if (student.photo_base64) {
            try {
                let format: 'JPEG' | 'PNG' | 'WEBP' = 'JPEG';
                if (student.photo_base64.includes('image/png')) format = 'PNG';
                else if (student.photo_base64.includes('image/webp')) format = 'WEBP';
                doc.addImage(student.photo_base64, format, photoX, photoY, photoWidth, photoHeight);
            } catch (_) {
                doc.setFontSize(8);
                doc.text('Фото 3х4', photoX + photoWidth / 2, photoY + photoHeight / 2, { align: 'center' });
            }
        } else {
            doc.setFontSize(8);
            doc.text('Фото 3х4', photoX + photoWidth / 2, photoY + photoHeight / 2, { align: 'center' });
        }

        // Поля данных (Общие сведения)
        const drawLineField = (label: string, value: string, currentY: number) => {
            doc.setFont('Montserrat', 'normal');
            doc.text(`—  ${label}: `, margin + 5, currentY);
            const labelWidth = doc.getTextWidth(`—  ${label}: `);
            doc.setFont('Montserrat', 'bold');
            doc.text(value || '—', margin + 5 + labelWidth, currentY);
            
            // Линия под значением
            const lineStartX = margin + 5 + labelWidth;
            const lineEndX = photoX - 10;
            doc.setLineWidth(0.1);
            doc.line(lineStartX, currentY + 1, lineEndX, currentY + 1);
        };

        drawLineField('ФИО', student.fullName, y);
        y += 7;
        drawLineField('Дата рождения', formatDate(student.birthDate), y);
        y += 7;
        drawLineField('Подразделение / должность', `${student.department || ''} / ${student.position || ''}`, y);
        y += 7;
        drawLineField('Организация', student.organization, y);
        y += 10;

        // 2. История обучения
        doc.setFont('Montserrat', 'bold');
        doc.text('2.    История обучения в Центре', margin, y);
        y += 5;

        // Подготавливаем данные для таблицы
        // Объединяем курсы и сертификаты для полной истории
        const tableBody = courses.map((c, index) => {
            const cert = student.certificates?.find((cert: any) => cert.course_id === c.course_id || cert.courseName === c.course_name);
            return [
                index + 1,
                c.course_name || '—',
                c.course_code || '—',
                `${formatDate(c.start_date)} - ${formatDate(c.end_date)}`,
                c.status === 'completed' ? `${c.progress || 100}%` : 'В процессе',
                cert ? 'Сертификат' : (c.status === 'completed' ? 'Справка' : '—'),
                cert?.certificateNumber || '—',
                formatDate(cert?.issueDate) || '—'
            ];
        });

        autoTable(doc, {
            startY: y,
            margin: { left: margin, right: margin },
            head: [[
                { content: '№ п/п', styles: { halign: 'center' } },
                { content: 'Наименование курса', styles: { halign: 'center' } },
                { content: 'Код курса', styles: { halign: 'center' } },
                { content: 'Даты обучения', styles: { halign: 'center' } },
                { content: 'Результат (оценка/зачет)', styles: { halign: 'center' } },
                { content: 'Выданный документ', styles: { halign: 'center' } },
                { content: 'Номер документа', styles: { halign: 'center' } },
                { content: 'Дата выдачи', styles: { halign: 'center' } }
            ]],
            body: tableBody.length > 0 ? tableBody : [['—', 'Данные отсутствуют', '—', '—', '—', '—', '—', '—']],
            theme: 'grid',
            styles: { 
                font: 'Montserrat', 
                fontSize: 8, 
                textColor: [0, 0, 0], 
                lineColor: [0, 0, 0], 
                lineWidth: 0.1, 
                cellPadding: 2 
            },
            headStyles: { 
                fillColor: [255, 255, 255], 
                fontStyle: 'bold', 
                textColor: [0, 0, 0] 
            },
            columnStyles: {
                0: { cellWidth: 10, halign: 'center' },
                1: { cellWidth: 'auto' },
                2: { cellWidth: 20, halign: 'center' },
                3: { cellWidth: 35, halign: 'center' },
                4: { cellWidth: 25, halign: 'center' },
                5: { cellWidth: 30, halign: 'center' },
                6: { cellWidth: 25, halign: 'center' },
                7: { cellWidth: 25, halign: 'center' },
            }
        });

        // Футер
        const finalY = (doc as any).lastAutoTable.finalY || y;
        doc.setFontSize(8);
        doc.setFont('Montserrat', 'normal');
        doc.text(`Документ сформирован через платформу ATC Platform. Дата: ${formatDate(new Date())}`, margin, pageHeight - 10);

        doc.save(`Student_Card_${student.fullName.replace(/\s+/g, '_')}.pdf`);
    };

    return {
        exportInstructorProfile,
        exportStudentProfile,
    };
};
