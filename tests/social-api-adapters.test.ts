import { describe, expect, it, vi } from "vitest";
import { ApiClientConfig } from "@/lib/api/config";
import { Result } from "@/lib/api/contracts";
import { createApiServices } from "@/lib/api/production-services";
import { JsonApiClient } from "@/lib/api/http-client";

vi.mock("@/lib/api/config", () => ({ apiConfig: { mode: "mock-local", baseUrl: "", timeoutMs: 1000, versionPrefix: "/api/v1", allowInsecureHttp: false } }));

const config: ApiClientConfig = { mode: "api", baseUrl: "https://api.example.test", timeoutMs: 1000, versionPrefix: "/api/v1", allowInsecureHttp: false };
const requestPost = {
  id: "post-1", authorUserId: "user-1", businessId: null, kind: "image", audience: "public", discoverable: true, allowComments: true, location: "Nairobi",
  text: "A useful update", productJson: null, createdAt: "2026-11-12T10:00:00Z", updatedAt: "2026-11-12T10:00:00Z",
  pollId: "poll-1", publisher: { userId: "user-1", name: "Amina Founder", username: "amina", avatar: "https://cdn.test/amina.jpg", business: null },
  poll: { id: "poll-1", postId: "post-1", question: "Which design?", closesAt: "2026-11-14T10:00:00Z", isClosed: false, options: [{ id: "poll-a", text: "Blue", votes: 4 }, { id: "poll-b", text: "Green", votes: 2 }], viewerOptionId: "poll-a" },
  media: [
    { id: "m2", mediaType: "image", url: "https://cdn.test/second.jpg", altText: null, sortOrder: 1 },
    { id: "m1", mediaType: "image", url: "https://cdn.test/first.jpg", altText: "First image", sortOrder: 0 },
  ], likeCount: 7, commentCount: 3, viewerLiked: true,
};
const success = <T,>(data: T): Result<T> => ({ ok: true, source: "api", data, requestId: "social-test" });
function clientWith(handlers: {
  get?: (path: string, options?: unknown) => Promise<Result<unknown>>;
  post?: (path: string, body?: unknown, options?: unknown) => Promise<Result<unknown>>;
  patch?: (path: string, body?: unknown, options?: unknown) => Promise<Result<unknown>>;
  delete?: (path: string, options?: unknown) => Promise<Result<unknown>>;
}, calls: { method: string; path: string; value?: unknown }[] = []) {
  return {
    get: vi.fn(async (path: string, options?: unknown) => { calls.push({ method: "GET", path, value: options }); return handlers.get ? handlers.get(path, options) : success({}); }),
    post: vi.fn(async (path: string, body?: unknown, options?: unknown) => { calls.push({ method: "POST", path, value: body }); return handlers.post ? handlers.post(path, body, options) : success(undefined); }),
    patch: vi.fn(async (path: string, body?: unknown, options?: unknown) => { calls.push({ method: "PATCH", path, value: body }); return handlers.patch ? handlers.patch(path, body, options) : success(undefined); }),
    delete: vi.fn(async (path: string, options?: unknown) => { calls.push({ method: "DELETE", path, value: options }); return handlers.delete ? handlers.delete(path, options) : success(undefined); }),
  } as unknown as JsonApiClient;
}

