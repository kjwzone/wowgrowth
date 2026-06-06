export const publicPaths = ["/", "/login", "/signup"] as const;

export const publicPrefixes = ["/error"] as const;

export const protectedPrefixes = [
  "/dashboard",
  "/company",
  "/programs",
  "/matches",
  "/reports",
  "/business-plans",
  "/ai-results",
  "/admin",
] as const;

export const adminOnlyPrefixes = [
  "/admin/programs",
  "/admin/users",
  "/admin/jobs",
] as const;

export const isPublicPath = (pathname: string): boolean => {
  if ((publicPaths as readonly string[]).includes(pathname)) return true;
  return publicPrefixes.some((prefix) => pathname.startsWith(prefix));
};

export const isProtectedPath = (pathname: string): boolean =>
  protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

export const requiresAdmin = (pathname: string): boolean =>
  adminOnlyPrefixes.some((prefix) => pathname.startsWith(prefix));

export const requiresReviewerAccess = (pathname: string): boolean =>
  pathname.startsWith("/admin/reviews");
