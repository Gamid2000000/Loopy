import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext/AuthProvider";
import { AppRouter } from "./AppRouter";
import { ToastProvider } from "../components/ui/Toast";
export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRouter />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
