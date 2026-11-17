import AsyncStorage from "@react-native-async-storage/async-storage";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { BUSINESSES, CURRENT_USER, NOTIFICATIONS, PEOPLE, POSTS, STORIES } from "@/data/seed";
import { PlatformSessionStorage } from "@/lib/api/secure-session";
import type { AppSettings, Business, BusinessEvent, BusinessOffer, ChatMessage, CommunityOpportunity, Conversation, NotificationItem, Post, StoryHighlight, TeamRole, UserProfile } from "@/types/domain";
import type { EnhancedSocialStory, EnhancedStoryHighlight, LocalStoryResponse, PersistedComposerDraft, ScheduledDemoPost } from "@/types/create-studio";
import { OWNER_ADMIN_ROLES } from "@/utils/business-permissions";
import { createOwnedBusinessRecord, resolveAccessibleBusinessIdentity, resolveManagedBusinessIdentity, updateBusinessRecord } from "@/utils/business-state";

import { evaluateMessagePermission, isPostVisible, toggleBlockRelationships, type PostVisibilityContext } from "@/utils/privacy-policy";
import { addCommentRecord, addReplyRecord, appendLocalMessage, appendReport, createConversationRecord, saveDraftRecord, toggleId, type ModerationReport } from "@/utils/social-state";
import { newLocalId } from "@/utils/ids";
import { DEFAULT_APP_SETTINGS, hydrateAppSettings, isAppearanceOnlyUpdate, serializeLocalAppState } from "@/utils/theme-preference";
import { canViewSocialStory } from "@/utils/social-story-privacy";

const STORAGE_KEY = "Mabiz-demo-state-v1";

type OnboardingStage = "idle" | "awaiting_otp" | "profile_setup";

type ToggleKey = "followedBusinesses" | "followedPeople" | "likedPosts" | "savedPosts" | "savedStories" | "likedStories" | "savedOpportunities" | "savedBusinesses";

interface AppState {
  user: UserProfile;
  businesses: Business[];
  posts: Post[];
  scheduledPosts: ScheduledDemoPost[];
  socialStories: EnhancedSocialStory[];
  socialStoryLikes: string[];
  socialStoryComments: Record<string, LocalStoryResponse[]>;
  storyViews: Record<string, string[]>;
  storyResponses: Record<string, LocalStoryResponse[]>;
  storyHighlights: EnhancedStoryHighlight[];
  businessOffers: BusinessOffer[];
  businessEvents: BusinessEvent[];
  communityOpportunities: CommunityOpportunity[];
  followedBusinesses: string[];
  followedPeople: string[];
  likedPosts: string[];
  savedPosts: string[];
  savedStories: string[];
  likedStories: string[];
  storyComments: Record<string, { id: string; userId: string; text: string; createdAt: string }[]>;
  savedOpportunities: string[];
  savedBusinesses: string[];
  recentlyViewed: string[];
  drafts: PersistedComposerDraft[];
  notifications: NotificationItem[];
  settings: AppSettings;
  activeBusinessId?: string;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  onboardingStage: OnboardingStage;
  localNotice?: string;
  conversations: Conversation[];
  searchHistory: string[];
  blockedUsers: string[];
  followRequests: string[];
  hiddenPosts: string[];
  reports: ModerationReport[];
}

interface AppActions {
  toggleBusinessFollow(id: string): void;
  togglePeopleFollow(id: string): void;
  requestFollow(id: string): void;
  cancelFollowRequest(id: string): void;
  toggleLike(id: string): void;
  togglePostSave(id: string): void;
  toggleStorySave(id: string): void;
  toggleStoryLike(id: string): void;
  addStoryComment(id: string, text: string): void;
  toggleOpportunitySave(id: string): void;
  toggleBusinessSave(id: string): void;
  addPost(post: Post): void;
  schedulePost(post: Post, scheduledAt: string): void;
  updateScheduledPost(id: string, patch: Partial<Post> & { scheduledAt?: string }): void;
  removeScheduledPost(id: string): void;
  updatePost(id: string, patch: Partial<Post>): void;
  deletePost(id: string): void;
  votePoll(postId: string, optionId: string): void;
  addSocialStory(story: EnhancedSocialStory): void;
  updateSocialStory(id: string, patch: Partial<EnhancedSocialStory>): void;
  toggleSocialStoryLike(id: string): void;
  markSocialStoryViewed(id: string): void;
  addSocialStoryComment(id: string, text: string): void;
  voteSocialStory(storyId: string, option: string): void;
  respondToSocialStory(storyId: string, text: string): void;
  removeSocialStory(id: string): void;
  addStoryHighlight(highlight: EnhancedStoryHighlight): void;
  updateStoryHighlight(id: string, patch: Partial<EnhancedStoryHighlight>): void;
  removeStoryFromHighlight(id: string, storyId: string): void;
  reorderStoryHighlight(id: string, storyIds: string[]): void;
  reorderStoryHighlights(ids: string[]): void;
  removeStoryHighlight(id: string): void;
  addBusinessOffer(offer: BusinessOffer): void;
  updateBusinessOffer(id: string, patch: Partial<BusinessOffer>): void;
  removeBusinessOffer(id: string): void;
  addBusinessEvent(event: BusinessEvent): void;
  updateBusinessEvent(id: string, patch: Partial<BusinessEvent>): void;
  removeBusinessEvent(id: string): void;
  addCommunityOpportunity(opportunity: CommunityOpportunity): void;
  updateCommunityOpportunity(id: string, patch: Partial<CommunityOpportunity>): void;
  removeCommunityOpportunity(id: string): void;
  addComment(postId: string, text: string): void;
  addReply(postId: string, commentId: string, text: string): void;
  updateBusiness(id: string, patch: Partial<Business>, allowedRoles?: readonly TeamRole[]): void;
  saveDraft(draft: PersistedComposerDraft): void;
  removeDraft(id: string): void;
  switchIdentity(id?: string): void;
  updateSettings(settings: Partial<AppSettings>): void;
  updateUser(user: Partial<UserProfile>): void;
  markNotificationRead(id: string): void;
  markAllNotificationsRead(): void;
  markConversationRead(id: string): void;
  addBusiness(business: Business): void;
  setApiUser(user: UserProfile): Promise<void>;
  replaceApiBusinesses(businesses: Business[]): void;
  upsertApiBusiness(business: Business): void;
  recordBusinessView(id: string): void;
  recordSearch(query: string): void;
  clearSearchHistory(): void;
  sendMessage(conversationId: string, text: string, image?: string): void;
  startConversation(participantId: string, participantName: string, businessId?: string): string | undefined;
  toggleBlock(id: string): void;
  hidePost(id: string): void;
  addReport(target: string, reason: string, details: string): void;
 
