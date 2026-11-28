import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
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
  // Cover is ~28% of screen height, kept between 170 and 260 so it looks right on short and tall phones.
  const coverHeight = Math.min(260, Math.max(170, Math.round(height * 0.28)));
  const emptyText: Record<ProfileTab, string> = {
    all: "No posts yet.",
    videos: "No videos yet.",
    reshared: "Nothing reshared yet.",
    saved: "",
  };

  const displayName = inBusiness && activeBusiness ? activeBusiness.name : person?.name ?? "";
  const displayHandle = inBusiness && activeBusiness ? activeBusiness.slug : person?.username ?? "";
  const displayAbout = inBusiness && activeBusiness ? activeBusiness.description : person?.bio;

  const coverPhoto =
    (inBusiness && activeBusiness
      ? (activeBusiness as { cover?: string; banner?: string }).cover ??
        (activeBusiness as { cover?: string; banner?: string }).banner
      : (person as { cover?: string; banner?: string } | null)?.cover ??
        (person as { cover?: string; banner?: string } | null)?.banner) ?? person?.avatar;

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

  const renderHamburgerButton = () => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Menu"
      onPress={() => router.push("/menu")}
      hitSlop={8}
      style={localStyles.menuButtonOverlay}
    >
      <Ionicons name="menu-outline" size={22} color="#FFFFFF" />
    </Pressable>
  );

  const renderShareButton = () => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Share profile"
      onPress={shareProfile}
      hitSlop={8}
      style={[localStyles.menuButtonOverlay, { right: 56 }]}
    >
      <Ionicons name="share-social-outline" size={20} color="#FFFFFF" />
    </Pressable>
  );

  return (
    <Page topColor={colors.surface} onRefresh={() => void load()} refreshing={loading}>
      {error ? (
        <View accessibilityRole="alert" style={localStyles.errorBar}>
          <Text style={styles.body}>Profile error: {error}</Text>
          <Button title="Retry" small variant="outline" onPress={() => void load()} />
        </View>
      ) : null}

      {loading ? (
        <>
          <View style={[localStyles.coverBanner, { height: coverHeight, marginTop: -10 }]}>
            <View style={localStyles.coverPlaceholder} />
            {renderHamburgerButton()}
          </View>
          <ProfileSkeleton />
          <SkeletonGrid size={tileSize} />
        </>
      ) : null}

      {!loading && person ? (
        <>
          {/* Cover Photo with Share & Hamburger Buttons + Overlapping Profile */}
          <View style={localStyles.profileBand}>
            <View style={[localStyles.coverBanner, { height: coverHeight }]}>
              {coverPhoto ? (
                <Image
                  source={{ uri: coverPhoto }}
                  style={localStyles.coverImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={localStyles.coverPlaceholder} />
              )}
              <View style={localStyles.coverScrim} />
              {renderShareButton()}
              {renderHamburgerButton()}
            </View>

            <View style={localStyles.profileBody}>
              {/* Circular Profile Picture Overlapping Cover + Stats */}
              <View style={localStyles.headerRow}>
                <View style={localStyles.avatarColumn}>
                  <View style={localStyles.avatarOverlapWrap}>
                    <Avatar
                      name={displayName}
                      image={inBusiness ? undefined : person.avatar}
                      size={84}
                      ring
                    />
                  </View>
                </View>

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

              {/* Name, handle (opens switcher) and Edit profile */}
              <View style={localStyles.nameBlock}>
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={localStyles.nameRow}>
                    <Text style={[styles.sectionHeading, { flexShrink: 1 }]} numberOfLines={1}>
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
                    accessibilityLabel={`Switch profile, @${displayHandle}`}
                    onPress={() => setPickerOpen(true)}
                    hitSlop={8}
                    style={localStyles.handleRow}
                  >
                    <Text style={[styles.body, { fontWeight: "600" }]}>@{displayHandle}</Text>
                    <Ionicons name="chevron-down" size={15} color={colors.ink} />
                  </Pressable>
                </View>

                <Button
                  title={inBusiness ? "Manage business" : "Edit profile"}
                  variant="outline"
                  small
                  onPress={() => router.push(inBusiness ? "/business-management" : "/menu/account/edit-profile")}
                />
              </View>

              {/* Location & Bio */}
              <View style={localStyles.identityBlock}>
                <Text style={styles.caption}>
                  {inBusiness && activeBusiness
                    ? `${activeBusiness.category} · ${activeBusiness.town}`
                    : `${person.town}, ${person.county}`}
                </Text>
                {displayAbout ? <Text style={styles.body}>{displayAbout}</Text> : null}
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
                      <Text style={localStyles.sheetSectionLabel}>Business Profiles</Text>
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
                            <Avatar name={business.name} size={42} />
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
                    <ApiPostCard key={post.id} post={post} hideBusinessLink />
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
    handleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      alignSelf: "flex-start",
    },
    errorBar: {
      paddingVertical: 10,
      gap: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    profileBand: {
      marginHorizontal: -16,
      marginTop: -10,
      paddingBottom: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 6,
      borderBottomColor: colors.canvas,
    },
    coverBanner: {
      width: "100%",
      height: 132,
      backgroundColor: colors.subtle,
      overflow: "hidden",
      position: "relative",
    },
    coverImage: {
      width: "100%",
      height: "100%",
    },
    coverPlaceholder: {
      flex: 1,
      backgroundColor: colors.emeraldTint,
    },
    coverScrim: {
      ...StyleSheet.absoluteFill,
      backgroundColor: "rgba(0, 0, 0, 0.16)",
    },
    menuButtonOverlay: {
      position: "absolute",
      top: 10,
      right: 12,
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: "rgba(0, 0, 0, 0.45)",
      alignItems: "center",
      justifyContent: "center",
    },
    profileBody: {
      paddingHorizontal: 16,
      gap: 10,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 16,
      marginTop: -42,
    },
    avatarColumn: {
      alignItems: "flex-start",
    },
    avatarOverlapWrap: {
      borderRadius: 999,
      padding: 3,
      backgroundColor: colors.surface,
    },
    nameBlock: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      flexWrap: "wrap",
    },
    statsRow: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "space-around",
      paddingTop: 48,
    },
    identityBlock: {
      gap: 4,
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