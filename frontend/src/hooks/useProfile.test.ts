import { act, renderHook } from "@testing-library/react";
import { useProfile, normalizeProfile } from "./useProfile";
import type { AuthContextValue } from "../context/AuthContext/authTypes";
import type { UpdateUserProfileRequest, UserProfileResponse } from "../types/user";

vi.mock("../api/profileApi", () => ({ profileApi: { updateProfile: vi.fn() } }));
vi.mock("../context/AuthContext/useAuth", () => ({ useAuth: vi.fn() }));
vi.mock("../components/ui/Toast/useToast", () => ({ useToast: vi.fn() }));

import { profileApi } from "../api/profileApi";
import { useAuth } from "../context/AuthContext/useAuth";
import { useToast } from "../components/ui/Toast/useToast";

const savedProfile: UserProfileResponse = {
  displayName: "Test",
  nativeLanguage: "en",
  learningLanguage: "es",
  timezone: "UTC",
  dailyNewCardsLimit: 10,
  dailyReviewLimit: 100,
};

const currentUser = {
  id: 1,
  name: "Test User",
  email: "test@loopy.test",
  createdAt: "2026-01-01T00:00:00Z",
  profile: savedProfile,
};

const setUser = vi.fn();
const showToast = vi.fn();

function setup() {
  vi.mocked(useAuth).mockReturnValue({
    user: currentUser,
    setUser,
    status: "authenticated",
    error: null,
    isLoading: false,
    login: async () => {},
    register: async () => {},
    logout: () => {},
    restoreSession: async () => {},
  } as AuthContextValue);
  vi.mocked(useToast).mockReturnValue({ showToast } as ReturnType<typeof useToast>);
  vi.mocked(profileApi.updateProfile).mockResolvedValue(savedProfile);
}

beforeEach(() => {
  setUser.mockClear();
  showToast.mockClear();
  vi.mocked(profileApi.updateProfile).mockClear();
});

