import fs from "fs";
import path from "path";
import XLSX from "xlsx";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "url";
import { dhis2ApiPath, dhis2Get } from "./dhis2Client.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "../..");
const projectRoot = path.resolve(backendRoot, "..");
const dbDir = path.resolve(backendRoot, "data");
const dbPath = path.join(dbDir, "acasi.sqlite");
const profileWorkbookPath = path.resolve(projectRoot, "eHSS_ACASI Cumm Jan 2026.xlsx");
const normalizeLabel = (value = "") => String(value).replace(/\s+/g, " ").trim();
const toArray = (value) => Array.isArray(value) ? value : [value].filter(Boolean);

let db = null;

const openDb = () => {
  if (db) return db;
  fs.mkdirSync(dbDir, { recursive: true });
  db = new DatabaseSync(dbPath);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS org_units (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      code TEXT NOT NULL DEFAULT '',
      path TEXT NOT NULL DEFAULT '',
      level INTEGER NOT NULL DEFAULT 0,
      agency TEXT NOT NULL DEFAULT '',
      mechanism TEXT NOT NULL DEFAULT '',
      region TEXT NOT NULL DEFAULT '',
      district TEXT NOT NULL DEFAULT '',
      site TEXT NOT NULL DEFAULT ''
    ) STRICT;

    CREATE TABLE IF NOT EXISTS data_elements (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      code TEXT NOT NULL DEFAULT '',
      short_name TEXT NOT NULL DEFAULT ''
    ) STRICT;

    CREATE TABLE IF NOT EXISTS data_values (
      period TEXT NOT NULL,
      org_unit TEXT NOT NULL,
      org_unit_name TEXT NOT NULL DEFAULT '',
      data_element TEXT NOT NULL,
      data_element_name TEXT NOT NULL DEFAULT '',
      category_option_combo TEXT NOT NULL DEFAULT '',
      attribute_option_combo TEXT NOT NULL DEFAULT '',
      value REAL NOT NULL DEFAULT 0,
      stored_by TEXT NOT NULL DEFAULT '',
      created TEXT NOT NULL DEFAULT '',
      last_updated TEXT NOT NULL DEFAULT '',
      fetched_at TEXT NOT NULL DEFAULT '',
      PRIMARY KEY (period, org_unit, data_element, category_option_combo, attribute_option_combo)
    ) STRICT;

    CREATE TABLE IF NOT EXISTS category_option_combos (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL DEFAULT '',
      option_names_json TEXT NOT NULL DEFAULT '[]',
      fetched_at TEXT NOT NULL DEFAULT ''
    ) STRICT;

    CREATE INDEX IF NOT EXISTS idx_data_values_period ON data_values(period);
    CREATE INDEX IF NOT EXISTS idx_data_values_element_name ON data_values(data_element_name);
    CREATE INDEX IF NOT EXISTS idx_data_values_org_unit ON data_values(org_unit);
    CREATE INDEX IF NOT EXISTS idx_data_values_period_element_org ON data_values(period, data_element_name, org_unit);
    CREATE INDEX IF NOT EXISTS idx_data_values_element_period_org ON data_values(data_element_name, period, org_unit);
    CREATE INDEX IF NOT EXISTS idx_data_values_org_period_element ON data_values(org_unit, period, data_element_name);
    CREATE INDEX IF NOT EXISTS idx_data_values_period_combo ON data_values(period, category_option_combo);
    CREATE INDEX IF NOT EXISTS idx_org_units_filters ON org_units(region, district, mechanism, site, id);
    CREATE INDEX IF NOT EXISTS idx_category_option_combos_name ON category_option_combos(name);
  `);
  const orgUnitCount = Number(db.prepare("SELECT COUNT(*) AS count FROM org_units").get().count || 0);
  if (orgUnitCount === 0) hydrateProfilesFromWorkbook();
  return db;
};

const hydrateProfilesFromWorkbook = () => {
  if (!fs.existsSync(profileWorkbookPath)) return;
  const workbook = XLSX.readFile(profileWorkbookPath, { cellDates: true });
  const master = XLSX.utils.sheet_to_json(workbook.Sheets.Master || workbook.Sheets[workbook.SheetNames[0]], { defval: "" });
  const stmt = db.prepare(`
    INSERT INTO org_units (id, name, agency, mechanism, region, district, site)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      agency = excluded.agency,
      mechanism = excluded.mechanism,
      region = excluded.region,
      district = excluded.district,
      site = excluded.site,
      name = CASE WHEN org_units.name = '' THEN excluded.name ELSE org_units.name END
  `);
  db.exec("BEGIN");
  for (const row of master) {
    const id = String(row.site_id || "");
    if (!id) continue;
    stmt.run(
      id,
      String(row.site || ""),
      String(row.agency || ""),
      String(row.mechanism || ""),
      String(row.region || ""),
      String(row.district || ""),
      String(row.site || "")
    );
  }
  db.exec("COMMIT");
};

const buildWhere = (filters = {}, { includePeriod = true } = {}) => {
  const clauses = [];
  const values = [];
  if (includePeriod && filters.period) {
    clauses.push("dv.period = ?");
    values.push(String(filters.period));
  }
  if (filters.year) {
    clauses.push("dv.period LIKE ?");
    values.push(`${filters.year}%`);
  }
  if (filters.month) {
    clauses.push("substr(dv.period, 5, 2) = ?");
    values.push(String(filters.month).padStart(2, "0"));
  }
  if (filters.region) {
    clauses.push("ou.region = ?");
    values.push(String(filters.region));
  }
  if (filters.district) {
    clauses.push("ou.district = ?");
    values.push(String(filters.district));
  }
  if (filters.facility) {
    clauses.push("ou.site = ?");
    values.push(String(filters.facility));
  }
  if (filters.implementingPartner) {
    clauses.push("ou.mechanism = ?");
    values.push(String(filters.implementingPartner));
  }
  if (filters.orgUnit && filters.orgUnit !== "__ALL__") {
    clauses.push("dv.org_unit = ?");
    values.push(String(filters.orgUnit));
  }
  return {
    sql: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    values
  };
};

const metricValue = (filters, dataElementName) => {
  const { sql, values } = buildWhere(filters);
  const row = openDb()
    .prepare(`
      SELECT COALESCE(SUM(dv.value), 0) AS value
      FROM data_values dv
      LEFT JOIN org_units ou ON ou.id = dv.org_unit
      ${sql ? `${sql} AND` : "WHERE"} dv.data_element_name = ?
    `)
    .get(...values, dataElementName);
  return Number(row?.value || 0);
};

const qualityElements = {
  enrolled: "eHES_RE01: Total individuals presenting for Interviewing by entry points",
  newClients: "eHES_RE02: Number of new clients presenting",
  returningClients: "eHES_RE03: Number returning clients presenting",
  hivPositive: "eHES_RE04: Number HIV Positive",
  hivNegative: "eHES_RE05: Number HIV Negative",
  hivUnknown: "eHES_RE06: Number HIV unknown sero status",
  completed: "eHES_AC01: Number of interviews completed",
  aborted: "eHES_AC02: Number of interviews aborted",
  languages: "eHES_AC03: Languages done through ACASI",
  htsRaw: "eHES_SE01: Newly tested and / or referred for HTS (TST)",
  htsNeg: "eHES_SE01: Newly Tested HIV Negative (HTS_NEG)",
  tstPos: "eHES_SE01: Newly Tested HIV Positive (TST_POS)",
  knownPositive: "eHES_SE01: Known HIV positive (HTS_Known Pos)",
  prepNew: "eHES_SE01: Newly initiated on PrEP (PrEP_NEW)",
  txNew: "eHES_SE01: New on ART (TX_NEW)",
  noCondomUse: "eHES_RB03: No condom use",
  receivedCondoms: "eHES_SE02: Received Condoms",
  receivedLubricants: "eHES_SE02: Received Lubricants",
  depression: "eHES_RB01: Experienced depression",
  alcoholAbuse: "eHES_RB02: Alcohol abuse problem",
  drugUse: "eHES_RB04: Drug use",
  sexualViolence: "eHES_RB05: Clients that experienced rape/Sexual violence",
  multiplePartners: "eHES_RB06: Clients with multiple sexual partners"
};

const facilityQualityElementNames = [
  qualityElements.enrolled,
  qualityElements.newClients,
  qualityElements.returningClients,
  qualityElements.hivPositive,
  qualityElements.hivNegative,
  qualityElements.hivUnknown,
  qualityElements.completed,
  qualityElements.aborted,
  qualityElements.languages,
  qualityElements.htsRaw,
  qualityElements.htsNeg,
  qualityElements.tstPos,
  qualityElements.knownPositive,
  qualityElements.prepNew,
  qualityElements.txNew
];

const periodLabel = (period = "") => {
  const value = String(period || "");
  if (!/^\d{6}$/.test(value)) return value || "All periods";
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${monthNames[Number(value.slice(4, 6)) - 1]} ${value.slice(0, 4)}`;
};

