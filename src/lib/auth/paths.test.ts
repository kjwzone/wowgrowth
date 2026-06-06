import { describe, expect, it } from "vitest";
import {
  isProtectedPath,
  isPublicPath,
  requiresAdmin,
  requiresReviewerAccess,
} from "@/lib/auth/paths";

describe("auth paths", () => {
  it("treats login as public", () => {
    expect(isPublicPath("/login")).toBe(true);
    expect(isProtectedPath("/login")).toBe(false);
  });

  it("treats dashboard as protected", () => {
    expect(isProtectedPath("/dashboard")).toBe(true);
    expect(isPublicPath("/dashboard")).toBe(false);
  });

  it("requires admin for program management", () => {
    expect(requiresAdmin("/admin/programs/new")).toBe(true);
    expect(requiresReviewerAccess("/admin/reviews/programs")).toBe(true);
  });
});
