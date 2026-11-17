import { apiConfig, type ApiClientConfig } from "@/lib/api/config";
import {
  MAX_CATALOGUE_GALLERY_IMAGES,
  buildCatalogMediaForm,
  catalogUploadIssue,
  isDeviceFileUri,
} from "@/lib/api/catalog-media";
import { JsonApiClient, type HttpRequestOptions } from "@/lib/api/http-client";
import type { ApiError, PageRequest, QueryParams, Result } from "@/lib/api/contracts";
import type {
  AuthSession,
  MabizServices,
  BusinessCreateInput,
  BusinessApiRole,
  BusinessActivityRecord,
  BusinessFilters,
  BusinessInvitation,
  BusinessUpdateInput,
  CommentInput,
  DataDeletionRequest,
  ExportJob,
  FeedFilters,
  MediaFileInput,
  MediaUploadProgress,
  MediaUploadTicket,
  NotificationPreferences,
  NotificationDevice,
  RegisterNotificationDeviceInput,
  PostCreateInput,
  PostUpdateInput,
  ProfileUpdate,
  RegistrationRequest,
  SearchQuery,
  SocialStoryCreateInput,
  SendMessageInput,
  StartConversationInput,
  OwnershipTransfer,
  UploadedMedia,
  SocialApiComment,
  ApiPollInput,
  FollowState,
  BusinessGrowthSummary, BusinessGrowthAnalytics, BusinessReview,
} from "@/lib/api/feature-contracts";
import type {
  CatalogDiscoveryFilters,
  CatalogGalleryEntry,
  CatalogListFilters,
  CatalogMediaUploadInput,
  CatalogStatusFilter,
  UploadedCatalogMedia,
} from "@/lib/api/feature-contracts";
import { SecureSessionTokenProvider, type SessionStorage } from "@/lib/api/secure-session";
import type { AppSettings, Business, BusinessEvent, BusinessOffer, BusinessTeamMember, CatalogAvailabilityStatus, CatalogGalleryImage, CatalogItemStatus, CatalogVisitType, ChatMessage, CommunityOpportunity, Conversation, Milestone, NotificationItem, Opportunity, Poll, Post, Product, Service, SocialStory, StoryHighlight, UserProfile } from "@/types/domain";
import { formatKes } from "@/utils/kenya";

