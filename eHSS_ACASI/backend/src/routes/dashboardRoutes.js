import { Router } from "express";
import {
  dataElementsTable,
  dataQuality,
  monthlyOverview,
  orgUnitComparison,
  trendData
} from "../services/monthlyDatasetService.js";
import {
  excelDataElementOptions,
  excelDataElements,
  excelFilterOptions,
  excelDataQuality,
  excelMonthlyOverview,
  excelIMPerformance,
  excelOrgUnitComparison,
  excelTrends,
  excelYears
} from "../services/excelDashboardService.js";
import {
  storeDataElementOptions,
  storeDataElements,
  storeDataQuality,
  storeDashboardDetailRows,
  storeDashboardDemographics,
  storeCoverage,
  storeDimensionPerformance,
  storeFilterOptions,
  storeHighRiskDisaggregation,
  storeHighRiskDashboard,
  storeHighRiskGroupPerformance,
  storeHighRiskTrends,
  storeIMPerformance,
  storeMonthlyOverview,
  storeOrgUnitComparison,
  storeTrends,
  storeYears
} from "../services/dhis2StoreService.js";
import { refreshHealth } from "../services/refreshService.js";
import { resolveTargets } from "../services/targetService.js";
import { dashboardCacheMiddleware } from "../services/dashboardCache.js";

const router = Router();
router.use(dashboardCacheMiddleware);

router.get("/monthly-overview", async (req, res, next) => {
  try {
    const { period = "", orgUnit = "" } = req.query;
    if (!orgUnit) return res.status(400).json({ message: "orgUnit is required" });
    if ((req.query.source || "store") === "store") return res.json(storeMonthlyOverview({ period: String(period || ""), orgUnit: String(orgUnit), year: req.query.year, month: req.query.month, region: req.query.region, district: req.query.district, facility: req.query.facility, implementingPartner: req.query.implementingPartner }));
    if (req.query.source === "excel") return res.json(excelMonthlyOverview({ period: String(period || ""), orgUnit: String(orgUnit), year: req.query.year, month: req.query.month, region: req.query.region, district: req.query.district, facility: req.query.facility, implementingPartner: req.query.implementingPartner }));
    if (!period) return res.status(400).json({ message: "period is required for DHIS2 source" });
    res.json(await monthlyOverview({ period: String(period), orgUnit: String(orgUnit) }));
  } catch (error) {
    next(error);
  }
});

router.get("/data-elements", async (req, res, next) => {
  try {
    const { period = "", orgUnit = "", query = "" } = req.query;
    if (!orgUnit) return res.status(400).json({ message: "orgUnit is required" });
    if ((req.query.source || "store") === "store") return res.json(storeDataElements({ period: String(period || ""), orgUnit: String(orgUnit), query: String(query), year: req.query.year, month: req.query.month, region: req.query.region, district: req.query.district, facility: req.query.facility, implementingPartner: req.query.implementingPartner }));
    if (req.query.source === "excel") return res.json(excelDataElements({ period: String(period || ""), orgUnit: String(orgUnit), query: String(query), year: req.query.year, month: req.query.month, region: req.query.region, district: req.query.district, facility: req.query.facility, implementingPartner: req.query.implementingPartner }));
    if (!period) return res.status(400).json({ message: "period is required for DHIS2 source" });
    res.json(await dataElementsTable({ period: String(period), orgUnit: String(orgUnit), query: String(query) }));
  } catch (error) {
    next(error);
  }
});

router.get("/trends", async (req, res, next) => {
  try {
    const { dataElement = "", categoryOptionCombo = "", orgUnit = "", startPeriod = "", endPeriod = "" } = req.query;
    if (!dataElement || !orgUnit || !startPeriod || !endPeriod) {
      return res.status(400).json({ message: "dataElement, orgUnit, startPeriod and endPeriod are required" });
    }
    if ((req.query.source || "store") === "store") {
      return res.json(storeTrends({ dataElement: String(dataElement), orgUnit: String(orgUnit), startPeriod: String(startPeriod), endPeriod: String(endPeriod), year: req.query.year, month: req.query.month, region: req.query.region, district: req.query.district, facility: req.query.facility, implementingPartner: req.query.implementingPartner }));
    }
    if (req.query.source === "excel") {
      return res.json(excelTrends({ dataElement: String(dataElement), orgUnit: String(orgUnit), startPeriod: String(startPeriod), endPeriod: String(endPeriod), year: req.query.year, month: req.query.month, region: req.query.region, district: req.query.district, facility: req.query.facility, implementingPartner: req.query.implementingPartner }));
    }
    res.json(
      await trendData({
        dataElement: String(dataElement),
        categoryOptionCombo: String(categoryOptionCombo || ""),
        orgUnit: String(orgUnit),
        startPeriod: String(startPeriod),
        endPeriod: String(endPeriod)
      })
    );
  } catch (error) {
    next(error);
  }
});

