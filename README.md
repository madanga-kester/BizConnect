# BizConnect

BizConnect is a React Native + Expo mobile-first social business discovery and entrepreneurship frontend for Kenya. It helps people discover local businesses, explore products and services, learn from founders, and connect with entrepreneurs. The project targets Android and iOS and also supports Expo Web for preview.
The app is aligned to Expo SDK 58, Expo Router 58 and React Native 0.88.1 to match Expo Go SDK 58; the generated identifiers, app scheme, local-demo boundary, static Web output and fixed preview ports remain unchanged.

## Stages 2–6 backend and integration status

The repository includes a separate C# / ASP.NET Core Web API solution targeting .NET 10, EF Core 10 and PostgreSQL/Npgsql, with ASP.NET Core Identity, JWT access tokens, rotating opaque refresh tokens, OpenAPI, additive migrations and xUnit tests. Stage 3 adds business/team management and role permissions. Stage 4 adds server-backed social feeds, posts, likes, comments/replies, polls, user/business follows, and privacy/block/hide enforcement. Stage 6 adds private conversations, business enquiries, authenticated SignalR and inbox/chat screens; see [`docs/STAGE6_MESSAGING.md`](docs/STAGE6_MESSAGING.md) for contracts, setup and verification. Earlier stage references: [`docs/STAGE2_BACKEND.md`](docs/STAGE2_BACKEND.md), [`docs/STAGE3_BUSINESSES.md`](docs/STAGE3_BUSINESSES.md), and [`docs/STAGE4_SOCIAL.md`](docs/STAGE4_SOCIAL.md).

Expo keeps local-demo mode as its default and has an explicit API mode for implemented backend features. API mode connects auth/account, Stage 3 business/team flows, Stage 4 feed/post/profile/follow/engagement screens, Stage 5 products/services/catalogue management/image upload/storage, and Stage 6 conversation/enquiry screens through the shared service provider and REST/SignalR transport. Other product domains remain local or unimplemented; changing API mode does not imply those are server-backed. The browser auth client is not connected to the server's cookie/CSRF session flow. The Stage 4, 5 and 6 migrations are included; they have **not** been automatically applied to `bizconnect_dev` or production.

### Stage 5 verification (2026-11-12)
`dotnet build BizConnect.sln` succeeded (0 errors, the same 4 pre-existing warnings) and the full xUnit/PostgreSQL suite passed: **90 passed, 0 failed** - 62 unit and 28 integration, run against the isolated `bizconnect_test` database and up from the 50 Stage 4 tests. The additive migration `20261112182203_Stage5Catalog` creates `catalog_items`, `catalog_item_media` and `media_assets` and is applied from scratch by the test fixture; it has **not** been applied to `bizconnect_dev`. Frontend verification passed: `pnpm check`, **114 tests in 16 files** (previously 98 in 15) and `npx expo export --platform web`. A live API smoke run of 42 checks against `bizconnect_test` with startup migrations disabled covered the health and OpenAPI endpoints, anonymous catalogue discovery, 401 on unauthenticated catalogue and media management, a real multipart image upload served only through the access-controlled proxy, ordered gallery creation and reordering, publish/unpublish visibility, the media deletion guard, duplicate SKU and validation failures. See [`docs/STAGE5_CATALOG_MEDIA.md`](./docs/STAGE5_CATALOG_MEDIA.md).

### Stage 6 verification (2026-11-13)
Backend and frontend verification, plus live SignalR testing, are summarized in [`docs/STAGE6_IMPLEMENTATION_REPORT.md`](docs/STAGE6_IMPLEMENTATION_REPORT.md). The Stage 6 migration is additive and integration-test execution is restricted to `bizconnect_test`.

### Stage 4 verification (2026-11-12)

`dotnet build BizConnect.sln` succeeded and the full xUnit/PostgreSQL suite passed: **50 passed, 0 failed** (run against the isolated `bizconnect_test` database). Frontend verification passed: `pnpm check`, **98 tests in 15 files**, and `pnpm exec expo export --platform web`. A live API smoke check against the test database with startup migrations disabled returned 200 from `/health/ready` and `/openapi/v1.json`, and 401 for unauthenticated feed/posts requests. These checks do not mean the API is publicly deployed or that the Stage 4 migration was applied to development.

### Run locally (backend, then app)