  deleteLocalDemoData(): Promise<void>;
  setAuthenticated(value: boolean): Promise<void>;
}

const INITIAL: Omit<AppState, "hasHydrated"> = {
  user: CURRENT_USER,
  businesses: BUSINESSES,
  posts: POSTS,
  scheduledPosts: [],
  socialStories: [],
  socialStoryLikes: [],
  socialStoryComments: {},
  storyViews: {},
  storyResponses: {},
  storyHighlights: [],
  businessOffers: [],
  businessEvents: [],
  communityOpportunities: [],
  followedBusinesses: ["b-kivuli", "b-bahari"],
  followedPeople: ["u-zawadi", "u-omar"],
  likedPosts: [],
  savedPosts: [],
  savedStories: [],
  likedStories: [],
  storyComments: {},
  savedOpportunities: [],
  savedBusinesses: ["b-asili"],
  recentlyViewed: ["b-kivuli", "b-bahari", "b-asili"],
  drafts: [],
  notifications: NOTIFICATIONS,
  settings: { ...DEFAULT_APP_SETTINGS },
  activeBusinessId: "b-tawi",
  isAuthenticated: false,
  onboardingStage: "idle",
  localNotice: "Demo profile · actions are stored on this device only",
  conversations: [
    { id: "conv-omar", participantId: "u-omar", participantName: "Omar Salim", businessId: "b-bahari", lastMessage: "We can set a table aside for Saturday.", updatedAt: "2025-01-12T08:10:00+03:00", unread: 1, messages: [{ id: "msg-1", senderId: "u-amani", text: "Hi Omar, are you taking small-group lunch bookings this weekend?", createdAt: "2025-01-11T16:34:00+03:00", status: "read" }, { id: "msg-2", senderId: "u-omar", text: "We are. We can set a table aside for Saturday.", createdAt: "2025-01-12T08:10:00+03:00", status: "delivered" }] },
    { id: "conv-zawadi", participantId: "u-zawadi", participantName: "Zawadi Mwangi", businessId: "b-kivuli", lastMessage: "Thank you for the thoughtful feedback!", updatedAt: "2025-01-10T14:25:00+03:00", unread: 0, messages: [{ id: "msg-3", senderId: "u-zawadi", text: "Thank you for the thoughtful feedback!", createdAt: "2025-01-10T14:25:00+03:00", status: "read" }] },
  ],
  searchHistory: [],
  blockedUsers: [],
  followRequests: [],
  hiddenPosts: [],
  reports: [],
};

const cloneInitial = (): AppState => ({ ...INITIAL, businesses: BUSINESSES.map((business) => ({ ...business, team: [...business.team] })), posts: POSTS.map((post) => ({ ...post, comments: [...post.comments] })), notifications: [...NOTIFICATIONS], hasHydrated: false });

const apiSession = new PlatformSessionStorage();

const hasApiSession = () => apiSession.read().then((session) => session !== null).catch(() => false);

const AppStoreContext = createContext<(AppState & AppActions) | null>(null);

function visibilityContext(state: AppState): PostVisibilityContext {
  return {
    viewerId: state.user.id,
    people: [...PEOPLE.filter((person) => person.id !== state.user.id), state.user],
    businesses: state.businesses,
    blockedUserIds: state.blockedUsers,
    hiddenPostIds: state.hiddenPosts,
    followedPeople: state.followedPeople,
    followedBusinessIds: state.followedBusinesses,
  };
}

function canSendMessage(state: AppState, participantId: string, businessId?: string): boolean {
  const participant = !businessId ? PEOPLE.find((person) => person.id === participantId) : undefined;
  return evaluateMessagePermission({
    isAuthenticated: state.isAuthenticated,
    participantId,
    privateProfile: participant?.privateProfile,
    businessId,
    businesses: state.businesses,
    blockedUserIds: state.blockedUsers,
    messagePermissions: state.settings.messagePermissions,
    followedPeople: state.followedPeople,
    followedBusinesses: state.followedBusinesses,
  }).allowed;
}

