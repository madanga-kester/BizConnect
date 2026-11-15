import { router } from "expo-router";
import { Share, Text, View } from "react-native";
import { Button, EmptyState, LocalNote, Page, TopBar, styles } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { formatDate } from "@/utils/kenya";

export default function DataExportScreen() {
  const app = useAppStore();
  const exportData = async () => {
    const report = { exportedAt: new Date().toISOString(), exportScope: "Local BizConnect frontend demo state; not server account data", profile: { id: app.user.id, username: app.user.username, name: app.user.name, email: app.user.email, phone: app.user.phone, bio: app.user.bio, town: app.user.town, county: app.user.county, interests: app.user.interests, privateProfile: app.user.privateProfile }, settings: app.settings, followedBusinesses: app.followedBusinesses, followedPeople: app.followedPeople, savedPosts: app.savedPosts, savedStories: app.savedStories, savedBusinesses: app.savedBusinesses, drafts: app.drafts, searchHistory: app.searchHistory, blockedUsers: app.blockedUsers };
    try { await Share.share({ title: "BizConnect local data export", message: JSON.stringify(report, null, 2) }); } catch {}
  };
  if (!app.isAuthenticated) return <Page><TopBar title="Export your data" back /><EmptyState title="Sign in to export your profile data" detail="A local export is available only for your authenticated demo profile." icon="lock-closed-outline" action="Sign in" onAction={() => router.push("/auth/login")} /></Page>;
  return <Page><TopBar title="Export your data" back /><LocalNote text="The export covers this device's demo data only; there is no server account to query." /><View style={[styles.card, { padding: 15, gap: 9 }]}><Text style={styles.sectionHeading}>Your local data, in one place.</Text><Text style={styles.body}>Prepare a readable JSON export of profile details, preferences, follows, saved content, drafts, search history and blocked-user IDs. You decide whether and where to share it.</Text><Text style={styles.caption}>Generated {formatDate(new Date())} · no data is uploaded.</Text></View><Button title="Create and share export" icon="share-outline" onPress={() => void exportData()} /><Text style={styles.caption}>Media files and private system credentials are intentionally excluded. Actual account export requires a future authenticated API endpoint.</Text></Page>;
}
