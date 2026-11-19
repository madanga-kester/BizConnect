import { Ionicons } from "@expo/vector-icons";
import { VideoView, useVideoPlayer } from "expo-video";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Platform, Pressable, Text, useWindowDimensions, View, type FlatListProps } from "react-native";
import { Avatar, Button, EmptyState, MediaImage, Page, TopBar, styles } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { PEOPLE } from "@/data/seed";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { colors } from "@/theme/tokens";
import type { Post } from "@/types/domain";
import { filterVisiblePosts } from "@/utils/privacy-policy";
import { canAutoplayVideo, resolveActiveVideoId } from "@/utils/video-playback";
import { useThemeContext } from "@/lib/theme-provider";

function VideoPost({ post, active }: { post: Post; active: boolean }) {
  useThemeContext();
  const app = useAppStore();
  const requireAuth = useRequireAuth();
  const { height: windowHeight } = useWindowDimensions();
  const business = app.businesses.find((item) => item.id === post.businessId);
  const player = useVideoPlayer(post.media ?? null, (instance) => { instance.loop = true; instance.pause(); });
  const [failed, setFailed] = useState(false);
  const height = Math.max(320, Math.min(510, windowHeight * 0.64));
  const autoplay = canAutoplayVideo(active, app.settings.autoplayVideos, app.settings.reducedData);

  useEffect(() => {
    if (autoplay && post.media) player.play();
    else player.pause();
  }, [autoplay, player, post.media]);

  useEffect(() => {
    const subscription = player.addListener("statusChange", (event) => {
      if (event.status === "error") setFailed(true);
    });
    return () => subscription.remove();
  }, [player]);

  const name = business?.name ?? (post.authorId === app.user.id ? app.user.name : PEOPLE.find((person) => person.id === post.authorId)?.name ?? "Mabiz member");
  const isLiked = app.likedPosts.includes(post.id);
  const mediaUri = post.media;

  return <View style={{ height, borderRadius: 22, backgroundColor: colors.navy, overflow: "hidden", position: "relative" }}>
    {mediaUri && !failed ? <VideoView
      player={player}
      style={{ width: "100%", height: "100%" }}
      contentFit="cover"
      nativeControls
      onFirstFrameRender={() => setFailed(false)}
    /> : <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 20 }}>
      <MediaImage uri={business?.cover} height={Math.min(230, height * 0.45)} label={name} />
      {mediaUri && failed ? <View style={{ flexDirection: "row", gap: 15 }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Retry video playback" onPress={() => { setFailed(false); player.play(); }}><Ionicons name="play-circle" size={40} color={colors.white} /></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Pause video" onPress={() => player.pause()}><Ionicons name="pause-circle" size={40} color={colors.white} /></Pressable>
      </View> : null}
      <Text style={{ color: colors.white, textAlign: "center" }}>{mediaUri ? "Video could not be loaded. Retry or choose another clip." : "Local mock video post · add a clip to play it here"}</Text>
    </View>}

    <View style={{ position: "absolute", left: 14, right: 14, bottom: 14, gap: 8, backgroundColor: "rgba(16,42,67,0.78)", padding: 12, borderRadius: 16 }}>
      <View style={styles.row}>
        <Avatar name={name} size={36} />
        <View style={{ flex: 1 }}><Text style={{ color: colors.white, fontWeight: "800" }}>{name}</Text><Text style={{ color: "#E6ECEF", fontSize: 11 }}>{post.location}</Text></View>
        {business ? <Button title={app.followedBusinesses.includes(business.id) ? "Following" : "Follow"} variant="soft" small onPress={() => requireAuth(() => app.toggleBusinessFollow(business.id))} /> : null}
      </View>
      <Text numberOfLines={2} style={{ color: colors.white, lineHeight: 19 }}>{post.caption}</Text>
      <View style={styles.row}>
        <Pressable accessibilityRole="button" accessibilityLabel={isLiked ? "Unlike video post" : "Like video post"} accessibilityHint="Sign in is required to save your like" onPress={() => requireAuth(() => app.toggleLike(post.id))}>
          <Ionicons name={isLiked ? "heart" : "heart-outline"} size={21} color={isLiked ? colors.orange : colors.white} />
        </Pressable>
        <Text style={{ color: colors.white }}>{post.likes + (isLiked ? 1 : 0)}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Open comments" onPress={() => router.push({ pathname: "/post/[id]", params: { id: post.id } })}><Ionicons name="chatbubble-outline" size={20} color={colors.white} /></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Report video" onPress={() => router.push({ pathname: "/report/[target]", params: { target: `video:${post.id}` } })}><Ionicons name="flag-outline" size={19} color={colors.white} /></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={business ? `Open ${business.name}` : `Open ${name}'s profile`} onPress={() => {
          if (business) router.push({ pathname: "/business/[id]", params: { id: business.id } });
          else if (post.authorId === app.user.id) router.push("/(tabs)/profile");
          else router.push({ pathname: "/person/[id]", params: { id: post.authorId } });
        }}>
          <Text style={{ color: colors.white, fontWeight: "700" }}>{business ? "View business →" : "View profile →"}</Text>
        </Pressable>
      </View>
    </View>
  </View>;
}

