import puppeteer from 'puppeteer';
import QRCode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';

function getShortName(fullName) {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return fullName;
  const lastName = parts[0];
  const initials = parts.slice(1).map((p) => p.charAt(0).toUpperCase() + ".").join("");
  return `${lastName} ${initials}`.trim();
}
function formatDateFormatted(date) {
  const d = new Date(date);
  const months = [
    "\u044F\u043D\u0432\u0430\u0440\u044F",
    "\u0444\u0435\u0432\u0440\u0430\u043B\u044F",
    "\u043C\u0430\u0440\u0442\u0430",
    "\u0430\u043F\u0440\u0435\u043B\u044F",
    "\u043C\u0430\u044F",
    "\u0438\u044E\u043D\u044F",
    "\u0438\u044E\u043B\u044F",
    "\u0430\u0432\u0433\u0443\u0441\u0442\u0430",
    "\u0441\u0435\u043D\u0442\u044F\u0431\u0440\u044F",
    "\u043E\u043A\u0442\u044F\u0431\u0440\u044F",
    "\u043D\u043E\u044F\u0431\u0440\u044F",
    "\u0434\u0435\u043A\u0430\u0431\u0440\u044F"
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} \u0433\u043E\u0434\u0430`;
}
function formatDate(date) {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}
function resolveVariable(key, context) {
  const { student, course, group, certificate } = context;
  const fullName = student.fullName;
  const nameParts = fullName.split(/\s+/);
  switch (key) {
    // Студент
    case "student.fullName":
      return student.fullName;
    case "student.shortName":
      return getShortName(student.fullName);
    case "student.lastName":
      return nameParts[0] || "";
    case "student.firstName":
      return nameParts[1] || "";
    case "student.middleName":
      return nameParts[2] || "";
    case "student.organization":
      return student.organization;
    case "student.position":
      return student.position;
    case "student.department":
      return student.department || "";
    case "student.pinfl":
      return student.pinfl;
    // Курс
    case "course.name":
      return course.name;
    case "course.shortName":
      return course.shortName;
    case "course.code":
      return course.code;
    case "course.totalHours":
      return course.totalHours.toString();
    case "course.description":
      return "";
    // Группа
    case "group.code":
      return group.code;
    case "group.startDate":
      return formatDate(group.startDate);
    case "group.endDate":
      return formatDate(group.endDate);
    case "group.classroom":
      return group.classroom || "";
    // Сертификат
    case "certificate.number":
      return certificate.number;
    case "certificate.issueDate":
      return formatDate(certificate.issueDate);
    case "certificate.issueDateFormatted":
      return formatDateFormatted(certificate.issueDate);
    // Кастомное
    case "custom":
      return "";
    default:
      console.warn(`[pdfGenerator] Unknown variable: ${key}`);
      return `[${key}]`;
  }
}
async function generateQRDataUrl(data, options) {
  return await QRCode.toDataURL(data, {
    width: options.size,
    margin: 1,
    color: {
      dark: options.color,
      light: options.backgroundColor
    }
  });
}
async function elementToHtml(element, context) {
  const baseStyles = `
    position: absolute;
    left: ${element.x}px;
    top: ${element.y}px;
    width: ${element.width}px;
    height: ${element.height}px;
    ${element.rotation ? `transform: rotate(${element.rotation}deg);` : ""}
  `;
  switch (element.type) {
    case "text": {
      const el = element;
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
        justify-content: ${el.textAlign === "left" ? "flex-start" : el.textAlign === "right" ? "flex-end" : "center"};
        white-space: pre-wrap;
        word-break: break-word;
      `;
      return `<div style="${baseStyles}${textStyles}">${escapeHtml(el.content)}</div>`;
    }
    case "variable": {
      const el = element;
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
        justify-content: ${el.textAlign === "left" ? "flex-start" : el.textAlign === "right" ? "flex-end" : "center"};
        white-space: pre-wrap;
        word-break: break-word;
      `;
      return `<div style="${baseStyles}${textStyles}">${escapeHtml(value)}</div>`;
    }
    case "image": {
      const el = element;
      const imageStyles = `
        object-fit: ${el.objectFit};
        opacity: ${el.opacity};
        width: 100%;
        height: 100%;
      `;
      return `<div style="${baseStyles}"><img src="${el.src}" style="${imageStyles}" /></div>`;
    }
    case "qr": {
      const el = element;
      let qrData = "";
      switch (el.dataSource) {
        case "certificate_url":
          qrData = context.certificate.verificationUrl || `https://example.com/verify/${context.certificate.number}`;
          break;
        case "certificate_number":
          qrData = context.certificate.number;
          break;
        case "custom":
          qrData = el.customData || "";
          break;
      }
      const qrDataUrl = await generateQRDataUrl(qrData, {
        size: el.size,
        color: el.color,
        backgroundColor: el.backgroundColor
      });
      return `<div style="${baseStyles}"><img src="${qrDataUrl}" style="width: 100%; height: 100%;" /></div>`;
    }
    case "shape": {
      const el = element;
      if (el.shapeType === "rectangle") {
        const shapeStyles = `
          background: ${el.fillColor === "transparent" ? "transparent" : el.fillColor};
          border: ${el.strokeWidth}px solid ${el.strokeColor};
          box-sizing: border-box;
        `;
        return `<div style="${baseStyles}${shapeStyles}"></div>`;
      }
      if (el.shapeType === "circle") {
        const shapeStyles = `
          background: ${el.fillColor === "transparent" ? "transparent" : el.fillColor};
          border: ${el.strokeWidth}px solid ${el.strokeColor};
          border-radius: 50%;
          box-sizing: border-box;
        `;
        return `<div style="${baseStyles}${shapeStyles}"></div>`;
      }
      if (el.shapeType === "line") {
        return `
          <svg style="${baseStyles}" viewBox="0 0 ${el.width} ${el.height}">
            <line x1="0" y1="0" x2="${el.width}" y2="${el.height}" 
                  stroke="${el.strokeColor}" stroke-width="${el.strokeWidth}" />
          </svg>
        `;
      }
      return "";
    }
    default:
      return "";
  }
}
function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };
  return text.replace(/[&<>"']/g, (m) => map[m] || m);
}
async function generateCertificateHtml(templateData, context) {
  const sortedElements = [...templateData.elements].sort((a, b) => a.zIndex - b.zIndex);
  const elementsHtml = [];
  for (const element of sortedElements) {
    const html = await elementToHtml(element, context);
    elementsHtml.push(html);
  }
  let backgroundStyle = "";
  if (templateData.background) {
    if (templateData.background.type === "color") {
      backgroundStyle = `background-color: ${templateData.background.value};`;
    } else if (templateData.background.type === "image") {
      backgroundStyle = `
        background-image: url(${templateData.background.value});
        background-size: cover;
        background-position: center;
      `;
    }
  }
  const fonts = /* @__PURE__ */ new Set();
  for (const el of templateData.elements) {
    if (el.type === "text" || el.type === "variable") {
      fonts.add(el.fontFamily);
    }
  }
  const fontLinks = Array.from(fonts).filter((f) => !["Arial", "Times New Roman", "Georgia"].includes(f)).map((f) => `<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(f)}:wght@400;700&display=swap" rel="stylesheet">`).join("\n");
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
      ${elementsHtml.join("\n")}
    </body>
    </html>
  `;
}
async function generateCertificatePdf(options) {
  const { templateData, context, outputPath } = options;
  console.log("[pdfGenerator] Starting PDF generation...");
  console.log(`[pdfGenerator] Template size: ${templateData.width}x${templateData.height}`);
  console.log(`[pdfGenerator] Elements: ${templateData.elements.length}`);
  const html = await generateCertificateHtml(templateData, context);
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({
      width: templateData.width,
      height: templateData.height,
      deviceScaleFactor: 2
      // Высокое качество
    });
    await page.setContent(html, {
      waitUntil: "networkidle0"
      // Ждём загрузки шрифтов и изображений
    });
    await new Promise((resolve) => setTimeout(resolve, 500));
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    await page.pdf({
      path: outputPath,
      width: templateData.width,
      height: templateData.height,
      printBackground: true,
      pageRanges: "1"
    });
    console.log(`[pdfGenerator] PDF saved to: ${outputPath}`);
  } finally {
    await browser.close();
  }
}

export { generateCertificateHtml as a, generateCertificatePdf as g };
//# sourceMappingURL=pdfGenerator.mjs.map