These are the exact commands used to build and verify this workspace. The .NET API and the Expo app run as separate processes; nothing in Stage 2 requires the starter's port-3000 Node listener.

```bash
# 1. PostgreSQL: two distinct databases, one for development, one disposable one for tests
sudo -u postgres psql -c "CREATE ROLE bizconnect_dev LOGIN PASSWORD '...'; CREATE DATABASE bizconnect_dev OWNER bizconnect_dev;"
sudo -u postgres psql -c "CREATE ROLE bizconnect_test LOGIN PASSWORD '...'; CREATE DATABASE bizconnect_test OWNER bizconnect_test;"

# 2. .NET 10 SDK, then restore/build the solution
export DOTNET_ROOT="$HOME/.dotnet"; export PATH="$HOME/.dotnet:$HOME/.dotnet/tools:$PATH"
dotnet build BizConnect.sln

# 3. Apply the additive EF migrations to the development database only
export ConnectionStrings__BizConnect='Host=localhost;Port=5432;Database=bizconnect_dev;Username=bizconnect_dev;Password=...'
dotnet tool install --global dotnet-ef --version 10.0.0   # if the CLI is not installed
dotnet ef database update --project src/BizConnect.Infrastructure --startup-project src/BizConnect.Infrastructure

# 4. Start the API with server-only secrets (generate them; never commit them)
export ASPNETCORE_ENVIRONMENT=Development
export Jwt__Issuer=BizConnect.Api Jwt__Audience=BizConnect.Clients
export Jwt__SigningKey="$(openssl rand -hex 32)" Auth__ChallengePepper="$(openssl rand -hex 32)"
export Cors__AllowedOrigins__0=http://localhost:8081
dotnet run --project src/BizConnect.Api --urls http://localhost:5155
# → http://localhost:5155/health/ready and http://localhost:5155/openapi/v1.json

# 5. Tests (the integration fixture drops/recreates ONLY BIZCONNECT_TEST_DB; confirm it is bizconnect_test)
export BIZCONNECT_TEST_DB='Host=localhost;Port=5432;Database=bizconnect_test;Username=bizconnect_test;Password=...'
dotnet test BizConnect.sln
python3 scripts/stage2_smoke.py   # optional live API walkthrough; see docs/STAGE2_BACKEND.md

# 6. Mobile app against that API (native builds, not web preview)
pnpm install --frozen-lockfile
cp .env.example .env.development.local   # set the values below
EXPO_PUBLIC_API_MODE=api
EXPO_PUBLIC_API_BASE_URL=http://<LAN-IP>:5155
pnpm expo start          # or pnpm android / pnpm ios
```

`EXPO_PUBLIC_API_BASE_URL` must be reachable from the device, so a LAN IP or tunnel is required for Expo Go; `localhost` only works for a simulator on the same machine. Stage 2 auth, Stage 3 business/team screens, Stage 4 feed/post/engagement/follow screens, Stage 5 catalogue/media screens and Stage 6 inbox/chat/enquiry screens use the API in API mode. Stage 6 message transport uses authenticated SignalR with REST synchronization. Other domains remain local or unimplemented unless separately connected. Use `pnpm check`, `pnpm test` and `pnpm exec expo export --platform web` for frontend verification.

## Scope and local-demo boundary

The default mobile experience uses a persistent local demo store and seeded sample data. In API mode, Stage 2 registration/login/account-profile/logout, Stage 3 business/team/ownership flows, and Stage 4 feed, posts, likes, comments/replies, polls, user/business follows, follower lists and hide/block actions use the backend. Stage 5 products, services, catalogue management, ordered image galleries, real image upload and public catalogue discovery use the backend, which stores bytes on the configured local or S3-compatible provider and serves them only through the API. Stage 6 messaging/enquiries use persistent conversations, REST and SignalR; notifications, reports, verification requests and saved items remain local or unavailable. A local success message means a change was stored on this device/browser, not published, delivered, verified or reviewed by a service. The API does not send real SMS/email in this setup; there is no push delivery, checkout, cart, wallet or payment processing; device-media upload and object storage exist only for Stage 5 catalogue galleries; business logos and covers are still plain URL fields. Stage 6 text messages are persisted, but message attachments and push notifications are not implemented.

At startup, an accessible static feed skeleton appears only while the local AsyncStorage store is hydrating. Local search and filtering do not simulate remote loading; empty collections and zero-result searches instead provide contextual next steps.

