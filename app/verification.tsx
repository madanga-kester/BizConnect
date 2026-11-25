import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Platform, Text, View } from "react-native";
import { Button, Chip, EmptyState, LocalNote, Page, SectionTitle, TopBar, styles } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { colors } from "@/theme/tokens";
import type { VerificationStatus } from "@/types/domain";
import { hasBusinessRole } from "@/utils/business-permissions";
import { useThemeContext } from "@/lib/theme-provider";

function feedback(message: string) {
  if (Platform.OS === "web") window.alert(message);
  else Alert.alert("Verification", message);
}

const STATUS_COPY: Record<VerificationStatus, string> = {
  not_requested: "No request submitted", pending: "Pending review", approved: "Approved", rejected: "Rejected",
};

export default function VerificationScreen() {
  useThemeContext();
  const app = useAppStore();
  const { businessId } = useLocalSearchParams<{ businessId?: string }>();
  const business = app.businesses.find((item) => item.id === businessId)
    ?? app.businesses.find((item) => item.id === app.activeBusinessId);
  const [documents, setDocuments] = useState<string[]>([]);
  const canManage = Boolean(business && app.isAuthenticated && hasBusinessRole(business, app.user.id));

  if (!business) return <Page><TopBar title="Business verification" back /><EmptyState title="Business not found" detail="Choose a business profile to view its verification status." icon="shield-outline" action="Discover businesses" onAction={() => router.push("/discover")} /></Page>;

  const verifyEditAccess = () => {
    const currentBusiness = app.businesses.find((item) => item.id === business.id);
    return Boolean(app.isAuthenticated && currentBusiness && hasBusinessRole(currentBusiness, app.user.id));
  };

  const selectDoc = async () => {
    if (!verifyEditAccess()) return feedback("Only this business's Owner or Administrator can submit verification documents.");
    try {
      const Picker = await import("expo-image-picker");
      const permission = await Picker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return feedback("Allow media access to choose a supporting document image.");
      const result = await Picker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: false, quality: 0.65 });
      if (!result.canceled && result.assets[0]) setDocuments((list) => [...list, result.assets[0].fileName ?? `document-${list.length + 1}.jpg`]);
    } catch { feedback("Document selection is available in Expo Go. Files are selected locally and are not uploaded in this frontend demo."); }
  };

  const submit = () => {
    if (!verifyEditAccess()) return feedback("Only this business's Owner or Administrator can submit a verification request.");
    const currentBusiness = app.businesses.find((item) => item.id === business.id);
    if (!currentBusiness) return feedback("This business is no longer available.");
    if (!documents.length) return feedback("Please select at least one supporting document before submitting the local request.");
    const date = new Date().toISOString();
    app.updateBusiness(currentBusiness.id, {
      verificationStatus: "pending",
      verified: false,
      verificationHistory: [...currentBusiness.verificationHistory, { status: "pending", date, note: "Frontend demo request submitted; documents were not uploaded or reviewed." }],
    });
    setDocuments([]);
    feedback("Request saved locally as Pending. No documents were uploaded or reviewed by a verification team.");
  };

  const current = business.verificationStatus;
  return <Page>
    <TopBar title="Business verification" back />
    <LocalNote text="Verification requests are local-only. No documents are uploaded or reviewed by a server." />
    <View style={[styles.card, { padding: 16, gap: 9 }]}>
      <View style={styles.row}><Ionicons name={current === "approved" ? "checkmark-circle" : current === "rejected" ? "close-circle" : current === "pending" ? "time" : "shield-outline"} size={24} color={current === "approved" ? colors.emerald : current === "rejected" ? colors.danger : colors.orange} /><Text style={styles.sectionHeading}>{STATUS_COPY[current]}</Text></View>
      <Text style={styles.body}>{business.name} · {business.town}, {business.county}</Text>
      {current === "rejected" ? <Text style={{ color: colors.danger, lineHeight: 20 }}>Reason: {business.verificationHistory.filter((item) => item.status === "rejected").at(-1)?.note ?? "The request needs additional supporting details."}</Text> : null}
      {current === "approved" ? <Chip label="Verified business badge" icon="checkmark-circle" selected /> : <Text style={styles.caption}>A verified badge appears only after an explicit approved state. Submitting a request never marks a business as verified.</Text>}
    </View>
    <SectionTitle title="Submit verification request" />
    <View style={styles.row}><Ionicons name="document-text-outline" size={19} color={colors.emerald} /><Text style={[styles.body, { flex: 1 }]}>Choose business registration or supporting identity documents. You control media permission at selection time.</Text></View>
    {canManage ? <>
      {documents.map((document, index) => <View key={`${document}-${index}`} style={styles.actionTile}><Ionicons name="document-attach-outline" size={20} color={colors.emerald} /><Text style={[styles.body, { flex: 1 }]}>{document}</Text><Text style={styles.caption}>Local only</Text></View>)}
      <Button title="Select supporting document" icon="attach-outline" variant="outline" onPress={() => void selectDoc()} />
      <Button title="Submit request" icon="send-outline" disabled={!documents.length || current === "pending"} onPress={submit} />
    </> : <View style={{ gap: 8 }}>
      <LocalNote text="Read-only verification status · only this business's Owner or Administrator can submit a request." />
      {!app.isAuthenticated ? <Button title="Sign in to manage a business you own" variant="outline" onPress={() => router.push("/auth/login")} /> : null}
    </View>}
    <SectionTitle title="Verification history" />
    {business.verificationHistory.length ? [...business.verificationHistory].reverse().map((item, index) => (
      <View key={`${item.date}-${index}`} style={[styles.actionTile, { alignItems: "flex-start" }]}><View style={styles.tileIcon}><Ionicons name={item.status === "approved" ? "checkmark" : item.status === "rejected" ? "close" : "time-outline"} size={18} color={item.status === "rejected" ? colors.danger : colors.emeraldDark} /></View><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{STATUS_COPY[item.status]}</Text><Text style={styles.caption}>{new Date(item.date).toLocaleDateString("en-KE")}</Text><Text style={styles.body}>{item.note}</Text></View></View>
    )) : <Text style={styles.caption}>No previous requests for this sample business.</Text>}
    <View style={[styles.card, { padding: 14, gap: 6 }]}><Text style={styles.cardTitle}>Possible states</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>{(["pending", "approved", "rejected"] as const).map((status) => <Chip key={status} label={STATUS_COPY[status]} selected={current === status} />)}</View><Text style={styles.caption}>Only a human reviewer can approve or reject a future real request. The demo cannot grant verification.</Text></View>
  </Page>;
}
