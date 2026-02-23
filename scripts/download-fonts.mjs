/**
 * Скрипт загрузки шрифтов для PDF генерации
 *
 * Принцип: используем Google Fonts CSS API с User-Agent старого браузера (IE8/Trident).
 * При таком UA Google возвращает TTF вместо WOFF2 — именно TTF нужен для pdf-lib.
 *
 * Запуск: node scripts/download-fonts.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fontsDir = path.join(__dirname, "..", "server", "assets", "fonts");
fs.mkdirSync(fontsDir, { recursive: true });

// Список шрифтов для скачивания: [название, веса]
const FONTS = [
  ["Inter", [400, 700]],
  ["Roboto", [400, 700]],
  ["Open Sans", [400, 700]],
  ["Montserrat", [400, 700]],
  ["Lato", [400, 700]],
  ["Poppins", [400, 700]],
  ["Playfair Display", [400, 700]],
  ["Lora", [400, 700]],
  ["Merriweather", [400, 700]],
  ["PT Sans", [400, 700]],
  ["PT Serif", [400, 700]],
  ["Noto Sans", [400, 700]],
  ["Raleway", [400, 700]],
  ["Nunito", [400, 700]],
  ["Oswald", [400, 700]],
  ["Source Sans Pro", [400, 700]],
  ["Ubuntu", [400, 700]],
  ["Rubik", [400, 700]],
  ["Work Sans", [400, 700]],
  ["Fira Sans", [400, 700]],
];

/**
 * Старый User-Agent (IE8/Trident) — Google Fonts отдаёт TTF вместо WOFF2.
 * TTF нужен для pdf-lib (embedFont).
 */
const OLD_UA =
  "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0)";

/**
 * Загружает шрифт через Google Fonts CSS API → TTF.
 * Возвращает Buffer или null при неудаче.
 */
async function fetchFontFromGoogle(fontFamily, weight) {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@${weight}&display=swap`;

    const cssRes = await fetch(cssUrl, {
      signal: AbortSignal.timeout(20_000),
      headers: { "User-Agent": OLD_UA },
    });

    if (!cssRes.ok) {
      return { buf: null, error: `CSS HTTP ${cssRes.status} (googleapis.com)` };
    }

    const css = await cssRes.text();

    // Google Fonts CSS для IE8 содержит прямые ссылки на TTF файлы:
    // src: url(https://fonts.gstatic.com/s/montserrat/v26/JTUSjIg1_i6t8kCHKm459Wlhyw.ttf) format('truetype');
    // Google Fonts при IE8 UA возвращает обфусцированный URL без расширения:
    // url(https://fonts.gstatic.com/l/font?kit=JTUHjIg1_...&skey=...&v=v31)
    const urlMatch = css.match(/url\((https:\/\/fonts\.gstatic\.com[^)]+)\)/i);

    if (!urlMatch) {
      return { buf: null, error: "Не найден TTF URL в CSS ответе" };
    }

    const fontUrl = urlMatch[1];
    const fontRes = await fetch(fontUrl, {
      signal: AbortSignal.timeout(20_000),
      headers: { "User-Agent": OLD_UA },
    });

    if (!fontRes.ok) {
      return { buf: null, error: `Font HTTP ${fontRes.status} (gstatic.com)` };
    }

    const buf = Buffer.from(await fontRes.arrayBuffer());

    if (buf.length < 1000) {
      return { buf: null, error: `Слишком маленький файл: ${buf.length} байт` };
    }

    // Проверка magic bytes: TTF=0x00010000, OTF=0x4F54544F, TrueType=0x74727565
    const magic = buf.readUInt32BE(0);
    const isValid =
      magic === 0x00010000 ||
      magic === 0x4f54544f ||
      magic === 0x74727565 ||
      magic === 0x74797031;

    if (!isValid) {
      return {
        buf: null,
        error: `Не TTF/OTF файл (magic=0x${magic.toString(16).padStart(8, "0")})`,
      };
    }

    return { buf, error: null };
  } catch (e) {
    return { buf: null, error: e.message.split("\n")[0] };
  }
}

async function downloadFont(fontFamily, weight) {
  const key = `${fontFamily.replace(/\s+/g, "_")}-${weight}`;
  const filePath = path.join(fontsDir, `${key}.ttf`);

  // Уже скачан и валидный
  if (fs.existsSync(filePath) && fs.statSync(filePath).size > 10_000) {
    process.stdout.write(`  ✓ ${key}.ttf (кеш)\n`);
    return "cached";
  }

  const { buf, error } = await fetchFontFromGoogle(fontFamily, weight);

  if (buf) {
    fs.writeFileSync(filePath, buf);
    process.stdout.write(
      `  ✓ ${key}.ttf (${Math.round(buf.length / 1024)} KB) ← Google Fonts\n`,
    );
    return "downloaded";
  }

  process.stdout.write(`  ✗ ${key} — ${error}\n`);
  return "failed";
}

async function main() {
  console.log(`\n📁 Папка шрифтов: ${fontsDir}`);
  console.log("━".repeat(65));

  let downloaded = 0;
  let cached = 0;
  let failed = 0;
  const failedFonts = [];

  for (const [fontName, weights] of FONTS) {
    console.log(`\n🔤 ${fontName}`);
    for (const weight of weights) {
      const result = await downloadFont(fontName, weight);
      if (result === "downloaded") downloaded++;
      else if (result === "cached") cached++;
      else {
        failed++;
        failedFonts.push(`${fontName}-${weight}`);
      }
      // Пауза между запросами
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  console.log("\n" + "━".repeat(65));
  console.log(`✅ Новых загружено: ${downloaded}`);
  if (cached > 0) console.log(`💾 Из кеша: ${cached}`);
  if (failed > 0) {
    console.log(`❌ Не удалось: ${failed}`);
    console.log("   " + failedFonts.join(", "));
    console.log(
      "\n⚠️  При генерации PDF незагруженные шрифты = fallback (Lato/Poppins).",
    );
  } else {
    console.log("🎉 Все шрифты успешно загружены!");
  }
  console.log("\n✔ Готово.");
}

main().catch(console.error);
