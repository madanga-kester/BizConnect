import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Avatar, Button, Chip, EmptyState, Page, TopBar, styles } from "@/components/biz-ui";
import { PEOPLE } from "@/data/seed";
import { useAppStore } from "@/hooks/use-app-store";
import { filterVisibleBusinesses, profileRestriction } from "@/utils/privacy-policy";
import { useMabizServiceMode } from "@/lib/services/service-provider";
import { ApiFollowersScreen } from "@/components/api-social-screens";
export default function FollowersScreen() {
  const params = useLocalSearchParams<{ businessId?: string }>();
  const apiMode = useMabizServiceMode() === "api";
  return apiMode ? <ApiFollowersScreen selectedBusinessId={params.businessId} /> : <MockFollowersScreen />;
}
function MockFollowersScreen() {
  const app = useAppStore(); const [mode, setMode] = useState<"People" | "Businesses">("People"); const [list, setList] = useState<"Followers" | "Following">("Following");
  const people = (list === "Followers" ? PEOPLE.filter((person) => person.id !== app.user.id).slice(0, 3) : PEOPLE.filter((person) => app.followedPeople.includes(person.id))).filter((person) => !profileRestriction(person, app.user.id, app.followedPeople, app.blockedUsers));
  const businesses = filterVisibleBusinesses(app.businesses, app.blockedUsers).filter((business) => list === "Followers" ? app.businesses.slice(0, 3).some((item) => item.id === business.id) : app.followedBusinesses.includes(business.id));
  if (!app.isAuthenticated) return <Page><TopBar title="Followers & following" back /><EmptyState title="Sign in to see your followers and following" detail="Following people and businesses uses an authenticated local demo profile." icon="lock-closed-outline" action="Sign in" onAction={() => router.push("/auth/login")} /></Page>;
  return <Page><TopBar title="Followers & following" back /><View style={{ flexDirection: "row", gap: 8 }}><Chip label="Followers" selected={list === "Followers"} onPress={() => setList("Followers")} /><Chip label="Following" selected={list === "Following"} onPress={() => setList("Following")} /></View><View style={{ flexDirection: "row", gap: 8 }}><Chip label="People" selected={mode === "People"} onPress={() => setMode("People")} /><Chip label="Businesses" selected={mode === "Businesses"} onPress={() => setMode("Businesses")} /></View>
    {mode === "People" ? people.map((person) => <View key={person.id} style={styles.actionTile}><Avatar name={person.name} size={43} /><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{person.name}</Text><Text style={styles.caption}>@{person.username} · {person.town}</Text></View><Button title={app.followedPeople.includes(person.id) ? "Following" : "Follow"} small variant={app.followedPeople.includes(person.id) ? "soft" : "outline"} onPress={() => { if (!app.isAuthenticated) return router.push("/auth/login"); app.togglePeopleFollow(person.id); }} /></View>) : businesses.map((business) => <Pressable key={business.id} onPress={() => import("expo-router").then(({ router }) => router.push({ pathname: "/business/[id]", params: { id: business.id } }))} style={styles.actionTile}><Avatar name={business.name} size={43} /><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{business.name}</Text><Text style={styles.caption}>{business.category} · {business.town}</Text></View><Button title={app.followedBusinesses.includes(business.id) ? "Following" : "Follow"} small variant={app.followedBusinesses.includes(business.id) ? "soft" : "outline"} onPress={() => app.isAuthenticated ? app.toggleBusinessFollow(business.id) : router.push("/auth/login")} /></Pressable>)}
    {mode === "People" && !people.length || mode === "Businesses" && !businesses.length ? <EmptyState title={list === "Followers" ? "No followers yet" : "Not following anyone yet"} detail={list === "Followers" ? "When people follow your profile, they will appear here." : "Discover local founders and businesses to build your feed."} icon="people-outline" /> : null}
    <Text style={styles.caption}>People and business relationships are separate. Follower counts are illustrative sample data.</Text>
  </Page>;
}
