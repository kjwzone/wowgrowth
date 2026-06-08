import { useEffect, useState } from "react";
import { PageHeader, SectionCard } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { AiAgentPanel } from "@/components/ui/AiAgentPanel";
import { companyApi } from "@/lib/api";
import type { CompanyProfile } from "@/types";

export default function CompanyProfilePage() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [aiState, setAiState] = useState<"idle" | "generating" | "done">("idle");
  const [aiGeneratingTask, setAiGeneratingTask] = useState<"section" | null>(null);
  const [saved, setSaved] = useState(false);

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
    await companyApi.save(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (!profile) {
    return <p className="text-on-surface-variant">기업정보 로딩 중...</p>;
  }

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
                  className="mt-1 w-full rounded-lg border border-outline-variant/50 px-3 py-2 focus:border-secondary focus:outline-none"
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
        <SectionCard title="인증">
          <div className="flex flex-wrap gap-2">
            {profile.certifications.map((c) => (
              <span
                key={c}
                className="rounded-full bg-emerald-100 px-3 py-1 text-sm text-emerald-800"
              >
                {c}
              </span>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="특허">
          <ul className="space-y-1 text-sm text-on-surface-variant">
            {profile.patents.map((p) => (
              <li key={p}>• {p}</li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
