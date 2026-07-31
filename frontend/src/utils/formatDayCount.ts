export function formatDayCount(value: number): string {
  const safeValue = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
  const lastTwo = safeValue % 100;
  const last = safeValue % 10;
  const suffix =
    lastTwo >= 11 && lastTwo <= 14 ? "дней" : last === 1 ? "день" : last >= 2 && last <= 4 ? "дня" : "дней";
  return `${safeValue} ${suffix}`;
}
