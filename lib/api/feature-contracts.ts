import type {
  Business,
  BusinessEvent,
  BusinessOffer,
  BusinessAnalytics,
  BusinessTeamMember,
  AppSettings,
  ChatMessage,
  CommentReply,
  Conversation,
  CommunityOpportunity,
  FounderStory,
  Milestone,
  NotificationItem,
  Opportunity,
  Poll,
  Post,
  PostComment,
  Product,
  Service,
  SocialStory,
  StoryHighlight,
  UserProfile,
  VerificationRequest,
} from "@/types/domain";
import type { PageRequest, PageResponse, Result } from "./contracts";

export type Paged<T> = Promise<Result<PageResponse<T>>>;

export interface AuthSession {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}
export interface RegistrationRequest {
  name: string;
  username: string;
  email?: string;
  phone?: string;
  password: string;
  county: UserProfile["county"];
  town: string;
  interests: string[];
  avatar?: string;
}
export interface AuthService {
  register(input: RegistrationRequest): Promise<Result<UserProfile>>;
  login(input: { identifier: string; password: string }): Promise<Result<AuthSession>>;
  refresh(refreshToken?: string): Promise<Result<AuthSession>>;
  logout(): Promise<Result<void>>;
  requestVerificationCode(input: { identifier: string; purpose: "registration" | "login" }): Promise<Result<{ challengeId: string; expiresAt: string }>>;
  verifyVerificationCode(input: { challengeId: string; code: string }): Promise<Result<{ verified: boolean; verificationToken?: string }>>;
  
  requestPasswordReset(input: { identifier: string }): Promise<Result<{ accepted: boolean }>>;
    verifyPasswordResetCode(input: { identifier: string; code: string }): Promise<Result<{ verified: boolean }>>;
  
  completePasswordReset(input: { identifier: string; code: string; newPassword: string }): Promise<Result<void>>;
}

export interface ProfileUpdate {
  name?: string;
  username?: string;
  email?: string;
  phone?: string;
  bio?: string;
  avatar?: string;
  county?: UserProfile["county"];
  town?: string;
  neighbourhood?: string;
  interests?: string[];
  privateProfile?: boolean;
}
export interface FollowRequestRecord {
  id: string;
  requester: Pick<UserProfile, "id" | "username" | "name" | "avatar">;
  createdAt: string;
}
export interface FollowState {
  following: boolean;
  followerCount: number;
}
export interface UserService {
  getProfile(userId: string): Promise<Result<UserProfile>>;
  updateMyProfile(input: ProfileUpdate): Promise<Result<UserProfile>>;
  listFollowers(userId: string, page: PageRequest): Paged<UserProfile>;
  listFollowing(userId: string, page: PageRequest): Paged<UserProfile>;
  follow(userId: string): Promise<Result<void>>;
  unfollow(userId: string): Promise<Result<void>>;
  getFollowStatus(userId: string): Promise<Result<FollowState>>;
  requestFollow(userId: string): Promise<Result<{ requestId: string; status: "pending" }>>;
  listFollowRequests(page: PageRequest): Paged<FollowRequestRecord>;
  acceptFollowRequest(requestId: string): Promise<Result<void>>;
  rejectFollowRequest(requestId: string): Promise<Result<void>>;
  cancelFollowRequest(requestId: string): Promise<Result<void>>;
}

