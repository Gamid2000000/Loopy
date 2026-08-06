import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext/AuthContext";
import type { AuthContextValue } from "../../context/AuthContext/authTypes";
import { ThemeProvider } from "../../theme";
import { ForumPage } from "./ForumPage";

const auth: AuthContextValue = { status: "unauthenticated", user: null, error: null, isLoading: false, login: async () => {}, register: async () => {}, logout: () => {}, restoreSession: async () => {}, setUser: () => {} };
function renderPage() { return render(<ThemeProvider><AuthContext value={auth}><MemoryRouter><ForumPage /></MemoryRouter></AuthContext></ThemeProvider>); }

afterEach(() => vi.unstubAllGlobals());

it("loads public categories in PublicLayout and links to a category", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify([{ id: 1, slug: "general", name: "Общее", description: "Для всех", topicsCount: 3, lastActivityAt: "2026-08-06T10:00:00Z" }, { id: 2, slug: "empty", name: "Пустая", description: null, topicsCount: 0, lastActivityAt: null }]), { status: 200 })));
  renderPage();
  expect(document.querySelectorAll("[class*=skeleton]").length).toBeGreaterThan(0);
  await expect(screen.findByRole("link", { name: /Общее/ })).resolves.toHaveAttribute("href", "/forum/categories/general");
  expect(screen.getByText("3 тем")).toBeInTheDocument();
  expect(screen.getByText("Нет активности")).toBeInTheDocument();
  expect(document.querySelector("[class*=shell]")).not.toBeInTheDocument();
});

it("shows an error and retries categories", async () => {
  const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({ code: "HTTP_ERROR", message: "No" }), { status: 500 })).mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  renderPage();
  const retry = await screen.findByRole("button", { name: /Повторить/i });
  retry.click();
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
});
