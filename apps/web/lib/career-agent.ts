import OpenAI from "openai";
import {
  getStudentProfile,
  getAcademicHistory,
  getCareerMemory,
  proposeCareerRoadmap,
  getCareerRoadmaps
} from "./agent-tools";

const OPENROUTER_BASE = process.env.OPENROUTER_API_BASE || "https://openrouter.ai/api/v1";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

export async function runCareerAgent(studentId: string, prompt: string) {
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
        name: "getStudentProfile",
        description: "Get the student's profile information",
        parameters: { type: "object", properties: {}, required: [] }
      }
    },
    {
      type: "function",
      function: {
        name: "getAcademicHistory",
        description: "Get the student's academic history",
        parameters: { type: "object", properties: {}, required: [] }
      }
    },
    {
      type: "function",
      function: {
        name: "getCareerMemory",
        description: "Get the student's career-related memory",
        parameters: { type: "object", properties: {}, required: [] }
      }
    },
    {
      type: "function",
      function: {
        name: "proposeCareerRoadmap",
        description: "Propose a career roadmap with milestones",
        parameters: {
          type: "object",
          properties: {
            targetRole: { type: "string" },
            milestones: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  targetDate: { type: "string" }
                }
              }
            },
            rationale: { type: "string" }
          },
          required: ["targetRole", "milestones"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "getCareerRoadmaps",
        description: "Get existing career roadmaps",
        parameters: { type: "object", properties: {}, required: [] }
      }
    }
  ];

  const systemPrompt = `You are a Career Roadmap Agent.
Your role is to help students plan their career paths with actionable milestones.
- Base your answers ONLY on the provided tool results.
- Do NOT fabricate career advice or milestones.
- If data is unavailable, say so clearly.
- When proposing a roadmap, use proposeCareerRoadmap with realistic milestones.
- Keep responses concise and focused.`;

  const messages: any[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: prompt }
  ];

  const activityLog: string[] = [];
  let proposedRoadmap: any = null;
  let roadmaps: any[] | null = null;

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
        if (!("function" in call)) continue;

        const name = call.function.name;
        let args: any = {};
        try { args = JSON.parse(call.function.arguments || "{}"); } catch(e) {}
        
        let result: any;
        try {
          if (name === "getStudentProfile") {
            activityLog.push("Fetched student profile");
            result = await getStudentProfile(studentId);
          } else if (name === "getAcademicHistory") {
            activityLog.push("Fetched academic history");
            result = await getAcademicHistory(studentId);
          } else if (name === "getCareerMemory") {
            activityLog.push("Fetched career memory");
            result = await getCareerMemory(studentId);
          } else if (name === "proposeCareerRoadmap") {
            activityLog.push(`Proposed career roadmap for ${args.targetRole}`);
            const proposed = await proposeCareerRoadmap(studentId, args);
            proposedRoadmap = proposed.roadmap;
            result = { success: true, message: "Career roadmap proposed successfully." };
          } else if (name === "getCareerRoadmaps") {
            activityLog.push("Checked existing career roadmaps");
            result = await getCareerRoadmaps(studentId);
            roadmaps = result;
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
      return {
        reply: msg.content,
        activityLog,
        roadmap: proposedRoadmap,
        roadmaps,
      };
    }
  }

  return {
    reply: "I reached my maximum number of steps while trying to process this request.",
    activityLog,
    roadmap: proposedRoadmap,
    roadmaps,
  };
}
