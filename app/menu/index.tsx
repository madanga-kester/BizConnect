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
          icon: "person-outline",
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
          icon: "time-outline",
          route: "/menu/activity/drafts",
        },
        {
          title: "Your activity",
          detail: "Recently viewed posts, profiles & interactions",
          icon: "analytics-outline",
          route: "/menu/activity/your-activity",
        },
        {
          title: "Business ideas & opportunities",
          detail: "Saved businesses and business ideas",
          icon: "sparkles-outline",
          route: "/menu/activity/saved-business-ideas",
        },
        serviceMode === "api"
          ? {
              title: "Notification delivery preferences",
              detail: "Manage in-app, activity and Expo push settings for your account",
              icon: "notifications-outline",
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
          icon: "checkmark-seal-outline",
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
          icon: "paper-plane-outline",
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
          icon: "chatbubble-outline",
          route: "/menu/privacy/comments",
        },
        {
          title: "Sharing",
          detail: "Allow others to reshare your posts and stories",
          icon: "repeat-outline",
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
          icon: "moon-outline",
          route: "/menu/app-media/appearance",
        },
        {
          title: "Language",
          detail: "English / Kiswahili",
          icon: "globe-outline",
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
          icon: "play-outline",
          route: "/menu/app-media/video-autoplay",
        },
        {
          title: "Device permissions",
          detail: "Camera, photos, location and notifications access",
          icon: "key-outline",
          route: "/menu/app-media/device-permissions",
        },
        {
          title: "Accessibility",
          detail: "Text sizing, contrast and motion preferences",
          icon: "eye-outline",
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
          icon: "help-buoy-outline",
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
          icon: "person-circle-outline",
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
          icon: "moon-outline",
          route: "/menu/app-media/appearance",
        },
      ],
    },
  ];

  const sections = app.isAuthenticated ? authenticatedSections : guestSections;

  const renderMenuItem = (item: MenuItem) => (
    <TouchableOpacity
      key={item.title}
      style={localStyles.menuItem}
      onPress={
        item.isSwitch
          ? undefined
          : item.onPress ?? (() => router.push(item.route as never))
      }
      activeOpacity={item.isSwitch ? 1 : 0.5}
    >
      <View style={localStyles.menuItemLeft}>
        <View style={localStyles.iconContainer}>
          <Ionicons
            name={item.icon}
            size={23}
            color={item.tone === "orange" ? colors.warning : colors.ink}
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
          thumbColor={colors.white}
          ios_backgroundColor={colors.border}
        />
      ) : (
        <Ionicons name="chevron-forward" size={18} color={colors.muted} />
      )}
    </TouchableOpacity>
  );

  const renderSection = (section: MenuSection, sectionIndex: number) => (
    <View
      key={sectionIndex}
      style={[
        localStyles.section,
        sectionIndex > 0 && localStyles.sectionDivider,
      ]}
    >
      <Text style={localStyles.sectionHeader}>{section.title}</Text>
      <View style={localStyles.menuGroup}>
        {section.items.map((item) => renderMenuItem(item))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={localStyles.safeArea} edges={["top"]}>
      <View style={localStyles.container}>
        <View style={localStyles.topBarWrapper}>
          <TopBar title="Settings and activity" back />
        </View>

        <ScrollView
          contentContainerStyle={localStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={localStyles.profileHeader}>
            <View style={localStyles.avatarRing}>
              {app.isAuthenticated && app.user.avatar ? (
                <Image
                  source={{ uri: app.user.avatar }}
                  style={localStyles.avatar}
                />
              ) : (
                <View style={localStyles.avatarFallback}>
                  <Ionicons name="person" size={32} color={colors.white} />
                </View>
              )}
            </View>
            <Text style={localStyles.profileName}>
              {app.isAuthenticated
                ? app.user.name || app.user.username
                : "Guest"}
            </Text>
            {app.isAuthenticated && app.user.username && (
              <Text style={localStyles.profileHandle}>@{app.user.username}</Text>
            )}
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

          <View style={localStyles.footerSection}>
            {app.isAuthenticated && (
              <TouchableOpacity
                style={localStyles.signOutButton}
                onPress={() => setLogoutConfirm(true)}
                activeOpacity={0.5}
              >
                <Ionicons
                  name="log-out-outline"
                  size={22}
                  color={colors.danger}
                />
                <Text style={localStyles.signOutText}>Log out</Text>
              </TouchableOpacity>
            )}
          </View>
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

const localStyles = createThemedStyles(() =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    container: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    topBarWrapper: {
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    scrollContent: {
      paddingBottom: 48,
      backgroundColor: colors.surface,
    },

    profileHeader: {
      alignItems: "center",
      paddingVertical: 24,
      paddingHorizontal: 20,
      backgroundColor: colors.surface,
      borderBottomWidth: 6,
      borderBottomColor: colors.canvas,
    },
    avatarRing: {
      padding: 2,
      borderRadius: 48,
      borderWidth: 1.5,
      borderColor: colors.emeraldFill,
      marginBottom: 10,
    },
    avatar: {
      width: 78,
      height: 78,
      borderRadius: 39,
    },
    avatarFallback: {
      width: 78,
      height: 78,
      borderRadius: 39,
      backgroundColor: colors.emerald,
      alignItems: "center",
      justifyContent: "center",
    },
    profileName: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.ink,
      letterSpacing: -0.2,
    },
    profileHandle: {
      fontSize: 13,
      color: colors.muted,
      marginTop: 2,
    },
    signInLink: {
      marginTop: 12,
      paddingHorizontal: 24,
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
      paddingTop: 18,
      paddingBottom: 8,
      backgroundColor: colors.surface,
    },
    sectionDivider: {
      borderTopWidth: 6,
      borderTopColor: colors.canvas,
    },
    sectionHeader: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.muted,
      paddingHorizontal: 20,
      marginBottom: 6,
    },
    menuGroup: {
      backgroundColor: colors.surface,
    },

    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 13,
      backgroundColor: colors.surface,
    },
    menuItemLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      paddingRight: 12,
    },
    iconContainer: {
      width: 28,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 16,
    },
    menuItemTextContainer: {
      flex: 1,
    },
    menuItemTitle: {
      fontSize: 15,
      fontWeight: "500",
      color: colors.ink,
    },
    menuItemDetail: {
      fontSize: 12,
      color: colors.muted,
      marginTop: 2,
    },

    footerSection: {
      marginTop: 8,
      paddingTop: 12,
      borderTopWidth: 6,
      borderTopColor: colors.canvas,
    },
    signOutButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 14,
      gap: 16,
    },
    signOutText: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.danger,
    },
  })
);