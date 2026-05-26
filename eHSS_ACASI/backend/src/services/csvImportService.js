import XLSX from "xlsx";
import { appendRefreshLog, readCache, writeCache } from "./cacheService.js";
import { deleteDataValuesForPeriods, getStoreStats, upsertDataValues, upsertOrgUnitProfiles } from "./dhis2StoreService.js";

const normalizeHeader = (value = "") => String(value).toLowerCase().replace(/[^a-z0-9]/g, "");

const aliases = {
  period: ["period", "pe", "month", "reportingperiod"],
  orgUnit: ["orgunit", "orgunitid", "organisationunit", "organisationunitid", "ou", "siteid", "facilityid"],
  orgUnitName: ["orgunitname", "organisationunitname", "sitename", "facility", "facilityname"],
  dataElement: ["dataelement", "dataelementid", "dx", "de", "indicatorid"],
  dataElementName: ["dataelementname", "indicator", "indicatorname", "dataelementdisplayname", "name"],
  categoryOptionCombo: ["categoryoptioncombo", "categoryoptioncomboid", "coc", "disaggregation", "category"],
  categoryOptionComboName: ["categoryoptioncomboname", "categoryoptioncombo", "disaggregationname", "categoryname"],
  attributeOptionCombo: ["attributeoptioncombo", "attributeoptioncomboid", "aoc"],
  region: ["region"],
  district: ["district"],
  implementingPartner: ["implementingpartner", "implementingmechanism", "implementingmechanism2024", "mechanism", "im"],
  value: ["value", "val", "datavalue", "count"]
};

const findColumn = (headers, key) => {
  const wanted = new Set(aliases[key] || [key]);
  return headers.find((header) => wanted.has(normalizeHeader(header)));
};

const normalizePeriod = (value = "") => {
  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed?.y && parsed?.m) return `${parsed.y}${String(parsed.m).padStart(2, "0")}`;
  }
  const text = String(value || "").trim();
  if (/^\d+(\.\d+)?$/.test(text) && Number(text) > 20000) {
    const parsed = XLSX.SSF.parse_date_code(Number(text));
    if (parsed?.y && parsed?.m) return `${parsed.y}${String(parsed.m).padStart(2, "0")}`;
  }
  if (/^\d{6}$/.test(text)) return text;
  if (/^\d{4}-\d{2}/.test(text)) return text.slice(0, 7).replace("-", "");
  const date = new Date(text);
  if (!Number.isNaN(date.getTime())) return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
  return text;
};

const parseWorkbookRows = ({ fileName = "", content = "", base64 = "" }) => {
  const extension = fileName.toLowerCase().split(".").pop();
  if (extension === "xlsx" || extension === "xls") {
    const buffer = Buffer.from(base64 || content, "base64");
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json(sheet, { defval: "" });
  }
  const workbook = XLSX.read(content, { type: "string" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: "" });
};

export const importDataFile = async ({ fileName = "dhis2-import.csv", content = "", base64 = "", replacePeriods = false } = {}) => {
  const startedAt = new Date().toISOString();
  const rawRows = parseWorkbookRows({ fileName, content, base64 });
  const headers = Object.keys(rawRows[0] || {});
  const columns = Object.fromEntries(Object.keys(aliases).map((key) => [key, findColumn(headers, key)]));
  const warnings = [];
  for (const required of ["period", "orgUnit", "value"]) {
    if (!columns[required]) warnings.push(`Missing expected column for ${required}`);
  }
  if (!columns.dataElementName && !columns.dataElement) warnings.push("Missing expected column for dataElementName");
  const importedRows = rawRows
    .map((row) => {
      const dataElementName = String(row[columns.dataElementName] || row[columns.dataElement] || "").trim();
      const orgUnit = String(row[columns.orgUnit] || "").trim();
      const period = normalizePeriod(row[columns.period]);
      const value = Number(String(row[columns.value] ?? "0").replace(/,/g, ""));
      return {
        period,
        orgUnit,
        orgUnitName: String(row[columns.orgUnitName] || orgUnit || "").trim(),
        dataElement: String(row[columns.dataElement] || dataElementName).trim(),
        dataElementName,
        categoryOptionCombo: String(row[columns.categoryOptionCombo] || row[columns.categoryOptionComboName] || "").trim(),
        attributeOptionCombo: String(row[columns.attributeOptionCombo] || "").trim(),
        region: String(row[columns.region] || "").trim(),
        district: String(row[columns.district] || "").trim(),
        implementingPartner: String(row[columns.implementingPartner] || "").trim(),
        site: String(row[columns.orgUnitName] || row[columns.orgUnit] || orgUnit || "").trim(),
        value: Number.isFinite(value) ? value : 0
      };
    })
    .filter((row) => row.period && row.orgUnit && row.dataElementName);

  const fetchedAt = new Date().toISOString();
  const periods = [...new Set(importedRows.map((row) => row.period))].sort();
  const replacedRows = replacePeriods ? deleteDataValuesForPeriods(periods) : 0;
  if (importedRows.length) {
    upsertOrgUnitProfiles(importedRows);
    upsertDataValues(importedRows, fetchedAt);
  }
  const orgUnits = new Set(importedRows.map((row) => row.orgUnit));
  const dataElements = new Set(importedRows.map((row) => row.dataElementName));
  const log = {
    type: "csv-import",
    status: importedRows.length ? "success" : "failed",
    fileName,
    startedAt,
    finishedAt: new Date().toISOString(),
    rows: importedRows.length,
    replacedRows,
    replacePeriods: Boolean(replacePeriods),
    sourceRows: rawRows.length,
    periods,
    orgUnits: orgUnits.size,
    dataElements: dataElements.size,
    regions: new Set(importedRows.map((row) => row.region).filter(Boolean)).size,
    districts: new Set(importedRows.map((row) => row.district).filter(Boolean)).size,
    implementingPartners: new Set(importedRows.map((row) => row.implementingPartner).filter(Boolean)).size,
    warnings
  };
  await appendRefreshLog(log);
  await writeCache("last-csv-import", log);
  return {
    ...log,
    store: getStoreStats()
  };
};

export const csvImportStatus = async () => ({
  lastImport: await readCache("last-csv-import", null),
  store: getStoreStats()
});
