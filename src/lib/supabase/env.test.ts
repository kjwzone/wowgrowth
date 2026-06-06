import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isProductionBuildPhase,
  isSupabaseConfigured,
  resolveSupabaseCredentials,
  supabaseConfigErrorMessage,
} from "@/lib/supabase/env";

describe("supabase env", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("detects placeholder config", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://your-project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "your-anon-key");
    expect(isSupabaseConfigured()).toBe(false);
    expect(supabaseConfigErrorMessage()).toContain("연결되지 않았습니다");
  });

  it("accepts real-looking config", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abcdefgh.supabase.co");
    vi.stubEnv(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ9.x",
    );
    expect(isSupabaseConfigured()).toBe(true);
    expect(supabaseConfigErrorMessage()).toBeNull();
  });

  it("uses build placeholder during next build without env", () => {
    vi.stubEnv("NEXT_PHASE", "phase-production-build");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

    expect(isProductionBuildPhase()).toBe(true);
    expect(resolveSupabaseCredentials().isBuildPlaceholder).toBe(true);
  });

  it("throws outside build when env is missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");

    expect(() => resolveSupabaseCredentials()).toThrow(/환경 변수가 없습니다/);
  });
});
