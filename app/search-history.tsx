import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Alert, Platform, Pressable, Text } from "react-native";
import { Button, EmptyState, Page, TopBar, styles } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { colors } from "@/theme/tokens";
import { useThemeContext } from "@/lib/theme-provider";
function confirm(clear: () => void) { if (Platform.OS === "web") { if (window.confirm("Clear search history stored on this device?")) clear(); } else Alert.alert("Clear search history?", "This removes local search terms only.", [{ text: "Cancel", style: "cancel" }, { text: "Clear", style: "destructive", onPress: clear }]); }
export default function SearchHistoryScreen() { useThemeContext(); const app = useAppStore(); return <Page><TopBar title="Search history" back right={app.searchHistory.length ? <Button title="Clear" variant="quiet" small onPress={() => confirm(app.clearSearchHistory)} /> : null} />{app.searchHistory.length ? app.searchHistory.map((query) => <Pressable key={query} accessibilityRole="button" onPress={() => router.push({ pathname: "/search", params: { q: query } })} style={styles.actionTile}><Ionicons name="time-outline" size={18} color={colors.muted} /><Text style={[styles.body, { flex: 1 }]}>{query}</Text><Ionicons name="arrow-up-outline" size={17} color={colors.muted} /></Pressable>) : <EmptyState title="Search history is clear" detail="Searches you perform on this device will appear here." icon="search-outline" action="Start searching" onAction={() => router.replace("/search")} />}</Page>; }
