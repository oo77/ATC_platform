import {
  addInstructorToGroup,
  getAttestationGroupById,
  getGroupInstructors,
} from "../../../../repositories/attestationGroupRepository";
import { getInstructorById } from "../../../../repositories/instructorRepository";
import { requirePermission } from "../../../../utils/permissions";
import { Permission } from "../../../../types/permissions";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.ATTESTATION_MANAGE);

  try {
    const groupId = getRouterParam(event, "id");
    if (!groupId) return { success: false, message: "ID группы не указан" };

    const group = await getAttestationGroupById(groupId);
    if (!group) return { success: false, message: "Группа не найдена" };

    const body = await readBody<{ instructorIds?: string[] }>(event);
    if (!body.instructorIds?.length) {
      return { success: false, message: "Список инструкторов пуст" };
    }

    for (const instructorId of body.instructorIds) {
      const instructor = await getInstructorById(instructorId);
      if (!instructor) continue;
      await addInstructorToGroup(groupId, instructorId, instructor.specialty || null);
    }

    const instructors = await getGroupInstructors(groupId);
    return { success: true, instructors };
  } catch (error) {
    console.error("Ошибка добавления инструкторов в группу:", error);
    return { success: false, message: "Ошибка при добавлении инструкторов" };
  }
});
