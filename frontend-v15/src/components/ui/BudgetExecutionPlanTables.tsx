import type { BudgetExecutionPlan } from "@/lib/budget-execution-plan-model";
import {
  formatKrw,
  lineItemTotal,
  pctOfTotal,
  sumBudgetItems,
} from "@/lib/budget-execution-plan-model";

const thClass =
  "border border-outline-variant/40 bg-surface-container px-2 py-2 text-center text-xs font-semibold text-primary";
const tdClass =
  "border border-outline-variant/30 px-2 py-2 text-center text-xs text-on-surface-variant";
const tdLeftClass =
  "border border-outline-variant/30 px-2 py-2 text-left text-xs text-on-surface-variant";

export const BudgetExecutionPlanTables = ({ plan }: { plan: BudgetExecutionPlan }) => {
  const { summary, items } = plan;
  const totals = sumBudgetItems(items);

  return (
    <div className="space-y-6">
      <p className="text-center text-sm font-bold text-primary">〈 사업비 집행 계획 〉</p>

      <div className="overflow-x-auto rounded-lg border border-outline-variant/30">
        <table className="w-full min-w-[640px] border-collapse text-xs">
          <thead>
            <tr>
              <th className={thClass} rowSpan={2}>
                구분
              </th>
              <th className={thClass} colSpan={2}>
                총사업비 (A=B+C)
              </th>
              <th className={thClass} colSpan={2}>
                정부지원사업비 (B)
              </th>
              <th className={thClass} colSpan={4}>
                창업기업 자기부담사업비 (C)
              </th>
            </tr>
            <tr>
              <th className={thClass}>금액(원)</th>
              <th className={thClass}>%</th>
              <th className={thClass}>금액(원)</th>
              <th className={thClass}>%</th>
              <th className={thClass} colSpan={2}>
                현금
              </th>
              <th className={thClass} colSpan={2}>
                현물
              </th>
            </tr>
            <tr>
              <th className={thClass} />
              <th className={thClass} />
              <th className={thClass} />
              <th className={thClass} />
              <th className={thClass} />
              <th className={thClass}>금액(원)</th>
              <th className={thClass}>%</th>
              <th className={thClass}>금액(원)</th>
              <th className={thClass}>%</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={`${tdClass} font-medium text-primary`}>{summary.regionLabel}</td>
              <td className={tdClass}>{formatKrw(summary.totalAmount)}</td>
              <td className={tdClass}>100</td>
              <td className={tdClass}>{formatKrw(summary.govSupportAmount)}</td>
              <td className={tdClass}>{pctOfTotal(summary.govSupportAmount, summary.totalAmount)}</td>
              <td className={tdClass}>{formatKrw(summary.selfCashAmount)}</td>
              <td className={tdClass}>{pctOfTotal(summary.selfCashAmount, summary.totalAmount)}</td>
              <td className={tdClass}>{formatKrw(summary.selfInKindAmount)}</td>
              <td className={tdClass}>{pctOfTotal(summary.selfInKindAmount, summary.totalAmount)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="overflow-x-auto rounded-lg border border-outline-variant/30">
        <table className="w-full min-w-[720px] border-collapse text-xs">
          <thead>
            <tr>
              <th className={thClass} rowSpan={2}>
                비 목
              </th>
              <th className={thClass} rowSpan={2}>
                집행 계획
              </th>
              <th className={thClass} colSpan={5}>
                총사업비(원) (ⓐ+ⓑ)
              </th>
            </tr>
            <tr>
              <th className={thClass}>정부지원사업비 (ⓐ)</th>
              <th className={thClass} colSpan={2}>
                자기부담사업비 (ⓑ)
              </th>
              <th className={thClass} colSpan={2}>
                합계 (ⓐ+ⓑ)
              </th>
            </tr>
            <tr>
              <th className={thClass} />
              <th className={thClass} />
              <th className={thClass} />
              <th className={thClass}>현금</th>
              <th className={thClass}>현물</th>
              <th className={thClass} colSpan={2} />
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={`${item.category}-${index}`}>
                <td className={`${tdClass} font-medium text-primary`}>{item.category}</td>
                <td className={tdLeftClass}>{item.plan}</td>
                <td className={tdClass}>{formatKrw(item.govSupport)}</td>
                <td className={tdClass}>{formatKrw(item.selfCash)}</td>
                <td className={tdClass}>{formatKrw(item.selfInKind)}</td>
                <td className={`${tdClass} font-semibold`} colSpan={2}>
                  {formatKrw(lineItemTotal(item))}
                </td>
              </tr>
            ))}
            <tr className="bg-surface-container/80 font-semibold">
              <td className={`${tdClass} text-primary`} colSpan={2}>
                합 계
              </td>
              <td className={tdClass}>{formatKrw(totals.govSupport)}</td>
              <td className={tdClass}>{formatKrw(totals.selfCash)}</td>
              <td className={tdClass}>{formatKrw(totals.selfInKind)}</td>
              <td className={tdClass} colSpan={2}>
                {formatKrw(totals.total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
