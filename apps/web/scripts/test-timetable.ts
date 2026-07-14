import { loadEnvConfig } from "@next/env";
import path from "path";

const projectDir = path.resolve(process.cwd());
loadEnvConfig(projectDir);

import { connectToDatabase } from "../lib/db";
import { StudentModel, TimetableModel } from "../lib/models";
import { getStudentTimetable } from "../lib/agent-tools";

async function run() {
  await connectToDatabase();
  const student = await StudentModel.findOne({ email: "rahul.sharma@student.edu" }).lean();
  if (!student) throw new Error("no student");
  console.log("student year:", student.year, "branch:", student.branch, "section:", student.section);
  const tt = await getStudentTimetable(student._id.toString());
  console.log("TT:", tt);

  // Raw check
  const allTT = await TimetableModel.find({}).lean();
  console.log("All TT classNames:", allTT.map((t: any) => t.className));
  process.exit(0);
}
run();
