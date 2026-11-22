import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  ActionTile,
  Avatar,
  Button,
  EmptyState,
  LoadingState,
  Page,
  Stat,
  TopBar,
  styles,
} from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { useMabizServices } from "@/lib/services/service-provider";
import { useThemeContext } from "@/lib/theme-provider";
import { errorText, pageRequest } from "@/lib/api-helpers";
import {
  PROFILE_TABS,
  postIsReshared,
  postIsVideo,
  type LoosePost,
  type ProfileTab,
} from "@/lib/profile-post-utils";
import { colors } from "@/theme/tokens";
import type { Post, UserProfile } from "@/types/domain";
import { ProfileSkeleton, SkeletonGrid } from "@/components/skeleton";
import { ApiPostCard } from "@/components/api-post-card";

export function ApiPersonalProfile() {
  const services = useMabizServices();
  const app = useAppStore();
  const { width, height } = useWindowDimensions();
  const { colorScheme } = useThemeContext();
  const isDark = colorScheme === "dark";

  // Theme-responsive palette derived from system color scheme & design tokens
  const theme = useMemo(
    () => ({
      bg: colors.canvas,
      surface: colors.surface,
      surfaceElevated: colors.subtle,
      border: colors.border,
      textPrimary: colors.ink,
      textSecondary: colors.muted,
      accent: colors.emerald,
      accentText: colors.emeraldDark,
      accentSoft: colors.emeraldTint,
      businessBadgeBg: isDark ? "rgba(56, 189, 248, 0.15)" : "rgba(14, 165, 233, 0.10)",
      businessBadgeText: isDark ? "#38BDF8" : "#0284C7",
      backdrop: "rgba(0, 0, 0, 0.6)",
      handleBar: colors.border,
    }),
    [isDark]
  );

  const [person, setPerson] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [businessPosts, setBusinessPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [postsError, setPostsError] = useState("");
  const [tab, setTab] = useState<ProfileTab>("all");
  const [businessMode, setBusinessMode] = useState(() => Boolean(app.activeBusinessId));
  const [businessLoading, setBusinessLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [businessError, setBusinessError] = useState("");
  const [businessPostsLoading, setBusinessPostsLoading] = useState(() => Boolean(app.activeBusinessId));
  const [businessPostsError, setBusinessPostsError] = useState("");
  const loadSeq = useRef(0);
  const error = [profileError, postsError ? `Posts: ${postsError}` : ""].filter(Boolean).join("; ");
  const replaceApiBusinesses = app.replaceApiBusinesses;

  const load = useCallback(async () => {
    loadSeq.current += 1;
    const seq = loadSeq.current;
    setLoading(true);
    setProfileError("");
    setPostsError("");
    try {
      const [profile, page] = await Promise.all([
        services.users.getProfile("me"),
        services.posts.listUserPosts("me", pageRequest()),
      ]);
      if (seq !== loadSeq.current) return;
      if (!profile.ok) setProfileError(errorText(profile.error));
      else setPerson(profile.data);
      if (!page.ok) setPostsError(errorText(page.error));
      else setPosts(page.data.items);
    } catch (cause: unknown) {
      if (seq !== loadSeq.current) return;
      setProfileError(cause instanceof Error ? cause.message : "Could not load profile.");
    } finally {
      if (seq === loadSeq.current) setLoading(false);
    }
  }, [services]);

  useEffect(() => {
    void load();
    return () => {
      loadSeq.current += 1;
    };
  }, [load]);

  useEffect(() => {
    if (!app.isAuthenticated) return;
    let active = true;
    setBusinessLoading(true);
    void services.businesses
      .list({ limit: 100 })
      .then((result) => {
        if (!active) return;
        if (result.ok) {
          replaceApiBusinesses(result.data.items);
          setBusinessError("");
        } else setBusinessError(errorText(result.error));
        setBusinessLoading(false);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setBusinessError(cause instanceof Error ? cause.message : "Could not load managed businesses.");
        setBusinessLoading(false);
      });
    return () => {
      active = false;
    };
  }, [app.isAuthenticated, services, replaceApiBusinesses]);

  const managed = app.businesses.filter((b) => Boolean(b.currentUserRole || b.ownerId === app.user.id));
  const activeBusiness = app.businesses.find((b) => b.id === app.activeBusinessId);
  const inBusiness = businessMode && Boolean(activeBusiness);
  const activeBusinessId = activeBusiness?.id;

  useEffect(() => {
    if (!businessMode || !activeBusinessId) {
      setBusinessPosts([]);
      setBusinessPostsLoading(false);
      return;
    }
    let active = true;
    setBusinessPosts([]);
    setBusinessPostsError("");
    setBusinessPostsLoading(true);
    void services.posts
      .listBusinessPosts(activeBusinessId, pageRequest())
      .then((result) => {
        if (!active) return;
        if (result.ok) setBusinessPosts(result.data.items);
        else setBusinessPostsError(errorText(result.error));
        setBusinessPostsLoading(false);
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setBusinessPostsError(cause instanceof Error ? cause.message : "Could not load business posts.");
        setBusinessPostsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [businessMode, activeBusinessId, services]);

  const personalPosts = useMemo(() => posts.filter((p) => p.identityKind !== "business"), [posts]);
  const shownPosts = inBusiness ? businessPosts : personalPosts;
  const tabPosts = useMemo(
    () =>
      tab === "videos"
        ? shownPosts.filter((p) => postIsVideo(p as LoosePost))
        : tab === "reshared"
          ? shownPosts.filter((p) => postIsReshared(p as LoosePost))
          : shownPosts,
    [tab, shownPosts]
  );

  const visibleTabs = useMemo(
    () => (inBusiness ? PROFILE_TABS.filter((item) => item.key !== "saved") : PROFILE_TABS),
    [inBusiness]
  );
  useEffect(() => {
    if (inBusiness && tab === "saved") setTab("all");
  }, [inBusiness, tab]);

    const slide = useRef(new Animated.Value(0)).current;
  const swipe = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) =>
          Math.abs(gesture.dx) > 12 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
        onPanResponderMove: (_event, gesture) => {
          const index = visibleTabs.findIndex((item) => item.key === tab);
          const target = visibleTabs[index + (gesture.dx < 0 ? 1 : -1)];
          slide.setValue(target ? gesture.dx : gesture.dx * 0.25);
        },
        onPanResponderRelease: (_event, gesture) => {
          const index = visibleTabs.findIndex((item) => item.key === tab);
          const direction = gesture.dx < 0 ? 1 : -1;
          const target = visibleTabs[index + direction];
          const committed = Boolean(target) && (Math.abs(gesture.dx) > width * 0.25 || Math.abs(gesture.vx) > 0.5);
          if (!committed || !target) {
            Animated.spring(slide, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
            return;
          }
          Animated.timing(slide, { toValue: -direction * width, duration: 120, useNativeDriver: true }).start(() => {
            setTab(target.key);
            slide.setValue(direction * width);
            Animated.timing(slide, { toValue: 0, duration: 180, useNativeDriver: true }).start();
          });
        },
        onPanResponderTerminate: () => {
          Animated.spring(slide, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
        },
      }),
    [tab, visibleTabs, width, slide]
  );

  const tileSize = Math.floor((width - 32 - 4) / 3);
  const emptyText: Record<ProfileTab, string> = {
    all: "No posts yet.",
    videos: "No videos yet.",
    reshared: "Nothing reshared yet.",
    saved: "",
  };

  const displayName = inBusiness && activeBusiness ? activeBusiness.name : person?.name ?? "";
  const displayHandle = inBusiness && activeBusiness ? activeBusiness.slug : person?.username ?? "";
  const displayAbout = inBusiness && activeBusiness ? activeBusiness.description : person?.bio;

  const selectPersonal = () => {
    setBusinessMode(false);
    setPickerOpen(false);
    setTab("all");
    app.switchIdentity(undefined);
  };

  const selectBusiness = (id: string) => {
    setBusinessMode(true);
    setPickerOpen(false);
    setTab("all");
    app.switchIdentity(id);
  };

  const shareProfile = () => {
    if (!person) return;
    void Share.share({
      message: `Check out ${displayName} (@${displayHandle}) on Mabiz - connect with local businesses and founders!`,
    });
  };

  return (
    <Page onRefresh={() => void load()} refreshing={loading} style={{ backgroundColor: theme.bg }}>
      <TopBar
        title={person ? `@${displayHandle}` : "Profile"}
        onTitlePress={person ? () => setPickerOpen(true) : undefined}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Menu"
            onPress={() => router.push("/menu")}
            hitSlop={8}
            style={{ width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" }}
          >
            <Ionicons name="menu-outline" size={26} color={theme.textPrimary} />
          </Pressable>
        }
      />

      {error ? (
        <View
          accessibilityRole="alert"
          style={{
            backgroundColor: theme.surface,
            borderColor: theme.border,
            borderWidth: 1,
            borderRadius: 12,
            padding: 12,
            gap: 8,
          }}
        >
          <Text style={[styles.body, { color: theme.textPrimary }]}>Profile error: {error}</Text>
          <Button title="Retry" small variant="outline" onPress={() => void load()} />
        </View>
      ) : null}

      {loading ? (
        <>
          <ProfileSkeleton />
          <SkeletonGrid size={tileSize} />
        </>
      ) : null}

      {!loading && person ? (
        <>
          {/* Profile Header & Stats */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
            <Avatar
              name={displayName}
              image={inBusiness && activeBusiness ? activeBusiness.logo : person.avatar}
              size={82}
              ring
            />
            <View style={{ flex: 1, flexDirection: "row", justifyContent: "space-around" }}>
              <Stat value={shownPosts.length} label="Posts" />
              {inBusiness && activeBusiness ? (
                <Stat value={activeBusiness.followers} label="Followers" />
              ) : (
                <Pressable accessibilityRole="button" onPress={() => router.push("/menu/followers")}>
                  <Stat value={person.followers} label="Followers" />
                </Pressable>
              )}
              {inBusiness ? null : (
                <Pressable accessibilityRole="button" onPress={() => router.push("/menu/followers")}>
                  <Stat value={person.following} label="Following" />
                </Pressable>
              )}
            </View>
          </View>

          {/* Identity Info + Quick Switcher Pill */}
          <View style={{ gap: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 }}>
                <Text style={[styles.sectionHeading, { color: theme.textPrimary }]} numberOfLines={1}>
                  {displayName}
                </Text>
                {inBusiness ? (
                  <View
                    style={{
                      backgroundColor: theme.businessBadgeBg,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 999,
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: "600", color: theme.businessBadgeText }}>
                      Business
                    </Text>
                  </View>
                ) : null}
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Switch profile"
                onPress={() => setPickerOpen(true)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 999,
                  backgroundColor: theme.surfaceElevated,
                  borderWidth: 1,
                  borderColor: theme.border,
                }}
              >
                <Ionicons name="swap-horizontal-outline" size={14} color={theme.accentText} />
                <Text style={{ fontSize: 12, fontWeight: "600", color: theme.textPrimary }}>Switch</Text>
              </Pressable>
            </View>

            <Text style={[styles.caption, { color: theme.textSecondary }]}>
              {inBusiness && activeBusiness
                ? `${activeBusiness.category} · ${activeBusiness.town}`
                : `${person.town}, ${person.county}`}
            </Text>
            {displayAbout ? <Text style={[styles.body, { color: theme.textPrimary }]}>{displayAbout}</Text> : null}
          </View>

          {/* Primary Actions */}
          <View style={{ flexDirection: "row", gap: 9 }}>
            <View style={{ flex: 1 }}>
              <Button
                title={inBusiness ? "Manage business" : "Edit profile"}
                icon={inBusiness ? "settings-outline" : "create-outline"}
                variant="outline"
                small
                onPress={() => router.push(inBusiness ? "/business-management" : "/menu/account/edit-profile")}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button title="Share profile" icon="share-outline" variant="outline" small onPress={shareProfile} />
            </View>
          </View>

          {/* Redesigned Bottom Sheet Profile Switcher */}
          <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
            <Pressable
              onPress={() => setPickerOpen(false)}
              style={{ flex: 1, backgroundColor: theme.backdrop, justifyContent: "flex-end" }}
            >
              <Pressable
                onPress={() => {}}
                style={{
                  backgroundColor: theme.surface,
                  borderTopLeftRadius: 24,
                  borderTopRightRadius: 24,
                  borderTopWidth: 1,
                  borderColor: theme.border,
                  paddingTop: 10,
                  paddingHorizontal: 16,
                  paddingBottom: 24,
                  maxHeight: height * 0.78,
                  gap: 14,
                }}
              >
                {/* Sheet Drag Handle */}
                <View style={{ alignItems: "center" }}>
                  <View
                    style={{
                      width: 40,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: theme.handleBar,
                    }}
                  />
                </View>

                {/* Sheet Header */}
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View>
                    <Text style={[styles.cardTitle, { color: theme.textPrimary, fontSize: 17 }]}>
                      Switch account
                    </Text>
                    <Text style={[styles.caption, { color: theme.textSecondary }]}>
                      Choose between your personal account and business profiles
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Close profile switcher"
                    onPress={() => setPickerOpen(false)}
                    hitSlop={8}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: theme.surfaceElevated,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="close" size={18} color={theme.textSecondary} />
                  </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
                  {/* Personal Profile Section */}
                  <View style={{ gap: 6 }}>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: "700",
                        letterSpacing: 0.6,
                        textTransform: "uppercase",
                        color: theme.textSecondary,
                      }}
                    >
                      Personal Account
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      onPress={selectPersonal}
                      style={[
                        styles.actionTile,
                        {
                          backgroundColor: !inBusiness ? theme.accentSoft : theme.surfaceElevated,
                          borderColor: !inBusiness ? theme.accent : theme.border,
                          borderWidth: !inBusiness ? 1.5 : 1,
                          borderRadius: 14,
                        },
                      ]}
                    >
                      <Avatar name={person.name} image={person.avatar} size={42} />
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{person.name}</Text>
                        <Text style={[styles.caption, { color: theme.textSecondary }]}>
                          @{person.username} · Personal profile
                        </Text>
                      </View>
                      {!inBusiness ? (
                        <Ionicons name="checkmark-circle" size={22} color={theme.accent} />
                      ) : (
                        <Ionicons name="ellipse-outline" size={22} color={theme.textSecondary} />
                      )}
                    </Pressable>
                  </View>

                  {/* Business Profiles Section */}
                  <View style={{ gap: 8 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Ionicons name="storefront-outline" size={14} color={theme.businessBadgeText} />
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: "700",
                            letterSpacing: 0.6,
                            textTransform: "uppercase",
                            color: theme.textSecondary,
                          }}
                        >
                          Business Profiles
                        </Text>
                      </View>
                      {managed.length > 0 ? (
                        <Text style={[styles.caption, { color: theme.textSecondary }]}>
                          {managed.length} {managed.length === 1 ? "business" : "businesses"}
                        </Text>
                      ) : null}
                    </View>

                    {businessLoading ? (
                      <Text style={[styles.caption, { color: theme.textSecondary }]}>
                        Loading business profiles...
                      </Text>
                    ) : managed.length === 0 ? (
                      <View
                        style={{
                          padding: 12,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: theme.border,
                          backgroundColor: theme.surfaceElevated,
                        }}
                      >
                        <Text style={[styles.caption, { color: theme.textSecondary }]}>
                          No business profiles linked yet. Create one to manage a storefront and post as a business.
                        </Text>
                      </View>
                    ) : (
                      managed.map((business) => {
                        const selected = inBusiness && app.activeBusinessId === business.id;
                        return (
                          <Pressable
                            key={business.id}
                            accessibilityRole="button"
                            onPress={() => selectBusiness(business.id)}
                            style={[
                              styles.actionTile,
                              {
                                backgroundColor: selected ? theme.accentSoft : theme.surfaceElevated,
                                borderColor: selected ? theme.accent : theme.border,
                                borderWidth: selected ? 1.5 : 1,
                                borderRadius: 14,
                              },
                            ]}
                          >
                            <Avatar name={business.name} image={business.logo} size={42} />
                            <View style={{ flex: 1, gap: 3 }}>
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{business.name}</Text>
                                <View
                                  style={{
                                    backgroundColor: theme.businessBadgeBg,
                                    paddingHorizontal: 7,
                                    paddingVertical: 1.5,
                                    borderRadius: 6,
                                  }}
                                >
                                  <Text
                                    style={{
                                      fontSize: 10,
                                      fontWeight: "700",
                                      color: theme.businessBadgeText,
                                    }}
                                  >
                                    Business profile
                                  </Text>
                                </View>
                              </View>
                              <Text style={[styles.caption, { color: theme.textSecondary }]}>
                                @{business.slug} · {business.currentUserRole ?? "Team member"}
                              </Text>
                            </View>
                            {selected ? (
                              <Ionicons name="checkmark-circle" size={22} color={theme.accent} />
                            ) : (
                              <Ionicons name="ellipse-outline" size={22} color={theme.textSecondary} />
                            )}
                          </Pressable>
                        );
                      })
                    )}
                  </View>
                </ScrollView>

                <Button
                  title="Create a business profile"
                  icon="add-circle-outline"
                  variant="outline"
                  small
                  onPress={() => {
                    setPickerOpen(false);
                    router.push("/create-business");
                  }}
                />
              </Pressable>
            </Pressable>
          </Modal>

          {/* Active Business Quick Actions (shown only when switched into a business profile) */}
          {businessMode ? (
            <View style={{ gap: 8 }}>
              {businessError ? <Text style={[styles.caption, { color: theme.textSecondary }]}>{businessError}</Text> : null}
              {businessPostsError ? (
                <Text style={[styles.caption, { color: theme.textSecondary }]}>{businessPostsError}</Text>
              ) : null}
              {activeBusiness ? (
                <>
                  <ActionTile
                    title="Manage business"
                    detail="Server-backed profile, team, invitations and ownership"
                    icon="settings-outline"
                    onPress={() => router.push("/business-management")}
                  />
                  <ActionTile
                    title="Growth dashboard"
                    detail="Reviews, trends, milestones and next opportunities"
                    icon="trending-up-outline"
                    onPress={() =>
                      router.push({ pathname: "/business-growth", params: { businessId: activeBusiness.id } })
                    }
                  />
                </>
              ) : null}
            </View>
          ) : null}

          <View {...swipe.panHandlers} style={{ gap: 16, minHeight: height * 0.5 }}>
          {/* Content Tabs */}
          <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: theme.border }}>
            {visibleTabs.map((item) => {
              const selected = tab === item.key;
              return (
                <Pressable
                  key={item.key}
                  accessibilityRole="tab"
                  accessibilityLabel={item.label}
                  accessibilityState={{ selected }}
                  onPress={() => setTab(item.key)}
                  style={{
                    flex: 1,
                    alignItems: "center",
                    paddingVertical: 10,
                    borderBottomWidth: 2,
                    borderBottomColor: selected ? theme.accent : "transparent",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: selected ? "700" : "500",
                      color: selected ? theme.textPrimary : theme.textSecondary,
                    }}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
         
          {/* Tab Content */}
          <Animated.View style={{ transform: [{ translateX: slide }] }}>
          {tab === "saved" ? (
            <View style={{ gap: 8 }}>
              <ActionTile
                title="Saved posts and stories"
                detail={`${app.savedPosts.length + app.savedStories.length} items saved`}
                icon="bookmark-outline"
                onPress={() => router.push("/menu/activity/saved")}
              />
              <ActionTile
                title="Saved businesses"
                detail="Places and founders to revisit"
                icon="heart-outline"
                onPress={() => router.push("/menu/activity/saved-businesses")}
              />
            </View>
          ) : inBusiness && businessPostsLoading ? (
            <SkeletonGrid size={tileSize} />
          ) : tabPosts.length ? (
            <View style={{ gap: 12 }}>
              {tabPosts.map((post) => (
                <ApiPostCard key={post.id} post={post} />
              ))}
            </View>
          ) : (
            <EmptyState title={emptyText[tab]} detail="Posts you publish will appear here." icon="albums-outline" />
          )}
          </Animated.View>
          </View>
        </>
      ) : null}

     
    </Page>
  );
}