"use client";

import { useSimulationStore } from "@/lib/store";
import { AccessEvent } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  CheckCircle2,
  XCircle,
  Radio,
  Clock,
} from "lucide-react";

export function LiveAccessFeed() {
  const { events, apps, permissions, isRunning } = useSimulationStore();

  const totalEvents = events.length;
  const blockedCount = events.filter((e) => e.outcome === "blocked").length;
  const allowedCount = totalEvents - blockedCount;

  return (
    <Card className="hud-panel flex flex-col h-full shadow-lg shadow-black/30">
      <CardHeader className="pb-3 pt-4 px-5 border-b border-cyan-500/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold uppercase tracking-wider text-white font-heading">
                  Live Access Feed
                </CardTitle>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    {isRunning && (
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-2 w-2 ${
                        isRunning ? "bg-emerald-500" : "bg-slate-600"
                      }`}
                    />
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {isRunning ? "Streaming" : "Idle"}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Real-time simulated data access requests
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <Badge
              variant="outline"
              className="bg-slate-800/60 border-slate-700 text-slate-300 px-2 py-0.5"
            >
              Total: {totalEvents}
            </Badge>
            <Badge
              variant="outline"
              className="bg-emerald-950/60 border-emerald-800/60 text-emerald-300 px-2 py-0.5"
            >
              Allowed: {allowedCount}
            </Badge>
            {blockedCount > 0 && (
              <Badge
                variant="outline"
                className="bg-rose-950/60 border-rose-800/60 text-rose-300 px-2 py-0.5"
              >
                Blocked: {blockedCount}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 min-h-[400px] max-h-[calc(100vh-180px)] lg:max-h-[calc(100vh-140px)] overflow-hidden flex flex-col">
        {totalEvents === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <Radio className="h-8 w-8 text-slate-600 animate-pulse mb-3" />
            <p className="text-sm font-semibold text-slate-300 font-sans">
              Waiting for Access Attempts...
            </p>
            <p className="text-xs text-slate-400 max-w-xs mt-1 font-sans">
              Events will stream here automatically every ~2 seconds as apps
              attempt data access.
            </p>
          </div>
        ) : (
          <div
            className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y-0"
            data-slot="access-feed"
          >
            {events.map((evt: AccessEvent) => {
              const isBlocked = evt.outcome === "blocked";
              const app = apps[evt.appId];
              const perm = permissions[evt.permissionId];
              const appName = app?.name || evt.appId;
              const permLabel = perm?.label || evt.permissionId;

              return (
                <div
                  key={evt.id}
                  data-slot="event-row"
                  className={`p-3 rounded-lg border text-xs font-mono transition-all ${
                    isBlocked
                      ? "bg-rose-950/30 border-rose-800/60 hover:bg-rose-950/50 shadow-sm shadow-rose-950/30"
                      : "bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700/80"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    {/* Left: Time, App, Permission */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 bg-slate-950/70 px-2 py-0.5 rounded border border-slate-800">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {evt.time}
                        <span className="text-slate-400 text-[10px]">
                          #{evt.tick}
                        </span>
                      </span>

                      <span className="font-bold text-white text-xs">
                        {appName}
                      </span>

                      <span className="text-slate-400">•</span>

                      <span className="px-2 py-0.5 rounded bg-slate-800/90 text-cyan-300 text-[11px] border border-slate-700/60 font-medium">
                        {permLabel}
                      </span>
                    </div>

                    {/* Right: Outcome Badge */}
                    <div className="shrink-0">
                      {isBlocked ? (
                        <Badge
                          variant="destructive"
                          className="bg-rose-950 border border-rose-700 text-rose-300 font-bold text-[10px] tracking-wider uppercase px-2 py-0.5 gap-1 shadow-sm"
                        >
                          <XCircle className="h-3 w-3" />
                          BLOCKED
                          {evt.blockReason && (
                            <span className="text-rose-200">
                              [{evt.blockReason}]
                            </span>
                          )}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 font-semibold text-[10px] tracking-wider uppercase px-2 py-0.5 gap-1"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          ALLOWED
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Reason String */}
                  <div className="mt-2 pt-1.5 border-t border-slate-800/50 flex items-start gap-1.5 text-slate-400 text-[11px]">
                    <span className="text-slate-400 uppercase text-[9px] tracking-wider shrink-0 mt-0.5">
                      Reason:
                    </span>
                    <span
                      className={`truncate ${
                        isBlocked ? "text-rose-200/90 font-medium" : "text-slate-300"
                      }`}
                    >
                      {evt.reason}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

