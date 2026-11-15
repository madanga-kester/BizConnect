import type { Id } from "@/types/domain";

export interface ApiError {
  code: string;
  message: string;
  retryable: boolean;
  status?: number;
  requestId?: string;
  details?: Record<string, unknown>;
}

export type Result<T> =
  | { ok: true; data: T; source: "mock-local" | "api"; requestId: string }
  | { ok: false; error: ApiError; source: "mock-local" | "api"; requestId: string };

export type QueryScalar = string | number | boolean | null | undefined;
export type QueryValue = QueryScalar | readonly QueryScalar[];
export type QueryParams = Readonly<Record<string, QueryValue>>;
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface PageRequest {
  cursor?: string;
  limit: number;
  search?: string;
}

export interface PageResponse<T> {
  items: T[];
  nextCursor?: string;
  total: number;
}

export interface EntityRequest<T> {
  id?: Id;
  data: T;
}

export interface ApiAdapter {
  readonly mode: "mock-local" | "api";
}
