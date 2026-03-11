import { executeQuery } from "./server/utils/db";

async function run() {
  console.log("Fetching courses...");
  const courses = await executeQuery("SELECT id, name, total_hours FROM courses");
  console.log(courses);
  
  console.log("Fetching disciplines...");
  const disciplines = await executeQuery("SELECT course_id, hours, theory_hours, practice_hours, assessment_hours FROM disciplines");
  console.log(disciplines);

  process.exit(0);
}

run().catch(console.error);
