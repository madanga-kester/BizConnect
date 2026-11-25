import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Button, EmptyState, LocalNote, Page, SectionTitle, TopBar, styles } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { useMabizServices, useMabizServiceMode } from "@/lib/services/service-provider";
import { useNotificationSync } from "@/components/notification-sync";
import { navigateToNotification } from "@/lib/notifications/navigation";
import { colors } from "@/theme/tokens";
import { formatDate } from "@/utils/kenya";
import type { NotificationItem } from "@/types/domain";
import { useThemeContext } from "@/lib/theme-provider";
import { InboxActions, InboxShell } from "@/components/inbox-tabs";
import { MessagesPane } from "@/components/messages-pane";

const ICONS = {
  follow: "person-add-outline", like: "heart-outline", comment: "chatbubble-outline", reply: "return-down-forward-outline",
  enquiry: "briefcase-outline", message: "mail-outline", update: "megaphone-outline", business_activity: "people-outline",
} as const;
function errorText(error: { code: string; message: string }): string { return `${error.message} (${error.code})`; }
function say(message: string): void { if (Platform.OS === "web") window.alert(message); else Alert.alert("Notifications", message); }

const ORANGE_KINDS: ReadonlyArray<NotificationItem["kind"]> = ["like", "enquiry", "update"];

function groupByDay(list: NotificationItem[]) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const today = startOfToday.getTime();
  const yesterday = today - 86400000;
  const groups: { title: string; items: NotificationItem[] }[] = [
    { title: "Today", items: [] },
    { title: "Yesterday", items: [] },
    { title: "Earlier", items: [] },
  ];
  for (const item of list) {
    const time = new Date(item.createdAt).getTime();
    if (time >= today) groups[0].items.push(item);
    else if (time >= yesterday) groups[1].items.push(item);
    else groups[2].items.push(item);
  }
  return groups.filter((group) => group.items.length > 0);
}

function NotificationPill({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  useThemeContext();
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={{ paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, backgroundColor: selected ? colors.ink : colors.emeraldTint }}>
    <Text style={{ fontSize: 13, fontWeight: "700", color: selected ? colors.canvas : colors.emeraldDark }}>{label}</Text>
  </Pressable>;
}

function NotificationRow({ item, apiMode, dateLabel, isLast, onOpen, onDismiss }: { item: NotificationItem; apiMode: boolean; dateLabel: string; isLast: boolean; onOpen: () => void; onDismiss: () => void }) {
  useThemeContext();
  const orange = ORANGE_KINDS.includes(item.kind);
  return <View style={{ flexDirection: "row", alignItems: "center", borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth, borderBottomColor: colors.border }}>
    <Pressable accessibilityRole="button" onPress={onOpen} style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, paddingLeft: 14, paddingRight: apiMode ? 4 : 14 }}>
      <View style={{ width: 42, height: 42, borderRadius: 15, backgroundColor: orange ? colors.orangeTint : colors.emeraldTint, alignItems: "center", justifyContent: "center" }}>
        <Ionicons name={ICONS[item.kind]} size={20} color={orange ? colors.warning : colors.emeraldDark} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.cardTitle, { fontWeight: item.read ? "600" : "800" }]}>{item.title}</Text>
        <Text style={styles.body}>{item.detail}</Text>
        {item.actorName ? <Text style={styles.caption}>{item.actorName}</Text> : null}
        <Text style={styles.caption}>{dateLabel}</Text>
      </View>
      {!item.read ? <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: colors.orange }} /> : null}
    </Pressable>
    {apiMode ? <Pressable accessibilityRole="button" accessibilityLabel="Dismiss notification" onPress={onDismiss} hitSlop={6} style={{ padding: 10 }}><Ionicons name="close" size={17} color={colors.muted} /></Pressable> : null}
  </View>;
}

function NotificationsPane() {
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
  const [filter, setFilter] = useState<"all" | "unread">("all");

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

  if (!app.isAuthenticated) return <EmptyState title="Sign in to see notifications" detail="Public business discovery is available without an account." icon="lock-closed-outline" action="Sign in" onAction={() => router.push("/auth/login")} />;

  const apiMode = mode === "api";
  const localItems = app.notifications;
  const displayedItems = apiMode ? items : localItems;
  const hasUnread = apiMode ? sync.unreadCount > 0 : localItems.some((item) => !item.read);
  const shownItems = filter === "unread" ? displayedItems.filter((item) => !item.read) : displayedItems;
  const unreadTotal = displayedItems.filter((item) => !item.read).length;
  const groups = groupByDay(shownItems);
  const groupCardStyle = { borderRadius: 22, backgroundColor: colors.surface, shadowColor: "#000000", shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 };

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

  return <>
    <InboxActions
      showMarkAll={hasUnread}
      onMarkAll={() => void markAllRead()}
      onSettings={() => router.push(apiMode ? "/menu/activity/notification-settings" : "/menu")}
      settingsLabel="Notification settings"
    />
    <View style={styles.row}>
      <NotificationPill label="All" selected={filter === "all"} onPress={() => setFilter("all")} />
      <NotificationPill label={unreadTotal > 0 ? `Unread (${unreadTotal})` : "Unread"} selected={filter === "unread"} onPress={() => setFilter("unread")} />
    </View>
    {!apiMode ? <LocalNote text="Notification items are sample events stored locally." /> : null}
    {loading && !displayedItems.length ? <View style={{ padding: 24, alignItems: "center", gap: 8 }}><ActivityIndicator color={colors.emerald} /><Text style={styles.caption}>{"Loading notifications\u2026"}</Text></View> : null}
    {error ? <View style={styles.actionTile}><Text style={{ color: colors.danger, flex: 1 }}>{error}</Text><Pressable accessibilityRole="button" onPress={() => void load(false)}><Text style={{ color: colors.emerald, fontWeight: "700" }}>Retry</Text></Pressable></View> : null}
    {groups.map((group) => <View key={group.title} style={{ gap: 10 }}>
      <SectionTitle title={group.title} />
      <View style={groupCardStyle}>
        {group.items.map((item, index) => <NotificationRow key={item.id} item={item} apiMode={apiMode} dateLabel={formatDate(item.createdAt, app.settings.language)} isLast={index === group.items.length - 1} onOpen={() => void markReadAndOpen(item)} onDismiss={() => void dismiss(item)} />)}
      </View>
    </View>)}
    {apiMode && nextCursor ? <Button title={loadingMore ? "Loading\u2026" : "Load more"} variant="outline" disabled={loadingMore} onPress={() => void load(true)} /> : null}
    {!loading && !error && !shownItems.length ? <EmptyState title={filter === "unread" && displayedItems.length ? "No unread notifications" : "You're all caught up"} detail={filter === "unread" && displayedItems.length ? "Switch to All to see earlier notifications." : "New follows, replies, messages and business activity will show here."} icon="notifications-outline" /> : null}
    <Pressable accessibilityRole="button" onPress={() => router.push(apiMode ? "/menu/activity/notification-settings" : "/menu")} style={{ padding: 10, alignItems: "center" }}><Text style={styles.link}>Manage notification preferences</Text></Pressable>
  </>;
}

export default function NotificationsScreen() {
  useThemeContext();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  return <Page>
    <TopBar title="Inbox" back />
    <InboxShell initialTab={tab === "messages" ? "messages" : "alerts"} alerts={<NotificationsPane />} messages={<MessagesPane />} />
  </Page>;
}