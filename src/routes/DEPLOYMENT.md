# CA File Tracker Production Deployment

## Application Type

Responsive single-page web application using HTML5, CSS3 and vanilla JavaScript. The frontend communicates with the backend through JSON REST APIs using the Fetch API.

## Backend

Node.js 18+ with Express.js. Entry file: `server.js`.

Runtime command on Hostinger:

```text
npm start
```

Build command on Hostinger:

```text
npm run build
```

If Hostinger does not show a separate start-command field, set the Node.js startup/entry file to `server.js`.

## Supabase Setup

1. Create a Supabase project.
2. Open the Supabase SQL editor.
3. Run `database/schema.sql`.
4. Add these Hostinger environment variables:

```text
NODE_ENV=production
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_STORAGE_BUCKET=ca-file-tracker-attachments
CORS_ORIGIN=https://your-domain.com
ADMIN_RECOVERY_TOKEN=temporary-secret-only-for-admin-recovery
```

Do not place secrets in source code or uploaded public files.

## Initial Data Migration

After setting environment variables locally or on the server, import the current backup into Supabase:

```text
npm run import:backup
```

This imports `data/site-data.json` into the central Supabase database.

## User Management

Users are created through Supabase Authentication. Passwords are never stored or displayed in application tables. Admin can create users, change roles, activate/deactivate access, and trigger password reset.

## GitHub Deployment

Keep this source code in GitHub. Connect Hostinger to the repository and deploy from the `main` branch. Hostinger should install dependencies with `npm install` and start the app with `npm start`.

The GitHub repository must contain `server.js`, `package.json`, `index.html`, `app.js`, `styles.css`, `prepared-import-data.js`, `src`, `data`, `database`, and `tools`.

Do not commit or upload `.env`, `node_modules`, old zip files, or duplicate old HTML files.

Remove `ADMIN_RECOVERY_TOKEN` from Hostinger after Admin login is repaired.

After every deployment:

1. Check `/api/health`; `envReady` must be `true`.
2. Log in as Admin and confirm the Verification page says Supabase central database.
3. Allot a test file to one staff user. The save toast must say `File record saved and synced`.
4. Log in as that staff user in another browser/incognito window. The file should appear after login or within a few seconds.
