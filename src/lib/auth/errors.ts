/** Next.js redirect() throws a special error — must rethrow from action catch blocks */
export const isAuthRedirectError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "digest" in error &&
  String((error as { digest?: string }).digest ?? "").startsWith("NEXT_REDIRECT");
