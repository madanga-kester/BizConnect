import type { ContentKind, IdentityKind, Post } from "@/types/domain";

export interface ComposePostInput {
  id: string;
  authorId: string;
  identityKind: IdentityKind;
  identityId: string;
  kind: ContentKind;
  caption: string;
  media?: string;
  location: string;
  businessId?: string;
  businessTags?: string[];
  productId?: string;
  createdAt: string;
}

export function validateComposePost(input: Pick<ComposePostInput, "kind" | "caption" | "media" | "productId">): string | undefined {
  if (input.caption.trim().length < 4) return "Write a caption of at least 4 characters.";
  if ((input.kind === "image" || input.kind === "video") && !input.media) return "Select a photo or video before publishing this post.";
  if (input.kind === "product" && !input.productId) return "Choose a catalogue product before publishing a product showcase.";
  return undefined;
}

export function extractHashtags(caption: string): string[] {
  return [...caption.matchAll(/#([\p{L}\p{N}_]+)/gu)].map((match) => match[1]).filter(Boolean);
}

export function extractMentions(caption: string): string[] {
  return [...caption.matchAll(/@([\p{L}\p{N}_.]+)/gu)].map((match) => match[1]).filter(Boolean);
}

export function createPostFromComposer(input: ComposePostInput): Post {
  return {
    id: input.id,
    authorId: input.authorId,
    identityKind: input.identityKind,
    identityId: input.identityId,
    kind: input.kind,
    caption: input.caption.trim(),
    media: input.media,
    video: input.kind === "video",
    location: input.location.trim(),
    createdAt: input.createdAt,
    likes: 0,
    comments: [],
    businessId: input.businessId,
    businessTags: input.businessTags ?? [],
    productId: input.productId,
    hashtags: extractHashtags(input.caption),
    mentions: extractMentions(input.caption),
  };
}
