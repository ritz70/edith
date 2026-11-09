import { create } from "zustand";
import { INITIAL_APPS, PERMISSION_CATALOG } from "./seed";
import { mulberry32, tick as simulatorTick } from "./simulator";
import { AuditEntry, GrantStatus, SimulationState } from "./types";

const INITIAL_SEED = 1337;

export interface SimulationStore extends SimulationState {
  selectedAppId: string | null;
  start: () => void;
  pause: () => void;
  reset: () => void;
  step: () => void;
  /** Dev-only: 6x spike without staged requests */
  toggleSpike: () => void;
  /** SPEC §10: "Simulate suspicious behaviour" full demo scenario */
  toggleDemoSuspicious: () => void;
  selectApp: (id: string | null) => void;

  // Real Access Control Actions (SPEC Sections 3 & 6)
  setPermissionGrant: (
    appId: string,
    permissionId: string,
    status: GrantStatus
  ) => void;
  suspendApp: (appId: string) => void;
  reinstateApp: (appId: string) => void;
  approveRequest: (appId: string, permissionId: string) => void;
  denyRequest: (appId: string, permissionId: string) => void;
  injectTestRequest: (appId: string, permissionId: string) => void;
}

export function createInitialState(): SimulationState {
  const initialApps = JSON.parse(JSON.stringify(INITIAL_APPS));
  const initialSnapshots = Object.keys(initialApps).map((appId) => ({
    tick: 0,
    time: "09:00",
    appId,
    score: 100,
  }));

  return {
    tick: 0,
    time: "09:00",
    apps: initialApps,
    permissions: { ...PERMISSION_CATALOG },
    events: [],
    alerts: [],
    auditLog: [
      {
        id: "aud-0-init",
        tick: 0,
        time: "09:00",
        appId: "system",
        kind: "simulation",
        actor: "system",
        detail: "Simulation engine and trust heuristics initialized",
      },
    ],
    trustSnapshots: initialSnapshots,
    isRunning: true,
    demoSuspiciousActive: false,
    spikeActive: false,
    demoStartTick: undefined,
    demoInjectedRequests: [],
    alertCooldowns: {},
  };
}

let rng = mulberry32(INITIAL_SEED);

