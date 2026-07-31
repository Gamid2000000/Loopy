import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { Button } from "../../ui/Button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error("AppErrorBoundary caught an error:", error, info.componentStack);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <main
          className="page"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            gap: "var(--spacing-4)",
            padding: "var(--spacing-8)",
            textAlign: "center",
          }}
        >
          <h1>Что-то пошло не так</h1>
          <p style={{ color: "var(--color-text-muted)", maxWidth: "420px" }}>
            В работе приложения возникла непредвиденная ошибка. Попробуйте обновить страницу или вернуться на главную.
          </p>
          <div style={{ display: "flex", gap: "var(--spacing-2)" }}>
            <Button
              onClick={() => {
                window.location.reload();
              }}
            >
              Обновить страницу
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                window.location.href = "/dashboard";
              }}
            >
              На главную
            </Button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
