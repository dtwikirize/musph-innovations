# eHSS ACASI Deployment Package

This folder is the clean deployable copy of the eHSS ACASI dashboard.

## What is included

- `backend/src` Express API and server code.
- `frontend/dist` production frontend build served by the backend.
- `backend/data/acasi.sqlite*` local ACASI SQLite store.
- `cache` minimal startup metadata/status files.
- `.env.example` environment template.

## What was left out

- `node_modules`
- development frontend source
- Playwright test folders
- screenshots
- local logs
- raw Excel, PDF, and GeoJSON working files outside the app build

## Run

```powershell
Copy-Item .env.example .env
npm install --omit=dev
npm start
```

By default the app runs on `http://localhost:3000`. Set `PORT` in `.env` if your host needs another port.

## Add to Another Web App

Copy the whole `eHSS_ACASI` folder into the other app. If the other app already has a Node server, run this as a separate service on its own `PORT`, or mount `backend/src/app.js` from that app's Express server.
