import type { ContentAudience, ContentKind, DraftPost, Post, SocialStory, StoryHighlight } from "@/types/domain";

/** A full, versioned, device-local snapshot for restoring the existing composer. */
export interface PostComposerSnapshot {
  kind: ContentKind;
  contentSubtype?: string;
  caption: string;
  media?: string;
  mediaItems: string[];
  identityId: string;
  businessTags: string[];
  productId?: string;
  serviceId?: string;
  location: string;
  pollQuestion: string;
  pollOptions: string[];
  pollDurationHours: string;
  pollMultipleChoice: boolean;
  audience: ContentAudience;
  allowComments: boolean;
  allowSharing: boolean;
  founderPrompt: string;
  videoSubtitles: string;
  mediaTextOverlay: string;
  videoDurationSeconds?: number;
  scheduleAt?: string;
}

export interface StoryComposerSnapshot {
  caption: string;
  identityId: string;
  media: string[];
  mediaKind: "image" | "video";
  overlayText: string;
  emoji?: string;
  location: string;
  mention: string;
  question: string;
  pollQuestion: string;
  pollOptions: string;
  link: string;
  audience: ContentAudience;
  background: string;
  textColor: string;
  fontStyle: "modern" | "serif" | "bold" | "handwritten";
  overlayX: number;
  overlayY: number;
  musicTrack: string;
  /** Local target collection used only when publishing from a Highlight editor. */
  highlightId?: string;
}

export interface ComposerSnapshot {
  version: 1;
  mode: "post" | "social-story";
  post?: PostComposerSnapshot;
  story?: StoryComposerSnapshot;
}

export interface PersistedComposerDraft extends DraftPost {
  composer?: ComposerSnapshot;
  draftType?: "post" | "social-story";
}

export interface ScheduledDemoPost extends Post {
  /** Display-only future timestamp; no background scheduler or server delivery exists. */
  scheduledAt: string;
}

export interface EnhancedSocialStory extends SocialStory {
  background?: string;
  backgroundColor?: string;
  textColor?: string;
  fontStyle?: "modern" | "serif" | "bold" | "handwritten";
  musicTrack?: string;
  demoViewerIds?: string[];
}

export interface EnhancedStoryHighlight extends StoryHighlight {
  /** Display-order metadata for the owner-managed local Highlight rail. */
  order?: number;
}

export interface LocalStoryResponse {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
}
