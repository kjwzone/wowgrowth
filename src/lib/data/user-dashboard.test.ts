import { describe, expect, it } from "vitest";
import {
  buildOnboardingSteps,
  formatDeadlineLabel,
  onboardingCompletionPercent,
} from "@/lib/data/user-dashboard";

describe("user-dashboard", () => {
  it("builds onboarding steps from state", () => {
    const steps = buildOnboardingSteps({
      hasCompany: true,
      matchCount: 2,
      diagnosisCount: 0,
      businessPlanCount: 0,
    });

    expect(steps).toHaveLength(5);
    expect(steps[0]?.done).toBe(true);
    expect(steps[2]?.done).toBe(true);
    expect(steps[3]?.done).toBe(false);
    expect(steps[0]?.href).toBe("/company/detail");
  });

  it("links to company registration when missing", () => {
    const steps = buildOnboardingSteps({
      hasCompany: false,
      matchCount: 0,
      diagnosisCount: 0,
      businessPlanCount: 0,
    });

    expect(steps[0]?.href).toBe("/company/new");
    expect(onboardingCompletionPercent(steps)).toBe(0);
  });

  it("calculates completion percent", () => {
    const steps = buildOnboardingSteps({
      hasCompany: true,
      matchCount: 1,
      diagnosisCount: 1,
      businessPlanCount: 1,
    });

    expect(onboardingCompletionPercent(steps)).toBe(100);
  });

  it("formats deadline labels", () => {
    const today = new Date();
    today.setDate(today.getDate() + 3);
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const localDate = `${yyyy}-${mm}-${dd}`;

    expect(formatDeadlineLabel(localDate)).toBe("D-3");
    expect(formatDeadlineLabel(null)).toBeNull();
  });
});
