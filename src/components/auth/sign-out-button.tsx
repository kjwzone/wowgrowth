"use client";

import { signOut } from "@/lib/auth/actions";

export const SignOutButton = () => (
  <form action={signOut}>
    <button
      type="submit"
      className="text-sm text-slate-600 hover:text-slate-900 underline"
    >
      로그아웃
    </button>
  </form>
);
