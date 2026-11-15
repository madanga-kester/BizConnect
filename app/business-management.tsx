import { useCallback, useEffect, useState } from "react";
import { router } from "expo-router";
import { Text, View } from "react-native";
import { ActionTile, Button, ConfirmModal, EmptyState, LocalNote, Page, SectionTitle, Stat, TopBar, styles } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { useBizConnectServices, useBizConnectServiceMode } from "@/lib/services/service-provider";
import { colors } from "@/theme/tokens";
import { BUSINESS_CONTENT_ROLES, getBusinessRole, hasBusinessRole } from "@/utils/business-permissions";

export default function BusinessManagementScreen() {
  const app = useAppStore();
  const services = useBizConnectServices();
  const apiMode = useBizConnectServiceMode() === "api";
  const [remoteBusiness, setRemoteBusiness] = useState<typeof app.businesses[number] | undefined>();
  const [loading, setLoading] = useState(apiMode);
  const [error, setError] = useState("");
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const cachedBusiness = app.businesses.find((item) => item.id === app.activeBusinessId);
  const business = apiMode ? remoteBusiness : cachedBusiness;
  const upsertApiBusiness = app.upsertApiBusiness;

  const load = useCallback(async () => {
    if (!apiMode) return;
    setLoading(true); setError("");
    const listing = await services.businesses.list({ limit: 100 });
    if (!listing.ok) {
      setRemoteBusiness(undefined); setError(listing.error.message); setLoading(false); return;
    }
    app.replaceApiBusinesses(listing.data.items);
    const selected = listing.data.items.find((item) => item.id === app.activeBusinessId) ?? listing.data.items[0];
    if (!selected) {
      setRemoteBusiness(undefined); setError("No active business memberships were returned for this account."); setLoading(false); return;
    }
    const result = await services.businesses.get(selected.id);
    if (result.ok) {
      const mapped = app.isAuthenticated && result.data.currentUserRole ? { ...result.data, team: [{ userId: app.user.id, role: result.data.currentUserRole, joinedAt: result.data.joinedAt, displayName: app.user.name, email: app.user.email ?? "" }] } : result.data;
      setRemoteBusiness(mapped);
      if (app.isAuthenticated) upsertApiBusiness(mapped);
    } else { setRemoteBusiness(undefined); setError(result.error.message); }
    setLoading(false);
  }, [apiMode, services, app.isAuthenticated, app.activeBusinessId, app.user.id, app.user.name, app.user.email, app.replaceApiBusinesses, upsertApiBusiness]);
  useEffect(() => { void load(); }, [load]);

  if (!app.isAuthenticated) return <Page><TopBar title="Business dashboard" back /><EmptyState title="Sign in to manage a business" detail="Business tools require an authenticated owner or team account." icon="lock-closed-outline" action="Sign in" onAction={() => router.push("/auth/login")} /></Page>;
  if (apiMode && loading) return <Page><TopBar title="Business dashboard" back /><Text style={styles.body}>Loading business permissions from BizConnect…</Text></Page>;
  if (!business) return <Page><TopBar title="Business dashboard" back /><EmptyState title={apiMode ? "Business unavailable" : "Choose a business first"} detail={error || "Create or switch to one of your business identities."} action="Open businesses" onAction={() => router.push("/(tabs)/profile")} />{apiMode && error ? <Button title="Retry" variant="outline" onPress={() => void load()} /> : null}</Page>;

  const role = business.currentUserRole ?? getBusinessRole(business, app.user.id);
  const canView = role !== undefined;
  const canEdit = hasBusinessRole(business, app.user.id, BUSINESS_CONTENT_ROLES);
  const canManageTeam = role === "Owner" || role === "Administrator";
  const isOwner = role === "Owner";
  if (!canView) return <Page><TopBar title="Business dashboard" back /><EmptyState title="You do not have access to this business" detail="Switch to a business you own or ask its Owner or Administrator for access." icon="lock-closed-outline" action="Open profile" onAction={() => router.push("/(tabs)/profile")} /></Page>;

  const archiveBusiness = async () => {
    if (!apiMode || !isOwner) return;
    setBusy(true); setError("");
    const result = await services.businesses.archive(business.id);
    setBusy(false); setArchiveOpen(false);
    if (!result.ok) { setError(result.error.message); return; }
    const listing = await services.businesses.list({ limit: 100 });
    if (listing.ok) app.replaceApiBusinesses(listing.data.items);
    router.replace("/(tabs)/profile");
  };

  return <Page>
    <TopBar title="Business dashboard" back />
    <LocalNote text={apiMode ? `BizConnect API · ${business.name} · ${role}. The server enforces permissions.` : `Local business dashboard · ${business.name} · ${role}`} />
    {error ? <View style={[styles.card, { padding: 12 }]}><Text style={styles.body}>{error}</Text><Button title="Retry" variant="outline" small onPress={() => void load()} /></View> : null}
    <View style={{ backgroundColor: colors.navy, borderRadius: 21, padding: 17, gap: 8 }}><Text style={{ color: colors.orange, fontSize: 11, fontWeight: "800" }}>BUSINESS OVERVIEW</Text><Text style={{ color: colors.white, fontSize: 23, fontWeight: "800" }}>{business.name}</Text><Text style={{ color: "#D9E2E9" }}>{business.category} · {business.town} · {business.status ?? "active"}</Text><Text style={{ color: "#D9E2E9" }}>{business.visibility ?? "public"} profile · {business.businessType ?? "hybrid"}</Text><Button title="View public profile" variant="soft" icon="eye-outline" onPress={() => router.push({ pathname: "/business/[id]", params: { id: business.id } })} /></View>
    {!apiMode && canEdit ? <>
      <View style={{ flexDirection: "row", justifyContent: "space-around", backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 13 }}><Stat value={business.analytics.profileViews.toLocaleString()} label="Profile views" /><Stat value={`${business.analytics.postEngagement}%`} label="Engagement" /><Stat value={business.followers.toLocaleString()} label="Followers" /></View>
      <View style={{ flexDirection: "row", justifyContent: "space-around", backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 13 }}><Stat value={business.analytics.videoViews.toLocaleString()} label="Video views" /><Stat value={business.analytics.productViews.toLocaleString()} label="Product views" /><Stat value={business.analytics.enquiries} label="Enquiries" /></View>
    </> : null}
    <SectionTitle title="Manage your business" />
    {canEdit ? <ActionTile title="Edit business profile" detail="Description, founder, hours, location, contacts, social links and visibility" icon="create-outline" onPress={() => router.push({ pathname: "/create-business", params: { id: business.id } })} /> : null}
    {canManageTeam ? <ActionTile title="Manage team & ownership" detail="Members, invitations, role boundaries and explicit ownership transfers" icon="people-outline" onPress={() => router.push("/team")} /> : role === "Viewer" ? <ActionTile title="View team" detail="Read-only team membership" icon="people-outline" onPress={() => router.push("/team")} /> : null}
    <ActionTile title="Unified growth dashboard" detail="Reviews, analytics trends, milestones, opportunities and activity" icon="trending-up-outline" onPress={() => router.push({ pathname: "/business-growth", params: { businessId: business.id } })} />
    <ActionTile title="Manage products & services" detail={apiMode ? "Stage 5 catalogue · products, services, ordered galleries and publishing" : `${business.products.length} products · ${business.services.length} services`} icon="pricetags-outline" onPress={() => router.push("/catalog-management")} />
    {apiMode ? <View style={[styles.card, { padding: 14, gap: 6 }]}><Text style={styles.cardTitle}>Stage 3 and Stage 5 API-backed scope</Text><Text style={styles.caption}>Business profiles, memberships, invitations and ownership transfers use the C# backend from Stage 3. Stage 5 adds the catalogue: products, services, ordered image galleries, real image upload and public discovery. Posts, verification, milestones and analytics remain outside backend integration.</Text></View> : <>
      <ActionTile title="Manage posts & drafts" detail={`${app.posts.filter((post) => post.businessId === business.id).length} posts · ${app.drafts.length} local drafts`} icon="albums-outline" onPress={() => router.push("/drafts")} />
      {canManageTeam ? <>
        <ActionTile title="Business verification" detail={business.verificationStatus.replaceAll("_", " ")} icon="shield-checkmark-outline" onPress={() => router.push({ pathname: "/verification", params: { businessId: business.id } })} />
        <ActionTile title="Business milestones" icon="trophy-outline" onPress={() => router.push({ pathname: "/milestones", params: { businessId: business.id } })} />
        <ActionTile title="Business analytics" icon="bar-chart-outline" onPress={() => router.push("/analytics")} />
      </> : null}
    </>}
    {isOwner && apiMode ? <Button title={busy ? "Archiving…" : "Archive business"} variant="danger" disabled={busy} onPress={() => setArchiveOpen(true)} /> : null}
    <Text style={styles.caption}>{apiMode ? "Business access is enforced by the API; unavailable Stage 3 functions are not silently written to local mock data." : "Your role and changes are evaluated in this local demo only."}</Text>
    <ConfirmModal visible={archiveOpen} title="Archive this business?" detail="The server will deactivate this profile. Existing Stage 2 data and other businesses are not affected." confirmLabel="Archive" destructive onCancel={() => setArchiveOpen(false)} onConfirm={() => void archiveBusiness()} />
  </Page>;
}