Demo OTP `123456` is an explicitly labelled local verification step, not an SMS code. The authentication form creates only a local demo session after registration validation, OTP acceptance and profile setup; demo login does not call an identity provider. The session marker expires after eight hours. Native session markers use Expo SecureStore; Web uses sessionStorage. Passwords are not persisted. Local state may persist on the current device/browser and is not shared with other users.

Business, founder, story, product, service, opportunity, notification and analytics fixtures are illustrative sample data. Startup costs are estimates, and story sources are labelled. A business is not verified from a local request; the badge shown on fixtures reflects only their seeded sample status. The app does not provide legal, financial or business verification advice.

The fixed managed starter still includes a port-3000 Node API listener and its own starter database/authentication libraries; that scaffold is not the BizConnect Stage 2 backend and product screens do not use it. The Stage 2 service is the separate C# solution under `src/` and uses PostgreSQL. `pnpm dev` starts the template listeners for the managed Mobile Preview; this does not make product actions server-backed. `pnpm db:push` is not required for the local demo or the .NET backend.

## Requirements and installation

Use Node.js supported by the installed Expo SDK and pnpm `9.12.0` (declared in `package.json`). Dependencies are pinned by `pnpm-lock.yaml`.

```bash
pnpm install --frozen-lockfile
```

No environment variables are required for the local demo or Expo Go. A standalone Android release map additionally needs a Google Maps Android SDK key restricted to the final app ID and signing certificate; the optional build-time variable is `GOOGLE_MAPS_API_KEY`, and it is not committed or configured here. `.env.example` is only a reference for future browser-safe configuration; never place API secrets, signing keys, database credentials or Expo credentials in an `EXPO_PUBLIC_` variable or source file.

## Run in the managed environment

```bash
pnpm dev
```

The fixed listeners are Metro/Expo Web on port `8081` and the starter API on port `3000`. Do not change these Mobile ports. The platform supplies the current Preview and device addresses; do not hardcode them in source.

To prepare an Expo Go QR preview, use the project Dashboard’s **Connect Expo** flow. The platform synchronizes `EXPO_TOKEN` into the private runtime environment; do not copy the token into chat, logs, code or a committed file. Expo Go on the phone must be signed into the same Expo account used for the project connection. Web Preview and Expo Go are distinct surfaces; a working Web Preview does not by itself prove a phone connected.

The local scripts can also start listeners separately:

```bash
pnpm dev:metro   # Expo/Metro/Web Preview on 8081
pnpm dev:server  # starter API on 3000
```

## Available checks and build commands

```bash
pnpm check
pnpm lint
pnpm test -- --reporter=dot
pnpm e2e:journeys
pnpm exec expo install --check
pnpm dlx expo-doctor@latest
pnpm exec expo export --platform web
pnpm exec expo export --platform android
pnpm exec expo export --platform ios
```

`pnpm build` bundles the starter Node API; it is not an Expo mobile build. `pnpm android` and `pnpm ios` start Expo against a local Android/iOS target where that toolchain is available. For release artifacts, use the project Dashboard’s native build flow. Android/iOS builds and device-only permissions, media playback, notifications and SecureStore behavior must not be claimed as verified unless they were actually checked on a device/build.

## Implemented journeys

- Browse the home feed, discovery, founder stories, business profiles, products and services without signing in.
- See a screen-reader-labelled feed skeleton during real local-store hydration and helpful empty states across feeds, discovery, stories, search, conversations, notifications, saved content and business catalogues.
- Register through local validation → the labelled demo OTP → profile setup; sign in, log out, expire and clear local sessions.
- Follow businesses and founders; like, comment, reply, save, hide and report content; block/unblock people and enforce shared visibility rules.
- Search businesses, products, services, people, stories, posts and videos, with combined local filters and recent-search history.
- Switch Discover between list and a native interactive map with selectable approximate public-area markers and a business-preview action. Browsers use a clear, accessible list fallback. Markers are OpenStreetMap neighbourhood/district/city centroids, never exact storefront coordinates; businesses without matched public-area data remain unpinned and visible in the list.
- Create/edit a six-step business profile, resume a local draft, switch between personal and managed business identities, edit catalogues, manage milestones, verification screens, team screens and sample analytics.
- Create text, image, video, product, announcement and story posts; select and preview local media; keep drafts and published demo posts on-device.
- Explore mock conversations and notifications. Local messages are not delivered; notification preferences and read states are not push-synced.
- Browse Kenyan county/town/neighbourhood fixtures, KSh prices, Kenyan phone formatting, and English/Kiswahili resources.
- Choose Light or Dark appearance from Settings while signed in or browsing as a guest; Light remains the default, the local preference survives restarts, legacy saved settings default to Light, and the phone's system appearance is not changed.

