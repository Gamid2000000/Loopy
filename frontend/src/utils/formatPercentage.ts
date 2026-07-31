export function formatPercentage(value: number): string {
  const safeValue = Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
  return `${Number(safeValue.toFixed(2)).toLocaleString("ru-RU", { maximumFractionDigits: 2 })}%`;
}
