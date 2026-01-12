/**
 * Генератор PDF для сертификатов на основе визуального редактора
 * 
 * Использует Puppeteer для рендеринга HTML в PDF с высоким качеством.
 * Поддерживает все типы элементов: текст, переменные, изображения, QR-коды, фигуры.
 */

import puppeteer from 'puppeteer';
import QRCode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';
import type {
  CertificateTemplateData,
  TemplateElement,
  TextElement,
  VariableElement,
  ImageElement,
  QRElement,
  ShapeElement,
  VariableSource,
  TemplateLayout,
} from '../types/certificate';

// ============================================================================
// КОНТЕКСТ ПЕРЕМЕННЫХ
// ============================================================================

export interface VariableContext {
  student: {
    id: string;
    fullName: string;
    organization: string;
    position: string;
    department?: string | null;
    pinfl: string;
  };
  course: {
    id: string;
    name: string;
    shortName: string;
    code: string;
    totalHours: number;
  };
  group: {
    id: string;
    code: string;
    startDate: Date | string;
    endDate: Date | string;
    classroom?: string | null;
  };
  certificate: {
    number: string;
    issueDate: Date;
    verificationUrl?: string;
  };
}

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================================

/**
 * Сокращённое ФИО (Иванов И.И.)
 */
function getShortName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return fullName;
  
  const lastName = parts[0];
  const initials = parts.slice(1).map(p => p.charAt(0).toUpperCase() + '.').join('');
  
  return `${lastName} ${initials}`.trim();
}

/**
 * Форматировать дату как "26 декабря 2025 года"
 */
function formatDateFormatted(date: Date | string): string {
  const d = new Date(date);
  const months = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
  ];
  
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} года`;
}

/**
 * Форматировать дату как ДД.ММ.ГГГГ
 */
function formatDate(date: Date | string): string {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}.${month}.${year}`;
}

/**
 * Получить значение переменной по ключу
 */
export function resolveVariable(
  key: VariableSource,
  context: VariableContext
): string {
  const { student, course, group, certificate } = context;
  const fullName = student.fullName;
  const nameParts = fullName.split(/\s+/);

  switch (key) {
    // Студент
    case 'student.fullName':
      return student.fullName;
    case 'student.shortName':
      return getShortName(student.fullName);
    case 'student.lastName':
      return nameParts[0] || '';
    case 'student.firstName':
      return nameParts[1] || '';
    case 'student.middleName':
      return nameParts[2] || '';
    case 'student.organization':
      return student.organization;
    case 'student.position':
      return student.position;
    case 'student.department':
      return student.department || '';
    case 'student.pinfl':
      return student.pinfl;
    
    // Курс
    case 'course.name':
      return course.name;
    case 'course.shortName':
      return course.shortName;
    case 'course.code':
      return course.code;
    case 'course.totalHours':
      return course.totalHours.toString();
    case 'course.description':
      return '';
    
    // Группа
    case 'group.code':
      return group.code;
    case 'group.startDate':
      return formatDate(group.startDate);
    case 'group.endDate':
      return formatDate(group.endDate);
    case 'group.classroom':
      return group.classroom || '';
    
    // Сертификат
    case 'certificate.number':
      return certificate.number;
    case 'certificate.issueDate':
      return formatDate(certificate.issueDate);
    case 'certificate.issueDateFormatted':
      return formatDateFormatted(certificate.issueDate);
    
    // Кастомное
    case 'custom':
      return '';
    
    default:
      console.warn(`[pdfGenerator] Unknown variable: ${key}`);
      return `[${key}]`;
  }
}

// ============================================================================
// ГЕНЕРАЦИЯ HTML
// ============================================================================

/**
 * Генерировать QR-код как data URL
 */
async function generateQRDataUrl(
  data: string,
  options: { size: number; color: string; backgroundColor: string }
): Promise<string> {
  return await QRCode.toDataURL(data, {
    width: options.size,
    margin: 1,
    color: {
      dark: options.color,
      light: options.backgroundColor,
    },
  });
}

/**
 * Конвертировать элемент в HTML
 */
