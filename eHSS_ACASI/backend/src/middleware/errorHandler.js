export const notFound = (req, res) => res.status(404).json({ message: "Route not found" });

export const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Internal server error";
  if (status >= 500) console.error("Unhandled error:", message);
  res.status(status).json({ message });
};
