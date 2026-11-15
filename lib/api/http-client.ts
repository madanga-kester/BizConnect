import { apiConfig, type ApiClientConfig } from "@/lib/api/config";
import type { ApiError, HttpMethod, QueryParams, QueryValue, Result } from "@/lib/api/contracts";

export interface AuthTokenProvider {
  getAccessToken(): Promise<string | null>;
  refreshAccessToken(): Promise<string | null>;
  clearTokens?(): Promise<void>;
  onSessionExpired?(): Promise<void> | void;
}

export interface HttpRequestOptions extends Omit<RequestInit, "body" | "headers" | "method"> {
  headers?: HeadersInit;
  body?: unknown;
  query?: QueryParams;
  authenticated?: boolean;
  timeoutMs?: number;
  requestId?: string;
}

function createRequestId(): string {
  const random = Math.random().toString(36).slice(2, 10);
  return `bc-${Date.now().toString(36)}-${random}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function appendQuery(params: URLSearchParams, key: string, value: QueryValue): void {
  if (value === undefined || value === null) return;
  if (Array.isArray(value)) {
    for (const item of value) if (item !== undefined && item !== null) params.append(key, String(item));
    return;
  }
  params.append(key, String(value));
}

function buildUrl(config: ApiClientConfig, path: string, query?: QueryParams): string {
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("?") || path.includes("#")) {
    throw new Error("API paths must be relative paths without a query string or fragment.");
  }
  const origin = new URL(config.baseUrl);
  if (origin.protocol !== "https:" && !(origin.protocol === "http:" && config.allowInsecureHttp)) {
    throw new Error("The API origin must use HTTPS outside an explicitly allowed development connection.");
  }
  const prefix = config.versionPrefix ? `/${config.versionPrefix.replace(/^\/+|\/+$/g, "")}` : "";
  const url = new URL(`${origin.origin}${prefix}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) appendQuery(url.searchParams, key, value);
  return url.toString();
}

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== "undefined" && value instanceof FormData;
}

function isRawBody(value: unknown): value is BodyInit {
  if (typeof value === "string") return true;
  if (isFormData(value)) return true;
  if (typeof URLSearchParams !== "undefined" && value instanceof URLSearchParams) return true;
  if (typeof Blob !== "undefined" && value instanceof Blob) return true;
  if (typeof ArrayBuffer !== "undefined" && (value instanceof ArrayBuffer || ArrayBuffer.isView(value))) return true;
  return false;
}

function prepareBody(body: unknown, headers: Headers): BodyInit | undefined {
  if (body === undefined || body === null) return undefined;
  if (isFormData(body)) return body;
  if (isRawBody(body)) {
    if (typeof body === "string" && !headers.has("Content-Type")) headers.set("Content-Type", "text/plain;charset=UTF-8");
    return body;
  }
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return JSON.stringify(body);
}

function retryableStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

function responseError(status: number, payload: unknown, requestId: string): ApiError {
  const root = isRecord(payload) ? payload : {};
  const envelopeError = isRecord(root.error) ? root.error : {};
  const detailsValue = envelopeError.details ?? root.details ?? root.errors;
  const details = isRecord(detailsValue) ? detailsValue : undefined;
  const defaultCode = status === 401 ? "UNAUTHENTICATED"
    : status === 403 ? "FORBIDDEN"
      : status === 404 ? "NOT_FOUND"
        : status === 409 ? "CONFLICT"
          : status === 422 ? "VALIDATION_ERROR"
            : status === 429 ? "RATE_LIMITED"
              : status >= 500 ? "SERVER_ERROR" : `HTTP_${status}`;
  const code = typeof envelopeError.code === "string" ? envelopeError.code
    : typeof root.code === "string" ? root.code : defaultCode;
  const message = typeof envelopeError.message === "string" ? envelopeError.message
    : typeof root.message === "string" ? root.message : "The request could not be completed.";
  return {
    code,
    message,
    retryable: typeof envelopeError.retryable === "boolean" ? envelopeError.retryable : retryableStatus(status),
    status,
    requestId,
    ...(details ? { details } : {}),
  };
}

