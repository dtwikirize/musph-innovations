import path from "path";
import fs from "fs/promises";
import { dhis2ApiPath, dhis2Get } from "./dhis2Client.js";
import { appendRefreshLog, ensureCacheDir, readCache, writeCache } from "./cacheService.js";
import { targetOrgUnitIds } from "../config/targetOrgUnits.js";
import { upsertDataValues, upsertDatasetMetadata } from "./dhis2StoreService.js";
import { cacheDir, monthlyDataCacheDir } from "../config/paths.js";

const DATASET_UID = process.env.DATASET_UID || "kLl7vQxaSAy";
const metadataCacheFile = `dataset-${DATASET_UID}-metadata`;
const monthlyDir = monthlyDataCacheDir;

const datasetFields =
  "id,name,code,periodType,description,dataSetElements[dataElement[id,name,code,shortName,valueType,domainType,aggregationType,categoryCombo[id,name,categories[id,name,categoryOptions[id,name,code]]]]],sections[id,name,dataElements[id,name,code]],organisationUnits[id,name,code,path,level],categoryCombo[id,name,categories[id,name,categoryOptions[id,name,code]]]";

const monthRange = (startPeriod, endPeriod) => {
  const out = [];
  let y = Number(startPeriod.slice(0, 4));
  let m = Number(startPeriod.slice(4, 6));
  const end = Number(endPeriod);
  while (Number(`${y}${String(m).padStart(2, "0")}`) <= end) {
    out.push(`${y}${String(m).padStart(2, "0")}`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
};

const monthlyFile = (period, orgUnit) => path.join(monthlyDir, `${period}-${orgUnit}.json`);
const monthlyRangeFile = (startPeriod, endPeriod, orgUnit) =>
  path.join(cacheDir, `monthly-data-range-${startPeriod}-${endPeriod}-${orgUnit}.json`);

const parseDataElementMeta = (dataset) => {
  const byId = {};
  for (const dse of dataset?.dataSetElements || []) {
    const de = dse.dataElement;
    if (!de?.id) continue;
    byId[de.id] = de;
  }
  return byId;
};

const parseOrgUnits = (dataset) => {
  const byId = {};
  for (const ou of dataset?.organisationUnits || []) byId[ou.id] = ou;
  return byId;
};

const transformDataValues = (values = [], metadata) => {
  const deMeta = parseDataElementMeta(metadata);
  const ouMeta = parseOrgUnits(metadata);
  return values.map((dv) => ({
    period: dv.period || "",
    orgUnit: dv.orgUnit || "",
    orgUnitName: ouMeta[dv.orgUnit]?.name || "",
    dataElement: dv.dataElement || "",
    dataElementName: deMeta[dv.dataElement]?.name || "",
    categoryOptionCombo: dv.categoryOptionCombo || "",
    categoryOptionComboName: "",
    attributeOptionCombo: dv.attributeOptionCombo || "",
    value: Number(dv.value || 0),
    storedBy: dv.storedBy || "",
    created: dv.created || "",
    lastUpdated: dv.lastUpdated || ""
  }));
};

export const fetchDhis2Me = async () => dhis2Get(dhis2ApiPath("/me"));

export const fetchDatasetMetadata = async ({ force = false } = {}) => {
  if (!force) {
    const cached = await readCache(metadataCacheFile, null);
    if (cached) return cached;
  }
  const data = await dhis2Get(dhis2ApiPath(`/dataSets/${DATASET_UID}`), { fields: datasetFields });
  await writeCache(metadataCacheFile, data);
  await writeCache("dataset-metadata", data);
  upsertDatasetMetadata(data);
  return data;
};

export const getDatasetOrgUnits = async () => {
  const meta = await fetchDatasetMetadata();
  return meta.organisationUnits || [];
};

export const getWatchlistOrgUnits = async () => {
  const all = await getDatasetOrgUnits();
  if (!targetOrgUnitIds.length) return [];
  const set = new Set(targetOrgUnitIds);
  return all.filter((ou) => set.has(ou.id));
};

export const fetchMonthlyData = async ({ period, orgUnit, force = false }) => {
  await ensureCacheDir();
  await fs.mkdir(monthlyDir, { recursive: true });
  const file = monthlyFile(period, orgUnit);
  if (!force) {
    try {
      const raw = await fs.readFile(file, "utf-8");
      return JSON.parse(raw);
    } catch {}
  }
  const metadata = await fetchDatasetMetadata();
  const raw = await dhis2Get(dhis2ApiPath("/dataValueSets.json"), { dataSet: DATASET_UID, period, orgUnit });
  const rows = transformDataValues(raw.dataValues || [], metadata);
  const payload = { period, orgUnit, rows, fetchedAt: new Date().toISOString() };
  await fs.writeFile(file, JSON.stringify(payload, null, 2), "utf-8");
  upsertDataValues(rows, payload.fetchedAt);
  return payload;
};

export const fetchMonthlyDataRange = async ({ startPeriod, endPeriod, orgUnit, force = false }) => {
  await ensureCacheDir();
  const cacheFile = monthlyRangeFile(startPeriod, endPeriod, orgUnit);
  if (!force) {
    try {
      const raw = await fs.readFile(cacheFile, "utf-8");
      return JSON.parse(raw);
    } catch {}
  }
  const periods = monthRange(startPeriod, endPeriod);
  const results = [];
  for (const period of periods) {
    const month = await fetchMonthlyData({ period, orgUnit, force });
    results.push(...month.rows);
  }
  const payload = { startPeriod, endPeriod, orgUnit, periods, rows: results, fetchedAt: new Date().toISOString() };
  await fs.writeFile(cacheFile, JSON.stringify(payload, null, 2), "utf-8");
  return payload;
};

export const monthlyOverview = async ({ period, orgUnit }) => {
  const [meta, month] = await Promise.all([fetchDatasetMetadata(), fetchMonthlyData({ period, orgUnit })]);
  const expected = (meta.dataSetElements || []).length;
  const completed = month.rows.length;
  return {
    period,
    orgUnit,
    orgUnitName: month.rows[0]?.orgUnitName || "",
    totalSubmittedValues: completed,
    dataElementsInDataset: expected,
    completedFields: completed,
    missingFields: Math.max(expected - completed, 0),
    lastUpdated: month.rows.map((r) => r.lastUpdated).filter(Boolean).sort().at(-1) || null
  };
};

export const listReportingOrgUnits = async ({ period }) => {
  const metadata = await fetchDatasetMetadata();
  const units = await getDatasetOrgUnits();
  const rows = [];
  for (const ou of units) {
    const month = await fetchMonthlyData({ period, orgUnit: ou.id });
    if (month.rows.length > 0) rows.push({ id: ou.id, name: ou.name, valueCount: month.rows.length });
  }
  return {
    period,
    totalOrgUnits: metadata.organisationUnits?.length || 0,
    reportingOrgUnits: rows
  };
};

export const dataElementsTable = async ({ period, orgUnit, query = "" }) => {
  const [meta, month] = await Promise.all([fetchDatasetMetadata(), fetchMonthlyData({ period, orgUnit })]);
  const byDe = {};
  for (const row of month.rows) byDe[row.dataElement] = row;
  const q = query.toLowerCase().trim();
  const rows = (meta.dataSetElements || [])
    .map((dse) => {
      const de = dse.dataElement;
      const found = byDe[de.id];
      return {
        dataElement: de.id,
        code: de.code || "",
        name: de.name || "",
        value: found?.value ?? "",
        categoryOptionCombo: found?.categoryOptionCombo || "",
        lastUpdated: found?.lastUpdated || ""
      };
    })
    .filter((r) => !q || r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q));
  return rows;
};

export const trendData = async ({ dataElement, categoryOptionCombo, orgUnit, startPeriod, endPeriod }) => {
  const range = await fetchMonthlyDataRange({ startPeriod, endPeriod, orgUnit });
  return range.periods.map((period) => {
    const row = range.rows.find(
      (r) => r.period === period && r.dataElement === dataElement && (!categoryOptionCombo || r.categoryOptionCombo === categoryOptionCombo)
    );
    return { period, value: row?.value || 0 };
  });
};

export const orgUnitComparison = async ({ period, dataElement, categoryOptionCombo }) => {
  const orgUnits = await getDatasetOrgUnits();
  const rows = [];
  for (const ou of orgUnits) {
    const month = await fetchMonthlyData({ period, orgUnit: ou.id });
    const row = month.rows.find(
      (r) => r.dataElement === dataElement && (!categoryOptionCombo || r.categoryOptionCombo === categoryOptionCombo)
    );
    rows.push({ orgUnit: ou.id, orgUnitName: ou.name, value: row?.value || 0 });
  }
  return rows;
};

export const dataQuality = async ({ period, orgUnit }) => {
  const [meta, month] = await Promise.all([fetchDatasetMetadata(), fetchMonthlyData({ period, orgUnit })]);
  const allDe = new Set((meta.dataSetElements || []).map((dse) => dse.dataElement.id));
  const presentDe = new Set(month.rows.map((r) => r.dataElement));
  const missing = [...allDe].filter((id) => !presentDe.has(id));
  const zeroValues = month.rows.filter((r) => Number(r.value) === 0).length;
  const lateUpdates = month.rows.filter((r) => r.lastUpdated && !String(r.lastUpdated).startsWith(period.slice(0, 4))).length;
  return {
    period,
    orgUnit,
    missingDataElements: missing,
    zeroValues,
    lateUpdates,
    completeness: allDe.size === 0 ? 0 : Number(((presentDe.size / allDe.size) * 100).toFixed(1))
  };
};

export const refreshMetadata = async () => {
  const startedAt = new Date().toISOString();
  try {
    const data = await fetchDatasetMetadata({ force: true });
    const log = { type: "metadata", status: "success", startedAt, finishedAt: new Date().toISOString(), count: data.dataSetElements?.length || 0 };
    await appendRefreshLog(log);
    return log;
  } catch (error) {
    const log = { type: "metadata", status: "failed", startedAt, finishedAt: new Date().toISOString(), error: error.message };
    await appendRefreshLog(log);
    throw error;
  }
};

export const refreshMonth = async ({ period, orgUnit }) => {
  const startedAt = new Date().toISOString();
  try {
    const data = await fetchMonthlyData({ period, orgUnit, force: true });
    const log = { type: "month", status: "success", period, orgUnit, startedAt, finishedAt: new Date().toISOString(), values: data.rows.length };
    await appendRefreshLog(log);
    return log;
  } catch (error) {
    const log = { type: "month", status: "failed", period, orgUnit, startedAt, finishedAt: new Date().toISOString(), error: error.message };
    await appendRefreshLog(log);
    throw error;
  }
};

export const refreshYear = async ({ year, orgUnit }) => {
  const startPeriod = `${year}01`;
  const endPeriod = `${year}12`;
  const startedAt = new Date().toISOString();
  try {
    const data = await fetchMonthlyDataRange({ startPeriod, endPeriod, orgUnit, force: true });
    const log = { type: "year", status: "success", year, orgUnit, startedAt, finishedAt: new Date().toISOString(), values: data.rows.length };
    await appendRefreshLog(log);
    return log;
  } catch (error) {
    const log = { type: "year", status: "failed", year, orgUnit, startedAt, finishedAt: new Date().toISOString(), error: error.message };
    await appendRefreshLog(log);
    throw error;
  }
};

export const refreshAllPeriods = async ({ orgUnit, startYear = "2024" }) => {
  const now = new Date();
  const endPeriod = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const startPeriod = `${startYear}01`;
  return fetchMonthlyDataRange({ startPeriod, endPeriod, orgUnit, force: true });
};
