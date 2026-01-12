import path__default from 'path';

function getFileExtension(filename) {
  const ext = path__default.extname(filename).toLowerCase();
  return ext.startsWith(".") ? ext.substring(1) : ext;
}
function validateFile(file, maxSizeBytes = 50 * 1024 * 1024, allowedMimeTypes) {
  if (file.size > maxSizeBytes) {
    const maxSizeMB = Math.round(maxSizeBytes / (1024 * 1024));
    throw new Error(`\u0424\u0430\u0439\u043B \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u0431\u043E\u043B\u044C\u0448\u043E\u0439. \u041C\u0430\u043A\u0441\u0438\u043C\u0430\u043B\u044C\u043D\u044B\u0439 \u0440\u0430\u0437\u043C\u0435\u0440: ${maxSizeMB}MB`);
  }
}
function isPathSafe(requestedPath, basePath) {
  const normalizedRequested = path__default.normalize(requestedPath);
  const normalizedBase = path__default.normalize(basePath);
  return normalizedRequested.startsWith(normalizedBase);
}

export { getFileExtension as g, isPathSafe as i, validateFile as v };
//# sourceMappingURL=fileUtils.mjs.map
