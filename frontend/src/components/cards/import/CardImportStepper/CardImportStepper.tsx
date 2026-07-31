import type { ImportStep } from "../../../../types/cardImport";
import { CheckIcon } from "../../../icons/ImportIcons";

const steps: { key: ImportStep; label: string }[] = [
  { key: "file", label: "Файл" },
  { key: "mapping", label: "Сопоставление" },
  { key: "preview", label: "Проверка" },
  { key: "result", label: "Результат" },
];

export function CardImportStepper({
  current,
}: {
  current: ImportStep;
}) {
  const currentIdx = steps.findIndex((s) => s.key === current);
  return (
    <nav aria-label="Этапы импорта" style={{ marginBottom: "var(--spacing-6)" }}>
      <ol
        style={{
          display: "flex",
          listStyle: "none",
          padding: 0,
          margin: 0,
          gap: 0,
        }}
      >
        {steps.map((step, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <li
              key={step.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--spacing-2)",
                color: active
                  ? "var(--color-primary)"
                  : done
                    ? "var(--color-text-secondary)"
                    : "var(--color-text-muted)",
                fontSize: 14,
                fontWeight: active ? 600 : 400,
              }}
              aria-current={active ? "step" : undefined}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: active
                    ? "var(--color-primary)"
                    : done
                      ? "var(--color-primary-muted)"
                      : "var(--color-surface-elevated)",
                  color: active ? "#fff" : done ? "var(--color-primary)" : "var(--color-text-muted)",
                  border: !active && !done ? "1px solid var(--color-border)" : "none",
                  fontSize: 13,
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {done ? <CheckIcon size={14} /> : i + 1}
              </span>
              <span style={{ display: i < steps.length - 1 ? undefined : "none" }}>
                {step.label}
              </span>
              {i < steps.length - 1 && (
                <span
                  style={{
                    flex: "1 0 24px",
                    height: 2,
                    background: done ? "var(--color-primary)" : "var(--color-border)",
                    borderRadius: 1,
                    minWidth: 24,
                  }}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
