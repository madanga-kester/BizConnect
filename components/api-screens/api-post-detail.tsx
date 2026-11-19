import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
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
import { errorText, pageRequest } from "@/lib/api-helpers";
import { colors } from "@/theme/tokens";
import type { SocialApiComment } from "@/lib/api/feature-contracts";
import type { Post } from "@/types/domain";
import { Replies } from "./replies";

export function ApiPostDetail({ postId }: { postId: string }) {
  const services = useMabizServices();
  const app = useAppStore();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<SocialApiComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<SocialApiComment | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [commentError, setCommentError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setCommentError("");
    const [postResult, commentsResult] = await Promise.all([
      services.posts.get(postId),
      services.posts.listComments(postId, pageRequest()),
    ]);
    if (!postResult.ok) setError(errorText(postResult.error));
    else setPost(postResult.data);
    if (!commentsResult.ok) setCommentError(errorText(commentsResult.error));
    else setComments(commentsResult.data.items);
    setLoading(false);
  }, [postId, services]);
  useEffect(() => {
    void load();
  }, [load]);
  const send = async () => {
    if (!app.isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    const text = commentText.trim();
    if (!text) return;
    setBusy(true);
    setCommentError("");
    const result = replyTo
      ? await services.posts.reply(postId, replyTo.id, { text })
      : await services.posts.comment(postId, { text });
    if (!result.ok) setCommentError(errorText(result.error));
    else {
      setCommentText("");
      setReplyTo(null);
      await load();
    }
    setBusy(false);
  };
  return (
    <Page onRefresh={() => void load()} refreshing={loading}>
      <TopBar title="Post" back />
      {error ? (
        <View accessibilityRole="alert" style={{ gap: 8 }}>
          <Text style={styles.body}>Post error: {error}</Text>
          <Button title="Retry" small variant="outline" onPress={() => void load()} />
        </View>
      ) : null}
      {loading ? <LoadingState label="Loading post and comments" /> : null}
      {!loading && !error && post ? (
        <>
          <ApiPostCard post={post} />
          <SectionTitle title={`Comments · ${post.commentCount ?? comments.length}`} />
          {commentError ? (
            <Text accessibilityRole="alert" style={{ ...styles.body, color: colors.danger }}>
              Comments error: {commentError}
            </Text>
          ) : null}
          {comments.map((comment) => (
            <View key={comment.id} style={{ gap: 8 }}>
              <View style={styles.actionTile}>
                <Avatar name={comment.userName} image={comment.userAvatar} size={34} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{comment.userName}</Text>
                  <Text style={styles.body}>{comment.text}</Text>
                </View>
                <Button
                  title="Reply"
                  small
                  variant="quiet"
                  onPress={() => {
                    setReplyTo(comment);
                    setCommentText("");
                  }}
                />
              </View>
              {comment.replyCount ? <Replies comment={comment} /> : null}
            </View>
          ))}
          {comments.length === 0 && !commentError ? (
            <EmptyState title="No comments yet" detail="Start the conversation." icon="chatbubbles-outline" />
          ) : null}
          {post.allowComments === false ? (
            <Text style={styles.caption}>Comments are disabled for this post.</Text>
          ) : (
            <>
              {replyTo ? (
                <View style={styles.rowBetween}>
                  <Text style={styles.caption}>Replying to {replyTo.userName}</Text>
                  <Button
                    title="Cancel reply"
                    small
                    variant="quiet"
                    onPress={() => {
                      setReplyTo(null);
                      setCommentText("");
                    }}
                  />
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
                icon="send-outline"
                disabled={busy || !app.isAuthenticated}
                onPress={() => void send()}
              />
            </>
          )}
        </>
      ) : null}
    </Page>
  );
}