router.get("/org-unit-comparison", async (req, res, next) => {
  try {
    const { period = "", dataElement = "", categoryOptionCombo = "" } = req.query;
    if (!dataElement) return res.status(400).json({ message: "dataElement is required" });
    if ((req.query.source || "store") === "store") {
      return res.json(storeOrgUnitComparison({ period: String(period || ""), dataElement: String(dataElement), year: req.query.year, month: req.query.month, region: req.query.region, district: req.query.district, facility: req.query.facility, implementingPartner: req.query.implementingPartner }));
    }
    if (req.query.source === "excel") {
      return res.json(excelOrgUnitComparison({ period: String(period || ""), dataElement: String(dataElement), year: req.query.year, month: req.query.month, region: req.query.region, district: req.query.district, facility: req.query.facility, implementingPartner: req.query.implementingPartner }));
    }
    if (!period) return res.status(400).json({ message: "period is required for DHIS2 source" });
    res.json(
      await orgUnitComparison({
        period: String(period),
        dataElement: String(dataElement),
        categoryOptionCombo: String(categoryOptionCombo || "")
      })
    );
  } catch (error) {
    next(error);
  }
});

router.get("/data-quality", async (req, res, next) => {
  try {
    const { period = "", orgUnit = "" } = req.query;
    if (!orgUnit) return res.status(400).json({ message: "orgUnit is required" });
    if ((req.query.source || "store") === "store") return res.json(storeDataQuality({ period: String(period || ""), orgUnit: String(orgUnit), year: req.query.year, month: req.query.month, region: req.query.region, district: req.query.district, facility: req.query.facility, implementingPartner: req.query.implementingPartner }));
    if (req.query.source === "excel") return res.json(excelDataQuality({ period: String(period || ""), orgUnit: String(orgUnit), year: req.query.year, month: req.query.month, region: req.query.region, district: req.query.district, facility: req.query.facility, implementingPartner: req.query.implementingPartner }));
    if (!period) return res.status(400).json({ message: "period is required for DHIS2 source" });
    res.json(await dataQuality({ period: String(period), orgUnit: String(orgUnit) }));
  } catch (error) {
    next(error);
  }
});

router.get("/high-risk-groups", async (req, res, next) => {
  try {
    const { period = "", orgUnit = "" } = req.query;
    if (!orgUnit) return res.status(400).json({ message: "orgUnit is required" });
    res.json(storeHighRiskDisaggregation({
      period: String(period || ""),
      orgUnit: String(orgUnit),
      year: req.query.year,
      month: req.query.month,
      region: req.query.region,
      district: req.query.district,
      facility: req.query.facility,
      implementingPartner: req.query.implementingPartner
    }));
  } catch (error) {
    next(error);
  }
});

router.get("/high-risk-trends", async (req, res, next) => {
  try {
    const { orgUnit = "", startPeriod = "", endPeriod = "" } = req.query;
    if (!orgUnit || !startPeriod || !endPeriod) {
      return res.status(400).json({ message: "orgUnit, startPeriod and endPeriod are required" });
    }
    res.json(storeHighRiskTrends({
      orgUnit: String(orgUnit),
      startPeriod: String(startPeriod),
      endPeriod: String(endPeriod),
      year: req.query.year,
      month: req.query.month,
      region: req.query.region,
      district: req.query.district,
      facility: req.query.facility,
      implementingPartner: req.query.implementingPartner
    }));
  } catch (error) {
    next(error);
  }
});

router.get("/high-risk-dashboard", async (req, res, next) => {
  try {
    const { period = "", orgUnit = "" } = req.query;
    if (!orgUnit) return res.status(400).json({ message: "orgUnit is required" });
    res.json(storeHighRiskDashboard({
      period: String(period || ""),
      orgUnit: String(orgUnit),
      year: req.query.year,
      month: req.query.month,
      region: req.query.region,
      district: req.query.district,
      facility: req.query.facility,
      implementingPartner: req.query.implementingPartner
    }));
  } catch (error) {
    next(error);
  }
});

