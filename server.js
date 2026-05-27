import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import acasiApp from "./eHSS_ACASI/backend/src/app.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = Number(process.env.PORT || 3000);
const distDir = path.join(__dirname, "dist");

const app = express();

process.env.FRAME_ANCESTORS ||= "'self' https://musph.cc";

app.use("/acasi-app", acasiApp);
app.use(express.static(distDir));

app.get("*", (req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

app.listen(port, () => {
  console.log(`musph.cc portal listening on port ${port}`);
});
