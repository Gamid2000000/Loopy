export function formatPercentage(value: number): string {
  return `${Math.round(Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0)))}%`;
}
