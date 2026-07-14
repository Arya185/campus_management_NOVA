/**
 * NOVA AI Service
 * Provider chain: OpenRouter -> offline fallback
 */

const OPENROUTER_BASE =
  process.env.OPENROUTER_API_BASE || "https://openrouter.ai/api/v1";
const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL || "mistralai/mistral-7b-instruct";

function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function fallbackResponse(type: string, data: unknown) {
  if (type === "conflict") {
    const classes = Array.isArray(data) ? data : [];
    const conflicts: Array<Record<string, unknown>> = [];

    for (let index = 0; index < classes.length; index += 1) {
      for (let compareIndex = index + 1; compareIndex < classes.length; compareIndex += 1) {
        const first = classes[index] as Record<string, string>;
        const second = classes[compareIndex] as Record<string, string>;

        if (
          first.day === second.day &&
          toMinutes(first.start) < toMinutes(second.end) &&
          toMinutes(second.start) < toMinutes(first.end)
        ) {
          conflicts.push({
            conflict: true,
            subjects: [
              first.subject || first.name,
              second.subject || second.name,
            ],
            day: first.day,
            overlap: `${first.start}-${second.end}`,
            message: `"${first.subject || first.name}" and "${second.subject || second.name}" overlap on ${first.day}.`,
          });
        }
      }
    }

    return conflicts.length > 0
      ? { hasConflicts: true, conflicts }
      : { hasConflicts: false, message: "No schedule conflicts detected." };
  }

  if (type === "anomaly") {
    const records = Array.isArray(data) ? data : [];
    const anomalies = records
      .map((record) => {
        const typedRecord = record as { attendance: boolean[]; studentId: string; name: string };
        const attended = typedRecord.attendance.filter(Boolean).length;
        const attendancePct = Math.round((attended / typedRecord.attendance.length) * 100);

        return {
          studentId: typedRecord.studentId,
          name: typedRecord.name,
          attendancePct,
        };
      })
      .filter((record) => record.attendancePct < 75)
      .map((record) => ({
        ...record,
        alert: true,
        message: `${record.name} has only ${record.attendancePct}% attendance, below 75% threshold.`,
      }));

    return {
      anomaliesFound: anomalies.length > 0,
      anomalies,
      summary: `${anomalies.length} student(s) flagged for low attendance.`,
    };
  }

  if (type === "chat") {
    const query =
      typeof data === "object" && data !== null && "query" in data
        ? String((data as { query?: string }).query || "").toLowerCase()
        : "";

    if (query.includes("timetable") || query.includes("schedule") || query.includes("class")) {
      return {
        reply:
          "Your timetable shows scheduled classes for week. Open Timetable section in dashboard for full schedule and room details.",
        source: "timetable",
      };
    }

    if (query.includes("attendance") || query.includes("absent") || query.includes("present")) {
      return {
        reply:
          "Check Attendance section for current percentage. Keep attendance at or above 75% to avoid detention risk.",
        source: "attendance",
      };
    }

    if (
      query.includes("event") ||
      query.includes("workshop") ||
      query.includes("fest") ||
      query.includes("seminar")
    ) {
      return {
        reply:
          "Check Events section for upcoming campus events, workshops, and fests. Registration happens directly in platform.",
        source: "general",
      };
    }

    if (query.includes("internship") || query.includes("placement") || query.includes("job")) {
      return {
        reply:
          "Visit Internships section for latest placement drives, internship listings, and application deadlines.",
        source: "general",
      };
    }

    return {
      reply:
        "I'm NOVA AI, your campus assistant. I can help with timetable, attendance, events, internships, and more.",
      source: "general",
    };
  }

  return {
    reply: "I'm here to help. Ask about timetable, attendance, events, or internships.",
    source: "general",
  };
}

export async function generateAIResponse(
  prompt: string,
  fallbackType: string,
  fallbackData: unknown,
) {
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: OPENROUTER_MODEL,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 512,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        return json.choices[0].message.content;
      }
    } catch {
      // Fall through to local fallback.
    }
  }

  return fallbackResponse(fallbackType, fallbackData);
}
