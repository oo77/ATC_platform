import fs from 'fs/promises';
import path__default from 'path';

function sanitizeFilename(filename) {
  const lastDotIndex = filename.lastIndexOf(".");
  const name = lastDotIndex > 0 ? filename.slice(0, lastDotIndex) : filename;
  const ext = lastDotIndex > 0 ? filename.slice(lastDotIndex) : "";
  const transliterated = transliterate(name);
  const cleaned = transliterated.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/_{2,}/g, "_").replace(/^_|_$/g, "");
  const truncated = cleaned.slice(0, 100);
  const finalName = truncated || "file";
  return finalName + ext;
}
function transliterate(text) {
  const map = {
    // Русский алфавит
    \u0430: "a",
    \u0431: "b",
    \u0432: "v",
    \u0433: "g",
    \u0434: "d",
    \u0435: "e",
    \u0451: "yo",
    \u0436: "zh",
    \u0437: "z",
    \u0438: "i",
    \u0439: "y",
    \u043A: "k",
    \u043B: "l",
    \u043C: "m",
    \u043D: "n",
    \u043E: "o",
    \u043F: "p",
    \u0440: "r",
    \u0441: "s",
    \u0442: "t",
    \u0443: "u",
    \u0444: "f",
    \u0445: "h",
    \u0446: "ts",
    \u0447: "ch",
    \u0448: "sh",
    \u0449: "sch",
    \u044A: "",
    \u044B: "y",
    \u044C: "",
    \u044D: "e",
    \u044E: "yu",
    \u044F: "ya",
    \u0410: "A",
    \u0411: "B",
    \u0412: "V",
    \u0413: "G",
    \u0414: "D",
    \u0415: "E",
    \u0401: "Yo",
    \u0416: "Zh",
    \u0417: "Z",
    \u0418: "I",
    \u0419: "Y",
    \u041A: "K",
    \u041B: "L",
    \u041C: "M",
    \u041D: "N",
    \u041E: "O",
    \u041F: "P",
    \u0420: "R",
    \u0421: "S",
    \u0422: "T",
    \u0423: "U",
    \u0424: "F",
    \u0425: "H",
    \u0426: "Ts",
    \u0427: "Ch",
    \u0428: "Sh",
    \u0429: "Sch",
    \u042A: "",
    \u042B: "Y",
    \u042C: "",
    \u042D: "E",
    \u042E: "Yu",
    \u042F: "Ya",
    // Узбекский алфавит (специфические символы)
    \u045E: "o",
    \u049B: "q",
    \u0493: "g",
    \u04B3: "h",
    \u040E: "O",
    \u049A: "Q",
    \u0492: "G",
    \u04B2: "H",
    // Пробелы и специальные символы
    " ": "_",
    "-": "-",
    _: "_"
  };
  return text.split("").map((char) => map[char] || char).join("");
}

async function saveGroupReportFile(options) {
  const { groupId, file, originalFilename, userId } = options;
  const timestamp = Date.now();
  const sanitized = sanitizeFilename(originalFilename);
  const storedName = `${timestamp}_${sanitized}`;
  const relativePath = path__default.join("groups", String(groupId), "reports");
  const absolutePath = path__default.join(process.cwd(), "storage", relativePath);
  await fs.mkdir(absolutePath, { recursive: true });
  const fullPath = path__default.join(absolutePath, storedName);
  let buffer;
  if (file instanceof File) {
    const arrayBuffer = await file.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } else {
    buffer = file;
  }
  await fs.writeFile(fullPath, buffer);
  const dbPath = path__default.join(relativePath, storedName).replace(/\\/g, "/");
  const fileUrl = `/storage/${dbPath}`;
  console.log(`[Group File Storage] Saved file: ${dbPath}`);
  return {
    filePath: dbPath,
    fileUrl,
    storedName
  };
}
async function deleteGroupReportFile(filePath) {
  const absolutePath = path__default.join(process.cwd(), "storage", filePath);
  try {
    await fs.unlink(absolutePath);
    console.log(`[Group File Storage] Deleted file: ${filePath}`);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error("[Group File Storage] Error deleting file:", error);
    }
  }
}
async function getGroupReportFiles(groupId) {
  const relativePath = path__default.join("groups", String(groupId), "reports");
  const absolutePath = path__default.join(process.cwd(), "storage", relativePath);
  try {
    const files = await fs.readdir(absolutePath);
    return files.map((f) => path__default.join(relativePath, f).replace(/\\/g, "/"));
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export { deleteGroupReportFile as d, getGroupReportFiles as g, saveGroupReportFile as s };
//# sourceMappingURL=groupFileStorage.mjs.map
