# Mabiz — Phase 3.15 Final Engineering Handoff

- **Handoff date:** 12 November 2026
- **Application:** Expo SDK 58 (`~58.0.23`) / React Native / TypeScript / Expo Router
- **Phase status:** Create-system frontend completion is implemented and verified in the local demo.
- **Current status note (added after Stage 2):** The Stage 2 ASP.NET Core/PostgreSQL backend is now implemented; see [`docs/STAGE2_BACKEND.md`](docs/STAGE2_BACKEND.md). This handoff records earlier Phase 3 frontend work. Its product screens remain local/demo; Stage 3 product APIs, publishing, messaging and media are not implemented.
- **Data boundary at Phase 3 handoff:** The screens described below use local state/persistence and deterministic mocks; this handoff does not claim that their content is published to a server.

## Phase 3.15 delivered

The Create hub is now a unified content studio for personal and managed-business identities. Its local workflows cover posts and polls, 24-hour Social Stories, products and services, offers, events, community opportunities and business milestones. Creation flows expose previews, validation, draft behavior and explicit on-device review/save confirmations where applicable. Local scheduling remains a saved schedule, not a background publishing service.

Draft and navigation safety now includes composer snapshots, automatic local saving and restoration, reusable unsaved-change guards, and explicit discard/save confirmations. A delayed-autosave race found during E2E was fixed: publication cancels its outstanding debounce, invalidates stale callbacks and suppresses autosave for the cleared post-publication snapshot while allowing a later edit to save normally.

`My Content` provides a single searchable, filterable and sortable local manager across posts, Stories, drafts, scheduled posts, products, services, offers, events, opportunities, milestones and Highlights. It supports the applicable edit, duplicate, archive/restore and delete actions with clear local status and confirmation states. Media records retain their image/video kind for real local previews, and catalogue sorting no longer uses fabricated 1970 dates. Event lifecycle states are labelled explicitly.

The writing assistant is a deterministic mock: users can generate a local example, edit it, revisit local history and insert the result into the composer. The video editor is a local editing demonstration that previews/persists edit metadata; it does not encode or transcode the source video and does not upload media. No external AI or video-processing service was integrated.

Story curation is owner-scoped. The Story viewer includes local insights; Highlights support local rename, cover, reorder and membership management. Removing a Story from a Highlight—whether from its included card or the Story-library list—requires an explicit confirmation and unlinks it without deleting the Story. The My Content, catalogue and milestone screens retain local media previews. Business milestone create/delete updates the same business state used by the profile timeline.

The existing typed API foundation remains available as a future integration boundary. It is not invoked by these local demo flows: selecting API mode alone does not migrate screens from `hooks/use-app-store.tsx` to the production adapters.

## Verification evidence

All checks below were run after the final UI safety change:

- `pnpm check` — TypeScript completed with no errors; host-managed TypeScript diagnostics are registered.
- `pnpm test -- --reporter=dot` — 14 test files and 89 tests passed.
- `pnpm lint` — passed. Expo emitted a non-blocking Node `MODULE_TYPELESS_PACKAGE_JSON` warning for the existing ESLint configuration.
- `pnpm e2e:journeys` — the expanded Playwright journey passed (1/1). It covers guest discovery, local onboarding/demo OTP, local post preview/publish and My Content edit/delete without a delayed duplicate draft, poll voting, assistant insertion, Story publication and Highlight unlink/re-add (including both confirmation entry points), the six-step business profile flow, milestone creation/deletion as reflected on the business profile, product/service/offer/event/opportunity saves, a local enquiry message and persisted dark appearance with a black bottom navigation.
- `pnpm exec expo export --platform android` — passed; metadata and 53 export files were produced, including a 6.2 MB Hermes JavaScript bundle.
- `pnpm exec expo export --platform ios` — passed; metadata and 49 export files were produced, including a 6.1 MB Hermes JavaScript bundle.
- Expo Metro `/status` returned HTTP 200, the Expo Web root returned HTTP 200 after bundling, and the starter API listener remained available on port 3000. Expo Go configuration keeps the project’s fixed ports.

These are JavaScript/Hermes platform exports—not Android APK/AAB or iOS IPA/TestFlight release builds. No new physical-device smoke test or native release build was performed in this audit.

## Remaining boundaries and open work

The Create experience remains local-only: there is no live user authentication provider, PostgreSQL persistence, server-side publishing/scheduling, object storage, production messaging/SignalR, delivered notifications, moderation review service or payment processor. The AI assistant uses deterministic examples, and the video editor only demonstrates local edit metadata. Native permissions/media behavior and release binaries still require Expo Go/device and Dashboard-build verification.

The broader Phase 3 acceptance scope outside this Create-focused phase is not marked complete here. Remaining work includes migrating screens from the local store to feature hooks domain by domain, expanding integration/E2E coverage across the broader authentication, team/role, social, discovery/map, privacy and moderation requirements, and profiling representative Android devices. Do not test writes against a shared production database.

## Phase 4 starting sequence

1. Review and version the API and SignalR contracts; provide an isolated non-production ASP.NET Core/PostgreSQL environment.
2. Implement server-side authorization, validation, persistence, secure credential flows and the reviewed media-ticket/object-storage protocol.
3. Connect one screen domain at a time to `useMabizServices()`, retaining the mock adapter as the explicit demo/offline mode and preserving loading, empty, offline and error states.
4. Add backend integration tests and broaden E2E coverage; verify privacy, team roles, accessibility and Android/iOS device behavior against staging.
5. Keep production-only secrets out of public Expo variables. Supply any Android Maps key only through the private build environment, restrict it to the application identifier/signing certificate, and keep map functionality clearly unavailable or usable without a valid key.

## Project references

- [API integration contract](API_INTEGRATION.md)
- [Future backend integration boundary](docs/backend-integration.md)
- [Project setup and architecture](README.md)
- [Remaining Phase 3 acceptance checklist](TODO.md)