const safeJsonParse = (value, fallback = []) => {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const groupFromCombo = (row = {}) => {
  const optionNames = safeJsonParse(row.option_names_json, [])
    .map((name) => normalizeLabel(name))
    .filter((name) => !/^[A-Za-z0-9]{11}$/.test(name))
    .filter(Boolean);
  const group = optionNames.find((name) => !["Female", "Male", "15-24 years", "25-34 years", "35+ years"].includes(name));
  return group || normalizeLabel(row.combo_name || row.category_option_combo || "Unknown");
};

const comboOptionNames = (row = {}) =>
  safeJsonParse(row.option_names_json, [])
    .map((name) => normalizeLabel(name))
    .filter((name) => !/^[A-Za-z0-9]{11}$/.test(name))
    .filter(Boolean);

const ageFromCombo = (row = {}) => {
  const optionNames = comboOptionNames(row);
  return optionNames.find((name) => /\d/.test(name) && /years?/i.test(name)) || "Unspecified age";
};

const sexFromCombo = (row = {}) => {
  const optionNames = comboOptionNames(row);
  return optionNames.find((name) => ["Female", "Male"].includes(name)) || "Unspecified sex";
};

const groupAlias = (group = "") => {
  const label = normalizeLabel(group).replace(/\t/g, "");
  const lower = label.toLowerCase();
  if (/^[A-Za-z0-9]{11}$/.test(label)) return "Unmapped";
  if (lower.includes("boda")) return "BB";
  if (lower.includes("client of sex")) return "CSW";
  if (lower.includes("agyw") || lower.includes("abym")) return "AGYW";
  if (lower === "msm") return "MSM";
  if (lower.includes("pwid")) return "PWID";
  if (lower === "sw") return "SW";
  if (lower.includes("fisher")) return "FF";
  return label;
};

const highRiskSortWeight = (group = "") => {
  const weights = { SW: 1, MSM: 2, PWID: 3, BB: 4, CSW: 5, FF: 6, AGYW: 7 };
  return weights[group] || 20;
};

const highRiskFocusGroups = ["SW", "MSM", "PWID", "BB", "CSW", "FF", "AGYW"];
const riskPopulationGroups = [...highRiskFocusGroups, "High-risk population", "No risk population"];

const highRiskElementNames = [
  "eHES_RC01: Key populations classified through ACASI by Category",
  "eHES_RC02: Priority populations classified through ACASI"
];

const isHighRiskGroup = (row = {}) => {
  const group = groupAlias(groupFromCombo({
    category_option_combo: row.categoryOptionCombo,
    combo_name: row.comboName,
    option_names_json: row.optionNamesJson
  }));
  return group.toLowerCase() !== "other pp";
};

const riskPopulationLabel = (row = {}) => {
  const group = groupAlias(groupFromCombo({
    category_option_combo: row.categoryOptionCombo,
    combo_name: row.comboName,
    option_names_json: row.optionNamesJson
  }));
  if (/other pp|no risk|not at risk/i.test(group)) return "No risk population";
  return group;
};

export const getStorePath = () => dbPath;

export const getStoreStats = () => {
  const database = openDb();
  const dataValueElementCount = Number(database.prepare("SELECT COUNT(DISTINCT data_element_name) AS count FROM data_values WHERE data_element_name <> ''").get().count || 0);
  const dataValueOrgUnitCount = Number(database.prepare("SELECT COUNT(DISTINCT org_unit) AS count FROM data_values WHERE org_unit <> ''").get().count || 0);
  return {
    path: dbPath,
    rowCount: Number(database.prepare("SELECT COUNT(*) AS count FROM data_values").get().count || 0),
    orgUnitCount: dataValueOrgUnitCount || Number(database.prepare("SELECT COUNT(*) AS count FROM org_units").get().count || 0),
    dataElementCount: dataValueElementCount || Number(database.prepare("SELECT COUNT(*) AS count FROM data_elements").get().count || 0),
    firstPeriod: database.prepare("SELECT MIN(period) AS period FROM data_values").get().period || "",
    lastPeriod: database.prepare("SELECT MAX(period) AS period FROM data_values").get().period || ""
  };
};

export const upsertDatasetMetadata = (dataset = {}) => {
  const database = openDb();
  const ouStmt = database.prepare(`
    INSERT INTO org_units (id, name, code, path, level)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      code = excluded.code,
      path = excluded.path,
      level = excluded.level
  `);
  const deStmt = database.prepare(`
    INSERT INTO data_elements (id, name, code, short_name)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      code = excluded.code,
      short_name = excluded.short_name
  `);
  database.exec("BEGIN");
  for (const ou of dataset.organisationUnits || []) {
    if (!ou?.id) continue;
    ouStmt.run(ou.id, ou.name || "", ou.code || "", ou.path || "", Number(ou.level || 0));
  }
  for (const dse of dataset.dataSetElements || []) {
    const de = dse?.dataElement;
    if (!de?.id) continue;
    deStmt.run(de.id, normalizeLabel(de.name || ""), de.code || "", de.shortName || "");
  }
  database.exec("COMMIT");
};

export const upsertDataValues = (rows = [], fetchedAt = new Date().toISOString()) => {
  const database = openDb();
  const orgUnitStmt = database.prepare(`
    INSERT INTO org_units (id, name)
    VALUES (?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = CASE WHEN excluded.name <> '' THEN excluded.name ELSE org_units.name END
  `);
  const dataElementStmt = database.prepare(`
    INSERT INTO data_elements (id, name)
    VALUES (?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = CASE WHEN excluded.name <> '' THEN excluded.name ELSE data_elements.name END
  `);
  const stmt = database.prepare(`
    INSERT INTO data_values (
      period, org_unit, org_unit_name, data_element, data_element_name,
      category_option_combo, attribute_option_combo, value, stored_by, created, last_updated, fetched_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(period, org_unit, data_element, category_option_combo, attribute_option_combo) DO UPDATE SET
      org_unit_name = excluded.org_unit_name,
      data_element_name = excluded.data_element_name,
      value = excluded.value,
      stored_by = excluded.stored_by,
      created = excluded.created,
      last_updated = excluded.last_updated,
      fetched_at = excluded.fetched_at
  `);
  database.exec("BEGIN");
  for (const row of rows) {
    orgUnitStmt.run(String(row.orgUnit || ""), String(row.orgUnitName || ""));
    const normalizedDataElementName = normalizeLabel(row.dataElementName || "");
    dataElementStmt.run(String(row.dataElement || ""), normalizedDataElementName);
    stmt.run(
      String(row.period || ""),
      String(row.orgUnit || ""),
      String(row.orgUnitName || ""),
      String(row.dataElement || ""),
      normalizedDataElementName,
      String(row.categoryOptionCombo || ""),
      String(row.attributeOptionCombo || ""),
      Number(row.value || 0),
      String(row.storedBy || ""),
      String(row.created || ""),
      String(row.lastUpdated || ""),
      fetchedAt
    );
  }
  database.exec("COMMIT");
};

export const upsertOrgUnitProfiles = (rows = []) => {
  const database = openDb();
  const stmt = database.prepare(`
    INSERT INTO org_units (id, name, region, district, site, mechanism)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = CASE WHEN excluded.name <> '' THEN excluded.name ELSE org_units.name END,
      region = CASE WHEN excluded.region <> '' THEN excluded.region ELSE org_units.region END,
      district = CASE WHEN excluded.district <> '' THEN excluded.district ELSE org_units.district END,
      site = CASE WHEN excluded.site <> '' THEN excluded.site ELSE org_units.site END,
      mechanism = CASE WHEN excluded.mechanism <> '' THEN excluded.mechanism ELSE org_units.mechanism END
  `);
  database.exec("BEGIN");
  for (const row of rows) {
    const id = String(row.orgUnit || "").trim();
    if (!id) continue;
    const name = String(row.orgUnitName || row.site || id).trim();
    stmt.run(
      id,
      name,
      String(row.region || "").trim(),
      String(row.district || "").trim(),
      String(row.site || name).trim(),
      String(row.implementingPartner || row.mechanism || "").trim()
    );
  }
  database.exec("COMMIT");
};

export const deleteDataValuesForPeriods = (periods = []) => {
  const database = openDb();
  const uniquePeriods = [...new Set(periods.map((period) => String(period || "")).filter(Boolean))];
  if (!uniquePeriods.length) return 0;
  const stmt = database.prepare("DELETE FROM data_values WHERE period = ?");
  let deleted = 0;
  database.exec("BEGIN");
  for (const period of uniquePeriods) {
    const result = stmt.run(period);
    deleted += Number(result.changes || 0);
  }
  database.exec("COMMIT");
  return deleted;
};

export const upsertCategoryOptionCombos = (combos = []) => {
  const database = openDb();
  const stmt = database.prepare(`
    INSERT INTO category_option_combos (id, name, option_names_json, fetched_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      option_names_json = excluded.option_names_json,
      fetched_at = excluded.fetched_at
  `);
  database.exec("BEGIN");
  for (const combo of combos) {
    if (!combo?.id) continue;
    const optionNames = (combo.categoryOptions || []).map((option) => normalizeLabel(option.displayName || option.name || ""));
    stmt.run(combo.id, normalizeLabel(combo.displayName || combo.name || ""), JSON.stringify(optionNames), new Date().toISOString());
  }
  database.exec("COMMIT");
};

export const hydrateCategoryOptionCombos = async (ids = []) => {
  const database = openDb();
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  const combos = [];
  for (const id of uniqueIds) {
    const existing = database.prepare("SELECT id FROM category_option_combos WHERE id = ?").get(id);
    if (existing) continue;
    try {
      combos.push(await dhis2Get(dhis2ApiPath(`/categoryOptionCombos/${id}`), { fields: "id,name,displayName,categoryOptions[id,name,displayName]" }));
    } catch {}
  }
  if (combos.length) upsertCategoryOptionCombos(combos);
  return { requested: uniqueIds.length, fetched: combos.length };
};

export const hydrateAllUsedCategoryOptionCombos = async () => {
  const ids = openDb()
    .prepare("SELECT DISTINCT category_option_combo AS id FROM data_values WHERE category_option_combo <> ''")
    .all()
    .map((row) => row.id);
  return hydrateCategoryOptionCombos(ids);
};

export const storeOrgUnits = ({ mode = "all", period = "", region = "", district = "", facility = "", implementingPartner = "" } = {}) => {
  const database = openDb();
  const metadataClauses = [];
  const metadataValues = [];
  if (region) {
    metadataClauses.push("ou.region = ?");
    metadataValues.push(String(region));
  }
  if (district) {
    metadataClauses.push("ou.district = ?");
    metadataValues.push(String(district));
  }
  if (facility) {
    metadataClauses.push("ou.site = ?");
    metadataValues.push(String(facility));
  }
  if (implementingPartner) {
    metadataClauses.push("ou.mechanism = ?");
    metadataValues.push(String(implementingPartner));
  }
  const metadataWhere = metadataClauses.length ? `WHERE ${metadataClauses.join(" AND ")}` : "";
  if (mode === "reporting" && period) {
    return database
      .prepare(`
        SELECT DISTINCT ou.id, COALESCE(NULLIF(ou.site, ''), ou.name, dv.org_unit_name) AS name
        FROM data_values dv
        LEFT JOIN org_units ou ON ou.id = dv.org_unit
        WHERE dv.period = ?
        ${metadataClauses.length ? `AND ${metadataClauses.join(" AND ")}` : ""}
        ORDER BY name
      `)
      .all(String(period), ...metadataValues);
  }
  return [
    { id: "__ALL__", name: "All Sites (Aggregate)" },
    ...database
      .prepare(`
        SELECT ou.id, COALESCE(NULLIF(ou.site, ''), ou.name) AS name
        FROM org_units ou
        WHERE ou.id <> ''
          AND EXISTS (SELECT 1 FROM data_values dv WHERE dv.org_unit = ou.id)
        ${metadataWhere ? `AND id IN (SELECT ou.id FROM org_units ou ${metadataWhere})` : ""}
        GROUP BY ou.id, name
        ORDER BY name
      `)
      .all(...metadataValues)
  ];
};

const buildOrgUnitWhere = (filters = {}, alias = "ou") => {
  const clauses = [`${alias}.id <> ''`];
  const values = [];
  if (filters.region) {
    clauses.push(`${alias}.region = ?`);
    values.push(String(filters.region));
  }
  if (filters.district) {
    clauses.push(`${alias}.district = ?`);
    values.push(String(filters.district));
  }
  if (filters.facility) {
    clauses.push(`${alias}.site = ?`);
    values.push(String(filters.facility));
  }
  if (filters.implementingPartner) {
    clauses.push(`${alias}.mechanism = ?`);
    values.push(String(filters.implementingPartner));
  }
  if (filters.orgUnit && filters.orgUnit !== "__ALL__") {
    clauses.push(`${alias}.id = ?`);
    values.push(String(filters.orgUnit));
  }
  return {
    sql: `WHERE ${clauses.join(" AND ")}`,
    values
  };
};

export const storeCoverage = ({ orgUnit, period = "", year = "", month = "", region = "", district = "", facility = "", implementingPartner = "" } = {}) => {
  const database = openDb();
  const filters = { orgUnit, period, year, month, region, district, facility, implementingPartner };
  const metadataWhere = buildOrgUnitWhere(filters, "ou");
  const reportingWhere = buildWhere(filters);
  const activeRows = database
    .prepare(`
      SELECT
        COALESCE(NULLIF(ou.region, ''), 'Unknown Region') AS region,
        COALESCE(NULLIF(ou.district, ''), 'Unknown District') AS district,
        COUNT(DISTINCT ou.id) AS activeSites
      FROM org_units ou
      ${metadataWhere.sql}
        AND EXISTS (SELECT 1 FROM data_values dv WHERE dv.org_unit = ou.id)
      GROUP BY region, district
    `)
    .all(...metadataWhere.values);
  const reportingRows = database
    .prepare(`
      SELECT
        COALESCE(NULLIF(ou.region, ''), 'Unknown Region') AS region,
        COALESCE(NULLIF(ou.district, ''), 'Unknown District') AS district,
        COUNT(DISTINCT dv.org_unit) AS reportingSites,
        MAX(dv.period) AS lastReportedPeriod,
        COALESCE(SUM(CASE WHEN dv.data_element_name = 'eHES_RE01: Total individuals presenting for Interviewing by entry points' THEN dv.value ELSE 0 END), 0) AS enrolled,
        COALESCE(SUM(CASE WHEN dv.data_element_name = 'eHES_AC01: Number of interviews completed' THEN dv.value ELSE 0 END), 0) AS completed,
        COALESCE(SUM(CASE WHEN dv.data_element_name = 'eHES_AC02: Number of interviews aborted' THEN dv.value ELSE 0 END), 0) AS aborted
      FROM data_values dv
      LEFT JOIN org_units ou ON ou.id = dv.org_unit
      ${reportingWhere.sql}
      GROUP BY region, district
    `)
    .all(...reportingWhere.values);
  const reportingByDistrict = new Map(reportingRows.map((row) => [`${row.region}||${row.district}`, row]));
  const districtRows = activeRows
    .map((row) => {
      const reporting = reportingByDistrict.get(`${row.region}||${row.district}`) || {};
      const activeSites = Number(row.activeSites || 0);
      const reportingSites = Number(reporting.reportingSites || 0);
      const completed = Number(reporting.completed || 0);
      const enrolled = Number(reporting.enrolled || 0);
      return {
        region: row.region,
        district: row.district,
        activeSites,
        reportingSites,
        silentSites: Math.max(activeSites - reportingSites, 0),
        reportingRate: activeSites ? Number(((reportingSites / activeSites) * 100).toFixed(1)) : 0,
        enrolled,
        completed,
        aborted: Number(reporting.aborted || 0),
        completionRate: enrolled ? Number(((completed / enrolled) * 100).toFixed(1)) : 0,
        lastReportedPeriod: reporting.lastReportedPeriod || ""
      };
    })
    .sort((a, b) => b.reportingSites - a.reportingSites || b.activeSites - a.activeSites || a.district.localeCompare(b.district));

  const activeSites = database
    .prepare(`
      SELECT
        ou.id AS siteId,
        COALESCE(NULLIF(ou.region, ''), 'Unknown Region') AS region,
        COALESCE(NULLIF(ou.district, ''), 'Unknown District') AS district,
        COALESCE(NULLIF(ou.site, ''), NULLIF(ou.name, ''), ou.id) AS site,
        COALESCE(NULLIF(ou.mechanism, ''), 'Unknown IM') AS implementingPartner
      FROM org_units ou
      ${metadataWhere.sql}
        AND EXISTS (SELECT 1 FROM data_values dv WHERE dv.org_unit = ou.id)
      ORDER BY district, site
    `)
    .all(...metadataWhere.values);
  const reportingSites = database
    .prepare(`
      SELECT
        dv.org_unit AS siteId,
        MAX(dv.period) AS lastReportedPeriod,
        COALESCE(SUM(CASE WHEN dv.data_element_name = 'eHES_RE01: Total individuals presenting for Interviewing by entry points' THEN dv.value ELSE 0 END), 0) AS enrolled,
        COALESCE(SUM(CASE WHEN dv.data_element_name = 'eHES_AC01: Number of interviews completed' THEN dv.value ELSE 0 END), 0) AS completed,
        COALESCE(SUM(CASE WHEN dv.data_element_name = 'eHES_AC02: Number of interviews aborted' THEN dv.value ELSE 0 END), 0) AS aborted
      FROM data_values dv
      LEFT JOIN org_units ou ON ou.id = dv.org_unit
      ${reportingWhere.sql}
      GROUP BY dv.org_unit
    `)
    .all(...reportingWhere.values);
  const reportingBySite = new Map(reportingSites.map((row) => [row.siteId, row]));
  const siteRows = activeSites.map((site) => {
    const reporting = reportingBySite.get(site.siteId);
    const enrolled = Number(reporting?.enrolled || 0);
    const completed = Number(reporting?.completed || 0);
    return {
      ...site,
      status: reporting ? "Reporting" : "Silent",
      lastReportedPeriod: reporting?.lastReportedPeriod || "",
      enrolled,
      completed,
      aborted: Number(reporting?.aborted || 0),
      completionRate: enrolled ? Number(((completed / enrolled) * 100).toFixed(1)) : 0
    };
  });
  const summary = districtRows.reduce(
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
    districts: districtRows,
    sites: siteRows
  };
};

export const storeDataElements = ({ period, orgUnit, query = "", ...filters }) => {
  const { sql, values } = buildWhere({ ...filters, period, orgUnit });
  const rows = openDb()
    .prepare(`
      SELECT
        dv.data_element_name AS dataElement,
        '' AS code,
        dv.data_element_name AS name,
        COALESCE(SUM(dv.value), 0) AS value,
        '' AS categoryOptionCombo,
        MAX(dv.last_updated) AS lastUpdated
      FROM data_values dv
      LEFT JOIN org_units ou ON ou.id = dv.org_unit
      ${sql}
      GROUP BY dv.data_element, dv.data_element_name
      ORDER BY dv.data_element_name
    `)
    .all(...values)
    .map((row) => ({ ...row, value: Number(row.value || 0) }));
  const q = String(query || "").toLowerCase().trim();
  return q ? rows.filter((row) => row.name.toLowerCase().includes(q)) : rows;
};

export const storeTrends = ({ dataElement, startPeriod, endPeriod, ...filters }) => {
  const { sql, values } = buildWhere(filters, { includePeriod: false });
  return openDb()
    .prepare(`
      SELECT dv.period, COALESCE(SUM(dv.value), 0) AS value
      FROM data_values dv
      LEFT JOIN org_units ou ON ou.id = dv.org_unit
      ${sql ? `${sql} AND` : "WHERE"} dv.data_element_name = ?
        AND dv.period BETWEEN ? AND ?
      GROUP BY dv.period
      ORDER BY dv.period
    `)
    .all(...values, dataElement, String(startPeriod), String(endPeriod))
    .map((row) => ({ period: row.period, value: Number(row.value || 0) }));
};

export const storeOrgUnitComparison = ({ period, dataElement, ...filters }) => {
  const { sql, values } = buildWhere({ ...filters, period });
  return openDb()
    .prepare(`
      SELECT
        dv.org_unit AS orgUnit,
        COALESCE(NULLIF(ou.site, ''), NULLIF(ou.name, ''), dv.org_unit_name) AS orgUnitName,
        COALESCE(SUM(dv.value), 0) AS value
      FROM data_values dv
      LEFT JOIN org_units ou ON ou.id = dv.org_unit
      ${sql ? `${sql} AND` : "WHERE"} dv.data_element_name = ?
      GROUP BY dv.org_unit, orgUnitName
      ORDER BY value DESC
    `)
    .all(...values, dataElement)
    .map((row) => ({ ...row, value: Number(row.value || 0) }));
};

export const storeMonthlyOverview = ({ period, orgUnit, ...filters }) => {
  const enrolled = metricValue({ ...filters, period, orgUnit }, "eHES_RE01: Total individuals presenting for Interviewing by entry points");
  const newClients = metricValue({ ...filters, period, orgUnit }, "eHES_RE02: Number of new clients presenting");
  const returning = metricValue({ ...filters, period, orgUnit }, "eHES_RE03: Number returning clients presenting");
  const completed = metricValue({ ...filters, period, orgUnit }, "eHES_AC01: Number of interviews completed");
  const aborted = metricValue({ ...filters, period, orgUnit }, "eHES_AC02: Number of interviews aborted");
  const { sql, values } = buildWhere({ ...filters, period, orgUnit });
  const submitted = Number(
    openDb()
      .prepare(`
        SELECT COUNT(DISTINCT dv.data_element) AS count
        FROM data_values dv
        LEFT JOIN org_units ou ON ou.id = dv.org_unit
        ${sql}
      `)
      .get(...values)?.count || 0
  );
  const expected = Number(openDb().prepare("SELECT COUNT(*) AS count FROM data_elements").get()?.count || 0);
  return {
    period,
    orgUnit,
    orgUnitName: orgUnit === "__ALL__" ? "All Sites (Aggregate)" : "",
    totalSubmittedValues: submitted,
    dataElementsInDataset: expected,
    completedFields: submitted,
    missingFields: Math.max(expected - submitted, 0),
    EnrolledClients: enrolled,
    NewClients: newClients,
    ReturningClients: returning,
    AbortedInterviews: aborted,
    CompletionRate: enrolled ? Number((completed / enrolled).toFixed(3)) : 0
  };
};

export const storeDataQuality = ({ period, orgUnit, ...filters }) => {
  const rows = storeDataElements({ period, orgUnit, ...filters });
  const present = new Set(rows.map((row) => row.dataElement));
  const allElements = openDb().prepare("SELECT DISTINCT data_element_name AS name FROM data_values WHERE data_element_name <> '' ORDER BY data_element_name").all();
  const expected = allElements.length;
  const missing = allElements.filter((row) => !present.has(row.name)).map((row) => row.name);
  const zeroValues = rows.filter((row) => Number(row.value || 0) === 0).length;
  const scopedFilters = { ...filters, period, orgUnit };
  const valueOf = (name) => metricValue(scopedFilters, name);
  const enrolled = valueOf("eHES_RE01: Total individuals presenting for Interviewing by entry points");
  const newClients = valueOf("eHES_RE02: Number of new clients presenting");
  const returningClients = valueOf("eHES_RE03: Number returning clients presenting");
  const hivPositive = valueOf("eHES_RE04: Number HIV Positive");
  const hivNegative = valueOf("eHES_RE05: Number HIV Negative");
  const hivUnknown = valueOf("eHES_RE06: Number HIV unknown sero status");
  const completed = valueOf("eHES_AC01: Number of interviews completed");
  const aborted = valueOf("eHES_AC02: Number of interviews aborted");
  const languages = valueOf("eHES_AC03: Languages done through ACASI");
  const faceToFaceCounselling = valueOf("eHES_CS01: Number of clients that received Face to Face Counselling");
  const videoCounselling = valueOf("eHES_CS02: Number of clients that received video counselling");
  const depression = valueOf("eHES_RB01: Experienced depression");
  const alcohol = valueOf("eHES_RB02: Alcohol abuse problem");
  const noCondom = valueOf("eHES_RB03: No condom use");
  const drugUse = valueOf("eHES_RB04: Drug use");
  const sexualViolence = valueOf("eHES_RB05: Clients that experienced rape/Sexual violence");
  const multiplePartners = valueOf("eHES_RB06: Clients with multiple sexual partners");
  const htsRaw = valueOf("eHES_SE01: Newly tested and / or referred for HTS (TST)");
  const htsNeg = valueOf("eHES_SE01: Newly Tested HIV Negative (HTS_NEG)");
  const tstPos = valueOf("eHES_SE01: Newly Tested HIV Positive (TST_POS)");
  const knownPositive = valueOf("eHES_SE01: Known HIV positive (HTS_Known Pos)");
  const alreadyPrep = valueOf("eHES_SE01: Already on PrEP");
  const prepNew = valueOf("eHES_SE01: Newly initiated on PrEP (PrEP_NEW)");
  const txNew = valueOf("eHES_SE01: New on ART (TX_NEW)");
  const offeredPep = valueOf("eHES_SE01: Offered PEP (Post exposure Prophylaxis)");
  const tbScreening = valueOf("eHES_SE01: TB screening");
  const stiScreening = valueOf("eHES_SE01: STI screening");
  const sgbvScreening = valueOf("eHES_SE01: SGBV screening");
  const matServices = valueOf("eHES_SE01:MAT services");
  const receivedCondoms = valueOf("eHES_SE02: Received Condoms");
  const receivedHivst = valueOf("eHES_SE02: Received HIV Self Testing Kits");
  const receivedLubricants = valueOf("eHES_SE02: Received Lubricants");
  const highRiskTotal = storeHighRiskDisaggregation({ period, orgUnit, ...filters }).total;
  const validationIssues = [];
  const fmt = (n) => Number(n || 0).toLocaleString();
  const formatIssue = ({ severity = "Warning", area, check, numeratorLabel, numerator, denominatorLabel, denominator, status = "Review", detail, scope = {} }) => {
    const difference = Number(numerator || 0) - Number(denominator || 0);
    return {
      ...(scope.Period ? scope : {}),
      Severity: severity,
      Area: area,
      Check: check,
      Numerator: numeratorLabel,
      "Numerator Value": fmt(numerator),
      Denominator: denominatorLabel,
      "Denominator Value": fmt(denominator),
      Difference: fmt(difference),
      Status: status,
      Detail: detail || `${numeratorLabel} ${fmt(numerator)} vs ${denominatorLabel} ${fmt(denominator)}`
    };
  };
  const pushIssue = ({ severity = "Warning", area, check, numeratorLabel, numerator, denominatorLabel, denominator, status = "Review", detail }) => {
    validationIssues.push(formatIssue({ severity, area, check, numeratorLabel, numerator, denominatorLabel, denominator, status, detail }));
  };
  const shouldCheck = (...values) => values.some((value) => Number(value || 0) > 0);
  const exact = ({ severity = "Critical", area, check, numeratorLabel, numerator, denominatorLabel, denominator }) => {
    if (shouldCheck(numerator, denominator) && Number(numerator || 0) !== Number(denominator || 0)) {
      pushIssue({ severity, area, check, numeratorLabel, numerator, denominatorLabel, denominator });
    }
  };
  const max = ({ severity = "Critical", area, check, numeratorLabel, numerator, denominatorLabel, denominator, status = "Review" }) => {
    if (Number(numerator || 0) > Number(denominator || 0)) {
      pushIssue({ severity, area, check, numeratorLabel, numerator, denominatorLabel, denominator, status });
    }
  };

  exact({
    area: "Registration",
    check: "RE02 + RE03 should equal RE01",
    numeratorLabel: "New clients + Returning clients",
    numerator: newClients + returningClients,
    denominatorLabel: "Total presenting for interviewing",
    denominator: enrolled
  });
  exact({
    area: "Registration",
    check: "RE04 + RE05 + RE06 should equal RE01",
    numeratorLabel: "HIV Positive + HIV Negative + HIV Unknown",
    numerator: hivPositive + hivNegative + hivUnknown,
    denominatorLabel: "Total presenting for interviewing",
    denominator: enrolled
  });
  exact({
    area: "ACASI interviews",
    check: "AC01 + AC02 should equal RE01",
    numeratorLabel: "Completed interviews + Aborted interviews",
    numerator: completed + aborted,
    denominatorLabel: "Total presenting for interviewing",
    denominator: enrolled
  });
  max({
    severity: "Warning",
    area: "ACASI interviews",
    check: "AC03 language totals should not exceed completed interviews",
    numeratorLabel: "Languages done through ACASI",
    numerator: languages,
    denominatorLabel: "Completed interviews",
    denominator: completed
  });
  exact({
    area: "HIV testing",
    check: "HTS_NEG + TST_POS should equal HTS_TST raw",
    numeratorLabel: "HTS_NEG + TST_POS",
    numerator: htsNeg + tstPos,
    denominatorLabel: "HTS_TST raw",
    denominator: htsRaw
  });
  exact({
    severity: "Warning",
    area: "HIV status",
    check: "Known positive + newly positive should equal RE04",
    numeratorLabel: "Known HIV positive + TST_POS",
    numerator: knownPositive + tstPos,
    denominatorLabel: "RE04 HIV Positive (New + Already)",
    denominator: hivPositive
  });
  max({
    severity: "Warning",
    area: "HIV testing",
    check: "HTS_TST raw should not exceed people at higher risk",
    numeratorLabel: "HTS_TST raw",
    numerator: htsRaw,
    denominatorLabel: "People at Higher Risk",
    denominator: highRiskTotal,
    status: "Capped"
  });
  max({
    area: "PrEP",
    check: "PrEP_NEW should not exceed HTS_NEG",
    numeratorLabel: "PrEP_NEW",
    numerator: prepNew,
    denominatorLabel: "HTS_NEG",
    denominator: htsNeg
  });
  max({
    area: "ART",
    check: "TX_NEW should not exceed TST_POS",
    numeratorLabel: "TX_NEW",
    numerator: txNew,
    denominatorLabel: "TST_POS",
    denominator: tstPos
  });
  [
    ["PrEP", "Already on PrEP + PrEP_NEW should not exceed people at higher risk", "Already on PrEP + PrEP_NEW", alreadyPrep + prepNew],
    ["PEP", "Offered PEP should not exceed people at higher risk", "Offered PEP", offeredPep],
    ["Screening", "TB screening should not exceed people at higher risk", "TB screening", tbScreening],
    ["Screening", "STI screening should not exceed people at higher risk", "STI screening", stiScreening],
    ["Screening", "SGBV screening should not exceed people at higher risk", "SGBV screening", sgbvScreening],
    ["MAT", "MAT services should not exceed people at higher risk", "MAT services", matServices],
    ["Commodities", "Received condoms should not exceed people at higher risk", "Received condoms", receivedCondoms],
    ["Commodities", "Received HIV self-testing kits should not exceed people at higher risk", "Received HIV self-testing kits", receivedHivst],
    ["Commodities", "Received lubricants should not exceed people at higher risk", "Received lubricants", receivedLubricants],
    ["Counselling", "Face-to-face counselling should not exceed completed interviews", "Face-to-face counselling", faceToFaceCounselling, completed, "Completed interviews"],
    ["Counselling", "Video counselling should not exceed completed interviews", "Video counselling", videoCounselling, completed, "Completed interviews"],
    ["Risk behaviours", "Depression count should not exceed people at higher risk", "Depression", depression],
    ["Risk behaviours", "Alcohol abuse count should not exceed people at higher risk", "Alcohol abuse", alcohol],
    ["Risk behaviours", "No condom use should not exceed people at higher risk", "No condom use", noCondom],
    ["Risk behaviours", "Drug use should not exceed people at higher risk", "Drug use", drugUse],
    ["Risk behaviours", "Sexual violence should not exceed people at higher risk", "Sexual violence", sexualViolence],
    ["Risk behaviours", "Multiple sexual partners should not exceed people at higher risk", "Multiple sexual partners", multiplePartners]
  ].forEach(([area, check, numeratorLabel, numerator, denominator = highRiskTotal, denominatorLabel = "People at Higher Risk"]) => {
    max({
      severity: "Warning",
      area,
      check,
      numeratorLabel,
      numerator,
      denominatorLabel,
      denominator
    });
  });
  if (missing.length) {
    validationIssues.push({
      Severity: "Info",
      Area: "Completeness",
      Check: "Missing data elements",
      Numerator: "Missing indicators",
      "Numerator Value": fmt(missing.length),
      Denominator: "Expected indicators",
      "Denominator Value": fmt(expected),
      Difference: fmt(missing.length),
      Status: "Info",
      Detail: `${fmt(missing.length)} data elements are not present in this scope.`
    });
  }
  if (zeroValues) {
    validationIssues.push({
      Severity: "Info",
      Area: "Completeness",
      Check: "Zero-value indicators",
      Numerator: "Zero-value indicators",
      "Numerator Value": fmt(zeroValues),
      Denominator: "Submitted indicators",
      "Denominator Value": fmt(rows.length),
      Difference: fmt(zeroValues),
      Status: "Info",
      Detail: `${fmt(zeroValues)} submitted indicators have zero values.`
    });
  }
  const { sql: detailSql, values: detailValues } = buildWhere(scopedFilters);
  const detailRows = openDb()
    .prepare(`
      SELECT
        dv.period AS period,
        dv.org_unit AS orgUnit,
        COALESCE(NULLIF(ou.site, ''), NULLIF(ou.name, ''), dv.org_unit_name, dv.org_unit) AS facility,
        COALESCE(NULLIF(ou.district, ''), 'Unassigned') AS district,
        COALESCE(NULLIF(ou.region, ''), 'Unassigned') AS region,
        COALESCE(NULLIF(ou.mechanism, ''), 'Unassigned') AS implementingPartner,
        SUM(CASE WHEN dv.data_element_name = ? THEN dv.value ELSE 0 END) AS enrolled,
        SUM(CASE WHEN dv.data_element_name = ? THEN dv.value ELSE 0 END) AS newClients,
        SUM(CASE WHEN dv.data_element_name = ? THEN dv.value ELSE 0 END) AS returningClients,
        SUM(CASE WHEN dv.data_element_name = ? THEN dv.value ELSE 0 END) AS hivPositive,
        SUM(CASE WHEN dv.data_element_name = ? THEN dv.value ELSE 0 END) AS hivNegative,
        SUM(CASE WHEN dv.data_element_name = ? THEN dv.value ELSE 0 END) AS hivUnknown,
        SUM(CASE WHEN dv.data_element_name = ? THEN dv.value ELSE 0 END) AS completed,
        SUM(CASE WHEN dv.data_element_name = ? THEN dv.value ELSE 0 END) AS aborted,
        SUM(CASE WHEN dv.data_element_name = ? THEN dv.value ELSE 0 END) AS languages,
        SUM(CASE WHEN dv.data_element_name = ? THEN dv.value ELSE 0 END) AS htsRaw,
        SUM(CASE WHEN dv.data_element_name = ? THEN dv.value ELSE 0 END) AS htsNeg,
        SUM(CASE WHEN dv.data_element_name = ? THEN dv.value ELSE 0 END) AS tstPos,
        SUM(CASE WHEN dv.data_element_name = ? THEN dv.value ELSE 0 END) AS knownPositive,
        SUM(CASE WHEN dv.data_element_name = ? THEN dv.value ELSE 0 END) AS prepNew,
        SUM(CASE WHEN dv.data_element_name = ? THEN dv.value ELSE 0 END) AS txNew
      FROM data_values dv
      LEFT JOIN org_units ou ON ou.id = dv.org_unit
      ${detailSql}
      GROUP BY dv.period, dv.org_unit, facility, district, region, implementingPartner
      ORDER BY dv.period DESC, region, district, facility
    `)
    .all(
      ...facilityQualityElementNames,
      ...detailValues
    );
  const facilityValidationIssues = [];
  const addFacilityIssue = (row, issue) => {
    const scope = {
      Period: row.period || "",
      Month: periodLabel(row.period),
      Facility: row.facility || "Unassigned",
      District: row.district || "Unassigned",
      Region: row.region || "Unassigned",
      IM: row.implementingPartner || "Unassigned",
      "Org Unit": row.orgUnit || ""
    };
    facilityValidationIssues.push(formatIssue({ ...issue, scope }));
  };
  const checkFacilityExact = (row, issue) => {
    if (shouldCheck(issue.numerator, issue.denominator) && Number(issue.numerator || 0) !== Number(issue.denominator || 0)) {
      addFacilityIssue(row, issue);
    }
  };
  const checkFacilityMax = (row, issue) => {
    if (Number(issue.numerator || 0) > Number(issue.denominator || 0)) addFacilityIssue(row, issue);
  };
  detailRows.forEach((row) => {
    const values = Object.fromEntries(Object.entries(row).map(([key, value]) => [key, Number(value || 0)]));
    checkFacilityExact(row, {
      severity: "Critical",
      area: "Registration",
      check: "RE02 + RE03 should equal RE01",
      numeratorLabel: "New clients + Returning clients",
      numerator: values.newClients + values.returningClients,
      denominatorLabel: "Total presenting for interviewing",
      denominator: values.enrolled
    });
    checkFacilityExact(row, {
      severity: "Critical",
      area: "Registration",
      check: "RE04 + RE05 + RE06 should equal RE01",
      numeratorLabel: "HIV Positive + HIV Negative + HIV Unknown",
      numerator: values.hivPositive + values.hivNegative + values.hivUnknown,
      denominatorLabel: "Total presenting for interviewing",
      denominator: values.enrolled
    });
    checkFacilityExact(row, {
      severity: "Critical",
      area: "ACASI interviews",
      check: "AC01 + AC02 should equal RE01",
      numeratorLabel: "Completed interviews + Aborted interviews",
      numerator: values.completed + values.aborted,
      denominatorLabel: "Total presenting for interviewing",
      denominator: values.enrolled
    });
    checkFacilityMax(row, {
      severity: "Warning",
      area: "ACASI interviews",
      check: "AC03 language totals should not exceed completed interviews",
      numeratorLabel: "Languages done through ACASI",
      numerator: values.languages,
      denominatorLabel: "Completed interviews",
      denominator: values.completed
    });
    checkFacilityExact(row, {
      severity: "Critical",
      area: "HIV testing",
      check: "HTS_NEG + TST_POS should equal HTS_TST raw",
      numeratorLabel: "HTS_NEG + TST_POS",
      numerator: values.htsNeg + values.tstPos,
      denominatorLabel: "HTS_TST raw",
      denominator: values.htsRaw
    });
    checkFacilityExact(row, {
      severity: "Warning",
      area: "HIV status",
      check: "Known positive + newly positive should equal RE04",
      numeratorLabel: "Known HIV positive + TST_POS",
      numerator: values.knownPositive + values.tstPos,
      denominatorLabel: "RE04 HIV Positive (New + Already)",
      denominator: values.hivPositive
    });
    checkFacilityMax(row, {
      severity: "Critical",
      area: "PrEP",
      check: "PrEP_NEW should not exceed HTS_NEG",
      numeratorLabel: "PrEP_NEW",
      numerator: values.prepNew,
      denominatorLabel: "HTS_NEG",
      denominator: values.htsNeg
    });
    checkFacilityMax(row, {
      severity: "Critical",
      area: "ART",
      check: "TX_NEW should not exceed TST_POS",
      numeratorLabel: "TX_NEW",
      numerator: values.txNew,
      denominatorLabel: "TST_POS",
      denominator: values.tstPos
    });
  });
  return {
    period,
    orgUnit,
    missingDataElements: missing,
    zeroValues,
    lateUpdates: 0,
    completeness: expected ? Number(((present.size / expected) * 100).toFixed(1)) : 0,
    validationIssueCount: validationIssues.length,
    facilityValidationIssueCount: facilityValidationIssues.length,
    aggregateValidationIssues: validationIssues,
    validationIssues: facilityValidationIssues
  };
};

export const storeHighRiskDisaggregation = ({ period, orgUnit, ...filters }) => {
  const { sql, values } = buildWhere({ ...filters, period, orgUnit });
  const rows = openDb()
    .prepare(`
      SELECT
        dv.data_element_name AS dataElementName,
        dv.category_option_combo AS categoryOptionCombo,
        COALESCE(coc.name, dv.category_option_combo) AS comboName,
        COALESCE(coc.option_names_json, '[]') AS optionNamesJson,
        COALESCE(SUM(dv.value), 0) AS value
      FROM data_values dv
      LEFT JOIN org_units ou ON ou.id = dv.org_unit
      LEFT JOIN category_option_combos coc ON coc.id = dv.category_option_combo
      ${sql ? `${sql} AND` : "WHERE"} dv.data_element_name IN (${highRiskElementNames.map(() => "?").join(", ")})
      GROUP BY dv.data_element_name, dv.category_option_combo, comboName, optionNamesJson
    `)
    .all(...values, ...highRiskElementNames);
  const grouped = new Map();
  for (const row of rows) {
    const group = groupAlias(groupFromCombo({
      category_option_combo: row.categoryOptionCombo,
      combo_name: row.comboName,
      option_names_json: row.optionNamesJson
    }));
    if (group.toLowerCase() === "other pp") continue;
    const existing = grouped.get(group) || { group, value: 0 };
    existing.value += Number(row.value || 0);
    grouped.set(group, existing);
  }
  const output = [...grouped.values()]
    .filter((row) => row.value > 0)
    .sort((a, b) => highRiskSortWeight(a.group) - highRiskSortWeight(b.group) || b.value - a.value);
  const total = output.reduce((sum, row) => sum + row.value, 0);
  return {
    period,
    total,
    groups: output.map((row) => ({
      ...row,
      share: total ? Number(((row.value / total) * 100).toFixed(1)) : 0
    }))
  };
};

export const storeHighRiskTrends = ({ orgUnit, startPeriod, endPeriod, ...filters }) => {
  const { sql, values } = buildWhere({ ...filters, orgUnit }, { includePeriod: false });
  const rows = openDb()
    .prepare(`
      SELECT
        dv.period,
        dv.category_option_combo AS categoryOptionCombo,
        COALESCE(coc.name, dv.category_option_combo) AS comboName,
        COALESCE(coc.option_names_json, '[]') AS optionNamesJson,
        COALESCE(SUM(dv.value), 0) AS value
      FROM data_values dv
      LEFT JOIN org_units ou ON ou.id = dv.org_unit
      LEFT JOIN category_option_combos coc ON coc.id = dv.category_option_combo
      ${sql ? `${sql} AND` : "WHERE"} dv.data_element_name IN (${highRiskElementNames.map(() => "?").join(", ")})
        AND dv.period BETWEEN ? AND ?
      GROUP BY dv.period, dv.category_option_combo, comboName, optionNamesJson
      ORDER BY dv.period
    `)
    .all(...values, ...highRiskElementNames, String(startPeriod), String(endPeriod));
  const byPeriod = new Map();
  for (const row of rows) {
    if (!isHighRiskGroup(row)) continue;
    byPeriod.set(row.period, Number(byPeriod.get(row.period) || 0) + Number(row.value || 0));
  }
  return [...byPeriod.entries()]
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([period, value]) => ({ period, value }));
};

