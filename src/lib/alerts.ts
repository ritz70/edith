import {
  AccessEvent,
  Alert,
  AlertSeverity,
  AlertType,
  App,
  AuditEntry,
  TrustScoreBreakdown,
} from "./types";

export const ALERT_COOLDOWN_TICKS = 15;

export interface AlertEvaluationResult {
  alerts: Alert[];
  auditEntries: AuditEntry[];
  updatedCooldowns: Record<string, number>;
}

/**
 * Evaluates conditions and generates alerts per SPEC Section 8 with a 15-tick cooldown.
 * Also generates corresponding audit log entries.
 */
export function evaluateAppAlerts(
  app: App,
  trust: TrustScoreBreakdown,
  eventsThisTick: AccessEvent[],
  currentTick: number,
  time: string,
  cooldowns: Record<string, number>
): AlertEvaluationResult {
  const alerts: Alert[] = [];
  const auditEntries: AuditEntry[] = [];
  const updatedCooldowns = { ...cooldowns };

  const canAlert = (type: AlertType): boolean => {
    const key = `${app.id}:${type}`;
    const lastTick = updatedCooldowns[key];
    if (lastTick === undefined) return true;
    return currentTick - lastTick >= ALERT_COOLDOWN_TICKS;
  };

  const recordAlert = (
    type: AlertType,
    severity: AlertSeverity,
    message: string
  ) => {
    const key = `${app.id}:${type}`;
    updatedCooldowns[key] = currentTick;

    const alertId = `alt-${currentTick}-${app.id}-${type}`;
    const alert: Alert = {
      id: alertId,
      tick: currentTick,
      time,
      appId: app.id,
      severity,
      type,
      message,
    };
    alerts.push(alert);

    const auditEntry: AuditEntry = {
      id: `aud-${currentTick}-alt-${app.id}-${type}`,
      tick: currentTick,
      time,
      appId: app.id,
      kind: "alert",
      actor: "system",
      detail: `[ALERT ${severity.toUpperCase()}] ${message}`,
    };
    auditEntries.push(auditEntry);
  };

  // 1. Frequency anomaly detected
  const freqDeduction = trust.deductions.find((d) =>
    d.label.includes("Frequency Anomaly")
  );
  if (freqDeduction && canAlert("frequency_anomaly")) {
    const severity: AlertSeverity =
      freqDeduction.points >= 25 ? "critical" : "warning";
    recordAlert(
      "frequency_anomaly",
      severity,
      `${app.name}: Data access frequency anomaly detected. ${freqDeduction.detail}`
    );
  }

  // 2. New permission request
  if (app.requests.length > 0 && canAlert("new_request")) {
    const hasUnjustified = app.requests.some(
      (r) => !app.justified.includes(r)
    );
    const severity: AlertSeverity = hasUnjustified ? "warning" : "info";
    recordAlert(
      "new_request",
      severity,
      `${app.name}: Pending permission request for [${app.requests.join(", ")}].`
    );
  }

  // 3. Unauthorized access attempt (not_granted blocked attempt in this tick)
  const unauthorizedThisTick = eventsThisTick.filter(
    (e) =>
      e.appId === app.id &&
      e.outcome === "blocked" &&
      e.blockReason === "not_granted"
  );
  if (unauthorizedThisTick.length > 0 && canAlert("unauthorized_attempt")) {
    const perms = unauthorizedThisTick.map((e) => e.permissionId).join(", ");
    recordAlert(
      "unauthorized_attempt",
      "critical",
      `${app.name}: Blocked unauthorized access attempt to ungranted permission (${perms}).`
    );
  }

  // 4. Trust level dropping into Caution or High Risk
  if (
    (trust.level === "caution" || trust.level === "high_risk") &&
    canAlert("trust_drop")
  ) {
    const severity: AlertSeverity =
      trust.level === "high_risk" ? "critical" : "warning";
    recordAlert(
      "trust_drop",
      severity,
      `${app.name}: Trust level dropped to ${
        trust.level === "high_risk" ? "HIGH RISK" : "CAUTION"
      } (Current Score: ${trust.score}/100).`
    );
  }

  return {
    alerts,
    auditEntries,
    updatedCooldowns,
  };
}

