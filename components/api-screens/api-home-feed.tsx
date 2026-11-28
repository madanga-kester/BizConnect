import { BrandWordmark } from "@/components/brand-wordmark";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
} from "react-native";
import {
  Button,
  EmptyState,
  LoadingState,
  Page,
  styles,
} from "@/components/biz-ui";
import { ApiPostCard } from "@/components/api-post-card";
import { HomeFlyout } from "@/components/home-flyout";
import { CommentsSheet } from "@/components/comments-sheet";
import { useAppStore } from "@/hooks/use-app-store";
import { useMabizServices } from "@/lib/services/service-provider";
import { LIMIT, errorText } from "@/lib/api-helpers";
import { colors, createThemedStyles } from "@/theme/tokens";
import type { FeedFilters } from "@/lib/api/feature-contracts";
import type { Post } from "@/types/domain";
import { useThemeContext } from "@/lib/theme-provider";

const TRENDING_TOPICS = [
  "#SupportLocal",
  "#NairobiBusiness",
  "#MadeInKenya",
  "#SmallBusiness",
  "#WeekendDeals",
  "#TechKenya",
];

type FeedTab =
  | "for-you"
  | "following"
  | "business"
  | "trending"
  | "polls"
  | "events";

function FeedPill({
  label,
  selected,
  onPress,
  trending,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  trending?: boolean;
}) {
  useThemeContext();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[localStyles.feedTab, selected && localStyles.feedTabSelected]}
    >
      <Text
        style={[
          localStyles.feedTabText,
          selected && localStyles.feedTabTextSelected,
        ]}
      >
        {label}
      </Text>
      {trending ? (
        <Ionicons name="trending-up" size={16} color={colors.emerald} />
      ) : null}
    </Pressable>
  );
}

