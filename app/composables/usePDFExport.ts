import jsPDF from 'jspdf';
import type { Instructor } from '~/types/instructor';
import type { Student } from '~/types/student';

/**
 * Загрузка ресурса по URL и конвертация в base64
 */
async function loadResource(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to load resource: ${url}`);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            if (base64) resolve(base64);
            else reject(new Error('Failed to convert to base64'));
        };
        reader.onerror = reject;
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
     * Вспомогательная функция для добавления водяного знака
     */
    const addWatermark = (pdfDoc: any, logoData: string, pageWidth: number, pageHeight: number) => {
        if (!logoData) return;
        try {
            const imgProps = pdfDoc.getImageProperties(logoData);
            const logoWidth = 140;
            const logoHeight = (imgProps.height * logoWidth) / imgProps.width;
            
            pdfDoc.saveGraphicsState();
            
            // Устанавливаем прозрачность через GState
            const GState = (pdfDoc as any).GState || (pdfDoc.constructor as any).GState;
            if (GState) {
                pdfDoc.setGState(new GState({ opacity: 0.1 })); // Чуть заметнее
            }
            
            // Смещаем чуть выше центра
            const xPos = (pageWidth - logoWidth) / 2;
            const yPos = (pageHeight - logoHeight) / 2 - 15;
            
            pdfDoc.addImage(
                logoData, 
                'PNG', 
                xPos, 
                yPos, 
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
     * Экспорт профиля/справки инструктора в PDF
     */
    const exportInstructorProfile = async (instructor: Instructor) => {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        // 1. Загрузка шрифтов
        let fontRegular = '';
        let fontBold = '';
        try {
            fontRegular = await loadResource('https://raw.githubusercontent.com/JulietaUla/Montserrat/master/fonts/ttf/Montserrat-Regular.ttf');
            fontBold = await loadResource('https://raw.githubusercontent.com/JulietaUla/Montserrat/master/fonts/ttf/Montserrat-Bold.ttf');

            doc.addFileToVFS('Montserrat-Regular.ttf', fontRegular);
            doc.addFont('Montserrat-Regular.ttf', 'Montserrat', 'normal');

            doc.addFileToVFS('Montserrat-Bold.ttf', fontBold);
            doc.addFont('Montserrat-Bold.ttf', 'Montserrat', 'bold');

            doc.setFont('Montserrat', 'normal');
        } catch (e) {
            console.error('Ошибка загрузки шрифта:', e);
            doc.setFont('helvetica');
        }

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        let y = margin;

        // Загрузка логотипа для водяного знака
        let logoData = '';
        try {
            const base64 = await loadResource('/logo.png');
            logoData = `data:image/png;base64,${base64}`;
        } catch (e) {}

        addWatermark(doc, logoData, pageWidth, pageHeight);

        // 2. Шапка
        doc.setFont('Montserrat', 'bold');
        doc.setFontSize(16);
        doc.text('СПРАВКА-ОБЪЕКТИВКА', pageWidth / 2, y + 10, { align: 'center' });
        doc.setFontSize(12);
        doc.text('на инструктора учебного центра', pageWidth / 2, y + 18, { align: 'center' });

        y += 40;

        // 3. Фотография (справа)
        if (instructor.photo_base64) {
            try {
                const photoWidth = 35;
                const photoHeight = 45;
                
                let format: 'JPEG' | 'PNG' | 'WEBP' = 'JPEG';
                if (instructor.photo_base64.includes('image/png')) format = 'PNG';
                else if (instructor.photo_base64.includes('image/webp')) format = 'WEBP';

                doc.addImage(instructor.photo_base64, format, pageWidth - margin - photoWidth, y, photoWidth, photoHeight);
                doc.setDrawColor(200, 200, 200);
                doc.rect(pageWidth - margin - photoWidth, y, photoWidth, photoHeight);
            } catch (e) {
                console.error('Ошибка добавления фото:', e);
            }
        }

        // 4. Основная информация
        doc.setFont('Montserrat', 'bold');
        doc.setFontSize(14);
        doc.text(instructor.fullName.toUpperCase(), margin, y + 5);

        y += 15;
        doc.setFontSize(10);
        doc.setFont('Montserrat', 'normal');
        
        const infoItems = [
            { label: 'Дата рождения:', value: formatDate(instructor.birthDate) },
            { label: 'Паспорт:', value: instructor.passportData || '—' },
            { label: 'Email:', value: instructor.email || '—' },
            { label: 'Телефон:', value: instructor.phone || '—' },
            { label: 'Дата приема:', value: formatDate(instructor.hireDate) },
            { label: 'Контракт:', value: instructor.contractInfo || '—' },
        ];

        infoItems.forEach(item => {
            doc.setFont('Montserrat', 'bold');
            doc.text(item.label, margin, y);
            doc.setFont('Montserrat', 'normal');
            doc.text(item.value, margin + 40, y);
            y += 7;
        });

        y += 10;
        doc.setDrawColor(230, 230, 230);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;

        // 6. Квалификация
        doc.setFont('Montserrat', 'bold');
        doc.setFontSize(12);
        doc.text('ОБРАЗОВАНИЕ И КВАЛИФИКАЦИЯ', margin, y);
        y += 8;

        const qualItems = [
            { label: 'Образование:', value: instructor.education || '—' },
            { label: 'ВУЗ:', value: instructor.university || '—' },
            { label: 'Специальность:', value: instructor.specialty || '—' },
            { label: 'Степень:', value: instructor.academic_degree || '—' },
            { label: 'Звание:', value: instructor.academic_rank || '—' },
            { label: 'Языки:', value: instructor.languages?.join(', ') || '—' },
        ];

        doc.setFontSize(10);
        qualItems.forEach(item => {
            doc.setFont('Montserrat', 'bold');
            doc.text(item.label, margin, y);
            doc.setFont('Montserrat', 'normal');
            const splitVal = doc.splitTextToSize(item.value, pageWidth - margin * 2 - 45);
            doc.text(splitVal, margin + 40, y);
            y += Math.max(splitVal.length * 5, 7);
        });

        y += 5;

        // 7. Сертификаты
        if (instructor.certificates?.length) {
            doc.setFont('Montserrat', 'bold');
            doc.setFontSize(12);
            doc.text('СЕРТИФИКАТЫ', margin, y);
            y += 8;
            doc.setFontSize(10);
            doc.setFont('Montserrat', 'normal');

            instructor.certificates.forEach((cert, idx) => {
                if (y > 260) { 
                    doc.addPage(); 
                    addWatermark(doc, logoData, pageWidth, pageHeight);
                    y = margin + 10; 
                }
                const text = `${idx + 1}. ${cert.name} (${formatDate(cert.date)})`;
                const splitCert = doc.splitTextToSize(text, pageWidth - margin * 2);
                doc.text(splitCert, margin, y);
                y += splitCert.length * 5 + 2;
            });
        }

        y = 280;
        doc.setFontSize(8);
        doc.setFont('Montserrat', 'normal');
        doc.text(`Сформировано в системе ATC Platform: ${formatDate(new Date())}`, margin, y);
        
        doc.setFont('Montserrat', 'bold');
        doc.text('М.П.', pageWidth - margin - 20, 260);
        doc.line(pageWidth - margin - 60, 265, pageWidth - margin, 265);
        doc.setFont('Montserrat', 'normal');
        doc.text('(подпись ответственного лица)', pageWidth - margin - 55, 270);

        doc.save(`Profile_${instructor.fullName.replace(/\s+/g, '_')}.pdf`);
    };

    /**
     * Экспорт профиля/справки студента в PDF
     */
    const exportStudentProfile = async (student: Student, courses: any[] = []) => {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        // 1. Загрузка шрифтов
        let fontRegular = '';
        let fontBold = '';
        try {
            fontRegular = await loadResource('https://raw.githubusercontent.com/JulietaUla/Montserrat/master/fonts/ttf/Montserrat-Regular.ttf');
            fontBold = await loadResource('https://raw.githubusercontent.com/JulietaUla/Montserrat/master/fonts/ttf/Montserrat-Bold.ttf');

            doc.addFileToVFS('Montserrat-Regular.ttf', fontRegular);
            doc.addFont('Montserrat-Regular.ttf', 'Montserrat', 'normal');

            doc.addFileToVFS('Montserrat-Bold.ttf', fontBold);
            doc.addFont('Montserrat-Bold.ttf', 'Montserrat', 'bold');

            doc.setFont('Montserrat', 'normal');
        } catch (e) {
            console.error('Ошибка загрузки шрифта:', e);
            doc.setFont('helvetica');
        }

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        let y = margin;

        // Загрузка логотипа один раз для переиспользования
        let logoData = '';
        try {
            const base64 = await loadResource('/logo.png');
            logoData = `data:image/png;base64,${base64}`;
        } catch (e) {}

        // Добавляем водяной знак на первую страницу
        addWatermark(doc, logoData, pageWidth, pageHeight);

        // 2. Шапка
        doc.setFont('Montserrat', 'bold');
        doc.setFontSize(16);
        doc.text('СПРАВКА О СЛУШАТЕЛЕ', pageWidth / 2, y + 10, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('Montserrat', 'normal');
        doc.text('Карточка учета обучения и профессиональной подготовки', pageWidth / 2, y + 16, { align: 'center' });

        y += 35;

        // 3. Фотография
        if (student.photo_base64) {
            try {
                const photoWidth = 35;
                const photoHeight = 45;
                
                let format: 'JPEG' | 'PNG' | 'WEBP' = 'JPEG';
                if (student.photo_base64.includes('image/png')) format = 'PNG';
                else if (student.photo_base64.includes('image/webp')) format = 'WEBP';

                doc.addImage(student.photo_base64, format, pageWidth - margin - photoWidth, y, photoWidth, photoHeight);
                doc.setDrawColor(220, 220, 220);
                doc.rect(pageWidth - margin - photoWidth, y, photoWidth, photoHeight);
            } catch (e) {
                console.error('Ошибка добавления фото в PDF:', e);
            }
        }

        // 4. Основные данные
        doc.setFont('Montserrat', 'bold');
        doc.setFontSize(14);
        doc.text(student.fullName.toUpperCase(), margin, y + 5);

        y += 15;
        doc.setFontSize(10);
        
        const mainInfo = [
            { label: 'ПИНФЛ:', value: student.pinfl },
            { label: 'Дата рождения:', value: formatDate(student.birthDate) },
            { label: 'Организация:', value: student.organization },
            { label: 'Подразделение:', value: student.department || '—' },
            { label: 'Должность:', value: student.position },
        ];

        mainInfo.forEach(item => {
            doc.setFont('Montserrat', 'bold');
            doc.text(item.label, margin, y);
            doc.setFont('Montserrat', 'normal');
            const splitVal = doc.splitTextToSize(item.value, pageWidth - margin * 2 - 50);
            doc.text(splitVal, margin + 40, y);
            y += Math.max(splitVal.length * 5, 7);
        });

        y += 10;
        doc.setDrawColor(240, 240, 240);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;

        // 5. История обучения (Курсы)
        if (courses.length > 0) {
            doc.setFont('Montserrat', 'bold');
            doc.setFontSize(12);
            doc.text('ИСТОРИЯ ОБУЧЕНИЯ (КУРСЫ)', margin, y);
            y += 8;

            doc.setFontSize(9);
            const headers = ['Название курса', 'Период', 'Часы', 'Результат'];
            const colWidths = [70, 45, 20, 35];
            
            doc.setFillColor(245, 245, 245);
            doc.rect(margin, y - 5, pageWidth - margin * 2, 7, 'F');
            doc.setFont('Montserrat', 'bold');
            let x = margin + 2;
            headers.forEach((h, i) => {
                doc.text(h, x, y);
                x += (colWidths[i] as number);
            });
            y += 7;

            doc.setFont('Montserrat', 'normal');
            courses.forEach(course => {
                if (y > 270) { 
                    doc.addPage(); 
                    addWatermark(doc, logoData, pageWidth, pageHeight);
                    y = margin + 10; 
                }
                
                const period = `${formatDate(course.start_date)} - ${formatDate(course.end_date)}`;
                const result = course.status === 'completed' ? `Завершен (${course.progress}%)` : 'В процессе';
                
                const splitName = doc.splitTextToSize(course.course_name, (colWidths[0] as number) - 5);
                
                let curX = margin + 2;
                doc.text(splitName, curX, y);
                curX += (colWidths[0] as number);
                doc.text(period, curX, y);
                curX += (colWidths[1] as number);
                doc.text(course.total_lessons ? `${course.total_lessons} ач` : '—', curX, y);
                curX += (colWidths[2] as number);
                doc.text(result, curX, y);
                
                y += Math.max(splitName.length * 4.5, 6);
                doc.setDrawColor(245, 245, 245);
                doc.line(margin, y - 3, pageWidth - margin, y - 3);
            });
            y += 10;
        }

        // 6. Выданные сертификаты
        if (student.certificates?.length > 0) {
            if (y > 250) { 
                doc.addPage(); 
                addWatermark(doc, logoData, pageWidth, pageHeight); 
                y = margin + 10; 
            }
            doc.setFont('Montserrat', 'bold');
            doc.setFontSize(12);
            doc.text('ВЫДАННЫЕ СЕРТИФИКАТЫ', margin, y);
            y += 8;

            doc.setFontSize(9);
            doc.setFont('Montserrat', 'normal');
            student.certificates.forEach((cert: any, idx: number) => {
                if (y > 270) { 
                    doc.addPage(); 
                    addWatermark(doc, logoData, pageWidth, pageHeight);
                    y = margin + 10; 
                }
                const text = `${idx + 1}. № ${cert.certificateNumber} — ${cert.courseName} (Выдан: ${formatDate(cert.issueDate)})`;
                const splitCert = doc.splitTextToSize(text, pageWidth - margin * 2);
                doc.text(splitCert, margin, y);
                y += splitCert.length * 5 + 1;
            });
        }

        // 7. Подвал
        y = 275;
        doc.setFontSize(8);
        doc.setFont('Montserrat', 'normal');
        doc.text(`Документ сформирован автоматически в системе ATC Platform. Дата: ${formatDate(new Date())}`, margin, y);
        doc.text(`ID студента: ${student.id}`, margin, y + 4);

        doc.save(`Student_Report_${student.fullName.replace(/\s+/g, '_')}.pdf`);
    };

    return {
        exportInstructorProfile,
        exportStudentProfile
    };
};
