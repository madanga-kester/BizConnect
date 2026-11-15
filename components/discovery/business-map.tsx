import MapView, { Marker } from "react-native-maps";
import { useMemo, useState, type ComponentProps } from "react";
import { Pressable, Text, View } from "react-native";
import type { Business } from "@/types/domain";
import { getBusinessMapPins, getBusinessMapRegion } from "@/utils/business-map";
import { colors, createThemedStyles, radius } from "@/theme/tokens";
import { Button, SectionTitle } from "@/components/biz-ui";
import { useThemeContext } from "@/lib/theme-provider";

const DARK_MAP_STYLE: NonNullable<ComponentProps<typeof MapView>["customMapStyle"]> = [
  { elementType: "geometry", stylers: [{ color: "#101010" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#D4D4D8" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#101010" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#3F3F46" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#171717" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0A0A0A" }] },
];

interface BusinessMapProps {
  businesses: readonly Business[];
  blockedUserIds: readonly string[];
  onOpenBusiness: (businessId: string) => void;
}

export default function BusinessMap({ businesses, blockedUserIds, onOpenBusiness }: BusinessMapProps) {
  const { colorScheme } = useThemeContext();
  const pins = useMemo(() => getBusinessMapPins(businesses, blockedUserIds), [businesses, blockedUserIds]);
  const region = useMemo(() => getBusinessMapRegion(pins), [pins]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>();
  const selected = pins.find(({ business }) => business.id === selectedBusinessId);
  const unmapped = businesses.filter((business) => !pins.some(({ business: pinBusiness }) => pinBusiness.id === business.id));

  return <View style={{ gap: 12 }}>
    <Text style={styles.heading}>Explore by area</Text>
    <Text style={styles.body}>Pins show approximate public neighbourhood or town centres, not a business&apos;s exact premises. Tap a pin to preview the business.</Text>
    {pins.length && region ? <MapView
      key={pins.map(({ business }) => business.id).join(":")}
      style={styles.map}
      initialRegion={region}
      rotateEnabled={false}
      pitchEnabled={false}
      userInterfaceStyle={colorScheme}
      customMapStyle={colorScheme === "dark" ? DARK_MAP_STYLE : undefined}
      showsCompass
      showsScale
      loadingEnabled
      accessibilityLabel="Business discovery map with approximate public-area markers"
    >
      {pins.map(({ business, location }) => <Marker
        key={business.id}
        coordinate={{ latitude: location.latitude, longitude: location.longitude }}
        title={business.name}
        description={`Approximate ${location.areaName} area · not an exact business address`}
        pinColor={selectedBusinessId === business.id ? colors.orange : colors.emerald}
        accessibilityLabel={`Approximate area for ${business.name} in ${location.areaName}. Select to preview.`}
        onPress={() => setSelectedBusinessId(business.id)}
      />)}
    </MapView> : <View style={styles.emptyMap}>
      <Text style={styles.emptyTitle}>No verified public-area markers for this selection</Text>
      <Text style={styles.body}>You can still open these businesses from the list below. No address has been guessed.</Text>
    </View>}
    <Text style={styles.attribution}>Approximate area markers © OpenStreetMap contributors. Markers do not identify exact premises.</Text>

    {selected ? <View style={styles.preview} accessibilityLiveRegion="polite">
      <Text style={styles.previewTitle}>{selected.business.name}</Text>
      <Text style={styles.body}>{selected.business.category} · {selected.business.town}, {selected.business.county}</Text>
      <Text style={styles.body}>Approximate area: {selected.location.areaName}</Text>
      <Button title="Open business profile" icon="business-outline" onPress={() => onOpenBusiness(selected.business.id)} />
    </View> : null}

    {unmapped.length ? <View style={{ gap: 8 }}>
      <SectionTitle title="Also in your results · not mapped yet" />
      <Text style={styles.body}>These businesses remain discoverable, but do not have a matched public map-area coordinate.</Text>
      {unmapped.map((business) => <Pressable
        key={business.id}
        accessibilityRole="button"
        accessibilityLabel={`Open ${business.name}. Not mapped because a public area coordinate is unavailable.`}
        onPress={() => onOpenBusiness(business.id)}
        style={styles.unmappedRow}
      >
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={styles.previewTitle}>{business.name}</Text>
          <Text style={styles.body}>{business.neighbourhood}, {business.town} · not mapped</Text>
        </View>
        <Text style={styles.openText}>Open profile</Text>
      </Pressable>)}
    </View> : null}
  </View>;
}

const styles = createThemedStyles(() => ({
  heading: { color: colors.ink, fontSize: 19, fontWeight: "800" as const },
  body: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  map: { width: "100%" as const, height: 330, borderRadius: radius.md },
  emptyMap: { minHeight: 160, borderRadius: radius.md, padding: 20, justifyContent: "center" as const, gap: 8, backgroundColor: colors.subtle, borderWidth: 1, borderColor: colors.border },
  emptyTitle: { color: colors.ink, fontSize: 15, fontWeight: "700" as const },
  attribution: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  preview: { borderRadius: radius.md, padding: 14, gap: 8, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
  previewTitle: { color: colors.ink, fontSize: 15, fontWeight: "800" as const },
  unmappedRow: { borderRadius: radius.md, padding: 12, flexDirection: "row" as const, alignItems: "center" as const, gap: 12, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
  openText: { color: colors.emeraldDark, fontSize: 12, fontWeight: "700" as const },
}));
