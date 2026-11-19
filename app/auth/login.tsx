
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { Svg, Path } from "react-native-svg";
import { router, type Href } from "expo-router";

import { useAppStore } from "@/hooks/use-app-store";
import { useMabizServices } from "@/lib/services/service-provider";
import { colors } from "@/theme/tokens";
import { useThemeContext } from "@/lib/theme-provider";

const NAVY = "#102A43";
const BLUE = "#246BFD";
const TEXT = "#172B3A";
const MUTED = "#718096";
const BORDER = "#DCE3EA";
const WHITE = "#FFFFFF";

function GoogleLogo() {
  useThemeContext();
  return (
    <Svg width={20} height={20} viewBox="0 0 48 48">
      <Path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"
      />
      <Path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.73 7.18l7.64 5.93c4.46-4.12 7.13-10.18 7.13-17.58Z"
      />
      <Path
        fill="#FBBC05"
        d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.9 23.9 0 0 0 0 21.56l7.98-6.19Z"
      />
      <Path
        fill="#34A853"
        d="M24 48c6.47 0 11.91-2.13 15.85-5.87l-7.64-5.93c-2.12 1.42-4.83 2.27-8.21 2.27-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"
      />
    </Svg>
  );
}

function PasswordInput({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.passwordWrapper}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Enter your password"
        placeholderTextColor="#9AA7B4"
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        style={styles.passwordInput}
        returnKeyType="done"
      />

      <Pressable
        onPress={() => setVisible((current) => !current)}
        style={styles.eyeButton}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel={visible ? "Hide password" : "Show password"}
      >
        <Ionicons
          name={visible ? "eye-off-outline" : "eye-outline"}
          size={21}
          color={MUTED}
        />
      </Pressable>
    </View>
  );
}

