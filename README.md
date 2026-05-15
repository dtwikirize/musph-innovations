# GSD Training Dashboard

Power BI-style web dashboard for the published GSD training register.

## Preview locally

Run a static server from this folder:

```powershell
python -m http.server 4175 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:4175
```

The dashboard loads the bundled CSV from `data/training-data.csv`. Use the **Refresh data** button to pull the latest public Google Sheets CSV.

## Included views

- KPI cards for participants, facilities, districts, courses, pre-test, post-test, and improvement
- Interactive filters for search, course, district, year, and sex
- Trend chart by training start month
- Course pre-test vs post-test comparison
- Sex distribution, district ranking, role ranking, organization table, score bands, and participant register
