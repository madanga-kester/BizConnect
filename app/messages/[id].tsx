import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Platform, Pressable, Text, TextInput, View } from "react-native";
import { Avatar, EmptyState, LocalNote, MediaImage, Page, TopBar, styles } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { colors } from "@/theme/tokens";
import { PEOPLE } from "@/data/seed";
import { evaluateMessagePermission } from "@/utils/privacy-policy";
import { ApiChatScreen } from "@/components/api-messaging-screens";
import { useMabizServiceMode } from "@/lib/services/service-provider";

function feedback(message: string) { if (Platform.OS === "web") window.alert(message); else Alert.alert("Messages", message); }
export default function ChatScreen() {
  const mode = useMabizServiceMode();
  return mode === "api" ? <ApiChatScreen /> : <LocalChatScreen />;
}

function LocalChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); const app = useAppStore(); const conversation = app.conversations.find((c) => c.id === id); const [text, setText] = useState(""); const [image, setImage] = useState<string | undefined>();
  const participant = conversation && !conversation.businessId ? PEOPLE.find((person) => person.id === conversation.participantId) : undefined;
  const messagingAllowed = Boolean(conversation && evaluateMessagePermission({ isAuthenticated: app.isAuthenticated, participantId: conversation.participantId, privateProfile: participant?.privateProfile, businessId: conversation.businessId, businesses: app.businesses, blockedUserIds: app.blockedUsers, messagePermissions: app.settings.messagePermissions, followedPeople: app.followedPeople, followedBusinesses: app.followedBusinesses }).allowed);
  const markConversationRead = app.markConversationRead;
  const conversationId = conversation?.id;
  useEffect(() => { if (conversationId && messagingAllowed) markConversationRead(conversationId); }, [conversationId, messagingAllowed, markConversationRead]);
  if (!app.isAuthenticated) return <Page><TopBar title="Messages" back /><EmptyState title="Sign in to open messages" detail="Private conversations require an authenticated account." icon="lock-closed-outline" action="Sign in" onAction={() => router.push("/auth/login")} /></Page>;
  if (conversation && !messagingAllowed) return <Page><TopBar title="Messages" back /><EmptyState title="Messaging is limited" detail="Your privacy or block settings do not allow this conversation." icon="lock-closed-outline" action="Review privacy" onAction={() => router.push("/privacy")} /></Page>;
  if (!conversation) return <Page><TopBar title="Conversation" back /><EmptyState title="Conversation not found" detail="Start a new business enquiry from a business or product page." action="Discover businesses" onAction={() => router.replace("/(tabs)/discover")} /></Page>;
  const business = app.businesses.find((b) => b.id === conversation.businessId);
  const send = () => { if (!app.isAuthenticated) return router.push("/auth/login"); if (!text.trim() && !image) return; app.sendMessage(conversation.id, text.trim() || "Image attachment selected in the local demo", image); setText(""); setImage(undefined); };
  const attach = async () => { try { const Picker = await import("expo-image-picker"); const p = await Picker.requestMediaLibraryPermissionsAsync(); if (!p.granted) return feedback("Allow media access to select an image."); const result = await Picker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.65 }); if (!result.canceled) setImage(result.assets[0].uri); } catch { feedback("Image attachments can be selected in Expo Go; no file is sent to a server."); } };
  return <Page><TopBar title={business?.name ?? conversation.participantName} back right={<Avatar name={conversation.participantName} size={35} />} /><LocalNote text="Local chat demo · nothing is delivered to another user" />{business ? <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/business/[id]", params: { id: business.id } })} style={styles.actionTile}><Ionicons name="briefcase-outline" size={20} color={colors.emerald} /><View style={{ flex: 1 }}><Text style={styles.cardTitle}>Business enquiry · {business.name}</Text><Text style={styles.caption}>Open profile, products and public business contact</Text></View></Pressable> : null}
    <View style={{ gap: 10 }}>{conversation.messages.length ? conversation.messages.map((message) => { const mine = message.senderId === app.user.id; return <View key={message.id} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "86%", backgroundColor: mine ? colors.emeraldFill : colors.surface, padding: 12, borderRadius: 17, gap: 5 }}><Text style={{ color: mine ? colors.white : colors.ink, lineHeight: 20 }}>{message.text}</Text>{message.image ? <MediaImage uri={message.image} height={100} label="Message attachment" /> : null}<View style={styles.rowBetween}><Text style={{ color: mine ? "#E2F4ED" : colors.muted, fontSize: 10 }}>{new Date(message.createdAt).toLocaleTimeString("en-KE", { hour: "numeric", minute: "2-digit" })}</Text>{mine ? <Text style={{ color: "#E2F4ED", fontSize: 10 }}>{message.status === "read" ? "Read" : "Sent locally"}</Text> : null}</View></View>; }) : <EmptyState title="No messages yet" detail="Say hello to start this local-demo conversation. Nothing is delivered to another user." icon="chatbubbles-outline" />}</View>
    <View style={{ marginTop: "auto", gap: 8 }}>{image ? <MediaImage uri={image} height={100} label="Selected attachment preview" /> : null}<View style={styles.inputWrap}><Pressable accessibilityRole="button" accessibilityLabel="Attach image" onPress={() => void attach()}><Ionicons name="attach-outline" size={20} color={colors.emerald} /></Pressable><TextInput value={text} onChangeText={setText} placeholder="Write a message…" placeholderTextColor={colors.muted} style={{ flex: 1, padding: 11, color: colors.ink }} multiline /><Pressable accessibilityRole="button" accessibilityLabel="Send local demo message" onPress={send}><Ionicons name="send" size={20} color={colors.emerald} /></Pressable></View><Text style={styles.caption}>Messages are local-only. Future API adapter: ASP.NET Core SignalR.</Text></View>
  </Page>;
}
