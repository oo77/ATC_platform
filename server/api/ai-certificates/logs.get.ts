import { aiCertificateRepository } from "../../repositories/aiCertificateRepository";
import { requirePermission } from "../../utils/permissions";
import { Permission } from "../../types/permissions";
import type {
  LogFilters,
  ProcessingLogStatus,
} from "../../types/aiCertificateImport";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.CERTIFICATES_VIEW);
  const query = getQuery(event);

  const filters: LogFilters = {
    page: query.page ? parseInt(query.page as string) : 1,
    limit: query.limit ? parseInt(query.limit as string) : 20,
    status: query.status as ProcessingLogStatus | undefined,
    processedBy: query.userId as string | undefined, // userId в query может фильтровать по админу
    dateFrom: query.dateFrom as string | undefined,
    dateTo: query.dateTo as string | undefined,
  };

  try {
    const result = await aiCertificateRepository.getLogs(filters);
    return result;
  } catch (error: any) {
    console.error("Fetch logs error:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to fetch logs",
    });
  }
});
