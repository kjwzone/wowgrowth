import { createClient } from "@supabase/supabase-js";

const PLACEHOLDER_MARKERS = ["your-project", "your-service-role-key"];

export const resolveSupabaseAdminConfig = () => {
  const url =
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    return { ok: false, message: "Supabase URL 또는 SERVICE_ROLE_KEY가 설정되지 않았습니다." };
  }

  const hasPlaceholder = PLACEHOLDER_MARKERS.some(
    (marker) => url.includes(marker) || serviceRoleKey.includes(marker),
  );

  if (hasPlaceholder || !url.startsWith("https://")) {
    return { ok: false, message: "Supabase 환경 변수가 유효하지 않습니다." };
  }

  return { ok: true, url, serviceRoleKey };
};

export const createSupabaseAdminClient = () => {
  const config = resolveSupabaseAdminConfig();
  if (!config.ok) {
    return { client: null, error: config.message };
  }

  return {
    client: createClient(config.url, config.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
    error: null,
  };
};
