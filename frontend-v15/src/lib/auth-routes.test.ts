import { describe, expect, it } from "vitest";
import { getAppHomePath } from "@/lib/auth-routes";

describe("getAppHomePath", () => {
  it("returns login when session is missing", () => {
    expect(getAppHomePath(null)).toBe("/login");
  });

  it("returns dashboard for regular users", () => {
    expect(getAppHomePath({ email: "ceo@test.com", name: "CEO", role: "user" })).toBe(
      "/dashboard",
    );
  });

  it("returns admin dashboard for admins", () => {
    expect(
      getAppHomePath({ email: "admin@test.com", name: "Admin", role: "admin" }),
    ).toBe("/admin/dashboard");
  });
});
