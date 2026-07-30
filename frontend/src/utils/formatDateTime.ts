export function formatDateTime(value: string, timezone?: string): string {
  try {
    return new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short", timeZone: timezone }).format(
      new Date(value),
    );
  } catch {
    return value;
  }
}
