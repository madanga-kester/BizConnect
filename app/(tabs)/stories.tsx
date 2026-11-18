import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Avatar, Button, Chip, ConfirmModal, EmptyState, Field, LocalNote, MediaImage, Page, SectionTitle, TopBar, VideoPreview, styles } from "@/components/biz-ui";
import { BUSINESSES, OPPORTUNITIES, PEOPLE, STORIES } from "@/data/seed";
import { useAppStore } from "@/hooks/use-app-store";
import { useClock } from "@/hooks/use-clock";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { colors } from "@/theme/tokens";
import { formatKes } from "@/utils/kenya";
import { profileRestriction } from "@/utils/privacy-policy";
import { newLocalId } from "@/utils/ids";
import { canViewSocialStory } from "@/utils/social-story-privacy";

const CATEGORIES = ["All", "How I Started", "Startup Capital", "My First Customer", "Business Challenges", "Lessons Learned", "Business Growth", "Behind the Business", "Business Opportunities"];

export default function StoriesScreen() {
  const app = useAppStore();
  const requireAuth = useRequireAuth();
  const now = useClock();
  const [category, setCategory] = useState("All");
  const [highlightTitle, setHighlightTitle] = useState("");
  const [deleteHighlightId, setDeleteHighlightId] = useState<string>();
  const [deleteStoryId, setDeleteStoryId] = useState<string>();
  const activeSocialStories = app.socialStories.filter((story) => {
    if (now > 0 && new Date(story.expiresAt).getTime() <= now) return false;
    const business = story.identityKind === "business" ? app.businesses.find((item) => item.id === story.identityId) : undefined;
    return canViewSocialStory(story, { viewerId: app.user.id, followedUserIds: app.followedPeople, followedBusinessIds: app.followedBusinesses, blockedUserIds: app.blockedUsers, businessOwnerId: business?.ownerId });
  });
  const myActiveStories = activeSocialStories.filter((story) => story.authorId === app.user.id);
  const archivedStories = app.socialStories.filter((story) => story.authorId === app.user.id && now > 0 && Date.parse(story.expiresAt) <= now).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  const myHighlights = app.storyHighlights.filter((highlight) => highlight.ownerId === app.user.id);
  const reorderHighlight = (id: string, direction: -1 | 1) => {
    const ids = myHighlights.map((highlight) => highlight.id);
    const index = ids.indexOf(id);
    const destination = index + direction;
    if (index < 0 || destination < 0 || destination >= ids.length) return;
    [ids[index], ids[destination]] = [ids[destination], ids[index]];
    app.reorderStoryHighlights(ids);
  };
  const stories = useMemo(() => STORIES.filter((story) => {
    const founder = PEOPLE.find((person) => person.id === story.founderId);
    const business = app.businesses.find((item) => item.id === story.businessId);
    if (app.blockedUsers.includes(story.founderId) || (business && app.blockedUsers.includes(business.ownerId))) return false;
    if (founder && profileRestriction(founder, app.user.id, app.followedPeople, app.blockedUsers)) return false;
    return category === "All" || category === "Business Opportunities" || story.category === category;
  }), [category, app.businesses, app.blockedUsers, app.user.id, app.followedPeople]);
  return <Page>
    <TopBar title="Business Stories" right={<View style={styles.row}><Pressable accessibilityRole="button" accessibilityLabel="Business videos" onPress={() => router.push("/videos")} style={styles.iconButton}><Ionicons name="videocam-outline" size={20} color={colors.navy} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel="Business opportunities" onPress={() => router.push("/menu/activity/opportunities")} style={styles.iconButton}><Ionicons name="bulb-outline" size={20} color={colors.navy} /></Pressable></View>} />
    <View style={{ gap: 9 }}><View style={styles.rowBetween}><View style={{ gap: 2 }}><Text style={styles.sectionHeading}>Social Stories · 24 hours</Text><Text style={styles.caption}>Separate from permanent founder stories</Text></View><Button title="Create Story" icon="add-outline" small onPress={() => router.push(app.isAuthenticated ? "/create-social-story" : "/auth/login")} /></View>
      {activeSocialStories.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 9 }}>{activeSocialStories.map((story) => { const owner = app.businesses.find((item) => item.id === story.identityId); const name = story.identityKind === "business" ? owner?.name ?? "Business" : app.user.name; const image = story.mediaItems[0]; return <Pressable key={story.id} accessibilityRole="button" accessibilityLabel={`View ${name} Story`} onPress={() => router.push({ pathname: "/social-story/[id]", params: { id: story.id } })} style={{ width: 150, padding: 8, gap: 6, borderRadius: 15, borderWidth: 1, borderColor: colors.orange, backgroundColor: colors.surface }}>{image ? (story.mediaKind === "video" ? <VideoPreview uri={image} height={112} /> : <MediaImage uri={image} height={112} label={`${name} Story`} />) : <View style={{ height: 112, backgroundColor: colors.emeraldTint, borderRadius: 12, justifyContent: "center", padding: 10 }}><Text style={styles.body} numberOfLines={4}>{story.caption}</Text></View>}<Text style={styles.cardTitle} numberOfLines={1}>{name}</Text><Text style={styles.caption}>{Math.max(1, Math.ceil((new Date(story.expiresAt).getTime() - now) / 3600000))}h left</Text></Pressable>; })}</ScrollView> : <EmptyState title="No active Social Stories" detail="Stories stay on this device and expire within 24 hours. Use Create Story to add photos, video, stickers, polls or a question." icon="aperture-outline" action="Create Story" onAction={() => router.push(app.isAuthenticated ? "/create-social-story" : "/auth/login")} />}
    </View>
      <View style={[styles.card, { padding: 12, gap: 8 }]}>
        <View style={styles.rowBetween}><Text style={styles.cardTitle}>Your Highlights</Text><Text style={styles.caption}>{myHighlights.length} local collections</Text></View>
        {myHighlights.map((highlight, index) => <View key={highlight.id} style={[styles.rowBetween, { paddingVertical: 5 }]}>{highlight.coverUri ? <MediaImage uri={highlight.coverUri} height={54} label={`${highlight.title} cover`} /> : null}<View style={{ flex: 1 }}><Text style={styles.body}>{highlight.title}</Text><Text style={styles.caption}>{highlight.storyIds.length} saved local Stories</Text></View><View style={styles.row}><Button title="Up" icon="arrow-up-outline" small variant="outline" disabled={index === 0} onPress={() => reorderHighlight(highlight.id, -1)} /><Button title="Down" icon="arrow-down-outline" small variant="outline" disabled={index === myHighlights.length - 1} onPress={() => reorderHighlight(highlight.id, 1)} /><Button title="Manage" small variant="soft" onPress={() => router.push({ pathname: "/story-highlight/[id]", params: { id: highlight.id } })} /><Button title="Delete" small variant="danger" onPress={() => setDeleteHighlightId(highlight.id)} /></View></View>)}
        {!myHighlights.length ? <Text style={styles.caption}>Create a collection now, then add active or archived Stories when ready.</Text> : null}
        <Field label="New Highlight title" value={highlightTitle} onChangeText={setHighlightTitle} placeholder="e.g. Behind the scenes" maxLength={40} />
        <Button title={`Create Highlight${myActiveStories.length ? ` with ${myActiveStories.length} active ${myActiveStories.length === 1 ? "Story" : "Stories"}` : ""}`} icon="bookmark-outline" variant="outline" disabled={!app.isAuthenticated || !highlightTitle.trim()} onPress={() => { app.addStoryHighlight({ id: newLocalId("story-highlight"), ownerId: app.user.id, title: highlightTitle.trim(), storyIds: myActiveStories.map((item) => item.id), createdAt: new Date().toISOString() }); setHighlightTitle(""); }} />
        <Text style={styles.caption}>Stories remain local and expire within 24 hours; saved Highlights can retain their media after expiry. No cover is uploaded.</Text>
      </View>
      <View style={[styles.card, { padding: 12, gap: 8 }]}><Text style={styles.cardTitle}>Your Story archive · expired on this device</Text>{archivedStories.length ? archivedStories.map((story) => <View key={story.id} style={[styles.rowBetween, { paddingVertical: 5 }]}><View style={{ flex: 1 }}><Text style={styles.body} numberOfLines={1}>{story.caption || (story.mediaKind === "video" ? "Video Story" : "Social Story")}</Text><Text style={styles.caption}>Expired · {new Date(story.createdAt).toLocaleDateString("en-KE")}</Text></View><View style={styles.row}><Button title="View" icon="eye-outline" small variant="soft" onPress={() => router.push({ pathname: "/social-story/[id]", params: { id: story.id } })} /><Button title="Delete" icon="trash-outline" small variant="quiet" onPress={() => setDeleteStoryId(story.id)} /></View></View>) : <Text style={styles.caption}>Expired Stories you created will appear here until you delete them or remove the app’s local data.</Text>}</View>
    <ConfirmModal visible={Boolean(deleteHighlightId)} title="Remove this Highlight?" detail="This removes only the local collection. Its Stories remain in your archive and any other Highlights." confirmLabel="Remove locally" destructive onCancel={() => setDeleteHighlightId(undefined)} onConfirm={() => { if (deleteHighlightId) app.removeStoryHighlight(deleteHighlightId); setDeleteHighlightId(undefined); }} />
    <ConfirmModal visible={Boolean(deleteStoryId)} title="Delete this Social Story?" detail="The Story will be removed from your device and all Highlights. This cannot be undone." confirmLabel="Delete Story" destructive onCancel={() => setDeleteStoryId(undefined)} onConfirm={() => { if (deleteStoryId) app.removeSocialStory(deleteStoryId); setDeleteStoryId(undefined); }} />
    <View style={{ backgroundColor: colors.navy, borderRadius: 22, padding: 18, gap: 8 }}><Text style={{ color: colors.orange, fontSize: 11, fontWeight: "800", letterSpacing: 1 }}>IDEAS, PEOPLE, PROGRESS</Text><Text style={{ color: colors.white, fontSize: 23, lineHeight: 29, fontWeight: "800" }}>Every business has a beginning.</Text><Text style={{ color: "#D9E2E9", lineHeight: 20 }}>Read honest founder lessons, what they learned along the way, and the next opportunity worth exploring.</Text><Button title="Explore business ideas" variant="soft" icon="bulb-outline" onPress={() => router.push("/menu/activity/opportunities")} /></View>
    <LocalNote text="Founder accounts are user-submitted; cost ranges are estimates, not verified facts." />
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{CATEGORIES.map((item) => <Chip key={item} label={item} selected={category === item} onPress={() => setCategory(item)} />)}</ScrollView>
    <SectionTitle title={category === "Business Opportunities" ? "Founder lessons" : "Businesses you can learn from"} />
    {stories.map((story) => {
      const person = PEOPLE.find((p) => p.id === story.founderId)!;
      const business = BUSINESSES.find((b) => b.id === story.businessId)!;
      return <View key={story.id} style={styles.card}>
        <MediaImage uri={story.cover} height={168} label={story.industry} />
        <View style={{ padding: 14, gap: 9 }}><View style={styles.row}><Pressable accessibilityRole="button" accessibilityLabel={`Open ${person.name}'s profile`} onPress={() => router.push({ pathname: "/person/[id]", params: { id: person.id } })}><Avatar name={person.name} size={36} /></Pressable><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{person.name} · {business.name}</Text><Text style={styles.caption}>{story.industry} · {story.durationMinutes} min read · {story.sourceLabel}</Text></View><Pressable accessibilityRole="button" accessibilityLabel={app.savedStories.includes(story.id) ? "Unsave story" : "Save story"} onPress={() => requireAuth(() => app.toggleStorySave(story.id))}><Ionicons name={app.savedStories.includes(story.id) ? "bookmark" : "bookmark-outline"} color={app.savedStories.includes(story.id) ? colors.emerald : colors.muted} size={19} /></Pressable></View><Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/story/[id]", params: { id: story.id } })} style={{ gap: 7 }}><Text style={styles.sectionHeading}>{story.title}</Text><Text style={styles.body} numberOfLines={2}>{story.intro}</Text></Pressable><View style={styles.rowBetween}><Chip label={story.category} /><Button title="Read story" icon="arrow-forward-outline" small variant="quiet" onPress={() => router.push({ pathname: "/story/[id]", params: { id: story.id } })} /></View></View>
      </View>;
    })}
    {!stories.length ? <EmptyState title={category === "All" ? "No founder stories yet" : `No stories in ${category}`} detail="Browse another founder-story category or explore practical business opportunities." icon="book-outline" action={category === "All" ? "Explore opportunities" : "Browse all stories"} onAction={() => category === "All" ? router.push("/menu/activity/opportunities") : setCategory("All")} /> : null}
    <SectionTitle title="Business ideas & opportunities" action="Explore all" onAction={() => router.push("/menu/activity/opportunities")} />
    {OPPORTUNITIES.slice(0, 2).map((idea) => <Pressable key={idea.id} accessibilityRole="button" onPress={() => router.push("/menu/activity/opportunities")} style={[styles.card, { padding: 15, gap: 8 }]}><View style={styles.rowBetween}><Text style={styles.cardTitle}>{idea.title}</Text><Ionicons name="arrow-forward" color={colors.emerald} size={18} /></View><Text style={styles.caption}>{idea.industry} · {idea.county}</Text><Text style={styles.body}>{formatKes(idea.startupCostMin)}–{formatKes(idea.startupCostMax)} estimated start-up range</Text><Text style={{ color: colors.warning, fontSize: 11, fontWeight: "700" }}>Estimate · not a verified fact</Text></Pressable>)}
  </Page>;
}
