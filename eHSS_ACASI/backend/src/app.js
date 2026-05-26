import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import dhis2Routes from "./routes/dhis2Routes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
const frontendDist = path.resolve(__dirname, "../../frontend/dist");
const frameAncestors = (
  process.env.FRAME_ANCESTORS ||
  "'self' http://127.0.0.1:4175 http://localhost:4175 http://127.0.0.1:4176 http://localhost:4176 https://musph.cc"
)
  .split(/\s+/)
  .filter(Boolean);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "frame-ancestors": frameAncestors,
      },
    },
    frameguard: false,
  }),
);
app.use(cors({ origin: true, credentials: false }));
app.use(express.json({ limit: "25mb" }));
app.use(morgan("tiny"));
app.use("/api", apiLimiter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", appTimezone: process.env.APP_TIMEZONE || "Africa/Kampala" });
});

app.use("/api/dhis2", dhis2Routes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/admin", adminRoutes);

app.use(express.static(frontendDist));
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(frontendDist, "index.html"));
});

app.use(notFound);
app.use(errorHandler);

export default app;
