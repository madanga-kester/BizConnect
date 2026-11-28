import { describe, expect, it } from "vitest";
import { BUSINESSES, CURRENT_USER, PEOPLE, POSTS } from "@/data/seed";
import { createLocalSessionManager, isSessionExpiryValid } from "@/lib/auth/local-session";
import { validateLogin, validateRegistration } from "@/utils/form-validation";
import { isProtectedRoute } from "@/utils/auth-policy";
import { filterAndSortBusinesses } from "@/utils/discovery-filters";
import { createOwnedBusinessRecord, resolveManagedBusinessIdentity, updateBusinessRecord } from "@/utils/business-state";
import { evaluateMessagePermission, filterVisibleBusinesses, filterVisiblePosts, profileRestriction, toggleBlockRelationships } from "@/utils/privacy-policy";
import { classifyMediaSelectionFailure, mediaSelectionFeedback } from "@/utils/media-errors";
import { addCommentRecord, addReplyRecord, appendLocalMessage, appendReport, createConversationRecord, findActiveDuplicateReport, saveDraftRecord, toggleId } from "@/utils/social-state";
import type { Conversation, DraftPost, Post } from "@/types/domain";

const goodRegistration = { name: "Amani Wanjiku", username: "amani.builds", email: "amani@example.ke", phone: "+254 712 345 678", password: "LocalDemo123!", confirmPassword: "LocalDemo123!", interests: ["Food"] };

function memoryStorage() {
  let stored: string | null = null;
  return {
    storage: { getItem: async () => stored, setItem: async (value: string) => { stored = value; }, removeItem: async () => { stored = null; } },
    value: () => stored,
  };
}

describe("Mabiz demo authentication", () => {
  it("validates registration fields, Kenyan phone numbers and matching passwords", () => {
    expect(validateRegistration(goodRegistration).valid).toBe(true);
    const invalid = validateRegistration({ ...goodRegistration, username: "x", email: "bad", phone: "123", password: "short", confirmPassword: "different", interests: [] });
    expect(invalid.valid).toBe(false);
    expect(Object.keys(invalid.errors)).toEqual(expect.arrayContaining(["username", "email", "phone", "password", "confirmPassword", "interests"]));
  });

  it("accepts an email or a phone number and requires at least one", () => {
    expect(validateRegistration({ ...goodRegistration, phone: "" }).valid).toBe(true);
    expect(validateRegistration({ ...goodRegistration, email: "" }).valid).toBe(true);
    expect(validateRegistration({ ...goodRegistration, email: "", phone: "" }).valid).toBe(false);
  });

  it("validates login and guards private routes", () => {
    expect(validateLogin("amani@example.ke", "123456").valid).toBe(true);
    expect(validateLogin("", "123").valid).toBe(false);
    expect(isProtectedRoute(["messages", "abc"])).toBe(true);
    expect(isProtectedRoute(["(tabs)", "discover"])).toBe(false);
    expect(isProtectedRoute(["business", "[id]"])).toBe(false);
  });

  it("restores only an unexpired local session and clears it on logout", async () => {
    let now = 10_000;
    const memory = memoryStorage();
    const session = createLocalSessionManager(memory.storage, () => now, 1000);
    await session.open();
    expect(await session.isActive()).toBe(true);
    expect(isSessionExpiryValid(memory.value(), 10_999)).toBe(true);
    now = 11_000;
    expect(await session.isActive()).toBe(false);
    await session.close();
    expect(memory.value()).toBeNull();
    expect(await session.isActive()).toBe(false);
  });
});

