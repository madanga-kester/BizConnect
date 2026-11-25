import { Ionicons } from "@expo/vector-icons";
import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Button, styles } from "@/components/biz-ui";
import { colors, createThemedStyles } from "@/theme/tokens";
import { useThemeContext } from "@/lib/theme-provider";

export type InboxTab = "alerts" | "messages";

const TABS: { key: InboxTab; label: string }[] = [
  { key: "alerts", label: "Alerts" },
  { key: "messages", label: "Messages" },
];

export function InboxActions({
  showMarkAll,
  onMarkAll,
  onSettings,
  settingsLabel,
}: {
  showMarkAll: boolean;
  onMarkAll: () => void;
  onSettings: () => void;
  settingsLabel: string;
}) {
  useThemeContext();
  return (
    <View style={localStyles.actions}>
      {showMarkAll ? (
        <Button title="Mark all read" variant="quiet" small onPress={onMarkAll} />
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={settingsLabel}
        onPress={onSettings}
        style={styles.iconButton}
      >
        <Ionicons name="options-outline" size={20} color={colors.ink} />
      </Pressable>
    </View>
  );
}

export function InboxShell({
  initialTab,
  alerts,
  messages,
}: {
  initialTab: InboxTab;
  alerts: ReactNode;
  messages: ReactNode;
}) {
  useThemeContext();
  const { width, height } = useWindowDimensions();
  const [active, setActive] = useState<InboxTab>(initialTab);
  const slide = useRef(new Animated.Value(0)).current;
  const activeRef = useRef<InboxTab>(active);
  activeRef.current = active;
  const moving = useRef(false);

  const go = useCallback(
    (target: InboxTab) => {
      if (target === activeRef.current || moving.current) return;
      moving.current = true;
      const direction = target === "messages" ? 1 : -1;
      Animated.timing(slide, { toValue: -direction * width, duration: 120, useNativeDriver: true }).start(() => {
        setActive(target);
        slide.setValue(direction * width);
        Animated.timing(slide, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
          moving.current = false;
        });
      });
    },
    [slide, width]
  );

  const swipe = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_event, gesture) =>
          Math.abs(gesture.dx) > 12 && Math.abs(gesture.dx) > Math.abs(gesture.dy) * 1.5,
        onPanResponderRelease: (_event, gesture) => {
          if (Math.abs(gesture.dx) < 60 && Math.abs(gesture.vx) < 0.5) return;
          go(gesture.dx < 0 ? "messages" : "alerts");
        },
      }),
    [go]
  );

  return (
    <>
      <View accessibilityRole="tablist" style={localStyles.bar}>
        {TABS.map((tab) => {
          const selected = tab.key === active;
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              onPress={() => go(tab.key)}
              style={[localStyles.tab, selected && localStyles.tabActive]}
            >
              <Text style={[localStyles.tabText, selected && localStyles.tabTextActive]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View {...swipe.panHandlers} style={[localStyles.pager, { minHeight: height * 0.6 }]}>
        <Animated.View
          style={[
            localStyles.pane,
            { transform: [{ translateX: slide }] },
            active !== "alerts" && localStyles.hidden,
          ]}
        >
          {alerts}
        </Animated.View>
        <Animated.View
          style={[
            localStyles.pane,
            { transform: [{ translateX: slide }] },
            active !== "messages" && localStyles.hidden,
          ]}
        >
          {messages}
        </Animated.View>
      </View>
    </>
  );
}

const localStyles = createThemedStyles(() =>
  StyleSheet.create({
    bar: {
      flexDirection: "row",
      marginHorizontal: -16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    tab: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
    },
    tabActive: { borderBottomColor: colors.ink },
    tabText: { fontSize: 14, fontWeight: "600", color: colors.muted },
    tabTextActive: { color: colors.ink, fontWeight: "700" },
    actions: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: 8,
    },
    pager: { gap: 12 },
    pane: { gap: 12 },
    hidden: { display: "none" },
  })
);