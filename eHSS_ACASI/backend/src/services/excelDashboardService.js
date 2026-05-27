import path from "path";
import fs from "fs";
import XLSX from "xlsx";
import { monthlyDataCacheDir } from "../config/paths.js";
import highRiskCategoryCombos from "../config/highRiskCategoryCombos.js";
import { appendRefreshLog, readCache, writeCache } from "./cacheService.js";

const uploadDir = path.resolve(process.cwd(), "eHSS_ACASI", "uploads");
const normalizeHeader = (value = "") => String(value).toLowerCase().replace(/[^a-z0-9]/g, "");
const columnAliases = {
  dataElement: ["dataelement", "dataelementname", "indicator", "indicatorname"],
  categoryOptionCombo: ["categoryoptioncombo", "category", "disaggregation"],
  orgUnit: ["organisationunit", "orgunit", "facility", "facilityname", "site", "sitename"],
  district: ["district"],
  region: ["region"],
  implementingPartner: ["implementingmechanism2024", "implementingmechanism", "implementingpartner", "mechanism", "im"],
  period: ["period", "month", "reportingperiod"],
  value: ["value", "count", "datavalue", "val"]
};

const resolveExcelPath = () => {
  const searchDirs = [
    process.cwd(),
    path.resolve(process.cwd(), "eHSS_ACASI"),
    uploadDir,
    path.resolve(process.cwd(), "eHSS_ACASI/backend"),
    path.resolve(process.cwd(), "../"),
    path.resolve(process.cwd(), "../../")
  ];
  const candidates = [
    process.env.ACASI_EXCEL_PATH,
    path.resolve(process.cwd(), "eHSS_Data_With_District_Region.xlsx"),
    path.resolve(process.cwd(), "eHSS_ACASI", "eHSS_Data_With_District_Region.xlsx"),
    path.resolve(process.cwd(), "eHSS_ACASI Cumm Jan 2026.xlsx"),
    path.resolve(process.cwd(), "../eHSS_ACASI Cumm Jan 2026.xlsx"),
    path.resolve(process.cwd(), "../../eHSS_ACASI Cumm Jan 2026.xlsx"),
    ...searchDirs.flatMap((dir) => {
      try {
        return fs
          .readdirSync(dir, { withFileTypes: true })
          .filter((entry) => entry.isFile() && /\.xlsx$/i.test(entry.name) && !entry.name.startsWith("~$"))
          .map((entry) => path.join(dir, entry.name));
      } catch {
        return [];
      }
    })
  ].filter(Boolean);
  const found = candidates.find((p) => fs.existsSync(p));
  if (found) return found;
  return candidates[0];
};

let activeExcelPath = resolveExcelPath();
let cache = null;
const cacheDirs = () => (fs.existsSync(monthlyDataCacheDir) ? [monthlyDataCacheDir] : []);

