/**
 * Watermark Utility - Наложение водяных знаков на изображения
 *
 * Создает динамические водяные знаки с информацией о пользователе
 * для защиты контента от несанкционированного распространения
 */

import sharp from "sharp";
import { createCanvas } from "@napi-rs/canvas";

// ========================================
// ТИПЫ
// ========================================

export interface WatermarkConfig {
  userId: string;
  userName: string;
  timestamp: Date;
  sessionId: string;
  opacity?: number; // 0-1, по умолчанию 0.15
  fontSize?: number; // по умолчанию 20
  color?: string; // по умолчанию 'rgba(0, 0, 0, 0.3)'
  angle?: number; // угол наклона в градусах, по умолчанию -45
}

export interface WatermarkResult {
  buffer: Buffer;
  format: "webp" | "png";
}

// ========================================
// КОНСТАНТЫ
// ========================================

const DEFAULT_CONFIG = {
  opacity: 0.15,
  fontSize: 20,
  color: "rgba(0, 0, 0, 0.3)",
  angle: -45,
  spacing: 200, // расстояние между водяными знаками
};

// ========================================
// ОСНОВНЫЕ ФУНКЦИИ
// ========================================

/**
 * Наложить водяной знак на изображение
 */
export async function applyWatermark(
  imagePath: string,
  config: WatermarkConfig,
): Promise<WatermarkResult> {
  try {
    // Загружаем исходное изображение
    const image = sharp(imagePath);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error("Не удалось получить размеры изображения");
    }

    // Создаем водяной знак
    const watermarkSvg = createWatermarkSVG(
      metadata.width,
      metadata.height,
      config,
    );

    // Накладываем водяной знак
    const result = await image
      .composite([
        {
          input: Buffer.from(watermarkSvg),
          blend: "over",
        },
      ])
      .webp({ quality: 85 })
      .toBuffer();

    return {
      buffer: result,
      format: "webp",
    };
  } catch (error) {
    console.error("❌ Ошибка наложения водяного знака:", error);
    throw error;
  }
}

/**
 * Создать SVG с водяным знаком
 */
function createWatermarkSVG(
  width: number,
  height: number,
  config: WatermarkConfig,
): string {
  const opacity = config.opacity ?? DEFAULT_CONFIG.opacity;
  const fontSize = config.fontSize ?? DEFAULT_CONFIG.fontSize;
  const color = config.color ?? DEFAULT_CONFIG.color;
  const angle = config.angle ?? DEFAULT_CONFIG.angle;
  const spacing = DEFAULT_CONFIG.spacing;

  // Формируем текст водяного знака
  const watermarkText = formatWatermarkText(config);

  // Вычисляем количество повторений для покрытия всей страницы
  const diagonal = Math.sqrt(width * width + height * height);
  const repeatsX = Math.ceil(width / spacing) + 2;
  const repeatsY = Math.ceil(height / spacing) + 2;

  // Создаем SVG с повторяющимся паттерном
  let textElements = "";

  for (let y = 0; y < repeatsY; y++) {
    for (let x = 0; x < repeatsX; x++) {
      const xPos = x * spacing;
      const yPos = y * spacing;

      textElements += `
        <text
          x="${xPos}"
          y="${yPos}"
          font-family="Arial, sans-serif"
          font-size="${fontSize}"
          fill="${color}"
          opacity="${opacity}"
          transform="rotate(${angle} ${xPos} ${yPos})"
        >${watermarkText}</text>
      `;
    }
  }

  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          text {
            user-select: none;
            pointer-events: none;
          }
        </style>
      </defs>
      ${textElements}
    </svg>
  `;
}

/**
 * Форматировать текст водяного знака
 */
function formatWatermarkText(config: WatermarkConfig): string {
  const date = config.timestamp.toISOString().split("T")[0];
  const time = config.timestamp.toTimeString().split(" ")[0].substring(0, 5);

  return `${config.userName} | ${date} ${time} | ID:${config.userId.substring(0, 8)}`;
}

/**
 * Создать водяной знак с использованием Canvas (альтернативный метод)
 */
export async function applyWatermarkCanvas(
  imagePath: string,
  config: WatermarkConfig,
): Promise<WatermarkResult> {
  try {
    // Загружаем изображение
    const image = sharp(imagePath);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error("Не удалось получить размеры изображения");
    }

    // Создаем canvas с водяным знаком
    const canvas = createCanvas(metadata.width, metadata.height);
    const ctx = canvas.getContext("2d");

    // Настройки
    const opacity = config.opacity ?? DEFAULT_CONFIG.opacity;
    const fontSize = config.fontSize ?? DEFAULT_CONFIG.fontSize;
    const angle = ((config.angle ?? DEFAULT_CONFIG.angle) * Math.PI) / 180;
    const spacing = DEFAULT_CONFIG.spacing;

    // Настраиваем стиль текста
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const watermarkText = formatWatermarkText(config);

    // Рисуем водяные знаки по диагонали
    const repeatsX = Math.ceil(metadata.width / spacing) + 2;
    const repeatsY = Math.ceil(metadata.height / spacing) + 2;

    for (let y = 0; y < repeatsY; y++) {
      for (let x = 0; x < repeatsX; x++) {
        const xPos = x * spacing;
        const yPos = y * spacing;

        ctx.save();
        ctx.translate(xPos, yPos);
        ctx.rotate(angle);
        ctx.fillText(watermarkText, 0, 0);
        ctx.restore();
      }
    }

    // Получаем buffer водяного знака
    const watermarkBuffer = canvas.toBuffer("image/png");

    // Накладываем на исходное изображение
    const result = await image
      .composite([
        {
          input: watermarkBuffer,
          blend: "over",
        },
      ])
      .webp({ quality: 85 })
      .toBuffer();

    return {
      buffer: result,
      format: "webp",
    };
  } catch (error) {
    console.error("❌ Ошибка наложения водяного знака (Canvas):", error);
    throw error;
  }
}

/**
 * Создать простой текстовый водяной знак (для тестирования)
 */
export async function applySimpleWatermark(
  imagePath: string,
  text: string,
): Promise<WatermarkResult> {
  try {
    const image = sharp(imagePath);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error("Не удалось получить размеры изображения");
    }

    // Создаем простой SVG водяной знак
    const watermarkSvg = `
      <svg width="${metadata.width}" height="${metadata.height}">
        <text
          x="50%"
          y="50%"
          font-family="Arial"
          font-size="40"
          fill="rgba(0, 0, 0, 0.2)"
          text-anchor="middle"
          transform="rotate(-45 ${metadata.width / 2} ${metadata.height / 2})"
        >${text}</text>
      </svg>
    `;

    const result = await image
      .composite([
        {
          input: Buffer.from(watermarkSvg),
          blend: "over",
        },
      ])
      .webp({ quality: 85 })
      .toBuffer();

    return {
      buffer: result,
      format: "webp",
    };
  } catch (error) {
    console.error("❌ Ошибка наложения простого водяного знака:", error);
    throw error;
  }
}

/**
 * Проверить, можно ли наложить водяной знак на файл
 */
export async function canApplyWatermark(imagePath: string): Promise<boolean> {
  try {
    const metadata = await sharp(imagePath).metadata();
    return !!(metadata.width && metadata.height);
  } catch {
    return false;
  }
}

/**
 * Получить информацию об изображении
 */
export async function getImageInfo(imagePath: string) {
  try {
    const metadata = await sharp(imagePath).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: metadata.size,
      hasAlpha: metadata.hasAlpha,
    };
  } catch (error) {
    console.error("❌ Ошибка получения информации об изображении:", error);
    return null;
  }
}
