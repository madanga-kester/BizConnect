# BizConnect Phase 3 Handoff

> **Current status note:** This is a historical frontend handoff from an earlier phase. The Stage 2 ASP.NET Core/PostgreSQL backend and the Stage 3 business/team APIs are now implemented; see [`STAGE2_BACKEND.md`](STAGE2_BACKEND.md) and [`STAGE3_BUSINESSES.md`](STAGE3_BUSINESSES.md). This report's unrelated local-demo product features remain outside the API integration.

## Outcome

At the time of this Phase 3 handoff, the phase added a native geographic Discover map and improved video-feed performance in the existing Expo application. Those product screens remain a local demo; the proposed integration contract is in [`API_INTEGRATION.md`](../API_INTEGRATION.md).

## Improvements

Discover now switches between the existing filtered list and a native `react-native-maps` view. Selecting a source-backed area marker displays a business preview and opens the existing profile route. The map receives the already-visible businesses and defensively omits blocked owners. Its pins are OpenStreetMap neighbourhood, district or city area centres returned by Photon; they are explicitly approximate, not business-premises coordinates. There is no runtime geocoding and the map does not show the viewer's location. Businesses without a matched public feature—including Greenridge Growers in Kapsoya—and newly created businesses with no map-location record remain visible as not mapped. The Web build uses an accessible business list that clearly states the interactive map is native-only.

The video feed is virtualized with a small render window. Only the visible clip may autoplay, offscreen players pause, card height adapts to the viewport, player errors have retry feedback, and reduced-data mode suppresses autoplay.

App startup now shows a static, screen-reader-labelled feed skeleton only while the existing local AsyncStorage store is hydrating; it adds no artificial delay or pretend network request. The shared `ScreenSkeleton` also supports card, story-row and list-row shapes. Operation-specific spinners remain for pending form actions.

The shared `EmptyState` is now theme-aware, announces updates politely, and replaces blank or vague zero-result content across Home's feed filters, business discovery, founder stories, selected search categories and recent searches, the conversation list and first-message thread, notifications, saved businesses and ideas, business product/service tabs, and post comments. Filtered searches distinguish no matches from an empty collection and offer appropriate clear/browse actions. Existing auth and privacy gates remain intact; these states still describe local demo data only.

Settings now offers an accessible Light/Dark appearance selector in English and Kiswahili, including a guest-only appearance view that does not expose account controls. The choice is stored in the existing local settings, survives restart and sign-out, migrates missing/invalid appearance values to Light without discarding other settings, and resets to Light when local demo data is deleted. The app-scoped ThemeProvider refreshes NativeWind variables, shared and secondary route surfaces, forms, tab bar, status-bar foreground and the native map where supported; it does not change the phone's system-wide appearance or introduce backend calls. Unit tests cover migration, guest-only updates and the actual serialized local payload while signed out. They do not mount the provider through a real restart/sign-out/delete lifecycle; those store paths were reviewed in code.

The user-provided iPhone-shaped Preview screenshot showed the Dynamic Island overlapping the home header. The root can fall back to a 16 px inset before native metrics arrive; relying on that value did not leave enough room. `components/biz-ui.tsx` now applies the reported top inset directly and falls back to 59 px when that placeholder remains on native iOS or inside a narrow embedded phone Preview. The fallback does not affect desktop Web or Android. The shared `Page` is used by Home, Stories and Profile, and `tests/safe-area.test.ts` covers native, embedded, desktop, and Android inset cases. The existing tab bar continues to handle the bottom inset. TypeScript and all Expo JavaScript exports pass after this correction, but the final appearance still needs checking on the target physical iPhone.

`app.config.ts` supports an optional build-time `GOOGLE_MAPS_API_KEY` that enables the Android Maps config plugin. No key was configured or committed. The generated Android/iOS identifier and derived scheme were preserved rather than guessed.

## Changed files

