import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext/useAuth";
import { authApi } from "../../api/authApi";
import { PageHeader } from "../../components/layout/PageHeader";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { AccountInformation } from "../../components/profile/AccountInformation";
import { ProfileForm } from "../../components/profile/ProfileForm";
import { ProfileSaveBar } from "../../components/profile/ProfileSaveBar";
import { ProfileSkeleton } from "../../components/profile/ProfileSkeleton";
import { ProfileErrorState } from "../../components/profile/ProfileErrorState";
import { useProfile } from "../../hooks/useProfile";
import { RefreshIcon } from "../../components/icons/RefreshIcon";
import styles from "./ProfilePage.module.css";

export function ProfilePage() {
  const { user, setUser } = useAuth();
  const [loadingRefresh, setLoadingRefresh] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [pendingLeaveUrl, setPendingLeaveUrl] = useState<string | null>(null);

  const { draft, isDirty, isSaving, saveStatus, fieldErrors, formError, setDraftField, save, cancel, clearSaveStatus } =
    useProfile();

  const refreshProfile = useCallback(async () => {
    setLoadingRefresh(true);
    setLoadError(null);
    try {
      const updatedUser = await authApi.currentUser();
      setUser?.(updatedUser);
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      setLoadError("Не удалось загрузить профиль");
    } finally {
      setLoadingRefresh(false);
    }
  }, [setUser]);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const handleNavAttempt = useCallback(
    (url: string) => {
      if (!isDirty) return false;
      setPendingLeaveUrl(url);
      setShowLeaveModal(true);
      return true;
    },
    [isDirty],
  );

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a[href]");
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#")) return;
      if (href === window.location.pathname) return;
      const blocked = handleNavAttempt(href);
      if (blocked) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [isDirty, handleNavAttempt]);

  const confirmLeave = useCallback(() => {
    setShowLeaveModal(false);
    if (pendingLeaveUrl) {
      window.location.href = pendingLeaveUrl;
    }
  }, [pendingLeaveUrl]);

  const cancelLeave = useCallback(() => {
    setShowLeaveModal(false);
    setPendingLeaveUrl(null);
  }, []);

  if (!user?.profile && !loadError) {
    return (
      <main className="page" aria-busy="true">
        <ProfileSkeleton />
      </main>
    );
  }

  if (loadError || (!user?.profile && !loadingRefresh)) {
    return (
      <main className="page">
        <ProfileErrorState onRetry={refreshProfile} />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="page" aria-busy="true">
        <ProfileSkeleton />
      </main>
    );
  }

  return (
    <main className="page">
      <PageHeader
        title="Профиль"
        subtitle="Настройки аккаунта и обучения"
        action={
          <Button
            variant="ghost"
            leftIcon={<RefreshIcon />}
            loading={loadingRefresh}
            disabled={isSaving}
            onClick={refreshProfile}
          >
            Обновить
          </Button>
        }
      />

      {formError && (
        <div className={styles.formError} role="alert">
          <p>{formError}</p>
          {formError.includes("другом окне") && (
            <Button variant="secondary" onClick={refreshProfile}>
              Обновить профиль
            </Button>
          )}
        </div>
      )}

      <div className={styles.layout}>
        <AccountInformation email={user.email} name={user.name} createdAt={user.createdAt} />

        <div className={styles.settings}>
          <ProfileForm
            draft={draft}
            fieldErrors={fieldErrors}
            onDraftChange={(updater) => {
              clearSaveStatus();
              setDraftField(updater);
            }}
          />

          <ProfileSaveBar
            isDirty={isDirty}
            isSaving={isSaving}
            saveStatus={saveStatus}
            onSave={save}
            onCancel={cancel}
          />
        </div>
      </div>

      {showLeaveModal && (
        <Modal title="Несохранённые изменения" onClose={cancelLeave} busy={isSaving}>
          <p className={styles.leaveText}>
            У вас есть несохранённые изменения. Если вы уйдёте, изменения будут потеряны.
          </p>
          <div className={styles.leaveActions}>
            <Button variant="secondary" onClick={cancelLeave}>
              Остаться
            </Button>
            <Button variant="danger" onClick={confirmLeave}>
              Уйти без сохранения
            </Button>
          </div>
        </Modal>
      )}
    </main>
  );
}
