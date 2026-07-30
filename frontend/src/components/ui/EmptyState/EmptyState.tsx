import { Card } from "../Card";
export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card role="status">
      <h2>{title}</h2>
      <p>{description}</p>
    </Card>
  );
}
