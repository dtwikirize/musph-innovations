const dashboardCache = new Map();
const DASHBOARD_CACHE_TTL_MS = 15000;
const DASHBOARD_CACHE_LIMIT = 120;

export const clearDashboardCache = () => dashboardCache.clear();

const pruneDashboardCache = (now = Date.now()) => {
  for (const [key, entry] of dashboardCache.entries()) {
    if (entry.expiresAt <= now) dashboardCache.delete(key);
  }
  while (dashboardCache.size > DASHBOARD_CACHE_LIMIT) {
    const oldestKey = dashboardCache.keys().next().value;
    dashboardCache.delete(oldestKey);
  }
};

export const dashboardCacheMiddleware = (req, res, next) => {
  if (req.method !== "GET") return next();
  const now = Date.now();
  pruneDashboardCache(now);
  const key = req.originalUrl;
  const hit = dashboardCache.get(key);
  if (hit && hit.expiresAt > now) {
    res.set("X-Dashboard-Cache", "HIT");
    return res.json(hit.body);
  }
  const sendJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode < 400) {
      dashboardCache.set(key, { body, expiresAt: Date.now() + DASHBOARD_CACHE_TTL_MS });
      pruneDashboardCache();
      res.set("X-Dashboard-Cache", "MISS");
    }
    return sendJson(body);
  };
  return next();
};
