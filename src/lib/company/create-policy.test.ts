import { describe, expect, it } from "vitest";
import { mayCreateCompany } from "@/lib/company/create-policy";

describe("mayCreateCompany", () => {
  it("allows first company for user", () => {
    expect(mayCreateCompany("user", false)).toBe(true);
  });

  it("blocks second company for user", () => {
    expect(mayCreateCompany("user", true)).toBe(false);
  });

  it("allows admin even with existing company", () => {
    expect(mayCreateCompany("admin", true)).toBe(true);
  });
});
