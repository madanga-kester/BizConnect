const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";
export const apiMode = (import.meta.env.VITE_API_MODE as string | undefined) === "api" && Boolean(baseUrl) ? "api" : "demo";

type ApiOptions = RequestInit & { query?: Record<string, string | number | boolean | undefined>; skipRefresh?: boolean };
export type ApiResult<T> = { ok: true; data: T; status: number } | { ok: false; message: string; status?: number };
let accessToken: string | null = null;
let csrfToken: string | null = null;
let refreshPromise: Promise<boolean> | null = null;

const jsonHeaders = (headers?: HeadersInit) => {
  const result = new Headers(headers);
  result.set("Accept", "application/json");
  if (!result.has("Content-Type")) result.set("Content-Type", "application/json");
  if (csrfToken) result.set("X-CSRF-TOKEN", csrfToken);
  if (accessToken) result.set("Authorization", `Bearer ${accessToken}`);
  return result;
};

async function rawRequest<T>(path: string, options: ApiOptions = {}): Promise<ApiResult<T>> {
  if (apiMode !== "api") return { ok: false, message: "Demo mode is active. No server request was made." };
  const { query, skipRefresh: _skipRefresh, ...init } = options;
  const queryString = query ? `?${new URLSearchParams(Object.entries(query).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)]))}` : "";
  try {
    const response = await fetch(`${baseUrl}/api/v1${path}${queryString}`, { ...init, credentials: "include", headers: jsonHeaders(init.headers) });
    const payload = response.status === 204 ? undefined : await response.json().catch(() => undefined);
    if (!response.ok) return { ok: false, message: payload?.error?.message ?? payload?.message ?? `Request failed (${response.status})`, status: response.status };
    return { ok: true, data: payload as T, status: response.status };
  } catch {
    return { ok: false, message: "The API could not be reached. Check the configured origin and network." };
  }
}

async function refresh(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const result = await rawRequest<{ accessToken: string }>('/auth/refresh', { method: 'POST', body: JSON.stringify({ refreshToken: null }), skipRefresh: true });
    if (result.ok) { accessToken = result.data.accessToken; return true; }
    return false;
  })();
  try { return await refreshPromise; } finally { refreshPromise = null; }
}

async function request<T>(path: string, options: ApiOptions = {}): Promise<ApiResult<T>> {
  const result = await rawRequest<T>(path, options);
  if (!result.ok && result.status === 401 && !options.skipRefresh && await refresh()) return rawRequest<T>(path, { ...options, skipRefresh: true });
  return result;
}

const body = (value: unknown): RequestInit => ({ method: "POST", body: JSON.stringify(value) });

export const api = {
  async csrf() { const result = await request<{ csrfToken?: string; token?: string }>("/auth/csrf"); if (result.ok) csrfToken = result.data.csrfToken ?? result.data.token ?? null; return result; },
  async login(identifier: string, password: string) { await api.csrf(); const result = await request<{ user: Record<string, unknown>; accessToken: string }>("/auth/login", body({ identifier, password })); if (result.ok) accessToken = result.data.accessToken; return result; },
  async register(input: { name: string; username: string; email: string; password: string; county: string; town: string }) { await api.csrf(); return request<Record<string, unknown>>("/auth/register", body({ ...input, interests: [] })); },
  async logout() { const result = await request<void>("/auth/logout", body({ refreshToken: null })); accessToken = null; return result; },
  profile() { return request<Record<string, unknown>>("/users/me"); },
  businesses(page = 1, pageSize = 20) { return request<{ items: Record<string, unknown>[]; total: number; page: number; pageSize: number }>("/businesses", { query: { page, pageSize } }); },
  createBusiness(input: Record<string, unknown>) { return request<Record<string, unknown>>("/businesses", body(input)); },
  updateBusiness(id: string, input: Record<string, unknown>) { return request<Record<string, unknown>>(`/businesses/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) }); },
  followBusiness(id: string, following: boolean) { return request<void>(`/businesses/${encodeURIComponent(id)}/follow`, { method: following ? "POST" : "DELETE" }); },
  catalogue(kind: "products" | "services", query: Record<string, string | number | undefined> = {}) { return request<{ items: Record<string, unknown>[]; total: number; page: number; pageSize: number }>(`/catalogue/${kind}`, { query: { page: 1, pageSize: 20, ...query } }); },
  catalogueDetail(kind: "products" | "services", id: string) { return request<Record<string, unknown>>(`/catalogue/${kind}/${encodeURIComponent(id)}`); },
  createCatalogue(businessId: string, kind: "products" | "services", input: Record<string, unknown>) { return request<Record<string, unknown>>(`/businesses/${businessId}/${kind}`, body(input)); },
  opportunities(query: Record<string, string | number | boolean | undefined> = {}) { return request<{ items: Record<string, unknown>[]; total: number; page: number; pageSize: number }>("/opportunities", { query: { page: 1, pageSize: 20, ...query } }); },
  opportunity(id: string) { return request<Record<string, unknown>>(`/opportunities/${encodeURIComponent(id)}`); },
  createOpportunity(businessId: string, input: Record<string, unknown>) { return request<Record<string, unknown>>(`/businesses/${businessId}/opportunities`, body(input)); },
  enquiry(id: string) { return request<Record<string, unknown>>(`/opportunities/${encodeURIComponent(id)}/enquiry`, body({})); },
  feed(cursor?: string) { return request<{ items: Record<string, unknown>[]; nextCursor?: string }>("/feed/for-you", { query: { cursor, limit: 20 } }); },
  createPost(input: Record<string, unknown>) { return request<Record<string, unknown>>("/posts", body(input)); },
  likePost(id: string, liked: boolean) { return request<void>(`/posts/${id}/likes`, { method: liked ? "POST" : "DELETE" }); },
  commentPost(id: string, text: string) { return request<Record<string, unknown>>(`/posts/${id}/comments`, body({ text })); },
  conversations(page = 1) { return request<{ items: Record<string, unknown>[]; total: number; page: number; pageSize: number }>("/conversations", { query: { page, pageSize: 20 } }); },
  messages(id: string) { return request<{ items: Record<string, unknown>[]; total: number }>(`/conversations/${id}/messages`, { query: { page: 1, pageSize: 30 } }); },
  sendMessage(id: string, text: string) { return request<Record<string, unknown>>(`/conversations/${id}/messages`, body({ text, clientMessageId: crypto.randomUUID() })); },
  conversationAction(id: string, action: "read" | "archive") { return request<void>(`/conversations/${id}/${action}`, body({})); },
  notifications() { return request<{ items: Record<string, unknown>[]; total: number }>("/notifications", { query: { page: 1, pageSize: 30 } }); },
  notificationAction(id: string, action: "read" | "dismiss") { return request<void>(action === "dismiss" ? `/notifications/${id}` : `/notifications/${id}/read`, { method: action === "dismiss" ? "DELETE" : "POST" }); },
  readAllNotifications() { return request<void>("/notifications/read-all", body({})); },
  notificationPreferences() { return request<Record<string, boolean>>("/users/me/notification-preferences"); },
  updateNotificationPreferences(input: Record<string, boolean>) { return request<Record<string, boolean>>("/users/me/notification-preferences", { method: "PATCH", body: JSON.stringify(input) }); },
  analytics(businessId: string, range = "30d") { const days = Number(range.replace("d", "")); const to = new Date(); const from = new Date(to.getTime() - days * 86400000); return request<Record<string, unknown>>(`/businesses/${encodeURIComponent(businessId)}/analytics`, { query: { from: from.toISOString(), to: to.toISOString() } }); },
};
