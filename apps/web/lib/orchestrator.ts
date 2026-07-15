import OpenAI from "openai";
import { runAcademicAgent } from "./academic-agent";
import { runCareerAgent } from "./career-agent";
import { runResearchAgent } from "./research-agent";
import { runProjectAgent } from "./project-agent";
import { connectToDatabase } from "./db";
import { AgentAuditLogModel } from "./models";

const OPENROUTER_BASE = process.env.OPENROUTER_API_BASE || "https://openrouter.ai/api/v1";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

type UserRole = "student" | "teacher";

interface RoutingDecision {
  agentType: string;
  reasoning: string;
}

async function logRoutingDecision(
  userId: string,
  userRole: UserRole,
  decision: RoutingDecision,
  status: "success" | "error",
  errorDetail?: string
) {
  await connectToDatabase();
  await AgentAuditLogModel.create({
    agentType: "Orchestrator",
    actorId: userId,
    action: "routing_decision",
    status,
    payload: decision,
    errorDetail
  });
}

async function determineAgent(prompt: string, userRole: UserRole): Promise<RoutingDecision> {
  if (!process.env.OPENROUTER_API_KEY) {
    // Fallback routing without AI
    const lowerPrompt = prompt.toLowerCase();
    if (lowerPrompt.includes("study") || lowerPrompt.includes("timetable") || lowerPrompt.includes("attendance")) {
      return { agentType: "Academic Success Agent", reasoning: "Keyword match for academic topics" };
    }
    if (lowerPrompt.includes("career") || lowerPrompt.includes("job") || lowerPrompt.includes("roadmap")) {
      return { agentType: "Career Roadmap Agent", reasoning: "Keyword match for career topics" };
    }
    if (lowerPrompt.includes("research") || lowerPrompt.includes("source") || lowerPrompt.includes("paper")) {
      return { agentType: "Research Assistant", reasoning: "Keyword match for research topics" };
    }
    if (lowerPrompt.includes("project") || lowerPrompt.includes("milestone")) {
      return { agentType: "Project Mentor Agent", reasoning: "Keyword match for project topics" };
    }
    return { agentType: "Academic Success Agent", reasoning: "Default fallback" };
  }

  const openai = new OpenAI({
    baseURL: OPENROUTER_BASE,
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  const availableAgents = userRole === "student"
    ? ["Academic Success Agent", "Career Roadmap Agent", "Research Assistant", "Project Mentor Agent"]
    : ["Teacher Copilot"];

  const response = await openai.chat.completions.create({
    model: OPENROUTER_MODEL,
    messages: [
      {
        role: "system",
        content: `You are a routing agent that determines which AI agent should handle a user request. 
        Available agents: ${availableAgents.join(", ")}.
        Return ONLY valid JSON with format: { "agentType": "...", "reasoning": "..." }`
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.3,
    max_tokens: 200
  });

  const resultText = response.choices[0].message.content || '{"agentType": "Academic Success Agent", "reasoning": "Default fallback"}';
  
  try {
    return JSON.parse(resultText);
  } catch (e) {
    return { agentType: "Academic Success Agent", reasoning: "Parse error, using default" };
  }
}

export async function routeToAgent(userId: string, userRole: UserRole, prompt: string) {
  try {
    const decision = await determineAgent(prompt, userRole);
    await logRoutingDecision(userId, userRole, decision, "success");

    let result;
    switch (decision.agentType) {
      case "Academic Success Agent":
        result = await runAcademicAgent(userId, prompt);
        break;
      case "Career Roadmap Agent":
        result = await runCareerAgent(userId, prompt);
        break;
      case "Research Assistant":
        result = await runResearchAgent(userId, prompt);
        break;
      case "Project Mentor Agent":
        result = await runProjectAgent(userId, prompt);
        break;
      case "Teacher Copilot":
        // Teacher Copilot uses direct API calls, not agent orchestration
        result = { reply: "Teacher Copilot accessed via dedicated API route", activityLog: [] };
        break;
      default:
        result = await runAcademicAgent(userId, prompt);
    }

    // Log the actual agent execution
    await connectToDatabase();
    await AgentAuditLogModel.create({
      agentType: decision.agentType,
      actorId: userId,
      action: "agent_execution",
      status: "success",
      payload: { routingDecision: decision }
    });

    return {
      ...result,
      routedTo: decision.agentType,
      routingReasoning: decision.reasoning
    };
  } catch (error: any) {
    await logRoutingDecision(userId, userRole, { agentType: "Unknown", reasoning: "Error" }, "error", error.message);
    throw error;
  }
}
