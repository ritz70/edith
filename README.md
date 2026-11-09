# E.D.I.T.H. — Enhanced Digital Identity, Trust & Heuristics
**Hackathon Prototype for NITSHACKS 9.0 (Software Track)**

> **Trust is checked continuously, not just at install time.**

E.D.I.T.H. is a real-time permission-management dashboard that continuously monitors how simulated apps access sensitive user data, detects behavioral anomalies, calculates an explainable trust score, surfaces rule-derived security recommendations, and enforces fine-grained access control with an immutable audit log.

---

## Key Features

1. **Continuous Simulation Engine**
   - Pure function simulation advancing deterministic ticks (1 tick = 1 simulated minute).
   - Seeded mulberry32 PRNG for fully repeatable demonstrations.
   - Monitors 3 simulated applications: PhotoMagic, NoteNest, and FitPulse.

2. **Explainable Rule-Based Trust Engine (SPEC §7)**
   - Dynamic score from 0–100 with clear deduction breakdowns:
     - **Unused permissions**: granted but dormant in long rolling window (-3 pts each, cap -9).
     - **Unjustified sensitive permissions**: granted sensitive permissions outside app scope (-10 pts each, cap -30).
     - **Frequency anomalies**: $\ge 3\times$ baseline (-15 pts) or $\ge 5\times$ baseline (-25 pts).
     - **Unauthorized access attempts**: attempts to access ungranted permissions (-4 pts each, cap -20).
     - **Pending unjustified requests**: (-6 pts each, cap -18).
   - Visual color-coded trust levels:
     - **Trusted** ($\ge 80$, Emerald)
     - **Caution** ($50–79$, Amber)
     - **High Risk** ($< 50$, Rose)
     - **Suspended** (Slate)

3. **Active Access Control & Policy Enforcement (SPEC §6)**
   - **Allowed**: accesses succeed normally.
   - **Restricted**: rate-limited to at most 1 access per 10 ticks.
   - **Revoked**: all access attempts blocked immediately.
   - **Suspended**: entire application frozen; zero events generated.
   - **Pending Requests**: Approve or Deny inline.
   - Blocks from user decisions *never* penalize trust; only unauthorized attempts (`not_granted`) do.

4. **Security Recommendations with One-Click "Apply" (SPEC §9)**
   - Deny unjustified pending requests.
   - Revoke sensitive unjustified grants.
   - Restrict dormant permissions.
   - Restrict high-frequency anomalous permissions.
   - Suspend critical risk applications ($< 40$).
   - All applied recommendations log an immutable audit entry with actor `"user"`.

5. **"Simulate Suspicious Behaviour" Demo Scenario (SPEC §10)**
   - Single-click demonstration affecting FitPulse:
     - Immediate $6\times$ access burst.
     - Tick $+3$: staged request for Contacts.
     - Tick $+6$: staged request for Microphone.
     - Tick $+9$: staged request for SMS.
     - From Tick $+3$ onward: unauthorized access attempts to Contacts every other tick.
     - Trust score rapidly drops into Caution / High Risk, triggering security alerts.
   - "Reset demo" button restores original baseline seed state instantly.

6. **Activity History & Audit Trail (SPEC §11)**
   - Full audit table at `/history` tracking every access, alert, permission change, and simulation event.
   - Filterable by Application, Event Kind, and Actor (`user` vs `system`), with full-text search.

---

## Tech Stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **Styling**: Tailwind CSS, tw-animate-css (Dark security-dashboard theme)
- **UI Components**: shadcn/ui, Lucide Icons
- **Data Visualization**: Recharts (historical score chart) & Custom SVG (circular rings and sparklines)
- **State Management**: Zustand (100% client-side, zero backend / zero API keys)

---

## Getting Started

### Prerequisites
- Node.js 18+ (tested on Node 24)

### Development
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the dashboard.
Open [http://localhost:3000/history](http://localhost:3000/history) to view the full activity audit trail.

### Production Build
```bash
npm run build
npm run start
```

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx               # Main Dashboard view
│   ├── history/page.tsx       # Activity History & Audit Log
│   ├── layout.tsx             # Root Layout (Dark theme)
│   └── globals.css            # Global theme styles
├── components/
│   ├── DashboardHeader.tsx    # Clock, controls, demo scenario button
│   ├── AppCards.tsx           # Monitored app cards, score rings, sparklines
│   ├── LiveAccessFeed.tsx     # Real-time event stream & block indicators
│   ├── AlertsPanel.tsx        # High-severity alert notices
│   └── AppDetailSheet.tsx     # Side-over: controls, chart, deductions, recommendations
└── lib/
    ├── types.ts               # Core domain models
    ├── seed.ts                # Permission catalog & initial apps
    ├── simulator.ts           # Pure simulation tick engine & PRNG
    ├── trust.ts               # Heuristic trust computation engine
    ├── alerts.ts              # Alert evaluation & 15-tick cooldown logic
    ├── recommendations.ts     # Actionable recommendation heuristics
    └── store.ts               # Zustand simulation store
```