async function elementToHtml(
  element: TemplateElement,
  context: VariableContext
): Promise<string> {
  const baseStyles = `
    position: absolute;
    left: ${element.x}px;
    top: ${element.y}px;
    width: ${element.width}px;
    height: ${element.height}px;
    ${element.rotation ? `transform: rotate(${element.rotation}deg);` : ''}
  `;

  switch (element.type) {
    case 'text': {
      const el = element as TextElement;
      const textStyles = `
        font-family: '${el.fontFamily}', sans-serif;
        font-size: ${el.fontSize}px;
        font-weight: ${el.fontWeight};
        font-style: ${el.fontStyle};
        text-align: ${el.textAlign};
        color: ${el.color};
        line-height: ${el.lineHeight};
        display: flex;
        align-items: center;
        justify-content: ${el.textAlign === 'left' ? 'flex-start' : el.textAlign === 'right' ? 'flex-end' : 'center'};
        white-space: pre-wrap;
        word-break: break-word;
      `;
      return `<div style="${baseStyles}${textStyles}">${escapeHtml(el.content)}</div>`;
    }

    case 'variable': {
      const el = element as VariableElement;
      const value = resolveVariable(el.variableKey, context);
      const textStyles = `
        font-family: '${el.fontFamily}', sans-serif;
        font-size: ${el.fontSize}px;
        font-weight: ${el.fontWeight};
        font-style: ${el.fontStyle};
        text-align: ${el.textAlign};
        color: ${el.color};
        line-height: ${el.lineHeight};
        display: flex;
        align-items: center;
        justify-content: ${el.textAlign === 'left' ? 'flex-start' : el.textAlign === 'right' ? 'flex-end' : 'center'};
        white-space: pre-wrap;
        word-break: break-word;
      `;
      return `<div style="${baseStyles}${textStyles}">${escapeHtml(value)}</div>`;
    }

    case 'image': {
      const el = element as ImageElement;
      const imageStyles = `
        object-fit: ${el.objectFit};
        opacity: ${el.opacity};
        width: 100%;
        height: 100%;
      `;
      return `<div style="${baseStyles}"><img src="${el.src}" style="${imageStyles}" /></div>`;
    }

    case 'qr': {
      const el = element as QRElement;
      let qrData = '';
      
      switch (el.dataSource) {
        case 'certificate_url':
          qrData = context.certificate.verificationUrl || `https://example.com/verify/${context.certificate.number}`;
          break;
        case 'certificate_number':
          qrData = context.certificate.number;
          break;
        case 'custom':
          qrData = el.customData || '';
          break;
      }

      const qrDataUrl = await generateQRDataUrl(qrData, {
        size: el.size,
        color: el.color,
        backgroundColor: el.backgroundColor,
      });

      return `<div style="${baseStyles}"><img src="${qrDataUrl}" style="width: 100%; height: 100%;" /></div>`;
    }

    case 'shape': {
      const el = element as ShapeElement;
      
      if (el.shapeType === 'rectangle') {
        const shapeStyles = `
          background: ${el.fillColor === 'transparent' ? 'transparent' : el.fillColor};
          border: ${el.strokeWidth}px solid ${el.strokeColor};
          box-sizing: border-box;
        `;
        return `<div style="${baseStyles}${shapeStyles}"></div>`;
      }
      
      if (el.shapeType === 'circle') {
        const shapeStyles = `
          background: ${el.fillColor === 'transparent' ? 'transparent' : el.fillColor};
          border: ${el.strokeWidth}px solid ${el.strokeColor};
          border-radius: 50%;
          box-sizing: border-box;
        `;
        return `<div style="${baseStyles}${shapeStyles}"></div>`;
      }
      
      if (el.shapeType === 'line') {
        // SVG line
        return `
          <svg style="${baseStyles}" viewBox="0 0 ${el.width} ${el.height}">
            <line x1="0" y1="0" x2="${el.width}" y2="${el.height}" 
                  stroke="${el.strokeColor}" stroke-width="${el.strokeWidth}" />
          </svg>
        `;
      }
      
      return '';
    }

    default:
      return '';
  }
}

/**
 * Escape HTML для предотвращения XSS
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, m => map[m] || m);
}

/**
 * Генерировать полный HTML документ для сертификата
 */
