export const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export const safeDivide = (num, den) => (toNumber(den) === 0 ? 0 : toNumber(num) / toNumber(den));
export const percentage = (num, den) => safeDivide(num, den) * 100;
export const formatPercent = (num, den, digits = 1) => `${percentage(num, den).toFixed(digits)}%`;
export const sumValues = (arr = [], key = "value") => arr.reduce((acc, item) => acc + toNumber(item[key]), 0);
export const sortPeriods = (periods = []) => [...periods].sort((a, b) => String(a).localeCompare(String(b)));