export interface BusinessFilters extends PageRequest {
  category?: string;
  county?: Business["county"];
  town?: string;
  neighbourhood?: string;
  minRating?: number;
  maxPriceTier?: Business["priceRange"];
  verified?: boolean;
  followedOnly?: boolean;
  sort?: "relevance" | "recent" | "popular" | "rating" | "distance";
}
export type BusinessApiRole = "Owner" | "Admin" | "Editor" | "Viewer";
export interface BusinessInvitation {
  id: string;
  businessId: string;
  businessName: string;
  invitedUserId: string;
  invitedEmail: string;
  role: BusinessApiRole;
  status: "pending" | "accepted" | "declined" | "cancelled" | "expired";
  createdAt: string;
  expiresAt: string;
  invitedByUserId: string;
  invitedByName: string;
}
export interface OwnershipTransfer {
  id: string;
  businessId: string;
  businessName: string;
  fromUserId: string;
  fromName: string;
  toUserId: string;
  toEmail: string;
  status: "pending" | "accepted" | "declined" | "cancelled" | "expired";
  createdAt: string;
  expiresAt: string;
}
export interface BusinessActivityRecord {
  id: string;
  businessId: string;
  actorUserId: string;
  actorName: string;
  eventType: string;
  summary: string;
  createdAt: string;
}
export type BusinessCreateInput = Pick<Business,
  "name" | "category" | "subcategory" | "description" | "about" | "founder" |
  "originStory" | "county" | "town" | "neighbourhood" | "serviceAreas" | "priceRange" | "operatingHours"
> & Partial<Pick<Business, "phone" | "whatsapp" | "email" | "website" | "logo" | "cover" | "businessType" | "visibility" | "socialLinks">>;
export type BusinessUpdateInput = Partial<BusinessCreateInput>;
export interface BusinessService {
  list(filters: BusinessFilters): Paged<Business>;
  get(businessId: string): Promise<Result<Business>>;
  create(input: BusinessCreateInput): Promise<Result<Business>>;
  update(businessId: string, input: BusinessUpdateInput): Promise<Result<Business>>;
  archive(businessId: string): Promise<Result<void>>;
  follow(businessId: string): Promise<Result<void>>;
  unfollow(businessId: string): Promise<Result<void>>;
  getFollowStatus(businessId: string): Promise<Result<FollowState>>;
  listFollowers(businessId: string, page: PageRequest): Paged<UserProfile>;
  inviteMember(businessId: string, input: { email: string; role: BusinessTeamMember["role"] }): Promise<Result<{ invitationId: string; status: "pending" }>>;
  removeMember(businessId: string, userId: string): Promise<Result<void>>;
}
export interface MembershipService {
  list(businessId: string, page: PageRequest): Paged<BusinessTeamMember>;
  listInvitations(businessId: string, page: PageRequest): Paged<BusinessInvitation>;
  listMyInvitations(page: PageRequest): Paged<BusinessInvitation>;
  invite(businessId: string, input: { email: string; role: BusinessTeamMember["role"] }): Promise<Result<{ invitationId: string; status: "pending" }>>;
  acceptInvitation(businessId: string, invitationId: string): Promise<Result<BusinessInvitation>>;
  declineInvitation(businessId: string, invitationId: string): Promise<Result<void>>;
  cancelInvitation(businessId: string, invitationId: string): Promise<Result<void>>;
  updateRole(businessId: string, userId: string, role: BusinessTeamMember["role"]): Promise<Result<BusinessTeamMember>>;
  remove(businessId: string, userId: string): Promise<Result<void>>;
  leave(businessId: string): Promise<Result<void>>;
  listActivity(businessId: string, page: PageRequest): Paged<BusinessActivityRecord>;
  requestOwnershipTransfer(businessId: string, email: string): Promise<Result<OwnershipTransfer>>;
  listMyOwnershipTransfers(): Promise<Result<OwnershipTransfer[]>>;
  acceptOwnershipTransfer(businessId: string, transferId: string): Promise<Result<OwnershipTransfer>>;
  declineOwnershipTransfer(businessId: string, transferId: string): Promise<Result<void>>;
  cancelOwnershipTransfer(businessId: string, transferId: string): Promise<Result<void>>;
}

