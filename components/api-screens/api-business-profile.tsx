import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Image,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  EmptyState,
  LoadingState,
  Page,
  TopBar,
  styles,
} from "@/components/biz-ui";
import { ApiPostCard } from "@/components/api-post-card";
import { SquareAvatar } from "@/components/square-avatar";
import {
  FaqSection,
  OpportunitiesSection,
  OverviewSection,
  ServicesSection,
  StorySection,
  TeamSection,
} from "@/components/business-profile-sections";
import { useAppStore } from "@/hooks/use-app-store";
import { useMabizServices } from "@/lib/services/service-provider";
import { pageRequest } from "@/lib/api-helpers";
import { colors, createThemedStyles } from "@/theme/tokens";
import type { Business, Post } from "@/types/domain";
import { useThemeContext } from "@/lib/theme-provider";
import { InlineError } from "./inline-error";

type MainTab = "posts" | "about" | "services" | "more";
type AboutTab = "overview" | "team" | "opportunities" | "faq";

const MAIN_TABS: { key: MainTab; label: string }[] = [
  { key: "posts", label: "Posts" },
  { key: "about", label: "About" },
  { key: "services", label: "Services" },
  { key: "more", label: "More" },
];

const ABOUT_TABS: { key: AboutTab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "team", label: "Team" },
  { key: "opportunities", label: "Opportunities" },
  { key: "faq", label: "FAQ" },
];

const formatCount = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(value);
};

