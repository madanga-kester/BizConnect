import { BUSINESSES, CURRENT_USER, NOTIFICATIONS, OPPORTUNITIES, PEOPLE, POSTS, STORIES } from "@/data/seed";
import type { ApiError, PageRequest, PageResponse, Result } from "@/lib/api/contracts";
import type {
  AuthSession,
  BizConnectServices,
  BusinessCreateInput,
  BusinessActivityRecord,
  BusinessFilters,
  BusinessInvitation,
  CommentInput,
  DataDeletionRequest,
  CatalogDiscoveryFilters,
  CatalogGalleryEntry,
  CatalogStatusFilter,
  ExportJob,
  FeedFilters,
  FollowRequestRecord,
  MediaFileInput,
  MediaUploadProgress,
  NotificationPreferences,
  PostCreateInput,
  PostUpdateInput,
  ProfileUpdate,
  RegistrationRequest,
  SearchEntityType,
  SearchHit,
  SearchQuery,
  SocialStoryCreateInput,
  SendMessageInput,
  StartConversationInput,
  OwnershipTransfer,
  BusinessGrowthSummary, BusinessGrowthAnalytics, BusinessReview, GrowthDateRange, GrowthActivity,
} from "@/lib/api/feature-contracts";
import type {
  AppSettings,
  Business,
  BusinessAnalytics,
  BusinessEvent,
  BusinessOffer,
  BusinessTeamMember,
  ChatMessage,
  CommentReply,
  Conversation,
  CommunityOpportunity,
  FounderStory,
  Milestone,
  NotificationItem,
  Opportunity,
  Post,
  PostComment,
  Poll,
  Product,
  Service,
  SocialStory,
  StoryHighlight,
  UserProfile,
  VerificationRequest,
} from "@/types/domain";
import type { CatalogGalleryImage } from "@/types/domain";
import { MAX_CATALOGUE_GALLERY_IMAGES } from "@/lib/api/catalog-media";
import { canViewSocialStory } from "@/utils/social-story-privacy";
import { getBusinessOfferStatus, isBusinessOfferDateRangeValid } from "@/utils/business-offer-status";

const clone = <T,>(value: T): T => value === undefined ? value : JSON.parse(JSON.stringify(value)) as T;
let nextId = 1;
const id = (kind: string) => `local-${kind}-${(nextId++).toString(36)}`;
const requestId = () => `local-${Date.now().toString(36)}-${(nextId++).toString(36)}`;

function ok<T>(data: T): Result<T> {
  return { ok: true, data: clone(data), source: "mock-local", requestId: requestId() };
}
function fail<T>(code: string, message: string, retryable = false): Result<T> {
  const id = requestId();
  const error: ApiError = { code, message, retryable, requestId: id };
  return { ok: false, error, source: "mock-local", requestId: id };
}
function page<T>(items: T[], request: PageRequest): PageResponse<T> {
  const limit = Math.min(30, Math.max(1, Math.floor(request.limit || 10)));
  const start = Math.max(0, Number.parseInt(request.cursor ?? "0", 10) || 0);
  const selected = items.slice(start, start + limit);
  const next = start + selected.length;
  return { items: clone(selected), total: items.length, ...(next < items.length ? { nextCursor: String(next) } : {}) };
}
function bySearch<T>(items: T[], request: PageRequest, text: (item: T) => string): T[] {
  const query = request.search?.trim().toLocaleLowerCase();
  return query ? items.filter((item) => text(item).toLocaleLowerCase().includes(query)) : items;
}
function pageResult<T>(items: T[], request: PageRequest): Result<PageResponse<T>> { return ok(page(items, request)); }
function notFound<T>(label: string): Result<T> { return fail("NOT_FOUND", `${label} was not found.`); }
function now(): string { return new Date().toISOString(); }
const usernameSlug = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "") || "new.member";

export interface MockServicesOptions {
  currentUserId?: string;
  socialStories?: SocialStory[];
}

