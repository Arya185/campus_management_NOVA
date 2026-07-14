"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { StudentSidebar } from "@/components/student-sidebar";
import { UserMenu } from "@/components/user-menu";
import {
  Bell,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Brain,
  Calendar,
  Clock,
  BookOpen
} from "lucide-react";

type Message = {
  id: string;
  role: "user" | "agent";
  content: string;
  activityLog?: string[];
  planId?: string;
  actionId?: string;
  status?: "pending" | "approved" | "rejected";
  sessions?: any[];
};

export default function AiMentor() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "agent",
      content: "Hello! I am your Academic Success Agent. I can help you check your timetable, review your attendance risk, track deadlines, or plan your study week. What would you like to do?"
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
      const response = await fetch("/api/student/agent", {
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
        content: data.reply,
        activityLog: data.activityLog,
        planId: data.planId,
        actionId: data.actionId,
        sessions: data.sessions,
        status: data.actionId ? "pending" : undefined
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

  const handleAction = async (msgId: string, actionId: string, status: "approved" | "rejected") => {
    try {
      const response = await fetch("/api/student/agent/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId, status })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to resolve action");

      setMessages(prev => prev.map(msg => 
        msg.id === msgId ? { ...msg, status } : msg
      ));
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  const handleSessionAction = async (planId: string, sessionId: string, action: "complete" | "skip", msgId: string, sessionIdx: number) => {
    try {
      const response = await fetch("/api/student/agent/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, sessionId, action })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `Failed to ${action} session`);

      setMessages(prev => prev.map(msg => {
        if (msg.id === msgId && msg.sessions) {
          const newSessions = [...msg.sessions];
          newSessions[sessionIdx] = { ...newSessions[sessionIdx], status: action === "complete" ? "completed" : "skipped" };
          return { ...msg, sessions: newSessions };
        }
        return msg;
      }));
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-black flex">
      <StudentSidebar />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 z-10 flex-shrink-0">
          <div className="px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                  <Brain className="h-6 w-6 text-[#e78a53]" />
                  Academic Success Agent
                </h1>
                <p className="text-zinc-400 text-sm">Your personal AI for academic planning and success</p>
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
              <div className={`max-w-3xl ${msg.role === "user" ? "bg-[#e78a53] text-black" : "bg-zinc-900 text-zinc-200 border border-zinc-800"} rounded-2xl p-6 shadow-lg`}>
                
                {/* Agent Activity Log */}
                {msg.activityLog && msg.activityLog.length > 0 && (
                  <div className="mb-4 pb-4 border-b border-zinc-800/50 space-y-2">
                    <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                      <Brain className="h-3 w-3" /> Agent Activity
                    </div>
                    {msg.activityLog.map((log, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-zinc-400">
                        <CheckCircle2 className="h-4 w-4 text-[#e78a53]/70" />
                        {log}
                      </div>
                    ))}
                  </div>
                )}

                {/* Message Content */}
                <div className="whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </div>

                {/* Proposed Action / Study Plan */}
                {msg.actionId && msg.status && (
                  <div className="mt-6 border border-zinc-700/50 rounded-xl overflow-hidden bg-black/20">
                    <div className="bg-zinc-800/50 px-4 py-3 flex items-center justify-between border-b border-zinc-700/50">
                      <div className="flex items-center gap-2 text-white font-medium">
                        <Calendar className="h-4 w-4 text-[#e78a53]" />
                        Proposed Study Plan
                      </div>
                      <Badge 
                        className={
                          msg.status === "pending" ? "bg-amber-500/20 text-amber-500 hover:bg-amber-500/20" :
                          msg.status === "approved" ? "bg-green-500/20 text-green-500 hover:bg-green-500/20" :
                          "bg-red-500/20 text-red-500 hover:bg-red-500/20"
                        }
                      >
                        {msg.status.toUpperCase()}
                      </Badge>
                    </div>
                    
                    {msg.status === "pending" && (
                      <div className="p-4 bg-zinc-900/30 flex gap-3">
                        <Button 
                          onClick={() => handleAction(msg.id, msg.actionId!, "approved")}
                          className="bg-[#e78a53] hover:bg-[#d67a43] text-black flex-1"
                        >
                          Approve Plan
                        </Button>
                        <Button 
                          onClick={() => handleAction(msg.id, msg.actionId!, "rejected")}
                          variant="outline" 
                          className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 flex-1"
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                    {msg.status === "approved" && (
                      <div className="p-4 bg-green-500/10 text-green-500 flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <CheckCircle2 className="h-4 w-4" /> This plan is active on your schedule.
                        </div>
                        {msg.sessions && msg.sessions.length > 0 && (
                          <div className="space-y-2 mt-2">
                            {msg.sessions.map((session, sidx) => (
                              <div key={session.id} className="bg-zinc-900/80 p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between border border-zinc-700/50 gap-3">
                                <div>
                                  <div className="text-zinc-200 font-medium text-sm">{session.title}</div>
                                  <div className="text-zinc-400 text-xs mt-1 flex items-center gap-2">
                                    <Calendar className="h-3 w-3" /> {session.date} 
                                    <Clock className="h-3 w-3 ml-1" /> {session.startTime} - {session.endTime}
                                  </div>
                                </div>
                                {session.status === "planned" || !session.status ? (
                                  <div className="flex gap-2">
                                    <Button size="sm" onClick={() => handleSessionAction(msg.planId!, session.id, "complete", msg.id, sidx)} className="bg-green-600 hover:bg-green-500 text-white text-xs h-7 px-3">Complete</Button>
                                    <Button size="sm" variant="outline" onClick={() => handleSessionAction(msg.planId!, session.id, "skip", msg.id, sidx)} className="border-zinc-600 text-zinc-300 hover:bg-zinc-700 text-xs h-7 px-3">Skip</Button>
                                  </div>
                                ) : (
                                  <Badge className={session.status === "completed" ? "bg-green-500/20 text-green-500 border-green-500/30" : "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"}>
                                    {session.status.toUpperCase()}
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {msg.status === "rejected" && (
                      <div className="p-4 bg-red-500/10 text-red-500 text-sm flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" /> This proposal was rejected.
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
                Agent is thinking and analyzing your data...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Actions (Empty state helpers) */}
        {messages.length === 1 && (
          <div className="px-8 pb-4 grid grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
            {[
              { icon: Clock, text: "What is my timetable like this week?" },
              { icon: AlertCircle, text: "Review my attendance risk" },
              { icon: BookOpen, text: "What are my upcoming deadlines?" },
              { icon: Calendar, text: "Plan my exam week" }
            ].map((suggestion, idx) => (
              <Button
                key={idx}
                variant="outline"
                className="bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-[#e78a53]/50 justify-start h-auto py-3 px-4"
                onClick={() => setInput(suggestion.text)}
              >
                <suggestion.icon className="h-4 w-4 mr-2 text-[#e78a53]" />
                <span className="text-left text-sm truncate">{suggestion.text}</span>
              </Button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="p-8 pt-4 flex-shrink-0 bg-gradient-to-t from-black via-black to-transparent">
          <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your Academic Agent..."
              className="w-full bg-zinc-900/80 border-zinc-700 text-white placeholder:text-zinc-500 pl-6 pr-16 py-8 rounded-full shadow-2xl focus-visible:ring-[#e78a53]"
              disabled={isLoading}
            />
            <Button 
              type="submit" 
              size="icon"
              disabled={!input.trim() || isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-[#e78a53] hover:bg-[#d67a43] text-black h-10 w-10"
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
