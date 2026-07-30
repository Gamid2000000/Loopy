import { useCallback, useState, type ReactNode } from "react";
import { ToastContext } from "./ToastContext";
import styles from "./Toast.module.css";
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; kind: "success" | "error" } | null>(null);
  const showToast = useCallback((message: string, kind: "success" | "error" = "success") => {
    setToast({ message, kind });
    window.setTimeout(() => setToast(null), 4000);
  }, []);
  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className={`${styles.toast} ${styles[toast.kind]}`} role="status">
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}
