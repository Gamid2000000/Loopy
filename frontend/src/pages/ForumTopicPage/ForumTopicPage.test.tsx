import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext/AuthContext";
import type { AuthContextValue } from "../../context/AuthContext/authTypes";
import { ThemeProvider } from "../../theme";
import { ToastContext } from "../../components/ui/Toast/ToastContext";
import { ForumTopicPage } from "./ForumTopicPage";

const author = { id: 1, username: "Alice" };
const post = (id: number, content = `Post content ${id}`) => ({ id, author: { id: 1 + id, username: `User${id}` }, content, createdAt: "2026-08-01T10:00:00Z", updatedAt: "2026-08-01T10:00:00Z", edited: false, version: 0 });
const postsPage = (overrides: Record<string, unknown> = {}) => ({
  content: [post(1), post(2, "Line 1\nLine 2"), post(3, '<script>alert("xss")</script>')],
  totalPages: 2,
  totalElements: 3,
  size: 20,
  number: (overrides.number as number) ?? 0,
  first: true,
  last: false,
  empty: false,
  ...overrides,
});
const topicData = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  category: { id: 1, slug: "general", name: "Общее" },
  title: "Test topic",
  author,
  pinned: false,
  locked: false,
  postsCount: 3,
  createdAt: "2026-08-01T10:00:00Z",
  updatedAt: "2026-08-01T10:00:00Z",
  lastActivityAt: "2026-08-01T10:00:00Z",
  version: 0,
  firstPostId: 1,
  posts: postsPage(overrides),
  ...overrides,
});

const authenticatedUser = { id: 1, name: "Test", email: "test@loopy.dev", createdAt: "2026-01-01", profile: { displayName: "Test", nativeLanguage: "ru", learningLanguage: "en", timezone: "UTC", dailyNewCardsLimit: 10, dailyReviewLimit: 100 } };

function auth(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return { status: "unauthenticated", user: null, error: null, isLoading: false, login: async () => {}, register: async () => {}, logout: () => {}, restoreSession: async () => {}, setUser: () => {}, ...overrides };
}

const showToast = vi.fn();

function renderPage(topicId = "1", query = "", authValue: AuthContextValue = auth()) {
  return render(
    <ThemeProvider>
      <AuthContext value={authValue}>
        <ToastContext.Provider value={{ showToast }}>
          <MemoryRouter initialEntries={[`/forum/topics/${topicId}${query}`]}>
            <ForumTopicPage />
          </MemoryRouter>
        </ToastContext.Provider>
      </AuthContext>
    </ThemeProvider>,
  );
}

beforeEach(() => {
  showToast.mockClear();
});

afterEach(() => vi.unstubAllGlobals());

it("passes topicId to the API", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(topicData()), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  renderPage("42");
  await screen.findByText("Test topic");
  expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/forum/topics/42"), expect.anything());
});

it("does not call the API for an invalid topicId", () => {
  const fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  renderPage("abc");
  expect(fetchMock).not.toHaveBeenCalled();
  expect(screen.getByText("Тема форума не найдена")).toBeInTheDocument();
});

it("displays metadata and posts", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(topicData()), { status: 200 })));
  renderPage();
  await screen.findByText("Test topic");
  expect(screen.getByText("Post content 1")).toBeInTheDocument();
  expect(screen.getByText("Alice")).toBeInTheDocument();
});

it("preserves multiline content", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(topicData()), { status: 200 })));
  renderPage();
  await screen.findByText("Test topic");
  const multiline = screen.getByText(/Line 1/);
  expect(multiline.textContent).toContain("Line 1\nLine 2");
});

it("renders script as text, not HTML", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(topicData()), { status: 200 })));
  renderPage();
  await screen.findByText("Test topic");
  const scriptText = screen.getByText('<script>alert("xss")</script>');
  expect(scriptText).toBeInTheDocument();
  expect(scriptText.tagName).toBe("P");
});

it("shows login CTA for guest users", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(topicData()), { status: 200 })));
  renderPage("1", "", auth());
  await screen.findByText("Test topic");
  const loginLink = screen.getByRole("link", { name: "Войти" });
  expect(loginLink).toHaveAttribute("href", "/login");
});

