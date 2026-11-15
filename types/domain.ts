import type { County } from "@/utils/kenya";

export type { County };
export type Id = string;
export type VerificationStatus = "not_requested" | "pending" | "approved" | "rejected";
export type TeamRole = "Owner" | "Administrator" | "Content Manager" | "Viewer";
export type IdentityKind = "personal" | "business";
export type ContentKind = "text" | "image" | "video" | "product" | "announcement" | "story" | "question" | "poll" | "experience" | "opinion" | "recommendation" | "education" | "tutorial" | "achievement" | "appreciation" | "challenge" | "promotion" | "event" | "opportunity";
export type ContentAudience = "public" | "followers" | "private";
export type AppearanceMode = "light" | "dark";
export type CatalogKind = "product" | "service";
export type CatalogItemStatus = "draft" | "published" | "archived";
export type CatalogAvailabilityStatus = "available" | "on_request" | "fully_booked" | "seasonal";
export type CatalogVisitType = "onsite" | "remote" | "hybrid";
export type CatalogImageProvider = "local" | "s3";

/** One ordered gallery entry as stored by the BizConnect catalogue API. Index 0 of a gallery is the primary image. */
export interface CatalogGalleryImage {
  mediaAssetId: Id;
  /** Absolute URL resolved against the API origin, ready to hand to <MediaImage />. */
  url: string;
  sortOrder: number;
  altText: string;
  contentType: string;
  sizeBytes: number;
  widthPx?: number | null;
  heightPx?: number | null;
  provider: CatalogImageProvider;
}

export interface UserProfile {
  id: Id;
  username: string;
  name: string;
  email?: string;
  phone?: string;
  bio: string;
  avatar?: string;
  county: County;
  town: string;
  neighbourhood?: string;
  interests: string[];
  privateProfile: boolean;
  followers: number;
  following: number;
}

export interface BusinessTeamMember {
  userId: Id;
  role: TeamRole;
  joinedAt: string;
  displayName: string;
  email: string;
}

export interface Business {
  id: Id;
  ownerId: Id;
  name: string;
  slug: string;
  category: string;
  subcategory: string;
  description: string;
  about: string;
  founder: string;
  founderId: Id;
  originStory: string;
  county: County;
  town: string;
  neighbourhood: string;
  serviceAreas: string[];
  phone: string;
  whatsapp: string;
  email: string;
  website?: string;
  socialLinks?: Record<string, string>;
  priceRange: "KSh" | "KSh KSh" | "KSh KSh KSh";
  rating: number;
  followers: number;
  verified: boolean;
  verificationStatus: VerificationStatus;
  verificationHistory: { status: VerificationStatus; date: string; note: string }[];
  logo?: string;
  cover?: string;
  operatingHours: string;
  joinedAt: string;
  businessType?: "products" | "services" | "hybrid";
  visibility?: "public" | "private";
  status?: "active" | "archived";
  currentUserRole?: TeamRole;
  createdAt?: string;
  updatedAt?: string;
  team: BusinessTeamMember[];
  products: Product[];
  services: Service[];
  milestones: Milestone[];
  analytics: BusinessAnalytics;
}

export interface Product {
  id: Id;
  businessId: Id;
  name: string;
  description: string;
  price: number;
  availability: "Available" | "Limited" | "Made to order" | "Out of stock";
  location: string;
  image?: string;
  images?: string[];
  video?: string;
  mediaItems?: { uri: string; type: "image" | "video" }[];
  archived?: boolean;
  discountedPrice?: number;
  variations?: { name: string; options: string[] }[];
  sizes?: string[];
  colours?: string[];
  specifications?: string;
  collectionAndDelivery?: string;
  stockQuantity?: number;
  category: string;
  // Stage 5 server-backed catalogue fields. Optional so existing local demo data keeps type-checking.
  sku?: string;
  priceKsh?: number | null;
  priceNote?: string;
  priceNegotiable?: boolean;
  inStock?: boolean;
  unit?: string;
  status?: CatalogItemStatus;
  publishedAt?: string;
  updatedAt?: string;
  slug?: string;
  businessName?: string;
  availabilityStatus?: CatalogAvailabilityStatus;
  gallery?: CatalogGalleryImage[];
}

