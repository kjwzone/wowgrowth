import { describe, expect, it } from "vitest";
import {
  countJobStatuses,
  countProgramStatuses,
} from "./admin-dashboard-fetch.mjs";

describe("admin-dashboard-fetch counts", () => {
  it("counts program statuses", () => {
    expect(
      countProgramStatuses([
        { status: "published" },
        { status: "draft" },
      ]),
    ).toEqual({
      total: 2,
      published: 1,
      draft: 1,
      closed: 0,
    });
  });

  it("counts ai job statuses", () => {
    expect(
      countJobStatuses([
        { status: "failed" },
        { status: "queued" },
      ]),
    ).toEqual({
      total: 2,
      failed: 1,
      queued: 1,
      running: 0,
      succeeded: 0,
    });
  });
});
