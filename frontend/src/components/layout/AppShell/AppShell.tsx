import type { ReactNode } from "react";
import { AppSidebar } from "../AppSidebar";
import { AppFooter } from "../AppFooter";
import styles from "./AppShell.module.css";
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <AppSidebar />
      <div className={styles.content}>
        <div className={styles.main}>
          {children}
        </div>
        <AppFooter />
      </div>
    </>
  );
}
