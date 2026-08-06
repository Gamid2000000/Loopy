import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext/AuthContext";
import type { AuthContextValue } from "../../context/AuthContext/authTypes";
import { ThemeProvider } from "../../theme";
import { ForumCategoryPage } from "./ForumCategoryPage";

const topicsPage = (overrides: Record<string, unknown> = {}) => ({
  content: [
    { id: 1, categorySlug: "general", title: "First topic", author: { id: 1, username: "Alice" }, pinned: false, locked: false, postsCount: 5, createdAt: "2026-08-01T10:00:00Z", lastActivityAt: "2026-08-05T10:00:00Z" },
    { id: 2, categorySlug: "general", title: "Pinned topic", author: { id: 2, username: "Bob" }, pinned: true, locked: false, postsCount: 3, createdAt: "2026-08-02T10:00:00Z", lastActivityAt: "2026-08-04T10:00:00Z" },
    { id: 3, categorySlug: "general", title: "Locked topic", author: { id: 3, username: "Carol" }, pinned: false, locked: true, postsCount: 12, createdAt: "2026-08-03T10:00:00Z", lastActivityAt: "2026-08-06T10:00:00Z" },
  ],
  totalPages: 1,
  totalElements: 3,
  size: 20,
  number: (overrides.page as number) ?? 0,
  first: true,
  last: true,
  empty: false,
  ...overrides,
});

const category = { id: 1, slug: "general", name: "Общее", description: "Общие обсуждения", topicsCount: 3, lastActivityAt: null };

function auth(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return { status: "unauthenticated", user: null, error: null, isLoading: false, login: async () => {}, register: async () => {}, logout: () => {}, restoreSession: async () => {}, setUser: () => {}, ...overrides };
}

const renderPage = (slug = "general", query = "", authValue: AuthContextValue = auth()) =>
  render(
    <ThemeProvider>
      <AuthContext value={authValue}>
        <MemoryRouter initialEntries={[`/forum/categories/${slug}${query}`]}>
          <ForumCategoryPage />
        </MemoryRouter>
      </AuthContext>
    </ThemeProvider>,
  );

afterEach(() => vi.unstubAllGlobals());

it("passes categorySlug to the API", async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify([category]), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify(topicsPage()), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  renderPage("general");
  await screen.findByText("First topic");
  expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/forum/categories/general/topics"), expect.anything());
});

it("displays topics with titles and metadata", async () => {
  vi.stubGlobal("fetch", vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify([category]), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify(topicsPage()), { status: 200 })));
  renderPage();
  await screen.findByText("First topic");
  expect(screen.getByText("Pinned topic")).toBeInTheDocument();
  expect(screen.getByText("Locked topic")).toBeInTheDocument();
  expect(screen.getByText(/Alice/)).toBeInTheDocument();
});

it("displays pinned and locked badges", async () => {
  vi.stubGlobal("fetch", vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify([category]), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify(topicsPage()), { status: 200 })));
  renderPage();
  await screen.findByText("First topic");
  expect(screen.getAllByText("Закреплено")).toHaveLength(1);
  expect(screen.getAllByText("Закрыто")).toHaveLength(1);
});

it("shows login CTA for guest", async () => {
  vi.stubGlobal("fetch", vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify([category]), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify(topicsPage()), { status: 200 })));
  renderPage();
  await screen.findByText("First topic");
  const loginLink = screen.getByRole("link", { name: /Войти, чтобы создать тему/ });
  expect(loginLink).toHaveAttribute("href", "/login");
  expect(loginLink.getAttribute("href")).toBe("/login");
});

it("shows create CTA for authenticated user", async () => {
  vi.stubGlobal("fetch", vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify([category]), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify(topicsPage()), { status: 200 })));
  renderPage("general", "", auth({ status: "authenticated", user: { id: 1, name: "Test", email: "test@loopy.dev", createdAt: "2026-01-01", profile: { displayName: "Test", nativeLanguage: "ru", learningLanguage: "en", timezone: "UTC", dailyNewCardsLimit: 10, dailyReviewLimit: 100 } } }));
  await screen.findByText("First topic");
  expect(screen.getByRole("button", { name: "Создать тему" })).toBeInTheDocument();
});

it("shows empty state when no topics", async () => {
  vi.stubGlobal("fetch", vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify([{ ...category, topicsCount: 0 }]), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify(topicsPage({ content: [], totalElements: 0, empty: true })), { status: 200 })));
  renderPage();
  await screen.findByText("В этой категории пока нет тем");
});

it("shows error and allows retry", async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify([category]), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify({ code: "HTTP_ERROR" }), { status: 500 }))
    .mockResolvedValueOnce(new Response(JSON.stringify(topicsPage()), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  const user = userEvent.setup();
  renderPage();
  const retry = await screen.findByRole("button", { name: /Повторить/i });
  await user.click(retry);
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
});

it("reads page from URL", async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify([category]), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify(topicsPage({ page: 2 })), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  renderPage("general", "?page=2");
  await screen.findByText("First topic");
  expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("page=2"), expect.anything());
});

it("normalizes invalid page to 0", async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify([category]), { status: 200 }))
    .mockResolvedValueOnce(new Response(JSON.stringify(topicsPage({ page: 0 })), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  renderPage("general", "?page=abc");
  await screen.findByText("First topic");
  expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("page=0"), expect.anything());
});

it("ignores stale response when a newer request is in flight", async () => {
  let resolveFirst!: (value: Response) => void;
  let resolveSecond!: (value: Response) => void;
  const first = new Promise<Response>((r) => { resolveFirst = r; });
  const second = new Promise<Response>((r) => { resolveSecond = r; });
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify([category]), { status: 200 }))
    .mockReturnValueOnce(first)
    .mockReturnValueOnce(second);
  vi.stubGlobal("fetch", fetchMock);
  const { rerender } = renderPage("general", "?page=0");
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  rerender(
    <ThemeProvider>
      <AuthContext value={auth()}>
        <MemoryRouter initialEntries={["/forum/categories/general?page=1"]}>
          <ForumCategoryPage />
        </MemoryRouter>
      </AuthContext>
    </ThemeProvider>,
  );
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
  resolveSecond(new Response(JSON.stringify(topicsPage({ page: 1, content: [{ id: 99, categorySlug: "general", title: "Newer topic", author: { id: 5, username: "Dan" }, pinned: false, locked: false, postsCount: 1, createdAt: "2026-08-06T10:00:00Z", lastActivityAt: "2026-08-06T10:00:00Z" }] })), { status: 200 }));
  await screen.findByText("Newer topic");
  resolveFirst(new Response(JSON.stringify(topicsPage({ page: 0, content: [{ id: 1, categorySlug: "general", title: "Stale topic", author: { id: 1, username: "Zzz" }, pinned: false, locked: false, postsCount: 0, createdAt: "2026-01-01T00:00:00Z", lastActivityAt: "2026-01-01T00:00:00Z" }] })), { status: 200 }));
  await expect(screen.findByText("Stale topic")).rejects.toThrow();
  expect(screen.getByText("Newer topic")).toBeInTheDocument();
});
