"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAuthRedirectError } from "@/lib/auth/errors";
import { mapAuthErrorMessage } from "@/lib/auth/messages";

export type AuthActionState = {
  error?: string;
};

const toAuthErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    const msg = error.message;
    if (msg === "fetch failed" || msg.includes("ENOTFOUND") || msg.includes("ECONNREFUSED")) {
      return [
        "Supabase 서버에 연결하지 못했습니다.",
        ".env.local의 NEXT_PUBLIC_SUPABASE_URL / ANON_KEY가",
        "실제 프로젝트 값인지 확인하고 npm run dev를 재시작하세요.",
      ].join(" ");
    }
    return msg;
  }
  return "알 수 없는 오류가 발생했습니다.";
};

const runAuthAction = async (
  fn: () => Promise<AuthActionState | void>,
): Promise<AuthActionState> => {
  try {
    const result = await fn();
    return result ?? {};
  } catch (error) {
    if (isAuthRedirectError(error)) {
      throw error;
    }
    return { error: toAuthErrorMessage(error) };
  }
};

export const signIn = async (
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> =>
  runAuthAction(async () => {
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      return { error: "이메일과 비밀번호를 입력하세요." };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { error: mapAuthErrorMessage(error.message) };
    }

    redirect("/dashboard");
  });

export const signUp = async (
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> =>
  runAuthAction(async () => {
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const fullName = String(formData.get("fullName") ?? "").trim();

    if (!email || !password) {
      return { error: "이메일과 비밀번호를 입력하세요." };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: fullName ? { data: { full_name: fullName } } : undefined,
    });

    if (error) {
      return { error: mapAuthErrorMessage(error.message) };
    }

    redirect("/dashboard");
  });

export const signOut = async (): Promise<void> => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
};
