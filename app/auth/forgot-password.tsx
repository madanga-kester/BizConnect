import { router } from "expo-router";
import { useState } from "react";
import { Alert, Platform, Text } from "react-native";
import { Button, Field, LocalNote, Page, TopBar, styles } from "@/components/biz-ui";
import { useThemeContext } from "@/lib/theme-provider";
function feedback(message: string) { if (Platform.OS === "web") window.alert(message); else Alert.alert("Password recovery", message); }
export default function ForgotPasswordScreen() {
  useThemeContext();
  const [email, setEmail] = useState("");
  return <Page><TopBar title="Forgot password" back /><Text style={styles.sectionHeading}>Recover your account</Text><Text style={styles.body}>Enter the email address associated with your account.</Text><LocalNote text="Password recovery is not connected to an account service; no email is sent." /><Field label="Email address" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" /><Button title="Continue to reset" onPress={() => { if (!/^\S+@\S+\.\S+$/.test(email)) return feedback("Enter a valid email address."); router.push("/auth/reset-password"); }} /><Button title="Send demo verification code" variant="quiet" onPress={() => router.push("/auth/otp")} /></Page>;
}
