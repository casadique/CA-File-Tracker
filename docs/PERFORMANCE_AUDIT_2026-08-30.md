# CA File Tracker performance audit — 30 August 2026

## Executive outcome

This phase preserves the current UI, workflows, roles, status names, audit history, and accounting behavior. It targets confirmed transfer and render delays while retaining the central JSON compatibility model. No production rows are deleted and no database schema change is included.

## Evidence and ranked bottlenecks

Read-only production measurement on 30 August 2026 found a 5,899,940-byte central state document containing 1,056 files. Six raw Supabase reads measured 634–2,020 ms, with a 703 ms median. The largest collections were files (2,604,937 bytes), notifications (1,084,943), fee receipts (817,079), audit history (623,255), collections (227,720), chat (155,584), and expenses (125,661).

1. **Application refresh/login:** `/api/state` must read and transfer the full central document. Window focus forced this full download even when the version had not changed.
2. **Fee receipt saves:** the save route returned all files, all fee receipts, and all collections after one receipt mutation.
3. **Large file lists:** browser tables can render the full filtered collection; the server endpoint did not expose complete filtering metadata or a bounded default page.
4. **Notifications:** archived/expired rows remained in every browser state payload even though the UI retention policy excludes them.
5. **Authentication:** every authorized request correctly validates its token and then reads the profile. Profile queries used `select(*)` rather than the required access-control columns.
6. **Static frontend:** `app.js` is approximately 1.50 MB decoded and `styles.css` approximately 441 KB. Export/PDF libraries are already lazy-loaded, but the application module itself remains monolithic.

Client Master and To-Do already use relational, server-filtered/paginated endpoints. Transactions already request bounded pages, although their source remains the central state document. Compression, short-lived isolated server state caching, granular compare-and-swap mutations, lazy export libraries, slow-request logging, and lightweight version checks were present before this phase.

## Changes in this phase

- Window focus now checks only the central version; the full state is fetched only when that version changed.
- A successful login renders the authenticated shell immediately while central data loads in the background.
- Fee receipt creation returns only the changed file, receipt, and linked collection; the browser merges those records locally.
- Browser state responses exclude archived and expired notifications while preserving every historical row in the database and backups.
- `/api/files` now applies server-side search, common filters, sorting, and bounded pagination with a 50-row default and 100-row maximum.
- Authentication profile lookups select only the required identity, role, permission, activation, and timestamp columns.
- A 25,000-row regression benchmark validates bounded file querying and the payload safeguards.

## Database indexes and migrations

No new index was added. The current operational file/finance data is stored inside one JSONB document; ordinary B-tree indexes on file properties cannot accelerate those embedded arrays. Adding speculative expression/GIN indexes would increase write cost without helping the current in-memory filtering path. Relational normalization is required before evidence-based file-field indexes can be effective.

## Remaining bottlenecks and next safe phase

- Normalize files, fee receipts, collections, and audit/notification events into relational tables behind compatibility APIs.
- Move File List and Active/Completed/Billing pages to the new paginated API so login no longer needs all file rows.
- Add dedicated dashboard aggregates for staff-level counts and trends, then remove full file loading from initial dashboard.
- Split the monolithic frontend by Transactions, Reports/Exports, Administration, and core Files after route-level data boundaries are stable.
- Add authenticated production Web Vitals and endpoint percentile telemetry; public asset timing alone cannot measure role-specific render completion.

These are staged separately because they require reversible data migrations and cross-module reconciliation, not a speculative live rewrite.
