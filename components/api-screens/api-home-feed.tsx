import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
  Avatar,
  Button,
  Chip,
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
import { LIMIT, errorText } from "@/lib/api-helpers";
import { colors } from "@/theme/tokens";
import type { FeedFilters } from "@/lib/api/feature-contracts";
import type { Post } from "@/types/domain";

export function ApiHomeFeed() {
  const services = useMabizServices();
  const app = useAppStore();
  const [mode, setMode] = useState<"for-you" | "following">("for-you");
  const [posts, setPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [quickMenu, setQuickMenu] = useState(false);
  const hasUnread = app.notifications.some((item) => !item.read);
  const load = useCallback(
    async (refresh = false, next = false) => {
      if (next && (!cursor || loadingMore)) return;
      if (refresh) setRefreshing(true);
      else if (next) setLoadingMore(true);
      else setLoading(true);
      setError("");
      const request: FeedFilters = { mode, limit: LIMIT, ...(next && cursor ? { cursor } : {}) };
      const result = await services.feed.list(request);
      if (!result.ok) setError(errorText(result.error));
      else {
        setPosts((current) => (refresh || !next ? result.data.items : [...current, ...result.data.items]));
        setCursor(result.ok ? result.data.nextCursor : undefined);
      }
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    },
    [cursor, loadingMore, mode, services]
  );
  useEffect(() => {
    setPosts([]);
    setCursor(undefined);
    void load(false, false);
  }, [mode]);
  const onScroll = (event: {
    nativeEvent: {
      layoutMeasurement: { height: number };
      contentOffset: { y: number };
      contentSize: { height: number };
    };
  }) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    if (contentSize.height - layoutMeasurement.height - contentOffset.y < 100 && cursor && !loadingMore)
      void load(false, true);
  };
  return (
    <Page onRefresh={() => void load(true, false)} refreshing={refreshing} onScroll={onScroll}>
      <TopBar
        brandNameOnly
        right={
          <View style={styles.row}>
            <Button title="Search" small variant="quiet" icon="search-outline" onPress={() => router.push("/search")} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open your profile"
              onPress={() => router.push("/(tabs)/profile")}
            >
              <Avatar name={app.user.name} image={app.user.avatar} size={34} />
            </Pressable>
          </View>
        }
      />
      <View style={[styles.rowBetween, { paddingVertical: 2 }]}>
        <SectionTitle title="Your feed" />
        <Pressable accessibilityRole="button" onPress={() => setQuickMenu((value) => !value)}>
          <Ionicons name="ellipsis-horizontal" color={colors.muted} size={22} />
        </Pressable>
      </View>
      {quickMenu ? (
        <View style={[styles.row, { flexWrap: "wrap" }]}>
          <Button title="Notifications" small variant="outline" onPress={() => router.push("/menu/activity/notifications")} />
          <Button title="Messages" small variant="outline" onPress={() => router.push("/messages")} />
          <Button title="Profile" small variant="outline" onPress={() => router.push("/(tabs)/profile")} />
          <Text style={styles.caption}>{hasUnread ? "You have unread notifications" : ""}</Text>
        </View>
      ) : null}
      <View style={styles.row}>
        <Chip label="For You" selected={mode === "for-you"} onPress={() => setMode("for-you")} />
        <Chip label="Following" selected={mode === "following"} onPress={() => setMode("following")} />
      </View>
      {error ? (
        <View accessibilityRole="alert" style={{ gap: 8, padding: 12, backgroundColor: colors.orangeTint, borderRadius: 14 }}>
          <Text style={styles.body}>Feed error: {error}</Text>
          <Button title="Retry" small variant="outline" onPress={() => void load(true)} />
        </View>
      ) : null}
      {loading ? <LoadingState label="Loading feed from the server" /> : null}
      {!loading && !error && posts.length === 0 ? (
        <EmptyState
          title={mode === "following" ? "No posts from people you follow" : "Your feed is empty"}
          detail={
            mode === "following"
              ? "Follow a person or business to see their posts here."
              : "New posts will appear here as they are published."
          }
          icon="albums-outline"
          action="Create a post"
          onAction={() => router.push("/(tabs)/create")}
        />
      ) : null}
      {posts.map((post) => (
        <ApiPostCard key={post.id} post={post} />
      ))}
      {loadingMore ? <LoadingState label="Loading more posts" /> : null}
      {!loading && posts.length > 0 && !cursor && !loadingMore ? (
        <Text style={[styles.caption, { textAlign: "center" }]}>You’re all caught up.</Text>
      ) : null}
    </Page>
  );
}