| Area | Files | Purpose |
| --- | --- | --- |
| Discover map | `app/(tabs)/discover.tsx`, `components/biz-ui.tsx`, `components/discovery/business-map.tsx`, `components/discovery/business-map.web.tsx` | Native map/list switch and selection; accessible Web fallback. |
| Map data/policy | `data/business-map-locations.ts`, `utils/business-map.ts`, `tests/business-map.test.ts` | Attributed area points, coordinate validation, blocked-owner exclusion, viewport bounds and regression tests. |
| Video feed and layout | `app/videos.tsx`, `components/biz-ui.tsx`, `utils/video-playback.ts`, `utils/safe-area.ts`, `tests/video-playback.test.ts`, `tests/safe-area.test.ts` | Virtualized playback, active-item policy, reduced-data handling and safe-area regression tests. |
| Appearance | `app/settings.tsx`, `app/_layout.tsx`, `lib/theme-provider.tsx`, `theme/tokens.ts`, `theme.config.js`, `hooks/use-app-store.tsx`, `utils/theme-preference.ts`, `tests/theme-preference.test.ts` | Persisted app-scoped Light/Dark preference, backward-compatible migration, accessible guest selector, dynamic palettes and contrast-safe controls. |
| Loading and empty states | `components/biz-ui.tsx`, `app/_layout.tsx`, Home/Discover/Stories/Search/Messages/Notifications/Saved/business/post routes | True hydration-only skeletons plus theme-aware, contextual empty and no-match states. |
| Native configuration | `app.config.ts`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` | Optional Android Maps key/plugin and Expo SDK 58-aligned map dependency and package tree. |
| Handoff | `README.md`, `plan.md`, `TODO.md`, `docs/MOBILE_MAP.md`, `docs/PHASE3_HANDOFF.md` | Scope, attribution, progress, release constraints and this report. |

## Verification performed

| Check | Result |
| --- | --- |
| `pnpm check` | Passed under Expo SDK 58. |
| `pnpm lint` | Passed with no findings; Node emitted a non-failing `MODULE_TYPELESS_PACKAGE_JSON` advisory for `eslint.config.js`. |
| `pnpm test -- --reporter=dot` | Passed: 8 test files, 59 tests; Vitest emitted a non-failing Vite CJS API deprecation advisory. |
| `tests/theme-preference.test.ts` | Passed within the suite; covers Light defaults for older/invalid settings, preserving other settings, valid Dark values, signed-out serialization/rehydration, guest-only updates and dynamic palette refresh. |
| `pnpm exec expo install --check` | Passed; SDK-managed dependencies are up to date. |
| `pnpm dlx expo-doctor@latest` | Passed: 20/20 checks after repairing stale generated Metro copies. |
| `git diff --check` | Passed. |
| `pnpm exec expo config --type public --json` | Passed. Generated Android/iOS IDs and scheme remain unchanged; required plugins are present, static Web output remains enabled, and the optional Maps plugin remains omitted because no key is configured. |
| `pnpm exec expo export --platform web` | Passed under SDK 58. This is a Web export, not a native-device test. |
| `pnpm exec expo export --platform android` | Passed under SDK 58. This is a JavaScript bundle, not an APK/AAB. |
| `pnpm exec expo export --platform ios` | Passed under SDK 58. This is a JavaScript bundle, not an iOS archive/TestFlight artifact. |
| Web Preview interaction | Passed at a 390 × 844 viewport after hydration: opened Discover, switched to map mode, checked the web disclosure/list, and opened Kivuli Studio from a mapped row. Route reached `/business/b-kivuli`. This validates the browser fallback, not native map rendering. |
| Source cleanup review | Passed: no tracked `.expo` cache/device-state, generated Android/iOS project directories, bundles or APK/AAB/IPA artifacts. `.expo/` and `dist/` are ignored. |

Metro's `/status` endpoint and the live Web root return HTTP 200 on port 8081 after the SDK 58 restart and final theme changes. The starter API listener remains on port 3000, where `/` returns its expected placeholder 404; no BizConnect backend or database feature was exercised. Existing `server/`, Drizzle files and database dependencies were reviewed and retained as managed-starter infrastructure, separate from the future ASP.NET Core service.

## Not verified / release blockers

No Android or iOS physical device was attached to the agent. The user confirmed the Expo Go app opens on their phone, but the Dark theme and native-map appearance have not been visually verified there by the agent. Native marker rendering and gestures, camera/gallery permissions, actual image/video file selection, on-device playback, location-denial behavior, SecureStore, keyboard handling and device-size accessibility remain **not verified on hardware**. No native Android APK/AAB or iOS archive/TestFlight build was produced; native artifacts must be built through the Expo Dashboard workflow.

Standalone Android Google Maps tiles require an Android Maps SDK key restricted to the approved final application ID and signing-certificate fingerprint. It is intentionally unset. Permanent Android application ID, iOS bundle identifier and production deep-link scheme have not been supplied, so the current generated Manus identifiers remain unchanged. Exact business-premises coordinates are not available: current pins are clearly identified public-area estimates, and unlocated businesses have no pin. Selected media remains device-local; there is no server upload, retry/resume transfer, cross-user delivery or server synchronization.

## Backend boundary and next step

At the time this handoff was written, ASP.NET Core development and interactive API wiring were deferred. Stage 2 auth/account and Stage 3 business/team/ownership flows have since been connected to the C# API; social, messaging, reporting and moderation actions remain local-demo operations. The managed starter's server/Drizzle setup is still separate from the BizConnect backend.

Before release, the owner should supply and approve permanent Android/iOS IDs and the deep-link scheme. Then configure a restricted `GOOGLE_MAPS_API_KEY`, run the Expo Dashboard Android and iOS builds, and complete the outstanding permission, media, native-map and accessibility journeys on physical devices. Do not claim native or production readiness until those results exist.

## Expo SDK 58 upgrade and Preview refresh

The existing project was upgraded from Expo SDK 57 to SDK 58 to match the user's installed Expo Go SDK. The manifest and lockfile now include Expo `~58.0.23`, Expo Router `~58.0.30`, React Native `0.88.1`, SDK 58 Expo modules, and the matching `@expo/dom-webview` and `@react-native/metro-config` peers. Metro resolves to `0.87.1` throughout the SDK 58 package tree. A nullable/non-string tab-icon tint now falls back to the existing theme colors. The existing local-demo behavior, generated IDs/scheme, Web static output, and fixed ports 8081/3000 were preserved.

The dynamic Expo configuration explicitly lists the installed SDK 58 plugins. A fresh Expo Go QR was generated from the synchronized `exps://` runtime payload; the underlying link and credential were not logged or added to source. The user confirmed Expo Go opens the app; Metro `/status` returns HTTP 200 on port 8081, and the existing starter API remains on port 3000, where `/` returns its expected placeholder 404. The theme-specific appearance and final physical iPhone/Android layout are not claimed as device-verified; native map gestures, permissions, SecureStore, media selection/playback, keyboard behavior and device accessibility still require hardware checks. No native release artifact was built and no backend or publication was started.

