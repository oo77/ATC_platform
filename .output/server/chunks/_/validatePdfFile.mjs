const MAX_PDF_SIZE = 10 * 1024 * 1024;
const PDF_SIGNATURE = [37, 80, 68, 70, 45];
async function validatePdfFile(file, originalName) {
  const fileName = originalName || (file instanceof File ? file.name : "unknown");
  if (!fileName.toLowerCase().endsWith(".pdf")) {
    return {
      valid: false,
      error: "\u0424\u0430\u0439\u043B \u0434\u043E\u043B\u0436\u0435\u043D \u0438\u043C\u0435\u0442\u044C \u0440\u0430\u0441\u0448\u0438\u0440\u0435\u043D\u0438\u0435 .pdf"
    };
  }
  if (file instanceof File && file.type && file.type !== "application/pdf") {
    return {
      valid: false,
      error: "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 MIME-\u0442\u0438\u043F \u0444\u0430\u0439\u043B\u0430. \u041E\u0436\u0438\u0434\u0430\u0435\u0442\u0441\u044F application/pdf"
    };
  }
  const fileSize = file instanceof File ? file.size : file.length;
  if (fileSize > MAX_PDF_SIZE) {
    return {
      valid: false,
      error: `\u0420\u0430\u0437\u043C\u0435\u0440 \u0444\u0430\u0439\u043B\u0430 \u043D\u0435 \u0434\u043E\u043B\u0436\u0435\u043D \u043F\u0440\u0435\u0432\u044B\u0448\u0430\u0442\u044C ${MAX_PDF_SIZE / 1024 / 1024}MB`
    };
  }
  if (fileSize === 0) {
    return {
      valid: false,
      error: "\u0424\u0430\u0439\u043B \u043F\u0443\u0441\u0442\u043E\u0439 (0 \u0431\u0430\u0439\u0442)"
    };
  }
  try {
    let buffer;
    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else {
      buffer = file;
    }
    const header = buffer.slice(0, 5);
    const isValidPdf = PDF_SIGNATURE.every(
      (byte, index) => header[index] === byte
    );
    if (!isValidPdf) {
      return {
        valid: false,
        error: "\u0424\u0430\u0439\u043B \u043D\u0435 \u044F\u0432\u043B\u044F\u0435\u0442\u0441\u044F \u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u043C PDF-\u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u043E\u043C"
      };
    }
  } catch (error) {
    console.error("[PDF Validation] Error reading file:", error);
    return {
      valid: false,
      error: "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0447\u0442\u0435\u043D\u0438\u0438 \u0444\u0430\u0439\u043B\u0430"
    };
  }
  return {
    valid: true,
    fileInfo: {
      size: fileSize,
      originalName: fileName
    }
  };
}

export { validatePdfFile as v };
//# sourceMappingURL=validatePdfFile.mjs.map
