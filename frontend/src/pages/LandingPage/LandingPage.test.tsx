import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext/AuthContext";
import type { AuthContextValue } from "../../context/AuthContext/authTypes";
import { ThemeProvider } from "../../theme";
import { LandingPage } from "./LandingPage";

const authenticatedUser = { id: 1, name: "Test", email: "test@loopy.dev", createdAt: "2026-01-01", profile: { displayName: "Test", nativeLanguage: "ru", learningLanguage: "English", timezone: "UTC", dailyNewCardsLimit: 10, dailyReviewLimit: 100 } };
function auth(status: AuthContextValue["status"]): AuthContextValue { return { status, user: status === "authenticated" ? authenticatedUser : null, error: null, isLoading: false, login: async () => {}, register: async () => {}, logout: () => {}, restoreSession: async () => {}, setUser: () => {} }; }
function renderLanding(status: AuthContextValue["status"] = "unauthenticated") { return render(<ThemeProvider><AuthContext value={auth(status)}><MemoryRouter><LandingPage /></MemoryRouter></AuthContext></ThemeProvider>); }

it("renders the public product sections and only one h1", () => {
  renderLanding();
  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  expect(document.getElementById("features")).toBeInTheDocument();
  expect(document.getElementById("how-it-works")).toBeInTheDocument();
  expect(screen.getAllByText("В разработке")).not.toHaveLength(0);
  expect(screen.getByText("Что такое интервальные повторения?")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Перейти на форум" })).toHaveAttribute("href", "/forum");
  expect(screen.queryByText("Форум скоро")).not.toBeInTheDocument();
});

it("shows guest and authenticated calls to action without redirecting", () => {
  const { rerender } = renderLanding();
  expect(screen.getAllByRole("link", { name: "Начать бесплатно" })[0]).toHaveAttribute("href", "/register");
  rerender(<ThemeProvider><AuthContext value={auth("authenticated")}><MemoryRouter><LandingPage /></MemoryRouter></AuthContext></ThemeProvider>);
  expect(screen.getAllByRole("link", { name: "Открыть приложение" })[0]).toHaveAttribute("href", "/dashboard");
  expect(screen.queryByRole("link", { name: "Начать бесплатно" })).not.toBeInTheDocument();
});
