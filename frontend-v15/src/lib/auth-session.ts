import type { UserSession } from "@/types";

export const SESSION_STORAGE_KEY = "wowgrowth-session";

export const getSession = (): UserSession | null => {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserSession;
  } catch {
    return null;
  }
};

export const saveSession = (session: UserSession): void => {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
};

export const clearSession = (): void => {
  localStorage.removeItem(SESSION_STORAGE_KEY);
};

export const isLoggedIn = (): boolean => getSession() !== null;