router.get("/dashboard-demographics", async (req, res, next) => {
  try {
    const { dashboard = "", period = "", orgUnit = "" } = req.query;
    if (!dashboard || !orgUnit) return res.status(400).json({ message: "dashboard and orgUnit are required" });
    res.json(storeDashboardDemographics({
      dashboard: String(dashboard),
      period: String(period || ""),
      orgUnit: String(orgUnit),
      year: req.query.year,
      month: req.query.month,
      region: req.query.region,
      district: req.query.district,
      facility: req.query.facility,
      implementingPartner: req.query.implementingPartner
    }));
  } catch (error) {
    next(error);
  }
});

router.get("/data-element-options", async (req, res) => {
  res.json((req.query.source || "store") === "store" ? storeDataElementOptions() : excelDataElementOptions());
});

router.get("/years", async (req, res) => {
  res.json((req.query.source || "store") === "store" ? storeYears() : excelYears());
});

router.get("/filter-options", async (req, res) => {
  const filters = {
    year: req.query.year,
    month: req.query.month,
    period: req.query.period,
    region: req.query.region,
    district: req.query.district,
    facility: req.query.facility,
    implementingPartner: req.query.implementingPartner
  };
  res.json((req.query.source || "store") === "store" ? storeFilterOptions(filters) : excelFilterOptions(filters));
});

router.get("/targets", async (req, res) => {
  res.json(await resolveTargets({ year: req.query.year, partner: req.query.implementingPartner, funder: req.query.funder }));
});

router.get("/refresh-health", async (req, res) => {
  res.json(await refreshHealth());
});

router.get("/coverage", async (req, res) => {
  res.json(storeCoverage({
    orgUnit: req.query.orgUnit,
    year: req.query.year,
    month: req.query.month,
    period: req.query.period,
    region: req.query.region,
    district: req.query.district,
    facility: req.query.facility,
    implementingPartner: req.query.implementingPartner
  }));
});

router.get("/im-performance", async (req, res) => {
  let metrics = [];
  try {
    metrics = req.query.metrics ? JSON.parse(String(req.query.metrics)) : [];
  } catch {
    metrics = [];
  }
  res.json((req.query.source || "store") === "store"
    ? storeIMPerformance({ orgUnit: req.query.orgUnit, metrics, year: req.query.year, month: req.query.month, period: req.query.period, region: req.query.region, district: req.query.district, facility: req.query.facility, implementingPartner: req.query.implementingPartner })
    : excelIMPerformance({ orgUnit: req.query.orgUnit, metrics, year: req.query.year, month: req.query.month, period: req.query.period, region: req.query.region, district: req.query.district, facility: req.query.facility, implementingPartner: req.query.implementingPartner }));
});

router.get("/dimension-performance", async (req, res) => {
  let metrics = [];
  try {
    metrics = req.query.metrics ? JSON.parse(String(req.query.metrics)) : [];
  } catch {
    metrics = [];
  }
  res.json((req.query.source || "store") === "store"
    ? storeDimensionPerformance({ orgUnit: req.query.orgUnit, metrics, dimension: req.query.dimension, year: req.query.year, month: req.query.month, period: req.query.period, region: req.query.region, district: req.query.district, facility: req.query.facility, implementingPartner: req.query.implementingPartner })
    : { dimension: req.query.dimension || "district", metrics, rows: [] });
});

router.get("/detail-rows", async (req, res) => {
  let metrics = [];
  try {
    metrics = req.query.metrics ? JSON.parse(String(req.query.metrics)) : [];
  } catch {
    metrics = [];
  }
  res.json((req.query.source || "store") === "store"
    ? storeDashboardDetailRows({ orgUnit: req.query.orgUnit, metrics, year: req.query.year, month: req.query.month, period: req.query.period, region: req.query.region, district: req.query.district, facility: req.query.facility, implementingPartner: req.query.implementingPartner })
    : { metrics, rows: [] });
});

router.get("/high-risk-group-performance", async (req, res) => {
  let metrics = [];
  try {
    metrics = req.query.metrics ? JSON.parse(String(req.query.metrics)) : [];
  } catch {
    metrics = [];
  }
  res.json((req.query.source || "store") === "store"
    ? storeHighRiskGroupPerformance({ orgUnit: req.query.orgUnit, metrics, year: req.query.year, month: req.query.month, period: req.query.period, region: req.query.region, district: req.query.district, facility: req.query.facility, implementingPartner: req.query.implementingPartner })
    : { metrics, rows: [] });
});

export default router;
