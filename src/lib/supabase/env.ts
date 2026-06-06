const PLACEHOLDER_MARKERS = [
  "your-project",
  "your-anon-key",
  "your-service-role-key",
  "your-gemini-api-key",
] as const;

export const getSupabaseEnv = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  return { url, anonKey };
};

export const isSupabaseConfigured = (): boolean => {
  const { url, anonKey } = getSupabaseEnv();
  if (!url || !anonKey) return false;

  const hasPlaceholder = PLACEHOLDER_MARKERS.some(
    (marker) => url.includes(marker) || anonKey.includes(marker),
  );

  return !hasPlaceholder && url.startsWith("https://") && anonKey.length > 20;
};

export const supabaseConfigErrorMessage = (): string | null => {
  const { url, anonKey } = getSupabaseEnv();

  if (!url || !anonKey) {
    return "Supabase 환경 변수가 없습니다. .env.local 파일을 확인하세요.";
  }

  if (
    url.includes("your-project") ||
    anonKey.includes("your-anon-key")
  ) {
    return [
      "Supabase가 아직 연결되지 않았습니다.",
      "Supabase 대시보드 → Project Settings → API에서",
      "Project URL과 anon public key를 .env.local에 넣은 뒤 개발 서버를 재시작하세요.",
    ].join(" ");
  }

  if (!url.startsWith("https://")) {
    return "NEXT_PUBLIC_SUPABASE_URL 형식이 올바르지 않습니다. (https://xxx.supabase.co)";
  }

  return null;
};
