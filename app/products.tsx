import { useMemo, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { ApiCatalogueDiscovery } from "@/components/api-catalog-screens";
import { Page, ProductCard, SectionTitle, TopBar, styles } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { useBizConnectServiceMode } from "@/lib/services/service-provider";
import { colors } from "@/theme/tokens";
import { filterVisibleBusinesses } from "@/utils/privacy-policy";

export default function ProductsScreen() {
  const apiMode = useBizConnectServiceMode() === "api";
  // Stage 5: API mode browses the published server catalogue through anonymous discovery.
  if (apiMode) return <ApiCatalogueDiscovery />;
  return <MockProductsScreen />;
}

function MockProductsScreen() {
  const app = useAppStore();
  const [query, setQuery] = useState("");
  const visibleBusinesses = useMemo(() => filterVisibleBusinesses(app.businesses, app.blockedUsers), [app.businesses, app.blockedUsers]);
  const products = useMemo(() => visibleBusinesses.flatMap((business) => business.products).filter((product) => !product.archived).filter((product) => `${product.name} ${product.description} ${product.category} ${product.location}`.toLowerCase().includes(query.toLowerCase())), [visibleBusinesses, query]);
  const services = visibleBusinesses.flatMap((business) => business.services).filter((service) => !service.archived).filter((service) => `${service.name} ${service.description} ${service.category}`.toLowerCase().includes(query.toLowerCase()));
  return <Page><TopBar title="Products & services" back /><View style={styles.inputWrap}><Text style={{ color: colors.muted }}>⌕</Text><TextInput value={query} onChangeText={setQuery} placeholder="Search products and services" placeholderTextColor={colors.muted} style={{ flex: 1, padding: 10, color: colors.ink }} /></View>
    <SectionTitle title={`Products (${products.length})`} />{products.length ? <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>{products.map((p) => <ProductCard key={p.id} product={p} />)}</View> : <Text style={styles.caption}>No products match that search.</Text>}
    <SectionTitle title={`Services (${services.length})`} />{services.map((service) => <View key={service.id} style={[styles.card, { padding: 15, gap: 7 }]}><Text style={styles.cardTitle}>{service.name}</Text><Text style={styles.body}>{service.description}</Text><Text style={styles.caption}>{service.priceLabel} · {service.location}</Text></View>)}
    <Text style={styles.caption}>Prices and availability are sample catalogue data. Contact sellers directly; there is no checkout.</Text>
  </Page>;
}
