import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext/AuthContext";
import { ProtectedRoute } from "./ProtectedRoute";
import { PublicOnlyRoute } from "./PublicOnlyRoute";
import type { AuthContextValue } from "../../context/AuthContext/authTypes";
const user = {
  id: 1,
  name: "A",
  email: "a@loopy.test",
  createdAt: "2026-01-01",
  profile: {
    displayName: "A",
    nativeLanguage: "ru",
    learningLanguage: "English",
    timezone: "UTC",
    dailyNewCardsLimit: 10,
    dailyReviewLimit: 100,
  },
};
const value = (status: AuthContextValue["status"]): AuthContextValue => ({
  status,
  user: status === "authenticated" ? user : null,
  error: null,
  isLoading: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  restoreSession: async () => {},
  setUser: () => {},
});
function renderGuard(status: AuthContextValue["status"], publicOnly = false) {
  return render(
    <AuthContext value={value(status)}>
      <MemoryRouter initialEntries={["/private"]}>
        <Routes>
          {publicOnly ? (
            <Route element={<PublicOnlyRoute />}>
              <Route path="/private" element={<p>Public</p>} />
            </Route>
          ) : (
            <Route element={<ProtectedRoute />}>
              <Route path="/private" element={<p>Private</p>} />
            </Route>
          )}
          <Route path="/login" element={<p>Login</p>} />
          <Route path="/dashboard" element={<p>Dashboard</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext>,
  );
}
it("shows loader while auth status is unknown", () => {
  renderGuard("unknown");
  expect(screen.getByText("Восстанавливаем сессию…")).toBeInTheDocument();
});
it("redirects an unauthenticated user to login", () => {
  renderGuard("unauthenticated");
  expect(screen.getByText("Login")).toBeInTheDocument();
});
it("renders protected content for authenticated user", () => {
  renderGuard("authenticated");
  expect(screen.getByText("Private")).toBeInTheDocument();
});
it("redirects authenticated users away from public route", () => {
  renderGuard("authenticated", true);
  expect(screen.getByText("Dashboard")).toBeInTheDocument();
});
