"use client";

import React, { useEffect, useRef, useState } from "react";
import { StudentSidebar } from "@/components/student-sidebar";
import { UserMenu } from "@/components/user-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Bell,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  Target,
  Calendar,
} from "lucide-react";

type Milestone = {
  title: string;
  description?: string;
  targetDate?: string;
  status?: "planned" | "in_progress" | "done";
};

type Roadmap = {
  id: string;
  targetRole: string;
  rationale?: string;
  status: "pending" | "approved" | "rejected";
  milestones: Milestone[];
};

type Message = {
  id: string;
  role: "user" | "agent";
  content: string;
  activityLog?: string[];
  roadmap?: Roadmap | null;
  roadmaps?: Roadmap[] | null;
};

export default function CareerRoadmapPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "agent",
      content: "Hello! I am your Career Roadmap Agent. I can help you plan target roles, skill milestones, and next career steps. What would you like to work toward?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/student/career-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMessage.content }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to process request");

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "agent",
          content: data.reply,
          activityLog: data.activityLog,
          roadmap: data.roadmap,
          roadmaps: data.roadmaps,
        },
      ]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: "agent", content: `Error: ${error.message}. Please try again.` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (msgId: string, roadmapId: string, status: "approved" | "rejected") => {
    try {
      const response = await fetch("/api/student/career-agent/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roadmapId, status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update roadmap");

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === msgId ? { ...msg, roadmap: data.roadmap } : msg,
        ),
      );
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-black flex">
      <StudentSidebar />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 z-10 flex-shrink-0">
          <div className="px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                  <Briefcase className="h-6 w-6 text-[#e78a53]" />
                  Career Roadmap
                </h1>
                <p className="text-zinc-400 text-sm">AI planning for roles, skills, and milestone timelines</p>
              </div>
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon">
                  <Bell className="h-5 w-5 text-zinc-400" />
                </Button>
                <UserMenu />
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-3xl ${msg.role === "user" ? "bg-[#e78a53] text-black" : "bg-zinc-900 text-zinc-200 border border-zinc-800"} rounded-2xl p-6 shadow-lg`}>
                {msg.activityLog && msg.activityLog.length > 0 && (
                  <div className="mb-4 pb-4 border-b border-zinc-800/50 space-y-2">
                    <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                      <Target className="h-3 w-3" /> Agent Activity
                    </div>
                    {msg.activityLog.map((log, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-zinc-400">
                        <CheckCircle2 className="h-4 w-4 text-[#e78a53]/70" />
                        {log}
                      </div>
                    ))}
                  </div>
                )}

                <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>

                {msg.roadmap && (
                  <div className="mt-6 border border-zinc-700/50 rounded-xl overflow-hidden bg-black/20">
                    <div className="bg-zinc-800/50 px-4 py-3 flex items-center justify-between border-b border-zinc-700/50">
                      <div className="flex items-center gap-2 text-white font-medium">
                        <Briefcase className="h-4 w-4 text-[#e78a53]" />
                        Career Roadmap
                      </div>
                      <Badge className={msg.roadmap.status === "pending" ? "bg-amber-500/20 text-amber-500 hover:bg-amber-500/20" : msg.roadmap.status === "approved" ? "bg-green-500/20 text-green-500 hover:bg-green-500/20" : "bg-red-500/20 text-red-500 hover:bg-red-500/20"}>
                        {msg.roadmap.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="p-4 space-y-4">
                      <div>
                        <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Target Role</div>
                        <div className="text-white font-semibold">{msg.roadmap.targetRole}</div>
                      </div>

                      <div className="space-y-3">
                        {msg.roadmap.milestones.map((milestone, idx) => (
                          <div key={`${milestone.title}-${idx}`} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-medium text-zinc-100">{milestone.title}</div>
                                {milestone.description && <div className="text-sm text-zinc-400 mt-1">{milestone.description}</div>}
                                {milestone.targetDate && (
                                  <div className="text-xs text-zinc-500 mt-2 flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {milestone.targetDate}
                                  </div>
                                )}
                              </div>
                              {msg.roadmap?.status === "approved" && (
                                <Badge className={milestone.status === "done" ? "bg-green-500/20 text-green-500" : milestone.status === "in_progress" ? "bg-blue-500/20 text-blue-400" : "bg-zinc-500/20 text-zinc-300"}>
                                  {(milestone.status || "planned").toUpperCase()}
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {msg.roadmap.rationale && (
                        <div>
                          <div className="text-xs uppercase tracking-wider text-zinc-500 mb-1">Rationale</div>
                          <div className="text-sm text-zinc-300">{msg.roadmap.rationale}</div>
                        </div>
                      )}
                    </div>

                    {msg.roadmap.status === "pending" && (
                      <div className="p-4 bg-zinc-900/30 flex gap-3">
                        <Button onClick={() => handleAction(msg.id, msg.roadmap!.id, "approved")} className="bg-[#e78a53] hover:bg-[#d67a43] text-black flex-1">
                          Approve
                        </Button>
                        <Button onClick={() => handleAction(msg.id, msg.roadmap!.id, "rejected")} variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 flex-1">
                          Reject
                        </Button>
                      </div>
                    )}
                    {msg.roadmap.status === "rejected" && (
                      <div className="p-4 bg-red-500/10 text-red-500 text-sm flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" /> This roadmap was rejected.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg flex items-center gap-3 text-zinc-400">
                <Loader2 className="h-5 w-5 animate-spin text-[#e78a53]" />
                Agent is planning your roadmap...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {messages.length === 1 && (
          <div className="px-8 pb-4 grid grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
            {[
              "Plan roadmap for data scientist role",
              "What skills should I build for product design?",
              "Show my current career progress",
              "Create 6-month internship preparation plan",
            ].map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                className="bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-[#e78a53]/50 justify-start h-auto py-3 px-4"
                onClick={() => setInput(suggestion)}
              >
                <Target className="h-4 w-4 mr-2 text-[#e78a53]" />
                <span className="text-left text-sm truncate">{suggestion}</span>
              </Button>
            ))}
          </div>
        )}

        <div className="p-8 pt-4 flex-shrink-0 bg-gradient-to-t from-black via-black to-transparent">
          <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your Career Roadmap Agent..."
              className="w-full bg-zinc-900/80 border-zinc-700 text-white placeholder:text-zinc-500 pl-6 pr-16 py-8 rounded-full shadow-2xl focus-visible:ring-[#e78a53]"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" disabled={!input.trim() || isLoading} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-[#e78a53] hover:bg-[#d67a43] text-black h-10 w-10">
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
