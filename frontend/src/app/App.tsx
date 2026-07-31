import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext/AuthProvider";
import { AppRouter } from "./AppRouter";
import { ToastProvider } from "../components/ui/Toast";
import { AppErrorBoundary } from "../components/routing/AppErrorBoundary";
export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppErrorBoundary>
            <AppRouter />
          </AppErrorBoundary>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
