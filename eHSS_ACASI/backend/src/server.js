import app from "./app.js";
import { ensureCacheDir, readCache } from "./services/cacheService.js";
import { runScheduledRefresh, scheduleTwiceMonthlyRefresh } from "./services/refreshService.js";

const port = Number(process.env.PORT || 3000);

const bootstrap = async () => {
  await ensureCacheDir();
  const existing = await readCache("last-refresh", null);
  if (!existing) {
    try {
      await runScheduledRefresh();
    } catch (error) {
      console.error("Startup refresh failed:", error.message);
    }
  }
  scheduleTwiceMonthlyRefresh();
  app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
  });
};

bootstrap().catch((error) => {
  console.error("Server bootstrap failed:", error.message);
  process.exit(1);
});
