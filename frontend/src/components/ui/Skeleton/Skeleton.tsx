import styles from "./Skeleton.module.css";
export function Skeleton({ height = "1rem" }: { height?: string }) {
  return <div className={styles.skeleton} style={{ height }} aria-hidden="true" />;
}
