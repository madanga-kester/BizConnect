import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { Platform, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { HapticTab } from "@/components/haptic-tab";
import { colors, getTabBarColors } from "@/theme/tokens";
import { useAppStore } from "@/hooks/use-app-store";
import { t } from "@/i18n/translations";
import { useThemeContext } from "@/lib/theme-provider";
import { useMabizServiceMode } from "@/lib/services/service-provider";
import { useNotificationSync } from "@/components/notification-sync";

type IoniconName = ComponentProps<typeof Ionicons>["name"];

const TAB_ICONS: Record<string, IoniconName> = {
  index: "home-outline",
  discover: "compass-outline",
  create: "add-circle-outline",
  stories: "book-outline",
  notifications: "notifications-outline",
  profile: "person-circle-outline",
};

const getTabIconName = (routeName: string): IoniconName => TAB_ICONS[routeName] ?? "help-circle-outline";

export default function TabLayout() {
  const app = useAppStore();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useThemeContext();
  const mode = useMabizServiceMode();
  const notificationSync = useNotificationSync();
  const unreadNotifications = mode === "api" ? notificationSync.unreadCount : app.notifications.filter((item) => !item.read).length;
  const tabBarColors = getTabBarColors(colorScheme);
  const bottomPadding = Platform.OS === "web" ? 10 : Math.max(insets.bottom, 8);
  return <Tabs screenOptions={({ route }) => ({
    headerShown: false,
    tabBarButton: HapticTab,
    tabBarActiveTintColor: colors.emerald,
    tabBarInactiveTintColor: colors.muted,
    tabBarLabelStyle: { fontSize: 10, fontWeight: "700", marginBottom: 1 },
    tabBarIcon: ({ color, focused }) => <View>
      <Ionicons name={getTabIconName(route.name)} size={focused ? 23 : 21} color={typeof color === "string" ? color : focused ? colors.emerald : colors.muted} />
      {route.name === "notifications" && unreadNotifications > 0 ? <View accessibilityLabel={`${unreadNotifications} unread notifications`} style={{ position: "absolute", top: -5, right: -10, minWidth: 15, height: 15, borderRadius: 8, paddingHorizontal: 3, backgroundColor: colors.orange, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: tabBarColors.backgroundColor }}><Text style={{ fontSize: 9, lineHeight: 11, color: colors.white, fontWeight: "800" }}>{unreadNotifications > 9 ? "9+" : unreadNotifications}</Text></View> : null}
    </View>,
    tabBarStyle: { paddingTop: 6, paddingBottom: bottomPadding, height: 58 + bottomPadding, backgroundColor: tabBarColors.backgroundColor, borderTopColor: tabBarColors.borderTopColor, borderTopWidth: 1 },
  })}>
    <Tabs.Screen name="index" options={{ title: t("home", app.settings.language) }} />
    <Tabs.Screen name="discover" options={{ title: t("discover", app.settings.language) }} />
    <Tabs.Screen name="create" options={{ title: t("create", app.settings.language), tabBarActiveTintColor: colors.orange }} />
    <Tabs.Screen name="stories" options={{ title: t("stories", app.settings.language) }} />
    <Tabs.Screen name="notifications" options={{ title: "Alerts" }} />
    <Tabs.Screen name="profile" options={{ title: t("profile", app.settings.language) }} />
  </Tabs>;
}