export const storeHighRiskDashboard = ({ orgUnit, period = "", year = "", month = "", region = "", district = "", facility = "", implementingPartner = "" } = {}) => {
  const scopedFilters = { orgUnit, period, year, month, region, district, facility, implementingPartner };
  const enrolled = metricValue(scopedFilters, "eHES_RE01: Total individuals presenting for Interviewing by entry points");
  const { sql, values } = buildWhere(scopedFilters);
  const rows = openDb()
    .prepare(`
      SELECT
        dv.period,
        COALESCE(NULLIF(ou.mechanism, ''), 'Unknown IM') AS implementingPartner,
        COALESCE(NULLIF(ou.region, ''), 'Unknown Region') AS region,
        COALESCE(NULLIF(ou.district, ''), 'Unknown District') AS district,
        dv.org_unit AS siteId,
        dv.data_element_name AS dataElementName,
        dv.category_option_combo AS categoryOptionCombo,
        COALESCE(coc.name, dv.category_option_combo) AS comboName,
        COALESCE(coc.option_names_json, '[]') AS optionNamesJson,
        COALESCE(SUM(dv.value), 0) AS value
      FROM data_values dv
      LEFT JOIN org_units ou ON ou.id = dv.org_unit
      LEFT JOIN category_option_combos coc ON coc.id = dv.category_option_combo
      ${sql ? `${sql} AND` : "WHERE"} dv.data_element_name IN (${highRiskElementNames.map(() => "?").join(", ")})
      GROUP BY dv.period, implementingPartner, region, district, siteId, dataElementName, categoryOptionCombo, comboName, optionNamesJson
    `)
    .all(...values, ...highRiskElementNames)
    .filter(isHighRiskGroup);

  const groupMap = new Map();
  const imMap = new Map();
  const imGroupMap = new Map();
  const ageSexMap = new Map();
  const ageGroupMap = new Map();
  const periodMap = new Map();
  for (const row of rows) {
    const value = Number(row.value || 0);
    const group = groupAlias(groupFromCombo({
      category_option_combo: row.categoryOptionCombo,
      combo_name: row.comboName,
      option_names_json: row.optionNamesJson
    }));
    if (group.toLowerCase() === "other pp") continue;
    const age = ageFromCombo({ option_names_json: row.optionNamesJson });
    const sex = sexFromCombo({ option_names_json: row.optionNamesJson });
    const im = row.implementingPartner || "Unknown IM";

    groupMap.set(group, Number(groupMap.get(group) || 0) + value);
    if (!imMap.has(im)) imMap.set(im, { implementingPartner: im, identified: 0, sites: new Set() });
    imMap.get(im).identified += value;
    imMap.get(im).sites.add(row.siteId);

    const imGroupKey = `${im}|||${group}`;
    imGroupMap.set(imGroupKey, {
      implementingPartner: im,
      group,
      value: Number(imGroupMap.get(imGroupKey)?.value || 0) + value
    });

    const ageSexKey = `${age}|||${sex}`;
    ageSexMap.set(ageSexKey, { age, sex, value: Number(ageSexMap.get(ageSexKey)?.value || 0) + value });

    const ageGroupKey = `${age}|||${group}`;
    ageGroupMap.set(ageGroupKey, { age, group, value: Number(ageGroupMap.get(ageGroupKey)?.value || 0) + value });

    periodMap.set(row.period, Number(periodMap.get(row.period) || 0) + value);
  }

  const groupRows = [...groupMap.entries()]
    .map(([group, value]) => ({ group, value }))
    .sort((a, b) => b.value - a.value);
  const identified = groupRows.reduce((sum, row) => sum + row.value, 0);
  const groups = groupRows.map((row) => ({
    ...row,
    share: identified ? Number(((row.value / identified) * 100).toFixed(1)) : 0
  }));

  const enrolledByImRows = (() => {
    const { sql: imSql, values: imValues } = buildWhere(scopedFilters);
    return openDb()
      .prepare(`
        SELECT
          COALESCE(NULLIF(ou.mechanism, ''), 'Unknown IM') AS implementingPartner,
          COALESCE(SUM(dv.value), 0) AS enrolled
        FROM data_values dv
        LEFT JOIN org_units ou ON ou.id = dv.org_unit
        ${imSql ? `${imSql} AND` : "WHERE"} dv.data_element_name = ?
        GROUP BY implementingPartner
      `)
      .all(...imValues, "eHES_RE01: Total individuals presenting for Interviewing by entry points");
  })();
  const enrolledByIm = new Map(enrolledByImRows.map((row) => [row.implementingPartner, Number(row.enrolled || 0)]));
  const imRows = [...imMap.values()]
    .map((row) => {
      const imEnrolled = Number(enrolledByIm.get(row.implementingPartner) || 0);
      return {
        implementingPartner: row.implementingPartner,
        enrolled: imEnrolled,
        identified: row.identified,
        identifiedPercent: imEnrolled ? Number(((row.identified / imEnrolled) * 100).toFixed(1)) : 0,
        reportingSites: row.sites.size
      };
    })
    .sort((a, b) => b.identified - a.identified);

  const trendEnrollRows = (() => {
    const { sql: trendSql, values: trendValues } = buildWhere({ ...scopedFilters, period: "" }, { includePeriod: false });
    return openDb()
      .prepare(`
        SELECT dv.period, COALESCE(SUM(dv.value), 0) AS enrolled
        FROM data_values dv
        LEFT JOIN org_units ou ON ou.id = dv.org_unit
        ${trendSql ? `${trendSql} AND` : "WHERE"} dv.data_element_name = ?
        GROUP BY dv.period
      `)
      .all(...trendValues, "eHES_RE01: Total individuals presenting for Interviewing by entry points");
  })();
  const enrolledByPeriod = new Map(trendEnrollRows.map((row) => [row.period, Number(row.enrolled || 0)]));
  const trends = [...periodMap.entries()]
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([trendPeriod, trendIdentified]) => {
      const trendEnrolled = Number(enrolledByPeriod.get(trendPeriod) || 0);
      return {
        period: trendPeriod,
        enrolled: trendEnrolled,
        identified: trendIdentified,
        identifiedPercent: trendEnrolled ? Number(((trendIdentified / trendEnrolled) * 100).toFixed(1)) : 0
      };
    });

  return {
    period,
    orgUnit,
    summary: {
      enrolled,
      identified,
      identifiedPercent: enrolled ? Number(((identified / enrolled) * 100).toFixed(1)) : 0,
      groupCount: groups.length,
      leadingGroup: groups[0]?.group || "N/A",
      leadingGroupValue: groups[0]?.value || 0,
      leadingIm: imRows[0]?.implementingPartner || "N/A",
      leadingImValue: imRows[0]?.identified || 0
    },
    groups,
    imRows,
    imGroups: [...imGroupMap.values()].sort((a, b) => b.value - a.value),
    ageSex: [...ageSexMap.values()].sort((a, b) => String(a.age).localeCompare(String(b.age)) || String(a.sex).localeCompare(String(b.sex))),
    ageGroups: [...ageGroupMap.values()].sort((a, b) => String(a.age).localeCompare(String(b.age)) || b.value - a.value),
    trends
  };
};

