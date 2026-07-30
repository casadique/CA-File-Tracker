# CA File Tracker - Render Deployment Guide

This guide deploys the app as a Node.js web service on Render with Supabase as the single central database.

## What This Build Uses

- Frontend: `index.html`, `styles.css`, `app.js`
- Backend entry file: `server.js`
- Start command: `npm start`
- Build command: `npm ci`
- Database/Auth/Storage: Supabase
- Central sync path: browser -> Render Express API -> Supabase

Do not use browser localStorage as the operational database. Local storage is only a temporary browser cache. The central source must be Supabase.

## Files Required In GitHub

Keep these in the repository:

- `server.js`
- `package.json`
- `index.html`
- `app.js`
- `styles.css`
- `prepared-import-data.js`
- `src/`
- `database/`
- `data/`
- `tools/`
- `render.yaml`

Do not upload these:

- `.env`
- `node_modules/`
- `*.zip`
- old duplicate app folders
- backup exports unless you intentionally want them in Git

## Supabase Checklist

1. Open Supabase project.
2. Confirm the project URL is:
   `https://jzralbwcngqnmedjrzhh.supabase.co`
3. In Supabase Auth, confirm Admin user exists:
   `casadique@gmail.com`
4. Confirm user email is marked confirmed.
5. Confirm `app_users` table has the same Admin email with role `Admin` and `is_active = true`.
6. Confirm the central state has the expected file count. Current target after import is `755` files.

Do not run the old browser-mode policy file. This deployment uses the backend service role securely on Render.

## Render Deployment Steps

1. Go to Render Dashboard.
2. Click `New +`.
3. Select `Web Service`.
4. Connect your GitHub repository.
5. Select the repository that contains this app.
6. Use these settings:

   - Name: `ca-file-tracker`
   - Runtime: `Node`
   - Root Directory: leave blank, or use `.`
   - Build command: `npm ci`
   - Start Command: `npm start`
   - Auto Deploy: `Yes`

7. Add these environment variables in Render:

   ```text
   NODE_ENV=production
   SUPABASE_URL=https://jzralbwcngqnmedjrzhh.supabase.co
   SUPABASE_ANON_KEY=<your Supabase anon/publishable key>
   SUPABASE_SERVICE_ROLE_KEY=<your Supabase service role/secret key>
   SUPABASE_STORAGE_BUCKET=ca-file-tracker-attachments
   CORS_ORIGIN=https://<your-render-service>.onrender.com
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX=300
   ```

   Do not manually set `PORT` on Render. Render provides it automatically.

8. Click `Deploy Web Service`.
9. Wait until the deployment status is live.

## First Test

Open:

```text
https://<your-render-service>.onrender.com/api/health
```

Expected result:

```json
{
  "ok": true,
  "app": "CA File Tracker",
  "envReady": true,
  "missingEnv": []
}
```

If `envReady` is false, fix the missing Render environment variables and redeploy.

## Login And Sync Test

1. Open the Render app URL.
2. Log in as Admin:
   - Email: `casadique@gmail.com`
   - Password: use the current password set in Supabase Auth.
3. Open the Verification page.
4. Confirm central file count shows `755`.
5. Edit one test file and allot it to Rabiyath.
6. Save it.
7. Confirm the toast says:
   `File record saved and synced`
8. Open a private/incognito window.
9. Log in as Rabiyath.
10. Confirm the same allotted file appears.
11. Change one status as Rabiyath.
12. Return to Admin and refresh.
13. Confirm the status change appears.

If the save says `saved locally` or `central update failed`, check Render logs first. The backend must be able to reach Supabase.

## Custom Domain

After the Render URL works:

1. In Render, open the web service.
2. Go to `Settings` -> `Custom Domains`.
3. Add `cafiletracker.net`.
4. Add `www.cafiletracker.net` if needed.
5. Update DNS exactly as Render shows.
6. After the domain is verified, update Render environment variable:

   ```text
   CORS_ORIGIN=https://cafiletracker.net,https://<your-render-service>.onrender.com
   ```

7. Redeploy.
8. Test:

   ```text
   https://cafiletracker.net/api/health
   ```

## Performance Checklist

- Use Render paid/starter instance for production so the service does not sleep.
- Keep `compression` enabled. It is already enabled in `server.js`.
- Keep static cache-control headers enabled. They are already configured in `server.js`.
- Do not import the backup again unless the central file count is wrong.
- Keep all staff using the Render/custom-domain URL, not the old Hostinger URL.
- If a user sees old data, log out, close the tab, reopen the Render URL, and log in again.

## Security Cleanup After Successful Deployment

1. Remove `ADMIN_RECOVERY_TOKEN` from all hosting providers unless actively needed.
2. Rotate the Supabase service role/secret key because it was exposed during troubleshooting.
3. Update Render with the new service role key.
4. Redeploy.

