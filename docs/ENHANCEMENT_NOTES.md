# Desktop enhancement notes

## Visual correction

- Avatar markup is a circular-only wrapper: fixed width/height, `aspect-ratio: 1`, `border-radius: 50%`, `overflow: hidden`, `flex: none`, transparent background and no rectangular border.
- The supplied `desktop/public/reference-kester.png` portrait is the only visible avatar surface. `object-position` is set for the portrait crop.
- Existing reference-derived hero, business and opportunity imagery remains in use.

## Interaction model

- Detail actions open one of three typed surfaces: `BusinessProfileView`, `ProductDetailView` or `OpportunityDetailView`.
- Create, notification and account controls have separate popover/menu behavior.
- Follow, message, enquiry, progress, local save/cart-style and preference actions are local-state or confirmed API actions. The UI does not show pretend API success.
- Business profile surfaces are opened from business cards, Discover/search results and message context.

## Theme and motion

- `theme` is persisted as `bizconnect-theme` and reflected as `data-theme="dark"` on the document root.
- Reduced motion is persisted as `bizconnect-reduced-motion` and also honors the CSS `prefers-reduced-motion` baseline already used by the app's motion layer.
- Motion includes page entrance, hero accent float, card hover lift, button microinteraction, popover/modal transitions and progress presentation. The reduced-motion attribute disables these transitions.

## Scope guardrails

This pass intentionally changes only the desktop web app and its documentation. It does not touch mobile Expo routes/components, the .NET backend, backend contracts or the supplied reference asset inventory.

## Verification

Run from the repository root:

```sh
pnpm check
pnpm desktop:build
pnpm test
```
