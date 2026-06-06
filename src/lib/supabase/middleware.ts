import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  isProtectedPath,
  isPublicPath,
  requiresAdmin,
  requiresReviewerAccess,
} from "@/lib/auth/paths";
import { resolveSupabaseCredentials } from "@/lib/supabase/env";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

export const updateSession = async (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;

  let url: string;
  let anonKey: string;
  try {
    ({ url, anonKey } = resolveSupabaseCredentials());
  } catch {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    url,
    anonKey,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: CookieToSet[]) => {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtectedPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (user && (requiresAdmin(pathname) || requiresReviewerAccess(pathname))) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;
    const allowed =
      requiresReviewerAccess(pathname)
        ? role === "admin" || role === "reviewer"
        : role === "admin";

    if (!allowed) {
      const url = request.nextUrl.clone();
      url.pathname = "/error/403";
      return NextResponse.redirect(url);
    }
  }

  if (user && isPublicPath(pathname) && pathname === "/") {
    return supabaseResponse;
  }

  return supabaseResponse;
};