## User-selectable Light/Dark appearance

The connected app can use the existing Expo Go session and Metro hot reload to try the new appearance: open Settings from the Profile tab (the appearance selector is also available to guests), then choose Dark or Light. The default remains Light. The preference is local-only and does not affect system settings, account/privacy controls, backend contracts or seeded demo behavior. TypeScript, lint, 59 Vitest checks and all three JavaScript exports passed. The unit suite checks the actual save payload and rehydration helper, but not a mounted provider lifecycle; the user has not yet confirmed theme-specific rendering on the phone. No native artifact or publication was produced.

The user's review screenshot showed the tab bar remained white and the Dark surfaces looked greenish. `TabLayout` now subscribes directly to ThemeProvider and chooses a true-black `#000000` bar with a neutral `#262626` top border in Dark; Light retains the existing white bar. The global Dark canvas is black, cards use neutral charcoal, and emerald/orange remain accent colors rather than large background fills. The native map's Dark geometry and water are neutral charcoal. Unit tests assert the exact Light/Dark tab-bar colors and the black/charcoal token values. Metro's file watcher crashed during hot reload while these changes were being applied; it was restarted after the saved Expo environment synced, and `/status` plus the Web root return HTTP 200 on port 8081. Reload the current Expo Go project if the device still displays stale styling. The post-fix app has not yet been visually confirmed on the user's phone; the change is type-checked, tested and exported for Web/Android/iOS JavaScript bundles, not as native release artifacts.

## Hydration skeletons and empty-state coverage

The local store's `hasHydrated` flag is the only app-wide trigger for skeleton UI. Route mounting waits for that flag and presents an accessible feed skeleton in the meantime. Skeletons are static and theme-aware, and local searches/filters remain synchronous. The shared empty state is used across the main collection and no-results journeys listed above; the inbox distinguishes an empty inbox from a failed conversation query, while the chat thread explains how to start its first local message. No new backend, artificial delay, remote loading claim or server-side behavior was introduced. TypeScript, lint, all 59 Vitest checks, Expo dependency alignment, and Web/Android/iOS JavaScript exports pass. Metro and the Web root both return HTTP 200 on port 8081; the starter API remains a placeholder on port 3000.

Empty Saved Posts and Stories include direct “Browse feed” and “Browse stories” actions; saved Businesses and Ideas link to Discover and opportunities. The final route audit's only gap was corrected, then TypeScript, lint, all 59 tests, and all three Expo JavaScript exports were rerun successfully.


## Phase 3.13.2 / Phase 3.14 — Create studio completion and feature upgrades (11 November 2026)

### Outcome

The Create tab redesign is complete as a local-first studio. The broader Phase 3.14 feature-upgrade acceptance remains in progress; completion of the redesign does not imply that all requested integrations or every requested device scenario have been completed. The existing Expo SDK 58 project and its Home, Discover, Stories, Profile and other routes remain in place.

### Shipped local workflows

Create retains the user's personal/business identity selection, content formats, post preview/publish and drafts. The Social Story route supports caption, image/video picker/camera actions, overlay/location/mention/question/poll/link fields, public/follower/private audience selection, preview, local save, 24-hour expiry and Story Highlight creation/viewing. The Stories list and direct Story-ID route now share the same visibility/block predicate; inaccessible follower/private Stories cannot be opened by bypassing the list. Founder stories remain a separate permanent editorial format.

