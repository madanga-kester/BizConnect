# Stage 7 — Persistent notifications and delivery

Stage 7 extends the existing BizConnect Expo/React Native client and ASP.NET Core .NET 10, EF Core 10, PostgreSQL backend with a persistent notification inbox, authenticated SignalR delivery, optional Expo Push Service delivery, and account-level notification preferences. The existing Stage 2–6 modules remain in place. `mock-local` remains a separate mode: it keeps the existing seeded local inbox and does not call the Stage 7 API or register a push device.

## Event coverage and persistence

The backend creates notification records in the same EF unit of work as the source event. Current producers cover direct and business enquiry messages; post likes, comments and replies; new follows; business-team invitation and membership/role events; ownership transfers; and business/catalogue updates. Events use a stable source-event key plus recipient ID, with a unique constraint as a final idempotency guard. Self-notifications are not created.

`user_notifications` stores the recipient, optional actor, bounded title/body, event and target identifiers, creation/read/dismiss timestamps, visibility and the idempotency key. `notification_deliveries` is a durable outbox. It creates realtime rows for in-app-visible notifications and push rows for each eligible registered device when push is enabled. The outbox worker claims rows with a time-limited lease, sends outside the claim operation, and records accepted, suppressed, retryable or terminal states. Retries are bounded. Push is at-least-once around provider acceptance; an accepted Expo ticket is not a device-delivery receipt.

The `20261113035329_Stage7Notifications` migration is additive: it adds notification preference/device columns, notification and delivery tables, constraints and indexes. The migration has not been applied to `bizconnect_dev` or production. The integration test fixture validates the database name and recreates only `bizconnect_test` before applying the migration.

## Authenticated REST API

All routes below require an authenticated user. Inbox and device queries are scoped to that user.

| Method and route | Purpose |
| --- | --- |
| `GET /api/v1/notifications?page=1&pageSize=20&unreadOnly=false` | Newest-first notification page; dismissed and non-in-app-visible records are omitted. |
| `GET /api/v1/notifications/unread-count` | Current in-app unread badge count. |
| `POST /api/v1/notifications/read-all` | Mark all visible, non-dismissed notifications read. |
| `POST /api/v1/notifications/{notificationId}/read` | Mark one recipient-owned notification read. |
| `DELETE /api/v1/notifications/{notificationId}` | Dismiss one recipient-owned notification without hard-deleting its record. |
| `GET /api/v1/users/me/notification-preferences` | Read delivery/category preferences. |
| `PATCH /api/v1/users/me/notification-preferences` | Partially update preferences. |
| `GET /api/v1/users/me/devices` | List the current user's registered devices; raw push tokens are never returned. |
| `POST /api/v1/users/me/devices` | Register/update an installation and optionally set its Expo push token. |
| `DELETE /api/v1/users/me/devices/{deviceId}` | Revoke a device registration. |

Preference fields are `inAppEnabled`, `pushEnabled`, `messages`, `likes`, `comments`, `newFollowers`, `businessTeamActivity` and `businessUpdates`. A category is eligible only when enabled; in-app and push channels are then independently gated. The frontend's `follows` preference maps to the API field `newFollowers`.

Example device registration body:

```json
{
  "deviceIdentifier": "install-<stable-install-id>",
  "platform": "ios",
  "deviceName": "My iPhone",
  "pushToken": "ExponentPushToken[provided-by-expo]"
}
```

Push tokens are validated, protected with ASP.NET Core Data Protection before persistence, and indexed by a one-way hash for deduplication. API responses expose `hasPushToken`, not the token. A device registration alone does not enable pushes; `pushEnabled` must also be true.

## SignalR

