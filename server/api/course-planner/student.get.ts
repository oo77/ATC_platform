import { defineEventHandler, getQuery, createError } from "h3";
import { fetchCoursePlannerStudent } from "../../utils/coursePlanner";

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const pinfl = query.pinfl ? String(query.pinfl) : undefined;
  const id = query.id ? String(query.id) : undefined;
  const onecId = query.onecId ? String(query.onecId) : undefined;
  const url = query.url ? String(query.url) : undefined;
  const token = query.token ? String(query.token) : undefined;

  if (!pinfl && !id && !onecId) {
    throw createError({
      statusCode: 400,
      message: "Укажите хотя бы один параметр для поиска: pinfl, id, onecId",
    });
  }

  const overrideConfig = (url || token) ? { url, token } : undefined;
  const result = await fetchCoursePlannerStudent({ pinfl, id, onecId }, overrideConfig);

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: result.error || "Слушатель не найден в course-planner2",
    });
  }

  return {
    success: true,
    data: result.data,
  };
});
