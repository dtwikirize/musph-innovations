import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dashboardPath = path.join(root, "public", "data", "crane-fsw-dashboard.json");
const rawPath = path.join(root, "public", "data", "crane-fsw-tables.json");

const dashboard = JSON.parse(fs.readFileSync(dashboardPath, "utf8"));
const raw = JSON.parse(fs.readFileSync(rawPath, "utf8"));

const themeMeta = new Map(
  dashboard.themes.map((theme) => [
    theme.key,
    { key: theme.key, name: theme.name, tableTitle: theme.tableTitle },
  ]),
);

function cleanCell(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function parseNum(value) {
  const match = cleanCell(value).replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : NaN;
}

function cleanGroup(value) {
  return cleanCell(value)
    .replace(/\s*\(N\s*=.*?\)\s*/i, "")
    .replace(/\s*\(n\s*=.*?\)\s*/i, "")
    .replace(/[:：]\s*$/, "")
    .trim();
}

const siteThemes = {};

for (const table of raw.tables) {
  const site = cleanCell(table.site);
  if (!site || site === "All sites") continue;

  const key = cleanCell(table.code).match(/^[A-Z]+/)?.[0];
  if (!key || !themeMeta.has(key)) continue;

  let currentGroup = "";
  const indicators = [];

  for (const row of table.rows || []) {
    const characteristic = cleanCell(row[0]);
    if (!characteristic || /^Characteristic$/i.test(characteristic) || /^Unweighted$/i.test(characteristic)) continue;
    if (/^\* For continuous variables/i.test(characteristic) || /summary$/i.test(characteristic)) continue;

    const estimate = parseNum(row[3]);
    if (!Number.isFinite(estimate)) {
      if (row.length <= 2 || row.slice(1).every((cell) => !cleanCell(cell))) {
        currentGroup = cleanGroup(characteristic);
      }
      continue;
    }

    const group = currentGroup && !characteristic.endsWith("*") ? currentGroup : "";
    const shortLabel = characteristic;

    indicators.push({
      label: group ? `${group}: ${shortLabel}` : shortLabel,
      shortLabel,
      group,
      estimate,
      lower: parseNum(row[4]),
      upper: parseNum(row[5]),
      unweightedN: cleanCell(row[1]),
      unweightedPct: cleanCell(row[2]),
      site,
      tableIndex: table.index,
      tableCode: table.code,
    });
  }

  if (!indicators.length) continue;

  siteThemes[site] ||= {};
  const existing = siteThemes[site][key]?.allIndicators || [];
  siteThemes[site][key] = {
    ...themeMeta.get(key),
    site,
    allIndicators: existing.concat(indicators),
  };
}

for (const site of Object.keys(siteThemes)) {
  for (const key of Object.keys(siteThemes[site])) {
    const theme = siteThemes[site][key];
    const seen = new Set();
    theme.allIndicators = theme.allIndicators.filter((item) => {
      const id = `${item.label}|${item.estimate}|${item.tableIndex}`;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
    theme.indicatorCount = theme.allIndicators.length;
  }
}

dashboard.siteThemes = siteThemes;
dashboard.source.siteThemesBuiltOn = new Date().toISOString().slice(0, 10);

fs.writeFileSync(dashboardPath, `${JSON.stringify(dashboard, null, 2)}\n`);

console.log(
  JSON.stringify({
    sites: Object.keys(siteThemes).length,
    themesByFirstSite: Object.fromEntries(
      Object.entries(Object.values(siteThemes)[0] || {}).map(([key, theme]) => [key, theme.indicatorCount]),
    ),
  }),
);
