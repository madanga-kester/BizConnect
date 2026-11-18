import { Switch, Text, View } from "react-native";
import { Page, TopBar, styles } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { colors } from "@/theme/tokens";

export default function VideoAutoplayScreen() {
  const app = useAppStore();
  return (
    <Page>
      <TopBar title="Video autoplay" back />
      <View style={styles.actionTile}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>Video autoplay</Text>
          <Text style={styles.caption}>Videos start only when you choose them by default</Text>
        </View>
        <Switch
          value={app.settings.autoplayVideos}
          onValueChange={(value) => app.updateSettings({ autoplayVideos: value })}
          trackColor={{ false: colors.border, true: colors.emerald }}
          thumbColor={colors.white}
        />
      </View>
    </Page>
  );
}
