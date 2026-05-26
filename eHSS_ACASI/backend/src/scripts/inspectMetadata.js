import "dotenv/config";
import { fetchDatasetMetadata, getDatasetOrgUnits } from "../services/monthlyDatasetService.js";

const run = async () => {
  const [dataset, orgUnits] = await Promise.all([fetchDatasetMetadata({ force: true }), getDatasetOrgUnits()]);
  console.log(JSON.stringify({
    counts: {
      dataElements: dataset.dataSetElements?.length || 0,
      organisationUnits: orgUnits.length,
      sections: dataset.sections?.length || 0
    },
    samples: {
      dataElements: (dataset.dataSetElements || []).slice(0, 5).map((dse) => dse.dataElement),
      organisationUnits: orgUnits.slice(0, 5),
      sections: dataset.sections?.slice(0, 5) || []
    }
  }, null, 2));
};

run().catch((error) => {
  console.error("Metadata inspection failed:", error.message);
  process.exit(1);
});
