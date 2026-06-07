import { describe, expect, it } from "vitest";
import healthHandler from "./health.mjs";

const createMockRes = () => {
  const res = {
    statusCode: 200,
    body: null,
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    end() {
      return this;
    },
  };
  return res;
};

describe("business-plan health handler", () => {
  it("returns gemini status with req/res (Vercel Node.js format)", async () => {
    const previous = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = "test-key";

    const res = createMockRes();
    await healthHandler({ method: "GET" }, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      ok: true,
      gemini: true,
      model: process.env.GEMINI_MODEL ?? "gemini-2.5-pro",
    });

    process.env.GEMINI_API_KEY = previous;
  });

  it("returns 503 when GEMINI_API_KEY is missing", async () => {
    const previous = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const res = createMockRes();
    await healthHandler({ method: "GET" }, res);

    expect(res.statusCode).toBe(503);
    expect(res.body?.gemini).toBe(false);

    process.env.GEMINI_API_KEY = previous;
  });
});
