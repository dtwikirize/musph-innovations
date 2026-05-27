import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = Number(process.env.PORT || 3000);
const distDir = path.join(__dirname, "dist");

const app = express();

process.env.FRAME_ANCESTORS ||= "'self' https://musph.cc";

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
});

let acasiMounted = false;
let acasiMountError = "";
let acasiHandler = (req, res) => {
  res.status(503).send(`
    <h1>ACASI dashboard starting</h1>
    <p>The main musph.cc portal is running. The ACASI dashboard is still loading.</p>
  `);
};

app.use("/acasi-app", (req, res, next) => acasiHandler(req, res, next));

import("./eHSS_ACASI/backend/src/app.js").then(({ default: acasiApp }) => {
  acasiHandler = acasiApp;
  acasiMounted = true;
  console.log("ACASI dashboard mounted at /acasi-app");
}).catch((error) => {
  acasiMountError = error?.stack || error?.message || String(error);
  console.error("ACASI dashboard failed to mount:", acasiMountError);
  acasiHandler = (req, res) => {
    res.status(503).send(`
      <h1>ACASI dashboard unavailable</h1>
      <p>The main musph.cc portal is running, but the ACASI backend could not start.</p>
      <pre>${escapeHtml(acasiMountError)}</pre>
    `);
  };
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    acasiMounted,
    acasiMountError: acasiMounted ? "" : acasiMountError,
    node: process.version,
  });
});

app.use(express.static(distDir));

app.get("*", (req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

app.listen(port, () => {
  console.log(`musph.cc portal listening on port ${port}`);
});

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
