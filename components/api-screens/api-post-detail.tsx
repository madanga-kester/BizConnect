import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  Avatar,
  Button,
  EmptyState,
  Field,
  LoadingState,
  Page,
  SectionTitle,
  TopBar,
  styles,
} from "@/components/biz-ui";
import { ApiPostCard } from "@/components/api-post-card";
import { useAppStore } from "@/hooks/use-app-store";
import { useMabizServices } from "@/lib/services/service-provider";
import { pageRequest } from "@/lib/api-helpers";
import { colors, createThemedStyles } from "@/theme/tokens";
import type { SocialApiComment } from "@/lib/api/feature-contracts";
import type { Post } from "@/types/domain";
import { Replies } from "./replies";
import { InlineError } from "./inline-error";
import { useThemeContext } from "@/lib/theme-provider";

export function ApiPostDetail({ postId }: { postId: string }) {
  useThemeContext();
  const services = useMabizServices();
  const app = useAppStore();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<SocialApiComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<SocialApiComment | null>(null);
  const [repliesVersion, setRepliesVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [commentError, setCommentError] = useState("");

  // `silent` refreshes in the background: no spinner, no unmounting, so the
  // scroll position is kept (used after sending a comment).
  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(false);
      if (!silent) setCommentError("");
      const [postResult, commentsResult] = await Promise.all([
        services.posts.get(postId),
        services.posts.listComments(postId, pageRequest()),
      ]);
      if (!postResult.ok) setError(true);
      else setPost(postResult.data);
      if (!commentsResult.ok)
        setCommentError("Couldn't load comments. Pull down to retry.");
      else setComments(commentsResult.data.items);
      setLoading(false);
    },
    [postId, services]
  );

  useEffect(() => {
    void load();
  }, [load]);

  const send = async () => {
    if (!app.isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    const text = commentText.trim();
    if (!text || busy) return;
    setBusy(true);
    setCommentError("");
    const result = replyTo
      ? await services.posts.reply(postId, replyTo.id, { text })
      : await services.posts.comment(postId, { text });
    if (!result.ok) {
      setCommentError("Couldn't send your message. Please try again.");
    } else {
      setCommentText("");
      setReplyTo(null);
      setRepliesVersion((value) => value + 1);
      await load(true);
    }
    setBusy(false);
  };

  const cancelReply = () => {
    setReplyTo(null);
    setCommentText("");
  };

  const renderComposer = () => (
    <View style={localStyles.composer}>
      {replyTo ? (
        <View style={localStyles.replyBanner}>
          <Text style={styles.caption}>Replying to {replyTo.userName}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={cancelReply}
            hitSlop={6}
            style={({ pressed }) => [pressed && { opacity: 0.6 }]}
          >
            <Text style={localStyles.cancelReplyText}>Cancel</Text>
          </Pressable>
        </View>
      ) : null}
      <Field
        label={replyTo ? "Write a reply" : "Add a comment"}
        value={commentText}
        onChangeText={setCommentText}
        multiline
        placeholder="Share a helpful thought…"
      />
      <Button
        title={busy ? "Sending…" : replyTo ? "Send reply" : "Comment"}
        icon="paper-plane-outline"
        disabled={busy}
        onPress={() => void send()}
      />
    </View>
  );

  const commentsEnabled = post?.allowComments !== false;

  return (
    <Page
      topColor={colors.surface}
      onRefresh={() => void load()}
      refreshing={loading}
    >
      <View style={localStyles.headerBar}>
        <TopBar title="Post" back />
      </View>

      {loading && !post ? <LoadingState label="Loading post" /> : null}

      {error ? (
        <InlineError
          message={
            post
              ? "Couldn't refresh this post."
              : "Couldn't load this post. Check your connection and try again."
          }
          onRetry={() => void load()}
        />
      ) : null}

      {post ? (
        <>
          <View style={localStyles.postBand}>
            <ApiPostCard post={post} />
          </View>

          <View style={localStyles.commentsBand}>
            <SectionTitle
              title={`Comments · ${post.commentCount ?? comments.length}`}
            />

            {/* The composer sits right under the post so it never needs a
                long scroll; when replying it moves under that comment. */}
            {!commentsEnabled ? (
              <Text style={styles.caption}>
                Comments are turned off for this post.
              </Text>
            ) : !replyTo ? (
              renderComposer()
            ) : null}

            {commentError ? (
              <InlineError message={commentError} />
            ) : null}

            {comments.map((comment) => (
              <View key={comment.id} style={localStyles.commentThread}>
                <View style={localStyles.commentRow}>
                  <Avatar
                    name={comment.userName}
                    image={comment.userAvatar}
                    size={36}
                  />
                  <View style={localStyles.commentBody}>
                    <Text style={styles.cardTitle}>{comment.userName}</Text>
                    <Text style={styles.body}>{comment.text}</Text>
                  </View>
                  {commentsEnabled ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Reply to ${comment.userName}`}
                      onPress={() => {
                        setReplyTo(comment);
                        setCommentText("");
                      }}
                      hitSlop={6}
                      style={({ pressed }) => [
                        localStyles.replyButton,
                        pressed && { opacity: 0.6 },
                      ]}
                    >
                      <Ionicons
                        name="arrow-undo-outline"
                        size={16}
                        color={colors.muted}
                      />
                      <Text style={localStyles.replyText}>Reply</Text>
                    </Pressable>
                  ) : null}
                </View>

                {comment.replyCount ? (
                  <View style={localStyles.nestedReplies}>
                    <Replies comment={comment} version={repliesVersion} />
                  </View>
                ) : null}

                {replyTo?.id === comment.id ? (
                  <View style={localStyles.nestedReplies}>
                    {renderComposer()}
                  </View>
                ) : null}
              </View>
            ))}

            {comments.length === 0 && !commentError ? (
              <EmptyState
                title="No comments yet"
                detail="Start the conversation."
                icon="chatbubble-outline"
              />
            ) : null}
          </View>
        </>
      ) : null}
    </Page>
  );
}

const localStyles = createThemedStyles(() =>
  StyleSheet.create({
    headerBar: {
      marginHorizontal: -16,
      marginTop: -10,
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    postBand: {
      marginHorizontal: -16,
      paddingBottom: 8,
      backgroundColor: colors.surface,
      borderBottomWidth: 6,
      borderBottomColor: colors.canvas,
    },
    commentsBand: {
      gap: 12,
      paddingBottom: 14,
      backgroundColor: colors.surface,
    },
    composer: { gap: 10, paddingTop: 4 },
    commentThread: {
      gap: 6,
      paddingBottom: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    commentRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      paddingVertical: 2,
    },
    commentBody: { flex: 1, gap: 2 },
    replyButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingVertical: 4,
      paddingHorizontal: 6,
    },
    replyText: { fontSize: 12, fontWeight: "600", color: colors.muted },
    nestedReplies: { paddingLeft: 46 },
    replyBanner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 4,
    },
    cancelReplyText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.emeraldDark,
    },
  })
);
