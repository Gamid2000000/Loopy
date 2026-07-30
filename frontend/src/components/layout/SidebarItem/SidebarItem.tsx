import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import styles from "./SidebarItem.module.css";
export function SidebarItem({ to, children }: { to: string; children: ReactNode }) {
  return (
    <NavLink className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ""}`} to={to}>
      {children}
    </NavLink>
  );
}
