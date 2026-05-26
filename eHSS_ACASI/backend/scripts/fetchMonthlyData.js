import "dotenv/config";
import { fetchMonthlyData } from "../src/services/monthlyDatasetService.js";

const args = Object.fromEntries(process.argv.slice(2).map((arg) => arg.replace(/^--/, "").split("=")));
if (!args.period || !args.orgUnit) {
  console.error("Usage: node backend/scripts/fetchMonthlyData.js --period=202501 --orgUnit=UID");
  process.exit(1);
}
const data = await fetchMonthlyData({ period: args.period, orgUnit: args.orgUnit, force: true });
console.log(JSON.stringify({ period: data.period, orgUnit: data.orgUnit, rows: data.rows.length }, null, 2));
