import { Link } from "react-router-dom";
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
  return (
    <aside className={styles.sidebar}>
      <Link to="/dashboard" className={styles.logo}>
        Loopy
      </Link>
      <nav aria-label="Основная навигация">
        <SidebarItem to="/dashboard">
          <HomeIcon />
          Главная
        </SidebarItem>
        <SidebarItem to="/decks">
          <DeckIcon />
          Колоды
        </SidebarItem>
        <SidebarItem to="/study">
          <StudyIcon />
          Занятие
        </SidebarItem>
        <SidebarItem to="/statistics">
          <StatisticsIcon />
          Статистика
        </SidebarItem>
        <SidebarItem to="/profile">
          <ProfileIcon />
          Профиль
        </SidebarItem>
      </nav>
      <footer>
        <strong>{user?.email}</strong>
        <small>{user?.profile?.learningLanguage}</small>
        <Button variant="ghost" fullWidth onClick={logout} leftIcon={<LogoutIcon />}>
          Выйти
        </Button>
      </footer>
    </aside>
  );
}
