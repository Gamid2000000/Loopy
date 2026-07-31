import { CardImportRowStatusBadge } from "../CardImportRowStatusBadge";
import type { CardImportPreviewResponse } from "../../../../types/cardImport";

interface Props {
  preview: CardImportPreviewResponse;
  selected: Set<number>;
  onToggle: (rowNumber: number) => void;
  onSelectAll: () => void;
  onClear: () => void;
}

export function CardImportPreviewTable({
  preview,
  selected,
  onToggle,
  onSelectAll,
  onClear,
}: Props) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: "var(--spacing-2)",
          marginBottom: "var(--spacing-3)",
        }}
      >
        <button
          onClick={onSelectAll}
          style={{
            padding: "6px 12px",
            borderRadius: "var(--radius-small)",
            border: "1px solid var(--color-border)",
            background: "var(--color-surface-elevated)",
            color: "var(--color-text-primary)",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          Выбрать все валидные
        </button>
        <button
          onClick={onClear}
          style={{
            padding: "6px 12px",
            borderRadius: "var(--radius-small)",
            border: "1px solid var(--color-border)",
            background: "var(--color-surface-elevated)",
            color: "var(--color-text-muted)",
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          Снять выбор
        </button>
      </div>
      <div
        style={{
          overflowX: "auto",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-small)",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 13,
            minWidth: 700,
          }}
          aria-label="Предпросмотр импорта"
        >
          <thead>
            <tr style={{ background: "var(--color-surface-elevated)" }}>
              <th style={th}>Выбрано</th>
              <th style={th}>Строка</th>
              <th style={th}>Front</th>
              <th style={th}>Back</th>
              <th style={th}>Example</th>
              <th style={th}>Note</th>
              <th style={th}>Статус</th>
              <th style={th}>Ошибка</th>
            </tr>
          </thead>
          <tbody>
            {preview.rows.map((row) => {
              const canSelect = row.status === "VALID";
              const isChecked = selected.has(row.rowNumber);
              return (
                <tr
                  key={row.rowNumber}
                  style={{
                    background: isChecked
                      ? "var(--color-primary-muted)"
                      : undefined,
                  }}
                >
                  <td style={td}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      disabled={!canSelect}
                      onChange={() => onToggle(row.rowNumber)}
                      aria-label={`Выбрать строку ${row.rowNumber}`}
                      style={{
                        width: 16,
                        height: 16,
                        accentColor: "var(--color-primary)",
                      }}
                    />
                  </td>
                  <td style={td}>{row.rowNumber}</td>
                  <td style={td} title={row.front ?? ""}>
                    <span style={ellipsis}>{row.front ?? ""}</span>
                  </td>
                  <td style={td} title={row.back ?? ""}>
                    <span style={ellipsis}>{row.back ?? ""}</span>
                  </td>
                  <td style={td} title={row.example ?? ""}>
                    <span style={ellipsis}>{row.example ?? ""}</span>
                  </td>
                  <td style={td} title={row.note ?? ""}>
                    <span style={ellipsis}>{row.note ?? ""}</span>
                  </td>
                  <td style={td}>
                    <CardImportRowStatusBadge status={row.status} />
                  </td>
                  <td style={td}>
                    {row.errors.length > 0 && (
                      <span
                        style={{ color: "var(--color-danger)", fontSize: 12 }}
                      >
                        {row.errors.join(", ")}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th: React.CSSProperties = {
  padding: "8px 12px",
  textAlign: "left",
  borderBottom: "1px solid var(--color-border)",
  color: "var(--color-text-secondary)",
  whiteSpace: "nowrap",
  fontWeight: 600,
};

const td: React.CSSProperties = {
  padding: "8px 12px",
  borderBottom: "1px solid var(--color-border)",
  maxWidth: 160,
};

const ellipsis: React.CSSProperties = {
  display: "block",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};
