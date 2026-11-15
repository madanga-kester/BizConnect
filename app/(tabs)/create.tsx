import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams, useNavigation } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Avatar, Button, Chip, ConfirmModal, EmptyState, Field, LoadingState, LocalNote, MediaImage, Page, ProductCard, TopBar, VideoPreview, styles } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { useBizConnectServiceMode } from "@/lib/services/service-provider";
import { ApiPostComposer } from "@/components/api-social-screens";
import { colors } from "@/theme/tokens";
import type { ContentAudience, ContentKind, Post } from "@/types/domain";
import type { PersistedComposerDraft, PostComposerSnapshot } from "@/types/create-studio";
import { formatDate } from "@/utils/kenya";
import { newLocalId } from "@/utils/ids";
import { t } from "@/i18n/translations";
import { isFutureSchedule } from "@/utils/create-content";
import { clearVideoEdit, readVideoEdit, type VideoEditState } from "@/utils/video-edit-demo";

const TYPES: { title: string; value: ContentKind; icon: keyof typeof Ionicons.glyphMap; detail: string }[] = [
  { title: "Text", value: "text", icon: "create-outline", detail: "A thought or update" },
  { title: "Photo", value: "image", icon: "images-outline", detail: "Photos & carousels" },
  { title: "Video", value: "video", icon: "videocam-outline", detail: "A short clip" },
  { title: "Question", value: "question", icon: "help-circle-outline", detail: "Ask your community" },
  { title: "Poll", value: "poll", icon: "stats-chart-outline", detail: "Collect local votes" },
  { title: "Experience", value: "experience", icon: "compass-outline", detail: "Share what happened" },
  { title: "Opinion", value: "opinion", icon: "chatbox-ellipses-outline", detail: "Start a discussion" },
  { title: "Recommendation", value: "recommendation", icon: "thumbs-up-outline", detail: "Share a useful find" },
  { title: "Education", value: "education", icon: "school-outline", detail: "Teach a lesson" },
  { title: "Tutorial", value: "tutorial", icon: "list-outline", detail: "Explain how to" },
  { title: "Achievement", value: "achievement", icon: "trophy-outline", detail: "Celebrate progress" },
  { title: "Appreciation", value: "appreciation", icon: "heart-outline", detail: "Thank your customers" },
  { title: "Challenge", value: "challenge", icon: "flag-outline", detail: "Invite participation" },
  { title: "Product", value: "product", icon: "pricetag-outline", detail: "From your catalogue" },
  { title: "Announcement", value: "announcement", icon: "megaphone-outline", detail: "Business news" },
  { title: "Promotion", value: "promotion", icon: "pricetags-outline", detail: "Share a business offer" },
  { title: "Event", value: "event", icon: "calendar-outline", detail: "Create a business event" },
  { title: "Opportunity", value: "opportunity", icon: "bulb-outline", detail: "Invite collaboration" },
  { title: "Founder story", value: "story", icon: "book-outline", detail: "A permanent founder lesson" },
];
const BUSINESS_SUBTYPES = ["Business update", "Product launch", "New arrivals", "Service announcement", "Promotion", "Discount or offer", "Customer testimonial", "Business achievement", "Behind the scenes", "Business news", "Business notice", "Business event", "New branch"];

function alertUser(title: string, message: string) {
  if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}

function postDraft(id: string, snapshot: PostComposerSnapshot): PersistedComposerDraft {
  return { id, kind: snapshot.kind, caption: snapshot.caption, media: snapshot.media, mediaItems: snapshot.mediaItems, identityId: snapshot.identityId, businessTags: snapshot.businessTags, productId: snapshot.productId, location: snapshot.location, updatedAt: new Date().toISOString(), draftType: "post", composer: { version: 1, mode: "post", post: snapshot } };
}

