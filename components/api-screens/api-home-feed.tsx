import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  Avatar,
  Button,
  EmptyState,
  LoadingState,
  MediaImage,
  Page,
  SectionTitle,
  styles,
} from "@/components/biz-ui";
import { ApiPostCard } from "@/components/api-post-card";
import { useAppStore } from "@/hooks/use-app-store";
import { useNotificationSync } from "@/components/notification-sync";
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

function ComposerAction({
  title,
  icon,
  onPress,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  useThemeContext();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        localStyles.composerAction,
        pressed && { opacity: 0.6 },
      ]}
    >
      <Ionicons name={icon} size={20} color={colors.ink} />
      <Text style={localStyles.composerActionText}>{title}</Text>
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
  const [quickMenu, setQuickMenu] = useState(false);
  const notificationSync = useNotificationSync();
  const unreadCount = notificationSync.unreadCount;
  const hasUnread = unreadCount > 0;

  const load = useCallback(
    async (refresh = false, next = false) => {
      if (next && (!cursor || loadingMore)) return;
      if (refresh) setRefreshing(true);
      else if (next) setLoadingMore(true);
      else setLoading(true);
      setError("");
      const request: FeedFilters = {
        mode,
        limit: LIMIT,
        ...(next && cursor ? { cursor } : {}),
      };
      const result = await services.feed.list(request);
      if (!result.ok) setError(errorText(result.error));
      else {
        setPosts((current) =>
          refresh || !next
            ? result.data.items
            : [...current, ...result.data.items]
        );
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
    if (
      contentSize.height - layoutMeasurement.height - contentOffset.y < 100 &&
      cursor &&
      !loadingMore
    )
      void load(false, true);
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
          <Image
            source={require("../../assets/images/splash-icon.png")}
            style={localStyles.logo}
            contentFit="contain"
            accessibilityLabel="Mabiz logo"
          />
          <Text style={localStyles.brandTitle}>Mabiz</Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              hasUnread
                ? `Notifications, ${unreadCount} unread`
                : "Notifications"
            }
            onPress={() => router.push("/menu/activity/notifications")}
            style={localStyles.bellButton}
          >
            <Ionicons
              name="notifications-outline"
              size={24}
              color={colors.ink}
            />
            {hasUnread ? (
              <View style={localStyles.badge}>
                <Text style={localStyles.badgeText}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            ) : null}
          </Pressable>
        </View>

        <View style={styles.row}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Search businesses, people, topics"
            onPress={() => router.push("/search")}
            style={localStyles.searchBar}
          >
            <Ionicons name="search-outline" size={18} color={colors.muted} />
            <Text numberOfLines={1} style={localStyles.searchPlaceholder}>
              Search businesses, people, topics
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="More navigation options"
            onPress={() => setQuickMenu((value) => !value)}
            style={localStyles.filterButton}
          >
            <Ionicons name="options-outline" size={20} color={colors.ink} />
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

      {quickMenu ? (
        <View style={[styles.row, { flexWrap: "wrap" }]}>
          <Button
            title="Messages"
            small
            variant="outline"
            onPress={() => router.push("/messages")}
          />
          <Text style={styles.caption}>
            {hasUnread ? "You have unread notifications" : ""}
          </Text>
        </View>
      ) : null}

      <View style={localStyles.updatesSection}>
        <SectionTitle
          title="Business updates"
          action="View all"
          onAction={() => router.push("/(tabs)/stories")}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10 }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add update"
            onPress={() => router.push("/(tabs)/create")}
            style={localStyles.addUpdateTile}
          >
            <View style={localStyles.addUpdateCircle}>
              <Ionicons name="add" size={22} color={colors.ink} />
            </View>
            <Text style={localStyles.addUpdateLabel}>Add update</Text>
          </Pressable>

          {updates.map((item) => (
            <Pressable
              key={item.businessId}
              accessibilityRole="button"
              accessibilityLabel={`Open update from ${item.name}`}
              onPress={() =>
                router.push({
                  pathname: "/post/[id]",
                  params: { id: item.postId },
                })
              }
              style={localStyles.updateTile}
            >
              {item.cover ? (
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                  }}
                >
                  <MediaImage uri={item.cover} height={124} label={item.name} />
                </View>
              ) : null}
              <View pointerEvents="none" style={localStyles.updateScrim} />
              <View style={localStyles.updateAvatarWrap}>
                <Avatar name={item.name} image={item.logo} size={26} ring />
              </View>
              <Text numberOfLines={2} style={localStyles.updateTitle}>
                {item.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={localStyles.composerBand}>
        <View style={styles.row}>
          <Avatar name={app.user.name} image={app.user.avatar} size={40} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Post an update, offer or product"
            onPress={() => router.push("/(tabs)/create")}
            style={localStyles.composerPrompt}
          >
            <Text numberOfLines={1} style={localStyles.composerPromptText}>
              Post an update, offer or product
            </Text>
          </Pressable>
        </View>
        <View style={localStyles.composerActionsRow}>
          <ComposerAction
            title="Photo"
            icon="image-outline"
            onPress={() => router.push("/(tabs)/create")}
          />
          <ComposerAction
            title="Video"
            icon="videocam-outline"
            onPress={() => router.push("/(tabs)/create")}
          />
          <ComposerAction
            title="Offer"
            icon="pricetag-outline"
            onPress={() => router.push("/(tabs)/create")}
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
          action="Create a post"
          onAction={() => router.push("/(tabs)/create")}
        />
      ) : null}

      {posts.map((post) => (
        <ApiPostCard key={post.id} post={post} />
      ))}

      {loadingMore ? <LoadingState label="Loading more posts" /> : null}

      {!loading && posts.length > 0 && !cursor && !loadingMore ? (
        <Text style={[styles.caption, { textAlign: "center" }]}>
          You&apos;re all caught up.
        </Text>
      ) : null}
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
    logo: {
      width: 32,
      height: 32,
      borderRadius: 9,
    },
    brandTitle: {
      flex: 1,
      fontSize: 22,
      fontWeight: "800",
      letterSpacing: -0.4,
      color: colors.ink,
    },
    bellButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    badge: {
      position: "absolute",
      top: 2,
      right: 2,
      minWidth: 18,
      height: 18,
      paddingHorizontal: 4,
      borderRadius: 9,
      backgroundColor: colors.orange,
      alignItems: "center",
      justifyContent: "center",
    },
    badgeText: {
      color: colors.white,
      fontSize: 10,
      fontWeight: "800",
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
    filterButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
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
    updatesSection: {
      gap: 12,
      paddingBottom: 14,
      marginHorizontal: -16,
      paddingHorizontal: 16,
      borderBottomWidth: 6,
      borderBottomColor: colors.canvas,
    },
    addUpdateTile: {
      width: 92,
      height: 124,
      borderRadius: 14,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    addUpdateCircle: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.subtle,
      alignItems: "center",
      justifyContent: "center",
    },
    addUpdateLabel: {
      color: colors.ink,
      fontSize: 12,
      fontWeight: "600",
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
    composerBand: {
      marginHorizontal: -16,
      paddingHorizontal: 16,
      paddingBottom: 14,
      gap: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 6,
      borderBottomColor: colors.canvas,
    },
    composerPrompt: {
      flex: 1,
      minHeight: 40,
      justifyContent: "center",
    },
    composerPromptText: {
      color: colors.muted,
      fontSize: 14,
    },
    composerActionsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    composerAction: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 4,
    },
    composerActionText: {
      color: colors.ink,
      fontSize: 13,
      fontWeight: "600",
    },
  })
);