const normalizePeriod = (value) => {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}${String(value.getMonth() + 1).padStart(2, "0")}`;
  }
  const s = String(value).replace(/\s+/g, " ").trim();
  const monthMatch = /^(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{4})$/i.exec(s);
  if (monthMatch) {
    const monthNames = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const monthIndex = monthNames.findIndex((name) => monthMatch[1].toLowerCase().startsWith(name));
    if (monthIndex >= 0) return `${monthMatch[2]}${String(monthIndex + 1).padStart(2, "0")}`;
  }
  if (/^\d{6}$/.test(s)) return s;
  if (/^\d{8}$/.test(s)) return s.slice(0, 6);
  if (/^\d{4}-\d{2}/.test(s)) return s.slice(0, 4) + s.slice(5, 7);
  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed?.y && parsed?.m) return `${parsed.y}${String(parsed.m).padStart(2, "0")}`;
    return String(value);
  }
  if (/^\d+(\.\d+)?$/.test(s) && Number(s) > 20000) {
    const parsed = XLSX.SSF.parse_date_code(Number(s));
    if (parsed?.y && parsed?.m) return `${parsed.y}${String(parsed.m).padStart(2, "0")}`;
  }
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const isAll = (orgUnit) => !orgUnit || orgUnit === "__ALL__";
const cleanValue = (value = "") => String(value || "").replace(/\s+/g, " ").trim();

const findColumn = (headers, key) => {
  const wanted = new Set(columnAliases[key] || [key]);
  return headers.find((header) => wanted.has(normalizeHeader(header)));
};

const workbookRows = (workbook, preferredSheet = "") => {
  const sheetName = preferredSheet && workbook.Sheets[preferredSheet] ? preferredSheet : workbook.SheetNames[0];
  return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
};

const isLongWorkbook = (rows = []) => {
  const headers = Object.keys(rows[0] || {});
  return Boolean(findColumn(headers, "dataElement") && findColumn(headers, "orgUnit") && findColumn(headers, "period") && findColumn(headers, "value"));
};

const groupAlias = (group = "") => {
  const label = cleanValue(group).replace(/\t/g, "");
  const lower = label.toLowerCase();
  if (!label || /^[A-Za-z0-9]{11}$/.test(label)) return "";
  if (lower === "other pp" || lower.includes("other pp")) return "Other PP";
  if (lower.includes("boda")) return "BB";
  if (lower.includes("client of sex")) return "CSW";
  if (lower.includes("fisher")) return "FF";
  if (lower === "sw" || lower.includes("sex worker")) return "SW";
  if (lower === "msm") return "MSM";
  if (lower.includes("pwid")) return "PWID";
  return label;
};

const riskPopulationCategoryCombos = {
  I4ApaQOaMZb: "Overall|Female|15-24 years",
  Py6L0SrM5Rq: "Overall|Female|25-34 years",
  MlktoowmGoV: "Overall|Female|35+ years",
  fUEaEibzbGN: "Overall|Male|15-24 years",
  CYDT2IHCpoD: "Overall|Male|25-34 years",
  TIKGuOsCbxn: "Overall|Male|35+ years",
  gPh78YMivBV: "Key populations|Female|15-24 years",
  jsE4ZI1772a: "Key populations|Female|25-34 years",
  pWxTxiEqzU5: "Key populations|Female|35+ years",
  ShoHsZYE9yy: "Key populations|Male|15-24 years",
  NZ1ZEtgWdRh: "Key populations|Male|25-34 years",
  jXgTQI3BjE3: "Key populations|Male|35+ years",
  SgJzagl4E6r: "Priority Populations|Female|15-24 years",
  sP5cl35IbeP: "Priority Populations|Female|25-34 years",
  mUHrgZ4QxVf: "Priority Populations|Female|35+ years",
  r51CM6sxBbt: "Priority Populations|Male|15-24 years",
  iX9FScGNO9A: "Priority Populations|Male|25-34 years",
  iF5q7Xgu5aw: "Priority Populations|Male|35+ years"
};

const populationCategoryCombos = {
  Gsat5iLePQU: "SW",
  TTzV5hdjMDm: "AGYW",
  ugq0NwjAR0E: "Client of Sex workers",
  Krxyurn4ECr: "Other PP",
  Zwl5hPIxNzp: "ABYM",
  Yih0JAjjx88: "MP",
  CwBkDUUCMZQ: "DC",
  nBdRNXG39sr: "Boda Boda",
  tztVjke6W8D: "PBFW",
  ZtbY5x4eDcG: "NIDU",
  aow4ghKuk4V: "Fisher Folks",
  eoO0OksF7Fc: "UF",
  bLplzzja8LS: "MAR",
  ER3u5UFhrkT: "PWID",
  LGg0YEzaQlm: "TG"
};

const comboOptions = (comboId = "") =>
  String(highRiskCategoryCombos[comboId] || riskPopulationCategoryCombos[comboId] || populationCategoryCombos[comboId] || "")
    .split("|")
    .map(cleanValue)
    .filter(Boolean);

const comboParts = (comboId = "") => {
  const options = comboOptions(comboId);
  const sex = options.find((option) => /^(female|male)$/i.test(option)) || "";
  const age = options.find((option) => /\d/.test(option) && /years?/i.test(option)) || "";
  const population = options.find((option) => /^(overall|key populations|priority populations)$/i.test(option)) || "";
  const group = groupAlias(options.find((option) => option !== sex && option !== age) || "");
  return { options, sex, age, group, population };
};

const longRowsToDashboardRows = (rows = []) => {
  const headers = Object.keys(rows[0] || {});
  const columns = Object.fromEntries(Object.keys(columnAliases).map((key) => [key, findColumn(headers, key)]));
  const groups = new Map();
  const masterMap = new Map();
  const details = [];

  for (const source of rows) {
    const periodid = normalizePeriod(source[columns.period]);
    const site = cleanValue(source[columns.orgUnit]);
    const dataElement = cleanValue(source[columns.dataElement]);
    if (!periodid || !site || !dataElement) continue;

    const key = `${periodid}::${site}`;
    const district = cleanValue(source[columns.district]);
    const region = cleanValue(source[columns.region]);
    const mechanism = cleanValue(source[columns.implementingPartner]);
    const value = Number(String(source[columns.value] ?? "0").replace(/,/g, ""));
    const categoryOptionCombo = cleanValue(source[columns.categoryOptionCombo]);
    const combo = comboParts(categoryOptionCombo);

    if (!groups.has(key)) {
      groups.set(key, {
        agency: mechanism,
        mechanism,
        region,
        district,
        site,
        site_id: site,
        periodid,
        unique_id: `${periodid}-${site}`,
        period: `${periodid.slice(0, 4)}-${periodid.slice(4, 6)}-01`
      });
    }
    const target = groups.get(key);
    target[dataElement] = (Number(target[dataElement]) || 0) + (Number.isFinite(value) ? value : 0);
    details.push({
      agency: mechanism,
      mechanism,
      region,
      district,
      site,
      site_id: site,
      periodid,
      period: `${periodid.slice(0, 4)}-${periodid.slice(4, 6)}-01`,
      dataElement,
      categoryOptionCombo,
      value: Number.isFinite(value) ? value : 0,
      group: combo.group,
      population: combo.population,
      sex: combo.sex,
      age: combo.age
    });

    if (!masterMap.has(site)) {
      masterMap.set(site, { agency: mechanism, mechanism, region, district, site, site_id: site });
    }
  }

  return { master: [...masterMap.values()], allExcel: [...groups.values()], details };
};

const ensure = () => {
  if (cache) return cache;
  activeExcelPath = fs.existsSync(activeExcelPath || "") ? activeExcelPath : resolveExcelPath();
  if (!activeExcelPath || !fs.existsSync(activeExcelPath)) {
    cache = { master: [], allExcel: [], all: [] };
    return cache;
  }
  const wb = XLSX.readFile(activeExcelPath, { cellDates: true });
  const firstRows = workbookRows(wb);
  const parsedWorkbook = isLongWorkbook(firstRows)
    ? longRowsToDashboardRows(firstRows)
    : {
        master: XLSX.utils.sheet_to_json(wb.Sheets["Master"] || wb.Sheets[wb.SheetNames[0]], { defval: "" }),
        allExcel: XLSX.utils.sheet_to_json(wb.Sheets["All_data"] || wb.Sheets[wb.SheetNames[1]] || wb.Sheets[wb.SheetNames[0]], { defval: "" }),
        details: []
      };
  const master = parsedWorkbook.master;
  const allExcel = parsedWorkbook.allExcel;
  const details = parsedWorkbook.details || [];
  const masterBySiteId = Object.fromEntries(master.map((m) => [String(m.site_id || ""), m]));
  const excelKeys = new Set(
    allExcel.map((r) => `${normalizePeriod(r.periodid || r.period)}::${String(r.site_id || "")}`)
  );

  const groups = new Map();
  for (const dir of cacheDirs()) {
    for (const file of fs.readdirSync(dir)) {
      const m = /^(\d{6})-(.+)\.json$/.exec(file);
      if (!m) continue;
      const period = m[1];
      const orgUnit = m[2];
      const key = `${period}::${orgUnit}`;
      if (excelKeys.has(key)) continue;
      try {
        const parsed = JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8"));
        const rows = parsed?.rows || [];
        if (!rows.length) continue;
        if (!groups.has(key)) {
          const base = masterBySiteId[String(orgUnit)] || {};
          groups.set(key, {
            agency: base.agency || "",
            mechanism: base.mechanism || "",
            region: base.region || "",
            district: base.district || "",
            site: base.site || rows[0]?.orgUnitName || "",
            site_id: String(orgUnit),
            periodid: period,
            unique_id: `${period}-${orgUnit}`,
            period: `${period.slice(0, 4)}-${period.slice(4, 6)}-01`
          });
        }
        const target = groups.get(key);
        for (const r of rows) {
          const k = r.dataElementName || r.dataElement;
          if (!k) continue;
          target[k] = (Number(target[k]) || 0) + (Number(r.value) || 0);
        }
      } catch {}
    }
  }

  const all = [...allExcel, ...groups.values()];
  cache = { master, allExcel, all, details };
  return cache;
};

const keyCols = {
  enrolled: "eHES_RE01: Total individuals presenting for Interviewing by entry points",
  newClients: "eHES_RE02: Number of new clients presenting",
  returning: "eHES_RE03: Number returning clients presenting",
  completed: "eHES_AC01: Number of interviews completed",
  aborted: "eHES_AC02: Number of interviews aborted"
};

const highRiskElements = [
  { group: "Key populations", dataElement: "eHES_RC01: Key populations classified through ACASI by Category" },
  { group: "Priority populations", dataElement: "eHES_RC02: Priority populations classified through ACASI" }
];

const riskBehaviourElements = [
  { group: "Depression", dataElement: "eHES_RB01: Experienced depression" },
  { group: "Alcohol Abuse", dataElement: "eHES_RB02: Alcohol abuse problem" },
  { group: "No Condom Use", dataElement: "eHES_RB03: No condom use" },
  { group: "Drug Use", dataElement: "eHES_RB04: Drug use" },
  { group: "Sexual Violence", dataElement: "eHES_RB05: Clients that experienced rape/Sexual violence" },
  { group: "Multiple Partners", dataElement: "eHES_RB06: Clients with multiple sexual partners" }
];

const fixedFields = new Set(["agency", "mechanism", "region", "district", "site", "site_id", "periodid", "period", "unique_id"]);

const applySlicers = (rows, filters = {}) => {
  const { year, month, region, district, facility, implementingPartner, period, orgUnit } = filters;
  return rows.filter((r) => {
    const p = normalizePeriod(r.periodid || r.period);
    const okYear = !year || p.startsWith(String(year));
    const okMonth = !month || p === `${year || p.slice(0, 4)}${String(month).padStart(2, "0")}` || p.endsWith(String(month).padStart(2, "0"));
    const okPeriod = !period || p === normalizePeriod(period);
    const okRegion = !region || r.region === region;
    const okDistrict = !district || r.district === district;
    const okFacility = !facility || r.site === facility;
    const okIM = !implementingPartner || r.mechanism === implementingPartner;
    const okOrg = isAll(orgUnit) || !orgUnit || r.site_id === orgUnit;
    return okYear && okMonth && okPeriod && okRegion && okDistrict && okFacility && okIM && okOrg;
  });
};

const rowsForScope = ({ orgUnit = "__ALL__", ...filters } = {}) => {
  const { all } = ensure();
  let rows = applySlicers(all, { ...filters, orgUnit });
  if (!rows.length && (filters.period || filters.month)) {
    rows = applySlicers(all, { ...filters, period: "", month: filters.month || "", orgUnit });
  }
  if (!rows.length && filters.year) {
    rows = applySlicers(all, { ...filters, period: "", month: "", orgUnit });
  }
  return rows;
};

const detailRowsForScope = ({ orgUnit = "__ALL__", ...filters } = {}) => {
  const { details = [] } = ensure();
  return applySlicers(details, { ...filters, orgUnit })
    .filter((row) => highRiskElements.some((item) => item.dataElement === row.dataElement))
    .filter((row) => row.group && row.group !== "Other PP");
};

const highRiskTotalForScope = (filters = {}) =>
  detailRowsForScope(filters).reduce((sum, row) => sum + num(row.value), 0);

const highRiskFallbackValue = (row = {}) => {
  const classified = highRiskElements.reduce((sum, item) => sum + num(row[item.dataElement]), 0);
  if (classified > 0) return classified;
  return riskBehaviourElements.reduce((sum, item) => sum + num(row[item.dataElement]), 0);
};

const normalizeMetrics = (metrics = []) =>
  metrics.filter((metric) => metric?.label && (metric?.dataElement || metric?.formula));

const emptyMetricValues = (metrics = []) => Object.fromEntries(metrics.map((metric) => [metric.label, 0]));

const highRiskValue = (row = {}) => {
  return num(row.__highRiskTotal) || highRiskFallbackValue(row);
};

const addDirectMetricValues = (bucket, row, metrics = []) => {
  for (const metric of metrics) {
    if (metric?.formula?.type === "highRisk") {
      continue;
    }
    if (metric.dataElement) {
      bucket.values[metric.label] += num(row[metric.dataElement]);
    }
  }
};

const metricValue = (bucket, metric, metrics = []) => {
  if (metric?.formula?.type === "highRisk") return num(bucket.values?.[metric.label]);
  if (metric?.formula?.type === "sum") {
    return (metric.formula.labels || []).reduce((sum, label) => {
      const source = metrics.find((item) => item.label === label);
      return sum + (source ? metricValue(bucket, source, metrics) : 0);
    }, 0);
  }
  const raw = num(bucket.values?.[metric.label]);
  const highRiskMetric = metrics.find((item) => item?.formula?.type === "highRisk");
  const denominator = highRiskMetric ? num(bucket.values?.[highRiskMetric.label]) : 0;
  return metric?.capToHighRisk && denominator > 0 ? Math.min(raw, denominator) : raw;
};

const highRiskGroupRows = (rows = []) => {
  const detailRows = rows.filter((row) => row.dataElement && row.group);
  let groups = [];
  if (detailRows.length) {
    const byGroup = new Map();
    for (const row of detailRows) {
      if (!row.group || row.group === "Other PP") continue;
      if (!byGroup.has(row.group)) byGroup.set(row.group, { group: row.group, dataElement: row.dataElement, value: 0 });
      byGroup.get(row.group).value += num(row.value);
    }
    groups = [...byGroup.values()].filter((item) => item.value > 0);
  } else {
    const classify = (items) =>
      items
        .map((item) => ({
          group: item.group,
          dataElement: item.dataElement,
          value: rows.reduce((sum, row) => sum + num(row[item.dataElement]), 0)
        }))
        .filter((item) => item.value > 0);
    const primary = classify(highRiskElements);
    groups = primary.length ? primary : classify(riskBehaviourElements);
  }
  const total = groups.reduce((sum, row) => sum + row.value, 0);
  return {
    total,
    groups: groups
      .map((row) => ({ ...row, share: total ? Number(((row.value / total) * 100).toFixed(1)) : 0 }))
      .sort((a, b) => b.value - a.value || a.group.localeCompare(b.group))
  };
};

const directRiskPopulationRows = (metrics = [], filters = {}) => {
  const { details = [], all = [] } = ensure();
  const scopedDetails = applySlicers(details, filters);
  const scopedRows = applySlicers(all, filters);
  const buckets = [
    { group: "High Risk Groups", values: emptyMetricValues(metrics) },
    { group: "No Risk Population", values: emptyMetricValues(metrics) }
  ];
  const highRiskBucket = buckets[0];
  const noRiskBucket = buckets[1];

  for (const metric of metrics) {
    if (!metric.dataElement) continue;
    const detailRows = scopedDetails.filter((row) => row.dataElement === metric.dataElement);
    const hasPopulationRows = detailRows.some((row) => row.population);
    const hasGroupRows = detailRows.some((row) => row.group);

    if (hasPopulationRows) {
      const highRiskValue = detailRows
        .filter((row) => /^(key populations|priority populations)$/i.test(row.population))
        .reduce((sum, row) => sum + num(row.value), 0);
      const overallValue = detailRows
        .filter((row) => /^overall$/i.test(row.population))
        .reduce((sum, row) => sum + num(row.value), 0);
      highRiskBucket.values[metric.label] = highRiskValue;
      noRiskBucket.values[metric.label] = Math.max(overallValue - highRiskValue, 0);
      continue;
    }

    if (hasGroupRows) {
      highRiskBucket.values[metric.label] = detailRows
        .filter((row) => row.group && row.group !== "Other PP")
        .reduce((sum, row) => sum + num(row.value), 0);
      noRiskBucket.values[metric.label] = detailRows
        .filter((row) => row.group === "Other PP")
        .reduce((sum, row) => sum + num(row.value), 0);
      continue;
    }

    highRiskBucket.values[metric.label] = scopedRows.reduce((sum, row) => sum + num(row[metric.dataElement]), 0);
  }

  return buckets.map((bucket) => ({
    ...bucket,
    values: Object.fromEntries(metrics.map((metric) => [metric.label, metricValue(bucket, metric, metrics)]))
  }));
};

export const excelOrgUnits = ({ mode = "all", period = "", region = "", district = "", facility = "", implementingPartner = "" }) => {
  const { master, all } = ensure();
  const filteredMaster = master.filter((m) => {
    if (region && m.region !== region) return false;
    if (district && m.district !== district) return false;
    if (facility && m.site !== facility) return false;
    if (implementingPartner && m.mechanism !== implementingPartner) return false;
    return true;
  });
  if (mode === "reporting" && period) {
    const p = normalizePeriod(period);
    const sites = new Set(all.filter((r) => normalizePeriod(r.periodid || r.period) === p).map((r) => r.site_id));
    return filteredMaster.filter((m) => sites.has(m.site_id)).map((m) => ({ id: m.site_id, name: m.site }));
  }
  return [{ id: "__ALL__", name: "All Sites (Aggregate)" }, ...filteredMaster.map((m) => ({ id: m.site_id, name: m.site }))];
};

export const excelMonthlyOverview = ({ period, orgUnit, ...filters }) => {
  const { all } = ensure();
  const p = normalizePeriod(period);
  const rows = applySlicers(all, { ...filters, period: p, orgUnit });
  const row = rows[0] || {};
  const fixed = new Set(["agency", "mechanism", "region", "district", "site", "site_id", "periodid", "period", "unique_id"]);
  const fields = Object.keys(row).filter((k) => !fixed.has(k));
  const filledFields = fields.filter((k) => num(row[k]) > 0).length;
  const enrolled = rows.reduce((a, r) => a + num(r[keyCols.enrolled]), 0);
  const completed = rows.reduce((a, r) => a + num(r[keyCols.completed]), 0);
  const aborted = rows.reduce((a, r) => a + num(r[keyCols.aborted]), 0);
  const expected = fields.length || 35;
  return {
    period: p,
    orgUnit,
    orgUnitName: isAll(orgUnit) ? "All Sites (Aggregate)" : rows[0]?.site || "",
    totalSubmittedValues: filledFields,
    dataElementsInDataset: expected,
    completedFields: filledFields,
    missingFields: Math.max(expected - filledFields, 0),
    EnrolledClients: enrolled,
    NewClients: rows.reduce((a, r) => a + num(r[keyCols.newClients]), 0),
    ReturningClients: rows.reduce((a, r) => a + num(r[keyCols.returning]), 0),
    AbortedInterviews: aborted,
    CompletionRate: enrolled ? Number((completed / enrolled).toFixed(3)) : 0
  };
};

export const excelDataElements = ({ period, orgUnit, query = "", ...filters }) => {
  const { all } = ensure();
  const p = normalizePeriod(period);
  const picked = applySlicers(all, { ...filters, period: p, orgUnit });
  const cols = [...new Set(picked.flatMap((row) => Object.keys(row).filter((key) => !fixedFields.has(key))))].sort();
  const rows = cols
    .map((k) => ({ dataElement: k, code: "", name: k, value: picked.reduce((a, r) => a + num(r[k]), 0), categoryOptionCombo: "", lastUpdated: "" }))
    .filter((r) => !query || r.name.toLowerCase().includes(query.toLowerCase()));
  return rows;
};

export const excelTrends = ({ dataElement, orgUnit, startPeriod, endPeriod, ...filters }) => {
  const { all } = ensure();
  const start = Number(startPeriod);
  const end = Number(endPeriod);
  const grouped = {};
  applySlicers(all, { ...filters, orgUnit })
    .forEach((r) => {
      const p = normalizePeriod(r.periodid || r.period);
      if (!grouped[p]) grouped[p] = 0;
      grouped[p] += num(r[dataElement]);
    });
  return Object.entries(grouped)
    .map(([period, value]) => ({ period, value }))
    .filter((r) => Number(r.period) >= start && Number(r.period) <= end)
    .sort((a, b) => Number(a.period) - Number(b.period));
};

export const excelOrgUnitComparison = ({ period, dataElement, ...filters }) => {
  const { all } = ensure();
  const p = normalizePeriod(period);
  return applySlicers(all, { ...filters, period: p })
    .map((r) => ({ orgUnit: r.site_id, orgUnitName: r.site, value: num(r[dataElement]) }))
    .sort((a, b) => b.value - a.value);
};

export const excelDataQuality = ({ period, orgUnit, ...filters }) => {
  const row = excelDataElements({ period, orgUnit, ...filters });
  const missing = row.filter((r) => r.value === 0).map((r) => r.name);
  const zeroValues = missing.length;
  return { period: normalizePeriod(period), orgUnit, missingDataElements: missing, zeroValues, lateUpdates: 0, completeness: row.length ? Number((((row.length - zeroValues) / row.length) * 100).toFixed(1)) : 0 };
};

export const excelDataElementOptions = () => {
  const { allExcel, all } = ensure();
  const rows = allExcel.length ? allExcel : all;
  return [...new Set(rows.flatMap((row) => Object.keys(row).filter((key) => !fixedFields.has(key))))]
    .sort()
    .map((k) => ({ id: k, name: k }));
};

export const excelYears = () => {
  const { all } = ensure();
  const years = [...new Set(all.map((r) => normalizePeriod(r.periodid || r.period).slice(0, 4)).filter(Boolean))].sort((a, b) => Number(a) - Number(b));
  return years;
};

export const excelFilterOptions = (filters = {}) => {
  const { all } = ensure();
  const periods = [...new Set(all.map((r) => normalizePeriod(r.periodid || r.period)).filter(Boolean))].sort();
  const defaultPeriod = [...periods].reverse().find((period) => {
    const rows = applySlicers(all, { period, orgUnit: "__ALL__" });
    return rows.reduce((sum, row) => sum + num(row[keyCols.enrolled]) + num(row[keyCols.completed]), 0) > 0;
  }) || periods.at(-1) || "";
  const years = excelYears();
  const months = [...new Set(periods.map((p) => p.slice(4, 6)).filter(Boolean))].sort();
  const selected = {
    region: String(filters.region || ""),
    district: String(filters.district || ""),
    facility: String(filters.facility || ""),
    implementingPartner: String(filters.implementingPartner || "")
  };
  const filterRows = (ignore = "") => all.filter((row) => {
    if (ignore !== "region" && selected.region && row.region !== selected.region) return false;
    if (ignore !== "district" && selected.district && row.district !== selected.district) return false;
    if (ignore !== "facility" && selected.facility && row.site !== selected.facility) return false;
    if (ignore !== "implementingPartner" && selected.implementingPartner && row.mechanism !== selected.implementingPartner) return false;
    return true;
  });
  const unique = (rows, key) => [...new Set(rows.map((row) => row[key]).filter(Boolean))].sort();
  const regions = unique(filterRows("region"), "region");
  const districts = unique(filterRows("district"), "district");
  const facilities = unique(filterRows("facility"), "site");
  const implementingPartners = unique(filterRows("implementingPartner"), "mechanism");
  return { periods, defaultPeriod, years, months, regions, districts, facilities, implementingPartners };
};

export const excelIMPerformance = ({ orgUnit, metrics = [], ...filters }) => {
  const { all } = ensure();
  let rows = applySlicers(all, { ...filters, orgUnit });
  if (!rows.length && (filters.period || filters.month)) {
    rows = applySlicers(all, { ...filters, period: "", month: filters.month || "", orgUnit });
  }
  if (!rows.length && filters.year) {
    rows = applySlicers(all, { ...filters, period: "", month: "", orgUnit });
  }
  if (metrics.length) {
    const normalizedMetrics = metrics
      .filter((metric) => metric?.label && metric?.dataElement)
      .map((metric) => ({ label: metric.label, dataElement: metric.dataElement }));
    const emptyValues = () => Object.fromEntries(normalizedMetrics.map((metric) => [metric.label, 0]));
    const byAgency = new Map();

    for (const r of rows) {
      const agency = r.agency || "Unknown Agency";
      const mechanism = r.mechanism || "Unknown IM";
      const siteId = r.site_id || "";

      const enrolled = num(r[keyCols.enrolled]);
      const aborted = num(r[keyCols.aborted]);
      const completed = num(r[keyCols.completed]);

      if (!byAgency.has(agency)) byAgency.set(agency, { sites: new Set(), values: emptyValues(), enrolled: 0, aborted: 0, completed: 0, mechanisms: new Map() });
      const a = byAgency.get(agency);
      if (siteId) a.sites.add(siteId);
      for (const metric of normalizedMetrics) a.values[metric.label] += num(r[metric.dataElement]);
      a.enrolled += enrolled;
      a.aborted += aborted;
      a.completed += completed;

      if (!a.mechanisms.has(mechanism)) a.mechanisms.set(mechanism, { sites: new Set(), values: emptyValues(), enrolled: 0, aborted: 0, completed: 0 });
      const m = a.mechanisms.get(mechanism);
      if (siteId) m.sites.add(siteId);
      for (const metric of normalizedMetrics) m.values[metric.label] += num(r[metric.dataElement]);
      m.enrolled += enrolled;
      m.aborted += aborted;
      m.completed += completed;
    }

    const firstMetric = normalizedMetrics[0]?.label;
    const agencies = [...byAgency.entries()]
      .sort((a, b) => (b[1].values[firstMetric] || 0) - (a[1].values[firstMetric] || 0))
      .map(([agency, a]) => ({
        agency,
        reportingSites: a.sites.size,
        enrolledClients: a.enrolled,
        abortedInterviews: a.aborted,
        completedInterviews: a.completed,
        completionPercent: a.enrolled ? Number(((a.completed / a.enrolled) * 100).toFixed(1)) : 0,
        values: a.values,
        mechanisms: [...a.mechanisms.entries()]
          .sort((x, y) => (y[1].values[firstMetric] || 0) - (x[1].values[firstMetric] || 0))
          .map(([mechanism, m]) => ({
            mechanism,
            reportingSites: m.sites.size,
            enrolledClients: m.enrolled,
            abortedInterviews: m.aborted,
            completedInterviews: m.completed,
            completionPercent: m.enrolled ? Number(((m.completed / m.enrolled) * 100).toFixed(1)) : 0,
            values: m.values
          }))
      }));
    const grandTotal = agencies.reduce(
      (acc, agency) => {
        acc.reportingSites += agency.reportingSites;
        acc.enrolledClients += agency.enrolledClients;
        acc.abortedInterviews += agency.abortedInterviews;
        acc.completedInterviews += agency.completedInterviews;
        for (const metric of normalizedMetrics) acc.values[metric.label] += agency.values[metric.label] || 0;
        return acc;
      },
      { reportingSites: 0, enrolledClients: 0, abortedInterviews: 0, completedInterviews: 0, values: emptyValues() }
    );

    return {
      metrics: normalizedMetrics,
      agencies,
      grandTotal: {
        ...grandTotal,
        completionPercent: grandTotal.enrolledClients ? Number(((grandTotal.completedInterviews / grandTotal.enrolledClients) * 100).toFixed(1)) : 0
      }
    };
  }
  const byAgency = new Map();

  for (const r of rows) {
    const agency = r.agency || "Unknown Agency";
    const mechanism = r.mechanism || "Unknown IM";
    const siteId = r.site_id || "";
    const enrolled = num(r[keyCols.enrolled]);
    const aborted = num(r[keyCols.aborted]);
    const completed = num(r[keyCols.completed]);

    if (!byAgency.has(agency)) byAgency.set(agency, { sites: new Set(), enrolled: 0, aborted: 0, completed: 0, mechanisms: new Map() });
    const a = byAgency.get(agency);
    if (siteId) a.sites.add(siteId);
    a.enrolled += enrolled;
    a.aborted += aborted;
    a.completed += completed;

    if (!a.mechanisms.has(mechanism)) a.mechanisms.set(mechanism, { sites: new Set(), enrolled: 0, aborted: 0, completed: 0 });
    const m = a.mechanisms.get(mechanism);
    if (siteId) m.sites.add(siteId);
    m.enrolled += enrolled;
    m.aborted += aborted;
    m.completed += completed;
  }

  const agencies = [...byAgency.entries()]
    .sort((a, b) => b[1].enrolled - a[1].enrolled)
    .map(([agency, a]) => {
      const mechanisms = [...a.mechanisms.entries()]
        .sort((x, y) => y[1].enrolled - x[1].enrolled)
        .map(([mechanism, m]) => ({
          mechanism,
          reportingSites: m.sites.size,
          enrolledClients: m.enrolled,
          abortedInterviews: m.aborted,
          completedInterviews: m.completed,
          completionPercent: m.enrolled ? Number(((m.completed / m.enrolled) * 100).toFixed(1)) : 0
        }));
      return {
        agency,
        reportingSites: a.sites.size,
        enrolledClients: a.enrolled,
        abortedInterviews: a.aborted,
        completedInterviews: a.completed,
        completionPercent: a.enrolled ? Number(((a.completed / a.enrolled) * 100).toFixed(1)) : 0,
        mechanisms
      };
    });

  const grandTotal = agencies.reduce(
    (acc, a) => ({
      reportingSites: acc.reportingSites + a.reportingSites,
      enrolledClients: acc.enrolledClients + a.enrolledClients,
      abortedInterviews: acc.abortedInterviews + a.abortedInterviews,
      completedInterviews: acc.completedInterviews + a.completedInterviews
    }),
    { reportingSites: 0, enrolledClients: 0, abortedInterviews: 0, completedInterviews: 0 }
  );

  return {
    agencies,
    grandTotal: {
      ...grandTotal,
      completionPercent: grandTotal.enrolledClients ? Number(((grandTotal.completedInterviews / grandTotal.enrolledClients) * 100).toFixed(1)) : 0
    }
  };
};

export const excelCoverage = ({ orgUnit, ...filters } = {}) => {
  const { master } = ensure();
  const scopedMaster = master.filter((row) => {
    if (filters.region && row.region !== filters.region) return false;
    if (filters.district && row.district !== filters.district) return false;
    if (filters.facility && row.site !== filters.facility) return false;
    if (filters.implementingPartner && row.mechanism !== filters.implementingPartner) return false;
    if (!isAll(orgUnit) && orgUnit && row.site_id !== orgUnit) return false;
    return true;
  });
  const rows = rowsForScope({ ...filters, orgUnit });
  const reportingBySite = new Map();
  for (const row of rows) {
    const siteId = row.site_id || row.site;
    if (!reportingBySite.has(siteId)) {
      reportingBySite.set(siteId, {
        enrolled: 0,
        completed: 0,
        aborted: 0,
        lastReportedPeriod: ""
      });
    }
    const target = reportingBySite.get(siteId);
    target.enrolled += num(row[keyCols.enrolled]);
    target.completed += num(row[keyCols.completed]);
    target.aborted += num(row[keyCols.aborted]);
    const period = normalizePeriod(row.periodid || row.period);
    if (period > target.lastReportedPeriod) target.lastReportedPeriod = period;
  }

  const siteRows = scopedMaster.map((site) => {
    const reporting = reportingBySite.get(site.site_id || site.site);
    const enrolled = num(reporting?.enrolled);
    const completed = num(reporting?.completed);
    return {
      siteId: site.site_id || site.site,
      region: site.region || "Unknown Region",
      district: site.district || "Unknown District",
      site: site.site || site.site_id || "Unknown Site",
      implementingPartner: site.mechanism || "Unknown IM",
      status: reporting ? "Reporting" : "Silent",
      lastReportedPeriod: reporting?.lastReportedPeriod || "",
      enrolled,
      completed,
      aborted: num(reporting?.aborted),
      completionRate: enrolled ? Number(((completed / enrolled) * 100).toFixed(1)) : 0
    };
  });

  const byDistrict = new Map();
  for (const site of siteRows) {
    const key = `${site.region}||${site.district}`;
    if (!byDistrict.has(key)) {
      byDistrict.set(key, {
        region: site.region,
        district: site.district,
        activeSites: 0,
        reportingSites: 0,
        silentSites: 0,
        enrolled: 0,
        completed: 0,
        aborted: 0,
        lastReportedPeriod: ""
      });
    }
    const target = byDistrict.get(key);
    target.activeSites += 1;
    target.reportingSites += site.status === "Reporting" ? 1 : 0;
    target.silentSites += site.status === "Silent" ? 1 : 0;
    target.enrolled += site.enrolled;
    target.completed += site.completed;
    target.aborted += site.aborted;
    if (site.lastReportedPeriod > target.lastReportedPeriod) target.lastReportedPeriod = site.lastReportedPeriod;
  }

  const districts = [...byDistrict.values()]
    .map((row) => ({
      ...row,
      reportingRate: row.activeSites ? Number(((row.reportingSites / row.activeSites) * 100).toFixed(1)) : 0,
      completionRate: row.enrolled ? Number(((row.completed / row.enrolled) * 100).toFixed(1)) : 0
    }))
    .sort((a, b) => b.reportingSites - a.reportingSites || b.completed - a.completed || a.district.localeCompare(b.district));

  const summary = districts.reduce(
    (acc, row) => {
      acc.activeDistricts += row.activeSites > 0 ? 1 : 0;
      acc.reportingDistricts += row.reportingSites > 0 ? 1 : 0;
      acc.activeSites += row.activeSites;
      acc.reportingSites += row.reportingSites;
      acc.silentSites += row.silentSites;
      acc.enrolled += row.enrolled;
      acc.completed += row.completed;
      return acc;
    },
    { activeDistricts: 0, reportingDistricts: 0, activeSites: 0, reportingSites: 0, silentSites: 0, enrolled: 0, completed: 0 }
  );

  return {
    summary: {
      ...summary,
      reportingRate: summary.activeSites ? Number(((summary.reportingSites / summary.activeSites) * 100).toFixed(1)) : 0,
      completionRate: summary.enrolled ? Number(((summary.completed / summary.enrolled) * 100).toFixed(1)) : 0
    },
    districts,
    sites: siteRows
  };
};

export const excelHighRiskDisaggregation = ({ orgUnit, ...filters }) => {
  const rows = detailRowsForScope({ ...filters, orgUnit });
  const result = highRiskGroupRows(rows);
  return { period: normalizePeriod(filters.period || ""), total: result.total, groups: result.groups };
};

export const excelHighRiskTrends = ({ orgUnit, startPeriod, endPeriod, ...filters }) => {
  const start = Number(startPeriod || 0);
  const end = Number(endPeriod || 999999);
  const grouped = new Map();
  for (const row of detailRowsForScope({ ...filters, month: "", period: "", orgUnit })) {
    const period = normalizePeriod(row.periodid || row.period);
    if (!period || Number(period) < start || Number(period) > end) continue;
    grouped.set(period, num(grouped.get(period)) + num(row.value));
  }
  return [...grouped.entries()]
    .map(([period, value]) => ({ period, value }))
    .filter((row) => row.value > 0)
    .sort((a, b) => Number(a.period) - Number(b.period));
};

export const excelHighRiskDashboard = ({ orgUnit, ...filters } = {}) => {
  const rows = rowsForScope({ ...filters, orgUnit });
  const highRiskRows = detailRowsForScope({ ...filters, orgUnit });
  const groupResult = highRiskGroupRows(highRiskRows);
  const byIm = new Map();
  const byPeriod = new Map();
  const enrolledByPeriod = new Map();
  const imGroups = [];
  const ageSexMap = new Map();
  const ageGroupMap = new Map();

  for (const row of highRiskRows) {
    const identified = num(row.value);
    const enrolled = num(row[keyCols.enrolled]);
    const im = row.mechanism || "Unknown IM";
    if (!byIm.has(im)) byIm.set(im, { implementingPartner: im, enrolled: 0, identified: 0, sites: new Set() });
    const imBucket = byIm.get(im);
    imBucket.identified += identified;
    if (row.site_id) imBucket.sites.add(row.site_id);

    const period = normalizePeriod(row.periodid || row.period);
    if (period) {
      byPeriod.set(period, num(byPeriod.get(period)) + identified);
    }
    if (row.age && row.sex) {
      const key = `${row.age}|||${row.sex}`;
      if (!ageSexMap.has(key)) ageSexMap.set(key, { age: row.age, sex: row.sex, value: 0 });
      ageSexMap.get(key).value += identified;
    }
    if (row.age && row.group) {
      const key = `${row.age}|||${row.group}`;
      if (!ageGroupMap.has(key)) ageGroupMap.set(key, { age: row.age, group: row.group, value: 0 });
      ageGroupMap.get(key).value += identified;
    }
  }

  for (const row of rows) {
    const im = row.mechanism || "Unknown IM";
    if (!byIm.has(im)) byIm.set(im, { implementingPartner: im, enrolled: 0, identified: 0, sites: new Set() });
    byIm.get(im).enrolled += num(row[keyCols.enrolled]);
    const period = normalizePeriod(row.periodid || row.period);
    if (period) enrolledByPeriod.set(period, num(enrolledByPeriod.get(period)) + num(row[keyCols.enrolled]));
  }

  const imGroupMap = new Map();
  for (const row of highRiskRows) {
    const key = `${row.mechanism || "Unknown IM"}|||${row.group}`;
    if (!imGroupMap.has(key)) imGroupMap.set(key, { implementingPartner: row.mechanism || "Unknown IM", group: row.group, value: 0 });
    imGroupMap.get(key).value += num(row.value);
  }
  for (const row of imGroupMap.values()) {
    if (row.value > 0) {
      imGroups.push(row);
    }
  }

  const enrolled = rows.reduce((sum, row) => sum + num(row[keyCols.enrolled]), 0);
  const imRows = [...byIm.values()]
    .map((row) => ({
      implementingPartner: row.implementingPartner,
      enrolled: row.enrolled,
      identified: row.identified,
      identifiedPercent: row.enrolled ? Number(((row.identified / row.enrolled) * 100).toFixed(1)) : 0,
      reportingSites: row.sites.size
    }))
    .sort((a, b) => b.identified - a.identified);

  const trends = [...byPeriod.entries()]
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([period, identified]) => {
      const trendEnrolled = num(enrolledByPeriod.get(period));
      return {
        period,
        enrolled: trendEnrolled,
        identified,
        identifiedPercent: trendEnrolled ? Number(((identified / trendEnrolled) * 100).toFixed(1)) : 0
      };
    });

  return {
    period: normalizePeriod(filters.period || ""),
    orgUnit,
    summary: {
      enrolled,
      identified: groupResult.total,
      identifiedPercent: enrolled ? Number(((groupResult.total / enrolled) * 100).toFixed(1)) : 0,
      groupCount: groupResult.groups.length,
      leadingGroup: groupResult.groups[0]?.group || "N/A",
      leadingGroupValue: groupResult.groups[0]?.value || 0,
      leadingIm: imRows[0]?.implementingPartner || "N/A",
      leadingImValue: imRows[0]?.identified || 0
    },
    groups: groupResult.groups,
    imRows,
    imGroups: imGroups.sort((a, b) => b.value - a.value),
    ageSex: [...ageSexMap.values()].sort((a, b) => a.age.localeCompare(b.age) || a.sex.localeCompare(b.sex)),
    ageGroups: [...ageGroupMap.values()].sort((a, b) => a.age.localeCompare(b.age) || b.value - a.value),
    trends
  };
};

export const excelDashboardDemographics = ({ dashboard = "", orgUnit, ...filters } = {}) => {
  const rows = rowsForScope({ ...filters, orgUnit });
  const candidateElements = {
    Enrollment: [keyCols.newClients, keyCols.returning],
    "HIV Testing": [
      "eHES_SE01: Newly Tested HIV Negative (HTS_NEG)",
      "eHES_SE01: Newly Tested HIV Positive (TST_POS)",
      "eHES_SE01: Newly tested and / or referred for HTS (TST)"
    ],
    "Condom Use": [
      "eHES_RB03: No condom use",
      "eHES_SE02: Received Condoms",
      "eHES_SE02: Received Lubricants"
    ],
    "Other Risk Behaviours": riskBehaviourElements.map((item) => item.dataElement)
  }[dashboard] || [];
  const charts = candidateElements
    .map((dataElement) => ({
      service: dataElement.replace(/^\s*eHES_[^:]*:\s*/i, ""),
      value: rows.reduce((sum, row) => sum + num(row[dataElement]), 0)
    }))
    .filter((row) => row.value > 0);
  const total = charts.reduce((sum, row) => sum + row.value, 0);
  return { charts: charts.map((row) => ({ ...row, share: total ? Number(((row.value / total) * 100).toFixed(1)) : 0 })), summary: { total } };
};

export const excelDimensionPerformance = ({ orgUnit, metrics = [], dimension = "district", ...filters }) => {
  const normalizedMetrics = normalizeMetrics(metrics);
  if (!normalizedMetrics.length) return { dimension, metrics: normalizedMetrics, rows: [] };
  const dimensionKey = {
    district: "district",
    partner: "mechanism",
    agency: "agency",
    region: "region"
  }[dimension] || "district";
  const rows = rowsForScope({ ...filters, orgUnit });
  const highRiskRows = detailRowsForScope({ ...filters, orgUnit });
  const highRiskMetric = normalizedMetrics.find((metric) => metric?.formula?.type === "highRisk");
  const byDimension = new Map();

  for (const row of rows) {
    const name = row[dimensionKey] || `Unknown ${dimension}`;
    if (!byDimension.has(name)) byDimension.set(name, { sites: new Set(), values: emptyMetricValues(normalizedMetrics) });
    const bucket = byDimension.get(name);
    if (row.site_id) bucket.sites.add(row.site_id);
    addDirectMetricValues(bucket, row, normalizedMetrics);
  }
  if (highRiskMetric) {
    for (const row of highRiskRows) {
      const name = row[dimensionKey] || `Unknown ${dimension}`;
      if (!byDimension.has(name)) byDimension.set(name, { sites: new Set(), values: emptyMetricValues(normalizedMetrics) });
      const bucket = byDimension.get(name);
      if (row.site_id) bucket.sites.add(row.site_id);
      bucket.values[highRiskMetric.label] += num(row.value);
    }
  }

  const sortMetric = normalizedMetrics.find((metric) => !metric.hidden)?.label || normalizedMetrics[0]?.label;
  return {
    dimension,
    metrics: normalizedMetrics,
    rows: [...byDimension.entries()]
      .map(([name, bucket]) => ({
        name,
        reportingSites: bucket.sites.size,
        values: Object.fromEntries(normalizedMetrics.map((metric) => [metric.label, metricValue(bucket, metric, normalizedMetrics)]))
      }))
      .filter((row) => Object.values(row.values).some((value) => num(value) > 0))
      .sort((a, b) => (b.values[sortMetric] || 0) - (a.values[sortMetric] || 0) || a.name.localeCompare(b.name))
  };
};

export const excelDashboardDetailRows = ({ orgUnit, metrics = [], ...filters }) => {
  const normalizedMetrics = normalizeMetrics(metrics);
  if (!normalizedMetrics.length) return { metrics: normalizedMetrics, rows: [] };
  const rows = rowsForScope({ ...filters, orgUnit });
  const highRiskRows = detailRowsForScope({ ...filters, orgUnit });
  const highRiskMetric = normalizedMetrics.find((metric) => metric?.formula?.type === "highRisk");
  const bySite = new Map();

  for (const row of rows) {
    const key = `${row.mechanism || "Unknown IM"}||${row.district || "Unknown District"}||${row.site || "Unknown Site"}||${row.site_id || row.site}`;
    if (!bySite.has(key)) {
      bySite.set(key, {
        mechanism: row.mechanism || "Unknown IM",
        district: row.district || "Unknown District",
        facility: row.site || "Unknown Site",
        siteId: row.site_id || row.site,
        values: emptyMetricValues(normalizedMetrics)
      });
    }
    addDirectMetricValues(bySite.get(key), row, normalizedMetrics);
  }
  if (highRiskMetric) {
    for (const row of highRiskRows) {
      const key = `${row.mechanism || "Unknown IM"}||${row.district || "Unknown District"}||${row.site || "Unknown Site"}||${row.site_id || row.site}`;
      if (!bySite.has(key)) {
        bySite.set(key, {
          mechanism: row.mechanism || "Unknown IM",
          district: row.district || "Unknown District",
          facility: row.site || "Unknown Site",
          siteId: row.site_id || row.site,
          values: emptyMetricValues(normalizedMetrics)
        });
      }
      bySite.get(key).values[highRiskMetric.label] += num(row.value);
    }
  }

  const sortMetric = normalizedMetrics.find((metric) => !metric.hidden)?.label || normalizedMetrics[0]?.label;
  return {
    metrics: normalizedMetrics,
    rows: [...bySite.values()]
      .map((bucket) => ({
        ...bucket,
        values: Object.fromEntries(normalizedMetrics.map((metric) => [metric.label, metricValue(bucket, metric, normalizedMetrics)]))
      }))
      .filter((row) => Object.values(row.values).some((value) => num(value) > 0))
      .sort((a, b) => (b.values[sortMetric] || 0) - (a.values[sortMetric] || 0))
  };
};

export const excelHighRiskGroupPerformance = ({ orgUnit, metrics = [], ...filters }) => {
  const normalizedMetrics = normalizeMetrics(metrics);
  if (!normalizedMetrics.length) return { metrics: normalizedMetrics, rows: [] };
  const scopedFilters = { ...filters, orgUnit };
  const hasHighRiskFormula = normalizedMetrics.some((metric) => metric?.formula?.type === "highRisk");
  if (!hasHighRiskFormula) {
    return {
      metrics: normalizedMetrics,
      rows: directRiskPopulationRows(normalizedMetrics, scopedFilters)
    };
  }
  const rows = detailRowsForScope({ ...filters, orgUnit });
  const groupResult = highRiskGroupRows(rows);
  const groupByElement = new Map(groupResult.groups.map((group) => [group.dataElement, group]));
  const buckets = new Map(groupResult.groups.map((group) => [group.group, { group: group.group, values: emptyMetricValues(normalizedMetrics) }]));

  for (const metric of normalizedMetrics) {
    if (metric?.formula?.type === "highRisk") {
      for (const group of groupResult.groups) {
        buckets.get(group.group).values[metric.label] = group.value;
      }
      continue;
    }
    if (!metric.dataElement) continue;
    const group = groupByElement.get(metric.dataElement);
    if (!group) continue;
    buckets.get(group.group).values[metric.label] = rows.reduce((sum, row) => sum + num(row[metric.dataElement]), 0);
  }

  return {
    metrics: normalizedMetrics,
    rows: [...buckets.values()]
      .map((bucket) => ({
        ...bucket,
        values: Object.fromEntries(normalizedMetrics.map((metric) => [metric.label, metricValue(bucket, metric, normalizedMetrics)]))
      }))
      .filter((row) => Object.values(row.values).some((value) => num(value) > 0))
      .sort((a, b) => {
        const firstMetric = normalizedMetrics[0]?.label;
        return num(b.values[firstMetric]) - num(a.values[firstMetric]) || a.group.localeCompare(b.group);
      })
  };
};

export const refreshExcelCache = () => {
  cache = null;
  return ensure();
};

export const importExcelWorkbook = async ({ fileName = "eHSS_Data_With_District_Region.xlsx", base64 = "", content = "" } = {}) => {
  const startedAt = new Date().toISOString();
  const extension = path.extname(fileName).toLowerCase();
  if (![".xlsx", ".xls"].includes(extension)) {
    const error = new Error("Please upload an Excel workbook (.xlsx or .xls).");
    error.status = 400;
    throw error;
  }

  const safeName = path.basename(fileName).replace(/[^\w .()-]/g, "_");
  fs.mkdirSync(uploadDir, { recursive: true });
  const destination = path.join(uploadDir, safeName || "eHSS_Data_With_District_Region.xlsx");
  const buffer = Buffer.from(base64 || content, "base64");
  fs.writeFileSync(destination, buffer);

  activeExcelPath = destination;
  cache = null;
  const parsed = ensure();
  const periods = excelYears();
  const log = {
    type: "excel-import",
    status: parsed.all.length ? "success" : "empty",
    fileName: safeName,
    path: destination,
    startedAt,
    finishedAt: new Date().toISOString(),
    rows: parsed.all.length,
    sourceRows: parsed.allExcel.length,
    periods,
    orgUnits: parsed.master.length,
    dataElements: excelDataElementOptions().length,
    regions: new Set(parsed.master.map((row) => row.region).filter(Boolean)).size,
    districts: new Set(parsed.master.map((row) => row.district).filter(Boolean)).size,
    implementingPartners: new Set(parsed.master.map((row) => row.mechanism).filter(Boolean)).size,
    warnings: parsed.all.length ? [] : ["Workbook imported, but no dashboard rows were found."]
  };
  await appendRefreshLog(log);
  await writeCache("last-csv-import", log);
  return log;
};

export const excelImportStatus = async () => ({
  lastImport: await readCache("last-csv-import", null)
});
