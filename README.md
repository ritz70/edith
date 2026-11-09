<p align="center">
  <img src="public/logo.svg" alt="E.D.I.T.H. Logo" width="84" height="84" />
</p>

# E.D.I.T.H. — Enhanced Digital Identity, Trust & Heuristics
**Hackathon Prototype for NITSHACKS 9.0 (Software Track)**

> *"Trust isn't granted once. It's earned continuously."*

E.D.I.T.H. is a real-time, client-side permission-management dashboard that continuously monitors how third-party applications use sensitive user data, detects behavioral anomalies, calculates an explainable trust score, surfaces rule-derived security recommendations, and enforces fine-grained access control with an immutable audit log.

---

## 1. The Problem E.D.I.T.H. Solves

Modern operating systems and mobile platforms suffer from the **Install-Time Trust Fallacy**:
- **One-and-Done Permissions**: Users grant sensitive permissions (location, camera, contacts, microphone) once during installation or first launch. Once granted, applications retain permanent, unrestricted background access.
- **Permission Creep & Stealth Harvesting**: Legitimate applications frequently push updates or activate background routines that quietly access sensors and personal data at rates far beyond what their core functionality requires.
- **Dormant Permissions as Attack Surfaces**: Forgotten apps maintain dormant access to sensitive APIs, exposing users to supply-chain attacks and SDK hijackings.
- **Black-Box Security Ratings**: Existing privacy dashboards show raw access counters without context or explainability. Users cannot tell whether 50 location accesses by a workout app is normal or malicious.

**E.D.I.T.H. transforms passive permissions into continuous, heuristic-driven zero-trust monitoring**:
1. Every access attempt is evaluated against justified app baselines.
2. Trust scores are fully transparent, mathematical, and explainable.
3. Behavioral anomalies automatically trigger actionable, one-click mitigations.

---

## 2. Core Capabilities

- **Continuous Simulation Engine**: Deterministic tick engine advancing simulated time (1 tick = 1 minute) driven by a seeded PRNG (`mulberry32`) for fully reproducible demonstrations.
- **Explainable Trust Score**: Every deduction provides a human-readable reason, exact point penalty, and rolling window calculation. Scores recover dynamically when behavior normalizes or mitigations are applied.
- **Fine-Grained Access Enforcement**:
  - `allowed`: Access proceeds normally within baseline.
  - `restricted`: Rate-limited to at most 1 access per 10 ticks.
  - `revoked`: Immediate block on all access attempts.
  - `suspended`: Application completely frozen; generates zero events.
  - *Golden Rule*: Access blocks caused by user policy choices (restricted, revoked, suspended) **never** lower trust; only unauthorized attempts (`not_granted`) do.
- **Actionable Recommendations**: Policy engine generates context-specific mitigations with one-click **Apply** buttons that execute the exact store action and record user actor logs.
- **Full Audit Trail & Search**: Immutable event log tracking every access, policy change, alert, and simulation event at `/history`.

---

## 3. Trust Score Calculation & Heuristics

The E.D.I.T.H. Trust Score is computed deterministically for each application on a scale from **0 to 100**:

$$\text{Trust Score} = \max\left(0, \min\left(100, 100 - \sum \text{Deductions}\right)\right)$$

### Deduction Formula Table

| Factor | Trigger Condition | Points Deducted | Maximum Cap | Evaluation Window | Rationale |
|---|---|:---:|:---:|:---:|---|
| **Unused Permission** | Granted (`allowed` or `restricted`), but zero access attempts observed. | **-3 pts** per permission | **-9 pts** | `LONG_WINDOW` (60 ticks, evaluated after tick $\ge 10$) | Dormant permissions represent unnecessary attack surfaces and violate the principle of least privilege. |
| **Unjustified Sensitive Permission** | Holds grant for High or Critical sensitivity permission not in app's stated `justified` scope. | **-10 pts** per permission | **-30 pts** | Current State | Apps holding permissions outside their functional purpose (e.g., photo editor holding contacts). |
| **Frequency Anomaly (Moderate)** | Recent access rate $\ge 3\times$ above the app's established baseline. | **-15 pts** | **-25 pts** (combined) | `SHORT_WINDOW` (10 ticks) | Abnormal burst in data harvesting indicating potential compromise or aggressive background scraping. |
| **Frequency Anomaly (Severe)** | Recent access rate $\ge 5\times$ above the app's established baseline. | **-25 pts** | **-25 pts** (combined) | `SHORT_WINDOW` (10 ticks) | Critical throughput anomaly far exceeding any normal operational burst. |
| **Unauthorized Access Attempt** | Access attempt blocked due to missing grant (`not_granted`). | **-4 pts** per attempt | **-20 pts** | `LONG_WINDOW` (60 ticks) | Direct attempt to harvest unauthorized data APIs without user consent. |
| **Pending Unjustified Request** | App requests a new permission that is outside its declared functional scope. | **-6 pts** per request | **-18 pts** | Current State | Proactively penalizes permission creep before the user makes a grant decision. |

### Visual Trust Levels

