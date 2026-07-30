import { useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../../components/layout/AuthLayout";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { useAuth } from "../../context/AuthContext/useAuth";
export function RegisterPage() {
  const { register, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [validation, setValidation] = useState<string | null>(null);
  const bind = (key: keyof typeof form) => (event: ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: event.target.value });
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!form.email.includes("@") || form.password.length < 8) {
      setValidation("Пароль должен содержать не менее 8 символов, email — быть корректным.");
      return;
    }
    if (form.password !== form.confirm) {
      setValidation("Пароли не совпадают.");
      return;
    }
    try {
      await register({ name: form.name, email: form.email, password: form.password });
      navigate("/dashboard");
    } catch {
      return;
    }
  }
  return (
    <AuthLayout>
      <h1>Создать аккаунт</h1>
      <form onSubmit={submit} className="grid" style={{ marginTop: 24 }}>
        <Input label="Имя" value={form.name} onChange={bind("name")} required />
        <Input label="Email" type="email" value={form.email} onChange={bind("email")} required />
        <Input label="Пароль" type="password" value={form.password} onChange={bind("password")} required />
        <Input
          label="Повторите пароль"
          type="password"
          value={form.confirm}
          onChange={bind("confirm")}
          required
          error={validation ?? undefined}
        />
        {error && <p role="alert">{error}</p>}
        <Button type="submit" loading={isLoading} fullWidth>
          Зарегистрироваться
        </Button>
      </form>
      <p>
        Уже есть аккаунт? <Link to="/login">Войти</Link>
      </p>
    </AuthLayout>
  );
}
