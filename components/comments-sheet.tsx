import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Keyboard,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useMabizServices } from "@/lib/services/service-provider";
import { errorText } from "@/lib/api-helpers";
import { colors, createThemedStyles } from "@/theme/tokens";
import { useThemeContext } from "@/lib/theme-provider";
import type { Post } from "@/types/domain";

// ASSUMED shape: adjust to your real Comment type / services.posts API.
// Optional API methods used if they exist (safe if they don't):
//   api.likeComment(commentId) / api.unlikeComment(commentId)
type CommentItem = {
  id: string;
  parentId?: string;
  authorName: string;
  body: string;
  createdAt: string; // raw ISO string, formatted at render time
  replyCount: number;
  likeCount: number;
  liked: boolean;
  pending?: boolean;
};

const QUICK_EMOJIS = ["❤️", "🙌", "🔥", "👏", "😢", "😍", "😮", "😂"];

const normalizeComment = (c: any): CommentItem => ({
  id: String(c.id),
  parentId: c.parentCommentId ?? c.parentId ?? undefined,
  authorName: c.authorName ?? c.userName ?? "Mabiz member",
  body: c.text ?? c.body ?? "",
  createdAt: c.createdAt ?? "",
  replyCount: c.replyCount ?? 0,
  likeCount: c.likeCount ?? c.likes ?? 0,
  liked: !!(c.likedByMe ?? c.liked),
});

// Instagram-style short relative time: now, 5m, 2h, 3d, 2w, 4mo, 1y
function relativeTime(iso: string): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const sec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (sec < 60) return "now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  if (day < 30) return `${Math.floor(day / 7)}w`;
  if (day < 365) return `${Math.floor(day / 30)}mo`;
  return `${Math.floor(day / 365)}y`;
}

