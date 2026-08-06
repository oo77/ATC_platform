import { testCoursePlannerConnection, fetchCoursePlannerStudent } from "../server/utils/coursePlanner.js";

async function main() {
  const token = "a901a38eb68f577c7e15662324b92ef00dab47f3cb1b02507971b9cf37924084";
  console.log("Testing student fetch for PINFL 32510893500059 ...");
  const res = await fetchCoursePlannerStudent(
    { pinfl: "32510893500059" },
    { url: "http://localhost:3000", token }
  );
  console.log("Student Fetch Result:", JSON.stringify(res, null, 2));
}

main();
