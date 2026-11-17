import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Avatar, Button, MediaImage, VideoPreview, styles } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { useMabizServices } from "@/lib/services/service-provider";
import { colors } from "@/theme/tokens";
import type { Post } from "@/types/domain";

const errorText = (error: { message: string; code?: string }) => `${error.message}${error.code ? ` (${error.code})` : ""}`;

export function ApiPostCard({ post }: { post: Post }) {
  const services = useMabizServices();
  const app = useAppStore();
  const [liked, setLiked] = useState(Boolean(post.viewerHasLiked));
  const [likeCount, setLikeCount] = useState(post.likes);
  const [busy, setBusy] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [error, setError] = useState("");
  const [poll, setPoll] = useState(post.poll);
  const personName = post.authorId === app.user.id ? app.user.name : post.authorName ?? "Mabiz member";
  const name = post.identityKind === "business" ? post.identityName ?? "Business" : personName;
  const canBlock = post.identityKind === "personal" && post.authorId !== app.user.id;
  const openDetail = () => router.push({ pathname: "/post/[id]", params: { id: post.id } });

  const toggleLike = async () => {
    if (!app.isAuthenticated) { router.push("/auth/login"); return; }
    setBusy(true); setError("");
    const result = liked ? await services.posts.unlike(post.id) : await services.posts.like(post.id);
    if (!result.ok) { setError(errorText(result.error)); setBusy(false); return; }
    const nextLiked = !liked;
    setLiked(nextLiked);
    const status = await services.posts.getLikeStatus(post.id);
    if (status.ok) { setLiked(status.data.viewerHasLiked); setLikeCount(status.data.likeCount); }
    else { setLikeCount((count) => Math.max(0, count + (nextLiked ? 1 : -1))); setError(`Like updated, but refresh failed: ${errorText(status.error)}`); }
    setBusy(false);
  };

  const toggleHidden = async () => {
    setBusy(true); setError("");
    const result = hidden ? await services.moderation.unhidePost(post.id) : await services.moderation.hidePost(post.id);
    if (!result.ok) setError(errorText(result.error)); else setHidden(!hidden);
    setBusy(false);
  };

  const toggleBlocked = async () => {
    setBusy(true); setError("");
    const result = blocked ? await services.moderation.unblock(post.authorId) : await services.moderation.block(post.authorId);
    if (!result.ok) setError(errorText(result.error)); else setBlocked(!blocked);
    setBusy(false);
  };

  const vote = async (optionId: string) => {
    if (!app.isAuthenticated) { router.push("/auth/login"); return; }
    setBusy(true); setError("");
    const result = await services.posts.vote(post.id, { optionIds: [optionId] });
    if (!result.ok) setError(errorText(result.error)); else setPoll(result.data);
    setBusy(false);
  };

  if (hidden) return <View style={styles.card} accessibilityLiveRegion="polite"><Text style={styles.caption}>This post is hidden in your feed.</Text><Button title={busy ? "Working…" : "Undo hide"} small variant="outline" disabled={busy} onPress={() => void toggleHidden()} />{error ? <Text accessibilityRole="alert" style={[styles.caption, { color: colors.danger }]}>{error}</Text> : null}</View>;

  return <View style={styles.card}>
    <View style={[styles.row, { padding: 14, paddingBottom: 10 }]}>
      <Avatar name={name} image={post.identityKind === "business" ? post.identityAvatar : post.authorAvatar} size={42} />
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{name}</Text>
        <Text style={styles.caption}>{post.identityKind === "business" ? "Business post" : `@${post.authorUsername || "member"}`} · {new Date(post.createdAt).toLocaleDateString()}</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Open post details" onPress={openDetail}><Ionicons name="ellipsis-horizontal" color={colors.muted} size={22} /></Pressable>
    </View>
    <Text style={[styles.body, { paddingHorizontal: 14, paddingBottom: 10 }]}>{post.caption}</Text>
    {(post.mediaItems?.length || post.media) ? <View style={{ gap: 2 }}>{(post.mediaItems?.length ? post.mediaItems : [post.media!]).map((uri, index) => post.video ? <VideoPreview key={`${uri}-${index}`} uri={uri} height={230} /> : <MediaImage key={`${uri}-${index}`} uri={uri} height={230} label={`${name} · photo ${index + 1}`} />)}</View> : null}
    {poll ? <View style={{ margin: 14, marginTop: 2, padding: 12, backgroundColor: colors.subtle, borderRadius: 12, gap: 8 }}>
      <Text style={styles.cardTitle}>{poll.question}</Text>
      {poll.options.map((option) => {
        const optionVotes = option.voteCount ?? 0;
        const totalVotes = poll.totalVotes ?? 0;
        const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;
        return <Pressable key={option.id} accessibilityRole="button" accessibilityLabel={`Vote for ${option.text}`} accessibilityState={{ disabled: busy || poll.isClosed || Boolean(poll.viewerVoteOptionId) }} disabled={busy || poll.isClosed || Boolean(poll.viewerVoteOptionId)} onPress={() => void vote(option.id)} style={[styles.rowBetween, { borderWidth: 1, borderColor: poll.viewerVoteOptionId === option.id ? colors.emerald : colors.border, backgroundColor: colors.white, borderRadius: 9, padding: 10 }]}>
          <Text style={styles.body}>{option.text}{poll.viewerVoteOptionId === option.id ? " · Your vote" : ""}</Text>
          <Text style={styles.caption}>{optionVotes} · {percentage}%</Text>
        </Pressable>;
      })}
      <Text style={styles.caption}>{poll.totalVotes ?? 0} votes{poll.isClosed ? " · Poll closed" : poll.endsAt ? ` · Closes ${new Date(poll.endsAt).toLocaleDateString()}` : ""}</Text>
    </View> : null}
    <View style={[styles.row, { flexWrap: "wrap", padding: 14, paddingBottom: 6 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={liked ? "Unlike post" : "Like post"} accessibilityState={{ disabled: busy }} disabled={busy} onPress={() => void toggleLike()} style={styles.action}>
        <Ionicons name={liked ? "heart" : "heart-outline"} size={20} color={liked ? colors.orange : colors.ink} /><Text style={styles.actionText}>{likeCount}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={`Open ${post.commentCount ?? 0} comments`} onPress={openDetail} style={styles.action}>
        <Ionicons name="chatbubble-ellipses-outline" size={19} color={colors.ink} /><Text style={styles.actionText}>{post.commentCount ?? 0} comments</Text>
      </Pressable>
      {post.businessId ? <Button title="Business profile" small variant="outline" onPress={() => router.push({ pathname: "/business/[id]", params: { id: post.businessId! } })} /> : null}
      {canBlock ? <Button title={blocked ? "Unblock author" : "Block author"} small variant="quiet" disabled={busy} onPress={() => void toggleBlocked()} /> : null}
      <Button title="Hide post" small variant="quiet" disabled={busy} onPress={() => void toggleHidden()} />
    </View>
    {error ? <Text accessibilityRole="alert" style={{ color: colors.danger, paddingHorizontal: 14, paddingBottom: 12 }}>{error}</Text> : null}
  </View>;
}
