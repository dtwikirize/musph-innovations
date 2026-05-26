# ACASI Deployment Checklist

## Main Website

Wait for the `musph.cc` website deployment to finish, then check:

- `https://musph.cc/innovations/acasi`
- `https://musph.cc/innovations/acasi/dashboard`

## ACASI Backend Service

Deploy this `eHSS_ACASI_READY` folder as its own Node service.

On Linux/Hostinger:

```bash
cp .env.example .env
npm install --omit=dev
npm start
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
npm install --omit=dev
npm start
```

## Required `.env` Values

Edit `.env` on the server:

```bash
DHIS2_BASE_URL=https://cranemis.org/ehss
DHIS2_API_VERSION=29
DHIS2_TOKEN=your_real_token
DATASET_UID=kLI7vQxaSAy
REFRESH_SECRET=your_strong_secret
FRAME_ANCESTORS='self' https://musph.cc
APP_TIMEZONE=Africa/Kampala
PORT=3000
NODE_ENV=production
```

## Private Files

These are included in this local ready folder, but if you deploy through GitHub, upload them manually to the server:

- `.env`
- `backend/data/acasi.sqlite`
- `cache/`

## Verify

After the service starts:

```bash
curl http://127.0.0.1:3000/api/health
curl -I http://127.0.0.1:3000/
```

The page response should include:

```text
Content-Security-Policy: frame-ancestors 'self' https://musph.cc
```
