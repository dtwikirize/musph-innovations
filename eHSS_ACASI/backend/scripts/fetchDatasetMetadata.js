import "dotenv/config";
import { fetchDatasetMetadata } from "../src/services/monthlyDatasetService.js";

const data = await fetchDatasetMetadata({ force: true });
console.log(JSON.stringify({ id: data.id, name: data.name, periodType: data.periodType }, null, 2));
