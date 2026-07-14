import OpenAI from "openai";
import { 
  getStudentTimetable, 
  getAttendanceSummary, 
  getUpcomingAssignments, 
  proposeStudyPlan 
} from "./agent-tools";

const OPENROUTER_BASE = process.env.OPENROUTER_API_BASE || "https://openrouter.ai/api/v1";
// Use a robust tool-calling model as default if user hasn't overridden
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

export async function runAcademicAgent(studentId: string, prompt: string) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is missing. Agent requires an AI provider key.");
  }

  const openai = new OpenAI({
    baseURL: OPENROUTER_BASE,
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  const tools: any = [
    {
      type: "function",
      function: {
        name: "getStudentTimetable",
        description: "Get the student's weekly timetable to check for classes and free slots.",
        parameters: { type: "object", properties: {}, required: [] }
      }
    },
    {
      type: "function",
      function: {
        name: "getAttendanceSummary",
        description: "Get the student's attendance summary to check for subjects with low attendance (at-risk).",
        parameters: { type: "object", properties: {}, required: [] }
      }
    },
    {
      type: "function",
      function: {
        name: "getUpcomingAssignments",
        description: "Get the student's upcoming assignments and deadlines.",
        parameters: { type: "object", properties: {}, required: [] }
      }
    },
    {
      type: "function",
      function: {
        name: "proposeStudyPlan",
        description: "Propose a structured study plan. Gather academic context (timetable, attendance, assignments) BEFORE calling this. Use this when the user asks to plan their week or study schedule.",
        parameters: {
          type: "object",
          properties: {
            goal: { type: "string", description: "The overarching goal of the study plan." },
            sessions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  date: { type: "string", description: "YYYY-MM-DD" },
                  startTime: { type: "string", description: "HH:mm" },
                  endTime: { type: "string", description: "HH:mm" },
                  subject: { type: "string" },
                  topics: { type: "array", items: { type: "string" } }
                },
                required: ["title", "date", "startTime", "endTime"]
              }
            }
          },
          required: ["goal", "sessions"]
        }
      }
    }
  ];

  const systemPrompt = `You are an Academic Success Agent.
Your role is to help the student with academic planning, scheduling, and risk management.
- Base your answers ONLY on the provided tool results.
- Do NOT fabricate classes, deadlines, or attendance data.
- If data is unavailable, say so clearly.
- For study plan requests, ALWAYS check timetable, attendance, and assignments first to find free slots and prioritize at-risk subjects or urgent deadlines.
- When proposing a study plan, clearly state to the user that it is a *proposed* plan pending their approval. You cannot approve it yourself.
- Keep responses concise and focused.`;

  const messages: any[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: prompt }
  ];

  const activityLog: string[] = [];
  let proposedPlanDetails: any = null;

  // Run the agent loop (max 5 iterations to prevent infinite loops)
  for (let i = 0; i < 5; i++) {
    const response = await openai.chat.completions.create({
      model: OPENROUTER_MODEL,
      messages,
      tools,
      tool_choice: "auto"
    });

    const msg = response.choices[0].message;
    messages.push(msg as any);

    if (msg.tool_calls && msg.tool_calls.length > 0) {
      for (const call of msg.tool_calls) {
        const name = call.function.name;
        let args: any = {};
        try { args = JSON.parse(call.function.arguments || "{}"); } catch(e) {}
        
        let result: any;
        try {
          if (name === "getStudentTimetable") {
            activityLog.push("Checked timetable");
            result = await getStudentTimetable(studentId);
          } else if (name === "getAttendanceSummary") {
            activityLog.push("Checked attendance");
            result = await getAttendanceSummary(studentId);
          } else if (name === "getUpcomingAssignments") {
            activityLog.push("Checked upcoming assignments");
            result = await getUpcomingAssignments(studentId);
          } else if (name === "proposeStudyPlan") {
            activityLog.push(`Proposed study plan: ${args.goal}`);
            const proposal = await proposeStudyPlan(studentId, {
              goal: args.goal,
              sessions: args.sessions,
              rationale: "AI Agent generated plan based on academic context.",
              activityLog
            });
            proposedPlanDetails = proposal;
            result = { success: true, message: "Plan successfully proposed and is pending approval." };
          } else {
            result = { error: "Unknown tool" };
          }
        } catch (error: any) {
          result = { error: error.message };
        }

        messages.push({
          role: "tool",
          tool_call_id: call.id,
          name: name,
          content: JSON.stringify(result)
        });
      }
    } else {
      // No more tool calls, we have the final response
      return {
        reply: msg.content,
        activityLog,
        planId: proposedPlanDetails?.planId || null,
        actionId: proposedPlanDetails?.actionId || null
      };
    }
  }

  return {
    reply: "I reached my maximum number of steps while trying to process this request.",
    activityLog,
    planId: proposedPlanDetails?.planId || null,
    actionId: proposedPlanDetails?.actionId || null
  };
}
