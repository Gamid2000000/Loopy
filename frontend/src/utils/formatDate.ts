export function formatDate(value: string, timezone?: string): string {
  try {
    return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", timeZone: timezone }).format(
      new Date(value),
    );
  } catch {
    return value;
  }
}
