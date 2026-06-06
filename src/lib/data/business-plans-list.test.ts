import { describe, expect, it } from "vitest";
import { groupItemsByCompanyId } from "@/lib/data/business-plans-list";

describe("business-plans-list", () => {
  it("groups items by company id", () => {
    const grouped = groupItemsByCompanyId([
      { company_id: "c1", id: "p1" },
      { company_id: "c2", id: "p2" },
      { company_id: "c1", id: "p3" },
    ]);

    expect(grouped.get("c1")).toEqual([
      { company_id: "c1", id: "p1" },
      { company_id: "c1", id: "p3" },
    ]);
    expect(grouped.get("c2")).toEqual([{ company_id: "c2", id: "p2" }]);
  });
});
