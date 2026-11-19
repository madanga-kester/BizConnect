import type { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

export type ProfileTab = "all" | "videos" | "reshared" | "saved";

export const PROFILE_TABS: { key: ProfileTab; icon: ComponentProps<typeof Ionicons>["name"]; label: string }[] = [
  { key: "all", icon: "grid-outline", label: "All posts" },
  { key: "videos", icon: "play-circle-outline", label: "Videos" },
  { key: "reshared", icon: "repeat-outline", label: "Reshared" },
  { key: "saved", icon: "bookmark-outline", label: "Saved" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LoosePost = Record<string, any>;
export const mediaListOf = (p: LoosePost): LoosePost[] => p.mediaReferences ?? p.media ?? [];
export const postIsVideo = (p: LoosePost) =>
  p.kind === "video" || p.mediaType === "video" || mediaListOf(p).some((m) => m.mediaType === "video");
export const postIsReshared = (p: LoosePost) =>
  Boolean(p.resharedFromId || p.originalPostId || p.isReshare || p.reshared || p.kind === "reshare");
export const postThumb = (p: LoosePost): string | undefined => {
  const first = mediaListOf(p).find((m) => m.mediaType !== "video") ?? mediaListOf(p)[0];
  return p.thumbnail ?? p.image ?? p.imageUrl ?? first?.thumbnailUrl ?? first?.url ?? first?.uri;
};