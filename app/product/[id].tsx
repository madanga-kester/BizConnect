import { router, useLocalSearchParams } from "expo-router";
import { Linking, Share, Text, View } from "react-native";
import { ApiCatalogItemDetail } from "@/components/api-catalog-screens";
import { Avatar, Button, EmptyState, MediaImage, Page, SectionTitle, TopBar, styles } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { useMabizServiceMode } from "@/lib/services/service-provider";
import { colors } from "@/theme/tokens";
import { formatKes, formatKenyanPhone } from "@/utils/kenya";
import { useThemeContext } from "@/lib/theme-provider";

export default function ProductDetailScreen() {
  useThemeContext();
  const { id, kind } = useLocalSearchParams<{ id?: string; kind?: string }>();
  const apiMode = useMabizServiceMode() === "api";
  // Stage 5: API mode reads the public catalogue detail endpoint; the same route serves both kinds.
  if (apiMode) return <ApiCatalogItemDetail slugOrId={id ?? ""} kind={kind === "service" ? "service" : kind === "product" ? "product" : undefined} />;
  return <MockProductDetailScreen id={id ?? ""} />;
}

function MockProductDetailScreen({ id }: { id: string }) {
  useThemeContext();
  const app = useAppStore();
  const product = app.businesses.flatMap((b) => b.products).find((p) => p.id === id && !p.archived);
  if (!product) return <Page><TopBar title="Product" back /><EmptyState title="Product not found" detail="This item may no longer be available." action="Browse businesses" onAction={() => router.replace("/(tabs)/discover")} /></Page>;
  const business = app.businesses.find((b) => b.id === product.businessId);
  if (!business || app.blockedUsers.includes(business.ownerId)) return <Page><TopBar title="Product" back /><EmptyState title="Product unavailable" detail="This item may no longer be available." action="Browse businesses" onAction={() => router.replace("/(tabs)/discover")} /></Page>;
  const start = () => { if (!app.isAuthenticated) return router.push("/auth/login"); if (app.settings.messagePermissions === "nobody" || (app.settings.messagePermissions === "following" && !app.followedBusinesses.includes(business.id)) || app.blockedUsers.includes(business.ownerId)) return router.push("/menu/privacy/profile-privacy"); const conv = app.startConversation(business.ownerId, business.founder, business.id); if (!conv) return; router.push({ pathname: "/messages/[id]", params: { id: conv } }); };
  const whatsapp = () => { if (!app.isAuthenticated) return router.push("/auth/login"); if (app.settings.messagePermissions === "nobody" || (app.settings.messagePermissions === "following" && !app.followedBusinesses.includes(business.id)) || app.blockedUsers.includes(business.ownerId)) return router.push("/menu/privacy/profile-privacy"); const number = business.whatsapp.replace(/\D/g, ""); void Linking.openURL(`https://wa.me/${number}?text=${encodeURIComponent(`Hi ${business.name}, I saw ${product.name} on Mabiz and would like to ask about availability.`)}`).catch(() => start()); };
  return <Page>
    <TopBar title="Product details" back right={<Button title="Share" icon="share-social-outline" variant="quiet" small onPress={() => void Share.share({ message: `${product.name} · ${business.name} · ${formatKes(product.price)}` })} />} />
    <MediaImage uri={product.image} height={260} label={product.name} />
    <View style={{ gap: 7 }}><Text style={styles.sectionHeading}>{product.name}</Text><Text style={{ color: colors.emeraldDark, fontSize: 22, fontWeight: "800" }}>{formatKes(product.price)}</Text><Text style={styles.caption}>{product.availability} · {product.category}</Text><Text style={styles.body}>{product.description}</Text></View>
    <View style={[styles.card, { padding: 14, gap: 9 }]}><SectionTitle title="Seller" /><View style={styles.row}><Avatar name={business.name} size={42} /><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{business.name}</Text><Text style={styles.caption}>{business.category} · {business.town}, {business.county}</Text></View><Text style={{ color: colors.emeraldDark, fontWeight: "700" }}>★ {business.rating.toFixed(1)}</Text></View><Text style={styles.caption}>{formatKenyanPhone(business.phone)} · {business.operatingHours}</Text></View>
    <View style={[styles.row, { flexWrap: "wrap" }]}><Button title="Contact seller" icon="chatbubble-outline" onPress={start} /><Button title="WhatsApp" icon="logo-whatsapp" variant="soft" onPress={whatsapp} /><Button title="Visit business" icon="storefront-outline" variant="outline" onPress={() => router.push({ pathname: "/business/[id]", params: { id: business.id } })} /></View>
    <View style={[styles.card, { padding: 14, gap: 6 }]}><Text style={styles.cardTitle}>Availability & location</Text><Text style={styles.body}>{product.availability} · {product.location}</Text><Text style={styles.caption}>Mabiz connects buyers and sellers directly. No checkout or payment is processed in this app.</Text></View>
  </Page>;
}
