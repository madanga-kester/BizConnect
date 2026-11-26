import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
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
  const [tab, setTab] = useState<
    "for-you" | "following" | "business" | "trending" | "polls" | "events"
  >("for-you");
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

  const onScroll = (event: {
    nativeEvent: {
      layoutMeasurement: { height: number };
      contentOffset: { y: number };
      contentSize: { height: number };
    };
  }) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    if (
      contentSize.height - layoutMeasurement.height - contentOffset.y < 100 &&
      cursorRef.current &&
      !loadingMoreRef.current
    ) {
      void load(false, true);
    }
  };

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
          (tab !== "business" || post.identityKind === "business") &&
          tab !== "polls" &&
          tab !== "events"
      ),
    [posts, tab]
  );

  return (
    <Page
      topColor={colors.surface}
      onRefresh={() => void load(true, false)}
      refreshing={refreshing}
      onScroll={onScroll}
    >
      <View style={localStyles.headerBlock}>
        <View style={styles.row}>
          <Text style={localStyles.brandTitle}>Mabiz</Text>

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
          style={[
            styles.rowBetween,
            {
              paddingVertical: 10,
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: colors.border,
            },
          ]}
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

      {loading ? <LoadingState label="Loading feed from the server" /> : null}

      {!loading &&
      !error &&
      posts.length === 0 &&
      tab !== "polls" &&
      tab !== "events" ? (
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
      ) : null}

      {visiblePosts.map((post) => (
        <ApiPostCard
          key={post.id}
          post={post}
          onOpenComments={() => setCommentsPost(post)}
        />
      ))}

      {!loading && tab === "polls" ? (
        <EmptyState
          title="No polls yet"
          detail="Polls from people and businesses will appear here."
          icon="bar-chart-outline"
        />
      ) : null}

      {!loading && tab === "events" ? (
        <EmptyState
          title="No events yet"
          detail="Upcoming events will appear here."
          icon="calendar-outline"
        />
      ) : null}

      {loadingMore ? <LoadingState label="Loading more posts" /> : null}

      {!loading && posts.length > 0 && !cursor && !loadingMore ? (
        <Text style={[styles.caption, { textAlign: "center" }]}>
          You're all caught up.
        </Text>
      ) : null}

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
    headerBlock: {
      marginHorizontal: -16,
      marginTop: -10,
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
      color: colors.navy,
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
    chipRow: {
      flexDirection: "row",
      gap: 8,
      paddingRight: 16,
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: colors.subtle,
    },
    chipSelected: {
      backgroundColor: colors.navy,
    },
    chipText: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.ink,
    },
    chipTextSelected: {
      color: colors.white,
    },
    storiesRow: {
      flexDirection: "row",
      gap: 10,
      paddingVertical: 4,
    },
    createTile: {
      backgroundColor: colors.subtle,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    createPlus: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.emerald,
      alignItems: "center",
      justifyContent: "center",
    },
    createLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.ink,
      textAlign: "center",
    },
    storyPlus: {
      position: "absolute",
      right: -2,
      bottom: -2,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.emerald,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: colors.white,
    },
    trendRow: {
      flexDirection: "row",
      gap: 8,
      paddingRight: 16,
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
    createButton: {
      width: 34,
      height: 34,
      alignSelf: "center",
      alignItems: "center",
      justifyContent: "center",
    },
    updatesSection: {
      gap: 12,
      paddingBottom: 14,
      marginHorizontal: -16,
      paddingHorizontal: 16,
      borderBottomWidth: 6,
      borderBottomColor: colors.canvas,
    },
    updateTile: {
      width: 88,
      height: 112,
      borderRadius: 14,
      overflow: "hidden",
      backgroundColor: colors.navy,
    },
    updateScrim: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 64,
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    updateAvatarWrap: {
      position: "absolute",
      top: 10,
      left: 0,
      right: 0,
      alignItems: "center",
    },
    updateTitle: {
      position: "absolute",
      left: 6,
      right: 6,
      bottom: 8,
      color: colors.white,
      fontSize: 12,
      fontWeight: "700",
      textAlign: "center",
    },
  })
);