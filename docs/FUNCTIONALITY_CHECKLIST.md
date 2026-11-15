# Desktop functionality checklist

Status is based on source inspection plus local typecheck/build/test runs. Demo mode is deterministic and labeled in the UI. API mode is fail-closed and only reports success after a configured endpoint responds successfully.

| Area | Status | Notes |
|---|---|---|
| Routes and direct rendering | Complete | Home, Discover, Businesses, Products & Services, Opportunities, Messages, Notifications, Analytics, Settings, Login and Register are in the route manifest and History API navigation. |
| Reference layout | Complete | Green light/reference layout, screenshot wording/order, spacing system, reference-derived imagery and optional black/grey dark theme are preserved. No pixel-perfect original-asset claim is made. |
| Icons and portrait | Complete | Visible UI controls use inline SVG icons; shared portrait is circular with the approved crop fix. |
| Authentication | Complete | Demo login/register validation; API CSRF, login, register, refresh-cookie and logout wrappers. |
| Home | Complete | Quick Stats, Top Opportunities, Recent Activity, composer, feed actions and route CTAs are present. |
| Discover/search/filter | Complete | Search filters business fixtures and global search carries `q` into Discover. Business/product/opportunity tabs route to typed pages. |
| Businesses | Complete | Cards, typed business detail, follow/unfollow, create-business validation and API create/follow wiring. |
| Products & Services | Complete | Product/service tabs filter results; typed detail, message/enquiry and local cart/book action are explicit. No checkout success is fabricated. |
| Opportunities | Complete | Typed detail, enquiry and create-opportunity validation; API create/enquiry wiring uses confirmed routes. |
| Messages | Complete | Conversation selection, composer, send validation, API send route, profile/context actions and local sent-message state. |
| Notifications | Complete | Read-all and dismiss controls update local state; API read-all/dismiss wrappers are called in API mode. |
| Analytics | Complete | 7d/30d/90d controls, local charts and confirmed analytics refresh route. |
| Settings | Complete | Name validation/save, theme, reduced motion, notification toggle, logout and persisted local settings. Confirmed notification-preference PATCH wrapper is available; live service was not exercised. |
| Demo/API labeling | Complete | Demo mode is labeled; API mode requires explicit mode and base URL and surfaces request errors. |
| Mobile/backend scope | Preserved | No mobile Expo or .NET/PostgreSQL source was changed. |

## Verification commands

- `pnpm check` — passed.
- `pnpm desktop:build` — passed with the existing Vite future-config warning.
- `pnpm test` — passed: 16 files, 117 tests.
- Live .NET/PostgreSQL/SignalR exercise — not available in this environment.
