import path from "path";
import fs from "fs";
import XLSX from "xlsx";
import { monthlyDataCacheDir } from "../config/paths.js";

const resolveExcelPath = () => {
  const candidates = [
    path.resolve(process.cwd(), "eHSS_ACASI Cumm Jan 2026.xlsx"),
    path.resolve(process.cwd(), "../eHSS_ACASI Cumm Jan 2026.xlsx"),
    path.resolve(process.cwd(), "../../eHSS_ACASI Cumm Jan 2026.xlsx")
  ];
  const found = candidates.find((p) => fs.existsSync(p));
  if (found) return found;
  return candidates[0];
};

const excelPath = resolveExcelPath();
let cache = null;
const cacheDirs = () => (fs.existsSync(monthlyDataCacheDir) ? [monthlyDataCacheDir] : []);

const normalizePeriod = (value) => {
  if (!value) return "";
  if (typeof value === "number") return String(value);
  const s = String(value);
  if (/^\d{6}$/.test(s)) return s;
  if (/^\d{8}$/.test(s)) return s.slice(0, 6);
  if (/^\d{4}-\d{2}/.test(s)) return s.slice(0, 4) + s.slice(5, 7);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const isAll = (orgUnit) => !orgUnit || orgUnit === "__ALL__";

const ensure = () => {
  if (cache) return cache;
  const wb = XLSX.readFile(excelPath, { cellDates: true });
  const master = XLSX.utils.sheet_to_json(wb.Sheets["Master"] || wb.Sheets[wb.SheetNames[0]], { defval: "" });
  const allExcel = XLSX.utils.sheet_to_json(wb.Sheets["All_data"] || wb.Sheets[wb.SheetNames[1]], { defval: "" });
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
  cache = { master, allExcel, all };
  return cache;
};

const keyCols = {
  enrolled: "eHES_RE01: Total individuals presenting for Interviewing by entry points",
  newClients: "eHES_RE02: Number of new clients presenting",
  returning: "eHES_RE03: Number returning clients presenting",
  completed: "eHES_AC01: Number of interviews completed",
  aborted: "eHES_AC02: Number of interviews aborted"
};

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
  const row = picked[0] || {};
  const fixed = new Set(["agency", "mechanism", "region", "district", "site", "site_id", "periodid", "period", "unique_id"]);
  const cols = Object.keys(row).filter((k) => !fixed.has(k));
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
  const row = allExcel[0] || all[0] || {};
  const fixed = new Set(["agency", "mechanism", "region", "district", "site", "site_id", "periodid", "period", "unique_id"]);
  return Object.keys(row).filter((k) => !fixed.has(k)).map((k) => ({ id: k, name: k }));
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

export const refreshExcelCache = () => {
  cache = null;
  return ensure();
};
