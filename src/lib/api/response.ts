import { NextResponse } from "next/server";
import { ApiError } from "@/lib/api/errors";

export type ApiSuccess<T> = {
  success: true;
  data: T;
  requestId: string;
};

export type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
  };
  requestId: string;
};

export const createRequestId = (): string =>
  `req_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;

export const apiSuccess = <T>(data: T, requestId: string, status = 200) =>
  NextResponse.json(
    { success: true, data, requestId } satisfies ApiSuccess<T>,
    { status },
  );

export const apiFailure = (
  code: string,
  message: string,
  requestId: string,
  status: number,
) =>
  NextResponse.json(
    {
      success: false,
      error: { code, message },
      requestId,
    } satisfies ApiFailure,
    { status },
  );

export const handleApiRoute = async <T>(
  handler: (requestId: string) => Promise<T>,
): Promise<NextResponse> => {
  const requestId = createRequestId();
  try {
    const data = await handler(requestId);
    return apiSuccess(data, requestId);
  } catch (error) {
    if (error instanceof ApiError) {
      return apiFailure(error.code, error.message, requestId, error.status);
    }
    if (error && typeof error === "object" && "issues" in error) {
      return apiFailure(
        "VALIDATION_ERROR",
        "입력값이 올바르지 않습니다.",
        requestId,
        400,
      );
    }
    console.error("[api]", requestId, error);
    return apiFailure(
      "INTERNAL_ERROR",
      "서버 내부 오류가 발생했습니다.",
      requestId,
      500,
    );
  }
};
