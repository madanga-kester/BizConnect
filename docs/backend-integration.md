# Backend integration status

**Current status:** Stage 2 backend foundation is implemented locally. The authoritative setup, schema, route, security, test and deployment notes are in [`STAGE2_BACKEND.md`](STAGE2_BACKEND.md). The backend is a separate C#/.NET 10 ASP.NET Core solution under `src/`, backed by PostgreSQL/Npgsql; the existing managed Node starter is not the Mabiz backend.

## Implemented in Stage 2

- ASP.NET Core Identity accounts and password hashes, JWT access tokens, rotating opaque refresh tokens, session tracking/revocation, logout and password-reset session revocation.
- Registration/login/logout/refresh, verification/password-reset API contracts, profile privacy and profile updates, user preferences, and device registration/revocation endpoints.
- EF Core 10 PostgreSQL persistence and an initial migration, OpenAPI, health checks, rate limiting, safe errors, and unit/PostgreSQL integration tests.
- Opt-in native iOS/Android mobile registration/login plus a backend account screen for profile read/update/logout. The default remains local demo mode.

## Not implemented by Stage 2

The rest of the product remains local or unimplemented: social graph, businesses, feed/posts, catalogue, opportunities, stories, moderation, live messaging/SignalR, media storage/uploads, push delivery, payment, and data-rights workflows. Preferences and device backend routes exist but have no dedicated mobile UI integration yet. Browser cookie/CSRF handling exists server-side but is not integrated into the Expo Web client.

Email/SMS delivery credentials are unavailable. Development logs verification codes; other environments return delivery unavailable until a real provider is configured. The account is not currently gated on contact verification. No production hosting, external database, TLS domain, real provider, or production deployment is configured.