## Architecture

- `app/`: Expo Router tabs and nested auth, discovery, business/person/post/story/product, messaging, management, privacy and moderation routes.
- `components/`: reusable BizConnect cards, forms, navigation, accessible loading skeletons and contextual empty-state primitives.
- `hooks/use-app-store.tsx`: persistent local app state, local-session handling and authorization/privacy-aware mutation boundaries.
- `data/seed.ts`: Kenya-focused business, founder, catalogue, post, story, opportunity and notification fixtures.
- `data/business-map-locations.ts`, `components/discovery/business-map*` and `utils/business-map.ts`: source-attributed approximate-area map points, native map UI, web fallback and coordinate validation.
- [`docs/MOBILE_MAP.md`](./docs/MOBILE_MAP.md): map compatibility, attribution, privacy boundaries, missing Android release-key requirement and device verification limits.
- `types/domain.ts`: strongly typed client-side domain models.
- `lib/api/`: centralized API configuration, typed response/error/page contracts, bearer auth/session handling, CRUD transport and Stage 2–7 adapters used by the Expo screens.
- `lib/services/mock-services.ts`: deterministic local-only adapters for unconnected domains; `mockApi.ts` remains a compatibility facade. Connected Stage 4 screens use the API services in API mode and surface request errors instead of silently treating them as mock success.
- `lib/services/service-provider.tsx`: central mode-aware registry, defaulting to local mock and selecting production adapters only when API mode is explicitly configured.
- `e2e/six-journeys.spec.ts`: six mobile-viewport Playwright journeys for discovery, registration, post publishing, business creation, messaging and persisted dark navigation; these exercise Expo Web, not a physical phone.
- `utils/`: privacy/moderation policy, role permissions, discovery filters, validation, media error feedback and Kenyan locale helpers.
- `i18n/`, `theme/`, and `lib/theme-provider.tsx`: centralized English/Kiswahili strings, app-scoped Light/Dark palettes and reusable design tokens.
- `assets/images/`: native launcher, adaptive, monochrome, splash and web-icon assets.
- [`API_INTEGRATION.md`](./API_INTEGRATION.md): typed service contracts and mobile API configuration; [`docs/STAGE2_BACKEND.md`](./docs/STAGE2_BACKEND.md), [`docs/STAGE3_BUSINESSES.md`](./docs/STAGE3_BUSINESSES.md), [`docs/STAGE4_SOCIAL.md`](./docs/STAGE4_SOCIAL.md), [`docs/STAGE5_CATALOG_MEDIA.md`](./docs/STAGE5_CATALOG_MEDIA.md), [`docs/STAGE6_MESSAGING.md`](./docs/STAGE6_MESSAGING.md) and [`docs/STAGE7_NOTIFICATIONS.md`](./docs/STAGE7_NOTIFICATIONS.md) document server capabilities.

## Privacy and permissions

Stage 4 post/profile privacy, blocks, hidden posts, and social interactions are enforced by the C# API as documented in [`docs/STAGE4_SOCIAL.md`](./docs/STAGE4_SOCIAL.md). Stage 6 conversation membership, business reply permissions, per-thread blocking, and read/delivery state are enforced by the messaging API. Reduced-data mode and autoplay remain local. Shared client policies also filter local-demo content, but they are not a substitute for backend authorization.

Camera, photos/videos and approximate foreground location are requested only when a corresponding feature is used. The map itself shows public area-level business pins and does not require or show the viewer’s location. The “Near me” action requests foreground location only after the user taps it; county/town browsing remains available if permission is denied. Selected media remains local unless uploaded through the Stage 5 catalogue image workflow; resumable transfer is not implemented. Precise personal coordinates are not shown on a profile. Local account deletion resets the device/browser demo state only; it does not delete a remote account.

The native map uses the Expo SDK 58-aligned `react-native-maps` package and is intended to be exercised in Expo Go. The browser build intentionally shows a list fallback. A standalone Android build can compile without a key, but Google Maps tiles are not release-ready until the owner supplies a correctly restricted key after permanent app identifiers and signing credentials are established. The current generated Manus identifiers remain unchanged. See [`docs/MOBILE_MAP.md`](./docs/MOBILE_MAP.md) before native release work.

