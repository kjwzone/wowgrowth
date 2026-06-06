import { createClient } from "@/lib/supabase/server";
import type { AppRole, Profile } from "@/lib/types/database";

export const getSessionProfile = async (): Promise<{
  userId: string;
  profile: Profile;
} | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, role, full_name, created_at, updated_at")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    userId: user.id,
    profile: profile as Profile,
  };
};

export const getRole = async (): Promise<AppRole | null> => {
  const session = await getSessionProfile();
  return session?.profile.role ?? null;
};
