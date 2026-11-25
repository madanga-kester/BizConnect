import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Avatar,
  EmptyState,
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
import { CommentItem } from "./comment-item";
import { InlineError } from "./inline-error";
import { useThemeContext } from "@/lib/theme-provider";

export function ApiPostDetail({ postId }: { postId: string }) {
  useThemeContext();
  const services = useMabizServices();
  const app = useAppStore();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
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

  const canSend = commentText.trim().length > 0 && !busy;

  const renderComposer = () => (
    <View style={localStyles.composer}>
      {replyTo ? (
        <View style={localStyles.replyBanner}>
          <Text style={styles.caption}>Replying to {replyTo.userName}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel reply"
            onPress={cancelReply}
            hitSlop={8}
            style={({ pressed }) => [pressed && { opacity: 0.6 }]}
          >
            <Ionicons name="close" size={16} color={colors.muted} />
          </Pressable>
        </View>
      ) : null}
      <View style={localStyles.composerRow}>
        <Avatar
          name={app.user?.name ?? "You"}
          image={app.user?.avatar}
          size={32}
        />
        <TextInput
          ref={inputRef}
          value={commentText}
          onChangeText={setCommentText}
          placeholder={replyTo ? "Add a reply" : "Add a comment"}
          placeholderTextColor={colors.muted}
          multiline
          editable={!busy}
          style={localStyles.composerInput}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={replyTo ? "Send reply" : "Send comment"}
          disabled={!canSend}
          onPress={() => void send()}
          hitSlop={8}
        >
          <Ionicons
            name="send"
            size={22}
            color={canSend ? colors.emerald : colors.muted}
          />
        </Pressable>
      </View>
    </View>
  );

  const commentsEnabled = post?.allowComments !== false;
  const showComposer = Boolean(post) && commentsEnabled;

  return (
    <KeyboardAvoidingView
      style={localStyles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
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

            {!commentsEnabled ? (
              <Text style={styles.caption}>
                Comments are turned off for this post.
              </Text>
            ) : null}

            {commentError ? (
              <InlineError message={commentError} />
            ) : null}

            {comments.map((comment) => (
              <View key={comment.id} style={localStyles.commentThread}>
                <CommentItem
                  comment={comment}
                  onReply={
                    commentsEnabled
                      ? () => {
                          setReplyTo(comment);
                          setCommentText("");
                          inputRef.current?.focus();
                        }
                      : undefined
                  }
                />

                {comment.replyCount ? (
                  <View style={localStyles.nestedReplies}>
                    <Replies comment={comment} version={repliesVersion} />
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
    {showComposer ? (
      <View
        style={[
          localStyles.composerDock,
          { paddingBottom: Math.max(insets.bottom, 8) },
        ]}
      >
        {renderComposer()}
      </View>
    ) : null}
    </KeyboardAvoidingView>
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
    screen: { flex: 1 },
    composerDock: {
      paddingHorizontal: 16,
      paddingTop: 8,
      backgroundColor: colors.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    composer: { gap: 8 },
    composerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    composerInput: {
      flex: 1,
      minHeight: 38,
      maxHeight: 100,
      borderRadius: 19,
      paddingHorizontal: 14,
      paddingVertical: 8,
      fontSize: 14,
      color: colors.ink,
      backgroundColor: colors.subtle,
    },
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
