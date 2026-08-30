# File Relational Migration — Phase 1

Phase 1 is a lossless shadow migration. `app_state.files` remains the production
source of truth and `file_records` receives a relational copy with indexed
search and sort columns.

## Safety controls

- `FILES_RELATIONAL_SHADOW_WRITE=1` mirrors file changes after the central save.
- `FILES_RELATIONAL_READ=0` keeps all production reads on the existing path.
- Shadow-write failures are logged and do not roll back a successful central
  save. Re-running the idempotent migration repairs parity from the source.
- Every server deployment performs a delayed full shadow reconciliation and
  records its parity result in `file_migration_runs`.
- Browser roles have no direct table access. RLS is enabled and access is
  limited to the server service role.
- The original file payload is stored unchanged in `payload`, so uncommon and
  historical fields are not lost.

## Verification

The initial production backfill on 30 August 2026 reported:

- Central records: 1,056
- Relational records: 1,056
- Missing relational records: 0
- Extra relational records: 0
- Relational payload size: approximately 1.38 MB

Admin/Manager diagnostics expose `relationalFiles` count parity after the
application deployment. Keep `FILES_RELATIONAL_READ=0` until parity remains
clean during normal file creation, editing, removal, restoration and deletion.

The Phase 1B server path is prepared behind `FILES_RELATIONAL_READ`. When
enabled, `GET /api/files` loads candidates from `file_records`, applies the
existing compatibility filters and sorting, and identifies the source in the
`X-File-Read-Source` response header. Any relational failure automatically
falls back to the central state. Browser startup remains unchanged during this
checkpoint.

Even when the read flag is configured, each new server instance reports
`central-warming` and continues using central reads until its startup
reconciliation proves exact file-ID parity. A shadow-write failure disables
relational reads for that instance until it is safely reconciled again.

## Rollback

Set both feature flags to `0`. The application continues using
`app_state.files`. The additive tables can remain for investigation or be
removed later with `database/rollbacks/20260830_drop_file_records_phase1.sql`.
