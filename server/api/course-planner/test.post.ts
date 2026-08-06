import { defineEventHandler, readBody, createError } from "h3";
import { testCoursePlannerConnection } from "../../utils/coursePlanner";

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}));

  const url = body.COURSE_PLANNER_URL;
  const token = body.COURSE_PLANNER_API_TOKEN;

  const result = await testCoursePlannerConnection(url, token);

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: result.message,
    });
  }

  return {
    success: true,
    message: result.message,
    details: result.details,
  };
});
