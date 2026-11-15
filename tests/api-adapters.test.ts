import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ApiClientConfig } from "@/lib/api/config";
import type { ApiError, Result } from "@/lib/api/contracts";
import type { AuthSession, MediaUploadTicket } from "@/lib/api/feature-contracts";
import { JsonApiClient, type AuthTokenProvider } from "@/lib/api/http-client";
import { createApiServices } from "@/lib/api/production-services";
import { createMockServices } from "@/lib/services/mock-services";
import { CURRENT_USER, PEOPLE, POSTS } from "@/data/seed";
import type { SocialStory } from "@/types/domain";

vi.mock("@/lib/api/config", () => ({
  apiConfig: { mode: "mock-local", baseUrl: "", timeoutMs: 1000, versionPrefix: "/api/v1", allowInsecureHttp: false },
}));

const apiConfigForTest: ApiClientConfig = {
  mode: "api",
  baseUrl: "https://api.example.test",
  timeoutMs: 1000,
  versionPrefix: "/api/v1",
  allowInsecureHttp: false,
};

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}
function apiSuccess<T>(data: T): Result<T> {
  return { ok: true, source: "api", data, requestId: "test-request" };
}

beforeEach(() => vi.restoreAllMocks());

describe("JsonApiClient", () => {
  it("serializes CRUD request bodies, repeated query values, bearer auth and request IDs", async () => {
    let requestUrl = "";
    let requestInit: RequestInit | undefined;
    const fetcher: typeof fetch = async (input, init) => {
      requestUrl = String(input);
      requestInit = init;
      return jsonResponse({ ok: true, data: { id: "post-1" }, requestId: "server-123" });
    };
    const tokens: AuthTokenProvider = { getAccessToken: async () => "access-secret", refreshAccessToken: async () => null };
    const client = new JsonApiClient(tokens, fetcher, 1000, apiConfigForTest);
    const result = await client.post<{ id: string }>("/posts", { caption: "A local post" }, { query: { tag: ["food", "Nairobi"], includeHidden: false } });

    expect(result).toEqual({ ok: true, source: "api", data: { id: "post-1" }, requestId: "server-123" });
    const url = new URL(requestUrl);
    expect(url.pathname).toBe("/api/v1/posts");
    expect(url.searchParams.getAll("tag")).toEqual(["food", "Nairobi"]);
    expect(url.searchParams.get("includeHidden")).toBe("false");
    expect(requestInit?.method).toBe("POST");
    expect(requestInit?.body).toBe(JSON.stringify({ caption: "A local post" }));
    const headers = new Headers(requestInit?.headers);
    expect(headers.get("Authorization")).toBe("Bearer access-secret");
    expect(headers.get("X-Request-ID")).toMatch(/^bc-/);
  });

  it("maps server envelopes, validation details, and request IDs consistently", async () => {
    const fetcher: typeof fetch = async () => jsonResponse({ ok: false, error: { code: "validation_error", message: "Check the form.", retryable: false, details: { phone: "Invalid Kenyan number" } }, requestId: "trace-7" }, 422);
    const client = new JsonApiClient(undefined, fetcher, 1000, apiConfigForTest);
    const result = await client.post("/auth/register", {}, { authenticated: false });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.requestId).toBe("trace-7");
      expect(result.error).toMatchObject({ code: "validation_error", message: "Check the form.", retryable: false, status: 422, details: { phone: "Invalid Kenyan number" } });
    }
  });

  it("rejects malformed JSON on successful responses and accepts empty 204 responses", async () => {
    let call = 0;
    const fetcher: typeof fetch = async () => {
      call += 1;
      return call === 1
        ? new Response("{not json", { status: 200, headers: { "content-type": "application/json", "x-request-id": "bad-json-1" } })
        : new Response(null, { status: 204 });
    };
    const client = new JsonApiClient(undefined, fetcher, 1000, apiConfigForTest);
    const malformed = await client.get<{ id: string }>("/posts/post-1");
    expect(malformed.ok).toBe(false);
    if (!malformed.ok) expect(malformed.error).toMatchObject({ code: "INVALID_JSON_RESPONSE", status: 200, requestId: "bad-json-1" });
    expect(await client.delete<void>("/posts/post-1")).toMatchObject({ ok: true, data: undefined });
  });

  it("distinguishes timeout and caller cancellation", async () => {
    const never: typeof fetch = (_input, init) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), { once: true });
    });
    const timeoutClient = new JsonApiClient(undefined, never, 10, apiConfigForTest);
    const timeout = await timeoutClient.get("/feed");
    expect(timeout.ok).toBe(false);
    if (!timeout.ok) expect(timeout.error).toMatchObject({ code: "REQUEST_TIMEOUT", retryable: true });

    const controller = new AbortController();
    controller.abort();
    const cancellation = await new JsonApiClient(undefined, never, 1000, apiConfigForTest).get("/feed", { signal: controller.signal });
    expect(cancellation.ok).toBe(false);
    if (!cancellation.ok) expect(cancellation.error.code).toBe("REQUEST_CANCELLED");
  });

  it("coalesces concurrent 401 refresh and retries each request once", async () => {
    let refreshCount = 0;
    let attemptCount = 0;
    const fetcher: typeof fetch = async (_input, init) => {
      attemptCount += 1;
      const authorization = new Headers(init?.headers).get("authorization");
      await new Promise((resolve) => setTimeout(resolve, 5));
      if (authorization === "Bearer old-token") return jsonResponse({ error: { code: "expired" } }, 401);
      return jsonResponse({ ok: true, data: { ok: true } });
    };
    const tokens: AuthTokenProvider = {
      getAccessToken: async () => "old-token",
      refreshAccessToken: async () => { refreshCount += 1; await new Promise((resolve) => setTimeout(resolve, 10)); return "new-token"; },
    };
    const client = new JsonApiClient(tokens, fetcher, 1000, apiConfigForTest);
    const [first, second] = await Promise.all([client.get("/feed"), client.get("/notifications")]);
    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(refreshCount).toBe(1);
    expect(attemptCount).toBe(4);
  });

  it("clears tokens and reports session expiry when refresh is unavailable", async () => {
    let cleared = false;
    const fetcher: typeof fetch = async () => jsonResponse({ message: "Unauthorized" }, 401);
    const tokens: AuthTokenProvider = { getAccessToken: async () => "expired", refreshAccessToken: async () => null, clearTokens: async () => { cleared = true; } };
    const result = await new JsonApiClient(tokens, fetcher, 1000, apiConfigForTest).get("/me");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("SESSION_EXPIRED");
    expect(cleared).toBe(true);
  });

  it("does not call the transport when API mode or the base URL is absent", async () => {
    let calls = 0;
    const fetcher: typeof fetch = async () => { calls += 1; return jsonResponse({}); };
    const disabled = await new JsonApiClient(undefined, fetcher, 1000, { ...apiConfigForTest, mode: "mock-local" }).get("/feed");
    const missingOrigin = await new JsonApiClient(undefined, fetcher, 1000, { ...apiConfigForTest, baseUrl: "" }).get("/feed");
    expect(disabled.ok).toBe(false);
    if (!disabled.ok) expect(disabled.error.code).toBe("API_MODE_DISABLED");
    expect(missingOrigin.ok).toBe(false);
    if (!missingOrigin.ok) expect(missingOrigin.error.code).toBe("API_NOT_CONFIGURED");
    expect(calls).toBe(0);
  });
});

