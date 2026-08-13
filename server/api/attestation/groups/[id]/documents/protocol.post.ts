import { generateProtocol } from "../../../../../services/attestationDocumentService";
import { storage } from "../../../../../utils/storage";
import { requirePermission } from "../../../../../utils/permissions";
import { Permission } from "../../../../../types/permissions";

export default defineEventHandler(async (event) => {
  const context = await requirePermission(event, Permission.ATTESTATION_MANAGE);

  try {
    const groupId = getRouterParam(event, "id");
    if (!groupId) return { success: false, message: "ID группы не указан" };

    const file = await generateProtocol(groupId, context.userId);

    return {
      success: true,
      file: {
        id: file.id,
        uuid: file.uuid,
        filename: file.filename,
        url: storage.getPublicUrl(file.uuid),
      },
    };
  } catch (error: any) {
    console.error("Ошибка генерации протокола:", error);
    return { success: false, message: error?.message || "Ошибка при генерации протокола" };
  }
});
