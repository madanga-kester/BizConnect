import { router, useLocalSearchParams } from "expo-router";
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
  const params = useLocalSearchParams<{ identifier?: string }>();
  const app = useAppStore();
  const services = useBizConnectServices();
  const [step, setStep] = useState<"code" | "password">("code");
  const [identifier, setIdentifier] = useState(params.identifier ?? "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);

  const verifyCode = async () => {
    if (submitting.current) return;
    const who = identifier.trim();
    if (!who) return feedback("Enter your email, phone or username.");
    if (code.length !== 6) return feedback("Enter the 6-digit code from your email.");
    submitting.current = true;
    setBusy(true);
    try {
      const result = await services.auth.verifyPasswordResetCode({ identifier: who, code });
      if (!result.ok) return feedback(result.error.message);
      if (!result.data.verified) return feedback("That code is not valid.");
      setStep("password");
    } catch {
      feedback("Unable to check your code. Please try again.");
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  const changePassword = async () => {
    if (submitting.current) return;
    if (!isStrongPassword(password)) return feedback(PASSWORD_ERROR);
    if (password !== again) return feedback("Your passwords do not match.");
    submitting.current = true;
    setBusy(true);
    try {
      const result = await services.auth.completePasswordReset({
        identifier: identifier.trim(),
        code,
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

  if (step === "password") {
    return (
      <Page>
        <TopBar title="New password" />
        <Text style={styles.sectionHeading}>Create a new password</Text>
        <Text style={styles.body}>
          Your code is confirmed. Choose a password you have not used on this account before.
        </Text>
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
          onPress={() => void changePassword()}
        />
        <Button
          title="Use a different code"
          variant="quiet"
          disabled={busy}
          onPress={() => {
            setPassword("");
            setAgain("");
            setCode("");
            setStep("code");
          }}
        />
      </Page>
    );
  }

  return (
    <Page>
      <TopBar title="Enter your code" back />
      <Text style={styles.sectionHeading}>Check your email</Text>
      <Text style={styles.body}>
        Enter the 6-digit code we sent you. You will choose a new password next.
      </Text>
      <Field
        label="Email, phone or username"
        value={identifier}
        onChangeText={setIdentifier}
        placeholder="Enter your email, phone or username"
        autoCapitalize="none"
      />
      <Field
        label="Reset code"
        value={code}
        onChangeText={(value) => setCode(value.replace(/\D/g, "").slice(0, 6))}
        placeholder="123456"
        keyboardType="number-pad"
      />
      <Button
        title={busy ? "Checking..." : "Verify code"}
        icon="arrow-forward"
        disabled={busy || code.length !== 6}
        onPress={() => void verifyCode()}
      />
      <Button
        title="Send me a new code"
        variant="quiet"
        disabled={busy}
        onPress={() => router.replace("/auth/forgot-password")}
      />
    </Page>
  );
}