describe("typed production and local adapters", () => {
  it("maps Stage 6 enquiry, conversation, message receipts and block/archive routes", async () => {
    const calls: { method: string; path: string; value?: unknown }[] = [];
    const conversation = { id: "conv-1", kind: "business", businessId: "biz-1", businessName: "Workshop", catalogItemId: "item-1", catalogItemTitle: "Tea", participantId: "biz-1", participantName: "Workshop", lastMessage: "Hello", lastMessageAt: "2026-11-12T10:00:00Z", unreadCount: 2, isArchived: false, isBlocked: false, blockedByUserId: null, createdAt: "2026-11-12T09:00:00Z" };
    const message = { id: "msg-1", conversationId: "conv-1", senderUserId: "u1", senderName: "Amina", text: "Hello", createdAt: "2026-11-12T10:00:00Z", status: "delivered", clientMessageId: "client-1" };
    const client = {
      get: vi.fn(async (path: string, options?: unknown) => { calls.push({ method: "GET", path, value: options }); return path.endsWith("/messages") ? apiSuccess({ items: [message], total: 1, page: 1, pageSize: 20 }) : apiSuccess({ items: [conversation], total: 1, page: 1, pageSize: 20 }); }),
      post: vi.fn(async (path: string, value?: unknown) => { calls.push({ method: "POST", path, value }); return path === "/conversations" ? apiSuccess(conversation) : path.endsWith("/messages") ? apiSuccess(message) : apiSuccess(undefined); }),
      delete: vi.fn(async (path: string) => { calls.push({ method: "DELETE", path }); return apiSuccess(undefined); }),
    } as unknown as JsonApiClient;
    const services = createApiServices({ config: apiConfigForTest, client });

    const started = await services.messaging.startConversation({ businessId: "biz-1", catalogItemId: "item-1", firstMessage: "Hello" });
    expect(started.ok && started.data).toMatchObject({ id: "conv-1", kind: "business", catalogItemTitle: "Tea", unread: 2 });
    const list = await services.messaging.listConversations({ limit: 20 });
    expect(list.ok && list.data.items[0]).toMatchObject({ businessId: "biz-1", catalogItemId: "item-1", participantName: "Workshop" });
    const messages = await services.messaging.listMessages("conv-1", { limit: 20 });
    expect(messages.ok && messages.data.items[0]).toMatchObject({ senderId: "u1", status: "delivered", text: "Hello" });
    await services.messaging.sendMessage({ conversationId: "conv-1", clientMessageId: "client-1", text: "Hello" });
    await services.messaging.markDelivered("conv-1");
    await services.messaging.markRead("conv-1");
    await services.messaging.archive("conv-1");
    await services.messaging.block("conv-1");
    await services.messaging.unblock("conv-1");

    expect(calls.map((call) => `${call.method} ${call.path}`)).toEqual(expect.arrayContaining([
      "POST /conversations", "GET /conversations", "GET /conversations/conv-1/messages", "POST /conversations/conv-1/messages",
      "POST /conversations/conv-1/delivered", "POST /conversations/conv-1/read", "POST /conversations/conv-1/archive",
      "POST /conversations/conv-1/block", "DELETE /conversations/conv-1/block",
    ]));
    expect(calls[0]?.value).toMatchObject({ businessId: "biz-1", catalogItemId: "item-1", firstMessage: "Hello" });
  });

  it("maps nearby requests to the supported For You route without location filters", async () => {
    const calls: { method: string; path: string; value?: unknown }[] = [];
    const client = {
      get: vi.fn(async (path: string, options?: unknown) => { calls.push({ method: "GET", path, value: options }); return apiSuccess({ items: [], total: 0 }); }),
      post: vi.fn(async (path: string, value?: unknown) => { calls.push({ method: "POST", path, value }); return apiSuccess({ id: "new" }); }),
      patch: vi.fn(async (path: string, value?: unknown) => { calls.push({ method: "PATCH", path, value }); return apiSuccess({ id: "new" }); }),
      delete: vi.fn(async (path: string) => { calls.push({ method: "DELETE", path }); return apiSuccess(undefined); }),
    } as unknown as JsonApiClient;
    const services = createApiServices({ config: apiConfigForTest, client });
    await services.feed.list({ mode: "nearby", county: "Nairobi", town: "Nairobi", limit: 12 });
    await services.businesses.get("b/with space");

    expect(calls[0]?.path).toBe("/feed/for-you");
    expect(calls[0]?.value).toMatchObject({ query: { limit: 12 } });
    expect(calls[0]?.value).not.toMatchObject({ query: { county: expect.anything(), town: expect.anything(), mode: expect.anything() } });
    expect(calls[1]?.path).toBe("/businesses/b%2Fwith%20space");
  });

  it("maps Stage 3 roles, invitations, transfers, members, and activity to the C# routes", async () => {
    const calls: { method: string; path: string; value?: unknown }[] = [];
    const invitation = { id: "invite-1", businessId: "biz-1", businessName: "Workshop", invitedUserId: "user-2", invitedEmail: "member@example.test", role: "Editor", status: "pending", createdAt: "2026-11-12T00:00:00Z", expiresAt: "2026-11-19T00:00:00Z", invitedByUserId: "user-1", invitedByName: "Owner" };
    const member = { userId: "user-2", role: "Viewer", joinedAt: "2026-11-12T00:00:00Z", displayName: "Member", email: "member@example.test", avatar: null };
    const transfer = { id: "transfer-1", businessId: "biz-1", businessName: "Workshop", fromUserId: "user-1", fromName: "Owner", toUserId: "user-2", toEmail: "member@example.test", status: "pending", createdAt: "2026-11-12T00:00:00Z", expiresAt: "2026-11-19T00:00:00Z" };
    const activity = { id: "activity-1", businessId: "biz-1", actorUserId: "user-1", actorName: "Owner", eventType: "team.invited", summary: "Invited member", createdAt: "2026-11-12T00:00:00Z" };
    const client = {
      get: vi.fn(async (path: string, options?: unknown) => {
        calls.push({ method: "GET", path, value: options });
        if (path.endsWith("/me/ownership-transfers")) return apiSuccess([transfer]);
        const items = path.endsWith("/activity") ? [activity] : path.endsWith("/members") ? [member] : [invitation];
        return apiSuccess({ items, total: items.length, page: 1, pageSize: 20 });
      }),
      post: vi.fn(async (path: string, value?: unknown) => { calls.push({ method: "POST", path, value }); return apiSuccess(path.endsWith("/ownership-transfers") ? transfer : invitation); }),
      patch: vi.fn(async (path: string, value?: unknown) => { calls.push({ method: "PATCH", path, value }); return apiSuccess(member); }),
      delete: vi.fn(async (path: string) => { calls.push({ method: "DELETE", path }); return apiSuccess(undefined); }),
    } as unknown as JsonApiClient;
    const services = createApiServices({ config: apiConfigForTest, client });

    const members = await services.memberships.list("biz-1", { limit: 20 });
    expect(members.ok && members.data.items[0]?.role).toBe("Viewer");
    const teamInvite = await services.memberships.invite("biz-1", { email: "member@example.test", role: "Content Manager" });
    expect(teamInvite.ok && teamInvite.data.invitationId).toBe("invite-1");
    await services.memberships.listInvitations("biz-1", { limit: 20 });
    await services.memberships.listMyInvitations({ limit: 20 });
    await services.memberships.acceptInvitation("biz-1", "invite-1");
    await services.memberships.declineInvitation("biz-1", "invite-1");
    await services.memberships.cancelInvitation("biz-1", "invite-1");
    await services.memberships.updateRole("biz-1", "user-2", "Administrator");
    await services.memberships.remove("biz-1", "user-2");
    await services.memberships.leave("biz-1");
    await services.memberships.requestOwnershipTransfer("biz-1", "member@example.test");
    await services.memberships.listMyOwnershipTransfers();
    await services.memberships.acceptOwnershipTransfer("biz-1", "transfer-1");
    await services.memberships.declineOwnershipTransfer("biz-1", "transfer-1");
    await services.memberships.cancelOwnershipTransfer("biz-1", "transfer-1");
    const activityPage = await services.memberships.listActivity("biz-1", { limit: 20 });
    expect(activityPage.ok && activityPage.data.items[0]?.eventType).toBe("team.invited");

    expect(calls.find((call) => call.path.endsWith("/invitations") && call.method === "POST")?.value).toMatchObject({ email: "member@example.test", role: "Editor" });
    expect(calls.find((call) => call.path.endsWith("/members/user-2/role"))?.value).toEqual({ role: "Admin" });
    expect(calls.find((call) => call.path.endsWith("/ownership-transfers") && call.method === "POST")?.value).toEqual({ newOwnerEmail: "member@example.test" });
    expect(calls.map((call) => `${call.method} ${call.path}`)).toEqual(expect.arrayContaining([
      "GET /businesses/biz-1/members", "GET /businesses/biz-1/invitations", "GET /businesses/me/invitations",
      "POST /businesses/biz-1/invitations/invite-1/accept", "POST /businesses/biz-1/invitations/invite-1/decline",
      "DELETE /businesses/biz-1/invitations/invite-1", "PATCH /businesses/biz-1/members/user-2/role",
      "DELETE /businesses/biz-1/members/user-2", "POST /businesses/biz-1/leave",
      "POST /businesses/biz-1/ownership-transfers", "GET /businesses/me/ownership-transfers",
      "POST /businesses/biz-1/ownership-transfers/transfer-1/accept", "POST /businesses/biz-1/ownership-transfers/transfer-1/decline",
      "POST /businesses/biz-1/ownership-transfers/transfer-1/cancel", "GET /businesses/biz-1/activity",
    ]));
  });

  it("maps Social Stories, poll votes, offers, events and community opportunities to API resources", async () => {
    const calls: { method: string; path: string; value?: unknown }[] = [];
    const client = {
      get: vi.fn(async (path: string, options?: unknown) => { calls.push({ method: "GET", path, value: options }); return apiSuccess({ items: [], total: 0 }); }),
      post: vi.fn(async (path: string, value?: unknown) => { calls.push({ method: "POST", path, value }); return path.endsWith("/votes") ? apiSuccess({ id: "poll-1", postId: "p1", question: "Pick", closesAt: null, isClosed: false, options: [{ id: "option-a", text: "A", votes: 1 }], viewerOptionId: "option-a" }) : apiSuccess({ id: "created" }); }),
      patch: vi.fn(async (path: string, value?: unknown) => { calls.push({ method: "PATCH", path, value }); return apiSuccess({ id: "updated" }); }),
      delete: vi.fn(async (path: string) => { calls.push({ method: "DELETE", path }); return apiSuccess(undefined); }),
    } as unknown as JsonApiClient;
    const services = createApiServices({ config: apiConfigForTest, client });
    await services.socialStories.create({ identityKind: "personal", identityId: "u1", caption: "Today in Nairobi", mediaItems: [], overlays: [], audience: "public", durationHours: 24 });
    await services.posts.votePoll("poll-1", "option-a");
    await services.listings.createOffer("b/1", { title: "Weekend offer", description: "Local offer", kind: "discount", startsAt: "2026-11-12T00:00:00Z", expiresAt: "2026-11-13T00:00:00Z", status: "scheduled" });
    await services.listings.createEvent({ identityKind: "personal", identityId: "u1", title: "Workshop", description: "Local event", category: "workshop", startsAt: "2026-11-12T00:00:00Z", location: "Nairobi", online: false, registrationInstructions: "Contact the host", contact: "+254700000000" });
    await services.listings.createCommunityOpportunity({ identityKind: "personal", identityId: "u1", title: "Supplier", description: "Find a local supplier", category: "supplier", location: "Nairobi", requirements: "Local supplier", contactInstructions: "Send a message" });

    expect(calls.map((call) => call.path)).toEqual([
      "/social-stories",
      "/polls/poll-1/votes",
      "/businesses/b%2F1/offers",
      "/events",
      "/community-opportunities",
    ]);
    expect(calls[0]?.value).toMatchObject({ caption: "Today in Nairobi", durationHours: 24 });
    expect(calls[1]?.value).toEqual({ optionId: "option-a" });
  });

  it("maps Stage 7 notification DTOs, backend pagination, preferences and device registration", async () => {
    const calls: { method: string; path: string; value?: unknown }[] = [];
    const preferenceDto = { inAppEnabled: true, pushEnabled: false, messages: true, likes: true, comments: true, newFollowers: true, businessTeamActivity: true, businessUpdates: true };
    const notificationDto = { id: "n-1", type: "catalogue_update", actorUserId: "u-1", actorName: "Amina", title: "Catalogue changed", body: "A new item is available.", targetType: "catalog_item", targetId: "item-1", businessId: "b-1", postId: null, conversationId: null, catalogItemId: "item-1", createdAt: "2026-11-12T10:00:00Z", readAt: null, read: false };
    const client = {
      get: vi.fn(async (path: string, options?: unknown) => {
        calls.push({ method: "GET", path, value: options });
        if (path === "/notifications") return apiSuccess({ items: [notificationDto], total: 41, page: 2, pageSize: 20 });
        if (path === "/notifications/unread-count") return apiSuccess({ count: 3 });
        if (path === "/users/me/notification-preferences") return apiSuccess(preferenceDto);
        return apiSuccess([]);
      }),
      post: vi.fn(async (path: string, value?: unknown) => {
        calls.push({ method: "POST", path, value });
        return path === "/users/me/devices" ? apiSuccess({ id: "d-1", deviceIdentifier: "install-1234", platform: "android", deviceName: "Phone", hasPushToken: true, createdAt: "now", lastSeenAt: "now" }) : apiSuccess(undefined);
      }),
      patch: vi.fn(async (path: string, value?: unknown) => {
        calls.push({ method: "PATCH", path, value });
        return apiSuccess({ ...preferenceDto, ...(value as Record<string, unknown>) });
      }),
      delete: vi.fn(async (path: string) => { calls.push({ method: "DELETE", path }); return apiSuccess(undefined); }),
    } as unknown as JsonApiClient;
    const services = createApiServices({ config: apiConfigForTest, client });

    const page = await services.notifications.list({ cursor: "2", limit: 20 });
    expect(page.ok).toBe(true);
    if (!page.ok) return;
    expect(calls[0]?.value).toEqual({ query: { page: 2, pageSize: 20 } });
    expect(page.data.items[0]).toMatchObject({ id: "n-1", kind: "update", detail: "A new item is available.", actorName: "Amina", read: false, catalogItemId: "item-1" });
    expect(page.data.nextCursor).toBe("3");
    expect(await services.notifications.getUnreadCount()).toMatchObject({ ok: true, data: 3 });

    const preferences = await services.notifications.updatePreferences({ follows: false, pushEnabled: true });
    expect(preferences).toMatchObject({ ok: true, data: { follows: false, pushEnabled: true } });
    expect(calls.find((call) => call.method === "PATCH")?.value).toEqual({ pushEnabled: true, newFollowers: false });
    const registered = await services.notifications.registerDevice({ deviceIdentifier: "install-1234", platform: "android", pushToken: "ExponentPushToken[ABCDEFGHIJKLMNOP]" });
    expect(registered).toMatchObject({ ok: true, data: { hasPushToken: true } });
    await services.notifications.dismiss("n-1");
    expect(calls.some((call) => call.method === "DELETE" && call.path === "/notifications/n-1")).toBe(true);
  });

  it("preserves an API error instead of replacing it with mock data", async () => {
    const failure: Result<never> = { ok: false, source: "api", requestId: "server-down", error: { code: "NETWORK_ERROR", message: "unavailable", retryable: true } };
    const client = { get: vi.fn(async () => failure) } as unknown as JsonApiClient;
    const services = createApiServices({ config: apiConfigForTest, client });
    const result = await services.businesses.get("b-kivuli");
    expect(result).toEqual(failure);
    expect(result.source).toBe("api");
  });

  it("keeps local mock mutations local, explicit, idempotent and bounded", async () => {
    const services = createMockServices();
    const initial = await services.businesses.list({ limit: 500, search: "Nairobi" });
    expect(initial.ok).toBe(true);
    if (initial.ok) {
      expect(initial.source).toBe("mock-local");
      expect(initial.data.items.length).toBeLessThanOrEqual(30);
      expect(initial.data.items.every((business) => `${business.name} ${business.town}`.toLowerCase().includes("nairobi"))).toBe(true);
    }

    const original = POSTS[0]!;
    const before = original.likes;
    await services.posts.like(original.id);
    await services.posts.like(original.id);
    const updated = await services.posts.get(original.id);
    expect(updated.ok).toBe(true);
    if (updated.ok) expect(updated.data.likes).toBe(before + 1);
    expect(POSTS[0]?.likes).toBe(before);
  });

  it("keeps notification inbox mutations and counts in mock-local memory only", async () => {
    const services = createMockServices();
    const before = await services.notifications.getUnreadCount();
    expect(before.ok).toBe(true);
    const page = await services.notifications.list({ limit: 30 });
    expect(page.ok).toBe(true);
    if (!page.ok || page.data.items.length === 0) return;
    expect(page.source).toBe("mock-local");
    expect((await services.notifications.markRead(page.data.items[0]!.id)).ok).toBe(true);
    expect((await services.notifications.dismiss(page.data.items[0]!.id)).ok).toBe(true);
    const push = await services.notifications.registerDevice({ deviceIdentifier: "mock-install-1", platform: "android", pushToken: "ExponentPushToken[ABCDEFGHIJKLMNOP]" });
    expect(push.ok).toBe(false);
    if (!push.ok) expect(push.error.code).toBe("LOCAL_ONLY");
  });

  it("keeps poll votes, ephemeral Stories, Highlights and listing mutations in the local mock adapter", async () => {
    const services = createMockServices();
    const pollPost = await services.posts.create({ kind: "poll", caption: "Choose an option", identityKind: "personal", identityId: CURRENT_USER.id, poll: { question: "Which tool?", options: [{ id: "o1", text: "A" }, { id: "o2", text: "B" }], endsAt: new Date(Date.now() + 60_000).toISOString(), multipleChoice: false, votes: [] } });
    expect(pollPost.ok).toBe(true);
    if (!pollPost.ok) return;
    const vote = await services.posts.vote(pollPost.data.id, { optionIds: ["o2"] });
    expect(vote.ok).toBe(true);
    if (vote.ok) expect(vote.data.votes).toHaveLength(1);

    const story = await services.socialStories.create({ identityKind: "personal", identityId: CURRENT_USER.id, caption: "Short-lived local Story", mediaItems: [], overlays: [], audience: "public", durationHours: 48 });
    expect(story.ok).toBe(true);
    if (!story.ok) return;
    expect(new Date(story.data.expiresAt).getTime() - new Date(story.data.createdAt).getTime()).toBeLessThanOrEqual(24 * 60 * 60 * 1000);
    const highlight = await services.socialStories.createHighlight({ title: "My moments", storyIds: [story.data.id] });
    expect(highlight.ok).toBe(true);

    const opportunity = await services.listings.createCommunityOpportunity({ identityKind: "personal", identityId: CURRENT_USER.id, title: "Local supplier", description: "Seeking a supplier", category: "supplier", location: "Nairobi", requirements: "Local", contactInstructions: "Message" });
    expect(opportunity.ok).toBe(true);
    const list = await services.listings.listCommunityOpportunities({ limit: 10 });
    expect(list.ok).toBe(true);
    if (list.ok) expect(list.data.items.some((item) => item.title === "Local supplier")).toBe(true);
  });

  it("enforces audience, block, and expiry policy on direct mock Story reads", async () => {
    vi.useFakeTimers();
    const now = new Date("2026-11-12T12:00:00.000Z");
    vi.setSystemTime(now);
    const makeStory = (id: string, authorId: string, audience: SocialStory["audience"], expiresAt: string): SocialStory => ({
      id, authorId, identityKind: "personal", identityId: authorId, caption: id, mediaItems: [], overlays: [], audience,
      createdAt: new Date(now.getTime() - 60_000).toISOString(), expiresAt,
    });
    const services = createMockServices({ currentUserId: CURRENT_USER.id, socialStories: [
      makeStory("public", PEOPLE[0]!.id, "public", "2026-11-13T12:00:00.000Z"),
      makeStory("private", PEOPLE[1]!.id, "private", "2026-11-13T12:00:00.000Z"),
      makeStory("followers", PEOPLE[2]!.id, "followers", "2026-11-13T12:00:00.000Z"),
      makeStory("blocked", PEOPLE[3]!.id, "public", "2026-11-13T12:00:00.000Z"),
      makeStory("expired", PEOPLE[4]!.id, "public", "2026-11-12T11:00:00.000Z"),
    ] });
    try {
      await services.moderation.block(PEOPLE[3]!.id);
      expect((await services.socialStories.get("public")).ok).toBe(true);
      for (const id of ["private", "followers", "blocked", "expired"]) {
        const result = await services.socialStories.get(id);
        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error.code).toBe("NOT_FOUND");
      }
    } finally {
      vi.useRealTimers();
    }
  });

  it("marks verification as pending only and rejects local remote-upload claims", async () => {
    const services = createMockServices();
    const request = await services.verification.submit("b-bahari", { documentMediaIds: ["local-file://evidence"] });
    expect(request.ok).toBe(true);
    if (request.ok) expect(request.data.status).toBe("pending");

    const ticket = { uploadId: "u1", uploadUrl: "https://storage.example.test/upload", method: "PUT", transfer: "binary", expiresAt: new Date().toISOString(), supportsResume: false } as MediaUploadTicket;
    const upload = await services.media.upload(ticket, { uri: "file://demo.jpg", fileName: "demo.jpg", contentType: "image/jpeg", sizeBytes: 100 });
    expect(upload.ok).toBe(false);
    if (!upload.ok) expect(upload.error.code).toBe("LOCAL_ONLY");
  });
});