export interface FeedFilters extends PageRequest {
  mode: "for-you" | "following" | "nearby";
  county?: Business["county"];
  town?: string;
}
export interface FeedService {
  list(filters: FeedFilters): Paged<Post>;
}
export interface PostMediaReference {
  mediaType: "image" | "video";
  url: string;
  altText?: string;
}
export interface ApiPollInput {
  question: string;
  options: string[];
  closesAt?: string;
}
export interface SocialApiComment extends PostComment {
  postId: string;
  parentCommentId: string | null;
  userName: string;
  userAvatar?: string;
  replyCount: number;
}
export interface PostCreateInput {
  kind: Post["kind"];
  caption: string;
  mediaId?: string;
  identityKind: Post["identityKind"];
  identityId: string;
  businessId?: string | null;
  location?: string;
  businessTags?: string[];
  productId?: string;
  hashtags?: string[];
  mentions?: string[];
  poll?: NonNullable<Post["poll"]>;
  mediaIds?: string[];
  mediaReferences?: PostMediaReference[];
  videoSubtitles?: string;
  mediaTextOverlay?: string;
  audience?: Post["audience"];
  allowComments?: boolean;
  allowSharing?: boolean;
}
export interface PostUpdateInput extends Partial<PostCreateInput> {}
export interface CommentInput { text: string; }
export interface PostsService {
  listFeed(filters: FeedFilters): Paged<Post>;
  listUserPosts(userId: string, page: PageRequest): Paged<Post>;
  listBusinessPosts(businessId: string, page: PageRequest): Paged<Post>;
  get(postId: string): Promise<Result<Post>>;
  create(input: PostCreateInput): Promise<Result<Post>>;
  update(postId: string, input: PostUpdateInput): Promise<Result<Post>>;
  delete(postId: string): Promise<Result<void>>;
  like(postId: string): Promise<Result<void>>;
  unlike(postId: string): Promise<Result<void>>;
  getLikeStatus(postId: string): Promise<Result<{ likeCount: number; viewerHasLiked: boolean }>>;
  save(postId: string): Promise<Result<void>>;
  unsave(postId: string): Promise<Result<void>>;
  comment(postId: string, input: CommentInput): Promise<Result<PostComment>>;
  reply(postId: string, commentId: string, input: CommentInput): Promise<Result<CommentReply>>;
  listComments(postId: string, page: PageRequest): Paged<SocialApiComment>;
  listReplies(commentId: string, page: PageRequest): Paged<SocialApiComment>;
  share(postId: string): Promise<Result<void>>;
  vote(postId: string, input: { optionIds: string[] }): Promise<Result<Poll>>;
  createPoll(postId: string, input: ApiPollInput): Promise<Result<Poll>>;
  getPoll(pollId: string): Promise<Result<Poll>>;
  votePoll(pollId: string, optionId: string): Promise<Result<Poll>>;
  getPollResults(pollId: string): Promise<Result<Poll>>;
}

export interface CatalogService {
  listProducts(businessId: string, page: CatalogListFilters): Paged<Product>;
  getProduct(businessId: string, productId: string): Promise<Result<Product>>;
  createProduct(businessId: string, input: Omit<Product, "id" | "businessId">): Promise<Result<Product>>;
  updateProduct(businessId: string, productId: string, input: Partial<Omit<Product, "id" | "businessId">>): Promise<Result<Product>>;
  deleteProduct(businessId: string, productId: string): Promise<Result<void>>;
  listServices(businessId: string, page: CatalogListFilters): Paged<Service>;
  getService(businessId: string, serviceId: string): Promise<Result<Service>>;
  createService(businessId: string, input: Omit<Service, "id" | "businessId">): Promise<Result<Service>>;
  updateService(businessId: string, serviceId: string, input: Partial<Omit<Service, "id" | "businessId">>): Promise<Result<Service>>;
  deleteService(businessId: string, serviceId: string): Promise<Result<void>>;
  setProductStatus(businessId: string, productId: string, status: CatalogStatusFilter): Promise<Result<Product>>;
  setServiceStatus(businessId: string, serviceId: string, status: CatalogStatusFilter): Promise<Result<Service>>;
  replaceProductGallery(businessId: string, productId: string, gallery: CatalogGalleryEntry[]): Promise<Result<Product>>;
  replaceServiceGallery(businessId: string, serviceId: string, gallery: CatalogGalleryEntry[]): Promise<Result<Service>>;
  uploadCatalogMedia(businessId: string, file: CatalogMediaUploadInput): Promise<Result<UploadedCatalogMedia>>;
  listPublicProducts(filters: CatalogDiscoveryFilters): Paged<Product>;
  listPublicServices(filters: CatalogDiscoveryFilters): Paged<Service>;
  getPublicProduct(slugOrId: string): Promise<Result<Product>>;
  getPublicService(slugOrId: string): Promise<Result<Service>>;
}

