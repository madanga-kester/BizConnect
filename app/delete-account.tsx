import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Button, ConfirmModal, EmptyState, LocalNote, Page, TopBar, styles } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";

export default function DeleteAccountScreen() {
  const app = useAppStore();
  const [confirm, setConfirm] = useState(false);
  if (!app.isAuthenticated) return <Page><TopBar title="Delete account" back /><EmptyState title="Sign in to manage your account" detail="This local deletion control is only available from your authenticated demo profile." icon="lock-closed-outline" action="Sign in" onAction={() => router.push("/auth/login")} /></Page>;
  return <Page><TopBar title="Delete account" back /><LocalNote text="This demo has no server account. Deletion only resets locally saved app state." /><View style={[styles.card, { padding: 16, gap: 10 }]}><Text style={styles.sectionHeading}>Remove your local demo profile?</Text><Text style={styles.body}>Confirming deletes the local BizConnect demo state, including profile edits, likes, follows, messages, drafts and settings on this device, then signs out. It cannot delete an account or data on a server because none was created.</Text><Text style={styles.caption}>This action is destructive and cannot be undone for this device&apos;s demo state.</Text></View><Button title="Delete local demo account" variant="danger" icon="trash-outline" onPress={() => setConfirm(true)} /><Button title="Cancel" variant="quiet" onPress={() => router.back()} /><ConfirmModal visible={confirm} title="Delete local demo data?" detail="Your locally saved BizConnect demo profile and interactions will be reset. No remote account or server data will be changed." confirmLabel="Delete local data" destructive onCancel={() => setConfirm(false)} onConfirm={() => { setConfirm(false); void app.deleteLocalDemoData(); router.replace("/auth"); }} /></Page>;
}
