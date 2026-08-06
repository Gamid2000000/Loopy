import { Link } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext/useAuth";
import styles from "./PublicFooter.module.css";

export function PublicFooter() {
  const { status } = useAuth();
  const authenticated = status === "authenticated";
  return <footer className={styles.footer}><div className={styles.inner}><div><strong className={styles.logo}>Loopy</strong><p>Проект находится в разработке</p></div><nav aria-label="Продукт"><strong>Продукт</strong><a href="#features">Возможности</a><a href="#how-it-works">Как это работает</a><a href="#roadmap">В разработке</a><a href="#community">Сообщество</a></nav><nav aria-label="Аккаунт"><strong>Аккаунт</strong>{authenticated ? <Link to="/dashboard">Открыть приложение</Link> : <><Link to="/login">Войти</Link><Link to="/register">Регистрация</Link></>}</nav></div><p className={styles.copyright}>© {new Date().getFullYear()} Loopy</p></footer>;
}
