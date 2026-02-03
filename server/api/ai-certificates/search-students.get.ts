import { getStudentsPaginated } from "../../repositories/studentRepository";
import { requirePermission } from "../../utils/permissions";
import { Permission } from "../../types/permissions";

export default defineEventHandler(async (event) => {
  await requirePermission(event, Permission.CERTIFICATES_ISSUE);
  const query = getQuery(event);
  const search = (query.search || query.q) as string;

  if (!search || search.length < 2) {
    return []; // Не искать по слишком коротким запросам
  }

  // Используем общий поиск
  try {
    const result = await getStudentsPaginated({
      search: search,
      page: 1,
      limit: 20,
    });

    return result.data.map((s) => ({
      id: s.id,
      fullName: s.fullName,
      pinfl: s.pinfl,
      organization: s.organization,
      position: s.position,
    }));
  } catch (error: any) {
    console.error("Student search error:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to search students",
    });
  }
});
