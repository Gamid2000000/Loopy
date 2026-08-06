import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext/useAuth";
import { useTheme, type ThemePreference } from "../../../theme";
import styles from "./PublicHeader.module.css";

const navigation = [["#features", "Возможности"], ["#how-it-works", "Как это работает"], ["#roadmap", "В разработке"], ["/forum", "Сообщество"]] as const;

function ThemeControl() {
  const { preference, setPreference } = useTheme();
  return <select className={styles.theme} value={preference} onChange={(event) => setPreference(event.target.value as ThemePreference)} aria-label="Тема оформления"><option value="system">Система</option><option value="light">Светлая</option><option value="dark">Тёмная</option></select>;
}

function Actions({ onNavigate }: { onNavigate?: () => void }) {
  const { status } = useAuth();
  if (status === "unknown") return <span className={styles.actionsPlaceholder} aria-label="Проверяем сессию" />;
  if (status === "authenticated") return <Link to="/dashboard" className={styles.primaryAction} onClick={onNavigate}>Открыть приложение</Link>;
  return <div className={styles.actions}><Link to="/login" onClick={onNavigate}>Войти</Link><Link to="/register" className={styles.primaryAction} onClick={onNavigate}>Начать бесплатно</Link></div>;
}

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLElement>(null);
  const close = () => setOpen(false);
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    drawer.current?.querySelector<HTMLElement>("a, select, button")?.focus();
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", onKeyDown); trigger.current?.focus(); };
  }, [open]);
  const nav = (mobile = false) => navigation.map(([to, label]) => to === "/forum"
    ? <NavLink key={to} to={to} className={({ isActive }) => isActive ? styles.activeNav : undefined} onClick={mobile ? close : undefined}>{label}</NavLink>
    : <a key={to} href={to} onClick={mobile ? close : undefined}>{label}</a>);
  return <header className={styles.header}><div className={styles.inner}><Link className={styles.logo} to="/">Loopy</Link><nav className={styles.desktopNav} aria-label="Публичная навигация">{nav()}</nav><div className={styles.desktopTools}><ThemeControl /><Actions /></div><button ref={trigger} className={styles.menuButton} type="button" aria-label="Открыть меню" aria-expanded={open} aria-controls="public-menu" onClick={() => setOpen(true)}>☰</button></div>{open && <button className={styles.backdrop} type="button" aria-label="Закрыть меню" onClick={close} />}{open && <aside ref={drawer} id="public-menu" className={styles.drawer} aria-label="Мобильная навигация"><nav aria-label="Публичная навигация">{nav(true)}</nav><ThemeControl /><Actions onNavigate={close} /></aside>}</header>;
}
