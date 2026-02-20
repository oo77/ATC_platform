/**
 * Скрипт загрузки шрифтов для PDF генерации
 *
 * ПРОБЛЕМА: jsDelivr возвращает 403 для /static/ поддиректорий google/fonts.
 * РЕШЕНИЕ: raw.githubusercontent.com идёт первым, jsDelivr — запасной вариант.
 *
 * Запуск: node scripts/download-fonts.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fontsDir = path.join(__dirname, "..", "server", "assets", "fonts");
fs.mkdirSync(fontsDir, { recursive: true });

/**
 * Каждая запись: { repo, staticDir?, files: { weight: [fileName, ...alternatives] } }
 * Несколько имён файлов нужны для шрифтов, у которых Google поменял соглашение
 * (например, Inter_18pt-Regular.ttf vs Inter-Regular.ttf).
 */
const FONT_MAP = {
  Inter: {
    repo: "ofl/inter",
    staticDir: "static",
    files: {
      400: ["Inter_18pt-Regular.ttf", "Inter-Regular.ttf"],
      700: ["Inter_18pt-Bold.ttf", "Inter-Bold.ttf"],
    },
  },
  Roboto: {
    repo: "apache/roboto",
    staticDir: "static",
    files: {
      400: ["Roboto-Regular.ttf"],
      700: ["Roboto-Bold.ttf"],
    },
  },
  "Open Sans": {
    repo: "apache/opensans",
    staticDir: "static",
    files: {
      400: ["OpenSans-Regular.ttf"],
      700: ["OpenSans-Bold.ttf"],
    },
  },
  Montserrat: {
    repo: "ofl/montserrat",
    staticDir: "static",
    files: {
      400: ["Montserrat-Regular.ttf"],
      700: ["Montserrat-Bold.ttf"],
    },
  },
  Lato: {
    repo: "ofl/lato",
    files: {
      400: ["Lato-Regular.ttf"],
      700: ["Lato-Bold.ttf"],
    },
  },
  Poppins: {
    repo: "ofl/poppins",
    files: {
      400: ["Poppins-Regular.ttf"],
      700: ["Poppins-Bold.ttf"],
    },
  },
  "Playfair Display": {
    repo: "ofl/playfairdisplay",
    staticDir: "static",
    files: {
      400: ["PlayfairDisplay-Regular.ttf"],
      700: ["PlayfairDisplay-Bold.ttf"],
    },
  },
  Lora: {
    repo: "ofl/lora",
    staticDir: "static",
    files: {
      400: ["Lora-Regular.ttf"],
      700: ["Lora-Bold.ttf"],
    },
  },
  Merriweather: {
    repo: "ofl/merriweather",
    files: {
      400: ["Merriweather-Regular.ttf"],
      700: ["Merriweather-Bold.ttf"],
    },
  },
  "PT Sans": {
    repo: "ofl/ptsans",
    files: {
      400: ["PTSans-Regular.ttf"],
      700: ["PTSans-Bold.ttf"],
    },
  },
  "PT Serif": {
    repo: "ofl/ptserif",
    files: {
      400: ["PTSerif-Regular.ttf"],
      700: ["PTSerif-Bold.ttf"],
    },
  },
  "Noto Sans": {
    repo: "ofl/notosans",
    files: {
      400: ["NotoSans-Regular.ttf"],
      700: ["NotoSans-Bold.ttf"],
    },
  },
  Raleway: {
    repo: "ofl/raleway",
    staticDir: "static",
    files: {
      400: ["Raleway-Regular.ttf"],
      700: ["Raleway-Bold.ttf"],
    },
  },
  Nunito: {
    repo: "ofl/nunito",
    staticDir: "static",
    files: {
      400: ["Nunito-Regular.ttf"],
      700: ["Nunito-Bold.ttf"],
    },
  },
  Oswald: {
    repo: "ofl/oswald",
    staticDir: "static",
    files: {
      400: ["Oswald-Regular.ttf"],
      700: ["Oswald-Bold.ttf"],
    },
  },
  // Source Sans Pro переименован в Source Sans 3 в Google Fonts
  "Source Sans Pro": {
    repo: "ofl/sourcesans3",
    staticDir: "static",
    files: {
      400: ["SourceSans3-Regular.ttf"],
      700: ["SourceSans3-Bold.ttf"],
    },
  },
  Ubuntu: {
    repo: "ufl/ubuntu",
    files: {
      400: ["Ubuntu-Regular.ttf"],
      700: ["Ubuntu-Bold.ttf"],
    },
  },
  Rubik: {
    repo: "ofl/rubik",
    staticDir: "static",
    files: {
      400: ["Rubik-Regular.ttf"],
      700: ["Rubik-Bold.ttf"],
    },
  },
  "Work Sans": {
    repo: "ofl/worksans",
    staticDir: "static",
    files: {
      400: ["WorkSans-Regular.ttf"],
      700: ["WorkSans-Bold.ttf"],
    },
  },
  "Fira Sans": {
    repo: "ofl/firasans",
    files: {
      400: ["FiraSans-Regular.ttf"],
      700: ["FiraSans-Bold.ttf"],
    },
  },
};

