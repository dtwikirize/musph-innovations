import { readCache, writeCache } from "./cacheService.js";

const defaultTargets = [
  { service: "HTS Coverage", target: 90, year: "", partner: "", funder: "", updatedAt: "", source: "default" },
  { service: "PrEP Uptake", target: 60, year: "", partner: "", funder: "", updatedAt: "", source: "default" },
  { service: "ART Uptake", target: 95, year: "", partner: "", funder: "", updatedAt: "", source: "default" }
];

const normalizeTarget = (target = {}) => ({
  service: String(target.service || "").trim(),
  target: Number(target.target || 0),
  year: String(target.year || "").trim(),
  partner: String(target.partner || "").trim(),
  funder: String(target.funder || "").trim(),
  updatedAt: target.updatedAt || new Date().toISOString(),
  source: target.source || "admin"
});

export const getTargets = async () => {
  const configured = (await readCache("dashboard-targets", [])) || [];
  const keys = new Set(configured.map((target) => `${target.service}|${target.year}|${target.partner}|${target.funder}`));
  return [
    ...configured.map(normalizeTarget),
    ...defaultTargets.filter((target) => !keys.has(`${target.service}|${target.year}|${target.partner}|${target.funder}`))
  ];
};

export const saveTargets = async (targets = []) => {
  const normalized = targets
    .map(normalizeTarget)
    .filter((target) => target.service && target.target > 0);
  await writeCache("dashboard-targets", normalized);
  return normalized;
};

export const resolveTargets = async ({ year = "", partner = "", funder = "" } = {}) => {
  const targets = await getTargets();
  const score = (target) => {
    if (target.year && target.year !== String(year || "")) return -1;
    if (target.partner && target.partner !== String(partner || "")) return -1;
    if (target.funder && target.funder !== String(funder || "")) return -1;
    return Number(Boolean(target.year)) + Number(Boolean(target.partner)) + Number(Boolean(target.funder));
  };
  const byService = new Map();
  for (const target of targets) {
    const targetScore = score(target);
    if (targetScore < 0) continue;
    const existing = byService.get(target.service);
    if (!existing || targetScore > existing.score) {
      byService.set(target.service, { ...target, score: targetScore });
    }
  }
  return [...byService.values()].map(({ score: _score, ...target }) => target);
};
