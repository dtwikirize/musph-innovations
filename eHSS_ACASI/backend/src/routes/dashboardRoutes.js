import { Router } from "express";
import {
  excelDataElementOptions,
  excelDataElements,
  excelDataQuality,
  excelFilterOptions,
  excelIMPerformance,
  excelMonthlyOverview,
  excelOrgUnitComparison,
  excelOrgUnits,
  excelTrends,
  excelYears
} from "../services/excelDashboardService.js";
import { resolveTargets } from "../services/targetService.js";
import { dashboardCacheMiddleware } from "../services/dashboardCache.js";

const router = Router();
router.use(dashboardCacheMiddleware);

const emptyHighRisk = () => ({
  summary: {},
  groups: [],
  imRows: [],
  imGroups: [],
  ageSex: [],
  ageGroups: [],
  trends: []
});

router.get("/dataset", (req, res) => {
  res.json({
    dataSetElements: excelDataElementOptions().map((dataElement) => ({ dataElement }))
  });
});

router.get("/org-units", (req, res) => {
  res.json(excelOrgUnits({
    mode: String(req.query.mode || "all"),
    period: String(req.query.period || ""),
    region: req.query.region,
    district: req.query.district,
    facility: req.query.facility,
    implementingPartner: req.query.implementingPartner
  }));
});

router.get("/monthly-overview", (req, res) => {
  const { period = "", orgUnit = "__ALL__" } = req.query;
  res.json(excelMonthlyOverview({
    period: String(period || ""),
    orgUnit: String(orgUnit || "__ALL__"),
    year: req.query.year,
    month: req.query.month,
    region: req.query.region,
    district: req.query.district,
    facility: req.query.facility,
    implementingPartner: req.query.implementingPartner
  }));
});

router.get("/data-elements", (req, res) => {
  const { period = "", orgUnit = "__ALL__", query = "" } = req.query;
  res.json(excelDataElements({
    period: String(period || ""),
    orgUnit: String(orgUnit || "__ALL__"),
    query: String(query || ""),
    year: req.query.year,
    month: req.query.month,
    region: req.query.region,
    district: req.query.district,
    facility: req.query.facility,
    implementingPartner: req.query.implementingPartner
  }));
});

router.get("/trends", (req, res) => {
  const { dataElement = "", orgUnit = "__ALL__", startPeriod = "", endPeriod = "" } = req.query;
  if (!dataElement || !startPeriod || !endPeriod) {
    return res.status(400).json({ message: "dataElement, startPeriod and endPeriod are required" });
  }
  res.json(excelTrends({
    dataElement: String(dataElement),
    orgUnit: String(orgUnit || "__ALL__"),
    startPeriod: String(startPeriod),
    endPeriod: String(endPeriod),
    year: req.query.year,
    month: req.query.month,
    region: req.query.region,
    district: req.query.district,
    facility: req.query.facility,
    implementingPartner: req.query.implementingPartner
  }));
});

router.get("/org-unit-comparison", (req, res) => {
  const { period = "", dataElement = "" } = req.query;
  if (!dataElement) return res.status(400).json({ message: "dataElement is required" });
  res.json(excelOrgUnitComparison({
    period: String(period || ""),
    dataElement: String(dataElement),
    year: req.query.year,
    month: req.query.month,
    region: req.query.region,
    district: req.query.district,
    facility: req.query.facility,
    implementingPartner: req.query.implementingPartner
  }));
});

router.get("/data-quality", (req, res) => {
  const { period = "", orgUnit = "__ALL__" } = req.query;
  res.json(excelDataQuality({
    period: String(period || ""),
    orgUnit: String(orgUnit || "__ALL__"),
    year: req.query.year,
    month: req.query.month,
    region: req.query.region,
    district: req.query.district,
    facility: req.query.facility,
    implementingPartner: req.query.implementingPartner
  }));
});

router.get("/data-element-options", (req, res) => {
  res.json(excelDataElementOptions());
});

router.get("/years", (req, res) => {
  res.json(excelYears());
});

router.get("/filter-options", (req, res) => {
  res.json(excelFilterOptions({
    year: req.query.year,
    month: req.query.month,
    period: req.query.period,
    region: req.query.region,
    district: req.query.district,
    facility: req.query.facility,
    implementingPartner: req.query.implementingPartner
  }));
});

router.get("/targets", async (req, res) => {
  res.json(await resolveTargets({ year: req.query.year, partner: req.query.implementingPartner, funder: req.query.funder }));
});

router.get("/refresh-health", (req, res) => {
  res.json({ status: "excel-only", rowsImported: 0, lastRefresh: null, nextRefresh: null });
});

router.get("/im-performance", (req, res) => {
  let metrics = [];
  try {
    metrics = req.query.metrics ? JSON.parse(String(req.query.metrics)) : [];
  } catch {
    metrics = [];
  }
  res.json(excelIMPerformance({
    orgUnit: req.query.orgUnit || "__ALL__",
    metrics,
    year: req.query.year,
    month: req.query.month,
    period: req.query.period,
    region: req.query.region,
    district: req.query.district,
    facility: req.query.facility,
    implementingPartner: req.query.implementingPartner
  }));
});

router.get("/coverage", (req, res) => {
  res.json({ sites: [], summary: {}, rows: [] });
});

router.get("/high-risk-groups", (req, res) => {
  res.json({ groups: [] });
});

router.get("/high-risk-dashboard", (req, res) => {
  res.json(emptyHighRisk());
});

router.get("/dashboard-demographics", (req, res) => {
  res.json({ rows: [], summary: {} });
});

router.get("/high-risk-trends", (req, res) => {
  res.json([]);
});

router.get("/dimension-performance", (req, res) => {
  let metrics = [];
  try {
    metrics = req.query.metrics ? JSON.parse(String(req.query.metrics)) : [];
  } catch {
    metrics = [];
  }
  res.json({ dimension: req.query.dimension || "district", metrics, rows: [] });
});

router.get("/detail-rows", (req, res) => {
  let metrics = [];
  try {
    metrics = req.query.metrics ? JSON.parse(String(req.query.metrics)) : [];
  } catch {
    metrics = [];
  }
  res.json({ metrics, rows: [] });
});

router.get("/high-risk-group-performance", (req, res) => {
  let metrics = [];
  try {
    metrics = req.query.metrics ? JSON.parse(String(req.query.metrics)) : [];
  } catch {
    metrics = [];
  }
  res.json({ metrics, rows: [] });
});

export default router;