Poll posts accept options and expiry, support one or multiple selections, record local votes, and render respondent-based counts and multi-select percentages. Listing routes now support local create/edit/delete flows for business offers, events and community opportunities, including date/order validation and opportunity expiry errors. Offer date validation now rejects already-past expiries and derives scheduled/active/expired states from the start, expiry and current time; the mock listing adapter independently validates the window and computes status rather than trusting a stale caller value. The direct product/service routes support catalogue creation and preview; catalogue editing preserves extended metadata. A selected catalogue video appears in its preview. The Stories index's nested-button markup was changed to separate the founder-story actions; this removes the React Native Web runtime warning/overlay that previously intercepted Story-composer input.

### API architecture boundary

`lib/api/feature-contracts.ts` now includes typed Social Stories/Highlights, poll voting, business-offer, event and community-opportunity contracts. The `lib/api/production-services.ts` factory maps them to proposed REST paths; `lib/services/mock-services.ts` provides isolated local service behavior and ownership checks. An independent audit found that direct mock Story lookup initially bypassed audience and block filtering even though list results were protected; both service reads now share the same policy and reject expired or inaccessible Stories. A regression test covers public, private, follower-only, blocked and expired IDs. These adapters are not proof that the endpoints exist: the Create screens currently use the persisted `hooks/use-app-store.tsx` local state and are not migrated to API feature hooks. `API_INTEGRATION.md` lists the proposed routes and the requirements for backend-side identity, audience, expiry, poll-vote and ownership enforcement. No server, database, media-storage integration, SMS, messaging delivery, push service or payment flow was created.

### Verification performed on the current working tree

| Check | Result |
| --- | --- |
| `pnpm check` | Passed after adding the new service contracts and mock/production adapters. |
| `pnpm lint` | Passed; the existing non-failing Node `MODULE_TYPELESS_PACKAGE_JSON` advisory remains. |
| `pnpm test -- --reporter=dot` | Passed: 11 test files, 78 tests. Includes direct Story lookup privacy/expiry, offer date/status, API route mapping, local poll vote, Story expiry and Highlight/listing adapter cases. Vitest still prints its non-failing Vite CJS API deprecation advisory. |
| `pnpm e2e:journeys` | Passed: 1 consolidated Playwright spec with the core discovery, registration, post, business, messaging and theme journeys, plus Story/Highlight, poll/vote, direct product/service creation, offer, event and opportunity creation. |
| Expo exports | `pnpm exec expo export --platform web`, `--platform android`, and `--platform ios` all passed under Expo SDK 58. Android and iOS results are JavaScript bundles, not APK/AAB or IPA/native release builds. |
| Expo Preview root | After clearing stale Metro metadata, the root page returned HTTP 200 and included BizConnect rather than the transient cold-start error overlay; Expo Go token synchronization returned `runtime_sync: applied`. The initial readiness probe during cold rebuild briefly saw HTTP 500 and an Expo Router/Font server bundle error; that was not reproducible after warm rebuild and the expanded Playwright test passed. |
| Static Android performance review | Home initially renders three feed posts and reveals two at a time; the video feed uses a virtualized `FlatList`, three-screen window, two-item batches and Android clipping; image caching and reduced-data/autoplay gates are present. This is source inspection, not a performance benchmark. |

### Remaining work and limitations

No low-end Android or iOS physical device was available for camera/gallery permission, actual media selection, video playback, map gestures, memory/frame-time, keyboard, accessibility or network-recovery measurements. The Android performance audit therefore remains open for on-device profiling. Selected media stays on-device; the image/video uploads and retry/resume path are not connected to these screens, and byte/chunk-resumable upload is not implemented. There is no live API backend: selecting API mode alone does not connect the local Create UI to the proposed routes. AI assistance and scheduled publishing remain unavailable. Full editing/curation of Story Highlight collections, cover and emoji controls, and the remaining catalog/editor field combinations still need a requirements-by-requirements audit. The combined Playwright test is not a substitute for every requested negative, native-media, remote-API and recovery case. Do not describe the whole 544-line Phase 3.14 acceptance brief as complete until these remaining items are implemented, tested or explicitly descoped.

The updated source and documentation remain in the existing BizConnect project; no native APK/AAB/IPA or backend deployment was produced. Run `pnpm dev:metro` for Expo Web/Go Preview and keep the managed starter API on port 3000 separate from the future BizConnect backend. Refer to `TODO.md` for the original verbatim brief and evidence-based status, and to `API_INTEGRATION.md` for proposed endpoint and migration contracts.
