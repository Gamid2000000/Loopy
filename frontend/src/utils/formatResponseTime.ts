export function formatResponseTime(milliseconds: number): string {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) return "0 сек";
  if (milliseconds < 1_000) return "< 1 сек";
  const seconds = Math.floor(milliseconds / 1_000);
  const restMilliseconds = milliseconds % 1_000;
  if (seconds < 60) {
    const value = seconds + restMilliseconds / 1_000;
    return `${Number(value.toFixed(2)).toLocaleString("ru-RU")} сек`;
  }
  const minutes = Math.floor(seconds / 60);
  const restSeconds = seconds % 60;
  return `${minutes} мин${restSeconds > 0 ? ` ${restSeconds} сек` : ""}`;
}
