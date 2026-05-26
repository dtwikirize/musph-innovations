import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const backendRoot = path.resolve(__dirname, "../..");
export const projectRoot = path.resolve(backendRoot, "..");
export const cacheDir = path.resolve(projectRoot, "cache");
export const monthlyDataCacheDir = path.join(cacheDir, "monthly-data");
export const legacyBackendCacheDir = path.resolve(backendRoot, "cache");
