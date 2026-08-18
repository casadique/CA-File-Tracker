# CA File Tracker performance audit — 18 August 2026

## Outcome

Phase 1 removes proven request-time overhead without changing business rules,
permissions, audit history, notification behavior, or database structure. Database
normalization remains a separate staged migration because the production system
currently stores most operational data in one JSON document.

## Measured baseline

| Measurement | p50 | p95 | Worst / size |
| --- | ---: | ---: | ---: |
| Production `/` (12 samples) | 273 ms | 560 ms | 560 ms |
| Production `/app.js` (12 samples) | 534 ms | 1,246 ms | 1.45 MB decoded |
| Production `/styles.css` (12 samples) | 346 ms | 810 ms | 420 KB decoded |
| Production `/api/health` (12 samples) | 265 ms | 347 ms | 347 ms |
| Supabase raw `app_state` read (12 samples) | 727 ms | 1,886 ms | 7.08 MB |
| Normalized application-state read (10 samples) | 1,319 ms | 2,165 ms | 2,165 ms |

The largest embedded collections were files (2.32 MB), reset backups (2.28 MB),
notifications (1.05 MB), receipts (461 KB), and audit history (445 KB).

## Phase 1 changes and results

- Replaced recursive whole-document label normalization on every request with
  targeted service-field normalization. Historical migrations still run at
  startup.
- Added a one-second application-state cache. Returned values are cloned for
  request isolation; successful saves refresh the cache; version conflicts clear
  it and force a fresh database read.
- Removed server-only reset backups from browser state responses. Production data
  remains in the database and in backups.
- Changed ordinary expense and collection mutations to return the changed record
  instead of the entire register.
- Rerendered only the Transactions page after those saves instead of rebuilding
  global navigation and all shell bindings.
- Added `X-Request-ID` and structured slow-request logs. Requests at or above 750
  ms are logged by default; `PERF_LOG=1` logs all API requests.

| Measurement | Before | After | Change |
| --- | ---: | ---: | ---: |
| Warm normalized state read p50 | 1,319 ms | 34 ms | 97.4% faster |
| Warm normalized state read p95 | 2,165 ms | 50 ms | 97.7% faster |
| Admin state response | 7,082,565 bytes | 4,801,437 bytes | 32.2% smaller |
| Expense-save response | 76,410 bytes | 755 bytes | 99.0% smaller |
| Collection-save response | 132,774 bytes | 3,627 bytes | 97.3% smaller |

Cold reads remain constrained by a multi-megabyte document. The cache improves
repeated actions but does not remove that longer-term structural limit.

## Data safety and verification

A timestamped baseline backup was written to the local `data/backups` directory.
It passed JSON parsing, SHA-256 integrity, and record-count verification. It
contains 1,009 files, 1,018 client rows, 26 users, 109 expenses, 288 transactions,
and the current audit/notification history. Ten optional relational tables were
reported as unavailable because they do not exist in this Supabase schema; the
client export fell back to the database client snapshot. For this reason the
baseline backup metadata correctly remains `complete: false`. The later archive
migration was attempted only after the snapshot restored and reconciled in an
isolated Supabase branch.

The build and all performance, state-safety, finance, transaction, draft,
notification, To-Do, and cache-policy regression tests passed. Two unrelated
pre-existing correction workflow tests remain failing and are documented rather
than changed as part of this performance phase.

## Longer-term normalization phase

1. Normalize files, finance transactions, notifications, chat, and audit events
   into paginated relational tables behind compatibility APIs.
2. Add server-side pagination to remaining large file/notification/audit lists and
   load them on demand.
3. Split `app.js` and `styles.css` by feature, fingerprint immutable assets, and
   measure authenticated Web Vitals.

## Stabilization phase completed

A temporary Supabase preview branch (`perf-stabilization-20260818`) was created
and loaded from the checksum-verified snapshot. Staging reconciled all tested
collections and finance totals exactly: 1,009 files, 26 users, 109 expenses, 101
collections, 800 notifications, and 784 audit events.

Two embedded file-reset backups were copied byte-for-byte into a service-only
`app_state_archives` table before being removed from the hot state document. The
archive table has RLS enabled, no browser policies, verified payload checksums,
and is included in future complete backups. The hot document was reduced from
7,082,565 bytes to 4,801,437 bytes (32.2%). Future file resets write their safety
copy directly to the protected archive instead of inflating the hot document.

The staged granular compare-and-swap save path sends individual changed records
instead of complete arrays. A representative file + notification + audit save
used a 5 KB operation envelope and measured 599 ms p50 / 679 ms p95, compared
with 2,059 ms p50 for the reduced full-state write. A two-writer concurrency test
produced exactly one winner and one version conflict, with every reconciled count
unchanged. Anonymous and authenticated database roles cannot execute the function;
only the service role can.

## Rollback

Revert the performance commits and redeploy to restore the previous application
path. The archive migration is reversible with
`database/rollbacks/20260818_restore_embedded_file_backups.sql`; it reconstructs
the embedded array from protected archive payloads and verifies the count before
commit. The archive table is intentionally retained so rollback never deletes a
recovery payload. The timestamped baseline backup is also retained locally.
