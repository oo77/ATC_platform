import { w as getDbPool } from './nitro.mjs';
import { v4 } from 'uuid';

const TABLE_NAME = "ai_certificate_processing_logs";
const aiCertificateRepository = {
  /**
   * Создать лог обработки
   */
  async createLog(data) {
    const db = getDbPool();
    const id = v4();
    const now = /* @__PURE__ */ new Date();
    const query = `
      INSERT INTO ${TABLE_NAME} (
        id, certificate_id, original_filename, file_size_bytes,
        processing_started_at, processing_completed_at, processing_duration_ms,
        ai_model, ai_tokens_used, ai_cost_usd, ai_confidence,
        status, extracted_data, error_message,
        matched_student_id, match_method, match_confidence,
        processed_by, ip_address, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      id,
      data.certificateId || null,
      data.originalFilename,
      data.fileSizeBytes,
      data.processingStartedAt,
      data.processingCompletedAt || null,
      data.processingDurationMs || null,
      data.aiModel,
      data.aiTokensUsed || null,
      data.aiCostUsd || null,
      data.aiConfidence || null,
      data.status,
      data.extractedData ? JSON.stringify(data.extractedData) : null,
      data.errorMessage || null,
      data.matchedStudentId || null,
      data.matchMethod || null,
      data.matchConfidence || null,
      data.processedBy,
      data.ipAddress || null,
      now
    ];
    await db.execute(query, values);
    return this.getLogById(id);
  },
  /**
   * Обновить сертификат данными из AI
   */
  async updateCertificateWithAiData(certId, data) {
    const db = getDbPool();
    await db.execute(
      `
      UPDATE issued_certificates 
      SET 
        ai_extracted_data = ?,
        ai_confidence = ?,
        import_source = 'ai_scan',
        original_file_url = COALESCE(?, original_file_url)
      WHERE id = ?
    `,
      [
        JSON.stringify(data.extractedData),
        data.confidence,
        data.originalFileUrl || null,
        certId
      ]
    );
  },
  /**
   * Обновить существующий лог
   */
  async updateLog(id, data) {
    const db = getDbPool();
    const updates = [];
    const values = [];
    if (data.certificateId !== void 0) {
      updates.push("certificate_id = ?");
      values.push(data.certificateId);
    }
    if (data.processingCompletedAt !== void 0) {
      updates.push("processing_completed_at = ?");
      values.push(data.processingCompletedAt);
    }
    if (data.processingDurationMs !== void 0) {
      updates.push("processing_duration_ms = ?");
      values.push(data.processingDurationMs);
    }
    if (data.aiTokensUsed !== void 0) {
      updates.push("ai_tokens_used = ?");
      values.push(data.aiTokensUsed);
    }
    if (data.aiCostUsd !== void 0) {
      updates.push("ai_cost_usd = ?");
      values.push(data.aiCostUsd);
    }
    if (data.aiConfidence !== void 0) {
      updates.push("ai_confidence = ?");
      values.push(data.aiConfidence);
    }
    if (data.status !== void 0) {
      updates.push("status = ?");
      values.push(data.status);
    }
    if (data.extractedData !== void 0) {
      updates.push("extracted_data = ?");
      values.push(
        data.extractedData ? JSON.stringify(data.extractedData) : null
      );
    }
    if (data.errorMessage !== void 0) {
      updates.push("error_message = ?");
      values.push(data.errorMessage);
    }
    if (data.matchedStudentId !== void 0) {
      updates.push("matched_student_id = ?");
      values.push(data.matchedStudentId);
    }
    if (data.matchMethod !== void 0) {
      updates.push("match_method = ?");
      values.push(data.matchMethod);
    }
    if (data.matchConfidence !== void 0) {
      updates.push("match_confidence = ?");
      values.push(data.matchConfidence);
    }
    if (updates.length === 0) {
      return this.getLogById(id);
    }
    values.push(id);
    const query = `UPDATE ${TABLE_NAME} SET ${updates.join(", ")} WHERE id = ?`;
    await db.execute(query, values);
    return this.getLogById(id);
  },
  /**
   * Получить лог по ID
   */
  async getLogById(id) {
    const db = getDbPool();
    const [rows] = await db.execute(
      `SELECT * FROM ${TABLE_NAME} WHERE id = ?`,
      [id]
    );
    if (!rows || rows.length === 0) return null;
    return this.mapRowToLog(rows[0]);
  },
  /**
   * Получить список логов с фильтрацией и пагинацией
   */
  async getLogs(filters) {
    const db = getDbPool();
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;
    let whereClause = "WHERE 1=1";
    const values = [];
    if (filters.status) {
      whereClause += " AND status = ?";
      values.push(filters.status);
    }
    if (filters.processedBy) {
      whereClause += " AND processed_by = ?";
      values.push(filters.processedBy);
    }
    if (filters.dateFrom) {
      whereClause += " AND created_at >= ?";
      values.push(filters.dateFrom);
    }
    if (filters.dateTo) {
      whereClause += " AND created_at <= ?";
      values.push(filters.dateTo);
    }
    const [countResult] = await db.execute(
      `SELECT COUNT(*) as total FROM ${TABLE_NAME} ${whereClause}`,
      values
    );
    const total = countResult[0].total;
    const query = `
      SELECT * FROM ${TABLE_NAME} 
      ${whereClause} 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    const queryValues = [...values, limit.toString(), offset.toString()];
    const [rows] = await db.execute(query, queryValues);
    return {
      logs: rows.map(this.mapRowToLog),
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  },
  /**
   * Получить статистику по импорту
   */
  async getStats() {
    const db = getDbPool();
    const [basicStats] = await db.execute(`
      SELECT 
        COUNT(*) as totalProcessed,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successCount,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failedCount,
        AVG(processing_duration_ms) as avgTime,
        AVG(ai_confidence) as avgConfidence,
        SUM(ai_cost_usd) as totalCost,
        AVG(ai_cost_usd) as avgCost
      FROM ${TABLE_NAME}
    `);
    const stats = basicStats[0];
    const totalProcessed = stats.totalProcessed || 0;
    const [methodStats] = await db.execute(`
      SELECT match_method, COUNT(*) as count
      FROM ${TABLE_NAME}
      WHERE match_method IS NOT NULL
      GROUP BY match_method
    `);
    const methods = {
      exact_pinfl: 0,
      exact_name: 0,
      fuzzy_ai: 0,
      manual: 0
    };
    methodStats.forEach((row) => {
      if (methods[row.match_method] !== void 0) {
        methods[row.match_method] = row.count;
      }
    });
    const manualCount = methods.manual;
    return {
      totalProcessed,
      successRate: totalProcessed > 0 ? stats.successCount / totalProcessed : 0,
      averageConfidence: Number(stats.avgConfidence || 0),
      averageProcessingTime: Number(stats.avgTime || 0),
      totalCost: Number(stats.totalCost || 0),
      averageCost: Number(stats.avgCost || 0),
      matchMethodsBreakdown: methods,
      errorRate: totalProcessed > 0 ? stats.failedCount / totalProcessed : 0,
      manualCorrectionRate: totalProcessed > 0 ? manualCount / totalProcessed : 0
    };
  },
  /**
   * Маппинг строки БД в объект
   */
  mapRowToLog(row) {
    return {
      id: row.id,
      certificateId: row.certificate_id,
      originalFilename: row.original_filename,
      fileSizeBytes: row.file_size_bytes,
      processingStartedAt: row.processing_started_at,
      processingCompletedAt: row.processing_completed_at,
      processingDurationMs: row.processing_duration_ms,
      aiModel: row.ai_model,
      aiTokensUsed: row.ai_tokens_used,
      aiCostUsd: row.ai_cost_usd ? Number(row.ai_cost_usd) : null,
      aiConfidence: row.ai_confidence ? Number(row.ai_confidence) : null,
      status: row.status,
      extractedData: typeof row.extracted_data === "string" ? JSON.parse(row.extracted_data) : row.extracted_data,
      errorMessage: row.error_message,
      matchedStudentId: row.matched_student_id,
      matchMethod: row.match_method,
      matchConfidence: row.match_confidence ? Number(row.match_confidence) : null,
      processedBy: row.processed_by,
      ipAddress: row.ip_address,
      createdAt: row.created_at
    };
  },
  /**
   * Batch-создание логов обработки (транзакционно)
   *
   * Используется для batch-импорта сертификатов.
   * Все логи создаются в одной транзакции (атомарность).
   *
   * @param logsData - Массив данных для создания логов
   * @returns Массив созданных логов
   */
  async createBatchLogs(logsData) {
    const db = getDbPool();
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      console.log(
        `\u{1F504} \u041D\u0430\u0447\u0438\u043D\u0430\u0435\u043C \u0442\u0440\u0430\u043D\u0437\u0430\u043A\u0446\u0438\u044E \u0434\u043B\u044F \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F ${logsData.length} \u043B\u043E\u0433\u043E\u0432...`
      );
      const createdIds = [];
      const now = /* @__PURE__ */ new Date();
      const query = `
        INSERT INTO ${TABLE_NAME} (
          id, certificate_id, original_filename, file_size_bytes,
          processing_started_at, processing_completed_at, processing_duration_ms,
          ai_model, ai_tokens_used, ai_cost_usd, ai_confidence,
          status, extracted_data, error_message,
          matched_student_id, match_method, match_confidence,
          processed_by, ip_address, created_at
        ) VALUES ?
      `;
      const values = logsData.map((data) => {
        const id = v4();
        createdIds.push(id);
        return [
          id,
          data.certificateId || null,
          data.originalFilename,
          data.fileSizeBytes,
          data.processingStartedAt,
          data.processingCompletedAt || null,
          data.processingDurationMs || null,
          data.aiModel,
          data.aiTokensUsed || null,
          data.aiCostUsd || null,
          data.aiConfidence || null,
          data.status,
          data.extractedData ? JSON.stringify(data.extractedData) : null,
          data.errorMessage || null,
          data.matchedStudentId || null,
          data.matchMethod || null,
          data.matchConfidence || null,
          data.processedBy,
          data.ipAddress || null,
          now
        ];
      });
      await connection.query(query, [values]);
      await connection.commit();
      console.log(
        `\u2705 \u0422\u0440\u0430\u043D\u0437\u0430\u043A\u0446\u0438\u044F \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0430. \u0421\u043E\u0437\u0434\u0430\u043D\u043E ${createdIds.length} \u043B\u043E\u0433\u043E\u0432.`
      );
      const [rows] = await connection.execute(
        `SELECT * FROM ${TABLE_NAME} WHERE id IN (${createdIds.map(() => "?").join(",")})`,
        createdIds
      );
      return rows.map(this.mapRowToLog);
    } catch (error) {
      await connection.rollback();
      console.error(
        "\u274C \u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 batch-\u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0438 \u043B\u043E\u0433\u043E\u0432. \u0422\u0440\u0430\u043D\u0437\u0430\u043A\u0446\u0438\u044F \u043E\u0442\u043C\u0435\u043D\u0435\u043D\u0430:",
        error.message
      );
      throw new Error(`\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043E\u0437\u0434\u0430\u0442\u044C \u043B\u043E\u0433\u0438: ${error.message}`);
    } finally {
      connection.release();
    }
  }
};

export { aiCertificateRepository as a };
//# sourceMappingURL=aiCertificateRepository.mjs.map
