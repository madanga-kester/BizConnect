# Mabiz Stage 2 Backend

**Scope:** this guide documents the preserved Stage 2 backend foundation, authentication and user/profile/preferences/device APIs. Stage 3 adds business profiles, teams, roles, invitations, ownership transfers, activity and Expo integration; see [`STAGE3_BUSINESSES.md`](STAGE3_BUSINESSES.md). The C# solution remains separate from the repository's managed Node starter scaffold and uses PostgreSQL, not the starter database.

## Architecture and projects

The backend uses the approved stack: C#, ASP.NET Core Web API, .NET 10, EF Core 10, PostgreSQL/Npgsql, ASP.NET Core Identity, JWT access tokens, rotating opaque refresh tokens, OpenAPI, and xUnit.

- `src/Mabiz.Api`: HTTP controllers, JWT/session validation, browser refresh-cookie/CSRF handling, CORS, rate limiting, health checks, OpenAPI and safe Problem Details.
- `src/Mabiz.Application`: contracts, validated options, service interfaces and API errors.
- `src/Mabiz.Domain`: account, profile, preference, device, session, refresh-token and verification/reset entities.
- `src/Mabiz.Infrastructure`: Identity, EF Core/Npgsql mappings, migrations, authentication/security services and profile persistence.
- `tests/Mabiz.UnitTests`: token utility tests.
- `tests/Mabiz.IntegrationTests`: API/database integration tests against isolated PostgreSQL.

## Implemented HTTP routes

