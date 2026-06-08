import { describe, expect, it } from "vitest";
import type { AiGeneratingTask } from "@/components/ui/AiAgentPanel";

export const resolveAiButtonLoading = (
  task: AiGeneratingTask,
  generatingTask: AiGeneratingTask | null,
): boolean => generatingTask === task;

describe("AiAgentPanel loading task", () => {
  it("shows loading only on the active full-quality task", () => {
    expect(resolveAiButtonLoading("full-fast", "full-quality")).toBe(false);
    expect(resolveAiButtonLoading("full-quality", "full-quality")).toBe(true);
    expect(resolveAiButtonLoading("full-fast", "full-fast")).toBe(true);
  });
});
