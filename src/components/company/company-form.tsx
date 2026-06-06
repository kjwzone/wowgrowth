"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FinancialsInput } from "@/components/company/financials-input";
import { FoundedDateInput } from "@/components/company/founded-date-input";
import { RegionAddressInput } from "@/components/company/region-address-input";
import {
  parseInitialAddress,
  type AddressFormValue,
} from "@/lib/company/address-fields";
import {
  parseStoredFinancials,
  toStoredFinancials,
  type FinancialsFormValue,
} from "@/lib/company/financials";

type CompanyFormProps = {
  mode: "create" | "edit";
  companyId?: string;
  initial?: {
    companyName: string;
    businessNumber: string;
    industry: string;
    region?: string | null;
    addressBase?: string | null;
    addressDetail?: string | null;
    foundedDate?: string | null;
    foundedYear?: number | null;
    financials?: Record<string, unknown>;
  };
};

const textInputClass =
  "mt-1 w-full rounded-md border border-slate-300 px-3 py-2";

export const CompanyForm = ({ mode, companyId, initial }: CompanyFormProps) => {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const initialFinancials = useMemo(
    () => parseStoredFinancials(initial?.financials),
    [initial?.financials],
  );
  const [financials, setFinancials] = useState<FinancialsFormValue>(initialFinancials);
  const [address, setAddress] = useState<AddressFormValue>(() =>
    parseInitialAddress(
      initial?.addressBase,
      initial?.addressDetail,
      initial?.region,
    ),
  );
  const [foundedDate, setFoundedDate] = useState(initial?.foundedDate ?? "");

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setError(null);

    if (!address.base.trim()) {
      setError("사업장 주소를 검색하여 입력해 주세요.");
      setPending(false);
      return;
    }

    const form = new FormData(e.currentTarget);
    const body = {
      companyName: String(form.get("companyName")),
      businessNumber: String(form.get("businessNumber")).trim(),
      industry: String(form.get("industry")),
      addressBase: address.base,
      addressDetail: address.detail,
      foundedDate,
      certifications: [],
      patents: [],
      financials: toStoredFinancials(financials),
    };

    const patchUrl =
      mode === "edit" && companyId
        ? `/api/company?id=${encodeURIComponent(companyId)}`
        : "/api/company";

    const res = await fetch(patchUrl, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    setPending(false);

    if (!json.success) {
      setError(json.error?.message ?? "저장에 실패했습니다.");
      return;
    }
    router.push("/company/detail");
    router.refresh();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block text-sm">
        <span>기업명</span>
        <input
          name="companyName"
          defaultValue={initial?.companyName ?? ""}
          required
          className={textInputClass}
        />
      </label>

      <label className="block text-sm">
        <span>사업자번호</span>
        <input
          name="businessNumber"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          dir="ltr"
          defaultValue={initial?.businessNumber ?? ""}
          required
          placeholder="123-45-67890"
          className={`${textInputClass} input-ltr font-mono tracking-wide placeholder:text-slate-400`}
        />
      </label>

      <label className="block text-sm">
        <span>업태/업종</span>
        <input
          name="industry"
          defaultValue={initial?.industry ?? ""}
          required
          placeholder="예)서비스/정보통신업, 제조/금속가공업, 서비스/광고홍보업"
          className={`${textInputClass} placeholder:text-slate-400`}
        />
      </label>

      <div className="block text-sm">
        <span>사업장 주소</span>
        <RegionAddressInput value={address} onChange={setAddress} />
      </div>

      <div className="block text-sm">
        <span className="block leading-snug">
          설립일
          <span className="mt-0.5 block text-xs font-normal text-slate-500">
            (법인기업: 등기부등본 회사성립연월일, 개인기업: 사업자등록증 개업연월일)
          </span>
        </span>
        <FoundedDateInput value={foundedDate} onChange={setFoundedDate} />
      </div>

      <FinancialsInput value={financials} onChange={setFinancials} />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
      >
        {pending ? "저장 중..." : "저장"}
      </button>
    </form>
  );
};
