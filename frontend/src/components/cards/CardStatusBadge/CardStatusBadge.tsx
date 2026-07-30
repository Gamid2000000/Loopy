import type { CardStatus } from "../../../types/card";
import styles from "./CardStatusBadge.module.css";
export function CardStatusBadge({ status }: { status: CardStatus }) { return <span className={`${styles.badge} ${styles[status]}`}>{status === "ACTIVE" ? "Активна" : "В архиве"}</span>; }
