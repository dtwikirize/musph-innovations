import { Router } from "express";
import { authRefreshSecret } from "../middleware/authRefreshSecret.js";
import { cacheStatus, readCache } from "../services/cacheService.js";
import { excelImportStatus, importExcelWorkbook, refreshExcelCache } from "../services/excelDashboardService.js";
import { getTargets, saveTargets } from "../services/targetService.js";
import { clearDashboardCache } from "../services/dashboardCache.js";

const router = Router();
router.use(authRefreshSecret);

router.get("/refresh-logs", async (req, res) => res.json((await readCache("refresh-logs", [])) || []));
router.get("/cache-status", async (req, res) => res.json(await cacheStatus()));
router.get("/refresh-health", (req, res) => {
  res.json({ status: "excel-only", rowsImported: 0, lastRefresh: null, nextRefresh: null });
});
router.get("/csv-import-status", async (req, res) => res.json(await excelImportStatus()));
router.post("/import-data-file", async (req, res, next) => {
  try {
    const result = await importExcelWorkbook(req.body || {});
    clearDashboardCache();
    res.json(result);
  } catch (error) {
    next(error);
  }
});
router.get("/store-status", (req, res) => {
  res.json({ mode: "excel-only", rowCount: 0, orgUnitCount: 0, dataElementCount: 0 });
});
router.get("/targets", async (req, res) => res.json(await getTargets()));
router.post("/targets", async (req, res) => res.json(await saveTargets(req.body?.targets || [])));
router.post("/refresh-excel", (req, res) => {
  clearDashboardCache();
  res.json({ status: "ok", sheets: refreshExcelCache() ? true : false });
});

export default router;
