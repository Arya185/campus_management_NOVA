import OpenAI from "openai";
import {
  getProjects,
  createProject,
  updateProjectMilestone
} from "./agent-tools";

const OPENROUTER_BASE = process.env.OPENROUTER_API_BASE || "https://openrouter.ai/api/v1";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

export async function runProjectAgent(studentId: string, prompt: string) {
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
        name: "getProjects",
        description: "Get the student's existing projects and their status",
        parameters: { type: "object", properties: {}, required: [] }
      }
    },
    {
      type: "function",
      function: {
        name: "createProject",
        description: "Create a new project with title, domain, technologies, and milestones",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            domain: { type: "string" },
            technologies: { type: "array", items: { type: "string" } },
            milestones: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  targetDate: { type: "string", description: "YYYY-MM-DD" },
                  status: { type: "string", enum: ["planned", "in_progress", "done"] }
                },
                required: ["title", "targetDate"]
              }
            }
          },
          required: ["title", "domain"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "updateProjectMilestone",
        description: "Update a project milestone status to 'in_progress' or 'done'",
        parameters: {
          type: "object",
          properties: {
            projectId: { type: "string" },
            milestoneIndex: { type: "number" },
            status: { type: "string", enum: ["in_progress", "done"] }
          },
          required: ["projectId", "milestoneIndex", "status"]
        }
      }
    }
  ];

  const systemPrompt = `You are a Project Mentor Agent.
Your role is to help students plan, track, and complete their projects.
- Base your answers ONLY on the provided tool results.
- Do NOT fabricate project details or milestones.
- If data is unavailable, say so clearly.
- For new project requests, check existing projects first, then use createProject with realistic milestones.
- When updating milestones, use the correct milestone index (0-based).
- Keep responses concise and focused.`;

  const messages: any[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: prompt }
  ];

  const activityLog: string[] = [];
  let project: any = null;
  let projects: any[] | null = null;

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
          if (name === "getProjects") {
            activityLog.push("Checked existing projects");
            result = await getProjects(studentId);
            projects = result;
          } else if (name === "createProject") {
            activityLog.push(`Created project: ${args.title}`);
            const created = await createProject(studentId, args);
            project = created.project;
            result = { success: true, message: "Project created successfully." };
          } else if (name === "updateProjectMilestone") {
            activityLog.push(`Updated milestone for project ${args.projectId}`);
            result = await updateProjectMilestone(studentId, args.projectId, args.milestoneIndex, args.status);
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
        project,
        projects,
      };
    }
  }

  return {
    reply: "I reached my maximum number of steps while trying to process this request.",
    activityLog,
    project,
    projects,
  };
}
