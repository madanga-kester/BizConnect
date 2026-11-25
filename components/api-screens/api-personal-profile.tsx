import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import {
  ActionTile,
  Avatar,
  Button,
  EmptyState,
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
import { colors, createThemedStyles } from "@/theme/tokens";
import type { Post, UserProfile } from "@/types/domain";
import { ProfileSkeleton, SkeletonGrid } from "@/components/skeleton";
import { ApiPostCard } from "@/components/api-post-card";

export function ApiPersonalProfile() {
  const services = useMabizServices();
  const app = useAppStore();
  const { width, height } = useWindowDimensions();
  useThemeContext();

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

  const { switch: switchParam } = useLocalSearchParams<{ switch?: string }>();

  useEffect(() => {
    if (switchParam) setPickerOpen(true);
  }, [switchParam]);
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
    <Page topColor={colors.surface} onRefresh={() => void load()} refreshing={loading}>
      <View style={localStyles.topBarFlat}>
        <TopBar
          title={person ? `@${displayHandle}` : "Profile"}
          onTitlePress={person ? () => setPickerOpen(true) : undefined}
          right={
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Menu"
              onPress={() => router.push("/menu")}
              hitSlop={8}
              style={localStyles.menuButton}
            >
              <Ionicons name="menu-outline" size={24} color={colors.ink} />
            </Pressable>
          }
        />
      </View>

      {error ? (
        <View accessibilityRole="alert" style={localStyles.errorBar}>
          <Text style={styles.body}>Profile error: {error}</Text>
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
          {/* Flat Profile Header & Stats */}
          <View style={localStyles.profileBand}>
            <View style={localStyles.headerRow}>
              <Avatar
                name={displayName}
                image={inBusiness && activeBusiness ? activeBusiness.logo : person.avatar}
                size={80}
                ring
              />
              <View style={localStyles.statsRow}>
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

            {/* Identity Info + Quick Switcher */}
            <View style={localStyles.identityBlock}>
              <View style={localStyles.nameLine}>
                <View style={localStyles.nameGroup}>
                  <Text style={styles.sectionHeading} numberOfLines={1}>
                    {displayName}
                  </Text>
                  {inBusiness ? (
                    <View style={localStyles.businessTag}>
                      <Text style={localStyles.businessTagText}>Business</Text>
                    </View>
                  ) : null}
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Switch profile"
                  onPress={() => setPickerOpen(true)}
                  style={({ pressed }) => [localStyles.switchButton, pressed && { opacity: 0.6 }]}
                >
                  <Ionicons name="swap-horizontal-outline" size={16} color={colors.ink} />
                  <Text style={localStyles.switchButtonText}>Switch</Text>
                </Pressable>
              </View>

              <Text style={styles.caption}>
                {inBusiness && activeBusiness
                  ? `${activeBusiness.category} · ${activeBusiness.town}`
                  : `${person.town}, ${person.county}`}
              </Text>
              {displayAbout ? <Text style={styles.body}>{displayAbout}</Text> : null}
            </View>

            {/* Primary Actions */}
            <View style={localStyles.actionRow}>
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
          </View>

          {/* Bottom Sheet Profile Switcher */}
          <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
            <Pressable
              onPress={() => setPickerOpen(false)}
              style={localStyles.modalBackdrop}
            >
              <Pressable
                onPress={() => {}}
                style={[localStyles.sheetContainer, { maxHeight: height * 0.78 }]}
              >
                <View style={localStyles.handleWrap}>
                  <View style={localStyles.handleBar} />
                </View>

                <View style={localStyles.sheetHeader}>
                  <View>
                    <Text style={[styles.cardTitle, { fontSize: 17 }]}>Switch account</Text>
                    <Text style={styles.caption}>
                      Choose between your personal account and business profiles
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Close profile switcher"
                    onPress={() => setPickerOpen(false)}
                    hitSlop={8}
                    style={localStyles.closeButton}
                  >
                    <Ionicons name="close" size={18} color={colors.ink} />
                  </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
                  <View style={{ gap: 6 }}>
                    <Text style={localStyles.sheetSectionLabel}>Personal Account</Text>
                    <Pressable
                      accessibilityRole="button"
                      onPress={selectPersonal}
                      style={[
                        localStyles.pickerRow,
                        !inBusiness && localStyles.pickerRowSelected,
                      ]}
                    >
                      <Avatar name={person.name} image={person.avatar} size={42} />
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={styles.cardTitle}>{person.name}</Text>
                        <Text style={styles.caption}>
                          @{person.username} · Personal profile
                        </Text>
                      </View>
                      <Ionicons
                        name={!inBusiness ? "checkmark-circle" : "ellipse-outline"}
                        size={22}
                        color={!inBusiness ? colors.emerald : colors.muted}
                      />
                    </Pressable>
                  </View>

                  <View style={{ gap: 8 }}>
                    <View style={localStyles.sheetSubHeader}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Ionicons name="storefront-outline" size={15} color={colors.ink} />
                        <Text style={localStyles.sheetSectionLabel}>Business Profiles</Text>
                      </View>
                      {managed.length > 0 ? (
                        <Text style={styles.caption}>
                          {managed.length} {managed.length === 1 ? "business" : "businesses"}
                        </Text>
                      ) : null}
                    </View>

                    {businessLoading ? (
                      <Text style={styles.caption}>Loading business profiles...</Text>
                    ) : managed.length === 0 ? (
                      <View style={localStyles.emptyPickerNote}>
                        <Text style={styles.caption}>
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
                              localStyles.pickerRow,
                              selected && localStyles.pickerRowSelected,
                            ]}
                          >
                            <Avatar name={business.name} image={business.logo} size={42} />
                            <View style={{ flex: 1, gap: 3 }}>
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                <Text style={styles.cardTitle}>{business.name}</Text>
                                <View style={localStyles.businessTag}>
                                  <Text style={localStyles.businessTagText}>Business profile</Text>
                                </View>
                              </View>
                              <Text style={styles.caption}>
                                @{business.slug} · {business.currentUserRole ?? "Team member"}
                              </Text>
                            </View>
                            <Ionicons
                              name={selected ? "checkmark-circle" : "ellipse-outline"}
                              size={22}
                              color={selected ? colors.emerald : colors.muted}
                            />
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

          {/* Active Business Quick Actions */}
          {businessMode ? (
            <View style={localStyles.businessBand}>
              {businessError ? <Text style={styles.caption}>{businessError}</Text> : null}
              {businessPostsError ? <Text style={styles.caption}>{businessPostsError}</Text> : null}
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

          <View {...swipe.panHandlers} style={{ gap: 12, minHeight: height * 0.5 }}>
            {/* Content Tabs */}
            <View style={localStyles.tabBar}>
              {visibleTabs.map((item) => {
                const selected = tab === item.key;
                return (
                  <Pressable
                    key={item.key}
                    accessibilityRole="tab"
                    accessibilityLabel={item.label}
                    accessibilityState={{ selected }}
                    onPress={() => setTab(item.key)}
                    style={[localStyles.tabItem, selected && localStyles.tabItemSelected]}
                  >
                    <Text style={[localStyles.tabLabel, selected && localStyles.tabLabelSelected]}>
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
                <EmptyState
                  title={emptyText[tab]}
                  detail="Posts you publish will appear here."
                  icon="albums-outline"
                />
              )}
            </Animated.View>
          </View>
        </>
      ) : null}
    </Page>
  );
}

const localStyles = createThemedStyles(() =>
  StyleSheet.create({
    topBarFlat: {
      marginHorizontal: -16,
      marginTop: -10,
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    menuButton: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
    errorBar: {
      paddingVertical: 10,
      gap: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    profileBand: {
      marginHorizontal: -16,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 16,
      gap: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 6,
      borderBottomColor: colors.canvas,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 20,
    },
    statsRow: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "space-around",
    },
    identityBlock: {
      gap: 4,
    },
    nameLine: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    nameGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      flexShrink: 1,
    },
    businessTag: {
      backgroundColor: colors.subtle,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 999,
    },
    businessTagText: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.muted,
    },
    switchButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: colors.subtle,
    },
    switchButtonText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.ink,
    },
    actionRow: {
      flexDirection: "row",
      gap: 9,
      marginTop: 2,
    },
    businessBand: {
      marginHorizontal: -16,
      paddingHorizontal: 16,
      paddingBottom: 14,
      gap: 8,
      backgroundColor: colors.surface,
      borderBottomWidth: 6,
      borderBottomColor: colors.canvas,
    },
    tabBar: {
      flexDirection: "row",
      marginHorizontal: -16,
      backgroundColor: colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    tabItem: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 11,
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
    },
    tabItemSelected: {
      borderBottomColor: colors.ink,
    },
    tabLabel: {
      fontSize: 14,
      fontWeight: "500",
      color: colors.muted,
    },
    tabLabelSelected: {
      fontWeight: "700",
      color: colors.ink,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    sheetContainer: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingTop: 10,
      paddingHorizontal: 16,
      paddingBottom: 24,
      gap: 14,
    },
    handleWrap: {
      alignItems: "center",
    },
    handleBar: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
    },
    sheetHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.subtle,
      alignItems: "center",
      justifyContent: "center",
    },
    sheetSectionLabel: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.6,
      textTransform: "uppercase",
      color: colors.muted,
    },
    sheetSubHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    emptyPickerNote: {
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.subtle,
    },
    pickerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 12,
      borderRadius: 14,
      backgroundColor: colors.subtle,
    },
    pickerRowSelected: {
      backgroundColor: colors.emeraldTint,
    },
  })
);