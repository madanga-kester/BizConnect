import { router } from "expo-router";
import { useRef, useState } from "react";
import { Alert, Platform, Text } from "react-native";
import { Button, Field, Page, TopBar, styles } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { useBizConnectServices } from "@/lib/services/service-provider";
import { useThemeContext } from "@/lib/theme-provider";
import { PASSWORD_ERROR, isStrongPassword } from "@/utils/password-policy";

function feedback(message: string) {
  if (Platform.OS === "web") window.alert(message);
  else Alert.alert("Reset password", message);
}

export default function ResetPasswordScreen() {
  useThemeContext();
  const app = useAppStore();
  const services = useBizConnectServices();
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);

  const submit = async () => {
    if (submitting.current) return;
    const token = resetToken.trim().replace(/[\s.]+$/, "");
    if (!token) return feedback("Enter the reset code from your email.");
    if (!isStrongPassword(password)) return feedback(PASSWORD_ERROR);
    if (password !== again) return feedback("Your passwords do not match.");
    submitting.current = true;
    setBusy(true);
    try {
      const result = await services.auth.completePasswordReset({
        resetToken: token,
        newPassword: password,
      });
      if (!result.ok) return feedback(result.error.message);
      if (app.isAuthenticated) {
        await services.auth.logout();
        await app.setAuthenticated(false);
      }
      feedback("Your password has been changed. Sign in with your new password.");
      router.replace("/auth/login");
    } catch {
      feedback("Unable to reset your password. Please try again.");
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  return (
    <Page>
      <TopBar title="Reset password" back />
      <Text style={styles.sectionHeading}>Choose a new password</Text>
      <Text style={styles.body}>
        Paste the full reset code from your email, then choose a new password.
      </Text>
      <Field
        label="Reset code"
        value={resetToken}
        onChangeText={setResetToken}
        placeholder="Paste the code from your email"
        autoCapitalize="none"
      />
      <Field
        label="New password"
        value={password}
        onChangeText={setPassword}
        placeholder="At least 12 characters"
        secureTextEntry
      />
      <Field
        label="Confirm password"
        value={again}
        onChangeText={setAgain}
        placeholder="Repeat your password"
        secureTextEntry
      />
      <Button
        title={busy ? "Saving..." : "Change password"}
        icon="arrow-forward"
        disabled={busy}
        onPress={() => void submit()}
      />
    </Page>
  );
}