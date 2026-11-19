import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, Pressable, Share, Text, View, useWindowDimensions } from "react-native";
import {
  ActionTile,
  Avatar,
  Button,
  EmptyState,
  LoadingState,
  Page,
  SectionTitle,
  Stat,
  TopBar,
  styles,
} from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { useMabizServices } from "@/lib/services/service-provider";
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
import { ApiProfileTile } from "./api-profile-tile";

export function ApiPersonalProfile() {
  const services = useMabizServices();
  const app = useAppStore();
  const { width } = useWindowDimensions();
  const [person, setPerson] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [businessPosts, setBusinessPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<ProfileTab>("all");
  const [businessMode, setBusinessMode] = useState(false);
  const [businessLoading, setBusinessLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [businessError, setBusinessError] = useState("");
  const replaceApiBusinesses = app.replaceApiBusinesses;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [profile, page] = await Promise.all([
      services.users.getProfile("me"),
      services.posts.listUserPosts("me", pageRequest()),
    ]);
    if (!profile.ok) setError(errorText(profile.error));
    else setPerson(profile.data);
    if (!page.ok)
      setError((current) =>
        current ? `${current}; posts: ${errorText(page.error)}` : `Posts: ${errorText(page.error)}`
      );
    else setPosts(page.data.items);
    setLoading(false);
  }, [services]);
  useEffect(() => {
    void load();
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
      return;
    }
    let active = true;
    setBusinessPosts([]);
    void services.posts.listBusinessPosts(activeBusinessId, pageRequest()).then((result) => {
      if (!active) return;
      if (result.ok) setBusinessPosts(result.data.items);
      else setBusinessError(errorText(result.error));
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
    <Page onRefresh={() => void load()} refreshing={loading}>
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
            <Ionicons name="menu-outline" size={26} color={colors.navy} />
          </Pressable>
        }
      />
      {error ? (
        <View accessibilityRole="alert">
          <Text style={styles.body}>Profile error: {error}</Text>
          <Button title="Retry" small variant="outline" onPress={() => void load()} />
        </View>
      ) : null}
      {loading ? <LoadingState label="Loading your profile from server" /> : null}
      {!loading && !error && person ? (
        <>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
            <Avatar
              name={displayName}
              image={inBusiness && activeBusiness ? activeBusiness.logo : person.avatar}
              size={82}
              ring
            />
            <View style={{ flex: 1, flexDirection: "row", justifyContent: "space-around" }}>
              <Stat value={shownPosts.length} label="Posts" />
              <Pressable accessibilityRole="button" onPress={() => router.push("/menu/followers")}>
                <Stat
                  value={inBusiness && activeBusiness ? activeBusiness.followers : person.followers}
                  label="Followers"
                />
              </Pressable>
              {inBusiness ? null : (
                <Pressable accessibilityRole="button" onPress={() => router.push("/menu/followers")}>
                  <Stat value={person.following} label="Following" />
                </Pressable>
              )}
            </View>
          </View>

          <View style={{ gap: 2 }}>
            <Text style={styles.sectionHeading}>{displayName}</Text>
            <Text style={styles.caption}>
              {inBusiness && activeBusiness
                ? `${activeBusiness.category} - ${activeBusiness.town}`
                : `${person.town}, ${person.county}`}
            </Text>
            {displayAbout ? <Text style={styles.body}>{displayAbout}</Text> : null}
          </View>

          <View style={{ flexDirection: "row", gap: 9 }}>
            <View style={{ flex: 1 }}>
              <Button
                title={inBusiness ? "Manage business" : "Edit profile"}
                icon={inBusiness ? "settings-outline" : "create-outline"}
                variant="outline"
                small
                onPress={() => router.push(inBusiness ? "/business-management" : "/menu/account/personal-details")}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button title="Share profile" icon="share-outline" variant="outline" small onPress={shareProfile} />
            </View>
          </View>

          <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
            <Pressable
              onPress={() => setPickerOpen(false)}
              style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" }}
            >
              <Pressable
                onPress={() => {}}
                style={{
                  backgroundColor: colors.surface,
                  borderTopLeftRadius: 16,
                  borderTopRightRadius: 16,
                  padding: 16,
                  gap: 9,
                }}
              >
                <Text style={styles.cardTitle}>Switch profile</Text>

                <Pressable
                  accessibilityRole="button"
                  onPress={selectPersonal}
                  style={[styles.actionTile, { borderColor: !inBusiness ? colors.emerald : colors.border }]}
                >
                  <Avatar name={person.name} image={person.avatar} size={38} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{person.name}</Text>
                    <Text style={styles.caption}>Personal profile</Text>
                  </View>
                  {!inBusiness ? <Ionicons name="checkmark-circle" size={19} color={colors.emerald} /> : null}
                </Pressable>

                {businessLoading ? (
                  <Text style={styles.caption}>Loading managed businesses...</Text>
                ) : (
                  managed.map((business) => {
                    const selected = inBusiness && app.activeBusinessId === business.id;
                    return (
                      <Pressable
                        key={business.id}
                        accessibilityRole="button"
                        onPress={() => selectBusiness(business.id)}
                        style={[styles.actionTile, { borderColor: selected ? colors.emerald : colors.border }]}
                      >
                        <Avatar name={business.name} image={business.logo} size={38} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.cardTitle}>{business.name}</Text>
                          <Text style={styles.caption}>{business.currentUserRole ?? "Team member"}</Text>
                        </View>
                        {selected ? <Ionicons name="checkmark-circle" size={19} color={colors.emerald} /> : null}
                      </Pressable>
                    );
                  })
                )}

                <Button
                  title="Add business"
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

          {businessMode ? (
            <View style={{ gap: 8 }}>
              {businessError ? <Text style={styles.caption}>{businessError}</Text> : null}
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
          ) : managed.length ? (
            <View style={{ gap: 9 }}>
              <SectionTitle title="Your businesses" action="Create business" onAction={() => router.push("/create-business")} />
              {managed.map((business) => (
                <Pressable
                  key={business.id}
                  accessibilityRole="button"
                  onPress={() => router.push({ pathname: "/business/[id]", params: { id: business.id } })}
                  style={styles.actionTile}
                >
                  <View style={styles.tileIcon}>
                    <Ionicons name="storefront-outline" size={19} color={colors.emerald} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{business.name}</Text>
                    <Text style={styles.caption}>
                      {business.category} - {business.town} - {business.currentUserRole ?? "Owner"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                </Pressable>
              ))}
            </View>
          ) : null}

          <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.border }}>
            {PROFILE_TABS.map((item) => {
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
                    borderBottomColor: selected ? colors.emerald : "transparent",
                  }}
                >
                  <Ionicons name={item.icon} size={22} color={selected ? colors.emeraldDark : colors.muted} />
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.caption, { textAlign: "center" }]}>
            {PROFILE_TABS.find((item) => item.key === tab)?.label}
          </Text>

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
          ) : tabPosts.length ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 2 }}>
              {tabPosts.map((post) => (
                <ApiProfileTile key={post.id} post={post} size={tileSize} />
              ))}
            </View>
          ) : (
            <EmptyState title={emptyText[tab]} detail="Posts you publish will appear here." icon="albums-outline" />
          )}
        </>
      ) : null}
      <Text style={styles.caption}>
        Signed in as {app.user.username} - profile and post visibility are determined by server responses.
      </Text>
    </Page>
  );
}