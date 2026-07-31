import { Card } from "../../ui/Card";
import { Skeleton } from "../../ui/Skeleton";
import styles from "./ProfileSkeleton.module.css";

export function ProfileSkeleton() {
  return (
    <div className={styles.grid}>
      <Card className={styles.card}>
        <Skeleton height="24px" />
        <div className={styles.rows}>
          <Skeleton height="48px" />
          <Skeleton height="48px" />
          {<Skeleton height="48px" />}
        </div>
      </Card>
      <div className={styles.main}>
        <Card className={styles.card}>
          <Skeleton height="24px" />
          <div className={styles.twoCol}>
            <Skeleton height="48px" />
            <Skeleton height="48px" />
          </div>
        </Card>
        <Card className={styles.card}>
          <Skeleton height="48px" />
        </Card>
        <Card className={styles.card}>
          <Skeleton height="24px" />
          <div className={styles.twoCol}>
            <Skeleton height="48px" />
            <Skeleton height="48px" />
          </div>
        </Card>
      </div>
    </div>
  );
}