/** Server lifecycle used by management screens. DELETE archives, so there is no hard delete. */
export type CatalogStatusFilter = "draft" | "published" | "archived";
export type CatalogSort = "new" | "price_asc" | "price_desc" | "title";
export type CatalogAvailabilityFilter = "available" | "on_request" | "fully_booked" | "seasonal";
/** Offset paging (`page`/`pageSize`) plus the server-managed status filter. */
export interface CatalogListFilters extends PageRequest {
  status?: CatalogStatusFilter;
}
export interface CatalogDiscoveryFilters extends CatalogListFilters {
  category?: string;
  county?: Business["county"];
  town?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: CatalogSort;
  availability?: CatalogAvailabilityFilter;
}
/** One ordered gallery entry; index 0 is the primary image and at most 12 entries are accepted. */
export interface CatalogGalleryEntry {
  mediaAssetId: string;
  altText?: string;
}
/** A file picked on this device. The bytes are uploaded; the URI itself is never sent as a reference. */
export interface CatalogMediaUploadInput {
  uri: string;
  fileName: string;
  contentType: string;
  sizeBytes?: number;
}
export interface UploadedCatalogMedia {
  mediaAssetId: string;
  url: string;
  contentType: string;
  sizeBytes: number;
}

export interface StoriesService {
  listStories(page: PageRequest): Paged<FounderStory>;
  getStory(storyId: string): Promise<Result<FounderStory>>;
  saveStory(storyId: string): Promise<Result<void>>;
  unsaveStory(storyId: string): Promise<Result<void>>;
  listOpportunities(page: PageRequest): Paged<Opportunity>;
  getOpportunity(opportunityId: string): Promise<Result<Opportunity>>;
  saveOpportunity(opportunityId: string): Promise<Result<void>>;
  unsaveOpportunity(opportunityId: string): Promise<Result<void>>;
}

export type SocialStoryCreateInput = Omit<SocialStory, "id" | "authorId" | "createdAt" | "expiresAt"> & { durationHours?: number };
export interface SocialStoriesService {
  listActive(page: PageRequest): Paged<SocialStory>;
  get(storyId: string): Promise<Result<SocialStory>>;
  create(input: SocialStoryCreateInput): Promise<Result<SocialStory>>;
  delete(storyId: string): Promise<Result<void>>;
  listHighlights(ownerId: string, page: PageRequest): Paged<StoryHighlight>;
  createHighlight(input: Pick<StoryHighlight, "title" | "coverUri" | "storyIds">): Promise<Result<StoryHighlight>>;
  updateHighlight(highlightId: string, input: Partial<Pick<StoryHighlight, "title" | "coverUri" | "storyIds">>): Promise<Result<StoryHighlight>>;
  deleteHighlight(highlightId: string): Promise<Result<void>>;
}

