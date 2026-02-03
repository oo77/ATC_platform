import { getDbPool } from "../utils/db";
import type {
  AIProcessingLog,
  CreateProcessingLogInput,
  LogFilters,
  PaginatedLogs,
  AIImportStats,
  ProcessingLogStatus,
} from "../types/aiCertificateImport";
import { v4 as uuidv4 } from "uuid";
import type { RowDataPacket } from "mysql2";

const TABLE_NAME = "ai_certificate_processing_logs";

export const aiCertificateRepository = {
  /**
   * Создать лог обработки
   */
  async createLog(data: CreateProcessingLogInput): Promise<AIProcessingLog> {
    const db = getDbPool();
    const id = uuidv4();
    const now = new Date();

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
      now,
    ];

    await db.execute(query, values);

    return this.getLogById(id) as Promise<AIProcessingLog>;
  },

  /**
   * Обновить сертификат данными из AI
   */
  async updateCertificateWithAiData(
    certId: string,
    data: {
      extractedData: any;
      confidence: number;
      processingStatus: string;
      originalFileUrl?: string; // New param
    },
  ) {
    const db = getDbPool();
    // Обновляем таблицу issued_certificates
    // Поля: ai_extracted_data, ai_confidence, import_source, original_file_url
    // processingStatus храним в extractedData или не храним (в ТЗ не было явного поля ai_processing_status в таблице certificates, но было в типах)

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
        certId,
      ],
    );
  },

  /**
   * Обновить существующий лог
   */
  async updateLog(
    id: string,
    data: Partial<CreateProcessingLogInput>,
  ): Promise<AIProcessingLog> {
    const db = getDbPool();

    // Формируем динамический SQL для обновления
    const updates: string[] = [];
    const values: any[] = [];

    if (data.certificateId !== undefined) {
      updates.push("certificate_id = ?");
      values.push(data.certificateId);
    }
    if (data.processingCompletedAt !== undefined) {
      updates.push("processing_completed_at = ?");
      values.push(data.processingCompletedAt);
    }
    if (data.processingDurationMs !== undefined) {
      updates.push("processing_duration_ms = ?");
      values.push(data.processingDurationMs);
    }

    if (data.aiTokensUsed !== undefined) {
      updates.push("ai_tokens_used = ?");
      values.push(data.aiTokensUsed);
    }
    if (data.aiCostUsd !== undefined) {
      updates.push("ai_cost_usd = ?");
      values.push(data.aiCostUsd);
    }
    if (data.aiConfidence !== undefined) {
      updates.push("ai_confidence = ?");
      values.push(data.aiConfidence);
    }

    if (data.status !== undefined) {
      updates.push("status = ?");
      values.push(data.status);
    }
    if (data.extractedData !== undefined) {
      updates.push("extracted_data = ?");
      values.push(
        data.extractedData ? JSON.stringify(data.extractedData) : null,
      );
    }
    if (data.errorMessage !== undefined) {
      updates.push("error_message = ?");
      values.push(data.errorMessage);
    }

    if (data.matchedStudentId !== undefined) {
      updates.push("matched_student_id = ?");
      values.push(data.matchedStudentId);
    }
    if (data.matchMethod !== undefined) {
      updates.push("match_method = ?");
      values.push(data.matchMethod);
    }
    if (data.matchConfidence !== undefined) {
      updates.push("match_confidence = ?");
      values.push(data.matchConfidence);
    }

    if (updates.length === 0) {
      return this.getLogById(id) as Promise<AIProcessingLog>;
    }

    values.push(id);
    const query = `UPDATE ${TABLE_NAME} SET ${updates.join(", ")} WHERE id = ?`;

    await db.execute(query, values);

    return this.getLogById(id) as Promise<AIProcessingLog>;
  },

  /**
   * Получить лог по ID
   */
  async getLogById(id: string): Promise<AIProcessingLog | null> {
    const db = getDbPool();
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT * FROM ${TABLE_NAME} WHERE id = ?`,
      [id],
    );

    if (!rows || rows.length === 0) return null;

    return this.mapRowToLog(rows[0]);
  },

  /**
   * Получить список логов с фильтрацией и пагинацией
   */
  async getLogs(filters: LogFilters): Promise<PaginatedLogs> {
    const db = getDbPool();
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    let whereClause = "WHERE 1=1";
    const values: any[] = [];

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

    // Получаем общее количество
    const [countResult] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) as total FROM ${TABLE_NAME} ${whereClause}`,
      values,
    );
    const total = countResult[0].total;

    // Получаем данные
    const query = `
      SELECT * FROM ${TABLE_NAME} 
      ${whereClause} 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;

    // LIMIT и OFFSET должны быть числами, не строками для prepared statement в некоторых версиях
    // Но mysql2 usually handles standard params well.
    // Safe bet is to append them to values array.
    const queryValues = [...values, limit.toString(), offset.toString()];

    const [rows] = await db.execute<RowDataPacket[]>(query, queryValues);

    return {
      logs: rows.map(this.mapRowToLog),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },

  /**
   * Получить статистику по импорту
   */
  async getStats(): Promise<AIImportStats> {
    const db = getDbPool();

    // Общая статистика
    const [basicStats] = await db.execute<RowDataPacket[]>(`
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

    // Разбивка по методам
    const [methodStats] = await db.execute<RowDataPacket[]>(`
      SELECT match_method, COUNT(*) as count
      FROM ${TABLE_NAME}
      WHERE match_method IS NOT NULL
      GROUP BY match_method
    `);

    const methods: Record<string, number> = {
      exact_pinfl: 0,
      exact_name: 0,
      fuzzy_ai: 0,
      manual: 0,
    };

    methodStats.forEach((row: any) => {
      if (methods[row.match_method] !== undefined) {
        methods[row.match_method] = row.count;
      }
    });

    // Расчет manual correction rate (где был ручной выбор или переопределение)
    // По сути это сумма manual методов
    const manualCount = methods.manual;

    return {
      totalProcessed,
      successRate: totalProcessed > 0 ? stats.successCount / totalProcessed : 0,
      averageConfidence: Number(stats.avgConfidence || 0),
      averageProcessingTime: Number(stats.avgTime || 0),

      totalCost: Number(stats.totalCost || 0),
      averageCost: Number(stats.avgCost || 0),

      matchMethodsBreakdown: methods as any,

      errorRate: totalProcessed > 0 ? stats.failedCount / totalProcessed : 0,
      manualCorrectionRate:
        totalProcessed > 0 ? manualCount / totalProcessed : 0,
    };
  },

  /**
   * Маппинг строки БД в объект
   */
  mapRowToLog(row: any): AIProcessingLog {
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

      status: row.status as ProcessingLogStatus,
      extractedData:
        typeof row.extracted_data === "string"
          ? JSON.parse(row.extracted_data)
          : row.extracted_data,
      errorMessage: row.error_message,

      matchedStudentId: row.matched_student_id,
      matchMethod: row.match_method,
      matchConfidence: row.match_confidence
        ? Number(row.match_confidence)
        : null,

      processedBy: row.processed_by,
      ipAddress: row.ip_address,
      createdAt: row.created_at,
    };
  },
};
