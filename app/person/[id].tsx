import { router, useLocalSearchParams } from "expo-router";
import { Share, Text, View } from "react-native";
import { Avatar, Button, EmptyState, Page, PostCard, SectionTitle, Stat, TopBar, styles } from "@/components/biz-ui";
import { PEOPLE } from "@/data/seed";
import { useAppStore } from "@/hooks/use-app-store";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { colors } from "@/theme/tokens";
import { filterVisiblePosts } from "@/utils/privacy-policy";
import { useMabizServiceMode } from "@/lib/services/service-provider";
import { ApiPersonProfile } from "@/components/api-social-screens";

export default function PersonProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const apiMode = useMabizServiceMode() === "api";
  return apiMode ? <ApiPersonProfile personId={id ?? ""} /> : <MockPersonProfile />;
}
function MockPersonProfile() {
  const { id } = useLocalSearchParams<{ id: string }>(); const app = useAppStore(); const requireAuth = useRequireAuth();
  const person = id === app.user.id ? app.user : PEOPLE.find((entry) => entry.id === id);
  if (!person) return <Page><TopBar title="Founder profile" back /><EmptyState title="Profile not found" detail="This account may no longer be available." /></Page>;
  const followed = app.followedPeople.includes(person.id); const requested = app.followRequests.includes(person.id); const isSelf = person.id === app.user.id; const blocked = app.blockedUsers.includes(person.id);
  if (blocked) return <Page><TopBar title="Founder profile" back /><EmptyState title="Profile hidden" detail="You have blocked this account. Review Privacy settings to unblock it." action="Privacy settings" onAction={() => router.push("/menu/privacy/profile-privacy")} /></Page>;
  const posts = filterVisiblePosts(app.posts, { viewerId: app.user.id, people: [...PEOPLE.filter((entry) => entry.id !== app.user.id), app.user], businesses: app.businesses, blockedUserIds: app.blockedUsers, hiddenPostIds: app.hiddenPosts, followedPeople: app.followedPeople }).filter((post) => post.authorId === person.id);
  const privateLocked = person.privateProfile && !followed && !isSelf;
  const contact = () => { if (!app.isAuthenticated) return router.push("/auth/login"); if (app.settings.messagePermissions === "nobody" || (app.settings.messagePermissions === "following" && !followed)) return router.push("/menu/privacy/profile-privacy"); const conversation = app.startConversation(person.id, person.name); if (!conversation) return router.push("/menu/privacy/profile-privacy"); router.push({ pathname: "/messages/[id]", params: { id: conversation } }); };
  return <Page><TopBar title="Founder profile" back right={<Button title="Share" variant="quiet" small icon="share-social-outline" onPress={() => void Share.share({ message: `${person.name} · @${person.username} on Mabiz` })} />} />
    <View style={{ alignItems: "center", gap: 8, padding: 16, backgroundColor: colors.surface, borderRadius: 20 }}><Avatar name={person.name} image={person.avatar} size={82} ring /><Text style={styles.sectionHeading}>{person.name}</Text><Text style={styles.caption}>@{person.username} · {person.town}, {person.county}</Text><Text style={[styles.body, { textAlign: "center" }]}>{person.bio}</Text><View style={{ flexDirection: "row", gap: 20 }}><Stat value={person.followers.toLocaleString()} label="Followers" /><Stat value={person.following.toLocaleString()} label="Following" /><Stat value={posts.length} label="Posts" /></View><View style={styles.row}>{!isSelf ? person.privateProfile && !followed ? <Button title={requested ? "Cancel request" : "Request to follow"} icon={requested ? "close-circle-outline" : "lock-open-outline"} variant="outline" onPress={() => requireAuth(() => requested ? app.cancelFollowRequest(person.id) : app.requestFollow(person.id))} /> : <Button title={followed ? "Following" : "Follow"} icon={followed ? "checkmark" : "person-add-outline"} variant={followed ? "soft" : "primary"} onPress={() => requireAuth(() => app.togglePeopleFollow(person.id))} /> : null}<Button title="Message" icon="chatbubble-outline" variant="outline" onPress={contact} />{!isSelf ? <Button title="Report" icon="flag-outline" variant="quiet" small onPress={() => router.push({ pathname: "/report/[target]", params: { target: `user:${person.id}` } })} /> : null}</View></View>
    {privateLocked ? <View style={{ gap: 10 }}><Text style={styles.cardTitle}>This profile is private</Text><Text style={styles.caption}>A follow request is stored locally for this demo. Only the real authenticated service can deliver or approve it.</Text></View> : <><SectionTitle title="Posts" />{posts.length ? posts.map((post) => <PostCard key={post.id} post={post} />) : <EmptyState title="No posts yet" detail="New founder updates will appear here." icon="albums-outline" />}</>}
  </Page>;
}