const rankedShareRows = (map = new Map(), total = 0) =>
  [...map.entries()]
    .map(([label, value]) => ({
      label,
      value,
      share: total ? Number(((value / total) * 100).toFixed(1)) : 0
    }))
    .filter((row) => row.value > 0)
    .sort((a, b) => b.value - a.value || String(a.label).localeCompare(String(b.label)));

const riskPopulationMetricCharts = ({ dashboard, metricConfigs = [], rows = [] }) => {
  const byMetric = new Map(metricConfigs.map((metric) => [
    metric.label,
    new Map(riskPopulationGroups.map((group) => [group, 0]))
  ]));
  const aggregateByMetric = new Map(metricConfigs.map((metric) => [
    metric.label,
    { overall: 0, highRisk: 0 }
  ]));
  for (const row of rows) {
    const metric = metricConfigs.find((item) => item.dataElement === row.dataElementName);
    if (!metric) continue;
    const rawGroup = riskPopulationLabel({
      categoryOptionCombo: row.categoryOptionCombo,
      comboName: row.comboName,
      optionNamesJson: row.optionNamesJson
    });
    const lowerGroup = String(rawGroup || "").toLowerCase();
    const value = Number(row.value || 0);
    const aggregate = aggregateByMetric.get(metric.label);
    if (lowerGroup === "overall") {
      aggregate.overall += value;
      continue;
    }
    if (lowerGroup === "key populations" || lowerGroup === "priority populations") {
      aggregate.highRisk += value;
      continue;
    }
    const group = rawGroup;
    const groupMap = byMetric.get(metric.label);
    groupMap.set(group, Number(groupMap.get(group) || 0) + value);
  }
  return {
    dashboard,
    charts: metricConfigs.map((metric, index) => {
      const groupMap = byMetric.get(metric.label) || new Map();
      const aggregate = aggregateByMetric.get(metric.label) || { overall: 0, highRisk: 0 };
      const detailedHighRiskTotal = [...groupMap.entries()]
        .filter(([group]) => group !== "No risk population" && group !== "High-risk population")
        .reduce((sum, [, value]) => sum + Number(value || 0), 0);
      if (!detailedHighRiskTotal && aggregate.highRisk > 0) {
        groupMap.set("High-risk population", aggregate.highRisk);
      }
      if (!Number(groupMap.get("No risk population") || 0) && aggregate.overall > aggregate.highRisk) {
        groupMap.set("No risk population", Math.max(aggregate.overall - aggregate.highRisk, 0));
      }
      const total = [...groupMap.values()].reduce((sum, value) => sum + Number(value || 0), 0);
      const rows = [
        ...riskPopulationGroups
          .filter((group) => group !== "High-risk population" || Number(groupMap.get(group) || 0) > 0)
          .map((group) => ({ label: group, value: Number(groupMap.get(group) || 0) })),
        ...[...groupMap.entries()]
          .filter(([group]) => !riskPopulationGroups.includes(group))
          .map(([group, value]) => ({ label: group, value: Number(value || 0) }))
      ]
        .filter((row) => row.value > 0 || riskPopulationGroups.includes(row.label))
        .map((row) => ({
          ...row,
          share: total ? Number(((row.value / total) * 100).toFixed(1)) : 0
        }));
      return {
        key: `risk-population-${index + 1}`,
        title: `${metric.label} by risk population`,
        valueType: "count",
        rows
      };
    }).filter((chart) => chart.rows.some((row) => row.value > 0))
  };
};

