import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { apiClient } from "../../api/apiClient";
import { ProtectedRoute } from "../../components/routing/ProtectedRoute";
import { tokenStorage } from "../../services/tokenStorage";
import { AuthProvider } from "./AuthProvider";
import { useAuth } from "./useAuth";

const currentUser = {
  id: 1,
  name: "Test user",
  email: "test@loopy.local",
  createdAt: "2026-01-01",
  profile: {
    displayName: "Test user",
    nativeLanguage: "ru",
    learningLanguage: "English",
    timezone: "UTC",
    dailyNewCardsLimit: 10,
    dailyReviewLimit: 100,
  },
};

function PrivateContent() {
  const { status, user } = useAuth();
  return <p>{`${status}:${user?.email ?? "no-user"}`}</p>;
}

beforeEach(() => {
  localStorage.clear();
  tokenStorage.setToken("valid-token");
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string) => {
      if (url.endsWith("/users/me")) {
        return Promise.resolve(new Response(JSON.stringify(currentUser), { status: 200 }));
      }
      return Promise.resolve(
        new Response(JSON.stringify({ code: "UNAUTHORIZED", message: "Expired", status: 401 }), { status: 401 }),
      );
    }),
  );
});

afterEach(() => vi.unstubAllGlobals());

it("handles a 401 event by clearing auth state and redirecting to login", async () => {
  render(
    <MemoryRouter initialEntries={["/private"]}>
      <AuthProvider>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/private" element={<PrivateContent />} />
          </Route>
          <Route path="/login" element={<p>Login</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );

  await waitFor(() => expect(screen.getByText("authenticated:test@loopy.local")).toBeInTheDocument());
  await expect(apiClient("/protected-resource")).rejects.toMatchObject({ status: 401 });

  await waitFor(() => expect(screen.getByText("Login")).toBeInTheDocument());
  expect(tokenStorage.getToken()).toBeNull();
  expect(screen.queryByText("authenticated:test@loopy.local")).not.toBeInTheDocument();
});
