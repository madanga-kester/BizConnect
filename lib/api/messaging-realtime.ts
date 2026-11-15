import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import { apiConfig } from "@/lib/api/config";
import { SecureSessionTokenProvider } from "@/lib/api/secure-session";
import type { AuthSession } from "@/lib/api/feature-contracts";
import type { ChatMessage } from "@/types/domain";

export type MessagingConnectionState = "connecting" | "connected" | "reconnecting" | "disconnected";
export interface RealtimeNotificationEvent { id: string; type: string; createdAt: string; }

/** SignalR carries events only. REST remains authoritative and callers resync history after reconnect. */
export class MessagingRealtimeClient {
  private connection: HubConnection;
  private joinedConversation: string | null = null;
  private messageListeners = new Set<(message: ChatMessage) => void>();
  private stateListeners = new Set<(state: MessagingConnectionState) => void>();
  private readListeners = new Set<(readerUserId: string, readAt: string) => void>();
  private statusListeners = new Set<(messageId: string, status: "delivered" | "read") => void>();
  private notificationListeners = new Set<(notification: RealtimeNotificationEvent) => void>();
  private disposed = false;

  constructor(baseUrl = apiConfig.baseUrl) {
    if (!baseUrl) throw new Error("API_NOT_CONFIGURED");
    const tokens = new SecureSessionTokenProvider();
    const refreshPath = apiConfig.authRefreshPath ?? "/auth/refresh";
    tokens.setRefreshHandler(async (refreshToken): Promise<AuthSession | null> => {
      try {
        const response = await fetch(`${baseUrl.replace(/\/$/, "")}${apiConfig.versionPrefix}${refreshPath}`, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ refreshToken }),
        });
        return response.ok ? await response.json() as AuthSession : null;
      } catch { return null; }
    });
    this.connection = new HubConnectionBuilder()
      .withUrl(`${baseUrl.replace(/\/$/, "")}/hubs/messaging`, {
        accessTokenFactory: async () => {
          const session = await tokens.getSession();
          if (!session) return "";
          if (Date.parse(session.expiresAt) <= Date.now() + 60_000)
            return await tokens.refreshAccessToken() ?? "";
          return session.accessToken;
        },
      })
      .withAutomaticReconnect([0, 2_000, 5_000, 10_000])
      .configureLogging(__DEV__ ? LogLevel.Warning : LogLevel.Error)
      .build();
    this.connection.on("MessageReceived", (value: ApiHubMessage) => {
      const message: ChatMessage = { id: value.id, senderId: value.senderUserId, text: value.text, createdAt: value.createdAt, status: value.status };
      for (const listener of this.messageListeners) listener(message);
    });
    this.connection.on("ConversationRead", (value: { readerUserId: string; readAt: string }) => {
      for (const listener of this.readListeners) listener(value.readerUserId, value.readAt);
    });
    this.connection.on("MessageStatusChanged", (value: { messageId: string; status: "delivered" | "read" }) => {
      for (const listener of this.statusListeners) listener(value.messageId, value.status);
    });
    this.connection.on("NotificationReceived", (value: RealtimeNotificationEvent) => {
      for (const listener of this.notificationListeners) listener(value);
    });
    this.connection.onreconnecting(() => this.emitState("reconnecting"));
    this.connection.onreconnected(async () => {
      this.emitState("connected");
      if (this.joinedConversation) await this.connection.invoke("JoinConversation", this.joinedConversation).catch(() => undefined);
    });
    this.connection.onclose(() => this.emitState("disconnected"));
  }

  async connect(): Promise<void> {
    if (this.disposed || this.connection.state !== HubConnectionState.Disconnected) return;
    this.emitState("connecting");
    await this.connection.start();
    this.emitState("connected");
    if (this.joinedConversation) await this.connection.invoke("JoinConversation", this.joinedConversation);
  }

  async joinConversation(conversationId: string): Promise<void> {
    this.joinedConversation = conversationId;
    if (this.connection.state === HubConnectionState.Connected) await this.connection.invoke("JoinConversation", conversationId);
  }

  async leaveConversation(conversationId: string): Promise<void> {
    if (this.joinedConversation === conversationId) this.joinedConversation = null;
    if (this.connection.state === HubConnectionState.Connected) await this.connection.invoke("LeaveConversation", conversationId);
  }

  async sendMessage(conversationId: string, clientMessageId: string, text: string): Promise<ChatMessage> {
    if (this.connection.state !== HubConnectionState.Connected) throw new Error("SIGNALR_DISCONNECTED");
    const response = await this.connection.invoke<ApiHubMessage>("SendMessage", conversationId, clientMessageId, text);
    return { id: response.id, senderId: response.senderUserId, text: response.text, createdAt: response.createdAt, status: response.status };
  }

  onMessage(listener: (message: ChatMessage) => void): () => void { this.messageListeners.add(listener); return () => this.messageListeners.delete(listener); }
  onRead(listener: (readerUserId: string, readAt: string) => void): () => void { this.readListeners.add(listener); return () => this.readListeners.delete(listener); }
  onStatus(listener: (messageId: string, status: "delivered" | "read") => void): () => void { this.statusListeners.add(listener); return () => this.statusListeners.delete(listener); }
  onNotification(listener: (notification: RealtimeNotificationEvent) => void): () => void { this.notificationListeners.add(listener); return () => this.notificationListeners.delete(listener); }
  onState(listener: (state: MessagingConnectionState) => void): () => void { this.stateListeners.add(listener); return () => this.stateListeners.delete(listener); }

  async stop(): Promise<void> {
    this.disposed = true;
    this.joinedConversation = null;
    await this.connection.stop();
    this.emitState("disconnected");
  }

  private emitState(state: MessagingConnectionState): void { for (const listener of this.stateListeners) listener(state); }
}

interface ApiHubMessage { id: string; conversationId: string; senderUserId: string; senderName: string; text: string; createdAt: string; status: "sent" | "delivered" | "read"; clientMessageId: string; }
