export type Sensitivity = "low" | "medium" | "high" | "critical";

export interface Permission {
  id: string;
  label: string;
  sensitivity: Sensitivity;
}

export type GrantStatus = "allowed" | "restricted" | "revoked";
export type AppStatus = "active" | "suspended";

export interface BaselineConfig {
  rate: number;
  reason: string;
}

export interface App {
  id: string;
  name: string;
  category: string;
  description: string;
  status: AppStatus;
  justified: string[];
  grants: Record<string, GrantStatus>;
  baseline: Record<string, BaselineConfig>;
  requests: string[];
}

export type AccessOutcome = "allowed" | "blocked";
export type BlockReason = "restricted" | "revoked" | "not_granted";

export interface AccessEvent {
  id: string;
  tick: number;
  time: string;
  appId: string;
  permissionId: string;
  reason: string;
  outcome: AccessOutcome;
  blockReason?: BlockReason;
}

export type AlertSeverity = "info" | "warning" | "critical";
export type AlertType =
  | "frequency_anomaly"
  | "new_request"
  | "unauthorized_attempt"
  | "trust_drop";

export interface Alert {
  id: string;
  tick: number;
  time: string;
  appId: string;
  severity: AlertSeverity;
  type: AlertType;
  message: string;
}

export type AuditKind =
  | "access"
  | "alert"
  | "permission_change"
  | "trust_change"
  | "simulation";
export type AuditActor = "system" | "user";

export interface AuditEntry {
  id: string;
  tick: number;
  time: string;
  appId: string;
  kind: AuditKind;
  actor: AuditActor;
  detail: string;
}

export interface TrustSnapshot {
  tick: number;
  time: string;
  appId: string;
  score: number;
}

export interface Deduction {
  label: string;
  points: number;
  detail: string;
}

export type TrustLevel = "trusted" | "caution" | "high_risk" | "suspended";

export interface TrustScoreBreakdown {
  score: number;
  level: TrustLevel;
  deductions: Deduction[];
}

export type RecommendationAction =
  | "deny"
  | "revoke"
  | "restrict"
  | "suspend";

export interface Recommendation {
  id: string;
  appId: string;
  permissionId?: string;
  severity: AlertSeverity;
  reason: string;
  action: RecommendationAction;
  actionLabel: string;
}

export interface SimulationState {
  tick: number;
  time: string;
  apps: Record<string, App>;
  permissions: Record<string, Permission>;
  events: AccessEvent[];
  alerts: Alert[];
  auditLog: AuditEntry[];
  trustSnapshots: TrustSnapshot[];
  isRunning: boolean;
  /** True when SPEC §10 demo scenario is running */
  demoSuspiciousActive: boolean;
  /** True when any spike is active (dev spike or demo scenario) */
  spikeActive: boolean;
  /** Tick at which demoSuspiciousActive was set, for scheduling staged requests */
  demoStartTick?: number;
  alertCooldowns: Record<string, number>;
}
