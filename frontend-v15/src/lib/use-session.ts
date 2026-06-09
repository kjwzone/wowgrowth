import { useCallback, useSyncExternalStore } from "react";
import { clearAppDataBootstrap } from "@/lib/app-data-bootstrap";
import { clearSession, saveSession, SESSION_STORAGE_KEY } from "@/lib/auth-session";
import type { UserSession } from "@/types";

let cachedRaw: string | null | undefined;
let cachedSession: UserSession | null = null;

/** useSyncExternalStore는 동일 스냅샷 참조가 필요 — JSON.parse 결과를 캐시 */
export const readSessionSnapshot = (): UserSession | null => {
  if (typeof localStorage === "undefined") return null;

  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (raw === cachedRaw) {
    return cachedSession;
  }

  cachedRaw = raw;
  if (!raw) {
    cachedSession = null;
    return null;
  }

  try {
    cachedSession = JSON.parse(raw) as UserSession;
  } catch {
    cachedSession = null;
  }

  return cachedSession;
};

export const invalidateSessionSnapshot = (): void => {
  cachedRaw = undefined;
};

const subscribe = (onStoreChange: () => void): (() => void) => {
  const onChange = () => {
    invalidateSessionSnapshot();
    onStoreChange();
  };

  window.addEventListener("storage", onChange);
  window.addEventListener("wowgrowth-session-change", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("wowgrowth-session-change", onChange);
  };
};

const notifySessionChange = (): void => {
  invalidateSessionSnapshot();
  window.dispatchEvent(new Event("wowgrowth-session-change"));
};

export const persistSession = (session: UserSession): void => {
  saveSession(session);
  notifySessionChange();
};

export const removeSession = (): void => {
  clearSession();
  clearAppDataBootstrap();
  notifySessionChange();
};

export const useSession = () => {
  const session = useSyncExternalStore(
    subscribe,
    readSessionSnapshot,
    () => null,
  );

  const logout = useCallback(() => {
    removeSession();
  }, []);

  return { session, logout, isLoggedIn: session !== null };
};
