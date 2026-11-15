# BizConnect Desktop Website — Implementation Plan

## Approach

Add a dedicated `desktop/` React + Vite application inside the existing BizConnect repository. The mobile Expo Router app under `app/` remains unchanged and continues to use the existing service provider. The desktop site uses a browser-focused shell, responsive CSS, history routing, and a small API client that targets the existing `/api/v1` backend. It does not add a second backend, database, authentication store, or fake production API.

## Design

**Selected style: Community Focus** — 0.07 probability. The interface is a calm green-and-white community workspace with a warm off-white canvas, deep navy text, rounded but restrained cards, and a persistent navigation rail.

**Design movement:** community operating system meets editorial directory.

**Core principles:** make people and businesses visible; keep search and context close to the work; separate exploration from management; show provenance and API/demo state clearly.

**Color philosophy:** BizConnect green signals action and local growth; dark navy provides trust and contrast; warm paper and pale mint keep the desktop surface human rather than corporate.

**Layout paradigm:** persistent rail plus full-width top bar, with page-specific central compositions rather than one repeated dashboard grid. Home is a two-column community stream, Discover is search-led, Businesses is directory/profile-led, Products is catalogue-led, Messaging is split-pane, Notifications is a centre timeline, Analytics is metric-led, and Settings is section-led.

**Signature elements:** green “signal” status dots; business identity chips; pale mint data rails and section labels.

**Interaction philosophy:** every primary action has a visible result state, local demo mode is disclosed, and permission-aware actions are disabled or explained rather than silently failing.

**Animation:** short 150–220ms transitions for route changes, chips, drawers, and cards; no continuous decorative motion.

**Typography:** system sans stack with heavy display headings, compact eyebrow labels, and readable 15–16px body copy.

**Brand essence:** BizConnect is the practical community layer where Kenyan people discover businesses and businesses build momentum. Personality: grounded, generous, energetic.

**Brand voice:** direct, useful, locally aware. Example CTAs: “Find the next useful connection” and “Turn attention into momentum.”

**Wordmark:** bold BizConnect wordmark with a paired green signal bar motif.

**Signature brand color:** BizConnect green `#0A8F62`.

## Structure

- `desktop/index.html`: standalone desktop entry.
- `desktop/src/main.tsx`: bootstrap and router.
- `desktop/src/App.tsx`: shell, navigation, route selection, auth/demo state.
- `desktop/src/api.ts`: browser API client using existing `/api/v1` routes and cookie-based session assumptions.
- `desktop/src/data.ts`: clearly labelled demo fixtures only, used when API mode is not configured.
- `desktop/src/styles.css`: responsive design system and page layouts.
- `desktop/src/pages.tsx`: distinct Home, Discover, Businesses, Products & Services, Opportunities, Messaging, Notifications, Analytics, Settings, auth, and management views.
- `desktop/public/manus-routes.json`: route manifest for the desktop app.

## Integration

The desktop site reads `VITE_API_BASE_URL` and `VITE_API_MODE`. In API mode it sends credentials, obtains CSRF state where the backend exposes it, and calls existing REST paths. It never stores refresh tokens in JavaScript. If API mode is not configured, the UI enters an explicitly labelled demo mode with non-production fixture data. SignalR wiring is represented by an API client connection hook and falls back to REST refresh when the SignalR hub is unavailable.

## Delivery and verification

Build with `pnpm desktop:build`; run locally with `pnpm desktop:dev`. Run `pnpm check`, the existing Vitest suite, and `pnpm desktop:build`. The .NET backend remains shared and is not changed by the desktop client work.
