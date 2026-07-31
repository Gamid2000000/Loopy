import { Skeleton } from "../../ui/Skeleton";
export function StudySkeleton() {
  return (
    <main className="page">
      <Skeleton height="32px" />
      <Skeleton height="460px" />
    </main>
  );
}
