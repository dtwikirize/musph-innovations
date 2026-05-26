import { Router } from "express";
import {
  fetchDatasetMetadata,
  fetchDhis2Me,
  fetchMonthlyData,
  fetchMonthlyDataRange,
  getDatasetOrgUnits,
  getWatchlistOrgUnits,
  listReportingOrgUnits
} from "../services/monthlyDatasetService.js";
import { excelOrgUnits } from "../services/excelDashboardService.js";
import { storeOrgUnits } from "../services/dhis2StoreService.js";

const router = Router();

router.get("/me", async (req, res, next) => {
  try {
    res.json(await fetchDhis2Me());
  } catch (error) {
    next(error);
  }
});

router.get("/dataset", async (req, res, next) => {
  try {
    res.json(await fetchDatasetMetadata());
  } catch (error) {
    next(error);
  }
});

router.get("/org-units", async (req, res, next) => {
  try {
    if ((req.query.source || "store") === "store") {
      const mode = String(req.query.mode || "all");
      const period = String(req.query.period || "");
      return res.json(storeOrgUnits({
        mode,
        period,
        region: req.query.region,
        district: req.query.district,
        facility: req.query.facility,
        implementingPartner: req.query.implementingPartner
      }));
    }
    if (req.query.source === "excel") {
      const mode = String(req.query.mode || "all");
      const period = String(req.query.period || "");
      return res.json(excelOrgUnits({
        mode,
        period,
        region: req.query.region,
        district: req.query.district,
        facility: req.query.facility,
        implementingPartner: req.query.implementingPartner
      }));
    }
    const mode = String(req.query.mode || "all");
    const period = String(req.query.period || "");
    if (mode === "watchlist") return res.json(await getWatchlistOrgUnits());
    if (mode === "reporting" && period) {
      const reporting = await listReportingOrgUnits({ period });
      return res.json(reporting.reportingOrgUnits);
    }
    res.json(await getDatasetOrgUnits());
  } catch (error) {
    next(error);
  }
});

router.get("/monthly-data", async (req, res, next) => {
  try {
    const period = String(req.query.period || "");
    const orgUnit = String(req.query.orgUnit || "");
    if (!period || !orgUnit) return res.status(400).json({ message: "period and orgUnit are required" });
    res.json(await fetchMonthlyData({ period, orgUnit }));
  } catch (error) {
    next(error);
  }
});

router.get("/monthly-data-range", async (req, res, next) => {
  try {
    const startPeriod = String(req.query.startPeriod || "");
    const endPeriod = String(req.query.endPeriod || "");
    const orgUnit = String(req.query.orgUnit || "");
    if (!startPeriod || !endPeriod || !orgUnit) return res.status(400).json({ message: "startPeriod, endPeriod and orgUnit are required" });
    res.json(await fetchMonthlyDataRange({ startPeriod, endPeriod, orgUnit }));
  } catch (error) {
    next(error);
  }
});

export default router;
