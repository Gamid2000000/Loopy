import { Select } from "../../ui/Select";
import styles from "./LanguageSelect.module.css";

const commonLanguages: { code: string; label: string }[] = [
  { code: "en", label: "English" },
  { code: "ru", label: "Русский" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "pt", label: "Português" },
  { code: "zh", label: "中文" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "it", label: "Italiano" },
  { code: "ar", label: "العربية" },
  { code: "tr", label: "Türkçe" },
  { code: "pl", label: "Polski" },
  { code: "uk", label: "Українська" },
  { code: "he", label: "עברית" },
];

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  nullable?: boolean;
  otherValue?: string;
  "aria-describedby"?: string;
};

export function LanguageSelect({
  label,
  value,
  onChange,
  error,
  nullable = true,
  otherValue,
  "aria-describedby": ariaDescribedby,
}: Props) {
  const normalizedValue = value ?? "";
  const isCommon = commonLanguages.some((l) => l.code === normalizedValue);
  const showCustom = normalizedValue !== "" && !isCommon;
  const sameLanguages = otherValue !== undefined && otherValue !== "" && otherValue === normalizedValue;

  return (
    <div className={styles.wrapper}>
      {label && <span className={styles.fieldLabel}>{label}</span>}
      <Select
        label=""
        error={error}
        value={normalizedValue}
        aria-describedby={ariaDescribedby}
        onChange={(e) => onChange(e.target.value)}
      >
        {nullable && <option value="">Не выбран</option>}
        {showCustom && <option value={normalizedValue}>{normalizedValue}</option>}
        {commonLanguages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </Select>
      {sameLanguages && (
        <p className={styles.warning} role="status">
          Родной и изучаемый языки совпадают
        </p>
      )}
    </div>
  );
}
