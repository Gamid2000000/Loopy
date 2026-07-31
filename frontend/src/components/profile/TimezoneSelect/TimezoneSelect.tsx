import { useMemo } from "react";
import { Select } from "../../ui/Select";
import { Button } from "../../ui/Button";
import styles from "./TimezoneSelect.module.css";

const fallbackList: string[] = [
  "UTC",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Warsaw",
  "Europe/Moscow",
  "Europe/Kyiv",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "America/Argentina/Buenos_Aires",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Almaty",
  "Asia/Tbilisi",
  "Asia/Makhachkala",
  "Asia/Yekaterinburg",
  "Asia/Novosibirsk",
  "Asia/Krasnoyarsk",
  "Asia/Irkutsk",
  "Asia/Vladivostok",
  "Australia/Sydney",
  "Pacific/Auckland",
  "Africa/Cairo",
  "Africa/Lagos",
  "Africa/Johannesburg",
];

function getOffsetLabel(tz: string): string {
  try {
    const now = new Date();
    const format = new Intl.DateTimeFormat("en", { timeZone: tz, timeZoneName: "shortOffset" });
    const parts = format.formatToParts(now);
    const offset = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
    return offset ? `${tz} — ${offset}` : tz;
  } catch {
    return tz;
  }
}

type Props = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

export function TimezoneSelect({ value, onChange, error }: Props) {
  const timezones = useMemo(() => {
    try {
      return (
        (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.("timeZone") ??
        fallbackList
      );
    } catch {
      return fallbackList;
    }
  }, []);

  const browserTz = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone, []);

  const allTimezones = useMemo(() => {
    if (value && !timezones.includes(value)) {
      return [value, ...timezones];
    }
    return timezones;
  }, [timezones, value]);

  return (
    <div className={styles.wrapper}>
      <Select label="Часовой пояс" value={value} error={error} onChange={(e) => onChange(e.target.value)}>
        {allTimezones.map((tz) => (
          <option key={tz} value={tz}>
            {getOffsetLabel(tz)}
          </option>
        ))}
      </Select>
      {browserTz !== value && (
        <Button type="button" variant="ghost" className={styles.deviceBtn} onClick={() => onChange(browserTz)}>
          Использовать часовой пояс устройства ({browserTz})
        </Button>
      )}
    </div>
  );
}
