import {
  testCoursePlannerConnection,
  fetchCoursePlannerStudents,
} from "../server/utils/coursePlanner.js";

async function main() {
  const token = "4f153ce803277d908b67ec71f7d4aaec6cb4612a7a0c36edd96350667cef6915";
  console.log("Testing Course Planner 2 REST API connection...");
  const res = await testCoursePlannerConnection("http://localhost:3000", token);
  console.log("Connection result:", res.success, res.message);

  if (res.success) {
    const studentsRes = await fetchCoursePlannerStudents(
      { page: 1, limit: 1 },
      { url: "http://localhost:3000", token }
    );
    console.log("Students fetch:", {
      success: studentsRes.success,
      total: studentsRes.total,
      count: studentsRes.data?.length,
    });
    if (studentsRes.data?.[0]) {
      const s = studentsRes.data[0];
      console.log("Sample student PINFL:", s.pinfl, "Name:", s.name);
      console.log("Department:", s.department);
      console.log("Position:", s.position);
      console.log("Organization:", s.organization);
    }
  }
}

main();

