# Mabiz API Integration Contract

**Status:** Stages 2–6 are implemented in the existing C# ASP.NET Core/PostgreSQL backend. Stage 6 adds private direct conversations, catalogue-linked business enquiries, server-side messaging permissions, REST history/send/read routes and authenticated SignalR. See [`docs/STAGE6_MESSAGING.md`](docs/STAGE6_MESSAGING.md), plus [`docs/STAGE2_BACKEND.md`](docs/STAGE2_BACKEND.md), [`docs/STAGE3_BUSINESSES.md`](docs/STAGE3_BUSINESSES.md), [`docs/STAGE4_SOCIAL.md`](docs/STAGE4_SOCIAL.md) and [`docs/STAGE5_CATALOG_MEDIA.md`](docs/STAGE5_CATALOG_MEDIA.md) for setup and exact contracts. Later domains remain proposals/local demos unless explicitly marked implemented below.

## Current runtime and demo boundary

The app defaults to `mock-local`. `app.config.ts` and `lib/api/config.ts` read public, non-secret endpoint settings; `EXPO_PUBLIC_API_MODE=api` explicitly selects API adapters, while the default and any unrecognized mode selects local mock services. Native auth/account screens use Stage 2 APIs; business profile/team flows use Stage 3 APIs; feed, posts, personal/business profiles, follows, comments, polls and moderation screens use Stage 4 APIs; catalogue/media screens use Stage 5 APIs; and inbox, chat and enquiry screens use Stage 6 REST/SignalR APIs. Browser cookie/CSRF handling is implemented server-side but browser login/registration is not wired to it. Setting API mode without a non-empty base URL returns `API_NOT_CONFIGURED`; an API failure is never replaced with a mock success.

`MabizServicesProvider` is registered at the Expo root and supplies a mode-specific typed service registry. Stage 2 auth/account, Stage 3 business/team, Stage 4 social, Stage 5 catalogue/media and Stage 6 messaging/enquiry screens are connected to the C# API. Other product screens continue to use `hooks/use-app-store.tsx` for interactive local-demo state unless documented as connected; changing API mode does not make unrelated domains server-backed.

Stage 5 implements catalogue image uploads and configurable local/S3-compatible storage. Stage 6 implements text messaging over REST and authenticated SignalR; push delivery, payment processing, reports and verification are not connected. Stage 4 post media references still require hosted HTTPS URLs. No success message should imply an unimplemented domain was remotely delivered, verified or reviewed.

## Current frontend seams

- `types/domain.ts` contains client-side domain models. `lib/api/contracts.ts` defines `Result<T>`, `ApiError`, `PageRequest` and `PageResponse<T>`.
- `lib/api/config.ts` centralizes the explicit mode, base URL, timeout, API version prefix, development HTTP policy and optional auth refresh path. Only public endpoint settings may enter Expo configuration; never put credentials or server secrets in an `EXPO_PUBLIC_` variable.
- `lib/api/http-client.ts` implements JSON GET, POST, PUT, PATCH and DELETE transport, JSON/raw/multipart-compatible bodies, query arrays, bearer access tokens, request IDs, timeouts, AbortSignal cancellation, error-envelope handling and one retry after eligible 401 responses. Concurrent refresh attempts are single-flight. A blank API origin is an error, not an invitation to fall back to local data.
- `lib/api/secure-session.ts` stores API access/refresh session credentials with Expo SecureStore on native platforms and keeps browser credentials memory-only. It does not persist the local-demo password or convert the eight-hour demo marker into an API credential. A web cookie/CSRF session strategy is not implemented.
- `lib/api/feature-contracts.ts` defines 19 service domains: authentication, users/social graph, businesses, business memberships, feed, posts/interactions, catalogues, founder stories/ideas, ephemeral Social Stories/Highlights, business offers/events/community opportunities, milestones/analytics, messaging, search/history, notifications, verification, moderation, media uploads, data rights and preferences.
- `lib/api/production-services.ts` maps implemented Stage 2–6 routes to typed adapters and returns `source: "api"`. `lib/services/mock-services.ts` preserves in-memory local mode (`source: "mock-local"`); its state is separate from server state.
- `lib/services/service-provider.tsx` constructs the mode-specific registry and exposes `useMabizServices()` / `useMabizServiceMode()`. API-mode messaging screens and enquiry entry points use this provider; SignalR is isolated in `lib/api/messaging-realtime.ts` and REST remains authoritative.
- `hooks/use-app-store.tsx` remains the local demo store. In API mode, connected Stage 2–6 screens use their typed services; other product screens remain local or proposed.

