import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Avatar, Button, EmptyState, IconButton, LocalNote, Page, PostCard, SectionTitle, TopBar, styles } from "@/components/biz-ui";
import { HomeQuickMenu } from "@/components/home-quick-menu";
import { BUSINESSES, PEOPLE, STORIES } from "@/data/seed";
import { useAppStore } from "@/hooks/use-app-store";
import { useBizConnectServiceMode } from "@/lib/services/service-provider";
import { ApiHomeFeed } from "@/components/api-social-screens";
import { colors } from "@/theme/tokens";
import { t } from "@/i18n/translations";
import type { Post } from "@/types/domain";
import { filterVisiblePosts, profileRestriction } from "@/utils/privacy-policy";

export default function HomeScreen() {
  const apiMode = useBizConnectServiceMode() === "api";
  return apiMode ? <ApiHomeFeed /> : <MockHomeScreen />;
}
function MockHomeScreen() {
  const app = useAppStore();
  const [filter, setFilter] = useState<"For You" | "Following" | "Nearby">("For You");
  const [refreshing, setRefreshing] = useState(false);
  const [visibleCount, setVisibleCount] = useState(3);
  const [quickMenuVisible, setQuickMenuVisible] = useState(false);
  const hasUnreadNotifications = app.notifications.some((notification) => !notification.read);
  const posts = useMemo(() => {
    let visible = filterVisiblePosts(app.posts, { viewerId: app.user.id, people: [...PEOPLE.filter((person) => person.id !== app.user.id), app.user], businesses: app.businesses, blockedUserIds: app.blockedUsers, hiddenPostIds: app.hiddenPosts, followedPeople: app.followedPeople });
    if (filter === "Following") visible = visible.filter((p) => app.followedBusinesses.includes(p.identityId) || app.followedPeople.includes(p.authorId));
    if (filter === "Nearby") visible = visible.filter((p) => p.location.toLowerCase().includes(app.user.town.toLowerCase()) || app.businesses.some((b) => b.id === p.businessId && b.county === app.user.county));
    return visible;
  }, [app.posts, app.hiddenPosts, app.followedBusinesses, app.followedPeople, app.user, app.businesses, app.blockedUsers, filter]);
  const visibleStories = useMemo(() => STORIES.filter((story) => {
    const founder = PEOPLE.find((person) => person.id === story.founderId);
    const business = app.businesses.find((item) => item.id === story.businessId);
    if (app.blockedUsers.includes(story.founderId) || (business && app.blockedUsers.includes(business.ownerId))) return false;
    return !founder || !profileRestriction(founder, app.user.id, app.followedPeople, app.blockedUsers);
  }), [app.businesses, app.blockedUsers, app.user.id, app.followedPeople]);
  const refresh = () => { setRefreshing(true); setVisibleCount(3); setTimeout(() => setRefreshing(false), 600); };
  const loadMore = (event: import("react-native").NativeSyntheticEvent<import("react-native").NativeScrollEvent>) => { const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent; if (contentSize.height - layoutMeasurement.height - contentOffset.y < 80 && visibleCount < posts.length) setVisibleCount((count) => Math.min(count + 2, posts.length)); };
  const filters: typeof filter[] = ["For You", "Following", "Nearby"];
  const filterLabels = { "For You": t("forYou", app.settings.language), Following: t("following", app.settings.language), Nearby: t("nearby", app.settings.language) };

  return <Page onRefresh={refresh} refreshing={refreshing} onScroll={loadMore}>
    <TopBar brandNameOnly right={<View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <IconButton compact name="search-outline" label="Search" onPress={() => router.push("/search")} />
      <IconButton compact name="ellipsis-horizontal" label="More navigation options" badge={hasUnreadNotifications} onPress={() => setQuickMenuVisible(true)} />
      <Pressable accessibilityRole="button" accessibilityLabel="Open your profile" onPress={() => router.push("/(tabs)/profile")}>
        <Avatar name={app.user.name} image={app.user.avatar} size={32} />
      </Pressable>
    </View>} />
    <HomeQuickMenu visible={quickMenuVisible} onClose={() => setQuickMenuVisible(false)} hasUnreadNotifications={hasUnreadNotifications} />
    <LocalNote text={app.localNotice} />
    <SectionTitle title={t("businessStories", app.settings.language)} action={t("seeAll", app.settings.language)} onAction={() => router.push("/(tabs)/stories")} />
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 13, paddingBottom: 2 }}>
      {visibleStories.map((story, index) => {
        const person = PEOPLE.find((p) => p.id === story.founderId)!;
        return <Pressable accessibilityRole="button" key={story.id} onPress={() => router.push({ pathname: "/story/[id]", params: { id: story.id } })} style={{ alignItems: "center", gap: 6, width: 70 }}>
          <Avatar name={person.name} image={BUSINESSES.find((b) => b.id === story.businessId)?.logo} size={58} ring={index < 3} />
          <Text style={{ color: colors.ink, fontSize: 11, fontWeight: "600" }} numberOfLines={1}>{person.name.split(" ")[0]}</Text>
        </Pressable>;
      })}
      <Pressable accessibilityRole="button" onPress={() => router.push("/(tabs)/create")} style={{ width: 70, alignItems: "center", gap: 6 }}><View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: colors.orangeTint, alignItems: "center", justifyContent: "center" }}><Ionicons name="add" size={26} color={colors.orange} /></View><Text style={{ color: colors.ink, fontSize: 11 }}>Your story</Text></Pressable>
    </ScrollView>
    <View style={styles.rowBetween}><SectionTitle title={t("yourFeed", app.settings.language)} /><Pressable accessibilityRole="button" onPress={refresh}><Text style={{ color: colors.emerald, fontSize: 12, fontWeight: "700" }}>{refreshing ? "Refreshing…" : "↻ Refresh"}</Text></Pressable></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {filters.map((item) => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: filter === item }} onPress={() => setFilter(item)} style={{ paddingHorizontal: 15, paddingVertical: 9, borderRadius: 30, backgroundColor: filter === item ? colors.navy : colors.white, borderWidth: 1, borderColor: filter === item ? colors.navy : colors.border }}><Text style={{ fontSize: 12, fontWeight: "700", color: filter === item ? colors.white : colors.muted }}>{filterLabels[item]}</Text></Pressable>)}
    </ScrollView>
    {filter === "Nearby" ? <View style={styles.localNote}><Ionicons name="location-outline" size={15} color={colors.navySoft} /><Text style={styles.localNoteText}>Showing seed content near {app.user.town}. Precise location stays hidden.</Text><Button title="Choose area" variant="quiet" small onPress={() => router.push("/(tabs)/discover")} /></View> : null}
    {posts.slice(0, visibleCount).map((post: Post) => <PostCard key={post.id} post={post} />)}
    {!posts.length ? <EmptyState title={filter === "Following" ? "No posts from your circle yet" : filter === "Nearby" ? "No posts in this area yet" : "Your feed is just getting started"} detail={filter === "Following" ? "Follow a few businesses and founders to see their updates here." : filter === "Nearby" ? "Try another area or explore more local businesses." : "Follow local businesses and founders to shape your feed."} icon="people-outline" action="Explore businesses" onAction={() => router.push("/(tabs)/discover")} /> : null}
    {visibleCount < posts.length ? <Text style={styles.caption}>Scroll for more from your local feed.</Text> : posts.length ? <View style={{ alignItems: "center", paddingVertical: 6 }}><Text style={styles.caption}>You’re all caught up · sample posts are local demo content</Text></View> : null}
  </Page>;
}
