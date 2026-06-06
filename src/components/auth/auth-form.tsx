"use client";

import { useActionState } from "react";
import type { AuthActionState } from "@/lib/auth/actions";

type Field = {
  name: string;
  label: string;
  type: "email" | "password" | "text";
  required?: boolean;
};

export const AuthForm = ({
  action,
  fields,
  submitLabel,
}: {
  action: (
    state: AuthActionState,
    formData: FormData,
  ) => Promise<AuthActionState>;
  fields: Field[];
  submitLabel: string;
}) => {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="mt-4 space-y-4">
      {fields.map((field) => (
        <label key={field.name} className="block text-sm">
          <span className="text-slate-700">{field.label}</span>
          <input
            name={field.name}
            type={field.type}
            required={field.required ?? true}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>
      ))}
      {state.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
      >
        {pending ? "처리 중..." : submitLabel}
      </button>
    </form>
  );
};
