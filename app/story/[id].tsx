import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, Share, Text, View } from "react-native";
import { useState } from "react";
import { Avatar, Button, Chip, EmptyState, Field, MediaImage, Page, SectionTitle, TopBar, styles } from "@/components/biz-ui";
import { BUSINESSES, PEOPLE, STORIES } from "@/data/seed";
import { useAppStore } from "@/hooks/use-app-store";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { colors } from "@/theme/tokens";
import { profileRestriction } from "@/utils/privacy-policy";
import { useThemeContext } from "@/lib/theme-provider";

export default function StoryDetailScreen() {
  useThemeContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const app = useAppStore();
  const requireAuth = useRequireAuth();
  const [comment, setComment] = useState("");
  const story = STORIES.find((s) => s.id === id);
  if (!story) return <Page><TopBar title="Founder story" back /><EmptyState title="Story not found" detail="This story may have moved." action="Browse stories" onAction={() => router.replace("/stories")} /></Page>;
  const founder = PEOPLE.find((p) => p.id === story.founderId);
  const business = app.businesses.find((b) => b.id === story.businessId) ?? BUSINESSES.find((b) => b.id === story.businessId);
  if (!founder || !business || profileRestriction(founder, app.user.id, app.followedPeople, app.blockedUsers) || app.blockedUsers.includes(business.ownerId)) return <Page><TopBar title="Founder story" back /><EmptyState title="Story unavailable" detail="This founder story is private or unavailable." action="Browse stories" onAction={() => router.replace("/stories")} /></Page>;
  const saved = app.savedStories.includes(story.id);
  const share = async () => { try { await Share.share({ message: `${story.title}\n${story.intro}\n\n${story.sourceLabel} · Mabiz` }); } catch {} };
  return <Page>
    <TopBar title="Business Stories" back />
    <MediaImage uri={story.cover} height={230} label={story.industry} />
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}><Chip label={story.category} /><Chip label={`${story.durationMinutes} min read`} icon="time-outline" /><Chip label={story.sourceLabel} icon="person-outline" /></View>
    <Text style={{ fontSize: 28, lineHeight: 34, fontWeight: "800", color: colors.ink, letterSpacing: -0.6 }}>{story.title}</Text>
    <Text style={[styles.body, { fontSize: 16, lineHeight: 24 }]}>{story.intro}</Text>
    <View style={[styles.row, styles.card, { padding: 13 }]}><Pressable onPress={() => router.push({ pathname: "/person/[id]", params: { id: founder.id } })}><Avatar name={founder.name} size={46} /></Pressable><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{founder.name}</Text><Text style={styles.caption}>{business.name} · {founder.town}, {founder.county}</Text></View><Button title="Follow" small variant={app.followedPeople.includes(founder.id) ? "soft" : "outline"} onPress={() => requireAuth(() => app.togglePeopleFollow(founder.id))} /></View>
    {story.body.map((paragraph, i) => <Text key={i} style={[styles.body, { fontSize: 15, lineHeight: 25 }]}>{paragraph}</Text>)}
    <View style={[styles.card, { backgroundColor: colors.orangeTint, padding: 14, gap: 6 }]}><Text style={[styles.cardTitle, { color: colors.warning }]}>Founder-reported startup capital</Text><Text style={styles.body}>{story.startupCapital}</Text></View>
    <SectionTitle title="Challenges along the way" />{story.challenges.map((item) => <View key={item} style={styles.row}><Ionicons name="ellipse" size={7} color={colors.orange} /><Text style={[styles.body, { flex: 1 }]}>{item}</Text></View>)}
    <SectionTitle title="Lessons learned" />{story.lessons.map((item, i) => <View key={item} style={styles.row}><View style={{ width: 23, height: 23, borderRadius: 8, backgroundColor: colors.emeraldTint, alignItems: "center", justifyContent: "center" }}><Text style={{ color: colors.emeraldDark, fontSize: 11, fontWeight: "800" }}>{i + 1}</Text></View><Text style={[styles.body, { flex: 1 }]}>{item}</Text></View>)}
    <View style={[styles.card, { padding: 15, gap: 7 }]}><Text style={styles.cardTitle}>Advice for the next founder</Text><Text style={styles.body}>{story.advice}</Text></View>
    <View style={styles.row}><Button title={`${app.likedStories.includes(story.id) ? "Liked" : "Like"} · ${app.likedStories.includes(story.id) ? 1 : 0}`} icon={app.likedStories.includes(story.id) ? "heart" : "heart-outline"} variant="soft" onPress={() => requireAuth(() => app.toggleStoryLike(story.id))} /><Button title={saved ? "Saved" : "Save story"} icon={saved ? "bookmark" : "bookmark-outline"} variant="soft" onPress={() => requireAuth(() => app.toggleStorySave(story.id))} /><Button title="Share" icon="share-social-outline" variant="outline" onPress={() => void share()} /></View>
    <SectionTitle title={`Comments (${(app.storyComments[story.id] ?? []).filter((item) => !app.blockedUsers.includes(item.userId)).length})`} />{(app.storyComments[story.id] ?? []).filter((item) => !app.blockedUsers.includes(item.userId)).map((item) => <Text key={item.id} style={styles.body}>{item.text}</Text>)}<Field label="Add a comment" value={comment} onChangeText={setComment} placeholder="Share a thoughtful comment…" right={<Button title="Send" small onPress={() => requireAuth(() => { if (comment.trim()) { app.addStoryComment(story.id, comment.trim()); setComment(""); } })} />} />
    <Button title={`Visit ${business.name}`} icon="storefront-outline" onPress={() => router.push({ pathname: "/business/[id]", params: { id: business.id } })} />
    <Text style={styles.caption}>Submitted {story.submittedAt} · {story.sourceLabel}. Details are the founder’s account and have not been independently verified.</Text>
  </Page>;
}
