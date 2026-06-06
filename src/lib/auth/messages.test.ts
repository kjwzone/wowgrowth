import { describe, expect, it } from "vitest";
import { mapAuthErrorMessage } from "@/lib/auth/messages";

describe("mapAuthErrorMessage", () => {
  it("maps rate limit errors", () => {
    const msg = mapAuthErrorMessage("email rate limit exceeded");
    expect(msg).toContain("한도");
  });

  it("maps already registered", () => {
    const msg = mapAuthErrorMessage("User already registered");
    expect(msg).toContain("이미 가입");
  });
});
