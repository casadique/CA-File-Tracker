# CA File Tracker Deployment

Use Render for the production deployment.

Follow the complete step-by-step guide in:

`RENDER-DEPLOYMENT.md`

The current production architecture is:

```text
Browser -> Render Node/Express API -> Supabase Auth/PostgreSQL/Storage
```

Do not use the old browser-direct Supabase mode and do not deploy from the old Hostinger instructions unless you intentionally decide to return to Hostinger later.