export function ApiBusinessProfile({ businessId }: { businessId: string }) {
  useThemeContext();
  const services = useMabizServices();
  const app = useAppStore();
  const [business, setBusiness] = useState<Business | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);
  const [followBusy, setFollowBusy] = useState(false);
  const [messageBusy, setMessageBusy] = useState(false);
  const [businessError, setBusinessError] = useState(false);
  const [postsError, setPostsError] = useState(false);
  const [actionError, setActionError] = useState("");
  const [tab, setTab] = useState<MainTab>("posts");
  const [aboutTab, setAboutTab] = useState<AboutTab>("overview");
  const [bioExpanded, setBioExpanded] = useState(false);
    const [showAllPosts, setShowAllPosts] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setBusinessError(false);
    setPostsError(false);
    const [businessResult, postsResult, followResult] = await Promise.all([
      services.businesses.get(businessId),
      services.posts.listBusinessPosts(businessId, pageRequest()),
      services.businesses.getFollowStatus(businessId),
    ]);
    if (!businessResult.ok) setBusinessError(true);
    else setBusiness(businessResult.data);
    if (!postsResult.ok) setPostsError(true);
    else setPosts(postsResult.data.items);
    if (followResult.ok) {
      setFollowing(followResult.data.following);
      setFollowerCount(followResult.data.followerCount);
    }
    setLoading(false);
  }, [businessId, services]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleFollow = async () => {
    if (!app.isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    if (followBusy) return;
    const wasFollowing = following;
    const prevCount = followerCount;
    const base = prevCount ?? business?.followers;
    setFollowBusy(true);
    setActionError("");
    setFollowing(!wasFollowing);
    if (typeof base === "number")
      setFollowerCount(Math.max(0, base + (wasFollowing ? -1 : 1)));
    const result = wasFollowing
      ? await services.businesses.unfollow(businessId)
      : await services.businesses.follow(businessId);
    if (!result.ok) {
      setFollowing(wasFollowing);
      setFollowerCount(prevCount);
      setActionError("Couldn't update follow. Please try again.");
    } else {
      const status = await services.businesses.getFollowStatus(businessId);
      if (status.ok) {
        setFollowing(status.data.following);
        setFollowerCount(status.data.followerCount);
      }
    }
    setFollowBusy(false);
  };

  const startEnquiry = async () => {
    if (!app.isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    if (messageBusy) return;
    setMessageBusy(true);
    setActionError("");
    const result = await services.messaging.startConversation({
      businessId,
      firstMessage: "Hello, I would like to learn more about your business.",
    });
    if (!result.ok)
      setActionError("Couldn't start the conversation. Please try again.");
    else
      router.push({ pathname: "/messages/[id]", params: { id: result.data.id } });
    setMessageBusy(false);
  };

  const openFollowers = () =>
    router.push({ pathname: "/menu/followers", params: { businessId } });

  const shareBusiness = () => {
    if (!business) return;
    void Share.share({ message: `Check out ${business.name} on Mabiz.` });
  };

  const cover = business
    ? (business as { cover?: string; banner?: string }).cover ??
      (business as { cover?: string; banner?: string }).banner
    : undefined;

  const stats = business
    ? [
        {
          icon: "people" as const,
          value: formatCount(followerCount ?? business.followers),
          label: "Followers",
          onPress: openFollowers,
        },
        {
          icon: "image" as const,
          value: formatCount(posts.length),
          label: "Posts",
          onPress: undefined,
        },
        {
          icon: "star" as const,
          value: typeof business.rating === "number" ? business.rating.toFixed(1) : "-",
          label: "Rating",
          onPress: undefined,
        },
      ]
    : [];

  return (
    <Page onRefresh={() => void load()} refreshing={loading}>
      {!business ? <TopBar title="Business profile" back /> : null}

      {loading && !business ? (
        <LoadingState label="Loading business profile" />
      ) : null}

      {!loading && !business && businessError ? (
        <InlineError
          message="Couldn't load this business. Check your connection and try again."
          onRetry={() => void load()}
        />
      ) : null}

      {business ? (
        <>
          {tab !== "about" ? (
          <View style={localStyles.profileBand}>
            <View style={localStyles.cover}>
              {cover ? (
                <Image source={{ uri: cover }} style={localStyles.coverImage} resizeMode="cover" />
              ) : (
                <View style={localStyles.coverPlaceholder} />
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back"
                onPress={() => router.back()}
                hitSlop={8}
                style={[localStyles.roundButton, { left: 12 }]}
              >
                <Ionicons name="arrow-back" size={20} color={colors.white} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Share business"
                onPress={shareBusiness}
                hitSlop={8}
                style={[localStyles.roundButton, { right: 12 }]}
              >
                <Ionicons name="ellipsis-horizontal" size={20} color={colors.white} />
              </Pressable>
            </View>

            <View style={localStyles.body}>
              <View style={localStyles.identityRow}>
                <View style={localStyles.logoWrap}>
                  <SquareAvatar name={business.name} image={business.logo} size={88} />
                </View>
                <View style={localStyles.identityInfo}>
                  <View style={localStyles.nameRow}>
                    <View style={localStyles.nameInline}>
                      <Text style={localStyles.name} numberOfLines={1}>
                        {business.name}
                      </Text>
                      {business.verified ? (
                        <Ionicons name="checkmark-circle" size={18} color={colors.emerald} />
                      ) : null}
                    </View>
                    {business.verified ? (
                      <View style={localStyles.verifiedPill}>
                        <Text style={localStyles.verifiedText}>Verified Business</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.caption} numberOfLines={1}>
                    {business.category}
                  </Text>
                  <View style={localStyles.locationRow}>
                    <Ionicons name="location" size={14} color={colors.muted} />
                    <Text style={localStyles.locationText} numberOfLines={1}>
                      {business.town}, {business.county}
                    </Text>
                  </View>
                </View>
              </View>

              {business.description ? (
                <View style={{ gap: 4 }}>
                  <Text
                    style={styles.body}
                    numberOfLines={bioExpanded ? undefined : 2}
                  >
                    {business.description}
                  </Text>
                  {business.description.length > 90 ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setBioExpanded((value) => !value)}
                      style={localStyles.seeMore}
                    >
                      <Text style={localStyles.seeMoreText}>
                        {bioExpanded ? "See less" : "See more"}
                      </Text>
                      <Ionicons
                        name={bioExpanded ? "chevron-up" : "chevron-down"}
                        size={14}
                        color={colors.emerald}
                      />
                    </Pressable>
                  ) : null}
                </View>
              ) : null}

              <View style={localStyles.actionRow}>
                <View style={localStyles.statsCard}>
                  {stats.map((stat, index) => {
                    const content = (
                      <>
                        <Ionicons name={stat.icon} size={13} color={colors.muted} />
                        <Text style={localStyles.statValue}>{stat.value}</Text>
                        <Text style={localStyles.statLabel}>{stat.label}</Text>
                      </>
                    );
                    return (
                      <View
                        key={stat.label}
                        style={[
                          localStyles.statCell,
                          index > 0 && localStyles.statDivider,
                        ]}
                      >
                        {stat.onPress ? (
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={`${stat.value} ${stat.label}`}
                            onPress={stat.onPress}
                            style={localStyles.statInner}
                          >
                            {content}
                          </Pressable>
                        ) : (
                          <View style={localStyles.statInner}>{content}</View>
                        )}
                      </View>
                    );
                  })}
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={following ? "Unfollow" : "Follow"}
                  disabled={followBusy}
                  onPress={() => void toggleFollow()}
                  style={[
                    localStyles.bigButton,
                    following ? localStyles.followingButton : localStyles.followButton,
                    followBusy && { opacity: 0.6 },
                  ]}
                >
                  <Ionicons
                    name={following ? "checkmark" : "person-add"}
                    size={16}
                    color={following ? colors.emerald : colors.white}
                  />
                  <Text
                    style={[
                      localStyles.bigButtonText,
                      { color: following ? colors.emerald : colors.white },
                    ]}
                  >
                    {following ? "Following" : "Follow"}
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Message"
                  disabled={messageBusy}
                  onPress={() => void startEnquiry()}
                  style={[
                    localStyles.bigButton,
                    localStyles.messageButton,
                    messageBusy && { opacity: 0.6 },
                  ]}
                >
                  <Ionicons name="paper-plane-outline" size={16} color={colors.emerald} />
                  <Text style={[localStyles.bigButtonText, { color: colors.emerald }]}>
                    Message
                  </Text>
                </Pressable>
              </View>

              {actionError ? (
                <Text
                  accessibilityRole="alert"
                  style={[styles.caption, { color: colors.danger }]}
                >
                  {actionError}
                </Text>
              ) : null}
            </View>

            <View accessibilityRole="tablist" style={localStyles.tabBar}>
              {MAIN_TABS.map((item) => {
                const selected = tab === item.key;
                return (
                  <Pressable
                    key={item.key}
                    accessibilityRole="tab"
                    accessibilityState={{ selected }}
                    onPress={() => setTab(item.key)}
                    style={[localStyles.tabItem, selected && localStyles.tabItemSelected]}
                  >
                    <Text style={[localStyles.tabLabel, selected && localStyles.tabLabelSelected]}>
                      {item.label}
                    </Text>
                    {item.key === "more" ? (
                      <Ionicons name="chevron-down" size={14} color={colors.muted} />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
          ) : (
            <View style={localStyles.standaloneHeader}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back to profile"
                onPress={() => setTab("posts")}
                hitSlop={8}
                style={localStyles.standaloneButton}
              >
                <Ionicons name="chevron-back" size={24} color={colors.ink} />
              </Pressable>
              <Text style={localStyles.standaloneTitle}>Business Profile</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Share business"
                onPress={shareBusiness}
                hitSlop={8}
                style={localStyles.standaloneButton}
              >
                <Ionicons name="ellipsis-horizontal" size={22} color={colors.ink} />
              </Pressable>
            </View>
          )}

          <View style={localStyles.content}>
            {tab === "posts" ? (
              <>
                <View style={localStyles.postsTitleRow}>
                  <Text style={localStyles.postsTitle}>
                    Posts {"\u00B7"} {posts.length}
                  </Text>
                  {posts.length > 3 ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setShowAllPosts((value) => !value)}
                      hitSlop={8}
                    >
                      <Text style={localStyles.seeMoreText}>
                        {showAllPosts ? "Show less" : "See all >"}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
                {postsError ? (
                  <InlineError
                    message="Couldn't load posts."
                    onRetry={() => void load()}
                  />
                ) : posts.length ? (
                  (showAllPosts ? posts : posts.slice(0, 3)).map((post) => (
                    <ApiPostCard key={post.id} post={post} hideBusinessLink />
                  ))
                ) : (
                  <EmptyState
                    title="No posts yet"
                    detail="Business posts that are visible to you will appear here."
                    icon="grid-outline"
                  />
                )}
              </>
            ) : null}

            {tab === "about" ? (
              <>
                <View style={localStyles.aboutTabRow}>
                  {ABOUT_TABS.map((item) => {
                    const selected = aboutTab === item.key;
                    return (
                      <Pressable
                        key={item.key}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        onPress={() => setAboutTab(item.key)}
                        style={[localStyles.aboutPill, selected && localStyles.aboutPillSelected]}
                      >
                        <Text
                          numberOfLines={1}
                          style={[
                            localStyles.aboutPillText,
                            selected && localStyles.aboutPillTextSelected,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                {aboutTab === "overview" ? (
                  <OverviewSection
                    business={business}
                    onSeeTeam={() => setAboutTab("team")}
                    onSeeOffers={() => setTab("services")}
                  />
                ) : null}
                {aboutTab === "team" ? <TeamSection /> : null}
                {aboutTab === "opportunities" ? <OpportunitiesSection /> : null}
                {aboutTab === "faq" ? <FaqSection /> : null}
              </>
            ) : null}

            {tab === "services" ? <ServicesSection business={business} /> : null}
            {tab === "more" ? <StorySection /> : null}
          </View>
        </>
      ) : null}
    </Page>
  );
}

const localStyles = createThemedStyles(() =>
  StyleSheet.create({
    profileBand: {
      marginHorizontal: -16,
      marginTop: -10,
      backgroundColor: colors.surface,
    },
    cover: {
      width: "100%",
      height: 190,
      backgroundColor: colors.subtle,
      overflow: "hidden",
    },
    coverImage: { width: "100%", height: "100%" },
    coverPlaceholder: { flex: 1, backgroundColor: colors.emeraldTint },
    roundButton: {
      position: "absolute",
      top: 12,
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: "rgba(0, 0, 0, 0.45)",
      alignItems: "center",
      justifyContent: "center",
    },
    body: { paddingHorizontal: 16, gap: 12, paddingBottom: 12 },
    identityRow: { flexDirection: "row", gap: 12 },
    logoWrap: {
      marginTop: -44,
      padding: 4,
      borderRadius: 24,
      backgroundColor: colors.surface,
      alignSelf: "flex-start",
      shadowColor: "#000000",
      shadowOpacity: 0.12,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 4,
    },
    identityInfo: { flex: 1, paddingTop: 8, gap: 3 },
    nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    nameInline: { flex: 1, flexDirection: "row", alignItems: "center", gap: 5 },
    name: { flexShrink: 1, fontSize: 19, fontWeight: "800", color: colors.ink },
    verifiedPill: {
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: colors.emeraldTint,
    },
    verifiedText: { fontSize: 11, fontWeight: "700", color: colors.emeraldDark },
    locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    locationText: { flex: 1, fontSize: 13, fontWeight: "600", color: colors.ink },
    seeMore: { flexDirection: "row", alignItems: "center", gap: 4, alignSelf: "flex-start" },
    seeMoreText: { fontSize: 14, fontWeight: "700", color: colors.emerald },
    actionRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    statsCard: {
      flex: 1.7,
      flexDirection: "row",
      borderRadius: 12,
      backgroundColor: colors.subtle,
      paddingVertical: 6,
    },
    statCell: { flex: 1 },
    statDivider: {
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: colors.border,
    },
    statInner: { alignItems: "center", gap: 1, paddingVertical: 1 },
    statValue: { fontSize: 13, fontWeight: "800", color: colors.ink },
    statLabel: { fontSize: 10, color: colors.muted },
    bigButton: {
      flex: 1,
      minHeight: 44,
      paddingHorizontal: 6,
      borderRadius: 10,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
    },
    followButton: { backgroundColor: colors.emerald },
    followingButton: {
      backgroundColor: colors.emeraldTint,
      borderWidth: 1.5,
      borderColor: colors.emerald,
    },
    messageButton: { borderWidth: 1.5, borderColor: colors.emerald },
    bigButtonText: { fontSize: 11, fontWeight: "800" },
    tabBar: {
      flexDirection: "row",
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    tabItem: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      paddingVertical: 13,
      borderBottomWidth: 3,
      borderBottomColor: "transparent",
    },
    tabItemSelected: { borderBottomColor: colors.emerald },
    tabLabel: { fontSize: 15, fontWeight: "600", color: colors.muted },
    tabLabelSelected: { fontWeight: "800", color: colors.emerald },
    content: { gap: 12, paddingTop: 12 },
    postsTitle: { fontSize: 18, fontWeight: "800", color: colors.ink },
        postsTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    standaloneHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 8,
    },
    standaloneButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    standaloneTitle: { fontSize: 18, fontWeight: "800", color: colors.ink },
    aboutTabRow: { flexDirection: "row", gap: 8 },
    aboutPill: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 10,
      paddingHorizontal: 4,
      borderRadius: 12,
      backgroundColor: colors.subtle,
    },
    aboutPillSelected: { backgroundColor: colors.emerald },
    aboutPillText: { fontSize: 12, fontWeight: "700", color: colors.ink },
    aboutPillTextSelected: { color: colors.white },
  })
);