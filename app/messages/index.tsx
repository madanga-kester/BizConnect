import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Avatar, EmptyState, LocalNote, Page, SectionTitle, TopBar, styles } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { colors } from "@/theme/tokens";
import { formatDate } from "@/utils/kenya";
import { PEOPLE } from "@/data/seed";
import { evaluateMessagePermission } from "@/utils/privacy-policy";
import { ApiMessagesScreen } from "@/components/api-messaging-screens";
import { useMabizServiceMode } from "@/lib/services/service-provider";
import { useThemeContext } from "@/lib/theme-provider";

export default function MessagesScreen() {
  useThemeContext();
  const mode = useMabizServiceMode();
  return mode === "api" ? <ApiMessagesScreen /> : <LocalMessagesScreen />;
}

function LocalMessagesScreen() {
  useThemeContext();
  const app = useAppStore(); const [query, setQuery] = useState("");
  const conversations = useMemo(() => app.conversations.filter((conversation) => {
    const participant = !conversation.businessId ? PEOPLE.find((person) => person.id === conversation.participantId) : undefined;
    const allowed = evaluateMessagePermission({ isAuthenticated: app.isAuthenticated, participantId: conversation.participantId, privateProfile: participant?.privateProfile, businessId: conversation.businessId, businesses: app.businesses, blockedUserIds: app.blockedUsers, messagePermissions: app.settings.messagePermissions, followedPeople: app.followedPeople, followedBusinesses: app.followedBusinesses }).allowed;
    return allowed && `${conversation.participantName} ${conversation.lastMessage}`.toLowerCase().includes(query.toLowerCase());
  }), [app.conversations, app.isAuthenticated, app.businesses, app.blockedUsers, app.settings.messagePermissions, app.followedPeople, app.followedBusinesses, query]);
  if (!app.isAuthenticated) return <Page><TopBar title="Messages" back /><EmptyState title="Sign in to see messages" detail="Browse businesses without an account; private conversations require sign-in." icon="lock-closed-outline" action="Sign in" onAction={() => router.push("/auth/login")} /></Page>;
  return <Page><TopBar title="Messages" back right={<Pressable accessibilityRole="button" onPress={() => router.push("/menu/privacy/messages-replies")} style={styles.iconButton}><Ionicons name="options-outline" size={19} color={colors.ink} /></Pressable>} /><LocalNote text="Messages in this demo are stored on this device and are not delivered." /><View style={styles.inputWrap}><Ionicons name="search" size={17} color={colors.muted} /><TextInput value={query} onChangeText={setQuery} placeholder="Search conversations" placeholderTextColor={colors.muted} style={{ flex: 1, padding: 10, color: colors.ink }} /></View>
    <SectionTitle title="Your conversations" />
    {conversations.map((conversation) => { const business = app.businesses.find((b) => b.id === conversation.businessId); return <Pressable key={conversation.id} accessibilityRole="button" onPress={() => router.push({ pathname: "/messages/[id]", params: { id: conversation.id } })} style={styles.actionTile}><Avatar name={conversation.participantName} size={46} /><View style={{ flex: 1, gap: 3 }}><View style={styles.rowBetween}><Text style={styles.cardTitle}>{business?.name ?? conversation.participantName}</Text><Text style={styles.caption}>{formatDate(conversation.updatedAt, app.settings.language)}</Text></View><Text numberOfLines={1} style={styles.caption}>{conversation.lastMessage}</Text>{business ? <Text style={{ color: colors.emeraldDark, fontSize: 10, fontWeight: "700" }}>Business enquiry · {conversation.participantName}</Text> : null}</View>{conversation.unread ? <View style={{ width: 8, height: 8, borderRadius: 5, backgroundColor: colors.orange }} /> : null}</Pressable>; })}
    {!conversations.length ? <EmptyState title={query.trim() ? "No conversations found" : "No conversations yet"} detail={query.trim() ? "Try another person or message, or clear your search." : "Start a business enquiry from a product or profile. Messages stay local in this demo."} icon="chatbubbles-outline" action={query.trim() ? "Clear search" : "Discover businesses"} onAction={() => query.trim() ? setQuery("") : router.push("/(tabs)/discover")} /> : null}
    <Text style={styles.caption}>Future live messaging can connect to ASP.NET Core SignalR; no live messages are sent from this app.</Text>
  </Page>;
}
