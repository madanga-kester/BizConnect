import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, Text, View } from "react-native";
import { Button, ConfirmModal, EmptyState, Field, LocalNote, MediaImage, Page, TopBar, VideoPreview, styles } from "@/components/biz-ui";
import { PEOPLE } from "@/data/seed";
import { useAppStore } from "@/hooks/use-app-store";
import { useClock } from "@/hooks/use-clock";
import { colors } from "@/theme/tokens";
import { canViewSocialStory } from "@/utils/social-story-privacy";

export default function SocialStoryViewer() {
  const app = useAppStore();
  const now = useClock();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [answer, setAnswer] = useState("");
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const candidate = app.socialStories.find((item) => item.id === id && (
    now === 0 || Date.parse(item.expiresAt) > now || item.authorId === app.user.id ||
    app.storyHighlights.some((highlight) => highlight.ownerId === app.user.id && highlight.storyIds.includes(item.id))
  ));
  const business = candidate?.identityKind === "business" ? app.businesses.find((item) => item.id === candidate.identityId) : undefined;
  const story = candidate && canViewSocialStory(candidate, { viewerId: app.user.id, followedUserIds: app.followedPeople, followedBusinessIds: app.followedBusinesses, blockedUserIds: app.blockedUsers, businessOwnerId: business?.ownerId }) ? candidate : undefined;
  const active = Boolean(story && (now === 0 || Date.parse(story.expiresAt) > now));
  const owner = Boolean(story && story.authorId === app.user.id);
  const markViewed = app.markSocialStoryViewed;
  useEffect(() => { if (story && app.isAuthenticated) markViewed(story.id); }, [story, app.isAuthenticated, markViewed]);

  if (!story) return <Page><TopBar title="Story" back /><EmptyState title="Story unavailable or expired" detail="Social Stories expire within 24 hours. Only the owner or a Highlight that preserves the Story can open it afterwards. Founder stories remain separate." action="Business Stories" onAction={() => router.replace("/(tabs)/stories")} /></Page>;

  const identityBusiness = app.businesses.find((item) => item.id === story.identityId);
  const identityName = story.identityKind === "business" ? identityBusiness?.name ?? "Business" : owner ? app.user.name : PEOPLE.find((person) => person.id === story.authorId)?.name ?? "Community member";
  const viewers = [...new Set([...(app.storyViews[story.id] ?? []), ...(owner ? story.demoViewerIds ?? [] : [])])];
  const comments = app.socialStoryComments[story.id] ?? [];
  const responses = app.storyResponses[story.id] ?? [];
  const liked = app.socialStoryLikes.includes(story.id);
  const sendAnswer = () => { if (answer.trim() && active) { app.respondToSocialStory(story.id, answer); setSent(true); setAnswer(""); } };
  const sendComment = () => { if (comment.trim() && active) { app.addSocialStoryComment(story.id, comment); setComment(""); } };
  const addToHighlight = (highlightId: string) => {
    const highlight = app.storyHighlights.find((item) => item.id === highlightId && item.ownerId === app.user.id);
    if (!highlight || !owner || highlight.storyIds.includes(story.id)) return;
    app.updateStoryHighlight(highlight.id, { storyIds: [...highlight.storyIds, story.id] });
  };
  const displayName = (userId: string) => userId === app.user.id ? app.user.name : PEOPLE.find((person) => person.id === userId)?.name ?? "Local viewer";

  return <Page>
    <TopBar title={`${identityName} · Story`} back />
    <LocalNote text={active ? `Expires ${new Date(story.expiresAt).toLocaleString("en-KE")} · local-only demo` : "Archived Story · visible to its owner from this device and available through saved Highlights"} />
    {story.background ? <View style={{ minHeight: 82, padding: 14, borderRadius: 15, backgroundColor: story.background }}><Text style={{ color: story.textColor ?? "#FFFFFF", fontWeight: story.fontStyle === "bold" ? "900" : "700" }}>{story.caption || story.overlays.find((item) => item.kind === "text")?.text || "Story"}</Text></View> : null}
    {story.mediaItems.map((uri, index) => story.mediaKind === "video" || /\.(mp4|mov|webm)(\?|$)/i.test(uri) ? <VideoPreview key={`${uri}-${index}`} uri={uri} height={360} /> : <MediaImage key={`${uri}-${index}`} uri={uri} height={360} label={`Story image ${index + 1}`} />)}
    {story.caption && !story.background ? <Text style={styles.body}>{story.caption}</Text> : null}
    {story.overlays.map((sticker) => <View key={sticker.id} style={{ alignSelf: "flex-start", paddingHorizontal: 11, paddingVertical: 7, borderRadius: 14, backgroundColor: sticker.kind === "location" ? colors.orangeTint : colors.emeraldTint }}><Text style={styles.cardTitle}>{sticker.kind === "location" ? "⌖ " : sticker.kind === "mention" ? "@" : ""}{sticker.text}</Text></View>)}
    {story.poll ? <View style={[styles.card, { padding: 13, gap: 8 }]}><Text style={styles.sectionHeading}>{story.poll.question}</Text>{story.poll.options.map((option) => { const voted = Boolean(story.poll?.voterIds?.[app.user.id]); const selected = story.poll?.voterIds?.[app.user.id] === option; const count = story.poll?.votes[option] ?? 0; return <Button key={option} title={`${option} · ${count}${selected ? " · Your vote" : ""}`} variant={selected ? "soft" : "outline"} disabled={!active || voted || !app.isAuthenticated} onPress={() => app.voteSocialStory(story.id, option)} />; })}<Text style={styles.caption}>Local votes only · {Object.values(story.poll.votes).reduce((sum, count) => sum + count, 0)} responses</Text></View> : null}
    {story.question && active ? <View style={[styles.card, { padding: 13, gap: 8 }]}><Text style={styles.cardTitle}>{story.question}</Text><Field label="Your response" value={answer} onChangeText={setAnswer} placeholder="Write a reply" maxLength={300} /><Button title={sent ? "Response stored locally" : "Send response"} icon="send-outline" disabled={sent || !answer.trim() || !app.isAuthenticated} onPress={sendAnswer} /><Text style={styles.caption}>Response is only a local interaction in this demo.</Text></View> : null}
    {story.link?.startsWith("https://") ? <Button title="Open Story link" icon="open-outline" variant="outline" onPress={() => void Linking.openURL(story.link!)} /> : null}
    {active ? <View style={[styles.card, { padding: 12, gap: 8 }]}><View style={styles.rowBetween}><Text style={styles.sectionHeading}>Story reactions</Text><Button title={liked ? "Liked" : "Like"} icon={liked ? "heart" : "heart-outline"} variant={liked ? "soft" : "outline"} small disabled={!app.isAuthenticated} onPress={() => app.toggleSocialStoryLike(story.id)} /></View><Field label="Reply to this Story" value={comment} onChangeText={setComment} placeholder="Add a local comment" maxLength={300} /><Button title="Add comment" icon="chatbubble-outline" small disabled={!app.isAuthenticated || !comment.trim()} onPress={sendComment} />{comments.map((item) => <Text key={item.id} style={styles.caption}>{displayName(item.userId)} · {item.text}</Text>)}{!comments.length ? <Text style={styles.caption}>No local comments yet.</Text> : null}</View> : null}
    {owner ? <View style={[styles.card, { padding: 13, gap: 8 }]}><Text style={styles.sectionHeading}>Story insights · this device</Text><Text style={styles.body}>{viewers.length} recorded local or sample viewer profile{viewers.length === 1 ? "" : "s"} · {liked ? "your reaction is saved" : "no reaction from this profile"} · {comments.length} comment{comments.length === 1 ? "" : "s"} · {responses.length} answer{responses.length === 1 ? "" : "s"}</Text><Text style={styles.caption}>View counts, reactions and replies are only recorded in this local demonstration; they do not represent remote reach.</Text>{viewers.map((userId) => <Text key={userId} style={styles.caption}>Viewer · {displayName(userId)}</Text>)}{responses.map((item) => <Text key={item.id} style={styles.caption}>Answer · {displayName(item.userId)}: {item.text}</Text>)}<Text style={styles.label}>Add this Story to a Highlight</Text>{app.storyHighlights.filter((highlight) => highlight.ownerId === app.user.id).map((highlight) => <Button key={highlight.id} title={`${highlight.storyIds.includes(story.id) ? "Saved in" : "Add to"} ${highlight.title}`} icon={highlight.storyIds.includes(story.id) ? "checkmark-circle-outline" : "bookmark-outline"} variant="outline" small disabled={highlight.storyIds.includes(story.id)} onPress={() => addToHighlight(highlight.id)} />)}<Button title="Edit Story" icon="create-outline" variant="soft" small disabled={!active} onPress={() => router.push({ pathname: "/create-social-story", params: { storyId: story.id } })} /><Button title="Delete Story" icon="trash-outline" variant="danger" small onPress={() => setConfirmDelete(true)} /></View> : null}
    {!app.isAuthenticated ? <Button title="Sign in to interact" onPress={() => router.push("/auth/login")} /> : null}
    <ConfirmModal visible={confirmDelete} title="Delete this Story?" detail="The Story will be removed from this device and all of your Highlights. This cannot be undone." confirmLabel="Delete locally" destructive onCancel={() => setConfirmDelete(false)} onConfirm={() => { app.removeSocialStory(story.id); setConfirmDelete(false); router.replace("/(tabs)/stories"); }} />
  </Page>;
}
