import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { Button, EmptyState, LocalNote, Page, SectionTitle, TopBar, styles } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { colors } from "@/theme/tokens";
import { hasBusinessRole } from "@/utils/business-permissions";
import { useThemeContext } from "@/lib/theme-provider";

const METRICS = [
  ["profileViews", "Profile views", "eye-outline"], ["postEngagement", "Post engagement", "heart-outline"], ["followersThisMonth", "New followers · month", "people-outline"], ["videoViews", "Video views", "play-circle-outline"], ["productViews", "Product views", "pricetag-outline"], ["enquiries", "Customer enquiries", "chatbubble-outline"],
] as const;
export default function AnalyticsScreen() {
  useThemeContext();
  const app = useAppStore(); const business = app.businesses.find((b) => b.id === app.activeBusinessId);
  if (!app.isAuthenticated) return <Page><TopBar title="Business analytics" back /><Text style={{ color: colors.ink }}>Sign in to manage business information.</Text><Button title="Sign in" onPress={() => router.push("/auth/login")} /></Page>;
  if (!business) return <Page><TopBar title="Business analytics" back /><Text style={styles.caption}>Select a business first.</Text></Page>;
  if (!hasBusinessRole(business, app.user.id)) return <Page><TopBar title="Business analytics" back /><EmptyState title="Owner access required" detail="Only this business's Owner or Administrator can view its analytics." icon="lock-closed-outline" action="Back to profile" onAction={() => router.push("/(tabs)/profile")} /></Page>;
  return <Page><TopBar title="Business analytics" back /><LocalNote text="Illustrative sample analytics · not connected to server events" /><View style={{ backgroundColor: colors.navy, borderRadius: 20, padding: 16, gap: 7 }}><Text style={{ color: colors.orange, fontSize: 11, fontWeight: "800" }}>THIS BUSINESS</Text><Text style={{ color: colors.white, fontSize: 22, fontWeight: "800" }}>{business.name}</Text><Text style={{ color: "#D9E2E9" }}>Snapshot · sample data for the last 30 days</Text></View>
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 9 }}>{METRICS.map(([key, label, icon]) => { const value = business.analytics[key]; return <View key={key} style={[styles.card, { width: "48%", padding: 13, gap: 8, flexGrow: 1 }]}><View style={styles.rowBetween}><Ionicons name={icon} size={18} color={colors.emerald} /><Text style={{ color: colors.success, fontSize: 11, fontWeight: "700" }}>Sample</Text></View><Text style={styles.sectionHeading}>{key === "postEngagement" ? `${value}%` : value.toLocaleString()}</Text><Text style={styles.caption}>{label}</Text></View>; })}</View>
    <SectionTitle title="Recent activity" />
    {["Profile views are up 12% in this sample period", "A product catalogue item received more than 60 sample views", "Your most engaged post was a founder update"].map((text, i) => <View key={text} style={styles.actionTile}><View style={styles.tileIcon}><Text style={{ color: colors.emeraldDark, fontWeight: "800" }}>{i + 1}</Text></View><Text style={[styles.body, { flex: 1 }]}>{text}</Text></View>)}
    <Button title="View business profile" variant="outline" icon="eye-outline" onPress={() => import("expo-router").then(({ router }) => router.push({ pathname: "/business/[id]", params: { id: business.id } }))} />
  </Page>;
}
