import { Spinner } from "../../ui/Spinner";
export function RouteLoader() {
  return (
    <main className="page" aria-busy="true">
      <Spinner label="Восстанавливаем сессию" /> <span>Восстанавливаем сессию…</span>
    </main>
  );
}
