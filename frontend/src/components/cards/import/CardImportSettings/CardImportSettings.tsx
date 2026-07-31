import type { DelimiterMode } from "../../../../types/cardImport";

export function CardImportSettings({
  delimiter,
  setDelimiter,
  hasHeader,
  setHasHeader,
}: {
  delimiter: DelimiterMode;
  setDelimiter: (d: DelimiterMode) => void;
  hasHeader: boolean;
  setHasHeader: (h: boolean) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-4)" }}>
      <label style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-1)" }}>
        <span style={{ fontWeight: 600 }}>Разделитель</span>
        <select
          value={delimiter}
          onChange={(e) => setDelimiter(e.target.value as DelimiterMode)}
          style={{
            padding: "10px 12px",
            borderRadius: "var(--radius-small)",
            border: "1px solid var(--color-border)",
            background: "var(--color-surface-elevated)",
            color: "var(--color-text-primary)",
            fontSize: 14,
          }}
        >
          <option value="auto">Автоматически</option>
          <option value="comma">Запятая (,)</option>
          <option value="tab">Табуляция</option>
        </select>
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: "var(--spacing-2)", cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={hasHeader}
          onChange={(e) => setHasHeader(e.target.checked)}
          style={{ width: 18, height: 18, accentColor: "var(--color-primary)" }}
        />
        <span>Первая строка содержит заголовки</span>
      </label>
    </div>
  );
}
