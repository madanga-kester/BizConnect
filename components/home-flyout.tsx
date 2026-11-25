import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar, MediaImage } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { t } from "@/i18n/translations";
import { colors, createThemedStyles } from "@/theme/tokens";
import { useThemeContext } from "@/lib/theme-provider";

type FlyoutPath =
  | "/discover"
  | "/stories"
  | "/menu"
  | "/menu/activity/saved"
  | "/menu/activity/drafts"
  | "/menu/followers"
  | "/create-business"
  | "/business-management"
  | "/catalog-management"
  | "/analytics"
  | "/team"
  | "/verification";

type FlyoutLink = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  path: FlyoutPath;
};

const YOUR_STUFF: FlyoutLink[] = [
  { icon: "bookmark-outline", label: "Saved", path: "/menu/activity/saved" },
  { icon: "document-text-outline", label: "Drafts", path: "/menu/activity/drafts" },
  { icon: "people-outline", label: "Followers", path: "/menu/followers" },
];

const BUSINESS_TOOLS: FlyoutLink[] = [
  { icon: "storefront-outline", label: "Manage business", path: "/business-management" },
  { icon: "cube-outline", label: "Catalog", path: "/catalog-management" },
  { icon: "bar-chart-outline", label: "Analytics", path: "/analytics" },
  { icon: "people-circle-outline", label: "Team", path: "/team" },
  { icon: "shield-checkmark-outline", label: "Verification", path: "/verification" },
];

export type HomeFlyoutUpdate = {
  businessId: string;
  postId: string;
  name: string;
  logo?: string;
  cover?: string;
};

type HomeFlyoutProps = {
  visible: boolean;
  onClose: () => void;
  updates?: HomeFlyoutUpdate[];
};

