export const groupBy = (rows = [], key) =>
  rows.reduce((acc, row) => {
    const k = row?.[key] ?? "Unknown";
    if (!acc[k]) acc[k] = [];
    acc[k].push(row);
    return acc;
  }, {});

export const groupByAgency = (rows) => groupBy(rows, "agency");
export const groupBySite = (rows) => groupBy(rows, "site_name");
export const groupByPopulationCategory = (rows) => groupBy(rows, "population_category");
