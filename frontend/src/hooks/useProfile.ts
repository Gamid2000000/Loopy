import { useCallback, useMemo, useRef, useState } from "react";
import { profileApi } from "../api/profileApi";
import { ApiError } from "../api/apiError";
import { useAuth } from "../context/AuthContext/useAuth";
import { useToast } from "../components/ui/Toast/useToast";
import type { UserProfileResponse, UpdateUserProfileRequest } from "../types/user";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export function normalizeProfile(p: UserProfileResponse): UserProfileResponse {
  return {
    displayName: (p.displayName ?? "").trim(),
    nativeLanguage: (p.nativeLanguage ?? "").trim(),
    learningLanguage: (p.learningLanguage ?? "").trim(),
    timezone: (p.timezone ?? "").trim(),
    dailyNewCardsLimit: p.dailyNewCardsLimit,
    dailyReviewLimit: p.dailyReviewLimit,
  };
}

function buildPatchPayload(draft: UserProfileResponse, saved: UserProfileResponse): UpdateUserProfileRequest {
  const payload: UpdateUserProfileRequest = {};

  const stringKeys = ["displayName", "nativeLanguage", "learningLanguage", "timezone"] as const;
  for (const key of stringKeys) {
    const draftVal = String(draft[key] ?? "").trim();
    const savedVal = String(saved[key] ?? "").trim();
    if (draftVal !== savedVal) {
      if (key === "displayName") {
        payload.displayName = draftVal || undefined;
      } else if (key === "nativeLanguage") {
        payload.nativeLanguage = draftVal || null;
      } else if (key === "learningLanguage") {
        payload.learningLanguage = draftVal || null;
      } else if (key === "timezone") {
        payload.timezone = draftVal;
      }
    }
  }

  if (draft.dailyNewCardsLimit !== saved.dailyNewCardsLimit) {
    payload.dailyNewCardsLimit = draft.dailyNewCardsLimit;
  }
  if (draft.dailyReviewLimit !== saved.dailyReviewLimit) {
    payload.dailyReviewLimit = draft.dailyReviewLimit;
  }

  return payload;
}

function validateDraft(draft: UserProfileResponse): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!draft.timezone || !draft.timezone.trim()) {
    errors.timezone = "Часовой пояс обязателен";
  }

  if (!Number.isFinite(draft.dailyNewCardsLimit) || draft.dailyNewCardsLimit < 0 || draft.dailyNewCardsLimit > 1000) {
    errors.dailyNewCardsLimit = "Значение должно быть от 0 до 1000";
  }

  if (!Number.isFinite(draft.dailyReviewLimit) || draft.dailyReviewLimit < 1 || draft.dailyReviewLimit > 10000) {
    errors.dailyReviewLimit = "Значение должно быть от 1 до 10000";
  }

  return errors;
}

function parseBackendFieldErrors(error: ApiError): Record<string, string> {
  if (error.code !== "VALIDATION_ERROR") return {};
  try {
    const message: string = error.message;
    const parsed = JSON.parse(message);
    if (typeof parsed === "object" && parsed !== null) {
      const result: Record<string, string> = {};
      for (const [key, value] of Object.entries(parsed)) {
        if (typeof value === "string") result[key] = value;
      }
      return result;
    }
    return {};
  } catch {
    return {};
  }
}

export interface UseProfileReturn {
  saved: UserProfileResponse;
  draft: UserProfileResponse;
  isDirty: boolean;
  isSaving: boolean;
  saveStatus: SaveStatus;
  fieldErrors: Record<string, string>;
  formError: string | null;
  setDraftField: (updater: (prev: UserProfileResponse) => UserProfileResponse) => void;
  save: () => Promise<void>;
  cancel: () => void;
  clearSaveStatus: () => void;
}

export function useProfile(): UseProfileReturn {
  const { user, setUser } = useAuth();
  const { showToast } = useToast();

  const initial = useMemo(() => normalizeProfile(user!.profile), [user]);
  const [saved, setSaved] = useState<UserProfileResponse>(initial);
  const [draft, setDraft] = useState<UserProfileResponse>(initial);
  const [isSaving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const savingRef = useRef(false);

  const isDirty = useMemo(() => {
    const d = normalizeProfile(draft);
    const s = normalizeProfile(saved);
    return (
      d.displayName !== s.displayName ||
      d.nativeLanguage !== s.nativeLanguage ||
      d.learningLanguage !== s.learningLanguage ||
      d.timezone !== s.timezone ||
      d.dailyNewCardsLimit !== s.dailyNewCardsLimit ||
      d.dailyReviewLimit !== s.dailyReviewLimit
    );
  }, [draft, saved]);

  const setDraftField = useCallback((updater: (prev: UserProfileResponse) => UserProfileResponse) => {
    if (savingRef.current) return;
    setDraft((prev) => updater(prev));
    setSaveStatus("idle");
  }, []);

  const cancel = useCallback(() => {
    if (savingRef.current) return;
    setDraft(normalizeProfile(saved));
    setFieldErrors({});
    setFormError(null);
    setSaveStatus("idle");
  }, [saved]);

  const clearSaveStatus = useCallback(() => {
    setSaveStatus("idle");
  }, []);

  const save = useCallback(async () => {
    if (savingRef.current) return;
    const validationErrors = validateDraft(draft);
    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      return;
    }

    if (!isDirty) return;

    const payload = buildPatchPayload(draft, saved);
    if (Object.keys(payload).length === 0) return;

    savingRef.current = true;
    setSaving(true);
    setSaveStatus("saving");
    setFieldErrors({});
    setFormError(null);

    try {
      const updatedProfile = await profileApi.updateProfile(payload);
      const newProfile = normalizeProfile(updatedProfile);
      setSaved(newProfile);
      setDraft(newProfile);
      setSaveStatus("saved");

      if (user && setUser) {
        setUser({ ...user, profile: updatedProfile });
      }

      showToast("Профиль сохранён", "success");
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      if (caught instanceof ApiError) {
        if (caught.code === "OPTIMISTIC_LOCK_CONFLICT") {
          setFormError("Профиль был изменён в другом окне. Обновите данные");
        } else if (caught.code === "VALIDATION_ERROR") {
          const backendErrors = parseBackendFieldErrors(caught);
          if (Object.keys(backendErrors).length > 0) {
            setFieldErrors(backendErrors);
          } else {
            setFormError(caught.message || "Проверьте заполнение полей");
          }
        } else {
          setFormError("Не удалось сохранить профиль");
        }
      } else {
        setFormError("Не удалось сохранить профиль");
      }
      setSaveStatus("error");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [draft, saved, isDirty, user, setUser, showToast]);

  return {
    saved,
    draft,
    isDirty,
    isSaving,
    saveStatus,
    fieldErrors,
    formError,
    setDraftField,
    save,
    cancel,
    clearSaveStatus,
  };
}
