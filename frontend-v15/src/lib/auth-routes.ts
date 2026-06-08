import type { UserSession } from "@/types";

export const getAppHomePath = (session: UserSession | null): string => {
  if (!session) return "/login";
  return session.role === "admin" ? "/admin/dashboard" : "/dashboard";
};