export const useSimulationStore = create<SimulationStore>()((set) => ({
  ...createInitialState(),
  selectedAppId: null,

  start: () => set({ isRunning: true }),

  pause: () => set({ isRunning: false }),

  reset: () => {
    rng = mulberry32(INITIAL_SEED);
    set({
      ...createInitialState(),
      isRunning: true,
      selectedAppId: null,
    });
  },

  step: () => {
    set((state) => {
      const nextSimState = simulatorTick(state, rng);
      return {
        ...nextSimState,
      };
    });
  },

  /** Dev-only: simple 6x spike with no staged requests */
  toggleSpike: () => {
    set((state) => ({ spikeActive: !state.spikeActive }));
  },

  /** SPEC §10: Full "Simulate suspicious behaviour" demo scenario */
  toggleDemoSuspicious: () => {
    set((state) => {
      const next = !state.demoSuspiciousActive;
      const auditEntry: AuditEntry = {
        id: `aud-${state.tick}-demo-${Date.now()}`,
        tick: state.tick,
        time: state.time,
        appId: "fitpulse",
        kind: "simulation",
        actor: "user",
        detail: next
          ? "Demo scenario activated: FitPulse suspicious behaviour simulation started"
          : "Demo scenario deactivated",
      };
      const startTick = next ? state.tick : undefined;
      return {
        demoSuspiciousActive: next,
        spikeActive: next,
        demoStartTick: startTick,
        demoInjectedRequests: next ? [] : state.demoInjectedRequests,
        auditLog: [auditEntry, ...state.auditLog].slice(0, 1000),
      };
    });
  },

  selectApp: (id: string | null) => {
    set({ selectedAppId: id });
  },

  setPermissionGrant: (appId, permissionId, status) => {
    set((state) => {
      const app = state.apps[appId];
      if (!app) return state;
      const perm = state.permissions[permissionId];
      const permLabel = perm?.label || permissionId;

      const updatedGrants = { ...app.grants, [permissionId]: status };
      const auditEntry: AuditEntry = {
        id: `aud-${state.tick}-user-grant-${Date.now()}`,
        tick: state.tick,
        time: state.time,
        appId,
        kind: "permission_change",
        actor: "user",
        detail: `User updated ${app.name} grant for ${permLabel} to ${status.toUpperCase()}`,
      };

      return {
        apps: {
          ...state.apps,
          [appId]: {
            ...app,
            grants: updatedGrants,
          },
        },
        auditLog: [auditEntry, ...state.auditLog].slice(0, 1000),
      };
    });
  },

  suspendApp: (appId) => {
    set((state) => {
      const app = state.apps[appId];
      if (!app) return state;

      const auditEntry: AuditEntry = {
        id: `aud-${state.tick}-user-suspend-${Date.now()}`,
        tick: state.tick,
        time: state.time,
        appId,
        kind: "permission_change",
        actor: "user",
        detail: `User suspended ${app.name} (all access frozen)`,
      };

      return {
        apps: {
          ...state.apps,
          [appId]: {
            ...app,
            status: "suspended",
          },
        },
        auditLog: [auditEntry, ...state.auditLog].slice(0, 1000),
      };
    });
  },

  reinstateApp: (appId) => {
    set((state) => {
      const app = state.apps[appId];
      if (!app) return state;

      const auditEntry: AuditEntry = {
        id: `aud-${state.tick}-user-reinstate-${Date.now()}`,
        tick: state.tick,
        time: state.time,
        appId,
        kind: "permission_change",
        actor: "user",
        detail: `User reinstated ${app.name} to active status`,
      };

      return {
        apps: {
          ...state.apps,
          [appId]: {
            ...app,
            status: "active",
          },
        },
        auditLog: [auditEntry, ...state.auditLog].slice(0, 1000),
      };
    });
  },

  approveRequest: (appId, permissionId) => {
    set((state) => {
      const app = state.apps[appId];
      if (!app) return state;
      const perm = state.permissions[permissionId];
      const permLabel = perm?.label || permissionId;

      const updatedRequests = app.requests.filter((r) => r !== permissionId);
      const updatedGrants = {
        ...app.grants,
        [permissionId]: "allowed" as const,
      };

      const updatedBaseline = { ...app.baseline };
      if (!updatedBaseline[permissionId]) {
        updatedBaseline[permissionId] = {
          rate: 0.35,
          reason:
            permissionId === "contacts"
              ? "Reading contact list"
              : `Accessing ${permLabel}`,
        };
      }

      const auditEntry: AuditEntry = {
        id: `aud-${state.tick}-user-approve-${Date.now()}`,
        tick: state.tick,
        time: state.time,
        appId,
        kind: "permission_change",
        actor: "user",
        detail: `User approved permission request for ${permLabel} on ${app.name}`,
      };

      return {
        apps: {
          ...state.apps,
          [appId]: {
            ...app,
            grants: updatedGrants,
            requests: updatedRequests,
            baseline: updatedBaseline,
          },
        },
        auditLog: [auditEntry, ...state.auditLog].slice(0, 1000),
      };
    });
  },

  denyRequest: (appId, permissionId) => {
    set((state) => {
      const app = state.apps[appId];
      if (!app) return state;
      const perm = state.permissions[permissionId];
      const permLabel = perm?.label || permissionId;

      const updatedRequests = app.requests.filter((r) => r !== permissionId);

      const auditEntry: AuditEntry = {
        id: `aud-${state.tick}-user-deny-${Date.now()}`,
        tick: state.tick,
        time: state.time,
        appId,
        kind: "permission_change",
        actor: "user",
        detail: `User denied permission request for ${permLabel} on ${app.name}`,
      };

      return {
        apps: {
          ...state.apps,
          [appId]: {
            ...app,
            requests: updatedRequests,
          },
        },
        auditLog: [auditEntry, ...state.auditLog].slice(0, 1000),
      };
    });
  },

  injectTestRequest: (appId, permissionId) => {
    set((state) => {
      const app = state.apps[appId];
      if (!app) return state;
      if (app.requests.includes(permissionId)) return state;

      const perm = state.permissions[permissionId];
      const permLabel = perm?.label || permissionId;

      const auditEntry: AuditEntry = {
        id: `aud-${state.tick}-sys-req-${Date.now()}`,
        tick: state.tick,
        time: state.time,
        appId,
        kind: "permission_change",
        actor: "system",
        detail: `${app.name} submitted a new permission request: ${permLabel}`,
      };

      return {
        apps: {
          ...state.apps,
          [appId]: {
            ...app,
            requests: [...app.requests, permissionId],
          },
        },
        auditLog: [auditEntry, ...state.auditLog].slice(0, 1000),
      };
    });
  },
}));
