import { FileIcon } from "../../../icons/ImportIcons";

export function CardImportDropzone({
  onFile,
}: {
  onFile: (file: File) => void;
}) {
  return (
    <label
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--spacing-4)",
        padding: "var(--spacing-12) var(--spacing-6)",
        border: "2px dashed var(--color-border)",
        borderRadius: "var(--radius-large)",
        cursor: "pointer",
        transition: "border-color 0.15s, background 0.15s",
        background: "var(--color-surface)",
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.currentTarget.style.borderColor = "var(--color-primary)";
        e.currentTarget.style.background = "var(--color-surface-elevated)";
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.currentTarget.style.borderColor = "var(--color-border)";
        e.currentTarget.style.background = "var(--color-surface)";
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.currentTarget.style.borderColor = "var(--color-border)";
        e.currentTarget.style.background = "var(--color-surface)";
        const dropped = e.dataTransfer.files[0];
        if (dropped) onFile(dropped);
      }}
    >
      <FileIcon size={48} />
      <div style={{ textAlign: "center" }}>
        <p style={{ margin: 0, fontWeight: 600 }}>
          Перетащите файл сюда
        </p>
        <p style={{ margin: "4px 0 0", color: "var(--color-text-muted)", fontSize: 14 }}>
          или нажмите для выбора. CSV или TSV до 2 МБ
        </p>
      </div>
      <input
        type="file"
        accept=".csv,.tsv,text/csv,text/tab-separated-values,text/plain"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />
    </label>
  );
}
