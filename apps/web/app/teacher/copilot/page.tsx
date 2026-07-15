"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TeacherSidebar } from "@/components/teacher-sidebar";
import { UserMenu } from "@/components/user-menu";
import {
  Bell,
  Send,
  Loader2,
  CheckCircle2,
  Users,
  TrendingUp,
  BookOpen
} from "lucide-react";

type Message = {
  id: string;
  role: "user" | "agent";
  content: string;
  activityLog?: string[];
};

export default function TeacherCopilot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "agent",
      content: "Hello! I am your Teacher Copilot. I can help you view student lists, attendance summaries, performance summaries, and individual student details. What would you like to know?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/teacher/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMessage.content })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to process request");
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "agent",
        content: data.reply || JSON.stringify(data, null, 2),
        activityLog: data.activityLog
      }]);
    } catch (error: any) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "agent",
        content: `Error: ${error.message}. Please try again.`
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex">
      <TeacherSidebar />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 z-10 flex-shrink-0">
          <div className="px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-purple-500" />
                  Teacher Copilot
                </h1>
                <p className="text-zinc-400 text-sm">AI-powered classroom insights and student support</p>
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

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-3xl ${msg.role === "user" ? "bg-purple-600 text-black" : "bg-zinc-900 text-zinc-200 border border-zinc-800"} rounded-2xl p-6 shadow-lg`}>
                
                {/* Agent Activity Log */}
                {msg.activityLog && msg.activityLog.length > 0 && (
                  <div className="mb-4 pb-4 border-b border-zinc-800/50 space-y-2">
                    <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                      <Users className="h-3 w-3" /> Agent Activity
                    </div>
                    {msg.activityLog.map((log, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-zinc-400">
                        <CheckCircle2 className="h-4 w-4 text-purple-500/70" />
                        {log}
                      </div>
                    ))}
                  </div>
                )}

                {/* Message Content */}
                <div className="whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-lg">
                <Loader2 className="h-5 w-5 text-zinc-400 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-zinc-800 bg-zinc-900/80 backdrop-blur-md p-6">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about students, attendance, performance, or individual details..."
              className="flex-1 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:ring-purple-500"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="bg-purple-600 hover:bg-purple-500 text-white px-6"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
