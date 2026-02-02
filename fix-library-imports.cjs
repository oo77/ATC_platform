const fs = require("fs");
const path = require("path");

// Список файлов для исправления
const files = [
  "server/api/library/reading/[bookId]/start.post.ts",
  "server/api/library/reading/[bookId]/end.post.ts",
  "server/api/library/admin/books/[id]/reprocess.post.ts",
  "server/api/library/admin/books/[id]/index.get.ts",
  "server/api/library/admin/books/[id]/index.delete.ts",
  "server/api/library/admin/books/[id]/analytics.get.ts",
  "server/api/library/admin/books/[id]/access/index.get.ts",
  "server/api/library/admin/books/[id]/access/index.post.ts",
  "server/api/library/admin/books/[id]/access/[userId].delete.ts",
];

files.forEach((file) => {
  const filePath = path.join("D:\\Projects\\ATC_platform", file);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }

  let content = fs.readFileSync(filePath, "utf8");
  const originalContent = content;

  // Удаляем все строки с "const db = getDbPool();"
  const lines = content.split("\n");
  const filteredLines = lines.filter(
    (line) => !line.trim().startsWith("const db = getDbPool()"),
  );
  content = filteredLines.join("\n");

  // Исправляем неправильные пути импортов (..\\..\\../ -> ../../../../)
  content = content.replace(
    /from\s+["']\.\.\\\.\.\\\.\.\/\.\.\//g,
    'from "../../../../',
  );
  content = content.replace(
    /from\s+["']\.\.\\\.\.\\\.\.\/\.\.\.\//g,
    'from "../../../../../',
  );
  content = content.replace(
    /from\s+["']\.\.\\\.\.\\\.\.\/\.\.\.\.\//g,
    'from "../../../../../../',
  );

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`✅ Fixed: ${file}`);
  } else {
    console.log(`ℹ️  No changes needed: ${file}`);
  }
});

console.log("\n✨ Done!");
