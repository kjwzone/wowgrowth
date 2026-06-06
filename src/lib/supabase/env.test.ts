import { afterEach, describe, expect, it, vi } from "vitest";
import { isSupabaseConfigured, supabaseConfigErrorMessage } from "@/lib/supabase/env";

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
});
