/**
 * Метрики шрифта Montserrat (им набраны Word-шаблоны документов группы) — для расчёта
 * вёрстки до формирования файла: сколько строк займёт текст и поместится ли лист на страницу.
 */

import { readFileSync } from "fs";
import path from "path";
import fontkit from "@pdf-lib/fontkit";

/** Высота строки при одинарном межстрочном интервале — в долях кегля (hhea 968 / −251 на 1000) */
export const MONTSERRAT_LINE = 1.219;

interface FontMetrics {
  font: ReturnType<typeof fontkit.create>;
  advances: Map<string, number>;
}

const fonts: Partial<Record<"400" | "700", FontMetrics>> = {};

function metricsOf(weight: "400" | "700"): FontMetrics {
  let metrics = fonts[weight];
  if (!metrics) {
    const fontPath = path.join(
      process.cwd(),
      "server",
      "assets",
      "fonts",
      `Montserrat-${weight}.ttf`,
    );
    metrics = { font: fontkit.create(readFileSync(fontPath)), advances: new Map() };
    fonts[weight] = metrics;
  }
  return metrics;
}

/** Ширина текста шрифтом Montserrat Regular (или Bold), pt */
export function textWidth(text: string, sizePt: number, bold = false): number {
  const { font, advances } = metricsOf(bold ? "700" : "400");
  let width = 0;
  for (const ch of text) {
    let advance = advances.get(ch);
    if (advance === undefined) {
      advance = font.glyphForCodePoint(ch.codePointAt(0)!).advanceWidth;
      advances.set(ch, advance);
    }
    width += advance;
  }
  return (width * sizePt) / font.unitsPerEm;
}