async function generateCertificateHtml(
  templateData: CertificateTemplateData,
  context: VariableContext
): Promise<string> {
  // Сортируем элементы по zIndex
  const sortedElements = [...templateData.elements].sort((a, b) => a.zIndex - b.zIndex);
  
  // Генерируем HTML для каждого элемента
  const elementsHtml: string[] = [];
  for (const element of sortedElements) {
    const html = await elementToHtml(element, context);
    elementsHtml.push(html);
  }

  // Фон
  let backgroundStyle = '';
  if (templateData.background) {
    if (templateData.background.type === 'color') {
      backgroundStyle = `background-color: ${templateData.background.value};`;
    } else if (templateData.background.type === 'image') {
      backgroundStyle = `
        background-image: url(${templateData.background.value});
        background-size: cover;
        background-position: center;
      `;
    }
  }

  // Google Fonts для использования в PDF
  const fonts = new Set<string>();
  for (const el of templateData.elements) {
    if (el.type === 'text' || el.type === 'variable') {
      fonts.add((el as TextElement).fontFamily);
    }
  }

  const fontLinks = Array.from(fonts)
    .filter(f => !['Arial', 'Times New Roman', 'Georgia'].includes(f))
    .map(f => `<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(f)}:wght@400;700&display=swap" rel="stylesheet">`)
    .join('\n');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      ${fontLinks}
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        @page {
          size: ${templateData.width}px ${templateData.height}px;
          margin: 0;
        }
        body {
          width: ${templateData.width}px;
          height: ${templateData.height}px;
          position: relative;
          ${backgroundStyle}
          font-family: 'Inter', Arial, sans-serif;
        }
      </style>
    </head>
    <body>
      ${elementsHtml.join('\n')}
    </body>
    </html>
  `;
}

// ============================================================================
// ГЕНЕРАЦИЯ PDF
// ============================================================================

interface GeneratePdfOptions {
  templateData: CertificateTemplateData;
  context: VariableContext;
  outputPath: string;
}

/**
 * Сгенерировать PDF сертификата
 */
export async function generateCertificatePdf(options: GeneratePdfOptions): Promise<void> {
  const { templateData, context, outputPath } = options;

  console.log('[pdfGenerator] Starting PDF generation...');
  console.log(`[pdfGenerator] Template size: ${templateData.width}x${templateData.height}`);
  console.log(`[pdfGenerator] Elements: ${templateData.elements.length}`);

  // Генерируем HTML
  const html = await generateCertificateHtml(templateData, context);

  // Запускаем Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // Устанавливаем размер viewport
    await page.setViewport({
      width: templateData.width,
      height: templateData.height,
      deviceScaleFactor: 2, // Высокое качество
    });

    // Загружаем HTML
    await page.setContent(html, {
      waitUntil: 'networkidle0', // Ждём загрузки шрифтов и изображений
    });

    // Даём время на загрузку шрифтов
    await new Promise(resolve => setTimeout(resolve, 500));

    // Создаём директорию, если не существует
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Генерируем PDF
    await page.pdf({
      path: outputPath,
      width: templateData.width,
      height: templateData.height,
      printBackground: true,
      pageRanges: '1',
    });

    console.log(`[pdfGenerator] PDF saved to: ${outputPath}`);
  } finally {
    await browser.close();
  }
}

/**
 * Сгенерировать PDF как Buffer (без сохранения файла)
 */
export async function generateCertificatePdfBuffer(
  templateData: CertificateTemplateData,
  context: VariableContext
): Promise<Buffer> {
  console.log('[pdfGenerator] Generating PDF buffer...');

  const html = await generateCertificateHtml(templateData, context);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    await page.setViewport({
      width: templateData.width,
      height: templateData.height,
      deviceScaleFactor: 2,
    });

    await page.setContent(html, {
      waitUntil: 'networkidle0',
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    const pdfBuffer = await page.pdf({
      width: templateData.width,
      height: templateData.height,
      printBackground: true,
      pageRanges: '1',
    });

    console.log('[pdfGenerator] PDF buffer generated');
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

// ============================================================================
// ЭКСПОРТ
// ============================================================================

export {
  getShortName,
  formatDateFormatted,
  generateCertificateHtml,
};
