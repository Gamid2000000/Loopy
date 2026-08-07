import { Link } from "react-router-dom";
import styles from "./AppFooter.module.css";

export function AppFooter() {
  return (
    <footer className={styles.footer}>
      <span>© {new Date().getFullYear()} Loopy</span>
      <span>Карточки для обучения</span>
      <Link to="/forum">Форум</Link>
    </footer>
  );
}
