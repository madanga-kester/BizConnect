import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Platform, Pressable, Text, View } from "react-native";
import { Button, Chip, ConfirmModal, Field, LocalNote, MediaImage, Page, TopBar, VideoPreview, styles } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { colors } from "@/theme/tokens";
import type { ContentAudience, SocialStory } from "@/types/domain";
import type { PersistedComposerDraft, StoryComposerSnapshot } from "@/types/create-studio";
import { newLocalId } from "@/utils/ids";

const BACKGROUNDS = ["#123B42", "#142A4A", "#7A3B48", "#5A3C73", "#7A4A18", "#142A32"];
const EMOJIS = ["✨", "🎉", "🌱", "🇰🇪", "💡", "👏", "❤️", "☀️"];
const MUSIC_LABELS = ["No audio", "Acoustic instrumental · sample label", "Nairobi ambient · label only", "Afro-fusion · label only"];

function notify(title: string, message: string) { if (Platform.OS === "web") window.alert(`${title}\n\n${message}`); else Alert.alert(title, message); }
function storyDraft(id: string, snapshot: StoryComposerSnapshot): PersistedComposerDraft {
  return { id, kind: "story", caption: snapshot.caption, media: snapshot.media[0], mediaItems: snapshot.media, identityId: snapshot.identityId, businessTags: [], location: snapshot.location, updatedAt: new Date().toISOString(), draftType: "social-story", composer: { version: 1, mode: "social-story", story: snapshot } };
}
function stickerText(story: SocialStory | undefined, kind: SocialStory["overlays"][number]["kind"]): string {
  return story?.overlays.find((item) => item.kind === kind)?.text ?? "";
}

