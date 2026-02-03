import { aiCertificateRepository } from "../../repositories/aiCertificateRepository";
import { requirePermission } from "../../utils/permissions";
import { Permission } from "../../types/permissions";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.CERTIFICATES_VIEW);

  try {
    const stats = await aiCertificateRepository.getStats();
    return stats;
  } catch (error: any) {
    console.error("Fetch stats error:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to fetch stats",
    });
  }
});
