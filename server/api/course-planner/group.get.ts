import { defineEventHandler, getQuery, createError } from "h3";
import { fetchCoursePlannerGroup } from "../../utils/coursePlanner";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const id = query.id ? String(query.id) : undefined;
  const name = query.name ? String(query.name) : undefined;
  const code = query.code ? String(query.code) : undefined;
  const url = query.url ? String(query.url) : undefined;
  const token = query.token ? String(query.token) : undefined;

  if (!id && !name && !code) {
    throw createError({
      statusCode: 400,
      message: "Укажите хотя бы один параметр для поиска: id, name, code",
    });
  }

  const overrideConfig = (url || token) ? { url, token } : undefined;
  const result = await fetchCoursePlannerGroup({ id, name, code }, overrideConfig);

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: result.error || "Группа не найдена в course-planner2",
    });
  }

  return {
    success: true,
    data: result.data,
  };
});
