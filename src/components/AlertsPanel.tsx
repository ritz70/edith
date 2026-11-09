"use client";

import { useSimulationStore } from "@/lib/store";
import { Alert, AlertSeverity } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  ShieldAlert,
  Info,
  Clock,
  CheckCircle2,
} from "lucide-react";

function getAlertBadge(severity: AlertSeverity) {
  switch (severity) {
    case "critical":
      return {
        badgeClass: "bg-rose-950/90 border-rose-700/80 text-rose-300",
        icon: ShieldAlert,
        borderClass: "border-rose-900/60 bg-rose-950/20",
      };
    case "warning":
      return {
        badgeClass: "bg-amber-950/90 border-amber-700/80 text-amber-300",
        icon: AlertTriangle,
        borderClass: "border-amber-900/60 bg-amber-950/20",
      };
    case "info":
      return {
        badgeClass: "bg-cyan-950/90 border-cyan-700/80 text-cyan-300",
        icon: Info,
        borderClass: "border-cyan-900/60 bg-cyan-950/20",
      };
  }
}

export function AlertsPanel() {
  const { alerts, apps } = useSimulationStore();
  const alertList = alerts.slice(0, 15);

  return (
    <Card className="bg-slate-900/90 border-slate-800/90 shadow-lg shadow-black/20">
      <CardHeader className="pb-3 pt-4 px-5 border-b border-slate-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-amber-950/60 border border-amber-800/60 flex items-center justify-center text-amber-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-white font-mono">
                Security Alerts ({alerts.length})
              </CardTitle>
              <p className="text-[11px] text-slate-400 font-mono">
                Heuristic anomaly &amp; policy alerts with 15-tick cooldown
              </p>
            </div>
          </div>

          {alerts.length > 0 && (
            <Badge
              variant="outline"
              className="bg-rose-950/80 border-rose-800 text-rose-300 text-[10px] font-mono px-2 py-0.5 animate-pulse"
            >
              {alerts.filter((a) => a.severity === "critical").length} Critical
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0 max-h-56 overflow-y-auto">
        {alertList.length === 0 ? (
          <div className="p-6 text-center text-slate-500 font-mono text-xs flex flex-col items-center justify-center gap-1.5">
            <CheckCircle2 className="h-5 w-5 text-emerald-500/80" />
            <span className="text-slate-300 font-semibold font-sans">
              No Active Security Alerts
            </span>
            <span className="text-[11px] text-slate-400 font-sans">
              App data access frequency and permissions operating within
              baselines.
            </span>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {alertList.map((alert: Alert) => {
              const meta = getAlertBadge(alert.severity);
              const Icon = meta.icon;
              const appName = apps[alert.appId]?.name || alert.appId;

              return (
                <div
                  key={alert.id}
                  className={`p-3 text-xs font-mono transition-colors hover:bg-slate-800/40 ${meta.borderClass}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={`text-[9px] uppercase tracking-wider px-1.5 py-0 font-bold gap-1 ${meta.badgeClass}`}
                      >
                        <Icon className="h-2.5 w-2.5" />
                        {alert.severity}
                      </Badge>
                      <span className="font-bold text-white text-xs">
                        {appName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-slate-400 shrink-0">
                      <Clock className="h-3 w-3" />
                      <span>{alert.time}</span>
                      <span className="text-slate-500">#{alert.tick}</span>
                    </div>
                  </div>

                  <p className="mt-1 text-slate-300 text-[11px] leading-relaxed pl-0.5">
                    {alert.message}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

