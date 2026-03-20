---
name: vitrinex-deploy
description: >
  Use this skill when the user asks about deploying the VitrineX app, building
  for production, uploading to Hostinger, configuring .htaccess, or troubleshooting
  deployment issues. Do NOT use for code development or marketing content.
---

# VitrineX Deployment Guide

Deploy the VitrineX AI application to Hostinger via WinSCP.

## Build for Production

```bash
npm run build
```

This generates the `dist/` folder with all static assets.

## Type-Check Before Deploy

```bash
npx tsc --noEmit
```

## Upload via WinSCP

### Connection Settings
- **Protocol:** FTP (not SFTP)
- **Encryption:** TLS/SSL Explicit (fallback: None)
- **Host:** `red-owl-902155.hostingersite.com`
- **Port:** 21
- **Username:** `u786088869.red-owl-902155.hostingersite.com`

### Upload Steps

1. Connect via WinSCP with the credentials above.
2. Navigate to `/public_html` on the remote side.
3. **Frontend:** Select ALL contents inside `dist/` and upload to `/public_html` root.
4. **Backend API:**
   - Create `api/` folder inside `public_html`.
   - Upload `server/hostinger_api/` files (`config.php`, `salvar_memoria.php`, `migrate_supabase_to_mysql.php`) into `api/`.
5. **Database:** Import `SCHEMA_MYSQL.sql` via phpMyAdmin on Hostinger. Update `api/config.php` with MySQL credentials.

### Critical: .htaccess

Ensure `.htaccess` is uploaded to `/public_html`. It handles React SPA routing. The file is in the project root.

## Verify

1. Access `http://red-owl-902155.hostingersite.com`
2. Confirm the site loads and routes work.
3. Test AI memory persistence via `api/salvar_memoria.php`.

## Troubleshooting

- **"Failed to fetch module" errors:** Clear browser cache after deploy.
- **Routes returning 404:** `.htaccess` is missing or misconfigured.
- **CORS errors on AI calls:** Ensure `proxy_server.js` is configured correctly (Port 3001).
