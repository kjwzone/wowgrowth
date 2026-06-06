import { combineAddress } from "@/lib/address/format-region";

export type AddressFormValue = {
  base: string;
  detail: string;
};

const LEGACY_DETAIL_SUFFIX =
  /\s+((?:\d+(?:-\d+)?호)|(?:\d+층)|(?:[가-힣A-Za-z0-9]+동\s*\d+(?:-\d+)?(?:호)?))$/u;

export const trySplitLegacyAddress = (region: string): AddressFormValue => {
  const trimmed = region.trim();
  if (!trimmed) {
    return { base: "", detail: "" };
  }

  const match = trimmed.match(LEGACY_DETAIL_SUFFIX);
  if (!match || match.index === undefined) {
    return { base: trimmed, detail: "" };
  }

  return {
    base: trimmed.slice(0, match.index).trim(),
    detail: match[1].trim(),
  };
};

export const parseInitialAddress = (
  addressBase: string | null | undefined,
  addressDetail: string | null | undefined,
  region: string | null | undefined,
): AddressFormValue => {
  const base = addressBase?.trim() ?? "";
  const detail = addressDetail?.trim() ?? "";

  if (base) {
    return { base, detail };
  }

  if (region?.trim()) {
    return trySplitLegacyAddress(region.trim());
  }

  return { base: "", detail: "" };
};

export const toStoredAddressFields = (base: string, detail: string) => {
  const trimmedBase = base.trim();
  const trimmedDetail = detail.trim();

  return {
    address_base: trimmedBase,
    address_detail: trimmedDetail,
    region: combineAddress(trimmedBase, trimmedDetail),
  };
};
