import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Button, Page, TopBar, styles } from "@/components/biz-ui";
import { useMabizServices } from "@/lib/services/service-provider";
import { colors } from "@/theme/tokens";

function feedback(message: string) {
  if (Platform.OS === "web") window.alert(message);
  else Alert.alert("Verification", message);
}

export default function ConfirmEmailScreen() {
  const params = useLocalSearchParams<{
    identifier?: string;
    challengeId?: string;
  }>();
  const services = useMabizServices();

  const identifier = params.identifier ?? "";
  const [challengeId, setChallengeId] = useState(params.challengeId ?? "");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const verify = async () => {
    if (busy || code.length !== 6 || !challengeId) return;
    setBusy(true);
    try {
      const result = await services.auth.verifyVerificationCode({
        challengeId,
        code,
      });
      if (!result.ok) {
        feedback(result.error.message);
        return;
      }
      if (!result.data.verified) {
        feedback("That code is not valid.");
        return;
      }
      feedback("Your email is confirmed. Please sign in.");
      router.replace("/auth/login");
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (busy || cooldown > 0 || !identifier) return;
    setBusy(true);
    try {
      const result = await services.auth.requestVerificationCode({
        identifier,
        purpose: "registration",
      });
      if (!result.ok) {
        feedback(result.error.message);
        return;
      }
      setChallengeId(result.data.challengeId);
      setCode("");
      setCooldown(60);
      feedback("We sent a new code to " + identifier + ".");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page>
      <TopBar title="Confirm your email" />

      <View style={{ gap: 18, paddingTop: 24 }}>
        <Text style={{ color: colors.navy, fontSize: 24, fontWeight: "800" }}>
          Enter your code
        </Text>

        <Text style={styles.caption}>
          We sent a 6-digit code to {identifier}.
        </Text>

        <TextInput
          value={code}
          onChangeText={(text) => setCode(text.replace(/\D/g, "").slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
          placeholder="123456"
          placeholderTextColor="#87938C"
          accessibilityLabel="Verification code"
          style={{
            height: 56,
            borderWidth: 1,
            borderColor: "#DCE5DF",
            borderRadius: 13,
            backgroundColor: colors.white,
            textAlign: "center",
            fontSize: 22,
            letterSpacing: 8,
            color: colors.navy,
          }}
        />

        <Button
          title={busy ? "Please wait..." : "Verify"}
          icon="arrow-forward"
          disabled={busy || code.length !== 6}
          onPress={() => void verify()}
        />

        <Pressable
          onPress={() => void resend()}
          disabled={busy || cooldown > 0}
          accessibilityRole="button"
          style={{ alignItems: "center", padding: 10 }}
        >
          <Text
            style={{
              color: cooldown > 0 ? "#87938C" : colors.emerald,
              fontWeight: "800",
              fontSize: 13,
            }}
          >
            {cooldown > 0 ? "Resend code in " + cooldown + "s" : "Resend code"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.replace("/auth/login")}
          accessibilityRole="link"
          style={{ alignItems: "center", padding: 10 }}
        >
          <Text style={styles.caption}>Verify later and sign in</Text>
        </Pressable>
      </View>
    </Page>
  );
}