/**
 * Генерирует список URL для попытки скачивания.
 *
 * ВАЖНО: raw.githubusercontent.com идёт ПЕРВЫМ!
 * jsDelivr возвращает 403 для /static/ поддиректорий google/fonts.
 */
function buildUrls(fontName, weight) {
  const meta = FONT_MAP[fontName];
  if (!meta) return [];

  const fileNames = meta.files[weight];
  if (!fileNames || fileNames.length === 0) return [];

  const urls = [];
  const repo = meta.repo;
  const staticPart = meta.staticDir ? `/${meta.staticDir}` : "";

  for (const fileName of fileNames) {
    // 1. raw.githubusercontent.com — прямой доступ без CDN-ограничений (ПРИОРИТЕТ)
    urls.push(
      `https://raw.githubusercontent.com/google/fonts/main/${repo}${staticPart}/${fileName}`,
    );

    // 2. jsDelivr (быстрый кеш, но 403 для /static/ в google/fonts)
    urls.push(
      `https://cdn.jsdelivr.net/gh/google/fonts@main/${repo}${staticPart}/${fileName}`,
    );

    // 3. Запасной: без staticDir (на случай разных структур репозитория)
    if (meta.staticDir) {
      urls.push(
        `https://raw.githubusercontent.com/google/fonts/main/${repo}/${fileName}`,
      );
    }
  }

  return urls;
}

async function downloadFont(fontName, weight) {
  const meta = FONT_MAP[fontName];
  if (!meta) {
    process.stdout.write(`  ✗ ${fontName}-${weight} — нет в map\n`);
    return false;
  }

  const outputKey = `${fontName.replace(/\s+/g, "_")}-${weight}`;
  const filePath = path.join(fontsDir, `${outputKey}.ttf`);

  // Уже скачан и валидный
  if (fs.existsSync(filePath) && fs.statSync(filePath).size > 10_000) {
    process.stdout.write(`  ✓ ${outputKey}.ttf (кеш)\n`);
    return true;
  }

  const urls = buildUrls(fontName, weight);
  let lastError = "нет URL";

  for (const url of urls) {
    const host = new URL(url).hostname;
    const file = url.split("/").pop();
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(20_000),
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          Accept: "*/*",
        },
      });

      if (!res.ok) {
        lastError = `HTTP ${res.status} (${host}/${file})`;
        continue;
      }

      const buf = Buffer.from(await res.arrayBuffer());

      if (buf.length < 1000) {
        lastError = `Слишком маленький файл: ${buf.length} байт (${host}/${file})`;
        continue;
      }

      // Проверка magic bytes: TTF = 0x00010000, OTF = 0x4F54544F ('OTTO'), true = 0x74727565
      const magic = buf.readUInt32BE(0);
      const isValidFont =
        magic === 0x00010000 ||
        magic === 0x4f54544f ||
        magic === 0x74727565 ||
        magic === 0x74797031;

      if (!isValidFont) {
        lastError = `Не TTF/OTF файл (magic=0x${magic.toString(16).padStart(8, "0")}, ${host}/${file})`;
        continue;
      }

      fs.writeFileSync(filePath, buf);
      process.stdout.write(
        `  ✓ ${outputKey}.ttf (${Math.round(buf.length / 1024)} KB) ← ${host}\n`,
      );
      return true;
    } catch (e) {
      lastError = `${e.message.split("\n")[0]} (${host})`;
    }
  }

  process.stdout.write(`  ✗ ${outputKey} — ${lastError}\n`);
  return false;
}

async function main() {
  console.log(`\n📁 Папка шрифтов: ${fontsDir}`);
  console.log("━".repeat(65));

  let downloaded = 0;
  let cached = 0;
  let failed = 0;
  const failedFonts = [];

  for (const [fontName, meta] of Object.entries(FONT_MAP)) {
    console.log(`\n🔤 ${fontName}`);
    for (const weight of Object.keys(meta.files).map(Number)) {
      const key = `${fontName.replace(/\s+/g, "_")}-${weight}`;
      const filePath = path.join(fontsDir, `${key}.ttf`);
      const wasAlreadyCached =
        fs.existsSync(filePath) && fs.statSync(filePath).size > 10_000;

      const ok = await downloadFont(fontName, weight);

      if (ok) {
        wasAlreadyCached ? cached++ : downloaded++;
      } else {
        failed++;
        failedFonts.push(`${fontName}-${weight}`);
      }

      // Пауза между запросами (уважение к серверу)
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  console.log("\n" + "━".repeat(65));
  console.log(`✅ Новых загружено: ${downloaded}`);
  if (cached > 0) console.log(`💾 Из кеша: ${cached}`);
  if (failed > 0) {
    console.log(`❌ Не удалось: ${failed}`);
    console.log("   " + failedFonts.join(", "));
    console.log(
      "\n⚠️  При генерации PDF незагруженные шрифты = Roboto fallback.",
    );
  } else {
    console.log("🎉 Все шрифты успешно загружены!");
  }
  console.log("\n✔ Готово.");
}

main().catch(console.error);
