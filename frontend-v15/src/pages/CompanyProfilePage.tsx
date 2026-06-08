import { useEffect, useState } from "react";
import { PageHeader, SectionCard } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { AiAgentPanel } from "@/components/ui/AiAgentPanel";
import { companyApi } from "@/lib/api";
import {
  createPatentEntry,
  PATENT_KINDS,
  PATENT_STATUSES,
  RESEARCH_ORG_OPTIONS,
} from "@/lib/company-profile-model";
import type {
  CompanyProfile,
  PatentEntry,
  PatentKind,
  PatentStatus,
  ResearchOrgType,
} from "@/types";

const inputClass =
  "w-full rounded-lg border border-outline-variant/50 px-3 py-2 text-sm focus:border-secondary focus:outline-none";

export default function CompanyProfilePage() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [aiState, setAiState] = useState<"idle" | "generating" | "done">("idle");
  const [aiGeneratingTask, setAiGeneratingTask] = useState<"section" | null>(null);
  const [saved, setSaved] = useState(false);
  const [certInput, setCertInput] = useState("");

  useEffect(() => {
    void companyApi.get().then(setProfile);
  }, []);

  const runDiagnosis = () => {
    setAiGeneratingTask("section");
    setAiState("generating");
    setTimeout(() => {
      setAiGeneratingTask(null);
      setAiState("done");
    }, 2000);
  };

  const onSave = async () => {
    if (!profile) return;
    const next = await companyApi.save(profile);
    setProfile(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!profile) {
    return <p className="text-on-surface-variant">기업정보 로딩 중...</p>;
  }

  const patents = profile.patentEntries ?? [];

  const addCertification = () => {
    const value = certInput.trim();
    if (!value || profile.certifications.includes(value)) {
      setCertInput("");
      return;
    }
    setProfile({ ...profile, certifications: [...profile.certifications, value] });
    setCertInput("");
  };

  const removeCertification = (cert: string) => {
    setProfile({
      ...profile,
      certifications: profile.certifications.filter((c) => c !== cert),
    });
  };

  const updatePatent = (id: string, patch: Partial<PatentEntry>) => {
    setProfile({
      ...profile,
      patentEntries: patents.map((entry) =>
        entry.id === id ? { ...entry, ...patch } : entry,
      ),
    });
  };

  const addPatent = () => {
    setProfile({ ...profile, patentEntries: [...patents, createPatentEntry()] });
  };

  const removePatent = (id: string) => {
    setProfile({
      ...profile,
      patentEntries: patents.filter((entry) => entry.id !== id),
    });
  };

  const fields: Array<{ key: keyof CompanyProfile; label: string; type?: string }> = [
    { key: "name", label: "기업명" },
    { key: "businessNumber", label: "사업자등록번호" },
    { key: "industry", label: "업종" },
    { key: "revenue", label: "매출" },
    { key: "employees", label: "직원 수", type: "number" },
    { key: "product", label: "제품/서비스" },
    { key: "stage", label: "성장 단계" },
  ];

  return (
    <div>
      <PageHeader
        title="기업정보 입력"
        description="정확한 정보일수록 AI 매칭·진단 정확도가 높아집니다."
        action={
          <button
            type="button"
            onClick={() => void onSave()}
            className="rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-on-secondary"
          >
            {saved ? "저장됨 ✓" : "저장하기"}
          </button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="기업 기본정보" className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map(({ key, label, type }) => (
              <label key={key} className="block text-sm">
                <span className="text-on-surface-variant">{label}</span>
                <input
                  type={type ?? "text"}
                  value={String(profile[key] ?? "")}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      [key]:
                        type === "number" ? Number(e.target.value) : e.target.value,
                    })
                  }
                  className={`mt-1 ${inputClass}`}
                />
              </label>
            ))}
          </div>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard title="AI 진단 상태">
            <p className="text-sm text-on-surface-variant">
              상태: <strong className="text-primary">{profile.diagnosisStatus}</strong>
            </p>
            <div className="mt-4">
              <ProgressBar value={profile.diagnosisScore} label="진단 점수" />
            </div>
            <AiAgentPanel
              message={
                aiState === "done"
                  ? "진단 완료: 창업·R&D형 공고 적합도가 높습니다."
                  : "기업정보를 저장한 뒤 AI 진단을 실행하세요."
              }
              state={aiState}
              generatingTask={aiGeneratingTask}
              onGenerate={runDiagnosis}
              generateLabel="AI 진단 실행"
            />
          </SectionCard>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <SectionCard title="보유 인증">
          <div className="flex flex-wrap gap-2">
            {profile.certifications.length === 0 ? (
              <span className="text-sm text-on-surface-variant/60">
                등록된 인증이 없습니다.
              </span>
            ) : (
              profile.certifications.map((c) => (
                <span
                  key={c}
                  className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-sm text-emerald-800"
                >
                  {c}
                  <button
                    type="button"
                    onClick={() => removeCertification(c)}
                    aria-label={`${c} 삭제`}
                    className="text-emerald-700/70 hover:text-emerald-900"
                  >
                    ×
                  </button>
                </span>
              ))
            )}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={certInput}
              onChange={(e) => setCertInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCertification();
                }
              }}
              placeholder="예: 벤처기업, 이노비즈, ISO 9001"
              className={inputClass}
            />
            <button
              type="button"
              onClick={addCertification}
              className="shrink-0 rounded-lg border border-secondary px-3 py-2 text-sm font-medium text-secondary hover:bg-secondary/5"
            >
              추가
            </button>
          </div>
        </SectionCard>

        <SectionCard title="연구조직 소유 여부">
          <div className="flex flex-col gap-2">
            {RESEARCH_ORG_OPTIONS.map((option) => (
              <label
                key={option}
                className="flex cursor-pointer items-center gap-2 text-sm text-on-surface"
              >
                <input
                  type="radio"
                  name="researchOrg"
                  value={option}
                  checked={(profile.researchOrg ?? "없음") === option}
                  onChange={() =>
                    setProfile({
                      ...profile,
                      researchOrg: option as ResearchOrgType,
                    })
                  }
                  className="accent-secondary"
                />
                {option}
              </label>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="mt-6">
        <SectionCard
          title="특허·지식재산권"
          action={
            <button
              type="button"
              onClick={addPatent}
              className="rounded-lg border border-secondary px-3 py-1.5 text-sm font-medium text-secondary hover:bg-secondary/5"
            >
              + 행 추가
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-outline-variant/40 text-left text-xs text-on-surface-variant">
                  <th className="px-2 py-2 font-medium">구분</th>
                  <th className="px-2 py-2 font-medium">출원번호</th>
                  <th className="px-2 py-2 font-medium">국가명</th>
                  <th className="px-2 py-2 font-medium">특허명</th>
                  <th className="px-2 py-2 font-medium">출원일</th>
                  <th className="px-2 py-2 font-medium">특허권자</th>
                  <th className="px-2 py-2 font-medium">상태</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {patents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-2 py-6 text-center text-on-surface-variant/60"
                    >
                      등록된 특허가 없습니다. ‘행 추가’로 입력하세요.
                    </td>
                  </tr>
                ) : (
                  patents.map((entry) => (
                    <tr
                      key={entry.id}
                      className="border-b border-outline-variant/20 align-top"
                    >
                      <td className="px-1 py-1.5">
                        <select
                          value={entry.kind}
                          onChange={(e) =>
                            updatePatent(entry.id, {
                              kind: e.target.value as PatentKind,
                            })
                          }
                          className={inputClass}
                        >
                          {PATENT_KINDS.map((kind) => (
                            <option key={kind} value={kind}>
                              {kind}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-1 py-1.5">
                        <input
                          value={entry.applicationNumber}
                          onChange={(e) =>
                            updatePatent(entry.id, {
                              applicationNumber: e.target.value,
                            })
                          }
                          placeholder="00-0000-0000000"
                          className={inputClass}
                        />
                      </td>
                      <td className="px-1 py-1.5">
                        <input
                          value={entry.country}
                          onChange={(e) =>
                            updatePatent(entry.id, { country: e.target.value })
                          }
                          placeholder="대한민국"
                          className={inputClass}
                        />
                      </td>
                      <td className="px-1 py-1.5">
                        <input
                          value={entry.title}
                          onChange={(e) =>
                            updatePatent(entry.id, { title: e.target.value })
                          }
                          placeholder="특허명 기재"
                          className={inputClass}
                        />
                      </td>
                      <td className="px-1 py-1.5">
                        <input
                          value={entry.filingDate}
                          onChange={(e) =>
                            updatePatent(entry.id, { filingDate: e.target.value })
                          }
                          placeholder="0000.00.00"
                          className={inputClass}
                        />
                      </td>
                      <td className="px-1 py-1.5">
                        <input
                          value={entry.holder}
                          onChange={(e) =>
                            updatePatent(entry.id, { holder: e.target.value })
                          }
                          placeholder="홍길동"
                          className={inputClass}
                        />
                      </td>
                      <td className="px-1 py-1.5">
                        <select
                          value={entry.status}
                          onChange={(e) =>
                            updatePatent(entry.id, {
                              status: e.target.value as PatentStatus,
                            })
                          }
                          className={inputClass}
                        >
                          {PATENT_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-1 py-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => removePatent(entry.id)}
                          aria-label="특허 행 삭제"
                          className="rounded-md px-2 py-1 text-on-surface-variant/60 hover:bg-error/10 hover:text-error"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