describe("business management and discovery", () => {
  it("creates an owned business, edits only authorized records, and preserves other businesses", () => {
    const owned = BUSINESSES.find((business) => business.id === "b-tawi")!;
    const other = BUSINESSES.find((business) => business.id === "b-kivuli")!;
    const newBusiness = { ...owned, id: "b-test-new", name: "Test Workshop", products: [], services: [], milestones: [] };
    const created = createOwnedBusinessRecord([owned, other], newBusiness, CURRENT_USER.id, true);
    expect(created.changed).toBe(true);
    expect(created.businesses.map((item) => item.id)).toEqual(["b-test-new", "b-tawi", "b-kivuli"]);
    const edited = updateBusinessRecord(created.businesses, owned.id, { description: "Updated locally" }, CURRENT_USER.id);
    expect(edited.changed).toBe(true);
    expect(edited.businesses.find((item) => item.id === owned.id)?.products).toEqual(owned.products);
    expect(edited.businesses.find((item) => item.id === other.id)).toEqual(other);
    expect(updateBusinessRecord(edited.businesses, other.id, { name: "No access" }, CURRENT_USER.id).changed).toBe(false);
    expect(createOwnedBusinessRecord([], newBusiness, CURRENT_USER.id, false).changed).toBe(false);
  });

  it("switches among the user's businesses but never selects another owner's identity", () => {
    expect(resolveManagedBusinessIdentity(BUSINESSES, CURRENT_USER.id, "b-tawi")).toBe("b-tawi");
    expect(resolveManagedBusinessIdentity(BUSINESSES, CURRENT_USER.id, "b-kivuli")).toBeUndefined();
    expect(resolveManagedBusinessIdentity(BUSINESSES, CURRENT_USER.id, undefined)).toBeUndefined();
  });

  it("composes name, category, county, rating, followed and blocked-owner filters", () => {
    const result = filterAndSortBusinesses(BUSINESSES, { query: "digital", category: "Technology", county: "Nairobi", town: "Nairobi", minRating: 4.5, followedOnly: true, followedBusinessIds: ["b-tawi"] });
    expect(result.map((business) => business.id)).toEqual(["b-tawi"]);
    expect(filterAndSortBusinesses(BUSINESSES, { query: "no such business" })).toEqual([]);
    expect(filterAndSortBusinesses(BUSINESSES, { blockedUserIds: ["u-zawadi"] }).some((business) => business.ownerId === "u-zawadi")).toBe(false);
    expect(filterAndSortBusinesses(BUSINESSES, { sort: "A–Z business name" })[0]?.name).toBe("Asili Botanics");
    for (const priceLevel of ["KSh", "KSh KSh", "KSh KSh KSh"] as const) {
      const tierResults = filterAndSortBusinesses(BUSINESSES, { priceLevel });
      expect(tierResults.length).toBeGreaterThan(0);
      expect(tierResults.every((business) => business.priceRange === priceLevel)).toBe(true);
    }
    const followedUpperTier = filterAndSortBusinesses(BUSINESSES, { priceLevel: "KSh KSh KSh", followedOnly: true, followedBusinessIds: ["b-mbao", "b-tawi"] });
    expect(followedUpperTier.map((business) => business.id)).toEqual(["b-mbao"]);
  });
});

