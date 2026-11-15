import type { SocialStory } from "@/types/domain";

export interface SocialStoryVisibilityContext {
  viewerId: string;
  followedUserIds: string[];
  followedBusinessIds: string[];
  blockedUserIds: string[];
  businessOwnerId?: string;
}

export function canViewSocialStory(story: SocialStory, context: SocialStoryVisibilityContext): boolean {
  if (context.blockedUserIds.includes(story.authorId) || (context.businessOwnerId && context.blockedUserIds.includes(context.businessOwnerId))) return false;
  if (story.authorId === context.viewerId) return true;
  if (story.audience === "private") return false;
  if (story.audience === "followers") {
    return story.identityKind === "business"
      ? context.followedBusinessIds.includes(story.identityId)
      : context.followedUserIds.includes(story.authorId);
  }
  return true;
}
