# Native Discovery Map

BizConnect's native map uses `react-native-maps` 1.29.11, the version recommended for Expo SDK 58. Expo's [SDK 58 map-view reference](https://docs.expo.dev/versions/v58.0.0/sdk/map-view/) lists Android, iOS and Expo Go support, and says no additional native setup is required when testing with Expo Go. The project's installed `expo/bundledNativeModules.json` also lists 1.29.11. The Web build intentionally uses an accessible list fallback because this native map module is not a browser map.

The demo's pins point to public OpenStreetMap place features returned by Photon searches for the listed neighbourhoods/areas. They are **approximate neighbourhood, district or city-level area markers**, not a business address, storefront, founder's home or exact location. Businesses without an explicit matched public-area feature (including the seeded Kapsoya record) remain available in the list with a not-mapped explanation. No coordinate is fabricated for such a record. Source references are retained as OSM object type/ID in `data/business-map-locations.ts`.

Map attribution shown in the app: **© OpenStreetMap contributors**. OpenStreetMap copyright and attribution: <https://www.openstreetmap.org/copyright>. Photon project: <https://photon.komoot.io/>. Area search results were checked on 2026-11-09. The app does not make Photon/Nominatim geocoding requests at runtime.

Business-area pins do not need a user location permission. The existing “Near me” action is separate: it requests foreground location only after the user invokes it, and the app falls back to county/town filters when permission is denied or location cannot be resolved. The map does not display the viewer's location.

Expo Go can exercise the map without project-specific native setup according to Expo's SDK 58 documentation. This does not replace a physical-device verification pass. A standalone Android production binary uses Google Maps and requires a properly restricted Google Maps Android SDK API key and matching app-signing/application identity configuration. No key is configured or embedded in the project, so standalone Android map tiles remain unverified and should not be considered release-ready. iOS uses the platform Apple Maps provider by default. Native EAS builds/device checks must be run using the supported Expo Dashboard workflow; JavaScript exports are not native release artifacts.

## References

- [Expo SDK 58 react-native-maps reference](https://docs.expo.dev/versions/v58.0.0/sdk/map-view/)
- [Expo SDK 58 Expo Maps reference](https://docs.expo.dev/versions/v58.0.0/sdk/maps/)
- [OpenStreetMap copyright and attribution](https://www.openstreetmap.org/copyright)
- [Photon geocoding service](https://photon.komoot.io/)