export interface ListingsService {
  listOffers(businessId: string, page: PageRequest): Paged<BusinessOffer>;
  createOffer(businessId: string, input: Omit<BusinessOffer, "id" | "businessId" | "createdAt">): Promise<Result<BusinessOffer>>;
  updateOffer(businessId: string, offerId: string, input: Partial<Omit<BusinessOffer, "id" | "businessId" | "createdAt">>): Promise<Result<BusinessOffer>>;
  deleteOffer(businessId: string, offerId: string): Promise<Result<void>>;
  listEvents(page: PageRequest & { identityId?: string }): Paged<BusinessEvent>;
  createEvent(input: Omit<BusinessEvent, "id" | "createdAt">): Promise<Result<BusinessEvent>>;
  updateEvent(eventId: string, input: Partial<Omit<BusinessEvent, "id" | "createdAt">>): Promise<Result<BusinessEvent>>;
  deleteEvent(eventId: string): Promise<Result<void>>;
  listCommunityOpportunities(page: PageRequest): Paged<CommunityOpportunity>;
  createCommunityOpportunity(input: Omit<CommunityOpportunity, "id" | "createdAt">): Promise<Result<CommunityOpportunity>>;
  updateCommunityOpportunity(opportunityId: string, input: Partial<Omit<CommunityOpportunity, "id" | "createdAt">>): Promise<Result<CommunityOpportunity>>;
  deleteCommunityOpportunity(opportunityId: string): Promise<Result<void>>;
}

export interface BusinessReview {
  id: string;
  businessId: string;
  authorName: string;
  rating: number;
  title?: string;
  body: string;
  createdAt: string;
  verifiedVisit?: boolean;
}
export type GrowthDateRange = "7d" | "30d" | "90d";
export interface AnalyticsTrendPoint {
  label: string;
  profileViews: number;
  engagements: number;
  enquiries: number;
}
export interface BusinessGrowthAnalytics extends BusinessAnalytics {
  range: GrowthDateRange;
  trends: AnalyticsTrendPoint[];
}
export interface GrowthActivity {
  id: string;
  businessId: string;
  kind: "review" | "milestone" | "opportunity" | "analytics";
  title: string;
  detail: string;
  createdAt: string;
}
export interface BusinessGrowthSummary {
  businessId: string;
  businessName: string;
  rating: number;
  reviewCount: number;
  reviews: BusinessReview[];
  analytics: BusinessGrowthAnalytics;
  milestones: Milestone[];
  opportunities: Opportunity[];
  activity: GrowthActivity[];
}
export interface ReviewsService {
  list(businessId: string, page: PageRequest): Paged<BusinessReview>;
}
export interface BusinessGrowthService {
  getSummary(businessId: string, range?: GrowthDateRange): Promise<Result<BusinessGrowthSummary>>;
  listReviews(businessId: string, page: PageRequest): Paged<BusinessReview>;
  getAnalytics(businessId: string, range?: GrowthDateRange): Promise<Result<BusinessGrowthAnalytics>>;
  listMilestones(businessId: string, page: PageRequest): Paged<Milestone>;
  listOpportunities(businessId: string, page: PageRequest): Paged<Opportunity>;
}
export interface MilestoneAnalyticsService {
  listMilestones(businessId: string, page: PageRequest): Paged<Milestone>;
  createMilestone(businessId: string, input: Omit<Milestone, "id" | "businessId">): Promise<Result<Milestone>>;
  updateMilestone(businessId: string, milestoneId: string, input: Partial<Omit<Milestone, "id" | "businessId">>): Promise<Result<Milestone>>;
  deleteMilestone(businessId: string, milestoneId: string): Promise<Result<void>>;
  getAnalytics(businessId: string): Promise<Result<BusinessAnalytics>>;
}

export interface StartConversationInput { participantId?: string; businessId?: string; catalogItemId?: string; firstMessage?: string; }
export interface SendMessageInput {
  conversationId?: string;
  participantId?: string;
  businessId?: string;
  catalogItemId?: string;
  clientMessageId: string;
  text: string;
  mediaId?: string;
}
export interface MessagingService {
  listConversations(page: PageRequest): Paged<Conversation>;
  getConversation(conversationId: string): Promise<Result<Conversation>>;
  startConversation(input: StartConversationInput): Promise<Result<Conversation>>;
  listMessages(conversationId: string, page: PageRequest): Paged<ChatMessage>;
  sendMessage(input: SendMessageInput): Promise<Result<ChatMessage>>;
  markRead(conversationId: string): Promise<Result<void>>;
  markDelivered(conversationId: string): Promise<Result<void>>;
  archive(conversationId: string): Promise<Result<void>>;
  block(conversationId: string): Promise<Result<void>>;
  unblock(conversationId: string): Promise<Result<void>>;
}

