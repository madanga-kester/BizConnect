import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ConfirmModal } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { t } from "@/i18n/translations";
import { colors } from "@/theme/tokens";
import { useMabizServices } from "@/lib/services/service-provider";
import { SafeAreaView } from "react-native-safe-area-context";

type IconName = React.ComponentProps<typeof Ionicons>["name"];
type MenuItem = {
  title: string;
  icon: IconName;
  route?: string;
  onPress?: () => void;
};

type MenuSection = {
  header?: string;
  items: MenuItem[];
};

function feedback(message: string) {
  if (Platform.OS === "web") window.alert(message);
  else Alert.alert("Mabiz", message);
}

export default function MenuScreen() {
  const app = useAppStore();
  const services = useMabizServices();
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const language = app.settings.language;

  const signOut = async () => {
    const result = await services.auth.logout();
    await app.setAuthenticated(false);
    feedback(
      result.ok
        ? "You are signed out."
        : "The server may not have received logout, but this device cleared its session. Please sign in again if needed."
    );
    router.replace("/auth");
  };

  // ─── Menu Data Structure (Mapped to match the visual design) ───────────
  const authenticatedSections: MenuSection[] = [
    {
      items: [
        {
          title: "Edit Profile",
          icon: "person-outline",
          route: "/menu/account/personal-details",
        },
        {
          title: "Privacy Policy",
          icon: "shield-checkmark-outline",
          route: "/menu/support/privacy-centre",
        },
      ],
    },
    {
      header: "Preferences",
      items: [
        {
          title: "Notifications",
          icon: "notifications-outline",
          route: "/menu/activity/notifications",
        },
        {
          title: "Appearance",
          icon: "contrast-outline",
          route: "/menu/app-media/appearance",
        },
        {
          title: "Language",
          icon: "language-outline",
          route: "/menu/app-media/language",
        },
      ],
    },
    {
      header: "Activity",
      items: [
        {
          title: "Saved",
          icon: "bookmark-outline",
          route: "/menu/activity/saved",
        },
        {
          title: "Archive & drafts",
          icon: "archive-outline",
          route: "/menu/activity/drafts",
        },
        {
          title: "Your activity",
          icon: "time-outline",
          route: "/menu/activity/your-activity",
        },
      ],
    },
    {
      header: "Connections",
      items: [
        {
          title: "Followers & following",
          icon: "people-outline",
          route: "/menu/followers",
        },
        {
          title: "Invite friends",
          icon: "person-add-outline",
          onPress: () => {
            void Share.share({
              message: `Join me on Mabiz (@${app.user.username}) to connect with local businesses and founders!`,
            });
          },
        },
      ],
    },
    {
      header: "Support",
      items: [
        {
          title: "Help",
          icon: "help-circle-outline",
          route: "/menu/support/help",
        },
        {
          title: "About",
          icon: "information-circle-outline",
          route: "/menu/support/about",
        },
      ],
    },
  ];

  const guestSections: MenuSection[] = [
    {
      items: [
        {
          title: "Appearance",
          icon: "contrast-outline",
          route: "/menu/app-media/appearance",
        },
      ],
    },
  ];

  const sections = app.isAuthenticated ? authenticatedSections : guestSections;

  // ─── Renderers ─────────────────────────────────────────────────────────
  const renderMenuItem = (item: MenuItem, isLast: boolean) => (
    <TouchableOpacity
      key={item.title}
      style={[localStyles.menuItem, isLast && localStyles.menuItemLast]}
      onPress={item.onPress ?? (() => router.push(item.route as never))}
      activeOpacity={0.6}
    >
      <View style={localStyles.menuItemLeft}>
        <Ionicons name={item.icon} size={20} color="#6B7280" />
        <Text style={localStyles.menuItemTitle}>{item.title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
    </TouchableOpacity>
  );

  const renderSection = (section: MenuSection, sectionIndex: number) => (
    <View key={sectionIndex} style={localStyles.section}>
      {section.header && (
        <Text style={localStyles.sectionHeader}>{section.header}</Text>
      )}
      <View style={localStyles.menuGroup}>
        {section.items.map((item, i) =>
          renderMenuItem(item, i === section.items.length - 1)
        )}
      </View>
    </View>
  );

  // ─── Main Render ───────────────────────────────────────────────────────
  return (
    <SafeAreaView style={localStyles.safeArea} edges={["top"]}>
      <View style={localStyles.container}>
        {/* Header */}
        <View style={localStyles.header}>
          <Text style={localStyles.headerTitle}>Settings</Text>
        </View>

        <ScrollView
          contentContainerStyle={localStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Section */}
          <View style={localStyles.profileSection}>
            <View style={localStyles.avatarContainer}>
              {app.isAuthenticated && app.user.avatarUri ? (
                <Image
                  source={{ uri: app.user.avatarUri }}
                  style={localStyles.avatar}
                />
              ) : (
                <View style={localStyles.avatarFallback}>
                  <Ionicons name="person" size={36} color="#FFFFFF" />
                </View>
              )}
            </View>
            <Text style={localStyles.profileName}>
              {app.isAuthenticated
                ? app.user.name || app.user.username
                : "Guest"}
            </Text>
            {!app.isAuthenticated && (
              <TouchableOpacity
                style={localStyles.signInLink}
                onPress={() => router.push("/auth/login")}
              >
                <Text style={localStyles.signInLinkText}>
                  {t("signIn", language)}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Menu Sections */}
          {sections.map((section, i) => renderSection(section, i))}

          {/* Sign Out Button */}
          {app.isAuthenticated && (
            <TouchableOpacity
              style={localStyles.signOutButton}
              onPress={() => setLogoutConfirm(true)}
              activeOpacity={0.6}
            >
              <Text style={localStyles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        visible={logoutConfirm}
        title="Sign out?"
        detail="You can browse public businesses while signed out. Interactions that require authentication will ask you to sign in again."
        confirmLabel="Sign out"
        onCancel={() => setLogoutConfirm(false)}
        onConfirm={() => {
          setLogoutConfirm(false);
          void signOut();
        }}
      />
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────
const localStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  // Header
  header: {
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111827",
    letterSpacing: -0.2,
  },

  // Scroll
  scrollContent: {
    paddingHorizontal: 0,
    paddingBottom: 40,
  },

  // Profile
  profileSection: {
    alignItems: "center",
    paddingVertical: 28,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  avatarFallback: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.emerald,
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111827",
  },
  signInLink: {
    marginTop: 8,
  },
  signInLinkText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.emerald,
  },

  // Sections
  section: {
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "500",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    paddingHorizontal: 20,
    marginBottom: 8,
    marginTop: 4,
  },
  menuGroup: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#F3F4F6",
  },

  // Menu Item
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F3F4F6",
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 15,
    fontWeight: "400",
    color: "#1F2937",
    marginLeft: 14,
  },

  // Sign Out
  signOutButton: {
    alignItems: "center",
    paddingVertical: 20,
    marginTop: 16,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#EF4444",
  },
});