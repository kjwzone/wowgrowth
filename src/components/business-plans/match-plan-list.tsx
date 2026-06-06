import Link from "next/link";
import { GeneratePlanButton } from "@/components/business-plans/generate-plan-button";

export type MatchForPlan = {
  id: string;
  programId: string;
  programTitle: string;
  score: number;
  recommendationLevel: string;
};

export const MatchPlanList = ({ matches }: { matches: MatchForPlan[] }) => {
  if (matches.length === 0) {
    return (
      <div className="space-y-2 text-sm text-slate-600">
        <p>생성할 추천사업이 없습니다. 먼저 추천을 생성하세요.</p>
        <Link href="/matches" className="inline-block underline">
          추천사업으로 이동
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {matches.map((m) => (
        <li key={m.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href={`/matches/${m.id}`} className="font-medium hover:underline">
              {m.programTitle}
            </Link>
            <p className="text-sm text-slate-500">
              점수 {m.score} · {m.recommendationLevel}
            </p>
          </div>
          <GeneratePlanButton programId={m.programId} matchingResultId={m.id} />
        </li>
      ))}
    </ul>
  );
};
