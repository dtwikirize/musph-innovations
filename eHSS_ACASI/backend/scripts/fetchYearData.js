import "dotenv/config";
import { fetchMonthlyDataRange } from "../src/services/monthlyDatasetService.js";

const args = Object.fromEntries(process.argv.slice(2).map((arg) => arg.replace(/^--/, "").split("=")));
if (!args.year || !args.orgUnit) {
  console.error("Usage: node backend/scripts/fetchYearData.js --year=2025 --orgUnit=UID");
  process.exit(1);
}
const data = await fetchMonthlyDataRange({
  startPeriod: `${args.year}01`,
  endPeriod: `${args.year}12`,
  orgUnit: args.orgUnit,
  force: true
});
console.log(JSON.stringify({ year: args.year, orgUnit: args.orgUnit, rows: data.rows.length }, null, 2));
