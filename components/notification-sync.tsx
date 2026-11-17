import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AppState, Platform } from "react-native";
import { useAppStore } from "@/hooks/use-app-store";
import { MessagingRealtimeClient } from "@/lib/api/messaging-realtime";
import { useMabizServices, useMabizServiceMode } from "@/lib/services/service-provider";
import { navigateToNotification } from "@/lib/notifications/navigation";

interface NotificationSyncValue {
  unreadCount: number;
  eventVersion: number;
  refreshUnread(): Promise<void>;
}
const NotificationSyncContext = createContext<NotificationSyncValue>({ unreadCount: 0, eventVersion: 0, refreshUnread: async () => undefined });

export function useNotificationSync(): NotificationSyncValue {
  return useContext(NotificationSyncContext);
}

export function NotificationSyncProvider({ children }: { children: React.ReactNode }) {
  const app = useAppStore();
  const mode = useMabizServiceMode();
  const services = useMabizServices();
  const [unreadCount, setUnreadCount] = useState(0);
  const [eventVersion, setEventVersion] = useState(0);
  const lastPushResponseId = useRef<string | null>(null);

  const refreshUnread = useCallback(async () => {
    if (mode !== "api" || !app.isAuthenticated) { setUnreadCount(0); return; }
    const result = await services.notifications.getUnreadCount();
    if (result.ok) setUnreadCount(result.data);
  }, [app.isAuthenticated, mode, services.notifications]);

  useEffect(() => {
    if (!app.hasHydrated) return;
    if (mode !== "api" || !app.isAuthenticated) { setUnreadCount(0); return; }
    let alive = true;
    let client: MessagingRealtimeClient | null = null;
    const sync = async () => {
      const result = await services.notifications.getUnreadCount();
      if (alive && result.ok) setUnreadCount(result.data);
    };
    void sync();
    const timer = setInterval(() => void sync(), 60_000);
    const appStateListener = AppState.addEventListener("change", (state) => { if (state === "active") void sync(); });
    try {
      client = new MessagingRealtimeClient();
      client.onNotification(() => {
        setEventVersion((value) => value + 1);
        void sync();
      });
      void client.connect().catch(() => undefined);
    } catch {
      // REST count refresh and the notification inbox remain available without a realtime connection.
    }
    return () => {
      alive = false;
      clearInterval(timer);
      appStateListener.remove();
      void client?.stop();
    };
  }, [app.hasHydrated, app.isAuthenticated, mode, services.notifications]);

  useEffect(() => {
    if (Platform.OS === "web") return;
    let active = true;
    let subscription: { remove(): void } | undefined;
    const openResponse = (data: Record<string, unknown>) => {
      const notificationId = typeof data.notificationId === "string" ? data.notificationId : undefined;
      if (notificationId && lastPushResponseId.current === notificationId) return;
      if (notificationId) lastPushResponseId.current = notificationId;
      if (notificationId && app.isAuthenticated && mode === "api") {
        void services.notifications.markRead(notificationId).then((result) => { if (result.ok) void refreshUnread(); });
      }
      setEventVersion((value) => value + 1);
      navigateToNotification({
        targetType: typeof data.targetType === "string" ? data.targetType : undefined,
        targetId: typeof data.targetId === "string" ? data.targetId : undefined,
        businessId: typeof data.businessId === "string" ? data.businessId : undefined,
        postId: typeof data.postId === "string" ? data.postId : undefined,
        conversationId: typeof data.conversationId === "string" ? data.conversationId : undefined,
        catalogItemId: typeof data.catalogItemId === "string" ? data.catalogItemId : undefined,
      });
    };
    void import("@/lib/api/push-registration").then(async ({ addPushNotificationResponseListener, getLastPushNotificationResponse }) => {
      if (!active) return;
      subscription = addPushNotificationResponseListener(openResponse);
      const initial = await getLastPushNotificationResponse();
      if (active && initial) openResponse(initial);
    }).catch(() => undefined);
    return () => { active = false; subscription?.remove(); };
  }, [app.isAuthenticated, mode, refreshUnread, services.notifications]);

  const value = useMemo(() => ({ unreadCount, eventVersion, refreshUnread }), [unreadCount, eventVersion, refreshUnread]);
  return <NotificationSyncContext.Provider value={value}>{children}</NotificationSyncContext.Provider>;
}
