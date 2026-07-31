import type { CardImportPreviewResponse } from "../../../../types/cardImport";

export function CardImportPreviewSummary({
  preview,
}: {
  preview: CardImportPreviewResponse;
}) {
  const items = [
    { label: "Всего строк", value: preview.totalRows },
    { label: "Валидные", value: preview.validRows, color: "var(--color-success)" },
    { label: "Невалидные", value: preview.invalidRows, color: "var(--color-danger)" },
    {
      label: "Дубликаты в файле",
      value: preview.duplicateInFileRows,
      color: "var(--color-warning)",
    },
    {
      label: "Дубликаты в колоде",
      value: preview.duplicateInDeckRows,
      color: "var(--color-warning)",
    },
  ];
  return (
    <div
      style={{
        display: "flex",
        gap: "var(--spacing-3)",
        flexWrap: "wrap",
      }}
    >
      {items.map(({ label, value, color }) => (
        <div
          key={label}
          style={{
            flex: "1 1 120px",
            minWidth: 120,
            padding: "var(--spacing-3)",
            background: "var(--color-surface-elevated)",
            borderRadius: "var(--radius-medium)",
            border: "1px solid var(--color-border)",
            textAlign: "center",
          }}
        >
          <p style={{ margin: 0, fontSize: 24, fontWeight: 700, color: color ?? "var(--color-text-primary)" }}>
            {value}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}