## Configuration

| Variable | Meaning | Default / safety behavior |
| --- | --- | --- |
| `EXPO_PUBLIC_API_MODE` | Explicitly select `api` or `mock-local` | `mock-local`; unknown values resolve to `mock-local` |
| `EXPO_PUBLIC_API_BASE_URL` | Public API origin, without credentials | Empty; API requests fail with `API_NOT_CONFIGURED` |
| `EXPO_PUBLIC_API_VERSION_PREFIX` | Central path prefix | `/api/v1` |
| `EXPO_PUBLIC_API_TIMEOUT_MS` | Request timeout | 20,000 ms; accepted range 1,000–120,000 ms |
| `EXPO_PUBLIC_API_ALLOW_HTTP` | Allow HTTP for development only | HTTPS is required unless explicitly allowed or running a development build |
| `EXPO_PUBLIC_AUTH_REFRESH_PATH` | Optional override for the Stage 2 refresh route | `/auth/refresh` |

Do not embed bearer tokens, refresh tokens, signed upload URLs, database credentials, signing secrets or provider keys in Expo `extra`, public environment variables, commits or logs.

## Implemented and proposed API resource groups

Authentication, account and preferences paths follow [`docs/STAGE2_BACKEND.md`](docs/STAGE2_BACKEND.md); business/membership paths follow [`docs/STAGE3_BUSINESSES.md`](docs/STAGE3_BUSINESSES.md). Stage 4–6 routes marked implemented below are connected to the existing Expo API-mode screens. Remaining feature paths are proposals, not implemented routes.

