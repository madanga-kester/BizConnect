import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Platform, Switch, Text, View } from "react-native";
import { ActionTile, EmptyState, LocalNote, Page, SectionTitle, TopBar, styles } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { getExpoPushRegistration } from "@/lib/api/push-registration";
import { useMabizServices, useMabizServiceMode } from "@/lib/services/service-provider";
import type { NotificationPreferences } from "@/lib/api/feature-contracts";
import { colors } from "@/theme/tokens";
import { useThemeContext } from "@/lib/theme-provider";

const DEFAULTS: NotificationPreferences = {
  inAppEnabled: true, pushEnabled: false, messages: true, likes: true, comments: true,
  follows: true, businessTeamActivity: true, businessUpdates: true,
};
function message(text: string): void { if (Platform.OS === "web") window.alert(text); else Alert.alert("Notification settings", text); }

export default function NotificationSettingsScreen() {
  useThemeContext();
  const app = useAppStore();
  const mode = useMabizServiceMode();
  const services = useMabizServices();
  const [preferences, setPreferences] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    if (mode !== "api" || !app.isAuthenticated) { setLoading(false); return; }
    void services.notifications.getPreferences().then((result) => {
      if (!alive) return;
      if (result.ok) setPreferences(result.data);
      else setError(`${result.error.message} (${result.error.code})`);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [app.isAuthenticated, mode, services.notifications]);

  const save = async (key: keyof NotificationPreferences, enabled: boolean) => {
    if (busy) return;
    setBusy(key); setError(null);
    if (key === "pushEnabled" && enabled) {
      try {
        const device = await getExpoPushRegistration();
        const registered = await services.notifications.registerDevice(device);
        if (!registered.ok) throw new Error(`${registered.error.message} (${registered.error.code})`);
      } catch (reason) {
        const text = reason instanceof Error ? reason.message : "Push registration could not be completed.";
        setError(text); message(text); setBusy(null); return;
      }
    }
    const result = await services.notifications.updatePreferences({ [key]: enabled });
    if (result.ok) setPreferences(result.data);
    else {
      const text = `${result.error.message} (${result.error.code})`;
      setError(text); message(text);
    }
    setBusy(null);
  };

  const switchRow = (key: keyof NotificationPreferences, title: string, detail: string) => <View key={key} style={styles.actionTile}>
    <View style={{ flex: 1, gap: 3 }}><Text style={styles.cardTitle}>{title}</Text><Text style={styles.caption}>{detail}</Text></View>
    <Switch accessibilityLabel={title} value={preferences[key]} disabled={loading || busy !== null} onValueChange={(value) => void save(key, value)} trackColor={{ false: colors.border, true: colors.emerald }} thumbColor={colors.white} />
  </View>;

  if (!app.isAuthenticated) return <Page><TopBar title="Notification settings" back /><EmptyState title="Sign in to manage preferences" detail="Notification preferences are tied to your account." action="Sign in" onAction={() => router.push("/auth/login")} /></Page>;
  if (mode !== "api") return <Page><TopBar title="Notification settings" back /><LocalNote text="Mock-local mode keeps sample notifications on this device and does not register push devices or call the notification API." /><ActionTile title="Back to notification centre" icon="notifications-outline" onPress={() => router.replace("/menu/activity/notifications")} /></Page>;

  return <Page>
    <TopBar title="Notification settings" back />
    <Text style={styles.caption}>These choices are stored on your account. Push delivery also depends on a valid Expo device token and server-side Expo provider configuration.</Text>
    {error ? <View style={styles.actionTile}><Text style={{ color: colors.danger }}>{error}</Text></View> : null}
    {loading ? <Text style={styles.caption}>Loading preferences…</Text> : <>
      <SectionTitle title="Delivery" />
      {switchRow("inAppEnabled", "In-app notifications", "Keep activity in your Mabiz notification centre.")}
      {switchRow("pushEnabled", "Push notifications", Platform.OS === "web" ? "Use the native iOS or Android app to register Expo push delivery." : "Ask for device permission and securely register this device with Expo Push.")}
      <SectionTitle title="Activity types" />
      {switchRow("messages", "Messages and enquiries", "New direct messages and business enquiries.")}
      {switchRow("likes", "Likes", "When someone likes your post.")}
      {switchRow("comments", "Comments and replies", "New comments and replies on your posts.")}
      {switchRow("follows", "New followers", "When someone follows your profile.")}
      {switchRow("businessTeamActivity", "Business team activity", "Invitations, membership changes and ownership transfers.")}
      {switchRow("businessUpdates", "Business and catalogue updates", "Relevant updates to followed business profiles and catalogues.")}
    </>}
  </Page>;
}
