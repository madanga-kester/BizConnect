import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Platform, Pressable, Text, TextInput, View } from "react-native";
import { Avatar, EmptyState, Page, SectionTitle, TopBar, styles } from "@/components/biz-ui";
import { MessagingRealtimeClient, type MessagingConnectionState } from "@/lib/api/messaging-realtime";
import { useMabizServices } from "@/lib/services/service-provider";
import { useAppStore } from "@/hooks/use-app-store";
import type { ChatMessage, Conversation } from "@/types/domain";
import { colors } from "@/theme/tokens";
import { useThemeContext } from "@/lib/theme-provider";

function say(message: string) { if (Platform.OS === "web") window.alert(message); else Alert.alert("Messages", message); }
function errorText(error: { code: string; message: string }) { return `${error.message} (${error.code})`; }
function stamp(value: string): string { const date = new Date(value); return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("en-KE", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }); }
function timeOf(value: string): string { const date = new Date(value); return Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString("en-KE", { hour: "numeric", minute: "2-digit" }); }
function uniqueMessages(values: ChatMessage[]): ChatMessage[] { const map = new Map<string, ChatMessage>(); for (const value of values) map.set(value.id, value); return [...map.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt)); }
function clientId(): string { try { return globalThis.crypto.randomUUID(); } catch { return `${Date.now()}-${Math.random().toString(16).slice(2)}-4000-8000-${Math.random().toString(16).slice(2)}`; } }

export function ApiMessagesScreen() {
  useThemeContext();
  const services = useMabizServices();
  const app = useAppStore();
  const [items, setItems] = useState<Conversation[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    const result = await services.messaging.listConversations({ limit: 50 });
    if (result.ok) setItems(result.data.items);
    else setError(errorText(result.error));
    setLoading(false);
  }, [services]);
  useEffect(() => { if (app.isAuthenticated) void load(); else setLoading(false); }, [app.isAuthenticated, load]);
  const visible = useMemo(() => items.filter((item) => !item.isArchived && `${item.participantName} ${item.lastMessage} ${item.catalogItemTitle ?? ""}`.toLowerCase().includes(query.trim().toLowerCase())), [items, query]);
  const archive = async (conversationId: string) => {
    setBusyId(conversationId);
    const result = await services.messaging.archive(conversationId);
    if (result.ok) setItems((current) => current.filter((item) => item.id !== conversationId)); else say(errorText(result.error));
    setBusyId(null);
  };
  if (!app.isAuthenticated) return <Page><TopBar title="Messages" back /><EmptyState title="Sign in to see messages" detail="Private conversations require an authenticated account." icon="lock-closed-outline" action="Sign in" onAction={() => router.push("/auth/login")} /></Page>;
  return <Page><TopBar title="Messages" back />
    <View style={styles.inputWrap}><Ionicons name="search" size={17} color={colors.muted} /><TextInput value={query} onChangeText={setQuery} placeholder="Search conversations" placeholderTextColor={colors.muted} style={{ flex: 1, padding: 10, color: colors.ink }} /></View>
    <SectionTitle title="Your conversations" />
    {loading ? <View style={{ padding: 24, alignItems: "center" }}><ActivityIndicator color={colors.emerald} /><Text style={styles.caption}>Loading conversations…</Text></View> : null}
    {error ? <View style={styles.actionTile}><Text style={{ color: colors.danger, flex: 1 }}>{error}</Text><Pressable accessibilityRole="button" onPress={() => void load()}><Text style={{ color: colors.emerald, fontWeight: "700" }}>Retry</Text></Pressable></View> : null}
    {!loading && !error ? visible.map((conversation) => <View key={conversation.id} style={[styles.actionTile, { gap: 10 }]}>
      <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: "/messages/[id]", params: { id: conversation.id } })} style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
        <Avatar name={conversation.participantName} size={46} /><View style={{ flex: 1, gap: 4 }}>
          <View style={styles.rowBetween}><Text numberOfLines={1} style={styles.cardTitle}>{conversation.participantName}</Text><Text style={styles.caption}>{stamp(conversation.updatedAt)}</Text></View>
          <Text numberOfLines={1} style={styles.caption}>{conversation.lastMessage || "No messages yet"}</Text>
          {conversation.businessId ? <Text style={{ color: colors.emeraldDark, fontSize: 10, fontWeight: "700" }}>{conversation.catalogItemTitle ? `Enquiry · ${conversation.catalogItemTitle}` : "Business enquiry"}</Text> : null}
        </View>
        {conversation.unread > 0 ? <View style={{ minWidth: 20, height: 20, borderRadius: 10, backgroundColor: colors.orange, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 }}><Text style={{ color: colors.white, fontSize: 11, fontWeight: "800" }}>{conversation.unread > 99 ? "99+" : conversation.unread}</Text></View> : null}
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Archive conversation" disabled={busyId === conversation.id} onPress={() => void archive(conversation.id)}><Ionicons name="archive-outline" size={18} color={colors.muted} /></Pressable>
    </View>) : null}
    {!loading && !error && !visible.length ? <EmptyState title={query ? "No conversations found" : "No conversations yet"} detail={query ? "Try another search." : "Start an enquiry from a business or catalogue item. Your messages sync with the service when API mode is enabled."} icon="chatbubbles-outline" action={query ? "Clear search" : "Discover businesses"} onAction={() => query ? setQuery("") : router.push("/(tabs)/discover")} /> : null}
  </Page>;
}

