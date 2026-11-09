"use client";

import { useSimulationStore } from "@/lib/store";
import { computeTrust } from "@/lib/trust";
import { getRecommendations } from "@/lib/recommendations";
import { GrantStatus, Recommendation } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  ShieldCheck,
  ShieldAlert,
  Shield,
  Activity,
  Layers,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Ban,
  RotateCw,
  Clock,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export function AppDetailSheet() {
  const {
    selectedAppId,
    selectApp,
    apps,
    permissions,
    events,
    tick,
    trustSnapshots,
    setPermissionGrant,
    suspendApp,
    reinstateApp,
    approveRequest,
    denyRequest,
  } = useSimulationStore();

  if (!selectedAppId) return null;
  const app = apps[selectedAppId];
  if (!app) return null;

  const trust = computeTrust(app, events, tick, permissions);
  const recommendations = getRecommendations(
    app,
    trust,
    events,
    tick,
    permissions
  );

  const handleApplyRecommendation = (rec: Recommendation) => {
    switch (rec.action) {
      case "deny":
        if (rec.permissionId) {
          denyRequest(rec.appId, rec.permissionId);
        }
        break;
      case "revoke":
        if (rec.permissionId) {
          setPermissionGrant(rec.appId, rec.permissionId, "revoked");
        }
        break;
      case "restrict":
        if (rec.permissionId) {
          setPermissionGrant(rec.appId, rec.permissionId, "restricted");
        }
        break;
      case "suspend":
        suspendApp(rec.appId);
        break;
    }
  };

  const appSnapshots = trustSnapshots
    .filter((s) => s.appId === app.id)
    .slice(-40);

  // Dynamic chart line color
  let chartColor = "#10b981"; // emerald
  if (trust.level === "caution") chartColor = "#f59e0b"; // amber
  if (trust.level === "high_risk") chartColor = "#f43f5e"; // rose
  if (trust.level === "suspended") chartColor = "#64748b"; // slate

  const allManagedPermIds = Array.from(
    new Set([...Object.keys(app.grants), ...Object.keys(app.baseline)])
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in">
      {/* Backdrop click to close */}
      <div
        className="flex-1 cursor-pointer"
        onClick={() => selectApp(null)}
        title="Click to dismiss"
      />

      {/* Side Sheet Panel */}
      <aside className="w-full max-w-xl h-full bg-slate-950 border-l border-slate-800 text-slate-100 p-6 overflow-y-auto flex flex-col gap-6 shadow-2xl font-mono">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {app.name}
              </h2>
              <Badge
                variant="outline"
                className={`text-[10px] font-mono uppercase px-2 py-0.5 tracking-wider font-semibold ${
                  app.status === "active"
                    ? "bg-emerald-950/80 border-emerald-800/80 text-emerald-400"
                    : "bg-rose-950/80 border-rose-800/80 text-rose-400"
                }`}
              >
                {app.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              <span className="text-cyan-400 font-medium">
                {app.category}
              </span>{" "}
              — {app.description}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Suspend / Reinstate Controls (SPEC Section 6) */}
            {app.status === "active" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => suspendApp(app.id)}
                className="bg-rose-950/50 border-rose-800/80 text-rose-300 hover:bg-rose-900/60 hover:text-white text-xs font-mono gap-1.5"
                title="Suspend application: halts all data accesses immediately"
              >
                <Ban className="h-3.5 w-3.5" />
                Suspend App
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => reinstateApp(app.id)}
                className="bg-emerald-950/50 border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/60 hover:text-white text-xs font-mono gap-1.5"
                title="Reinstate application to active status"
              >
                <RotateCw className="h-3.5 w-3.5" />
                Reinstate App
              </Button>
            )}

            <Button
              variant="outline"
              size="icon"
              aria-label="Close sheet"
              onClick={() => selectApp(null)}
              className="h-8 w-8 rounded-lg bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Section: Pending Permission Requests (SPEC Section 6) */}
        <div className="space-y-2.5 bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-cyan-400" />
              Pending Permission Requests ({app.requests.length})
            </h3>
          </div>

          {app.requests.length === 0 ? (
            <p className="text-xs text-slate-400 py-1">
              No pending permission requests from this application.
            </p>
          ) : (
            <div className="space-y-2 pt-1">
              {app.requests.map((reqId) => {
                const perm = permissions[reqId];
                const isJustified = app.justified.includes(reqId);

                return (
                  <div
                    key={reqId}
                    className="p-3 bg-slate-950 border border-amber-900/60 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">
                          {perm?.label || reqId}
                        </span>
                        <Badge
                          variant="outline"
                          className="bg-rose-950/80 border-rose-800/80 text-rose-300 text-[9px] uppercase px-1.5 py-0"
                        >
                          {perm?.sensitivity || "medium"}
                        </Badge>
                        {!isJustified && (
                          <span className="text-[10px] text-amber-400 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Unjustified request (-6 pts)
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {reqId === "contacts"
                          ? "Application requested access: Reading contact list"
                          : `Application requested access to ${perm?.label || reqId}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="xs"
                        onClick={() => approveRequest(app.id, reqId)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-2.5"
                      >
                        Approve
                      </Button>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => denyRequest(app.id, reqId)}
                        className="bg-rose-950/60 border-rose-800/80 text-rose-300 hover:bg-rose-900 text-xs px-2.5"
                      >
                        Deny
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section: Permission Table with Allow / Restrict / Revoke controls */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <Layers className="h-4 w-4 text-cyan-400" />
              Access Control &amp; Permission Grants ({allManagedPermIds.length})
            </h3>
            <span className="text-[10px] text-slate-400">
              Live Enforcement
            </span>
          </div>

          <div className="border border-slate-800 bg-slate-900/60 rounded-xl overflow-hidden divide-y divide-slate-800/70">
            {allManagedPermIds.map((permId) => {
              const perm = permissions[permId];
              const grant: GrantStatus = app.grants[permId] || "revoked";
              const isJustified = app.justified.includes(permId);
              const baseline = app.baseline[permId];

              return (
                <div
                  key={permId}
                  className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/30 transition-colors"
                >
                  {/* Left: Info */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">
                        {perm?.label || permId}
                      </span>
                      <Badge
                        variant="outline"
                        className="bg-slate-800 text-slate-300 text-[9px] uppercase px-1.5 py-0"
                      >
                        {perm?.sensitivity || "medium"}
                      </Badge>
                      {isJustified ? (
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-900 px-1.5 py-0 rounded">
                          Justified
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-400 bg-amber-950/60 border border-amber-900 px-1.5 py-0 rounded">
                          Unjustified
                        </span>
                      )}
                    </div>
                    {baseline && (
                      <p className="text-[10px] text-slate-400">
                        Baseline: {baseline.rate.toFixed(2)}/tick —{" "}
                        {baseline.reason}
                      </p>
                    )}
                  </div>

                  {/* Right: Allow / Restrict / Revoke Button Group */}
                  <div className="flex items-center gap-1 self-start sm:self-auto shrink-0 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setPermissionGrant(app.id, permId, "allowed")}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                        grant === "allowed"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-emerald-300 hover:bg-slate-900"
                      }`}
                    >
                      Allow
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setPermissionGrant(app.id, permId, "restricted")
                      }
                      className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                        grant === "restricted"
                          ? "bg-amber-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-amber-300 hover:bg-slate-900"
                      }`}
                      title="Rate-limits to at most 1 successful access per 10 ticks"
                    >
                      Restrict
                    </button>

                    <button
                      type="button"
                      onClick={() => setPermissionGrant(app.id, permId, "revoked")}
                      className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                        grant === "revoked"
                          ? "bg-rose-700 text-white shadow-sm"
                          : "text-slate-400 hover:text-rose-300 hover:bg-slate-900"
                      }`}
                      title="Always blocks access attempts"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trust Score Banner */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
              Current Trust Score
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span
                className="text-3xl font-extrabold tracking-tight"
                style={{ color: chartColor }}
              >
                {trust.score}
              </span>
              <span className="text-xs text-slate-500">/ 100</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {trust.deductions.length} active deduction factor(s)
            </span>
          </div>

          <div className="text-right">
            <Badge
              variant="outline"
              className="text-xs uppercase tracking-wider px-3 py-1 font-bold inline-flex items-center gap-1.5"
              style={{
                borderColor: chartColor,
                color: chartColor,
                backgroundColor: `${chartColor}15`,
              }}
            >
              {trust.level === "trusted" && <ShieldCheck className="h-3.5 w-3.5" />}
              {trust.level === "caution" && <ShieldAlert className="h-3.5 w-3.5" />}
              {trust.level === "high_risk" && <ShieldAlert className="h-3.5 w-3.5" />}
              {trust.level === "suspended" && <Shield className="h-3.5 w-3.5" />}
              {trust.level.replace("_", " ")}
            </Badge>
          </div>
        </div>

        {/* Section: Trust Over Time Chart */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Trust Score History (Rolling Ticks)
              </h3>
            </div>
            <span className="text-[10px] text-slate-500">
              {appSnapshots.length} data points
            </span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 pt-4 h-56 w-full min-w-0 min-h-[224px]">
            {appSnapshots.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={appSnapshots}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis
                    dataKey="time"
                    stroke="#64748b"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    stroke="#64748b"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      color: "#f8fafc",
                      fontSize: 12,
                      borderRadius: 8,
                      fontFamily: "monospace",
                    }}
                    formatter={(val) => [`${val}/100`, "Trust Score"]}
                    labelFormatter={(label) => `Time: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke={chartColor}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Awaiting history snapshots...
              </div>
            )}
          </div>
        </div>

        {/* Section: Deductions Breakdown (SPEC Section 7) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <TrendingDown className="h-4 w-4 text-rose-400" />
              Explainable Deductions ({trust.deductions.length})
            </h3>
            <span className="text-[10px] text-slate-500">
              Rule-based Heuristics
            </span>
          </div>

          {trust.deductions.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 text-center text-xs text-emerald-400 flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>
                Zero deductions active. App behavior perfectly within expected
                baseline boundaries.
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              {trust.deductions.map((deduction, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-white text-xs">
                      {deduction.label}
                    </span>
                    <Badge
                      variant="destructive"
                      className="bg-rose-950 border border-rose-800 text-rose-300 text-[10px] font-bold px-2 py-0.5"
                    >
                      -{deduction.points} pts
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {deduction.detail}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section: Actionable Recommendations (SPEC Section 9) */}
        <div className="space-y-2.5 pb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-cyan-400" />
              Recommended Actions ({recommendations.length})
            </h3>
            <span className="text-[10px] text-slate-500">
              Rule-derived Actions
            </span>
          </div>

          {recommendations.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>No policy recommendations needed at this time.</span>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recommendations.map((rec) => {
                let badgeClass = "bg-cyan-950/80 border-cyan-800 text-cyan-300";
                if (rec.severity === "warning") {
                  badgeClass = "bg-amber-950/80 border-amber-800 text-amber-300";
                } else if (rec.severity === "critical") {
                  badgeClass = "bg-rose-950/80 border-rose-800 text-rose-300";
                }

                return (
                  <div
                    key={rec.id}
                    data-slot="recommendation-card"
                    className="bg-slate-900/90 border border-slate-800 rounded-lg p-3.5 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-[9px] uppercase font-bold px-1.5 py-0 ${badgeClass}`}
                        >
                          {rec.severity}
                        </Badge>
                        <span className="font-bold text-white text-xs">
                          {rec.actionLabel}
                        </span>
                      </div>
                      <Button
                        size="xs"
                        data-slot="apply-recommendation"
                        onClick={() => handleApplyRecommendation(rec)}
                        className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs px-3 py-1 gap-1 shrink-0 font-mono shadow-sm"
                      >
                        Apply
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                      {rec.reason}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
