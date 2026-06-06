import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv, supabaseConfigErrorMessage } from "@/lib/supabase/env";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

export const createClient = async () => {
  const configError = supabaseConfigErrorMessage();
  if (configError) {
    throw new Error(configError);
  }

  const { url, anonKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(
    url!,
    anonKey!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet: CookieToSet[]) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );
};
