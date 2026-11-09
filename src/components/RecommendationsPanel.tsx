"use client";

import { useSimulationStore } from "@/lib/store";
import { getAllRecommendations } from "@/lib/recommendations";
import { Recommendation } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle2, ArrowRight } from "lucide-react";

export function RecommendationsPanel() {
  const {
    apps,
    events,
    tick,
    permissions,
    setPermissionGrant,
    suspendApp,
    denyRequest,
    selectApp,
  } = useSimulationStore();

  const recommendations = getAllRecommendations(apps, events, tick, permissions);

  const handleApply = (rec: Recommendation) => {
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

  return (
    <Card
      data-slot="recommendations-panel"
      className="bg-slate-900/90 border-slate-800/90 shadow-lg shadow-black/20"
    >
      <CardHeader className="pb-3 pt-4 px-5 border-b border-slate-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-white font-mono flex items-center gap-2">
                Recommended Actions
                <Badge
                  variant="outline"
                  className={`text-[10px] font-mono uppercase px-2 py-0.5 tracking-wider font-semibold ${
                    recommendations.length > 0
                      ? "bg-amber-950/80 border-amber-700/80 text-amber-300"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  {recommendations.length} Active
                </Badge>
              </CardTitle>
              <p className="text-[11px] text-slate-400 font-mono">
                Rule-derived policy actions to mitigate risk
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {recommendations.length === 0 ? (
          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800/60 flex items-center gap-2.5 text-xs font-sans text-slate-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>
              No pending recommendations — apps operating within acceptable
              baselines.
            </span>
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
                  data-slot="recommendation-item"
                  className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg space-y-2 transition-all hover:border-slate-700"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        onClick={() => selectApp(rec.appId)}
                        className="text-xs font-bold text-white font-mono hover:text-cyan-300 cursor-pointer"
                        title="Click to view app detail"
                      >
                        {rec.appName}
                      </span>
                      <span className="text-slate-600">•</span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] uppercase font-bold px-1.5 py-0 font-mono ${badgeClass}`}
                      >
                        {rec.severity}
                      </Badge>
                      <span className="font-bold text-cyan-300 text-xs font-mono">
                        {rec.actionLabel}
                      </span>
                    </div>

                    <Button
                      size="xs"
                      data-slot="apply-recommendation"
                      onClick={() => handleApply(rec)}
                      className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs px-2.5 py-1 gap-1 shrink-0 font-mono shadow-sm"
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
      </CardContent>
    </Card>
  );
}

