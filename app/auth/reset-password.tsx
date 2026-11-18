import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useRef, useState, type ReactNode } from "react";
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
  type KeyboardTypeOptions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "@/hooks/use-app-store";
import { useMabizServices } from "@/lib/services/service-provider";
import { useThemeContext } from "@/lib/theme-provider";
import { colors } from "@/theme/tokens";
import { PASSWORD_ERROR, isStrongPassword } from "@/utils/password-policy";

const NAVY = "#102A43";
const TEXT = "#172B3A";
const MUTED = "#718096";
const BORDER = "#DCE3EA";
const WHITE = "#FFFFFF";

function feedback(message: string) {
  if (Platform.OS === "web") window.alert(message);
  else Alert.alert("Reset password", message);
}

function Shell({ icon, title, subtitle, children }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string; children: ReactNode }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: NAVY }} edges={["top", "bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
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
              <Ionicons name={icon} size={26} color={colors.emeraldDark} />
            </View>

            <Text style={{ fontSize: 28, fontWeight: "800", color: NAVY, letterSpacing: -0.7 }}>{title}</Text>
            <Text style={{ fontSize: 14, color: MUTED, lineHeight: 21, marginTop: 7, marginBottom: 26 }}>{subtitle}</Text>

            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type PillInputProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: KeyboardTypeOptions;
  secure?: boolean;
  revealed?: boolean;
  onToggleReveal?: () => void;
  maxLength?: number;
  centered?: boolean;
};

function PillInput({ label, icon, value, onChangeText, placeholder, keyboardType, secure, revealed, onToggleReveal, maxLength, centered }: PillInputProps) {
  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={{ color: TEXT, fontSize: 13, fontWeight: "600", marginBottom: 9 }}>{label}</Text>
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
        }}
      >
        <Ionicons name={icon} size={19} color={MUTED} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9AA7B4"
          keyboardType={keyboardType}
          secureTextEntry={secure && !revealed}
          maxLength={maxLength}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={label}
          style={{
            flex: 1,
            height: "100%",
            color: TEXT,
            fontSize: centered ? 18 : 15,
            letterSpacing: centered ? 6 : 0,
          }}
        />
        {secure ? (
          <Pressable
            onPress={onToggleReveal}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={revealed ? "Hide password" : "Show password"}
          >
            <Ionicons name={revealed ? "eye-off-outline" : "eye-outline"} size={21} color={MUTED} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function PrimaryButton({ title, busy, disabled, onPress }: { title: string; busy: boolean; disabled?: boolean; onPress: () => void }) {
  const inactive = busy || disabled;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      style={({ pressed }) => ({
        height: 54,
        borderRadius: 27,
        backgroundColor: colors.emeraldFill,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        marginTop: 4,
        opacity: inactive ? 0.55 : pressed ? 0.85 : 1,
      })}
    >
      {busy ? (
        <ActivityIndicator color={WHITE} />
      ) : (
        <>
          <Text style={{ color: WHITE, fontSize: 15, fontWeight: "700" }}>{title}</Text>
          <Ionicons name="arrow-forward" size={18} color={WHITE} />
        </>
      )}
    </Pressable>
  );
}

function TextLink({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={{ alignItems: "center", paddingVertical: 18, opacity: disabled ? 0.5 : 1 }}
    >
      <Text style={{ color: colors.emerald, fontSize: 14, fontWeight: "700" }}>{label}</Text>
    </Pressable>
  );
}

export default function ResetPasswordScreen() {
  useThemeContext();
  const params = useLocalSearchParams<{ identifier?: string }>();
  const app = useAppStore();
  const services = useMabizServices();
  const [step, setStep] = useState<"code" | "password">("code");
  const [identifier, setIdentifier] = useState(params.identifier ?? "");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showAgain, setShowAgain] = useState(false);
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
      <Shell
        icon="lock-closed-outline"
        title="New password"
        subtitle="Your code is confirmed. Choose a password you have not used on this account before."
      >
        <PillInput
          label="New password"
          icon="lock-closed-outline"
          value={password}
          onChangeText={setPassword}
          placeholder="At least 12 characters"
          secure
          revealed={showPassword}
          onToggleReveal={() => setShowPassword((visible) => !visible)}
        />
        <PillInput
          label="Confirm password"
          icon="lock-closed-outline"
          value={again}
          onChangeText={setAgain}
          placeholder="Repeat your password"
          secure
          revealed={showAgain}
          onToggleReveal={() => setShowAgain((visible) => !visible)}
        />
        <PrimaryButton title="Change password" busy={busy} onPress={() => void changePassword()} />
        <TextLink
          label="Use a different code"
          disabled={busy}
          onPress={() => {
            setPassword("");
            setAgain("");
            setCode("");
            setStep("code");
          }}
        />
      </Shell>
    );
  }

  return (
    <Shell
      icon="mail-open-outline"
      title="Check your email"
      subtitle="Enter the 6-digit code we sent you. You will choose a new password next."
    >
      <PillInput
        label="Email, phone or username"
        icon="mail-outline"
        value={identifier}
        onChangeText={setIdentifier}
        placeholder="Enter your email, phone or username"
      />
      <PillInput
        label="Reset code"
        icon="keypad-outline"
        value={code}
        onChangeText={(value) => setCode(value.replace(/\D/g, "").slice(0, 6))}
        placeholder="123456"
        keyboardType="number-pad"
        maxLength={6}
        centered
      />
      <PrimaryButton title="Verify code" busy={busy} disabled={code.length !== 6} onPress={() => void verifyCode()} />
      <TextLink label="Send me a new code" disabled={busy} onPress={() => router.replace("/auth/forgot-password")} />

      <View style={{ flex: 1 }} />

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 }}>
        <Text style={{ color: MUTED, fontSize: 13 }}>Remembered it?</Text>
        <Pressable onPress={() => router.replace("/auth/login")} accessibilityRole="link" hitSlop={8}>
          <Text style={{ color: colors.emerald, fontSize: 13, fontWeight: "800" }}>Back to sign in</Text>
        </Pressable>
      </View>
    </Shell>
  );
}