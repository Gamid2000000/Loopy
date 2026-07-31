import type { CardImportRowStatus } from "../../../../types/cardImport";

export function CardImportRowStatusBadge({
  status,
}: {
  status: CardImportRowStatus;
}) {
  const labels: Record<CardImportRowStatus, string> = {
    VALID: "Валидна",
    INVALID: "Ошибка",
    DUPLICATE_IN_FILE: "Дубль в файле",
    DUPLICATE_IN_DECK: "Дубль в колоде",
  };
  const colors: Record<CardImportRowStatus, string> = {
    VALID: "var(--color-success)",
    INVALID: "var(--color-danger)",
    DUPLICATE_IN_FILE: "var(--color-warning)",
    DUPLICATE_IN_DECK: "var(--color-warning)",
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 8px",
        borderRadius: "999px",
        fontSize: 12,
        fontWeight: 600,
        color: colors[status],
        background: `${colors[status]}22`,
        whiteSpace: "nowrap",
      }}
    >
      {labels[status]}
    </span>
  );
}
