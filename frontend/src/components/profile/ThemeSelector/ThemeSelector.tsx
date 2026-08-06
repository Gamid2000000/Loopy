import { useId } from "react";
import { useTheme, type ThemePreference } from "../../../theme";
import styles from "./ThemeSelector.module.css";

const options: Array<{ value: ThemePreference; label: string; description: string }> = [
  { value: "system", label: "Как в системе", description: "Следовать настройке устройства" },
  { value: "light", label: "Светлая", description: "Светлая палитра Loopy" },
  { value: "dark", label: "Тёмная", description: "Тёмная палитра Loopy" },
];

export function ThemeSelector() {
  const { preference, resolvedTheme, setPreference } = useTheme();
  const descriptionId = useId();

  return (
    <section aria-labelledby="theme-title">
      <h2 id="theme-title" className={styles.title}>
        Оформление
      </h2>
      <p id={descriptionId} className={styles.description}>
        Текущая тема: {resolvedTheme === "dark" ? "тёмная" : "светлая"}.
      </p>
      <div className={styles.options} role="radiogroup" aria-describedby={descriptionId} aria-label="Тема оформления">
        {options.map((option) => (
          <label key={option.value} className={styles.option}>
            <input
              type="radio"
              name="theme-preference"
              value={option.value}
              checked={preference === option.value}
              onChange={() => setPreference(option.value)}
            />
            <span>
              <strong>{option.label}</strong>
              <small>{option.description}</small>
            </span>
          </label>
        ))}
      </div>
    </section>
  );
}
