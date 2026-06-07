import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  clearSession,
  getSession,
  saveSession,
  SESSION_STORAGE_KEY,
} from "@/lib/auth-session";

const createStorage = (): Storage => {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => [...store.keys()][index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };
};

describe("auth-session", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createStorage());
  });

  it("saves and reads session", () => {
    saveSession({ email: "ceo@test.com", name: "테스트", role: "user" });
    expect(getSession()?.email).toBe("ceo@test.com");
  });

  it("clears session on logout", () => {
    saveSession({ email: "ceo@test.com", name: "테스트", role: "user" });
    clearSession();
    expect(getSession()).toBeNull();
    expect(localStorage.getItem(SESSION_STORAGE_KEY)).toBeNull();
  });
});