export const storeDashboardDemographics = ({ orgUnit, dashboard = "", period = "", year = "", month = "", region = "", district = "", facility = "", implementingPartner = "" } = {}) => {
  const scopedFilters = { orgUnit, period, year, month, region, district, facility, implementingPartner };
  const normalizedDashboard = normalizeLabel(dashboard).toLowerCase();
  const { sql, values } = buildWhere(scopedFilters);
  const database = openDb();

  if (normalizedDashboard === "enrollment") {
    const rows = database
      .prepare(`
        SELECT
          dv.category_option_combo AS categoryOptionCombo,
          COALESCE(coc.name, dv.category_option_combo) AS comboName,
          COALESCE(coc.option_names_json, '[]') AS optionNamesJson,
          COALESCE(SUM(dv.value), 0) AS value
        FROM data_values dv
        LEFT JOIN org_units ou ON ou.id = dv.org_unit
        LEFT JOIN category_option_combos coc ON coc.id = dv.category_option_combo
        ${sql ? `${sql} AND` : "WHERE"} dv.data_element_name = ?
        GROUP BY categoryOptionCombo, comboName, optionNamesJson
      `)
      .all(...values, qualityElements.enrolled);
    const sexMap = new Map();
    const ageMap = new Map();
    let total = 0;
    for (const row of rows) {
      const value = Number(row.value || 0);
      if (value <= 0) continue;
      const sex = sexFromCombo({ option_names_json: row.optionNamesJson });
      const age = ageFromCombo({ option_names_json: row.optionNamesJson });
      if (sex !== "Unspecified sex") sexMap.set(sex, Number(sexMap.get(sex) || 0) + value);
      if (age !== "Unspecified age") ageMap.set(age, Number(ageMap.get(age) || 0) + value);
      total += value;
    }
    return {
      dashboard: "Enrollment",
      charts: [
        { key: "demographic-primary", title: "Enrollment by sex", valueType: "count", rows: rankedShareRows(sexMap, total) },
        { key: "demographic-secondary", title: "Enrollment by age", valueType: "count", rows: rankedShareRows(ageMap, total) }
      ]
    };
  }

  if (normalizedDashboard === "hiv testing") {
    const testingElements = [qualityElements.htsNeg, qualityElements.tstPos];
    const rows = database
      .prepare(`
        SELECT
          dv.data_element_name AS dataElementName,
          dv.category_option_combo AS categoryOptionCombo,
          COALESCE(coc.name, dv.category_option_combo) AS comboName,
          COALESCE(coc.option_names_json, '[]') AS optionNamesJson,
          COALESCE(SUM(dv.value), 0) AS value
        FROM data_values dv
        LEFT JOIN org_units ou ON ou.id = dv.org_unit
        LEFT JOIN category_option_combos coc ON coc.id = dv.category_option_combo
        ${sql ? `${sql} AND` : "WHERE"} dv.data_element_name IN (${testingElements.map(() => "?").join(", ")})
        GROUP BY dataElementName, categoryOptionCombo, comboName, optionNamesJson
      `)
      .all(...values, ...testingElements);
    const grouped = new Map();
    for (const row of rows) {
      const group = groupAlias(groupFromCombo({
        category_option_combo: row.categoryOptionCombo,
        combo_name: row.comboName,
        option_names_json: row.optionNamesJson
      }));
      if (group.toLowerCase() === "other pp") continue;
      if (!grouped.has(group)) grouped.set(group, { label: group, positive: 0, negative: 0 });
      const bucket = grouped.get(group);
      if (row.dataElementName === qualityElements.tstPos) bucket.positive += Number(row.value || 0);
      if (row.dataElementName === qualityElements.htsNeg) bucket.negative += Number(row.value || 0);
    }
    const groupRows = [...grouped.values()].map((row) => {
      const tested = Number(row.positive || 0) + Number(row.negative || 0);
      return {
        ...row,
        tested,
        yield: tested ? Number(((row.positive / tested) * 100).toFixed(1)) : 0
      };
    });
    const positiveTotal = groupRows.reduce((sum, row) => sum + row.positive, 0);
    return {
      dashboard: "HIV Testing",
      charts: [
        {
          key: "demographic-primary",
          title: "HTS yield by risk group",
          valueType: "percent",
          rows: groupRows
            .filter((row) => row.tested > 0)
            .sort((a, b) => b.yield - a.yield || b.tested - a.tested)
            .map((row) => ({ label: row.label, value: row.yield, numerator: row.positive, denominator: row.tested }))
        },
        {
          key: "demographic-secondary",
          title: "HIV positives by risk group",
          valueType: "count",
          rows: groupRows
            .filter((row) => row.positive > 0)
            .sort((a, b) => b.positive - a.positive)
            .map((row) => ({
              label: row.label,
              value: row.positive,
              share: positiveTotal ? Number(((row.positive / positiveTotal) * 100).toFixed(1)) : 0
            }))
        }
      ]
    };
  }

  const riskPopulationDashboardMetrics = {
    "condom use": [
      { label: "No Condom Use", dataElement: qualityElements.noCondomUse },
      { label: "Received Condoms", dataElement: qualityElements.receivedCondoms },
      { label: "Received Lubricants", dataElement: qualityElements.receivedLubricants }
    ],
    "other risk behaviours": [
      { label: "Depression", dataElement: qualityElements.depression },
      { label: "Alcohol Abuse", dataElement: qualityElements.alcoholAbuse },
      { label: "Drug Use", dataElement: qualityElements.drugUse },
      { label: "Sexual Violence", dataElement: qualityElements.sexualViolence },
      { label: "Multiple Partners", dataElement: qualityElements.multiplePartners }
    ]
  };
  const riskMetricConfigs = riskPopulationDashboardMetrics[normalizedDashboard];
  if (riskMetricConfigs) {
    const elements = riskMetricConfigs.map((metric) => metric.dataElement);
    const rows = database
      .prepare(`
        SELECT
          dv.data_element_name AS dataElementName,
          dv.category_option_combo AS categoryOptionCombo,
          COALESCE(coc.name, dv.category_option_combo) AS comboName,
          COALESCE(coc.option_names_json, '[]') AS optionNamesJson,
          COALESCE(SUM(dv.value), 0) AS value
        FROM data_values dv
        LEFT JOIN org_units ou ON ou.id = dv.org_unit
        LEFT JOIN category_option_combos coc ON coc.id = dv.category_option_combo
        ${sql ? `${sql} AND` : "WHERE"} dv.data_element_name IN (${elements.map(() => "?").join(", ")})
        GROUP BY dataElementName, categoryOptionCombo, comboName, optionNamesJson
      `)
      .all(...values, ...elements);
    return riskPopulationMetricCharts({
      dashboard,
      metricConfigs: riskMetricConfigs,
      rows
    });
  }

  return { dashboard, charts: [] };
};

