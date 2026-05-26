import { seedStoreFromMonthlyCache } from "../services/dhis2StoreService.js";
import { monthlyDataCacheDir } from "../config/paths.js";

const result = seedStoreFromMonthlyCache({ cacheDirs: [monthlyDataCacheDir] });
console.log(JSON.stringify(result, null, 2));