| Domain | Resources and implementation status |
| --- | --- |
| Authentication | Implemented: `POST /auth/register`, `/auth/login`, `/auth/logout`, `/auth/refresh`, `/auth/verification-codes`, `/auth/verification-codes/verify`, `/auth/password-resets`, `/auth/password-resets/complete`; browser CSRF bootstrap: `GET /auth/csrf` |
| Users and social graph | Implemented Stage 2: `GET/PATCH /users/me`, `GET /users/{userId}`. Implemented Stage 4: `GET/POST/DELETE /users/{userId}/follow`, `GET /users/{userId}/followers`, `GET /users/{userId}/following`, `GET /users/me/followers`, `GET /users/me/following`. |
| Businesses | Implemented Stage 3: `POST/GET /businesses`, `GET/PATCH/DELETE /businesses/{businessId}`. Implemented Stage 4: `GET/POST/DELETE /businesses/{businessId}/follow`, `GET /businesses/{businessId}/followers`. |
| Business memberships | Implemented Stage 3: member list, invitation create/list/accept/decline/cancel, member role change/removal, leave, activity, current-user invitation/transfer lists, and ownership transfer request/accept/decline/cancel. Exact paths and role boundaries are in [`docs/STAGE3_BUSINESSES.md`](docs/STAGE3_BUSINESSES.md). |
| Feed | Implemented Stage 4: `GET /feed/for-you`, `GET /feed/following` with stable keyset cursors; no Nearby feed or recommendation ranking. |
| Posts | Implemented Stage 4: `POST /posts`, `GET /posts` (current user's posts), `GET/PATCH/DELETE /posts/{postId}`, `GET /users/{userId}/posts`, `GET /businesses/{businessId}/posts`. Business publishing uses Stage 3 Owner/Admin/Editor `PublishPosts` permissions; Viewers are denied. |
| Engagement and comments | Implemented Stage 4: `POST/DELETE /posts/{postId}/likes`, `GET /posts/{postId}/likes`, `POST/GET /posts/{postId}/comments`, `POST/GET /comments/{commentId}/replies`, `PATCH/DELETE /comments/{commentId}`. Post shares, saves and comment likes are not implemented. |
| Polls | Implemented Stage 4: `POST /posts/{postId}/polls`, `GET /polls/{pollId}`, `GET /polls/{pollId}/results`, `POST /polls/{pollId}/votes`. One vote per user; the server validates poll visibility, option membership and closing time and derives tallies. |
| Catalogue | Implemented Stage 5: `GET/POST /businesses/{businessId}/products|services` with `status`/`search`/`page`/`pageSize`, `GET/PATCH/DELETE` on the item (DELETE archives), `POST .../status` for draft/published/archived and `PUT .../media` to replace an ordered gallery of up to 12 images. Kind comes from the route. Anonymous public discovery is `GET /catalogue/products|services` plus `GET /catalogue/products|services/{slugOrId}`; only published items of active public businesses are visible. See `docs/STAGE5_CATALOG_MEDIA.md`. |
| Stories and opportunities | `GET /stories`, `/stories/{storyId}`, `/opportunities`, `/opportunities/{opportunityId}`, `POST/DELETE /stories/{storyId}/saves`, `/opportunities/{opportunityId}/saves` |
| Ephemeral Social Stories and Highlights | `GET/POST /social-stories`, `GET/DELETE /social-stories/{storyId}`, `GET /users/{userId}/story-highlights`, `POST /users/me/story-highlights`, `PATCH/DELETE /users/me/story-highlights/{highlightId}`; server enforces the 24-hour maximum expiry and audience/block policy |
| Business listings | `GET/POST /businesses/{businessId}/offers`, `PATCH/DELETE /businesses/{businessId}/offers/{offerId}`, `GET/POST /events`, `PATCH/DELETE /events/{eventId}`, `GET/POST /community-opportunities`, `PATCH/DELETE /community-opportunities/{opportunityId}` |
| Milestones and analytics | `GET/POST /businesses/{businessId}/milestones`, `PATCH/DELETE /businesses/{businessId}/milestones/{milestoneId}`, `GET /businesses/{businessId}/analytics` |
| Messaging and enquiries | Implemented Stage 6: `GET/POST /conversations`, `GET /conversations/{conversationId}`, `GET/POST /conversations/{conversationId}/messages`, `POST /conversations/{conversationId}/delivered`, `/read`, `/archive`, `/block`, and `DELETE /conversations/{conversationId}/block`. Direct starts use `participantId`; business enquiries use `businessId` plus optional published `catalogItemId`. Authenticated SignalR hub: `/hubs/messaging`; see `docs/STAGE6_MESSAGING.md` for events, membership checks and setup. |
| Search and history | `GET /search?q=...`, `GET/POST/DELETE /users/me/search-history`, `GET/POST/DELETE /users/me/recently-viewed` |
| Notifications | `GET /notifications`, `POST /notifications/{notificationId}/read`, `POST /notifications/read-all`, `GET/PATCH /users/me/notification-preferences` |
| Verification | `POST/GET /businesses/{businessId}/verification-requests`, `GET /businesses/{businessId}/verification-requests/{requestId}` |
| Moderation | Implemented Stage 4: `GET/POST/DELETE /moderation/blocks/{userId}`, `GET/POST/DELETE /moderation/hidden-posts/{postId}`. Reports remain proposed/unconnected. |
| Media uploads | Implemented Stage 5 for catalogue images: `POST /businesses/{businessId}/media` accepts `multipart/form-data` (field `file`, JPEG/PNG/WebP, size bounded by server config), `GET /media/{mediaId}` returns metadata, `GET /media/{mediaId}/content` streams bytes through the API after checking publication or membership, and `DELETE /media/{mediaId}` refuses 409 `MEDIA_IN_USE` while attached. The proposed ticket-based resumable contract below is still unimplemented. |
| Data rights | `POST /users/me/data-exports`, `GET /users/me/data-exports/{exportId}`, `POST /users/me/deletion-requests`, `GET/DELETE /users/me/deletion-requests/current` |
| Preferences and devices | Implemented: `GET/PATCH /users/me/preferences`, `GET/POST /users/me/devices`, `DELETE /users/me/devices/{deviceId}` |

Resource identifiers are URL-encoded by the adapter. Server authorization, validation, privacy, moderation and business ownership checks remain authoritative; client-side roles and filters are never security controls. Keep privileged review and moderation operations out of customer routes unless separately authorized.

The Social Story, poll and listing interfaces are typed mock/production adapter contracts; they are not connected to the Create UI's persisted local store. Poll voting must enforce one response per authenticated user (with multi-select only when enabled), reject expired polls and return authoritative tallies. Social Stories are ephemeral (at most 24 hours) and support public/follower/private audiences; Highlights retain eligible Story references after expiry only if the server's retention and ownership policy permits it. Offers, events and community opportunities need backend ownership, expiry, validation and moderation rules before any UI service migration.

## Request and response contracts

The TypeScript result is an explicit success/error union:

```ts
export type Result<T> =
  | { ok: true; data: T; source: "mock-local" | "api"; requestId: string }
  | { ok: false; error: ApiError; source: "mock-local" | "api"; requestId: string };

export interface ApiError {
  code: string;
  message: string;
  retryable: boolean;
  status?: number;
  requestId?: string;
  details?: Record<string, unknown>;
}
```

The implemented ASP.NET Core Stage 2/3 server returns ordinary successful DTO JSON (and empty 204 responses), not the optional `Result<T>` envelope below. The transport accepts both formats. The envelope remains a possible contract for future services only:

```json
{
  "ok": true,
  "data": { "items": [], "nextCursor": null, "total": 0 },
  "requestId": "server-trace-id"
}
```

A proposed validation error is:

```json
{
  "ok": false,
  "error": {
    "code": "validation_error",
    "message": "Check the highlighted fields.",
    "retryable": false,
    "details": { "phone": "Use a valid Kenyan phone number." }
  },
  "requestId": "server-trace-id"
}
```

The transport also accepts ordinary successful JSON payloads and empty 204/205 responses. It uses a response `X-Request-ID`/`Request-ID` header or envelope `requestId` when supplied, otherwise creates a client correlation ID. Malformed successful JSON, invalid configuration, network failure, timeout, cancellation, authentication expiry and HTTP errors return stable errors. Do not expose response stacks, signed URLs or provider diagnostics to UI.

## Pagination and feed behavior

Stage 3 business/member/invitation/activity lists and Stage 4 relationship lists use server-bounded `page`/`pageSize` offsets, returning items, total, page and pageSize. Stage 4 feed, user/business post, like and comment/reply lists use stable keyset cursors, ordered by descending creation time and ID where applicable; the feed's deterministic key is `(CreatedAtUtc, Id)`. Pull-to-refresh restarts at the first page. The Expo feed appends cursor pages and preserves explicit loading, empty, error and retry states. The local mock adapter bounds page size to 30. Avoid background polling when a screen is inactive.

## Authentication and account lifecycle

The default registration → demo OTP → profile setup flow remains client-only. The code `123456` is a demo value; no SMS is sent. Demo authentication and its eight-hour local marker are separate from `AuthService` access/refresh credentials. In explicit native API mode, registration/login use the Stage 2 backend and the account screen fetches/updates the remote profile. Stage 3 business/team and Stage 4 social screens separately fetch and mutate their server-backed resources through the API adapters; other product store state remains local demo data.

In API mode, native `AuthService.login` stores a successful session through `SecureSessionTokenProvider`; native access/refresh credentials use Expo SecureStore. Browser refresh-cookie and CSRF endpoints exist on the server, but the web client is not wired to them; browser credentials remain memory-only and are not supported for Stage 2 login. The HTTP client coalesces concurrent 401 refreshes, retries a request at most once, clears the stored API session when refresh fails and exposes a session-expired callback. See the backend document for provider and deployment limitations.

For production, validate Kenyan phone/email identity, enforce unique usernames, rate-limit registration/login/verification/reset requests, hash passwords using a reviewed identity implementation, and issue short-lived access tokens plus rotating, revocable refresh tokens. Never persist passwords or authorization codes in AsyncStorage, logs, Expo `extra`, public environment variables or source code.

## Media upload integration

The Stage 4 composer accepts only hosted HTTPS media references and metadata; it does not send local device files. Other product screens may select/preview device media and compress images locally. The `MediaUploadService` ticket contract (`begin`/`complete`/`resume`/`cancel`/`retry`) still describes an unimplemented backend and its adapters remain demo-only. Stage 5 adds real upload routes and configurable local or S3-compatible object storage for catalogue images; those use `POST /businesses/{businessId}/media` directly, and the stored bytes are never published as a raw storage URL.

On native platforms the transport uses Expo FileSystem's legacy foreground `createUploadTask` with byte progress and cancellation. On Web it uses `XMLHttpRequest` with upload progress and cancellation. Both accept server-provided headers/fields and reject non-HTTPS upload targets outside an explicitly allowed development connection. Error bodies and signed URLs are not exposed to the UI.

**This is not byte-resumable/chunked upload.** The current adapter can retrieve a ticket and retry the whole file; it does not maintain part offsets, checksums per chunk or resumable server state. A backend and object-storage multipart protocol must be agreed and implemented before claiming resume support. The mock media adapter returns a clear `LOCAL_ONLY` failure and never says a device URI was uploaded.

## Messaging and SignalR

In API mode, `/messages` inbox and detail screens use persistent Stage 6 REST routes, with SignalR for live notifications. The local mock chat remains separate and is still the default unless API mode is explicitly configured. Direct conversations and business enquiries share `MessagingService`; catalogue enquiries retain business/item context. Client message IDs are persisted as idempotency keys.

The backend owns authorization, conversation membership, persistence and delivery/read state. The authenticated hub `/hubs/messaging` emits `MessageReceived`, `MessageStatusChanged`, `ConversationRead` and `ConversationChanged`. The Expo client uses the stored bearer token, reconnects with backoff, rejoins the active conversation and resynchronizes through REST. Every join and send rechecks membership; business responses use the Stage 3 Owner/Admin/Editor permission matrix. The hub does not send push, SMS or email.

## Verification, moderation and data rights

Local verification requests never approve a business. Stage 4 block/unblock and hide/unhide actions create server records and are enforced by server visibility/interaction checks. Reports, verification, exports and deletion flows remain local or unimplemented and do not notify a review team. In API mode connected actions return backend results or API errors; they do not fabricate success for unimplemented domains.

## Follow-up integration sequence

1. Review proposed routes in this document before implementing later domains; they are not server-backed merely because a typed adapter exists.
2. Provide a non-production API origin, configure public mobile endpoint settings and test native secure sessions. The browser cookie/CSRF client flow remains unimplemented.
3. Consider approved push services only as a later stage, after privacy and notification-preference review. Stage 6 does not send push.
4. Run backend integration, accessibility, Android/iOS device and privacy/security tests before describing any capability as production-ready.

Stages 2–6 are implemented locally, and the connected native account, business/team, social, catalogue/media and messaging screens can use the backend in explicit API mode. Stage 4–6 migrations are included but have not been automatically applied to `Mabiz_dev`; this source tree and the stage-specific docs are not evidence of a deployed public API. Other seeded data and unrelated product actions remain illustrative, local or unimplemented.


## Stage 8 business growth integration

Stage 8 adds typed growth adapters for reviews, ratings, analytics, milestones, opportunities, and the unified business-growth dashboard. The backend routes are under `/api/v1/businesses/{businessId}` for business-scoped resources, with public opportunity discovery under `/api/v1/opportunities`. Review listings return server-side average and total counts; analytics accepts explicit `from` and `to` UTC timestamps and aggregates only recorded business events. The client converts its 7/30/90-day dashboard choices into those UTC bounds.

The backend rejects duplicate reviews and reviews from business owners or active team members. Business growth mutations use the existing role matrix rather than client-only checks. Milestones are explicitly self-reported and can be public or private. Opportunity enquiry is an entry point into the Stage 6 messaging experience and records an analytics event; it is not a transaction, investment, payment, escrow, or brokerage operation. Stage 7 notification preferences and in-app delivery remain the notification boundary for new business reviews.

The local provider implements the same typed surface with deterministic, clearly labelled device-only fixtures. It does not claim server analytics, verified purchases, independent milestone verification, public publication, or real notification delivery. See [`docs/STAGE8_BUSINESS_GROWTH.md`](docs/STAGE8_BUSINESS_GROWTH.md) for the complete route list, local setup commands, and known limitations.

## Desktop website client

The dedicated desktop website under `desktop/` is a browser-focused client rather than an Expo web export. It preserves the existing mobile app and uses the shared `/api/v1` REST surface for authentication, profile, business, notification, Stage 8 growth, opportunity, conversation, and message operations. `VITE_API_MODE=api` plus `VITE_API_BASE_URL` selects the API client; otherwise the desktop app clearly labels its isolated demo fixtures. Browser requests use `credentials: include` and do not persist refresh tokens in JavaScript. Configure the existing backend CORS and secure HttpOnly refresh-cookie/CSRF contract for the production website origin. Desktop SignalR live verification remains pending a provisioned authenticated backend environment; REST remains authoritative.