export default function VideosScreen() {
  useThemeContext();
  const app = useAppStore();
  const videos = useMemo(() => filterVisiblePosts(app.posts, {
    viewerId: app.user.id,
    people: [...PEOPLE.filter((person) => person.id !== app.user.id), app.user],
    businesses: app.businesses,
    blockedUserIds: app.blockedUsers,
    hiddenPostIds: app.hiddenPosts,
    followedPeople: app.followedPeople,
  }).filter((post) => post.video || post.kind === "video"), [app.posts, app.user, app.businesses, app.blockedUsers, app.hiddenPosts, app.followedPeople]);
  const [visibleVideoId, setVisibleVideoId] = useState<string | null>(null);
  const activeVideoId = resolveActiveVideoId(videos, visibleVideoId);
  const viewabilityConfig = useMemo(() => ({ itemVisiblePercentThreshold: 70 }), []);
  const onViewableItemsChanged = useCallback<NonNullable<FlatListProps<Post>["onViewableItemsChanged"]>>(({ viewableItems }) => {
    const visible = viewableItems.find((token) => token.isViewable)?.item;
    setVisibleVideoId(visible?.id ?? null);
  }, []);

  return <Page scroll={false}>
    <TopBar title="Business videos" back />
    <FlatList
      accessibilityLabel="Business video feed"
      data={videos}
      keyExtractor={(post) => post.id}
      renderItem={({ item }) => <VideoPost post={item} active={item.id === activeVideoId} />}
      contentContainerStyle={{ padding: 14, gap: 12, flexGrow: 1 }}
      ListHeaderComponent={<Text style={styles.caption}>Short clips from founders and businesses. Only visible clips play; autoplay also respects reduced-data mode.</Text>}
      ListEmptyComponent={<EmptyState title="Business videos are ready when you are" detail="Create a video post, choose a clip from your device and preview playback here. No sample movie is bundled or downloaded in the background." icon="videocam-outline" action="Create a video post" onAction={() => router.push("/(tabs)/create")} />}
      ListFooterComponent={<View style={{ gap: 10, paddingBottom: 12 }}><Button title="Video autoplay settings" variant="outline" icon="settings-outline" onPress={() => router.push("/menu/app-media/video-autoplay")} /><Text style={styles.caption}>Video clips play locally. Uploading and sharing beyond this device require a future API.</Text></View>}
      initialNumToRender={1}
      maxToRenderPerBatch={2}
      windowSize={3}
      updateCellsBatchingPeriod={50}
      removeClippedSubviews={Platform.OS === "android"}
      viewabilityConfig={viewabilityConfig}
      onViewableItemsChanged={onViewableItemsChanged}
    />
  </Page>;
}
