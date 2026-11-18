import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Platform, Share, Switch, Text, View } from "react-native";
import { ActionTile, Button, ConfirmModal, LocalNote, Page, SectionTitle, TopBar, styles } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { t } from "@/i18n/translations";
import { colors } from "@/theme/tokens";
import { useMabizServices, useMabizServiceMode } from "@/lib/services/service-provider";

type IconName = React.ComponentProps<typeof Ionicons>["name"];
type Item = { title: string; detail?: string; icon: IconName; route?: string; onPress?: () => void };

function feedback(message: string) {
  if (Platform.OS === "web") window.alert(message);
  else Alert.alert("Mabiz", message);
}

export default function MenuScreen() {
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

  const switchRow = (label: string, detail: string, value: boolean, onValueChange: (value: boolean) => void) => (
    <View style={styles.actionTile}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{label}</Text>
        <Text style={styles.caption}>{detail}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.emerald }}
        thumbColor={colors.white}
      />
    </View>
  );

  const renderItems = (items: Item[]) =>
    items.map((item) => (
      <ActionTile
        key={item.title}
        title={item.title}
        detail={item.detail}
        icon={item.icon}
        onPress={item.onPress ?? (() => router.push(item.route as never))}
      />
    ));

  if (!app.isAuthenticated) {
    return (
      <Page>
        <TopBar title="Menu" back />
        <LocalNote text={t("appearanceLocalOnly", language)} />
        {renderItems([
          { title: "Appearance", detail: "Light or dark mode", icon: "contrast-outline", route: "/menu/app-media/appearance" },
        ])}
        <ActionTile
          title={t("signIn", language)}
          detail={t("accountSettingsRequireSignIn", language)}
          icon="log-in-outline"
          onPress={() => router.push("/auth/login")}
        />
      </Page>
    );
  }

  const account: Item[] = [
    { title: "Personal details", detail: "Name, username, bio, town & county", icon: "person-circle-outline", route: "/menu/account/personal-details" },
  ];

  const howYouUse: Item[] = [
    { title: "Saved", detail: `${app.savedPosts.length + app.savedStories.length} posts & stories saved`, icon: "bookmark-outline", route: "/menu/activity/saved" },
    { title: "Saved businesses", detail: "Places and founders to revisit", icon: "heart-outline", route: "/menu/activity/saved-businesses" },
    { title: "Archive & drafts", detail: `${app.drafts.length} drafts stored on this device`, icon: "archive-outline", route: "/menu/activity/drafts" },
    { title: "Your activity", detail: "Recently viewed posts, profiles & interactions", icon: "time-outline", route: "/menu/activity/your-activity" },
    { title: "Business ideas & opportunities", detail: "Saved opportunities and founder resources", icon: "bulb-outline", route: "/menu/activity/opportunities" },
    { title: "Notifications", detail: "View alerts and activity updates", icon: "notifications-outline", route: "/menu/activity/notifications" },
  ];

  const subscription: Item[] = [
    { title: "Subscriptions & Mabiz Pro", detail: "Manage creator and business verification plans", icon: "card-outline", route: "/menu/subscriptions" },
  ];

  const whoCanSee: Item[] = [
    { title: "Profile privacy", detail: "Account visibility and data controls", icon: "lock-closed-outline", route: "/menu/privacy/profile-privacy" },
    { title: "Blocked", detail: "Manage accounts you have restricted or blocked", icon: "ban-outline", route: "/menu/privacy/blocked" },
    { title: "Hide story", detail: "Control who can view your business & personal stories", icon: "eye-off-outline", route: "/menu/privacy/hide-story" },
  ];

  const interact: Item[] = [
    { title: "Messages and story replies", detail: "Control who can message you or reply to stories", icon: "chatbubble-ellipses-outline", route: "/menu/privacy/messages-replies" },
    { title: "Tags and mentions", detail: "Choose who can tag or @mention your profile", icon: "at-outline", route: "/menu/privacy/tags-mentions" },
    { title: "Comments", detail: "Manage comment filters and permissions", icon: "chatbox-outline", route: "/menu/privacy/comments" },
    { title: "Sharing", detail: "Allow others to reshare your posts and stories", icon: "share-social-outline", route: "/menu/privacy/sharing" },
    { title: "Followers & following", detail: "People and businesses you connect with", icon: "people-outline", route: "/menu/followers" },
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
  ];

  const appAndMedia: Item[] = [
    { title: "Appearance", detail: "Light or dark mode", icon: "contrast-outline", route: "/menu/app-media/appearance" },
    { title: "Language", detail: "English / Kiswahili", icon: "language-outline", route: "/menu/app-media/language" },
    { title: "Reduced data", detail: "Use fewer background loads and defer media", icon: "cellular-outline", route: "/menu/app-media/reduced-data" },
    { title: "Video autoplay", detail: "Choose whether videos start on their own", icon: "play-circle-outline", route: "/menu/app-media/video-autoplay" },
    { title: "Device permissions", detail: "Camera, photos, location and notifications access", icon: "phone-portrait-outline", route: "/menu/app-media/device-permissions" },
    { title: "Accessibility", detail: "Text sizing, contrast and motion preferences", icon: "accessibility-outline", route: "/menu/app-media/accessibility" },
  ];

  const support: Item[] = [
    { title: "Help", detail: "Help centre & community guidelines", icon: "help-circle-outline", route: "/menu/support/help" },
    { title: "Privacy Centre", detail: "Learn how Mabiz protects and manages your information", icon: "shield-checkmark-outline", route: "/menu/support/privacy-centre" },
    { title: "Profile status", detail: "Check account standing and community guideline status", icon: "checkmark-circle-outline", route: "/menu/support/profile-status" },
    { title: "About", detail: "Version 1.0 - Mabiz information & terms", icon: "information-circle-outline", route: "/menu/support/about" },
  ];

  return (
    <Page>
      <TopBar title="Menu" back />
      <LocalNote text="Preferences and account state are stored on this device." />

      <SectionTitle title="Account" />
      {renderItems(account)}

      <SectionTitle title="How you use the app" />
      {renderItems(howYouUse)}
      {serviceMode === "api"
        ? renderItems([
            {
              title: "Notification delivery preferences",
              detail: "Manage in-app, activity and Expo push settings for your account",
              icon: "options-outline",
              route: "/menu/activity/notification-settings",
            },
          ])
        : switchRow(
            "Sample notifications",
            "Local demo preference; no push device is registered in mock mode",
            app.settings.notifications,
            (value) => app.updateSettings({ notifications: value })
          )}
    

      <SectionTitle title="Subscription" />
      {renderItems(subscription)}

      <SectionTitle title="Who can see your content" />
      {renderItems(whoCanSee)}

      <SectionTitle title="How others can interact with you" />
      {renderItems(interact)}

      <SectionTitle title="Your app and media" />
      {renderItems(appAndMedia)}

      <SectionTitle title="More info and support" />
      {renderItems(support)}
      <Button title="Log out" icon="log-out-outline" variant="outline" onPress={() => setLogoutConfirm(true)} />
      <Text style={styles.caption}>Signing out ends your session on this device and, when reachable, on the server.</Text>

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
    </Page>
  );
}
