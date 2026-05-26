import { dhis2Get } from "./dhis2Client.js";
import { dhis2Mappings, mappingStatus } from "../config/dhis2Mappings.js";
import { mockSummary, mockTrend } from "../data/mockDashboardData.js";

const hasUidMappings = () => mappingStatus().totalMissing < 5;

export const fetchDhis2Me = async () => dhis2Get("/api/me");

export const getMetadataStatus = () => {
  const status = mappingStatus();
  return {
    readyForAnalytics: status.totalMissing === 0,
    ...status
  };
};

export const searchMetadata = async (type, query = "") => {
  const endpointMap = {
    "data-elements": "/api/dataElements.json",
    indicators: "/api/indicators.json",
    "org-units": "/api/organisationUnits.json",
    programs: "/api/programs.json"
  };
  const fieldsMap = {
    "data-elements": "id,name,code,shortName,valueType",
    indicators: "id,name,code,numeratorDescription,denominatorDescription",
    "org-units": "id,name,code,level,path",
    programs: "id,name,code,shortName"
  };
  const endpoint = endpointMap[type];
  if (!endpoint) throw new Error("Unsupported metadata type");
  const keyMap = {
    "data-elements": "dataElements",
    indicators: "indicators",
    "org-units": "organisationUnits",
    programs: "programs"
  };
  const params = { fields: fieldsMap[type], paging: "true", pageSize: 50 };
  if (query) params.filter = `name:ilike:${query}`;
  const data = await dhis2Get(endpoint, params);
  return data[keyMap[type]] || [];
};

export const fetchAnalyticsOrMock = async () => {
  if (!hasUidMappings()) return { mode: "mock", summary: mockSummary, trend: mockTrend };
  return {
    mode: "live",
    summary: mockSummary,
    trend: mockTrend
  };
};

export const normalizeAnalyticsRows = (rows = []) =>
  rows.map((row) => ({
    site_id: row.site_id || "",
    site_name: row.site_name || "",
    period_id: row.period_id || "",
    period_name: row.period_name || "",
    agency: row.agency || "",
    mechanism: row.mechanism || "",
    region: row.region || "",
    district: row.district || "",
    population_type: row.population_type || "",
    population_category: row.population_category || "",
    indicator_code: row.indicator_code || "",
    indicator_name: row.indicator_name || "",
    value: Number(row.value || 0)
  }));

export const getFilterOptions = async () => ({
  financialYears: ["FY2024/25", "FY2025/26"],
  quarters: ["Q1", "Q2", "Q3", "Q4"],
  months: ["2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03"],
  agencies: ["CDC", "USAID", "Global Fund"],
  mechanisms: ["eHSS", "ACASI"],
  regions: ["Central", "Eastern", "Northern", "Western"],
  districts: ["Kampala", "Wakiso", "Gulu", "Mbarara"],
  sites: ["Site A", "Site B", "Site C"],
  populationTypes: ["KP", "PP"],
  populationCategories: [...dhis2Mappings.populationGroups.keyPopulations, ...dhis2Mappings.populationGroups.priorityPopulations],
  indicatorGroups: ["Enrollment", "Testing", "ART", "PrEP", "Risk", "Site Performance"]
});
