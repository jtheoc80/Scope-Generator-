import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "INVALID_INPUT"
  | "NOT_FOUND"
  | "CONFLICT"
  | "FAILED_PRECONDITION"
  | "PAYMENT_REQUIRED"
  | "PAYLOAD_TOO_LARGE"
  | "INTERNAL";

export function getRequestId(headers: Headers) {
  return headers.get("x-request-id") || crypto.randomUUID();
}

export function jsonError(
  requestId: string,
  status: number,
  code: ApiErrorCode,
  message: string,
  extra?: Record<string, unknown>
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        requestId,
        ...extra,
      },
    },
    {
      status,
      headers: {
        "x-request-id": requestId,
      },
    }
  );
}

export function withRequestId<T extends object>(requestId: string, body: T, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "x-request-id": requestId,
    },
  });
}

export function logEvent(name: string, data: Record<string, unknown>) {
  console.log(JSON.stringify({
    event: name,
    ts: new Date().toISOString(),
    ...data,
  }));
}
