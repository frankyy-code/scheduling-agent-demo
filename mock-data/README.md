# Mock Data — Compass Upload & Scheduling Fixtures

This folder is the **single source of truth** for the Clinical Access Orchestration demo.

## Zone A: Compass Upload (`compass-upload/`)

Upload these files to Compass for document review and symptom intake.

| Patient | MRN | Files |
|---------|-----|-------|
| Maria Chen | MC-100234 | `existing-orders.json`, `existing-symptoms.json`, `clinical-summary.md` |
| Robert Tan | RT-100891 | `existing-orders.json`, `existing-symptoms.json`, `clinical-summary.md` |
| James Miller | JM-100445 | `existing-orders.json`, `existing-symptoms.json` |

See `manifest.json` for the full file index and patient IDs.

### Upload workflow

1. For each patient, upload `existing-orders.json` and `existing-symptoms.json` to Compass per your API's document/symptom intake.
2. Optionally upload `clinical-summary.md` for unstructured chart context (Maria and Robert).
3. During the demo, you can upload add-on order files from `scheduling/additional-orders/` after clicking **Apply physician add-on order** in the portal.

## Zone B: Scheduling Fixtures (`scheduling/`)

These files are loaded by the React frontend at runtime (not uploaded to Compass by default):

- `provider-availability.json` — GI, anesthesia, cardiology, surgery slots
- `room-availability.json` — endoscopy suites, OR, PACU, inpatient beds (includes demo constraint gaps)
- `additional-orders/` — physician add-on orders applied mid-demo

## Demo constraint baked into room data

`room-availability.json` includes a Tuesday OR slot (2026-06-24) with **no PACU or inpatient bed** — powers the agent's "recommend Friday instead" callout for Robert Tan.
