import fs from "fs/promises";
import path from "path";
import { cacheDir, legacyBackendCacheDir, monthlyDataCacheDir } from "../config/paths.js";

const dataSetUid = process.env.DATASET_UID || "kLI7vQxaSAy";
export const cacheFiles = [
  "dataset-metadata",
  `dataset-${dataSetUid}-metadata`,
  "refresh-logs",
  "last-refresh",
  "dashboard-targets",
  "last-csv-import"
];

const filePath = (key) => path.join(cacheDir, `${key}.json`);
let migrationPromise = null;

const mergeLegacyDirectory = async (sourceDir, targetDir) => {
  let copied = 0;
  let updated = 0;
  let skipped = 0;
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });

  await fs.mkdir(targetDir, { recursive: true });

  for (const entry of entries) {
    const source = path.join(sourceDir, entry.name);
    const target = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      const nested = await mergeLegacyDirectory(source, target);
      copied += nested.copied;
      updated += nested.updated;
      skipped += nested.skipped;
      continue;
    }

    if (!entry.isFile()) continue;

    const sourceStat = await fs.stat(source);
    try {
      const targetStat = await fs.stat(target);
      if (sourceStat.mtimeMs <= targetStat.mtimeMs) {
        skipped += 1;
        continue;
      }
      await fs.copyFile(source, target);
      updated += 1;
    } catch {
      await fs.copyFile(source, target);
      copied += 1;
    }
  }

  return { copied, updated, skipped };
};

export const migrateLegacyCache = async () => {
  if (legacyBackendCacheDir === cacheDir) return { copied: 0, updated: 0, skipped: 0 };
  try {
    await fs.access(legacyBackendCacheDir);
  } catch {
    return { copied: 0, updated: 0, skipped: 0 };
  }
  return mergeLegacyDirectory(legacyBackendCacheDir, cacheDir);
};

export const ensureCacheDir = async () => {
  await fs.mkdir(cacheDir, { recursive: true });
  migrationPromise ||= migrateLegacyCache();
  await migrationPromise;
};

export const readCache = async (key, fallback = null) => {
  await ensureCacheDir();
  try {
    const raw = await fs.readFile(filePath(key), "utf-8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
};

export const writeCache = async (key, data) => {
  await ensureCacheDir();
  await fs.writeFile(filePath(key), JSON.stringify(data, null, 2), "utf-8");
};

export const appendRefreshLog = async (entry) => {
  const logs = (await readCache("refresh-logs", [])) || [];
  logs.unshift(entry);
  await writeCache("refresh-logs", logs.slice(0, 200));
};

export const cacheStatus = async () => {
  await ensureCacheDir();
  const [cacheStat, monthlyStat, topLevelEntries, monthlyEntries] = await Promise.all([
    fs.stat(cacheDir),
    fs.stat(monthlyDataCacheDir).catch(() => null),
    fs.readdir(cacheDir, { withFileTypes: true }),
    fs.readdir(monthlyDataCacheDir, { withFileTypes: true }).catch(() => [])
  ]);

  const topLevelFiles = topLevelEntries.filter((entry) => entry.isFile()).map((entry) => entry.name);
  const monthlyFiles = monthlyEntries.filter((entry) => entry.isFile()).map((entry) => entry.name);
  const monthlyRangeFiles = topLevelFiles.filter((name) => name.startsWith("monthly-data-range-") && name.endsWith(".json"));
  const output = [
    {
      item: "cache-directory",
      path: cacheDir,
      exists: true,
      files: topLevelFiles.length,
      bytes: "",
      updatedAt: cacheStat.mtime.toISOString()
    },
    {
      item: "monthly-data",
      path: monthlyDataCacheDir,
      exists: Boolean(monthlyStat),
      files: monthlyFiles.length,
      bytes: "",
      updatedAt: monthlyStat?.mtime.toISOString() || null
    },
    {
      item: "monthly-range-files",
      path: path.join(cacheDir, "monthly-data-range-*.json"),
      exists: monthlyRangeFiles.length > 0,
      files: monthlyRangeFiles.length,
      bytes: "",
      updatedAt: cacheStat.mtime.toISOString()
    }
  ];

  for (const key of cacheFiles) {
    const fp = filePath(key);
    try {
      const stat = await fs.stat(fp);
      output.push({ item: key, path: fp, exists: true, files: 1, bytes: stat.size, updatedAt: stat.mtime.toISOString() });
    } catch {
      output.push({ item: key, path: fp, exists: false, files: 0, bytes: 0, updatedAt: null });
    }
  }
  return output;
};
