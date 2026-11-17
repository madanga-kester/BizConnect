# Mabiz visual match notes

The desktop correction pass follows the supplied 1431×806 reference sheets rather than introducing a new layout concept. The shell uses a 246px fixed white sidebar, a 70px white top bar, pale `#e6ebe9` dividers, compact 12–14px UI text, emerald `#0a9a67` selected states, and a 230px contextual rail. Cards use 10–12px radii, one-pixel borders, compact badges, and restrained shadows.

## Supplied crops used

- `desktop/public/reference-kester.png` is a 256px upscaled crop of the circular Kester portrait in `reference-images/image4.png` at the top-right header. It is used by the sidebar, header and profile surfaces.
- `hero-businesses.jpg`, `hero-opportunities.jpg`, `hero-messages.jpg`, and `hero-home.jpg` are skyline/commerce strips cropped from the relevant supplied sheets and used as photo-backed hero surfaces with a dark green overlay.
- `urban-coffee.jpg`, `techsolutions.jpg`, `buildpro.jpg`, `greenleaf.jpg`, `stylehub.jpg`, and `fitzone.jpg` are crops from the business-card imagery in `image4.png` and are assigned to the business card grid by position.
- `opportunity-handshake.jpg`, `opportunity-containers.jpg`, `opportunity-meeting.jpg`, and `opportunity-office.jpg` are crops from `image2.png` and are assigned to the opportunity card grid.

## Typography and icons

The stylesheet now loads an Inter/Manrope/DM Sans fallback stack. `App.tsx` replaces the prior pseudo-element glyph icon system with a typed inline SVG icon map covering navigation, search, business, messaging, alerts, analytics, filters, calendar, location, users, stars, grid/list, chevrons and actions. The handwritten hero tagline remains the only intentionally expressive script treatment, matching the references.

## Resolution limitations

The supplied files are screenshot sheets rather than original assets. Crops therefore preserve the visible photo cues but cannot recover original source resolution, hidden pixels, exact logo vector paths, or the original product/business image metadata. The brand mark remains a CSS-rendered three-person approximation because no standalone vector/logo file was included; it is tuned to the visible green mark in the sheets. Existing functional controls and API/demo behavior were kept in place, so some fixture content remains structurally denser or more varied than the reference screenshots.
