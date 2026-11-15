import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, Share, Text, View } from "react-native";
import { Avatar, Button, EmptyState, Field, MediaImage, Page, TopBar, VerifiedBadge, styles } from "@/components/biz-ui";
import { PEOPLE } from "@/data/seed";
import { useAppStore } from "@/hooks/use-app-store";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { colors } from "@/theme/tokens";
import { isPostVisible, profileRestriction } from "@/utils/privacy-policy";
import { useBizConnectServiceMode } from "@/lib/services/service-provider";
import { ApiPostDetail } from "@/components/api-social-screens";
export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const apiMode = useBizConnectServiceMode() === "api";
  return apiMode ? <ApiPostDetail postId={id ?? ""} /> : <MockPostDetailScreen />;
}
function MockPostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const app = useAppStore();
  const requireAuth = useRequireAuth();
  const post = app.posts.find((item) => item.id === id);
  const [comment, setComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | undefined>();
  const postVisible = Boolean(post && isPostVisible(post, { viewerId: app.user.id, people: [...PEOPLE.filter((person) => person.id !== app.user.id), app.user], businesses: app.businesses, blockedUserIds: app.blockedUsers, hiddenPostIds: app.hiddenPosts, followedPeople: app.followedPeople }));
  if (!post || !postVisible) return <Page><TopBar title="Post" back /><EmptyState title="Post unavailable" detail="This post is hidden, private or no longer available." action="Go to Home" onAction={() => router.replace("/(tabs)")} /></Page>;
  const business = app.businesses.find((b) => b.id === post.identityId);
  const author = PEOPLE.find((p) => p.id === post.authorId) ?? app.user;
  const visibleComments = post.comments.filter((item) => {
    if (app.blockedUsers.includes(item.userId)) return false;
    const commenter = PEOPLE.find((person) => person.id === item.userId);
    return !commenter || !profileRestriction(commenter, app.user.id, app.followedPeople, app.blockedUsers);
  });
  const send = () => { if (!app.isAuthenticated) return router.push("/auth/login"); if (!comment.trim()) return; if (replyTo) app.addReply(post.id, replyTo, comment.trim()); else app.addComment(post.id, comment.trim()); setComment(""); setReplyTo(undefined); };
  return <Page>
    <TopBar title="Post" back />
    <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}><Avatar name={business?.name ?? author.name} size={42} /><View style={{ flex: 1 }}><View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}><Text style={styles.cardTitle}>{business?.name ?? author.name}</Text><VerifiedBadge verified={business?.verified ?? false} /></View><Text style={styles.caption}>{post.location}</Text></View><Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/report/[target]", params: { target: `post:${post.id}` } })}><Ionicons name="ellipsis-horizontal" size={20} color={colors.muted} /></Pressable></View>
    <Text style={styles.body}>{post.caption}</Text>{post.media ? <MediaImage uri={post.media} height={230} label="Post media" /> : null}
    <View style={styles.row}><Button title={`${post.likes + (app.likedPosts.includes(post.id) ? 1 : 0)} likes`} icon={app.likedPosts.includes(post.id) ? "heart" : "heart-outline"} variant="soft" onPress={() => requireAuth(() => app.toggleLike(post.id))} /><Button title={app.savedPosts.includes(post.id) ? "Saved" : "Save"} icon="bookmark-outline" variant="outline" onPress={() => requireAuth(() => app.togglePostSave(post.id))} /><Button title="Share" icon="share-social-outline" variant="outline" onPress={() => void Share.share({ message: `${post.caption}\n\nShared from BizConnect` })} /></View>
    <View style={{ gap: 12 }}><Text style={styles.sectionHeading}>Comments · {post.comments.length}</Text>
      {visibleComments.length ? visibleComments.map((item) => { const person = PEOPLE.find((p) => p.id === item.userId) ?? app.user; const replies = item.replies.filter((reply) => !app.blockedUsers.includes(reply.userId) && !(PEOPLE.find((p) => p.id === reply.userId) && profileRestriction(PEOPLE.find((p) => p.id === reply.userId)!, app.user.id, app.followedPeople, app.blockedUsers))); return <View key={item.id} style={{ gap: 8 }}><View style={{ flexDirection: "row", gap: 8 }}><Avatar name={person.name} size={34} /><View style={{ flex: 1, backgroundColor: colors.surface, padding: 11, borderRadius: 15 }}><Text style={styles.cardTitle}>{person.name} <Text style={styles.body}>{item.text}</Text></Text><View style={{ flexDirection: "row", gap: 12 }}><Pressable accessibilityRole="button" onPress={() => { setReplyTo(item.id); setComment(`@${person.username} `); }}><Text style={[styles.caption, { color: colors.emerald, marginTop: 5, fontWeight: "700" }]}>Reply</Text></Pressable><Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/report/[target]", params: { target: `comment:${item.id}:${item.userId}:${post.id}` } })}><Text style={[styles.caption, { marginTop: 5 }]}>Report</Text></Pressable></View></View></View>
        {replies.map((reply) => { const replyPerson = PEOPLE.find((p) => p.id === reply.userId) ?? app.user; return <View key={reply.id} style={{ flexDirection: "row", gap: 8, marginLeft: 39 }}><Avatar name={replyPerson.name} size={27} /><View style={{ flex: 1, backgroundColor: colors.subtle, padding: 10, borderRadius: 13 }}><Text style={styles.cardTitle}>{replyPerson.name} <Text style={styles.body}>{reply.text}</Text></Text></View></View>; })}
      </View>; }) : <EmptyState title="No comments yet" detail="Start a thoughtful conversation. Comments are stored only on this device in the demo." icon="chatbubbles-outline" />}
    </View>
    <Field label={replyTo ? "Write a reply" : "Add a comment"} value={comment} onChangeText={setComment} placeholder="Share a helpful thought…" right={<Pressable accessibilityRole="button" onPress={send} style={{ paddingHorizontal: 5 }}><Ionicons name="send" size={19} color={colors.emerald} /></Pressable>} />
    <Text style={styles.caption}>Comments are saved locally in this demo.</Text>
    <Button title="Report or hide this post" variant="quiet" icon="flag-outline" onPress={() => router.push({ pathname: "/report/[target]", params: { target: `post:${post.id}` } })} />
  </Page>;
}
