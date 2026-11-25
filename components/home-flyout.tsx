import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppStore } from "@/hooks/use-app-store";
import { t } from "@/i18n/translations";
import { colors, createThemedStyles } from "@/theme/tokens";
import { useThemeContext } from "@/lib/theme-provider";

type FlyoutPath = "/discover" | "/stories";

type HomeFlyoutProps = {
  visible: boolean;
  onClose: () => void;
};

export function HomeFlyout({ visible, onClose }: HomeFlyoutProps) {
  useThemeContext();
  const app = useAppStore();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const panelWidth = Math.min(width * 0.78, 320);
  const progress = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(visible);
  const pendingPath = useRef<FlyoutPath | null>(null);

  useEffect(() => {
    if (mounted) return;
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
  })
);