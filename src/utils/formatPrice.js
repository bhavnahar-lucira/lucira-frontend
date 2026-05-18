export const formatPrice = (num) => {
  if (num === null || num === undefined) return "0";
  // Convert to absolute integer to avoid any .00 trailing
  const val = Math.round(Number(num));
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  }).format(val);
};
