import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, Text, View } from "react-native";
import { Button, EmptyState, LocalNote, Page, TopBar, styles } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { useMabizServices, useMabizServiceMode } from "@/lib/services/service-provider";
import { useNotificationSync } from "@/components/notification-sync";
import { navigateToNotification } from "@/lib/notifications/navigation";
import { colors } from "@/theme/tokens";
import { formatDate } from "@/utils/kenya";
import type { NotificationItem } from "@/types/domain";
import { useThemeContext } from "@/lib/theme-provider";

const ICONS = {
  follow: "person-add-outline", like: "heart-outline", comment: "chatbubble-outline", reply: "return-down-forward-outline",
  enquiry: "briefcase-outline", message: "mail-outline", update: "megaphone-outline", business_activity: "people-outline",
} as const;
function errorText(error: { code: string; message: string }): string { return `${error.message} (${error.code})`; }
function say(message: string): void { if (Platform.OS === "web") window.alert(message); else Alert.alert("Notifications", message); }

export default function NotificationsScreen() {
  useThemeContext();
  const app = useAppStore();
  const services = useMabizServices();
  const mode = useMabizServiceMode();
  const sync = useNotificationSync();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | undefined>();

  const load = useCallback(async (append = false) => {
    if (mode !== "api" || !app.isAuthenticated) return;
    if (append && !nextCursor) return;
    setError(null);
    if (append) setLoadingMore(true); else setLoading(true);
    const result = await services.notifications.list({ limit: 20, ...(append && nextCursor ? { cursor: nextCursor } : {}) });
    if (result.ok) {
      setItems((current) => append ? [...current, ...result.data.items.filter((item) => !current.some((existing) => existing.id === item.id))] : result.data.items);
      setNextCursor(result.data.nextCursor);
    } else setError(errorText(result.error));
    setLoading(false);
    setLoadingMore(false);
  }, [app.isAuthenticated, mode, nextCursor, services.notifications]);
  const loadRef = useRef(load);
  useEffect(() => { loadRef.current = load; }, [load]);

  useFocusEffect(useCallback(() => {
    if (mode === "api" && app.isAuthenticated) {
      void loadRef.current(false);
      void sync.refreshUnread();
    }
  }, [app.isAuthenticated, mode, sync.refreshUnread]));
  useEffect(() => {
    if (mode === "api" && app.isAuthenticated && sync.eventVersion > 0) void loadRef.current(false);
  }, [app.isAuthenticated, mode, sync.eventVersion]);

  if (!app.isAuthenticated) return <Page><TopBar title="Notifications" back /><EmptyState title="Sign in to see notifications" detail="Public business discovery is available without an account." icon="lock-closed-outline" action="Sign in" onAction={() => router.push("/auth/login")} /></Page>;

  const apiMode = mode === "api";
  const localItems = app.notifications;
  const displayedItems = apiMode ? items : localItems;
  const hasUnread = apiMode ? sync.unreadCount > 0 : localItems.some((item) => !item.read);

  const markAllRead = async () => {
    if (apiMode) {
      const result = await services.notifications.markAllRead();
      if (!result.ok) return say(errorText(result.error));
      setItems((current) => current.map((item) => ({ ...item, read: true })));
      await sync.refreshUnread();
    } else app.markAllNotificationsRead();
  };
  const markReadAndOpen = async (item: NotificationItem) => {
    if (apiMode) {
      if (!item.read) {
        const result = await services.notifications.markRead(item.id);
        if (!result.ok) return say(errorText(result.error));
        setItems((current) => current.map((existing) => existing.id === item.id ? { ...existing, read: true } : existing));
        await sync.refreshUnread();
      }
    } else app.markNotificationRead(item.id);
    navigateToNotification(item);
  };
  const dismiss = async (item: NotificationItem) => {
    const result = await services.notifications.dismiss(item.id);
    if (result.ok) {
      setItems((current) => current.filter((existing) => existing.id !== item.id));
      await sync.refreshUnread();
    } else say(errorText(result.error));
  };

  return <Page>
    <TopBar title="Notifications" back right={<View style={styles.row}>
      {hasUnread ? <Button title="Mark all read" variant="quiet" small onPress={() => void markAllRead()} /> : null}
      <Pressable accessibilityRole="button" accessibilityLabel="Notification settings" onPress={() => router.push(apiMode ? "/menu/activity/notification-settings" : "/menu")} style={styles.iconButton}><Ionicons name="options-outline" size={20} color={colors.ink} /></Pressable>
    </View>} />
    {!apiMode ? <LocalNote text="Notification items are sample events stored locally." /> : null}
    {loading && !displayedItems.length ? <View style={{ padding: 24, alignItems: "center", gap: 8 }}><ActivityIndicator color={colors.emerald} /><Text style={styles.caption}>Loading notifications…</Text></View> : null}
    {error ? <View style={styles.actionTile}><Text style={{ color: colors.danger, flex: 1 }}>{error}</Text><Pressable accessibilityRole="button" onPress={() => void load(false)}><Text style={{ color: colors.emerald, fontWeight: "700" }}>Retry</Text></Pressable></View> : null}
    {displayedItems.map((item) => <View key={item.id} style={[styles.actionTile, { backgroundColor: item.read ? colors.surface : colors.emeraldTint, borderColor: item.read ? colors.border : colors.emeraldDark }]}>
      <Pressable accessibilityRole="button" onPress={() => void markReadAndOpen(item)} style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
        <View style={styles.tileIcon}><Ionicons name={ICONS[item.kind]} size={18} color={colors.emeraldDark} /></View>
        <View style={{ flex: 1, gap: 3 }}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.body}>{item.detail}</Text>{item.actorName ? <Text style={styles.caption}>{item.actorName}</Text> : null}<Text style={styles.caption}>{formatDate(item.createdAt, app.settings.language)}</Text></View>
        {!item.read ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.orange }} /> : null}
      </Pressable>
      {apiMode ? <Pressable accessibilityRole="button" accessibilityLabel="Dismiss notification" onPress={() => void dismiss(item)} style={{ padding: 7 }}><Ionicons name="close" size={17} color={colors.muted} /></Pressable> : null}
    </View>)}
    {apiMode && nextCursor ? <Button title={loadingMore ? "Loading…" : "Load more"} variant="outline" disabled={loadingMore} onPress={() => void load(true)} /> : null}
    {!loading && !error && !displayedItems.length ? <EmptyState title="You’re all caught up" detail="New follows, replies, messages and business activity will show here." icon="notifications-outline" /> : null}
    <Pressable accessibilityRole="button" onPress={() => router.push(apiMode ? "/menu/activity/notification-settings" : "/menu")} style={{ padding: 10, alignItems: "center" }}><Text style={styles.link}>Manage notification preferences</Text></Pressable>
  </Page>;
}
