import {
  AccessEvent,
  App,
  Permission,
  Recommendation,
  TrustScoreBreakdown,
} from "./types";
import { SHORT_WINDOW, LONG_WINDOW, computeTrust } from "./trust";

/**
 * Pure function to derive actionable recommendations from current state
 * following SPEC Section 9.
 */
export function getRecommendations(
  app: App,
  trust: TrustScoreBreakdown,
  events: AccessEvent[],
  currentTick: number,
  permissions: Record<string, Permission>
): Recommendation[] {
  if (app.status === "suspended") {
    return [];
  }

  const recommendations: Recommendation[] = [];

  // 1. Pending unjustified request -> Deny.
  for (const reqId of app.requests) {
    if (!app.justified.includes(reqId)) {
      const permLabel = permissions[reqId]?.label || reqId;
      recommendations.push({
        id: `rec-${app.id}-deny-${reqId}`,
        appId: app.id,
        permissionId: reqId,
        severity: "warning",
        reason: `Pending request for "${permLabel}" is not justified by ${app.name}'s stated purpose.`,
        action: "deny",
        actionLabel: `Deny ${permLabel}`,
      });
    }
  }

  // 2. Granted unjustified sensitive permission -> Revoke.
  for (const [permId, status] of Object.entries(app.grants)) {
    if (status !== "revoked" && !app.justified.includes(permId)) {
      const perm = permissions[permId];
      if (perm?.sensitivity === "high" || perm?.sensitivity === "critical") {
        recommendations.push({
          id: `rec-${app.id}-revoke-${permId}`,
          appId: app.id,
          permissionId: permId,
          severity: "critical",
          reason: `App holds sensitive permission "${perm.label}" [${perm.sensitivity}] outside its justified scope.`,
          action: "revoke",
          actionLabel: `Revoke ${perm.label}`,
        });
      }
    }
  }

  // 3. Unused permission -> Restrict.
  if (currentTick >= SHORT_WINDOW) {
    for (const [permId, status] of Object.entries(app.grants)) {
      if (status === "allowed") {
        const hasRecentAccess = events.some(
          (e) =>
            e.appId === app.id &&
            e.permissionId === permId &&
            e.tick > currentTick - LONG_WINDOW
        );

        if (!hasRecentAccess) {
          const permLabel = permissions[permId]?.label || permId;
          recommendations.push({
            id: `rec-${app.id}-restrict-unused-${permId}`,
            appId: app.id,
            permissionId: permId,
            severity: "info",
            reason: `Permission "${permLabel}" has had zero activity over the last ${Math.min(
              currentTick,
              LONG_WINDOW
            )} ticks. Restricting prevents dormant background access.`,
            action: "restrict",
            actionLabel: `Restrict ${permLabel}`,
          });
        }
      }
    }
  }

  // 4. Frequency anomaly -> Restrict the most-accessed permission.
  const hasFreqAnomaly = trust.deductions.some((d) =>
    d.label.includes("Frequency Anomaly")
  );

  if (hasFreqAnomaly) {
    // Find most-accessed permission in short window
    const recentEvents = events.filter(
      (e) =>
        e.appId === app.id &&
        e.outcome === "allowed" &&
        e.tick > currentTick - SHORT_WINDOW
    );

    const counts: Record<string, number> = {};
    for (const e of recentEvents) {
      counts[e.permissionId] = (counts[e.permissionId] || 0) + 1;
    }

    let mostAccessedPermId: string | null = null;
    let maxCount = 0;
    for (const [pId, cnt] of Object.entries(counts)) {
      if (cnt > maxCount && app.grants[pId] === "allowed") {
        maxCount = cnt;
        mostAccessedPermId = pId;
      }
    }

    if (mostAccessedPermId) {
      const permLabel =
        permissions[mostAccessedPermId]?.label || mostAccessedPermId;
      recommendations.push({
        id: `rec-${app.id}-restrict-freq-${mostAccessedPermId}`,
        appId: app.id,
        permissionId: mostAccessedPermId,
        severity: "warning",
        reason: `Unusually high volume detected on "${permLabel}" (${maxCount} accesses in last 10 ticks). Restricting limits throughput to at most 1 access per 10 ticks.`,
        action: "restrict",
        actionLabel: `Restrict ${permLabel}`,
      });
    }
  }

  // 5. Score < 40 -> Suspend app.
  if (trust.score < 40) {
    recommendations.push({
      id: `rec-${app.id}-suspend`,
      appId: app.id,
      severity: "critical",
      reason: `Trust score dropped to ${trust.score}/100 (High Risk). App should be suspended immediately to freeze all data access.`,
      action: "suspend",
      actionLabel: `Suspend ${app.name}`,
    });
  }

  return recommendations;
}

/**
 * Derives active recommendations across all monitored apps.
 */
export function getAllRecommendations(
  apps: Record<string, App>,
  events: AccessEvent[],
  currentTick: number,
  permissions: Record<string, Permission>
): (Recommendation & { appName: string })[] {
  const all: (Recommendation & { appName: string })[] = [];
  for (const app of Object.values(apps)) {
    if (app.status === "suspended") continue;
    const trust = computeTrust(app, events, currentTick, permissions);
    const recs = getRecommendations(
      app,
      trust,
      events,
      currentTick,
      permissions
    );
    for (const rec of recs) {
      all.push({ ...rec, appName: app.name });
    }
  }
  return all;
}
