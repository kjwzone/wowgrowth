import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { resolveCompanyForDiagnosis } from "@/lib/auth/resolve-company-for-diagnosis";

const mockMaybeSingle = vi.fn();
const mockEq = vi.fn(() => ({ maybeSingle: mockMaybeSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ from: mockFrom }),
}));

const mockGetCompanyForUser = vi.fn();
vi.mock("@/lib/auth/get-company", () => ({
  getCompanyForUser: (...args: unknown[]) => mockGetCompanyForUser(...args),
}));

describe("resolveCompanyForDiagnosis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requires companyId for staff", async () => {
    await expect(resolveCompanyForDiagnosis("admin1", "admin")).rejects.toMatchObject({
      code: "VALIDATION_ERROR",
    });
  });

  it("loads company by id for admin", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { id: "c1", owner_id: "u2", company_name: "A" },
      error: null,
    });

    const result = await resolveCompanyForDiagnosis("admin1", "admin", "c1");
    expect(result.id).toBe("c1");
  });

  it("uses getCompanyForUser for regular users without companyId", async () => {
    mockGetCompanyForUser.mockResolvedValue({ id: "c1", owner_id: "u1" });
    const result = await resolveCompanyForDiagnosis("u1", "user");
    expect(result.id).toBe("c1");
  });

  it("blocks access to other users company", async () => {
    mockMaybeSingle.mockResolvedValue({
      data: { id: "c1", owner_id: "u2", company_name: "A" },
      error: null,
    });

    await expect(
      resolveCompanyForDiagnosis("u1", "user", "c1"),
    ).rejects.toBeInstanceOf(ApiError);
  });
});
