
import { router, type Href } from "expo-router";
import { useState } from "react";
import { Alert, Platform, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button, Field, Page, TopBar } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import {
  useBizConnectServices,
  useBizConnectServiceMode,
} from "@/lib/services/service-provider";
import { colors } from "@/theme/tokens";

function feedback(message: string) {
  if (Platform.OS === "web") window.alert(message);
  else Alert.alert("Sign in", message);
}

export default function LoginScreen() {
  const app = useAppStore();
  const services = useBizConnectServices();
  const apiMode = useBizConnectServiceMode() === "api";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const login = async () => {
    if (!email.trim() || !password) {
      return feedback("Enter your email, phone or username and password.");
    }

    if (apiMode && Platform.OS === "web") {
      return feedback(
        "Browser sign-in is not currently available. Please sign in using the BizConnect mobile application."
      );
    }

    setBusy(true);

    try {
      if (apiMode) {
        const result = await services.auth.login({
          identifier: email.trim(),
          password,
        });

        if (!result.ok) return feedback(result.error.message);

        await app.setApiUser(result.data.user);
        router.replace("/auth/account" as unknown as Href);
        return;
      }

      await app.setAuthenticated(true);
      router.replace("/(tabs)");
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
              WELCOME TO BIZCONNECT
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
              onPress={() =>
                apiMode
                  ? feedback(
                      "Password recovery is not yet connected to this sign-in screen."
                    )
                  : router.push("/auth/forgot-password")
              }
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
            Join BizConnect
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
            BizConnect · Discover. Connect. Grow.
          </Text>
        </View>
      </View>
    </Page>
  );
}