export const storeDataElementOptions = () =>
  openDb()
    .prepare("SELECT DISTINCT data_element_name AS id, data_element_name AS name FROM data_values WHERE data_element_name <> '' ORDER BY data_element_name")
    .all();

export const storeYears = () =>
  openDb()
    .prepare("SELECT DISTINCT substr(period, 1, 4) AS year FROM data_values ORDER BY year")
    .all()
    .map((row) => row.year)
    .filter(Boolean);

export const storeFilterOptions = (filters = {}) => {
  const database = openDb();
  const periods = database.prepare("SELECT DISTINCT period FROM data_values ORDER BY period").all().map((row) => row.period);
  const years = storeYears();
  const months = [...new Set(periods.map((period) => period.slice(4, 6)))].sort();
  const metadata = database.prepare(`
    SELECT DISTINCT ou.region, ou.district, ou.site, ou.mechanism, dv.period
    FROM data_values dv
    LEFT JOIN org_units ou ON ou.id = dv.org_unit
  `).all();
  const selected = {
    year: String(filters.year || ""),
    month: String(filters.month || ""),
    period: String(filters.period || ""),
    region: String(filters.region || ""),
    district: String(filters.district || ""),
    facility: String(filters.facility || ""),
    implementingPartner: String(filters.implementingPartner || "")
  };
  const periodRows = metadata.filter((row) => {
    if (selected.period && row.period !== selected.period) return false;
    if (selected.year && !String(row.period || "").startsWith(selected.year)) return false;
    if (selected.month && String(row.period || "").slice(4, 6) !== selected.month.padStart(2, "0")) return false;
    return true;
  });
  const filterRows = ({ useRegion = false, useDistrict = false, usePartner = false, useFacility = false } = {}) =>
    periodRows.filter((row) => {
      if (useRegion && selected.region && row.region !== selected.region) return false;
      if (useDistrict && selected.district && row.district !== selected.district) return false;
      if (usePartner && selected.implementingPartner && row.mechanism !== selected.implementingPartner) return false;
      if (useFacility && selected.facility && row.site !== selected.facility) return false;
      return true;
    });
  const unique = (rows, key) => [...new Set(rows.map((row) => row[key]).filter(Boolean))].sort();
  const regions = unique(filterRows(), "region");
  const districts = unique(filterRows({ useRegion: true }), "district");
  const implementingPartners = unique(filterRows({ useRegion: true, useDistrict: true }), "mechanism");
  const facilities = unique(filterRows({ useRegion: true, useDistrict: true, usePartner: true }), "site");
  const defaultPeriod = [...periods]
    .reverse()
    .find((period) => metricValue({ period, orgUnit: "__ALL__" }, "eHES_RE01: Total individuals presenting for Interviewing by entry points") > 0)
    || periods.at(-1)
    || "";
  return { periods, defaultPeriod, years, months, regions, districts, facilities, implementingPartners };
};

