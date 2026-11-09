import { PERMISSION_CATALOG } from "./seed";
import {
  AccessEvent,
  App,
  Deduction,
  Permission,
  TrustLevel,
  TrustScoreBreakdown,
} from "./types";

export const SHORT_WINDOW = 10;
export const LONG_WINDOW = 60;

/**
 * Computes the trust score and explainable deductions for an app
 * following SPEC Section 7 exactly.
 *
 * @param app The app to evaluate
 * @param events Recent access events history
 * @param tick Current simulation tick
 * @param permissions Optional permission catalog (defaults to PERMISSION_CATALOG)
 */
export function computeTrust(
  app: App,
  events: AccessEvent[],
  tick: number,
  permissions: Record<string, Permission> = PERMISSION_CATALOG
): TrustScoreBreakdown {
  if (app.status === "suspended") {
    return {
      score: 0,
      level: "suspended",
      deductions: [
        {
          label: "App Suspended",
          points: 100,
          detail: `${app.name} is suspended from accessing system resources.`,
        },
      ],
    };
  }

  const deductions: Deduction[] = [];

  // 1. Unused permission: granted (allowed or restricted) but no access in LONG_WINDOW.
  // -3 each, cap -9. (Evaluated once tick >= 10 to give initial access attempts time to register)
  if (tick >= SHORT_WINDOW) {
    const grantedPerms = Object.entries(app.grants)
      .filter(([_, status]) => status === "allowed" || status === "restricted")
      .map(([id]) => id);

    const unusedPerms = grantedPerms.filter((permId) => {
      const hasRecentAccess = events.some(
        (e) =>
          e.appId === app.id &&
          e.permissionId === permId &&
          e.tick > tick - LONG_WINDOW
      );
      return !hasRecentAccess;
    });

    if (unusedPerms.length > 0) {
      const penalty = Math.min(unusedPerms.length * 3, 9);
      const labels = unusedPerms
        .map((id) => permissions[id]?.label || id)
        .join(", ");
      deductions.push({
        label: "Unused Granted Permissions",
        points: penalty,
        detail: `Granted permission(s) (${labels}) have had zero access in the last ${Math.min(
          tick,
          LONG_WINDOW
        )} ticks.`,
      });
    }
  }

  // 2. Unjustified sensitive permission: granted, sensitivity high or critical, not in app.justified.
  // -10 each, cap -30.
  const unjustifiedSensitive = Object.entries(app.grants).filter(
    ([permId, status]) => {
      if (status !== "allowed" && status !== "restricted") return false;
      if (app.justified.includes(permId)) return false;
      const sensitivity = permissions[permId]?.sensitivity;
      return sensitivity === "high" || sensitivity === "critical";
    }
  );

  if (unjustifiedSensitive.length > 0) {
    const penalty = Math.min(unjustifiedSensitive.length * 10, 30);
    const labels = unjustifiedSensitive
      .map(
        ([id]) =>
          `${permissions[id]?.label || id} [${permissions[id]?.sensitivity}]`
      )
      .join(", ");
    deductions.push({
      label: "Unjustified Sensitive Permissions",
      points: penalty,
      detail: `Holds sensitive permissions not justified by its stated purpose: ${labels}.`,
    });
  }

  // 3. Frequency anomaly: ratio = successful accesses per tick over SHORT_WINDOW / sum of app baseline.
  // Ratio >= 3 gives -15, ratio >= 5 gives -25.
  const windowTicks = Math.max(1, Math.min(tick, SHORT_WINDOW));
  const recentAllowedCount = events.filter(
    (e) =>
      e.appId === app.id &&
      e.outcome === "allowed" &&
      e.tick > tick - SHORT_WINDOW
  ).length;

  const actualRate = recentAllowedCount / windowTicks;
  const sumBaseline = Object.values(app.baseline).reduce(
    (sum, b) => sum + b.rate,
    0
  );

  const ratio = sumBaseline > 0 ? actualRate / sumBaseline : 0;

  if (ratio >= 5) {
    deductions.push({
      label: "Critical Frequency Anomaly",
      points: 25,
      detail: `Access rate is ${ratio.toFixed(
        1
      )}x above ${app.name}'s normal baseline (${actualRate.toFixed(
        2
      )} vs expected ${sumBaseline.toFixed(2)}/tick).`,
    });
  } else if (ratio >= 3) {
    deductions.push({
      label: "Elevated Frequency Anomaly",
      points: 15,
      detail: `Access rate is ${ratio.toFixed(
        1
      )}x above ${app.name}'s normal baseline (${actualRate.toFixed(
        2
      )} vs expected ${sumBaseline.toFixed(2)}/tick).`,
    });
  }

  // 4. Unauthorized attempts: not_granted attempts in LONG_WINDOW.
  // -4 each, cap -20.
  const unauthorizedCount = events.filter(
    (e) =>
      e.appId === app.id &&
      e.outcome === "blocked" &&
      e.blockReason === "not_granted" &&
      e.tick > tick - LONG_WINDOW
  ).length;

  if (unauthorizedCount > 0) {
    const penalty = Math.min(unauthorizedCount * 4, 20);
    deductions.push({
      label: "Unauthorized Access Attempts",
      points: penalty,
      detail: `${unauthorizedCount} unauthorized attempt(s) to access ungranted permissions blocked in recent history.`,
    });
  }

  // 5. Pending unjustified permission requests: -6 each, cap -18.
  const unjustifiedRequests = app.requests.filter(
    (permId) => !app.justified.includes(permId)
  );

  if (unjustifiedRequests.length > 0) {
    const penalty = Math.min(unjustifiedRequests.length * 6, 18);
    const labels = unjustifiedRequests
      .map((id) => permissions[id]?.label || id)
      .join(", ");
    deductions.push({
      label: "Pending Unjustified Requests",
      points: penalty,
      detail: `Pending request(s) for unjustified permissions: ${labels}.`,
    });
  }

  // Final score clamping
  const totalDeductions = deductions.reduce((sum, d) => sum + d.points, 0);
  const score = Math.max(0, Math.min(100, 100 - totalDeductions));

  // Determine Level: >= 80 Trusted (green), 50-79 Caution (amber), < 50 High Risk (red)
  let level: TrustLevel = "trusted";
  if (score < 50) {
    level = "high_risk";
  } else if (score < 80) {
    level = "caution";
  }

  return {
    score,
    level,
    deductions,
  };
}

