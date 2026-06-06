import { describe, expect, it, vi, beforeEach } from "vitest";
import { resolveCompanyForBusinessPlan } from "@/lib/auth/resolve-company-for-plan";

const mockGetCompanyForUser = vi.fn();
const mockFrom = vi.fn();

vi.mock("@/lib/auth/get-company", () => ({
  getCompanyForUser: (...args: unknown[]) => mockGetCompanyForUser(...args),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    from: (table: string) => mockFrom(table),
  }),
}));

describe("resolveCompanyForBusinessPlan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uses getCompanyForUser when matchingResultId is omitted", async () => {
    const company = { id: "c1", owner_id: "u1" };
    mockGetCompanyForUser.mockResolvedValue(company);

    const result = await resolveCompanyForBusinessPlan("u1", "user");
    expect(result).toEqual(company);
    expect(mockGetCompanyForUser).toHaveBeenCalledWith("u1");
  });

  it("loads company from matching result for admin", async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    };
    mockFrom.mockImplementation((table: string) => {
      if (table === "matching_results") {
        chain.single.mockResolvedValueOnce({
          data: { company_id: "c2", program_id: "p1" },
          error: null,
        });
      }
      if (table === "companies") {
        chain.single.mockResolvedValueOnce({
          data: { id: "c2", owner_id: "other", company_name: "테스트" },
          error: null,
        });
      }
      return chain;
    });

    const result = await resolveCompanyForBusinessPlan("admin1", "admin", {
      matchingResultId: "m1",
      programId: "p1",
    });
    expect(result.id).toBe("c2");
    expect(mockGetCompanyForUser).not.toHaveBeenCalled();
  });
});
