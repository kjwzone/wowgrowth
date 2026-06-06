import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("joins truthy class names", () => {
    expect(cn("a", false && "b", "c")).toBe("a c");
  });
});

describe("programs data", () => {
  it("has at least one program", async () => {
    const { programs } = await import("@/data/programs");
    expect(programs.length).toBeGreaterThan(0);
  });
});