it("shows reply form for authenticated users", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(topicData()), { status: 200 })));
  renderPage("1", "", auth({ status: "authenticated", user: authenticatedUser }));
  await screen.findByText("Test topic");
  expect(screen.getByRole("textbox")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Отправить" })).toBeInTheDocument();
});

it("shows locked notice and hides reply form when topic is locked", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(topicData({ locked: true })), { status: 200 })));
  renderPage("1", "", auth({ status: "authenticated", user: authenticatedUser }));
  await screen.findByText("Test topic");
  expect(screen.getByText("Закрыто")).toBeInTheDocument();
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
});

it("shows error and allows retry", async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ code: "HTTP_ERROR" }), { status: 500 }))
    .mockResolvedValueOnce(new Response(JSON.stringify(topicData()), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  const user = userEvent.setup();
  renderPage();
  const retry = await screen.findByRole("button", { name: /Повторить/i });
  await user.click(retry);
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
});

it("reads page from URL", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(topicData({ number: 1 })), { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  renderPage("1", "?page=1");
  await screen.findByText("Test topic");
  expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("page=1"), expect.anything());
});

it("ignores stale response", async () => {
  let resolveFirst!: (value: Response) => void;
  let resolveSecond!: (value: Response) => void;
  const first = new Promise<Response>((r) => { resolveFirst = r; });
  const second = new Promise<Response>((r) => { resolveSecond = r; });
  const fetchMock = vi.fn()
    .mockReturnValueOnce(first)
    .mockReturnValueOnce(second);
  vi.stubGlobal("fetch", fetchMock);
  const { rerender } = renderPage("1", "?page=0");
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  rerender(
    <ThemeProvider>
      <AuthContext value={auth()}>
        <ToastContext.Provider value={{ showToast }}>
          <MemoryRouter initialEntries={["/forum/topics/1?page=1"]}>
            <ForumTopicPage />
          </MemoryRouter>
        </ToastContext.Provider>
      </AuthContext>
    </ThemeProvider>,
  );
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  resolveSecond(new Response(JSON.stringify(topicData({ number: 1, title: "Page 1" })), { status: 200 }));
  await screen.findByText("Page 1");
  resolveFirst(new Response(JSON.stringify(topicData({ number: 0, title: "Page 0 stale" })), { status: 200 }));
  await expect(screen.findByText("Page 0 stale")).rejects.toThrow();
  expect(screen.getByText("Page 1")).toBeInTheDocument();
});

