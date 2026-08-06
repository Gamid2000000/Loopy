import type { ReactNode } from "react";
import { PublicFooter } from "./PublicFooter";
import { PublicHeader } from "./PublicHeader";
import styles from "./PublicLayout.module.css";

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.layout}>
      <a className={styles.skipLink} href="#main-content">Перейти к содержимому</a>
      <PublicHeader />
      <main id="main-content">{children}</main>
      <PublicFooter />
    </div>
  );
}