function makeIdempotencyKey(): string {
  return `bc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}
function segment(value: string): string { return encodeURIComponent(value); }
function resource(...parts: string[]): string { return `/${parts.map(segment).join("/")}`; }
function pageQuery(page: { cursor?: string; limit: number; search?: string }): QueryParams {
  return { cursor: page.cursor, limit: page.limit, search: page.search };
}
function recordFailure<T>(code: string, message: string, retryable = false, details?: Record<string, unknown>): Result<T> {
  const requestId = makeIdempotencyKey();
  return { ok: false, source: "api", requestId, error: { code, message, retryable, requestId, ...(details ? { details } : {}) } };
}
function notFound<T>(entity: string): Result<T> {
  return recordFailure("NOT_FOUND", `${entity} was not found.`);
}
function isSuccess<T>(result: Result<T>): result is Extract<Result<T>, { ok: true }> { return result.ok; }
function mapResult<A, B>(result: Result<A>, map: (value: A) => B): Result<B> {
  return result.ok ? { ...result, data: map(result.data) } : result;
}
function keysetResult<A, B>(result: Result<ApiKeysetPage<A>>, map: (value: A) => B): Result<{ items: B[]; total: number; nextCursor?: string }> {
  return mapResult(result, (page) => ({ items: page.items.map(map), total: page.items.length, ...(page.nextCursor ? { nextCursor: page.nextCursor } : {}) }));
}
function mapPromiseResult<A, B>(result: Promise<Result<A>>, map: (value: A) => B): Promise<Result<B>> {
  return result.then((response) => mapResult(response, map));
}
function keysetPromiseResult<A, B>(result: Promise<Result<ApiKeysetPage<A>>>, map: (value: A) => B): Promise<Result<{ items: B[]; total: number; nextCursor?: string }>> {
  return result.then((response) => keysetResult(response, map));
}
function mapApiPoll(value: ApiPollDto): Poll {
  return { id: value.id, question: value.question, endsAt: value.closesAt ?? "", multipleChoice: false, votes: [], options: value.options.map((option) => ({ id: option.id, text: option.text, voteCount: option.votes })), totalVotes: value.options.reduce((sum, option) => sum + option.votes, 0), isClosed: value.isClosed, ...(value.viewerOptionId ? { viewerVoteOptionId: value.viewerOptionId } : {}) };
}
function productIdFromJson(value: string | null): string | undefined {
  if (!value) return undefined;
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed && typeof parsed === "object" && "productId" in parsed && typeof parsed.productId === "string" ? parsed.productId : undefined;
  } catch { return undefined; }
}
function mapApiPost(value: ApiPostDto): Post {
  const media = [...value.media].sort((left, right) => left.sortOrder - right.sortOrder);
  const businessId = value.businessId ?? undefined;
  const productId = productIdFromJson(value.productJson);
  const business = value.publisher.business;
  return {
    id: value.id, authorId: value.authorUserId, authorName: value.publisher.name, authorUsername: value.publisher.username, authorAvatar: value.publisher.avatar ?? undefined,
    identityKind: businessId ? "business" : "personal", identityId: businessId ?? value.authorUserId,
    ...(businessId ? { identityName: business?.name ?? "Business", identityAvatar: business?.logo ?? undefined } : {}),
    kind: value.kind, caption: value.text, media: media[0]?.url, mediaItems: media.map((item) => item.url),
    video: media.some((item) => item.mediaType === "video"), location: value.location ?? "", createdAt: value.createdAt,
    likes: value.likeCount, commentCount: value.commentCount, viewerHasLiked: value.viewerLiked, comments: [],
    ...(businessId ? { businessId } : {}), ...(productId ? { productId } : {}), hashtags: [], audience: value.audience, allowComments: value.allowComments,
    ...(value.poll ? { poll: mapApiPoll(value.poll) } : {}),
  };
}
function mapApiComment(value: ApiCommentDto): SocialApiComment {
  return { id: value.id, postId: value.postId, parentCommentId: value.parentCommentId, userId: value.authorUserId, userName: value.authorName ?? "Mabiz member", userAvatar: value.authorAvatar ?? undefined,
    text: value.text, createdAt: value.createdAt, updatedAt: value.updatedAt, replyCount: value.replyCount, replies: [] };
}

interface ApiNotificationDto {
  id: string; type: string; actorUserId: string | null; actorName: string | null; title: string; body: string;
  targetType: string; targetId: string | null; businessId: string | null; postId: string | null;
  conversationId: string | null; catalogItemId: string | null; createdAt: string; readAt: string | null; read: boolean;
}
interface ApiNotificationPreferencesDto {
  inAppEnabled: boolean; pushEnabled: boolean; messages: boolean; likes: boolean; comments: boolean;
  newFollowers: boolean; businessTeamActivity: boolean; businessUpdates: boolean;
}
interface ApiNotificationDeviceDto extends NotificationDevice {}
function mapApiNotification(value: ApiNotificationDto): NotificationItem {
  const type = value.type.toLowerCase();
  const kind: NotificationItem["kind"] = type === "follow" ? "follow"
    : type === "like" ? "like"
      : type === "comment" ? "comment"
        : type === "reply" ? "reply"
          : type === "message" ? "message"
            : type === "enquiry" ? "enquiry"
              : type === "team_invitation" || type === "team_invitation_accepted" || type === "team_role_changed" || type === "ownership_transfer" ? "business_activity"
                : "update";
  return {
    id: value.id, kind, title: value.title, detail: value.body, createdAt: value.createdAt, read: value.read,
    ...(value.actorName ? { actorName: value.actorName } : {}), targetType: value.targetType,
    ...(value.targetId ? { targetId: value.targetId } : {}), ...(value.businessId ? { businessId: value.businessId } : {}),
    ...(value.postId ? { postId: value.postId } : {}), ...(value.conversationId ? { conversationId: value.conversationId } : {}),
    ...(value.catalogItemId ? { catalogItemId: value.catalogItemId } : {}),
  };
}
function mapNotificationPreferences(value: ApiNotificationPreferencesDto): NotificationPreferences {
  return { inAppEnabled: value.inAppEnabled, pushEnabled: value.pushEnabled, messages: value.messages, likes: value.likes,
    comments: value.comments, follows: value.newFollowers, businessTeamActivity: value.businessTeamActivity, businessUpdates: value.businessUpdates };
}

function mapApiConversation(value: ApiConversationDto): Conversation {
  return { id: value.id, participantId: value.participantId ?? "", participantName: value.participantName,
    ...(value.businessId ? { businessId: value.businessId } : {}), kind: value.kind,
    ...(value.catalogItemId ? { catalogItemId: value.catalogItemId } : {}),
    ...(value.catalogItemTitle ? { catalogItemTitle: value.catalogItemTitle } : {}),
    lastMessage: value.lastMessage, updatedAt: value.lastMessageAt ?? value.createdAt, unread: value.unreadCount,
    isArchived: value.isArchived, isBlocked: value.isBlocked, messages: [] };
}
function mapApiConversationMessage(value: ApiConversationMessageDto): ChatMessage {
  return { id: value.id, senderId: value.senderUserId, text: value.text, createdAt: value.createdAt, status: value.status };
}
function apiPageNumber(page: PageRequest): number { const parsed = Number(page.cursor); return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1; }
function mapPagedResult<A, B>(result: Result<ApiPage<A>>, page: PageRequest, map: (value: A) => B): Result<{ items: B[]; total: number; nextCursor?: string }> {
  return mapResult(result, (payload) => ({ items: payload.items.map(map), total: payload.total,
    ...(payload.page * payload.pageSize < payload.total ? { nextCursor: String(payload.page + 1) } : {}) }));
}
function mapFollowState(value: FollowStateDto): FollowState {
  return { following: value.following, followerCount: value.followerCount };
}
function mapFollowProfile(value: FollowProfileDto): UserProfile {
  const county: UserProfile["county"] = "Nairobi";
  return { id: value.userId, username: value.username ?? "member", name: value.name ?? "Mabiz member", ...(value.avatar ? { avatar: value.avatar } : {}),
    bio: "", county, town: "", interests: [], privateProfile: false, followers: 0, following: 0 };
}
function apiPostBody(input: Partial<PostCreateInput>): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (input.kind !== undefined) body.kind = input.kind;
  if (input.caption !== undefined) body.text = input.caption;
  if (input.identityKind === "business") body.businessId = input.businessId ?? input.identityId;
  if (input.audience !== undefined || input.kind !== undefined) body.audience = input.audience ?? "public";
  if (input.audience !== undefined || input.kind !== undefined) body.discoverable = (input.audience ?? "public") === "public";
  if (input.productId !== undefined) body.productJson = input.productId ? JSON.stringify({ productId: input.productId }) : null;
  if (input.mediaReferences !== undefined || input.kind !== undefined) body.media = (input.mediaReferences ?? []).filter((item) => /^https:\/\//i.test(item.url)).map((item) => ({ mediaType: item.mediaType, url: item.url, altText: item.altText ?? null }));
  return body;
}

interface ApiGrowthSummaryDto { businessId: string; averageRating: number; reviewCount: number; milestoneCount: number; openOpportunityCount: number; profileViews: number; enquiries: number; from: string; to: string; }
interface ApiReviewDto { id: string; businessId: string; reviewerUserId: string; reviewerName: string | null; rating: number; comment: string; status: string; ownerResponse: string | null; ownerRespondedAt: string | null; createdAt: string; }
interface ApiReviewPageDto { items: ApiReviewDto[]; total: number; averageRating: number; page: number; pageSize: number; }
interface ApiMilestoneDto { id: string; businessId: string; title: string; description: string | null; achievedAt: string; isSelfReported: boolean; visibility: "public" | "private"; createdAt: string; }
interface ApiOpportunityDto { id: string; businessId: string; createdByUserId: string; title: string; description: string; category: string; budget: number | null; currency: string; expiresAt: string; status: string; isExpired: boolean; createdAt: string; }
interface ApiOpportunityPageDto { items: ApiOpportunityDto[]; total: number; page: number; pageSize: number; }
interface ApiAnalyticsDto { businessId: string; from: string; to: string; totalEvents: number; metrics: { eventType: string; count: number }[]; profileViews: number; enquiries: number; reviews: number; averageRating: number; }
function growthBounds(range: "7d" | "30d" | "90d"): { from: string; to: string } { const to = new Date(); const from = new Date(to.getTime() - Number(range.slice(0, -1)) * 86400000); return { from: from.toISOString(), to: to.toISOString() }; }
function mapGrowthReview(value: ApiReviewDto): BusinessReview { return { id: value.id, businessId: value.businessId, authorName: value.reviewerName ?? "Mabiz member", rating: value.rating, body: value.comment, createdAt: value.createdAt }; }
function mapGrowthMilestone(value: ApiMilestoneDto): Milestone { return { id: value.id, businessId: value.businessId, title: value.title, description: value.description ?? "", date: value.achievedAt.slice(0, 10), kind: "custom" }; }
function mapGrowthOpportunity(value: ApiOpportunityDto): Opportunity { const amount = value.budget ?? 0; return { id: value.id, title: value.title, industry: value.category, county: "Kenya-wide", startupCostMin: amount, startupCostMax: amount, costIsEstimate: true, requirements: [], equipment: [], skills: [], opportunity: value.description, advice: value.isExpired ? "This opportunity has expired." : "Contact the publisher through Mabiz messaging.", sourceLabel: "Community estimate" }; }
interface ApiBusinessProfile {
  id: string; ownerId: string; slug: string; name: string; businessType: "products" | "services" | "hybrid";
  category: string; subcategory: string; description: string; about: string; founder: string; founderId: string;
  originStory: string; county: Business["county"]; town: string; neighbourhood: string; serviceAreas: string[];
  phone: string | null; whatsapp: string | null; email: string | null; website: string | null;
  priceRange: Business["priceRange"]; operatingHours: string; logo: string | null; cover: string | null;
  visibility: "public" | "private"; status: "active" | "archived";
  createdAt: string; updatedAt: string; currentUserRole: string | null; socialLinks: Record<string, string>;
}
interface ApiPage<T> { items: T[]; total: number; page: number; pageSize: number; }
interface ApiKeysetPage<T> { items: T[]; nextCursor?: string; }
interface ApiPostDto {
  id: string; authorUserId: string; businessId: string | null; kind: Post["kind"]; audience: NonNullable<Post["audience"]>;
  discoverable: boolean; allowComments: boolean; location: string | null; text: string; productJson: string | null; createdAt: string; updatedAt: string;
  pollId: string | null; publisher: { userId: string; name: string; username: string; avatar: string | null; business: { id: string; name: string; slug: string; logo: string | null; cover: string | null } | null };
  poll: ApiPollDto | null;
  media: { id: string; mediaType: "image" | "video"; url: string; altText: string | null; sortOrder: number }[];
  likeCount: number; commentCount: number; viewerLiked: boolean;
}
interface ApiPollDto { id: string; postId: string; question: string; closesAt: string | null; isClosed: boolean; options: { id: string; text: string; votes: number }[]; viewerOptionId: string | null; }
interface ApiCommentDto { id: string; postId: string; authorUserId: string; parentCommentId: string | null; text: string; createdAt: string; updatedAt: string; replyCount: number; authorName?: string; authorUsername?: string; authorAvatar?: string | null; }
interface ApiConversationDto { id: string; kind: "direct" | "business"; businessId: string | null; businessName: string | null; catalogItemId: string | null; catalogItemTitle: string | null; participantId: string | null; participantName: string; lastMessage: string; lastMessageAt: string | null; unreadCount: number; isArchived: boolean; isBlocked: boolean; blockedByUserId: string | null; createdAt: string; }
interface ApiConversationPageDto { items: ApiConversationDto[]; total: number; page: number; pageSize: number; }
interface ApiConversationMessageDto { id: string; conversationId: string; senderUserId: string; senderName: string; text: string; createdAt: string; status: "sent" | "delivered" | "read"; clientMessageId: string; }
interface ApiConversationMessagePageDto { items: ApiConversationMessageDto[]; total: number; page: number; pageSize: number; }
interface FollowStateDto { following: boolean; followerCount: number; }
interface FollowProfileDto { userId: string; username: string; name: string; avatar: string | null; followedAt: string; }
interface ApiBusinessMember { userId: string; role: BusinessApiRole; joinedAt: string; displayName: string; email: string | null; avatar: string | null; }
function uiRole(role: BusinessApiRole): BusinessTeamMember["role"] {
  return role === "Admin" ? "Administrator" : role === "Editor" ? "Content Manager" : role;
}
function apiRole(role: BusinessTeamMember["role"]): BusinessApiRole {
  return role === "Administrator" ? "Admin" : role === "Content Manager" ? "Editor" : role;
}
function mapBusiness(value: ApiBusinessProfile): Business {
  return {
    id: value.id, ownerId: value.ownerId, name: value.name, slug: value.slug, category: value.category,
    subcategory: value.subcategory, description: value.description, about: value.about, founder: value.founder,
    founderId: value.founderId, originStory: value.originStory, county: value.county, town: value.town,
    neighbourhood: value.neighbourhood, serviceAreas: value.serviceAreas ?? [], phone: value.phone ?? "",
    whatsapp: value.whatsapp ?? "", email: value.email ?? "", website: value.website ?? undefined,
    priceRange: value.priceRange, rating: 0, followers: 0, verified: false, verificationStatus: "not_requested",
    verificationHistory: [], logo: value.logo ?? undefined, cover: value.cover ?? undefined,
    operatingHours: value.operatingHours, joinedAt: value.createdAt, createdAt: value.createdAt,
    updatedAt: value.updatedAt, businessType: value.businessType, visibility: value.visibility, status: value.status, socialLinks: value.socialLinks ?? {},
    currentUserRole: value.currentUserRole ? uiRole(value.currentUserRole as BusinessApiRole) : undefined,
    team: [], products: [], services: [], milestones: [],
    analytics: { profileViews: 0, postEngagement: 0, followersThisMonth: 0, videoViews: 0, productViews: 0, enquiries: 0 },
  };
}
function toPage<T>(items: T[], total: number, page: number, pageSize: number): { items: T[]; total: number; nextCursor?: string } {
  const nextOffset = page * pageSize;
  return { items, total, ...(nextOffset < total ? { nextCursor: String(nextOffset) } : {}) };
}
function backendPage(request: PageRequest) {
  const pageSize = Math.max(1, Math.min(100, Math.floor(request.limit || 20)));
  const offset = Math.max(0, Number.parseInt(request.cursor ?? "0", 10) || 0);
  return { page: Math.floor(offset / pageSize) + 1, pageSize };
}
function offsetPageResult<A, B>(result: Result<ApiPage<A>>, map: (item: A) => B): Result<{ items: B[]; total: number; nextCursor?: string }> {
  return mapResult(result, (response) => toPage(response.items.map(map), response.total, response.page, response.pageSize));
}
function offsetPageQuery(request: PageRequest): QueryParams { return backendPage(request); }

export interface UploadTransportOptions {
  signal?: AbortSignal;
  onProgress?: (progress: MediaUploadProgress) => void;
}

class UploadTransport {
  private readonly active = new Map<string, () => Promise<void>>();

  constructor(private readonly allowInsecureHttp: boolean) {}

  private isSecureUrl(raw: string): boolean {
    try {
      const parsed = new URL(raw);
      return !parsed.username && !parsed.password && (parsed.protocol === "https:" || (parsed.protocol === "http:" && this.allowInsecureHttp));
    } catch {
      return false;
    }
  }

  async send(ticket: MediaUploadTicket, file: MediaFileInput, options: UploadTransportOptions = {}): Promise<ApiError | null> {
    if (!file.uri || !file.fileName || file.sizeBytes < 0) return { code: "INVALID_MEDIA_FILE", message: "The selected file is not available for upload.", retryable: false };
    if (!this.isSecureUrl(ticket.uploadUrl)) return { code: "INVALID_UPLOAD_URL", message: "The upload ticket did not contain a secure storage URL.", retryable: false };
    if (options.signal?.aborted) return { code: "REQUEST_CANCELLED", message: "The upload was cancelled.", retryable: false };
    if (typeof document !== "undefined" && typeof window !== "undefined") {
      return this.sendBrowser(ticket, file, options);
    }
    return this.sendNative(ticket, file, options);
  }

  private async sendBrowser(ticket: MediaUploadTicket, file: MediaFileInput, options: UploadTransportOptions): Promise<ApiError | null> {
    let blob: Blob;
    try {
      const response = await fetch(file.uri);
      if (!response.ok) return { code: "LOCAL_FILE_UNAVAILABLE", message: "The selected file could not be read from this device.", retryable: false };
      blob = await response.blob();
    } catch {
      return { code: "LOCAL_FILE_UNAVAILABLE", message: "The selected file could not be read from this device.", retryable: false };
    }

    return new Promise<ApiError | null>((resolve) => {
      const xhr = new XMLHttpRequest();
      this.active.set(ticket.uploadId, async () => xhr.abort());
      const cleanup = () => {
        this.active.delete(ticket.uploadId);
        options.signal?.removeEventListener("abort", abort);
      };
      const abort = () => xhr.abort();
      options.signal?.addEventListener("abort", abort, { once: true });
      xhr.open(ticket.method, ticket.uploadUrl, true);
      for (const [key, value] of Object.entries(ticket.headers ?? {})) xhr.setRequestHeader(key, value);
      xhr.upload.onprogress = (event) => {
        const totalBytes = event.lengthComputable ? event.total : file.sizeBytes;
        const bytesSent = event.loaded;
        options.onProgress?.({ bytesSent, totalBytes, percent: totalBytes > 0 ? Math.min(100, Math.round((bytesSent / totalBytes) * 100)) : 0 });
      };
      xhr.onload = () => {
        cleanup();
        if (xhr.status >= 200 && xhr.status < 300) {
          options.onProgress?.({ bytesSent: file.sizeBytes, totalBytes: file.sizeBytes, percent: 100 });
          resolve(null);
        } else {
          resolve(this.uploadError(xhr.status, xhr.responseText));
        }
      };
      xhr.onerror = () => { cleanup(); resolve({ code: "UPLOAD_NETWORK_ERROR", message: "The media upload could not reach storage.", retryable: true }); };
      xhr.onabort = () => { cleanup(); resolve({ code: "UPLOAD_CANCELLED", message: "The media upload was cancelled.", retryable: true }); };

      if (ticket.transfer === "binary") {
        xhr.setRequestHeader("Content-Type", file.contentType);
        xhr.send(blob);
        return;
      }
      const form = new FormData();
      for (const [key, value] of Object.entries(ticket.fields ?? {})) form.append(key, value);
      form.append(ticket.fieldName || "file", blob, file.fileName);
      xhr.send(form);
    });
  }

  private async sendNative(ticket: MediaUploadTicket, file: MediaFileInput, options: UploadTransportOptions): Promise<ApiError | null> {
    try {
      const FileSystem = await import("expo-file-system/legacy");
      const uploadType = ticket.transfer === "binary" ? FileSystem.FileSystemUploadType.BINARY_CONTENT : FileSystem.FileSystemUploadType.MULTIPART;
      const task = FileSystem.createUploadTask(ticket.uploadUrl, file.uri, {
        uploadType,
        httpMethod: ticket.method,
        headers: { ...(ticket.headers ?? {}), ...(ticket.transfer === "binary" ? { "Content-Type": file.contentType } : {}) },
        sessionType: FileSystem.FileSystemSessionType.FOREGROUND,
        ...(ticket.transfer === "multipart" ? { fieldName: ticket.fieldName || "file", mimeType: file.contentType, parameters: ticket.fields ?? {} } : {}),
      }, (event) => {
        const totalBytes = event.totalBytesExpectedToSend || file.sizeBytes;
        const bytesSent = event.totalBytesSent;
        options.onProgress?.({ bytesSent, totalBytes, percent: totalBytes > 0 ? Math.min(100, Math.round((bytesSent / totalBytes) * 100)) : 0 });
      });
      this.active.set(ticket.uploadId, () => task.cancelAsync());
      const abort = () => { void task.cancelAsync(); };
      options.signal?.addEventListener("abort", abort, { once: true });
      const result = await task.uploadAsync();
      options.signal?.removeEventListener("abort", abort);
      this.active.delete(ticket.uploadId);
      if (!result) return { code: "UPLOAD_CANCELLED", message: "The media upload was cancelled.", retryable: true };
      if (result.status < 200 || result.status >= 300) return this.uploadError(result.status, result.body);
      options.onProgress?.({ bytesSent: file.sizeBytes, totalBytes: file.sizeBytes, percent: 100 });
      return null;
    } catch (error) {
      this.active.delete(ticket.uploadId);
      if (options.signal?.aborted) return { code: "UPLOAD_CANCELLED", message: "The media upload was cancelled.", retryable: true };
      const message = error instanceof Error ? error.message : "The upload failed before completion.";
      return { code: "UPLOAD_TRANSPORT_ERROR", message, retryable: true };
    }
  }

  private uploadError(status: number, body: string): ApiError {
    let code = status === 401 || status === 403 ? "UPLOAD_NOT_AUTHORIZED" : status === 413 ? "UPLOAD_TOO_LARGE" : status >= 500 ? "UPLOAD_STORAGE_ERROR" : `UPLOAD_HTTP_${status}`;
    let message = "The media could not be uploaded.";
    try {
      const payload: unknown = JSON.parse(body);
      if (payload && typeof payload === "object") {
        const root = payload as Record<string, unknown>;
        const nested = root.error && typeof root.error === "object" ? root.error as Record<string, unknown> : root;
        if (typeof nested.code === "string") code = nested.code;
        if (typeof nested.message === "string") message = nested.message;
      }
    } catch {
      // Never surface storage response bodies, signed URLs or provider diagnostics to the UI.
    }
    return { code, message, retryable: status === 408 || status === 425 || status === 429 || status >= 500, status };
  }

  async cancelLocal(uploadId: string): Promise<void> {
    await this.active.get(uploadId)?.();
    this.active.delete(uploadId);
  }
}

export interface ApiServicesOptions {
  config?: ApiClientConfig;
  client?: JsonApiClient;
  tokenProvider?: SecureSessionTokenProvider;
  sessionStorage?: SessionStorage;
  onSessionExpired?: () => Promise<void> | void;
}

/**
 * Production-mode HTTP adapters. These map the frontend contracts to proposed API routes;
 * configuring them does not create a backend or make an endpoint exist.
 */
export function createApiServices(options: ApiServicesOptions = {}): MabizServices {
  const config = options.config ?? apiConfig;
  const tokens = options.tokenProvider ?? new SecureSessionTokenProvider(options.sessionStorage, options.onSessionExpired);
  const client = options.client ?? new JsonApiClient(tokens, fetch, config.timeoutMs, config);
  const uploads = new UploadTransport(config.allowInsecureHttp);

  if (config.authRefreshPath) {
    tokens.setRefreshHandler(async (refreshToken) => {
      const refreshed = await client.post<AuthSession>(config.authRefreshPath!, { refreshToken }, { authenticated: false });
      return refreshed.ok ? refreshed.data : null;
    });
  }

  const get = <T>(path: string, opts?: HttpRequestOptions) => client.get<T>(path, opts);
  const post = <T>(path: string, body?: unknown, opts?: HttpRequestOptions) => client.post<T>(path, body, opts);
  const patch = <T>(path: string, body?: unknown, opts?: HttpRequestOptions) => client.patch<T>(path, body, opts);
  const put = <T>(path: string, body?: unknown, opts?: HttpRequestOptions) => client.put<T>(path, body, opts);
  const del = <T>(path: string, opts?: HttpRequestOptions) => client.delete<T>(path, opts);

  const auth: MabizServices["auth"] = {
    register: (input: RegistrationRequest) => post("/auth/register", input, { authenticated: false }),
    async login(input) {
      const result = await post<AuthSession>("/auth/login", input, { authenticated: false });
      if (!isSuccess(result)) return result;
      try {
        await tokens.saveSession(result.data);
        return result;
      } catch {
        return recordFailure("SECURE_SESSION_STORAGE_FAILED", "Secure sign-in could not be completed on this device.");
      }
    },
    async refresh(refreshToken) {
      if (!config.authRefreshPath) return recordFailure("AUTH_REFRESH_NOT_CONFIGURED", "Configure the reviewed refresh route before using API sessions.");
      const token = refreshToken ?? await tokens.getRefreshToken();
      if (!token) return recordFailure("SESSION_EXPIRED", "No refresh credential is available. Sign in again.");
      const result = await post<AuthSession>(config.authRefreshPath, { refreshToken: token }, { authenticated: false });
      if (result.ok) {
        try { await tokens.saveSession(result.data); }
        catch { return recordFailure("SECURE_SESSION_STORAGE_FAILED", "The refreshed session could not be stored securely."); }
      }
      return result;
    },
    async logout() {
      const result = await post<void>("/auth/logout", {});
      await tokens.clearTokens();
      return result;
    },
    requestVerificationCode: (input) => post("/auth/verification-codes", input, { authenticated: false }),
    verifyVerificationCode: (input) => post("/auth/verification-codes/verify", input, { authenticated: false }),
    requestPasswordReset: (input) => post("/auth/password-resets", input, { authenticated: false }),
        verifyPasswordResetCode: (input) => post("/auth/password-resets/verify", input, { authenticated: false }),
    completePasswordReset: (input) => post("/auth/password-resets/complete", input, { authenticated: false }),
  };

  const users: MabizServices["users"] = {
    getProfile: (userId) => get(userId === "me" ? "/users/me" : resource("users", userId)),
    updateMyProfile: (input: ProfileUpdate) => patch("/users/me", input),
    listFollowers: async (userId, page) => offsetPageResult(await get<ApiPage<FollowProfileDto>>(resource("users", userId, "followers"), { query: offsetPageQuery(page) }), mapFollowProfile),
    listFollowing: async (userId, page) => offsetPageResult(await get<ApiPage<FollowProfileDto>>(resource("users", userId, "following"), { query: offsetPageQuery(page) }), mapFollowProfile),
    follow: (userId) => post(resource("users", userId, "follow"), {}),
    unfollow: (userId) => del(resource("users", userId, "follow")),
    getFollowStatus: async (userId) => mapResult(await get<FollowStateDto>(resource("users", userId, "follow")), mapFollowState),
    requestFollow: (userId) => post(resource("users", userId, "follow-requests"), {}),
    listFollowRequests: (page) => get("/users/me/follow-requests", { query: pageQuery(page) }),
    acceptFollowRequest: (requestId) => post(resource("follow-requests", requestId, "accept"), {}),
    rejectFollowRequest: (requestId) => post(resource("follow-requests", requestId, "reject"), {}),
    cancelFollowRequest: (requestId) => del(resource("follow-requests", requestId)),
  };

  const businesses: MabizServices["businesses"] = {
    async list(filters: BusinessFilters) {
      const paging = backendPage(filters);
      const result = await get<ApiPage<ApiBusinessProfile>>("/businesses", { query: { ...paging } });
      return mapResult(result, (response) => toPage(response.items.map(mapBusiness), response.total, response.page, response.pageSize));
    },
    async get(businessId) { return mapResult(await get<ApiBusinessProfile>(resource("businesses", businessId)), mapBusiness); },
    async create(input: BusinessCreateInput) {
      const payload = { ...input, businessType: input.businessType ?? "hybrid", visibility: input.visibility ?? "public" };
      return mapResult(await post<ApiBusinessProfile>("/businesses", payload, { headers: { "Idempotency-Key": makeIdempotencyKey() } }), mapBusiness);
    },
    async update(businessId, input: BusinessUpdateInput) {
      return mapResult(await patch<ApiBusinessProfile>(resource("businesses", businessId), input), mapBusiness);
    },
    archive: (businessId) => del(resource("businesses", businessId)),
    follow: (businessId) => post(resource("businesses", businessId, "follow"), {}),
    unfollow: (businessId) => del(resource("businesses", businessId, "follow")),
    getFollowStatus: async (businessId) => mapResult(await get<FollowStateDto>(resource("businesses", businessId, "follow")), mapFollowState),
    listFollowers: async (businessId, page) => offsetPageResult(await get<ApiPage<FollowProfileDto>>(resource("businesses", businessId, "followers"), { query: offsetPageQuery(page) }), mapFollowProfile),
    async inviteMember(businessId, input) {
      const result = await post<BusinessInvitation>(resource("businesses", businessId, "invitations"), { email: input.email, role: apiRole(input.role) }, { headers: { "Idempotency-Key": makeIdempotencyKey() } });
      return mapResult(result, (invitation) => ({ invitationId: invitation.id, status: "pending" as const }));
    },
    removeMember: (businessId, userId) => del(resource("businesses", businessId, "members", userId)),
  };

  const memberships: MabizServices["memberships"] = {
    async list(businessId, request) {
      const paging = backendPage(request);
      const result = await get<ApiPage<ApiBusinessMember>>(resource("businesses", businessId, "members"), { query: paging });
      return mapResult(result, (response) => toPage(response.items.map((member) => ({ ...member, role: uiRole(member.role), email: member.email ?? "" })), response.total, response.page, response.pageSize));
    },
    async listInvitations(businessId, request) {
      const paging = backendPage(request);
      const result = await get<ApiPage<BusinessInvitation>>(resource("businesses", businessId, "invitations"), { query: paging });
      return mapResult(result, (response) => toPage(response.items, response.total, response.page, response.pageSize));
    },
    async listMyInvitations(request) {
      const paging = backendPage(request);
      const result = await get<ApiPage<BusinessInvitation>>("/businesses/me/invitations", { query: paging });
      return mapResult(result, (response) => toPage(response.items, response.total, response.page, response.pageSize));
    },
    invite: (businessId, input) => businesses.inviteMember(businessId, input),
    acceptInvitation: (businessId, invitationId) => post<BusinessInvitation>(resource("businesses", businessId, "invitations", invitationId, "accept"), {}),
    declineInvitation: (businessId, invitationId) => post<void>(resource("businesses", businessId, "invitations", invitationId, "decline"), {}),
    cancelInvitation: (businessId, invitationId) => del(resource("businesses", businessId, "invitations", invitationId)),
    updateRole: async (businessId, userId, role: BusinessTeamMember["role"]) => {
      const result = await patch<ApiBusinessMember>(resource("businesses", businessId, "members", userId, "role"), { role: apiRole(role) });
      return mapResult(result, (member) => ({ ...member, role: uiRole(member.role), email: member.email ?? "" }));
    },
    remove: (businessId, userId) => businesses.removeMember(businessId, userId),
    leave: (businessId) => post<void>(resource("businesses", businessId, "leave"), {}),
    async listActivity(businessId, request) {
      const paging = backendPage(request);
      const result = await get<ApiPage<BusinessActivityRecord>>(resource("businesses", businessId, "activity"), { query: paging });
      return mapResult(result, (response) => toPage(response.items, response.total, response.page, response.pageSize));
    },
    requestOwnershipTransfer: (businessId, email) => post<OwnershipTransfer>(resource("businesses", businessId, "ownership-transfers"), { newOwnerEmail: email }),
    listMyOwnershipTransfers: () => get<OwnershipTransfer[]>("/businesses/me/ownership-transfers"),
    acceptOwnershipTransfer: (businessId, transferId) => post<OwnershipTransfer>(resource("businesses", businessId, "ownership-transfers", transferId, "accept"), {}),
    declineOwnershipTransfer: (businessId, transferId) => post<void>(resource("businesses", businessId, "ownership-transfers", transferId, "decline"), {}),
    cancelOwnershipTransfer: (businessId, transferId) => post<void>(resource("businesses", businessId, "ownership-transfers", transferId, "cancel"), {}),
  };

  const reviews: MabizServices["reviews"] = {
    list: async (businessId, page) => { const paging = backendPage(page); const result = await get<ApiReviewPageDto>(resource("businesses", businessId, "reviews"), { query: paging }); return mapResult(result, (response) => toPage(response.items.map(mapGrowthReview), response.total, response.page, response.pageSize)); },
  };
  const growth: MabizServices["growth"] = {
    async getSummary(businessId, range = "30d") {
      const bounds = growthBounds(range);
      const [summary, reviewPage, milestonesPage, opportunitiesPage, analytics] = await Promise.all([
        get<ApiGrowthSummaryDto>(resource("businesses", businessId, "growth-summary"), { query: bounds }),
        get<ApiReviewPageDto>(resource("businesses", businessId, "reviews"), { query: { page: 1, pageSize: 5 } }),
        get<ApiMilestoneDto[]>(resource("businesses", businessId, "milestones")),
        get<ApiOpportunityPageDto>("/opportunities", { query: { page: 1, pageSize: 20, includeExpired: false } }),
        get<ApiAnalyticsDto>(resource("businesses", businessId, "analytics"), { query: bounds }),
      ]);
      if (!summary.ok) return summary;
      const reviewsData = reviewPage.ok ? reviewPage.data.items.map(mapGrowthReview) : [];
      const milestonesData = milestonesPage.ok ? milestonesPage.data.map(mapGrowthMilestone) : [];
      const opportunitiesData = opportunitiesPage.ok ? opportunitiesPage.data.items.filter((item) => item.businessId === businessId).map(mapGrowthOpportunity) : [];
      const analyticsData = analytics.ok ? analytics.data : undefined;
      const analyticsView: BusinessGrowthAnalytics = { profileViews: analyticsData?.profileViews ?? summary.data.profileViews, postEngagement: 0, followersThisMonth: 0, videoViews: 0, productViews: 0, enquiries: analyticsData?.enquiries ?? summary.data.enquiries, range, trends: [{ label: range, profileViews: analyticsData?.profileViews ?? summary.data.profileViews, engagements: analyticsData?.totalEvents ?? 0, enquiries: analyticsData?.enquiries ?? summary.data.enquiries }] };
      return { ok: true, source: "api", requestId: summary.requestId, data: { businessId, businessName: businessId, rating: summary.data.averageRating, reviewCount: summary.data.reviewCount, reviews: reviewsData, analytics: analyticsView, milestones: milestonesData, opportunities: opportunitiesData, activity: [...reviewsData.map((item) => ({ id: `review-${item.id}`, businessId, kind: "review" as const, title: "New review", detail: item.body, createdAt: item.createdAt })), ...milestonesData.map((item) => ({ id: `milestone-${item.id}`, businessId, kind: "milestone" as const, title: item.title, detail: item.description, createdAt: item.date }))] } };
    },
    listReviews: (businessId, page) => reviews.list(businessId, page),
    async getAnalytics(businessId, range = "30d") { const bounds = growthBounds(range); const result = await get<ApiAnalyticsDto>(resource("businesses", businessId, "analytics"), { query: bounds }); return mapResult(result, (value) => ({ profileViews: value.profileViews, postEngagement: 0, followersThisMonth: 0, videoViews: 0, productViews: 0, enquiries: value.enquiries, range, trends: [{ label: range, profileViews: value.profileViews, engagements: value.totalEvents, enquiries: value.enquiries }] })); },
    async listMilestones(businessId, page) { const result = await get<ApiMilestoneDto[]>(resource("businesses", businessId, "milestones")); return mapResult(result, (items) => toPage(items.map(mapGrowthMilestone), items.length, 1, items.length || page.limit)); },
    async listOpportunities(businessId, page) { const result = await get<ApiOpportunityPageDto>("/opportunities", { query: { page: 1, pageSize: page.limit, includeExpired: false } }); return mapResult(result, (response) => toPage(response.items.filter((item) => item.businessId === businessId).map(mapGrowthOpportunity), response.total, response.page, response.pageSize)); },
  };
  const posts: MabizServices["posts"] = {
    listFeed: (filters: FeedFilters) => keysetPromiseResult(get<ApiKeysetPage<ApiPostDto>>(filters.mode === "following" ? "/feed/following" : "/feed/for-you", { query: { cursor: filters.cursor, limit: filters.limit } }), mapApiPost),
    listUserPosts: (userId, page) => keysetPromiseResult(get<ApiKeysetPage<ApiPostDto>>(userId === "me" ? "/posts" : resource("users", userId, "posts"), { query: pageQuery(page) }), mapApiPost),
    listBusinessPosts: (businessId, page) => keysetPromiseResult(get<ApiKeysetPage<ApiPostDto>>(resource("businesses", businessId, "posts"), { query: pageQuery(page) }), mapApiPost),
    get: (postId) => mapPromiseResult(get<ApiPostDto>(resource("posts", postId)), mapApiPost),
    create: (input: PostCreateInput) => mapPromiseResult(post<ApiPostDto>("/posts", apiPostBody(input), { headers: { "Idempotency-Key": makeIdempotencyKey() } }), mapApiPost),
    update: (postId, input: PostUpdateInput) => mapPromiseResult(patch<ApiPostDto>(resource("posts", postId), apiPostBody(input)), mapApiPost),
    delete: (postId) => del(resource("posts", postId)),
    like: (postId) => post(resource("posts", postId, "likes"), {}),
    unlike: (postId) => del(resource("posts", postId, "likes")),
    getLikeStatus: async (postId) => mapResult(await get<ApiPostDto>(resource("posts", postId)), (value) => ({ likeCount: value.likeCount, viewerHasLiked: value.viewerLiked })),
    save: async () => recordFailure("UNSUPPORTED_ROUTE", "Saving posts is not available in this API version."),
    unsave: async () => recordFailure("UNSUPPORTED_ROUTE", "Saving posts is not available in this API version."),
    comment: (postId, input: CommentInput) => mapPromiseResult(post<ApiCommentDto>(resource("posts", postId, "comments"), input, { headers: { "Idempotency-Key": makeIdempotencyKey() } }), mapApiComment),
    reply: (postId, commentId, input: CommentInput) => mapPromiseResult(post<ApiCommentDto>(resource("comments", commentId, "replies"), input, { headers: { "Idempotency-Key": makeIdempotencyKey() } }), mapApiComment),
    listComments: (postId, page) => keysetPromiseResult(get<ApiKeysetPage<ApiCommentDto>>(resource("posts", postId, "comments"), { query: pageQuery(page) }), mapApiComment),
    listReplies: (commentId, page) => keysetPromiseResult(get<ApiKeysetPage<ApiCommentDto>>(resource("comments", commentId, "replies"), { query: pageQuery(page) }), mapApiComment),
    share: async () => recordFailure("UNSUPPORTED_ROUTE", "Post sharing is not available in this API version."),
    async vote(postId, input) {
      if (input.optionIds.length !== 1) return recordFailure("INVALID_POLL_SELECTION", "Choose exactly one option for this poll.");
      const post = await posts.get(postId);
      if (!post.ok) return post;
      if (!post.data.poll?.id) return recordFailure("POLL_NOT_FOUND", "This post does not include an active poll.");
      return posts.votePoll(post.data.poll.id, input.optionIds[0]!);
    },
    createPoll: (postId, input: ApiPollInput) => mapPromiseResult(post<ApiPollDto>(resource("posts", postId, "polls"), input, { headers: { "Idempotency-Key": makeIdempotencyKey() } }), mapApiPoll),
    getPoll: (pollId) => mapPromiseResult(get<ApiPollDto>(resource("polls", pollId)), mapApiPoll),
    votePoll: (pollId, optionId) => mapPromiseResult(post<ApiPollDto>(resource("polls", pollId, "votes"), { optionId }, { headers: { "Idempotency-Key": makeIdempotencyKey() } }), mapApiPoll),
    getPollResults: (pollId) => mapPromiseResult(get<ApiPollDto>(resource("polls", pollId, "results")), mapApiPoll),
  };

  const feed: MabizServices["feed"] = {
    list: (filters: FeedFilters) => posts.listFeed(filters),
  };

  const catalog: MabizServices["catalog"] = {
    async listProducts(businessId, page) {
      return offsetPageResult(await get<ApiPage<ApiCatalogItemDto>>(resource("businesses", businessId, "products"), { query: catalogListQuery(page) }), (item) => mapApiCatalogItem(item, config));
    },
    getProduct: (businessId, productId) => mapPromiseResult(get<ApiCatalogItemDto>(resource("businesses", businessId, "products", productId)), (item) => mapApiCatalogItem(item, config)),
    createProduct: (businessId, input: Omit<Product, "id" | "businessId">) => mapPromiseResult(post<ApiCatalogItemDto>(resource("businesses", businessId, "products"), apiProductBody(input, "create"), { headers: { "Idempotency-Key": makeIdempotencyKey() } }), (item) => mapApiCatalogItem(item, config)),
    updateProduct: (businessId, productId, input) => mapPromiseResult(patch<ApiCatalogItemDto>(resource("businesses", businessId, "products", productId), apiProductBody(input, "update")), (item) => mapApiCatalogItem(item, config)),
    // The server archives instead of erasing, so this mirrors DELETE /businesses/{b}/products/{id}.
    deleteProduct: (businessId, productId) => del<void>(resource("businesses", businessId, "products", productId)),
    setProductStatus: (businessId, productId, status: CatalogStatusFilter) => mapPromiseResult(post<ApiCatalogItemDto>(resource("businesses", businessId, "products", productId, "status"), { status }), (item) => mapApiCatalogItem(item, config)),
    replaceProductGallery: (businessId, productId, gallery: CatalogGalleryEntry[]) => mapPromiseResult(put<ApiCatalogItemDto>(resource("businesses", businessId, "products", productId, "media"), catalogGalleryBody(gallery)), (item) => mapApiCatalogItem(item, config)),
    async listServices(businessId, page) {
      return offsetPageResult(await get<ApiPage<ApiCatalogItemDto>>(resource("businesses", businessId, "services"), { query: catalogListQuery(page) }), (item) => mapApiCatalogService(item, config));
    },
    getService: (businessId, serviceId) => mapPromiseResult(get<ApiCatalogItemDto>(resource("businesses", businessId, "services", serviceId)), (item) => mapApiCatalogService(item, config)),
    createService: (businessId, input: Omit<Service, "id" | "businessId">) => mapPromiseResult(post<ApiCatalogItemDto>(resource("businesses", businessId, "services"), apiServiceBody(input, "create"), { headers: { "Idempotency-Key": makeIdempotencyKey() } }), (item) => mapApiCatalogService(item, config)),
    updateService: (businessId, serviceId, input) => mapPromiseResult(patch<ApiCatalogItemDto>(resource("businesses", businessId, "services", serviceId), apiServiceBody(input, "update")), (item) => mapApiCatalogService(item, config)),
    deleteService: (businessId, serviceId) => del<void>(resource("businesses", businessId, "services", serviceId)),
    setServiceStatus: (businessId, serviceId, status: CatalogStatusFilter) => mapPromiseResult(post<ApiCatalogItemDto>(resource("businesses", businessId, "services", serviceId, "status"), { status }), (item) => mapApiCatalogService(item, config)),
    replaceServiceGallery: (businessId, serviceId, gallery: CatalogGalleryEntry[]) => mapPromiseResult(put<ApiCatalogItemDto>(resource("businesses", businessId, "services", serviceId, "media"), catalogGalleryBody(gallery)), (item) => mapApiCatalogService(item, config)),
    async uploadCatalogMedia(businessId, file: CatalogMediaUploadInput) {
      const issue = catalogUploadIssue(file);
      if (issue) return recordFailure<UploadedCatalogMedia>(issue.code, issue.message);
      let form: FormData;
      try {
        form = await buildCatalogMediaForm(file);
      } catch {
        return recordFailure<UploadedCatalogMedia>("LOCAL_FILE_UNAVAILABLE", "The selected image could not be read from this device.");
      }
      const result = await post<ApiMediaAssetDto>(resource("businesses", businessId, "media"), form);
      return mapResult(result, (asset) => ({ mediaAssetId: asset.id, url: resolveApiUrl(config, asset.accessUrl), contentType: asset.contentType, sizeBytes: asset.sizeBytes }));
    },
    // Public discovery is anonymous: an expired session must never block browsing the published catalogue.
    async listPublicProducts(filters) {
      return offsetPageResult(await get<ApiPage<ApiPublicItemDto>>("/catalogue/products", { query: discoveryQuery(filters), authenticated: false }), (item) => mapApiPublicItem(item, config));
    },
    getPublicProduct: (slugOrId) => mapPromiseResult(get<ApiPublicItemDto>(resource("catalogue", "products", slugOrId), { authenticated: false }), (item) => mapApiPublicItem(item, config)),
    async listPublicServices(filters) {
      return offsetPageResult(await get<ApiPage<ApiPublicItemDto>>("/catalogue/services", { query: discoveryQuery(filters), authenticated: false }), (item) => mapApiPublicService(item, config));
    },
    getPublicService: (slugOrId) => mapPromiseResult(get<ApiPublicItemDto>(resource("catalogue", "services", slugOrId), { authenticated: false }), (item) => mapApiPublicService(item, config)),
  };

  const stories: MabizServices["stories"] = {
    listStories: (page) => get("/stories", { query: pageQuery(page) }),
    getStory: (storyId) => get(resource("stories", storyId)),
    saveStory: (storyId) => post(resource("stories", storyId, "saves"), {}),
    unsaveStory: (storyId) => del(resource("stories", storyId, "saves")),
    listOpportunities: (page) => get("/opportunities", { query: pageQuery(page) }),
    getOpportunity: (opportunityId) => get(resource("opportunities", opportunityId)),
    saveOpportunity: (opportunityId) => post(resource("opportunities", opportunityId, "saves"), {}),
    unsaveOpportunity: (opportunityId) => del(resource("opportunities", opportunityId, "saves")),
  };

  const socialStories: MabizServices["socialStories"] = {
    listActive: (page: PageRequest) => get("/social-stories", { query: { ...pageQuery(page), active: true } }),
    get: (storyId) => get(resource("social-stories", storyId)),
    create: (input: SocialStoryCreateInput) => post("/social-stories", input, { headers: { "Idempotency-Key": makeIdempotencyKey() } }),
    delete: (storyId) => del(resource("social-stories", storyId)),
    listHighlights: (ownerId, page: PageRequest) => get(resource("users", ownerId, "story-highlights"), { query: pageQuery(page) }),
    createHighlight: (input) => post("/users/me/story-highlights", input, { headers: { "Idempotency-Key": makeIdempotencyKey() } }),
    updateHighlight: (highlightId, input) => patch(resource("users", "me", "story-highlights", highlightId), input),
    deleteHighlight: (highlightId) => del(resource("users", "me", "story-highlights", highlightId)),
  };

  const listings: MabizServices["listings"] = {
    listOffers: (businessId, page: PageRequest) => get(resource("businesses", businessId, "offers"), { query: pageQuery(page) }),
    createOffer: (businessId, input) => post(resource("businesses", businessId, "offers"), input, { headers: { "Idempotency-Key": makeIdempotencyKey() } }),
    updateOffer: (businessId, offerId, input) => patch(resource("businesses", businessId, "offers", offerId), input),
    deleteOffer: (businessId, offerId) => del(resource("businesses", businessId, "offers", offerId)),
    listEvents: (page: PageRequest & { identityId?: string }) => get("/events", { query: { ...pageQuery(page), identityId: page.identityId } }),
    createEvent: (input: Omit<BusinessEvent, "id" | "createdAt">) => post("/events", input, { headers: { "Idempotency-Key": makeIdempotencyKey() } }),
    updateEvent: (eventId, input) => patch(resource("events", eventId), input),
    deleteEvent: (eventId) => del(resource("events", eventId)),
    listCommunityOpportunities: (page: PageRequest) => get("/community-opportunities", { query: pageQuery(page) }),
    createCommunityOpportunity: (input: Omit<CommunityOpportunity, "id" | "createdAt">) => post("/community-opportunities", input, { headers: { "Idempotency-Key": makeIdempotencyKey() } }),
    updateCommunityOpportunity: (opportunityId, input) => patch(resource("community-opportunities", opportunityId), input),
    deleteCommunityOpportunity: (opportunityId) => del(resource("community-opportunities", opportunityId)),
  };

  const milestones: MabizServices["milestones"] = {
    listMilestones: (businessId, page) => get(resource("businesses", businessId, "milestones"), { query: pageQuery(page) }),
    createMilestone: (businessId, input: Omit<Milestone, "id" | "businessId">) => post(resource("businesses", businessId, "milestones"), input, { headers: { "Idempotency-Key": makeIdempotencyKey() } }),
    updateMilestone: (businessId, milestoneId, input) => patch(resource("businesses", businessId, "milestones", milestoneId), input),
    deleteMilestone: (businessId, milestoneId) => del(resource("businesses", businessId, "milestones", milestoneId)),
    getAnalytics: (businessId) => get(resource("businesses", businessId, "analytics")),
  };

  const messaging: MabizServices["messaging"] = {
    async listConversations(page) {
      const p = apiPageNumber(page);
      const response = await get<ApiConversationPageDto>("/conversations", { query: { page: p, pageSize: page.limit } });
      return mapPagedResult(response, page, mapApiConversation);
    },
    getConversation: (conversationId) => mapPromiseResult(get<ApiConversationDto>(resource("conversations", conversationId)), mapApiConversation),
    startConversation: (input: StartConversationInput) => mapPromiseResult(
      post<ApiConversationDto>("/conversations", input, { headers: { "Idempotency-Key": makeIdempotencyKey() } }), mapApiConversation),
    async listMessages(conversationId, page) {
      const p = apiPageNumber(page);
      const response = await get<ApiConversationMessagePageDto>(resource("conversations", conversationId, "messages"), { query: { page: p, pageSize: page.limit } });
      return mapPagedResult(response, page, mapApiConversationMessage);
    },
    async sendMessage(input: SendMessageInput) {
      let conversationId = input.conversationId;
      if (!conversationId) {
        if (!input.participantId && !input.businessId) return recordFailure("CONVERSATION_TARGET_REQUIRED", "Choose a person or business before sending a message.");
        const started = await post<ApiConversationDto>("/conversations", {
          ...(input.participantId ? { participantId: input.participantId } : {}),
          ...(input.businessId ? { businessId: input.businessId } : {}),
          ...(input.catalogItemId ? { catalogItemId: input.catalogItemId } : {}),
        }, { headers: { "Idempotency-Key": input.clientMessageId } });
        if (!started.ok) return started;
        conversationId = started.data.id;
      }
      if (input.mediaId) return recordFailure("MESSAGE_MEDIA_NOT_SUPPORTED", "Message attachments are not enabled in Stage 6; send text or use the catalogue image already linked to this enquiry.");
      return mapPromiseResult(post<ApiConversationMessageDto>(resource("conversations", conversationId, "messages"),
        { clientMessageId: input.clientMessageId, text: input.text }, { headers: { "Idempotency-Key": input.clientMessageId } }), mapApiConversationMessage);
    },
    markDelivered: (conversationId) => post(resource("conversations", conversationId, "delivered"), {}),
    markRead: (conversationId) => post(resource("conversations", conversationId, "read"), {}),
    archive: (conversationId) => post(resource("conversations", conversationId, "archive"), {}),
    block: (conversationId) => post(resource("conversations", conversationId, "block"), {}),
    unblock: (conversationId) => del(resource("conversations", conversationId, "block")),
  };

  const search: MabizServices["search"] = {
    search: (input: SearchQuery) => get("/search", { query: { ...pageQuery(input), q: input.query, types: input.types, county: input.county, town: input.town, category: input.category } }),
    listHistory: (page) => get("/users/me/search-history", { query: pageQuery(page) }),
    recordSearch: (query) => post("/users/me/search-history", { query }),
    clearHistory: () => del("/users/me/search-history"),
    listRecentlyViewed: (page) => get("/users/me/recently-viewed", { query: pageQuery(page) }),
    recordRecentlyViewed: (input) => post("/users/me/recently-viewed", input),
    removeRecentlyViewed: (type, entityId) => del(resource("users", "me", "recently-viewed", type, entityId)),
  };

  const notifications: MabizServices["notifications"] = {
    async list(page) {
      const paging = { page: apiPageNumber(page), pageSize: Math.max(1, Math.min(100, Math.floor(page.limit || 20))) };
      return mapPagedResult(await get<ApiPage<ApiNotificationDto>>("/notifications", { query: paging }), page, mapApiNotification);
    },
    async getUnreadCount() { return mapResult(await get<{ count: number }>("/notifications/unread-count"), (value) => value.count); },
    markRead: (notificationId) => post(resource("notifications", notificationId, "read"), {}),
    markAllRead: () => post("/notifications/read-all", {}),
    dismiss: (notificationId) => del(resource("notifications", notificationId)),
    getPreferences: () => mapPromiseResult(get<ApiNotificationPreferencesDto>("/users/me/notification-preferences"), mapNotificationPreferences),
    updatePreferences: (preferences: Partial<NotificationPreferences>) => {
      const { follows, ...rest } = preferences;
      const body = { ...rest, ...(follows === undefined ? {} : { newFollowers: follows }) };
      return mapPromiseResult(patch<ApiNotificationPreferencesDto>("/users/me/notification-preferences", body), mapNotificationPreferences);
    },
    registerDevice: (input: RegisterNotificationDeviceInput) => post<ApiNotificationDeviceDto>("/users/me/devices", input),
    removeDevice: (deviceId) => del(resource("users", "me", "devices", deviceId)),
  };

  const verification: MabizServices["verification"] = {
    submit: (businessId, input) => post(resource("businesses", businessId, "verification-requests"), input, { headers: { "Idempotency-Key": makeIdempotencyKey() } }),
    list: (businessId, page) => get(resource("businesses", businessId, "verification-requests"), { query: pageQuery(page) }),
    get: (businessId, requestId) => get(resource("businesses", businessId, "verification-requests", requestId)),
  };

  const moderation: MabizServices["moderation"] = {
    report: (input) => post("/moderation/reports", { targetType: input.targetType, targetId: input.targetId, reason: input.reason, details: input.details }, { headers: { "Idempotency-Key": input.idempotencyKey ?? makeIdempotencyKey() } }),
    block: (userId) => post(resource("moderation", "blocks", userId), {}),
    unblock: (userId) => del(resource("moderation", "blocks", userId)),
    hidePost: (postId) => post(resource("moderation", "hidden-posts", postId), {}),
    unhidePost: (postId) => del(resource("moderation", "hidden-posts", postId)),
  };

  const media: MabizServices["media"] = {
    begin: (file) => post("/media/uploads", file, { headers: { "Idempotency-Key": makeIdempotencyKey() } }),
    upload: async (ticket: MediaUploadTicket, file: MediaFileInput, onProgress?: (progress: MediaUploadProgress) => void, signal?: AbortSignal) => {
      const error = await uploads.send(ticket, file, { onProgress, signal });
      if (error) {
        const requestId = makeIdempotencyKey();
        return { ok: false, source: "api", requestId, error: { ...error, requestId } };
      }
      return { ok: true, source: "api", requestId: makeIdempotencyKey(), data: undefined };
    },
    complete: (ticket) => post(resource("media", "uploads", ticket.uploadId, "complete"), {}, { headers: { "Idempotency-Key": makeIdempotencyKey() } }),
    resume: (uploadId) => get(resource("media", "uploads", uploadId)),
    async retry(uploadId, file, onProgress, signal) {
      const ticket = await get<MediaUploadTicket>(resource("media", "uploads", uploadId));
      if (!ticket.ok) return ticket;
      const transfer = await uploads.send(ticket.data, file, { onProgress, signal });
      if (transfer) {
        const requestId = makeIdempotencyKey();
        return { ok: false, source: "api", requestId, error: { ...transfer, requestId } };
      }
      return post<UploadedMedia>(resource("media", "uploads", uploadId, "complete"), {}, { headers: { "Idempotency-Key": makeIdempotencyKey() } });
    },
    async cancel(uploadId) {
      await uploads.cancelLocal(uploadId);
      return post(resource("media", "uploads", uploadId, "cancel"), {});
    },
  };

  const dataRights: MabizServices["dataRights"] = {
    requestExport: () => post<ExportJob>("/users/me/data-exports", {}, { headers: { "Idempotency-Key": makeIdempotencyKey() } }),
    getExportStatus: (exportId) => get(resource("users", "me", "data-exports", exportId)),
    requestDeletion: (input) => post<DataDeletionRequest>("/users/me/deletion-requests", input, { headers: { "Idempotency-Key": makeIdempotencyKey() } }),
    getDeletionStatus: () => get<DataDeletionRequest | null>("/users/me/deletion-requests/current"),
    cancelDeletion: () => del("/users/me/deletion-requests/current"),
  };

  const preferences: MabizServices["preferences"] = {
    get: () => get<AppSettings>("/users/me/preferences"),
    update: (values: Partial<AppSettings>) => patch<AppSettings>("/users/me/preferences", values),
  };

  return { auth, users, businesses, memberships, reviews, growth, feed, posts, catalog, stories, socialStories, listings, milestones, messaging, search, notifications, verification, moderation, media, dataRights, preferences };
}

// --- Stage 5 catalogue: DTOs, mappers and payload builders -------------------------------------------------

interface ApiGalleryDto {
  mediaAssetId: string; sortOrder: number; altText: string | null; accessUrl: string | null;
  contentType: string | null; sizeBytes: number; widthPx: number | null; heightPx: number | null; provider: string | null;
}
interface ApiCatalogItemDto {
  id: string; businessId: string; businessName: string | null; businessSlug: string | null; kind: string; title: string;
  slug: string | null; description: string; category: string | null; subcategory: string | null; priceKsh: number | null;
  priceNote: string | null; currency: string | null; priceNegotiable: boolean; sku: string | null; stockQuantity: number | null;
  inStock: boolean | null; unit: string | null; availabilityStatus: string | null; leadTimeDays: number | null;
  durationMinutes: number | null; serviceAreas: string[] | null; visitType: string | null; status: string | null;
  isPublished: boolean; attributes: Record<string, string> | null; media: ApiGalleryDto[] | null; createdAt: string;
  updatedAt: string; publishedAt: string | null; archivedAt: string | null; currentUserRole: string | null;
}
interface ApiPublicItemDto {
  id: string; kind: string; title: string; slug: string | null; summary: string | null; category: string | null;
  subcategory: string | null; priceKsh: number | null; priceNote: string | null; currency: string | null;
  priceNegotiable: boolean; sku: string | null; inStock: boolean | null; availabilityStatus: string | null;
  durationMinutes: number | null; visitType: string | null; serviceAreas?: string[] | null; media: ApiGalleryDto[] | null;
  businessId: string; businessName: string | null; businessSlug: string | null; county: string | null; town: string | null;
  publishedAt: string; updatedAt: string;
}
interface ApiMediaAssetDto {
  id: string; businessId: string; provider: string; contentType: string; sizeBytes: number; sha256: string;
  widthPx: number | null; heightPx: number | null; status: string; accessUrl: string; createdAt: string;
}
type CatalogWriteMode = "create" | "update";
interface CatalogCommonFields {
  id: string; businessId: string; businessName?: string | null; title: string; description?: string | null;
  category?: string | null; slug?: string | null; priceKsh: number | null; priceNote?: string | null;
  priceNegotiable?: boolean; sku?: string | null; inStock?: boolean | null; stockQuantity?: number | null;
  unit?: string | null; availabilityStatus?: string | null; durationMinutes?: number | null; leadTimeDays?: number | null;
  visitType?: string | null; serviceAreas?: string[] | null; status?: string | null; publishedAt?: string | null;
  updatedAt?: string | null; media?: ApiGalleryDto[] | null; town?: string | null; county?: string | null;
}

function apiOrigin(config: ApiClientConfig): string {
  try {
    return new URL(config.baseUrl).origin;
  } catch {
    return "";
  }
}

/** Gallery accessUrl is a relative API path; images only render once it is qualified with the API origin. */
function resolveApiUrl(config: ApiClientConfig, path?: string | null): string {
  const value = (path ?? "").trim();
  if (!value || /^https?:\/\//i.test(value)) return value;
  const origin = apiOrigin(config);
  return origin ? `${origin}${value.startsWith("/") ? value : `/${value}`}` : value;
}

function optionalText(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function mapCatalogGallery(media: ApiGalleryDto[] | null | undefined, config: ApiClientConfig): CatalogGalleryImage[] {
  return [...(media ?? [])]
    .filter((entry) => Boolean(entry?.mediaAssetId))
    .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0))
    .map((entry, index) => ({
      mediaAssetId: entry.mediaAssetId,
      url: resolveApiUrl(config, entry.accessUrl),
      sortOrder: typeof entry.sortOrder === "number" ? entry.sortOrder : index,
      altText: entry.altText ?? "",
      contentType: entry.contentType ?? "image/jpeg",
      sizeBytes: typeof entry.sizeBytes === "number" ? entry.sizeBytes : 0,
      widthPx: entry.widthPx ?? null,
      heightPx: entry.heightPx ?? null,
      provider: entry.provider === "s3" ? "s3" : "local",
    }));
}

function galleryUrls(gallery: CatalogGalleryImage[]): string[] {
  return gallery.map((entry) => entry.url);
}

function catalogStatusValue(value?: string | null): CatalogItemStatus {
  return value === "published" || value === "archived" ? value : "draft";
}

function catalogAvailabilityStatus(value?: string | null): CatalogAvailabilityStatus {
  const key = (value ?? "").trim().toLowerCase();
  return key === "on_request" || key === "fully_booked" || key === "seasonal" ? key : "available";
}

function catalogVisitType(value?: string | null): CatalogVisitType | undefined {
  const key = (value ?? "").trim().toLowerCase();
  return key === "onsite" || key === "remote" || key === "hybrid" ? key : undefined;
}

/** Products carry no server availability enum: stock is authoritative, so the display label is derived. */
function productAvailabilityLabel(inStock: boolean | null | undefined, stockQuantity: number | null | undefined): Product["availability"] {
  if (inStock === false) return "Out of stock";
  if (inStock === true) return "Available";
  if (typeof stockQuantity === "number" && stockQuantity <= 0) return "Out of stock";
  return "Available";
}

const CATALOG_AVAILABILITY_LABELS: Record<CatalogAvailabilityStatus, string> = {
  available: "Available", on_request: "On request", fully_booked: "Fully booked", seasonal: "Seasonal",
};

function catalogPriceLabel(priceKsh: number | null, priceNote?: string | null, priceNegotiable?: boolean): string {
  const parts: string[] = [];
  if (typeof priceKsh === "number" && Number.isFinite(priceKsh)) parts.push(formatKes(priceKsh));
  const note = optionalText(priceNote);
  if (note) parts.push(note);
  if (priceNegotiable) parts.push("Negotiable");
  return parts.join(" · ") || "Price on request";
}

function catalogLocation(fields: CatalogCommonFields): string {
  return [optionalText(fields.town), optionalText(fields.county)].filter(Boolean).join(", ");
}

function catalogProduct(fields: CatalogCommonFields, config: ApiClientConfig): Product {
  const gallery = mapCatalogGallery(fields.media, config);
  const status = catalogStatusValue(fields.status);
  return {
    id: fields.id, businessId: fields.businessId, name: fields.title, description: fields.description ?? "",
    price: typeof fields.priceKsh === "number" ? fields.priceKsh : 0,
    priceKsh: typeof fields.priceKsh === "number" ? fields.priceKsh : null,
    priceNote: optionalText(fields.priceNote),
    priceNegotiable: fields.priceNegotiable === true,
    availability: productAvailabilityLabel(fields.inStock, fields.stockQuantity),
    availabilityStatus: "available",
    location: catalogLocation(fields),
    image: gallery[0]?.url,
    images: galleryUrls(gallery),
    gallery,
    category: optionalText(fields.category) ?? "",
    sku: optionalText(fields.sku),
    stockQuantity: typeof fields.stockQuantity === "number" ? fields.stockQuantity : undefined,
    inStock: typeof fields.inStock === "boolean" ? fields.inStock : undefined,
    unit: optionalText(fields.unit),
    status,
    archived: status === "archived",
    publishedAt: fields.publishedAt ?? undefined,
    updatedAt: fields.updatedAt ?? undefined,
    slug: optionalText(fields.slug),
    businessName: optionalText(fields.businessName),
  };
}

function catalogService(fields: CatalogCommonFields, config: ApiClientConfig): Service {
  const gallery = mapCatalogGallery(fields.media, config);
  const status = catalogStatusValue(fields.status);
  const availabilityStatus = catalogAvailabilityStatus(fields.availabilityStatus);
  return {
    id: fields.id, businessId: fields.businessId, name: fields.title, description: fields.description ?? "",
    priceLabel: catalogPriceLabel(fields.priceKsh, fields.priceNote, fields.priceNegotiable),
    priceKsh: typeof fields.priceKsh === "number" ? fields.priceKsh : null,
    priceNote: optionalText(fields.priceNote),
    priceNegotiable: fields.priceNegotiable === true,
    availability: CATALOG_AVAILABILITY_LABELS[availabilityStatus],
    availabilityStatus,
    location: catalogLocation(fields),
    images: galleryUrls(gallery),
    gallery,
    category: optionalText(fields.category) ?? "",
    durationMinutes: typeof fields.durationMinutes === "number" ? fields.durationMinutes : undefined,
    leadTimeDays: typeof fields.leadTimeDays === "number" ? fields.leadTimeDays : undefined,
    visitType: catalogVisitType(fields.visitType),
    serviceAreas: Array.isArray(fields.serviceAreas) ? fields.serviceAreas : undefined,
    status,
    archived: status === "archived",
    publishedAt: fields.publishedAt ?? undefined,
    updatedAt: fields.updatedAt ?? undefined,
    slug: optionalText(fields.slug),
    businessName: optionalText(fields.businessName),
  };
}

/** Public items expose a trimmed summary and no stock/unit columns, so they are folded into the same mapper. */
function publicCatalogFields(value: ApiPublicItemDto): CatalogCommonFields {
  return {
    id: value.id, businessId: value.businessId, businessName: value.businessName, title: value.title,
    description: value.summary, category: value.category, slug: value.slug, priceKsh: value.priceKsh,
    priceNote: value.priceNote, priceNegotiable: value.priceNegotiable, sku: value.sku, inStock: value.inStock,
    availabilityStatus: value.availabilityStatus, durationMinutes: value.durationMinutes, visitType: value.visitType,
    serviceAreas: value.serviceAreas ?? null, media: value.media, status: "published", publishedAt: value.publishedAt,
    updatedAt: value.updatedAt, town: value.town, county: value.county,
  };
}

function mapApiCatalogItem(value: ApiCatalogItemDto, config: ApiClientConfig): Product { return catalogProduct(value, config); }
function mapApiCatalogService(value: ApiCatalogItemDto, config: ApiClientConfig): Service { return catalogService(value, config); }
function mapApiPublicItem(value: ApiPublicItemDto, config: ApiClientConfig): Product { return catalogProduct(publicCatalogFields(value), config); }
function mapApiPublicService(value: ApiPublicItemDto, config: ApiClientConfig): Service { return catalogService(publicCatalogFields(value), config); }

/** Device file URIs are upload sources, never catalogue references. */
function dropDeviceReferences(value: unknown): unknown {
  if (Array.isArray(value)) return value.filter((entry) => !(typeof entry === "string" && isDeviceFileUri(entry))).map(dropDeviceReferences);
  if (value && typeof value === "object") {
    const entry: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      if (typeof item === "string" && isDeviceFileUri(item)) continue;
      entry[key] = dropDeviceReferences(item);
    }
    return entry;
  }
  return value;
}

/** Ordered gallery ids; duplicates and blank ids are dropped because the server rejects them outright. */
function catalogGalleryBody(gallery: CatalogGalleryEntry[] | null | undefined): Record<string, unknown> {
  if (!gallery) return {};
  const mediaAssetIds: string[] = [];
  const altTexts: string[] = [];
  for (const item of gallery) {
    const mediaAssetId = item?.mediaAssetId?.trim();
    if (!mediaAssetId || isDeviceFileUri(mediaAssetId) || mediaAssetIds.includes(mediaAssetId)) continue;
    if (mediaAssetIds.length >= MAX_CATALOGUE_GALLERY_IMAGES) break;
    mediaAssetIds.push(mediaAssetId);
    altTexts.push(item.altText?.trim() ?? "");
  }
  return { mediaAssetIds, altTexts };
}

function galleryEntries(gallery: CatalogGalleryImage[] | undefined): CatalogGalleryEntry[] | undefined {
  if (!gallery) return undefined;
  return gallery.map((entry) => ({ mediaAssetId: entry.mediaAssetId, altText: entry.altText }));
}

/** PATCH keeps the stored price unless the client clears it explicitly, so a null price needs `clearPrice`. */
function catalogPriceBody(input: { priceKsh?: number | null; price?: number; priceNote?: string; priceNegotiable?: boolean }, mode: CatalogWriteMode): Record<string, unknown> {
  const priceKsh = input.priceKsh === undefined
    ? (typeof input.price === "number" && Number.isFinite(input.price) ? input.price : null)
    : (typeof input.priceKsh === "number" && Number.isFinite(input.priceKsh) ? input.priceKsh : null);
  const body: Record<string, unknown> = {
    priceKsh,
    priceNote: optionalText(input.priceNote) ?? "",
    priceNegotiable: input.priceNegotiable === true,
  };
  if (mode === "update" && priceKsh === null) body.clearPrice = true;
  return body;
}

/** Products reject lead time, duration, visit type, service areas and any availability enum; the server enforces that split by route. */
function apiProductBody(input: Partial<Product>, mode: CatalogWriteMode): Record<string, unknown> {
  const body: Record<string, unknown> = {
    title: input.name?.trim() ?? "",
    description: input.description?.trim() ?? "",
    category: input.category?.trim() ?? "",
    ...catalogPriceBody(input, mode),
  };
  const sku = optionalText(input.sku);
  if (sku) body.sku = sku.toUpperCase();
  if (typeof input.stockQuantity === "number" && Number.isFinite(input.stockQuantity)) body.stockQuantity = input.stockQuantity;
  if (input.inStock !== undefined) body.inStock = input.inStock;
  const unit = optionalText(input.unit);
  if (unit) body.unit = unit;
  if (input.status === "draft" || input.status === "published") body.status = input.status;
  return dropDeviceReferences({ ...body, ...catalogGalleryBody(galleryEntries(input.gallery)) }) as Record<string, unknown>;
}

/** Services reject SKU, stock and unit; the free-text price label travels as `priceNote`. */
function apiServiceBody(input: Partial<Service>, mode: CatalogWriteMode): Record<string, unknown> {
  const body: Record<string, unknown> = {
    title: input.name?.trim() ?? "",
    description: input.description?.trim() ?? "",
    category: input.category?.trim() ?? "",
    ...catalogPriceBody(input, mode),
    availabilityStatus: input.availabilityStatus ?? catalogAvailabilityStatus(input.availability),
  };
  if (typeof input.durationMinutes === "number" && Number.isFinite(input.durationMinutes)) body.durationMinutes = input.durationMinutes;
  if (typeof input.leadTimeDays === "number" && Number.isFinite(input.leadTimeDays)) body.leadTimeDays = input.leadTimeDays;
  if (input.visitType) body.visitType = input.visitType;
  if (Array.isArray(input.serviceAreas)) body.serviceAreas = input.serviceAreas.map((area) => area.trim()).filter(Boolean).slice(0, 20);
  if (input.status === "draft" || input.status === "published") body.status = input.status;
  return dropDeviceReferences({ ...body, ...catalogGalleryBody(galleryEntries(input.gallery)) }) as Record<string, unknown>;
}

function catalogListQuery(page: CatalogListFilters): QueryParams {
  return { status: page.status, search: optionalText(page.search), ...backendPage(page) };
}

function discoveryQuery(filters: CatalogDiscoveryFilters): QueryParams {
  return {
    search: optionalText(filters.search),
    category: optionalText(filters.category),
    county: filters.county,
    town: optionalText(filters.town),
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    sort: filters.sort ?? "new",
    availability: filters.availability,
    ...backendPage(filters),
  };
}
