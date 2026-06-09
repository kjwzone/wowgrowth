import { describe, expect, it, beforeEach, vi } from "vitest";
import { businessPlanDraft } from "@/data/businessPlan";
import { programs } from "@/data/programs";
import {
  bootstrapAppData,
  clearAppDataBootstrap,
  getBootstrappedSnapshot,
  getBootstrappedSource,
  isAppDataBootstrapped,
} from "@/lib/app-data-bootstrap";
import { fetchBizinfoProgramsFromApi } from "@/lib/bizinfo-client";
import type { SupportProgram } from "@/types";

vi.mock("@/lib/bizinfo-client", () => ({
  fetchBizinfoProgramsFromApi: vi.fn(),
}));

const mockFetch = vi.mocked(fetchBizinfoProgramsFromApi);

const livePrograms: SupportProgram[] = [
  {
    ...programs[0]!,
    id: "bizinfo-live-1",
    title: "실시간 공고",
    source: "bizinfo",
  },
];

describe("app-data-bootstrap", () => {
  beforeEach(() => {
    clearAppDataBootstrap();
    mockFetch.mockReset();
  });

  it("기업마당 연동 성공 시 bizinfo 소스로 캐시", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      items: livePrograms,
      total: livePrograms.length,
    });

    const result = await bootstrapAppData(businessPlanDraft);

    expect(result.source).toBe("bizinfo");
    expect(isAppDataBootstrapped()).toBe(true);
    expect(getBootstrappedSource()).toBe("bizinfo");
    expect(getBootstrappedSnapshot()?.dataSources).toEqual({
      matching: "bizinfo",
      programs: "bizinfo",
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("기업마당 실패 시 재시도 후 mock 폴백", async () => {
    vi.useFakeTimers();
    mockFetch.mockResolvedValue({
      ok: false,
      message: "API 오류",
    });

    const promise = bootstrapAppData(businessPlanDraft);
    await vi.runAllTimersAsync();
    const result = await promise;
    vi.useRealTimers();

    expect(result.source).toBe("mock");
    expect(result.message).toBe("API 오류");
    expect(getBootstrappedSnapshot()?.dataSources.programs).toBe("mock");
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("clearAppDataBootstrap으로 캐시 초기화", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      items: livePrograms,
      total: livePrograms.length,
    });
    await bootstrapAppData(businessPlanDraft);

    clearAppDataBootstrap();

    expect(isAppDataBootstrapped()).toBe(false);
    expect(getBootstrappedSnapshot()).toBeNull();
  });
});
