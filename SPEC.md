# E.D.I.T.H. — Enhanced Digital Identity, Trust & Heuristics
Hackathon prototype for NITSHACKS 9.0 (Software Track). It is judged on a live demo, so everything must visibly work.

## 1. Product
A permission-management dashboard that continuously monitors how simulated apps use a user's data, detects suspicious behaviour, gives each app an explainable trust score, recommends permission changes, and lets the user act on them. Core message: trust is checked continuously, not just at install time.

## 2. Tech rules
- Next.js App Router + TypeScript + Tailwind + shadcn/ui + Recharts + Zustand + lucide-react.
- 100% client-side: no backend, no database, no API keys. All state lives in one Zustand store.
- Must deploy to Vercel with zero config.
- No hydration errors: never call Math.random() or Date.now() during render. Start the simulator in useEffect. Use a seeded PRNG (mulberry32) so demos are repeatable.
- UI: dark security-dashboard look, readable on a projector. Green = trusted, amber = caution, red = high risk.
- Keep code simple and commented. Logic in src/lib, UI in src/components.

## 3. Data model
- Permission: id, label, sensitivity (low | medium | high | critical)
- App: id, name, category, description, status (active | suspended), justified (permission ids that fit its purpose), grants (permissionId -> allowed | restricted | revoked), baseline (permissionId -> expected accesses per tick), requests (pending permission requests)
- AccessEvent: id, tick, time, appId, permissionId, reason, outcome (allowed | blocked), blockReason (restricted | revoked | not_granted)
- Alert: id, tick, appId, severity (info | warning | critical), type, message
- AuditEntry: id, tick, time, appId, kind (access | alert | permission_change | trust_change | simulation), actor (system | user), detail
- TrustSnapshot: tick, appId, score

## 4. Seed data
Permissions: location (high), contacts (critical), microphone (critical), camera (high), photos (high), files (medium), calendar (medium), sms (critical), health_data (high), notifications (low).
Apps (all justified permissions = their initial grants):
- PhotoMagic (photo editor): photos, camera, files
- NoteNest (notes app): files, calendar, microphone, notifications
- FitPulse (fitness tracker): location, health_data, notifications
Each permission has a baseline rate between 0.05 and 0.4 accesses per tick, with a realistic reason string (e.g. "Saving edited photo", "Syncing workout route"). Make at least one permission per app rarely used. Tune values so initial trust scores land between 85 and 100.

## 5. Simulation
- TICK_MS = 2000. One tick = 1 simulated minute. Simulated clock starts at 09:00.
- Each tick, for every active app and every granted permission, an access attempt happens with probability = baseline rate.
- Windows: SHORT_WINDOW = 10 ticks, LONG_WINDOW = 60 ticks.
- Controls: start, pause, reset.

## 6. Access control rules
- allowed: access succeeds.
- restricted: at most 1 success per 10 ticks per permission. Extra attempts are blocked (restricted).
- revoked: always blocked (revoked).
- Permission never granted: blocked (not_granted). This counts as an unauthorized attempt.
- Suspended app: generates no events. Can be reinstated.
- Pending request: Approve -> grant becomes allowed. Deny -> request removed.
- Blocks caused by the user's own decisions (restricted, revoked, suspended) NEVER reduce trust. Only not_granted attempts do.

## 7. Trust score (rule-based and explainable)
score = 100 minus deductions, clamped to 0-100. Every deduction is returned as {label, points, detail} so the UI can list the reasons.
- Unused permission: granted (allowed or restricted) but no access in LONG_WINDOW. -3 each, cap -9.
- Unjustified sensitive permission: granted, sensitivity high or critical, not in app.justified. -10 each, cap -30.
- Frequency anomaly: ratio = successful accesses per tick over SHORT_WINDOW / sum of app baseline. Ratio >= 3 gives -15, ratio >= 5 gives -25.
- Unauthorized attempts: not_granted attempts in LONG_WINDOW. -4 each, cap -20.
- Pending unjustified permission requests: -6 each, cap -18.
Levels: >= 80 Trusted (green), 50-79 Caution (amber), < 50 High Risk (red). Suspended apps show "Suspended".
Because every factor uses rolling windows or current state, scores recover when behaviour normalizes or the user acts.

## 8. Alerts
Raise an alert on: frequency anomaly detected, new permission request, unauthorized attempt, trust level dropping into Caution or High Risk. Use a cooldown of 15 ticks per (app, type) so there is no spam. Every alert is also written to the audit log.

## 9. Recommendations (derived from current state, each with an Apply button)
- Pending unjustified request -> Deny.
- Granted unjustified sensitive permission -> Revoke.
- Unused permission -> Restrict.
- Frequency anomaly -> Restrict the most-accessed permission.
- Score < 40 -> Suspend app.
Each recommendation has severity, plain-English reason, and the exact action. Applying one does the same thing as the manual control and is logged as actor "user".

## 10. Demo scenario ("Simulate suspicious behaviour" button)
Affects FitPulse only:
- Immediately: access frequency of its existing permissions jumps about 6x.
- Tick +3: requests contacts. Tick +6: requests microphone. Tick +9: requests sms.
- From tick +3 onward, every other tick it attempts to read contacts (not granted -> unauthorized attempt) with reason "Reading contact list".
- Stays active until the user suspends the app, revokes/restricts the permissions, or presses Reset.
"Reset demo" restores the seed state completely.

## 11. UI
- Header: logo/name, simulated clock, Pause/Resume, "Simulate suspicious behaviour" (red), "Reset demo".
- Overview: one card per app with trust score ring, level badge, status, permission chips colored by state, and a small trust sparkline.
- Live Access Feed: scrolling list of latest events, blocked ones in red.
- Alerts panel: latest alerts with severity.
- App detail (side sheet): permission table with Allow/Restrict/Revoke controls, pending requests with Approve/Deny, score breakdown listing each deduction with its reason, trust-over-time chart, recommendations with Apply buttons, Suspend/Reinstate.
- Activity History page: full audit log table, filter by app and kind.