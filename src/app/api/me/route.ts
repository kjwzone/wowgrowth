import { handleApiRoute } from "@/lib/api/response";
import { requireAuth } from "@/lib/auth/session";

export const GET = async () =>
  handleApiRoute(async () => {
    const { profile } = await requireAuth();
    return {
      id: profile.id,
      email: profile.email,
      role: profile.role,
    };
  });