function localDateTime(value: string): string {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export default function CreateScreen() {
  const apiMode = useBizConnectServiceMode() === "api";
  return apiMode ? <ApiPostComposer /> : <MockCreateScreen />;
}
function MockCreateScreen() {
  const app = useAppStore();
  const { draftId, postId, scheduledId, assistCaption, assistKind } = useLocalSearchParams<{ draftId?: string; postId?: string; scheduledId?: string; assistCaption?: string; assistKind?: string }>();
  if (!app.hasHydrated) return <Page><TopBar title="Create" back /><LoadingState label="Preparing your local draft" /></Page>;
  const routeKey = `${postId ?? scheduledId ?? draftId ?? "new-post"}:${assistCaption ?? ""}:${assistKind ?? ""}`;
  return <CreateComposer key={routeKey} app={app} draftId={draftId} postId={postId} scheduledId={scheduledId} assistCaption={assistCaption} assistKind={assistKind} />;
}

function CreateComposer({ app, draftId, postId, scheduledId, assistCaption, assistKind }: { app: ReturnType<typeof useAppStore>; draftId?: string; postId?: string; scheduledId?: string; assistCaption?: string; assistKind?: string }) {
  const authenticated = app.isAuthenticated;
  const saveToStore = app.saveDraft;
  const sourceDraft = draftId ? app.drafts.find((item) => item.id === draftId) : undefined;
  const sourcePost = postId ? app.posts.find((item) => item.id === postId && item.authorId === app.user.id) : undefined;
  const sourceScheduledPost = scheduledId ? app.scheduledPosts.find((item) => item.id === scheduledId && item.authorId === app.user.id) : undefined;
  const sourceContent = sourcePost ?? sourceScheduledPost;
  const postState = sourceDraft?.composer?.mode === "post" ? sourceDraft.composer.post : undefined;
  const assistedKind = TYPES.find((item) => item.value === assistKind)?.value;
  const [seed] = useState<PostComposerSnapshot>(() => ({
    kind: sourceContent?.kind ?? postState?.kind ?? sourceDraft?.kind ?? assistedKind ?? "text",
    contentSubtype: sourceContent?.contentSubtype ?? postState?.contentSubtype ?? "",
    caption: sourceContent?.caption ?? postState?.caption ?? sourceDraft?.caption ?? assistCaption ?? "",
    media: sourceContent?.media ?? postState?.media ?? sourceDraft?.media,
    mediaItems: sourceContent?.mediaItems ?? postState?.mediaItems ?? sourceDraft?.mediaItems ?? (sourceContent?.media ? [sourceContent.media] : sourceDraft?.media ? [sourceDraft.media] : []),
    identityId: sourceContent?.identityId ?? postState?.identityId ?? sourceDraft?.identityId ?? app.activeBusinessId ?? app.user.id,
    businessTags: sourceContent?.businessTags ?? postState?.businessTags ?? sourceDraft?.businessTags ?? [],
    productId: sourceContent?.productId ?? postState?.productId ?? sourceDraft?.productId,
    location: sourceContent?.location ?? postState?.location ?? sourceDraft?.location ?? `${app.user.town}, ${app.user.county}`,
    pollQuestion: sourceContent?.poll?.question ?? postState?.pollQuestion ?? "",
    pollOptions: sourceContent?.poll?.options.map((option) => option.text) ?? postState?.pollOptions ?? ["", ""],
    pollDurationHours: postState?.pollDurationHours ?? (sourceContent?.poll ? String(Math.max(1, Math.round((Date.parse(sourceContent.poll.endsAt) - Date.parse(sourceContent.createdAt)) / 3_600_000))) : "24"),
    pollMultipleChoice: sourceContent?.poll?.multipleChoice ?? postState?.pollMultipleChoice ?? false,
    audience: sourceContent?.audience ?? postState?.audience ?? "public",
    allowComments: sourceContent?.allowComments ?? postState?.allowComments ?? true,
    allowSharing: sourceContent?.allowSharing ?? postState?.allowSharing ?? true,
    founderPrompt: postState?.founderPrompt ?? "How I started",
    videoSubtitles: sourceContent?.videoSubtitles ?? postState?.videoSubtitles ?? "",
    mediaTextOverlay: sourceContent?.mediaTextOverlay ?? postState?.mediaTextOverlay ?? "",
    scheduleAt: sourceScheduledPost?.scheduledAt ? localDateTime(sourceScheduledPost.scheduledAt) : postState?.scheduleAt,
  }));
  const [editingDraftId, setEditingDraftId] = useState<string | undefined>(() => sourceDraft?.id ?? newLocalId("draft"));
  const [kind, setKind] = useState<ContentKind>(seed.kind);
  const [contentSubtype, setContentSubtype] = useState(seed.contentSubtype ?? "");
  const [caption, setCaption] = useState(seed.caption);
  const [media, setMedia] = useState<string | undefined>(seed.media);
  const [mediaItems, setMediaItems] = useState<string[]>(seed.mediaItems);
  const [identityId, setIdentityId] = useState<string | undefined>(seed.identityId);
  const [location, setLocation] = useState(seed.location);
  const [preview, setPreview] = useState(false);
  const [businessTags, setBusinessTags] = useState<string[]>(seed.businessTags);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [showIdentityPicker, setShowIdentityPicker] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(seed.productId);
  const [loading, setLoading] = useState(false);
  const [pollQuestion, setPollQuestion] = useState(seed.pollQuestion);
  const [pollOptions, setPollOptions] = useState(seed.pollOptions);
  const [pollDurationHours, setPollDurationHours] = useState(seed.pollDurationHours);
  const [pollMultipleChoice, setPollMultipleChoice] = useState(seed.pollMultipleChoice);
  const [audience, setAudience] = useState<ContentAudience>(seed.audience);
  const [allowComments, setAllowComments] = useState(seed.allowComments);
  const [allowSharing, setAllowSharing] = useState(seed.allowSharing);
  const [founderPrompt, setFounderPrompt] = useState(seed.founderPrompt);
  const [videoSubtitles, setVideoSubtitles] = useState(seed.videoSubtitles);
  const [mediaTextOverlay, setMediaTextOverlay] = useState(seed.mediaTextOverlay);
  const [scheduleMode, setScheduleMode] = useState(Boolean(sourceScheduledPost || seed.scheduleAt));
  const [scheduleAt, setScheduleAt] = useState(seed.scheduleAt ?? "");
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [videoDurationSeconds, setVideoDurationSeconds] = useState<number | undefined>(postState?.videoDurationSeconds);
  const [videoEdit, setVideoEdit] = useState<VideoEditState | null>(null);
  const [saveStatus, setSaveStatus] = useState("All changes are saved locally");
  const [seedSnapshotKey] = useState(() => JSON.stringify(seed));
  const savedSnapshotRef = useRef(seedSnapshotKey);
  const autosaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressedAutosaveSnapshotRef = useRef<string | null>(null);
  const autosaveGenerationRef = useRef(0);
  const originalDraftRef = useRef(sourceDraft);
  const pendingNavigationRef = useRef<unknown>(null);
  const navigation = useNavigation() as { addListener: (name: "beforeRemove", callback: (event: { preventDefault: () => void; data: { action: unknown } }) => void) => () => void; dispatch: (action: unknown) => void };
  const identity = app.isAuthenticated ? app.businesses.find((business) => business.id === identityId && (business.ownerId === app.user.id || business.team.some((member) => member.userId === app.user.id))) : undefined;
  const productsForIdentity = (identity ? identity.products : app.businesses.flatMap((business) => business.products)).filter((product) => !product.archived);
  const selectedProduct = productsForIdentity.find((product) => product.id === selectedProductId);
  const snapshot: PostComposerSnapshot = { kind, contentSubtype, caption, media, mediaItems, identityId: identity?.id ?? app.user.id, businessTags, productId: selectedProductId, location, pollQuestion, pollOptions, pollDurationHours, pollMultipleChoice, audience, allowComments, allowSharing, founderPrompt, videoSubtitles, mediaTextOverlay, scheduleAt: scheduleMode ? scheduleAt : undefined, videoDurationSeconds };
  const snapshotKey = JSON.stringify(snapshot);
  const hasDraftContent = Boolean(caption.trim() || mediaItems.length || pollQuestion.trim() || snapshotKey !== seedSnapshotKey);
  const saveDraftLocal = (showFeedback: boolean) => {
    if (!authenticated) { router.push("/auth/login"); return; }
    const id = editingDraftId ?? newLocalId("draft");
    saveToStore(postDraft(id, snapshot));
    setEditingDraftId(id);
    savedSnapshotRef.current = snapshotKey;
    setSaveStatus("Draft auto-saved on this device");
    if (showFeedback) alertUser("Draft saved", "Every current composer field was saved on this device; no content was uploaded.");
  };
  const saveDraft = () => saveDraftLocal(true);

  useEffect(() => {
    if (suppressedAutosaveSnapshotRef.current !== null) {
      if (snapshotKey === suppressedAutosaveSnapshotRef.current) return;
      suppressedAutosaveSnapshotRef.current = null;
    }
    if (!authenticated || !hasDraftContent || snapshotKey === savedSnapshotRef.current) return;
    setSaveStatus("Unsaved changes");
    const generation = autosaveGenerationRef.current;
    const timeout = setTimeout(() => {
      if (generation !== autosaveGenerationRef.current) return;
      if (autosaveTimeoutRef.current === timeout) autosaveTimeoutRef.current = null;
      const id = editingDraftId ?? newLocalId("draft");
      const pendingSnapshot = JSON.parse(snapshotKey) as PostComposerSnapshot;
      saveToStore(postDraft(id, pendingSnapshot));
      setEditingDraftId(id);
      savedSnapshotRef.current = snapshotKey;
      setSaveStatus("Draft auto-saved on this device");
    }, 700);
    autosaveTimeoutRef.current = timeout;
    return () => {
      clearTimeout(timeout);
      if (autosaveTimeoutRef.current === timeout) autosaveTimeoutRef.current = null;
    };
  }, [authenticated, editingDraftId, hasDraftContent, saveToStore, snapshotKey]);

  useEffect(() => navigation.addListener("beforeRemove", (event) => {
    if (snapshotKey === savedSnapshotRef.current) return;
    event.preventDefault();
    pendingNavigationRef.current = event.data.action;
    setShowDiscardConfirm(true);
  }), [navigation, snapshotKey]);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const guard = (event: BeforeUnloadEvent) => {
      if (snapshotKey === savedSnapshotRef.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [snapshotKey]);

  useFocusEffect(useCallback(() => {
    if (kind !== "video" || !media) { setVideoEdit(null); return; }
    let active = true;
    void readVideoEdit(media).then((saved) => { if (active) setVideoEdit(saved); });
    return () => { active = false; };
  }, [kind, media]));

  const selectMedia = async (mediaType: "images" | "videos") => {
    try {
      const ImagePicker = await import("expo-image-picker");
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) { alertUser("Media permission needed", "Allow access to selected photos or videos to attach them to a local demo post. You can still publish text-only posts."); return; }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: [mediaType === "images" ? "images" : "videos"], allowsEditing: false, allowsMultipleSelection: mediaType === "images", selectionLimit: 6, quality: 0.72, videoMaxDuration: 60 });
      if (result.canceled || !result.assets[0]) return;
      const assets = result.assets.slice(0, mediaType === "images" ? 6 : 1);
      const maxSize = mediaType === "images" ? 12 * 1024 * 1024 : 100 * 1024 * 1024;
      if (assets.some((asset) => asset.fileSize !== undefined && asset.fileSize > maxSize)) { alertUser("Media too large", mediaType === "images" ? "Each photo must be no larger than 12 MB." : "Videos must be no larger than 100 MB."); return; }
      if (assets.some((asset) => asset.mimeType && !asset.mimeType.startsWith(mediaType === "images" ? "image/" : "video/"))) { alertUser("Unsupported media", `Choose a supported ${mediaType === "images" ? "image" : "video"} file.`); return; }
      if (mediaType === "images") {
        const manipulator = await import("expo-image-manipulator");
        const optimized = await Promise.all(assets.map((asset) => manipulator.manipulateAsync(asset.uri, [{ resize: { width: 1600 } }], { compress: 0.72, format: manipulator.SaveFormat.JPEG })));
        const selected = optimized.map((item) => item.uri);
        if (media && kind === "video") void clearVideoEdit(media);
        setVideoDurationSeconds(undefined); setVideoEdit(null); setMediaItems(selected); setMedia(selected[0]); setKind("image");
      } else {
        const duration = assets[0].duration == null ? undefined : assets[0].duration / 1000;
        if (duration !== undefined && (!Number.isFinite(duration) || duration <= 0 || duration > 60)) { alertUser("Video duration not supported", "Choose a clip up to 60 seconds. The original file has not been changed."); return; }
        if (media && media !== assets[0].uri) void clearVideoEdit(media);
        setVideoDurationSeconds(duration); setVideoEdit(null); setMedia(assets[0].uri); setMediaItems([assets[0].uri]); setKind("video");
      }
    } catch { alertUser("Media selection unavailable", "Try selecting media on a device running Expo Go. This demo does not upload files to a server."); }
  };

  const takePhoto = async () => {
    try {
      const ImagePicker = await import("expo-image-picker");
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) { alertUser("Camera permission needed", "Allow BizConnect to use the camera, or choose a photo from your library instead."); return; }
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], allowsEditing: true, quality: 0.72 });
      if (result.canceled || !result.assets[0]) return;
      const manipulator = await import("expo-image-manipulator");
      const optimized = await manipulator.manipulateAsync(result.assets[0].uri, [{ resize: { width: 1600 } }], { compress: 0.72, format: manipulator.SaveFormat.JPEG });
      if (media && kind === "video") void clearVideoEdit(media);
      setVideoDurationSeconds(undefined); setVideoEdit(null); setMedia(optimized.uri); setMediaItems([optimized.uri]); setKind("image");
    } catch { alertUser("Camera unavailable", "You can still select an existing photo. The local demo does not upload files."); }
  };

  const recordVideo = async () => {
    try {
      const ImagePicker = await import("expo-image-picker");
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) { alertUser("Camera permission needed", "Allow camera access, or choose a video from your library instead."); return; }
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["videos"], videoMaxDuration: 60, quality: 0.72 });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      if (asset.fileSize !== undefined && asset.fileSize > 100 * 1024 * 1024) { alertUser("Video too large", "Videos must be no larger than 100 MB."); return; }
      const duration = asset.duration == null ? undefined : asset.duration / 1000;
      if (duration !== undefined && duration > 60) { alertUser("Video is too long", "Record a clip up to 60 seconds. The original file has not been changed."); return; }
      setVideoDurationSeconds(duration); setVideoEdit(null); setMedia(asset.uri); setMediaItems([asset.uri]); setKind("video");
    } catch { alertUser("Video recording unavailable", "Use a supported Expo Go device or select a video from your library."); }
  };

  const validatePublish = () => {
    if (!app.isAuthenticated) { router.push("/auth/login"); return; }
    if (kind === "product" && !selectedProductId) { alertUser("Choose a product", "Select a product from your catalogue to publish a product showcase."); return; }
    if (caption.trim().length < 4) { alertUser("Add a little more detail", "Write a caption of at least 4 characters before previewing your post."); return; }
    const cleanOptions = pollOptions.map((item) => item.trim()).filter(Boolean);
    const duration = Number(pollDurationHours);
    if (kind === "poll" && (pollQuestion.trim().length < 4 || cleanOptions.length < 2 || cleanOptions.length > 6 || !Number.isFinite(duration) || duration < 1 || duration > 168)) { alertUser("Check your poll", "Add a clear question, 2–6 options, and a duration from 1 to 168 hours."); return; }
    if (scheduleMode && !isFutureSchedule(scheduleAt)) { alertUser("Choose a future time", "Use a valid local date and time that is later than now. This demo stores a schedule but will not publish it automatically."); return; }
    setShowPublishConfirm(true);
  };

  const publish = async () => {
    setShowPublishConfirm(false);
    if (!app.isAuthenticated) { router.push("/auth/login"); return; }
    autosaveGenerationRef.current += 1;
    if (autosaveTimeoutRef.current !== null) {
      clearTimeout(autosaveTimeoutRef.current);
      autosaveTimeoutRef.current = null;
    }
    setLoading(true); await new Promise((resolve) => setTimeout(resolve, 350));
    const createdAt = new Date();
    const cleanOptions = pollOptions.map((item) => item.trim()).filter(Boolean);
    const pollEndsBase = scheduleMode ? new Date(scheduleAt) : createdAt;
    const postData = { identityKind: identity ? "business" as const : "personal" as const, identityId: identity?.id ?? app.user.id, kind, contentSubtype: contentSubtype || undefined, caption: kind === "story" && !sourceContent ? `${founderPrompt}: ${caption.trim()}` : caption.trim(), media, mediaItems, ...(kind === "video" ? { videoSubtitles: videoSubtitles.trim(), mediaTextOverlay: mediaTextOverlay.trim() } : {}), audience, allowComments, allowSharing, ...(kind === "poll" ? { poll: { question: pollQuestion.trim(), options: cleanOptions.map((text, index) => ({ id: sourceContent?.poll?.options[index]?.id ?? newLocalId("poll-option"), text })), endsAt: new Date(pollEndsBase.getTime() + Number(pollDurationHours) * 60 * 60 * 1000).toISOString(), multipleChoice: pollMultipleChoice, votes: sourceContent?.poll?.votes ?? [] } } : {}), location: app.settings.hidePreciseLocation ? location.split(",")[0] : location, businessId: identity?.id, businessTags, productId: kind === "product" ? selectedProductId : undefined, hashtags: (caption.match(/#([\p{L}\p{N}_]+)/gu) ?? []).map((tag) => tag.slice(1)), mentions: (caption.match(/@([\p{L}\p{N}._-]+)/gu) ?? []).map((mention) => mention.slice(1)) };
    const savedRecord: Post = { ...postData, id: sourceContent?.id ?? newLocalId("post"), authorId: app.user.id, createdAt: sourceContent?.createdAt ?? createdAt.toISOString(), likes: sourceContent?.likes ?? 0, comments: sourceContent?.comments ?? [] };
    if (scheduleMode) {
      if (sourcePost) app.deletePost(sourcePost.id);
      app.schedulePost(savedRecord, new Date(scheduleAt).toISOString());
    } else if (sourceScheduledPost) {
      app.addPost(savedRecord);
      app.removeScheduledPost(sourceScheduledPost.id);
    } else if (sourcePost) app.updatePost(sourcePost.id, postData);
    else app.addPost(savedRecord);
    if (editingDraftId) app.removeDraft(editingDraftId);
    const clearedSnapshotKey = JSON.stringify({ ...snapshot, caption: "", media: undefined, mediaItems: [], businessTags: [], productId: undefined, videoDurationSeconds: undefined });
    suppressedAutosaveSnapshotRef.current = clearedSnapshotKey;
    savedSnapshotRef.current = clearedSnapshotKey;
    setLoading(false); setCaption(""); setMedia(undefined); setMediaItems([]); setBusinessTags([]); setSelectedProductId(undefined); setVideoDurationSeconds(undefined); setVideoEdit(null); setEditingDraftId(undefined); setPreview(false);
    alertUser(scheduleMode ? "Local schedule saved" : "Saved to your local demo", scheduleMode ? "This item is stored on this device only. It will not publish in the background or reach other users." : "This post is stored on this device only; it was not sent to a server.");
    router.replace("/(tabs)");
  };

  const discardAndLeave = () => {
    if (originalDraftRef.current) app.saveDraft(originalDraftRef.current);
    else if (editingDraftId) app.removeDraft(editingDraftId);
    savedSnapshotRef.current = snapshotKey;
    const action = pendingNavigationRef.current;
    pendingNavigationRef.current = null;
    setShowDiscardConfirm(false);
    if (action) navigation.dispatch(action);
  };

  const chooseIdentity = (nextId?: string) => {
    const selectedId = nextId ?? app.user.id;
    setIdentityId(selectedId);
    setSelectedProductId(undefined);
    app.switchIdentity(nextId);
    setShowIdentityPicker(false);
  };

  const openMilestones = () => {
    if (identity?.id) router.push({ pathname: "/milestones", params: { businessId: identity.id } });
    else if (app.activeBusinessId) router.push({ pathname: "/milestones", params: { businessId: app.activeBusinessId } });
    else router.push("/create-business");
  };

  return <Page>
    <TopBar title={t("create", app.settings.language)} right={<Pressable accessibilityRole="button" accessibilityLabel="Open saved drafts" onPress={() => router.push("/drafts")} style={[styles.iconButton, { width: 42, height: 42 }]}><Ionicons name="folder-open-outline" size={19} color={colors.emeraldDark} />{app.drafts.length > 0 ? <View style={{ position: "absolute", right: -3, top: -3, minWidth: 16, height: 16, borderRadius: 9, paddingHorizontal: 4, alignItems: "center", justifyContent: "center", backgroundColor: colors.orange }}><Text style={{ color: colors.white, fontSize: 9, fontWeight: "800" }}>{app.drafts.length}</Text></View> : null}</Pressable>} />

    <View style={{ padding: 18, borderRadius: 22, backgroundColor: colors.navy, gap: 8, overflow: "hidden" }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}><Ionicons name="sparkles-outline" size={14} color={colors.orange} /><Text style={{ color: colors.orange, fontSize: 10, fontWeight: "800", letterSpacing: 1.15 }}>YOUR CREATION STUDIO</Text></View>
      <Text style={{ color: colors.white, fontSize: 24, fontWeight: "800", letterSpacing: -0.5, lineHeight: 29, maxWidth: "88%" }}>Make your next move.</Text>
      <Text style={{ color: "#D9E2E9", fontSize: 13, lineHeight: 19, maxWidth: "78%" }}>Share what you’re building, one useful update at a time.</Text>
      <View style={{ position: "absolute", right: -14, bottom: -25, width: 108, height: 108, borderRadius: 54, backgroundColor: colors.navySoft, opacity: 0.7 }} />
      <View style={{ position: "absolute", right: 18, top: 20 }}><Ionicons name="create-outline" size={25} color={colors.orange} /></View>
    </View>

    <LocalNote text="Local publishing demo · content and schedules stay on this device; nothing is sent or auto-published" />
    <Text style={styles.caption} accessibilityLiveRegion="polite">{saveStatus}</Text>
    {!app.isAuthenticated ? <EmptyState title="Sign in to create content" detail="Browse the feed and business stories without an account. Posting, drafts, follows, comments and saves require sign-in." icon="lock-closed-outline" action="Sign in" onAction={() => router.push("/auth/login")} /> : null}

    <View style={[styles.card, { padding: 13, gap: 9 }]}><View style={styles.row}><View style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: colors.orangeTint, alignItems: "center", justifyContent: "center" }}><Ionicons name="aperture-outline" size={18} color={colors.orange} /></View><View style={{ flex: 1 }}><Text style={styles.cardTitle}>Social Stories</Text><Text style={styles.caption}>A separate format that expires after 24 hours</Text></View><Button title="Create Story" small icon="add-outline" variant="soft" onPress={() => router.push("/create-social-story")} /></View></View>

    <View style={{ gap: 9 }}>
      <View style={styles.rowBetween}><View style={{ gap: 3 }}><Text style={styles.sectionHeading}>Publish as</Text><Text style={styles.caption}>Choose the profile your community will see.</Text></View><Ionicons name="chevron-down" size={17} color={colors.muted} /></View>
      <Pressable accessibilityRole="button" accessibilityLabel={`Publishing as ${identity?.name ?? `Personal · ${app.user.name}`}`} accessibilityHint="Change the profile used for this post" onPress={() => setShowIdentityPicker((visible) => !visible)} style={{ minHeight: 60, paddingHorizontal: 13, paddingVertical: 10, borderRadius: 17, borderWidth: 1, borderColor: showIdentityPicker ? colors.emerald : colors.border, backgroundColor: colors.surface, flexDirection: "row", alignItems: "center", gap: 11 }}>
        <Avatar name={identity?.name ?? app.user.name} image={identity?.logo ?? app.user.avatar} size={39} />
        <View style={{ flex: 1, gap: 3 }}><Text style={styles.cardTitle}>{identity?.name ?? app.user.name}</Text><Text style={styles.caption}>{identity ? `${identity.category} · Business profile` : "Personal profile"}</Text></View>
        <Text style={{ color: colors.emeraldDark, fontSize: 12, fontWeight: "700" }}>Change</Text>
      </Pressable>
      {showIdentityPicker ? <View style={{ padding: 10, borderRadius: 17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 5 }}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Personal · ${app.user.name}`} onPress={() => chooseIdentity()} style={{ minHeight: 48, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 5 }}><Avatar name={app.user.name} image={app.user.avatar} size={32} /><Text style={[styles.body, { flex: 1 }]}>Personal · {app.user.name}</Text>{!identity ? <Ionicons name="checkmark-circle" size={19} color={colors.emerald} /> : null}</Pressable>
        {app.businesses.filter((business) => business.ownerId === app.user.id || business.team.some((member) => member.userId === app.user.id)).map((business) => <Pressable key={business.id} accessibilityRole="button" accessibilityLabel={business.name} onPress={() => chooseIdentity(business.id)} style={{ minHeight: 48, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 5 }}><Avatar name={business.name} image={business.logo} size={32} /><View style={{ flex: 1 }}><Text style={styles.body}>{business.name}</Text><Text style={styles.caption}>{business.category} · {business.town}</Text></View>{identity?.id === business.id ? <Ionicons name="checkmark-circle" size={19} color={colors.emerald} /> : null}</Pressable>)}
        <Button title="Create a business profile" icon="add-outline" variant="quiet" small onPress={() => router.push(app.isAuthenticated ? "/create-business" : "/auth/login")} />
      </View> : null}
    </View>

    <View style={{ gap: 9 }}>
      <View style={styles.rowBetween}><Text style={styles.sectionHeading}>Choose a format</Text><Text style={styles.caption}>Swipe to explore</Text></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 2 }}>
        {TYPES.map((item, index) => {
          const active = kind === item.value;
          return <Pressable key={item.value} accessibilityRole="button" accessibilityLabel={item.title} accessibilityState={{ selected: active }} onPress={() => setKind(item.value)} style={{ width: 110, minHeight: 91, paddingHorizontal: 10, paddingVertical: 11, borderRadius: 17, borderWidth: 1.5, borderColor: active ? colors.emerald : colors.border, backgroundColor: active ? colors.emeraldTint : colors.surface, justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}><View style={{ width: 30, height: 30, borderRadius: 11, backgroundColor: active ? colors.emeraldFill : colors.subtle, alignItems: "center", justifyContent: "center" }}><Ionicons name={item.icon} size={16} color={active ? colors.white : colors.emeraldDark} /></View>{active ? <Ionicons name="checkmark-circle" size={16} color={colors.emeraldDark} /> : <Text style={styles.caption}>{index + 1}</Text>}</View>
            <View style={{ gap: 2 }}><Text style={[styles.cardTitle, { fontSize: 12 }]}>{item.title}</Text><Text numberOfLines={1} style={{ color: colors.muted, fontSize: 9 }}>{item.detail}</Text></View>
          </Pressable>;
        })}
      </ScrollView>
    </View>

    <View style={{ padding: 14, borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 11 }}>
      <View style={styles.rowBetween}><View style={{ flex: 1, gap: 3 }}><Text style={styles.sectionHeading}>{kind === "story" ? "Tell a founder story" : kind === "announcement" ? "Share a business update" : kind === "product" ? "Showcase a product" : kind === "poll" ? "Ask and listen" : kind === "question" ? "Ask your community" : kind === "promotion" ? "Promote an offer" : kind === "event" ? "Share an event notice" : kind === "opportunity" ? "Invite collaboration" : "Write your post"}</Text><Text style={styles.caption}>{kind === "story" ? "A permanent founder story, separate from 24-hour Social Stories." : "Make it clear, useful, and true to your community."}</Text></View><Ionicons name={TYPES.find((item) => item.value === kind)?.icon ?? "create-outline"} size={21} color={colors.emeraldDark} /></View>
      {kind === "story" ? <><Text style={styles.label}>Guided founder story prompt</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>{["How I started", "Why I started", "My startup capital journey", "My first customer", "My first sale", "Business challenges", "Mistakes and recovery", "Lessons learned", "Business growth", "Behind my business", "Customer problem", "Turning point", "Community impact", "Advice for entrepreneurs", "Business expansion"].map((prompt) => <Chip key={prompt} label={prompt} selected={founderPrompt === prompt} onPress={() => setFounderPrompt(prompt)} />)}</View></> : null}
      {(identity || kind === "announcement" || kind === "promotion" || kind === "event") ? <View style={{ gap: 7 }}><Text style={styles.label}>Business content type</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>{BUSINESS_SUBTYPES.map((subtype) => <Chip key={subtype} label={subtype} selected={contentSubtype === subtype} onPress={() => setContentSubtype(contentSubtype === subtype ? "" : subtype)} />)}</View><Text style={styles.caption}>Choose a label only when it accurately describes this content.</Text></View> : null}
      <Field maxLength={500} label="What's the story?" placeholder="Share an update, a lesson, or something your community should know…" value={caption} onChangeText={setCaption} multiline />
      <Button title="Open writing assistant" icon="sparkles-outline" variant="outline" small onPress={() => router.push({ pathname: "/create-assistant", params: { initial: caption, kind } })} />
      {kind === "video" ? <><Field label="Video text overlay" value={mediaTextOverlay} onChangeText={setMediaTextOverlay} maxLength={180} placeholder="Optional short overlay text" /><Field label="Captions or subtitles" value={videoSubtitles} onChangeText={setVideoSubtitles} multiline maxLength={1000} placeholder="Add accessible caption text for this clip" /><Text style={styles.caption}>{videoDurationSeconds ? `Source duration · ${videoDurationSeconds.toFixed(1)} sec` : "Source duration is not available in this picker result."} {videoEdit ? `· Local edit plan · ${videoEdit.startSeconds.toFixed(1)}–${videoEdit.endSeconds.toFixed(1)} sec · ${videoEdit.filter} filter` : "· Edit metadata only; source bytes stay unchanged"}</Text><Button title="Open local video editor" icon="film-outline" variant="soft" small disabled={!media} onPress={() => media && router.push({ pathname: "/video-editor", params: { source: media, duration: videoDurationSeconds ? String(videoDurationSeconds) : "" } })} /></> : null}
      <View style={styles.rowBetween}><Text style={[styles.caption, { flex: 1 }]}>Use #hashtags to help people discover your post.</Text><Text style={[styles.caption, { fontVariant: ["tabular-nums"] }]}>{caption.length}/500</Text></View>
      {kind === "poll" ? <View style={{ gap: 9, padding: 12, borderRadius: 15, backgroundColor: colors.subtle }}><Text style={styles.cardTitle}>Poll settings</Text><Field label="Poll question" value={pollQuestion} onChangeText={setPollQuestion} placeholder="What would help your business most?" maxLength={180} />{pollOptions.map((option, index) => <Field key={index} label={`Option ${index + 1}`} value={option} onChangeText={(value) => setPollOptions((items) => items.map((item, i) => i === index ? value : item))} placeholder={`Answer ${index + 1}`} maxLength={80} />)}<View style={styles.row}><Button title="Add option" icon="add-outline" variant="outline" small disabled={pollOptions.length >= 6} onPress={() => setPollOptions((items) => [...items, ""])} />{pollOptions.length > 2 ? <Button title="Remove last" variant="quiet" small onPress={() => setPollOptions((items) => items.slice(0, -1))} /> : null}</View><Field label="Duration in hours (1–168)" keyboardType="number-pad" value={pollDurationHours} onChangeText={setPollDurationHours} /><Chip label={pollMultipleChoice ? "Multiple choices allowed" : "One choice per person"} selected={pollMultipleChoice} onPress={() => setPollMultipleChoice((value) => !value)} /><Text style={styles.caption}>Demo voting is saved locally. Votes are not sent to a server and duplicate one-choice votes are blocked on this device.</Text></View> : null}
      <View style={{ flexDirection: "row", gap: 7 }}>
        <Button title="Camera" icon="camera-outline" variant="soft" small onPress={() => void takePhoto()} />
        <Button title="Photo" icon="image-outline" variant="outline" small onPress={() => void selectMedia("images")} />
        <Button title="Record video" icon="videocam-outline" variant="outline" small onPress={() => void recordVideo()} />
        <Button title="Choose video" icon="film-outline" variant="outline" small onPress={() => void selectMedia("videos")} />
      </View>
      {media ? <View style={{ gap: 8 }}>{kind === "video" ? <VideoPreview uri={media} height={205} /> : mediaItems.map((uri, index) => <View key={`${uri}-${index}`} style={{ gap: 5 }}><View style={styles.rowBetween}><Text style={styles.caption}>Photo {index + 1} of {mediaItems.length}</Text><View style={styles.row}><Pressable accessibilityRole="button" accessibilityLabel={`Move photo ${index + 1} left`} disabled={index === 0} onPress={() => setMediaItems((items) => { const next = [...items]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; setMedia(next[0]); return next; })}><Ionicons name="arrow-back-circle-outline" size={21} color={colors.emeraldDark} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Remove photo ${index + 1}`} onPress={() => setMediaItems((items) => { const next = items.filter((_, i) => i !== index); setMedia(next[0]); return next; })}><Ionicons name="close-circle-outline" size={21} color={colors.danger} /></Pressable></View></View><MediaImage uri={uri} height={190} label={`Photo ${index + 1}`} /></View>)}<Button title="Remove all media" variant="quiet" small onPress={() => { setMedia(undefined); setMediaItems([]); }} /></View> : <View style={{ flexDirection: "row", alignItems: "center", gap: 9, padding: 11, borderRadius: 13, backgroundColor: colors.subtle }}><Ionicons name="phone-portrait-outline" size={18} color={colors.emeraldDark} /><Text style={[styles.caption, { flex: 1 }]}>Select up to 6 compressed photos or one video. Files remain on this device; upload service requires a configured backend.</Text></View>}
      {kind === "product" ? <View style={{ gap: 8 }}><Text style={styles.label}>Select a catalogue product</Text>{productsForIdentity.length ? <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>{productsForIdentity.map((product) => <Chip key={product.id} label={`${product.name} · KSh ${product.price.toLocaleString("en-KE")}`} selected={selectedProductId === product.id} onPress={() => setSelectedProductId(product.id)} />)}</View> : <Text style={styles.caption}>Add a product in Business tools first.</Text>}</View> : null}
    </View>

    <Pressable accessibilityRole="button" accessibilityState={{ expanded: showDetails }} onPress={() => setShowDetails((visible) => !visible)} style={{ minHeight: 48, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", gap: 9, borderRadius: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
      <View style={{ width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: colors.emeraldTint }}><Ionicons name="options-outline" size={17} color={colors.emeraldDark} /></View>
      <Text style={[styles.cardTitle, { flex: 1 }]}>Add details</Text>
      <Text style={styles.caption}>{location || businessTags.length ? "Added" : "Location · business tags"}</Text>
      <Ionicons name={showDetails ? "chevron-up" : "chevron-down"} size={17} color={colors.muted} />
    </Pressable>
    {showDetails ? <View style={{ padding: 13, borderRadius: 17, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, gap: 11 }}>
      <Field label="Location" value={location} onChangeText={setLocation} placeholder="Town or county" />
      <View style={styles.rowBetween}><Text style={[styles.caption, { flex: 1 }]}>Location visibility: {app.settings.hidePreciseLocation ? "town/county only" : "business area"}</Text><Button title="Privacy" variant="quiet" small onPress={() => router.push("/privacy")} /></View>
      <Button title={businessTags.length ? `Businesses tagged · ${businessTags.length}` : "Tag a business"} icon="pricetag-outline" variant="outline" small onPress={() => { if (!app.isAuthenticated) { router.push("/auth/login"); return; } setShowTagPicker((visible) => !visible); }} />
      {showTagPicker ? <View style={{ gap: 7 }}><Text style={styles.caption}>Choose the businesses mentioned in your post.</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>{app.businesses.map((business) => <Chip key={business.id} label={business.name} selected={businessTags.includes(business.id)} onPress={() => setBusinessTags((current) => current.includes(business.id) ? current.filter((id) => id !== business.id) : [...current, business.id])} />)}</View></View> : null}
      <Text style={styles.label}>Audience</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>{(["public", "followers", "private"] as const).map((item) => <Chip key={item} label={item === "public" ? "Public" : item === "followers" ? "Followers" : "Only me"} selected={audience === item} onPress={() => setAudience(item)} />)}</View>
      <Text style={styles.label}>Publishing time</Text><View style={styles.row}><Chip label="Save/publish now" selected={!scheduleMode} onPress={() => setScheduleMode(false)} /><Chip label="Schedule on this device" selected={scheduleMode} onPress={() => setScheduleMode(true)} /></View>
      {scheduleMode ? <><Field label="Local date and time · YYYY-MM-DDTHH:mm" value={scheduleAt} onChangeText={setScheduleAt} placeholder="2026-12-01T09:30" autoCapitalize="none" /><Text style={styles.caption}>A future date is required. This is a local reminder/record only; there is no background publishing service.</Text></> : null}
      <View style={styles.row}><Chip label={allowComments ? "Comments on" : "Comments off"} selected={allowComments} onPress={() => setAllowComments((value) => !value)} /><Chip label={allowSharing ? "Sharing on" : "Sharing off"} selected={allowSharing} onPress={() => setAllowSharing((value) => !value)} /></View>
      <Text style={styles.caption}>These preferences are stored in this local demo; they do not enforce server-side access control.</Text>
    </View> : null}

    {preview ? <View style={[styles.card, { padding: 14, gap: 10 }]}><View style={styles.rowBetween}><Text style={styles.sectionHeading}>Post preview</Text><Pressable accessibilityRole="button" accessibilityLabel="Close post preview" onPress={() => setPreview(false)}><Ionicons name="close-circle-outline" size={21} color={colors.muted} /></Pressable></View><View style={styles.row}><Avatar name={identity?.name ?? app.user.name} image={identity?.logo ?? app.user.avatar} size={34} /><View><Text style={styles.cardTitle}>{identity?.name ?? app.user.name}</Text><Text style={styles.caption}>{identity ? "Business profile" : "Personal profile"}</Text></View></View>{contentSubtype ? <Chip label={contentSubtype} /> : null}<Text style={styles.body}>{kind === "story" ? `${founderPrompt}: ${caption}` : caption}</Text>{kind === "video" && media ? <VideoPreview uri={media} height={190} /> : kind === "image" ? mediaItems.map((uri, index) => <MediaImage key={`${uri}-${index}`} uri={uri} height={180} label={`Preview photo ${index + 1}`} />) : null}{kind === "poll" ? <View style={{ gap: 6 }}><Text style={styles.cardTitle}>{pollQuestion}</Text>{pollOptions.filter(Boolean).map((option, index) => <Chip key={`${option}-${index}`} label={option} />)}<Text style={styles.caption}>Ends {scheduleMode ? `after scheduled time + ${pollDurationHours} hours` : `in ${pollDurationHours} hours`} · {pollMultipleChoice ? "multiple choice" : "one choice"}</Text></View> : null}{selectedProduct ? <ProductCard product={selectedProduct} /> : null}<Text style={styles.caption}>{location} · {formatDate(new Date())} · {audience === "public" ? "Public" : audience === "followers" ? "Followers" : "Only me"}</Text>{scheduleMode ? <LocalNote text={`Local schedule · ${scheduleAt || "Choose a time"} · no background publishing`} /> : null}</View> : null}

    <View style={{ gap: 9 }}>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <View style={{ flex: 1 }}><Button title={t("saveDraft", app.settings.language)} icon="save-outline" variant="outline" onPress={() => app.isAuthenticated ? saveDraft() : router.push("/auth/login")} /></View>
        <View style={{ flex: 1 }}><Button title="Preview" icon="eye-outline" variant="soft" onPress={() => { if (caption.trim().length < 4) alertUser("Add a caption", "Write a short caption before previewing."); else setPreview(!preview); }} /></View>
      </View>
      <Button title={loading ? "Saving…" : scheduleMode ? "Save local schedule" : sourcePost ? "Save post changes" : sourceScheduledPost ? "Publish now" : "Publish locally"} icon={scheduleMode ? "time-outline" : "send-outline"} disabled={loading} onPress={validatePublish} />
      <Text style={[styles.caption, { textAlign: "center" }]}>Only stored on this device · no shared audience, background scheduler, or server publishing</Text>
    </View>

    <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 3 }} />
    <View style={{ gap: 5 }}><Text style={styles.sectionHeading}>Business tools</Text><Text style={styles.caption}>Keep your products, story, and next steps moving.</Text></View>
    <Pressable accessibilityRole="button" accessibilityLabel="Manage products and services" onPress={() => router.push(app.isAuthenticated ? "/catalog-management" : "/auth/login")} style={{ minHeight: 66, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 11 }}>
      <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: colors.emeraldTint, alignItems: "center", justifyContent: "center" }}><Ionicons name="pricetags-outline" size={20} color={colors.emeraldDark} /></View><View style={{ flex: 1, gap: 3 }}><Text style={styles.cardTitle}>Products & services</Text><Text style={styles.caption}>Add, edit, or remove catalogue items</Text></View><Ionicons name="arrow-forward" size={17} color={colors.emeraldDark} />
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="Add business milestone" onPress={openMilestones} style={{ minHeight: 66, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 11 }}>
      <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: colors.orangeTint, alignItems: "center", justifyContent: "center" }}><Ionicons name="trophy-outline" size={20} color={colors.orange} /></View><View style={{ flex: 1, gap: 3 }}><Text style={styles.cardTitle}>Business milestone</Text><Text style={styles.caption}>Record a launch, first customer, or achievement</Text></View><Ionicons name="arrow-forward" size={17} color={colors.emeraldDark} />
    </Pressable>
    <View style={{ flexDirection: "row", gap: 8 }}>
      <View style={{ flex: 1 }}><Button title="Create business" icon="business-outline" variant="outline" small onPress={() => router.push(app.isAuthenticated ? "/create-business" : "/auth/login")} /></View>
      <View style={{ flex: 1 }}><Button title="Explore ideas" icon="bulb-outline" variant="outline" small onPress={() => router.push("/opportunities")} /></View>
    </View>
    <View style={styles.row}><Button title="Create product" icon="pricetag-outline" small variant="soft" onPress={() => router.push({ pathname: "/create-catalog-item", params: { kind: "product" } })} /><Button title="Create service" icon="construct-outline" small variant="soft" onPress={() => router.push({ pathname: "/create-catalog-item", params: { kind: "service" } })} /></View>
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}><Button title="Create offer" icon="pricetags-outline" small variant="outline" onPress={() => router.push({ pathname: "/create-listing", params: { kind: "offer" } })} /><Button title="Create event" icon="calendar-outline" small variant="outline" onPress={() => router.push({ pathname: "/create-listing", params: { kind: "event" } })} /><Button title="Publish opportunity" icon="bulb-outline" small variant="outline" onPress={() => router.push({ pathname: "/create-listing", params: { kind: "opportunity" } })} /><Button title="Manage my posts" icon="documents-outline" small variant="outline" onPress={() => router.push("/my-content")} /></View>
    <Pressable accessibilityRole="button" onPress={() => router.push("/drafts")} style={{ minHeight: 43, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 4 }}><Ionicons name="documents-outline" size={17} color={colors.emeraldDark} /><Text style={[styles.body, { flex: 1 }]}>Manage drafts</Text><Text style={styles.caption}>{app.drafts.length} saved</Text><Ionicons name="chevron-forward" size={16} color={colors.muted} /></Pressable>
    <Text style={[styles.caption, { paddingBottom: 8 }]}>Local demo only: assistant suggestions are deterministic examples; saved schedules do not auto-publish; media edits are metadata only; no upload, licensing or shared delivery is configured.</Text>
    <ConfirmModal visible={showPublishConfirm} title={scheduleMode ? "Save this local schedule?" : "Confirm local publish?"} detail={scheduleMode ? "The item will be recorded on this device only. The app will not wake in the background or send it to an audience." : "This adds the content to your on-device demo feed only. It will not be uploaded or shown to other users."} confirmLabel={scheduleMode ? "Save locally" : "Save post locally"} onCancel={() => setShowPublishConfirm(false)} onConfirm={() => void publish()} />
    <ConfirmModal visible={showDiscardConfirm} title="Leave this composer?" detail="Your latest change may still be waiting for local autosave. Leave and discard that uncommitted edit, or keep editing." confirmLabel="Leave and discard" destructive onCancel={() => setShowDiscardConfirm(false)} onConfirm={discardAndLeave} />
  </Page>;
}
