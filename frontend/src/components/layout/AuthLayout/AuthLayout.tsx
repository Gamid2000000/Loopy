import type { ReactNode } from "react";
import styles from "./AuthLayout.module.css";
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className={styles.layout}>
      <section className={styles.card}>
        <a className={styles.brand} href="/dashboard">
          ∞ Loopy
        </a>
        {children}
      </section>
    </main>
  );
}
