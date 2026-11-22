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
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ConfirmModal, TopBar } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { t } from "@/i18n/translations";
import { colors, createThemedStyles } from "@/theme/tokens";
import {
  useMabizServices,
  useMabizServiceMode,
} from "@/lib/services/service-provider";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemeContext } from "@/lib/theme-provider";

type IconName = React.ComponentProps<typeof Ionicons>["name"];
type MenuItem = {
  title: string;
  detail?: string;
  icon: IconName;
  tone?: "orange";
  route?: string;
  onPress?: () => void;
  isSwitch?: boolean;
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
};

type MenuSection = {
  title: string;
  items: MenuItem[];
};

function feedback(message: string) {
  if (Platform.OS === "web") window.alert(message);
  else Alert.alert("Mabiz", message);
}

export default function MenuScreen() {
  useThemeContext();
  const app = useAppStore();
  const services = useMabizServices();
  const serviceMode = useMabizServiceMode();
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

  const authenticatedSections: MenuSection[] = [
    {
      title: "Account",
      items: [
        {
          title: "Personal details",
          detail: "Name, username, bio, town & county",
          icon: "person-circle-outline",
          route: "/menu/account/personal-details",
        },
      ],
    },
    {
      title: "How you use the app",
      items: [
        {
          title: "Saved",
          detail: `${app.savedPosts.length + app.savedStories.length} posts & stories saved`,
          icon: "bookmark-outline",
          route: "/menu/activity/saved",
        },
        {
          title: "Saved businesses",
          detail: "Places and founders to revisit",
          icon: "heart-outline",
          route: "/menu/activity/saved-businesses",
        },
        {
          title: "Archive & drafts",
          detail: `${app.drafts.length} drafts stored on this device`,
          icon: "archive-outline",
          route: "/menu/activity/drafts",
        },
        {
          title: "Your activity",
          detail: "Recently viewed posts, profiles & interactions",
          icon: "time-outline",
          route: "/menu/activity/your-activity",
        },
        {
          title: "Business ideas & opportunities",
          detail: "Saved businesses and business ideas",
          icon: "bulb-outline",
          route: "/menu/activity/saved-business-ideas",
        },
        serviceMode === "api"
          ? {
              title: "Notification delivery preferences",
              detail: "Manage in-app, activity and Expo push settings for your account",
              icon: "options-outline",
              route: "/menu/activity/notification-settings",
            }
          : {
              title: "Sample notifications",
              detail: "Local demo preference; no push device is registered in mock mode",
              icon: "notifications-outline",
              isSwitch: true,
              switchValue: app.settings.notifications,
              onSwitchChange: (value: boolean) => app.updateSettings({ notifications: value }),
            },
      ].filter(Boolean) as MenuItem[],
    },
    {
      title: "Subscription",
      items: [
        {
          title: "Subscriptions & Mabiz Pro",
          detail: "Manage creator and business verification plans",
          icon: "card-outline",
          tone: "orange",
          route: "/menu/subscriptions",
        },
      ],
    },
    {
      title: "Who can see your content",
      items: [
        {
          title: "Profile privacy",
          detail: "Account visibility and data controls",
          icon: "lock-closed-outline",
          route: "/menu/privacy/profile-privacy",
        },
        {
          title: "Blocked",
          detail: "Manage accounts you have restricted or blocked",
          icon: "ban-outline",
          route: "/menu/privacy/blocked",
        },
        {
          title: "Hide story",
          detail: "Control who can view your business & personal stories",
          icon: "eye-off-outline",
          route: "/menu/privacy/hide-story",
        },
      ],
    },
    {
      title: "How others can interact with you",
      items: [
        {
          title: "Messages and story replies",
          detail: "Control who can message you or reply to stories",
          icon: "chatbubble-ellipses-outline",
          route: "/menu/privacy/messages-replies",
        },
        {
          title: "Tags and mentions",
          detail: "Choose who can tag or @mention your profile",
          icon: "at-outline",
          route: "/menu/privacy/tags-mentions",
        },
        {
          title: "Comments",
          detail: "Manage comment filters and permissions",
          icon: "chatbox-outline",
          route: "/menu/privacy/comments",
        },
        {
          title: "Sharing",
          detail: "Allow others to reshare your posts and stories",
          icon: "share-social-outline",
          route: "/menu/privacy/sharing",
        },
        {
          title: "Followers & following",
          detail: "People and businesses you connect with",
          icon: "people-outline",
          route: "/menu/followers",
        },
        {
          title: "Follow and invite friends",
          detail: "Connect with founders and invite contacts to Mabiz",
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
      title: "Your app and media",
      items: [
        {
          title: "Appearance",
          detail: "Light or dark mode",
          icon: "contrast-outline",
          route: "/menu/app-media/appearance",
        },
        {
          title: "Language",
          detail: "English / Kiswahili",
          icon: "language-outline",
          route: "/menu/app-media/language",
        },
        {
          title: "Reduced data",
          detail: "Use fewer background loads and defer media",
          icon: "cellular-outline",
          route: "/menu/app-media/reduced-data",
        },
        {
          title: "Video autoplay",
          detail: "Choose whether videos start on their own",
          icon: "play-circle-outline",
          route: "/menu/app-media/video-autoplay",
        },
        {
          title: "Device permissions",
          detail: "Camera, photos, location and notifications access",
          icon: "phone-portrait-outline",
          route: "/menu/app-media/device-permissions",
        },
        {
          title: "Accessibility",
          detail: "Text sizing, contrast and motion preferences",
          icon: "accessibility-outline",
          route: "/menu/app-media/accessibility",
        },
      ],
    },
    {
      title: "More info and support",
      items: [
        {
          title: "Help",
          detail: "Help centre & community guidelines",
          icon: "help-circle-outline",
          route: "/menu/support/help",
        },
        {
          title: "Privacy Centre",
          detail: "Learn how Mabiz protects and manages your information",
          icon: "shield-checkmark-outline",
          route: "/menu/support/privacy-centre",
        },
        {
          title: "Profile status",
          detail: "Check account standing and community guideline status",
          icon: "checkmark-circle-outline",
          route: "/menu/support/profile-status",
        },
        {
          title: "About",
          detail: "Version 1.0 - Mabiz information & terms",
          icon: "information-circle-outline",
          route: "/menu/support/about",
        },
      ],
    },
  ];

  const guestSections: MenuSection[] = [
    {
      title: "Appearance",
      items: [
        {
          title: "Appearance",
          detail: "Light or dark mode",
          icon: "contrast-outline",
          route: "/menu/app-media/appearance",
        },
      ],
    },
  ];

  const sections = app.isAuthenticated ? authenticatedSections : guestSections;

  const renderMenuItem = (item: MenuItem, isLast: boolean) => (
    <TouchableOpacity
      key={item.title}
      style={[localStyles.menuItem, isLast && localStyles.menuItemLast]}
      onPress={
        item.isSwitch
          ? undefined
          : item.onPress ?? (() => router.push(item.route as never))
      }
      activeOpacity={item.isSwitch ? 1 : 0.6}
    >
      <View style={localStyles.menuItemLeft}>
        <View style={[localStyles.iconTile, item.tone === "orange" && localStyles.iconTileOrange]}>
          <Ionicons
            name={item.icon}
            size={19}
            color={item.tone === "orange" ? colors.warning : colors.emeraldDark}
          />
        </View>
        <View style={localStyles.menuItemTextContainer}>
          <Text style={localStyles.menuItemTitle}>{item.title}</Text>
          {item.detail && !item.isSwitch && (
            <Text style={localStyles.menuItemDetail} numberOfLines={1}>
              {item.detail}
            </Text>
          )}
        </View>
      </View>

      {item.isSwitch ? (
        <Switch
          value={item.switchValue}
          onValueChange={item.onSwitchChange}
          trackColor={{ false: colors.border, true: colors.emerald }}
          thumbColor="#FFFFFF"
          ios_backgroundColor={colors.border}
        />
      ) : (
        <Ionicons name="chevron-forward" size={16} color={colors.muted} />
      )}
    </TouchableOpacity>
  );

  const renderSection = (section: MenuSection, sectionIndex: number) => (
    <View key={sectionIndex} style={localStyles.section}>
      <Text style={localStyles.sectionHeader}>{section.title}</Text>
      <View style={localStyles.menuGroup}>
        {section.items.map((item, i) =>
          renderMenuItem(item, i === section.items.length - 1)
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={localStyles.safeArea} edges={["top"]}>
      <View style={localStyles.container}>
        <View style={{ paddingHorizontal: 16 }}><TopBar title="Settings" back /></View>

        <ScrollView
          contentContainerStyle={localStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={localStyles.profileCard}>
            <View style={localStyles.avatarRing}>
              {app.isAuthenticated && app.user.avatar ? (
                <Image
                  source={{ uri: app.user.avatar }}
                  style={localStyles.avatar}
                />
              ) : (
                <View style={localStyles.avatarFallback}>
                  <Ionicons name="person" size={32} color="#FFFFFF" />
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

          {sections.map((section, i) => renderSection(section, i))}

          {app.isAuthenticated && (
            <TouchableOpacity
              style={localStyles.signOutButton}
              onPress={() => setLogoutConfirm(true)}
              activeOpacity={0.6}
            >
              <Ionicons name="log-out-outline" size={18} color={colors.danger ?? "#EF4444"} />
              <Text style={localStyles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>

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

const localStyles = createThemedStyles(() => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  container: {
    flex: 1,
    backgroundColor: colors.canvas,
  },



  scrollContent: {
    paddingTop: 16,
    paddingBottom: 40,
  },

  profileCard: {
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 20,
    paddingVertical: 22,
    borderRadius: 22,
    backgroundColor: colors.surface,
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  avatarRing: {
    padding: 3,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: colors.emeraldFill,
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
    fontSize: 19,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.2,
  },
  signInLink: {
    marginTop: 12,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.emeraldFill,
  },
  signInLinkText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.white,
  },

  section: {
    marginBottom: 18,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.2,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  menuGroup: {
    marginHorizontal: 16,
    borderRadius: 22,
    backgroundColor: colors.surface,
    shadowColor: "#000000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },

  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconTile: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: colors.emeraldTint,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  iconTileOrange: {
    backgroundColor: colors.orangeTint,
  },
  menuItemTextContainer: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
  },
  menuItemDetail: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },

  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    minHeight: 50,
    borderRadius: 999,
    backgroundColor: colors.dangerTint,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.danger ?? "#EF4444",
  },
}));