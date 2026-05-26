import "dotenv/config";
import { fetchDhis2Me } from "../src/services/monthlyDatasetService.js";

const data = await fetchDhis2Me();
console.log(JSON.stringify(data, null, 2));