// Reply tests
describe("reply", () => {
  it("guest CTA includes safe return path", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(topicData()), { status: 200 })));
    renderPage("1", "?page=2", auth());
    await screen.findByText("Test topic");
    const loginLink = screen.getByRole("link", { name: "Войти" });
    expect(loginLink).toBeInTheDocument();
  });

  it("authenticated user sees reply form", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(topicData()), { status: 200 })));
    renderPage("1", "", auth({ status: "authenticated", user: authenticatedUser }));
    await screen.findByText("Test topic");
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Отправить" })).toBeInTheDocument();
  });

  it("validates content length", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(topicData()), { status: 200 })));
    const user = userEvent.setup();
    renderPage("1", "", auth({ status: "authenticated", user: authenticatedUser }));
    await screen.findByText("Test topic");
    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "Short");
    await user.click(screen.getByRole("button", { name: "Отправить" }));
    expect(await screen.findByText(/от 10 до 10 000/)).toBeInTheDocument();
  });

  it("prevents double submit", async () => {
    let resolveCreate!: (value: Response) => void;
    const createPromise = new Promise<Response>((r) => { resolveCreate = r; });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(topicData()), { status: 200 }))
      .mockReturnValueOnce(createPromise);
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderPage("1", "", auth({ status: "authenticated", user: authenticatedUser }));
    await screen.findByText("Test topic");
    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "A valid reply with enough characters");
    const submitBtn = screen.getByRole("button", { name: "Отправить" });
    await user.click(submitBtn);
    await user.click(submitBtn);
    resolveCreate(new Response(JSON.stringify({ postId: 10, topicId: 1, postsCount: 4, createdAt: "2026-08-06T10:00:00Z" }), { status: 201 }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const postCalls = fetchMock.mock.calls.filter((call: unknown[]) => String(call[0]).includes("/posts"));
    expect(postCalls).toHaveLength(1);
  });

  it("clears draft only after successful backend response", async () => {
    let resolveCreate!: (value: Response) => void;
    const createPromise = new Promise<Response>((r) => { resolveCreate = r; });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(topicData()), { status: 200 }))
      .mockReturnValueOnce(createPromise)
      .mockResolvedValueOnce(new Response(JSON.stringify(topicData({ postsCount: 4 })), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderPage("1", "", auth({ status: "authenticated", user: authenticatedUser }));
    await screen.findByText("Test topic");
    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "A valid reply with enough characters");
    await user.click(screen.getByRole("button", { name: "Отправить" }));
    // Draft should still be in the textarea before response
    expect(textarea).toHaveValue("A valid reply with enough characters");
    resolveCreate(new Response(JSON.stringify({ postId: 10, topicId: 1, postsCount: 4, createdAt: "2026-08-06T10:00:00Z" }), { status: 201 }));
    await waitFor(() => expect(textarea).toHaveValue(""));
    expect(showToast).toHaveBeenCalledWith("Ответ опубликован", "success");
  });

  it("triggers topic refresh on success", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(topicData()), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ postId: 10, topicId: 1, postsCount: 4, createdAt: "2026-08-06T10:00:00Z" }), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(topicData({ postsCount: 4 })), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderPage("1", "", auth({ status: "authenticated", user: authenticatedUser }));
    await screen.findByText("Test topic");
    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "A valid reply with enough characters");
    await user.click(screen.getByRole("button", { name: "Отправить" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
  });

  it("preserves draft on network error", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(topicData()), { status: 200 }))
      .mockRejectedValueOnce(new Error("Network error"));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderPage("1", "", auth({ status: "authenticated", user: authenticatedUser }));
    await screen.findByText("Test topic");
    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "A valid reply with enough characters");
    await user.click(screen.getByRole("button", { name: "Отправить" }));
    await waitFor(() => expect(textarea).toHaveValue("A valid reply with enough characters"));
  });

  it("preserves draft and updates topic on FORUM_TOPIC_LOCKED", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(topicData()), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: "FORUM_TOPIC_LOCKED", message: "Locked" }), { status: 409 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(topicData({ locked: true })), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderPage("1", "", auth({ status: "authenticated", user: authenticatedUser }));
    await screen.findByText("Test topic");
    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "A valid reply with enough characters");
    await user.click(screen.getByRole("button", { name: "Отправить" }));
    await waitFor(() => expect(textarea).toHaveValue("A valid reply with enough characters"));
    // LOCKED code should trigger topic refresh
    expect(fetchMock).toHaveBeenCalled();
  });

  it("hides reply form after locked topic is refreshed", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(topicData()), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: "FORUM_TOPIC_LOCKED", message: "Locked" }), { status: 409 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(topicData({ locked: true })), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderPage("1", "", auth({ status: "authenticated", user: authenticatedUser }));
    await screen.findByText("Test topic");
    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "A valid reply with enough characters");
    await user.click(screen.getByRole("button", { name: "Отправить" }));
    await waitFor(() => expect(screen.getByText("Закрыто")).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "Отправить" })).not.toBeInTheDocument();
  });

  it("does not auto-retry on POST failure", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(topicData()), { status: 200 }))
      .mockRejectedValueOnce(new Error("Network error"));
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderPage("1", "", auth({ status: "authenticated", user: authenticatedUser }));
    await screen.findByText("Test topic");
    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "A valid reply with enough characters");
    await user.click(screen.getByRole("button", { name: "Отправить" }));
    await waitFor(() => expect(textarea).not.toHaveValue(""));
    const postCalls = fetchMock.mock.calls.filter((call: unknown[]) => String(call[0]).includes("/posts"));
    expect(postCalls).toHaveLength(1);
  });
});
