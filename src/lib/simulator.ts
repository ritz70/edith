import { evaluateAppAlerts } from "./alerts";
import { computeTrust } from "./trust";
import {
  AccessEvent,
  Alert,
  AuditEntry,
  BlockReason,
  SimulationState,
  TrustSnapshot,
} from "./types";

/**
 * Seeded PRNG using mulberry32 algorithm.
 * Produces deterministic numbers in [0, 1).
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Formats simulated time starting at 09:00.
 * One tick = 1 simulated minute.
 */
export function formatSimulatedTime(
  tick: number,
  startHour = 9,
  startMinute = 0
): string {
  const totalMinutes = startHour * 60 + startMinute + tick;
  const hours = Math.floor((totalMinutes / 60) % 24);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

/**
 * Pure function that advances the simulation state by one tick.
 * Generates access attempts, applies access control rules, computes trust scores,
 * records trust snapshots, checks alerts with 15-tick cooldown, and logs to audit.
 *
 * SPEC §10 demo scenario logic:
 *   - Immediately: FitPulse access rate 6x (via spikeActive)
 *   - Tick+3: inject contacts request
 *   - Tick+6: inject microphone request
 *   - Tick+9: inject sms request
 *   - From Tick+3 onward, every other tick: unauthorized contacts attempt (not_granted)
 */
export function tick(
  state: SimulationState,
  rng: () => number = mulberry32(1337)
): SimulationState {
  const nextTick = state.tick + 1;
  const nextTime = formatSimulatedTime(nextTick);

  const newEvents: AccessEvent[] = [];
  const newAuditEntries: AuditEntry[] = [];
  let currentCooldowns = { ...state.alertCooldowns };

  // --- SPEC §10: Handle demo scenario staged requests ---
  // Deep clone apps so we can mutate for staged request injection this tick
  let appsThisTick = state.apps;
  let demoInjected = state.demoInjectedRequests ? [...state.demoInjectedRequests] : [];

  if (state.demoSuspiciousActive && state.demoStartTick !== undefined) {
    const elapsed = nextTick - state.demoStartTick;
    const fitpulse = { ...state.apps["fitpulse"] };
    let updated = false;

    // Tick+3: inject contacts request once if not already granted
    if (elapsed >= 3 && !demoInjected.includes("contacts")) {
      demoInjected.push("contacts");
      if (
        !fitpulse.requests.includes("contacts") &&
        fitpulse.grants["contacts"] !== "allowed"
      ) {
        fitpulse.requests = [...fitpulse.requests, "contacts"];
        newAuditEntries.push({
          id: `aud-${nextTick}-demo-contacts-req`,
          tick: nextTick,
          time: nextTime,
          appId: "fitpulse",
          kind: "permission_change",
          actor: "system",
          detail: "FitPulse [demo] submitted permission request: Contacts",
        });
        updated = true;
      }
    }

    // Tick+6: inject microphone request once if not already granted
    if (elapsed >= 6 && !demoInjected.includes("microphone")) {
      demoInjected.push("microphone");
      if (
        !fitpulse.requests.includes("microphone") &&
        fitpulse.grants["microphone"] !== "allowed"
      ) {
        fitpulse.requests = [...fitpulse.requests, "microphone"];
        newAuditEntries.push({
          id: `aud-${nextTick}-demo-mic-req`,
          tick: nextTick,
          time: nextTime,
          appId: "fitpulse",
          kind: "permission_change",
          actor: "system",
          detail: "FitPulse [demo] submitted permission request: Microphone",
        });
        updated = true;
      }
    }

    // Tick+9: inject sms request once if not already granted
    if (elapsed >= 9 && !demoInjected.includes("sms")) {
      demoInjected.push("sms");
      if (
        !fitpulse.requests.includes("sms") &&
        fitpulse.grants["sms"] !== "allowed"
      ) {
        fitpulse.requests = [...fitpulse.requests, "sms"];
        newAuditEntries.push({
          id: `aud-${nextTick}-demo-sms-req`,
          tick: nextTick,
          time: nextTime,
          appId: "fitpulse",
          kind: "permission_change",
          actor: "system",
          detail: "FitPulse [demo] submitted permission request: SMS",
        });
        updated = true;
      }
    }

    if (updated) {
      appsThisTick = { ...state.apps, fitpulse };
    }
  }

  // 1. Generate access events from each app
  for (const app of Object.values(appsThisTick)) {
    // Suspended app generates no events (SPEC Section 6)
    if (app.status === "suspended") {
      continue;
    }

    for (const [permId, config] of Object.entries(app.baseline)) {
      // Dev spike / demo scenario: 6x baseline multiplier on FitPulse when spikeActive or demoSuspiciousActive
      const isSpiked =
        (state.spikeActive || state.demoSuspiciousActive) &&
        app.id === "fitpulse";
      const effectiveRate = isSpiked ? config.rate * 6 : config.rate;
      const attempts =
        Math.floor(effectiveRate) +
        (rng() < effectiveRate % 1 ? 1 : 0);

      for (let attemptIdx = 0; attemptIdx < attempts; attemptIdx++) {
        const grant = app.grants[permId];
        let outcome: "allowed" | "blocked" = "allowed";
        let blockReason: BlockReason | undefined = undefined;

        if (grant === "allowed") {
          outcome = "allowed";
          blockReason = undefined;
        } else if (grant === "restricted") {
          // At most 1 success per 10 ticks per permission (SPEC Section 6)
          const hasRecentSuccess =
            newEvents.some(
              (e) =>
                e.appId === app.id &&
                e.permissionId === permId &&
                e.outcome === "allowed" &&
                e.tick >= nextTick - 9
            ) ||
            state.events.some(
              (e) =>
                e.appId === app.id &&
                e.permissionId === permId &&
                e.outcome === "allowed" &&
                e.tick >= nextTick - 9
            );

          if (hasRecentSuccess) {
            outcome = "blocked";
            blockReason = "restricted";
          } else {
            outcome = "allowed";
            blockReason = undefined;
          }
        } else if (grant === "revoked") {
          outcome = "blocked";
          blockReason = "revoked";
        } else {
          // Ungranted attempt
          outcome = "blocked";
          blockReason = "not_granted";
        }

        const permLabel = state.permissions[permId]?.label || permId;
        const subId = attemptIdx > 0 ? `-${attemptIdx}` : "";

        const event: AccessEvent = {
          id: `evt-${nextTick}-${app.id}-${permId}${subId}`,
          tick: nextTick,
          time: nextTime,
          appId: app.id,
          permissionId: permId,
          reason: config.reason,
          outcome,
          blockReason,
        };

        const auditEntry: AuditEntry = {
          id: `aud-${nextTick}-${app.id}-${permId}${subId}`,
          tick: nextTick,
          time: nextTime,
          appId: app.id,
          kind: "access",
          actor: "system",
          detail:
            outcome === "allowed"
              ? `${app.name} accessed ${permLabel} (${config.reason})`
              : `${app.name} access to ${permLabel} blocked [${blockReason}] (${config.reason})`,
        };

        newEvents.push(event);
        newAuditEntries.push(auditEntry);
      }
    }

    // --- SPEC §10: Unauthorized contacts attempt every other tick from demo tick+3 ---
    if (
      state.demoSuspiciousActive &&
      state.demoStartTick !== undefined &&
      app.id === "fitpulse"
    ) {
      const elapsed = nextTick - state.demoStartTick;
      const hasContactsGrant =
        app.grants["contacts"] === "allowed" ||
        app.grants["contacts"] === "restricted";

      // Every other tick from elapsed >= 3, attempt contacts if NOT already granted
      if (elapsed >= 3 && elapsed % 2 === 1 && !hasContactsGrant) {
        const event: AccessEvent = {
          id: `evt-${nextTick}-fitpulse-contacts-unauth`,
          tick: nextTick,
          time: nextTime,
          appId: "fitpulse",
          permissionId: "contacts",
          reason: "Reading contact list",
          outcome: "blocked",
          blockReason: "not_granted",
        };
        const auditEntry: AuditEntry = {
          id: `aud-${nextTick}-fitpulse-contacts-unauth`,
          tick: nextTick,
          time: nextTime,
          appId: "fitpulse",
          kind: "access",
          actor: "system",
          detail: "FitPulse access to Contacts blocked [not_granted] (Reading contact list)",
        };
        newEvents.push(event);
        newAuditEntries.push(auditEntry);
      }
    }
  }

  // Combined events with newest first
  const allEvents = [...newEvents, ...state.events].slice(0, 1000);

  // 2. Compute Trust Scores, Record Snapshots, and Evaluate Alerts
  // Use appsThisTick so trust engine sees updated requests
  const newSnapshots: TrustSnapshot[] = [];
  const newAlerts: Alert[] = [];

  for (const app of Object.values(appsThisTick)) {
    const trust = computeTrust(app, allEvents, nextTick, state.permissions);

    // Record snapshot (SPEC Section 3)
    newSnapshots.push({
      tick: nextTick,
      time: nextTime,
      appId: app.id,
      score: trust.score,
    });

    // Evaluate alerts (SPEC Section 8)
    const alertResult = evaluateAppAlerts(
      app,
      trust,
      newEvents,
      nextTick,
      nextTime,
      currentCooldowns
    );

    newAlerts.push(...alertResult.alerts);
    newAuditEntries.push(...alertResult.auditEntries);
    currentCooldowns = alertResult.updatedCooldowns;
  }

  // Keep last 120 snapshots per app
  const combinedSnapshots = [...state.trustSnapshots, ...newSnapshots];
  const trimmedSnapshots = Object.keys(state.apps).flatMap((appId) =>
    combinedSnapshots.filter((s) => s.appId === appId).slice(-120)
  );

  return {
    ...state,
    // Persist updated apps (with staged requests injected)
    apps: appsThisTick,
    tick: nextTick,
    time: nextTime,
    events: allEvents,
    alerts: [...newAlerts, ...state.alerts].slice(0, 100),
    auditLog: [...newAuditEntries, ...state.auditLog].slice(0, 1000),
    trustSnapshots: trimmedSnapshots,
    alertCooldowns: currentCooldowns,
    demoInjectedRequests: demoInjected,
  };
}
