export const dhis2Mappings = {
  enrollment: {
    totalPresenting: { code: "eHES_RE01", name: "Total individuals presenting for Interviewing by entry points", uid: "" },
    newClients: { code: "eHES_RE02", name: "Number of new clients presenting", uid: "" },
    returningClients: { code: "eHES_RE03", name: "Number returning clients presenting", uid: "" },
    hivPositiveAtEntry: { code: "eHES_RE04", name: "Number HIV Positive", uid: "" },
    hivNegativeAtEntry: { code: "eHES_RE05", name: "Number HIV Negative", uid: "" },
    hivUnknownStatus: { code: "eHES_RE06", name: "Number HIV unknown sero status", uid: "" },
    completedInterviews: { code: "eHES_AC01", name: "Number of interviews completed", uid: "" },
    abortedInterviews: { code: "eHES_AC02", name: "Number of interviews aborted", uid: "" }
  },
  counselling: {
    acasiLanguages: { code: "eHES_AC03", name: "Languages done through ACASI", uid: "" },
    faceToFaceCounselling: { code: "eHES_CS01", name: "Number of clients that received Face to Face Counselling", uid: "" },
    videoCounselling: { code: "eHES_CS02", name: "Number of clients that received video counselling", uid: "" }
  },
  riskBehaviour: {
    depression: { code: "eHES_RB01", name: "Experienced depression", uid: "" },
    alcoholAbuse: { code: "eHES_RB02", name: "Alcohol abuse problem", uid: "" },
    noCondomUse: { code: "eHES_RB03", name: "No condom use", uid: "" },
    drugUse: { code: "eHES_RB04", name: "Drug use", uid: "" },
    sexualViolence: { code: "eHES_RB05", name: "Clients that experienced rape / sexual violence", uid: "" },
    multipleSexualPartners: { code: "eHES_RB06", name: "Clients with multiple sexual partners", uid: "" }
  },
  services: {
    htsTst: { code: "HTS_TST", name: "Newly tested and / or referred for HTS", uid: "" },
    htsNeg: { code: "HTS_NEG", name: "Newly Tested HIV Negative", uid: "" },
    tstPos: { code: "TST_POS", name: "Newly Tested HIV Positive", uid: "" },
    knownPositive: { code: "HTS_KNOWN_POS", name: "Known HIV positive", uid: "" },
    txNew: { code: "TX_NEW", name: "New on ART", uid: "" },
    alreadyOnPrep: { code: "ALREADY_ON_PREP", name: "Already on PrEP", uid: "" },
    prepNew: { code: "PREP_NEW", name: "Newly initiated on PrEP", uid: "" },
    offeredPep: { code: "PEP_OFFERED", name: "Offered PEP", uid: "" },
    sgbvScreening: { code: "SGBV_SCREENING", name: "SGBV screening", uid: "" },
    stiScreening: { code: "STI_SCREENING", name: "STI screening", uid: "" },
    tbScreening: { code: "TB_SCREENING", name: "TB screening", uid: "" },
    matServices: { code: "MAT_SERVICES", name: "MAT services", uid: "" },
    condomsReceived: { code: "CONDOMS_RECEIVED", name: "Received Condoms", uid: "" },
    hivstKitsReceived: { code: "HIVST_KITS_RECEIVED", name: "Received HIV Self Testing Kits", uid: "" },
    lubricantsReceived: { code: "LUBRICANTS_RECEIVED", name: "Received Lubricants", uid: "" }
  },
  populationGroups: {
    keyPopulations: ["MAR", "PWID", "SW / FSW"],
    priorityPopulations: [
      "Boda Boda",
      "Clients of Sex Workers",
      "Discordant Couples / DC",
      "Fisher Folks",
      "Mobile Populations / MP",
      "Non-Injecting Drug Users / NIDU",
      "Pregnant and Breastfeeding Women / PBFW",
      "Uniformed Forces / UF"
    ]
  }
};

export const mappingStatus = () => {
  const missing = [];
  const walk = (obj, path = []) => {
    for (const [key, value] of Object.entries(obj)) {
      if (value && typeof value === "object" && !Array.isArray(value) && "code" in value) {
        if (!value.uid) missing.push({ section: path.join("."), key, code: value.code, name: value.name });
      } else if (value && typeof value === "object" && !Array.isArray(value)) {
        walk(value, [...path, key]);
      }
    }
  };
  walk(dhis2Mappings);
  return { totalMissing: missing.length, missing };
};
