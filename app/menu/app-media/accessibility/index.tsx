import { router } from "expo-router";
import { useCallback, useMemo } from "react";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import {
  ActionTile,
  Button,
  Chip,
  Page,
  TopBar,
  styles,
} from "@/components/biz-ui";
import { useLocalPref } from "@/components/pref-screens";
import { useThemeContext } from "@/lib/theme-provider";
import { colors, typography } from "@/theme/tokens";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type TextSize = "small" | "default" | "large" | "xlarge";

type ToggleKey =
  | "highContrast"
  | "boldText"
  | "reduceMotion"
  | "haptics"
  | "captions"
  | "largeTargets"
  | "increasedSpacing"
  | "readableFont"
  | "visualAlerts"
  | "muteSounds"
  | "confirmActions"
  | "reduceTransparency";

type AccessibilityPrefs = Partial<Record<ToggleKey, boolean>> & {
  textSize?: TextSize;
  /** Legacy flag, migrated to `textSize` on first write. */
  largeText?: boolean;
};

type ToggleItem = {
  key: ToggleKey;
  title: string;
  detail: string;
  defaultValue: boolean;
};

type Section = {
  id: string;
  title: string;
  items: ToggleItem[];
  /** Optional content rendered under the toggle group (e.g. extra links). */
  footer?: "videoAutoplay";
};

/* -------------------------------------------------------------------------- */
/* Static config                                                              */
/* -------------------------------------------------------------------------- */

const TEXT_SIZES: { key: TextSize; label: string; scale: number }[] = [
  { key: "small", label: "Small", scale: 0.9 },
  { key: "default", label: "Default", scale: 1 },
  { key: "large", label: "Large", scale: 1.15 },
  { key: "xlarge", label: "Extra large", scale: 1.3 },
];

const SECTIONS: Section[] = [
  {
    id: "display",
    title: "Display & visibility",
    items: [
      { key: "highContrast", title: "High contrast", detail: "Make text and borders easier to distinguish.", defaultValue: false },
      { key: "boldText", title: "Bold text", detail: "Use heavier text weights for readability.", defaultValue: false },
      { key: "reduceTransparency", title: "Reduce transparency", detail: "Make surfaces more solid.", defaultValue: false },
      { key: "largeTargets", title: "Larger touch targets", detail: "Make controls easier to tap.", defaultValue: false },
    ],
  },
  {
    id: "reading",
    title: "Reading comfort",
    items: [
      { key: "readableFont", title: "Readable font", detail: "Prefer clear, easy-to-read typography.", defaultValue: false },
      { key: "increasedSpacing", title: "Increased spacing", detail: "Add more space between lines.", defaultValue: false },
    ],
  },
  {
    id: "motion",
    title: "Motion & feedback",
    items: [
      { key: "reduceMotion", title: "Reduce motion", detail: "Limit animations and transitions.", defaultValue: false },
      { key: "haptics", title: "Haptic feedback", detail: "Vibrate when interacting with controls.", defaultValue: true },
    ],
  },
  {
    id: "sound",
    title: "Sound & notifications",
    items: [
      { key: "muteSounds", title: "Mute interface sounds", detail: "Silence app interaction sounds.", defaultValue: false },
      { key: "visualAlerts", title: "Visual alerts", detail: "Show visible notifications for alerts.", defaultValue: true },
    ],
  },
  {
    id: "video",
    title: "Video accessibility",
    items: [
      { key: "captions", title: "Captions", detail: "Show captions on videos by default.", defaultValue: false },
    ],
    footer: "videoAutoplay",
  },
  {
    id: "interaction",
    title: "Interaction & controls",
    items: [
      { key: "confirmActions", title: "Confirm important actions", detail: "Ask before destructive actions.", defaultValue: true },
    ],
  },
];

const ALL_TOGGLES: ToggleItem[] = SECTIONS.flatMap((section) => section.items);

/**
 * `styles.actionTile` is built for a single horizontal row (icon + text +
 * chevron). These cards hold stacked content, so reset its layout props.
 * Visual props (background, border, shadow) still come from the tile style.
 */
