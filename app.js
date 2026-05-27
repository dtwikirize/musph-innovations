import("./server.mjs").catch((error) => {
  console.error("Failed to start musph.cc portal:", error);
  process.exit(1);
});