export function ApiHomeFeed() {
  useThemeContext();
  const services = useMabizServices();
  const app = useAppStore();
  const [tab, setTab] = useState<FeedTab>("for-you");
  const mode: "for-you" | "following" =
    tab === "following" ? "following" : "for-you";
  const [posts, setPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [commentsPost, setCommentsPost] = useState<Post | null>(null);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  const loadingMoreRef = useRef(false);
  const cursorRef = useRef<string | undefined>(undefined);
  cursorRef.current = cursor;

  const load = useCallback(
    async (refresh = false, next = false) => {
      const currentCursor = cursorRef.current;
      if (next && (!currentCursor || loadingMoreRef.current)) return;

      if (refresh) {
        setRefreshing(true);
      } else if (next) {
        loadingMoreRef.current = true;
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      setError("");
      const request: FeedFilters = {
        mode,
        limit: LIMIT,
        ...(next && currentCursor ? { cursor: currentCursor } : {}),
      };

      const result = await services.feed.list(request);
      if (!result.ok) {
        setError(errorText(result.error));
      } else {
        setPosts((current) =>
          refresh || !next
            ? result.data.items
            : [...current, ...result.data.items]
        );
        setCursor(result.data.nextCursor);
      }

      setLoading(false);
      setRefreshing(false);
      loadingMoreRef.current = false;
      setLoadingMore(false);
    },
    [mode, services]
  );

  useEffect(() => {
    setPosts([]);
    setCursor(undefined);
    void load(false, false);
  }, [load]);

  // ---- stable callbacks: these keep React.memo on ApiPostCard effective ----
  const openComments = useCallback((post: Post) => setCommentsPost(post), []);

  const hidePost = useCallback((postId: string) => {
    setHiddenIds((current) => new Set(current).add(postId));
  }, []);

  const keyExtractor = useCallback((post: Post) => post.id, []);

  const renderItem = useCallback<ListRenderItem<Post>>(
    ({ item }) => (
      <ApiPostCard
        post={item}
        onOpenComments={openComments}
        onHide={hidePost}
      />
    ),
    [openComments, hidePost]
  );

  const onEndReached = useCallback(() => {
    void load(false, true);
  }, [load]);

  const onRefresh = useCallback(() => {
    void load(true, false);
  }, [load]);

  const updates = useMemo(() => {
    const seen = new Set<string>();
    const items: {
      businessId: string;
      postId: string;
      name: string;
      logo?: string;
      cover?: string;
    }[] = [];
    for (const post of posts) {
      if (post.identityKind !== "business" || seen.has(post.identityId))
        continue;
      const business = app.businesses.find(
        (item) => item.id === post.identityId
      );
      if (!business) continue;
      seen.add(post.identityId);
      items.push({
        businessId: business.id,
        postId: post.id,
        name: business.name,
        logo: business.logo,
        cover: post.mediaItems?.[0] ?? post.media,
      });
      if (items.length >= 8) break;
    }
    return items;
  }, [posts, app.businesses]);

  const visiblePosts = useMemo(
    () =>
      posts.filter(
        (post) =>
          !hiddenIds.has(post.id) &&
          (tab !== "business" || post.identityKind === "business") &&
          tab !== "polls" &&
          tab !== "events"
      ),
    [posts, tab, hiddenIds]
  );

  // ---- list pieces (passed as elements, not components, so they never remount) ----
  const listHeader = (
    <View>
      <View style={localStyles.headerBlock}>
        <View style={styles.row}>
          <BrandWordmark style={localStyles.brandTitle} />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Search businesses, people, topics"
            onPress={() => router.push("/search")}
            style={localStyles.searchBar}
          >
            <Ionicons name="search-outline" size={18} color={colors.muted} />
            <Text numberOfLines={1} style={localStyles.searchPlaceholder}>
              Search Mabiz...
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open menu"
            onPress={() => setMenuOpen(true)}
            style={localStyles.menuButton}
          >
            <Ionicons name="menu-outline" size={26} color={colors.ink} />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={localStyles.feedTabRow}
        >
          <FeedPill
            label="For You"
            selected={tab === "for-you"}
            onPress={() => setTab("for-you")}
          />
          <FeedPill
            label="Following"
            selected={tab === "following"}
            onPress={() => setTab("following")}
          />
          <FeedPill
            label="Business"
            selected={tab === "business"}
            onPress={() => setTab("business")}
          />
          <FeedPill
            label="Trending"
            selected={tab === "trending"}
            onPress={() => setTab("trending")}
            trending
          />
          <FeedPill
            label="Polls"
            selected={tab === "polls"}
            onPress={() => setTab("polls")}
          />
          <FeedPill
            label="Events"
            selected={tab === "events"}
            onPress={() => setTab("events")}
          />
        </ScrollView>
      </View>

      {tab === "trending" ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={localStyles.trendRow}
        >
          {TRENDING_TOPICS.map((topic) => (
            <Pressable
              key={topic}
              accessibilityRole="button"
              accessibilityLabel={`Trending topic ${topic}`}
              style={localStyles.trendChip}
            >
              <Ionicons
                name="trending-up-outline"
                size={14}
                color={colors.emeraldDark}
              />
              <Text style={localStyles.trendText}>{topic}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {error ? (
        <View
          accessibilityRole="alert"
          style={[styles.rowBetween, localStyles.errorBar]}
        >
          <Text style={[styles.body, { flex: 1, color: colors.danger }]}>
            Feed error: {error}
          </Text>
          <Button
            title="Retry"
            small
            variant="outline"
            onPress={() => void load(true)}
          />
        </View>
      ) : null}
    </View>
  );

  const listEmpty = (
    <View style={localStyles.pad}>
      {loading ? (
        <LoadingState label="Loading feed from the server" />
      ) : tab === "polls" ? (
        <EmptyState
          title="No polls yet"
          detail="Polls from people and businesses will appear here."
          icon="bar-chart-outline"
        />
      ) : tab === "events" ? (
        <EmptyState
          title="No events yet"
          detail="Upcoming events will appear here."
          icon="calendar-outline"
        />
      ) : posts.length > 0 ? (
        <EmptyState
          title="Nothing here yet"
          detail="There are no business posts in your feed right now."
          icon="storefront-outline"
        />
      ) : error ? null : (
        <EmptyState
          title={
            mode === "following"
              ? "No posts from people you follow"
              : "Your feed is empty"
          }
          detail={
            mode === "following"
              ? "Follow a person or business to see their posts here."
              : "New posts will appear here as they are published."
          }
          icon="albums-outline"
        />
      )}
    </View>
  );

  const listFooter = (
    <View style={localStyles.footer}>
      {loadingMore ? <LoadingState label="Loading more posts" /> : null}
      {!loading && visiblePosts.length > 0 && !cursor && !loadingMore ? (
        <Text style={[styles.caption, { textAlign: "center" }]}>
          You're all caught up.
        </Text>
      ) : null}
    </View>
  );

  return (
    <Page
      scroll={false}
      topColor={colors.surface}
      style={localStyles.pageReset}
    >
      <FlatList
        style={{ flex: 1 }}
        data={visiblePosts}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={listFooter}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.6}
        initialNumToRender={3}
        maxToRenderPerBatch={4}
        windowSize={7}
        removeClippedSubviews={Platform.OS === "android"}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />

      <HomeFlyout
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        updates={updates}
      />

      <CommentsSheet
        post={commentsPost}
        onClose={() => setCommentsPost(null)}
      />
    </Page>
  );
}

const localStyles = createThemedStyles(() =>
  StyleSheet.create({
    // Page normally pads and gaps its children; the list manages its own spacing
    pageReset: {
      paddingHorizontal: 0,
      paddingTop: 0,
      paddingBottom: 0,
      gap: 0,
    },
    pad: {
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    footer: {
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    errorBar: {
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    headerBlock: {
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 0,
      gap: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    brandTitle: {
      fontSize: 31,
      fontWeight: "900",
      letterSpacing: -1.6,
      color: colors.emerald,
    },
    menuButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    searchBar: {
      flex: 1,
      height: 42,
      borderRadius: 999,
      paddingHorizontal: 14,
      backgroundColor: colors.subtle,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    searchPlaceholder: {
      flex: 1,
      color: colors.muted,
      fontSize: 14,
    },
    feedTabRow: {
      flexDirection: "row",
      gap: 20,
      marginTop: 2,
    },
    feedTab: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingVertical: 10,
      borderBottomWidth: 3,
      borderBottomColor: "transparent",
    },
    feedTabSelected: {
      borderBottomColor: colors.emerald,
    },
    feedTabText: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.muted,
    },
    feedTabTextSelected: {
      fontWeight: "700",
      color: colors.ink,
    },
    trendRow: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    trendChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: colors.emeraldTint,
    },
    trendText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.emeraldDark,
    },
  })
);