export interface Service {
  id: Id;
  businessId: Id;
  name: string;
  description: string;
  priceLabel: string;
  pricingModel?: "fixed" | "hourly" | "daily" | "quote" | "package";
  // Server catalogue pricing: priceKsh is authoritative, priceLabel stays the human-readable line for existing screens.
  priceKsh?: number | null;
  priceNote?: string;
  priceNegotiable?: boolean;
  video?: string;
  images?: string[];
  mediaItems?: { uri: string; type: "image" | "video" }[];
  archived?: boolean;
  serviceAreas?: string[];
  availability?: string;
  availabilityStatus?: CatalogAvailabilityStatus;
  workingHours?: string;
  durationMinutes?: number;
  leadTimeDays?: number;
  visitType?: CatalogVisitType;
  bookingInstructions?: string;
  location: string;
  category: string;
  // Stage 5 lifecycle. The server never accepts a SKU for a service, so `sku` is only present for type symmetry with Product.
  sku?: string;
  status?: CatalogItemStatus;
  publishedAt?: string;
  updatedAt?: string;
  slug?: string;
  businessName?: string;
  gallery?: CatalogGalleryImage[];
}

export interface CommentReply {
  id: Id;
  userId: Id;
  text: string;
  createdAt: string;
  userName?: string;
  userAvatar?: string;
  updatedAt?: string;
}
export interface PostComment {
  id: Id;
  userId: Id;
  text: string;
  createdAt: string;
  replies: CommentReply[];
  postId?: Id;
  parentCommentId?: Id | null;
  userName?: string;
  userAvatar?: string;
  updatedAt?: string;
  replyCount?: number;
}
export interface Post {
  id: Id;
  authorId: Id;
  authorName?: string;
  authorUsername?: string;
  authorAvatar?: string;
  identityAvatar?: string;
  identityKind: IdentityKind;
  identityId: Id;
  identityName?: string;
  kind: ContentKind;
  contentSubtype?: string;
  caption: string;
  media?: string;
  video?: boolean;
  location: string;
  createdAt: string;
  likes: number;
  viewerHasLiked?: boolean;
  commentCount?: number;
  comments: PostComment[];
  businessId?: Id;
  businessTags?: Id[];
  productId?: Id;
  hashtags: string[];
  mentions?: string[];
  mediaItems?: string[];
  videoSubtitles?: string;
  mediaTextOverlay?: string;
  audience?: ContentAudience;
  allowComments?: boolean;
  allowSharing?: boolean;
  poll?: Poll;
}

export interface Poll {
  question: string;
  id?: Id;
  options: { id: Id; text: string; voteCount?: number }[];
  endsAt: string;
  multipleChoice: boolean;
  votes: { userId: Id; optionIds: Id[]; createdAt: string }[];
  totalVotes?: number;
  viewerVoteOptionId?: Id;
  isClosed?: boolean;
}

export interface SocialStory {
  id: Id;
  authorId: Id;
  identityKind: IdentityKind;
  identityId: Id;
  caption: string;
  background?: string;
  backgroundColor?: string;
  textColor?: string;
  fontStyle?: "modern" | "serif" | "bold" | "handwritten";
  musicTrack?: string;
  mediaItems: string[];
  mediaKind?: "image" | "video";
  overlays: { id: Id; text: string; kind: "text" | "emoji" | "location" | "mention" | "question" | "link"; x: number; y: number }[];
  audience: ContentAudience;
  createdAt: string;
  expiresAt: string;
  poll?: { question: string; options: string[]; votes: Record<string, number>; voterIds?: Record<string, string> };
  question?: string;
  link?: string;
}

export interface StoryHighlight {
  id: Id;
  ownerId: Id;
  title: string;
  coverUri?: string;
  storyIds: string[];
  createdAt: string;
}

export interface BusinessOffer {
  id: Id;
  businessId: Id;
  title: string;
  description: string;
  kind: "discount" | "limited-time" | "seasonal" | "bundle" | "coupon" | "free-delivery" | "clearance" | "special-deal";
  image?: string;
  originalPrice?: number;
  discountedPrice?: number;
  startsAt: string;
  expiresAt: string;
  terms?: string;
  productId?: string;
  serviceId?: string;
  status: "scheduled" | "active" | "expired" | "archived";
  createdAt: string;
}

