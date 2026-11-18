import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/theme/tokens";

const MENU_ITEMS = [
  { label: "Business videos", icon: "videocam-outline", path: "/videos" },
  { label: "Notifications", icon: "notifications-outline", path: "/menu/activity/notifications" },
  { label: "Messages", icon: "chatbubble-ellipses-outline", path: "/messages" },
] as const;

type MenuPath = (typeof MENU_ITEMS)[number]["path"];

type HomeQuickMenuProps = {
  visible: boolean;
  onClose: () => void;
  hasUnreadNotifications: boolean;
};

export function HomeQuickMenu({ visible, onClose, hasUnreadNotifications }: HomeQuickMenuProps) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (Platform.OS !== "web" || !visible || typeof window === "undefined") return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose, visible]);

  const navigate = (path: MenuPath) => {
    onClose();
    router.push(path);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close quick navigation"
          onPress={onClose}
          style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.14)" }]}
        />
        <View
          accessibilityLabel="Home quick navigation"
          accessibilityViewIsModal
          style={{
            position: "absolute",
            top: insets.top + 58,
            right: 14,
            width: 224,
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 16,
            paddingVertical: 8,
            shadowColor: "#000000",
            shadowOpacity: 0.18,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 8 },
            elevation: 8,
          }}
        >
          <Text style={{ color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 0.8, paddingHorizontal: 14, paddingTop: 5, paddingBottom: 7, textTransform: "uppercase" }}>
            Quick access
          </Text>
          {MENU_ITEMS.map((item, index) => {
            const unread = item.path === "/menu/activity/notifications" && hasUnreadNotifications;
            const accessibleLabel = unread ? "Notifications, unread" : item.label;

            return (
              <View key={item.path}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={accessibleLabel}
                  accessibilityHint={`Open ${item.label.toLowerCase()}`}
                  onPress={() => navigate(item.path)}
                  style={({ pressed }) => ({
                    minHeight: 46,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 11,
                    paddingHorizontal: 14,
                    opacity: pressed ? 0.72 : 1,
                  })}
                >
                  <Ionicons name={item.icon} size={19} color={colors.ink} />
                  <Text style={{ flex: 1, color: colors.ink, fontSize: 13, fontWeight: "600" }}>{item.label}</Text>
                  {unread ? (
                    <View accessibilityLabel="Unread notifications" style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.orange }} />
                  ) : (
                    <Ionicons name="chevron-forward" size={15} color={colors.muted} />
                  )}
                </Pressable>
                {index < MENU_ITEMS.length - 1 ? <View style={{ height: 1, backgroundColor: colors.border, marginLeft: 43, marginRight: 12 }} /> : null}
              </View>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}
