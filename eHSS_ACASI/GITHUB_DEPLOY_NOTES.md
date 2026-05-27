# GitHub Deployment Notes

This folder is safe to push to GitHub.

It does not include private runtime files:

- `.env`
- `backend/data/acasi.sqlite`
- `cache/*.json`

Those files must be uploaded directly to the server or configured in the hosting control panel.

## Push This Folder

Commit and push the contents of `eHSS_ACASI_GITHUB` to the repository or subfolder used by your other web app.

## Then Add Private Files on the Server

After GitHub deployment finishes, upload these from `eHSS_ACASI_PRIVATE_UPLOAD`:

- `backend/data/acasi.sqlite`
- `cache/`

Then create `.env` on the server from `.env.example` and fill in:

```bash
DHIS2_TOKEN=your_real_token
REFRESH_SECRET=your_strong_secret
FRAME_ANCESTORS='self' https://musph.cc
PORT=3000
NODE_ENV=production
```

## Start the Service

Inside the deployed ACASI folder:

```bash
npm install --omit=dev
npm start
```

Test:

```bash
curl http://127.0.0.1:3000/api/health
```
