import { Router } from "express";
import { authRefreshSecret } from "../middleware/authRefreshSecret.js";
import { cacheStatus, readCache } from "../services/cacheService.js";
import { refreshAllPeriods, refreshMetadata, refreshMonth, refreshYear } from "../services/monthlyDatasetService.js";
import { refreshExcelCache } from "../services/excelDashboardService.js";
import { getStoreStats, hydrateAllUsedCategoryOptionCombos, updateStoreDataValue } from "../services/dhis2StoreService.js";
import { refreshHealth } from "../services/refreshService.js";
import { getTargets, saveTargets } from "../services/targetService.js";
import { csvImportStatus, importDataFile } from "../services/csvImportService.js";
import { clearDashboardCache } from "../services/dashboardCache.js";

const router = Router();
router.use(authRefreshSecret);

router.post("/refresh-metadata", async (req, res, next) => {
  try {
    res.json(await refreshMetadata());
  } catch (error) {
    next(error);
  }
});

router.post("/refresh-month", async (req, res, next) => {
  try {
    const { period, orgUnit } = req.body || {};
    if (!period || !orgUnit) return res.status(400).json({ message: "period and orgUnit are required" });
    res.json(await refreshMonth({ period: String(period), orgUnit: String(orgUnit) }));
  } catch (error) {
    next(error);
  }
});

router.post("/refresh-year", async (req, res, next) => {
  try {
    const { year, orgUnit, allPeriods } = req.body || {};
    if (!orgUnit) return res.status(400).json({ message: "orgUnit is required" });
    if (allPeriods) {
      const data = await refreshAllPeriods({ orgUnit: String(orgUnit), startYear: String(year || "2024") });
      return res.json({ type: "all-periods", rows: data.rows.length, startPeriod: data.startPeriod, endPeriod: data.endPeriod });
    }
    if (!year) return res.status(400).json({ message: "year is required when allPeriods is false" });
    res.json(await refreshYear({ year: String(year), orgUnit: String(orgUnit) }));
  } catch (error) {
    next(error);
  }
});

router.get("/refresh-logs", async (req, res) => res.json((await readCache("refresh-logs", [])) || []));
router.get("/cache-status", async (req, res) => res.json(await cacheStatus()));
router.get("/store-status", async (req, res) => res.json(getStoreStats()));
router.get("/refresh-health", async (req, res) => res.json(await refreshHealth()));
router.get("/csv-import-status", async (req, res) => res.json(await csvImportStatus()));
router.post("/import-data-file", async (req, res, next) => {
  try {
    const result = await importDataFile(req.body || {});
    clearDashboardCache();
    res.json(result);
  } catch (error) {
    next(error);
  }
});
router.post("/update-data-value", async (req, res, next) => {
  try {
    const result = updateStoreDataValue(req.body || {});
    clearDashboardCache();
    res.json(result);
  } catch (error) {
    next(error);
  }
});
router.get("/targets", async (req, res) => res.json(await getTargets()));
router.post("/targets", async (req, res) => res.json(await saveTargets(req.body?.targets || [])));
router.post("/hydrate-category-combos", async (req, res, next) => {
  try {
    res.json(await hydrateAllUsedCategoryOptionCombos());
  } catch (error) {
    next(error);
  }
});
router.post("/refresh-excel", async (req, res) => {
  clearDashboardCache();
  res.json({ status: "ok", sheets: refreshExcelCache() ? true : false });
});

export default router;
