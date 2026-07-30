import type { ReactNode } from "react";
import styles from "./StudyCard.module.css";
export function StudyCard({ children, revealed = false }: { children: ReactNode; revealed?: boolean }) { return <section className={`${styles.card} ${revealed ? styles.revealed : ""}`} aria-labelledby="study-card-title" tabIndex={-1}>{children}</section>; }
