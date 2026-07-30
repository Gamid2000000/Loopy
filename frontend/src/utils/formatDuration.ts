export function formatDuration(milliseconds: number): string {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) return "0 мин";
  if (milliseconds < 60_000) return "< 1 мин";
  const minutes = Math.floor(milliseconds / 60_000),
    hours = Math.floor(minutes / 60),
    rest = minutes % 60;
  return hours > 0 ? `${hours} ч${rest > 0 ? ` ${rest} мин` : ""}` : `${minutes} мин`;
}
