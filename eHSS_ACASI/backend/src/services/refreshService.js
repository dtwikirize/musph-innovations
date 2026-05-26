import cron from "node-cron";
import { appendRefreshLog, readCache } from "./cacheService.js";
import { getStoreStats } from "./dhis2StoreService.js";
import { getDatasetOrgUnits, refreshMetadata, refreshMonth } from "./monthlyDatasetService.js";

const monthId = (d) => `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, "0")}`;

export const runScheduledRefresh = async () => {
  const now = new Date();
  const prev = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const periods = [monthId(now), monthId(prev)];
  const startedAt = new Date().toISOString();
  try {
    await refreshMetadata();
    const orgUnits = await getDatasetOrgUnits();
    for (const ou of orgUnits) {
      for (const p of periods) await refreshMonth({ period: p, orgUnit: ou.id });
    }
    await appendRefreshLog({
      type: "cron",
      status: "success",
      periods,
      orgUnits: orgUnits.length,
      startedAt,
      finishedAt: new Date().toISOString()
    });
  } catch (error) {
    await appendRefreshLog({
      type: "cron",
      status: "failed",
      periods,
      startedAt,
      finishedAt: new Date().toISOString(),
      error: error.message
    });
  }
};

export const scheduleTwiceMonthlyRefresh = () => {
  cron.schedule("0 3 7,15 * *", runScheduledRefresh, {
    timezone: process.env.APP_TIMEZONE || "Africa/Kampala"
  });
};

export const nextScheduledRefresh = (now = new Date()) => {
  const scheduleHourUtc = 0;
  const candidates = [];
  for (let monthOffset = 0; monthOffset <= 2; monthOffset += 1) {
    const base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + monthOffset, 1));
    for (const day of [7, 15]) {
      candidates.push(new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), day, scheduleHourUtc, 0, 0)));
    }
  }
  return candidates.find((candidate) => candidate > now)?.toISOString() || "";
};

export const refreshHealth = async () => {
  const logs = (await readCache("refresh-logs", [])) || [];
  const lastCsvImport = await readCache("last-csv-import", null);
  const last = logs[0] || null;
  const failures = logs.filter((log) => log.status === "failed").slice(0, 5);
  const store = getStoreStats();
  return {
    lastPullAt: last?.finishedAt || last?.startedAt || "",
    lastStatus: last?.status || "not-run",
    lastType: last?.type || "",
    lastPeriods: Array.isArray(last?.periods) ? last.periods.join(", ") : (last?.period || ""),
    nextScheduledPull: nextScheduledRefresh(),
    rowsImported: store.rowCount || 0,
    lastCsvImport,
    failedRuns: failures.length,
    failedPeriods: failures.flatMap((log) => log.periods || [log.period].filter(Boolean)).join(", "),
    failedSites: failures.map((log) => log.orgUnit || log.orgUnits || "").filter(Boolean).join(", ")
  };
};
