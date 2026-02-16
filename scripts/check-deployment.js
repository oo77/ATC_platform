#!/usr/bin/env node

/**
 * Скрипт проверки готовности проекта к деплою
 * Запуск: node scripts/check-deployment.js
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();

console.log("🔍 Проверка готовности к деплою...\n");

let errors = 0;
let warnings = 0;

// Проверка 1: package.json
console.log("📦 Проверка package.json...");
try {
  const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8"));

  if (!pkg.scripts.build) {
    console.error("  ❌ Отсутствует скрипт build");
    errors++;
  } else {
    console.log("  ✅ Скрипт build найден");
  }

  if (!pkg.dependencies.nuxt) {
    console.error("  ❌ Nuxt не найден в dependencies");
    errors++;
  } else {
    console.log("  ✅ Nuxt установлен");
  }
} catch (error) {
  console.error("  ❌ Ошибка чтения package.json:", error.message);
  errors++;
}

// Проверка 2: nuxt.config.ts
console.log("\n⚙️  Проверка nuxt.config.ts...");
if (existsSync(join(ROOT, "nuxt.config.ts"))) {
  console.log("  ✅ nuxt.config.ts найден");

  const config = readFileSync(join(ROOT, "nuxt.config.ts"), "utf-8");

  if (config.includes('preset: "node-server"')) {
    console.log("  ✅ Preset установлен на node-server");
  } else {
    console.warn("  ⚠️  Preset может быть не настроен для cPanel");
    warnings++;
  }
} else {
  console.error("  ❌ nuxt.config.ts не найден");
  errors++;
}

// Проверка 3: .env.example
console.log("\n📝 Проверка .env.example...");
if (existsSync(join(ROOT, ".env.example"))) {
  console.log("  ✅ .env.example найден");

  const envExample = readFileSync(join(ROOT, ".env.example"), "utf-8");
  const requiredVars = [
    "DATABASE_HOST",
    "DATABASE_PORT",
    "DATABASE_NAME",
    "DATABASE_USER",
    "DATABASE_PASSWORD",
    "JWT_SECRET",
    "REFRESH_TOKEN_SECRET",
  ];

  requiredVars.forEach((varName) => {
    if (envExample.includes(varName)) {
      console.log(`  ✅ ${varName} присутствует`);
    } else {
      console.error(`  ❌ ${varName} отсутствует`);
      errors++;
    }
  });
} else {
  console.error("  ❌ .env.example не найден");
  errors++;
}

// Проверка 4: .gitignore
console.log("\n🚫 Проверка .gitignore...");
if (existsSync(join(ROOT, ".gitignore"))) {
  console.log("  ✅ .gitignore найден");

  const gitignore = readFileSync(join(ROOT, ".gitignore"), "utf-8");
  const shouldIgnore = [".env", "node_modules", ".output", "storage"];

  shouldIgnore.forEach((pattern) => {
    if (gitignore.includes(pattern)) {
      console.log(`  ✅ ${pattern} игнорируется`);
    } else {
      console.warn(`  ⚠️  ${pattern} не игнорируется`);
      warnings++;
    }
  });
} else {
  console.error("  ❌ .gitignore не найден");
  errors++;
}

// Проверка 5: Миграции
console.log("\n🗄️  Проверка миграций...");
if (existsSync(join(ROOT, "server/database/migrator.ts"))) {
  console.log("  ✅ migrator.ts найден");
} else {
  console.error("  ❌ migrator.ts не найден");
  errors++;
}

if (existsSync(join(ROOT, "server/database/migrations"))) {
  console.log("  ✅ Папка migrations найдена");
} else {
  console.error("  ❌ Папка migrations не найдена");
  errors++;
}

// Проверка 6: Структура проекта
console.log("\n📁 Проверка структуры проекта...");
const requiredDirs = [
  "server",
  "app",
  "public",
  "server/api",
  "server/database",
  "server/utils",
];

requiredDirs.forEach((dir) => {
  if (existsSync(join(ROOT, dir))) {
    console.log(`  ✅ ${dir}/ найдена`);
  } else {
    console.error(`  ❌ ${dir}/ не найдена`);
    errors++;
  }
});

// Проверка 7: Критичные файлы
console.log("\n📄 Проверка критичных файлов...");
const criticalFiles = [
  "server/utils/db.ts",
  "server/api/environment/check-db.get.ts",
  "app/pages/environment.vue",
  "app/middleware/check-database.global.ts",
];

criticalFiles.forEach((file) => {
  if (existsSync(join(ROOT, file))) {
    console.log(`  ✅ ${file} найден`);
  } else {
    console.error(`  ❌ ${file} не найден`);
    errors++;
  }
});

// Проверка 8: tmp директория
console.log("\n📂 Проверка tmp директории...");
if (existsSync(join(ROOT, "tmp"))) {
  console.log("  ✅ tmp/ найдена");

  if (existsSync(join(ROOT, "tmp/restart.txt"))) {
    console.log("  ✅ tmp/restart.txt найден");
  } else {
    console.warn(
      "  ⚠️  tmp/restart.txt не найден (будет создан автоматически)",
    );
    warnings++;
  }
} else {
  console.warn("  ⚠️  tmp/ не найдена (будет создана автоматически)");
  warnings++;
}

// Проверка 9: Документация
console.log("\n📚 Проверка документации...");
const docs = [
  "docs/QUICK_DEPLOY.md",
  "docs/environment-setup.md",
  "docs/environment-checklist.md",
];

docs.forEach((doc) => {
  if (existsSync(join(ROOT, doc))) {
    console.log(`  ✅ ${doc} найден`);
  } else {
    console.warn(`  ⚠️  ${doc} не найден`);
    warnings++;
  }
});

// Итоги
console.log("\n" + "=".repeat(50));
console.log("📊 Результаты проверки:\n");

if (errors === 0 && warnings === 0) {
  console.log("✅ Проект готов к деплою!");
  console.log("\n🚀 Следующие шаги:");
  console.log("   1. Соберите проект: npm run build");
  console.log("   2. Загрузите на хостинг");
  console.log("   3. Настройте через /environment");
  console.log("\n📖 Инструкция: docs/QUICK_DEPLOY.md");
  process.exit(0);
} else {
  if (errors > 0) {
    console.log(`❌ Найдено ошибок: ${errors}`);
  }
  if (warnings > 0) {
    console.log(`⚠️  Найдено предупреждений: ${warnings}`);
  }

  console.log("\n🔧 Исправьте ошибки перед деплоем!");
  process.exit(1);
}
