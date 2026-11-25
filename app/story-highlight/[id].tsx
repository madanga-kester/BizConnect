import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Platform, Text, View } from "react-native";
import { Button, ConfirmModal, EmptyState, Field, LoadingState, LocalNote, MediaImage, Page, TopBar, VideoPreview, styles } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { useClock } from "@/hooks/use-clock";
import type { EnhancedStoryHighlight } from "@/types/create-studio";
import { colors } from "@/theme/tokens";
import { useThemeContext } from "@/lib/theme-provider";

function announce(title: string, message: string) {
  if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}

export default function StoryHighlightScreen() {
  useThemeContext();
  const app = useAppStore();
  const now = useClock();
  const { id } = useLocalSearchParams<{ id: string }>();
  if (!app.hasHydrated) return <Page><TopBar title="Highlight" back /><LoadingState label="Loading your local Highlight" /></Page>;
  const highlight = app.storyHighlights.find((item) => item.id === id && item.ownerId === app.user.id);
  if (!highlight) return <Page><TopBar title="Highlight" back /><EmptyState title="Highlight unavailable" detail="This local collection may have been removed or belongs to another profile." action="Business Stories" onAction={() => router.replace("/stories")} /></Page>;
  return <HighlightEditor key={highlight.id} app={app} highlight={highlight} now={now} />;
}

