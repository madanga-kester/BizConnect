import { describe, expect, it } from "vitest";
import { canViewSocialStory } from "@/utils/social-story-privacy";
import type { SocialStory } from "@/types/domain";

const story: SocialStory = {
  id: "story-1", authorId: "author-1", identityKind: "personal", identityId: "author-1",
  caption: "A demo Story", mediaItems: [], overlays: [], audience: "public",
  createdAt: "2026-11-11T10:00:00.000Z", expiresAt: "2026-11-12T10:00:00.000Z",
};
const viewer = { viewerId: "viewer-1", followedUserIds: [], followedBusinessIds: [], blockedUserIds: [] };

describe("Social Story audience policy", () => {
  it("allows public Stories and the author's own private Stories", () => {
    expect(canViewSocialStory(story, viewer)).toBe(true);
    expect(canViewSocialStory({ ...story, audience: "private" }, { ...viewer, viewerId: story.authorId })).toBe(true);
  });

  it("restricts follower-only and private Stories", () => {
    expect(canViewSocialStory({ ...story, audience: "followers" }, viewer)).toBe(false);
    expect(canViewSocialStory({ ...story, audience: "followers" }, { ...viewer, followedUserIds: [story.authorId] })).toBe(true);
    expect(canViewSocialStory({ ...story, audience: "private" }, { ...viewer, followedUserIds: [story.authorId] })).toBe(false);
  });

  it("uses business follows and rejects blocked authors or business owners", () => {
    const businessStory = { ...story, identityKind: "business" as const, identityId: "business-1", audience: "followers" as const };
    expect(canViewSocialStory(businessStory, { ...viewer, followedBusinessIds: ["business-1"] })).toBe(true);
    expect(canViewSocialStory(story, { ...viewer, blockedUserIds: [story.authorId] })).toBe(false);
    expect(canViewSocialStory(businessStory, { ...viewer, businessOwnerId: "owner-1", blockedUserIds: ["owner-1"] })).toBe(false);
  });
});