export interface BusinessEvent {
  id: Id;
  identityKind: IdentityKind;
  identityId: Id;
  title: string;
  description: string;
  category: "networking" | "workshop" | "training" | "meetup" | "launch" | "webinar" | "promotion" | "entrepreneurship";
  startsAt: string;
  endsAt?: string;
  location: string;
  online: boolean;
  registrationInstructions: string;
  contact: string;
  cover?: string;
  createdAt: string;
}

export interface CommunityOpportunity {
  id: Id;
  identityKind: IdentityKind;
  identityId: Id;
  title: string;
  description: string;
  category: "idea" | "startup" | "partnership" | "collaboration" | "investment" | "supplier" | "distributor" | "franchise" | "mentorship-request" | "mentorship-offer" | "job" | "advice" | "market-gap" | "feedback";
  location: string;
  requirements: string;
  contactInstructions: string;
  image?: string;
  expiresAt?: string;
  investmentDisclosure?: string;
  createdAt: string;
}

export type StoryCategory =
  | "How I Started"
  | "Startup Capital"
  | "My First Customer"
  | "Business Challenges"
  | "Lessons Learned"
  | "Business Growth"
  | "Behind the Business"
  | "Business Opportunities";

export interface FounderStory {
  id: Id;
  founderId: Id;
  businessId: Id;
  title: string;
  intro: string;
  category: StoryCategory;
  industry: string;
  durationMinutes: number;
  cover?: string;
  body: string[];
  startupCapital: string;
  challenges: string[];
  lessons: string[];
  advice: string;
  sourceLabel: "Founder-submitted" | "Editorial";
  submittedAt: string;
}

export interface Opportunity {
  id: Id;
  title: string;
  industry: string;
  county: County | "Kenya-wide";
  startupCostMin: number;
  startupCostMax: number;
  costIsEstimate: true;
  requirements: string[];
  equipment: string[];
  skills: string[];
  opportunity: string;
  advice: string;
  sourceLabel: "Community estimate" | "Editorial estimate";
}

export interface Milestone {
  id: Id;
  businessId: Id;
  title: string;
  description: string;
  date: string;
  media?: string;
  mediaType?: "image" | "video";
  mediaItems?: { uri: string; type: "image" | "video" }[];
  kind: "launch" | "customer" | "sale" | "employee" | "location" | "branch" | "product" | "service" | "anniversary" | "partnership" | "expansion" | "achievement" | "custom";
}

export interface BusinessAnalytics {
  profileViews: number;
  postEngagement: number;
  followersThisMonth: number;
  videoViews: number;
  productViews: number;
  enquiries: number;
}

export interface NotificationItem {
  id: Id;
  kind: "follow" | "like" | "comment" | "reply" | "enquiry" | "message" | "update" | "business_activity";
  title: string;
  detail: string;
  createdAt: string;
  read: boolean;
  actorName?: string;
  targetType?: string;
  targetId?: string;
  businessId?: string;
  postId?: string;
  conversationId?: string;
  catalogItemId?: string;
}

export interface Conversation {
  id: Id;
  participantId: Id;
  participantName: string;
  businessId?: Id;
  kind?: "direct" | "business";
  catalogItemId?: Id;
  catalogItemTitle?: string;
  lastMessage: string;
  updatedAt: string;
  unread: number;
  isArchived?: boolean;
  isBlocked?: boolean;
  messages: ChatMessage[];
}

export interface ChatMessage {
  id: Id;
  senderId: Id;
  text: string;
  createdAt: string;
  status: "sent" | "delivered" | "read";
  image?: string;
}

export interface DraftPost {
  id: Id;
  kind: ContentKind;
  caption: string;
  media?: string;
  mediaItems?: string[];
  identityId: Id;
  businessTags?: Id[];
  productId?: Id;
  location?: string;
  updatedAt: string;
}

export interface AppSettings {
  language: "en" | "sw";
  appearance: AppearanceMode;
  reducedData: boolean;
  autoplayVideos: boolean;
  messagePermissions: "everyone" | "following" | "nobody";
  hidePreciseLocation: boolean;
  privateProfile: boolean;
  notifications: boolean;
}

export interface SearchHistoryItem {
  id: Id;
  query: string;
  createdAt: string;
}

export interface VerificationRequest {
  id: Id;
  businessId: Id;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  documents: string[];
  explanation?: string;
}
