import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext/AuthProvider";
import { AppRouter } from "./AppRouter";
import { ToastProvider } from "../components/ui/Toast";
import { AppErrorBoundary } from "../components/routing/AppErrorBoundary";
import { ThemeProvider } from "../theme";
export function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <AppErrorBoundary>
              <AppRouter />
            </AppErrorBoundary>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
