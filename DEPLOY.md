# Railway Deployment Guide

## Architecture

Single Railway service — the Express backend builds the React frontend and serves it as static files. Both share the same URL (no CORS issues).

```
Railway Service
└── Node.js (Express)
    ├── /api/v1/*       → backend REST API
    ├── /uploads/*      → file uploads (static)
    ├── /api-docs       → Swagger UI
    ├── /health         → health check
    └── /*              → React SPA (frontend/dist)
Database: Neon PostgreSQL (external, already configured)
```

---

## Step 1 — Push to GitHub

```bash
cd "C:\Users\Administrator\Claude\Projects\School Management"
git init
git add .
git commit -m "Initial commit — School Management System"
# Create a repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/school-management.git
git push -u origin main
```

---

## Step 2 — Create Railway Project

1. Go to [railway.app](https://railway.app) → **New Project**
2. Choose **Deploy from GitHub repo**
3. Select your `school-management` repository
4. Railway detects `railway.toml` automatically

---

## Step 3 — Set Environment Variables

In Railway dashboard → your service → **Variables** tab, add:

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | *(your Neon connection string)* |
| `DIRECT_URL` | *(same Neon connection string)* |
| `JWT_SECRET` | *(random 32+ char string)* |
| `JWT_REFRESH_SECRET` | *(different random 32+ char string)* |
| `JWT_EXPIRES_IN` | `1d` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `BCRYPT_ROUNDS` | `12` |
| `RATE_LIMIT_WINDOW_MS` | `900000` |
| `RATE_LIMIT_MAX` | `100` |
| `MAX_FAILED_LOGINS` | `5` |
| `LOCK_DURATION_MINUTES` | `30` |
| `MAX_FILE_SIZE_MB` | `5` |

Leave `CLIENT_URL` and `PORT` — Railway sets `PORT` automatically; set `CLIENT_URL` **after** your first deploy once you know the URL.

> **Generate secrets:** In PowerShell: `[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))`

---

## Step 4 — Deploy

Railway triggers a build automatically on push. The build does:
1. `npm ci` in `backend/` and `frontend/`
2. `npm run build` in `frontend/` → outputs `frontend/dist/`
3. `npx prisma generate` → generates Prisma client for Linux
4. Starts: `node backend/src/server.js`

Watch build logs in Railway dashboard. Build takes ~2-3 minutes.

---

## Step 5 — After First Deploy

1. Copy your Railway URL (e.g. `https://school-management-production.up.railway.app`)
2. Add it as `CLIENT_URL` in Railway Variables
3. Railway redeploys automatically

---

## Step 6 — Run the Seed (one-time)

In Railway dashboard → your service → **Settings** → **Deploy** → open a shell, or use the Railway CLI:

```bash
# Install Railway CLI
npm install -g @railway/cli
railway login
railway link   # select your project

# Run seed
railway run node backend/prisma/seed.js
```

Or if you prefer, run the seed locally pointing at the production DB:
```bash
cd "C:\Users\Administrator\Claude\Projects\School Management"
# Temporarily set DATABASE_URL to Neon URL in backend/.env (already set)
node backend/prisma/seed.js
```

---

## Verify Deployment

```
https://your-app.up.railway.app/health          → {"success":true,...}
https://your-app.up.railway.app/api-docs        → Swagger UI
https://your-app.up.railway.app/                → React login page
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Build fails: "prisma generate" error | Ensure `DATABASE_URL` is set in Railway vars |
| `Cannot find module` | Check `backend/package.json` has all dependencies |
| Blank page (React) | Check browser console — usually a JS error in index.html |
| API 401 errors | `JWT_SECRET` env var not set |
| CORS errors | Set `CLIENT_URL` to your Railway URL |

---

## Updating the App

```bash
git add .
git commit -m "Update: description"
git push
```
Railway auto-deploys on every push to `main`.