| Trust Level | Score Range | Color Badge | System Meaning |
|---|:---:|:---:|---|
| **Trusted** | **80 – 100** | Emerald Green | Normal operational baseline; all permissions justified. |
| **Caution** | **50 – 79** | Amber Yellow | Moderate risk detected: frequency anomaly, unjustified request, or dormant access. |
| **High Risk** | **0 – 49** | Rose Red | Critical threat: unauthorized access attempts, severe burst, or multiple unjustified grants. |
| **Suspended** | — | Slate Gray | App access frozen by user; no events generated until reinstated. |

*Note: Because scoring uses rolling windows (`SHORT_WINDOW = 10`, `LONG_WINDOW = 60`), scores automatically recover when anomalous behavior ceases or when the user applies corrective recommendations.*

---

## 4. Architecture Overview

E.D.I.T.H. is built with a **100% client-side architecture** with zero external backend dependencies, zero databases, and zero API keys.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Zustand Simulation Store                        │
│  - apps, permissions, events (last 1000), auditLog, trustSnapshots    │
│  - tick, time, isRunning, demoSuspiciousActive, alertCooldowns         │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
              ┌────────────────────┴────────────────────┐
              ▼                                         ▼
   ┌──────────────────────┐                  ┌──────────────────────┐
   │ pure tick() reducer  │                  │  Access Control &    │
   │ - mulberry32 PRNG    │                  │  Policy Dispatcher   │
   │ - Staged demo events │                  │  (User / System)     │
   └──────────┬───────────┘                  └──────────┬───────────┘
              │                                         │
              ▼                                         ▼
   ┌──────────────────────┐                  ┌──────────────────────┐
   │ trust.ts Engine      │                  │ alerts.ts (15-tick   │
   │ - Compute deductions │                  │ cooldown evaluator)  │
   │ - Rolling windows    │                  └──────────┬───────────┘
   └──────────┬───────────┘                             │
              │                                         ▼
              ▼                              ┌──────────────────────┐
   ┌──────────────────────┐                  │ recommendations.ts   │
   │ Reactive UI Layer    │                  │ - Rule-derived recs  │
   │ - AppCards & Rings   │◀─────────────────│ - One-click Apply    │
   │ - Live Access Feed   │                  └──────────────────────┘
   │ - App Detail Sheet   │
   │ - Activity History   │
   └──────────────────────┘
```

### Key Modules
- **`src/lib/simulator.ts`**: Pure function `tick(state, rng)` that advances the simulation clock, generates stochastic access attempts from baseline probabilities, applies policy enforcement, evaluates alerts, and logs audit events.
- **`src/lib/trust.ts`**: Mathematical, explainable trust calculation engine computing itemized deduction objects `{ label, points, detail }`.
- **`src/lib/alerts.ts`**: Evaluates security alerts with a strict 15-tick per `(appId, alertType)` cooldown to eliminate alert fatigue.
- **`src/lib/recommendations.ts`**: Derives deterministic, rule-based recommendations from live state with direct store actions.
- **`src/lib/store.ts`**: Central Zustand store providing state hydration, control dispatches, and reset restoration.

---

## 5. Getting Started

### Prerequisites
- **Node.js**: v18.18+ or v20+ (tested on Node.js 24)
- **npm** / **pnpm** / **yarn**

### Installation & Run

```bash
# 1. Clone repository
git clone https://github.com/your-username/edith.git
cd edith

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open browser
# Dashboard: http://localhost:3000
# Full Audit History: http://localhost:3000/history
```

### Production Build & Verification

```bash
# Verify ESLint code quality (0 errors, 0 warnings)
npm run lint

# Production compilation & static generation
npm run build

# Start production server
npm run start
```

---

## 6. Future Scope

1. **Native OS & Mobile Companion**:
   - Bridge E.D.I.T.H. with Android's Private Compute Core and iOS Screen Time / App Privacy Report APIs to ingest real device sensor logs.
   - Native Flutter/React Native mobile companion delivering real-time biometric push notifications when apps make background queries.
2. **Learned Behavioral Baselines (On-Device ML)**:
   - Replace static baseline configuration with unsupervised on-device anomaly detection (e.g., local Isolation Forests or lightweight clustering).
   - Dynamically adapt to personal usage routines (e.g., higher GPS baseline during morning runs, zero tolerance at night).
3. **Enterprise Zero-Trust & Shadow-IT Audit**:
   - Deploy E.D.I.T.H. as an endpoint agent across corporate fleets to audit desktop SaaS apps, Electron wrappers, and browser extensions accessing clipboard, camera, and local storage.
4. **Automated DPDP Act (India, 2023) Compliance Reports**:
   - Provide one-click downloadable compliance exports mapped to the **Digital Personal Data Protection Act, 2023**:
     - **Purpose Limitation (§6)**: Proof that data collected strictly matches declared notice.
     - **Consent Lifecycle (§7)**: Cryptographically verified audit log of consent grant, restriction, and revocation.
     - **Data Minimization & Erasure (§8)**: Automatic flagging and restriction of dormant permissions.
5. **Decentralized Reputation Network**:
   - Opt-in anonymized aggregation of app behavioral scores to establish a global, crowd-sourced trust intelligence registry for developers and privacy auditors.

---

## License

MIT License. Developed for NITSHACKS 9.0 Software Track.
