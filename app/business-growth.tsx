import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Button, Chip, EmptyState, LocalNote, LoadingState, Page, SectionTitle, Stat, TopBar, styles } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { useMabizServices, useMabizServiceMode } from "@/lib/services/service-provider";
import type { BusinessGrowthSummary, GrowthDateRange } from "@/lib/api/feature-contracts";
import { colors } from "@/theme/tokens";
import { getBusinessRole, hasBusinessRole, OWNER_ADMIN_ROLES } from "@/utils/business-permissions";

const RANGES: { label: string; value: GrowthDateRange }[] = [{ label: "7 days", value: "7d" }, { label: "30 days", value: "30d" }, { label: "90 days", value: "90d" }];
export default function BusinessGrowthScreen() {
  const app = useAppStore();
  const services = useMabizServices();
  const apiMode = useMabizServiceMode() === "api";
  const params = useLocalSearchParams<{ businessId?: string }>();
  const selectedId = params.businessId ?? app.activeBusinessId;
  const business = app.businesses.find((item) => item.id === selectedId) ?? app.businesses.find((item) => item.id === app.activeBusinessId);
  const [range, setRange] = useState<GrowthDateRange>("30d");
  const [summary, setSummary] = useState<BusinessGrowthSummary>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    if (!business) { setLoading(false); return; }
    setLoading(true); setError("");
    const result = await services.growth.getSummary(business.id, range);
    if (result.ok) setSummary(result.data); else { setSummary(undefined); setError(result.error.message); }
    setLoading(false);
  }, [business, range, services]);
  useEffect(() => { void load(); }, [load]);
  const role = business ? (business.currentUserRole ?? getBusinessRole(business, app.user.id)) : undefined;
  const allowed = Boolean(app.isAuthenticated && business && hasBusinessRole(business, app.user.id, OWNER_ADMIN_ROLES));
  const empty = !summary || (summary.reviews.length === 0 && summary.milestones.length === 0 && summary.opportunities.length === 0);
  const trendMax = useMemo(() => Math.max(1, ...(summary?.analytics.trends.map((point) => point.profileViews) ?? [1])), [summary]);
  if (!app.isAuthenticated) return <Page><TopBar title="Business growth" back /><EmptyState title="Sign in to view growth" detail="Growth insights are available to an authenticated business Owner or Administrator." icon="lock-closed-outline" action="Sign in" onAction={() => router.push("/auth/login")} /></Page>;
  if (!business) return <Page><TopBar title="Business growth" back /><EmptyState title="Choose a business first" detail="Switch to a managed business from your profile, then open its growth dashboard." action="Open profile" onAction={() => router.push("/(tabs)/profile")} /></Page>;
  if (!allowed) return <Page><TopBar title="Business growth" back /><EmptyState title="Owner access required" detail="Only this business's Owner or Administrator can view growth insights." icon="lock-closed-outline" action="Back to profile" onAction={() => router.push("/(tabs)/profile")} /></Page>;
  if (loading) return <Page><TopBar title="Business growth" back /><LoadingState label="Loading growth summary" /></Page>;
  if (error) return <Page><TopBar title="Business growth" back /><EmptyState title="Growth summary unavailable" detail={error} icon="cloud-offline-outline" action="Retry" onAction={() => void load()} /></Page>;
  if (!summary || empty) return <Page><TopBar title="Business growth" back /><LocalNote text={apiMode ? "Mabiz API · summary is supplied by the configured backend." : "Local demo · growth examples are illustrative and stored on this device only."} /><EmptyState title="Your growth story is just starting" detail="Add milestones and keep your business profile active to see a richer local summary." icon="trending-up-outline" action="Add a milestone" onAction={() => router.push({ pathname: "/milestones", params: { businessId: business.id } })} /></Page>;
  return <Page>
    <TopBar title="Business growth" back subtitle={business.name} />
    <LocalNote text={apiMode ? `Mabiz API · ${role ?? "business member"} · server permissions apply.` : "Local demo only · reviews, trends and opportunities are illustrative and not server facts."} />
    <View style={{ backgroundColor: colors.navy, borderRadius: 21, padding: 17, gap: 8 }}><Text style={{ color: colors.orange, fontSize: 11, fontWeight: "800" }}>UNIFIED GROWTH SNAPSHOT</Text><Text style={{ color: colors.white, fontSize: 23, fontWeight: "800" }}>{business.name}</Text><Text style={{ color: "#D9E2E9" }}>One place for reputation, momentum and next steps.</Text><View style={{ flexDirection: "row", gap: 22, paddingTop: 8 }}><View><Text style={{ color: colors.white, fontSize: 27, fontWeight: "800" }}>{summary.rating.toFixed(1)} ★</Text><Text style={{ color: "#D9E2E9", fontSize: 12 }}>{summary.reviewCount} reviews</Text></View><View><Text style={{ color: colors.white, fontSize: 27, fontWeight: "800" }}>{summary.analytics.followersThisMonth}</Text><Text style={{ color: "#D9E2E9", fontSize: 12 }}>new followers</Text></View></View></View>
    <SectionTitle title="Analytics trends" action="Open analytics" onAction={() => router.push("/analytics")} /><View style={styles.card}><View style={{ padding: 14, gap: 12 }}><View style={styles.row}>{RANGES.map((item) => <Chip key={item.value} label={item.label} selected={range === item.value} onPress={() => setRange(item.value)} />)}</View><View style={{ flexDirection: "row", justifyContent: "space-around", paddingTop: 5 }}><Stat value={summary.analytics.profileViews.toLocaleString()} label="Profile views" /><Stat value={`${summary.analytics.postEngagement}%`} label="Engagement" /><Stat value={summary.analytics.enquiries} label="Enquiries" /></View><View style={{ gap: 10 }}>{summary.analytics.trends.map((point) => <View key={point.label} style={styles.row}><Text style={[styles.caption, { width: 52 }]}>{point.label}</Text><View style={{ flex: 1, height: 10, borderRadius: 6, backgroundColor: colors.subtle, overflow: "hidden" }}><View style={{ height: "100%", width: `${Math.max(6, (point.profileViews / trendMax) * 100)}%`, backgroundColor: colors.emerald, borderRadius: 6 }} /></View><Text style={styles.caption}>{point.profileViews}</Text></View>)}</View></View></View>
    <SectionTitle title="Reviews" action="View all" onAction={() => router.push({ pathname: "/business/[id]", params: { id: business.id } })} />{summary.reviews.slice(0, 2).map((review) => <View key={review.id} style={[styles.card, { padding: 14, gap: 6 }]}><View style={styles.rowBetween}><Text style={styles.cardTitle}>{review.authorName}</Text><Text style={{ color: colors.warning, fontWeight: "800" }}>{"★".repeat(review.rating)}</Text></View><Text style={styles.body}>{review.body}</Text><Text style={styles.caption}>{review.title ?? "Local demo review"} · {review.createdAt.slice(0, 10)}</Text></View>)}
    <SectionTitle title="Milestones" action="Manage" onAction={() => router.push({ pathname: "/milestones", params: { businessId: business.id } })} />{summary.milestones.slice(-3).map((item) => <Pressable key={item.id} onPress={() => router.push({ pathname: "/milestones", params: { businessId: business.id } })} style={styles.actionTile}><View style={styles.tileIcon}><Ionicons name="trophy-outline" size={19} color={colors.emeraldDark} /></View><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.caption}>{item.date} · {item.description}</Text></View><Ionicons name="chevron-forward" size={18} color={colors.muted} /></Pressable>)}
    <SectionTitle title="Next opportunities" action="Explore ideas" onAction={() => router.push("/opportunities")} />{summary.opportunities.slice(0, 2).map((item) => <Pressable key={item.id} onPress={() => router.push("/opportunities")} style={[styles.card, { padding: 14, gap: 6 }]}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.caption}>{item.industry} · {item.county}</Text><Text style={styles.body}>{item.opportunity}</Text><Text style={styles.link}>View opportunity details</Text></Pressable>)}
    <SectionTitle title="Recent activity" />{summary.activity.slice(0, 4).map((item) => <View key={item.id} style={styles.actionTile}><View style={styles.tileIcon}><Ionicons name={item.kind === "review" ? "star-outline" : item.kind === "milestone" ? "trophy-outline" : "pulse-outline"} size={18} color={colors.emeraldDark} /></View><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.caption}>{item.detail}</Text></View></View>)}
    <Button title="Back to business management" variant="outline" icon="settings-outline" onPress={() => router.push("/business-management")} />
  </Page>;
}
