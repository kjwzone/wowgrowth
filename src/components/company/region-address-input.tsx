"use client";



import { useMemo, useState } from "react";

import type { AddressFormValue } from "@/lib/company/address-fields";

import { combineAddress, formatBaseAddress } from "@/lib/address/format-region";

import { openDaumPostcodeSearch } from "@/lib/address/load-daum-postcode";



type RegionAddressInputProps = {

  value: AddressFormValue;

  onChange: (value: AddressFormValue) => void;

};



const textInputClass =

  "mt-1 w-full rounded-md border border-slate-300 px-3 py-2";



export const RegionAddressInput = ({ value, onChange }: RegionAddressInputProps) => {

  const [searchError, setSearchError] = useState<string | null>(null);

  const [searching, setSearching] = useState(false);



  const fullAddress = useMemo(

    () => combineAddress(value.base, value.detail),

    [value.base, value.detail],

  );



  const onSearchAddress = async () => {

    setSearchError(null);

    setSearching(true);



    try {

      await openDaumPostcodeSearch((data) => {

        const nextBase = formatBaseAddress(data);

        onChange({ base: nextBase, detail: value.detail });

      });

    } catch (err) {

      setSearchError(err instanceof Error ? err.message : "주소 검색 실패");

    } finally {

      setSearching(false);

    }

  };



  return (

    <div className="space-y-2">

      <div className="flex flex-col gap-2 sm:flex-row">

        <input

          type="text"

          value={value.base}

          readOnly

          placeholder="주소 검색 버튼을 눌러 주소를 입력하세요"

          className={`${textInputClass} flex-1 bg-slate-50 placeholder:text-slate-400`}

        />

        <button

          type="button"

          onClick={onSearchAddress}

          disabled={searching}

          className="shrink-0 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm disabled:opacity-60 sm:mt-1"

        >

          {searching ? "검색 준비 중..." : "주소 검색"}

        </button>

      </div>

      <input

        type="text"

        value={value.detail}

        onChange={(e) => onChange({ base: value.base, detail: e.target.value })}

        placeholder="상세주소 (동·호수 등, 선택)"

        className={`${textInputClass} placeholder:text-slate-400`}

      />

      {searchError ? <p className="text-sm text-red-600">{searchError}</p> : null}

      {fullAddress ? (

        <p className="text-xs text-slate-500">저장 주소: {fullAddress}</p>

      ) : null}

    </div>

  );

};