## API mode, Stage 7 delivery and remaining work

The API mode remains `mock-local` by default. Auth/account, Stage 3 business/team, Stage 4 social, Stage 5 catalogue/media, Stage 6 messaging/enquiry and Stage 7 notifications can use the C# API when its non-secret origin is explicitly configured. Do not enable API mode without a reachable API and appropriate non-production setup; the mode switch does not connect unrelated domains. Stage 7 provides persistent in-app notifications, authenticated SignalR delivery, category preferences and optional Expo Push Service integration. Push remains disabled until separately configured, and device-level push delivery has not been validated on physical hardware. Reports/verification, checkout, payments, wallets and AI remain outside Stage 7. Stage 5 does not include media transcoding, metadata stripping or a CDN; Stage 6 does not include message attachments. Do not treat local demo actions or seeded fixtures as production data. Stage 2–7 migrations are additive and have not been applied to `bizconnect_dev` or production. See [`STAGE7_IMPLEMENTATION_REPORT.md`](./STAGE7_IMPLEMENTATION_REPORT.md) for actual verification outcomes.


## Stage 8 — Business Growth

Stage 8 adds a business growth system on top of the existing Stage 2–7 architecture. The C# API now persists business reviews and ratings, self-reported milestones, business opportunities, and privacy-conscious analytics events through additive EF Core migration source. It exposes business-scoped growth routes under `/api/v1`, applies the existing Owner/Admin/Editor/Viewer authorization model, prevents owners and team members from reviewing their own businesses, prevents duplicate reviews, supports owner responses and moderation reporting, and records opportunity enquiry activity without implementing transactions or payments.

The Expo app adds a unified `Business Growth` dashboard reachable from business management and profile business selection. It keeps API mode separate from the deterministic local demo provider, supports selected-business isolation, date-range analytics, reviews, milestones, opportunities, activity, loading/empty/error/retry states, and explicit disclosure when local values are illustrative. See [`docs/STAGE8_BUSINESS_GROWTH.md`](docs/STAGE8_BUSINESS_GROWTH.md) and [`STAGE8_IMPLEMENTATION_REPORT.md`](STAGE8_IMPLEMENTATION_REPORT.md) for routes, setup, verification status, and limitations. The Stage 8 migration has not been applied to `bizconnect_dev` or production.

## Dedicated desktop website

The repository now includes a separate desktop-first React/Vite client under `desktop/`. It preserves the Expo mobile application and uses the same shared .NET `/api/v1` backend when `VITE_API_MODE=api` and `VITE_API_BASE_URL` are configured. In default demo mode, the desktop UI uses clearly labelled local illustrative fixtures. Run `pnpm desktop:dev` for local development and `pnpm desktop:build` for the production bundle. See [`desktop/README.md`](desktop/README.md) and [`DESKTOP_WEBSITE_IMPLEMENTATION_REPORT.md`](DESKTOP_WEBSITE_IMPLEMENTATION_REPORT.md).

## Desktop completion pass

The desktop website preserves the supplied Design 3 page compositions and now includes route-aware authentication, CSRF/refresh-cookie API handling, validated demo interactions, search/filter controls, business create/edit/switch flows, follow/unfollow, catalogue and opportunity dialogs, post composer actions, messaging read/send/archive actions, notification read-all/read/dismiss controls, analytics range refresh, settings validation and logout. Demo mode is deterministic and visibly labelled; API mode calls the existing `/api/v1` contracts and reports endpoint errors instead of fabricating success.

The acceptance artifacts are [`docs/VISUAL_COMPARISON_REPORT.md`](docs/VISUAL_COMPARISON_REPORT.md), [`docs/FUNCTIONALITY_CHECKLIST.md`](docs/FUNCTIONALITY_CHECKLIST.md), and [`DESKTOP_WEBSITE_IMPLEMENTATION_REPORT.md`](DESKTOP_WEBSITE_IMPLEMENTATION_REPORT.md). Run `pnpm check`, `pnpm desktop:build`, and `pnpm test`. The sandbox does not provide a live .NET 10/PostgreSQL/API session, so CORS, secure cookie behavior, live database payload mapping, and SignalR cannot be claimed as verified here. Mobile and backend source files remain intact.
