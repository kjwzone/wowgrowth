import Link from "next/link";
import { GenerateMatchesButton } from "@/components/matches/generate-matches-button";
import { GeneratePlanButton } from "@/components/business-plans/generate-plan-button";
import type {
  CompanyForMatches,
  MatchListItem,
} from "@/lib/data/matches-list";

export const CompanyMatchList = ({
  companies,
  matches,
  showOwnerEmail = true,
}: {
  companies: CompanyForMatches[];
  matches: MatchListItem[];
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
          (m) => m.company_id === company.id,
        );

        return (
          <li key={company.id} className="space-y-4 py-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
              <GenerateMatchesButton companyId={company.id} />
            </div>

            {companyMatches.length > 0 ? (
              <ul className="divide-y divide-slate-100 rounded-md border border-slate-200 bg-white">
                {companyMatches.map((m) => (
                  <li
                    key={m.id}
                    className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0">
                      {showOwnerEmail ? (
                        <p className="text-xs text-slate-500">{m.companyName}</p>
                      ) : null}
                      <Link
                        href={`/matches/${m.id}`}
                        className="font-medium hover:underline"
                      >
                        {m.programTitle}
                      </Link>
                      <p className="text-sm text-slate-500">
                        점수 {m.score} · {m.recommendationLabel}
                      </p>
                    </div>
                    <GeneratePlanButton
                      programId={m.program_id}
                      matchingResultId={m.id}
                    />
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
};
