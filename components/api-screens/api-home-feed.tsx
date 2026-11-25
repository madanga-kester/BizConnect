import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  Button,
  EmptyState,
  LoadingState,
  Page,
  styles,
} from "@/components/biz-ui";
import { ApiPostCard } from "@/components/api-post-card";
import { HomeFlyout } from "@/components/home-flyout";
import { useAppStore } from "@/hooks/use-app-store";
import { useMabizServices } from "@/lib/services/service-provider";
import { LIMIT, errorText } from "@/lib/api-helpers";
import { colors, createThemedStyles } from "@/theme/tokens";
import type { FeedFilters } from "@/lib/api/feature-contracts";
import type { Post } from "@/types/domain";
import { useThemeContext } from "@/lib/theme-provider";

function FeedPill({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
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
    </Pressable>
  );
}

export function ApiHomeFeed() {
  useThemeContext();
  const services = useMabizServices();
  const app = useAppStore();
  const [mode, setMode] = useState<"for-you" | "following">("for-you");
  const [posts, setPosts] = useState<Post[]>([]);
  const [cursor, setCursor] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);


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
              Search
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

        <View style={localStyles.feedTabRow}>
          <FeedPill
            label="For You"
            selected={mode === "for-you"}
            onPress={() => setMode("for-you")}
          />
          <FeedPill
            label="Following"
            selected={mode === "following"}
            onPress={() => setMode("following")}
          />
        </View>
      </View>

  

      

     
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

      {!loading && !error && posts.length === 0 ? (
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

      {posts.map((post) => (
        <ApiPostCard key={post.id} post={post} />
      ))}

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
      fontSize: 22,
      fontWeight: "800",
      letterSpacing: -0.4,
      color: colors.ink,
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
      gap: 24,
      marginTop: 2,
    },
    feedTab: {
      paddingVertical: 10,
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
    },
    feedTabSelected: {
      borderBottomColor: colors.ink,
    },
    feedTabText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.muted,
    },
    feedTabTextSelected: {
      fontWeight: "700",
      color: colors.ink,
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
      width: 92,
      height: 124,
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
      top: 8,
      left: 8,
    },
    updateTitle: {
      position: "absolute",
      left: 8,
      right: 8,
      bottom: 8,
      color: colors.white,
      fontSize: 12,
      fontWeight: "700",
    },
    
  })
);