import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { BusinessCard, Chip, EmptyState, Page, PostCard, TopBar, styles } from "@/components/biz-ui";
import { OPPORTUNITIES, PEOPLE, STORIES } from "@/data/seed";
import { useAppStore } from "@/hooks/use-app-store";
import { filterVisibleBusinesses, filterVisiblePosts, profileRestriction } from "@/utils/privacy-policy";
export default function SavedScreen() {
  const app = useAppStore(); const [tab, setTab] = useState("Posts");
  const posts = filterVisiblePosts(app.posts, { viewerId: app.user.id, people: [...PEOPLE.filter((person) => person.id !== app.user.id), app.user], businesses: app.businesses, blockedUserIds: app.blockedUsers, hiddenPostIds: app.hiddenPosts, followedPeople: app.followedPeople }).filter((post) => app.savedPosts.includes(post.id));
  const stories = STORIES.filter((story) => { const founder = PEOPLE.find((person) => person.id === story.founderId); const business = app.businesses.find((item) => item.id === story.businessId); return app.savedStories.includes(story.id) && !app.blockedUsers.includes(story.founderId) && !(business && app.blockedUsers.includes(business.ownerId)) && (!founder || !profileRestriction(founder, app.user.id, app.followedPeople, app.blockedUsers)); });
  const businesses = filterVisibleBusinesses(app.businesses, app.blockedUsers).filter((business) => app.savedBusinesses.includes(business.id));
  const ideas = OPPORTUNITIES.filter((idea) => app.savedOpportunities.includes(idea.id));
  if (!app.isAuthenticated) return <Page><TopBar title="Saved content" back /><EmptyState title="Sign in to see saved items" detail="Saved posts, stories, businesses and ideas are tied to your local demo account." icon="lock-closed-outline" action="Sign in" onAction={() => router.push("/auth/login")} /></Page>;
  return <Page><TopBar title="Saved content" back /><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>{["Posts", "Stories", "Businesses", "Ideas"].map((item) => <Chip key={item} label={item} selected={tab === item} onPress={() => setTab(item)} />)}</View>
    {tab === "Posts" ? posts.length ? posts.map((p) => <PostCard key={p.id} post={p} />) : <EmptyState title="No saved posts yet" detail="Tap the bookmark on a post to keep it here." icon="bookmark-outline" action="Browse feed" onAction={() => router.push("/(tabs)")} /> : null}
    {tab === "Stories" ? stories.length ? stories.map((story) => <Pressable key={story.id} style={styles.actionTile} onPress={() => router.push({ pathname: "/story/[id]", params: { id: story.id } })}><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{story.title}</Text><Text style={styles.caption}>{story.category} · {story.durationMinutes} min</Text></View><Text style={styles.link}>Read</Text></Pressable>) : <EmptyState title="No saved stories yet" detail="Save a founder story to revisit it." icon="book-outline" action="Browse stories" onAction={() => router.push("/stories")} /> : null}
    {tab === "Businesses" ? businesses.length ? businesses.map((business) => <BusinessCard key={business.id} business={business} />) : <EmptyState title="No saved businesses yet" detail="Bookmark a business profile to keep it here." icon="bookmark-outline" action="Discover businesses" onAction={() => router.push("/discover")} /> : null}
    {tab === "Ideas" ? ideas.length ? <Pressable accessibilityRole="button" onPress={() => router.push("/saved-opportunities")} style={styles.actionTile}><Text style={[styles.body, { flex: 1 }]}>{ideas.length} saved {ideas.length === 1 ? "opportunity" : "opportunities"} · view your saved ideas</Text><Text style={styles.link}>Open</Text></Pressable> : <EmptyState title="No saved ideas yet" detail="Save a business opportunity to return to it here." icon="bulb-outline" action="Browse opportunities" onAction={() => router.push("/menu/activity/opportunities")} /> : null}
  </Page>;
}
