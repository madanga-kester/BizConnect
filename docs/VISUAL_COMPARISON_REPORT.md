# Mabiz Desktop — Visual Comparison Report

The supplied `IMAGES.docx` contains three reference sheets: Messaging and Opportunities; Products & Services and Businesses; Discover and Home. The current desktop implementation preserves the approved visual system across the page-specific compositions rather than collapsing pages into one dashboard.

| Page | Reference composition compared | Implementation result | Remaining visual limitation |
|---|---|---|---|
| Home | Green cityscape hero, compact global header, persistent left navigation, quick stats, feed composer/feed card, opportunities and activity rail | Implemented with the same structure, green/white palette, card density, sidebar/header rhythm, hero skyline treatment, composer and right rail | Fixture copy and CSS-generated illustrations are not pixel-identical to the supplied raster artwork |
| Discover | Discover hero, search bar, category tabs, business result cards, trending-business rail | Implemented with search/category state, business cards, trending rail and impact card | Fixture results remain local until public/API discovery hydration is connected |
| Businesses | Directory hero, tabs, search/filter row, six business cards, featured/business-growth side panel | Implemented with directory grid, verified/rating treatments, filters, follow actions, create/edit dialog | Live business image/media payloads are not verified in this environment |
| Products & Services | Catalogue hero, category tabs, compact product cards, image/art area, featured rail | Implemented with product/service tabs, search, detail dialogs and card actions | Demo artwork is CSS-generated to remain dependency-free; live catalogue media is API-only |
| Opportunities | Opportunity hero, category rail, filters, cards, popular categories and create CTA | Implemented with category/search filters, detail/enquiry/create actions and side rail | Live opportunities are not hydrated without a provisioned API session |
| Messaging | Message hero, three-column inbox/chat/context layout, tabs, conversation list and composer | Implemented with responsive three-column layout, search, selection, send/read/archive states and context actions | Live SignalR updates and authenticated conversation history require the backend session |
| Notifications | Notification centre list, filters, unread/read styling and preference side panel | Implemented with filter, read-all, dismiss, and preference controls; API read/dismiss routes are wired | Backend exposes preference read but no confirmed preference-update route in this source |
| Analytics | Green performance banner, range switch, metrics, activity chart and top-content panel | Implemented with range controls, metric cards, chart treatment and API analytics refresh | Demo chart is a local presentation until an API payload is available |
| Settings | Structured account/profile panel, settings rail, preference rows and danger/session section | Implemented with editable name validation, save feedback, preference selectors and logout | Profile write remains local until the confirmed backend profile-update route is mapped |
| Authentication | Supplied references use the same Mabiz brand language and full-height split layout | Implemented route-aware login/register pages with required validation, CSRF/API wiring and demo disclosure | OAuth/verification/password-reset screens are not claimed because they were not in the supplied page references |

## Consistency checks

The shared sidebar, global search/create header, account context, green cityscape/skyline motif, compact type hierarchy, mint status pills, rounded cards, narrow borders, and right-side contextual panels remain consistent. Responsive breakpoints collapse the sidebar, grids, context rail, and authentication split for tablet/mobile widths.

This report distinguishes visual implementation from backend readiness. A successful local render/build does not prove the live API, CORS, cookie, database, or SignalR paths.
