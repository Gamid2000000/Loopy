import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import styles from "./SidebarItem.module.css";
export function SidebarItem({ to, children, onClick }: { to: string; children: ReactNode; onClick?: () => void }) {
  return (
    <NavLink className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ""}`} to={to} onClick={onClick}>
      {children}
    </NavLink>
  );
}
