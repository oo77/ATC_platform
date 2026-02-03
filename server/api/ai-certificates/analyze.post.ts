import { aiCertificateRepository } from "../../repositories/aiCertificateRepository";
import { CertificateAIProcessor } from "../../utils/ai/certificateAIProcessor";
import { StudentMatcher } from "../../utils/ai/studentMatcher";
import { getAllStudents } from "../../repositories/studentRepository";
import { pdfConverter } from "../../utils/ai/pdfConverter";
import { requirePermission } from "../../utils/permissions";
import { Permission } from "../../types/permissions";
import fs from "fs/promises";
import type { ProcessingLogStatus } from "../../types/aiCertificateImport";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.CERTIFICATES_ISSUE);
  const body = await readBody(event);
  const { fileId } = body;

  if (!fileId) {
    throw createError({ statusCode: 400, message: "File ID is required" });
  }

  // 1. Получаем лог
  const log = await aiCertificateRepository.getLogById(fileId);
  if (!log) {
    throw createError({ statusCode: 404, message: "Log not found" });
  }

  // Если уже успешно обработан, возвращаем результат
  if (
    log.status === "success" &&
    log.extractedData &&
    !("_internal" in log.extractedData)
  ) {
    return { success: true, alreadyProcessed: true, data: log };
  }

  // Получаем путь к файлу из временных данных
  // @ts-ignore
  const internalData = log.extractedData?._internal;

  // Если нет внутреннего пути, но файл "pending", это ошибка состояния
  if (!internalData || !internalData.tempFilePath) {
    // Если статус уже success/failed, возможно данные уже были очищены
    if (log.status !== "pending" && log.status !== "processing") {
      return { success: true, data: log };
    }
    throw createError({
      statusCode: 500,
      message: "File path lost or corrupted state",
    });
  }

  const filePath = internalData.tempFilePath;
  const mimeType = internalData.mimeType;

  // Обновляем статус на processing
  await aiCertificateRepository.updateLog(fileId, {
    status: "processing" as ProcessingLogStatus,
    aiModel: process.env.OPENAI_VISION_MODEL || "gpt-4o",
  });

  try {
    let imageBuffer: Buffer;
    let processingMimeType = mimeType;
    let rawTextFromPdf = "";

    // 2. Подготовка файла
    if (mimeType === "application/pdf") {
      try {
        // Конвертация PDF -> Image (первая страница)
        imageBuffer = await pdfConverter.convertFirstPageToImage(filePath);
        processingMimeType = "image/jpeg";

        // Попытка извлечь текст (экономия токенов / доп контекст)
        rawTextFromPdf = await pdfConverter.extractText(filePath);
      } catch (pdfError: any) {
        throw new Error(`PDF Processing error: ${pdfError.message}`);
      }
    } else {
      // Чтение изображения
      try {
        imageBuffer = await fs.readFile(filePath);
      } catch (readError: any) {
        throw new Error(`File read error: ${readError.message}`);
      }
    }

    // 3. AI Анализ
    const aiResult = await CertificateAIProcessor.processCertificate(
      imageBuffer,
      processingMimeType,
      log.originalFilename,
    );

    // Если был извлечен текст из PDF, добавим его к результату для отладки
    if (rawTextFromPdf) {
      aiResult.extractedData.rawText =
        (aiResult.extractedData.rawText
          ? aiResult.extractedData.rawText + "\n\nPDF RAW:\n"
          : "PDF RAW:\n") + rawTextFromPdf.substring(0, 500); // Ограничим длину чтобы не засорять JSON
    }

    // 4. Поиск студента
    // Загружаем всех студентов для поиска
    // TODO: Оптимизировать для больших баз (сейчас грузит всех)
    const allStudents = await getAllStudents();

    const matchResult = await StudentMatcher.findMatchingStudent(
      aiResult.extractedData,
      allStudents,
    );

    // 5. Сохранение результата
    const status: ProcessingLogStatus = "success"; // Успешно обработано технически

    // Удаляем _internal данные, но оставляем ссылку на файл (он все еще там лежит)
    // В extractedData пойдет чистый результат AI

    const updatedLog = await aiCertificateRepository.updateLog(fileId, {
      status: status,
      processingCompletedAt: new Date(),
      processingDurationMs: aiResult.processingTime,

      aiTokensUsed: aiResult.tokensUsed.total,
      aiCostUsd: CertificateAIProcessor.estimateCost(aiResult.tokensUsed.total),
      aiConfidence: aiResult.extractedData.confidence,

      extractedData: aiResult.extractedData,

      matchedStudentId: matchResult.student?.id,
      matchMethod: matchResult.matchMethod,
      matchConfidence: matchResult.confidence,
      // explanation from mismatch is not stored in db column directly, usually goes to client or could be part of error_message if failed
      // But we have processing_log structured to hold extraction, not match details aside from ID/Method/Conf.
    });

    // 6. Формирование ответа в соответствии с интерфейсом AIProcessingResult
    // Frontend ожидает плоскую структуру, а не вложенную в data

    // @ts-ignore
    return {
      success: true,
      extractedData: aiResult.extractedData,
      matchResult: matchResult,
      aiCost: CertificateAIProcessor.estimateCost(
        aiResult.tokensUsed.total,
      ).toFixed(4),
      processingTime: aiResult.processingTime,
      tokensUsed: aiResult.tokensUsed,
    };
  } catch (error: any) {
    console.error("AI Analysis Failed:", error);

    // Классификация ошибки для понятного сообщения пользователю
    const errorMessage = error.message || String(error);
    let userMessage = "Ошибка анализа сертификата";
    let errorType = "unknown";
    let statusCode = 500;

    if (
      errorMessage.includes("402") ||
      errorMessage.includes("credits") ||
      errorMessage.includes("afford")
    ) {
      errorType = "insufficient_credits";
      statusCode = 402;

      // Парсим доступные токены из сообщения
      const availableMatch = errorMessage.match(/can only afford (\d+)/);
      const requestedMatch = errorMessage.match(/requested up to (\d+)/);

      if (availableMatch && requestedMatch) {
        userMessage = `Недостаточно кредитов на аккаунте API. Запрошено ${requestedMatch[1]} токенов, доступно ${availableMatch[1]}. Пополните баланс на https://openrouter.ai/settings/credits или уменьшите max_tokens в настройках.`;
      } else {
        userMessage =
          "Недостаточно кредитов на аккаунте API. Пополните баланс на https://openrouter.ai/settings/credits";
      }
    } else if (
      errorMessage.includes("401") ||
      errorMessage.includes("Unauthorized")
    ) {
      errorType = "invalid_key";
      statusCode = 401;
      userMessage =
        "Неверный API ключ. Проверьте настройки AI в панели администратора.";
    } else if (errorMessage.includes("429") || errorMessage.includes("rate")) {
      errorType = "rate_limit";
      statusCode = 429;
      userMessage =
        "Превышен лимит запросов к API. Подождите минуту и попробуйте снова.";
    } else if (
      errorMessage.includes("ECONNREFUSED") ||
      errorMessage.includes("network")
    ) {
      errorType = "network";
      statusCode = 503;
      userMessage =
        "Ошибка сети при подключении к AI API. Проверьте подключение к интернету.";
    } else if (errorMessage.includes("model") && errorMessage.includes("not")) {
      errorType = "model_error";
      userMessage =
        "Модель AI недоступна. Проверьте настройки модели в панели администратора.";
    } else if (
      errorMessage.includes("context length") ||
      errorMessage.includes("16385 tokens")
    ) {
      errorType = "context_overflow";
      userMessage =
        "Слишком длинный контекст запроса. Попробуйте загрузить файл меньшего размера.";
    }

    await aiCertificateRepository.updateLog(fileId, {
      status: "failed" as ProcessingLogStatus,
      errorMessage: `[${errorType}] ${userMessage}`,
      processingCompletedAt: new Date(),
    });

    throw createError({
      statusCode,
      message: userMessage,
      data: {
        errorType,
        originalError:
          process.env.NODE_ENV === "development" ? errorMessage : undefined,
      },
    });
  }
});
