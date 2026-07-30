import { Link } from "react-router-dom";
import { Button } from "../../components/ui/Button";

export function ComingSoonPage({ message = "Раздел будет доступен в следующем срезе." }: { message?: string }) {
  return (
    <main className="page">
      <h1 className="pageTitle">Раздел находится в разработке</h1>
      <p className="pageSubtitle">{message}</p>
      <Link to="/dashboard">
        <Button>Вернуться на главную</Button>
      </Link>
    </main>
  );
}