const compactCount = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`
    : n >= 1_000
    ? `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`
    : String(n);

export function CommentsSheet({
  post,
  onClose,
}: {
  post: Post | null;
  onClose: () => void;
}) {
  useThemeContext();
  const services = useMabizServices();
  const servicesRef = useRef(services);
  servicesRef.current = services;

  const postId = post?.id;

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<CommentItem | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [repliesMap, setRepliesMap] = useState<Record<string, CommentItem[]>>(
    {}
  );
  const [loadingReplies, setLoadingReplies] = useState<Set<string>>(new Set());
  const [sheetMounted, setSheetMounted] = useState(false);
  const sheetProgress = useRef(new Animated.Value(0)).current;

  const inputRef = useRef<TextInput>(null);
  const listRef = useRef<FlatList<CommentItem>>(null);
  const loadRequestId = useRef(0);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const { height: screenHeight } = useWindowDimensions();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // ---------- keyboard ----------
  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, (e) =>
      setKeyboardHeight(e.endCoordinates.height)
    );
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // ---------- swipe down to close ----------
  const dragY = useRef(new Animated.Value(0)).current;
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
        onPanResponderMove: (_, g) => {
          if (g.dy > 0) dragY.setValue(g.dy);
        },
        onPanResponderRelease: (_, g) => {
          if (g.dy > 120 || g.vy > 0.8) {
            Keyboard.dismiss();
            Animated.timing(dragY, {
              toValue: screenHeight,
              duration: 180,
              useNativeDriver: true,
            }).start(() => {
              onCloseRef.current();
            });
          } else {
            Animated.spring(dragY, {
              toValue: 0,
              useNativeDriver: true,
              bounciness: 6,
            }).start();
          }
        },
      }),
    [dragY, screenHeight]
  );

  const isOpen = Boolean(post);

  useEffect(() => {
    if (isOpen) {
      dragY.setValue(0);
      setSheetMounted(true);
      Animated.timing(sheetProgress, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(sheetProgress, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setSheetMounted(false);
      });
    }
  }, [isOpen, sheetProgress, dragY]);

  const scrimOpacity = sheetProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.4],
  });

  const sheetY = sheetProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [screenHeight, 0],
  });

  const sheetTranslate = Animated.add(dragY, sheetY);

  // ---------- helpers to patch state ----------
  const patchComment = (
    id: string,
    fn: (c: CommentItem) => CommentItem
  ) => {
    setComments((list) => list.map((c) => (c.id === id ? fn(c) : c)));
    setRepliesMap((map) => {
      const next: Record<string, CommentItem[]> = {};
      for (const key of Object.keys(map)) {
        next[key] = map[key].map((c) => (c.id === id ? fn(c) : c));
      }
      return next;
    });
  };

  // ---------- loading ----------
  // silent = refresh without swapping the list for a spinner
  const load = useCallback(
    async (silent = false) => {
      if (!postId) return;
      const requestId = ++loadRequestId.current;
      if (!silent) setLoading(true);
      try {
        const api = servicesRef.current.posts as any;
        const result = await api.listComments(postId, { limit: 50 });
        if (requestId !== loadRequestId.current) return; // stale response
        if (!result.ok) setError(errorText(result.error));
        else {
          setError("");
          setComments(result.data.items.map(normalizeComment));
        }
      } catch (e) {
        if (requestId !== loadRequestId.current) return;
        setError(e instanceof Error ? e.message : "Unable to load comments.");
      } finally {
        if (requestId === loadRequestId.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [postId]
  );

  useEffect(() => {
    loadRequestId.current++; // invalidate any in-flight request from previous post
    if (!postId) return;
    setComments([]);
    setText("");
    setReplyTo(null);
    setExpanded(new Set());
    setRepliesMap({});
    setLoadingReplies(new Set());
    setError("");
    setSending(false);
    void load();
  }, [postId, load]);

  const loadReplies = async (id: string) => {
    setLoadingReplies((s) => new Set(s).add(id));
    try {
      const api = servicesRef.current.posts as any;
      const result = await api.listReplies(id, { limit: 50 });
      if (!result.ok) {
        setError(errorText(result.error));
        return;
      }
      const items: CommentItem[] = result.data.items.map(normalizeComment);
      setRepliesMap((prev) => ({ ...prev, [id]: items }));
      patchComment(id, (c) => ({ ...c, replyCount: items.length }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load replies.");
    } finally {
      setLoadingReplies((s) => {
        const next = new Set(s);
        next.delete(id);
        return next;
      });
    }
  };

  const toggleReplies = (id: string) => {
    const isOpen = expanded.has(id);
    setExpanded((prev) => {
      const next = new Set(prev);
      if (isOpen) next.delete(id);
      else next.add(id);
      return next;
    });
    if (!isOpen && !repliesMap[id]) void loadReplies(id);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setRepliesMap({});
    // re-fetch replies for any open threads after top-level refresh
    const open = Array.from(expanded);
    void load(true).then(() => open.forEach((id) => void loadReplies(id)));
  };

  // ---------- reply / send ----------
  const startReply = (comment: CommentItem) => {
    // Replies to replies attach to the top-level parent, like Instagram
    setReplyTo(comment);
    setText(`@${comment.authorName} `);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const cancelReply = () => {
    setReplyTo(null);
    setText("");
  };

  const send = async () => {
    const body = text.trim();
    if (!post || !body || sending) return;

    const target = replyTo;
    const parentId = target ? target.parentId ?? target.id : undefined;
    const tempId = `tmp-${Date.now()}`;
    const temp: CommentItem = {
      id: tempId,
      parentId,
      authorName: "You",
      body,
      createdAt: new Date().toISOString(),
      replyCount: 0,
      likeCount: 0,
      liked: false,
      pending: true,
    };

    // optimistic insert
    setSending(true);
    setText("");
    setReplyTo(null);
    setError("");
    if (parentId) {
      setRepliesMap((m) => ({ ...m, [parentId]: [...(m[parentId] ?? []), temp] }));
      setExpanded((s) => new Set(s).add(parentId));
      patchComment(parentId, (c) => ({ ...c, replyCount: c.replyCount + 1 }));
    } else {
      setComments((list) => [temp, ...list]);
      setTimeout(
        () => listRef.current?.scrollToOffset({ offset: 0, animated: true }),
        50
      );
    }

    const rollback = () => {
      if (parentId) {
        setRepliesMap((m) => ({
          ...m,
          [parentId]: (m[parentId] ?? []).filter((c) => c.id !== tempId),
        }));
        patchComment(parentId, (c) => ({
          ...c,
          replyCount: Math.max(0, c.replyCount - 1),
        }));
      } else {
        setComments((list) => list.filter((c) => c.id !== tempId));
      }
      setText(body);
      setReplyTo(target);
    };

    try {
      const api = services.posts as any;
      const result = parentId
        ? await api.reply(post.id, parentId, { text: body })
        : await api.comment(post.id, { text: body });
      if (!result.ok) {
        rollback();
        setError(errorText(result.error));
        return;
      }
      // silent refresh swaps the optimistic item for the real one
      if (parentId) await loadReplies(parentId);
      void load(true);
    } catch (e) {
      rollback();
      setError(e instanceof Error ? e.message : "Unable to post.");
    } finally {
      setSending(false);
    }
  };

  // ---------- likes (optimistic) ----------
  const toggleLike = async (c: CommentItem) => {
    if (c.pending) return;
    const nextLiked = !c.liked;
    patchComment(c.id, (x) => ({
      ...x,
      liked: nextLiked,
      likeCount: Math.max(0, x.likeCount + (nextLiked ? 1 : -1)),
    }));
    try {
      const api = services.posts as any;
      const fn = nextLiked ? api.likeComment : api.unlikeComment;
      if (typeof fn === "function") {
        const result = await fn.call(api, c.id);
        if (result && result.ok === false) throw new Error("like failed");
      }
    } catch {
      // revert
      patchComment(c.id, (x) => ({
        ...x,
        liked: c.liked,
        likeCount: c.likeCount,
      }));
    }
  };

  // ---------- render ----------
  const renderComment = (c: CommentItem, isReply = false) => (
    <View
      key={c.id}
      style={[s.comment, isReply && s.replyIndent, c.pending && { opacity: 0.55 }]}
    >
      <View style={[s.avatar, isReply && s.avatarSmall]}>
        <Text style={s.avatarText}>{c.authorName.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.body}>
          <Text style={s.author}>{c.authorName} </Text>
          {c.body}
        </Text>
        <View style={s.metaRow}>
          <Text style={s.meta}>
            {c.pending ? "Posting..." : relativeTime(c.createdAt)}
          </Text>
          {c.likeCount > 0 ? (
            <Text style={[s.meta, s.metaStrong]}>
              {compactCount(c.likeCount)} {c.likeCount === 1 ? "like" : "likes"}
            </Text>
          ) : null}
          <Pressable onPress={() => startReply(c)} hitSlop={8}>
            <Text style={[s.meta, s.metaStrong]}>Reply</Text>
          </Pressable>
        </View>
      </View>
      <Pressable
        onPress={() => void toggleLike(c)}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={c.liked ? "Unlike comment" : "Like comment"}
      >
        <Ionicons
          name={c.liked ? "heart" : "heart-outline"}
          size={16}
          color={c.liked ? colors.danger : colors.muted}
        />
      </Pressable>
    </View>
  );

  const topLevel = comments.filter((c) => !c.parentId);
  const canSend = !!text.trim() && !sending;
  const sheetMax = screenHeight - 60;
  const sheetHeight = Math.min(screenHeight * 0.6 + keyboardHeight, sheetMax);

  return (
    <Modal
      visible={sheetMounted}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={s.root}>
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            s.scrim,
            { opacity: scrimOpacity },
          ]}
        />
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <Animated.View
          style={[
            s.sheet,
            {
              height: sheetHeight,
              paddingBottom: keyboardHeight,
              transform: [{ translateY: sheetTranslate }],
            },
          ]}
        >
          {/* drag area: handle + title */}
          <View {...panResponder.panHandlers}>
            <View style={s.handle} />
            <Text style={s.title}>Comments</Text>
          </View>

          {loading ? (
            <ActivityIndicator style={{ marginTop: 24 }} />
          ) : (
            <FlatList
              ref={listRef}
              data={topLevel}
              style={{ flex: 1 }}
              contentContainerStyle={{ paddingBottom: 12, flexGrow: 1 }}
              showsVerticalScrollIndicator
              nestedScrollEnabled
              keyExtractor={(c) => c.id}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
              refreshing={refreshing}
              onRefresh={onRefresh}
              ListEmptyComponent={
                <View style={s.empty}>
                  <Text style={s.emptyTitle}>No comments yet</Text>
                  <Text style={s.meta}>Start the conversation.</Text>
                </View>
              }
              renderItem={({ item }) => {
                const replies = repliesMap[item.id] ?? [];
                const open = expanded.has(item.id);
                const replyTotal = Math.max(item.replyCount, replies.length);
                const fetching = loadingReplies.has(item.id);
                return (
                  <View>
                    {renderComment(item)}
                    {replyTotal > 0 ? (
                      <Pressable
                        style={s.viewReplies}
                        onPress={() => toggleReplies(item.id)}
                        hitSlop={6}
                      >
                        <View style={s.line} />
                        <Text style={[s.meta, s.metaStrong]}>
                          {open
                            ? "Hide replies"
                            : `View ${replyTotal} ${
                                replyTotal === 1 ? "reply" : "replies"
                              }`}
                        </Text>
                        {fetching ? (
                          <ActivityIndicator size="small" style={{ marginLeft: 6 }} />
                        ) : null}
                      </Pressable>
                    ) : null}
                    {open ? replies.map((r) => renderComment(r, true)) : null}
                  </View>
                );
              }}
            />
          )}

          {error ? (
            <Pressable
              onPress={() => {
                setError("");
                void load(true);
              }}
              style={s.errorBar}
            >
              <Text style={[s.meta, { color: colors.danger, flex: 1 }]}>
                {error}
              </Text>
              <Text style={[s.meta, s.metaStrong]}>Retry</Text>
            </Pressable>
          ) : null}

          {replyTo ? (
            <View style={s.replyingBar}>
              <Text style={s.meta}>Replying to {replyTo.authorName}</Text>
              <Pressable onPress={cancelReply} hitSlop={8}>
                <Ionicons name="close" size={16} color={colors.muted} />
              </Pressable>
            </View>
          ) : null}

          {/* quick emoji reactions */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="always"
            style={s.emojiScroll}
            contentContainerStyle={s.emojiRow}
          >
            {QUICK_EMOJIS.map((e) => (
              <Pressable
                key={e}
                hitSlop={6}
                onPress={() => setText((t) => t + e)}
              >
                <Text style={s.emoji}>{e}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={s.inputRow}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>Y</Text>
            </View>
            <TextInput
              ref={inputRef}
              value={text}
              onChangeText={setText}
              placeholder={replyTo ? "Add a reply..." : "Add a comment..."}
              placeholderTextColor={colors.muted}
              style={s.input}
              multiline
              maxLength={2200}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send"
              onPress={() => void send()}
              disabled={!canSend}
              hitSlop={8}
              style={[s.sendButton, !canSend && { opacity: 0.4 }]}
            >
              {sending ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Ionicons name="send" size={16} color={colors.white} />
              )}
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = createThemedStyles(() =>
  StyleSheet.create({
    root: {
      flex: 1,
      justifyContent: "flex-end",
    },
    scrim: {
      backgroundColor: "#000000",
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      overflow: "hidden",
    },
    handle: {
      alignSelf: "center",
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginTop: 8,
    },
    title: {
      textAlign: "center",
      fontWeight: "700",
      fontSize: 15,
      color: colors.ink,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    comment: {
      flexDirection: "row",
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 10,
      alignItems: "flex-start",
    },
    replyIndent: { paddingLeft: 58 },
    avatar: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.subtle,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarSmall: { width: 26, height: 26, borderRadius: 13 },
    avatarText: { fontWeight: "700", color: colors.ink },
    author: { fontWeight: "700", color: colors.ink },
    body: { color: colors.ink, fontSize: 14, lineHeight: 19 },
    metaRow: { flexDirection: "row", gap: 16, marginTop: 4 },
    meta: { fontSize: 12, color: colors.muted },
    metaStrong: { fontWeight: "700" },
    viewReplies: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingLeft: 60,
      paddingVertical: 4,
    },
    line: {
      width: 24,
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.muted,
    },
    empty: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 40,
      gap: 4,
    },
    emptyTitle: { fontSize: 16, fontWeight: "700", color: colors.ink },
    errorBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    replyingBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: colors.subtle,
    },
    emojiScroll: {
      flexGrow: 0,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    emojiRow: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      gap: 18,
      alignItems: "center",
    },
    emoji: { fontSize: 22 },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 16,
      paddingTop: 6,
      paddingBottom: Platform.OS === "ios" ? 14 : 10,
    },
    input: {
      flex: 1,
      maxHeight: 90,
      minHeight: 38,
      borderRadius: 19,
      paddingHorizontal: 14,
      backgroundColor: colors.subtle,
      color: colors.ink,
    },
    sendButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.emerald,
      alignItems: "center",
      justifyContent: "center",
    },
  })
);