async function readPayload(response: Response): Promise<{ value: unknown; invalidJson: boolean }> {
  if (response.status === 204 || response.status === 205) return { value: undefined, invalidJson: false };
  const text = await response.text();
  if (!text) return { value: undefined, invalidJson: false };
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (contentType.includes("json") || /^[\[{]/.test(text.trim())) {
    try {
      return { value: JSON.parse(text) as unknown, invalidJson: false };
    } catch {
      return { value: undefined, invalidJson: true };
    }
  }
  return { value: text, invalidJson: false };
}

function responseRequestId(response: Response, payload: unknown, fallback: string): string {
  const headerId = response.headers.get("x-request-id") ?? response.headers.get("request-id");
  if (headerId) return headerId;
  return isRecord(payload) && typeof payload.requestId === "string" ? payload.requestId : fallback;
}

function errorResult<T>(requestId: string, code: string, message: string, retryable = false, details?: Record<string, unknown>, status?: number): Result<T> {
  return { ok: false, source: "api", requestId, error: { code, message, retryable, requestId, ...(status !== undefined ? { status } : {}), ...(details ? { details } : {}) } };
}

/** Central JSON transport. The mock-first application does not call it until API mode is explicitly configured. */
export class JsonApiClient {
  private refreshInFlight: Promise<string | null> | null = null;

  constructor(
    private readonly tokens?: AuthTokenProvider,
    private readonly request: typeof fetch = fetch,
    private readonly timeoutMs = apiConfig.timeoutMs,
    private readonly config: ApiClientConfig = apiConfig,
  ) {}

  get<T>(path: string, options: HttpRequestOptions = {}): Promise<Result<T>> {
    return this.send<T>("GET", path, options);
  }

  post<T>(path: string, body?: unknown, options: HttpRequestOptions = {}): Promise<Result<T>> {
    return this.send<T>("POST", path, { ...options, ...(body !== undefined ? { body } : {}) });
  }

  put<T>(path: string, body?: unknown, options: HttpRequestOptions = {}): Promise<Result<T>> {
    return this.send<T>("PUT", path, { ...options, ...(body !== undefined ? { body } : {}) });
  }

  patch<T>(path: string, body?: unknown, options: HttpRequestOptions = {}): Promise<Result<T>> {
    return this.send<T>("PATCH", path, { ...options, ...(body !== undefined ? { body } : {}) });
  }

  delete<T>(path: string, options: HttpRequestOptions = {}): Promise<Result<T>> {
    return this.send<T>("DELETE", path, options);
  }

  async send<T>(method: HttpMethod, path: string, options: HttpRequestOptions = {}): Promise<Result<T>> {
    const requestId = options.requestId ?? createRequestId();
    if (this.config.mode !== "api") return errorResult(requestId, "API_MODE_DISABLED", "The API service is disabled; this app is using its local demo services.");
    if (!this.config.baseUrl.trim()) return errorResult(requestId, "API_NOT_CONFIGURED", "Set an API origin before enabling production service calls.");

    let url: string;
    try {
      url = buildUrl(this.config, path, options.query);
    } catch (error) {
      return errorResult(requestId, "INVALID_API_CONFIGURATION", error instanceof Error ? error.message : "The API request configuration is invalid.");
    }

    const authenticated = options.authenticated !== false;
    let token: string | null = null;
    if (authenticated && this.tokens) {
      try {
        token = await this.tokens.getAccessToken();
      } catch {
        return errorResult(requestId, "AUTH_TOKEN_UNAVAILABLE", "The secure session could not be read.");
      }
    }

    const first = await this.perform<T>(method, url, options, requestId, token);
    if (first.ok || first.error.status !== 401 || !authenticated || !this.tokens) return first;

    let refreshed: string | null = null;
    try {
      refreshed = await this.refreshTokenSingleFlight();
    } catch {
      refreshed = null;
    }
    if (!refreshed) {
      await this.expireSession();
      return errorResult(requestId, "SESSION_EXPIRED", "Your session has expired. Sign in again to continue.");
    }

    const retried = await this.perform<T>(method, url, options, requestId, refreshed);
    if (!retried.ok && retried.error.status === 401) {
      await this.expireSession();
      return errorResult(requestId, "SESSION_EXPIRED", "Your session has expired. Sign in again to continue.");
    }
    return retried;
  }

  private refreshTokenSingleFlight(): Promise<string | null> {
    if (!this.tokens) return Promise.resolve(null);
    if (!this.refreshInFlight) {
      const refresh = this.tokens.refreshAccessToken();
      this.refreshInFlight = refresh;
      void refresh.finally(() => {
        if (this.refreshInFlight === refresh) this.refreshInFlight = null;
      }).catch(() => undefined);
    }
    return this.refreshInFlight;
  }

  private async expireSession(): Promise<void> {
    await this.tokens?.clearTokens?.().catch(() => undefined);
    try {
      await this.tokens?.onSessionExpired?.();
    } catch {
      // Session cleanup is best-effort; the original API failure remains authoritative.
    }
  }

  private async perform<T>(method: HttpMethod, url: string, options: HttpRequestOptions, requestId: string, token: string | null): Promise<Result<T>> {
    const controller = new AbortController();
    const timeoutMs = options.timeoutMs ?? this.timeoutMs;
    let timedOut = false;
    const callerSignal = options.signal;
    const abortFromCaller = () => controller.abort();
    if (callerSignal?.aborted) controller.abort();
    else callerSignal?.addEventListener("abort", abortFromCaller, { once: true });
    const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);

    try {
      if (callerSignal?.aborted) return errorResult(requestId, "REQUEST_CANCELLED", "The request was cancelled.");
      const headers = new Headers(options.headers);
      headers.set("Accept", "application/json");
      headers.set("X-Request-ID", requestId);
      if (options.authenticated !== false && token) headers.set("Authorization", `Bearer ${token}`);
      const body = prepareBody(options.body, headers);
      const { headers: _headers, body: _body, query: _query, authenticated: _authenticated, timeoutMs: _timeoutMs, requestId: _requestId, signal: _signal, ...init } = options;
      const response = await this.request(url, { ...init, method, headers, ...(body !== undefined ? { body } : {}), signal: controller.signal });
      const parsed = await readPayload(response);
      const payload = parsed.value;
      const serverRequestId = responseRequestId(response, payload, requestId);

      if (parsed.invalidJson && response.ok) {
        return errorResult(serverRequestId, "INVALID_JSON_RESPONSE", "The API returned an unreadable JSON response.", false, undefined, response.status);
      }

      if (!response.ok) {
        const root = isRecord(payload) ? payload : {};
        const envelopeError = isRecord(root.error) ? root.error : undefined;
        if (root.ok === false || envelopeError || response.status >= 400) {
          return { ok: false, source: "api", requestId: serverRequestId, error: responseError(response.status, payload, serverRequestId) };
        }
      }

      if (isRecord(payload) && payload.ok === false) {
        const status = typeof payload.status === "number" ? payload.status : 400;
        return { ok: false, source: "api", requestId: serverRequestId, error: responseError(status, payload, serverRequestId) };
      }
      const data = isRecord(payload) && payload.ok === true && "data" in payload ? payload.data : payload;
      return { ok: true, source: "api", requestId: serverRequestId, data: data as T };
    } catch (error) {
      if (timedOut) return errorResult(requestId, "REQUEST_TIMEOUT", "The request timed out.", true, { timeoutMs });
      if (callerSignal?.aborted) return errorResult(requestId, "REQUEST_CANCELLED", "The request was cancelled.");
      if (error instanceof TypeError && /url|fetch|network/i.test(error.message)) {
        return errorResult(requestId, "NETWORK_ERROR", "The API could not be reached.", true);
      }
      return errorResult(requestId, "NETWORK_ERROR", "The API request failed before a response was received.", true);
    } finally {
      clearTimeout(timeout);
      callerSignal?.removeEventListener("abort", abortFromCaller);
    }
  }
}