export function HomeFlyout({ visible, onClose, updates = [] }: HomeFlyoutProps) {
  useThemeContext();
  const app = useAppStore();
  const ownsBusiness = app.user
    ? app.businesses.some(
        (business) =>
          business.ownerId === app.user.id ||
          Boolean(business.team?.some((member) => member.userId === app.user.id))
      )
    : false;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const panelWidth = Math.min(width * 0.78, 320);
  const progress = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);
  const pendingPath = useRef<FlyoutPath | null>(null);
  const pendingPostId = useRef<string | null>(null);

  useEffect(() => {
    if (mounted) return;
    const postId = pendingPostId.current;
    if (postId) {
      pendingPostId.current = null;
      router.push({ pathname: "/post/[id]", params: { id: postId } });
      return;
    }
    const path = pendingPath.current;
    if (!path) return;
    pendingPath.current = null;
    router.push(path);
  }, [mounted]);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(progress, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(progress, {
        toValue: 0,
        duration: 180,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, progress]);

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [panelWidth, 0],
  });
  const scrimOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.45],
  });

  const goTo = (path: FlyoutPath) => {
    pendingPath.current = path;
    onClose();
  };

  const goToPost = (postId: string) => {
    pendingPostId.current = postId;
    onClose();
  };

  const renderLink = (link: FlyoutLink) => (
    <Pressable
      key={link.path}
      accessibilityRole="button"
      accessibilityLabel={link.label}
      onPress={() => goTo(link.path)}
      style={({ pressed }) => [
        localStyles.row,
        pressed && { opacity: 0.6 },
      ]}
    >
      <View style={localStyles.rowIcon}>
        <Ionicons name={link.icon} size={20} color={colors.emeraldDark} />
      </View>
      <Text style={localStyles.rowText}>{link.label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );

  return (
    <Modal
      transparent
      visible={mounted}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={localStyles.root}>
        <Animated.View
          pointerEvents="none"
                style={[
            StyleSheet.absoluteFill,
            localStyles.scrim,
            { opacity: scrimOpacity },
          ]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close menu"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View
          style={[
            localStyles.panel,
            {
              width: panelWidth,
              paddingTop: insets.top + 12,
              paddingBottom: Math.max(insets.bottom, 12),
              transform: [{ translateX }],
            },
          ]}
        >
          <View style={localStyles.panelHeader}>
            <Text style={localStyles.panelTitle}>Menu</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close menu"
              onPress={onClose}
              hitSlop={8}
              style={localStyles.closeButton}
            >
              <Ionicons name="close" size={22} color={colors.ink} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("discover", app.settings.language)}
            onPress={() => goTo("/discover")}
            style={({ pressed }) => [
              localStyles.row,
              pressed && { opacity: 0.6 },
            ]}
          >
            <View style={localStyles.rowIcon}>
              <Ionicons
                name="compass-outline"
                size={20}
                color={colors.emeraldDark}
              />
            </View>
            <Text style={localStyles.rowText}>
              {t("discover", app.settings.language)}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t("stories", app.settings.language)}
            onPress={() => goTo("/stories")}
            style={({ pressed }) => [
              localStyles.row,
              pressed && { opacity: 0.6 },
            ]}
          >
            <View style={localStyles.rowIcon}>
              <Ionicons
                name="book-outline"
                size={20}
                color={colors.emeraldDark}
              />
            </View>
            <Text style={localStyles.rowText}>
              {t("stories", app.settings.language)}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>

          {updates.length > 0 ? (
            <View style={localStyles.updatesSection}>
              <Text style={localStyles.sectionTitle}>Business updates</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10 }}
              >
                {updates.map((item) => (
                  <Pressable
                    key={item.businessId}
                    accessibilityRole="button"
                    accessibilityLabel={`Open update from ${item.name}`}
                    onPress={() => goToPost(item.postId)}
                    style={localStyles.updateTile}
                  >
                    {item.cover ? (
                      <View style={StyleSheet.absoluteFillObject}>
                        <MediaImage uri={item.cover} height={124} label={item.name} />
                      </View>
                    ) : null}
                    <View pointerEvents="none" style={localStyles.updateScrim} />
                    <View style={localStyles.updateAvatarWrap}>
                      <Avatar name={item.name} image={item.logo} size={26} ring />
                    </View>
                    <Text numberOfLines={2} style={localStyles.updateTitle}>
                      {item.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <View style={localStyles.section}>
            <Text style={localStyles.sectionTitle}>Your stuff</Text>
            {YOUR_STUFF.map(renderLink)}
          </View>

          <View style={localStyles.section}>
            <Text style={localStyles.sectionTitle}>Business tools</Text>
            {ownsBusiness ? (
              BUSINESS_TOOLS.map(renderLink)
            ) : (
              renderLink({
                icon: "add-circle-outline",
                label: "Create a business",
                path: "/create-business",
              })
            )}
          </View>

          <View style={localStyles.section}>
            {renderLink({
              icon: "settings-outline",
              label: "Settings and privacy",
              path: "/menu",
            })}
          </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const localStyles = createThemedStyles(() =>
  StyleSheet.create({
    root: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "flex-end",
    },
    scrim: {
      backgroundColor: "#000000",
    },
    panel: {
      height: "100%",
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
      borderTopLeftRadius: 22,
      borderBottomLeftRadius: 22,
      shadowColor: "#000000",
      shadowOpacity: 0.12,
      shadowRadius: 12,
      shadowOffset: { width: -4, height: 0 },
      elevation: 16,
    },
    panelHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingBottom: 12,
      marginBottom: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    panelTitle: {
      fontSize: 20,
      fontWeight: "800",
      letterSpacing: -0.3,
      color: colors.ink,
    },
    closeButton: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 12,
    },
    rowIcon: {
      width: 38,
      height: 38,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.emeraldTint,
    },
    rowText: {
      flex: 1,
      fontSize: 15,
      fontWeight: "700",
      color: colors.ink,
    },
    updatesSection: {
      marginTop: 12,
      paddingTop: 14,
      gap: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: "800",
      color: colors.ink,
    },
    section: {
      marginTop: 12,
      paddingTop: 10,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    updateTile: {
      width: 92,
      height: 124,
      borderRadius: 14,
      overflow: "hidden",
      backgroundColor: colors.navy,
    },
    updateScrim: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 64,
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    updateAvatarWrap: {
      position: "absolute",
      top: 8,
      left: 8,
    },
    updateTitle: {
      position: "absolute",
      left: 8,
      right: 8,
      bottom: 8,
      color: colors.white,
      fontSize: 12,
      fontWeight: "700",
    },
  })
);