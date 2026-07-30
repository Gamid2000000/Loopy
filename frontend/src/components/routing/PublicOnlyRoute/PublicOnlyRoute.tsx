import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext/useAuth";
import { RouteLoader } from "../RouteLoader";
export function PublicOnlyRoute() {
  const { status } = useAuth();
  if (status === "unknown") return <RouteLoader />;
  return status === "authenticated" ? <Navigate to="/dashboard" replace /> : <Outlet />;
}
