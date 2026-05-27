import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const backendRoot = path.resolve(__dirname, "../..");
export const projectRoot = path.resolve(backendRoot, "..");

dotenv.config({ path: path.resolve(projectRoot, ".env") });

export const cacheDir = path.resolve(process.env.ACASI_CACHE_DIR || path.join(projectRoot, "cache"));
export const monthlyDataCacheDir = path.join(cacheDir, "monthly-data");
export const legacyBackendCacheDir = path.resolve(backendRoot, "cache");
