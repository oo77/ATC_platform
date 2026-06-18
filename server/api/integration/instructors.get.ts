import { defineEventHandler, getHeader, createError, getMethod } from "h3";
import { getAllInstructors } from "../../repositories/instructorRepository";

async function verifyPlannerToken(event: any) {
  if (getMethod(event) === "OPTIONS") return;

  const authHeader = getHeader(event, "authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw createError({ statusCode: 401, message: "Unauthorized: Bearer token required" });
  }
  const token = authHeader.substring(7);
  const expectedToken = process.env.PLANNER_API_TOKEN;
  if (!expectedToken) {
    throw createError({ statusCode: 500, message: "Server configuration error" });
  }
  if (token !== expectedToken) {
    throw createError({ statusCode: 401, message: "Invalid token" });
  }
}

export default defineEventHandler(async (event) => {
  await verifyPlannerToken(event);

  console.log("[Integration] GET /api/integration/instructors");

  const instructors = await getAllInstructors(true);

  // Маппим данные для planner (адаптируем под структуру Instructor в course planner)
  const result = instructors.map((instructor) => ({
    id: instructor.id,
    name: instructor.fullName,
    email: instructor.email || null,
    phone: instructor.phone || null,
    bio: null,
    specialization: instructor.specialty || null,
    active: instructor.isActive,
    // ПИНФЛ из ATC_platform (passportData)
    passportData: instructor.passportData || null,
    // Дополнительные поля из ATC_platform
    hireDate: instructor.hireDate,
    maxHours: instructor.maxHours,
    education: instructor.education,
    university: instructor.university,
    academic_degree: instructor.academic_degree,
    academic_rank: instructor.academic_rank,
    languages: instructor.languages,
  }));

  console.log(`[Integration] ${result.length} instructors found`);

  return {
    success: true,
    instructors: result,
  };
});