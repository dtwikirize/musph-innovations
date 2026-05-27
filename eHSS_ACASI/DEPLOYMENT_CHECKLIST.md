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
ACASI_UPLOAD_DIR=/home/your-user/acasi-data/uploads
ACASI_CACHE_DIR=/home/your-user/acasi-data/cache
ACASI_EXCEL_PATH=/home/your-user/acasi-data/uploads/eHSS_Data_With_District_Region.xlsx
```

## Private Files

These are included in this local ready folder, but if you deploy through GitHub, upload them manually to the server.

Do not store the active Excel workbook inside the Git deployment directory. Git redeploys can replace that directory and erase runtime uploads. Create a persistent folder outside the app, for example:

```bash
mkdir -p /home/your-user/acasi-data/uploads
mkdir -p /home/your-user/acasi-data/cache
```

Then set the `ACASI_UPLOAD_DIR`, `ACASI_CACHE_DIR`, and `ACASI_EXCEL_PATH` values above in Hostinger. After that, Excel uploads from the Admin screen are written to the persistent path and should survive future Git pushes.

- `.env`
- `backend/data/acasi.sqlite`
- persistent `ACASI_EXCEL_PATH`
- persistent `ACASI_CACHE_DIR`

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
