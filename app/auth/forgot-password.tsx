import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMabizServices } from "@/lib/services/service-provider";
import { useThemeContext } from "@/lib/theme-provider";
import { colors } from "@/theme/tokens";

const NAVY = "#102A43";
const TEXT = "#172B3A";
const MUTED = "#718096";
const BORDER = "#DCE3EA";
const WHITE = "#FFFFFF";

function feedback(message: string) {
  if (Platform.OS === "web") window.alert(message);
  else Alert.alert("Password recovery", message);
}

export default function ForgotPasswordScreen() {
  useThemeContext();
  const services = useMabizServices();
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
      router.push({ pathname: "/auth/reset-password", params: { identifier: value } });
    } catch {
      feedback("Unable to start password recovery. Please try again.");
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: NAVY }} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={{ flex: 1, backgroundColor: WHITE }}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ height: 230, width: "100%", backgroundColor: NAVY, overflow: "hidden" }}>
            <Image
              source={require("../../assets/images/mabiz-login-hero.png")}
              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
              contentFit="cover"
            />
            <LinearGradient
              colors={["rgba(16,42,67,0)", "rgba(16,42,67,0.35)", "rgba(16,42,67,0.8)", NAVY]}
              locations={[0, 0.4, 0.78, 1]}
              style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 150 }}
            />
          </View>

          <View
            style={{
              flexGrow: 1,
              marginTop: -28,
              paddingHorizontal: 26,
              paddingTop: 28,
              paddingBottom: 32,
              backgroundColor: WHITE,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
            }}
          >
            <View
              style={{
                width: 54,
                height: 54,
                borderRadius: 27,
                backgroundColor: "#E8F5EE",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 18,
              }}
            >
              <Ionicons name="key-outline" size={26} color={colors.emeraldDark} />
            </View>

            <Text style={{ fontSize: 28, fontWeight: "800", color: NAVY, letterSpacing: -0.7 }}>
              Forgot password?
            </Text>
            <Text style={{ fontSize: 14, color: MUTED, lineHeight: 21, marginTop: 7, marginBottom: 26 }}>
              Enter the email, phone or username linked to your account and we will send you a reset code.
            </Text>

            <Text style={{ color: TEXT, fontSize: 13, fontWeight: "600", marginBottom: 9 }}>
              Email, phone or username
            </Text>
            <View
              style={{
                height: 54,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                borderWidth: 1,
                borderColor: BORDER,
                borderRadius: 27,
                backgroundColor: WHITE,
                paddingHorizontal: 20,
                marginBottom: 22,
              }}
            >
              <Ionicons name="mail-outline" size={19} color={MUTED} />
              <TextInput
                value={identifier}
                onChangeText={setIdentifier}
                placeholder="Enter your email, phone or username"
                placeholderTextColor="#9AA7B4"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="send"
                onSubmitEditing={() => void submit()}
                accessibilityLabel="Email, phone or username"
                style={{ flex: 1, height: "100%", color: TEXT, fontSize: 15 }}
              />
            </View>

            <Pressable
              onPress={() => void submit()}
              disabled={busy}
              accessibilityRole="button"
              style={({ pressed }) => ({
                height: 54,
                borderRadius: 27,
                backgroundColor: colors.emeraldFill,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                opacity: busy ? 0.65 : pressed ? 0.85 : 1,
              })}
            >
              {busy ? (
                <ActivityIndicator color={WHITE} />
              ) : (
                <>
                  <Text style={{ color: WHITE, fontSize: 15, fontWeight: "700" }}>Send reset code</Text>
                  <Ionicons name="arrow-forward" size={18} color={WHITE} />
                </>
              )}
            </Pressable>

            <Pressable
              onPress={() => router.push("/auth/reset-password")}
              accessibilityRole="button"
              style={{ alignItems: "center", paddingVertical: 18 }}
            >
              <Text style={{ color: colors.emerald, fontSize: 14, fontWeight: "700" }}>
                I already have a reset code
              </Text>
            </Pressable>

            <View style={{ flex: 1 }} />

            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 }}>
              <Text style={{ color: MUTED, fontSize: 13 }}>Remembered it?</Text>
              <Pressable onPress={() => router.replace("/auth/login")} accessibilityRole="link" hitSlop={8}>
                <Text style={{ color: colors.emerald, fontSize: 13, fontWeight: "800" }}>Back to sign in</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}