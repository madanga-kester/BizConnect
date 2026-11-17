import { router, type Href } from "expo-router";
import { useState } from "react";
import { Alert, Platform, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import { Button, Field, Page, TopBar } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { useMabizServices } from "@/lib/services/service-provider";
import { colors } from "@/theme/tokens";
function GoogleLogo({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <Path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <Path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <Path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </Svg>
  );
}

function feedback(message: string) {
  if (Platform.OS === "web") window.alert(message);
  else Alert.alert("Sign in", message);
}

export default function LoginScreen() {
  const app = useAppStore();
  const services = useMabizServices();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const googleLogin = () => {
    feedback("Google sign-in is coming soon.");
  };

  const login = async () => {
    if (!email.trim() || !password) {
      return feedback("Enter your email, phone or username and password.");
    }

    if (Platform.OS === "web") {
      return feedback(
        "Browser sign-in is not currently available. Please sign in using the Mabiz mobile application."
      );
    }

    setBusy(true);

    try {
      const result = await services.auth.login({
        identifier: email.trim(),
        password,
      });

      if (!result.ok) return feedback(result.error.message);

      await app.setApiUser(result.data.user);
      router.replace("/auth/account" as unknown as Href);
    } catch {
      feedback("Unable to sign in. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Page>
      <TopBar title="Sign in" back />

      <View style={{ gap: 25, paddingTop: 12 }}>
        {/* Welcome header */}
        <View
          style={{
            backgroundColor: colors.navy,
            borderRadius: 26,
            padding: 24,
            gap: 15,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              backgroundColor: "rgba(255,255,255,0.12)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name="lock-closed-outline"
              size={26}
              color={colors.orange}
            />
          </View>

          <View style={{ gap: 8 }}>
            <Text
              style={{
                color: colors.orange,
                fontSize: 11,
                fontWeight: "800",
                letterSpacing: 1.5,
              }}
            >
              WELCOME TO Mabiz
            </Text>

            <Text
              style={{
                color: colors.white,
                fontSize: 29,
                fontWeight: "800",
                lineHeight: 36,
              }}
            >
              Welcome back.
            </Text>

            <Text
              style={{
                color: "#D9E2E9",
                fontSize: 14,
                lineHeight: 22,
                maxWidth: 290,
              }}
            >
              Sign in and pick up where you left off. Your next opportunity
              could be one connection away.
            </Text>
          </View>

          <View
            style={{
              position: "absolute",
              width: 150,
              height: 150,
              borderRadius: 75,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
              right: -55,
              top: -55,
            }}
          />
        </View>

        {/* Login form */}
        <View style={{ gap: 18 }}>
          <View style={{ gap: 6 }}>
            <Text
              style={{
                color: colors.navy,
                fontSize: 20,
                fontWeight: "800",
              }}
            >
              Sign in to your account
            </Text>

            <Text
              style={{
                color: "#718078",
                fontSize: 13,
                lineHeight: 20,
              }}
            >
              Enter your credentials to continue.
            </Text>
          </View>

          <Field
            label="Email, phone or username"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email or username"
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
          />

          <View style={{ alignItems: "flex-end", marginTop: -5 }}>
            <Text
              onPress={() => router.push("/auth/forgot-password")}
              style={{
                color: colors.emerald,
                fontSize: 13,
                fontWeight: "700",
              }}
            >
              Forgot password?
            </Text>
          </View>

          <Button
            title={busy ? "Signing in..." : "Sign in"}
            icon="arrow-forward"
            disabled={busy}
            onPress={() => void login()}
          />

          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: "#E1E6E3" }} />
            <Text style={{ color: "#87938C", fontSize: 12, fontWeight: "600" }}>
              or
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: "#E1E6E3" }} />
          </View>

          <Pressable
            onPress={googleLogin}
            disabled={busy}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              height: 52,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#D5DBD7",
              backgroundColor: colors.white,
              opacity: busy ? 0.6 : 1,
            }}
          >
            <GoogleLogo size={20} />
            <Text style={{ color: colors.navy, fontSize: 15, fontWeight: "700" }}>
              Continue with Google
            </Text>
          </Pressable>
        </View>

        {/* Registration */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            paddingVertical: 12,
          }}
        >
          <Text style={{ color: "#718078", fontSize: 13 }}>
            Don't have an account?
          </Text>

          <Text
            onPress={() => router.push("/auth/register")}
            style={{
              color: colors.emerald,
              fontSize: 13,
              fontWeight: "800",
            }}
          >
            Join Mabiz
          </Text>
        </View>

        {/* Footer */}
        <View
          style={{
            alignItems: "center",
            gap: 7,
            paddingTop: 10,
            paddingBottom: 12,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Ionicons
              name="shield-checkmark-outline"
              size={15}
              color="#87938C"
            />

            <Text
              style={{
                color: "#87938C",
                fontSize: 11,
                fontWeight: "600",
              }}
            >
              Your business journey starts here.
            </Text>
          </View>

          <Text
            style={{
              color: "#A0AAA4",
              fontSize: 10,
            }}
          >
            Mabiz · Discover. Connect. Grow.
          </Text>
        </View>
      </View>
    </Page>
  );
}