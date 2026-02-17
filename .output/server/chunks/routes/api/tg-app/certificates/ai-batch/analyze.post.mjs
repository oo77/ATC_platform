import { g as defineEventHandler, r as readBody, h as createError, f as executeQuery } from '../../../../../_/nitro.mjs';
import { a as aiCertificateRepository } from '../../../../../_/aiCertificateRepository.mjs';
import { p as pdfConverter, C as CertificateAIProcessor, S as StudentMatcher } from '../../../../../_/pdfConverter.mjs';
import { j as getStudentsByOrganizationId } from '../../../../../_/studentRepository.mjs';
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
    console.log(
      "[TG-App] POST /api/tg-app/certificates/ai-batch/analyze - AI \u0430\u043D\u0430\u043B\u0438\u0437"
    );
    const body = await readBody(event);
    const { fileIds, organizationId } = body;
    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      throw createError({
        statusCode: 400,
        message: "fileIds \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D (\u043C\u0430\u0441\u0441\u0438\u0432 ID \u0444\u0430\u0439\u043B\u043E\u0432)"
      });
    }
    if (!organizationId) {
      throw createError({
        statusCode: 400,
        message: "organizationId \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D"
      });
    }
    console.log(
      `[TG-App] \u0410\u043D\u0430\u043B\u0438\u0437 ${fileIds.length} \u0444\u0430\u0439\u043B\u043E\u0432 \u0434\u043B\u044F organizationId=${organizationId}`
    );
    const organizationStudents = await getStudentsByOrganizationId(organizationId);
    console.log(
      `[TG-App] \u0417\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u043E ${organizationStudents.length} \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u043E\u0432 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438`
    );
    if (organizationStudents.length === 0) {
      throw createError({
        statusCode: 400,
        message: "\u0412 \u0432\u0430\u0448\u0435\u0439 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438 \u043D\u0435\u0442 \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0435\u0439. \u0414\u043E\u0431\u0430\u0432\u044C\u0442\u0435 \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0435\u0439 \u043F\u0435\u0440\u0435\u0434 \u0438\u043C\u043F\u043E\u0440\u0442\u043E\u043C \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432."
      });
    }
    const filesToProcess = [];
    for (const fileId of fileIds) {
      try {
        const log = await aiCertificateRepository.getLogById(fileId);
        if (!log) {
          console.error(`[TG-App] \u041B\u043E\u0433 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u0434\u043B\u044F fileId: ${fileId}`);
          continue;
        }
        const internalData = log.extractedData?._internal;
        if (internalData?.organizationId !== organizationId) {
          console.error(
            `[TG-App] \u0424\u0430\u0439\u043B ${fileId} \u043D\u0435 \u043F\u0440\u0438\u043D\u0430\u0434\u043B\u0435\u0436\u0438\u0442 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438 ${organizationId}`
          );
          continue;
        }
        if (log.status === "success" && log.extractedData && !("_internal" in log.extractedData)) {
          filesToProcess.push({
            fileId: log.id,
            filename: log.originalFilename,
            buffer: Buffer.from(""),
            mimeType: "",
            log
          });
          continue;
        }
        if (!internalData?.tempFilePath) {
          console.error(
            `[TG-App] \u041F\u0443\u0442\u044C \u043A \u0444\u0430\u0439\u043B\u0443 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u0434\u043B\u044F ${log.originalFilename}`
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
              `[TG-App] \u041E\u0448\u0438\u0431\u043A\u0430 PDF \u0434\u043B\u044F ${log.originalFilename}:`,
              pdfError
            );
            await aiCertificateRepository.updateLog(fileId, {
              status: "failed",
              errorMessage: `\u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438 PDF: ${pdfError.message}`,
              processingCompletedAt: /* @__PURE__ */ new Date()
            });
            continue;
          }
        } else {
          try {
            imageBuffer = await fs.readFile(filePath);
          } catch (readError) {
            console.error(
              `[TG-App] \u041E\u0448\u0438\u0431\u043A\u0430 \u0447\u0442\u0435\u043D\u0438\u044F \u0444\u0430\u0439\u043B\u0430 ${log.originalFilename}:`,
              readError
            );
            await aiCertificateRepository.updateLog(fileId, {
              status: "failed",
              errorMessage: `\u041E\u0448\u0438\u0431\u043A\u0430 \u0447\u0442\u0435\u043D\u0438\u044F \u0444\u0430\u0439\u043B\u0430: ${readError.message}`,
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
        console.error(`[TG-App] \u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u043A\u0438 \u0444\u0430\u0439\u043B\u0430 ${fileId}:`, error);
      }
    }
    console.log(
      `[TG-App] \u041F\u043E\u0434\u0433\u043E\u0442\u043E\u0432\u043B\u0435\u043D\u043E ${filesToProcess.length} \u0444\u0430\u0439\u043B\u043E\u0432 \u0434\u043B\u044F \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438`
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
      `[TG-App] AI \u0430\u043D\u0430\u043B\u0438\u0437 \u0437\u0430\u0432\u0435\u0440\u0448\u0451\u043D: ${aiProcessingResult.successCount} \u0443\u0441\u043F\u0435\u0448\u043D\u043E, ${aiProcessingResult.errorCount} \u043E\u0448\u0438\u0431\u043E\u043A`
    );
    const processedResults = [];
    let duplicatesCount = 0;
    for (const result of aiProcessingResult.results) {
      const fileData = filesToProcess.find((f) => f.fileId === result.fileId);
      if (!fileData) continue;
      if (result.success && result.extractedData) {
        if (fileData.rawTextFromPdf) {
          result.extractedData.rawText = (result.extractedData.rawText ? result.extractedData.rawText + "\n\nPDF RAW:\n" : "PDF RAW:\n") + fileData.rawTextFromPdf.substring(0, 500);
        }
        let isDuplicate = false;
        let duplicateInfo = null;
        const certNumber = result.extractedData.certificateNumber;
        if (certNumber) {
          const existingCerts = await executeQuery(
            `SELECT ic.id, ic.certificate_number, ic.student_id, s.full_name as student_name
             FROM issued_certificates ic
             JOIN students s ON ic.student_id = s.id
             WHERE ic.certificate_number = ? LIMIT 1`,
            [certNumber.trim()]
          );
          if (existingCerts.length > 0) {
            isDuplicate = true;
            duplicateInfo = `\u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442 (\u0432\u044B\u0434\u0430\u043D: ${existingCerts[0].student_name})`;
            duplicatesCount++;
          }
        }
        let matchResult = {
          student: null,
          confidence: 0,
          matchMethod: "none",
          topAlternatives: []
        };
        try {
          console.log(
            `[TG-App] \u{1F50D} \u041F\u043E\u0438\u0441\u043A \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u0430 \u0434\u043B\u044F "${result.extractedData.fullName}" \u0441\u0440\u0435\u0434\u0438 ${organizationStudents.length} \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0435\u0439 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438 ${organizationId}`
          );
          const match = await StudentMatcher.findMatchingStudent(
            result.extractedData,
            organizationStudents
          );
          matchResult = {
            student: match.student,
            confidence: match.confidence,
            matchMethod: match.matchMethod,
            topAlternatives: match.topAlternatives || []
          };
          if (match.student) {
            console.log(
              `[TG-App] \u2705 \u041D\u0430\u0439\u0434\u0435\u043D \u0441\u0442\u0443\u0434\u0435\u043D\u0442: ${match.student.fullName} (\u0443\u0432\u0435\u0440\u0435\u043D\u043D\u043E\u0441\u0442\u044C: ${Math.round(match.confidence * 100)}%, \u043C\u0435\u0442\u043E\u0434: ${match.matchMethod})`
            );
          } else {
            console.log(
              `[TG-App] \u26A0\uFE0F \u0421\u0442\u0443\u0434\u0435\u043D\u0442 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D. \u041F\u0440\u0438\u0447\u0438\u043D\u0430: ${match.explanation || "\u041D\u0435\u0442 \u0441\u043E\u0432\u043F\u0430\u0434\u0435\u043D\u0438\u0439"}`
            );
            console.log(
              `[TG-App] \u{1F4CA} \u0422\u043E\u043F-\u0430\u043B\u044C\u0442\u0435\u0440\u043D\u0430\u0442\u0438\u0432: ${match.topAlternatives?.length || 0}`
            );
          }
        } catch (matchError) {
          console.error(
            `[TG-App] \u274C \u041A\u0420\u0418\u0422\u0418\u0427\u0415\u0421\u041A\u0410\u042F \u041E\u0428\u0418\u0411\u041A\u0410 \u043F\u0440\u0438 \u043F\u043E\u0438\u0441\u043A\u0435 \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u0430 \u0434\u043B\u044F "${result.filename}":`
          );
          console.error(`[TG-App]    \u0422\u0438\u043F \u043E\u0448\u0438\u0431\u043A\u0438: ${matchError.name}`);
          console.error(`[TG-App]    \u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435: ${matchError.message}`);
          console.error(`[TG-App]    Stack trace:`, matchError.stack);
          try {
            console.log(`[TG-App] \u{1F504} \u041F\u043E\u043F\u044B\u0442\u043A\u0430 \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u043E\u0433\u043E \u043F\u043E\u0438\u0441\u043A\u0430 \u0430\u043B\u044C\u0442\u0435\u0440\u043D\u0430\u0442\u0438\u0432...`);
            const { StudentMatcher: LocalMatcher } = await import('../../../../../_/pdfConverter.mjs').then(function (n) { return n.s; });
            const candidates = LocalMatcher.getTopCandidates(
              result.extractedData.fullName || "",
              organizationStudents,
              5
            );
            if (candidates && candidates.length > 0) {
              matchResult.topAlternatives = candidates.map((c) => ({
                student: {
                  id: c.id,
                  fullName: c.fullName,
                  organization: c.organization,
                  position: c.position,
                  pinfl: c.pinfl,
                  passportSeries: c.passportSeries,
                  passportNumber: c.passportNumber,
                  organizationId: c.organizationId,
                  createdAt: c.createdAt,
                  updatedAt: c.updatedAt
                },
                matchScore: c.matchScore || 0
              }));
              console.log(
                `[TG-App] \u2705 \u041B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0439 \u043F\u043E\u0438\u0441\u043A \u043D\u0430\u0448\u0451\u043B ${matchResult.topAlternatives.length} \u0430\u043B\u044C\u0442\u0435\u0440\u043D\u0430\u0442\u0438\u0432`
              );
            } else {
              console.log(`[TG-App] \u26A0\uFE0F \u041B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0439 \u043F\u043E\u0438\u0441\u043A \u043D\u0435 \u043D\u0430\u0448\u0451\u043B \u0430\u043B\u044C\u0442\u0435\u0440\u043D\u0430\u0442\u0438\u0432`);
            }
          } catch (fallbackError) {
            console.error(
              `[TG-App] \u274C \u041E\u0448\u0438\u0431\u043A\u0430 \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u043E\u0433\u043E \u043F\u043E\u0438\u0441\u043A\u0430:`,
              fallbackError.message
            );
          }
          matchResult.matchMethod = "none";
          matchResult.confidence = 0;
        }
        await aiCertificateRepository.updateLog(result.fileId, {
          status: "success",
          processingCompletedAt: /* @__PURE__ */ new Date(),
          processingDurationMs: result.processingTime,
          aiTokensUsed: result.tokensUsed?.total || 0,
          aiCostUsd: result.tokensUsed ? CertificateAIProcessor.estimateCost(result.tokensUsed.total) : 0,
          aiConfidence: result.extractedData.confidence,
          extractedData: {
            ...result.extractedData,
            // Добавляем служебные поля для информации о дубликатах
            _isDuplicate: isDuplicate,
            _duplicateInfo: duplicateInfo
          }
          // Type assertion для служебных полей
        });
        processedResults.push({
          success: true,
          fileId: result.fileId,
          filename: result.filename,
          extractedData: {
            ...result.extractedData,
            _isDuplicate: isDuplicate,
            _duplicateInfo: duplicateInfo
          },
          matchResult,
          tokensUsed: result.tokensUsed || void 0,
          processingTime: result.processingTime,
          aiCost: result.tokensUsed ? CertificateAIProcessor.estimateCost(
            result.tokensUsed.total
          ).toFixed(4) : void 0
        });
      } else {
        const errorMessage = result.error || "\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u0430\u044F \u043E\u0448\u0438\u0431\u043A\u0430";
        let userMessage = "\u041E\u0448\u0438\u0431\u043A\u0430 \u0430\u043D\u0430\u043B\u0438\u0437\u0430 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430";
        if (errorMessage.includes("402") || errorMessage.includes("credits")) {
          userMessage = "\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043A\u0440\u0435\u0434\u0438\u0442\u043E\u0432 \u043D\u0430 \u0430\u043A\u043A\u0430\u0443\u043D\u0442\u0435 API";
        } else if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
          userMessage = "\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 API \u043A\u043B\u044E\u0447";
        } else if (errorMessage.includes("429") || errorMessage.includes("rate")) {
          userMessage = "\u041F\u0440\u0435\u0432\u044B\u0448\u0435\u043D \u043B\u0438\u043C\u0438\u0442 \u0437\u0430\u043F\u0440\u043E\u0441\u043E\u0432 \u043A API";
        }
        await aiCertificateRepository.updateLog(result.fileId, {
          status: "failed",
          errorMessage: `${userMessage}: ${errorMessage}`,
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
    const successCount = processedResults.filter((r) => r.success).length;
    const failedCount = processedResults.filter((r) => !r.success).length;
    const totalCost = processedResults.filter((r) => r.success && r.aiCost).reduce((sum, r) => sum + parseFloat(r.aiCost || "0"), 0);
    console.log(
      `[TG-App] \u0410\u043D\u0430\u043B\u0438\u0437 \u0437\u0430\u0432\u0435\u0440\u0448\u0451\u043D: ${successCount} \u0443\u0441\u043F\u0435\u0448\u043D\u043E, ${failedCount} \u043E\u0448\u0438\u0431\u043E\u043A, ${duplicatesCount} \u0434\u0443\u0431\u043B\u0438\u043A\u0430\u0442\u043E\u0432`
    );
    return {
      success: successCount > 0,
      results: processedResults,
      stats: {
        total: fileIds.length,
        success: successCount,
        failed: failedCount,
        duplicates: duplicatesCount,
        totalCost: totalCost.toFixed(4)
      },
      organizationStudentsCount: organizationStudents.length
    };
  }
);

export { analyze_post as default };
//# sourceMappingURL=analyze.post.mjs.map
