import type { DaumPostcodeData } from "@/types/daum-postcode";

export const formatBaseAddress = (data: DaumPostcodeData): string =>
  data.roadAddress.trim() ||
  data.jibunAddress.trim() ||
  `${data.sido} ${data.sigungu}`.trim();

export const formatFullAddress = (
  data: DaumPostcodeData,
  detailAddress = "",
): string => {
  const base = formatBaseAddress(data);
  const detail = detailAddress.trim();
  return detail ? `${base} ${detail}` : base;
};

export const combineAddress = (baseAddress: string, detailAddress = ""): string => {
  const base = baseAddress.trim();
  const detail = detailAddress.trim();
  return detail ? `${base} ${detail}` : base;
};
