import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, Share, Text, View, useWindowDimensions } from "react-native";
import { ActionTile, Avatar, Button, LocalNote, Page, SectionTitle, Stat, TopBar, styles } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { useMabizServices, useMabizServiceMode } from "@/lib/services/service-provider";
import { colors } from "@/theme/tokens";
import { ApiPersonalProfile } from "@/components/api-social-screens";

/* ------------------------------------------------------------------ */
/* Post field helpers. I haven't seen your Post type, so these read    */
/* several likely field names. Adjust to match types/domain.           */
/* ------------------------------------------------------------------ */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPost = Record<string, any>;

const PAGE_PADDING = 16; // match the horizontal padding used by <Page>
const GRID_GAP = 2;

const isVideo = (p: AnyPost) => p.mediaType === "video" || p.type === "video" || Boolean(p.videoUrl);
const isReshared = (p: AnyPost) => Boolean(p.resharedFromId || p.originalPostId || p.isReshare || p.reshared);
const thumbOf = (p: AnyPost): string | undefined =>
  p.thumbnail ?? p.image ?? p.imageUrl ?? p.media?.[0]?.thumbnail ?? p.media?.[0]?.uri ?? p.media?.[0]?.url;

type ProfileTab = "all" | "videos" | "reshared" | "saved";

const TABS: { key: ProfileTab; icon: React.ComponentProps<typeof Ionicons>["name"]; label: string }[] = [
  { key: "all", icon: "grid-outline", label: "All posts" },
  { key: "videos", icon: "play-circle-outline", label: "Videos" },
  { key: "reshared", icon: "repeat-outline", label: "Reshared" },
  { key: "saved", icon: "bookmark-outline", label: "Saved" },
];

function PostTile({ post, size }: { post: AnyPost; size: number }) {
  const uri = thumbOf(post);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open post"
      // Adjust the route to your post detail screen.
      onPress={() => router.push(`/post/${post.id}` as never)}
      style={{
        width: size,
        height: size,
        backgroundColor: colors.emeraldTint,
        alignItems: "center",
        justifyContent: "center",
        padding: 6,
      }}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size }} resizeMode="cover" />
      ) : (
        <Text numberOfLines={5} style={[styles.caption, { textAlign: "center" }]}>
          {post.text ?? post.caption ?? post.body ?? ""}
        </Text>
      )}
      {isVideo(post) ? (
        <Ionicons name="play" size={16} color={colors.white} style={{ position: "absolute", top: 6, right: 6 }} />
      ) : isReshared(post) ? (
        <Ionicons name="repeat" size={16} color={colors.white} style={{ position: "absolute", top: 6, right: 6 }} />
      ) : null}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const apiMode = useMabizServiceMode() === "api";
  return apiMode ? <ApiPersonalProfile /> : <MockProfileScreen />;
}