const CARD_LAYOUT: ViewStyle = {
  flexDirection: "column",
  alignItems: "stretch",
  justifyContent: "flex-start",
  flexGrow: 0,
  flexShrink: 0,
  height: undefined,
  minHeight: undefined,
  maxHeight: undefined,
  aspectRatio: undefined,
  width: "100%",
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Safely applies an alpha to a hex colour. Supports #RGB and #RRGGBB.
 * Any other format (rgb(), named colours) is returned unchanged instead of
 * producing an invalid string.
 */
function withAlpha(color: string, alpha: number): string {
  const clamped = Math.max(0, Math.min(1, alpha));
  const alphaHex = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, "0");

  if (/^#[0-9a-fA-F]{6}$/.test(color)) return `${color}${alphaHex}`;
  if (/^#[0-9a-fA-F]{3}$/.test(color)) {
    const [, r, g, b] = color;
    return `#${r}${r}${g}${g}${b}${b}${alphaHex}`;
  }
  return color;
}

function isOn(item: ToggleItem, prefs: AccessibilityPrefs): boolean {
  return prefs[item.key] ?? item.defaultValue;
}

function countOn(items: ToggleItem[], prefs: AccessibilityPrefs): number {
  return items.filter((item) => isOn(item, prefs)).length;
}

function resolveTextSize(prefs: AccessibilityPrefs): TextSize {
  return prefs.textSize ?? (prefs.largeText ? "large" : "default");
}

/**
 * Single place that reads/writes accessibility preferences.
 * When you move to a backend, swap the internals of this hook only.
 */
function useAccessibilityPrefs() {
  const [prefs, setPrefs] = useLocalPref<AccessibilityPrefs>("accessibility", {});

  const setToggle = useCallback(
    (key: ToggleKey, value: boolean) => {
      // Drop the legacy flag, keeping its meaning via textSize.
      const { largeText: _legacy, ...rest } = prefs;
      setPrefs({
        ...rest,
        textSize: resolveTextSize(prefs),
        [key]: value,
      });
    },
    [prefs, setPrefs],
  );

  const setTextSize = useCallback(
    (textSize: TextSize) => {
      const { largeText: _legacy, ...rest } = prefs;
      setPrefs({ ...rest, textSize });
    },
    [prefs, setPrefs],
  );

  const reset = useCallback(() => setPrefs({}), [setPrefs]);

  return { prefs, setToggle, setTextSize, reset };
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

function ToggleGroup({
  items,
  prefs,
  scale,
  onToggle,
}: {
  items: ToggleItem[];
  prefs: AccessibilityPrefs;
  scale: number;
  onToggle: (key: ToggleKey, value: boolean) => void;
}) {
  return (
    <View
      style={[
        styles.actionTile,
        CARD_LAYOUT,
        { borderRadius: 18, padding: 0, overflow: "hidden" },
      ]}
    >
      {items.map((item, index) => {
        const enabled = isOn(item, prefs);
        const isLast = index === items.length - 1;

        return (
          <View key={item.key}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: 16,
                gap: 14,
              }}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.cardTitle, { fontSize: 15 * scale }]}>
                  {item.title}
                </Text>
                <Text
                  style={[
                    styles.caption,
                    { fontSize: 13 * scale, lineHeight: 18 * scale },
                  ]}
                >
                  {item.detail}
                </Text>
              </View>

              <Switch
                value={enabled}
                onValueChange={(value) => onToggle(item.key, value)}
                trackColor={{ false: colors.border, true: colors.emerald }}
                thumbColor={colors.white}
                accessibilityRole="switch"
                accessibilityLabel={item.title}
                accessibilityHint={item.detail}
                accessibilityState={{ checked: enabled }}
              />
            </View>

            {!isLast && (
              <View
                accessibilityElementsHidden
                importantForAccessibility="no-hide-descendants"
                style={{
                  height: 1,
                  backgroundColor: colors.border,
                  marginLeft: 16,
                  opacity: 0.6,
                }}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

function SectionHeader({
  title,
  count,
  scale,
}: {
  title: string;
  count?: number;
  scale: number;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 28,
        marginBottom: 10,
        paddingHorizontal: 4,
      }}
    >
      <Text
        accessibilityRole="header"
        style={[
          styles.caption,
          {
            fontSize: 13 * scale,
            fontWeight: "700",
            letterSpacing: 0.6,
            textTransform: "uppercase",
          },
        ]}
      >
        {title}
      </Text>
      {count !== undefined && (
        <View
          accessible
          accessibilityLabel={`${count} enabled`}
          style={{
            backgroundColor: withAlpha(colors.emerald, 0.09),
            paddingHorizontal: 10,
            paddingVertical: 3,
            borderRadius: 999,
          }}
        >
          <Text
            importantForAccessibility="no"
            style={{
              fontSize: 11 * scale,
              fontWeight: "700",
              color: colors.emerald,
            }}
          >
            {count} ON
          </Text>
        </View>
      )}
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Screen                                                                     */
/* -------------------------------------------------------------------------- */

export default function AccessibilityScreen() {
  // Subscribes this screen to theme changes so colours re-render.
  useThemeContext();

  const { prefs, setToggle, setTextSize, reset } = useAccessibilityPrefs();

  const textSize = resolveTextSize(prefs);
  const scale = TEXT_SIZES.find((item) => item.key === textSize)?.scale ?? 1;

  const enabledCount = useMemo(() => countOn(ALL_TOGGLES, prefs), [prefs]);

  const resetPreferences = useCallback(() => {
    const shouldConfirm = prefs.confirmActions ?? true;

    if (!shouldConfirm) {
      reset();
      return;
    }

    Alert.alert(
      "Reset accessibility preferences?",
      "All accessibility settings will return to their default values.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", style: "destructive", onPress: reset },
      ],
    );
  }, [prefs.confirmActions, reset]);

  const openDeviceSettings = useCallback(() => {
    Linking.openSettings().catch(() => {
      Alert.alert(
        "Couldn't open settings",
        "Open your device settings manually to manage accessibility options.",
      );
    });
  }, []);

  return (
    <Page>
      <TopBar title="Accessibility" back />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Hero */}
        <View
          style={{
            borderRadius: 22,
            padding: 22,
            marginBottom: 8,
            backgroundColor: colors.emerald,
            overflow: "hidden",
          }}
        >
          {/* Decorative circles, hidden from screen readers */}
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            pointerEvents="none"
            style={{
              position: "absolute",
              top: -40,
              right: -40,
              width: 160,
              height: 160,
              borderRadius: 80,
              backgroundColor: withAlpha(colors.white, 0.08),
            }}
          />
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            pointerEvents="none"
            style={{
              position: "absolute",
              bottom: -30,
              right: 40,
              width: 90,
              height: 90,
              borderRadius: 45,
              backgroundColor: withAlpha(colors.white, 0.06),
            }}
          />

          <Text
            style={{
              fontSize: 12 * scale,
              fontWeight: "700",
              color: colors.white,
              letterSpacing: 1.2,
              marginBottom: 8,
            }}
          >
            MAKE MABIZ WORK FOR YOU
          </Text>
          <Text
            accessibilityRole="header"
            style={{
              fontSize: 24 * scale,
              fontWeight: "700",
              color: colors.white,
              lineHeight: 30 * scale,
              marginBottom: 8,
            }}
          >
            Your comfort matters
          </Text>
          <Text
            style={{
              fontSize: 14 * scale,
              color: colors.white,
              lineHeight: 20 * scale,
              maxWidth: "85%",
            }}
          >
            Personalize how you read, interact and experience Mabiz.
          </Text>
        </View>

        {/* Summary row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 14,
            marginBottom: 4,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: colors.emerald,
              }}
            />
            <Text style={[styles.caption, { fontSize: 13 * scale }]}>
              <Text style={{ fontWeight: "700" }}>{enabledCount}</Text> of{" "}
              {ALL_TOGGLES.length} features enabled
            </Text>
          </View>
          <Pressable
            onPress={resetPreferences}
            accessibilityRole="button"
            accessibilityLabel="Reset accessibility preferences"
            hitSlop={12}
            style={{ minHeight: 44, justifyContent: "center" }}
          >
            <Text
              style={[
                styles.caption,
                { fontSize: 13 * scale, color: colors.emerald, fontWeight: "600" },
              ]}
            >
              Reset
            </Text>
          </Pressable>
        </View>

        {/* Text size */}
        <SectionHeader title="Text size" scale={scale} />

        <View
          style={[
            styles.actionTile,
            CARD_LAYOUT,
            { padding: 16, borderRadius: 18, gap: 14 },
          ]}
        >
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel="Text size"
            style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
          >
            {TEXT_SIZES.map((item) => (
              <Chip
                key={item.key}
                label={item.label}
                selected={textSize === item.key}
                onPress={() => setTextSize(item.key)}
              />
            ))}
          </View>

          {/* Preview */}
          <View
            style={{
              backgroundColor: withAlpha(colors.emerald, 0.04),
              borderRadius: 14,
              padding: 16,
              borderStyle: "dashed",
              borderWidth: 1,
              borderColor: withAlpha(colors.emerald, 0.25),
              gap: 6,
            }}
          >
            <Text
              style={{
                fontSize: 11 * scale,
                fontWeight: "700",
                color: colors.emerald,
                letterSpacing: 0.8,
              }}
            >
              TEXT SIZE PREVIEW
            </Text>
            <Text
              style={[
                styles.cardTitle,
                {
                  fontSize: typography.body * scale + 2,
                  lineHeight: (typography.body * scale + 2) * 1.3,
                },
              ]}
            >
              Welcome to Mabiz
            </Text>
            <Text
              style={[
                styles.body,
                {
                  fontSize: typography.body * scale,
                  lineHeight: typography.body * scale * 1.5,
                },
              ]}
            >
              This is how text will appear throughout the app.
            </Text>
          </View>
        </View>

        {/* Toggle sections */}
        {SECTIONS.map((section) => (
          <View key={section.id}>
            <SectionHeader
              title={section.title}
              count={countOn(section.items, prefs)}
              scale={scale}
            />
            <ToggleGroup
              items={section.items}
              prefs={prefs}
              scale={scale}
              onToggle={setToggle}
            />
            {section.footer === "videoAutoplay" && (
              <View style={{ marginTop: 8 }}>
                <ActionTile
                  title="Video autoplay"
                  detail="Choose whether videos start playing automatically."
                  icon="play-circle-outline"
                  onPress={() => router.push("/menu/app-media/video-autoplay")}
                />
              </View>
            )}
          </View>
        ))}

        {/* Device settings */}
        <SectionHeader title="Device accessibility" scale={scale} />
        <ActionTile
          title="Open device settings"
          detail="Manage screen readers, system font size, display zoom and voice controls."
          icon="settings-outline"
          onPress={openDeviceSettings}
        />

        <View
          style={{
            marginTop: 8,
            padding: 14,
            borderRadius: 14,
            backgroundColor: withAlpha(colors.border, 0.25),
          }}
        >
          <Text
            style={[
              styles.caption,
              { fontSize: 13 * scale, lineHeight: 18 * scale },
            ]}
          >
            Some features, including screen readers and system display settings,
            are managed by your device.
          </Text>
        </View>

        {/* Reset */}
        <View style={{ marginTop: 32 }}>
          <Button
            title="Reset accessibility preferences"
            icon="refresh-outline"
            variant="outline"
            onPress={resetPreferences}
          />
          <Text
            style={[
              styles.caption,
              { textAlign: "center", marginTop: 10, fontSize: 12 * scale },
            ]}
          >
            Restore all preferences to their default values.
          </Text>
        </View>
      </ScrollView>
    </Page>
  );
}