export type SearchEntityType = "business" | "person" | "product" | "service" | "post" | "video" | "story";
export interface SearchHit {
  id: string;
  type: SearchEntityType;
  title: string;
  subtitle?: string;
  thumbnailUrl?: string;
  county?: Business["county"];
  town?: string;
  verified?: boolean;
  priceKsh?: number;
}
export interface SearchQuery extends PageRequest {
  query: string;
  types?: SearchEntityType[];
  county?: Business["county"];
  town?: string;
  category?: string;
}
export interface RecentlyViewedItem {
  id: string;
  entityId: string;
  type: "business" | "product" | "service" | "story";
  viewedAt: string;
}
export interface SearchService {
  search(input: SearchQuery): Paged<SearchHit>;
  listHistory(page: PageRequest): Paged<{ id: string; query: string; createdAt: string }>;
  recordSearch(query: string): Promise<Result<void>>;
  clearHistory(): Promise<Result<void>>;
  listRecentlyViewed(page: PageRequest): Paged<RecentlyViewedItem>;
  recordRecentlyViewed(input: Pick<RecentlyViewedItem, "entityId" | "type">): Promise<Result<RecentlyViewedItem>>;
  removeRecentlyViewed(type: RecentlyViewedItem["type"], entityId: string): Promise<Result<void>>;
}

export interface NotificationPreferences {
  inAppEnabled: boolean;
  pushEnabled: boolean;
  likes: boolean;
  comments: boolean;
  follows: boolean;
  messages: boolean;
  businessTeamActivity: boolean;
  businessUpdates: boolean;
}
export interface NotificationDevice {
  id: string;
  deviceIdentifier: string;
  platform: "ios" | "android" | "web" | "other";
  deviceName?: string;
  hasPushToken: boolean;
  createdAt: string;
  lastSeenAt: string;
}
export interface RegisterNotificationDeviceInput {
  deviceIdentifier: string;
  platform: NotificationDevice["platform"];
  deviceName?: string;
  pushToken?: string;
}
export interface NotificationsService {
  list(page: PageRequest): Paged<NotificationItem>;
  getUnreadCount(): Promise<Result<number>>;
  markRead(notificationId: string): Promise<Result<void>>;
  markAllRead(): Promise<Result<void>>;
  dismiss(notificationId: string): Promise<Result<void>>;
  getPreferences(): Promise<Result<NotificationPreferences>>;
  updatePreferences(patch: Partial<NotificationPreferences>): Promise<Result<NotificationPreferences>>;
  registerDevice(input: RegisterNotificationDeviceInput): Promise<Result<NotificationDevice>>;
  removeDevice(deviceId: string): Promise<Result<void>>;
}
export interface VerificationService {
  submit(businessId: string, input: { documentMediaIds: string[]; note?: string }): Promise<Result<VerificationRequest>>;
  list(businessId: string, page: PageRequest): Paged<VerificationRequest>;
  get(businessId: string, requestId: string): Promise<Result<VerificationRequest>>;
}
export interface ModerationService {
  report(input: { targetType: "post" | "video" | "business" | "user" | "comment"; targetId: string; reason: string; details?: string; idempotencyKey?: string }): Promise<Result<{ reportId: string; status: "submitted" | "under_review" | "resolved" | "closed" }>>;
  block(userId: string): Promise<Result<void>>;
  unblock(userId: string): Promise<Result<void>>;
  hidePost(postId: string): Promise<Result<void>>;
  unhidePost(postId: string): Promise<Result<void>>;
}

