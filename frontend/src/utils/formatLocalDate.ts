const monthFormatter = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long" });
const weekdayFormatter = new Intl.DateTimeFormat("ru-RU", { weekday: "short" });

function asLocalDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatLocalDate(value: string, options: "monthDay" | "weekday" = "monthDay"): string {
  const date = asLocalDate(value);
  if (!date) return value;
  return options === "weekday" ? weekdayFormatter.format(date) : monthFormatter.format(date);
}

export function formatPeriodRange(fromDate: string, toDate: string): string | null {
  if (!fromDate || !toDate) return null;
  return `${formatLocalDate(fromDate)} — ${formatLocalDate(toDate)}`;
}
