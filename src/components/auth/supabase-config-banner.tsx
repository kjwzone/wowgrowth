import { getSupabaseSetupHint } from "@/lib/supabase/env";

export const SupabaseConfigBanner = () => {
  const hint = getSupabaseSetupHint();
  if (!hint) {
    return null;
  }

  return (
    <p
      className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
      role="status"
    >
      {hint}
    </p>
  );
};