/** In-memory, deterministic fixtures. No mock method makes an HTTP request or persists a server claim. */
export function createMockServices(options: MockServicesOptions = {}): BizConnectServices {
  let users = clone(PEOPLE);
  let businesses = clone(BUSINESSES);
  let posts = clone(POSTS);
  let stories = clone(STORIES);
  let socialStoryRecords: SocialStory[] = clone(options.socialStories ?? []);
  let storyHighlights: StoryHighlight[] = [];
  let businessOffers: BusinessOffer[] = [];
  let businessEvents: BusinessEvent[] = [];
  let communityOpportunityRecords: CommunityOpportunity[] = [];
  let opportunities = clone(OPPORTUNITIES);
  let notifications = clone(NOTIFICATIONS);
  let conversations: Conversation[] = [];
  let verificationRequests: VerificationRequest[] = [];
  let followRequests: FollowRequestRecord[] = [];
  let searchHistory: { id: string; query: string; createdAt: string }[] = [];
  let recentlyViewed: { id: string; entityId: string; type: "business" | "product" | "service" | "story"; viewedAt: string }[] = [];
  let deletionRequest: DataDeletionRequest | null = null;
  let appPreferences: AppSettings = { language: "en", appearance: "light", reducedData: false, autoplayVideos: false, messagePermissions: "following", hidePreciseLocation: true, privateProfile: false, notifications: true };
  const savedPosts = new Set<string>();
  const savedStories = new Set<string>();
  const savedOpportunities = new Set<string>();
  const savedProducts = new Set<string>();
  const followedUsers = new Set<string>();
  const followedBusinesses = new Set<string>();
  const likedPosts = new Set<string>();
  const blockedUsers = new Set<string>();
  const hiddenPosts = new Set<string>();
  const readMessageIds = new Set<string>();
  let notificationPreferences: NotificationPreferences = { inAppEnabled: true, pushEnabled: false, likes: true, comments: true, follows: true, messages: true, businessTeamActivity: true, businessUpdates: true };
  const currentUserId = options.currentUserId ?? CURRENT_USER.id;
  const currentUser = () => users.find((user) => user.id === currentUserId) ?? users[0] ?? clone(CURRENT_USER);
  const findBusiness = (businessId: string) => businesses.find((item) => item.id === businessId);
  const canManageBusiness = (businessId: string) => Boolean(findBusiness(businessId)?.team.some((member) => member.userId === currentUserId));
  const canReadSocialStory = (story: SocialStory) => new Date(story.expiresAt).getTime() > Date.now() && canViewSocialStory(story, {
    viewerId: currentUserId,
    followedUserIds: users.filter((user) => followedUsers.has(`${currentUserId}:${user.id}`)).map((user) => user.id),
    followedBusinessIds: [...followedBusinesses],
    blockedUserIds: [...blockedUsers],
    businessOwnerId: story.identityKind === "business" ? findBusiness(story.identityId)?.ownerId : undefined,
  });
  const findPost = (postId: string) => posts.find((item) => item.id === postId);
  const findProduct = (businessId: string, productId: string) => findBusiness(businessId)?.products.find((item) => item.id === productId);
  const findService = (businessId: string, serviceId: string) => findBusiness(businessId)?.services.find((item) => item.id === serviceId);
  const localOnly = <T,>(feature: string): Result<T> => fail("LOCAL_ONLY", `${feature} requires a reviewed backend; nothing was sent or processed.`);
  // Stage 5 lifecycle and gallery semantics are simulated in memory only: nothing is uploaded or published to a server.
  const localLifecycle = (status: CatalogStatusFilter) => ({
    status,
    archived: status === "archived",
    ...(status === "published" ? { publishedAt: now() } : {}),
    updatedAt: now(),
  });
  const localGallery = (gallery: CatalogGalleryEntry[], urls: string[]): CatalogGalleryImage[] => gallery
    .map((entry) => ({ mediaAssetId: entry.mediaAssetId?.trim() ?? "", altText: entry.altText?.trim() ?? "" }))
    .filter((entry) => entry.mediaAssetId)
    .slice(0, MAX_CATALOGUE_GALLERY_IMAGES)
    .map((entry, index) => ({
      mediaAssetId: entry.mediaAssetId,
      url: urls[index] ?? "",
      sortOrder: index,
      altText: entry.altText,
      contentType: "image/jpeg",
      sizeBytes: 0,
      widthPx: null,
      heightPx: null,
      provider: "local" as const,
    }));
  const publicBusinesses = () => businesses.filter((business) => business.visibility !== "private");
  const visibleLocalProducts = (filters?: CatalogDiscoveryFilters) => publicBusinesses()
    .flatMap((business) => business.products)
    .filter((item) => !item.archived)
    .filter((item) => !filters?.category || item.category.toLowerCase().includes(filters.category.toLowerCase()))
    .filter((item) => filters?.minPrice === undefined || item.price >= filters.minPrice)
    .filter((item) => filters?.maxPrice === undefined || item.price <= filters.maxPrice);
  const visibleLocalServices = (filters?: CatalogDiscoveryFilters) => publicBusinesses()
    .flatMap((business) => business.services)
    .filter((item) => !item.archived)
    .filter((item) => !filters?.category || item.category.toLowerCase().includes(filters.category.toLowerCase()));

  const auth: BizConnectServices["auth"] = {
    async register(input: RegistrationRequest) {
      if (!input.username.trim() || !input.password) return fail("VALIDATION_ERROR", "Enter a username and password.");
      if (users.some((user) => user.username.toLowerCase() === usernameSlug(input.username))) return fail("USERNAME_TAKEN", "That username is already in the local demo.");
      const user: UserProfile = { id: id("user"), name: input.name.trim(), username: usernameSlug(input.username), ...(input.email ? { email: input.email.trim() } : {}), ...(input.phone ? { phone: input.phone.trim() } : {}), bio: "", county: input.county, town: input.town, interests: clone(input.interests), privateProfile: false, followers: 0, following: 0, ...(input.avatar ? { avatar: input.avatar } : {}) };
      users = [user, ...users];
      return ok(user);
    },
    async login(input) {
      if (!input.identifier.trim() || !input.password) return fail("VALIDATION_ERROR", "Enter your email, phone or username and password.");
      const normalized = input.identifier.trim().toLowerCase();
      const user = users.find((item) => item.username.toLowerCase() === normalized || item.email?.toLowerCase() === normalized || item.phone === input.identifier.trim()) ?? currentUser();
      const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
      const session: AuthSession = { user, accessToken: `mock-local:${user.id}`, refreshToken: `mock-local-refresh:${user.id}`, expiresAt };
      return ok(session);
    },
    async refresh(refreshToken) {
      if (!refreshToken?.startsWith("mock-local-refresh:")) return fail("SESSION_EXPIRED", "The local demo session is unavailable.");
      const user = users.find((item) => `mock-local-refresh:${item.id}` === refreshToken);
      if (!user) return fail("SESSION_EXPIRED", "The local demo user is unavailable.");
      return ok({ user, accessToken: `mock-local:${user.id}`, refreshToken, expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() });
    },
    async logout() { return ok(undefined); },
    async requestVerificationCode(input) { return ok({ challengeId: `local-challenge-${usernameSlug(input.identifier)}`, expiresAt: new Date(Date.now() + 10 * 60_000).toISOString() }); },
    async verifyVerificationCode(input) {
      const verified = input.code === "123456" && input.challengeId.startsWith("local-challenge-");
      return ok({ verified, ...(verified ? { verificationToken: `local-verified:${input.challengeId}` } : {}) });
    },
    async requestPasswordReset() { return ok({ accepted: false }); },
    async completePasswordReset() { return localOnly("Password reset delivery"); },
  };

  const usersService: BizConnectServices["users"] = {
    async getProfile(userId) { const user = userId === "me" ? currentUser() : users.find((item) => item.id === userId); return user ? ok(user) : notFound("Profile"); },
    async updateMyProfile(input: ProfileUpdate) {
      const target = currentUser();
      users = users.map((item) => item.id === target.id ? { ...item, ...clone(input) } : item);
      return ok(currentUser());
    },
    async listFollowers(userId, request) { return pageResult(users.filter((user) => followedUsers.has(`${user.id}:${userId}`)), request); },
    async listFollowing(userId, request) { return pageResult(users.filter((user) => followedUsers.has(`${userId}:${user.id}`)), request); },
    async getFollowStatus(userId) { return ok({ following: followedUsers.has(`${currentUserId}:${userId}`), followerCount: users.find((user) => user.id === userId)?.followers ?? 0 }); },
    async follow(userId) {
      const user = users.find((item) => item.id === userId);
      if (!user) return notFound("Profile");
      followedUsers.add(`${currentUserId}:${userId}`);
      user.followers += 1;
      return ok(undefined);
    },
    async unfollow(userId) {
      const user = users.find((item) => item.id === userId);
      if (!user) return notFound("Profile");
      if (followedUsers.delete(`${currentUserId}:${userId}`)) user.followers = Math.max(0, user.followers - 1);
      return ok(undefined);
    },
    async requestFollow(userId) {
      const profile = users.find((user) => user.id === userId);
      if (!profile) return notFound("Profile");
      const requestId = id("follow-request");
      followRequests.push({ id: requestId, requester: { id: currentUser().id, username: currentUser().username, name: currentUser().name, avatar: currentUser().avatar }, createdAt: now() });
      return ok({ requestId, status: "pending" as const });
    },
    async listFollowRequests(request) { return pageResult(followRequests, request); },
    async acceptFollowRequest(requestId) { if (!followRequests.some((request) => request.id === requestId)) return notFound("Follow request"); followRequests = followRequests.filter((request) => request.id !== requestId); return ok(undefined); },
    async rejectFollowRequest(requestId) { if (!followRequests.some((request) => request.id === requestId)) return notFound("Follow request"); followRequests = followRequests.filter((request) => request.id !== requestId); return ok(undefined); },
    async cancelFollowRequest(requestId) { if (!followRequests.some((request) => request.id === requestId)) return notFound("Follow request"); followRequests = followRequests.filter((request) => request.id !== requestId); return ok(undefined); },
  };

  const businessesService: BizConnectServices["businesses"] = {
    async list(filters: BusinessFilters) {
      let result = bySearch(businesses, filters, (item) => `${item.name} ${item.category} ${item.subcategory} ${item.county} ${item.town} ${item.neighbourhood}`);
      if (filters.category) result = result.filter((item) => item.category === filters.category || item.subcategory === filters.category);
      if (filters.county) result = result.filter((item) => item.county === filters.county);
      if (filters.town) result = result.filter((item) => item.town.toLowerCase().includes(filters.town!.toLowerCase()));
      if (filters.neighbourhood) result = result.filter((item) => item.neighbourhood.toLowerCase().includes(filters.neighbourhood!.toLowerCase()));
      if (filters.minRating !== undefined) result = result.filter((item) => item.rating >= filters.minRating!);
      if (filters.verified !== undefined) result = result.filter((item) => item.verified === filters.verified);
      if (filters.followedOnly) result = result.filter((item) => followedBusinesses.has(item.id));
      if (filters.maxPriceTier) {
        const rank = new Map([["KSh", 1], ["KSh KSh", 2], ["KSh KSh KSh", 3]]);
        const max = rank.get(filters.maxPriceTier) ?? 3;
        result = result.filter((item) => (rank.get(item.priceRange) ?? 3) <= max);
      }
      if (filters.sort === "popular") result = [...result].sort((a, b) => b.followers - a.followers);
      if (filters.sort === "rating") result = [...result].sort((a, b) => b.rating - a.rating);
      if (filters.sort === "recent") result = [...result].sort((a, b) => b.joinedAt.localeCompare(a.joinedAt));
      return pageResult(result, filters);
    },
    async get(businessId) { const business = findBusiness(businessId); return business ? ok(business) : notFound("Business"); },
    async create(input: BusinessCreateInput) {
      const user = currentUser();
      const business: Business = { ...clone(input), phone: input.phone ?? "", whatsapp: input.whatsapp ?? "", email: input.email ?? "", id: id("business"), ownerId: user.id, slug: `${usernameSlug(input.name).replace(/\./g, "-")}-${nextId}`, founderId: user.id, rating: 0, followers: 0, verified: false, verificationStatus: "not_requested", verificationHistory: [], joinedAt: now(), team: [{ userId: user.id, role: "Owner", joinedAt: now(), displayName: user.name, email: user.email ?? "" }], products: [], services: [], milestones: [], analytics: { profileViews: 0, postEngagement: 0, followersThisMonth: 0, videoViews: 0, productViews: 0, enquiries: 0 } };
      businesses = [business, ...businesses];
      return ok(business);
    },
    async update(businessId, input) { const business = findBusiness(businessId); if (!business) return notFound("Business"); Object.assign(business, clone(input)); return ok(business); },
    async archive(businessId) { if (!findBusiness(businessId)) return notFound("Business"); businesses = businesses.filter((business) => business.id !== businessId); return ok(undefined); },
    async follow(businessId) { const business = findBusiness(businessId); if (!business) return notFound("Business"); if (!followedBusinesses.has(businessId)) { followedBusinesses.add(businessId); business.followers += 1; } return ok(undefined); },
    async unfollow(businessId) { const business = findBusiness(businessId); if (!business) return notFound("Business"); if (followedBusinesses.delete(businessId)) business.followers = Math.max(0, business.followers - 1); return ok(undefined); },
    async getFollowStatus(businessId) { return ok({ following: followedBusinesses.has(businessId), followerCount: businesses.find((business) => business.id === businessId)?.followers ?? 0 }); },
    async listFollowers(businessId, request) { return findBusiness(businessId) ? pageResult<UserProfile>([], request) : notFound("Business"); },
    async inviteMember(businessId, input) { const business = findBusiness(businessId); if (!business) return notFound("Business"); return ok({ invitationId: id("invitation"), status: "pending" as const }); },
    async removeMember(businessId, userId) { const business = findBusiness(businessId); if (!business) return notFound("Business"); business.team = business.team.filter((member) => member.userId !== userId); return ok(undefined); },
  };

  const memberships: BizConnectServices["memberships"] = {
    async list(businessId, request) { const business = findBusiness(businessId); return business ? pageResult(business.team, request) : notFound("Business"); },
    async listInvitations(_businessId, request) { return pageResult<BusinessInvitation>([], request); },
    async listMyInvitations(request) { return pageResult<BusinessInvitation>([], request); },
    invite: (businessId, input) => businessesService.inviteMember(businessId, input),
    async acceptInvitation() { return localOnly("Business invitation acceptance"); },
    async declineInvitation() { return localOnly("Business invitation response"); },
    async cancelInvitation() { return localOnly("Business invitation management"); },
    async updateRole(businessId, userId, role) {
      const business = findBusiness(businessId);
      const member = business?.team.find((item) => item.userId === userId);
      if (!business || !member) return notFound("Team member");
      if (member.role === "Owner") return fail("OWNER_ROLE_LOCKED", "The local demo does not allow changing the owner role.");
      member.role = role;
      return ok(member);
    },
    remove: (businessId, userId) => businessesService.removeMember(businessId, userId),
    async leave() { return localOnly("Business membership changes"); },
    async listActivity(businessId, request) { return findBusiness(businessId) ? pageResult<BusinessActivityRecord>([], request) : notFound("Business"); },
    async requestOwnershipTransfer() { return localOnly("Ownership transfers"); },
    async listMyOwnershipTransfers() { return ok<OwnershipTransfer[]>([]); },
    async acceptOwnershipTransfer() { return localOnly("Ownership transfers"); },
    async declineOwnershipTransfer() { return localOnly("Ownership transfers"); },
    async cancelOwnershipTransfer() { return localOnly("Ownership transfers"); },
  };

  const postsService: BizConnectServices["posts"] = {
    async listFeed(filters: FeedFilters) {
      let result = posts.filter((post) => !hiddenPosts.has(post.id) && !blockedUsers.has(post.authorId));
      if (filters.mode === "following") result = result.filter((post) => followedUsers.has(`${currentUserId}:${post.authorId}`) || followedBusinesses.has(post.businessId ?? ""));
      if (filters.mode === "nearby" && filters.county) result = result.filter((post) => businesses.find((business) => business.id === post.businessId)?.county === filters.county);
      if (filters.town) result = result.filter((post) => post.location.toLowerCase().includes(filters.town!.toLowerCase()));
      result = [...result].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return pageResult(result, filters);
    },
    async listUserPosts(userId, request) { return pageResult(posts.filter((post) => post.authorId === userId), request); },
    async listBusinessPosts(businessId, request) { return findBusiness(businessId) ? pageResult(posts.filter((post) => post.identityKind === "business" && post.identityId === businessId), request) : notFound("Business"); },
    async get(postId) { const post = findPost(postId); return post ? ok(post) : notFound("Post"); },
    async create(input: PostCreateInput) {
      const businessId = input.identityKind === "business" ? input.identityId : undefined;
      const post: Post = { id: id("post"), authorId: currentUserId, identityKind: input.identityKind, identityId: input.identityId, kind: input.kind, caption: input.caption, ...(input.mediaId ? { media: input.mediaId } : {}), ...(input.mediaIds ? { mediaItems: clone(input.mediaIds) } : {}), ...(input.videoSubtitles ? { videoSubtitles: input.videoSubtitles } : {}), ...(input.mediaTextOverlay ? { mediaTextOverlay: input.mediaTextOverlay } : {}), ...(input.audience ? { audience: input.audience } : {}), ...(input.allowComments !== undefined ? { allowComments: input.allowComments } : {}), ...(input.allowSharing !== undefined ? { allowSharing: input.allowSharing } : {}), ...(input.poll ? { poll: clone(input.poll) } : {}), location: input.location ?? "", createdAt: now(), likes: 0, comments: [], ...(businessId ? { businessId } : {}), ...(input.businessTags ? { businessTags: clone(input.businessTags) } : {}), ...(input.productId ? { productId: input.productId } : {}), hashtags: clone(input.hashtags ?? []), ...(input.mentions ? { mentions: clone(input.mentions) } : {}) };
      posts = [post, ...posts];
      return ok(post);
    },
    async update(postId, input: PostUpdateInput) { const post = findPost(postId); if (!post) return notFound("Post"); if (post.authorId !== currentUserId) return fail("FORBIDDEN", "Only the author may update this local post."); Object.assign(post, clone(input)); return ok(post); },
    async delete(postId) { const post = findPost(postId); if (!post) return notFound("Post"); if (post.authorId !== currentUserId) return fail("FORBIDDEN", "Only the author may delete this local post."); posts = posts.filter((item) => item.id !== postId); return ok(undefined); },
    async like(postId) { const post = findPost(postId); if (!post) return notFound("Post"); if (!likedPosts.has(postId)) { likedPosts.add(postId); post.likes += 1; } return ok(undefined); },
    async unlike(postId) { const post = findPost(postId); if (!post) return notFound("Post"); if (likedPosts.delete(postId)) post.likes = Math.max(0, post.likes - 1); return ok(undefined); },
    async getLikeStatus(postId) { const post = findPost(postId); return post ? ok({ likeCount: post.likes, viewerHasLiked: likedPosts.has(postId) }) : notFound("Post"); },
    async save(postId) { if (!findPost(postId)) return notFound("Post"); savedPosts.add(postId); return ok(undefined); },
    async unsave(postId) { savedPosts.delete(postId); return ok(undefined); },
    async comment(postId, input: CommentInput) {
      const post = findPost(postId);
      if (!post) return notFound("Post");
      if (!input.text.trim()) return fail("VALIDATION_ERROR", "A comment cannot be empty.");
      const comment: PostComment = { id: id("comment"), userId: currentUserId, text: input.text.trim(), createdAt: now(), replies: [] };
      post.comments.push(comment);
      return ok(comment);
    },
    async reply(postId, commentId, input) {
      const comment = findPost(postId)?.comments.find((item) => item.id === commentId);
      if (!comment) return notFound("Comment");
      const reply: CommentReply = { id: id("reply"), userId: currentUserId, text: input.text.trim(), createdAt: now() };
      comment.replies.push(reply);
      return ok(reply);
    },
    async listComments(postId, request) {
      const post = findPost(postId);
      return post ? pageResult(post.comments.map((comment) => ({ ...comment, postId, parentCommentId: null, userName: users.find((user) => user.id === comment.userId)?.name ?? "BizConnect member", replyCount: comment.replies.length })), request) : notFound("Post");
    },
    async listReplies(commentId, request) {
      const comment = posts.flatMap((post) => post.comments).find((item) => item.id === commentId);
      return comment ? pageResult(comment.replies.map((reply) => ({ ...reply, postId: "", parentCommentId: commentId, userName: users.find((user) => user.id === reply.userId)?.name ?? "BizConnect member", replyCount: 0, replies: [] })), request) : notFound("Comment");
    },
    async share(postId) { return findPost(postId) ? ok(undefined) : notFound("Post"); },
    async vote(postId, input): Promise<Result<Poll>> {
      const post = findPost(postId);
      if (!post?.poll) return notFound("Poll");
      if (new Date(post.poll.endsAt).getTime() <= Date.now()) return fail("POLL_CLOSED", "This poll has ended.");
      const optionIds = [...new Set(input.optionIds)];
      if (!optionIds.length || optionIds.some((optionId) => !post.poll!.options.some((option) => option.id === optionId))) return fail("INVALID_POLL_OPTIONS", "Choose one or more valid poll options.");
      if (!post.poll.multipleChoice && optionIds.length > 1) return fail("MULTIPLE_SELECTION_DISABLED", "Choose only one answer for this poll.");
      post.poll.votes = post.poll.votes.filter((vote) => vote.userId !== currentUserId);
      post.poll.votes.push({ userId: currentUserId, optionIds, createdAt: now() });
      post.poll.totalVotes = post.poll.votes.length;
      post.poll.viewerVoteOptionId = optionIds[0];
      return ok(post.poll);
    },
    async createPoll(postId, input) {
      const post = findPost(postId);
      if (!post) return notFound("Post");
      const poll: Poll = { id: id("poll"), question: input.question, options: input.options.map((text, index) => ({ id: id(`option-${index + 1}`), text, voteCount: 0 })), endsAt: input.closesAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), multipleChoice: false, votes: [], totalVotes: 0 };
      post.poll = poll;
      return ok(poll);
    },
    async getPoll(pollId) { const poll = posts.map((post) => post.poll).find((item) => item?.id === pollId); return poll ? ok(poll) : notFound("Poll"); },
    async votePoll(pollId, optionId) {
      const post = posts.find((item) => item.poll?.id === pollId || item.id === pollId);
      return post ? postsService.vote(post.id, { optionIds: [optionId] }) : notFound("Poll");
    },
    async getPollResults(pollId) { return postsService.getPoll(pollId); },
  };

  const feed: BizConnectServices["feed"] = {
    list: (filters: FeedFilters) => postsService.listFeed(filters),
  };

  const catalog: BizConnectServices["catalog"] = {
    async listProducts(businessId, request) { const business = findBusiness(businessId); return business ? pageResult(business.products, request) : notFound("Business"); },
    async getProduct(businessId, productId) { const product = findProduct(businessId, productId); return product ? ok(product) : notFound("Product"); },
    async createProduct(businessId, input) { const business = findBusiness(businessId); if (!business) return notFound("Business"); const product: Product = { ...clone(input), id: id("product"), businessId }; business.products.push(product); return ok(product); },
    async updateProduct(businessId, productId, input) { const product = findProduct(businessId, productId); if (!product) return notFound("Product"); Object.assign(product, clone(input)); return ok(product); },
    async deleteProduct(businessId, productId) { const business = findBusiness(businessId); if (!business) return notFound("Business"); business.products = business.products.filter((product) => product.id !== productId); return ok(undefined); },
    async listServices(businessId, request) { const business = findBusiness(businessId); return business ? pageResult(business.services, request) : notFound("Business"); },
    async getService(businessId, serviceId) { const service = findService(businessId, serviceId); return service ? ok(service) : notFound("Service"); },
    async createService(businessId, input) { const business = findBusiness(businessId); if (!business) return notFound("Business"); const service: Service = { ...clone(input), id: id("service"), businessId }; business.services.push(service); return ok(service); },
    async updateService(businessId, serviceId, input) { const service = findService(businessId, serviceId); if (!service) return notFound("Service"); Object.assign(service, clone(input)); return ok(service); },
    async deleteService(businessId, serviceId) { const business = findBusiness(businessId); if (!business) return notFound("Business"); business.services = business.services.filter((service) => service.id !== serviceId); return ok(undefined); },
    async setProductStatus(businessId, productId, status) { const product = findProduct(businessId, productId); if (!product) return notFound("Product"); Object.assign(product, localLifecycle(status)); return ok(product); },
    async setServiceStatus(businessId, serviceId, status) { const service = findService(businessId, serviceId); if (!service) return notFound("Service"); Object.assign(service, localLifecycle(status)); return ok(service); },
    async replaceProductGallery(businessId, productId, gallery) { const product = findProduct(businessId, productId); if (!product) return notFound("Product"); product.gallery = localGallery(gallery, product.images ?? (product.image ? [product.image] : [])); product.updatedAt = now(); return ok(product); },
    async replaceServiceGallery(businessId, serviceId, gallery) { const service = findService(businessId, serviceId); if (!service) return notFound("Service"); service.gallery = localGallery(gallery, service.images ?? []); service.updatedAt = now(); return ok(service); },
    // The demo store has no object storage, so an upload is refused rather than answered with a fabricated asset id.
    async uploadCatalogMedia() { return localOnly("Catalogue image upload"); },
    async listPublicProducts(filters) { return pageResult(bySearch(visibleLocalProducts(filters), filters, (item) => `${item.name} ${item.description} ${item.category} ${item.location}`), filters); },
    async getPublicProduct(slugOrId) { const product = visibleLocalProducts().find((item) => item.id === slugOrId || item.slug === slugOrId); return product ? ok(product) : notFound("Product"); },
    async listPublicServices(filters) { return pageResult(bySearch(visibleLocalServices(filters), filters, (item) => `${item.name} ${item.description} ${item.category} ${item.location}`), filters); },
    async getPublicService(slugOrId) { const service = visibleLocalServices().find((item) => item.id === slugOrId || item.slug === slugOrId); return service ? ok(service) : notFound("Service"); },
  };

  const storiesService: BizConnectServices["stories"] = {
    async listStories(request) { return pageResult(bySearch(stories, request, (story) => `${story.title} ${story.intro} ${story.category} ${story.industry}`), request); },
    async getStory(storyId) { const story = stories.find((item) => item.id === storyId); return story ? ok(story) : notFound("Story"); },
    async saveStory(storyId) { if (!stories.some((story) => story.id === storyId)) return notFound("Story"); savedStories.add(storyId); return ok(undefined); },
    async unsaveStory(storyId) { savedStories.delete(storyId); return ok(undefined); },
    async listOpportunities(request) { return pageResult(bySearch(opportunities, request, (item) => `${item.title} ${item.industry} ${item.county}`), request); },
    async getOpportunity(opportunityId) { const opportunity = opportunities.find((item) => item.id === opportunityId); return opportunity ? ok(opportunity) : notFound("Opportunity"); },
    async saveOpportunity(opportunityId) { if (!opportunities.some((item) => item.id === opportunityId)) return notFound("Opportunity"); savedOpportunities.add(opportunityId); return ok(undefined); },
    async unsaveOpportunity(opportunityId) { savedOpportunities.delete(opportunityId); return ok(undefined); },
  };

  const socialStories: BizConnectServices["socialStories"] = {
    async listActive(request) {
      const visible = socialStoryRecords.filter(canReadSocialStory);
      return pageResult(visible.sort((a, b) => b.createdAt.localeCompare(a.createdAt)), request);
    },
    async get(storyId) { const story = socialStoryRecords.find((item) => item.id === storyId); return story && canReadSocialStory(story) ? ok(story) : notFound("Social Story"); },
    async create(input: SocialStoryCreateInput) {
      if (input.identityKind === "personal" && input.identityId !== currentUserId) return fail("FORBIDDEN", "A personal Story must use the signed-in local identity.");
      if (input.identityKind === "business" && !canManageBusiness(input.identityId)) return fail("FORBIDDEN", "Only a member of the business may publish its local Story.");
      const { durationHours = 24, ...fields } = clone(input);
      const hours = Math.min(24, Math.max(1, Number.isFinite(durationHours) ? durationHours : 24));
      const createdAt = now();
      const story: SocialStory = { ...fields, id: id("social-story"), authorId: currentUserId, createdAt, expiresAt: new Date(Date.now() + hours * 60 * 60 * 1000).toISOString() };
      socialStoryRecords = [story, ...socialStoryRecords];
      return ok(story);
    },
    async delete(storyId) {
      const story = socialStoryRecords.find((item) => item.id === storyId);
      if (!story) return notFound("Social Story");
      if (story.authorId !== currentUserId) return fail("FORBIDDEN", "Only the author may remove this local Story.");
      socialStoryRecords = socialStoryRecords.filter((item) => item.id !== storyId);
      return ok(undefined);
    },
    async listHighlights(ownerId, request) { return pageResult(storyHighlights.filter((item) => item.ownerId === ownerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), request); },
    async createHighlight(input) {
      const owned = input.storyIds.filter((storyId) => socialStoryRecords.some((story) => story.id === storyId && story.authorId === currentUserId));
      if (!input.title.trim() || !owned.length) return fail("VALIDATION_ERROR", "A Highlight needs a title and at least one Story owned by this account.");
      const highlight: StoryHighlight = { ...clone(input), id: id("highlight"), ownerId: currentUserId, storyIds: [...new Set(owned)], createdAt: now() };
      storyHighlights = [highlight, ...storyHighlights];
      return ok(highlight);
    },
    async updateHighlight(highlightId, input) {
      const highlight = storyHighlights.find((item) => item.id === highlightId && item.ownerId === currentUserId);
      if (!highlight) return notFound("Highlight");
      Object.assign(highlight, clone(input));
      return ok(highlight);
    },
    async deleteHighlight(highlightId) {
      if (!storyHighlights.some((item) => item.id === highlightId && item.ownerId === currentUserId)) return notFound("Highlight");
      storyHighlights = storyHighlights.filter((item) => item.id !== highlightId);
      return ok(undefined);
    },
  };

  const listings: BizConnectServices["listings"] = {
    async listOffers(businessId, request) { return findBusiness(businessId) ? pageResult(businessOffers.filter((item) => item.businessId === businessId), request) : notFound("Business"); },
    async createOffer(businessId, input) {
      if (!findBusiness(businessId)) return notFound("Business");
      if (!canManageBusiness(businessId)) return fail("FORBIDDEN", "Only a business team member may create an offer.");
      if (!isBusinessOfferDateRangeValid(input.startsAt, input.expiresAt)) return fail("INVALID_OFFER_DATES", "An offer must have valid dates and expire after it starts and in the future.");
      const offer: BusinessOffer = { ...clone(input), status: getBusinessOfferStatus(input.startsAt, input.expiresAt), id: id("offer"), businessId, createdAt: now() };
      businessOffers = [offer, ...businessOffers];
      return ok(offer);
    },
    async updateOffer(businessId, offerId, input) { if (!canManageBusiness(businessId)) return fail("FORBIDDEN", "Only a business team member may edit an offer."); const offer = businessOffers.find((item) => item.businessId === businessId && item.id === offerId); if (!offer) return notFound("Offer"); const next = { ...offer, ...clone(input) }; if (!isBusinessOfferDateRangeValid(next.startsAt, next.expiresAt)) return fail("INVALID_OFFER_DATES", "An offer must have valid dates and expire after it starts and in the future."); Object.assign(offer, next, { status: getBusinessOfferStatus(next.startsAt, next.expiresAt) }); return ok(offer); },
    async deleteOffer(businessId, offerId) { if (!canManageBusiness(businessId)) return fail("FORBIDDEN", "Only a business team member may delete an offer."); if (!businessOffers.some((item) => item.businessId === businessId && item.id === offerId)) return notFound("Offer"); businessOffers = businessOffers.filter((item) => item.id !== offerId); return ok(undefined); },
    async listEvents(request) { return pageResult(businessEvents.filter((event) => !request.identityId || event.identityId === request.identityId), request); },
    async createEvent(input) { if (input.identityKind === "personal" && input.identityId !== currentUserId) return fail("FORBIDDEN", "A personal event must use the signed-in local identity."); if (input.identityKind === "business" && !canManageBusiness(input.identityId)) return fail("FORBIDDEN", "Only a business team member may publish its event."); const event: BusinessEvent = { ...clone(input), id: id("event"), createdAt: now() }; businessEvents = [event, ...businessEvents]; return ok(event); },
    async updateEvent(eventId, input) { const event = businessEvents.find((item) => item.id === eventId && (item.identityKind === "business" ? findBusiness(item.identityId)?.ownerId === currentUserId : item.identityId === currentUserId)); if (!event) return notFound("Event"); Object.assign(event, clone(input)); return ok(event); },
    async deleteEvent(eventId) { const event = businessEvents.find((item) => item.id === eventId); if (!event) return notFound("Event"); if (event.identityKind === "business" ? findBusiness(event.identityId)?.ownerId !== currentUserId : event.identityId !== currentUserId) return fail("FORBIDDEN", "Only the event owner may delete this local event."); businessEvents = businessEvents.filter((item) => item.id !== eventId); return ok(undefined); },
    async listCommunityOpportunities(request) { return pageResult(communityOpportunityRecords.filter((item) => !item.expiresAt || new Date(item.expiresAt).getTime() > Date.now()), request); },
    async createCommunityOpportunity(input) { if (input.identityKind === "personal" && input.identityId !== currentUserId) return fail("FORBIDDEN", "A personal opportunity must use the signed-in local identity."); if (input.identityKind === "business" && !canManageBusiness(input.identityId)) return fail("FORBIDDEN", "Only a business team member may publish an opportunity for it."); if (!input.title.trim() || !input.description.trim()) return fail("VALIDATION_ERROR", "An opportunity needs a title and description."); const opportunity: CommunityOpportunity = { ...clone(input), id: id("community-opportunity"), createdAt: now() }; communityOpportunityRecords = [opportunity, ...communityOpportunityRecords]; return ok(opportunity); },
    async updateCommunityOpportunity(opportunityId, input) { const opportunity = communityOpportunityRecords.find((item) => item.id === opportunityId); if (!opportunity) return notFound("Community opportunity"); const allowed = opportunity.identityKind === "personal" ? opportunity.identityId === currentUserId : canManageBusiness(opportunity.identityId); if (!allowed) return fail("FORBIDDEN", "Only the opportunity owner may edit this local listing."); Object.assign(opportunity, clone(input)); return ok(opportunity); },
    async deleteCommunityOpportunity(opportunityId) { const opportunity = communityOpportunityRecords.find((item) => item.id === opportunityId); if (!opportunity) return notFound("Community opportunity"); const allowed = opportunity.identityKind === "personal" ? opportunity.identityId === currentUserId : canManageBusiness(opportunity.identityId); if (!allowed) return fail("FORBIDDEN", "Only the opportunity owner may delete this local listing."); communityOpportunityRecords = communityOpportunityRecords.filter((item) => item.id !== opportunityId); return ok(undefined); },
  };

  const milestones: BizConnectServices["milestones"] = {
    async listMilestones(businessId, request) { const business = findBusiness(businessId); return business ? pageResult(business.milestones, request) : notFound("Business"); },
    async createMilestone(businessId, input) { const business = findBusiness(businessId); if (!business) return notFound("Business"); const milestone: Milestone = { ...clone(input), id: id("milestone"), businessId }; business.milestones.push(milestone); return ok(milestone); },
    async updateMilestone(businessId, milestoneId, input) { const milestone = findBusiness(businessId)?.milestones.find((item) => item.id === milestoneId); if (!milestone) return notFound("Milestone"); Object.assign(milestone, clone(input)); return ok(milestone); },
    async deleteMilestone(businessId, milestoneId) { const business = findBusiness(businessId); if (!business) return notFound("Business"); business.milestones = business.milestones.filter((item) => item.id !== milestoneId); return ok(undefined); },
    async getAnalytics(businessId) { const business = findBusiness(businessId); return business ? ok(business.analytics) : notFound("Business"); },
  };

  const reviews: BizConnectServices["reviews"] = {
    async list(businessId, request) {
      const business = findBusiness(businessId);
      if (!business) return notFound("Business");
      const seeded: BusinessReview[] = [{ id: `local-review-${businessId}`, businessId, authorName: "Local demo customer", rating: Math.max(1, Math.min(5, business.rating || 4)), title: "A sample review", body: "Illustrative review content for the local demo. It is not a server-submitted review.", createdAt: "2025-01-10T09:00:00+03:00" }];
      return pageResult(seeded, request);
    },
  };
  const growth: BizConnectServices["growth"] = {
    async getSummary(businessId, range = "30d") {
      const business = findBusiness(businessId);
      if (!business) return notFound("Business");
      const reviewsResult = await reviews.list(businessId, { limit: 5 });
      const reviewsData = reviewsResult.ok ? reviewsResult.data.items : [];
      const analytics: BusinessGrowthAnalytics = { ...clone(business.analytics), range, trends: ["Week 1", "Week 2", "Week 3", "Week 4"].map((label, index) => ({ label, profileViews: Math.round(business.analytics.profileViews * (0.17 + index * 0.06)), engagements: Math.round(business.analytics.postEngagement * (0.7 + index * 0.1)), enquiries: Math.round(business.analytics.enquiries * (0.15 + index * 0.03)) })) };
      const opportunities = clone(OPPORTUNITIES).slice(0, 3);
      const activity: GrowthActivity[] = [
        ...business.milestones.slice(-2).map((item) => ({ id: `activity-${item.id}`, businessId, kind: "milestone" as const, title: item.title, detail: "Milestone saved in this local demo", createdAt: item.date })),
        { id: `activity-review-${businessId}`, businessId, kind: "review" as const, title: "Sample review available", detail: "Illustrative local-only review", createdAt: "2025-01-10T09:00:00+03:00" },
      ];
      return ok<BusinessGrowthSummary>({ businessId, businessName: business.name, rating: business.rating, reviewCount: reviewsData.length, reviews: reviewsData, analytics, milestones: clone(business.milestones), opportunities, activity });
    },
    async listReviews(businessId, request) { return reviews.list(businessId, request); },
    async getAnalytics(businessId, range = "30d") { const summary = await this.getSummary(businessId, range); return summary.ok ? ok(summary.data.analytics) : summary; },
    async listMilestones(businessId, request) { const business = findBusiness(businessId); return business ? pageResult(business.milestones, request) : notFound("Business"); },
    async listOpportunities(businessId, request) { return findBusiness(businessId) ? pageResult(clone(OPPORTUNITIES), request) : notFound("Business"); },
  };
  const messaging: BizConnectServices["messaging"] = {
    async listConversations(request) { return pageResult(conversations, request); },
    async getConversation(conversationId) { const conversation = conversations.find((item) => item.id === conversationId); return conversation ? ok(conversation) : notFound("Conversation"); },
    async startConversation(input: StartConversationInput) {
      const business = input.businessId ? findBusiness(input.businessId) : undefined;
      const participantId = input.participantId ?? business?.ownerId ?? input.businessId ?? "";
      const existing = conversations.find((conversation) => conversation.participantId === participantId && conversation.businessId === input.businessId && conversation.catalogItemId === input.catalogItemId);
      if (existing) return ok(existing);
      const person = users.find((user) => user.id === participantId);
      const nowAt = now();
      const first = input.firstMessage?.trim();
      const conversation: Conversation = { id: id("conversation"), participantId, participantName: business?.name ?? person?.name ?? "BizConnect member", ...(input.businessId ? { businessId: input.businessId, kind: "business" as const } : { kind: "direct" as const }), ...(input.catalogItemId ? { catalogItemId: input.catalogItemId } : {}), ...(input.catalogItemId ? { catalogItemTitle: "Catalogue enquiry" } : {}), lastMessage: first ?? "", updatedAt: nowAt, unread: 0, isArchived: false, isBlocked: false, messages: first ? [{ id: id("message"), senderId: currentUserId, text: first, createdAt: nowAt, status: "sent" }] : [] };
      conversations = [conversation, ...conversations];
      return ok(conversation);
    },
    async listMessages(conversationId, request) { const conversation = conversations.find((item) => item.id === conversationId); return conversation ? pageResult(conversation.messages, request) : notFound("Conversation"); },
    async sendMessage(input: SendMessageInput) {
      let conversation = input.conversationId ? conversations.find((item) => item.id === input.conversationId) : conversations.find((item) => item.participantId === input.participantId && item.businessId === input.businessId);
      if (!conversation) {
        if (!input.participantId && !input.businessId) return fail("CONVERSATION_NOT_FOUND", "Start a conversation before sending a message.");
        const started = await messaging.startConversation({ participantId: input.participantId, businessId: input.businessId, catalogItemId: input.catalogItemId });
        if (!started.ok) return started;
        conversation = conversations.find((item) => item.id === started.data.id);
      }
      if (!conversation) return fail("CONVERSATION_NOT_FOUND", "The local conversation could not be created.");
      const duplicate = conversation.messages.find((message) => message.id === input.clientMessageId);
      if (duplicate) return ok(duplicate);
      const message: ChatMessage = { id: input.clientMessageId || id("message"), senderId: currentUserId, text: input.text, createdAt: now(), status: "sent", ...(input.mediaId ? { image: input.mediaId } : {}) };
      conversation.messages.push(message);
      conversation.lastMessage = input.text || "Shared an attachment";
      conversation.updatedAt = message.createdAt;
      conversation.isArchived = false;
      return ok(message);
    },
    async markDelivered(conversationId) { return conversations.some((item) => item.id === conversationId) ? ok(undefined) : notFound("Conversation"); },
    async markRead(conversationId) { const conversation = conversations.find((item) => item.id === conversationId); if (!conversation) return notFound("Conversation"); conversation.unread = 0; for (const message of conversation.messages) readMessageIds.add(message.id); return ok(undefined); },
    async archive(conversationId) { const conversation = conversations.find((item) => item.id === conversationId); if (!conversation) return notFound("Conversation"); conversation.isArchived = true; return ok(undefined); },
    async block(conversationId) { const conversation = conversations.find((item) => item.id === conversationId); if (!conversation) return notFound("Conversation"); conversation.isBlocked = true; return ok(undefined); },
    async unblock(conversationId) { const conversation = conversations.find((item) => item.id === conversationId); if (!conversation) return notFound("Conversation"); conversation.isBlocked = false; return ok(undefined); },
  };

  const searchService: BizConnectServices["search"] = {
    async search(input: SearchQuery) {
      const query = input.query.trim().toLowerCase();
      const matches: SearchHit[] = [];
      const allow = (type: SearchEntityType) => !input.types?.length || input.types.includes(type);
      if (allow("business")) for (const business of businesses) if (`${business.name} ${business.category} ${business.subcategory} ${business.town} ${business.neighbourhood}`.toLowerCase().includes(query)) matches.push({ id: business.id, type: "business", title: business.name, subtitle: `${business.category} · ${business.town}`, ...(business.cover ? { thumbnailUrl: business.cover } : {}), county: business.county, town: business.town, verified: business.verified });
      if (allow("person")) for (const user of users) if (`${user.name} ${user.username}`.toLowerCase().includes(query)) matches.push({ id: user.id, type: "person", title: user.name, subtitle: `@${user.username}`, ...(user.avatar ? { thumbnailUrl: user.avatar } : {}), county: user.county, town: user.town });
      if (allow("product")) for (const business of businesses) for (const product of business.products) if (`${product.name} ${product.description} ${product.category}`.toLowerCase().includes(query)) matches.push({ id: product.id, type: "product", title: product.name, subtitle: `${business.name} · KSh ${product.price.toLocaleString()}`, ...(product.image ? { thumbnailUrl: product.image } : {}), county: business.county, town: business.town, priceKsh: product.price });
      if (allow("service")) for (const business of businesses) for (const service of business.services) if (`${service.name} ${service.description} ${service.category}`.toLowerCase().includes(query)) matches.push({ id: service.id, type: "service", title: service.name, subtitle: `${business.name} · ${service.priceLabel}`, county: business.county, town: business.town });
      if (allow("post") || allow("video")) for (const post of posts) if (`${post.caption} ${post.hashtags.join(" ")}`.toLowerCase().includes(query) && allow(post.video ? "video" : "post")) matches.push({ id: post.id, type: post.video ? "video" : "post", title: post.caption.slice(0, 80), subtitle: post.location, ...(post.media ? { thumbnailUrl: post.media } : {}) });
      if (allow("story")) for (const story of stories) if (`${story.title} ${story.intro} ${story.category}`.toLowerCase().includes(query)) matches.push({ id: story.id, type: "story", title: story.title, subtitle: story.intro, ...(story.cover ? { thumbnailUrl: story.cover } : {}) });
      if (input.county) {
        const filtered = matches.filter((hit) => hit.county === input.county);
        return ok(page(filtered, input));
      }
      return ok(page(matches, input));
    },
    async listHistory(request) { return pageResult(searchHistory, request); },
    async recordSearch(query) { const trimmed = query.trim(); if (!trimmed) return fail("VALIDATION_ERROR", "Search text cannot be empty."); searchHistory = [{ id: id("search"), query: trimmed, createdAt: now() }, ...searchHistory.filter((item) => item.query.toLowerCase() !== trimmed.toLowerCase())].slice(0, 20); return ok(undefined); },
    async clearHistory() { searchHistory = []; return ok(undefined); },
    async listRecentlyViewed(request) { return pageResult(recentlyViewed, request); },
    async recordRecentlyViewed(input) { recentlyViewed = [{ id: id("view"), ...clone(input), viewedAt: now() }, ...recentlyViewed.filter((item) => item.entityId !== input.entityId || item.type !== input.type)].slice(0, 50); return ok(recentlyViewed[0]); },
    async removeRecentlyViewed(type, entityId) { recentlyViewed = recentlyViewed.filter((item) => item.type !== type || item.entityId !== entityId); return ok(undefined); },
  };

  const notificationsService: BizConnectServices["notifications"] = {
    async list(request) { return pageResult(notifications, request); },
    async getUnreadCount() { return ok(notifications.filter((item) => !item.read).length); },
    async markRead(notificationId) { const item = notifications.find((notification) => notification.id === notificationId); if (!item) return notFound("Notification"); item.read = true; return ok(undefined); },
    async markAllRead() { notifications = notifications.map((item) => ({ ...item, read: true })); return ok(undefined); },
    async dismiss(notificationId) { const count = notifications.length; notifications = notifications.filter((item) => item.id !== notificationId); return count === notifications.length ? notFound("Notification") : ok(undefined); },
    async getPreferences() { return ok(notificationPreferences); },
    async updatePreferences(patch: Partial<NotificationPreferences>) { notificationPreferences = { ...notificationPreferences, ...clone(patch) }; return ok(notificationPreferences); },
    async registerDevice() { return localOnly("Push device registration"); },
    async removeDevice() { return localOnly("Push device removal"); },
  };

  const verification: BizConnectServices["verification"] = {
    async submit(businessId, input) {
      const business = findBusiness(businessId);
      if (!business) return notFound("Business");
      if (business.verificationStatus === "pending") return fail("VERIFICATION_ALREADY_PENDING", "This business already has a local request awaiting review.");
      const request: VerificationRequest = { id: id("verification"), businessId, submittedAt: now(), status: "pending", documents: clone(input.documentMediaIds) };
      verificationRequests = [request, ...verificationRequests];
      business.verificationStatus = "pending";
      business.verificationHistory.push({ status: "pending", date: now(), note: "Local demo request; no documents were sent for review." });
      return ok(request);
    },
    async list(businessId, request) { return pageResult(verificationRequests.filter((item) => item.businessId === businessId), request); },
    async get(businessId, requestId) { const item = verificationRequests.find((request) => request.businessId === businessId && request.id === requestId); return item ? ok(item) : notFound("Verification request"); },
  };

  const moderation: BizConnectServices["moderation"] = {
    async report(input) { if (!input.targetId || !input.reason) return fail("VALIDATION_ERROR", "Choose a reason before submitting a report."); return ok({ reportId: input.idempotencyKey ?? id("report"), status: "submitted" as const }); },
    async block(userId) { if (!users.some((user) => user.id === userId)) return notFound("Profile"); blockedUsers.add(userId); followedUsers.delete(`${currentUserId}:${userId}`); return ok(undefined); },
    async unblock(userId) { blockedUsers.delete(userId); return ok(undefined); },
    async hidePost(postId) { if (!findPost(postId)) return notFound("Post"); hiddenPosts.add(postId); return ok(undefined); },
    async unhidePost(postId) { hiddenPosts.delete(postId); return ok(undefined); },
  };

  const media: BizConnectServices["media"] = {
    async begin() { return localOnly("Media upload"); },
    async upload(_ticket, _file: MediaFileInput, _onProgress?: (progress: MediaUploadProgress) => void, _signal?: AbortSignal) { return localOnly("Media upload"); },
    async complete() { return localOnly("Media upload completion"); },
    async resume() { return localOnly("Upload resume"); },
    async retry() { return localOnly("Upload retry"); },
    async cancel() { return localOnly("Upload cancellation"); },
  };

  const dataRights: BizConnectServices["dataRights"] = {
    async requestExport(): Promise<Result<ExportJob>> { return localOnly("Data export"); },
    async getExportStatus(): Promise<Result<ExportJob>> { return localOnly("Data export status"); },
    async requestDeletion(): Promise<Result<DataDeletionRequest>> { return localOnly("Account deletion"); },
    async getDeletionStatus(): Promise<Result<DataDeletionRequest | null>> { return ok(deletionRequest); },
    async cancelDeletion() { if (!deletionRequest || deletionRequest.status === "completed") return fail("NO_ACTIVE_DELETION_REQUEST", "There is no cancellable local deletion request."); deletionRequest = { ...deletionRequest, status: "cancelled" }; return ok(undefined); },
  };

  const preferences: BizConnectServices["preferences"] = {
    async get() { return ok(appPreferences); },
    async update(patch) { appPreferences = { ...appPreferences, ...clone(patch) }; return ok(appPreferences); },
  };

  const services: BizConnectServices = { auth, users: usersService, businesses: businessesService, memberships, reviews, growth, feed, posts: postsService, catalog, stories: storiesService, socialStories, listings, milestones, messaging, search: searchService, notifications: notificationsService, verification, moderation, media, dataRights, preferences };
  return services;
}
