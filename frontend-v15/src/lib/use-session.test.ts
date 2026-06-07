import { describe, expect, it, beforeEach, vi } from "vitest";
import {
  invalidateSessionSnapshot,
  readSessionSnapshot,
} from "@/lib/use-session";
import { saveSession, SESSION_STORAGE_KEY } from "@/lib/auth-session";

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

describe("use-session snapshot", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createStorage());
    invalidateSessionSnapshot();
  });

  it("returns stable reference when storage is unchanged", () => {
    saveSession({ email: "ceo@test.com", name: "테스트", role: "user" });
    invalidateSessionSnapshot();

    const first = readSessionSnapshot();
    const second = readSessionSnapshot();

    expect(first).toBe(second);
    expect(first?.email).toBe("ceo@test.com");
  });

  it("refreshes snapshot after storage changes", () => {
    saveSession({ email: "a@test.com", name: "A", role: "user" });
    invalidateSessionSnapshot();
    const before = readSessionSnapshot();

    localStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify({ email: "b@test.com", name: "B", role: "admin" }),
    );
    invalidateSessionSnapshot();
    const after = readSessionSnapshot();

    expect(before?.email).toBe("a@test.com");
    expect(after?.email).toBe("b@test.com");
    expect(before).not.toBe(after);
  });
});
