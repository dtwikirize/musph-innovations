# MakSPH Digital Health Innovations

Unified digital health innovation portal for Makerere University School of Public Health under the CRANE Survey Project in partnership with the Ministry of Health.

## Preview locally

Run a static server from this folder:

```powershell
python -m http.server 4175 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:4175
```

The portal includes the existing training dashboard, which loads the bundled CSV from `data/training-data.csv`. Use the **Refresh data** button to pull the latest public Google Sheets CSV.

## eHSS ACASI dashboard

The `eHSS_ACASI` folder is attached to the portal from the ACASI innovation page:

- `/innovations/acasi`
- `/innovations/acasi/dashboard`

The portal serves the ACASI dashboard from the same Node app under `/acasi-app`. For local development, start the combined app from the repository root:

```powershell
npm install --omit=dev
npm start
```

By default it runs at `http://localhost:3000`. The deployed ACASI dashboard uses the uploaded Excel workbook data, not a live DHIS2 API token. Upload the workbook to the app root as `eHSS_ACASI Cumm Jan 2026.xlsx`, or set `ACASI_EXCEL_PATH` to its server path.

## Hostinger deployment

This repository is configured as a single Node app that serves the Vite portal and mounts the eHSS ACASI dashboard under the same domain at `/acasi-app`.

Use these settings:

```text
Framework/runtime: Node.js
Build command: npm run build
Install command: npm install
Start command: npm start
Node version: 22.13.0 or newer
```

The production build copies `public/data/training-data.csv` into `dist/data/training-data.csv`.
The Node server serves `dist/` for the public portal and serves ACASI API/assets from `eHSS_ACASI/`.

## Sensitive data access

The training database and CRANE Power BI dashboard include sensitive data. Do not protect these with a frontend-only password in `portal.js`; browser JavaScript can be inspected and the CSV/Power BI URL can still be reached directly.

Protect these paths at the hosting layer before sharing externally:

- `/innovations/training-database`
- `/innovations/crane-dashboard`
- `/innovations/crane-dashboard/live`
- `/data/training-data.csv`

Also restrict the source Google Sheet or replace the "Refresh data" CSV URL with an authenticated backend endpoint before publishing sensitive records. For Power BI, use Power BI authenticated sharing or an embed flow that requires sign-in; a `view?r=...` publish-to-web link is public to anyone who has the URL.

## Public routes

- `/`
- `/innovations`
- `/innovations/netlife`
- `/innovations/virtual-academy`
- `/innovations/training-database`
- `/innovations/crane-dashboard`
- `/innovations/crane-dashboard/live`
- `/innovations/acasi`
- `/innovations/acasi/dashboard`

The training landing page is available at `/innovations/training-database`, and the dashboard opens at `/innovations/training-database#dashboard`.
The ACASI dashboard is available at `/innovations/acasi/dashboard` and is embedded from the same domain path `/acasi-app`.

## Included dashboard views

- KPI cards for participants, facilities, districts, courses, pre-test, post-test, and improvement
- Interactive filters for search, course, district, year, and sex
- Trend chart by training start month
- Course pre-test vs post-test comparison
- Sex distribution, district ranking, role ranking, organization table, score bands, and participant register
