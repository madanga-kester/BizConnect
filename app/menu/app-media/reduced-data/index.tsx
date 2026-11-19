import { Switch, Text, View } from "react-native";
import { Page, TopBar, styles } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { colors } from "@/theme/tokens";
import { useThemeContext } from "@/lib/theme-provider";

export default function ReducedDataScreen() {
  useThemeContext();
  const app = useAppStore();
  return (
    <Page>
      <TopBar title="Reduced data" back />
      <View style={styles.actionTile}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Reduced data</Text>
          <Text style={styles.caption}>Use fewer background loads and defer media when available</Text>
        </View>
        <Switch
          value={app.settings.reducedData}
          onValueChange={(value) => app.updateSettings({ reducedData: value })}
          trackColor={{ false: colors.border, true: colors.emerald }}
          thumbColor={colors.white}
        />
      </View>
    </Page>
  );
}
