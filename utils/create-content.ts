import type { Post, SocialStory } from "@/types/domain";
import type { PersistedComposerDraft, PostComposerSnapshot, StoryComposerSnapshot } from "@/types/create-studio";

export type ContentSort = "newest" | "oldest" | "name";
export interface ContentIndexItem {
  id: string;
  kind: string;
  title: string;
  preview: string;
  status: string;
  updatedAt: string;
  identity: string;
}

/** Parse a local datetime-local value strictly enough to reject malformed or past schedules. */
export function isFutureSchedule(value: string, now = Date.now()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return false;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) && timestamp > now;
}

export function filterContentIndex<T extends ContentIndexItem>(items: T[], query: string, kind: string, sort: ContentSort): T[] {
  const needle = query.trim().toLocaleLowerCase("en-KE");
  const filtered = items.filter((item) => (kind === "All" || item.kind === kind) && (!needle || `${item.title} ${item.preview} ${item.identity} ${item.status}`.toLocaleLowerCase("en-KE").includes(needle)));
  return [...filtered].sort((a, b) => sort === "name"
    ? a.title.localeCompare(b.title, "en-KE")
    : sort === "oldest"
      ? Date.parse(a.updatedAt) - Date.parse(b.updatedAt)
      : Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export function draftFromPost(post: Post, id: string, now = Date.now()): PersistedComposerDraft {
  const pollHours = post.poll ? Math.ceil((Date.parse(post.poll.endsAt) - now) / 3_600_000) : 24;
  const snapshot: PostComposerSnapshot = {
    kind: post.kind,
    contentSubtype: post.contentSubtype,
    caption: post.caption,
    media: post.mediaItems?.[0] ?? post.media,
    mediaItems: post.mediaItems?.length ? [...post.mediaItems] : post.media ? [post.media] : [],
    identityId: post.identityId,
    businessTags: [...(post.businessTags ?? [])],
    productId: post.productId,
    location: post.location,
    pollQuestion: post.poll?.question ?? "",
    pollOptions: post.poll?.options.map((option) => option.text) ?? ["", ""],
    pollDurationHours: String(Math.max(1, Math.min(168, Number.isFinite(pollHours) ? pollHours : 24))),
    pollMultipleChoice: post.poll?.multipleChoice ?? false,
    audience: post.audience ?? "public",
    allowComments: post.allowComments ?? true,
    allowSharing: post.allowSharing ?? true,
    founderPrompt: post.kind === "story" ? post.caption.split(":", 1)[0] : "How I started",
    videoSubtitles: post.videoSubtitles ?? "",
    mediaTextOverlay: post.mediaTextOverlay ?? "",
  };
  return { id, kind: post.kind, caption: post.caption, media: snapshot.media, mediaItems: snapshot.mediaItems, identityId: post.identityId, businessTags: snapshot.businessTags, productId: post.productId, location: post.location, updatedAt: new Date(now).toISOString(), draftType: "post", composer: { version: 1, mode: "post", post: snapshot } };
}

export function draftFromSocialStory(story: SocialStory, id: string, now = Date.now()): PersistedComposerDraft {
  const overlay = (kind: string) => story.overlays.find((item) => item.kind === kind)?.text ?? "";
  const snapshot: StoryComposerSnapshot = {
    caption: story.caption,
    identityId: story.identityId,
    media: [...story.mediaItems],
    mediaKind: story.mediaKind ?? "image",
    overlayText: overlay("text"),
    emoji: overlay("emoji"),
    location: overlay("location"),
    mention: overlay("mention"),
    question: story.question ?? overlay("question"),
    pollQuestion: story.poll?.question ?? "",
    pollOptions: story.poll?.options.join("\n") ?? "",
    link: story.link ?? "",
    audience: story.audience,
    background: story.backgroundColor ?? story.background ?? "#123B42",
    textColor: story.textColor ?? "#FFFFFF",
    fontStyle: story.fontStyle ?? "modern",
    overlayX: story.overlays[0]?.x ?? 0.5,
    overlayY: story.overlays[0]?.y ?? 0.5,
    musicTrack: story.musicTrack ?? "No audio",
  };
  return { id, kind: "story", caption: story.caption, media: snapshot.media[0], mediaItems: [...snapshot.media], identityId: story.identityId, businessTags: [], location: snapshot.location, updatedAt: new Date(now).toISOString(), draftType: "social-story", composer: { version: 1, mode: "social-story", story: snapshot } };
}
