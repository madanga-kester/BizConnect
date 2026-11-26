import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Button,
  EmptyState,
  LoadingState,
  Page,
  styles,
} from "@/components/biz-ui";
import { ApiPostCard } from "@/components/api-post-card";
import { useAppStore } from "@/hooks/use-app-store";
import { useMabizServices } from "@/lib/services/service-provider";
import { pageRequest } from "@/lib/api-helpers";
import { colors, createThemedStyles } from "@/theme/tokens";
import type { Post, UserProfile } from "@/types/domain";
import { useThemeContext } from "@/lib/theme-provider";
import { InlineError } from "./inline-error";

type ProfileTab = "posts" | "videos" | "businesses" | "about";

interface BusinessAffiliation {
  id: string;
  name: string;
  category?: string;
  town?: string;
  logo?: string;
  role: string;
  relationship: "owner" | "employed" | "partner";
  verified?: boolean;
}

type ExtendedProfile = UserProfile & {
  banner: string;
  employmentStatus?:
    | "business_owner"
    | "employed"
    | "self_employed"
    | "open_to_work"
    | string;
  ownedBusinesses?: BusinessAffiliation[];
  employments?: BusinessAffiliation[];
};

export function ApiPersonProfile({ personId }: { personId: string }) {
  useThemeContext();
  const insets = useSafeAreaInsets();
  const services = useMabizServices();
  const app = useAppStore();

  const [person, setPerson] = useState<ExtendedProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<ProfileTab>("posts");

  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState<number | undefined>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);

  const [profileError, setProfileError] = useState(false);
  const [postsError, setPostsError] = useState(false);
  const [actionError, setActionError] = useState("");

  const isSelf = personId === app.user.id || personId === "me";

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      setProfileError(false);
      setPostsError(false);
      setActionError("");

      const profileId = isSelf ? "me" : personId;

      const [profileResult, postsResult, followResult] = await Promise.all([
        services.users.getProfile(profileId),
        services.posts.listUserPosts(profileId, pageRequest()),
        isSelf
          ? Promise.resolve(null)
          : services.users.getFollowStatus(personId),
      ]);

      if (!profileResult.ok) setProfileError(true);
      else setPerson(profileResult.data as ExtendedProfile);

      if (!postsResult.ok) setPostsError(true);
      else setPosts(postsResult.data.items);

      if (followResult?.ok) {
        setFollowing(followResult.data.following);
        setFollowerCount(followResult.data.followerCount);
      }

      setLoading(false);
      setRefreshing(false);
    },
    [isSelf, personId, services]
  );

  useEffect(() => {
    void load();
  }, [load]);

  const { regularPosts, videoPosts } = useMemo(() => {
    const videos: Post[] = [];
    const regular: Post[] = [];
    for (const item of posts) {
      const anyPost = item as Post & {
        videoUrl?: string;
        mediaType?: string;
        media?: Array<{ type?: string }>;
      };
      const isVideo =
        Boolean(anyPost.videoUrl) ||
        anyPost.mediaType === "video" ||
        anyPost.media?.some((m) => m.type === "video");
      if (isVideo) videos.push(item);
      else regular.push(item);
    }
    return { regularPosts: regular, videoPosts: videos };
  }, [posts]);

  const ownedBusinesses = person?.ownedBusinesses ?? [];
  const employments = person?.employments ?? [];
  const totalBusinesses = ownedBusinesses.length + employments.length;

  const toggleFollow = async () => {
    if (!app.isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    if (busy) return;

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const wasFollowing = following;
    const prevCount = followerCount;
    const base = prevCount ?? person?.followers;

    setBusy(true);
    setActionError("");
    setFollowing(!wasFollowing);

    if (typeof base === "number") {
      setFollowerCount(Math.max(0, base + (wasFollowing ? -1 : 1)));
    }

    const result = wasFollowing
      ? await services.users.unfollow(personId)
      : await services.users.follow(personId);

    if (!result.ok) {
      setFollowing(wasFollowing);
      setFollowerCount(prevCount);
      setActionError("Couldn't update follow. Tap to retry.");
    } else {
      const status = await services.users.getFollowStatus(personId);
      if (status.ok) {
        setFollowing(status.data.following);
        setFollowerCount(status.data.followerCount);
      }
    }
    setBusy(false);
  };

  const handleShare = async () => {
    if (!person) return;
    try {
      await Share.share({
        message: `${person.name} (@${person.username}) on Mabiz`,
      });
    } catch {
      // Dismissed
    }
  };

  const openList = (tab: "Followers" | "Following") => {
    router.push({
      pathname: "/menu/followers",
      params: isSelf ? { tab } : { personId, tab },
    });
  };

  const openBusiness = (businessId: string) => {
    router.push(`/business/${businessId}` as never);
  };

  const switchTab = (tab: ProfileTab) => {
    if (tab === activeTab) return;
    void Haptics.selectionAsync();
    setActiveTab(tab);
  };

  const tabs: Array<{
    id: ProfileTab;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    activeIcon: keyof typeof Ionicons.glyphMap;
    count?: number;
  }> = [
    {
      id: "posts",
      label: "Posts",
      icon: "grid-outline",
      activeIcon: "grid",
      count: regularPosts.length,
    },
    {
      id: "videos",
      label: "Videos",
      icon: "videocam-outline",
      activeIcon: "videocam",
      count: videoPosts.length,
    },
    {
      id: "businesses",
      label: "Businesses",
      icon: "briefcase-outline",
      activeIcon: "briefcase",
      count: totalBusinesses,
    },
    {
      id: "about",
      label: "About",
      icon: "information-circle-outline",
      activeIcon: "information-circle",
    },
  ];

  // Extends full width and all the way up behind the status bar
  const bannerHeight = 190 + insets.top;

  return (
    <Page onRefresh={() => void load(true)} refreshing={refreshing}>
      {/* Floating Back Button over Full-Bleed Top Banner */}
      <View
        pointerEvents="box-none"
        style={[localStyles.floatingTopControls, { top: insets.top + 8 }]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={localStyles.floatingBackBtn}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
      </View>

      {loading && !person ? (
        <View style={{ paddingTop: insets.top + 60 }}>
          <LoadingState label="Loading profile" />
        </View>
      ) : null}

      {!loading && !person && profileError ? (
        <View style={[localStyles.centeredState, { paddingTop: insets.top + 80 }]}>
          <InlineError
            message="Couldn't load this profile. Check your connection and try again."
            onRetry={() => void load()}
          />
        </View>
      ) : null}

      {person ? (
        <>
          {/* Full-Bleed Banner Extending All the Way Up */}
          <View style={[localStyles.bannerWrap, { height: bannerHeight }]}>
            <Image
              source={{ uri: person.banner }}
              style={localStyles.bannerImg}
              resizeMode="cover"
            />
          </View>

          {/* Identity Header */}
          <View style={localStyles.headerBody}>
            <View style={localStyles.avatarAndActionsRow}>
              <View style={localStyles.avatarRing}>
                {person.avatar ? (
                  <Image
                    source={{ uri: person.avatar }}
                    style={localStyles.avatarImg}
                  />
                ) : (
                  <View style={localStyles.avatarFallback}>
                    <Text style={localStyles.avatarInitials}>
                      {person.name.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>

              <View style={localStyles.topActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Share profile"
                  onPress={() => void handleShare()}
                  style={localStyles.secondaryIconBtn}
                >
                  <Ionicons
                    name="share-outline"
                    size={20}
                    color={colors.text}
                  />
                </Pressable>

                {isSelf ? (
                  <Button
                    title="Edit profile"
                    variant="soft"
                    onPress={() =>
                      router.push("/menu/account/edit-profile" as never)
                    }
                  />
                ) : (
                  <Button
                    title={following ? "Following" : "Follow"}
                    variant={following ? "soft" : "primary"}
                    disabled={busy}
                    onPress={() => void toggleFollow()}
                  />
                )}
              </View>
            </View>

            {/* Name, Handle & Location */}
            <View style={localStyles.identityBlock}>
              <Text style={localStyles.displayName}>{person.name}</Text>
              <Text style={localStyles.handleText}>
                @{person.username} · {person.town}, {person.county}
              </Text>
            </View>

            {/* Bio */}
            {person.bio ? (
              <Text style={localStyles.bioText}>{person.bio}</Text>
            ) : null}

            {/* Primary Business / Work Highlight Strip */}
            {(ownedBusinesses.length > 0 ||
              employments.length > 0 ||
              person.employmentStatus) && (
              <Pressable
                onPress={() => switchTab("businesses")}
                style={localStyles.workSummaryBar}
              >
                <View style={localStyles.workSummaryLeft}>
                  <Text style={localStyles.workSummaryEyebrow}>
                    {ownedBusinesses.length > 0
                      ? "BUSINESS OWNER"
                      : employments.length > 0
                      ? "CURRENTLY EMPLOYED"
                      : "WORK STATUS"}
                  </Text>
                  <Text numberOfLines={1} style={localStyles.workSummaryTitle}>
                    {ownedBusinesses.length > 0
                      ? `${ownedBusinesses[0].name}${
                          ownedBusinesses.length > 1
                            ? ` + ${ownedBusinesses.length - 1} more`
                            : ""
                        }`
                      : employments.length > 0
                      ? `${employments[0].role} · ${employments[0].name}`
                      : person.employmentStatus === "open_to_work"
                      ? "Open to Work & Partnerships"
                      : "Self-Employed"}
                  </Text>
                </View>
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={colors.text}
                />
              </Pressable>
            )}

            {/* Inline Stats */}
            <View style={localStyles.statsRow}>
              <Pressable
                onPress={() => openList("Followers")}
                style={localStyles.statItem}
              >
                <Text style={localStyles.statValue}>
                  {followerCount ?? person.followers}
                </Text>
                <Text style={localStyles.statLabel}>Followers</Text>
              </Pressable>

              <Pressable
                onPress={() => openList("Following")}
                style={localStyles.statItem}
              >
                <Text style={localStyles.statValue}>{person.following}</Text>
                <Text style={localStyles.statLabel}>Following</Text>
              </Pressable>

              <Pressable
                onPress={() => switchTab("businesses")}
                style={localStyles.statItem}
              >
                <Text style={localStyles.statValue}>{totalBusinesses}</Text>
                <Text style={localStyles.statLabel}>Businesses</Text>
              </Pressable>

              <Pressable
                onPress={() => switchTab("posts")}
                style={localStyles.statItem}
              >
                <Text style={localStyles.statValue}>{posts.length}</Text>
                <Text style={localStyles.statLabel}>Posts</Text>
              </Pressable>
            </View>

            {actionError ? (
              <Pressable onPress={() => void toggleFollow()}>
                <Text
                  accessibilityRole="alert"
                  style={[styles.caption, localStyles.errorText]}
                >
                  {actionError}
                </Text>
              </Pressable>
            ) : null}
          </View>

          {/* Tabs with Icons */}
          <View style={localStyles.tabBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={localStyles.tabBarContent}
            >
              {tabs.map((t) => {
                const active = activeTab === t.id;
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => switchTab(t.id)}
                    style={[
                      localStyles.tabBtn,
                      active && localStyles.tabBtnActive,
                    ]}
                  >
                    <Ionicons
                      name={active ? t.activeIcon : t.icon}
                      size={17}
                      color={active ? colors.text : colors.muted}
                    />
                    <Text
                      style={[
                        localStyles.tabText,
                        active && localStyles.tabTextActive,
                      ]}
                    >
                      {t.label}
                      {typeof t.count === "number" ? ` ${t.count}` : ""}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* TAB: POSTS */}
          {activeTab === "posts" ? (
            <View style={localStyles.sectionBody}>
              {postsError ? (
                <InlineError
                  message="Couldn't load posts."
                  onRetry={() => void load()}
                />
              ) : regularPosts.length ? (
                regularPosts.map((post) => (
                  <ApiPostCard
                    key={post.id}
                    post={post}
                    currentProfileId={isSelf ? app.user.id : personId}
                  />
                ))
              ) : (
                <EmptyState
                  title="No posts yet"
                  detail={
                    isSelf
                      ? "Your published updates will appear here."
                      : `${person.name} hasn't posted any updates yet.`
                  }
                  icon="grid-outline"
                />
              )}
            </View>
          ) : null}

          {/* TAB: VIDEOS */}
          {activeTab === "videos" ? (
            <View style={localStyles.sectionBody}>
              {postsError ? (
                <InlineError
                  message="Couldn't load videos."
                  onRetry={() => void load()}
                />
              ) : videoPosts.length ? (
                videoPosts.map((video) => (
                  <ApiPostCard
                    key={video.id}
                    post={video}
                    currentProfileId={isSelf ? app.user.id : personId}
                  />
                ))
              ) : (
                <EmptyState
                  title="No videos yet"
                  detail={
                    isSelf
                      ? "Videos you upload will appear in this section."
                      : `${person.name} hasn't shared any videos yet.`
                  }
                  icon="videocam-outline"
                />
              )}
            </View>
          ) : null}

          {/* TAB: BUSINESSES (OWNED & EMPLOYED) */}
          {activeTab === "businesses" ? (
            <View style={localStyles.businessesWrap}>
              <View style={localStyles.bizSection}>
                <Text style={localStyles.sectionHeading}>Businesses Owned</Text>
                {ownedBusinesses.length > 0 ? (
                  ownedBusinesses.map((biz) => (
                    <BusinessRow
                      key={biz.id}
                      item={biz}
                      tag="Owner"
                      onPress={() => openBusiness(biz.id)}
                    />
                  ))
                ) : (
                  <Text style={localStyles.mutedNote}>
                    {isSelf
                      ? "You haven't added any owned businesses."
                      : "No owned businesses listed."}
                  </Text>
                )}
              </View>

              <View style={localStyles.sectionDivider} />

              <View style={localStyles.bizSection}>
                <Text style={localStyles.sectionHeading}>
                  Employment & Roles
                </Text>
                {employments.length > 0 ? (
                  employments.map((job) => (
                    <BusinessRow
                      key={job.id}
                      item={job}
                      tag={job.role}
                      onPress={() => openBusiness(job.id)}
                    />
                  ))
                ) : (
                  <Text style={localStyles.mutedNote}>
                    {person.employmentStatus === "open_to_work"
                      ? "Open to employment and business partnerships."
                      : "No current employment listed."}
                  </Text>
                )}
              </View>
            </View>
          ) : null}

          {/* TAB: ABOUT */}
          {activeTab === "about" ? (
            <View style={localStyles.aboutWrap}>
              <DetailRow
                label="Employment Status"
                value={
                  ownedBusinesses.length > 0
                    ? `Business Owner (${ownedBusinesses.length})`
                    : employments.length > 0
                    ? `Employed · ${employments[0].role} at ${employments[0].name}`
                    : person.employmentStatus === "open_to_work"
                    ? "Open to Work"
                    : "Independent"
                }
              />
              <DetailRow
                label="Location"
                value={`${person.town}, ${person.county}`}
              />
              <DetailRow label="Username" value={`@${person.username}`} />
              {person.bio ? <DetailRow label="Bio" value={person.bio} /> : null}
            </View>
          ) : null}
        </>
      ) : null}
    </Page>
  );
}

function BusinessRow({
  item,
  tag,
  onPress,
}: {
  item: BusinessAffiliation;
  tag: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={localStyles.bizRow}>
      {item.logo ? (
        <Image source={{ uri: item.logo }} style={localStyles.bizLogo} />
      ) : (
        <View style={localStyles.bizLogoPlaceholder}>
          <Text style={localStyles.bizLogoInitial}>
            {item.name.slice(0, 1).toUpperCase()}
          </Text>
        </View>
      )}

      <View style={localStyles.bizInfo}>
        <View style={localStyles.bizNameLine}>
          <Text numberOfLines={1} style={localStyles.bizName}>
            {item.name}
          </Text>
          {item.verified ? (
            <Ionicons
              name="checkmark-circle"
              size={15}
              color={colors.primary}
            />
          ) : null}
        </View>
        <Text numberOfLines={1} style={localStyles.bizSub}>
          {[tag, item.category, item.town].filter(Boolean).join(" · ")}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={localStyles.detailRow}>
      <Text style={localStyles.detailLabel}>{label}</Text>
      <Text style={localStyles.detailValue}>{value}</Text>
    </View>
  );
}

const localStyles = createThemedStyles(() =>
  StyleSheet.create({
    floatingTopControls: {
      position: "absolute",
      left: 16,
      right: 16,
      zIndex: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    floatingBackBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    centeredState: {
      paddingVertical: 48,
      paddingHorizontal: 16,
    },
    bannerWrap: {
      width: "100%",
      backgroundColor: colors.border,
    },
    bannerImg: {
      width: "100%",
      height: "100%",
    },
    headerBody: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    avatarAndActionsRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      marginTop: -44,
    },
    avatarRing: {
      width: 88,
      height: 88,
      borderRadius: 44,
      padding: 3,
      backgroundColor: colors.background,
    },
    avatarImg: {
      width: "100%",
      height: "100%",
      borderRadius: 41,
    },
    avatarFallback: {
      width: "100%",
      height: "100%",
      borderRadius: 41,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarInitials: {
      fontSize: 22,
      fontWeight: "700",
      color: colors.text,
    },
    topActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingBottom: 4,
    },
    secondaryIconBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    identityBlock: {
      marginTop: 12,
      gap: 2,
    },
    displayName: {
      fontSize: 22,
      fontWeight: "800",
      color: colors.text,
      letterSpacing: -0.3,
    },
    handleText: {
      fontSize: 13,
      color: colors.muted,
    },
    bioText: {
      marginTop: 10,
      fontSize: 14,
      lineHeight: 20,
      color: colors.text,
    },
    workSummaryBar: {
      marginTop: 14,
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    },
    workSummaryLeft: {
      flex: 1,
      gap: 2,
    },
    workSummaryEyebrow: {
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 0.6,
      color: colors.muted,
    },
    workSummaryTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
    },
    statsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 20,
      marginTop: 16,
    },
    statItem: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: 5,
    },
    statValue: {
      fontSize: 15,
      fontWeight: "800",
      color: colors.text,
    },
    statLabel: {
      fontSize: 13,
      color: colors.muted,
    },
    errorText: {
      color: colors.danger,
      marginTop: 10,
    },
    tabBar: {
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },
    tabBarContent: {
      paddingHorizontal: 16,
      gap: 20,
    },
    tabBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 13,
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
    },
    tabBtnActive: {
      borderBottomColor: colors.text,
    },
    tabText: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.muted,
    },
    tabTextActive: {
      color: colors.text,
      fontWeight: "700",
    },
    sectionBody: {
      paddingTop: 12,
      gap: 12,
    },
    businessesWrap: {
      padding: 16,
      gap: 20,
    },
    bizSection: {
      gap: 12,
    },
    sectionHeading: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
    },
    sectionDivider: {
      height: 1,
      backgroundColor: colors.border,
    },
    bizRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 6,
    },
    bizLogo: {
      width: 48,
      height: 48,
      borderRadius: 10,
      backgroundColor: colors.surface,
    },
    bizLogoPlaceholder: {
      width: 48,
      height: 48,
      borderRadius: 10,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    bizLogoInitial: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.text,
    },
    bizInfo: {
      flex: 1,
      gap: 3,
    },
    bizNameLine: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    bizName: {
      fontSize: 15,
      fontWeight: "700",
      color: colors.text,
      flexShrink: 1,
    },
    bizSub: {
      fontSize: 13,
      color: colors.muted,
    },
    mutedNote: {
      fontSize: 13,
      color: colors.muted,
    },
    aboutWrap: {
      padding: 16,
      gap: 16,
    },
    detailRow: {
      gap: 3,
    },
    detailLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.muted,
    },
    detailValue: {
      fontSize: 15,
      color: colors.text,
      lineHeight: 21,
    },
  })
);