describe("useProfile", () => {
  it("initializes draft and saved from AuthContext user", () => {
    setup();
    const { result } = renderHook(() => useProfile());
    expect(result.current.saved).toEqual(normalizeProfile(savedProfile));
    expect(result.current.draft).toEqual(normalizeProfile(savedProfile));
    expect(result.current.isDirty).toBe(false);
  });

  it("marks dirty when draft changes", () => {
    setup();
    const { result } = renderHook(() => useProfile());
    act(() => {
      result.current.setDraftField((prev) => ({ ...prev, timezone: "Europe/Warsaw" }));
    });
    expect(result.current.isDirty).toBe(true);
  });

  it("resets dirty when reverted to original values", () => {
    setup();
    const { result } = renderHook(() => useProfile());
    act(() => {
      result.current.setDraftField((prev) => ({ ...prev, timezone: "Europe/Warsaw" }));
    });
    expect(result.current.isDirty).toBe(true);
    act(() => {
      result.current.setDraftField(() => normalizeProfile(savedProfile));
    });
    expect(result.current.isDirty).toBe(false);
  });

  it("sends only changed fields in PATCH", async () => {
    setup();
    vi.mocked(profileApi.updateProfile).mockResolvedValue({
      ...savedProfile,
      timezone: "Europe/Warsaw",
    });
    const { result } = renderHook(() => useProfile());
    act(() => {
      result.current.setDraftField((prev) => ({ ...prev, timezone: "Europe/Warsaw" }));
    });
    await act(async () => {
      await result.current.save();
    });
    const callArg = vi.mocked(profileApi.updateProfile).mock.calls[0][0] as UpdateUserProfileRequest;
    expect(callArg).toEqual({ timezone: "Europe/Warsaw" });
  });

  it("updates saved state and AuthContext on success", async () => {
    setup();
    const updatedProfile = { ...savedProfile, timezone: "Europe/Warsaw" };
    vi.mocked(profileApi.updateProfile).mockResolvedValue(updatedProfile);
    const { result } = renderHook(() => useProfile());
    act(() => {
      result.current.setDraftField((prev) => ({ ...prev, timezone: "Europe/Warsaw" }));
    });
    await act(async () => {
      await result.current.save();
    });
    expect(result.current.saved.timezone).toBe("Europe/Warsaw");
    expect(result.current.saveStatus).toBe("saved");
    expect(showToast).toHaveBeenCalledWith("Профиль сохранён", "success");
    expect(setUser).toHaveBeenCalledWith({ ...currentUser, profile: updatedProfile });
  });

  it("preserves draft on save error", async () => {
    setup();
    vi.mocked(profileApi.updateProfile).mockRejectedValue(new Error("fail"));
    const { result } = renderHook(() => useProfile());
    act(() => {
      result.current.setDraftField((prev) => ({ ...prev, timezone: "Europe/Warsaw" }));
    });
    await act(async () => {
      await result.current.save();
    });
    expect(result.current.draft.timezone).toBe("Europe/Warsaw");
    expect(result.current.saveStatus).toBe("error");
  });

  it("prevents double save", async () => {
    setup();
    const deferred = (() => {
      let resolve!: (v: UserProfileResponse) => void;
      const promise = new Promise<UserProfileResponse>((r) => {
        resolve = r;
      });
      return { promise, resolve };
    })();
    vi.mocked(profileApi.updateProfile).mockReturnValue(deferred.promise);
    const { result } = renderHook(() => useProfile());
    act(() => {
      result.current.setDraftField((prev) => ({ ...prev, timezone: "Europe/Warsaw" }));
    });
    let firstSave: Promise<void> | undefined;
    let secondSave: Promise<void> | undefined;
    await act(async () => {
      firstSave = result.current.save();
      secondSave = result.current.save();
    });
    expect(profileApi.updateProfile).toHaveBeenCalledTimes(1);
    act(() => {
      deferred.resolve({ ...savedProfile, timezone: "Europe/Warsaw" });
    });
    await firstSave;
    await secondSave;
  });

  it("cancel restores draft to saved state", () => {
    setup();
    const { result } = renderHook(() => useProfile());
    act(() => {
      result.current.setDraftField((prev) => ({ ...prev, timezone: "Europe/Warsaw" }));
    });
    expect(result.current.isDirty).toBe(true);
    act(() => {
      result.current.cancel();
    });
    expect(result.current.draft.timezone).toBe(savedProfile.timezone);
    expect(result.current.isDirty).toBe(false);
  });

  it("does not save when not dirty", async () => {
    setup();
    const { result } = renderHook(() => useProfile());
    await act(async () => {
      await result.current.save();
    });
    expect(profileApi.updateProfile).not.toHaveBeenCalled();
  });

  it("validates daily limits before save", async () => {
    setup();
    const { result } = renderHook(() => useProfile());
    act(() => {
      result.current.setDraftField((prev) => ({ ...prev, dailyReviewLimit: NaN }));
    });
    await act(async () => {
      await result.current.save();
    });
    expect(result.current.fieldErrors.dailyReviewLimit).toBeDefined();
    expect(profileApi.updateProfile).not.toHaveBeenCalled();
  });

  it("validates timezone is not empty", async () => {
    setup();
    const { result } = renderHook(() => useProfile());
    act(() => {
      result.current.setDraftField((prev) => ({ ...prev, timezone: "" }));
    });
    await act(async () => {
      await result.current.save();
    });
    expect(result.current.fieldErrors.timezone).toBeDefined();
    expect(profileApi.updateProfile).not.toHaveBeenCalled();
  });
});

describe("normalizeProfile", () => {
  it("trims string fields", () => {
    const result = normalizeProfile({
      ...savedProfile,
      displayName: "  Test  ",
      nativeLanguage: " en ",
    });
    expect(result.displayName).toBe("Test");
    expect(result.nativeLanguage).toBe("en");
  });

  it("converts undefined to empty string", () => {
    const result = normalizeProfile({
      dailyNewCardsLimit: 0,
      dailyReviewLimit: 1,
    } as UserProfileResponse);
    expect(result.displayName).toBe("");
    expect(result.timezone).toBe("");
  });
});