function HighlightEditor({ app, highlight, now }: { app: ReturnType<typeof useAppStore>; highlight: EnhancedStoryHighlight; now: number }) {
  useThemeContext();
  const [title, setTitle] = useState(highlight.title);
  const [coverUri, setCoverUri] = useState<string | undefined>(highlight.coverUri);
  const [removeStoryId, setRemoveStoryId] = useState<string>();
  const [confirmRemoveHighlight, setConfirmRemoveHighlight] = useState(false);
  const stories = highlight.storyIds.flatMap((storyId) => {
    const story = app.socialStories.find((item) => item.id === storyId);
    return story ? [story] : [];
  });
  const ownedStories = app.socialStories.filter((story) => story.authorId === app.user.id).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const collections = app.storyHighlights.filter((item) => item.ownerId === app.user.id);

  const saveDetails = () => {
    if (!title.trim()) return announce("Add a title", "A Highlight needs a name before it can be saved.");
    app.updateStoryHighlight(highlight.id, { title: title.trim(), coverUri });
    announce("Highlight updated", "Its title and cover are saved on this device only.");
  };
  const moveCollection = (direction: -1 | 1) => {
    const ids = collections.map((item) => item.id);
    const index = ids.indexOf(highlight.id);
    const destination = index + direction;
    if (index < 0 || destination < 0 || destination >= ids.length) return;
    [ids[index], ids[destination]] = [ids[destination], ids[index]];
    app.reorderStoryHighlights(ids);
  };
  const moveStory = (storyId: string, direction: -1 | 1) => {
    const ids = [...highlight.storyIds];
    const index = ids.indexOf(storyId);
    const destination = index + direction;
    if (index < 0 || destination < 0 || destination >= ids.length) return;
    [ids[index], ids[destination]] = [ids[destination], ids[index]];
    app.reorderStoryHighlight(highlight.id, ids);
  };
  const pickCover = async () => {
    try {
      const Picker = await import("expo-image-picker");
      const permission = await Picker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return announce("Photo access needed", "Allow library access to choose a local Highlight cover.");
      const result = await Picker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [1, 1], quality: 0.75 });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      if (asset.mimeType && !asset.mimeType.startsWith("image/")) return announce("Unsupported cover", "Choose an image for the Highlight cover.");
      if (asset.fileSize !== undefined && asset.fileSize > 12 * 1024 * 1024) return announce("Cover too large", "Choose an image no larger than 12 MB.");
      setCoverUri(asset.uri);
    } catch {
      announce("Cover picker unavailable", "The Highlight can still use the first photo in one of its Stories.");
    }
  };
  const changeMembership = (storyId: string) => {
    if (highlight.storyIds.includes(storyId)) app.removeStoryFromHighlight(highlight.id, storyId);
    else app.updateStoryHighlight(highlight.id, { storyIds: [...highlight.storyIds, storyId] });
  };
  const chooseStoryCover = (storyId: string) => {
    const story = app.socialStories.find((item) => item.id === storyId && item.authorId === app.user.id);
    if (story?.mediaKind === "image" && story.mediaItems[0]) setCoverUri(story.mediaItems[0]);
  };

  return <Page>
    <TopBar title={highlight.title} back />
    <LocalNote text="Owner-managed Highlight · local-only collection · included Stories can remain visible after their regular 24-hour expiry" />
    {coverUri ? <MediaImage uri={coverUri} height={175} label={`${highlight.title} local cover`} /> : <View style={{ minHeight: 90, padding: 16, justifyContent: "center", borderRadius: 16, backgroundColor: colors.emeraldTint }}><Text style={styles.cardTitle}>No cover selected</Text><Text style={styles.caption}>Choose a local photo or use an image from a Story below.</Text></View>}
    <Field label="Highlight title" value={title} onChangeText={setTitle} placeholder="e.g. Behind the business" maxLength={40} />
    <View style={styles.row}><Button title="Choose cover photo" icon="image-outline" small variant="outline" onPress={() => void pickCover()} />{coverUri ? <Button title="Clear cover" icon="close-outline" small variant="quiet" onPress={() => setCoverUri(undefined)} /> : null}<Button title="Save details" icon="checkmark-outline" small onPress={saveDetails} /></View>
    <View style={[styles.rowBetween, styles.card, { padding: 11 }]}><Text style={styles.cardTitle}>Highlight order</Text><View style={styles.row}><Button title="Move earlier" icon="arrow-up-outline" small variant="outline" disabled={collections.findIndex((item) => item.id === highlight.id) <= 0} onPress={() => moveCollection(-1)} /><Button title="Move later" icon="arrow-down-outline" small variant="outline" disabled={collections.findIndex((item) => item.id === highlight.id) === collections.length - 1} onPress={() => moveCollection(1)} /></View></View>
    <View style={styles.rowBetween}><Text style={styles.sectionHeading}>Stories in this Highlight · {stories.length}</Text><Button title="Create Story" icon="add-outline" small onPress={() => router.push({ pathname: "/create-social-story", params: { highlightId: highlight.id } })} /></View>
    {stories.length ? stories.map((story, index) => <View key={story.id} style={[styles.card, { padding: 12, gap: 8 }]}>
      {story.mediaItems.map((uri, mediaIndex) => story.mediaKind === "video" ? <VideoPreview key={`${uri}-${mediaIndex}`} uri={uri} height={200} /> : <MediaImage key={`${uri}-${mediaIndex}`} uri={uri} height={185} label={`${highlight.title} · photo ${mediaIndex + 1}`} />)}
      {!story.mediaItems.length ? <Text style={styles.body}>{story.caption || "Text-only Story"}</Text> : story.caption ? <Text style={styles.body}>{story.caption}</Text> : null}
      <Text style={styles.caption}>{Date.parse(story.expiresAt) > now ? "Active Story" : "Saved past 24-hour expiry"} · {new Date(story.createdAt).toLocaleDateString("en-KE")}</Text>
      <View style={styles.row}><Button title="Move up" icon="arrow-up-outline" small variant="outline" disabled={index === 0} onPress={() => moveStory(story.id, -1)} /><Button title="Move down" icon="arrow-down-outline" small variant="outline" disabled={index === stories.length - 1} onPress={() => moveStory(story.id, 1)} /><Button title="View" icon="eye-outline" small variant="soft" onPress={() => router.push({ pathname: "/social-story/[id]", params: { id: story.id } })} /><Button title="Remove from Highlight" icon="remove-circle-outline" small variant="quiet" onPress={() => setRemoveStoryId(story.id)} /></View>
      {story.mediaKind === "image" && story.mediaItems[0] ? <Button title={coverUri === story.mediaItems[0] ? "Using as cover" : "Use photo as cover"} icon="image-outline" small variant="outline" disabled={coverUri === story.mediaItems[0]} onPress={() => chooseStoryCover(story.id)} /> : null}
    </View>) : <EmptyState title="No Stories in this Highlight" detail="Add an existing Story from your local archive or create a new Story directly into this collection." />}
    <Text style={styles.sectionHeading}>Your Story library</Text>
    {ownedStories.length ? ownedStories.map((story) => {
      const included = highlight.storyIds.includes(story.id);
      const active = Date.parse(story.expiresAt) > now;
      return <View key={story.id} style={[styles.card, { padding: 11, gap: 7 }]}><View style={styles.rowBetween}><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{story.caption || (story.mediaKind === "video" ? "Video Story" : "Social Story")}</Text><Text style={styles.caption}>{active ? "Active" : "Expired · available in your local archive"}</Text></View><Button title={included ? "Remove" : "Add"} icon={included ? "remove-circle-outline" : "add-circle-outline"} small variant={included ? "quiet" : "soft"} onPress={() => { if (included) setRemoveStoryId(story.id); else changeMembership(story.id); }} /></View><View style={styles.row}>{story.mediaItems.slice(0, 1).map((uri) => story.mediaKind === "video" ? <VideoPreview key={uri} uri={uri} height={110} /> : <MediaImage key={uri} uri={uri} height={110} label="Story library item" />)}<Button title="View" icon="eye-outline" small variant="outline" onPress={() => router.push({ pathname: "/social-story/[id]", params: { id: story.id } })} /></View></View>;
    }) : <EmptyState title="Your Story library is empty" detail="Create a Social Story and it will appear here for Highlight curation." action="Create Story" onAction={() => router.push({ pathname: "/create-social-story", params: { highlightId: highlight.id } })} />}
    <Button title="Remove this Highlight collection" icon="trash-outline" variant="danger" small onPress={() => setConfirmRemoveHighlight(true)} />
    <ConfirmModal visible={Boolean(removeStoryId)} title="Remove Story from this Highlight?" detail="The Story will remain in your local Story library and other Highlights. This action does not delete the Story." confirmLabel="Remove from Highlight" destructive onCancel={() => setRemoveStoryId(undefined)} onConfirm={() => { if (removeStoryId) app.removeStoryFromHighlight(highlight.id, removeStoryId); setRemoveStoryId(undefined); }} />
    <ConfirmModal visible={confirmRemoveHighlight} title="Remove this Highlight?" detail="This removes the local collection. Its Stories remain in your Story library and any other Highlights." confirmLabel="Remove Highlight" destructive onCancel={() => setConfirmRemoveHighlight(false)} onConfirm={() => { app.removeStoryHighlight(highlight.id); setConfirmRemoveHighlight(false); router.replace("/stories"); }} />
  </Page>;
}
