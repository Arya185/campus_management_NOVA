"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AdminSidebar } from "@/components/admin-sidebar";
import { UserMenu } from "@/components/user-menu";
import {
  Bell,
  Search,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter
} from "lucide-react";

type AuditLog = {
  id: string;
  agentType: string;
  actorId: string;
  action: string;
  status: string;
  createdAt: string;
  errorDetail?: string;
};

export default function AIGovernance() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAgent, setFilterAgent] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    let filtered = logs;

    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.agentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterAgent) {
      filtered = filtered.filter(log => log.agentType === filterAgent);
    }

    if (filterStatus) {
      filtered = filtered.filter(log => log.status === filterStatus);
    }

    setFilteredLogs(filtered);
  }, [logs, searchTerm, filterAgent, filterStatus]);

  const fetchLogs = async () => {
    try {
      const response = await fetch("/api/admin/audit-logs");
      const data = await response.json();
      setLogs(data);
      setFilteredLogs(data);
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500/20 text-green-500">Success</Badge>;
      case "error":
        return <Badge className="bg-red-500/20 text-red-500">Error</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/20 text-yellow-500">Pending</Badge>;
      default:
        return <Badge className="bg-zinc-500/20 text-zinc-500">{status}</Badge>;
    }
  };

  const getAgentIcon = (agentType: string) => {
    if (agentType.includes("Academic")) return <Activity className="h-4 w-4" />;
    if (agentType.includes("Career")) return <Shield className="h-4 w-4" />;
    if (agentType.includes("Interview")) return <CheckCircle2 className="h-4 w-4" />;
    if (agentType.includes("Research")) return <Search className="h-4 w-4" />;
    if (agentType.includes("Project")) return <Clock className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const agentTypes = Array.from(new Set(logs.map(log => log.agentType)));
  const statuses = Array.from(new Set(logs.map(log => log.status)));

  return (
    <div className="min-h-screen bg-black flex">
      <AdminSidebar />

      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 z-10 flex-shrink-0">
          <div className="px-8 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                  <Shield className="h-6 w-6 text-amber-500" />
                  AI Governance
                </h1>
                <p className="text-zinc-400 text-sm">Monitor and audit AI agent activity</p>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-zinc-900/60 border-zinc-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-400 text-sm">Total Logs</p>
                    <p className="text-2xl font-bold text-white">{logs.length}</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-500/20 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900/60 border-zinc-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-400 text-sm">Success</p>
                    <p className="text-2xl font-bold text-green-500">{logs.filter(l => l.status === "success").length}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-green-500/20 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900/60 border-zinc-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-400 text-sm">Errors</p>
                    <p className="text-2xl font-bold text-red-500">{logs.filter(l => l.status === "error").length}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500/20 text-red-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900/60 border-zinc-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-zinc-400 text-sm">Pending</p>
                    <p className="text-2xl font-bold text-yellow-500">{logs.filter(l => l.status === "pending").length}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500/20 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="bg-zinc-900/60 border-zinc-800 mb-6">
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white"
                  />
                </div>
                <select
                  value={filterAgent}
                  onChange={(e) => setFilterAgent(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white px-4 py-2 rounded-md"
                >
                  <option value="">All Agents</option>
                  {agentTypes.map(agent => (
                    <option key={agent} value={agent}>{agent}</option>
                  ))}
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-zinc-800 border-zinc-700 text-white px-4 py-2 rounded-md"
                >
                  <option value="">All Statuses</option>
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Audit Logs Table */}
          <Card className="bg-zinc-900/60 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Agent Activity Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-zinc-400">Loading logs...</div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-zinc-400">No logs found</div>
              ) : (
                <div className="space-y-3">
                  {filteredLogs.map((log) => (
                    <div key={log.id} className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                      <div className="p-2 rounded-lg bg-zinc-700">
                        {getAgentIcon(log.agentType)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-white font-medium">{log.agentType}</span>
                          <span className="text-zinc-500 text-sm">•</span>
                          <span className="text-zinc-400 text-sm">{log.action}</span>
                        </div>
                        <div className="text-zinc-500 text-xs">
                          {new Date(log.createdAt).toLocaleString()}
                        </div>
                        {log.errorDetail && (
                          <div className="text-red-400 text-xs mt-1">{log.errorDetail}</div>
                        )}
                      </div>
                      {getStatusBadge(log.status)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
