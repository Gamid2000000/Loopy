import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext/AuthContext";
import { ToastContext } from "../../components/ui/Toast/ToastContext";
import { ProfilePage } from "./ProfilePage";
import type { AuthContextValue } from "../../context/AuthContext/authTypes";
import { ThemeProvider } from "../../theme";

vi.mock("../../hooks/useProfile", () => ({
  useProfile: vi.fn(),
}));

import { useProfile } from "../../hooks/useProfile";

const user = {
  id: 1,
  name: "Test User",
  email: "test@loopy.test",
  createdAt: "2026-01-01T00:00:00Z",
  profile: {
    displayName: "Test",
    nativeLanguage: "en",
    learningLanguage: "es",
    timezone: "UTC",
    dailyNewCardsLimit: 10,
    dailyReviewLimit: 100,
  },
};

const authValue: AuthContextValue = {
  status: "authenticated",
  user,
  error: null,
  isLoading: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  restoreSession: async () => {},
  setUser: () => {},
};

const toastValue = { showToast: vi.fn() };

function renderProfile() {
  return render(
    <ThemeProvider>
      <ToastContext.Provider value={toastValue}>
        <AuthContext.Provider value={authValue}>
          <MemoryRouter>
            <ProfilePage />
          </MemoryRouter>
        </AuthContext.Provider>
      </ToastContext.Provider>
    </ThemeProvider>,
  );
}

beforeEach(() => {
  vi.mocked(useProfile).mockReturnValue({
    saved: user.profile,
    draft: user.profile,
    isDirty: false,
    isSaving: false,
    saveStatus: "idle",
    fieldErrors: {},
    formError: null,
    setDraftField: vi.fn(),
    save: vi.fn(),
    cancel: vi.fn(),
    clearSaveStatus: vi.fn(),
  });
});

it("renders profile page title", () => {
  renderProfile();
  expect(screen.getByText("Профиль")).toBeInTheDocument();
});

it("renders account email", () => {
  renderProfile();
  expect(screen.getByText("test@loopy.test")).toBeInTheDocument();
});

it("renders account name", () => {
  renderProfile();
  expect(screen.getByText("Test User")).toBeInTheDocument();
});

it("renders native language select", () => {
  renderProfile();
  expect(screen.getByText("Родной язык")).toBeInTheDocument();
});

it("renders learning language select", () => {
  renderProfile();
  expect(screen.getByText("Изучаемый язык")).toBeInTheDocument();
});

it("renders timezone select", () => {
  renderProfile();
  expect(screen.getByText("Часовой пояс")).toBeInTheDocument();
});

it("renders daily limits form", () => {
  renderProfile();
  expect(screen.getByText("Новых карточек в день")).toBeInTheDocument();
  expect(screen.getByText("Повторений в день")).toBeInTheDocument();
});

it("renders save button", () => {
  renderProfile();
  expect(screen.getByText("Сохранить изменения")).toBeInTheDocument();
});

it("renders cancel button", () => {
  renderProfile();
  expect(screen.getByText("Отменить изменения")).toBeInTheDocument();
});

it("save button is disabled when not dirty", () => {
  renderProfile();
  const saveBtn = screen.getByRole("button", { name: "Сохранить изменения" });
  expect(saveBtn).toBeDisabled();
});

it("cancel button is disabled when not dirty", () => {
  renderProfile();
  const cancelBtn = screen.getByRole("button", { name: "Отменить изменения" });
  expect(cancelBtn).toBeDisabled();
});

it("save button is enabled when dirty", () => {
  vi.mocked(useProfile).mockReturnValue({
    ...vi.mocked(useProfile)(),
    isDirty: true,
  } as ReturnType<typeof useProfile>);
  renderProfile();
  const saveBtn = screen.getByRole("button", { name: "Сохранить изменения" });
  expect(saveBtn).not.toBeDisabled();
});

it("shows saved status when saveStatus is saved", () => {
  vi.mocked(useProfile).mockReturnValue({
    ...vi.mocked(useProfile)(),
    isDirty: true,
    saveStatus: "saved",
  } as ReturnType<typeof useProfile>);
  renderProfile();
  expect(screen.getByText("Сохранено")).toBeInTheDocument();
});

it("shows form error when present", () => {
  vi.mocked(useProfile).mockReturnValue({
    ...vi.mocked(useProfile)(),
    formError: "Не удалось сохранить профиль",
    saveStatus: "error",
  } as ReturnType<typeof useProfile>);
  renderProfile();
  expect(screen.getByText("Не удалось сохранить профиль")).toBeInTheDocument();
});

it("does not show avatar controls", () => {
  renderProfile();
  expect(screen.queryByText(/аватар/i)).toBeNull();
  expect(screen.queryByText(/парол/i)).toBeNull();
  expect(screen.queryByText(/удален/i)).toBeNull();
});

it("email is rendered as read-only text", () => {
  renderProfile();
  const email = screen.getByText("test@loopy.test");
  const dd = email.closest("dd");
  expect(dd?.getAttribute("aria-readonly")).toBe("true");
});

it("changes theme without changing the profile draft", () => {
  const setDraftField = vi.fn();
  const clearSaveStatus = vi.fn();
  vi.mocked(useProfile).mockReturnValue({
    ...vi.mocked(useProfile)(),
    setDraftField,
    clearSaveStatus,
  } as ReturnType<typeof useProfile>);
  renderProfile();
  screen.getByRole("radio", { name: /Светлая/ }).click();
  expect(document.documentElement.dataset.theme).toBe("light");
  expect(setDraftField).not.toHaveBeenCalled();
  expect(clearSaveStatus).not.toHaveBeenCalled();
});
