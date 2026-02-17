import { g as defineEventHandler, r as readBody, h as createError } from '../../../../_/nitro.mjs';
import { a as aiCertificateRepository } from '../../../../_/aiCertificateRepository.mjs';
import { p as pdfConverter, C as CertificateAIProcessor, S as StudentMatcher } from '../../../../_/pdfConverter.mjs';
import { g as getAllStudents } from '../../../../_/studentRepository.mjs';
import { r as requirePermission, P as Permission } from '../../../../_/permissions.mjs';
import fs from 'fs/promises';
import 'grammy';
import 'uuid';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'mysql2/promise';
import 'bcryptjs';
import 'crypto';
import 'node:url';
import 'jsonwebtoken';
import 'openai';
import 'sharp';
import 'pdf-lib';

const analyze_post = defineEventHandler(
  async (event) => {
    await requirePermission(event, Permission.CERTIFICATES_ISSUE);
    const body = await readBody(event);
    const { fileIds } = body;
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      throw createError({
        statusCode: 400,
        message: "File IDs array is required"
      });
    }
    console.log(
      `[Batch Analyze] Starting analysis for ${fileIds.length} files`
    );
    const filesToProcess = [];
    for (let i = 0; i < fileIds.length; i++) {
      const fileId = fileIds[i];
      try {
        const log = await aiCertificateRepository.getLogById(fileId);
        if (!log) {
          console.error(`[Batch Analyze] Log not found for fileId: ${fileId}`);
          continue;
        }
        if (log.status === "success" && log.extractedData && !("_internal" in log.extractedData)) {
          console.log(
            `[Batch Analyze] File ${i + 1}/${fileIds.length} already processed: ${log.originalFilename}`
          );
          filesToProcess.push({
            fileId: log.id,
            filename: log.originalFilename,
            buffer: Buffer.from(""),
            // Пустой буфер для уже обработанных
            mimeType: "",
            log
          });
          continue;
        }
        const internalData = log.extractedData?._internal;
        if (!internalData || !internalData.tempFilePath) {
          console.error(
            `[Batch Analyze] File path not found for ${log.originalFilename}`
          );
          continue;
        }
        const filePath = internalData.tempFilePath;
        const mimeType = internalData.mimeType;
        await aiCertificateRepository.updateLog(fileId, {
          status: "processing",
          aiModel: process.env.OPENAI_VISION_MODEL || "gpt-4o"
        });
        let imageBuffer;
        let processingMimeType = mimeType;
        let rawTextFromPdf;
        if (mimeType === "application/pdf") {
          try {
            imageBuffer = await pdfConverter.convertFirstPageToImage(filePath);
            processingMimeType = "image/jpeg";
            rawTextFromPdf = await pdfConverter.extractText(filePath);
          } catch (pdfError) {
            console.error(
              `[Batch Analyze] PDF error for ${log.originalFilename}:`,
              pdfError
            );
            await aiCertificateRepository.updateLog(fileId, {
              status: "failed",
              errorMessage: `PDF Processing error: ${pdfError.message}`,
              processingCompletedAt: /* @__PURE__ */ new Date()
            });
            continue;
          }
        } else {
          try {
            imageBuffer = await fs.readFile(filePath);
          } catch (readError) {
            console.error(
              `[Batch Analyze] File read error for ${log.originalFilename}:`,
              readError
            );
            await aiCertificateRepository.updateLog(fileId, {
              status: "failed",
              errorMessage: `File read error: ${readError.message}`,
              processingCompletedAt: /* @__PURE__ */ new Date()
            });
            continue;
          }
        }
        filesToProcess.push({
          fileId: log.id,
          filename: log.originalFilename,
          buffer: imageBuffer,
          mimeType: processingMimeType,
          log,
          rawTextFromPdf
        });
      } catch (error) {
        console.error(`[Batch Analyze] Error preparing file ${i + 1}:`, error);
      }
    }
    console.log(
      `[Batch Analyze] Prepared ${filesToProcess.length} files for processing`
    );
    const aiProcessingResult = await CertificateAIProcessor.processBatch(
      filesToProcess.map((f) => ({
        fileId: f.fileId,
        filename: f.filename,
        buffer: f.buffer,
        mimeType: f.mimeType
      }))
    );
    console.log(
      `[Batch Analyze] Batch processing completed: ${aiProcessingResult.successCount} success, ${aiProcessingResult.errorCount} failed`
    );
    const processedResults = [];
    for (const result of aiProcessingResult.results) {
      const fileData = filesToProcess.find((f) => f.fileId === result.fileId);
      if (!fileData) continue;
      if (result.success && result.extractedData) {
        if (fileData.rawTextFromPdf) {
          result.extractedData.rawText = (result.extractedData.rawText ? result.extractedData.rawText + "\n\nPDF RAW:\n" : "PDF RAW:\n") + fileData.rawTextFromPdf.substring(0, 500);
        }
        await aiCertificateRepository.updateLog(result.fileId, {
          status: "success",
          processingCompletedAt: /* @__PURE__ */ new Date(),
          processingDurationMs: result.processingTime,
          aiTokensUsed: result.tokensUsed?.total || 0,
          aiCostUsd: result.tokensUsed ? CertificateAIProcessor.estimateCost(result.tokensUsed.total) : 0,
          aiConfidence: result.extractedData.confidence,
          extractedData: result.extractedData
        });
        processedResults.push({
          success: true,
          fileId: result.fileId,
          filename: result.filename,
          extractedData: result.extractedData,
          matchResult: null,
          // Будет заполнено позже при сопоставлении студентов
          tokensUsed: result.tokensUsed || void 0,
          processingTime: result.processingTime,
          aiCost: result.tokensUsed ? CertificateAIProcessor.estimateCost(
            result.tokensUsed.total
          ).toFixed(4) : void 0
        });
      } else {
        const errorMessage = result.error || "Unknown error";
        let userMessage = "\u041E\u0448\u0438\u0431\u043A\u0430 \u0430\u043D\u0430\u043B\u0438\u0437\u0430 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430";
        let errorType = "unknown";
        if (errorMessage.includes("402") || errorMessage.includes("credits") || errorMessage.includes("afford")) {
          errorType = "insufficient_credits";
          userMessage = "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043A\u0440\u0435\u0434\u0438\u0442\u043E\u0432 \u043D\u0430 \u0430\u043A\u043A\u0430\u0443\u043D\u0442\u0435 API";
        } else if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
          errorType = "invalid_key";
          userMessage = "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 API \u043A\u043B\u044E\u0447";
        } else if (errorMessage.includes("429") || errorMessage.includes("rate")) {
          errorType = "rate_limit";
          userMessage = "\u041F\u0440\u0435\u0432\u044B\u0448\u0435\u043D \u043B\u0438\u043C\u0438\u0442 \u0437\u0430\u043F\u0440\u043E\u0441\u043E\u0432 \u043A API";
        } else if (errorMessage.includes("\u041F\u0443\u0441\u0442\u043E\u0439 \u043E\u0442\u0432\u0435\u0442")) {
          errorType = "empty_response";
          userMessage = "\u041F\u0443\u0441\u0442\u043E\u0439 \u043E\u0442\u0432\u0435\u0442 \u043E\u0442 AI (\u0432\u043E\u0437\u043C\u043E\u0436\u043D\u043E rate limiting)";
        }
        await aiCertificateRepository.updateLog(result.fileId, {
          status: "failed",
          errorMessage: `[${errorType}] ${userMessage}`,
          processingCompletedAt: /* @__PURE__ */ new Date()
        });
        processedResults.push({
          success: false,
          fileId: result.fileId,
          filename: result.filename,
          extractedData: null,
          matchResult: null,
          error: `${userMessage}: ${errorMessage}`
        });
      }
    }
    const successfulAnalyses = processedResults.filter(
      (r) => r.success && r.extractedData
    );
    console.log(
      `[Batch Analyze] AI Analysis completed: ${successfulAnalyses.length} success, ${processedResults.filter((r) => !r.success).length} failed`
    );
    let matchResults = /* @__PURE__ */ new Map();
    if (successfulAnalyses.length > 0) {
      try {
        console.log(
          `[Batch Analyze] Starting batch student matching for ${successfulAnalyses.length} certificates`
        );
        const allStudents = await getAllStudents();
        console.log(
          `[Batch Analyze] Loaded ${allStudents.length} students from database`
        );
        const matchPromises = successfulAnalyses.map(async (analysis) => {
          if (!analysis.extractedData) return null;
          try {
            const matchResult = await StudentMatcher.findMatchingStudent(
              analysis.extractedData,
              allStudents
            );
            return {
              fileId: analysis.fileId,
              matchResult
            };
          } catch (matchError) {
            console.error(
              `[Batch Analyze] Error matching students for ${analysis.filename}:`,
              matchError
            );
            return {
              fileId: analysis.fileId,
              matchResult: {
                student: null,
                confidence: 0,
                matchMethod: "none",
                topAlternatives: []
              }
            };
          }
        });
        const matchResultsArray = await Promise.allSettled(matchPromises);
        matchResultsArray.forEach((result) => {
          if (result.status === "fulfilled" && result.value) {
            const matchResult = result.value.matchResult;
            matchResults.set(result.value.fileId, {
              ...matchResult,
              topAlternatives: matchResult.topAlternatives || []
            });
          }
        });
        console.log(
          `[Batch Analyze] Student matching completed for ${matchResults.size} certificates`
        );
      } catch (dbError) {
        console.error(
          "[Batch Analyze] Error loading students from database:",
          dbError
        );
      }
    }
    const enrichedResults = processedResults.map(
      (result) => {
        if (!result.success || !result.extractedData) {
          return result;
        }
        const matchData = matchResults.get(result.fileId);
        if (!matchData) {
          return result;
        }
        const topAlternatives = matchData.topAlternatives || [];
        return {
          ...result,
          matchResult: {
            student: matchData.student,
            confidence: matchData.confidence,
            matchMethod: matchData.matchMethod,
            topAlternatives
          }
        };
      }
    );
    fileIds.length;
    const successCount = processedResults.filter((r) => r.success).length;
    const failedCount = processedResults.filter((r) => !r.success).length;
    const matchedCount = enrichedResults.filter(
      (r) => r.success && r.matchResult?.student
    ).length;
    const totalCost = enrichedResults.filter((r) => r.success && r.aiCost).reduce((sum, r) => sum + parseFloat(r.aiCost || "0"), 0);
    const totalTokens = enrichedResults.filter((r) => r.success && r.tokensUsed).reduce((sum, r) => sum + (r.tokensUsed?.total || 0), 0);
    console.log(
      `[Batch Analyze] Final stats: ${successCount} success, ${failedCount} failed, ${matchedCount} matched`
    );
    console.log(
      `[Batch Analyze] Total cost: $${totalCost.toFixed(4)}, tokens: ${totalTokens}`
    );
    const totalProcessingTime = enrichedResults.filter((r) => r.success && r.processingTime).reduce((sum, r) => sum + (r.processingTime || 0), 0);
    const batchResult = {
      results: enrichedResults,
      successCount,
      errorCount: failedCount,
      totalCost: totalCost.toFixed(4),
      totalProcessingTime,
      totalTokensUsed: totalTokens
    };
    return batchResult;
  }
);

export { analyze_post as default };
//# sourceMappingURL=analyze.post.mjs.map
