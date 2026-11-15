import type { Business, Post, UserProfile } from "@/types/domain";

export type MessagePermission = "everyone" | "following" | "nobody";
export type ProfileRestriction = "blocked" | "private";

export interface PostVisibilityContext {
  viewerId: string;
  people: UserProfile[];
  businesses: Business[];
  blockedUserIds: readonly string[];
  hiddenPostIds: readonly string[];
  followedPeople: readonly string[];
  followedBusinessIds?: readonly string[];
}

export interface MessagePolicyInput {
  isAuthenticated: boolean;
  participantId: string;
  privateProfile?: boolean;
  businessId?: string;
  businesses: Business[];
  blockedUserIds: readonly string[];
  messagePermissions: MessagePermission;
  followedPeople: readonly string[];
  followedBusinesses: readonly string[];
}

export function profileRestriction(
  profile: UserProfile,
  viewerId: string,
  followedPeople: readonly string[],
  blockedUserIds: readonly string[],
): ProfileRestriction | undefined {
  if (profile.id !== viewerId && blockedUserIds.includes(profile.id)) return "blocked";
  if (profile.id !== viewerId && profile.privateProfile && !followedPeople.includes(profile.id)) return "private";
  return undefined;
}

export function isPostVisible(post: Post, context: PostVisibilityContext): boolean {
  if (context.hiddenPostIds.includes(post.id)) return false;
  if (context.blockedUserIds.includes(post.authorId)) return false;
  if (post.audience === "private" && post.authorId !== context.viewerId) return false;
  if (post.audience === "followers" && post.authorId !== context.viewerId) {
    const followedBusiness = post.identityKind === "business" && (context.followedBusinessIds ?? []).includes(post.identityId);
    if (!followedBusiness && !context.followedPeople.includes(post.authorId)) return false;
  }

  const businessId = post.businessId ?? (post.identityKind === "business" ? post.identityId : undefined);
  const business = businessId ? context.businesses.find((item) => item.id === businessId) : undefined;
  if (business && context.blockedUserIds.includes(business.ownerId)) return false;

  if (post.identityKind === "personal" && post.authorId !== context.viewerId) {
    const author = context.people.find((item) => item.id === post.authorId);
    if (author && profileRestriction(author, context.viewerId, context.followedPeople, context.blockedUserIds)) return false;
  }
  return true;
}

export function filterVisiblePosts(posts: Post[], context: PostVisibilityContext): Post[] {
  return posts.filter((post) => isPostVisible(post, context));
}

export function filterVisibleBusinesses(businesses: Business[], blockedUserIds: readonly string[]): Business[] {
  return businesses.filter((business) => !blockedUserIds.includes(business.ownerId));
}

export function evaluateMessagePermission(input: MessagePolicyInput): { allowed: boolean; reason?: "sign_in" | "blocked" | "nobody" | "not_following" } {
  if (!input.isAuthenticated) return { allowed: false, reason: "sign_in" };
  const business = input.businessId ? input.businesses.find((item) => item.id === input.businessId) : undefined;
  if (input.blockedUserIds.includes(input.participantId) || (business && input.blockedUserIds.includes(business.ownerId))) {
    return { allowed: false, reason: "blocked" };
  }
  if (input.messagePermissions === "nobody") return { allowed: false, reason: "nobody" };
  if (input.privateProfile && !input.followedPeople.includes(input.participantId)) {
    return { allowed: false, reason: "not_following" };
  }
  if (input.messagePermissions === "following") {
    const followsPerson = input.followedPeople.includes(input.participantId);
    const followsBusiness = Boolean(input.businessId && input.followedBusinesses.includes(input.businessId));
    if (!followsPerson && !followsBusiness) return { allowed: false, reason: "not_following" };
  }
  return { allowed: true };
}

export interface BlockRelationshipState {
  blockedUserIds: string[];
  followedPeople: string[];
  followedBusinessIds: string[];
  pendingFollowRequests: string[];
}

export function toggleBlockRelationships(
  state: BlockRelationshipState,
  targetUserId: string,
  businesses: Pick<Business, "id" | "ownerId">[],
): BlockRelationshipState {
  const currentlyBlocked = state.blockedUserIds.includes(targetUserId);
  return {
    blockedUserIds: currentlyBlocked ? state.blockedUserIds.filter((id) => id !== targetUserId) : [...state.blockedUserIds, targetUserId],
    followedPeople: currentlyBlocked ? state.followedPeople : state.followedPeople.filter((id) => id !== targetUserId),
    followedBusinessIds: currentlyBlocked ? state.followedBusinessIds : state.followedBusinessIds.filter((id) => businesses.find((business) => business.id === id)?.ownerId !== targetUserId),
    pendingFollowRequests: currentlyBlocked ? state.pendingFollowRequests : state.pendingFollowRequests.filter((id) => id !== targetUserId),
  };
}
