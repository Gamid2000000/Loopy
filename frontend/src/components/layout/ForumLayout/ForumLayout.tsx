import type { ReactNode } from "react";
import { PublicHeader } from "../PublicLayout/PublicHeader";
import styles from "./ForumLayout.module.css";

type ForumLayoutProps = {
  children: ReactNode;
};

export function ForumLayout({ children }: ForumLayoutProps) {
  return (
    <div className={styles.layout}>
      <PublicHeader showNavigation={false} />
      <main className={styles.main}>{children}</main>
    </div>
  );
}
