import { describe, expect, it } from "vitest";
import { companyInputSchema, toCompanyRow } from "@/lib/validation/company";

describe("companyInputSchema", () => {
  it("parses valid company input", () => {
    const parsed = companyInputSchema.parse({
      companyName: "와우테크",
      businessNumber: "123-45-67890",
      industry: "AI/SaaS",
      addressBase: "서울",
      addressDetail: "",
      certifications: [],
      patents: [],
      financials: {
        version: "v1",
        summary_text: "매출 10억",
        statement_files: [],
        updated_at: new Date().toISOString(),
      },
    });
    expect(parsed.companyName).toBe("와우테크");
  });

  it("maps to database row shape", () => {
    const input = companyInputSchema.parse({
      companyName: "와우테크",
      businessNumber: "123-45-67890",
      industry: "AI/SaaS",
      addressBase: "서울",
      addressDetail: "",
      certifications: [],
      patents: [],
      financials: {
        version: "v1",
        summary_text: "",
        statement_files: [],
        updated_at: new Date().toISOString(),
      },
    });
    const row = toCompanyRow(
      {
        ...input,
        foundedDate: "2003-06-15",
      },
      "user-uuid",
    );
    expect(row.owner_id).toBe("user-uuid");
    expect(row.company_name).toBe("와우테크");
    expect(row.founded_date).toBe("2003-06-15");
    expect(row.founded_year).toBe(2003);
    expect(row.address_base).toBe("서울");
    expect(row.address_detail).toBe("");
    expect(row.region).toBe("서울");
  });
});
