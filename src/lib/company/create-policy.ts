import type { AppRole } from "@/lib/types/database";

/** 일반 사용자는 소유 기업 1건만 등록 가능, 관리자는 다건 등록 가능 */
export const mayCreateCompany = (
  role: AppRole,
  hasOwnCompany: boolean,
): boolean => role === "admin" || !hasOwnCompany;
