import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ActionTile, Avatar, Button, LocalNote, Page, SectionTitle, Stat, TopBar, styles } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { useBizConnectServices, useBizConnectServiceMode } from "@/lib/services/service-provider";
import { colors } from "@/theme/tokens";
import { ApiPersonalProfile } from "@/components/api-social-screens";

export default function ProfileScreen() {
  const apiMode = useBizConnectServiceMode() === "api";
  return apiMode ? <ApiPersonalProfile /> : <MockProfileScreen />;
}
function MockProfileScreen() {
  const app = useAppStore();
  const services = useBizConnectServices();
  const apiMode = useBizConnectServiceMode() === "api";
  const [businessMode, setBusinessMode] = useState(false);
  const [businessError, setBusinessError] = useState("");
  const [businessLoading, setBusinessLoading] = useState(apiMode);
  const replaceApiBusinesses = app.replaceApiBusinesses;
  useEffect(() => {
    if (!apiMode || !app.isAuthenticated) return;
    let active = true;
    setBusinessLoading(true);
    void services.businesses.list({ limit: 100 }).then((result) => {
      if (!active) return;
      if (result.ok) { replaceApiBusinesses(result.data.items); setBusinessError(""); }
      else setBusinessError(result.error.message);
      setBusinessLoading(false);
    }).catch((cause: unknown) => { if (active) { setBusinessError(cause instanceof Error ? cause.message : "Could not load managed businesses."); setBusinessLoading(false); } });
    return () => { active = false; };
  }, [apiMode, app.isAuthenticated, services, replaceApiBusinesses]);
  const activeBusiness = app.isAuthenticated ? app.businesses.find((b) => b.id === app.activeBusinessId) : undefined;
  const managed = (app.isAuthenticated ? app.businesses : []).filter((business) => apiMode ? Boolean(business.currentUserRole || business.ownerId === app.user.id) : business.ownerId === app.user.id || business.team.some((member) => member.userId === app.user.id));
  const profileName = businessMode && activeBusiness ? activeBusiness.name : app.user.name;
  return <Page>
    <TopBar title="Your profile" right={<Pressable accessibilityRole="button" accessibilityLabel="Settings" onPress={() => router.push("/settings")} style={styles.iconButton}><Ionicons name="settings-outline" size={20} color={colors.ink} /></Pressable>} />
    <LocalNote text={apiMode ? "API mode · business identities are loaded from the BizConnect backend." : app.localNotice} />
    {businessError ? <Text style={styles.caption}>{businessError}</Text> : null}
    {!app.isAuthenticated ? <View style={[styles.card, { padding: 14, gap: 8 }]}><Text style={styles.cardTitle}>Browse freely · sign in for your account</Text><Text style={styles.caption}>Create a local demo profile to follow founders, save stories, publish and manage businesses. No server account is created.</Text><Button title="Sign in or create account" icon="person-circle-outline" onPress={() => router.push("/auth")} /></View> : null}
    <View style={{ alignItems: "center", gap: 9, paddingTop: 4 }}><Avatar name={profileName} size={82} ring /><Text style={styles.sectionHeading}>{profileName}</Text><Text style={styles.caption}>{businessMode && activeBusiness ? `@${activeBusiness.slug} · ${activeBusiness.town}` : `@${app.user.username} · ${app.user.town}, ${app.user.county}`}</Text><Text style={[styles.body, { textAlign: "center", maxWidth: 330 }]}>{businessMode && activeBusiness ? activeBusiness.description : app.user.bio}</Text><View style={{ flexDirection: "row", gap: 18 }}><Stat value={businessMode && activeBusiness ? activeBusiness.followers.toLocaleString() : app.user.followers.toLocaleString()} label="Followers" /><Stat value={businessMode && activeBusiness ? activeBusiness.analytics.profileViews.toLocaleString() : app.user.following.toLocaleString()} label={businessMode ? "Profile views" : "Following"} /><Stat value={app.posts.filter((p) => p.authorId === app.user.id || (businessMode && p.identityId === activeBusiness?.id)).length} label="Posts" /></View></View>
    <View style={{ flexDirection: "row", gap: 9 }}><Button title="Personal profile" icon="person-outline" variant={!businessMode ? "primary" : "outline"} small onPress={() => { setBusinessMode(false); app.switchIdentity(undefined); }} /><Button title="Business identity" icon="business-outline" variant={businessMode ? "primary" : "outline"} small onPress={() => { if (!app.isAuthenticated) return router.push("/auth/login"); setBusinessMode(true); app.switchIdentity(activeBusiness?.id ?? managed[0]?.id); }} /></View>
    {businessMode ? <View style={{ gap: 8 }}><SectionTitle title="Switch business" action="Add business" onAction={() => router.push("/create-business")} />{businessLoading ? <Text style={styles.caption}>Loading managed businesses…</Text> : managed.length ? managed.map((business) => <Pressable key={business.id} accessibilityRole="button" onPress={() => app.switchIdentity(business.id)} style={[styles.actionTile, { borderColor: app.activeBusinessId === business.id ? colors.emerald : colors.border }]}><View style={styles.tileIcon}><Ionicons name="business-outline" size={18} color={colors.emeraldDark} /></View><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{business.name}</Text><Text style={styles.caption}>{business.category} · {business.town} · {business.currentUserRole ?? business.team.find((m) => m.userId === app.user.id)?.role ?? "Team member"}</Text></View>{app.activeBusinessId === business.id ? <Ionicons name="checkmark-circle" size={19} color={colors.emerald} /> : null}</Pressable>) : <Button title="Create your first business" onPress={() => router.push("/create-business")} />}
      {activeBusiness ? <><SectionTitle title={apiMode ? "Business dashboard" : "Owner dashboard"} />{apiMode ? <Text style={styles.caption}>Choose a business to switch identities. Stage 3 server analytics are not available.</Text> : <View style={styles.rowBetween}><Stat value={activeBusiness.analytics.profileViews.toLocaleString()} label="Profile views" /><Stat value={`${activeBusiness.analytics.postEngagement}%`} label="Engagement" /><Stat value={activeBusiness.analytics.enquiries} label="Enquiries" /></View>}<ActionTile title="Manage business" detail={apiMode ? "Server-backed profile, team, invitations and ownership" : "Profile, catalog, team, milestones and analytics"} icon="settings-outline" onPress={() => app.isAuthenticated ? router.push("/business-management") : router.push("/auth/login")} /><ActionTile title="Growth dashboard" detail="Reviews, trends, milestones and next opportunities" icon="trending-up-outline" onPress={() => app.isAuthenticated && activeBusiness ? router.push({ pathname: "/business-growth", params: { businessId: activeBusiness.id } }) : router.push("/auth/login")} /></> : null}
    </View> : <View style={{ gap: 9 }}><SectionTitle title="Your businesses" action="Create business" onAction={() => router.push("/create-business")} />{businessLoading ? <Text style={styles.caption}>Loading managed businesses…</Text> : managed.length ? managed.map((business) => <Pressable key={business.id} accessibilityRole="button" onPress={() => router.push({ pathname: "/business/[id]", params: { id: business.id } })} style={styles.actionTile}><View style={styles.tileIcon}><Ionicons name="storefront-outline" size={19} color={colors.emerald} /></View><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{business.name}</Text><Text style={styles.caption}>{business.category} · {business.town} · {business.currentUserRole ?? "Owner"}</Text></View><Ionicons name="chevron-forward" size={18} color={colors.muted} /></Pressable>) : businessError ? <Text style={styles.caption}>{businessError}</Text> : <Button title="Create a business profile" onPress={() => router.push("/create-business")} />}</View>}
    <SectionTitle title="Your BizConnect" />
    <View style={{ gap: 8 }}>
      <ActionTile title="Followers & following" detail="People and businesses you connect with" icon="people-outline" onPress={() => router.push("/followers")} />
      <ActionTile title="Saved posts & stories" detail={`${app.savedPosts.length + app.savedStories.length} items saved locally`} icon="bookmark-outline" onPress={() => router.push("/saved")} />
      <ActionTile title="Saved businesses" detail="Places and founders to revisit" icon="heart-outline" onPress={() => router.push("/saved-businesses")} />
      <ActionTile title="Recently viewed" icon="time-outline" onPress={() => router.push("/recently-viewed")} />
      <ActionTile title="Draft posts" detail={`${app.drafts.length} drafts on this device`} icon="documents-outline" onPress={() => router.push("/drafts")} />
      <ActionTile title="Business ideas & opportunities" icon="bulb-outline" onPress={() => router.push("/opportunities")} />
      <ActionTile title="Help & community guidelines" icon="help-circle-outline" onPress={() => router.push("/help")} />
      <ActionTile title="Account privacy & data" icon="shield-checkmark-outline" onPress={() => router.push("/privacy")} />
    </View>
    <Pressable accessibilityRole="button" onPress={() => app.isAuthenticated ? router.push("/edit-profile") : router.push("/auth/login")} style={{ alignItems: "center", padding: 7 }}><Text style={styles.link}>Edit personal profile</Text></Pressable>
  </Page>;
}
