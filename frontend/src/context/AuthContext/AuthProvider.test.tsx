import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthProvider } from "./AuthProvider";
import { useAuth } from "./useAuth";
import { tokenStorage } from "../../services/tokenStorage";
function Consumer() {
  const { login, logout, status } = useAuth();
  return (
    <>
      <p>{status}</p>
      <button onClick={() => void login({ email: "a@loopy.test", password: "password" })}>login</button>
      <button onClick={logout}>logout</button>
    </>
  );
}
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
beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation((url: string) =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () =>
          url.includes("/auth/login") ? { accessToken: "token", tokenType: "Bearer", expiresIn: 3600 } : user,
      }),
    ),
  );
});
afterEach(() => vi.unstubAllGlobals());
it("stores token after successful login and clears it on logout", async () => {
  render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>,
  );
  await waitFor(() => expect(screen.getByText("unauthenticated")).toBeInTheDocument());
  await userEvent.click(screen.getByText("login"));
  await waitFor(() => expect(tokenStorage.getToken()).toBe("token"));
  await userEvent.click(screen.getByText("logout"));
  expect(tokenStorage.getToken()).toBeNull();
  expect(screen.getByText("unauthenticated")).toBeInTheDocument();
});