export default function CreateSocialStoryScreen() {
  const app = useAppStore();
  const authenticated = app.isAuthenticated;
  const saveToStore = app.saveDraft;
  const { draftId, storyId, highlightId } = useLocalSearchParams<{ draftId?: string; storyId?: string; highlightId?: string }>();
  const sourceDraft = draftId ? app.drafts.find((item) => item.id === draftId && item.draftType === "social-story") : undefined;
  const sourceStory = storyId ? app.socialStories.find((item) => item.id === storyId && item.authorId === app.user.id) : undefined;
  const storySeed = sourceDraft?.composer?.mode === "social-story" ? sourceDraft.composer.story : undefined;
  const requestedHighlightId = typeof highlightId === "string" ? highlightId : storySeed?.highlightId;
  const targetHighlight = app.storyHighlights.find((item) => item.id === requestedHighlightId && item.ownerId === app.user.id);
  const [seed] = useState<StoryComposerSnapshot>(() => ({
    caption: sourceStory?.caption ?? storySeed?.caption ?? sourceDraft?.caption ?? "",
    identityId: sourceStory?.identityId ?? storySeed?.identityId ?? sourceDraft?.identityId ?? app.activeBusinessId ?? app.user.id,
    media: sourceStory?.mediaItems ?? storySeed?.media ?? sourceDraft?.mediaItems ?? (sourceDraft?.media ? [sourceDraft.media] : []),
    mediaKind: sourceStory?.mediaKind ?? storySeed?.mediaKind ?? "image",
    overlayText: stickerText(sourceStory, "text") || storySeed?.overlayText || "",
    emoji: stickerText(sourceStory, "emoji") || storySeed?.emoji || "",
    location: stickerText(sourceStory, "location") || storySeed?.location || "",
    mention: stickerText(sourceStory, "mention") || storySeed?.mention || "",
    question: sourceStory?.question ?? (stickerText(sourceStory, "question") || storySeed?.question || ""),
    pollQuestion: sourceStory?.poll?.question ?? storySeed?.pollQuestion ?? "",
    pollOptions: sourceStory?.poll?.options.join("\n") ?? storySeed?.pollOptions ?? "",
    link: sourceStory?.link ?? storySeed?.link ?? "",
    audience: sourceStory?.audience ?? storySeed?.audience ?? "public",
    background: sourceStory?.backgroundColor ?? sourceStory?.background ?? storySeed?.background ?? BACKGROUNDS[0],
    textColor: sourceStory?.textColor ?? storySeed?.textColor ?? "#FFFFFF",
    fontStyle: sourceStory?.fontStyle ?? storySeed?.fontStyle ?? "modern",
    overlayX: sourceStory?.overlays[0]?.x ?? storySeed?.overlayX ?? 0.5,
    overlayY: sourceStory?.overlays[0]?.y ?? storySeed?.overlayY ?? 0.5,
    musicTrack: sourceStory?.musicTrack ?? storySeed?.musicTrack ?? MUSIC_LABELS[0],
    highlightId: targetHighlight?.id,
  }));
  const [editingDraftId, setEditingDraftId] = useState(sourceDraft?.id);
  const [identityId, setIdentityId] = useState(seed.identityId);
  const [media, setMedia] = useState(seed.media);
  const [mediaKind, setMediaKind] = useState<"image" | "video">(seed.mediaKind);
  const [caption, setCaption] = useState(seed.caption);
  const [overlayText, setOverlayText] = useState(seed.overlayText);
  const [location, setLocation] = useState(seed.location);
  const [mention, setMention] = useState(seed.mention);
  const [emoji, setEmoji] = useState(seed.emoji ?? "");
  const [question, setQuestion] = useState(seed.question);
  const [pollQuestion, setPollQuestion] = useState(seed.pollQuestion);
  const [pollOptions, setPollOptions] = useState(seed.pollOptions);
  const [link, setLink] = useState(seed.link);
  const [audience, setAudience] = useState<ContentAudience>(seed.audience);
  const [background, setBackground] = useState(seed.background);
  const [textColor, setTextColor] = useState(seed.textColor);
  const [fontStyle, setFontStyle] = useState<StoryComposerSnapshot["fontStyle"]>(seed.fontStyle);
  const [overlayPosition, setOverlayPosition] = useState<"top" | "center" | "bottom">(seed.overlayY < 0.3 ? "top" : seed.overlayY > 0.7 ? "bottom" : "center");
  const [musicTrack, setMusicTrack] = useState(seed.musicTrack);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [saveStatus, setSaveStatus] = useState("All changes are saved locally");
  const savedSnapshotRef = useRef(JSON.stringify(seed));
  const originalDraftRef = useRef(sourceDraft);
  const pendingNavigationRef = useRef<unknown>(null);
  const navigation = useNavigation() as { addListener: (name: "beforeRemove", callback: (event: { preventDefault: () => void; data: { action: unknown } }) => void) => () => void; dispatch: (action: unknown) => void };
  const businesses = app.businesses.filter((business) => business.ownerId === app.user.id || business.team.some((member) => member.userId === app.user.id));
  const business = businesses.find((item) => item.id === identityId);
  const label = business?.name ?? app.user.name;
  const pollAnswers = pollOptions.split("\n").map((item) => item.trim()).filter(Boolean);
  const overlayY = overlayPosition === "top" ? 0.16 : overlayPosition === "bottom" ? 0.84 : 0.5;
  const overlays = useMemo<SocialStory["overlays"]>(() => {
    const entries: SocialStory["overlays"] = [];
    const add = (id: string, text: string, kind: SocialStory["overlays"][number]["kind"]) => { if (text.trim()) entries.push({ id, text: text.trim(), kind, x: 0.5, y: overlayY }); };
    add("text", overlayText, "text"); add("location", location, "location"); add("mention", mention, "mention"); add("question", question, "question"); add("emoji", emoji, "emoji");
    return entries;
  }, [overlayText, location, mention, question, emoji, overlayY]);
  const snapshot: StoryComposerSnapshot = { caption, identityId: business?.id ?? app.user.id, media, mediaKind, overlayText, emoji, location, mention, question, pollQuestion, pollOptions, link, audience, background, textColor, fontStyle, overlayX: 0.5, overlayY, musicTrack, highlightId: targetHighlight?.id };
  const snapshotKey = JSON.stringify(snapshot);
  const [seedKey] = useState(() => JSON.stringify(seed));
  const hasDraftContent = Boolean(caption.trim() || media.length || overlayText.trim() || pollQuestion.trim() || snapshotKey !== seedKey);
  const saveDraftLocal = (showFeedback: boolean) => {
    if (!authenticated) { router.push("/auth/login"); return; }
    const id = editingDraftId ?? newLocalId("story-draft");
    saveToStore(storyDraft(id, snapshot)); setEditingDraftId(id); savedSnapshotRef.current = snapshotKey; setSaveStatus("Story draft auto-saved on this device");
    if (showFeedback) notify("Story draft saved", "All Story settings and stickers are saved on this device only.");
  };

  useEffect(() => {
    if (!authenticated || !hasDraftContent || snapshotKey === savedSnapshotRef.current) return;
    setSaveStatus("Unsaved changes");
    const timer = setTimeout(() => {
      const id = editingDraftId ?? newLocalId("story-draft");
      const pendingSnapshot = JSON.parse(snapshotKey) as StoryComposerSnapshot;
      saveToStore(storyDraft(id, pendingSnapshot));
      setEditingDraftId(id); savedSnapshotRef.current = snapshotKey; setSaveStatus("Story draft auto-saved on this device");
    }, 700);
    return () => clearTimeout(timer);
  }, [authenticated, editingDraftId, hasDraftContent, saveToStore, snapshotKey]);
  useEffect(() => navigation.addListener("beforeRemove", (event) => {
    if (snapshotKey === savedSnapshotRef.current) return;
    event.preventDefault(); pendingNavigationRef.current = event.data.action; setShowDiscardConfirm(true);
  }), [navigation, snapshotKey]);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const guard = (event: BeforeUnloadEvent) => { if (snapshotKey === savedSnapshotRef.current) return; event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", guard); return () => window.removeEventListener("beforeunload", guard);
  }, [snapshotKey]);

  const chooseMedia = async (camera: boolean, video: boolean) => {
    try {
      const Picker = await import("expo-image-picker");
      if (camera) { const permission = await Picker.requestCameraPermissionsAsync(); if (!permission.granted) return notify("Camera access needed", "Allow camera access or choose media from your library."); }
      else { const permission = await Picker.requestMediaLibraryPermissionsAsync(); if (!permission.granted) return notify("Media access needed", "Allow access to choose a photo or video."); }
      const result = camera ? await Picker.launchCameraAsync({ mediaTypes: [video ? "videos" : "images"], videoMaxDuration: 30, quality: 0.75 }) : await Picker.launchImageLibraryAsync({ mediaTypes: [video ? "videos" : "images"], allowsMultipleSelection: !video, selectionLimit: 6, quality: 0.75 });
      if (result.canceled || !result.assets.length) return;
      const assets = result.assets.slice(0, video ? 1 : 6); const limit = video ? 100 * 1024 * 1024 : 12 * 1024 * 1024;
      if (assets.some((asset) => asset.fileSize !== undefined && asset.fileSize > limit)) return notify("Media too large", `${video ? "Video" : "Each photo"} must be at most ${video ? "100 MB" : "12 MB"}.`);
      if (assets.some((asset) => asset.mimeType && !asset.mimeType.startsWith(video ? "video/" : "image/"))) return notify("Unsupported media", `Choose a supported ${video ? "video" : "image"} file.`);
      const duration = video && assets[0].duration != null ? assets[0].duration / 1000 : undefined;
      if (duration !== undefined && duration > 30) return notify("Story video too long", "A Story video must be 30 seconds or shorter.");
      if (video) { setMedia(assets.map((asset) => asset.uri)); setMediaKind("video"); }
      else { setMedia((current) => [...(mediaKind === "video" ? [] : current), ...assets.map((asset) => asset.uri)].slice(0, 6)); setMediaKind("image"); }
    } catch { notify("Media unavailable", "Choose a photo or video on a supported Expo device. Media stays local in this demo."); }
  };

  const publish = () => {
    if (requestedHighlightId && !targetHighlight) return notify("Highlight unavailable", "This Highlight is not available to your current profile. Return to Stories and select one you own.");
    setShowPublishConfirm(false);
    if (!app.isAuthenticated) { router.push("/auth/login"); return; }
    if (!media.length && !caption.trim()) return notify("Add content", "A Story needs a photo, video, or caption.");
    if (link.trim() && !/^https:\/\//i.test(link.trim())) return notify("Check your link", "Use a secure https:// link.");
    if (pollQuestion.trim() && pollAnswers.length < 2) return notify("Add poll options", "A Story poll needs at least two answer options, one per line.");
    const now = new Date();
    const story: SocialStory = {
      id: sourceStory?.id ?? newLocalId("social-story"), authorId: app.user.id, identityKind: business ? "business" : "personal", identityId: business?.id ?? app.user.id,
      caption: caption.trim(), mediaItems: media, mediaKind, overlays, audience, createdAt: sourceStory?.createdAt ?? now.toISOString(), expiresAt: sourceStory?.expiresAt ?? new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      ...(background ? { background, backgroundColor: background } : {}), textColor, fontStyle, musicTrack,
      ...(pollQuestion.trim() ? { poll: sourceStory?.poll ? { ...sourceStory.poll, question: pollQuestion.trim(), options: pollAnswers } : { question: pollQuestion.trim(), options: pollAnswers, votes: {} } } : {}),
      ...(question.trim() ? { question: question.trim() } : {}), ...(link.trim() ? { link: link.trim() } : {}),
    };
    setBusy(true);
    if (sourceStory) app.updateSocialStory(sourceStory.id, story);
    else app.addSocialStory(story);
    if (targetHighlight && !targetHighlight.storyIds.includes(story.id)) app.updateStoryHighlight(targetHighlight.id, { storyIds: [...targetHighlight.storyIds, story.id] });
    if (editingDraftId) app.removeDraft(editingDraftId);
    savedSnapshotRef.current = snapshotKey; setBusy(false);
    notify(sourceStory ? "Story updated locally" : "Story saved locally", `This Story is stored on this device only and expires within 24 hours.${targetHighlight ? ` Added to “${targetHighlight.title}”.` : ""} It was not shared or uploaded.`);
    router.replace("/(tabs)/stories");
  };

  const discardAndLeave = () => {
    if (originalDraftRef.current) app.saveDraft(originalDraftRef.current);
    else if (editingDraftId) app.removeDraft(editingDraftId);
    savedSnapshotRef.current = snapshotKey; const action = pendingNavigationRef.current; pendingNavigationRef.current = null; setShowDiscardConfirm(false); if (action) navigation.dispatch(action);
  };

  if (!app.isAuthenticated) return <Page><TopBar title="Create a Story" back /><LocalNote text="Stories are separate from permanent founder stories; all demo Story actions stay on this device." /><Button title="Sign in to create a Story" icon="log-in-outline" onPress={() => router.push("/auth/login")} /></Page>;
  return <Page>
    <TopBar title={sourceStory ? "Edit Social Story" : "Create a Story"} back />
    <View style={{ borderRadius: 20, backgroundColor: colors.navy, padding: 17, gap: 6 }}><Text style={{ color: colors.orange, fontSize: 11, fontWeight: "800", letterSpacing: 1 }}>SOCIAL STORY · 24 HOURS</Text><Text style={{ color: colors.white, fontSize: 22, fontWeight: "800" }}>A moment from today.</Text><Text style={{ color: "#D9E2E9", fontSize: 13, lineHeight: 19 }}>Separate from founder stories. Nothing is broadcast, uploaded or scheduled in the background.</Text></View>
    <LocalNote text="Local-only Story · expires within 24 hours · Highlight collections can retain it on this device" /><Text style={styles.caption} accessibilityLiveRegion="polite">{saveStatus}</Text>
    <Text style={styles.label}>Share as</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}><Chip label={`Personal · ${app.user.name}`} selected={!business} onPress={() => setIdentityId(app.user.id)} />{businesses.map((item) => <Chip key={item.id} label={item.name} selected={identityId === item.id} onPress={() => setIdentityId(item.id)} />)}</View>
    <Text style={styles.label}>Add a photo or video</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}><Button title="Take photo" icon="camera-outline" variant="soft" small onPress={() => void chooseMedia(true, false)} /><Button title="Record video" icon="videocam-outline" variant="soft" small onPress={() => void chooseMedia(true, true)} /><Button title="Choose photos" icon="images-outline" variant="outline" small onPress={() => void chooseMedia(false, false)} /><Button title="Choose video" icon="film-outline" variant="outline" small onPress={() => void chooseMedia(false, true)} /></View>
    {media.length ? <View style={{ gap: 8 }}><Text style={styles.caption}>{mediaKind === "video" ? "Video selected · maximum 30 seconds" : `${media.length} of 6 photos · reorder or remove`}</Text>{media.map((uri, index) => <View key={`${uri}-${index}`} style={{ gap: 6 }}><View style={styles.rowBetween}><Text style={styles.caption}>Item {index + 1}</Text><View style={styles.row}><Pressable accessibilityRole="button" accessibilityLabel={`Move item ${index + 1} left`} disabled={index === 0 || mediaKind === "video"} onPress={() => setMedia((items) => { const next = [...items]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; return next; })}><Ionicons name="arrow-back-circle-outline" size={22} color={colors.emeraldDark} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel={`Remove item ${index + 1}`} onPress={() => setMedia((items) => items.filter((_, i) => i !== index))}><Ionicons name="close-circle-outline" size={22} color={colors.danger} /></Pressable></View></View>{mediaKind === "video" ? <VideoPreview uri={uri} height={195} /> : <MediaImage uri={uri} height={168} label={`Story item ${index + 1}`} />}</View>)}</View> : null}
    <Field label="Caption" value={caption} onChangeText={setCaption} placeholder="Add context for your community…" multiline maxLength={500} />
    {!media.length ? <View style={{ minHeight: 105, borderRadius: 17, padding: 14, backgroundColor: background, justifyContent: "center" }}><Text style={{ color: textColor, fontSize: 18, fontWeight: fontStyle === "bold" ? "900" : "700", fontFamily: fontStyle === "serif" ? "serif" : undefined, textAlign: "center" }}>{overlayText || caption || "Text-only Story preview"}</Text></View> : null}
    <Text style={styles.label}>Story background</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{BACKGROUNDS.map((color) => <Pressable key={color} accessibilityRole="button" accessibilityLabel={`Story background ${color}`} accessibilityState={{ selected: background === color }} onPress={() => setBackground(color)} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: color, borderWidth: background === color ? 3 : 1, borderColor: background === color ? colors.orange : colors.border }} />)}</View>
    <Text style={styles.label}>Text style</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>{(["modern", "serif", "bold", "handwritten"] as const).map((item) => <Chip key={item} label={item} selected={fontStyle === item} onPress={() => setFontStyle(item)} />)}<Chip label="White text" selected={textColor === "#FFFFFF"} onPress={() => setTextColor("#FFFFFF")} /><Chip label="Dark text" selected={textColor === "#17212B"} onPress={() => setTextColor("#17212B")} /></View>
    <Text style={styles.label}>Overlay position</Text><View style={styles.row}>{(["top", "center", "bottom"] as const).map((item) => <Chip key={item} label={item} selected={overlayPosition === item} onPress={() => setOverlayPosition(item)} />)}</View>
    <Field label="Text overlay sticker" value={overlayText} onChangeText={setOverlayText} placeholder="A short phrase over your Story" />
    <Text style={styles.label}>Emoji sticker</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>{EMOJIS.map((item) => <Chip key={item} label={item} selected={emoji === item} onPress={() => setEmoji(emoji === item ? "" : item)} />)}</View>
    <View style={{ flexDirection: "row", gap: 8 }}><View style={{ flex: 1 }}><Field label="Location sticker" value={location} onChangeText={setLocation} placeholder="Town or venue" /></View><View style={{ flex: 1 }}><Field label="Mention a user/business" value={mention} onChangeText={setMention} placeholder="@username or business" /></View></View>
    <Field label="Question sticker" value={question} onChangeText={setQuestion} placeholder="Ask your viewers a question" /><Field label="Poll question (optional)" value={pollQuestion} onChangeText={setPollQuestion} placeholder="Which would you choose?" />
    {pollQuestion ? <Field label="Poll answers · one per line" value={pollOptions} onChangeText={setPollOptions} placeholder={'Option one\nOption two'} multiline /> : null}
    <Field label="Link sticker · https only" value={link} onChangeText={setLink} placeholder="https://example.com" keyboardType="url" autoCapitalize="none" />
    <Text style={styles.label}>Audio or music label</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>{MUSIC_LABELS.map((item) => <Chip key={item} label={item} selected={musicTrack === item} onPress={() => setMusicTrack(item)} />)}</View><Text style={styles.caption}>No audio files are bundled or played. Use only audio you have licensed; these labels are metadata examples, not music.</Text>
    <Text style={styles.label}>Audience</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>{(["public", "followers", "private"] as const).map((item) => <Chip key={item} label={item === "public" ? "Public" : item === "followers" ? "Followers" : "Only me"} selected={audience === item} onPress={() => setAudience(item)} />)}</View>
    {preview ? <View style={[styles.card, { padding: 13, gap: 8 }]}><Text style={styles.sectionHeading}>Story preview · {label}</Text>{media.map((uri, index) => mediaKind === "video" ? <VideoPreview key={`${uri}-${index}`} uri={uri} height={195} /> : <MediaImage key={`${uri}-${index}`} uri={uri} height={195} label="Story preview" />)}<View style={{ padding: 13, borderRadius: 14, backgroundColor: background }}><Text style={{ color: textColor, fontWeight: fontStyle === "bold" ? "900" : "700", fontFamily: fontStyle === "serif" ? "serif" : undefined }}>{caption || "Your Story text"}</Text></View>{overlays.map((item) => <Text key={item.id} style={[styles.caption, { color: item.kind === "emoji" ? colors.orange : colors.ink }]}>{item.kind}: {item.text}</Text>)}{pollQuestion ? <Text style={styles.caption}>Poll: {pollQuestion} · {pollAnswers.join(" / ")}</Text> : null}<Text style={styles.caption}>{musicTrack}</Text></View> : null}
    <View style={styles.row}><Button title={preview ? "Hide preview" : "Preview Story"} icon="eye-outline" variant="outline" onPress={() => setPreview((show) => !show)} /><Button title="Save Story draft" icon="save-outline" variant="soft" onPress={() => saveDraftLocal(true)} /></View>
    <Button title={busy ? "Saving…" : sourceStory ? "Save Story changes locally" : "Publish Story locally"} icon="send-outline" disabled={busy} onPress={() => setShowPublishConfirm(true)} />
    <ConfirmModal visible={showPublishConfirm} title={sourceStory ? "Save Story edits?" : "Publish this Story locally?"} detail="The Story remains on this device, expires within 24 hours and is not delivered to the selected audience." confirmLabel={sourceStory ? "Save edits locally" : "Save Story locally"} onCancel={() => setShowPublishConfirm(false)} onConfirm={publish} />
    <ConfirmModal visible={showDiscardConfirm} title="Leave this Story composer?" detail="Your latest edit may be waiting for local autosave. Leave and discard that uncommitted edit, or keep working." confirmLabel="Leave and discard" destructive onCancel={() => setShowDiscardConfirm(false)} onConfirm={discardAndLeave} />
  </Page>;
}
