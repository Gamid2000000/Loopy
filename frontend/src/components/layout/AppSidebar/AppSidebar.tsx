import { Link, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { SidebarItem } from "../SidebarItem";
import { Button } from "../../ui/Button";
import { HomeIcon } from "../../icons/HomeIcon";
import { DeckIcon } from "../../icons/DeckIcon";
import { StudyIcon } from "../../icons/StudyIcon";
import { StatisticsIcon } from "../../icons/StatisticsIcon";
import { ProfileIcon } from "../../icons/ProfileIcon";
import { LogoutIcon } from "../../icons/LogoutIcon";
import { useAuth } from "../../../context/AuthContext/useAuth";
import styles from "./AppSidebar.module.css";

export function AppSidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLElement>(null);
  const close = () => setOpen(false);
  const section = location.pathname.startsWith("/decks") ? "Колоды" : location.pathname.startsWith("/statistics") ? "Статистика" : location.pathname.startsWith("/profile") ? "Профиль" : location.pathname.startsWith("/study") ? "Занятие" : "Главная";

  useEffect(() => {
    if (!open) return;
    const oldOverflow = document.body.style.overflow;
    const items = drawer.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? [];
    items[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key !== "Tab" || !items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", onKeyDown);
      menuButton.current?.focus();
    };
  }, [open]);

  return (
    <>
      <header className={styles.topbar}>
        <Link to="/dashboard" className={styles.topbarLogo}>Loopy</Link>
        <span className={styles.sectionName}>{section}</span>
        <button ref={menuButton} className={styles.menuButton} type="button" aria-label="Открыть меню" aria-expanded={open} aria-controls="main-navigation" onClick={() => setOpen(true)}>☰</button>
      </header>
      {open && <button className={styles.backdrop} type="button" aria-label="Закрыть меню" onClick={close} />}
      <aside ref={drawer} id="main-navigation" className={`${styles.sidebar} ${open ? styles.open : ""}`} aria-label="Основная навигация">
        <Link to="/dashboard" className={styles.logo} onClick={close}>Loopy</Link>
        <nav aria-label="Основная навигация">
          <SidebarItem to="/dashboard" onClick={close}><HomeIcon />Главная</SidebarItem>
          <SidebarItem to="/decks" onClick={close}><DeckIcon />Колоды</SidebarItem>
          <SidebarItem to="/study" onClick={close}><StudyIcon />Занятие</SidebarItem>
          <SidebarItem to="/statistics" onClick={close}><StatisticsIcon />Статистика</SidebarItem>
          <SidebarItem to="/profile" onClick={close}><ProfileIcon />Профиль</SidebarItem>
        </nav>
        <footer>
          <strong>{user?.email}</strong>
          <small>{user?.profile?.learningLanguage}</small>
          <Button variant="ghost" fullWidth onClick={logout} leftIcon={<LogoutIcon />}>Выйти</Button>
        </footer>
      </aside>
    </>
  );
}
