"use client";

import { useState, useEffect, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { useSimulationStore } from "@/lib/store";
import { AuditKind } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  ArrowLeft,
  Search,
  Filter,
  Clock,
  Cpu,
  Layers,
  User,
  Bot,
  AlertTriangle,
  KeyRound,
  TrendingDown,
  Activity,
  RotateCcw,
} from "lucide-react";

const emptySubscribe = () => () => {};

export default function HistoryPage() {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const { auditLog, tick, time, apps, isRunning, step } = useSimulationStore();

  const [selectedApp, setSelectedApp] = useState<string>("all");
  const [selectedKind, setSelectedKind] = useState<string>("all");
  const [selectedActor, setSelectedActor] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const pageSize = 50;

  // Continue running simulation tick while in history page if it was running
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      step();
    }, 2000);
    return () => clearInterval(interval);
  }, [isRunning, step]);

  const filteredEntries = useMemo(() => {
    return auditLog.filter((entry) => {
      if (selectedApp !== "all" && entry.appId !== selectedApp) {
        return false;
      }
      if (selectedKind !== "all" && entry.kind !== selectedKind) {
        return false;
      }
      if (selectedActor !== "all" && entry.actor !== selectedActor) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesDetail = entry.detail.toLowerCase().includes(query);
        const matchesApp = entry.appId.toLowerCase().includes(query);
        const matchesKind = entry.kind.toLowerCase().includes(query);
        if (!matchesDetail && !matchesApp && !matchesKind) {
          return false;
        }
      }
      return true;
    });
  }, [auditLog, selectedApp, selectedKind, selectedActor, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-mono flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-sm">
            Loading E.D.I.T.H. Activity History...
          </p>
        </div>
      </div>
    );
  }

  const getKindBadge = (kind: AuditKind) => {
    switch (kind) {
      case "access":
        return {
          label: "Access",
          badgeClass: "bg-slate-800 text-slate-300 border-slate-700",
          icon: Activity,
        };
      case "alert":
        return {
          label: "Alert",
          badgeClass: "bg-rose-950/80 text-rose-300 border-rose-800/80",
          icon: AlertTriangle,
        };
      case "permission_change":
        return {
          label: "Permission",
          badgeClass: "bg-purple-950/80 text-purple-300 border-purple-800/80",
          icon: KeyRound,
        };
      case "trust_change":
        return {
          label: "Trust Score",
          badgeClass: "bg-amber-950/80 text-amber-300 border-amber-800/80",
          icon: TrendingDown,
        };
      case "simulation":
        return {
          label: "Simulation",
          badgeClass: "bg-emerald-950/80 text-emerald-300 border-emerald-800/80",
          icon: Layers,
        };
    }
  };

  const getAppName = (appId: string) => {
    if (appId === "system") return "System";
    return apps[appId]?.name || appId;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button
                variant="outline"
                size="sm"
                className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white font-mono text-xs gap-1.5"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Dashboard
              </Button>
            </Link>

            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-500/20 via-emerald-500/10 to-transparent border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Shield className="h-4.5 w-4.5" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-white font-mono flex items-center gap-2">
                  E.D.I.T.H. Activity History
                  <Badge
                    variant="outline"
                    className="bg-cyan-950/60 border-cyan-700/60 text-cyan-400 font-mono text-[10px] tracking-wider uppercase px-2 py-0.5"
                  >
                    Full Audit Log
                  </Badge>
                </h1>
                <p className="text-xs text-slate-400">
                  Immutable audit log of all simulated accesses, security
                  alerts, and user permission decisions
                </p>
              </div>
            </div>
          </div>

          {/* Clock & Status */}
          <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-1.5 font-mono shadow-sm self-start md:self-auto text-xs">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <Clock className="h-3.5 w-3.5" />
              <span className="font-bold text-white">{time}</span>
            </div>
            <div className="w-px h-4 bg-slate-800" />
            <div className="flex items-center gap-1.5 text-cyan-400">
              <Cpu className="h-3.5 w-3.5" />
              <span className="font-bold text-cyan-300">#{tick}</span>
            </div>
            <div className="w-px h-4 bg-slate-800" />
            <span className="text-slate-400">
              {auditLog.length} total events
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Filter Controls Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 md:p-5 space-y-4 shadow-xl font-mono">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
              <Filter className="h-3.5 w-3.5 text-cyan-400" />
              Audit Filters &amp; Search
            </div>
            {(selectedApp !== "all" ||
              selectedKind !== "all" ||
              selectedActor !== "all" ||
              searchQuery) && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => {
                  setSelectedApp("all");
                  setSelectedKind("all");
                  setSelectedActor("all");
                  setSearchQuery("");
                  setPage(1);
                }}
                className="text-xs text-slate-400 hover:text-rose-400 font-mono gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                Reset filters
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
            {/* Search Input */}
            <div className="relative md:col-span-1">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search audit detail..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            {/* App Filter */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">
                Filter by Application
              </label>
              <select
                value={selectedApp}
                onChange={(e) => {
                  setSelectedApp(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option value="all">All Applications</option>
                <option value="photomagic">PhotoMagic</option>
                <option value="notenest">NoteNest</option>
                <option value="fitpulse">FitPulse</option>
                <option value="system">System / Engine</option>
              </select>
            </div>

            {/* Kind Filter */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">
                Filter by Kind
              </label>
              <select
                value={selectedKind}
                onChange={(e) => {
                  setSelectedKind(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option value="all">All Event Kinds</option>
                <option value="access">Access</option>
                <option value="alert">Alert</option>
                <option value="permission_change">Permission Change</option>
                <option value="trust_change">Trust Change</option>
                <option value="simulation">Simulation</option>
              </select>
            </div>

            {/* Actor Filter */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-slate-400 block mb-1">
                Filter by Actor
              </label>
              <select
                value={selectedActor}
                onChange={(e) => {
                  setSelectedActor(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
              >
                <option value="all">All Actors</option>
                <option value="user">User (Manual / Applied)</option>
                <option value="system">System (Simulation Engine)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Info & Pagination */}
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <div>
            Showing{" "}
            <span className="text-white font-bold">
              {filteredEntries.length === 0
                ? 0
                : (currentPage - 1) * pageSize + 1}
              -
              {Math.min(currentPage * pageSize, filteredEntries.length)}
            </span>{" "}
            of{" "}
            <span className="text-cyan-400 font-bold">
              {filteredEntries.length}
            </span>{" "}
            matching entries
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="xs"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="bg-slate-900 border-slate-800 text-xs text-slate-300 disabled:opacity-40"
              >
                Previous
              </Button>
              <span className="text-slate-400 text-xs">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="xs"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="bg-slate-900 border-slate-800 text-xs text-slate-300 disabled:opacity-40"
              >
                Next
              </Button>
            </div>
          )}
        </div>

        {/* Audit Log Table */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="bg-slate-950/90 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 font-semibold w-28">Tick / Time</th>
                  <th className="py-3 px-4 font-semibold w-32">App</th>
                  <th className="py-3 px-4 font-semibold w-36">Kind</th>
                  <th className="py-3 px-4 font-semibold w-24">Actor</th>
                  <th className="py-3 px-4 font-semibold">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {paginatedEntries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-12 text-center text-slate-500 font-mono"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Activity className="h-6 w-6 text-slate-600 animate-pulse" />
                        <span className="text-slate-300 font-medium font-sans">
                          {auditLog.length === 0
                            ? "No Activity Recorded Yet"
                            : "No Matching Audit Records Found"}
                        </span>
                        <span className="text-[11px] text-slate-400 font-sans max-w-sm">
                          {auditLog.length === 0
                            ? "Start or advance the simulation to stream data access, alert triggers, and permission changes into the ledger."
                            : "No log entries match the selected filters. Adjust your search or filter selections to view records."}
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedEntries.map((entry) => {
                    const kindInfo = getKindBadge(entry.kind);
                    const KindIcon = kindInfo.icon;
                    const isBlocked = entry.detail.includes("blocked");
                    const isUserAction = entry.actor === "user";

                    return (
                      <tr
                        key={entry.id}
                        className={`hover:bg-slate-800/40 transition-colors ${
                          isBlocked ? "bg-rose-950/10" : ""
                        }`}
                      >
                        {/* Tick & Time */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="text-slate-400">#{entry.tick}</span>{" "}
                          <span className="text-slate-500">•</span>{" "}
                          <span className="text-white font-medium">
                            {entry.time}
                          </span>
                        </td>

                        {/* App */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-mono uppercase px-2 py-0.5 tracking-wider font-semibold ${
                              entry.appId === "photomagic"
                                ? "bg-cyan-950/60 border-cyan-800/70 text-cyan-300"
                                : entry.appId === "notenest"
                                ? "bg-indigo-950/60 border-indigo-800/70 text-indigo-300"
                                : entry.appId === "fitpulse"
                                ? "bg-amber-950/60 border-amber-800/70 text-amber-300"
                                : "bg-slate-800 border-slate-700 text-slate-300"
                            }`}
                          >
                            {getAppName(entry.appId)}
                          </Badge>
                        </td>

                        {/* Kind */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <Badge
                            variant="outline"
                            className={`text-[10px] font-mono tracking-wide px-2 py-0.5 inline-flex items-center gap-1 ${kindInfo.badgeClass}`}
                          >
                            <KindIcon className="h-3 w-3" />
                            {kindInfo.label}
                          </Badge>
                        </td>

                        {/* Actor */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                              isUserAction
                                ? "bg-cyan-950/90 border-cyan-600 text-cyan-300 shadow-xs"
                                : "bg-slate-800/60 border-slate-700 text-slate-400"
                            }`}
                          >
                            {isUserAction ? (
                              <User className="h-2.5 w-2.5 text-cyan-400" />
                            ) : (
                              <Bot className="h-2.5 w-2.5 text-slate-400" />
                            )}
                            {entry.actor}
                          </span>
                        </td>

                        {/* Detail */}
                        <td className="py-3 px-4 text-slate-200 break-words font-sans text-xs">
                          <span
                            className={
                              isBlocked
                                ? "text-rose-300 font-medium"
                                : isUserAction
                                ? "text-cyan-200 font-medium"
                                : "text-slate-300"
                            }
                          >
                            {entry.detail}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/60 py-3 px-6 text-center text-xs text-slate-500 font-mono">
        NITSHACKS 9.0 — E.D.I.T.H. Enhanced Digital Identity, Trust &amp;
        Heuristics
      </footer>
    </div>
  );
}

