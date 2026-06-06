import Link from "next/link";
import { GeneratePlanButton } from "@/components/business-plans/generate-plan-button";
import type { PlanListItem } from "@/lib/data/business-plans-list";
import type {
  CompanyForMatches,
  MatchListItem,
} from "@/lib/data/matches-list";

const formatPlanDate = (value: string): string =>
  new Date(value).toLocaleDateString("ko-KR");

export const CompanyPlanList = ({
  companies,
  matches,
  plans,
  showOwnerEmail = true,
}: {
  companies: CompanyForMatches[];
  matches: MatchListItem[];
  plans: PlanListItem[];
  showOwnerEmail?: boolean;
}) => {
  if (companies.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        등록된 기업이 없습니다. 기업정보 메뉴에서 기업을 등록하세요.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {companies.map((company) => {
        const companyMatches = matches.filter(
          (match) => match.company_id === company.id,
        );
        const companyPlans = plans.filter(
          (plan) => plan.company_id === company.id,
        );

        return (
          <li key={company.id} className="space-y-4 py-4">
            <div className="min-w-0">
              <p className="font-medium">{company.company_name}</p>
              <p className="text-sm text-slate-500">
                {company.industry} / {company.region}
              </p>
              {showOwnerEmail ? (
                <p className="text-xs text-slate-400">
                  소유자 {company.ownerEmail}
                </p>
              ) : null}
            </div>

            {companyMatches.length === 0 && companyPlans.length === 0 ? (
              <p className="text-sm text-slate-500">
                추천사업이 없습니다.{" "}
                <Link href="/matches" className="underline">
                  추천 생성
                </Link>
                후 사업계획서를 작성할 수 있습니다.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-md border border-slate-200 bg-white">
                {companyMatches.map((match) => (
                  <li
                    key={match.id}
                    className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0">
                      {showOwnerEmail ? (
                        <p className="text-xs text-slate-500">{match.companyName}</p>
                      ) : null}
                      <Link
                        href={`/matches/${match.id}`}
                        className="font-medium hover:underline"
                      >
                        {match.programTitle}
                      </Link>
                      <p className="text-sm text-slate-500">
                        점수 {match.score} · {match.recommendationLabel}
                      </p>
                    </div>
                    <GeneratePlanButton
                      programId={match.program_id}
                      matchingResultId={match.id}
                    />
                  </li>
                ))}

                {companyPlans.map((plan) => (
                  <li
                    key={plan.id}
                    className="flex flex-col gap-2 bg-slate-50 px-3 py-3 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-emerald-700">생성된 초안</p>
                      <Link
                        href={`/business-plans/${plan.id}`}
                        className="font-medium hover:underline"
                      >
                        {plan.title || plan.programTitle}
                      </Link>
                      <p className="text-sm text-slate-500">
                        {plan.programTitle} · {plan.status} ·{" "}
                        {formatPlanDate(plan.created_at)}
                      </p>
                    </div>
                    <Link
                      href={`/business-plans/${plan.id}`}
                      className="shrink-0 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm"
                    >
                      초안 보기
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
};
