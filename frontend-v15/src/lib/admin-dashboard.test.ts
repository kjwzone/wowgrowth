import { describe, expect, it } from "vitest";
import {
  countJobStatuses,
  countProgramStatuses,
  formatAdminDate,
} from "@/lib/admin-dashboard";

describe("admin-dashboard", () => {
  it("counts program statuses", () => {
    const counts = countProgramStatuses([
      { status: "published" },
      { status: "published" },
      { status: "draft" },
      { status: "closed" },
      { status: "unknown" },
    ]);

    expect(counts).toEqual({
      total: 5,
      published: 2,
      draft: 1,
      closed: 1,
    });
  });

  it("counts ai job statuses", () => {
    const counts = countJobStatuses([
      { status: "failed" },
      { status: "succeeded" },
      { status: "running" },
    ]);

    expect(counts).toEqual({
      total: 3,
      failed: 1,
      succeeded: 1,
      running: 1,
      queued: 0,
    });
  });

  it("formats admin dates in ko-KR", () => {
    const formatted = formatAdminDate("2026-06-05T02:30:00Z");
    expect(formatted).toContain("2026");
  });
});
