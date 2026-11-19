import { router } from "expo-router";
import { Text, View } from "react-native";
import { Button, EmptyState, Page, TopBar, styles } from "@/components/biz-ui";
import { OPPORTUNITIES } from "@/data/seed";
import { useAppStore } from "@/hooks/use-app-store";
import { colors } from "@/theme/tokens";
import { formatKes } from "@/utils/kenya";
import { useThemeContext } from "@/lib/theme-provider";

export default function SavedOpportunitiesScreen() {
  useThemeContext();
  const app = useAppStore();
  const ideas = OPPORTUNITIES.filter((item) => app.savedOpportunities.includes(item.id));
  if (!app.isAuthenticated) return <Page><TopBar title="Saved business ideas" back /><EmptyState title="Sign in to see saved ideas" detail="Bookmarks are tied to your local demo account." icon="lock-closed-outline" action="Sign in" onAction={() => router.push("/auth/login")} /></Page>;
  return <Page><TopBar title="Saved business ideas" back />{ideas.length ? ideas.map((idea) => <View key={idea.id} style={[styles.card, { padding: 14, gap: 8 }]}><Text style={styles.cardTitle}>{idea.title}</Text><Text style={styles.caption}>{idea.industry} · {idea.county}</Text><Text style={{ color: colors.emeraldDark, fontWeight: "800" }}>{formatKes(idea.startupCostMin)}–{formatKes(idea.startupCostMax)} estimated</Text><Text style={styles.caption}>Cost range is an estimate, not a verified fact.</Text><Button title="Remove from saved" icon="bookmark" variant="soft" small onPress={() => app.toggleOpportunitySave(idea.id)} /></View>) : <EmptyState title="No saved ideas" detail="Save an opportunity to return to it here." icon="bulb-outline" action="Browse opportunities" onAction={() => router.replace("/menu/activity/opportunities")} />}</Page>;
}
