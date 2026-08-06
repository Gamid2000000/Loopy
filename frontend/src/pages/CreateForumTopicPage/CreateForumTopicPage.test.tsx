import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext/AuthContext";
import { useAuth } from "../../context/AuthContext/useAuth";
import type { AuthContextValue } from "../../context/AuthContext/authTypes";
import { ThemeProvider } from "../../theme";
import { CreateForumTopicPage } from "./CreateForumTopicPage";

const authenticatedUser = { id: 1, name: "Test", email: "test@loopy.dev", createdAt: "2026-01-01", profile: { displayName: "Test", nativeLanguage: "ru", learningLanguage: "en", timezone: "UTC", dailyNewCardsLimit: 10, dailyReviewLimit: 100 } };

function auth(overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  return { status: "unauthenticated", user: null, error: null, isLoading: false, login: async () => {}, register: async () => {}, logout: () => {}, restoreSession: async () => {}, setUser: () => {}, ...overrides };
}

function renderPage(authValue: AuthContextValue, categorySlug = "general") {
  return render(
    <ThemeProvider>
      <AuthContext value={authValue}>
        <MemoryRouter initialEntries={[`/forum/categories/${categorySlug}/new`]}>
          <CreateForumTopicPage />
        </MemoryRouter>
      </AuthContext>
    </ThemeProvider>,
  );
}

afterEach(() => vi.unstubAllGlobals());

function ForumCreateGuard() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === "authenticated") return <CreateForumTopicPage />;
  return <Navigate to="/login" replace state={{ returnTo: `${location.pathname}${location.search}` }} />;
}

it("redirects guest to login with safe return path", () => {
  let returnToFromState: unknown = undefined;
  function SafePathCapture() {
    const loc = useLocation();
    returnToFromState = (loc.state as { returnTo?: string })?.returnTo;
    return null;
  }
  render(
    <AuthContext value={auth()}>
      <MemoryRouter initialEntries={["/forum/categories/general/new"]}>
        <Routes>
          <Route path="/login" element={<SafePathCapture />} />
          <Route path="/forum/categories/:categorySlug/new" element={<ForumCreateGuard />} />
        </Routes>
      </MemoryRouter>
    </AuthContext>,
  );
  expect(returnToFromState).toBe("/forum/categories/general/new");
});

it("shows form for authenticated user", () => {
  renderPage(auth({ status: "authenticated", user: authenticatedUser }));
  expect(screen.getByLabelText("Название")).toBeInTheDocument();
  expect(screen.getByLabelText("Сообщение")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Создать тему" })).toBeInTheDocument();
});

it("validates title 5–160 characters", async () => {
  renderPage(auth({ status: "authenticated", user: authenticatedUser }));
  const user = userEvent.setup();
  const titleInput = screen.getByLabelText("Название");
  const contentInput = screen.getByLabelText("Сообщение");
  await user.type(titleInput, "Abc");
  await user.type(contentInput, "Valid content here");
  await user.click(screen.getByRole("button", { name: "Создать тему" }));
  expect(await screen.findByText("Проверьте длину полей формы")).toBeInTheDocument();
});

it("validates content 10–10000 characters", async () => {
  renderPage(auth({ status: "authenticated", user: authenticatedUser }));
  const user = userEvent.setup();
  const titleInput = screen.getByLabelText("Название");
  const contentInput = screen.getByLabelText("Сообщение");
  await user.type(titleInput, "Valid title");
  await user.type(contentInput, "Short");
  await user.click(screen.getByRole("button", { name: "Создать тему" }));
  expect(await screen.findByText("Проверьте длину полей формы")).toBeInTheDocument();
});

it("sends correct POST body", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ topicId: 42, firstPostId: 1, categorySlug: "general", title: "My title", createdAt: "2026-08-06T10:00:00Z" }), { status: 201 }));
  vi.stubGlobal("fetch", fetchMock);
  const user = userEvent.setup();
  renderPage(auth({ status: "authenticated", user: authenticatedUser }));
  await user.type(screen.getByLabelText("Название"), "My test title");
  await user.type(screen.getByLabelText("Сообщение"), "Content of the first post");
  await user.click(screen.getByRole("button", { name: "Создать тему" }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  const call = fetchMock.mock.calls[0];
  expect(call[0]).toContain("/forum/categories/general/topics");
  const body = JSON.parse(call[1].body);
  expect(body).toEqual({ title: "My test title", content: "Content of the first post" });
});

it("prevents double submit", async () => {
  let resolveCreate!: (value: Response) => void;
  const createPromise = new Promise<Response>((r) => { resolveCreate = r; });
  const fetchMock = vi.fn().mockReturnValue(createPromise);
  vi.stubGlobal("fetch", fetchMock);
  const user = userEvent.setup();
  renderPage(auth({ status: "authenticated", user: authenticatedUser }));
  await user.type(screen.getByLabelText("Название"), "My test title");
  await user.type(screen.getByLabelText("Сообщение"), "Content of the first post");
  const submitBtn = screen.getByRole("button", { name: "Создать тему" });
  await user.click(submitBtn);
  await user.click(submitBtn);
  resolveCreate(new Response(JSON.stringify({ topicId: 42, firstPostId: 1, categorySlug: "general", title: "My test title", createdAt: "2026-08-06T10:00:00Z" }), { status: 201 }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
});

it("navigates to /forum/topics/{topicId} on success", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ topicId: 42, firstPostId: 1, categorySlug: "general", title: "My title", createdAt: "2026-08-06T10:00:00Z" }), { status: 201 }));
  vi.stubGlobal("fetch", fetchMock);
  const user = userEvent.setup();
  render(
    <AuthContext value={auth({ status: "authenticated", user: authenticatedUser })}>
      <MemoryRouter initialEntries={["/forum/categories/general/new"]}>
        <Routes>
          <Route path="/forum/categories/:categorySlug/new" element={<CreateForumTopicPage />} />
          <Route path="/forum/topics/:topicId" element={<p>Topic 42 page</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext>,
  );
  await user.type(screen.getByLabelText("Название"), "My test title");
  await user.type(screen.getByLabelText("Сообщение"), "Content of the first post");
  await user.click(screen.getByRole("button", { name: "Создать тему" }));
  await waitFor(() => expect(screen.getByText("Topic 42 page")).toBeInTheDocument());
});

it("preserves form values on error", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: "VALIDATION_ERROR" }), { status: 400 })));
  const user = userEvent.setup();
  renderPage(auth({ status: "authenticated", user: authenticatedUser }));
  await user.type(screen.getByLabelText("Название"), "My test title");
  await user.type(screen.getByLabelText("Сообщение"), "Content of the first post");
  await user.click(screen.getByRole("button", { name: "Создать тему" }));
  await waitFor(() => expect(screen.getByText(/Проверьте/)).toBeInTheDocument());
  expect(screen.getByLabelText("Название")).toHaveValue("My test title");
  expect(screen.getByLabelText("Сообщение")).toHaveValue("Content of the first post");
});

it("does not auto-retry on POST failure", async () => {
  const fetchMock = vi.fn().mockRejectedValue(new Error("Network error"));
  vi.stubGlobal("fetch", fetchMock);
  const user = userEvent.setup();
  renderPage(auth({ status: "authenticated", user: authenticatedUser }));
  await user.type(screen.getByLabelText("Название"), "My test title");
  await user.type(screen.getByLabelText("Сообщение"), "Content of the first post");
  await user.click(screen.getByRole("button", { name: "Создать тему" }));
  await waitFor(() => expect(screen.getByText(/Не удалось выполнить операцию/)).toBeInTheDocument());
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
