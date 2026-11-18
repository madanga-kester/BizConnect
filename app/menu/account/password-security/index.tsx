import { router } from "expo-router";
import { Button, Page, SectionTitle, TopBar, styles } from "@/components/biz-ui";
import { Text } from "react-native";

export default function PasswordSecurityScreen() {
  return (
    <Page>
      <TopBar title="Password and security" back />
      <SectionTitle title="Change your password" />
      <Text style={styles.body}>We will send a code so you can set a new password.</Text>
      <Button title="Request a code" icon="key-outline" onPress={() => router.push("/auth/forgot-password")} />
    </Page>
  );
}
