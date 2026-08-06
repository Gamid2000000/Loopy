import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext/AuthContext";
import type { AuthContextValue } from "../../../context/AuthContext/authTypes";
import { ThemeProvider } from "../../../theme";
import { PublicHeader } from "./PublicHeader";

const auth: AuthContextValue = { status: "unauthenticated", user: null, error: null, isLoading: false, login: async () => {}, register: async () => {}, logout: () => {}, restoreSession: async () => {}, setUser: () => {} };
function renderHeader(route: string) { return render(<ThemeProvider><AuthContext value={auth}><MemoryRouter initialEntries={[route]}><PublicHeader /></MemoryRouter></AuthContext></ThemeProvider>); }

it.each(["/forum", "/forum/topics/1", "/forum/categories/general"])("marks Forum active for %s", (route) => {
  renderHeader(route);
  expect(screen.getByRole("link", { name: "Сообщество" })).toHaveAttribute("aria-current", "page");
});

it("does not mark Forum active on Landing and closes the mobile drawer after navigation", () => {
  renderHeader("/");
  expect(screen.getByRole("link", { name: "Сообщество" })).not.toHaveAttribute("aria-current");
  fireEvent.click(screen.getByRole("button", { name: "Открыть меню" }));
  fireEvent.click(screen.getAllByRole("link", { name: "Сообщество" })[1]);
  expect(screen.queryByLabelText("Мобильная навигация")).not.toBeInTheDocument();
});
