import OpenAI from "openai";
import {
  getResearchSources,
  saveResearchNote,
  getResearchNotes
} from "./agent-tools";

const OPENROUTER_BASE = process.env.OPENROUTER_API_BASE || "https://openrouter.ai/api/v1";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

export async function runResearchAgent(studentId: string, prompt: string) {
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
        name: "getResearchSources",
        description: "Get suggested research sources for a topic",
        parameters: {
          type: "object",
          properties: {
            topic: { type: "string" }
          },
          required: ["topic"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "saveResearchNote",
        description: "Save a research note with topic, content, sources, and tags",
        parameters: {
          type: "object",
          properties: {
            topic: { type: "string" },
            content: { type: "string" },
            sources: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  url: { type: "string" },
                  summary: { type: "string" }
                }
              }
            },
            tags: { type: "array", items: { type: "string" } }
          },
          required: ["topic", "content"]
        }
      }
    },
    {
      type: "function",
      function: {
        name: "getResearchNotes",
        description: "Get the student's existing research notes",
        parameters: {
          type: "object",
          properties: {
            topic: { type: "string" }
          },
          required: []
        }
      }
    }
  ];

  const systemPrompt = `You are a Research Assistant Agent.
Your role is to help students research topics, find sources, and organize their findings.
- Base your answers ONLY on the provided tool results.
- Do NOT fabricate sources or research content.
- If data is unavailable, say so clearly.
- For research requests, use getResearchSources to suggest relevant sources.
- When the user wants to save findings, use saveResearchNote to store them.
- Keep responses concise and focused.`;

  const messages: any[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: prompt }
  ];

  const activityLog: string[] = [];
  let savedNoteId: string | null = null;

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
          if (name === "getResearchSources") {
            activityLog.push(`Fetched research sources for ${args.topic}`);
            result = await getResearchSources(args.topic);
          } else if (name === "saveResearchNote") {
            activityLog.push(`Saved research note for ${args.topic}`);
            const saved = await saveResearchNote(studentId, args);
            savedNoteId = saved.noteId;
            result = { success: true, message: "Research note saved successfully." };
          } else if (name === "getResearchNotes") {
            activityLog.push("Checked existing research notes");
            result = await getResearchNotes(studentId, args.topic);
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
        noteId: savedNoteId
      };
    }
  }

  return {
    reply: "I reached my maximum number of steps while trying to process this request.",
    activityLog,
    noteId: savedNoteId
  };
}
