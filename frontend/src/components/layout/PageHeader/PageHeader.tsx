import type { ReactNode } from "react";
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "start" }}>
      <div>
        <h1 className="pageTitle">{title}</h1>
        {subtitle && <p className="pageSubtitle">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
