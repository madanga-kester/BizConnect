import { Text, View } from "react-native";
import { Button, Page, TopBar, styles } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { t } from "@/i18n/translations";

export default function LanguageScreen() {
  const app = useAppStore();
  const language = app.settings.language;
  return (
    <Page>
      <TopBar title={t("language", language)} back />
      <View style={styles.actionTile}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{t("language", language)}</Text>
          <Text style={styles.caption}>English / Kiswahili</Text>
        </View>
        <View style={styles.row}>
          <Button
            title="English"
            small
            variant={language === "en" ? "soft" : "outline"}
            onPress={() => app.updateSettings({ language: "en" })}
          />
          <Button
            title="Kiswahili"
            small
            variant={language === "sw" ? "soft" : "outline"}
            onPress={() => app.updateSettings({ language: "sw" })}
          />
        </View>
      </View>
    </Page>
  );
}