export interface MediaFileInput {
  uri: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  checksum?: string;
}
export interface MediaUploadTicket {
  uploadId: string;
  uploadUrl: string;
  method: "PUT" | "POST";
  transfer: "binary" | "multipart";
  fieldName?: string;
  headers?: Record<string, string>;
  fields?: Record<string, string>;
  expiresAt: string;
  supportsResume: boolean;
}
export interface MediaUploadProgress {
  bytesSent: number;
  totalBytes: number;
  percent: number;
}
export interface UploadedMedia {
  mediaId: string;
  url: string;
  contentType: string;
  sizeBytes: number;
}
export interface MediaUploadService {
  begin(file: Omit<MediaFileInput, "uri">): Promise<Result<MediaUploadTicket>>;
  upload(ticket: MediaUploadTicket, file: MediaFileInput, onProgress?: (progress: MediaUploadProgress) => void, signal?: AbortSignal): Promise<Result<void>>;
  complete(ticket: MediaUploadTicket): Promise<Result<UploadedMedia>>;
  resume(uploadId: string): Promise<Result<MediaUploadTicket>>;
  retry(uploadId: string, file: MediaFileInput, onProgress?: (progress: MediaUploadProgress) => void, signal?: AbortSignal): Promise<Result<UploadedMedia>>;
  cancel(uploadId: string): Promise<Result<void>>;
}

export interface ExportJob {
  id: string;
  status: "queued" | "processing" | "ready" | "failed" | "expired";
  requestedAt: string;
  expiresAt?: string;
  downloadUrl?: string;
}
export interface DataDeletionRequest {
  id: string;
  status: "requested" | "scheduled" | "processing" | "cancelled" | "completed";
  requestedAt: string;
  scheduledAt?: string;
  completedAt?: string;
}
export interface DataRightsService {
  requestExport(): Promise<Result<ExportJob>>;
  getExportStatus(exportId: string): Promise<Result<ExportJob>>;
  requestDeletion(input: { confirmation: string; reason?: string }): Promise<Result<DataDeletionRequest>>;
  getDeletionStatus(): Promise<Result<DataDeletionRequest | null>>;
  cancelDeletion(): Promise<Result<void>>;
}

export interface PreferencesService {
  get(): Promise<Result<AppSettings>>;
  update(patch: Partial<AppSettings>): Promise<Result<AppSettings>>;
}

export type MenuAudience = "everyone" | "followers" | "none";
export interface MenuSettings {
  textSize: string;
  highContrast: boolean;
  profileVisibility: "public" | "followers" | "private";
  messagePermission: MenuAudience;
  storyReplyPermission: MenuAudience;
  commentPermission: MenuAudience;
  tagPermission: MenuAudience;
  mentionPermission: MenuAudience;
  sharingPermission: MenuAudience;
  allowPostResharing: boolean;
  allowStorySharing: boolean;
  allowExternalSharing: boolean;
}
export type MenuSettingsUpdate = Partial<MenuSettings>;
export interface MenuSettingsService {
  getSettings(): Promise<Result<MenuSettings>>;
  updateSettings(patch: MenuSettingsUpdate): Promise<Result<MenuSettings>>;
}

export interface MabizServices {
  auth: AuthService;
  users: UserService;
  businesses: BusinessService;
  memberships: MembershipService;
  reviews: ReviewsService;
  growth: BusinessGrowthService;
  feed: FeedService;
  posts: PostsService;
  catalog: CatalogService;
  stories: StoriesService;
  socialStories: SocialStoriesService;
  listings: ListingsService;
  milestones: MilestoneAnalyticsService;
  messaging: MessagingService;
  search: SearchService;
  notifications: NotificationsService;
  verification: VerificationService;
  moderation: ModerationService;
  media: MediaUploadService;
  dataRights: DataRightsService;
  preferences: PreferencesService;
  menu: MenuSettingsService;
}
export interface StartConversationInput { participantId?: string; businessId?: string; catalogItemId?: string; firstMessage?: string; }
