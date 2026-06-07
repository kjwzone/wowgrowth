import { useCallback, useSyncExternalStore } from "react";
import { clearSession, getSession, saveSession } from "@/lib/auth-session";
import type { UserSession } from "@/types";

const subscribe = (onStoreChange: () => void): (() => void) => {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("wowgrowth-session-change", onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("wowgrowth-session-change", onStoreChange);
  };
};

const notifySessionChange = (): void => {
  window.dispatchEvent(new Event("wowgrowth-session-change"));
};

export const persistSession = (session: UserSession): void => {
  saveSession(session);
  notifySessionChange();
};

export const removeSession = (): void => {
  clearSession();
  notifySessionChange();
};

export const useSession = () => {
  const session = useSyncExternalStore(
    subscribe,
    () => getSession(),
    () => null,
  );

  const logout = useCallback(() => {
    removeSession();
  }, []);

  return { session, logout, isLoggedIn: session !== null };
};
