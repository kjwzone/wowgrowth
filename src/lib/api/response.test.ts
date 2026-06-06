import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { createRequestId } from "@/lib/api/response";

describe("createRequestId", () => {
  it("generates req_ prefixed id", () => {
    const id = createRequestId();
    expect(id.startsWith("req_")).toBe(true);
    expect(id.length).toBeGreaterThan(10);
  });
});

describe("ApiError", () => {
  it("maps FORBIDDEN to 403", () => {
    const err = new ApiError("FORBIDDEN", "접근 권한이 없습니다.");
    expect(err.status).toBe(403);
    expect(err.code).toBe("FORBIDDEN");
  });
});
