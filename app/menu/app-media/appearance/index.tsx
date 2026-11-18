import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { Page, TopBar, styles } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { t } from "@/i18n/translations";
import { useThemeContext } from "@/lib/theme-provider";
import { colors } from "@/theme/tokens";
import type { AppearanceMode } from "@/types/domain";

export default function AppearanceScreen() {
  const app = useAppStore();
  const { setColorScheme } = useThemeContext();
  const language = app.settings.language;
  const appearance = app.settings.appearance;
  const disabled = !app.hasHydrated;

  const select = (mode: AppearanceMode) => {
    setColorScheme(mode);
    app.updateSettings({ appearance: mode });
  };

  return (
    <Page>
      <TopBar title={t("appearance", language)} back />
      <View style={[styles.actionTile, { flexDirection: "column", alignItems: "stretch" }]}>
        <Text style={styles.cardTitle}>{t("appearance", language)}</Text>
        <Text style={styles.caption}>{t("appearanceDetail", language)}</Text>
        <View style={styles.row}>
          {(["light", "dark"] as const).map((mode) => {
            const selected = appearance === mode;
            const label = mode === "light" ? t("lightMode", language) : t("darkMode", language);
            return (
              <Pressable
                key={mode}
                accessibilityRole="button"
                accessibilityLabel={label}
                accessibilityState={{ selected, disabled }}
                disabled={disabled}
                onPress={() => select(mode)}
                style={[
                  styles.themeOption,
                  selected && { backgroundColor: colors.emeraldTint, borderColor: colors.emerald },
                  disabled && { opacity: 0.55 },
                ]}
              >
                <Ionicons
                  name={mode === "light" ? "sunny-outline" : "moon-outline"}
                  size={18}
                  color={selected ? colors.emeraldDark : colors.muted}
                />
                <Text style={[styles.body, selected && { color: colors.emeraldDark, fontWeight: "700" }]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </Page>
  );
}
