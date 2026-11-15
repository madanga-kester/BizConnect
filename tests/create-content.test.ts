import { describe, expect, it } from "vitest";
import { draftFromSocialStory, filterContentIndex, isFutureSchedule, type ContentIndexItem } from "@/utils/create-content";
import type { SocialStory } from "@/types/domain";

const records: ContentIndexItem[] = [
  { id: "p-1", kind: "Post", title: "Nairobi launch", preview: "New products in Kenya", status: "Published", updatedAt: "2026-01-02T00:00:00Z", identity: "Amani" },
  { id: "s-1", kind: "Story", title: "Behind the scenes", preview: "Our Mombasa workshop", status: "Active", updatedAt: "2026-01-03T00:00:00Z", identity: "Kivuli Studio" },
  { id: "d-1", kind: "Draft", title: "New service", preview: "Draft for Kisumu", status: "Draft", updatedAt: "2026-01-01T00:00:00Z", identity: "Amani" },
];

describe("Create content index", () => {
  it("preserves emoji stickers when a Story is duplicated into a local draft", () => {
    const story: SocialStory = {
      id: "story-emoji", authorId: "user-1", identityKind: "personal", identityId: "user-1", caption: "A small win",
      mediaItems: [], mediaKind: "image", overlays: [{ id: "emoji", text: "✨", kind: "emoji", x: 0.5, y: 0.5 }],
      audience: "public", createdAt: "2026-11-12T10:00:00.000Z", expiresAt: "2026-11-13T10:00:00.000Z",
    };
    expect(draftFromSocialStory(story, "story-draft-emoji").composer?.story?.emoji).toBe("✨");
  });

  it("accepts only a valid future local datetime", () => {
    const now = new Date("2026-03-04T10:00:00").getTime();
    expect(isFutureSchedule("2026-03-04T10:01", now)).toBe(true);
    expect(isFutureSchedule("2026-03-04T10:00", now)).toBe(false);
    expect(isFutureSchedule("2026-02-30T10:00", now)).toBe(false);
    expect(isFutureSchedule("tomorrow", now)).toBe(false);
    expect(isFutureSchedule("2026-03-05", now)).toBe(false);
  });

  it("filters by category and across title, preview and identity", () => {
    expect(filterContentIndex(records, "mombasa", "All", "newest").map((item) => item.id)).toEqual(["s-1"]);
    expect(filterContentIndex(records, "nairobi", "Post", "newest").map((item) => item.id)).toEqual(["p-1"]);
    expect(filterContentIndex(records, "new", "Draft", "newest").map((item) => item.id)).toEqual(["d-1"]);
  });

  it("sorts without mutating the original input", () => {
    expect(filterContentIndex(records, "", "All", "newest").map((item) => item.id)).toEqual(["s-1", "p-1", "d-1"]);
    expect(filterContentIndex(records, "", "All", "oldest").map((item) => item.id)).toEqual(["d-1", "p-1", "s-1"]);
    expect(filterContentIndex(records, "", "All", "name").map((item) => item.title)).toEqual(["Behind the scenes", "Nairobi launch", "New service"]);
    expect(records.map((item) => item.id)).toEqual(["p-1", "s-1", "d-1"]);
  });
});