function MockProfileScreen() {
  const app = useAppStore();
  const services = useMabizServices();
  const apiMode = useMabizServiceMode() === "api";
  const { width } = useWindowDimensions();

  const [businessMode, setBusinessMode] = useState(false);
  const [businessError, setBusinessError] = useState("");
  const [businessLoading, setBusinessLoading] = useState(apiMode);
  const [tab, setTab] = useState<ProfileTab>("all");
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const replaceApiBusinesses = app.replaceApiBusinesses;

  useEffect(() => {
    if (!apiMode || !app.isAuthenticated) return;
    let active = true;
    setBusinessLoading(true);
    void services.businesses
      .list({ limit: 100 })
      .then((result) => {
        if (!active) return;
        if (result.ok) {
          replaceApiBusinesses(result.data.items);
          setBusinessError("");
        } else setBusinessError(result.error.message);
        setBusinessLoading(false);
      })
      .catch((cause: unknown) => {
        if (active) {
          setBusinessError(cause instanceof Error ? cause.message : "Could not load managed businesses.");
          setBusinessLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [apiMode, app.isAuthenticated, services, replaceApiBusinesses]);

  const activeBusiness = app.isAuthenticated ? app.businesses.find((b) => b.id === app.activeBusinessId) : undefined;
  const managed = (app.isAuthenticated ? app.businesses : []).filter((business) =>
    apiMode
      ? Boolean(business.currentUserRole || business.ownerId === app.user.id)
      : business.ownerId === app.user.id || business.team.some((member) => member.userId === app.user.id)
  );

  const inBusiness = businessMode && Boolean(activeBusiness);
  const profileName = inBusiness && activeBusiness ? activeBusiness.name : app.user.name;
  const handle = inBusiness && activeBusiness ? activeBusiness.slug : app.user.username;
  const subtitle =
    inBusiness && activeBusiness
      ? `${activeBusiness.category} · ${activeBusiness.town}`
      : `${app.user.town}, ${app.user.county}`;
  const about = inBusiness && activeBusiness ? activeBusiness.description : app.user.bio;

  /* ---------------- posts per tab ---------------- */
  const posts = app.posts as AnyPost[];
  const ownPosts = useMemo(
    () =>
      posts.filter(
        (p) => p.authorId === app.user.id || (businessMode && activeBusiness && p.identityId === activeBusiness.id)
      ),
    [posts, app.user.id, businessMode, activeBusiness]
  );
  const savedIds = useMemo(
    () =>
      new Set<string>([
        ...(app.savedPosts as unknown[]).map((s) => (typeof s === "string" ? s : (s as AnyPost).id)),
      ]),
    [app.savedPosts]
  );
  const tabPosts: AnyPost[] =
    tab === "all"
      ? ownPosts
      : tab === "videos"
        ? ownPosts.filter(isVideo)
        : tab === "reshared"
          ? ownPosts.filter(isReshared)
          : posts.filter((p) => savedIds.has(p.id));

  const tileSize = Math.floor((width - PAGE_PADDING * 2 - GRID_GAP * 2) / 3);
  const emptyText: Record<ProfileTab, string> = {
    all: "No posts yet.",
    videos: "No videos yet.",
    reshared: "Nothing reshared yet.",
    saved: "Nothing saved yet.",
  };

  const requireAuth = (go: () => void) => (app.isAuthenticated ? go() : router.push("/auth/login"));

  const shareProfile = () => {
    void Share.share({
      message: `Check out ${profileName} (@${handle}) on Mabiz — connect with local businesses and founders!`,
    });
  };

  const statValue = {
    posts: ownPosts.length,
    followers: (inBusiness && activeBusiness ? activeBusiness.followers : app.user.followers).toLocaleString(),
    third:
      inBusiness && activeBusiness
        ? activeBusiness.analytics.profileViews.toLocaleString()
        : app.user.following.toLocaleString(),
  };

  return (
    <Page>
      <TopBar
        title={`@${handle}`}
        right={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Menu"
            onPress={() => router.push("/menu")}
            style={styles.iconButton}
          >
            <Ionicons name="menu-outline" size={24} color={colors.ink} />
          </Pressable>
        }
      />
      <LocalNote text={apiMode ? "API mode · business identities are loaded from the Mabiz backend." : app.localNotice} />
      {businessError ? <Text style={styles.caption}>{businessError}</Text> : null}

      {!app.isAuthenticated ? (
        <View style={[styles.card, { padding: 14, gap: 8 }]}>
          <Text style={styles.cardTitle}>Browse freely · sign in for your account</Text>
          <Text style={styles.caption}>
            Create a local demo profile to follow founders, save stories, publish and manage businesses. No server
            account is created.
          </Text>
          <Button title="Sign in or create account" icon="person-circle-outline" onPress={() => router.push("/auth")} />
        </View>
      ) : null}

      {/* ---------- Header: picture + posts / followers / following ---------- */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
        <Avatar name={profileName} size={82} ring />
        <View style={{ flex: 1, flexDirection: "row", justifyContent: "space-around" }}>
          <Stat value={statValue.posts} label="Posts" />
          <Pressable accessibilityRole="button" onPress={() => router.push("/menu/followers")}>
            <Stat value={statValue.followers} label="Followers" />
          </Pressable>
          {inBusiness ? (
            <Stat value={statValue.third} label="Profile views" />
          ) : (
            <Pressable accessibilityRole="button" onPress={() => router.push("/menu/followers")}>
              <Stat value={statValue.third} label="Following" />
            </Pressable>
          )}
        </View>
      </View>

      {/* ---------- About ---------- */}
      <View style={{ gap: 2 }}>
        <Text style={styles.sectionHeading}>{profileName}</Text>
        <Text style={styles.caption}>{subtitle}</Text>
        {about ? <Text style={styles.body}>{about}</Text> : null}
      </View>

      {/* ---------- Edit + Share ---------- */}
      <View style={{ flexDirection: "row", gap: 9 }}>
        <View style={{ flex: 1 }}>
          <Button
            title={inBusiness ? "Manage business" : "Edit profile"}
            icon={inBusiness ? "settings-outline" : "create-outline"}
            variant="outline"
            small
            onPress={() =>
              requireAuth(() => (inBusiness ? router.push("/business-management") : router.push("/menu/account/personal-details")))
            }
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button title="Share profile" icon="share-outline" variant="outline" small onPress={shareProfile} />
        </View>
      </View>

      {/* ---------- Profile switching ---------- */}
      <View style={{ flexDirection: "row", gap: 9 }}>
        <Button
          title="Personal profile"
          icon="person-outline"
          variant={!businessMode ? "primary" : "outline"}
          small
          onPress={() => {
            setBusinessMode(false);
            setSwitcherOpen(false);
            app.switchIdentity(undefined);
          }}
        />
        <Button
          title="Business identity"
          icon="business-outline"
          variant={businessMode ? "primary" : "outline"}
          small
          onPress={() => {
            if (!app.isAuthenticated) return router.push("/auth/login");
            setBusinessMode(true);
            setSwitcherOpen(true);
            app.switchIdentity(activeBusiness?.id ?? managed[0]?.id);
          }}
        />
      </View>

      {businessMode ? (
        <View style={{ gap: 8 }}>
          <SectionTitle title="Switch business" action="Add business" onAction={() => router.push("/create-business")} />
          {switcherOpen ? (
            businessLoading ? (
              <Text style={styles.caption}>Loading managed businesses…</Text>
            ) : managed.length ? (
              managed.map((business) => (
                <Pressable
                  key={business.id}
                  accessibilityRole="button"
                  onPress={() => app.switchIdentity(business.id)}
                  style={[
                    styles.actionTile,
                    { borderColor: app.activeBusinessId === business.id ? colors.emerald : colors.border },
                  ]}
                >
                  <View style={styles.tileIcon}>
                    <Ionicons name="business-outline" size={18} color={colors.emeraldDark} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{business.name}</Text>
                    <Text style={styles.caption}>
                      {business.category} · {business.town} ·{" "}
                      {business.currentUserRole ?? business.team.find((m) => m.userId === app.user.id)?.role ?? "Team member"}
                    </Text>
                  </View>
                  {app.activeBusinessId === business.id ? (
                    <Ionicons name="checkmark-circle" size={19} color={colors.emerald} />
                  ) : null}
                </Pressable>
              ))
            ) : (
              <Button title="Create your first business" onPress={() => router.push("/create-business")} />
            )
          ) : null}

          {activeBusiness ? (
            <>
              <SectionTitle title={apiMode ? "Business dashboard" : "Owner dashboard"} />
              {apiMode ? (
                <Text style={styles.caption}>
                  Choose a business to switch identities. Stage 3 server analytics are not available.
                </Text>
              ) : (
                <View style={styles.rowBetween}>
                  <Stat value={activeBusiness.analytics.profileViews.toLocaleString()} label="Profile views" />
                  <Stat value={`${activeBusiness.analytics.postEngagement}%`} label="Engagement" />
                  <Stat value={activeBusiness.analytics.enquiries} label="Enquiries" />
                </View>
              )}
              <ActionTile
                title="Manage business"
                detail={apiMode ? "Server-backed profile, team, invitations and ownership" : "Profile, catalog, team, milestones and analytics"}
                icon="settings-outline"
                onPress={() => requireAuth(() => router.push("/business-management"))}
              />
              <ActionTile
                title="Growth dashboard"
                detail="Reviews, trends, milestones and next opportunities"
                icon="trending-up-outline"
                onPress={() =>
                  requireAuth(() =>
                    router.push({ pathname: "/business-growth", params: { businessId: activeBusiness.id } })
                  )
                }
              />
            </>
          ) : null}
        </View>
      ) : (
        <View style={{ gap: 9 }}>
          <SectionTitle title="Your businesses" action="Create business" onAction={() => router.push("/create-business")} />
          {businessLoading ? (
            <Text style={styles.caption}>Loading managed businesses…</Text>
          ) : managed.length ? (
            managed.map((business) => (
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
                    {business.category} · {business.town} · {business.currentUserRole ?? "Owner"}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </Pressable>
            ))
          ) : businessError ? (
            <Text style={styles.caption}>{businessError}</Text>
          ) : (
            <Button title="Create a business profile" onPress={() => router.push("/create-business")} />
          )}
        </View>
      )}

      {/* ---------- Content tabs: All posts · Videos · Reshared · Saved ---------- */}
      <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.border }}>
        {TABS.map((t) => {
          const selected = tab === t.key;
          return (
            <Pressable
              key={t.key}
              accessibilityRole="tab"
              accessibilityLabel={t.label}
              accessibilityState={{ selected }}
              onPress={() => setTab(t.key)}
              style={{
                flex: 1,
                alignItems: "center",
                paddingVertical: 10,
                borderBottomWidth: 2,
                borderBottomColor: selected ? colors.emerald : "transparent",
              }}
            >
              <Ionicons name={t.icon} size={22} color={selected ? colors.emeraldDark : colors.muted} />
            </Pressable>
          );
        })}
      </View>
      <Text style={[styles.caption, { textAlign: "center" }]}>{TABS.find((t) => t.key === tab)?.label}</Text>

      {tabPosts.length ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: GRID_GAP }}>
          {tabPosts.map((p) => (
            <PostTile key={p.id} post={p} size={tileSize} />
          ))}
        </View>
      ) : (
        <Text style={[styles.caption, { textAlign: "center", paddingVertical: 24 }]}>{emptyText[tab]}</Text>
      )}
    </Page>
  );
}