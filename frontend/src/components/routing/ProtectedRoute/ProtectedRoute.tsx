import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext/useAuth";
import { RouteLoader } from "../RouteLoader";
export function ProtectedRoute() {
  const { status, error, restoreSession } = useAuth();
  if (status === "unknown") return <RouteLoader />;
  if (error && status !== "authenticated")
    return (
      <main className="page">
        <p role="alert">{error}</p>
        <button onClick={() => void restoreSession()}>Повторить</button>
      </main>
    );
  return status === "authenticated" ? <Outlet /> : <Navigate to="/login" replace />;
}
