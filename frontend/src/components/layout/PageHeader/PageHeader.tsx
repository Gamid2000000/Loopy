import type { ReactNode } from "react";
import styles from "./PageHeader.module.css";
export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className={styles.header}>
      <div>
        <h1 className="pageTitle">{title}</h1>
        {subtitle && <p className="pageSubtitle">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
