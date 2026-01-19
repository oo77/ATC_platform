#!/usr/bin/env node

/**
 * Скрипт проверки готовности проекта к деплою
 *
 * Запуск: node scripts/check-deployment.js
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";

const projectRoot = process.cwd();
let hasErrors = false;
let hasWarnings = false;

console.log("🔍 Проверка готовности проекта к деплою...\n");

// 1. Проверка обязательных файлов
console.log("📁 Проверка обязательных файлов:");
const requiredFiles = [
  "package.json",
  "nuxt.config.ts",
  "netlify.toml",
  ".env.example",
  "README.md",
  ".gitignore",
];

requiredFiles.forEach((file) => {
  const exists = existsSync(join(projectRoot, file));
  console.log(`  ${exists ? "✅" : "❌"} ${file}`);
  if (!exists) hasErrors = true;
});

// 2. Проверка отсутствия нежелательных файлов/папок
console.log("\n🗑️  Проверка отсутствия нежелательных файлов:");
const unwantedPaths = ["docs", "debug", "check-enum.ts", "atc_platform.zip"];

unwantedPaths.forEach((path) => {
  const exists = existsSync(join(projectRoot, path));
  console.log(
    `  ${!exists ? "✅" : "⚠️"} ${path} ${
      !exists ? "удален" : "все еще существует"
    }`
  );
  if (exists) hasWarnings = true;
});

// 3. Проверка .env файла
console.log("\n🔐 Проверка переменных окружения:");
const envExample = join(projectRoot, ".env.example");
const env = join(projectRoot, ".env");

if (existsSync(envExample)) {
  console.log("  ✅ .env.example существует");

  const envContent = readFileSync(envExample, "utf-8");
  const requiredVars = [
    "DATABASE_HOST",
    "DATABASE_PORT",
    "DATABASE_USER",
    "DATABASE_PASSWORD",
    "DATABASE_NAME",
    "JWT_SECRET",
    "REFRESH_TOKEN_SECRET",
    "TELEGRAM_BOT_TOKEN",
    "NODE_ENV",
  ];

  requiredVars.forEach((varName) => {
    const exists = envContent.includes(varName);
    console.log(`  ${exists ? "✅" : "❌"} ${varName}`);
    if (!exists) hasErrors = true;
  });
} else {
  console.log("  ❌ .env.example не найден");
  hasErrors = true;
}

if (existsSync(env)) {
  console.log("  ⚠️  .env файл существует (убедитесь, что он в .gitignore)");

  // Проверка, что .env в .gitignore
  const gitignore = readFileSync(join(projectRoot, ".gitignore"), "utf-8");
  if (gitignore.includes(".env")) {
    console.log("  ✅ .env добавлен в .gitignore");
  } else {
    console.log("  ❌ .env НЕ добавлен в .gitignore!");
    hasErrors = true;
  }
}

// 4. Проверка package.json
console.log("\n📦 Проверка package.json:");
const packageJson = JSON.parse(
  readFileSync(join(projectRoot, "package.json"), "utf-8")
);

const requiredScripts = ["build", "dev", "preview", "db:migrate"];
requiredScripts.forEach((script) => {
  const exists = packageJson.scripts && packageJson.scripts[script];
  console.log(`  ${exists ? "✅" : "❌"} script: ${script}`);
  if (!exists) hasErrors = true;
});

// 5. Проверка nuxt.config.ts
console.log("\n⚙️  Проверка nuxt.config.ts:");
const nuxtConfig = readFileSync(join(projectRoot, "nuxt.config.ts"), "utf-8");

const nuxtChecks = [
  { name: "preset: netlify", pattern: /preset:\s*['"]netlify['"]/ },
  { name: "css config", pattern: /css:\s*\[/ },
  { name: "postcss config", pattern: /postcss:/ },
];

nuxtChecks.forEach((check) => {
  const exists = check.pattern.test(nuxtConfig);
  console.log(`  ${exists ? "✅" : "⚠️"} ${check.name}`);
  if (!exists) hasWarnings = true;
});

// 6. Проверка netlify.toml
console.log("\n🌐 Проверка netlify.toml:");
const netlifyToml = readFileSync(join(projectRoot, "netlify.toml"), "utf-8");

const netlifyChecks = [
  { name: "build command", pattern: /command\s*=\s*["']npm run build["']/ },
  { name: "node version", pattern: /NODE_VERSION\s*=\s*["']20["']/ },
];

netlifyChecks.forEach((check) => {
  const exists = check.pattern.test(netlifyToml);
  console.log(`  ${exists ? "✅" : "⚠️"} ${check.name}`);
  if (!exists) hasWarnings = true;
});

// 7. Проверка структуры проекта
console.log("\n📂 Проверка структуры проекта:");
const requiredDirs = [
  "app",
  "server",
  "public",
  "server/api",
  "server/database",
  "server/database/migrations",
];

requiredDirs.forEach((dir) => {
  const exists = existsSync(join(projectRoot, dir));
  console.log(`  ${exists ? "✅" : "❌"} ${dir}/`);
  if (!exists) hasErrors = true;
});

// 8. Итоговый результат
console.log("\n" + "=".repeat(50));
if (hasErrors) {
  console.log("❌ ПРОЕКТ НЕ ГОТОВ К ДЕПЛОЮ");
  console.log("   Исправьте критические ошибки выше");
  process.exit(1);
} else if (hasWarnings) {
  console.log("⚠️  ПРОЕКТ ГОТОВ К ДЕПЛОЮ С ПРЕДУПРЕЖДЕНИЯМИ");
  console.log("   Рекомендуется исправить предупреждения");
  process.exit(0);
} else {
  console.log("✅ ПРОЕКТ ГОТОВ К ДЕПЛОЮ!");
  console.log("   Все проверки пройдены успешно");
  process.exit(0);
}
