import { Link } from "react-router-dom";
import { AuthLayout } from "../../components/layout/AuthLayout";
export function NotFoundPage() {
  return (
    <AuthLayout>
      <h1>Страница не найдена</h1>
      <p>Такого раздела в Loopy пока нет.</p>
      <Link to="/dashboard">На главную</Link>
    </AuthLayout>
  );
}
