"use client";

import { useSimulationStore } from "@/lib/store";
import { App, GrantStatus, TrustLevel } from "@/lib/types";
import { computeTrust } from "@/lib/trust";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  ShieldAlert,
  Shield,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Smartphone,
  Layers,
  ChevronRight,
  TrendingDown,
} from "lucide-react";

/**
 * Dynamic Circular SVG Trust Score Ring
 */
function TrustScoreRing({
  score,
  level,
}: {
  score: number;
  level: TrustLevel;
}) {
  const radius = 32;
  const stroke = 5;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const safeScore = Number.isFinite(score) ? Math.max(0, Math.min(100, Math.round(score))) : 0;
  const strokeDashoffset = circumference - (safeScore / 100) * circumference;

  let strokeColor = "text-emerald-500";
  let textColor = "text-emerald-400";

  if (level === "suspended") {
    strokeColor = "text-slate-500";
    textColor = "text-slate-400";
  } else if (level === "high_risk") {
    strokeColor = "text-rose-500";
    textColor = "text-rose-400";
  } else if (level === "caution") {
    strokeColor = "text-amber-500";
    textColor = "text-amber-400";
  }

  return (
    <div className="relative flex items-center justify-center shrink-0 w-16 h-16">
      <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="text-slate-800"
        />
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className={`${strokeColor} transition-all duration-500 ease-out`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-sm font-bold text-white tracking-tight leading-none font-mono">
          {safeScore}
        </span>
        <span
          className={`text-[8px] font-semibold uppercase tracking-wider font-mono ${textColor}`}
        >
          Score
        </span>
      </div>
    </div>
  );
}

function TrustSparkline({
  snapshots,
  strokeColor,
}: {
  snapshots: { score: number }[];
  strokeColor: string;
}) {
  const validSnapshots = (snapshots || []).filter((s) => s && Number.isFinite(s.score));
  if (validSnapshots.length < 2) return null;
  const width = 56;
  const height = 18;
  const recent = validSnapshots.slice(-20);
  const scores = recent.map((s) => s.score);
  const min = Math.min(...scores, 0);
  const max = Math.max(...scores, 100);
  const range = max - min || 1;

  const points = scores
    .map((score, i) => {
      const x = (i / (scores.length - 1)) * width;
      const y = height - ((score - min) / range) * (height - 4) - 2;
      return `${Number.isFinite(x) ? x.toFixed(1) : 0},${Number.isFinite(y) ? y.toFixed(1) : 0}`;
    })
    .join(" ");

  return (
    <div className="flex items-center shrink-0" title="Trust score sparkline">
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    </div>
  );
}

function getLevelBadge(level: TrustLevel) {
  switch (level) {
    case "trusted":
      return {
        badgeClass:
          "bg-emerald-950/90 border-emerald-700/80 text-emerald-300",
        label: "Trusted",
        icon: ShieldCheck,
      };
    case "caution":
      return {
        badgeClass:
          "bg-amber-950/90 border-amber-700/80 text-amber-300",
        label: "Caution",
        icon: ShieldAlert,
      };
    case "high_risk":
      return {
        badgeClass: "bg-rose-950/90 border-rose-700/80 text-rose-300",
        label: "High Risk",
        icon: ShieldAlert,
      };
    case "suspended":
      return {
        badgeClass: "bg-slate-800/90 border-slate-700/80 text-slate-300",
        label: "Suspended",
        icon: Shield,
      };
    default:
      return {
        badgeClass: "bg-slate-800/90 border-slate-700/80 text-slate-300",
        label: "Unknown",
        icon: Shield,
      };
  }
}

function getPermissionChipStyle(status: GrantStatus) {
  switch (status) {
    case "allowed":
      return {
        bg: "bg-emerald-950/80 hover:bg-emerald-900/80 border-emerald-800/80 text-emerald-300",
        dot: "bg-emerald-400",
        label: "Allowed",
        icon: CheckCircle2,
      };
    case "restricted":
      return {
        bg: "bg-amber-950/80 hover:bg-amber-900/80 border-amber-800/80 text-amber-300",
        dot: "bg-amber-400",
        label: "Restricted",
        icon: AlertCircle,
      };
    case "revoked":
      return {
        bg: "bg-rose-950/50 hover:bg-rose-900/50 border-rose-900/60 text-rose-300",
        dot: "bg-rose-400",
        label: "Revoked",
        icon: XCircle,
      };
  }
}

export function AppCards() {
  const {
    apps,
    permissions,
    events,
    tick,
    trustSnapshots,
    selectApp,
    selectedAppId,
  } = useSimulationStore();
  const appList = Object.values(apps);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Smartphone className="h-4 w-4 text-cyan-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-200 font-mono">
            Monitored Applications ({appList.length})
          </h2>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          Click card to inspect trust profile
        </span>
      </div>

      <div className="space-y-3.5">
        {appList.map((app: App) => {
          const grantEntries = Object.entries(app.grants);

          // Compute real dynamic trust score
          const trust = computeTrust(app, events, tick, permissions);
          const levelInfo = getLevelBadge(trust.level);
          const LevelIcon = levelInfo.icon;
          const topDeduction = trust.deductions[0];
          const isSelected = selectedAppId === app.id;

          let sparklineColor = "#10b981";
          if (trust.level === "caution") sparklineColor = "#f59e0b";
          if (trust.level === "high_risk") sparklineColor = "#f43f5e";
          if (trust.level === "suspended") sparklineColor = "#64748b";

          const appSnapshots = trustSnapshots.filter(
            (s) => s.appId === app.id
          );

          return (
            <Card
              key={app.id}
              onClick={() => selectApp(app.id)}
              className={`bg-slate-900/90 border transition-all shadow-lg shadow-black/20 cursor-pointer group ${
                isSelected
                  ? "border-cyan-500/80 ring-1 ring-cyan-500/40"
                  : "border-slate-800/90 hover:border-slate-700"
              }`}
            >
              <CardHeader className="pb-2 pt-4 px-5">
                <div className="flex items-start justify-between gap-3 w-full">
                  {/* Left: App Info */}
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <CardTitle className="text-base font-bold text-white font-mono tracking-tight group-hover:text-cyan-300 transition-colors flex items-center gap-1.5 truncate">
                        {app.name}
                        <ChevronRight className="h-4 w-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 tracking-wider font-semibold shrink-0 ${
                          app.status === "active"
                            ? "bg-emerald-950/80 border-emerald-800/80 text-emerald-400"
                            : "bg-rose-950/80 border-rose-800/80 text-rose-400"
                        }`}
                      >
                        {app.status}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs text-slate-300 font-sans line-clamp-2">
                      <span className="text-cyan-400 font-semibold">
                        {app.category}
                      </span>{" "}
                      — {app.description}
                    </CardDescription>
                  </div>

                  {/* Right: Dynamic Trust Score Ring & Sparkline (Always preserved, never shrinks) */}
                  <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                    <div className="text-right flex flex-col items-end gap-1">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-mono tracking-wide px-2 py-0.5 inline-flex items-center gap-1 ${levelInfo.badgeClass}`}
                      >
                        <LevelIcon className="h-3 w-3" />
                        {levelInfo.label}
                      </Badge>
                      <TrustSparkline
                        snapshots={appSnapshots}
                        strokeColor={sparklineColor}
                      />
                    </div>
                    <TrustScoreRing score={trust.score} level={trust.level} />
                  </div>
                </div>

                {/* Top deduction one-line "why" under each score */}
                <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center gap-1.5 text-xs font-mono w-full min-w-0">
                  {topDeduction ? (
                    <div className="flex items-center gap-1.5 text-amber-300 w-full min-w-0">
                      <TrendingDown className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <span className="truncate flex-1 min-w-0" title={topDeduction.detail}>
                        {topDeduction.detail}
                      </span>
                      <span className="text-rose-400 font-bold shrink-0">
                        (-{topDeduction.points} pts)
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-emerald-400 w-full min-w-0 text-[11px]">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate flex-1 min-w-0">
                        Normal operational baseline — all permissions justified
                      </span>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="px-5 pb-4 pt-1">
                {/* Permission Chips Section */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1 text-[11px] font-medium text-slate-300">
                      <Layers className="h-3 w-3 text-slate-400" />
                      Permission Grants ({grantEntries.length}):
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {grantEntries.filter(([, s]) => s === "allowed").length}{" "}
                      active
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {grantEntries.map(([permId, grantStatus]) => {
                      const perm = permissions[permId];
                      const style = getPermissionChipStyle(grantStatus);

                      return (
                        <div
                          key={permId}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono border transition-colors ${style.bg}`}
                          title={`Permission: ${perm?.label || permId} (${style.label})`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
                          />
                          <span className="font-medium text-slate-200">
                            {perm?.label || permId}
                          </span>
                          <span className="text-[9px] opacity-75 uppercase">
                            [{grantStatus}]
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
