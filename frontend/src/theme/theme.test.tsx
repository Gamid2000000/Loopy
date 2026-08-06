import { act, render, screen } from "@testing-library/react";
import { ThemeProvider } from "./ThemeProvider";
import { resolveTheme } from "./resolveTheme";
import { getStoredThemePreference, THEME_STORAGE_KEY } from "./themeStorage";
import { useTheme } from "./useTheme";

type MediaMock = { setMatches: (matches: boolean) => void };

function mockMatchMedia(initialMatches: boolean): MediaMock {
  let matches = initialMatches;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation(() => ({
      get matches() {
        return matches;
      },
      addEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => listeners.add(listener),
      removeEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener),
    })),
  );
  return {
    setMatches(next) {
      matches = next;
      listeners.forEach((listener) => listener({ matches: next } as MediaQueryListEvent));
    },
  };
}

function ThemeProbe() {
  const { preference, resolvedTheme, setPreference } = useTheme();
  return (
    <>
      <output>{`${preference}:${resolvedTheme}`}</output>
      <button onClick={() => setPreference("light")}>light</button>
      <button onClick={() => setPreference("dark")}>dark</button>
      <button onClick={() => setPreference("system")}>system</button>
    </>
  );
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
});

afterEach(() => vi.unstubAllGlobals());

it("reads valid stored preferences and safely falls back for invalid values", () => {
  localStorage.setItem(THEME_STORAGE_KEY, "light");
  expect(getStoredThemePreference()).toBe("light");
  localStorage.setItem(THEME_STORAGE_KEY, "invalid");
  expect(getStoredThemePreference()).toBe("system");
});

it("resolves system and explicit preferences separately", () => {
  expect(resolveTheme("system", true)).toBe("dark");
  expect(resolveTheme("system", false)).toBe("light");
  expect(resolveTheme("light", true)).toBe("light");
  expect(resolveTheme("dark", false)).toBe("dark");
});

it("applies the initial system theme and follows system changes", () => {
  const media = mockMatchMedia(true);
  render(
    <ThemeProvider>
      <ThemeProbe />
    </ThemeProvider>,
  );
  expect(screen.getByText("system:dark")).toBeInTheDocument();
  expect(document.documentElement.dataset.theme).toBe("dark");
  act(() => media.setMatches(false));
  expect(screen.getByText("system:light")).toBeInTheDocument();
});

it("persists explicit preference and ignores system changes", () => {
  const media = mockMatchMedia(true);
  render(
    <ThemeProvider>
      <ThemeProbe />
    </ThemeProvider>,
  );
  act(() => screen.getByRole("button", { name: "light" }).click());
  expect(screen.getByText("light:light")).toBeInTheDocument();
  expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  act(() => media.setMatches(true));
  expect(screen.getByText("light:light")).toBeInTheDocument();
});

it("synchronizes an incoming storage event", () => {
  mockMatchMedia(false);
  render(
    <ThemeProvider>
      <ThemeProbe />
    </ThemeProvider>,
  );
  act(() => window.dispatchEvent(new StorageEvent("storage", { key: THEME_STORAGE_KEY, newValue: "dark" })));
  expect(screen.getByText("dark:dark")).toBeInTheDocument();
});

it("does not crash without matchMedia", () => {
  vi.stubGlobal("matchMedia", undefined);
  render(
    <ThemeProvider>
      <ThemeProbe />
    </ThemeProvider>,
  );
  expect(screen.getByText("system:dark")).toBeInTheDocument();
});
