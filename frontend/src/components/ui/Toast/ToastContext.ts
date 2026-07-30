import { createContext } from "react";

export type ToastContextValue = { showToast: (message: string, kind?: "success" | "error") => void };
export const ToastContext = createContext<ToastContextValue | null>(null);
