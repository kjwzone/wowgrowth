import { createClient } from "@/lib/supabase/server";
import { ApiError } from "@/lib/api/errors";
import type { AppRole, Profile } from "@/lib/types/database";

export type AuthContext = {
  userId: string;
  profile: Profile;
};

export const requireAuth = async (): Promise<AuthContext> => {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new ApiError("UNAUTHORIZED", "로그인이 필요합니다.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, role, full_name, created_at, updated_at")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    throw new ApiError("UNAUTHORIZED", "프로필을 찾을 수 없습니다.");
  }

  return { userId: user.id, profile: profile as Profile };
};

export const requireRole = async (
  roles: readonly AppRole[],
): Promise<AuthContext> => {
  const ctx = await requireAuth();
  if (!roles.includes(ctx.profile.role)) {
    throw new ApiError("FORBIDDEN", "접근 권한이 없습니다.");
  }
  return ctx;
};