function canViewStory(state: AppState, storyId: string): boolean {
  const story = STORIES.find((item) => item.id === storyId);
  if (!story) return false;
  const business = state.businesses.find((item) => item.id === story.businessId);
  if (state.blockedUsers.includes(story.founderId) || (business && state.blockedUsers.includes(business.ownerId))) return false;
  const founder = PEOPLE.find((item) => item.id === story.founderId);
  return !founder?.privateProfile || founder.id === state.user.id || state.followedPeople.includes(founder.id);
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(cloneInitial);
  const stateRef = useRef(state);

  useEffect(() => { stateRef.current = state; }, [state]);

  useEffect(() => {
    let active = true;
    Promise.all([AsyncStorage.getItem(STORAGE_KEY), hasApiSession()]).then(([raw, authenticated]) => {
      if (!active) return;
      if (!raw) {
        setState((current) => ({ ...current, isAuthenticated: authenticated, hasHydrated: true }));
        return;
      }
      try {
        const saved = JSON.parse(raw) as Partial<AppState>;
        setState((current) => ({
          ...current,
          ...saved,
          settings: hydrateAppSettings(current.settings, saved.settings),
          notifications: saved.notifications ?? current.notifications,
          conversations: saved.conversations ?? current.conversations,
          followRequests: saved.followRequests ?? [],
          socialStoryLikes: saved.socialStoryLikes ?? [],
          socialStoryComments: saved.socialStoryComments ?? {},
          storyViews: saved.storyViews ?? {},
          storyResponses: saved.storyResponses ?? {},
          storyHighlights: saved.storyHighlights ?? [],
          hiddenPosts: saved.hiddenPosts ?? [],
          blockedUsers: saved.blockedUsers ?? [],
          reports: saved.reports ?? [],
          onboardingStage: "idle",
          isAuthenticated: authenticated,
          hasHydrated: true,
        }));
      } catch {
        setState((current) => ({ ...current, isAuthenticated: authenticated, hasHydrated: true }));
      }
    }).catch(() => setState((current) => ({ ...current, hasHydrated: true })));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!state.hasHydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, serializeLocalAppState(state)).catch(() => undefined);
  }, [state]);

  useEffect(() => {
    if (!state.isAuthenticated) return;
    let active = true;
    const validate = async () => {
      const valid = await hasApiSession();
      if (active && !valid) {
        setState((current) => current.isAuthenticated ? { ...current, isAuthenticated: false, localNotice: "Your session has expired. Sign in again to continue." } : current);
      }
    };
    const interval = setInterval(() => { void validate(); }, 30_000);
    void validate();
    return () => { active = false; clearInterval(interval); };
  }, [state.isAuthenticated]);

  const toggle = useCallback((key: ToggleKey, id: string) => {
    setState((current) => current.isAuthenticated ? { ...current, [key]: toggleId(current[key], id) } : current);
  }, []);

  const setSession = useCallback(async (value: boolean) => {
    if (!value) await apiSession.clear().catch(() => undefined);
    const signedIn = value && await hasApiSession();
    setState((current) => ({ ...current, isAuthenticated: signedIn, onboardingStage: "idle", localNotice: signedIn ? "Signed in to the Mabiz API" : "Signed out" }));
  }, []);

  const actions: AppActions = useMemo(() => ({
    toggleBusinessFollow: (id) => setState((current) => {
      const business = current.businesses.find((item) => item.id === id);
      if (!current.isAuthenticated || !business || current.blockedUsers.includes(business.ownerId)) return current;
      return { ...current, followedBusinesses: toggleId(current.followedBusinesses, id) };
    }),
    togglePeopleFollow: (id) => setState((current) => {
      const person = id === current.user.id ? current.user : PEOPLE.find((item) => item.id === id);
      if (!current.isAuthenticated || !person || person.id === current.user.id || current.blockedUsers.includes(id)) return current;
      if (person.privateProfile && !current.followedPeople.includes(id)) return { ...current, followRequests: current.followRequests.includes(id) ? current.followRequests : [...current.followRequests, id], localNotice: "Follow request saved locally; it was not sent to a service" };
      return { ...current, followedPeople: toggleId(current.followedPeople, id), followRequests: current.followRequests.filter((item) => item !== id) };
    }),
    requestFollow: (id) => setState((current) => current.isAuthenticated && !current.blockedUsers.includes(id) && !current.followRequests.includes(id) ? { ...current, followRequests: [...current.followRequests, id], localNotice: "Follow request saved locally" } : current),
    cancelFollowRequest: (id) => setState((current) => current.isAuthenticated ? { ...current, followRequests: current.followRequests.filter((item) => item !== id) } : current),
    toggleLike: (id) => setState((current) => {
      const post = current.posts.find((item) => item.id === id);
      if (!current.isAuthenticated || !post || !isPostVisible(post, visibilityContext(current))) return current;
      return { ...current, likedPosts: toggleId(current.likedPosts, id) };
    }),
    togglePostSave: (id) => setState((current) => {
      const post = current.posts.find((item) => item.id === id);
      if (!current.isAuthenticated || !post || !isPostVisible(post, visibilityContext(current))) return current;
      return { ...current, savedPosts: toggleId(current.savedPosts, id) };
    }),
    toggleStorySave: (id) => setState((current) => current.isAuthenticated && canViewStory(current, id) ? { ...current, savedStories: toggleId(current.savedStories, id) } : current),
    toggleStoryLike: (id) => setState((current) => current.isAuthenticated && canViewStory(current, id) ? { ...current, likedStories: toggleId(current.likedStories, id) } : current),
    addStoryComment: (id, text) => setState((current) => current.isAuthenticated && text.trim() && canViewStory(current, id) ? { ...current, storyComments: { ...current.storyComments, [id]: [...(current.storyComments[id] ?? []), { id: newLocalId("story-comment"), userId: current.user.id, text: text.trim(), createdAt: new Date().toISOString() }] } } : current),
    toggleOpportunitySave: (id) => toggle("savedOpportunities", id),
    toggleBusinessSave: (id) => setState((current) => {
      const business = current.businesses.find((item) => item.id === id);
      if (!current.isAuthenticated || !business || current.blockedUsers.includes(business.ownerId)) return current;
      return { ...current, savedBusinesses: toggleId(current.savedBusinesses, id) };
    }),
    addPost: (post) => setState((current) => {
      if (!current.isAuthenticated) return current;
      const validIdentity = post.identityKind === "personal" ? post.identityId === current.user.id : resolveManagedBusinessIdentity(current.businesses, current.user.id, post.identityId) === post.identityId;
      if (!validIdentity) return { ...current, localNotice: "This account cannot publish as the selected business" };
      if (current.posts.some((item) => item.id === post.id)) return current;
      return { ...current, posts: [post, ...current.posts], localNotice: "Published locally on this device; no server received the post" };
    }),
    updatePost: (id, patch) => setState((current) => {
      const existing = current.posts.find((item) => item.id === id);
      if (!current.isAuthenticated || !existing || existing.authorId !== current.user.id) return current;
      const identityAllowed = patch.identityKind === "business" || existing.identityKind === "business"
        ? resolveManagedBusinessIdentity(current.businesses, current.user.id, patch.identityId ?? existing.identityId) === (patch.identityId ?? existing.identityId)
        : (patch.identityId ?? existing.identityId) === current.user.id;
      if (!identityAllowed) return { ...current, localNotice: "You cannot publish or edit under that identity" };
      return { ...current, posts: current.posts.map((item) => item.id === id ? { ...item, ...patch, poll: patch.kind && patch.kind !== "poll" ? undefined : patch.poll ?? item.poll, id, authorId: existing.authorId } : item), localNotice: "Post updated locally on this device" };
    }),
    deletePost: (id) => setState((current) => {
      const post = current.posts.find((item) => item.id === id);
      if (!current.isAuthenticated || !post || post.authorId !== current.user.id) return current;
      return { ...current, posts: current.posts.filter((item) => item.id !== id), hiddenPosts: current.hiddenPosts.filter((item) => item !== id), localNotice: "Post deleted from this device only" };
    }),
    votePoll: (postId, optionId) => setState((current) => {
      if (!current.isAuthenticated) return current;
      const post = current.posts.find((item) => item.id === postId);
      const poll = post?.poll;
      if (!post || post.kind !== "poll" || !poll || new Date(poll.endsAt).getTime() <= Date.now() || !poll.options.some((option) => option.id === optionId)) return current;
      const existing = poll.votes.find((vote) => vote.userId === current.user.id);
      if (existing && !poll.multipleChoice) return { ...current, localNotice: "Your vote is already recorded on this device" };
      const optionIds = existing ? (existing.optionIds.includes(optionId) ? existing.optionIds.filter((id) => id !== optionId) : [...existing.optionIds, optionId]) : [optionId];
      const votes = existing ? poll.votes.map((vote) => vote.userId === current.user.id ? { ...vote, optionIds } : vote) : [...poll.votes, { userId: current.user.id, optionIds, createdAt: new Date().toISOString() }];
      return { ...current, posts: current.posts.map((item) => item.id === postId ? { ...item, poll: { ...poll, votes } } : item), localNotice: "Poll vote saved on this device; it was not sent to a server" };
    }),
    schedulePost: (post, scheduledAt) => setState((current) => {
      const timestamp = new Date(scheduledAt).getTime();
      const validIdentity = post.identityKind === "personal" ? post.identityId === current.user.id : resolveManagedBusinessIdentity(current.businesses, current.user.id, post.identityId) === post.identityId;
      if (!current.isAuthenticated || post.authorId !== current.user.id || !validIdentity || !Number.isFinite(timestamp) || timestamp <= Date.now()) return { ...current, localNotice: "Choose a valid future time and an identity you manage" };
      return { ...current, scheduledPosts: [{ ...post, scheduledAt: new Date(timestamp).toISOString() }, ...current.scheduledPosts.filter((item) => item.id !== post.id)], localNotice: "Schedule saved on this device only; no background delivery or server publishing is configured" };
    }),
    updateScheduledPost: (id, patch) => setState((current) => {
      const existing = current.scheduledPosts.find((item) => item.id === id);
      const nextTime = patch.scheduledAt === undefined ? existing?.scheduledAt : patch.scheduledAt;
      const identityId = patch.identityId ?? existing?.identityId;
      const identityKind = patch.identityKind ?? existing?.identityKind;
      const validIdentity = identityKind === "personal" ? identityId === current.user.id : identityId !== undefined && resolveManagedBusinessIdentity(current.businesses, current.user.id, identityId) === identityId;
      if (!current.isAuthenticated || !existing || existing.authorId !== current.user.id || !nextTime || new Date(nextTime).getTime() <= Date.now() || !validIdentity) return current;
      return { ...current, scheduledPosts: current.scheduledPosts.map((item) => item.id === id ? { ...item, ...patch, scheduledAt: new Date(nextTime).toISOString(), id, authorId: current.user.id } : item), localNotice: "Local schedule updated; no server will deliver it" };
    }),
    removeScheduledPost: (id) => setState((current) => current.isAuthenticated && current.scheduledPosts.some((item) => item.id === id && item.authorId === current.user.id) ? { ...current, scheduledPosts: current.scheduledPosts.filter((item) => item.id !== id), localNotice: "Scheduled demo removed from this device" } : current),
    addSocialStory: (story) => setState((current) => {
      if (!current.isAuthenticated) return current;
      const identityAllowed = story.identityKind === "personal" ? story.identityId === current.user.id : resolveManagedBusinessIdentity(current.businesses, current.user.id, story.identityId) === story.identityId;
      if (!identityAllowed) return { ...current, localNotice: "You cannot publish a Story under that identity" };
      if (!story.mediaItems.length && !story.caption.trim()) return current;
      const now = Date.now();
      const createdAt = new Date(now).toISOString();
      const bounded = { ...story, createdAt, expiresAt: new Date(Math.min(new Date(story.expiresAt).getTime(), now + 24 * 60 * 60 * 1000)).toISOString() };
      return { ...current, socialStories: [bounded, ...current.socialStories.filter((item) => item.id !== story.id)], localNotice: "Story saved locally; it expires within 24 hours on this device and was not shared" };
    }),
    updateSocialStory: (id, patch) => setState((current) => {
      const existing = current.socialStories.find((item) => item.id === id && item.authorId === current.user.id);
      if (!current.isAuthenticated || !existing) return current;
      const identityId = patch.identityId ?? existing.identityId;
      const identityKind = patch.identityKind ?? existing.identityKind;
      const allowed = identityKind === "personal" ? identityId === current.user.id : resolveManagedBusinessIdentity(current.businesses, current.user.id, identityId) === identityId;
      if (!allowed) return { ...current, localNotice: "You cannot edit this Story under the selected identity" };
      return { ...current, socialStories: current.socialStories.map((item) => item.id === id ? { ...item, ...patch, id, authorId: existing.authorId } : item), localNotice: "Story updated on this device" };
    }),
    markSocialStoryViewed: (id) => setState((current) => {
      const story = current.socialStories.find((item) => item.id === id);
      const ownerArchive = story?.authorId === current.user.id || current.storyHighlights.some((item) => item.ownerId === current.user.id && item.storyIds.includes(id));
      const business = story?.identityKind === "business" ? current.businesses.find((item) => item.id === story.identityId) : undefined;
      const visible = story && canViewSocialStory(story, { viewerId: current.user.id, followedUserIds: current.followedPeople, followedBusinessIds: current.followedBusinesses, blockedUserIds: current.blockedUsers, businessOwnerId: business?.ownerId });
      if (!current.isAuthenticated || !story || (!ownerArchive && Date.parse(story.expiresAt) <= Date.now()) || !visible) return current;
      const viewers = current.storyViews[id] ?? [];
      if (viewers.includes(current.user.id)) return current;
      return { ...current, storyViews: { ...current.storyViews, [id]: [...viewers, current.user.id] } };
    }),
    toggleSocialStoryLike: (id) => setState((current) => {
      const story = current.socialStories.find((item) => item.id === id && new Date(item.expiresAt).getTime() > Date.now());
      if (!current.isAuthenticated || !story || !canViewSocialStory(story, { viewerId: current.user.id, followedUserIds: current.followedPeople, followedBusinessIds: current.followedBusinesses, blockedUserIds: current.blockedUsers, businessOwnerId: current.businesses.find((item) => item.id === story.identityId)?.ownerId })) return current;
      return { ...current, socialStoryLikes: toggleId(current.socialStoryLikes, id), localNotice: "Story reaction stored locally" };
    }),
    addSocialStoryComment: (id, text) => setState((current) => {
      const story = current.socialStories.find((item) => item.id === id && new Date(item.expiresAt).getTime() > Date.now());
      if (!current.isAuthenticated || !story || !text.trim() || text.trim().length > 300 || !canViewSocialStory(story, { viewerId: current.user.id, followedUserIds: current.followedPeople, followedBusinessIds: current.followedBusinesses, blockedUserIds: current.blockedUsers, businessOwnerId: current.businesses.find((item) => item.id === story.identityId)?.ownerId })) return current;
      const response = { id: newLocalId("social-story-comment"), userId: current.user.id, text: text.trim(), createdAt: new Date().toISOString() };
      return { ...current, socialStoryComments: { ...current.socialStoryComments, [id]: [...(current.socialStoryComments[id] ?? []), response] }, localNotice: "Story reply stored on this device" };
    }),
    voteSocialStory: (storyId, option) => setState((current) => {
      if (!current.isAuthenticated) return current;
      const story = current.socialStories.find((item) => item.id === storyId && new Date(item.expiresAt).getTime() > Date.now());
      const business = story?.identityKind === "business" ? current.businesses.find((item) => item.id === story.identityId) : undefined;
      if (!story?.poll || !story.poll.options.includes(option) || story.poll.voterIds?.[current.user.id] || !canViewSocialStory(story, { viewerId: current.user.id, followedUserIds: current.followedPeople, followedBusinessIds: current.followedBusinesses, blockedUserIds: current.blockedUsers, businessOwnerId: business?.ownerId })) return current;
      const poll = story.poll;
      const updatedPoll = { ...poll, votes: { ...poll.votes, [option]: (poll.votes[option] ?? 0) + 1 }, voterIds: { ...(poll.voterIds ?? {}), [current.user.id]: option } };
      return { ...current, socialStories: current.socialStories.map((item) => item.id === storyId ? { ...item, poll: updatedPoll } : item), localNotice: "Story poll vote saved on this device" };
    }),
    respondToSocialStory: (storyId, text) => setState((current) => {
      const story = current.socialStories.find((item) => item.id === storyId && new Date(item.expiresAt).getTime() > Date.now());
      const business = story?.identityKind === "business" ? current.businesses.find((item) => item.id === story.identityId) : undefined;
      if (!current.isAuthenticated || !story?.question || !text.trim() || text.trim().length > 300 || !canViewSocialStory(story, { viewerId: current.user.id, followedUserIds: current.followedPeople, followedBusinessIds: current.followedBusinesses, blockedUserIds: current.blockedUsers, businessOwnerId: business?.ownerId })) return current;
      return { ...current, storyResponses: { ...current.storyResponses, [storyId]: [...(current.storyResponses[storyId] ?? []), { id: newLocalId("story-response"), userId: current.user.id, text: text.trim(), createdAt: new Date().toISOString() }] }, localNotice: "Story response saved locally; it was not sent" };
    }),
    removeSocialStory: (id) => setState((current) => {
      const story = current.socialStories.find((item) => item.id === id);
      if (!current.isAuthenticated || !story || story.authorId !== current.user.id) return current;
      const storyViews = { ...current.storyViews };
      const socialStoryComments = { ...current.socialStoryComments };
      const storyResponses = { ...current.storyResponses };
      delete storyViews[id]; delete socialStoryComments[id]; delete storyResponses[id];
      return { ...current, socialStories: current.socialStories.filter((item) => item.id !== id), storyViews, socialStoryComments, storyResponses, storyHighlights: current.storyHighlights.map((highlight) => ({ ...highlight, storyIds: highlight.storyIds.filter((storyId) => storyId !== id), coverUri: highlight.coverUri === story.mediaItems[0] ? undefined : highlight.coverUri })) };
    }),
    addStoryHighlight: (highlight) => setState((current) => {
      if (!current.isAuthenticated || highlight.ownerId !== current.user.id || !highlight.title.trim()) return current;
      const knownIds = new Set(current.socialStories.filter((item) => item.authorId === current.user.id).map((item) => item.id));
      const storyIds = [...new Set(highlight.storyIds.filter((id) => knownIds.has(id)))];
      return { ...current, storyHighlights: [{ ...highlight, title: highlight.title.trim(), storyIds }, ...current.storyHighlights], localNotice: "Story highlight saved locally; no server was updated" };
    }),
    updateStoryHighlight: (id, patch) => setState((current) => {
      if (!current.isAuthenticated) return current;
      const existing = current.storyHighlights.find((item) => item.id === id && item.ownerId === current.user.id);
      if (!existing) return current;
      const ownedStoryIds = new Set(current.socialStories.filter((item) => item.authorId === current.user.id).map((item) => item.id));
      const storyIds = patch.storyIds ? [...new Set(patch.storyIds.filter((storyId) => ownedStoryIds.has(storyId)))] : existing.storyIds;
      return { ...current, storyHighlights: current.storyHighlights.map((item) => item.id === id ? { ...item, ...patch, id, ownerId: existing.ownerId, title: patch.title?.trim() || existing.title, storyIds } : item) };
    }),
    removeStoryFromHighlight: (id, storyId) => setState((current) => {
      const existing = current.storyHighlights.find((item) => item.id === id && item.ownerId === current.user.id);
      if (!current.isAuthenticated || !existing) return current;
      const story = current.socialStories.find((item) => item.id === storyId && item.authorId === current.user.id);
      if (!story) return current;
      return { ...current, storyHighlights: current.storyHighlights.map((item) => item.id === id ? { ...item, storyIds: item.storyIds.filter((itemId) => itemId !== storyId), coverUri: item.coverUri === story.mediaItems[0] ? undefined : item.coverUri } : item), localNotice: "Story removed from this Highlight only" };
    }),
    reorderStoryHighlight: (id, storyIds) => setState((current) => {
      const existing = current.storyHighlights.find((item) => item.id === id && item.ownerId === current.user.id);
      if (!current.isAuthenticated || !existing) return current;
      const allowed = new Set(existing.storyIds);
      const ordered = storyIds.filter((itemId, index) => allowed.has(itemId) && storyIds.indexOf(itemId) === index);
      if (ordered.length !== existing.storyIds.length) return current;
      return { ...current, storyHighlights: current.storyHighlights.map((item) => item.id === id ? { ...item, storyIds: ordered } : item) };
    }),
    reorderStoryHighlights: (ids) => setState((current) => {
      if (!current.isAuthenticated) return current;
      const owned = current.storyHighlights.filter((item) => item.ownerId === current.user.id);
      const byId = new Map(owned.map((item) => [item.id, item]));
      const orderedOwned: EnhancedStoryHighlight[] = [];
      ids.forEach((id, order) => {
        const item = byId.get(id);
        if (item && !orderedOwned.some((ordered) => ordered.id === id)) orderedOwned.push({ ...item, order });
      });
      if (orderedOwned.length !== owned.length) return current;
      const foreign = current.storyHighlights.filter((item) => item.ownerId !== current.user.id);
      return { ...current, storyHighlights: [...orderedOwned, ...foreign] };
    }),
    removeStoryHighlight: (id) => setState((current) => current.isAuthenticated ? { ...current, storyHighlights: current.storyHighlights.filter((item) => !(item.id === id && item.ownerId === current.user.id)) } : current),
    addBusinessOffer: (offer) => setState((current) => {
      const business = current.businesses.find((item) => item.id === offer.businessId);
      if (!current.isAuthenticated || !business || !resolveManagedBusinessIdentity(current.businesses, current.user.id, business.id) || !offer.title.trim() || new Date(offer.expiresAt) <= new Date(offer.startsAt)) return current;
      return { ...current, businessOffers: [offer, ...current.businessOffers.filter((item) => item.id !== offer.id)], localNotice: "Offer saved locally; it is not published or distributed" };
    }),
    updateBusinessOffer: (id, patch) => setState((current) => {
      const item = current.businessOffers.find((offer) => offer.id === id);
      const business = item && current.businesses.find((entry) => entry.id === item.businessId);
      if (!current.isAuthenticated || !item || !business || !resolveManagedBusinessIdentity(current.businesses, current.user.id, business.id)) return current;
      return { ...current, businessOffers: current.businessOffers.map((offer) => offer.id === id ? { ...offer, ...patch, id, businessId: item.businessId } : offer), localNotice: "Offer updated locally; it is not published" };
    }),
    removeBusinessOffer: (id) => setState((current) => {
      const item = current.businessOffers.find((offer) => offer.id === id);
      const business = item && current.businesses.find((entry) => entry.id === item.businessId);
      return current.isAuthenticated && item && business && resolveManagedBusinessIdentity(current.businesses, current.user.id, business.id) ? { ...current, businessOffers: current.businessOffers.filter((offer) => offer.id !== id), localNotice: "Offer removed from this device" } : current;
    }),
    addBusinessEvent: (event) => setState((current) => {
      const identityAllowed = event.identityKind === "personal" ? event.identityId === current.user.id : resolveManagedBusinessIdentity(current.businesses, current.user.id, event.identityId) === event.identityId;
      if (!current.isAuthenticated || !identityAllowed || !event.title.trim() || new Date(event.startsAt).getTime() <= Date.now()) return current;
      return { ...current, businessEvents: [event, ...current.businessEvents.filter((item) => item.id !== event.id)], localNotice: "Event saved locally; it is not listed in a shared discovery service" };
    }),
    updateBusinessEvent: (id, patch) => setState((current) => {
      const item = current.businessEvents.find((event) => event.id === id);
      if (!current.isAuthenticated || !item || item.identityId !== current.user.id && resolveManagedBusinessIdentity(current.businesses, current.user.id, item.identityId) !== item.identityId) return current;
      return { ...current, businessEvents: current.businessEvents.map((event) => event.id === id ? { ...event, ...patch, id, identityId: item.identityId, identityKind: item.identityKind } : event), localNotice: "Event updated locally" };
    }),
    removeBusinessEvent: (id) => setState((current) => {
      const item = current.businessEvents.find((event) => event.id === id);
      return current.isAuthenticated && item && (item.identityId === current.user.id || resolveManagedBusinessIdentity(current.businesses, current.user.id, item.identityId) === item.identityId) ? { ...current, businessEvents: current.businessEvents.filter((event) => event.id !== id), localNotice: "Event removed from this device" } : current;
    }),
    addCommunityOpportunity: (opportunity) => setState((current) => {
      const identityAllowed = opportunity.identityKind === "personal" ? opportunity.identityId === current.user.id : resolveManagedBusinessIdentity(current.businesses, current.user.id, opportunity.identityId) === opportunity.identityId;
      if (!current.isAuthenticated || !identityAllowed || !opportunity.title.trim() || !opportunity.description.trim()) return current;
      if (opportunity.category === "investment" && !opportunity.investmentDisclosure?.trim()) return { ...current, localNotice: "Investment opportunities need an explicit no-guaranteed-returns disclosure" };
      return { ...current, communityOpportunities: [opportunity, ...current.communityOpportunities.filter((item) => item.id !== opportunity.id)], localNotice: "Opportunity saved locally; no one else can see it" };
    }),
    updateCommunityOpportunity: (id, patch) => setState((current) => {
      const item = current.communityOpportunities.find((entry) => entry.id === id);
      if (!current.isAuthenticated || !item || item.identityId !== current.user.id && resolveManagedBusinessIdentity(current.businesses, current.user.id, item.identityId) !== item.identityId) return current;
      return { ...current, communityOpportunities: current.communityOpportunities.map((entry) => entry.id === id ? { ...entry, ...patch, id, identityId: item.identityId, identityKind: item.identityKind } : entry), localNotice: "Opportunity updated locally" };
    }),
    removeCommunityOpportunity: (id) => setState((current) => {
      const item = current.communityOpportunities.find((entry) => entry.id === id);
      return current.isAuthenticated && item && (item.identityId === current.user.id || resolveManagedBusinessIdentity(current.businesses, current.user.id, item.identityId) === item.identityId) ? { ...current, communityOpportunities: current.communityOpportunities.filter((entry) => entry.id !== id), localNotice: "Opportunity removed from this device" } : current;
    }),
    addComment: (postId, text) => setState((current) => {
      const post = current.posts.find((item) => item.id === postId);
      if (!current.isAuthenticated || !text.trim() || !post || post.allowComments === false || !isPostVisible(post, visibilityContext(current))) return current;
      return { ...current, posts: addCommentRecord(current.posts, postId, { id: newLocalId("comment"), userId: current.user.id, text: text.trim(), createdAt: new Date().toISOString(), replies: [] }), localNotice: "Comment saved on this device" };
    }),
    addReply: (postId, commentId, text) => setState((current) => {
      const post = current.posts.find((item) => item.id === postId);
      if (!current.isAuthenticated || !text.trim() || !post || post.allowComments === false || !isPostVisible(post, visibilityContext(current)) || !post.comments.some((item) => item.id === commentId)) return current;
      return { ...current, posts: addReplyRecord(current.posts, postId, commentId, { id: newLocalId("reply"), userId: current.user.id, text: text.trim(), createdAt: new Date().toISOString() }), localNotice: "Reply saved on this device" };
    }),
    updateBusiness: (id, patch, allowedRoles = OWNER_ADMIN_ROLES) => setState((current) => {
      if (!current.isAuthenticated) return current;
      const result = updateBusinessRecord(current.businesses, id, patch, current.user.id, allowedRoles);
      return result.changed ? { ...current, businesses: result.businesses, localNotice: "Business changes stored on this device only" } : current;
    }),
    saveDraft: (draft) => setState((current) => {
      const identityAllowed = draft.identityId === current.user.id || resolveManagedBusinessIdentity(current.businesses, current.user.id, draft.identityId) === draft.identityId;
      if (!current.isAuthenticated || !identityAllowed) return current;
      return { ...current, drafts: saveDraftRecord(current.drafts, draft), localNotice: "Draft saved on this device" };
    }),
    removeDraft: (id) => setState((current) => current.isAuthenticated ? { ...current, drafts: current.drafts.filter((draft) => draft.id !== id) } : current),
    switchIdentity: (id) => setState((current) => {
      if (!current.isAuthenticated) return current;
      const allowedId = resolveAccessibleBusinessIdentity(current.businesses, current.user.id, id);
      return { ...current, activeBusinessId: allowedId, localNotice: allowedId ? `Posting as ${current.businesses.find((business) => business.id === allowedId)?.name ?? "business"} · saved locally` : "Posting as your personal profile · saved locally" };
    }),
    updateSettings: (settings) => setState((current) => {
      if (!current.isAuthenticated && !isAppearanceOnlyUpdate(settings)) return current;
      return {
        ...current,
        settings: { ...current.settings, ...settings },
        user: current.isAuthenticated && settings.privateProfile !== undefined
          ? { ...current.user, privateProfile: settings.privateProfile }
          : current.user,
      };
    }),
    updateUser: (user) => setState((current) => current.isAuthenticated || current.onboardingStage !== "idle" ? { ...current, user: { ...current.user, ...user }, localNotice: "Profile updated on this device" } : current),
    markNotificationRead: (id) => setState((current) => current.isAuthenticated ? { ...current, notifications: current.notifications.map((item) => item.id === id ? { ...item, read: true } : item) } : current),
    markAllNotificationsRead: () => setState((current) => current.isAuthenticated ? { ...current, notifications: current.notifications.map((item) => ({ ...item, read: true })) } : current),
    markConversationRead: (id) => setState((current) => current.isAuthenticated ? { ...current, conversations: current.conversations.map((conversation) => conversation.id === id ? { ...conversation, unread: 0, messages: conversation.messages.map((message) => message.senderId === current.user.id ? message : { ...message, status: "read" }) } : conversation) } : current),
    addBusiness: (business) => setState((current) => {
      const result = createOwnedBusinessRecord(current.businesses, business, current.user.id, current.isAuthenticated);
      return result.changed ? { ...current, businesses: result.businesses, activeBusinessId: business.id, localNotice: "Business profile created locally; it is not published to a server" } : current;
    }),
    setApiUser: async (user) => {
      setState((current) => ({ ...current, user, isAuthenticated: true, onboardingStage: "idle", localNotice: "Signed in to the Mabiz API; business data is managed by the server" }));
    },
    replaceApiBusinesses: (businesses) => setState((current) => {
      const enriched = businesses.map((business) => business.currentUserRole ? {
        ...business,
        team: [{ userId: current.user.id, role: business.currentUserRole, joinedAt: business.joinedAt, displayName: current.user.name, email: current.user.email ?? "" }],
      } : business);
      return { ...current, businesses: enriched, activeBusinessId: enriched.some((business) => business.id === current.activeBusinessId) ? current.activeBusinessId : enriched[0]?.id, localNotice: "Business list refreshed from the Mabiz API" };
    }),
    upsertApiBusiness: (business) => setState((current) => {
      const enriched = business.currentUserRole ? {
        ...business,
        team: [{ userId: current.user.id, role: business.currentUserRole, joinedAt: business.joinedAt, displayName: current.user.name, email: current.user.email ?? "" }],
      } : business;
      return { ...current, businesses: [enriched, ...current.businesses.filter((item) => item.id !== business.id)], activeBusinessId: business.id, localNotice: "Business profile saved by the Mabiz API" };
    }),
    recordBusinessView: (id) => setState((current) => ({ ...current, recentlyViewed: [id, ...current.recentlyViewed.filter((item) => item !== id)].slice(0, 12) })),
    recordSearch: (query) => setState((current) => current.isAuthenticated && query.trim() ? { ...current, searchHistory: [query.trim(), ...current.searchHistory.filter((item) => item !== query.trim())].slice(0, 12) } : current),
    clearSearchHistory: () => setState((current) => current.isAuthenticated ? { ...current, searchHistory: [] } : current),
    sendMessage: (conversationId, text, image) => setState((current) => {
      const conversation = current.conversations.find((item) => item.id === conversationId);
      if (!conversation || !canSendMessage(current, conversation.participantId, conversation.businessId) || !text.trim() && !image) return current;
      const message: ChatMessage = { id: newLocalId("message"), senderId: current.user.id, text: text.trim(), image, createdAt: new Date().toISOString(), status: "sent" };
      return { ...current, conversations: appendLocalMessage(current.conversations, conversationId, message, message.createdAt), localNotice: "Demo message saved on this device; it was not delivered" };
    }),
    startConversation: (participantId, participantName, businessId) => {
      const currentState = stateRef.current;
      if (!currentState.isAuthenticated || !canSendMessage(currentState, participantId, businessId)) {
        if (currentState.isAuthenticated) setState((current) => ({ ...current, localNotice: "Messaging is unavailable under the current block or privacy settings" }));
        return undefined;
      }
      const conversationId = newLocalId("conversation");
      const result = createConversationRecord(currentState.conversations, { participantId, participantName, businessId }, conversationId, new Date().toISOString());
      if (result.created) setState((current) => {
        if (!current.isAuthenticated || !canSendMessage(current, participantId, businessId)) return current;
        const latest = createConversationRecord(current.conversations, { participantId, participantName, businessId }, conversationId, new Date().toISOString());
        return latest.created ? { ...current, conversations: latest.conversations, localNotice: "Local conversation created; messages are not delivered" } : current;
      });
      return result.conversationId;
    },
    toggleBlock: (id) => setState((current) => {
      if (!current.isAuthenticated || id === current.user.id) return current;
      const blocked = current.blockedUsers.includes(id);
      const relationships = toggleBlockRelationships({ blockedUserIds: current.blockedUsers, followedPeople: current.followedPeople, followedBusinessIds: current.followedBusinesses, pendingFollowRequests: current.followRequests }, id, current.businesses);
      return {
        ...current,
        blockedUsers: relationships.blockedUserIds,
        followedPeople: relationships.followedPeople,
        followedBusinesses: relationships.followedBusinessIds,
        followRequests: relationships.pendingFollowRequests,
        localNotice: blocked ? "User unblocked in this local demo" : "User blocked in this local demo",
      };
    }),
    hidePost: (id) => setState((current) => {
      if (!current.isAuthenticated || !current.posts.some((post) => post.id === id)) return current;
      if (current.hiddenPosts.includes(id)) return current;
      return { ...current, hiddenPosts: [...current.hiddenPosts, id], localNotice: "Post hidden on this device" };
    }),
    addReport: (target, reason, details) => setState((current) => {
      if (!current.isAuthenticated || !target.trim() || !reason.trim()) return current;
      const report: ModerationReport = { id: newLocalId("report"), target, reason, details: details.trim(), status: "submitted", createdAt: new Date().toISOString() };
      const result = appendReport(current.reports, report);
      return result.created ? { ...current, reports: result.reports, localNotice: "Moderation report saved locally; no review team was notified" } : { ...current, localNotice: "An active local report already exists for this item and reason" };
    }),

    deleteLocalDemoData: async () => {
      await AsyncStorage.removeItem(STORAGE_KEY);
      await apiSession.clear().catch(() => undefined);
      setState({ ...cloneInitial(), isAuthenticated: false, hasHydrated: true, onboardingStage: "idle", localNotice: "Local demo profile reset; no server account was deleted" });
    },
    setAuthenticated: setSession,
  }), [setSession, toggle]);

  return <AppStoreContext.Provider value={{ ...state, ...actions }}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const value = useContext(AppStoreContext);
  if (!value) throw new Error("useAppStore must be used inside AppStoreProvider");
  return value;
}