The existing authenticated hub remains `/hubs/messaging`. On connection, the hub derives the user's notification group from the validated `sub` claim and joins it automatically; clients cannot select another user's group. The delivery worker emits `NotificationReceived` with only `{ id, type, createdAt }`. It does not send notification copy through SignalR. The Expo app then refreshes the REST unread count and inbox, which remain authoritative. The app-wide client refreshes on notification events, app foregrounding, and a 60-second fallback interval. Existing per-conversation SignalR behavior and REST resynchronization remain unchanged.

## Expo Push Service

The native app requests push permission only after the user enables push. Registration is supported on physical iOS/Android devices; web and simulators show an explanatory unavailable state. It obtains an Expo token, stores a stable install identifier in secure storage and calls the authenticated device endpoint. Foreground notifications use the Expo presentation handler. An authenticated push tap marks the inbox record read and routes to a linked conversation, post, catalogue item or business when a supported target ID is present, otherwise to the notification centre.

The Expo native config includes the `expo-notifications` plugin and `expo-device`. Set an EAS project ID for native builds using `EAS_PROJECT_ID` or `EXPO_PUBLIC_EAS_PROJECT_ID`. On the backend, start with push disabled and configure secrets only in the runtime environment/secret store when ready:

```dotenv
Push__Enabled=false
Push__Provider=expo
Push__ExpoEndpoint=https://exp.host/--/api/v2/push/send
Push__ExpoAccessToken=
Push__PollIntervalSeconds=5
Push__BatchSize=25
Push__MaxAttempts=8
```

When `Push__Enabled` is false or the provider/access token is missing, the provider reports an unconfigured state and makes no HTTP request; the worker records push delivery as suppressed and continues serving in-app notifications. This is intentional and graceful, but suppressed rows are not automatically replayed after enabling the provider. Configure the backend before expecting external pushes. A token invalidation response (`DeviceNotRegistered`) clears the unusable stored token. Delivery receipts beyond Expo ticket acceptance are not implemented in this stage.

## Expo app and mode separation

In API mode, the app exposes a notification centre, read-all/read-one, dismiss, pagination, category settings, an app-wide SignalR notification subscription, an unread badge on the Notifications tab, Expo device registration and push-tap routing. REST values are mapped into the existing UI model and the API controller's `page`/`pageSize` contract. In `mock-local` mode, the existing seeded local inbox remains editable in memory and is not synchronized, uploaded or represented as server data. API errors do not silently fall back to local events.

To use the API mode, set `EXPO_PUBLIC_API_MODE=api` and `EXPO_PUBLIC_API_BASE_URL` to the API origin (without the `/api/v1` suffix). Local mock mode remains the default. Notification settings are account-backed only in API mode.

## Verification commands

Use the repository's pinned Node/pnpm and .NET 10 versions. The PostgreSQL integration fixture destructively recreates only `bizconnect_test` and fails closed for any other database name.

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm exec expo export --platform web

dotnet build BizConnect.sln
export BIZCONNECT_TEST_DB='Host=localhost;Port=5432;Database=bizconnect_test;Username=bizconnect_test;Password=...'
dotnet test BizConnect.sln
```

For the enhanced live realtime smoke test, run the API with its `ConnectionStrings__BizConnect` set to the same `bizconnect_test` database, then run:

```bash
export BIZCONNECT_TEST_DB='Host=localhost;Port=5432;Database=bizconnect_test;Username=bizconnect_test;Password=...'
export BIZCONNECT_TEST_API_URL='http://127.0.0.1:5199'
node scripts/stage6_signalr_smoke.mjs
```

The script refuses to run without the explicit `bizconnect_test` guard. It checks hub authorization, message receipt and persistence, outbox-driven `NotificationReceived`, notification inbox persistence/unread count, and recipient isolation. The Stage 7 implementation report records the verification actually completed for this source package.

## Boundaries

Stage 7 does not add payments, AI, Stage 8 functionality, email/SMS delivery, web push, notification grouping/digests, per-event user controls beyond the categories above, or mobile OS delivery guarantees. No production or development migration was run. Expo push provider delivery from a physical device requires separate deployment credentials and device-level validation.
