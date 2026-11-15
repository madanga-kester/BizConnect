import { router } from "expo-router";
import { useState } from "react";
import { Alert, Platform, Text } from "react-native";
import { Button, Field, LocalNote, Page, TopBar, styles } from "@/components/biz-ui";
import { useThemeContext } from "@/lib/theme-provider";
function feedback(message: string) { if (Platform.OS === "web") window.alert(message); else Alert.alert("Reset password", message); }
export default function ResetPasswordScreen() {
  useThemeContext();
  const [password, setPassword] = useState(""); const [again, setAgain] = useState("");
  return <Page><TopBar title="Reset password" back /><Text style={styles.sectionHeading}>Choose a new password</Text><LocalNote text="This frontend cannot change a real account password." /><Field label="New password" value={password} onChangeText={setPassword} placeholder="At least 8 characters" secureTextEntry /><Field label="Confirm password" value={again} onChangeText={setAgain} placeholder="Repeat your password" secureTextEntry /><Button title="Save demo password" onPress={() => { if (password.length < 8 || password !== again) return feedback("Use at least 8 characters and make both entries match."); feedback("Password validation passed locally. No real account was changed."); router.replace("/auth/login"); }} /><Text style={styles.caption}>A real password reset flow requires backend identity, expiring reset tokens and email/SMS delivery.</Text></Page>;
}
