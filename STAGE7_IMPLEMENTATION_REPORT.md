# BizConnect Stage 7 — Implementation report

**Status: implemented and verified in the existing Stage 6 working source.** Stage 7 adds notifications to the established Expo/React Native and .NET 10 / EF Core 10 / PostgreSQL application; it does not replace the existing architecture. The local mock/demo mode remains separate and functional. Payments, AI and Stage 8 work were not added.

## Delivered

- Added persisted recipient-scoped inbox records and a durable notification-delivery outbox, idempotency protection, read/dismiss/unread APIs, category preferences and secure push-device registration.
- Added notification creation at message/enquiry, like, comment/reply, follow, business-team/ownership, and business/catalogue update events.
- Added the authenticated SignalR `NotificationReceived` event through the existing messaging hub, with per-user groups derived from the authenticated subject and a background outbox worker.
- Added Expo Push Service delivery with disabled/unconfigured handling, bounded retry behavior and invalid-token clearing. Raw push tokens are Data-Protection protected at rest and never returned from device APIs.
- Added an Expo notification centre with API-backed paging/read/dismiss, account-level notification settings, native permission/token registration, push-tap deep links, and a Notifications tab unread badge. API mode and seeded local mock mode remain separate.
- Added additive migration `20261113035329_Stage7Notifications`, API integration tests, an Expo provider unconfigured-state unit test, frontend adapter/mock tests, and an expanded live SignalR notification smoke script.
- Added [Stage 7 technical documentation](docs/STAGE7_NOTIFICATIONS.md) and a repeatable source packager at `scripts/package_stage7_source.py`.

## Verification performed

The final source archive was extracted into a clean directory and verified independently as well as in the working tree. The backend test run reports four existing xUnit2031 analyzer warnings in `Stage3BusinessApiTests.cs`; no build or test failures resulted.

| Check | Result |
| --- | --- |
| `dotnet build BizConnect.sln --no-restore` | Passed. |
| `dotnet test BizConnect.sln` | Passed: 69 unit tests and 35 integration tests; 104 total, 0 failed, 0 skipped. Integration setup was restricted to `bizconnect_test`. |
| EF migration application | Passed as part of the integration fixture against `bizconnect_test`; no migration was applied to `bizconnect_dev` or production. |
| `pnpm install --frozen-lockfile` | Passed; lockfile is up to date. |
| `pnpm check` | Passed. |
| `pnpm test` | Passed: 117 tests in 16 files. |
| `pnpm exec expo export --platform web` | Passed; the notification and settings routes were exported. |
| Live SignalR smoke (`scripts/stage6_signalr_smoke.mjs`) | Passed against a local API configured only for `bizconnect_test`: authenticated connections, authorization denial for outsider join, message broadcast/read/persistence, outbox `NotificationReceived`, persisted inbox row/unread count and recipient isolation. |
| Push provider safety test | Passed: an unconfigured Expo provider returns a suppressed result without an HTTP call. |
| Source ZIP integrity and required files | Verified by `scripts/package_stage7_source.py` and included as `bizconnect_stage7_source.zip`. |

The smoke created disposable accounts and records in `bizconnect_test` only. The temporary local API process was stopped after the test. The Stage 7 migration's `Up` operations add new fields/tables/indexes; the rollback `Down` operations are not run against development or production databases.

## Boundaries and not claimed

A successful server-side Expo ticket was not requested from a real Expo account. Device permission/token registration and visible notification presentation were not exercised on physical iOS/Android hardware. Push remains disabled by default (`Push__Enabled=false`) and requires a configured EAS project ID in the app build plus Expo credentials in the backend runtime secret store. When unconfigured, push deliveries are suppressed while in-app notifications continue to work. Web push, email/SMS, delivery receipts beyond Expo ticket acceptance, payments, AI and Stage 8 functionality remain out of scope.

See [docs/STAGE7_NOTIFICATIONS.md](docs/STAGE7_NOTIFICATIONS.md) for endpoints, preference fields, configuration, data flow and verification commands.
