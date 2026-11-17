# Stage 6 — Messaging and business enquiries

Stage 6 adds private, persistent conversations and buyer-to-business enquiries to the existing Mabiz Expo + ASP.NET Core .NET 10 + EF Core 10 + PostgreSQL application. The local mock mode remains available and separate. In API mode, REST is the source of truth and SignalR is the live event transport.

## User flows

- Users can start direct one-to-one conversations from an authorized user profile, or start a business enquiry from a public business profile.
- An enquiry from a published product or service records both the active business and the published catalogue item. The thread keeps a title snapshot and continues to identify the item even if it is later unpublished. The chat header opens the linked business or catalogue detail.
- The inbox shows the latest message preview and timestamp, unread count, and linked catalogue context. The chat screen loads messages in stable chronological order with page navigation, marks messages delivered/read, supports archiving and block/unblock, and resynchronizes through REST after SignalR reconnect.
- Message attachments, push notifications, payments, checkout, wallets and AI are not part of Stage 6.

## API routes

All routes require a valid authenticated user unless noted.

| Method and route | Purpose |
| --- | --- |
| `GET /api/v1/conversations?page=1&pageSize=20` | Authorized inbox page; page size is capped at 50. Archived threads are excluded from that user's inbox. |
| `POST /api/v1/conversations` | Start or reopen a direct conversation or business enquiry. Supply exactly one `participantId` or `businessId`; optionally add `catalogItemId` and `firstMessage`. |
| `GET /api/v1/conversations/{id}` | Authorized thread summary for deep links, including archived threads. |
| `GET /api/v1/conversations/{id}/messages?page=1&pageSize=30` | Stable message history page; newest page is returned in chronological order. Fetching marks the participant as delivered. |
| `POST /api/v1/conversations/{id}/messages` | Persist a text message. Body requires a non-empty `clientMessageId` GUID and 1–5000 characters. Retries with the same client ID return the original message. |
| `POST /api/v1/conversations/{id}/delivered` | Record a delivered receipt. |
| `POST /api/v1/conversations/{id}/read` | Record read position and emit a read event. |
| `POST /api/v1/conversations/{id}/archive` | Hide the thread for this participant; new activity restores it to the inbox. |
| `POST /api/v1/conversations/{id}/block` | Block the thread for all participants. |
| `DELETE /api/v1/conversations/{id}/block` | Unblock only when the current user is the user who blocked the thread. |

Start requests use `participantId` for direct user threads; for enquiries, use `businessId` and an optional published `catalogItemId`. A private user can be messaged only by an existing follower; new follow requests to private profiles are not implemented by the Stage 4 follow API. Private businesses are available only to existing team members or business followers. Existing Stage 4 user blocks are respected. Unknown or unauthorized conversations return not-found responses rather than leaking membership.

## Authorization and schema

Business threads can be created by a buyer against an active business. A catalogue-linked thread requires the item to belong to the selected business and be published at creation. Owners, Admins and Editors have `RespondToEnquiries`; Viewers and non-members cannot view or reply. The rule is enforced by the existing `BusinessAccessControl` role matrix on every REST and hub operation.

The additive EF migration `20261113031519_Stage6MessagingEnquiries` adds `conversations`, `conversation_participants` and `conversation_messages`. Constraints enforce valid conversation shape, thread/block state, participant roles, message length and non-empty idempotency IDs. Unique indexes prevent duplicate direct pairs, duplicate business/item enquiry threads and duplicate client message retries; indexes cover participant inboxes, business inboxes and ordered message pages. No Stage 2–5 table is removed or rewritten.

## SignalR

The authenticated hub is `GET /hubs/messaging` (SignalR negotiates at `/hubs/messaging/negotiate`). Native and web clients use their stored bearer access token through `accessTokenFactory`; the API accepts `access_token` from the query string only for `/hubs/messaging`, because WebSocket clients may not send ordinary authorization headers. Other routes still require the Authorization header.

Hub methods are `JoinConversation(conversationId)`, `LeaveConversation(conversationId)` and `SendMessage(conversationId, clientMessageId, text)`. Joining checks thread membership and business role; sending invokes the same database-backed service and idempotency validation as REST. Events are `MessageReceived`, `ConversationRead`, `MessageStatusChanged` and `ConversationChanged`. The Expo client reconnects, rejoins its current conversation, refreshes history from REST, and falls back to REST send with the same client ID if a real-time acknowledgement is lost.

## Local configuration and verification

Use .NET 10, PostgreSQL, Node and the repository's pinned pnpm version. Keep local development and tests on separate databases. Never set the destructive integration fixture to `Mabiz_dev`.

```bash
# Backend restore/build
dotnet restore Mabiz.sln
dotnet build Mabiz.sln

# Apply migrations manually only to a database you intend to update.
export ConnectionStrings__Mabiz='Host=localhost;Port=5432;Database=Mabiz_dev;Username=Mabiz_dev;Password=...'
dotnet ef database update --project src/Mabiz.Infrastructure --startup-project src/Mabiz.Api

# Destructive integration tests: this fixture validates and drops/recreates only Mabiz_test.
export Mabiz_TEST_DB='Host=localhost;Port=5432;Database=Mabiz_test;Username=Mabiz_test;Password=...'
dotnet test Mabiz.sln

# Frontend checks
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm exec expo export --platform web

# Live SignalR smoke test (API server must use this same Mabiz_test database).
# Start the API with Jwt__SigningKey, Auth__ChallengePepper, and ConnectionStrings__Mabiz set.
export Mabiz_TEST_API_URL='http://127.0.0.1:5199'
node scripts/stage6_signalr_smoke.mjs
```

For Expo API mode, set `EXPO_PUBLIC_API_MODE=api` and `EXPO_PUBLIC_API_BASE_URL` to the API origin (no `/api/v1` suffix). The app defaults to `mock-local`. API mode does not convert local demo data into server data. The live smoke script refuses to run unless its explicit test-database variable names `Mabiz_test`.

## Boundaries and follow-up

Stage 6 does not send email, SMS or push notifications and does not claim external delivery. Message content is stored as submitted text; end-to-end encryption, abuse reporting, retention/erasure policy, attachment transfer, read-receipt privacy controls and push notifications are outside this stage and require separate product/security review. The migrations are included but are not automatically applied to `Mabiz_dev` or production.