export default function LoginScreen() {
  useThemeContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const app = useAppStore();
  const services = useMabizServices();

  const feedback = (message: string) => {
    if (Platform.OS === "web") {
      window.alert(message);
    } else {
      Alert.alert("Sign in", message);
    }
  };

  const googleLogin = () => {
    feedback("Google sign-in is coming soon.");
  };

  const login = async () => {
    if (!email.trim() || !password) {
      feedback("Please enter your email and password.");
      return;
    }

    if (Platform.OS === "web") {
      feedback("Sign in is currently available on the mobile app.");
      return;
    }

    try {
      setBusy(true);

      const result = await services.auth.login({
        identifier: email.trim(),
        password,
      });

      if (!result.ok) {
        feedback(result.error.message);
        return;
      }

      await app.setApiUser(result.data.user);
      router.replace("/auth/account" as Href);
    } catch (error) {
      feedback(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero image and fade */}
          <View style={styles.heroAndForm}>
            <View style={styles.hero}>
              <ImageBackground
                source={require("@/assets/images/mabiz-login-hero.png")}
                resizeMode="cover"
                style={styles.heroImage}
              >
                <LinearGradient
                  colors={[
                    "rgba(16,42,67,0)",
                    "rgba(16,42,67,0.35)",
                    "rgba(16,42,67,0.8)",
                    NAVY,
                  ]}
                  locations={[0, 0.4, 0.78, 1]}
                  style={styles.heroFade}
                />
              </ImageBackground>
            </View>

            {/* Sign-in content overlaps the faded bottom of the image */}
            <View style={styles.formContainer}>
              <View style={styles.topBar}>
                <Pressable
                  onPress={() => router.back()}
                  style={styles.backButton}
                  hitSlop={10}
                >
                  <Ionicons name="arrow-back" size={22} color={NAVY} />
                </Pressable>

                <Text style={styles.topBarTitle}>Sign in</Text>
                <View style={styles.topBarSpacer} />
              </View>

              <Text style={styles.heading}>Welcome back</Text>
              <Text style={styles.subtitle}>
                Sign in to continue to your Mabiz account.
              </Text>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Email address</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    placeholderTextColor="#9AA7B4"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.input}
                    returnKeyType="next"
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Password</Text>
                <PasswordInput
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <Pressable
                onPress={() => router.push("/auth/forgot-password" as Href)}
                style={styles.forgotPassword}
              >
                <Text style={styles.forgotPasswordText}>
                  Forgot password?
                </Text>
              </Pressable>

              <Pressable
                onPress={login}
                disabled={busy}
                style={({ pressed }) => [
                  styles.signInButton,
                  pressed && !busy && styles.buttonPressed,
                  busy && styles.buttonDisabled,
                ]}
              >
                {busy ? (
                  <ActivityIndicator color={WHITE} />
                ) : (
                  <Text style={styles.signInButtonText}>Sign in</Text>
                )}
              </Pressable>

              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.divider} />
              </View>

              <Pressable
                onPress={googleLogin}
                style={({ pressed }) => [
                  styles.googleButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <GoogleLogo />
                <Text style={styles.googleButtonText}>
                  Continue with Google
                </Text>
              </Pressable>

              <View style={styles.registerRow}>
                <Text style={styles.registerText}>
                  Don't have an account?{" "}
                </Text>
                <Pressable
                  onPress={() => router.push("/auth/register" as Href)}
                >
                  <Text style={styles.registerLink}>Create account</Text>
                </Pressable>
              </View>

              <Text style={styles.footer}>
                © {new Date().getFullYear()} Mabiz. All rights reserved.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: WHITE,
  },
  keyboardView: {
    flex: 1,
  },
  scroll: {
    flex: 1,
    backgroundColor: WHITE,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroAndForm: {
    flex: 1,
    backgroundColor: WHITE,
  },
  hero: {
    height: 310,
    width: "100%",
    overflow: "hidden",
    backgroundColor: NAVY,
  },
  heroImage: {
    flex: 1,
    width: "100%",
  },
  heroFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 185,
  },
  formContainer: {
    marginTop: -48,
    paddingHorizontal: 26,
    paddingTop: 8,
    paddingBottom: 32,
    backgroundColor: WHITE,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    zIndex: 2,
  },
  topBar: {
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 22,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2F5F8",
  },
  topBarTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: NAVY,
  },
  topBarSpacer: {
    width: 38,
  },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    color: NAVY,
    letterSpacing: -0.7,
  },
  subtitle: {
    fontSize: 14,
    color: MUTED,
    lineHeight: 21,
    marginTop: 7,
    marginBottom: 26,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  label: {
    color: TEXT,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 9,
  },
  inputWrapper: {
    height: 54,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 27,
    backgroundColor: WHITE,
    justifyContent: "center",
  },
  input: {
    flex: 1,
    paddingHorizontal: 22,
    color: TEXT,
    fontSize: 15,
  },
  passwordWrapper: {
    height: 54,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 27,
    backgroundColor: WHITE,
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInput: {
    flex: 1,
    height: "100%",
    paddingLeft: 22,
    paddingRight: 5,
    color: TEXT,
    fontSize: 15,
  },
  eyeButton: {
    height: "100%",
    width: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginTop: -5,
    marginBottom: 22,
  },
  forgotPasswordText: {
    color: BLUE,
    fontSize: 13,
    fontWeight: "600",
  },
  signInButton: {
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.emeraldFill,
    alignItems: "center",
    justifyContent: "center",
  },
  signInButtonText: {
    color: WHITE,
    fontSize: 15,
    fontWeight: "700",
  },
  buttonPressed: {
    opacity: 0.82,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 23,
  },
  divider: {
    height: 1,
    flex: 1,
    backgroundColor: "#E8EDF2",
  },
  dividerText: {
    marginHorizontal: 14,
    color: MUTED,
    fontSize: 11,
    fontWeight: "600",
  },
  googleButton: {
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 11,
    backgroundColor: WHITE,
  },
  googleButtonText: {
    color: TEXT,
    fontSize: 14,
    fontWeight: "600",
  },
  registerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 25,
  },
  registerText: {
    color: MUTED,
    fontSize: 13,
  },
  registerLink: {
    color: BLUE,
    fontSize: 13,
    fontWeight: "700",
  },
  footer: {
    textAlign: "center",
    color: "#A0AAB5",
    fontSize: 11,
    marginTop: 30,
  },
});