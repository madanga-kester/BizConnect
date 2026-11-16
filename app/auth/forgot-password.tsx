import { router } from "expo-router";
import { useRef, useState } from "react";
import { Alert, Platform, Text } from "react-native";
import { Button, Field, Page, TopBar, styles } from "@/components/biz-ui";
import { useBizConnectServices } from "@/lib/services/service-provider";
import { useThemeContext } from "@/lib/theme-provider";

function feedback(message: string) {
  if (Platform.OS === "web") window.alert(message);
  else Alert.alert("Password recovery", message);
}

export default function ForgotPasswordScreen() {
  useThemeContext();
  const services = useBizConnectServices();
  const [identifier, setIdentifier] = useState("");
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);

  const submit = async () => {
    if (submitting.current) return;
    const value = identifier.trim();
    if (!value) return feedback("Enter your email, phone or username.");
    submitting.current = true;
    setBusy(true);
    try {
      const result = await services.auth.requestPasswordReset({ identifier: value });
      if (!result.ok) return feedback(result.error.message);
      feedback("If an account exists for that identifier, a reset code has been sent.");
      router.push("/auth/reset-password");
    } catch {
      feedback("Unable to start password recovery. Please try again.");
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  return (
    <Page>
      <TopBar title="Forgot password" back />
      <Text style={styles.sectionHeading}>Recover your account</Text>
      <Text style={styles.body}>
        Enter the email, phone or username associated with your account. We will send a reset code.
      </Text>
      <Field
        label="Email, phone or username"
        value={identifier}
        onChangeText={setIdentifier}
        placeholder="Enter your email, phone or username"
        autoCapitalize="none"
      />
      <Button
        title={busy ? "Sending..." : "Send reset code"}
        icon="arrow-forward"
        disabled={busy}
        onPress={() => void submit()}
      />
      <Button
        title="I already have a reset code"
        variant="quiet"
        onPress={() => router.push("/auth/reset-password")}
      />
    </Page>
  );
}