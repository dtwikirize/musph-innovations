import { hydrateAllUsedCategoryOptionCombos } from "../services/dhis2StoreService.js";

const result = await hydrateAllUsedCategoryOptionCombos();
console.log(JSON.stringify(result, null, 2));
