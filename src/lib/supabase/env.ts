const PLACEHOLDER_MARKERS = [
  "your-project",
  "your-anon-key",
  "your-service-role-key",
  "your-gemini-api-key",
] as const;

/** `next build` prerender — env 미설정 시에도 빌드가 통과하도록 하는 더미 값 */
const BUILD_PLACEHOLDER_URL = "https://build-placeholder.supabase.co";
const BUILD_PLACEHOLDER_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1wbGFjZWhvbGRlciJ9.build";

export const isProductionBuildPhase = (): boolean =>
  process.env.NEXT_PHASE === "phase-production-build";

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
    return "Supabase 환경 변수가 없습니다. .env.local 또는 Vercel Environment Variables를 확인하세요.";
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

export type SupabaseCredentials = {
  url: string;
  anonKey: string;
  isBuildPlaceholder: boolean;
};

export const resolveSupabaseCredentials = (): SupabaseCredentials => {
  const configError = supabaseConfigErrorMessage();
  if (!configError) {
    const { url, anonKey } = getSupabaseEnv();
    return { url: url!, anonKey: anonKey!, isBuildPlaceholder: false };
  }

  if (isProductionBuildPhase()) {
    return {
      url: BUILD_PLACEHOLDER_URL,
      anonKey: BUILD_PLACEHOLDER_ANON_KEY,
      isBuildPlaceholder: true,
    };
  }

  throw new Error(configError);
};

export const isVercelRuntime = (): boolean => process.env.VERCEL === "1";

/** 로그인/회원가입 등에서 표시할 Supabase 설정 안내 (설정 OK면 null) */
export const getSupabaseSetupHint = (): string | null => {
  if (isSupabaseConfigured()) {
    return null;
  }

  const { url, anonKey } = getSupabaseEnv();
  const missing = !url || !anonKey;

  if (missing && isVercelRuntime()) {
    return [
      "Supabase 미연결: Vercel → Settings → Environment Variables에",
      "NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY를 등록한 뒤 Redeploy하세요.",
    ].join(" ");
  }

  if (missing) {
    return [
      "Supabase 미연결: .env.local에 NEXT_PUBLIC_SUPABASE_URL,",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY를 설정한 뒤 npm run dev를 재시작하세요.",
    ].join(" ");
  }

  const detail = supabaseConfigErrorMessage();
  return detail ? `Supabase 미연결: ${detail}` : "Supabase 연결 설정을 확인하세요.";
};
