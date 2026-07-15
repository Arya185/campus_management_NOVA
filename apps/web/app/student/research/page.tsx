"use client";

import React, { useEffect, useRef, useState } from "react";
import { StudentSidebar } from "@/components/student-sidebar";
import { UserMenu } from "@/components/user-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Bell,
  CheckCircle2,
  FileText,
  Loader2,
  Save,
  Send,
  Search,
} from "lucide-react";

type Source = {
  title: string;
  url: string;
  summary?: string;
};

type Note = {
  id: string;
  topic: string;
  content: string;
  sources: Source[];
  tags?: string[];
};

type Message = {
  id: string;
  role: "user" | "agent";
  content: string;
  prompt?: string;
  activityLog?: string[];
  sources?: Source[];
  noteId?: string | null;
  notes?: Note[] | null;
  isSaving?: boolean;
};

export default function ResearchAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "agent",
      content: "Hello! I am your Research Assistant. I can gather sources, summarize directions, and save research notes. What topic are you exploring?",
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

    const prompt = input;
    const userMessage: Message = { id: Date.now().toString(), role: "user", content: prompt };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/student/research-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to process request");

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "agent",
          content: data.reply,
          prompt,
          activityLog: data.activityLog,
          sources: data.sources || [],
          noteId: data.noteId,
          notes: data.notes,
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

  const handleSave = async (msgId: string) => {
    const message = messages.find((msg) => msg.id === msgId);
    if (!message || message.noteId) return;

    setMessages((prev) => prev.map((msg) => (msg.id === msgId ? { ...msg, isSaving: true } : msg)));

    try {
      const response = await fetch("/api/student/research-agent/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: message.prompt || "Research Session",
          content: message.content,
          sources: message.sources || [],
          tags: [],
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save note");

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === msgId ? { ...msg, noteId: data.noteId, isSaving: false } : msg,
        ),
      );
    } catch (error: any) {
      setMessages((prev) => prev.map((msg) => (msg.id === msgId ? { ...msg, isSaving: false } : msg)));
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
                  <Search className="h-6 w-6 text-[#e78a53]" />
                  Research Assistant
                </h1>
                <p className="text-zinc-400 text-sm">Source discovery, summaries, and saved research notes</p>
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
                      <Search className="h-3 w-3" /> Agent Activity
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

                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-6 border border-zinc-700/50 rounded-xl overflow-hidden bg-black/20">
                    <div className="bg-zinc-800/50 px-4 py-3 flex items-center justify-between border-b border-zinc-700/50">
                      <div className="flex items-center gap-2 text-white font-medium">
                        <FileText className="h-4 w-4 text-[#e78a53]" />
                        Sources
                      </div>
                      {msg.noteId ? (
                        <Badge className="bg-green-500/20 text-green-500 hover:bg-green-500/20">SAVED</Badge>
                      ) : (
                        <Button onClick={() => handleSave(msg.id)} disabled={msg.isSaving} className="bg-[#e78a53] hover:bg-[#d67a43] text-black h-8 px-3">
                          {msg.isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                          Save Session
                        </Button>
                      )}
                    </div>
                    <div className="p-4 space-y-3">
                      {msg.sources.map((source, idx) => (
                        <div key={`${source.url}-${idx}`} className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3">
                          <a href={source.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-white hover:text-[#e78a53]">
                            {source.title}
                          </a>
                          {source.summary && <div className="text-sm text-zinc-400 mt-1">{source.summary}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg flex items-center gap-3 text-zinc-400">
                <Loader2 className="h-5 w-5 animate-spin text-[#e78a53]" />
                Agent is collecting sources...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {messages.length === 1 && (
          <div className="px-8 pb-4 grid grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
            {[
              "Find sources on federated learning in education",
              "Summarize recent papers on graph neural networks",
              "Help me research climate adaptation policy",
              "Collect references for NLP bias evaluation",
            ].map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                className="bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-[#e78a53]/50 justify-start h-auto py-3 px-4"
                onClick={() => setInput(suggestion)}
              >
                <Search className="h-4 w-4 mr-2 text-[#e78a53]" />
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
              placeholder="Ask your Research Assistant..."
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
