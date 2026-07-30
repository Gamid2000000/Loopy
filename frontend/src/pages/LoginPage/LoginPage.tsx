import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../../components/layout/AuthLayout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAuth } from "../../context/AuthContext/useAuth";
export function LoginPage() {
  const { login, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validation, setValidation] = useState<string | null>(null);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!email.includes("@") || !password) {
      setValidation("Введите корректный email и пароль.");
      return;
    }
    try {
      await login({ email, password });
      navigate("/dashboard");
    } catch {
      return;
    }
  }
  return (
    <AuthLayout>
      <h1>Войти в Loopy</h1>
      <p>Продолжайте учиться в своём темпе.</p>
      <form onSubmit={submit} className="grid" style={{ marginTop: 24 }}>
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <Input
          label="Пароль"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          error={validation ?? undefined}
        />
        {error && <p role="alert">{error}</p>}
        <Button type="submit" loading={isLoading} fullWidth>
          Войти
        </Button>
      </form>
      <p>
        Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
      </p>
    </AuthLayout>
  );
}
