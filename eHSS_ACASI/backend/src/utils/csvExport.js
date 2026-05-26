export const toCsv = (rows = []) => {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = rows.map((row) =>
    headers.map((h) => `"${String(row[h] ?? "").replaceAll('"', '""')}"`).join(",")
  );
  return [headers.join(","), ...lines].join("\n");
};
