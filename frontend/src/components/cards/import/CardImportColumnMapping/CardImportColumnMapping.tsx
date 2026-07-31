import type { ColumnMapping } from "../../../../types/cardImport";

interface Props {
  headers: string[];
  mapping: ColumnMapping;
  onChange: (mapping: ColumnMapping) => void;
  previewRows: string[][];
}

const FIELDS: { key: keyof ColumnMapping; label: string; required: boolean }[] = [
  { key: "front", label: "Лицевая сторона", required: true },
  { key: "back", label: "Обратная сторона", required: true },
  { key: "example", label: "Пример", required: false },
  { key: "note", label: "Заметка", required: false },
];

export function CardImportColumnMapping({
  headers,
  mapping,
  onChange,
  previewRows,
}: Props) {
  const used = new Set(Object.values(mapping).filter((v) => v !== null));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-6)" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--spacing-3)" }}>
        {FIELDS.map(({ key, label, required }) => (
          <label
            key={String(key)}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--spacing-1)",
            }}
          >
            <span style={{ fontWeight: 600 }}>
              {label}
              {required && <span style={{ color: "var(--color-danger)" }}> *</span>}
            </span>
            <select
              value={mapping[key] ?? ""}
              onChange={(e) => {
                const val = e.target.value;
                onChange({ ...mapping, [key]: val === "" ? null : Number(val) });
              }}
              style={{
                padding: "10px 12px",
                borderRadius: "var(--radius-small)",
                border: "1px solid var(--color-border)",
                background: "var(--color-surface-elevated)",
                color: "var(--color-text-primary)",
                fontSize: 14,
              }}
            >
              <option value="">{required ? "Выберите колонку" : "Не импортировать"}</option>
              {headers.map((h, i) => (
                <option
                  key={i}
                  value={i}
                  disabled={used.has(i) && mapping[key] !== i}
                >
                  {h || `Колонка ${i + 1}`}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
      <p style={{ color: "var(--color-warning)", margin: 0, fontSize: 14 }}>
        Одна колонка не может быть сопоставлена с двумя полями
      </p>
      {previewRows.length > 0 && (
        <div>
          <p style={{ fontWeight: 600, margin: "0 0 8px" }}>Первые строки:</p>
          <div
            style={{
              overflowX: "auto",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-small)",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--color-surface-elevated)" }}>
                  {headers.map((h, i) => (
                    <th
                      key={i}
                      style={{
                        padding: "8px 12px",
                        textAlign: "left",
                        borderBottom: "1px solid var(--color-border)",
                        color: "var(--color-text-secondary)",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h || `Колонка ${i + 1}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        style={{
                          padding: "8px 12px",
                          borderBottom: "1px solid var(--color-border)",
                          maxWidth: 200,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={cell}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
