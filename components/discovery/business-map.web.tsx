import { Pressable, Text, View } from "react-native";
import type { Business } from "@/types/domain";
import { getBusinessMapPins } from "@/utils/business-map";
import { colors, createThemedStyles, radius } from "@/theme/tokens";
import { SectionTitle } from "@/components/biz-ui";
import { useThemeContext } from "@/lib/theme-provider";

interface BusinessMapProps {
  businesses: readonly Business[];
  blockedUserIds: readonly string[];
  onOpenBusiness: (businessId: string) => void;
}

export default function BusinessMap({ businesses, blockedUserIds, onOpenBusiness }: BusinessMapProps) {
  useThemeContext();
  const pins = getBusinessMapPins(businesses, blockedUserIds);
  const pinIds = new Set(pins.map(({ business }) => business.id));
  return <View style={{ gap: 12 }}>
    <View style={styles.notice} accessibilityRole="summary">
      <Text style={styles.heading}>Interactive map is available in the native mobile app</Text>
      <Text style={styles.body}>This web preview keeps your discovery results accessible as a list. On iOS or Android, the map shows approximate public-area markers only, never exact storefront locations.</Text>
    </View>
    <SectionTitle title={`Public area matches (${pins.length})`} />
    {businesses.map((business) => {
      const mapped = pinIds.has(business.id);
      return <Pressable key={business.id} accessibilityRole="button" accessibilityLabel={`Open ${business.name}${mapped ? ", approximate area marker available" : ", not mapped"}`} onPress={() => onOpenBusiness(business.id)} style={styles.row}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.name}>{business.name}</Text>
          <Text style={styles.body}>{business.neighbourhood}, {business.town} · {mapped ? "approximate area marker available on mobile" : "not mapped yet"}</Text>
        </View>
        <Text style={styles.link}>Open profile</Text>
      </Pressable>;
    })}
    <Text style={styles.attribution}>Approximate area markers © OpenStreetMap contributors.</Text>
  </View>;
}

const styles = createThemedStyles(() => ({
  notice: { backgroundColor: colors.emeraldTint, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: 15, gap: 8 },
  heading: { color: colors.ink, fontSize: 16, lineHeight: 22, fontWeight: "800" as const },
  body: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  row: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: 13, flexDirection: "row" as const, alignItems: "center" as const, gap: 10 },
  name: { color: colors.ink, fontSize: 14, fontWeight: "700" as const },
  link: { color: colors.emeraldDark, fontSize: 12, fontWeight: "700" as const },
  attribution: { color: colors.muted, fontSize: 11, lineHeight: 16 },
}));
