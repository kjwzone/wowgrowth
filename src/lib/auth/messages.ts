/** Supabase Auth 오류 메시지를 한국어로 변환 */
export const mapAuthErrorMessage = (message: string): string => {
  const lower = message.toLowerCase();

  if (lower.includes("rate limit") || lower.includes("email rate limit")) {
    return [
      "이메일 발송 한도를 초과했습니다.",
      "같은 주소로 회원가입을 여러 번 시도하면 발생합니다.",
      "30~60분 후 다시 시도하거나, Supabase에서 이메일 확인을 끄면(MVP 개발용) 바로 가입할 수 있습니다.",
      "이미 가입했다면 /login 에서 로그인하세요.",
    ].join(" ");
  }

  if (lower.includes("user already registered")) {
    return "이미 가입된 이메일입니다. 로그인 페이지에서 로그인하세요.";
  }

  if (lower.includes("invalid login credentials")) {
    return "이메일 또는 비밀번호가 올바르지 않습니다.";
  }

  if (lower.includes("email not confirmed")) {
    return "이메일 인증이 필요합니다. 메일함을 확인하거나 Supabase에서 Confirm email을 끄세요.";
  }

  return message;
};
