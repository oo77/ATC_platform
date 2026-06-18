import { defineEventHandler, getHeader, createError, getMethod } from "h3";

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
  console.log("[Integration] GET /api/integration/test");

  return {
    status: "ok",
    message: "Connection successful",
  };
});