# Clinical Access Orchestration — Scheduler Portal

Mayo-style demo portal for GI work queue prioritization, agent reasoning, scheduler review, capacity recommendations, and metrics.

## Quick start

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Compass API

Copy `.env.example` to `.env` and configure:

- `VITE_COMPASS_BASE_URL` — Compass API base URL
- `VITE_COMPASS_API_KEY` — API key / bearer token
- `VITE_COMPASS_USE_REAL_API=true` — enable real API (default: stub)

Stub mode returns mock session IDs so the full demo flow works without Compass.

## Mock data

Patient orders and symptoms for Compass upload live in [`../mock-data/`](../mock-data/). See that folder's README for upload instructions.

The frontend loads scheduling fixtures (provider/room availability, add-on orders) from the same folder via the `@mock-data` alias.

## Demo flow

1. **Work Queue** — select Maria, Robert, or James; complete SOP decision tree
2. **Apply physician add-on order** — simulates mid-review Epic order (Maria/Robert)
3. **Start AI Agent Review** — calls Compass (stub or real) + runs acuity rubric
4. **Agent Review** — ranked queue, reasoning, care pathway graph, constraint callout
5. **Scheduler Review** — accept / override / manual review (feedback logged)
6. **Capacity** — mismatch flags + MSAC template recommendations
7. **Metrics** — KPI cards updated from scheduler actions

**Reset Demo** clears localStorage feedback and reloads.
