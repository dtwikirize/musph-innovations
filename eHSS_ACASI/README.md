# eHSS ACASI Ready Deployment Package

This folder is the clean deployable copy of the eHSS ACASI dashboard with the deployment items addressed for `musph.cc`.

## What is included

- `backend/src` Express API and server code.
- `frontend/dist` production frontend build served by the backend.
- `backend/data/acasi.sqlite*` local ACASI SQLite store.
- `cache` minimal startup metadata/status files.
- `.env.example` environment template with `FRAME_ANCESTORS`.
- `DEPLOYMENT_CHECKLIST.md` with the exact server steps.
- `start.sh`, `start.ps1`, and `ecosystem.config.cjs` helper files.

## What was left out

- `node_modules`
- development frontend source
- Playwright test folders
- screenshots
- local logs
- raw Excel, PDF, and GeoJSON working files outside the app build

## Run on Windows

```powershell
Copy-Item .env.example .env
npm install --omit=dev
npm start
```

## Run on Linux/Hostinger

```bash
cp .env.example .env
npm install --omit=dev
npm start
```

By default the app runs on `http://localhost:3000`. Set `PORT` in `.env` if your host needs another port.

Use Node `22.13.0` or newer because the backend uses Node's built-in SQLite support.

## Required Private Files

Upload these directly to the server. Do not commit them to GitHub:

- `.env`
- `backend/data/acasi.sqlite`
- `cache/`

Set these values in `.env` on the server:

```bash
DHIS2_TOKEN=your_real_token
REFRESH_SECRET=your_strong_secret
FRAME_ANCESTORS='self' https://musph.cc
PORT=3000
NODE_ENV=production
```

The backend already reads `FRAME_ANCESTORS` and sends the correct Content Security Policy header for `https://musph.cc`.

## Add to Another Web App

Copy the whole `eHSS_ACASI_READY` folder into the other app/server. If the other app already has a Node server, run this as a separate service on its own `PORT`, or mount `backend/src/app.js` from that app's Express server.

For the public website, confirm these pages after deployment:

- `https://musph.cc/innovations/acasi`
- `https://musph.cc/innovations/acasi/dashboard`
