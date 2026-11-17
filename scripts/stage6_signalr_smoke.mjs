import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { randomUUID } from "node:crypto";

const base = (process.env.Mabiz_TEST_API_URL ?? "http://127.0.0.1:5199").replace(/\/$/, "");
const testDb = process.env.Mabiz_TEST_DB ?? "";
if (!/(database|dbname)=Mabiz_test(?:;|$)/i.test(testDb)) {
  throw new Error("Safety guard: set Mabiz_TEST_DB to a connection string whose database is exactly Mabiz_test.");
}

async function json(response) {
  const text = await response.text();
  let value;
  try { value = text ? JSON.parse(text) : null; } catch { value = text; }
  if (!response.ok) throw new Error(`${response.status} ${response.url}: ${JSON.stringify(value)}`);
  return value;
}
async function post(path, body, token) {
  return json(await fetch(`${base}${path}`, { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body ?? {}) }));
}
async function register(prefix) {
  const suffix = randomUUID().replaceAll("-", "").slice(0, 9);
  const username = `${prefix}${suffix}`.slice(0, 27);
  const email = `${username}@example.test`;
  const registration = await post("/api/v1/auth/register", { name: username, username, email, phone: null, password: "P@ssword12345", county: "Nairobi", town: "Nairobi", interests: ["Retail"], avatar: null });
  const login = await post("/api/v1/auth/login", { identifier: email, password: "P@ssword12345" });
  return { userId: registration.id, accessToken: login.accessToken };
}
function newHub(token) {
  return new HubConnectionBuilder().withUrl(`${base}/hubs/messaging`, { accessTokenFactory: () => token })
    .withAutomaticReconnect([0, 1000, 3000]).configureLogging(LogLevel.Error).build();
}
function waitFor(promise, label, timeoutMs = 10000) {
  return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error(`Timed out waiting for ${label}`)), timeoutMs))]);
}

const alice = await register("hubalice");
const bob = await register("hubbob");
const outsider = await register("huboutsider");
const conversation = await post("/api/v1/conversations", { participantId: bob.userId }, alice.accessToken);
const aliceHub = newHub(alice.accessToken);
const bobHub = newHub(bob.accessToken);
const outsiderHub = newHub(outsider.accessToken);
let receivedResolve;
const received = new Promise((resolve) => { receivedResolve = resolve; });
let readResolve;
const readReceipt = new Promise((resolve) => { readResolve = resolve; });
let notificationResolve;
const notificationEvent = new Promise((resolve) => { notificationResolve = resolve; });
const text = `live-signalr-${randomUUID()}`;
try {
  bobHub.on("MessageReceived", (message) => { if (message.text === text) receivedResolve(message); });
  aliceHub.on("ConversationRead", (payload) => { if (payload.readerUserId === bob.userId) readResolve(payload); });
  bobHub.on("NotificationReceived", (payload) => { if (payload.type === "message") notificationResolve(payload); });
  await Promise.all([aliceHub.start(), bobHub.start(), outsiderHub.start()]);
  await Promise.all([aliceHub.invoke("JoinConversation", conversation.id), bobHub.invoke("JoinConversation", conversation.id)]);

  let unauthorizedJoinDenied = false;
  try { await outsiderHub.invoke("JoinConversation", conversation.id); } catch { unauthorizedJoinDenied = true; }
  if (!unauthorizedJoinDenied) throw new Error("An outsider unexpectedly joined a private conversation group.");

  const ack = await aliceHub.invoke("SendMessage", conversation.id, randomUUID(), text);
  const pushed = await waitFor(received, "SignalR MessageReceived");
  if (ack.text !== text || pushed.text !== text || ack.id !== pushed.id) throw new Error("The SignalR acknowledgement and broadcast did not match.");

  await post(`/api/v1/conversations/${conversation.id}/read`, {}, bob.accessToken);
  await waitFor(readReceipt, "ConversationRead receipt");
  const page = await json(await fetch(`${base}/api/v1/conversations/${conversation.id}/messages`, { headers: { Authorization: `Bearer ${bob.accessToken}` } }));
  if (!page.items.some((message) => message.id === ack.id && message.text === text)) throw new Error("The real-time message was not persisted and available through REST.");

  const pushedNotification = await waitFor(notificationEvent, "SignalR NotificationReceived");
  const notificationPage = await json(await fetch(`${base}/api/v1/notifications?page=1&pageSize=20`, { headers: { Authorization: `Bearer ${bob.accessToken}` } }));
  const persistedNotification = notificationPage.items.find((item) => item.id === pushedNotification.id);
  if (!persistedNotification || persistedNotification.type !== "message" || persistedNotification.conversationId !== conversation.id)
    throw new Error("The SignalR notification was not persisted in the recipient's notification inbox.");
  const unread = await json(await fetch(`${base}/api/v1/notifications/unread-count`, { headers: { Authorization: `Bearer ${bob.accessToken}` } }));
  if (unread.count !== 1) throw new Error(`Expected one unread inbox notification for Bob, got ${unread.count}.`);
  const [senderInbox, outsiderInbox] = await Promise.all([
    json(await fetch(`${base}/api/v1/notifications`, { headers: { Authorization: `Bearer ${alice.accessToken}` } })),
    json(await fetch(`${base}/api/v1/notifications`, { headers: { Authorization: `Bearer ${outsider.accessToken}` } })),
  ]);
  if (senderInbox.total !== 0 || outsiderInbox.total !== 0) throw new Error("A notification leaked to the message sender or unrelated user.");

  console.log(JSON.stringify({ ok: true, api: base, conversationId: conversation.id, notificationId: pushedNotification.id, checks: ["authenticated SignalR connections", "membership checked for conversation group join", "unauthorized join denied", "SignalR message acknowledgement and broadcast", "read receipt event", "REST message persistence", "notification outbox SignalR delivery", "notification inbox persistence and unread count", "recipient isolation"] }, null, 2));
} finally {
  await Promise.all([aliceHub.stop(), bobHub.stop(), outsiderHub.stop()].map((promise) => promise.catch(() => undefined)));
}