describe("Stage social API adapters", () => {
  it("selects For You and Following endpoints and maps PostDto media/counts", async () => {
    const calls: { method: string; path: string; value?: unknown }[] = [];
    const client = clientWith({ get: async () => success({ items: [requestPost], nextCursor: "next-page" }) }, calls);
    const services = createApiServices({ config, client });
    const result = await services.feed.list({ mode: "for-you", cursor: "cursor-1", limit: 12 });
    await services.feed.list({ mode: "following", cursor: "cursor-2", limit: 8 });
    expect(calls).toEqual([
      { method: "GET", path: "/feed/for-you", value: { query: { cursor: "cursor-1", limit: 12 } } },
      { method: "GET", path: "/feed/following", value: { query: { cursor: "cursor-2", limit: 8 } } },
    ]);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.nextCursor).toBe("next-page");
      expect(result.data.items[0]).toMatchObject({ id: "post-1", authorId: "user-1", authorName: "Amina Founder", authorUsername: "amina", authorAvatar: "https://cdn.test/amina.jpg", caption: "A useful update", location: "Nairobi", allowComments: true, media: "https://cdn.test/first.jpg", mediaItems: ["https://cdn.test/first.jpg", "https://cdn.test/second.jpg"], likes: 7, commentCount: 3, viewerHasLiked: true, poll: { id: "poll-1", question: "Which design?", totalVotes: 6, viewerVoteOptionId: "poll-a", isClosed: false, options: [{ id: "poll-a", text: "Blue", voteCount: 4 }, { id: "poll-b", text: "Green", voteCount: 2 }] } });
    }
  });

  it("uses the current-user posts route for the API self profile", async () => {
    const calls: { method: string; path: string; value?: unknown }[] = [];
    const client = clientWith({ get: async () => success({ items: [], nextCursor: null }) }, calls);
    const services = createApiServices({ config, client });
    await services.posts.listUserPosts("me", { limit: 10 });
    expect(calls[0]?.path).toBe("/posts");
  });

  it("maps PostDto creation payload to text/business/media contract and never sends local URI references", async () => {
    const calls: { method: string; path: string; value?: unknown }[] = [];
    const client = clientWith({ post: async () => success(requestPost) }, calls);
    const services = createApiServices({ config, client });
    const result = await services.posts.create({ kind: "image", caption: "A useful update", identityKind: "business", identityId: "business-9", businessId: "business-9", audience: "public", mediaReferences: [
      { mediaType: "image", url: "https://cdn.test/photo.jpg", altText: "A photo" },
      { mediaType: "image", url: "file:///private/photo.jpg" },
      { mediaType: "image", url: "content://media/3" },
      { mediaType: "video", url: "blob:https://app.test/clip" },
    ] });
    expect(result.ok).toBe(true);
    expect(calls[0]?.path).toBe("/posts");
    expect(calls[0]?.value).toMatchObject({ kind: "image", text: "A useful update", businessId: "business-9", audience: "public", discoverable: true, media: [{ mediaType: "image", url: "https://cdn.test/photo.jpg", altText: "A photo" }] });
    expect(JSON.stringify(calls[0]?.value)).not.toMatch(/file:|content:|blob:/i);
  });

  it("uses exact server-backed like and unlike routes and maps viewerLiked status", async () => {
    const calls: { method: string; path: string; value?: unknown }[] = [];
    const client = clientWith({ get: async () => success({ likeCount: 8, viewerLiked: true }) }, calls);
    const services = createApiServices({ config, client });
    await services.posts.like("post-1");
    const status = await services.posts.getLikeStatus("post-1");
    await services.posts.unlike("post-1");
    expect(calls.map(({ method, path }) => `${method} ${path}`)).toEqual(["POST /posts/post-1/likes", "GET /posts/post-1", "DELETE /posts/post-1/likes"]);
    expect(status).toMatchObject({ ok: true, data: { likeCount: 8, viewerHasLiked: true } });
  });

  it("maps comment and reply DTOs and uses cursor routes", async () => {
    const comment = { id: "comment-1", postId: "post-1", authorUserId: "user-2", parentCommentId: null, text: "Helpful", createdAt: "2026-11-12T11:00:00Z", updatedAt: "2026-11-12T11:00:00Z", replyCount: 1, authorName: "Brian Founder", authorUsername: "brian", authorAvatar: "https://cdn.test/brian.jpg" };
    const reply = { ...comment, id: "reply-1", parentCommentId: "comment-1", text: "Thanks" };
    const calls: { method: string; path: string; value?: unknown }[] = [];
    const client = clientWith({
      get: async (path) => success({ items: [path.includes("replies") ? reply : comment], nextCursor: null }),
      post: async (path) => success(path.includes("replies") ? reply : comment),
    }, calls);
    const services = createApiServices({ config, client });
    const listed = await services.posts.listComments("post-1", { cursor: "c-2", limit: 10 });
    const sent = await services.posts.comment("post-1", { text: "Helpful" });
    const replies = await services.posts.listReplies("comment-1", { limit: 10 });
    const sentReply = await services.posts.reply("post-1", "comment-1", { text: "Thanks" });
    expect(calls.map((item) => `${item.method} ${item.path}`)).toEqual([
      "GET /posts/post-1/comments", "POST /posts/post-1/comments", "GET /comments/comment-1/replies", "POST /comments/comment-1/replies",
    ]);
    expect(calls[0]?.value).toEqual({ query: { cursor: "c-2", limit: 10, search: undefined } });
    expect(listed).toMatchObject({ ok: true, data: { items: [{ userId: "user-2", parentCommentId: null, text: "Helpful", replyCount: 1 }] } });
    expect(sent.ok && sent.data.id).toBe("comment-1");
    expect(replies.ok && replies.data.items[0]?.parentCommentId).toBe("comment-1");
    expect(sentReply.ok && sentReply.data.id).toBe("reply-1");
  });

  it("votes via the polls route using one option and maps authoritative results", async () => {
    const poll = { id: "poll-1", postId: "post-1", question: "Pick", closesAt: "2026-11-13T00:00:00Z", isClosed: false, options: [{ id: "a", text: "A", votes: 4 }, { id: "b", text: "B", votes: 2 }], viewerOptionId: "a" };
    const calls: { method: string; path: string; value?: unknown }[] = [];
    const client = clientWith({ post: async () => success(poll) }, calls);
    const services = createApiServices({ config, client });
    const result = await services.posts.votePoll("poll-1", "a");
    expect(calls).toEqual([{ method: "POST", path: "/polls/poll-1/votes", value: { optionId: "a" } }]);
    expect(result).toMatchObject({ ok: true, data: { id: "poll-1", question: "Pick", totalVotes: 6, viewerVoteOptionId: "a", options: [{ id: "a", text: "A", voteCount: 4 }, { id: "b", text: "B", voteCount: 2 }] } });
  });

  it("maps follow status and offset-page user/business lists without losing counts or errors", async () => {
    const calls: { method: string; path: string; value?: unknown }[] = [];
    const profile = { userId: "user-2", username: "maya", name: "Maya", avatar: "https://cdn.test/maya.jpg", followedAt: "2026-11-12T10:00:00Z" };
    const client = clientWith({ get: async (path) => path.endsWith("/follow") ? success({ following: true, followerCount: 23 }) : success({ items: [profile], total: 41, page: 2, pageSize: 20 }) }, calls);
    const services = createApiServices({ config, client });
    const state = await services.users.getFollowStatus("user-2");
    const users = await services.users.listFollowers("me", { cursor: "20", limit: 20 });
    const following = await services.users.listFollowing("me", { cursor: "20", limit: 20 });
    const business = await services.businesses.listFollowers("biz-9", { cursor: "40", limit: 20 });
    expect(state).toMatchObject({ ok: true, data: { following: true, followerCount: 23 } });
    expect(users).toMatchObject({ ok: true, data: { total: 41, nextCursor: "40", items: [{ id: "user-2", username: "maya", name: "Maya", avatar: "https://cdn.test/maya.jpg" }] } });
    expect(following).toMatchObject({ ok: true, data: { total: 41, nextCursor: "40" } });
    expect(calls.map((call) => call.path)).toEqual(["/users/user-2/follow", "/users/me/followers", "/users/me/following", "/businesses/biz-9/followers"]);
    expect(calls[1]?.value).toEqual({ query: { page: 2, pageSize: 20 } });
    expect(calls[2]?.value).toEqual({ query: { page: 2, pageSize: 20 } });
    expect(calls[3]?.value).toEqual({ query: { page: 3, pageSize: 20 } });
  });

  it("returns moderation API errors unchanged instead of treating hide/block as successful", async () => {
    const failure: Result<never> = { ok: false, source: "api", requestId: "server-error", error: { code: "FORBIDDEN", message: "Moderation denied", retryable: false, status: 403 } };
    const calls: { method: string; path: string; value?: unknown }[] = [];
    const client = clientWith({ post: async () => failure, delete: async () => failure }, calls);
    const services = createApiServices({ config, client });
    const hidden = await services.moderation.hidePost("post-1");
    const blocked = await services.moderation.block("user-2");
    const unhidden = await services.moderation.unhidePost("post-1");
    expect(hidden).toEqual(failure);
    expect(blocked).toEqual(failure);
    expect(unhidden).toEqual(failure);
    expect(calls.map((call) => `${call.method} ${call.path}`)).toEqual([
      "POST /moderation/hidden-posts/post-1", "POST /moderation/blocks/user-2", "DELETE /moderation/hidden-posts/post-1",
    ]);
  });
});
