import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
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
import { colors } from "@/theme/tokens";
import type { FeedFilters } from "@/lib/api/feature-contracts";
import type { Post } from "@/types/domain";
import { useThemeContext } from "@/lib/theme-provider";

function FeedPill({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  useThemeContext();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        paddingHorizontal: 16,
        paddingVertical: 9,
        borderRadius: 999,
        backgroundColor: selected ? colors.ink : colors.emeraldTint,
      }}
    >
      <Text style={{ fontSize: 13, fontWeight: "700", color: selected ? colors.canvas : colors.emeraldDark }}>{label}</Text>
    </Pressable>
  );
}

function ComposerAction({
  title,
  icon,
  background,
  foreground,
  onPress,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  background: string;
  foreground: string;
  onPress: () => void;
}) {
  useThemeContext();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: 42,
        borderRadius: 14,
        backgroundColor: background,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      }}
    >
      <Ionicons name={icon} size={17} color={foreground} />
      <Text style={{ color: foreground, fontSize: 13, fontWeight: "700" }}>{title}</Text>
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

  const updates = useMemo(() => {
    const seen = new Set<string>();
    const items: { businessId: string; postId: string; name: string; logo?: string; cover?: string }[] = [];
    for (const post of posts) {
      if (post.identityKind !== "business" || seen.has(post.identityId)) continue;
      const business = app.businesses.find((item) => item.id === post.identityId);
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
    <Page topColor={colors.surface} onRefresh={() => void load(true, false)} refreshing={refreshing} onScroll={onScroll}>
      <View
        style={{
          marginHorizontal: -16,
          marginTop: -10,
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: 16,
          gap: 12,
          backgroundColor: colors.surface,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
        }}
      >
        <View style={styles.row}>
          <Image
            source={require("../../assets/images/splash-icon.png")}
            style={{ width: 32, height: 32, borderRadius: 9 }}
            contentFit="contain"
            accessibilityLabel="Mabiz logo"
          />
          <Text style={{ flex: 1, fontSize: 22, fontWeight: "800", letterSpacing: -0.4, color: colors.ink }}>Mabiz</Text>
         
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hasUnread ? `Notifications, ${unreadCount} unread` : "Notifications"}
            onPress={() => router.push("/menu/activity/notifications")}
            style={{
              width: 40,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.ink} />
            {hasUnread ? (
              <View
                style={{
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
                }}
              >
                <Text style={{ color: colors.white, fontSize: 10, fontWeight: "800" }}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>
        <View style={styles.row}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Search businesses, people, topics"
            onPress={() => router.push("/search")}
            style={{
              flex: 1,
              height: 46,
              borderRadius: 16,
              paddingHorizontal: 14,
              backgroundColor: colors.subtle,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <Ionicons name="search-outline" size={18} color={colors.emeraldDark} />
            <Text numberOfLines={1} style={{ flex: 1, color: colors.muted, fontSize: 14 }}>
              Search businesses, people, topics
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="More navigation options"
            onPress={() => setQuickMenu((value) => !value)}
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: colors.ink,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="options-outline" size={20} color={colors.canvas} />
          </Pressable>
        </View>
        <View style={styles.row}>
          <FeedPill label="For You" selected={mode === "for-you"} onPress={() => setMode("for-you")} />
          <FeedPill label="Following" selected={mode === "following"} onPress={() => setMode("following")} />
        </View>
      </View>
      {quickMenu ? (
        <View style={[styles.row, { flexWrap: "wrap" }]}>
          <Button title="Messages" small variant="outline" onPress={() => router.push("/messages")} />
          <Text style={styles.caption}>{hasUnread ? "You have unread notifications" : ""}</Text>
        </View>
      ) : null}
      <View style={{ gap: 12 }}>
        <SectionTitle title="Business updates" action="View all" onAction={() => router.push("/(tabs)/stories")} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add update"
            onPress={() => router.push("/(tabs)/create")}
            style={{
              width: 92,
              height: 124,
              borderRadius: 18,
              borderWidth: 1,
              borderStyle: "dashed",
              borderColor: colors.border,
              backgroundColor: colors.surface,
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: colors.emeraldFill,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="add" size={24} color={colors.white} />
            </View>
            <Text style={{ color: colors.ink, fontSize: 12, fontWeight: "700" }}>Add update</Text>
          </Pressable>
          {updates.map((item) => (
            <Pressable
              key={item.businessId}
              accessibilityRole="button"
              accessibilityLabel={`Open update from ${item.name}`}
              onPress={() => router.push({ pathname: "/post/[id]", params: { id: item.postId } })}
              style={{ width: 92, height: 124, borderRadius: 18, overflow: "hidden", backgroundColor: colors.navy }}
            >
              {item.cover ? (
                <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
                  <MediaImage uri={item.cover} height={124} label={item.name} />
                </View>
              ) : null}
              <View
                pointerEvents="none"
                style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 64, backgroundColor: "rgba(0,0,0,0.45)" }}
              />
              <View style={{ position: "absolute", top: 8, left: 8 }}>
                <Avatar name={item.name} image={item.logo} size={26} ring />
              </View>
              <Text
                numberOfLines={2}
                style={{ position: "absolute", left: 8, right: 8, bottom: 8, color: colors.white, fontSize: 12, fontWeight: "700" }}
              >
                {item.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <View style={[styles.card, { padding: 14, gap: 12, marginBottom: 0 }]}>
        <View style={styles.row}>
          <Avatar name={app.user.name} image={app.user.avatar} size={42} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Post an update, offer or product"
            onPress={() => router.push("/(tabs)/create")}
            style={{
              flex: 1,
              minHeight: 42,
              borderRadius: 14,
              paddingHorizontal: 14,
              backgroundColor: colors.subtle,
              justifyContent: "center",
            }}
          >
            <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 14 }}>
              Post an update, offer or product
            </Text>
          </Pressable>
        </View>
        <View style={styles.row}>
          <ComposerAction
            title="Photo"
            icon="image-outline"
            background={colors.emeraldTint}
            foreground={colors.emeraldDark}
            onPress={() => router.push("/(tabs)/create")}
          />
          <ComposerAction
            title="Video"
            icon="videocam-outline"
            background={colors.orangeTint}
            foreground={colors.warning}
            onPress={() => router.push("/(tabs)/create")}
          />
          <ComposerAction
            title="Offer"
            icon="pricetag-outline"
            background={colors.subtle}
            foreground={colors.ink}
            onPress={() => router.push("/(tabs)/create")}
          />
        </View>
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
        <Text style={[styles.caption, { textAlign: "center" }]}>You're all caught up.</Text>
      ) : null}
    </Page>
  );
} 