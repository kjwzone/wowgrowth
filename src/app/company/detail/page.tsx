import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageCard } from "@/components/ui/page-card";
import {
  hasFinancialData,
  parseStoredFinancials,
  toStoredFinancials,
} from "@/lib/company/financials";
import { formatFoundedDateLabel } from "@/lib/company/founded-date";
import { getSessionProfile } from "@/lib/auth/get-session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const companyFields =
  "id, company_name, business_number, industry, region, owner_id, financials, founded_year, founded_date" as const;

type CompanyRow = {
  id: string;
  company_name: string;
  business_number: string;
  industry: string;
  region: string;
  owner_id: string;
  financials: Record<string, unknown>;
  founded_year: number | null;
  founded_date: string | null;
};

const FinancialPreview = ({ financials }: { financials: Record<string, unknown> }) => {
  const parsed = parseStoredFinancials(financials);
  const stored = toStoredFinancials(parsed);

  if (!hasFinancialData(stored)) {
    return <p className="text-sm text-slate-500">등록된 재무 정보가 없습니다.</p>;
  }

  return (
    <div className="space-y-2 text-sm text-slate-700">
      {parsed.summaryText ? (
        <div>
          <p className="font-medium text-slate-600">재무정보 요약</p>
          <p className="mt-1 whitespace-pre-wrap">{parsed.summaryText}</p>
        </div>
      ) : null}
      {parsed.files.length > 0 ? (
        <div>
          <p className="font-medium text-slate-600">업로드 재무제표</p>
          <ul className="mt-1 list-inside list-disc text-slate-600">
            {parsed.files.map((f) => (
              <li key={f.id}>{f.file_name}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

export default async function CompanyDetailPage() {
  const session = await getSessionProfile();
  if (!session) redirect("/login");

  const isAdmin = session.profile.role === "admin";
  const supabase = await createClient();

  let list: CompanyRow[] = [];

  if (isAdmin) {
    const { data } = await supabase
      .from("companies")
      .select(companyFields)
      .order("created_at", { ascending: false });
    list = data ?? [];
  } else {
    const { data } = await supabase
      .from("companies")
      .select(companyFields)
      .eq("owner_id", session.userId)
      .maybeSingle();
    list = data ? [data] : [];
  }

  const emailMap = new Map<string, string>();
  if (isAdmin && list.length > 0) {
    const ownerIds = [...new Set(list.map((c) => c.owner_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email")
      .in("id", ownerIds);
    (profiles ?? []).forEach((p) => emailMap.set(p.id, p.email));
  }

  const ownerLabel = (company: CompanyRow): string =>
    emailMap.get(company.owner_id) ?? company.owner_id;

  return (
    <AppShell title="기업정보" role={session.profile.role}>
      {isAdmin ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-slate-600">
            관리자: 등록된 기업 {list.length}건
          </p>
          <Link
            href="/company/new"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
          >
            기업정보 추가
          </Link>
        </div>
      ) : null}

      {list.length > 0 ? (
        <ul className="space-y-4">
          {list.map((company) => (
            <li key={company.id}>
              <PageCard title={company.company_name}>
                <dl className="grid gap-2 text-sm">
                  <div>
                    <dt className="text-slate-500">사업자번호</dt>
                    <dd>{company.business_number}</dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">업태/업종 / 사업장 주소</dt>
                    <dd>
                      {company.industry} / {company.region}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500">설립일</dt>
                    <dd>
                      {formatFoundedDateLabel(company.founded_date, company.founded_year)}
                    </dd>
                  </div>
                  {isAdmin ? (
                    <div>
                      <dt className="text-slate-500">소유자</dt>
                      <dd className="text-slate-700">{ownerLabel(company)}</dd>
                    </div>
                  ) : null}
                  <div className="md:col-span-2">
                    <dt className="text-slate-500">재무 정보</dt>
                    <dd className="mt-1">
                      <FinancialPreview financials={company.financials} />
                    </dd>
                  </div>
                </dl>
                <Link
                  href={
                    isAdmin
                      ? `/company/edit?id=${company.id}`
                      : "/company/edit"
                  }
                  className="mt-4 inline-block text-sm underline"
                >
                  수정
                </Link>
              </PageCard>
            </li>
          ))}
        </ul>
      ) : (
        <PageCard title="등록된 기업정보가 없습니다">
          <Link
            href="/company/new"
            className="inline-block rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
          >
            기업정보 등록
          </Link>
        </PageCard>
      )}
    </AppShell>
  );
}
