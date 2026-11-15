import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Platform, Text } from "react-native";
import { Button, Field, LocalNote, Page, TopBar, styles } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { validateDemoOtp } from "@/utils/form-validation";

function feedback(message: string) { if (Platform.OS === "web") window.alert(message); else Alert.alert("Verification code", message); }
export default function OtpScreen() {
  const app = useAppStore();
  const [code, setCode] = useState(""); const [error, setError] = useState("");
  useEffect(() => { if (app.hasHydrated && app.onboardingStage !== "awaiting_otp") router.replace("/auth/register"); }, [app.hasHydrated, app.onboardingStage]);
  const verify = () => {
    const result = validateDemoOtp(code);
    if (!result.valid) { setError(result.errors.password ?? "Enter the demo code."); return; }
    if (!app.verifyDemoOtp(code)) { setError("Start registration again to verify this local demo code."); return; }
    setError("");
    router.replace("/auth/profile-setup");
  };
  return <Page><TopBar title="Verify your number" back /><Text style={styles.sectionHeading}>One more step.</Text><Text style={styles.body}>Enter the six-digit demo code to continue.</Text><LocalNote text="No SMS is sent in this frontend demo. The local demo code is 123456." /><Field label="Six-digit demo code" value={code} onChangeText={(value) => { setCode(value.replace(/\D/g, "").slice(0, 6)); setError(""); }} placeholder="123456" keyboardType="number-pad" />{error ? <Text style={[styles.caption, { color: "#B42318", fontWeight: "600" }]}>{error}</Text> : null}<Button title="Verify demo code" onPress={verify} /><Button title="Resend code" variant="quiet" onPress={() => feedback("SMS delivery is not connected. This is a demo-only flow.")} /><Button title="Cancel registration" variant="quiet" onPress={() => { void app.cancelDemoRegistration(); router.replace("/auth/register"); }} /></Page>;
}
