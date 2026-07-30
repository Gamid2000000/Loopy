import type { ReactNode } from "react";
import { AppSidebar } from "../AppSidebar";
import styles from "./AppShell.module.css";
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <AppSidebar />
      <div className={styles.content}>{children}</div>
    </>
  );
}