describe("social visibility, relationships and moderation", () => {
  it("keeps hidden and blocked-owner content out of every shared post selector", () => {
    const hidden = POSTS.find((post) => post.businessId === "b-mbao")!;
    const blockedBusinessPost = POSTS.find((post) => post.businessId === "b-kivuli")!;
    const visiblePost = POSTS.find((post) => post.businessId === "b-bahari")!;
    const visible = filterVisiblePosts([hidden, blockedBusinessPost, visiblePost], { viewerId: CURRENT_USER.id, people: PEOPLE, businesses: BUSINESSES, blockedUserIds: ["u-zawadi"], hiddenPostIds: [hidden.id], followedPeople: [] });
    expect(visible.map((post) => post.id)).toContain(visiblePost.id);
    expect(visible.map((post) => post.id)).not.toContain(hidden.id);
    expect(visible.map((post) => post.id)).not.toContain(blockedBusinessPost.id);
  });

  it("filters blocked business owners from every shared business selector", () => {
    const visible = filterVisibleBusinesses(BUSINESSES, ["u-zawadi"]);
    expect(visible.every((business) => business.ownerId !== "u-zawadi")).toBe(true);
    expect(visible.length).toBeLessThan(BUSINESSES.length);
  });

  it("respects private profile requests and blocked-message restrictions", () => {
    const privatePerson = { ...PEOPLE[1]!, privateProfile: true };
    expect(profileRestriction(privatePerson, CURRENT_USER.id, [], [])).toBe("private");
    expect(profileRestriction(privatePerson, CURRENT_USER.id, [privatePerson.id], [])).toBeUndefined();
    expect(profileRestriction(privatePerson, CURRENT_USER.id, [], [privatePerson.id])).toBe("blocked");
    const base = { isAuthenticated: true, participantId: "u-zawadi", businessId: "b-kivuli", businesses: BUSINESSES, blockedUserIds: [], messagePermissions: "following" as const, followedPeople: [], followedBusinesses: [] };
    expect(evaluateMessagePermission(base).reason).toBe("not_following");
    expect(evaluateMessagePermission({ ...base, followedBusinesses: ["b-kivuli"] }).allowed).toBe(true);
    expect(evaluateMessagePermission({ ...base, blockedUserIds: ["u-zawadi"], followedBusinesses: ["b-kivuli"] }).reason).toBe("blocked");
    expect(evaluateMessagePermission({ ...base, isAuthenticated: false }).reason).toBe("sign_in");
    expect(evaluateMessagePermission({ ...base, messagePermissions: "nobody" }).reason).toBe("nobody");
    expect(evaluateMessagePermission({ ...base, businessId: undefined, messagePermissions: "everyone", privateProfile: true }).reason).toBe("not_following");
    expect(evaluateMessagePermission({ ...base, businessId: undefined, messagePermissions: "everyone", privateProfile: true, followedPeople: ["u-zawadi"] }).allowed).toBe(true);
  });

  it("removes local follows and requests on block and leaves them removed after unblock", () => {
    const before = { blockedUserIds: [], followedPeople: ["u-zawadi"], followedBusinessIds: ["b-kivuli", "b-bahari"], pendingFollowRequests: ["u-zawadi"] };
    const blocked = toggleBlockRelationships(before, "u-zawadi", BUSINESSES);
    expect(blocked.blockedUserIds).toContain("u-zawadi");
    expect(blocked.followedPeople).not.toContain("u-zawadi");
    expect(blocked.followedBusinessIds).not.toContain("b-kivuli");
    expect(blocked.pendingFollowRequests).not.toContain("u-zawadi");
    const unblocked = toggleBlockRelationships(blocked, "u-zawadi", BUSINESSES);
    expect(unblocked.blockedUserIds).not.toContain("u-zawadi");
    expect(unblocked.followedPeople).not.toContain("u-zawadi");
    expect(unblocked.followedBusinessIds).not.toContain("b-kivuli");
  });

  it("toggles follow/like/save ids without duplicates and creates comments/replies", () => {
    expect(toggleId([], "b-tawi")).toEqual(["b-tawi"]);
    expect(toggleId(["b-tawi"], "b-tawi")).toEqual([]);
    expect(toggleId(["b-tawi"], "b-tawi").filter((id) => id === "b-tawi")).toHaveLength(0);
    const post = POSTS[0]!;
    const comment = { id: "c-test", userId: CURRENT_USER.id, text: "Helpful note", createdAt: "2026-11-09T00:00:00Z", replies: [] };
    const withComment = addCommentRecord([post], post.id, comment);
    expect(withComment[0]?.comments).toContainEqual(comment);
    const withReply = addReplyRecord(withComment, post.id, comment.id, { id: "r-test", userId: CURRENT_USER.id, text: "Thanks", createdAt: "2026-11-09T00:01:00Z" });
    expect(withReply[0]?.comments.find((item) => item.id === comment.id)?.replies).toHaveLength(1);
  });

  it("edits drafts by stable id and prevents duplicate active reports", () => {
    const draft: DraftPost = { id: "d-1", kind: "text", caption: "First", identityId: CURRENT_USER.id, updatedAt: "2026-01-01" };
    const edited = saveDraftRecord(saveDraftRecord([], draft), { ...draft, caption: "Edited", updatedAt: "2026-01-02" });
    expect(edited).toHaveLength(1);
    expect(edited[0]?.caption).toBe("Edited");
    const report = { id: "r-1", target: "post:p1", reason: "Spam", details: "", status: "submitted" as const, createdAt: "2026-01-01" };
    const first = appendReport([], report);
    const duplicate = appendReport(first.reports, { ...report, id: "r-2" });
    expect(first.created).toBe(true);
    expect(duplicate.created).toBe(false);
    expect(findActiveDuplicateReport(duplicate.reports, "post:p1", "Spam")?.id).toBe("r-1");
    expect(appendReport([{ ...report, status: "closed" }], { ...report, id: "r-3" }).created).toBe(true);
  });
});

describe("content, media and messaging", () => {

  it("classifies media picker permission and failure states while keeping cancellation silent", () => {
    expect(classifyMediaSelectionFailure({ code: "E_PERMISSION_DENIED" })).toBe("permission");
    expect(classifyMediaSelectionFailure(new Error("Native picker unavailable"))).toBe("unavailable");
    expect(classifyMediaSelectionFailure("cancelled by user")).toBe("cancelled");
    expect(mediaSelectionFeedback("cancelled")).toBeUndefined();
    expect(mediaSelectionFeedback({ message: "permission denied" }, "photo")?.title).toBe("Permission needed");
  });

  it("reuses conversations, records local messages and never calls them delivered", () => {
    const input = { participantId: "u-zawadi", participantName: "Zawadi", businessId: "b-kivuli" };
    const started = createConversationRecord([], input, "conv-1", "2026-11-09T00:00:00Z");
    const duplicate = createConversationRecord(started.conversations, input, "conv-2", "2026-11-09T00:01:00Z");
    expect(started.conversationId).toBe("conv-1");
    expect(duplicate.conversationId).toBe("conv-1");
    expect(duplicate.created).toBe(false);
    const message = { id: "m-1", senderId: CURRENT_USER.id, text: "Hello", createdAt: "2026-11-09T00:02:00Z", status: "sent" as const };
    const sent = appendLocalMessage(started.conversations, "conv-1", message, message.createdAt);
    expect(sent[0]?.messages[0]?.status).toBe("sent");
    expect(sent[0]?.messages[0]?.status).not.toBe("delivered");
  });
});