The routes below include the `/api/v1` prefix. Successful API responses are ordinary JSON payloads (not the frontend's optional `Result<T>` envelope); errors use stable codes and Problem Details.

| Method and route | Purpose / access |
| --- | --- |
| `POST /api/v1/auth/register` | Anonymous account, profile and preference creation; returns the profile DTO. |
| `POST /api/v1/auth/login` | Anonymous login; returns profile, short-lived access JWT and refresh token for native clients. |
| `POST /api/v1/auth/refresh` | Rotates an opaque refresh token, revokes on reuse; accepts body token for native or HttpOnly cookie for browser. |
| `POST /api/v1/auth/logout` | Revokes the authenticated session and/or supplied refresh-token session, then clears browser cookies. |
| `GET /api/v1/auth/csrf` | Browser-only CSRF bootstrap; requires an allowed `Origin`, sets the readable CSRF cookie and returns the token. |
| `POST /api/v1/auth/verification-codes` | Requests an email/phone verification challenge where delivery is configured. |
| `POST /api/v1/auth/verification-codes/verify` | Verifies and consumes a challenge; attempts are bounded. |
| `POST /api/v1/auth/password-resets` | Requests a reset code; when a provider is configured, the accepted response does not confirm whether an account exists. |
| `POST /api/v1/auth/password-resets/complete` | Resets password, consumes the challenge and revokes all account sessions atomically. |
| `GET /api/v1/users/me` | Authenticated user's profile and private contact fields. |
| `PATCH /api/v1/users/me` | Authenticated user's profile update; contact changes require a separate verified-contact workflow and are rejected in Stage 2. |
| `GET /api/v1/users/{userId}` | Public profile; private profiles are concealed with `404` from other viewers, and contact fields are omitted. |
| `GET/PATCH /api/v1/users/me/preferences` | Authenticated user's app preferences. |
| `GET/POST /api/v1/users/me/devices` | List or register the authenticated user's device records. |
| `DELETE /api/v1/users/me/devices/{deviceId}` | Revoke one of the authenticated user's device records. |
| `GET /health/live` | Process liveness (no dependency check). |
| `GET /health/ready` | PostgreSQL readiness. |
| `GET /openapi/v1.json` | OpenAPI document. |

Stage 3 business/team routes and verified Expo integration are documented separately in [`STAGE3_BUSINESSES.md`](STAGE3_BUSINESSES.md); the Stage 2 routes above remain implemented and were regression-tested after the Stage 3 changes.

All user-specific profile, preference and device operations require a validated access JWT. Every authenticated request also verifies the session remains unrevoked/unexpired and the account remains active. The browser session flow is implemented in the backend but **not wired to the Expo Web client**; Stage 2 mobile API integration is native iOS/Android only.

### Verified success codes and semantics

Confirmed against a running API and PostgreSQL by `scripts/stage2_smoke.py`:

| Route | Success code | Notes on documented behavior |
| --- | --- | --- |
| `POST /auth/register` | `201` | Body is the profile DTO (no wrapper object). Duplicate contact/username -> `409` `EMAIL_TAKEN`/`PHONE_TAKEN`/`USERNAME_TAKEN` (`ACCOUNT_CONFLICT` on a race); sub-policy password -> `400`. |
| `POST /auth/login` | `200` | Accepts email, phone or username as `identifier`; bad credentials -> `401 INVALID_CREDENTIALS`. |
| `POST /auth/refresh` | `200` | Returns a new access JWT **and** a new refresh token; reuse of a consumed token -> `401 REFRESH_TOKEN_REUSE` and the session (including the pair just issued) is revoked. |
| `POST /auth/logout` | `204` | Revokes the session; later refresh and bearer calls on that session return `401`. |
| `GET /auth/csrf` | `200` | Requires an allowed `Origin`; server-side only in Stage 2. |
| `POST /auth/verification-codes` | `202` | Returns `challengeId`/`expiresAt`; the code itself is logged only in Development. |
| `POST /auth/verification-codes/verify` | `200` | Wrong code -> `422 INVALID_CODE`; consumed or expired challenge -> `422 CHALLENGE_EXPIRED`, so challenges cannot be replayed. |
| `POST /auth/password-resets` | `202` | `{"accepted": true}` for a known account and for an unknown identifier alike, so it does not confirm account existence. |
| `POST /auth/password-resets/complete` | `204` | Weak new password -> `400`; replayed token -> `422 INVALID_RESET_TOKEN`; completing revokes all prior sessions. |
| `GET`/`PATCH /users/me` | `200` | Owner sees contact fields; changing email/phone -> `422 CONTACT_VERIFICATION_REQUIRED`. |
| `GET /users/{userId}` | `200`/`404` | The owner can still read their own private profile (contact fields omitted); other viewers get `404 PROFILE_NOT_FOUND`. |
| `GET`/`PATCH /users/me/preferences` | `200` | Invalid theme -> `400`; each account gets seeded defaults. |
| `POST /users/me/devices` | `201` | Upsert keyed on `(userId, deviceIdentifier)`; a revoked identifier reuses the same row and becomes active again. |
| `GET /users/me/devices` | `200` | Lists active (non-revoked) devices only. |
| `DELETE /users/me/devices/{deviceId}` | `204` | Soft revocation, so repeating it stays `204`; an unknown or another user's device -> `404 DEVICE_NOT_FOUND`. |
| `GET /health/live`, `GET /health/ready`, `GET /openapi/v1.json` | `200` | Readiness performs a PostgreSQL check. |

## Persistence and migration

EF Core persists ASP.NET Identity users/password hashes plus user profiles, preferences, notification preferences, device registrations, sessions, hashed refresh tokens, email/phone verification challenges and password-reset challenges. Constraints and indexes protect unique usernames, identifiers and token lookup.

The initial PostgreSQL schema contains Identity tables `AspNetUsers`, `AspNetRoles`, `AspNetUserRoles`, `AspNetUserClaims`, `AspNetUserLogins`, `AspNetRoleClaims` and `AspNetUserTokens`, plus Mabiz tables `user_profiles`, `user_preferences`, `user_notification_preferences`, `user_sessions`, `refresh_tokens`, `email_verification_challenges`, `phone_verification_challenges`, `password_reset_requests` and `user_devices`, and EF's `__EFMigrationsHistory`. Profiles/preferences/notification preferences are one-to-one with a user. Sessions own refresh-token records; challenge/device rows are user-scoped. Normalized usernames, Identity email, non-null phone numbers, refresh-token hashes and per-user device identifiers have uniqueness constraints/indexes. Refresh-token values and verification/reset codes are not stored in plaintext.

Initial migration: `src/Mabiz.Infrastructure/Persistence/Migrations/20261112133346_InitialStage2.cs`. Stage 3 adds the additive `20261112163325_AddBusinessesTeamsAndOwnershipTransfers` migration. Both are applied to the local `Mabiz_dev` database in this development environment; see [`STAGE3_BUSINESSES.md`](STAGE3_BUSINESSES.md) for the pre/post data-count verification. Review and apply migrations deliberately in each environment; startup migration is off by default.

Design-time EF tooling reads `ConnectionStrings__Mabiz` or `Mabiz_CONNECTION_STRING`. Example command from the repository root:

```bash
export DOTNET_ROOT="$HOME/.dotnet"
export PATH="$HOME/.dotnet:$PATH"
export ConnectionStrings__Mabiz='Host=localhost;Port=5432;Database=Mabiz_dev;Username=Mabiz_dev;Password=REPLACE_ME'
"$HOME/.dotnet/tools/dotnet-ef" database update \
  --project src/Mabiz.Infrastructure \
  --startup-project src/Mabiz.Infrastructure
```

For deployed environments, prefer a controlled migration step in the release process over `Database__ApplyMigrationsOnStartup=true` unless the deployment's database migration policy explicitly permits startup migration.

## Configuration and local run

Copy `.env.backend.example` as a reference; do not commit actual values. Supply server-only environment variables through a secret manager or protected local environment. At minimum, configure:

- `ConnectionStrings__Mabiz`: PostgreSQL connection string.
- `Jwt__SigningKey`: random server-only key of at least 32 characters; never an Expo/public variable.
- `Auth__ChallengePepper`: separate random server-only secret of at least 32 characters.
- `Jwt__Issuer`, `Jwt__Audience`: deployment-specific token validation values.
- `Cors__AllowedOrigins__0` (and further indexed origins if needed): exact browser origins, no wildcard when credentials are enabled.
- `ASPNETCORE_ENVIRONMENT`: use `Development` only locally; it enables verification-code logging.

Defaults: access JWT 10 minutes (allowed range 2–60), refresh lifetime 30 days (1–90), verification/reset challenge expiry 10 minutes (3–30), and at most 5 failed challenge attempts (3–10). Startup validates required JWT/auth options and refuses blank or too-short signing key/pepper. Cookie defaults are Secure and `SameSite=Lax`; cross-site web deployments may require `SameSite=None` with Secure cookies and exact CORS origins.

```bash
export DOTNET_ROOT="$HOME/.dotnet"
# Supply the secret variables above before starting.
"${HOME}/.dotnet/dotnet" run --project src/Mabiz.Api
```

`src/Mabiz.Api/Properties/launchSettings.json` binds `http://localhost:5155` when the `http` launch profile is used. To pin a different local address, skip that profile:

```bash
"${HOME}/.dotnet/dotnet" run --project src/Mabiz.Api --no-launch-profile \
  --urls http://127.0.0.1:5080
```

Check it with `curl -i http://127.0.0.1:5080/health/live` (process up) and `curl -i http://127.0.0.1:5080/health/ready` (PostgreSQL reachable). `scripts/stage2_smoke.py` in this repository performs the full end-to-end check described in the Tests section.

Configure the mobile app only with public endpoint settings, never server secrets:

```dotenv
EXPO_PUBLIC_API_MODE=api
EXPO_PUBLIC_API_BASE_URL=https://your-nonproduction-api.example
EXPO_PUBLIC_API_VERSION_PREFIX=/api/v1
# EXPO_PUBLIC_AUTH_REFRESH_PATH defaults to /auth/refresh
```

For local HTTP development only, use the frontend's explicit development HTTP allowance; do not use cleartext API traffic in release builds.

## Deployment checklist (not deployed)

Before a real deployment, publish and run the API as a managed .NET process/container, terminate TLS at a trusted ingress, provide database/JWT/challenge secrets through the deployment secret manager, and configure only exact permitted browser origins. Apply the migration as a controlled release step, verify `/health/live` and `/health/ready`, and configure PostgreSQL backups, restore tests, logs/metrics, alerting, retention and secret rotation. Do not enable Development mode in production because the Development verification sender logs codes and destinations.

The current API rate limiter keys on `Connection.RemoteIpAddress`; forwarded-header and trusted-proxy configuration is not included. Before deploying behind a reverse proxy, configure ASP.NET Core forwarded headers for the trusted proxy addresses before rate limiting, or enforce equivalent per-client throttling at the ingress. Do not trust arbitrary forwarded-IP headers. No cloud host, production database, domain, TLS certificate, provider credentials or deployment pipeline is configured by this Stage 2 workspace.

## Security behavior and limits

- ASP.NET Core Identity hashes passwords. Login failures use account lockout; signup validates password length/format through DTO and Identity policies.
- Access tokens are JWTs. Refresh credentials are opaque, stored as keyed hashes, rotated on use and linked to sessions. Reuse of a consumed token revokes the session and outstanding refresh tokens. Logout and password reset revoke sessions; bearer authorization checks session state in PostgreSQL on each request.
- Registration/login/verification/reset endpoints share IP-based rate limiting (12 requests per minute outside the integration test host). Production deployments should additionally use trusted proxy/IP configuration and operational abuse monitoring.
- Private profiles are hidden from non-owners; public profile output omits private email/phone. Preferences and device records are scoped to the authenticated user. Contact edits are rejected until verified-contact changes are implemented.
- Browser refresh tokens are HttpOnly cookies scoped to `/api/v1/auth`; cookie requests require a same-value CSRF cookie/header pair. Mutating auth endpoints validate configured browser origins. Native clients use bearer access tokens and store credentials via Expo SecureStore; the browser client currently has no integrated cookie/CSRF session manager.
- Verification-code delivery is a Development-only logger that writes codes and destinations to logs. This is not a real delivery provider and must not be used in production. Outside Development, verification/reset requests return `VERIFICATION_DELIVERY_UNAVAILABLE` until an email/SMS provider is configured. No provider credentials were available for this implementation.
- Email/phone verification endpoints and password-reset challenge logic are implemented, but account activation is not currently gated on verified contact. Registration does not automatically send a challenge. The mobile API registration screen tells the user delivery is unavailable; verification and password-reset screens are not wired to the backend. API-mode password-reset link explicitly warns that it has not sent a request.
- No refresh-cookie browser tests on a real browser, native iOS/Android device builds, production deployment, real email/SMS provider, or external penetration test are claimed.

## Tests

Install the .NET 10 SDK and PostgreSQL, create a dedicated disposable test database/role, and set `Mabiz_TEST_DB` to that database's connection string before integration tests. The integration fixture **deletes and recreates the database supplied in `Mabiz_TEST_DB`**, then applies migrations. Never point it at `Mabiz_dev`, production, shared, or any database containing wanted data.

```bash
export DOTNET_ROOT="$HOME/.dotnet"
export Mabiz_TEST_DB='Host=localhost;Port=5432;Database=Mabiz_test;Username=Mabiz_test;Password=REPLACE_ME'
"$HOME/.dotnet/dotnet" test Mabiz.sln
```

From the repository root, `pnpm install --frozen-lockfile`, `pnpm check`, and `pnpm test` run the mobile dependency install, TypeScript check and frontend tests. The latest complete run after Stage 3 backend changes passed 36 .NET unit/PostgreSQL integration tests, and the frontend passed 90 tests across 14 files. Expo Web export is run with `pnpm exec expo export --platform web`; see the Stage 3 guide for the export result and live Stage 2/3 smoke coverage. These checks do not replace PostgreSQL integration tests.
### Live HTTP verification (`scripts/stage2_smoke.py`)

`scripts/stage2_smoke.py` exercises the running API against a **development** database (never the test database): health and OpenAPI, registration and duplicate/weak-password rejection, login by email and username, `GET`/`PATCH /users/me`, private-profile concealment, preferences, device upsert/revocation, refresh rotation and reuse detection, an email verification challenge (the code is read back from the Development log), password reset with session revocation and token replay rejection, logout, cross-account isolation, and the auth rate limiter.

```bash
# terminal 1: start the API as described above, sending logs to a file
export ASPNETCORE_ENVIRONMENT=Development
"${HOME}/.dotnet/dotnet" run --project src/Mabiz.Api --no-launch-profile \
  --urls http://127.0.0.1:5080 2>&1 | tee /tmp/bc2-api.log

# terminal 2: run the checks (about four minutes; it waits out the 1-minute rate-limit windows)
SMOKE_BASE=http://127.0.0.1:5080 SMOKE_LOG=/tmp/bc2-api.log python3 scripts/stage2_smoke.py
```

It exits non-zero if any check fails and prints `checks=N passed=N failed=0` on success. It creates throwaway accounts with random identifiers and only touches the database the API is connected to.

## Mobile integration boundary

With `EXPO_PUBLIC_API_MODE=api` and a configured API origin, native registration creates a remote account, native login stores API credentials in SecureStore, and the account screen reads/patches `/users/me` and revokes the session on logout. Stage 3 also wires business profiles, identity switching, the management dashboard, team membership/invitations, ownership transfers and activity to the same C# API. API errors are not silently replaced by demo successes, and API mode does not create a local demo session. Other product features remain local demo data or unimplemented. The API mode's web login/registration is intentionally blocked until the mobile web cookie/CSRF client flow is integrated.
