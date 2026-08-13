import {
  createAttestationGroup,
  attestationGroupCodeExists,
} from "../../../repositories/attestationGroupRepository";
import { requirePermission } from "../../../utils/permissions";
import { Permission } from "../../../types/permissions";

export default defineEventHandler(async (event) => {
  const context = await requirePermission(event, Permission.ATTESTATION_MANAGE);

  try {
    const body = await readBody<{
      code?: string;
      name?: string;
      description?: string;
    }>(event);

    if (!body.code?.trim() || !body.name?.trim()) {
      return { success: false, message: "Код и название группы обязательны" };
    }

    if (await attestationGroupCodeExists(body.code.trim())) {
      return { success: false, message: "Группа с таким кодом уже существует" };
    }

    const group = await createAttestationGroup({
      code: body.code.trim(),
      name: body.name.trim(),
      description: body.description?.trim() || null,
      createdBy: context.userId,
    });

    return { success: true, group };
  } catch (error) {
    console.error("Ошибка создания группы аттестации:", error);
    return { success: false, message: "Ошибка при создании группы аттестации" };
  }
});
