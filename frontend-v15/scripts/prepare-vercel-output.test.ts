import { execSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "..");

const runPrepare = (): void => {
  execSync("node scripts/prepare-vercel-output.mjs", { cwd: root, stdio: "pipe" });
};

describe("prepare-vercel-output", () => {
  it("creates static output with SPA fallback route", () => {
    const distIndex = join(root, "dist", "index.html");

    if (!existsSync(distIndex)) {
      execSync("npm run build", { cwd: root, stdio: "pipe" });
    }

    runPrepare();

    const configPath = join(root, ".vercel", "output", "config.json");
    const staticIndex = join(root, ".vercel", "output", "static", "index.html");

    expect(existsSync(staticIndex)).toBe(true);

    const config = JSON.parse(readFileSync(configPath, "utf8")) as {
      routes: Array<{ src?: string; dest?: string }>;
    };
    expect(config.routes.some((route) => route.dest === "/index.html")).toBe(true);
    expect(config.routes.some((route) => route.src === "/api/business-plan/health")).toBe(true);
    expect(config.routes.some((route) => route.src === "/api/lib/gemini-json")).toBe(false);

    rmSync(join(root, ".vercel", "output"), { recursive: true, force: true });
  });
});