export const storeIMPerformance = ({ orgUnit, metrics = [], ...filters }) => {
  const normalizedMetrics = metrics.filter((metric) => metric?.label && (metric?.dataElement || metric?.formula?.type === "highRisk"));
  const needsHighRiskMetric = normalizedMetrics.some((metric) => metric?.formula?.type === "highRisk");
  const emptyValues = () => Object.fromEntries(normalizedMetrics.map((metric) => [metric.label, 0]));
  const metricNames = new Set([
    "eHES_RE01: Total individuals presenting for Interviewing by entry points",
    "eHES_AC01: Number of interviews completed",
    "eHES_AC02: Number of interviews aborted",
    ...normalizedMetrics.map((metric) => metric.dataElement).filter(Boolean),
    ...(needsHighRiskMetric ? highRiskElementNames : [])
  ]);
  const metricNameList = [...metricNames];
  const { sql, values } = buildWhere({ ...filters, orgUnit });
  const rows = openDb()
    .prepare(`
      SELECT
        COALESCE(NULLIF(ou.agency, ''), 'Unknown Agency') AS agency,
        COALESCE(NULLIF(ou.mechanism, ''), 'Unknown IM') AS mechanism,
        dv.org_unit AS siteId,
        dv.data_element_name AS dataElementName,
        dv.category_option_combo AS categoryOptionCombo,
        COALESCE(coc.name, dv.category_option_combo) AS comboName,
        COALESCE(coc.option_names_json, '[]') AS optionNamesJson,
        COALESCE(SUM(dv.value), 0) AS value
      FROM data_values dv
      LEFT JOIN org_units ou ON ou.id = dv.org_unit
      LEFT JOIN category_option_combos coc ON coc.id = dv.category_option_combo
      ${sql ? `${sql} AND` : "WHERE"} dv.data_element_name IN (${metricNameList.map(() => "?").join(", ")})
      GROUP BY agency, mechanism, siteId, dataElementName, categoryOptionCombo, comboName, optionNamesJson
    `)
    .all(...values, ...metricNameList);
  const byAgency = new Map();

  for (const row of rows.filter((row) => metricNames.has(row.dataElementName))) {
    const agency = row.agency;
    const mechanism = row.mechanism;
    if (!byAgency.has(agency)) byAgency.set(agency, { sites: new Set(), values: emptyValues(), enrolled: 0, aborted: 0, completed: 0, mechanisms: new Map() });
    const agencyBucket = byAgency.get(agency);
    agencyBucket.sites.add(row.siteId);
    if (!agencyBucket.mechanisms.has(mechanism)) agencyBucket.mechanisms.set(mechanism, { sites: new Set(), values: emptyValues(), enrolled: 0, aborted: 0, completed: 0 });
    const mechanismBucket = agencyBucket.mechanisms.get(mechanism);
    mechanismBucket.sites.add(row.siteId);

    if (row.dataElementName === "eHES_RE01: Total individuals presenting for Interviewing by entry points") {
      agencyBucket.enrolled += Number(row.value || 0);
      mechanismBucket.enrolled += Number(row.value || 0);
    }
    if (row.dataElementName === "eHES_AC01: Number of interviews completed") {
      agencyBucket.completed += Number(row.value || 0);
      mechanismBucket.completed += Number(row.value || 0);
    }
    if (row.dataElementName === "eHES_AC02: Number of interviews aborted") {
      agencyBucket.aborted += Number(row.value || 0);
      mechanismBucket.aborted += Number(row.value || 0);
    }
    for (const metric of normalizedMetrics) {
      if (metric?.formula?.type === "highRisk") {
        if (!highRiskElementNames.includes(row.dataElementName) || !isHighRiskGroup(row)) continue;
        agencyBucket.values[metric.label] += Number(row.value || 0);
        mechanismBucket.values[metric.label] += Number(row.value || 0);
        continue;
      }
      if (row.dataElementName !== metric.dataElement) continue;
      agencyBucket.values[metric.label] += Number(row.value || 0);
      mechanismBucket.values[metric.label] += Number(row.value || 0);
    }
  }

  const sortMetric = normalizedMetrics[0]?.label;
  const agencies = [...byAgency.entries()]
    .sort((a, b) => sortMetric ? (b[1].values[sortMetric] || 0) - (a[1].values[sortMetric] || 0) : b[1].enrolled - a[1].enrolled)
    .map(([agency, bucket]) => ({
      agency,
      reportingSites: bucket.sites.size,
      enrolledClients: bucket.enrolled,
      abortedInterviews: bucket.aborted,
      completedInterviews: bucket.completed,
      completionPercent: bucket.enrolled ? Number(((bucket.completed / bucket.enrolled) * 100).toFixed(1)) : 0,
      values: bucket.values,
      mechanisms: [...bucket.mechanisms.entries()]
        .sort((a, b) => sortMetric ? (b[1].values[sortMetric] || 0) - (a[1].values[sortMetric] || 0) : b[1].enrolled - a[1].enrolled)
        .map(([mechanism, inner]) => ({
          mechanism,
          reportingSites: inner.sites.size,
          enrolledClients: inner.enrolled,
          abortedInterviews: inner.aborted,
          completedInterviews: inner.completed,
          completionPercent: inner.enrolled ? Number(((inner.completed / inner.enrolled) * 100).toFixed(1)) : 0,
          values: inner.values
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
};

export const storeDimensionPerformance = ({ orgUnit, metrics = [], dimension = "district", ...filters }) => {
  const normalizedMetrics = metrics.filter((metric) => metric?.label && (metric?.dataElement || metric?.formula?.type === "highRisk"));
  const needsHighRiskMetric = normalizedMetrics.some((metric) => metric?.formula?.type === "highRisk");
  const emptyValues = () => Object.fromEntries(normalizedMetrics.map((metric) => [metric.label, 0]));
  const metricNames = new Set([
    ...normalizedMetrics.map((metric) => metric.dataElement).filter(Boolean),
    ...(needsHighRiskMetric ? highRiskElementNames : [])
  ]);
  if (!metricNames.size) return { dimension, metrics: normalizedMetrics, rows: [] };
  const metricNameList = [...metricNames];
  const dimensionSql = {
    district: "COALESCE(NULLIF(ou.district, ''), 'Unknown District')",
    partner: "COALESCE(NULLIF(ou.mechanism, ''), 'Unknown IM')",
    agency: "COALESCE(NULLIF(ou.agency, ''), 'Unknown Agency')",
    region: "COALESCE(NULLIF(ou.region, ''), 'Unknown Region')"
  }[dimension] || "COALESCE(NULLIF(ou.district, ''), 'Unknown District')";
  const { sql, values } = buildWhere({ ...filters, orgUnit });
  const rows = openDb()
    .prepare(`
      SELECT
        ${dimensionSql} AS dimensionName,
        dv.org_unit AS siteId,
        dv.data_element_name AS dataElementName,
        dv.category_option_combo AS categoryOptionCombo,
        COALESCE(coc.name, dv.category_option_combo) AS comboName,
        COALESCE(coc.option_names_json, '[]') AS optionNamesJson,
        COALESCE(SUM(dv.value), 0) AS value
      FROM data_values dv
      LEFT JOIN org_units ou ON ou.id = dv.org_unit
      LEFT JOIN category_option_combos coc ON coc.id = dv.category_option_combo
      ${sql ? `${sql} AND` : "WHERE"} dv.data_element_name IN (${metricNameList.map(() => "?").join(", ")})
      GROUP BY dimensionName, siteId, dataElementName, categoryOptionCombo, comboName, optionNamesJson
    `)
    .all(...values, ...metricNameList);
  const byDimension = new Map();
  for (const row of rows.filter((row) => metricNames.has(row.dataElementName))) {
    if (!byDimension.has(row.dimensionName)) byDimension.set(row.dimensionName, { sites: new Set(), values: emptyValues() });
    const bucket = byDimension.get(row.dimensionName);
    bucket.sites.add(row.siteId);
    for (const metric of normalizedMetrics) {
      if (metric?.formula?.type === "highRisk") {
        if (!highRiskElementNames.includes(row.dataElementName) || !isHighRiskGroup(row)) continue;
        bucket.values[metric.label] += Number(row.value || 0);
        continue;
      }
      if (row.dataElementName !== metric.dataElement) continue;
      bucket.values[metric.label] += Number(row.value || 0);
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
        values: bucket.values
      }))
      .sort((a, b) => sortMetric ? (b.values[sortMetric] || 0) - (a.values[sortMetric] || 0) : b.reportingSites - a.reportingSites)
  };
};

export const storeDashboardDetailRows = ({ orgUnit, metrics = [], ...filters }) => {
  const normalizedMetrics = metrics.filter((metric) => metric?.label && (metric?.dataElement || metric?.formula?.type === "highRisk"));
  const needsHighRiskMetric = normalizedMetrics.some((metric) => metric?.formula?.type === "highRisk");
  const emptyValues = () => Object.fromEntries(normalizedMetrics.map((metric) => [metric.label, 0]));
  const metricNames = new Set([
    ...normalizedMetrics.map((metric) => metric.dataElement).filter(Boolean),
    ...(needsHighRiskMetric ? highRiskElementNames : [])
  ]);
  if (!metricNames.size) return { metrics: normalizedMetrics, rows: [] };
  const metricNameList = [...metricNames];
  const { sql, values } = buildWhere({ ...filters, orgUnit });
  const rows = openDb()
    .prepare(`
      SELECT
        COALESCE(NULLIF(ou.mechanism, ''), 'Unknown IM') AS mechanism,
        COALESCE(NULLIF(ou.district, ''), 'Unknown District') AS district,
        COALESCE(NULLIF(ou.site, ''), dv.org_unit_name, dv.org_unit) AS facility,
        dv.org_unit AS siteId,
        dv.data_element_name AS dataElementName,
        dv.category_option_combo AS categoryOptionCombo,
        COALESCE(coc.name, dv.category_option_combo) AS comboName,
        COALESCE(coc.option_names_json, '[]') AS optionNamesJson,
        COALESCE(SUM(dv.value), 0) AS value
      FROM data_values dv
      LEFT JOIN org_units ou ON ou.id = dv.org_unit
      LEFT JOIN category_option_combos coc ON coc.id = dv.category_option_combo
      ${sql ? `${sql} AND` : "WHERE"} dv.data_element_name IN (${metricNameList.map(() => "?").join(", ")})
      GROUP BY mechanism, district, facility, siteId, dataElementName, categoryOptionCombo, comboName, optionNamesJson
    `)
    .all(...values, ...metricNameList);
  const bySite = new Map();
  for (const row of rows.filter((item) => metricNames.has(item.dataElementName))) {
    const key = `${row.mechanism}||${row.district}||${row.facility}||${row.siteId}`;
    if (!bySite.has(key)) {
      bySite.set(key, {
        mechanism: row.mechanism,
        district: row.district,
        facility: row.facility,
        siteId: row.siteId,
        values: emptyValues()
      });
    }
    const bucket = bySite.get(key);
    for (const metric of normalizedMetrics) {
      if (metric?.formula?.type === "highRisk") {
        if (!highRiskElementNames.includes(row.dataElementName) || !isHighRiskGroup(row)) continue;
        bucket.values[metric.label] += Number(row.value || 0);
        continue;
      }
      if (row.dataElementName !== metric.dataElement) continue;
      bucket.values[metric.label] += Number(row.value || 0);
    }
  }
  const metricValue = (bucket, metric) => {
    if (metric?.formula?.type === "highRisk") return Number(bucket.values[metric.label] || 0);
    if (metric?.formula?.type === "sum") {
      return toArray(metric.formula.labels).reduce((sum, label) => {
        const source = normalizedMetrics.find((item) => item.label === label);
        return sum + (source ? metricValue(bucket, source) : 0);
      }, 0);
    }
    const raw = Number(bucket.values[metric.label] || 0);
    const highRiskMetric = normalizedMetrics.find((item) => item?.formula?.type === "highRisk");
    const denominator = highRiskMetric ? Number(bucket.values[highRiskMetric.label] || 0) : 0;
    return metric?.capToHighRisk && denominator > 0 ? Math.min(raw, denominator) : raw;
  };
  const sortMetric = normalizedMetrics.find((metric) => !metric.hidden)?.label || normalizedMetrics[0]?.label;
  return {
    metrics: normalizedMetrics,
    rows: [...bySite.values()]
      .map((bucket) => ({
        ...bucket,
        values: Object.fromEntries(normalizedMetrics.map((metric) => [metric.label, metricValue(bucket, metric)]))
      }))
      .sort((a, b) => Number(b.values[sortMetric] || 0) - Number(a.values[sortMetric] || 0))
  };
};

export const updateStoreDataValue = ({ period = "", orgUnit = "", dataElementName = "", categoryOptionCombo = "", value = 0 } = {}) => {
  if (!period || !orgUnit || !dataElementName) {
    throw new Error("period, orgUnit and dataElementName are required");
  }
  const database = openDb();
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) throw new Error("value must be a number");
  const existing = database.prepare(`
    SELECT data_element, category_option_combo, attribute_option_combo
    FROM data_values
    WHERE period = ? AND org_unit = ? AND data_element_name = ?
      AND (? = '' OR category_option_combo = ?)
    ORDER BY category_option_combo
    LIMIT 1
  `).get(String(period), String(orgUnit), String(dataElementName), String(categoryOptionCombo || ""), String(categoryOptionCombo || ""));
  if (!existing) {
    throw new Error("No matching data value found. Upload the row first, then apply corrections.");
  }
  const info = database.prepare(`
    UPDATE data_values
    SET value = ?, last_updated = ?, stored_by = ?
    WHERE period = ? AND org_unit = ? AND data_element_name = ?
      AND category_option_combo = ? AND attribute_option_combo = ?
  `).run(
    numericValue,
    new Date().toISOString(),
    "admin-correction",
    String(period),
    String(orgUnit),
    String(dataElementName),
    existing.category_option_combo,
    existing.attribute_option_combo
  );
  return {
    updatedRows: info.changes,
    period,
    orgUnit,
    dataElementName,
    categoryOptionCombo: existing.category_option_combo,
    value: numericValue
  };
};

export const storeHighRiskGroupPerformance = ({ orgUnit, metrics = [], ...filters }) => {
  const normalizedMetrics = metrics.filter((metric) => metric?.label && (metric?.dataElement || metric?.formula?.type === "highRisk"));
  const needsHighRiskMetric = normalizedMetrics.some((metric) => metric?.formula?.type === "highRisk");
  const emptyValues = () => Object.fromEntries(normalizedMetrics.map((metric) => [metric.label, 0]));
  const metricNames = new Set([
    ...normalizedMetrics.map((metric) => metric.dataElement).filter(Boolean),
    ...(needsHighRiskMetric ? highRiskElementNames : [])
  ]);
  if (!metricNames.size) return { metrics: normalizedMetrics, rows: [] };
  const metricNameList = [...metricNames];
  const { sql, values } = buildWhere({ ...filters, orgUnit });
  const rows = openDb()
    .prepare(`
      SELECT
        dv.data_element_name AS dataElementName,
        dv.category_option_combo AS categoryOptionCombo,
        COALESCE(coc.name, dv.category_option_combo) AS comboName,
        COALESCE(coc.option_names_json, '[]') AS optionNamesJson,
        COALESCE(SUM(dv.value), 0) AS value
      FROM data_values dv
      LEFT JOIN org_units ou ON ou.id = dv.org_unit
      LEFT JOIN category_option_combos coc ON coc.id = dv.category_option_combo
      ${sql ? `${sql} AND` : "WHERE"} dv.data_element_name IN (${metricNameList.map(() => "?").join(", ")})
      GROUP BY dataElementName, categoryOptionCombo, comboName, optionNamesJson
    `)
    .all(...values, ...metricNameList);
  const grouped = new Map(highRiskFocusGroups.map((group) => [group, { group, values: emptyValues() }]));
  for (const row of rows.filter((item) => metricNames.has(item.dataElementName))) {
    const group = groupAlias(groupFromCombo({
      category_option_combo: row.categoryOptionCombo,
      combo_name: row.comboName,
      option_names_json: row.optionNamesJson
    }));
    if (group.toLowerCase() === "other pp" || !highRiskFocusGroups.includes(group)) continue;
    if (!grouped.has(group)) grouped.set(group, { group, values: emptyValues() });
    const bucket = grouped.get(group);
    for (const metric of normalizedMetrics) {
      if (metric?.formula?.type === "highRisk") {
        if (!highRiskElementNames.includes(row.dataElementName)) continue;
        bucket.values[metric.label] += Number(row.value || 0);
        continue;
      }
      if (row.dataElementName !== metric.dataElement) continue;
      bucket.values[metric.label] += Number(row.value || 0);
    }
  }
  return {
    metrics: normalizedMetrics,
    rows: [...grouped.values()]
      .filter((row) => Object.values(row.values).some((value) => Number(value || 0) > 0))
      .sort((a, b) => highRiskSortWeight(a.group) - highRiskSortWeight(b.group) || (b.values["People at Higher Risk"] || 0) - (a.values["People at Higher Risk"] || 0))
  };
};

export const seedStoreFromMonthlyCache = ({ cacheDirs = [] } = {}) => {
  const database = openDb();
  let filesRead = 0;
  let rowsUpserted = 0;
  const seen = new Set();
  for (const dir of cacheDirs) {
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!/^\d{6}-.+\.json$/.test(file)) continue;
      const fullPath = path.join(dir, file);
      if (seen.has(fullPath)) continue;
      seen.add(fullPath);
      try {
        const payload = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
        const rows = payload?.rows || [];
        if (!rows.length) continue;
        upsertDataValues(rows, payload.fetchedAt || new Date().toISOString());
        filesRead += 1;
        rowsUpserted += rows.length;
      } catch {}
    }
  }
  return { filesRead, rowsUpserted, ...getStoreStats(), databasePath: database.location?.() || dbPath };
};