export function ApiChatScreen() {
  useThemeContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = Array.isArray(id) ? id[0] : id;
  const app = useAppStore();
  const services = useMabizServices();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connection, setConnection] = useState<MessagingConnectionState>("connecting");
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [loadingOlder, setLoadingOlder] = useState(false);
  const realtime = useRef<MessagingRealtimeClient | null>(null);
  const mounted = useRef(true);

  const sync = useCallback(async (replace = true) => {
    if (!conversationId) { setLoading(false); setError("Conversation not found."); return; }
    const [conversationResult, messagesResult] = await Promise.all([
      services.messaging.getConversation(conversationId),
      services.messaging.listMessages(conversationId, { limit: 30 }),
    ]);
    if (!mounted.current) return;
    if (!conversationResult.ok) setError(errorText(conversationResult.error)); else setConversation(conversationResult.data);
    if (!messagesResult.ok) setError(errorText(messagesResult.error));
    else {
      setMessages((current) => uniqueMessages(replace ? messagesResult.data.items : [...messagesResult.data.items, ...current]));
      setNextCursor(messagesResult.data.nextCursor);
      void services.messaging.markDelivered(conversationId);
      void services.messaging.markRead(conversationId);
    }
    setLoading(false);
  }, [conversationId, services]);

  useEffect(() => {
    mounted.current = true;
    if (!app.isAuthenticated) { setLoading(false); return; }
    void sync(true);
    let client: MessagingRealtimeClient | null = null;
    try {
      client = new MessagingRealtimeClient();
      realtime.current = client;
      client.onMessage((message) => {
        if (!mounted.current) return;
        setMessages((current) => uniqueMessages([...current, message]));
        if (message.senderId !== app.user.id && conversationId) void services.messaging.markRead(conversationId);
      });
      client.onRead((readerId) => {
        if (readerId !== app.user.id) setMessages((current) => current.map((message) => message.senderId === app.user.id ? { ...message, status: "read" } : message));
      });
      client.onStatus((messageId, status) => {
        setMessages((current) => current.map((message) => message.senderId === app.user.id && (messageId === "00000000-0000-0000-0000-000000000000" || message.id === messageId) && message.status !== "read" ? { ...message, status } : message));
      });
      client.onState((state) => {
        setConnection(state);
        if (state === "connected") void sync(true); // REST is authoritative; recover any events missed while disconnected.
      });
      void client.connect().then(() => conversationId ? client?.joinConversation(conversationId) : undefined).catch(() => setConnection("disconnected"));
    } catch { setConnection("disconnected"); }
    return () => { mounted.current = false; if (client && conversationId) void client.leaveConversation(conversationId).finally(() => client?.stop()); else void client?.stop(); realtime.current = null; };
  }, [app.isAuthenticated, app.user.id, conversationId, services.messaging, sync]);

  const loadOlder = async () => {
    if (!conversationId || !nextCursor || loadingOlder) return;
    setLoadingOlder(true);
    const result = await services.messaging.listMessages(conversationId, { limit: 30, cursor: nextCursor });
    if (result.ok) { setMessages((current) => uniqueMessages([...result.data.items, ...current])); setNextCursor(result.data.nextCursor); }
    else setError(errorText(result.error));
    setLoadingOlder(false);
  };

  const send = async () => {
    const body = text.trim();
    if (!body || !conversation || sending || conversation.isBlocked) return;
    setSending(true); setError(null);
    const key = clientId();
    try {
      let message: ChatMessage;
      if (realtime.current) message = await realtime.current.sendMessage(conversation.id, key, body);
      else throw new Error("SIGNALR_DISCONNECTED");
      setMessages((current) => uniqueMessages([...current, message]));
      setConversation((current) => current ? { ...current, lastMessage: message.text, updatedAt: message.createdAt } : current);
      setText("");
    } catch {
      // Same client ID makes a REST retry safe even if SignalR persisted the message but its ack was lost.
      const result = await services.messaging.sendMessage({ conversationId: conversation.id, clientMessageId: key, text: body });
      if (result.ok) {
        setMessages((current) => uniqueMessages([...current, result.data]));
        setConversation((current) => current ? { ...current, lastMessage: result.data.text, updatedAt: result.data.createdAt } : current);
        setText("");
      } else setError(errorText(result.error));
    }
    setSending(false);
  };

  const block = async () => {
    if (!conversation) return;
    const result = conversation.isBlocked ? await services.messaging.unblock(conversation.id) : await services.messaging.block(conversation.id);
    if (result.ok) setConversation({ ...conversation, isBlocked: !conversation.isBlocked }); else say(errorText(result.error));
  };
  const archive = async () => {
    if (!conversation) return;
    const result = await services.messaging.archive(conversation.id);
    if (result.ok) router.back(); else say(errorText(result.error));
  };

  if (!app.isAuthenticated) return <Page><TopBar title="Messages" back /><EmptyState title="Sign in to open messages" detail="Private conversations require an authenticated account." icon="lock-closed-outline" action="Sign in" onAction={() => router.push("/auth/login")} /></Page>;
  if (loading) return <Page><TopBar title="Conversation" back /><View style={{ padding: 28, alignItems: "center" }}><ActivityIndicator color={colors.emerald} /><Text style={styles.caption}>Loading secure conversation…</Text></View></Page>;
  if (!conversation) return <Page><TopBar title="Conversation" back /><EmptyState title="Conversation unavailable" detail={error ?? "You may not have access to this conversation."} action="Back to messages" onAction={() => router.replace("/messages")} /></Page>;

  return <Page><TopBar title={conversation.participantName} back right={<Pressable accessibilityRole="button" accessibilityLabel={conversation.isBlocked ? "Unblock conversation" : "Block conversation"} onPress={() => void block()}><Ionicons name={conversation.isBlocked ? "lock-open-outline" : "ban-outline"} size={19} color={colors.ink} /></Pressable>} />
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 4 }}><View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: connection === "connected" ? colors.emerald : colors.orange }} /><Text style={styles.caption}>{connection === "connected" ? "Live · synced with server" : connection === "reconnecting" || connection === "connecting" ? "Reconnecting · messages sync over REST" : "Offline · messages sync over REST"}</Text><Pressable onPress={() => void realtime.current?.connect().catch(() => setConnection("disconnected"))}><Text style={{ color: colors.emerald, fontWeight: "700", marginLeft: 8 }}>Retry</Text></Pressable></View>
    {conversation.businessId ? <Pressable accessibilityRole="button" onPress={() => conversation.catalogItemId ? router.push({ pathname: "/product/[id]", params: { id: conversation.catalogItemId } }) : router.push({ pathname: "/business/[id]", params: { id: conversation.businessId! } })} style={styles.actionTile}>
      <Ionicons name="briefcase-outline" size={20} color={colors.emerald} /><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{conversation.catalogItemTitle ? `Enquiry · ${conversation.catalogItemTitle}` : `Business enquiry · ${conversation.participantName}`}</Text><Text style={styles.caption}>Open the related business or catalogue item</Text></View><Ionicons name="open-outline" size={16} color={colors.muted} />
    </Pressable> : null}
    {conversation.isBlocked ? <View style={styles.actionTile}><Text style={{ color: colors.danger, flex: 1 }}>This conversation is blocked. New messages are disabled.</Text></View> : null}
    <View style={{ flexDirection: "row", justifyContent: "flex-end" }}><Pressable accessibilityRole="button" onPress={() => void archive()}><Text style={{ color: colors.muted, fontWeight: "700" }}>Archive</Text></Pressable></View>
    {nextCursor ? <Pressable accessibilityRole="button" disabled={loadingOlder} onPress={() => void loadOlder()} style={{ alignItems: "center", padding: 8 }}><Text style={{ color: colors.emerald, fontWeight: "700" }}>{loadingOlder ? "Loading…" : "Load older messages"}</Text></Pressable> : null}
    {error ? <View style={styles.actionTile}><Text style={{ color: colors.danger, flex: 1 }}>{error}</Text><Pressable onPress={() => void sync(true)}><Text style={{ color: colors.emerald, fontWeight: "700" }}>Retry</Text></Pressable></View> : null}
    <View style={{ gap: 10, paddingBottom: 10 }}>{messages.length ? messages.map((message) => {
      const mine = message.senderId === app.user.id;
      return <View key={message.id} style={{ alignSelf: mine ? "flex-end" : "flex-start", maxWidth: "88%", backgroundColor: mine ? colors.emeraldFill : colors.surface, padding: 12, borderRadius: 17, gap: 5 }}>
        {!mine ? <Text style={{ color: colors.emeraldDark, fontSize: 11, fontWeight: "700" }}>{message.senderId === conversation.participantId ? conversation.participantName : "Business team"}</Text> : null}
        <Text style={{ color: mine ? colors.white : colors.ink, lineHeight: 20 }}>{message.text}</Text>
        <View style={styles.rowBetween}><Text style={{ color: mine ? "#E2F4ED" : colors.muted, fontSize: 10 }}>{timeOf(message.createdAt)}</Text>{mine ? <Text style={{ color: "#E2F4ED", fontSize: 10 }}>{message.status === "read" ? "Read" : message.status === "delivered" ? "Delivered" : "Sent"}</Text> : null}</View>
      </View>;
    }) : <EmptyState title="No messages yet" detail="Send a message to begin. The server stores it and updates the conversation participants." icon="chatbubbles-outline" />}</View>
    <View style={{ marginTop: "auto", gap: 8 }}><View style={styles.inputWrap}><TextInput value={text} onChangeText={setText} placeholder={conversation.isBlocked ? "Conversation blocked" : "Write a message…"} placeholderTextColor={colors.muted} style={{ flex: 1, padding: 11, color: colors.ink }} multiline editable={!conversation.isBlocked && !sending} /><Pressable accessibilityRole="button" accessibilityLabel="Send message" disabled={conversation.isBlocked || sending || !text.trim()} onPress={() => void send()}><Ionicons name="send" size={20} color={conversation.isBlocked || sending || !text.trim() ? colors.muted : colors.emerald} /></Pressable></View>
      <Text style={styles.caption}>Messages are sent to the service. Delivery and read receipts are server-tracked; attachments are not enabled in Stage 6.</Text>
    </View>
  </Page>;
}
