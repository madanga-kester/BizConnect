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
  | "/verification"
  | "/(tabs)/profile";

type FlyoutLink = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  path: FlyoutPath;
};

const YOUR_STUFF: FlyoutLink[] = [
  {
    icon: "bookmark-outline",
    label: "Saved",
    path: "/menu/activity/saved",
  },
  {
    icon: "document-text-outline",
    label: "Drafts",
    path: "/menu/activity/drafts",
  },
  {
    icon: "people-outline",
    label: "Followers",
    path: "/menu/followers",
  },
];

const BUSINESS_TOOLS: FlyoutLink[] = [
  {
    icon: "storefront-outline",
    label: "Manage business",
    path: "/business-management",
  },
  {
    icon: "cube-outline",
    label: "Catalog",
    path: "/catalog-management",
  },
  {
    icon: "bar-chart-outline",
    label: "Analytics",
    path: "/analytics",
  },
  {
    icon: "people-circle-outline",
    label: "Team",
    path: "/team",
  },
  {
    icon: "shield-checkmark-outline",
    label: "Verification",
    path: "/verification",
  },
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

export function HomeFlyout({
  visible,
  onClose,
  updates = [],
}: HomeFlyoutProps) {
  useThemeContext();

  const app = useAppStore();

  const ownsBusiness = app.user
    ? app.businesses.some(
        (business) =>
          business.ownerId === app.user.id ||
          Boolean(
            business.team?.some(
              (member) => member.userId === app.user.id
            )
          )
      )
    : false;

  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();

  const progress = useRef(new Animated.Value(0)).current;

  const [mounted, setMounted] = useState(visible);

  const pendingPath = useRef<FlyoutPath | null>(null);
  const pendingPostId = useRef<string | null>(null);

  useEffect(() => {
    if (mounted) return;

    const postId = pendingPostId.current;

    if (postId) {
      pendingPostId.current = null;

      router.push({
        pathname: "/post/[id]",
        params: { id: postId },
      });

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

  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-height * 0.4, 0],
  });

  const cardOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const scrimOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  const goTo = (path: FlyoutPath) => {
    pendingPath.current = path;
    onClose();
  };

  const goToPost = (postId: string) => {
    pendingPostId.current = postId;
    onClose();
  };

  const lang = app.settings.language;
  const user = app.user as any;

  const userName: string = user?.name ?? "Guest";

  const userSub: string =
    user?.email ?? (user?.username ? `@${user.username}` : "");

  const isDesktop = width >= 768;

  const primaryLinks: FlyoutLink[] = [
    {
      icon: "compass-outline",
      label: t("discover", lang),
      path: "/discover",
    },
    {
      icon: "book-outline",
      label: t("stories", lang),
      path: "/stories",
    },
  ];

  

  const renderShortcut = (link: FlyoutLink) => {
    const highlighted = false;

    return (
      <Pressable
        key={link.path}
        accessibilityRole="button"
        accessibilityLabel={link.label}
        onPress={() => goTo(link.path)}
        style={({ pressed }) => [
          localStyles.shortcut,
          highlighted && localStyles.shortcutHighlighted,
          pressed && localStyles.shortcutPressed,
        ]}
      >
        {({ pressed }) => {
          const active = highlighted || pressed;

          return (
            <>
              <View
                style={[
                  localStyles.shortcutIcon,
                  active && localStyles.shortcutIconActive,
                ]}
              >
                <Ionicons
                  name={link.icon}
                  size={23}
                  color={
                    active
                      ? colors.emeraldDark
                      : colors.muted
                  }
                />
              </View>

              <Text
                numberOfLines={1}
                style={[
                  localStyles.shortcutLabel,
                  active && localStyles.shortcutLabelActive,
                ]}
              >
                {link.label}
              </Text>
            </>
          );
        }}
      </Pressable>
    );
  };

  const renderBusinessTool = (link: FlyoutLink) => (
    <Pressable
      key={link.path}
      accessibilityRole="button"
      accessibilityLabel={link.label}
      onPress={() => goTo(link.path)}
      style={({ pressed }) => [
        localStyles.businessTool,
        pressed && localStyles.businessToolPressed,
      ]}
    >
      {({ pressed }) => (
        <>
          <View style={localStyles.businessToolIcon}>
            <Ionicons
              name={link.icon}
              size={21}
              color={
                pressed
                  ? colors.emeraldDark
                  : colors.muted
              }
            />
          </View>

          <Text
            numberOfLines={1}
            style={localStyles.businessToolLabel}
          >
            {link.label}
          </Text>

          <Ionicons
            name="chevron-forward"
            size={15}
            color={colors.muted}
          />
        </>
      )}
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
            localStyles.card,
            {
              width: isDesktop ? 520 : "100%",
              alignSelf: isDesktop ? "center" : "stretch",
              maxHeight: height * 0.7,
              paddingTop: insets.top + 12,
              opacity: cardOpacity,
              transform: [{ translateY }],
            },
          ]}
        >
          {/* HEADER (pinned) */}

            <View style={localStyles.header}>
              <View style={localStyles.headerTitleBlock}>
                <Text style={localStyles.headerEyebrow}>
                  MABIZ
                </Text>

                <Text style={localStyles.headerTitle}>
                  Your space
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close menu"
                onPress={onClose}
                hitSlop={8}
                style={({ pressed }) => [
                  localStyles.closeButton,
                  pressed && localStyles.closeButtonPressed,
                ]}
              >
                <Ionicons
                  name="close"
                  size={21}
                  color={colors.ink}
                />
              </Pressable>
            </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={localStyles.content}
          >
            {/* PROFILE CARD */}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open my profile"
              onPress={() => goTo("/(tabs)/profile")}
              style={({ pressed }) => [
                localStyles.profileCard,
                pressed && localStyles.profileCardPressed,
              ]}
            >
              <Avatar
                name={userName}
                image={user?.avatar}
                size={48}
              />

              <View style={localStyles.profileInfo}>
                <Text
                  numberOfLines={1}
                  style={localStyles.userName}
                >
                  {userName}
                </Text>

                <Text
                  numberOfLines={1}
                  style={localStyles.userSub}
                >
                  {userSub || "View your profile"}
                </Text>
              </View>

              <View style={localStyles.profileArrow}>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.muted}
                />
              </View>
            </Pressable>

            {/* DISCOVER */}

            <View style={localStyles.section}>
              <View style={localStyles.sectionHeader}>
                <Text style={localStyles.sectionTitle}>
                  Discover
                </Text>

                <Text style={localStyles.sectionCaption}>
                  Explore Mabiz
                </Text>
              </View>

              <View style={localStyles.shortcutsGrid}>
                {primaryLinks.map(renderShortcut)}
              </View>
            </View>

            {/* BUSINESS MANAGEMENT */}

            {ownsBusiness ? (
              <View style={localStyles.section}>
                <View style={localStyles.sectionHeader}>
                  <Text style={localStyles.sectionTitle}>
                    Your business
                  </Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Manage business"
                  onPress={() =>
                    goTo("/business-management")
                  }
                  style={({ pressed }) => [
                    localStyles.businessCard,
                    pressed && localStyles.businessCardPressed,
                  ]}
                >
                  <View style={localStyles.businessCardTop}>
                    <View style={localStyles.businessCardIcon}>
                      <Ionicons
                        name="storefront-outline"
                        size={24}
                        color={colors.emeraldDark}
                      />
                    </View>

                    <View style={localStyles.businessCardText}>
                      <Text style={localStyles.businessCardTitle}>
                        Manage business
                      </Text>

                      <Text
                        style={localStyles.businessCardSubtitle}
                      >
                        Manage your business and grow your audience
                      </Text>
                    </View>

                    <Ionicons
                      name="arrow-up-forward"
                      size={18}
                      color={colors.emeraldDark}
                    />
                  </View>
                </Pressable>

                <View style={localStyles.businessToolsGrid}>
                  {BUSINESS_TOOLS.slice(1).map(
                    renderBusinessTool
                  )}
                </View>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Create business"
                onPress={() => goTo("/create-business")}
                style={({ pressed }) => [
                  localStyles.createBusinessCard,
                  pressed && localStyles.createBusinessPressed,
                ]}
              >
                <View style={localStyles.createBusinessIcon}>
                  <Ionicons
                    name="add"
                    size={23}
                    color={colors.emeraldDark}
                  />
                </View>

                <View style={localStyles.createBusinessText}>
                  <Text style={localStyles.createBusinessTitle}>
                    Create your business
                  </Text>

                  <Text
                    style={localStyles.createBusinessSubtitle}
                  >
                    Share your story and reach more customers
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.muted}
                />
              </Pressable>
            )}

            {/* YOUR ACTIVITY */}

            <View style={localStyles.section}>
              <View style={localStyles.sectionHeader}>
                <Text style={localStyles.sectionTitle}>
                  Your activity
                </Text>
              </View>

              <View style={localStyles.activityCard}>
                {YOUR_STUFF.map((link, index) => (
                  <Pressable
                    key={link.path}
                    accessibilityRole="button"
                    accessibilityLabel={link.label}
                    onPress={() => goTo(link.path)}
                    style={({ pressed }) => [
                      localStyles.activityRow,
                      index < YOUR_STUFF.length - 1 &&
                        localStyles.activityRowBorder,
                      pressed && localStyles.activityRowPressed,
                    ]}
                  >
                    <View style={localStyles.activityIcon}>
                      <Ionicons
                        name={link.icon}
                        size={20}
                        color={colors.muted}
                      />
                    </View>

                    <Text style={localStyles.activityLabel}>
                      {link.label}
                    </Text>

                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={colors.muted}
                    />
                  </Pressable>
                ))}
              </View>
            </View>

            {/* BUSINESS UPDATES */}

            {updates.length > 0 ? (
              <View style={localStyles.section}>
                <View style={localStyles.sectionHeader}>
                  <Text style={localStyles.sectionTitle}>
                    Business updates
                  </Text>

                  <Text style={localStyles.sectionCaption}>
                    Latest stories
                  </Text>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={localStyles.updatesList}
                >
                  {updates.map((item) => (
                    <Pressable
                      key={item.businessId}
                      accessibilityRole="button"
                      accessibilityLabel={`Open update from ${item.name}`}
                      onPress={() => goToPost(item.postId)}
                      style={({ pressed }) => [
                        localStyles.updateTile,
                        pressed && localStyles.updateTilePressed,
                      ]}
                    >
                      {item.cover ? (
                        <View
                          style={StyleSheet.absoluteFillObject}
                        >
                          <MediaImage
                            uri={item.cover}
                            height={132}
                            label={item.name}
                          />
                        </View>
                      ) : null}

                      <View
                        pointerEvents="none"
                        style={localStyles.updateScrim}
                      />

                      <View style={localStyles.updateAvatarWrap}>
                        <Avatar
                          name={item.name}
                          image={item.logo}
                          size={30}
                          ring
                        />
                      </View>

                      <Text
                        numberOfLines={2}
                        style={localStyles.updateTitle}
                      >
                        {item.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {/* SETTINGS AND LOGOUT */}

            <View style={localStyles.footer}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Settings"
                onPress={() => goTo("/menu")}
                style={({ pressed }) => [
                  localStyles.footerRow,
                  pressed && localStyles.footerRowPressed,
                ]}
              >
                <Ionicons
                  name="settings-outline"
                  size={20}
                  color={colors.muted}
                />

                <Text style={localStyles.footerLabel}>
                  Settings
                </Text>

                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.muted}
                />
              </Pressable>

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
    },

    scrim: {
      backgroundColor: "#000000",
    },

    card: {
      paddingHorizontal: 20,
      paddingBottom: 18,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
      backgroundColor: colors.surface,
      shadowColor: "#000000",
      shadowOpacity: 0.18,
      shadowRadius: 20,
      shadowOffset: { width: 0, height: 8 },
      elevation: 16,
      overflow: "hidden",
    },

    content: {
      paddingBottom: 12,
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 18,
    },

    headerTitleBlock: {
      gap: 3,
    },

    headerEyebrow: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 1.8,
      color: colors.emeraldDark,
    },

    headerTitle: {
      fontSize: 23,
      fontWeight: "800",
      color: colors.ink,
    },

    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },

    closeButtonPressed: {
      backgroundColor: colors.emeraldTint,
    },

    profileCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 22,
    },

    profileCardPressed: {
      backgroundColor: colors.emeraldTint,
    },

    profileInfo: {
      flex: 1,
      minWidth: 0,
      gap: 4,
    },

    userName: {
      fontSize: 15,
      fontWeight: "800",
      color: colors.ink,
    },

    userSub: {
      fontSize: 12,
      color: colors.muted,
    },

    profileArrow: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface,
    },

    section: {
      marginBottom: 22,
    },

    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },

    sectionTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: colors.ink,
    },

    sectionCaption: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.muted,
    },

    shortcutsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },

    shortcut: {
      width: "31.5%",
      flexGrow: 1,
      minWidth: 80,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      paddingHorizontal: 6,
      borderRadius: 18,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 9,
    },

    shortcutHighlighted: {
      backgroundColor: colors.emeraldTint,
      borderColor: colors.emeraldTint,
    },

    shortcutPressed: {
      backgroundColor: colors.emeraldTint,
      borderColor: colors.emeraldTint,
    },

    shortcutIcon: {
      width: 42,
      height: 42,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface,
    },

    shortcutIconActive: {
      backgroundColor: colors.surface,
    },

    shortcutLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.muted,
      textAlign: "center",
    },

    shortcutLabelActive: {
      color: colors.emeraldDark,
    },

    businessCard: {
      padding: 15,
      borderRadius: 20,
      backgroundColor: colors.emeraldTint,
      borderWidth: 1,
      borderColor: colors.emeraldTint,
      marginBottom: 10,
    },

    businessCardPressed: {
      opacity: 0.8,
    },

    businessCardTop: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },

    businessCardIcon: {
      width: 46,
      height: 46,
      borderRadius: 15,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.surface,
    },

    businessCardText: {
      flex: 1,
      minWidth: 0,
      gap: 4,
    },

    businessCardTitle: {
      fontSize: 14,
      fontWeight: "800",
      color: colors.emeraldDark,
    },

    businessCardSubtitle: {
      fontSize: 11,
      lineHeight: 16,
      color: colors.muted,
    },

    businessToolsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },

    businessTool: {
      width: "48%",
      flexGrow: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },

    businessToolPressed: {
      backgroundColor: colors.emeraldTint,
      borderColor: colors.emeraldTint,
    },

    businessToolIcon: {
      width: 28,
      alignItems: "center",
      justifyContent: "center",
    },

    businessToolLabel: {
      flex: 1,
      minWidth: 0,
      fontSize: 12,
      fontWeight: "700",
      color: colors.ink,
    },

    createBusinessCard: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      padding: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      marginBottom: 22,
    },

    createBusinessPressed: {
      backgroundColor: colors.emeraldTint,
    },

    createBusinessIcon: {
      width: 44,
      height: 44,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.emeraldTint,
    },

    createBusinessText: {
      flex: 1,
      minWidth: 0,
      gap: 4,
    },

    createBusinessTitle: {
      fontSize: 14,
      fontWeight: "800",
      color: colors.ink,
    },

    createBusinessSubtitle: {
      fontSize: 11,
      lineHeight: 16,
      color: colors.muted,
    },

    activityCard: {
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
      backgroundColor: colors.surface,
    },

    activityRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 13,
      paddingHorizontal: 14,
    },

    activityRowBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },

    activityRowPressed: {
      backgroundColor: colors.emeraldTint,
    },

    activityIcon: {
      width: 30,
      alignItems: "center",
      justifyContent: "center",
    },

    activityLabel: {
      flex: 1,
      fontSize: 13,
      fontWeight: "700",
      color: colors.ink,
    },

    updatesList: {
      gap: 10,
      paddingTop: 2,
      paddingBottom: 4,
    },

    updateTile: {
      width: 100,
      height: 132,
      borderRadius: 16,
      overflow: "hidden",
      backgroundColor: colors.navy,
    },

    updateTilePressed: {
      opacity: 0.8,
    },

    updateScrim: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 70,
      backgroundColor: "rgba(0,0,0,0.48)",
    },

    updateAvatarWrap: {
      position: "absolute",
      top: 9,
      left: 9,
    },

    updateTitle: {
      position: "absolute",
      left: 9,
      right: 9,
      bottom: 9,
      color: colors.white,
      fontSize: 12,
      fontWeight: "700",
      lineHeight: 16,
    },

    footer: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      paddingTop: 8,
      marginTop: 2,
    },

    footerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 13,
      paddingHorizontal: 8,
      borderRadius: 12,
    },

    footerRowPressed: {
      backgroundColor: colors.emeraldTint,
    },

    footerLabel: {
      flex: 1,
      fontSize: 13,
      fontWeight: "700",
      color: colors.ink,
    },

    
  })
);