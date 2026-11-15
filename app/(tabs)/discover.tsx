import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { BusinessCard, Button, Chip, EmptyState, IconButton, Page, ProductCard, SectionTitle, TopBar, styles } from "@/components/biz-ui";
import BusinessMap from "@/components/discovery/business-map";
import { useAppStore } from "@/hooks/use-app-store";
import { colors } from "@/theme/tokens";
import { COUNTY_TOWNS, KENYAN_COUNTIES } from "@/utils/kenya";
import { t } from "@/i18n/translations";
import { filterVisibleBusinesses } from "@/utils/privacy-policy";

const CATEGORIES = ["All", "Fashion", "Food & restaurants", "Bakery & baked goods", "Natural hair salon", "Beauty & cosmetics", "Electronics", "Agriculture", "Furniture", "Construction", "Education", "Technology", "Transport", "Professional services", "Health & wellness", "Entertainment", "Home services", "Retail"];
const SORTS = ["Recommended", "A-Z business name", "Highest rating", "Most followed", "Most popular", "Recently registered"] as const;

export default function DiscoverScreen() {
  const app = useAppStore();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [county, setCounty] = useState("All counties");
  const [townFilter, setTownFilter] = useState("Any town");
  const [neighbourhoodFilter, setNeighbourhoodFilter] = useState("Any neighbourhood");
  const [sort, setSort] = useState<(typeof SORTS)[number]>("Recommended");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [followedOnly, setFollowedOnly] = useState(false);
  const [nearby, setNearby] = useState(false);
  const [mapMode, setMapMode] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [priceLevel, setPriceLevel] = useState("Any price");
  const visibleBusinesses = useMemo(() => filterVisibleBusinesses(app.businesses, app.blockedUsers), [app.businesses, app.blockedUsers]);
  const filtered = useMemo(() => {
    let items = visibleBusinesses.filter((b) => {
      const term = query.trim().toLowerCase();
      const matchesQuery = !term || `${b.name} ${b.category} ${b.subcategory} ${b.town} ${b.neighbourhood} ${b.description}`.toLowerCase().includes(term) || b.products.some((p) => p.name.toLowerCase().includes(term)) || b.services.some((s) => s.name.toLowerCase().includes(term));
      const matchesCategory = category === "All" || b.category === category || b.subcategory === category;
      const matchesCounty = county === "All counties" || b.county === county;
      const matchesTown = townFilter === "Any town" || b.town === townFilter;
      const matchesNeighbourhood = neighbourhoodFilter === "Any neighbourhood" || b.neighbourhood === neighbourhoodFilter;
      const matchesNearby = !nearby || b.county === app.user.county;
      const matchesPrice = priceLevel === "Any price" || b.priceRange === priceLevel;
      const matchesFollowed = !followedOnly || app.followedBusinesses.includes(b.id);
      return matchesQuery && matchesCategory && matchesCounty && matchesTown && matchesNeighbourhood && matchesNearby && matchesPrice && matchesFollowed && b.rating >= minRating && (!verifiedOnly || b.verified);
    });
    if (sort === "A-Z business name") items.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "Highest rating") items.sort((a, b) => b.rating - a.rating);
    if (sort === "Most followed") items.sort((a, b) => b.followers - a.followers);
    if (sort === "Most popular") items.sort((a, b) => b.analytics.profileViews - a.analytics.profileViews);
    if (sort === "Recently registered") items.sort((a, b) => b.joinedAt.localeCompare(a.joinedAt));
    return items;
  }, [visibleBusinesses, app.user.county, app.followedBusinesses, category, county, townFilter, neighbourhoodFilter, followedOnly, minRating, nearby, priceLevel, query, sort, verifiedOnly]);
  const neighbourhoods = ["Any neighbourhood", ...new Set(visibleBusinesses.filter((b) => county === "All counties" || b.county === county).filter((b) => townFilter === "Any town" || b.town === townFilter).map((b) => b.neighbourhood))];
  const requestNearby = async () => {
    if (nearby) { setNearby(false); return; }
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) { const message = "Location was not shared. Choose a county and town to browse by area."; if (Platform.OS === "web") window.alert(message); else Alert.alert("Location not shared", message); return; }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      const [place] = await Location.reverseGeocodeAsync({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      const region = place?.region ?? "";
      const matchedCounty = KENYAN_COUNTIES.find((item) => region.toLowerCase().includes(item.toLowerCase())) ?? app.user.county;
      const rawTown = place?.city ?? place?.district ?? place?.subregion ?? app.user.town;
      const matchedTown = COUNTY_TOWNS[matchedCounty].find((item) => rawTown.toLowerCase().includes(item.toLowerCase())) ?? app.user.town;
      app.updateUser({ county: matchedCounty, town: matchedTown });
      setCounty(matchedCounty); setTownFilter(matchedTown); setNeighbourhoodFilter("Any neighbourhood"); setNearby(true);
    } catch {
      const message = "Could not determine an approximate area. Pick a county and town instead."; if (Platform.OS === "web") window.alert(message); else Alert.alert("Location unavailable", message);
    }
  };
  const products = visibleBusinesses.flatMap((business) => business.products.map((product) => ({ product, business }))).filter(({ product }) => !query || `${product.name} ${product.description}`.toLowerCase().includes(query.toLowerCase())).slice(0, 6);
  const clearFilters = () => { setQuery(""); setCategory("All"); setCounty("All counties"); setTownFilter("Any town"); setNeighbourhoodFilter("Any neighbourhood"); setVerifiedOnly(false); setFollowedOnly(false); setNearby(false); setMinRating(0); setPriceLevel("Any price"); setSort("Recommended"); };

  return <Page>
    <TopBar title={t("discover", app.settings.language)} right={<IconButton name="time-outline" label="Search history" onPress={() => router.push("/search-history")} />} />
    <View style={{ gap: 9 }}><Text style={styles.sectionHeading}>Find your next favourite local business.</Text><View style={styles.inputWrap}><Ionicons name="search" color={colors.muted} size={18} /><TextInput value={query} onChangeText={setQuery} onSubmitEditing={() => query && app.recordSearch(query)} placeholder="Businesses, products, people..." placeholderTextColor={colors.muted} style={{ flex: 1, paddingVertical: 11, paddingHorizontal: 8, color: colors.ink }} returnKeyType="search" accessibilityLabel="Search businesses, products and people" /><Pressable accessibilityRole="button" accessibilityLabel="Advanced filters" onPress={() => setFiltersOpen(!filtersOpen)}><Ionicons name="options-outline" size={20} color={filtersOpen ? colors.emerald : colors.navy} /></Pressable></View></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{CATEGORIES.map((item) => <Chip key={item} label={item} selected={category === item} onPress={() => setCategory(item)} />)}</ScrollView>
    <View style={styles.rowBetween}><Text style={styles.caption}>Location: {county === "All counties" ? app.user.county + " & beyond" : county}</Text><Pressable accessibilityRole="button" onPress={() => setFiltersOpen(!filtersOpen)}><Text style={styles.link}>{filtersOpen ? "Hide filters" : "Filters & sort"}</Text></Pressable></View>
    {filtersOpen ? <View style={[styles.card, { padding: 14, gap: 13 }]}>
      <Text style={styles.cardTitle}>County</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7 }}><Chip label="All counties" selected={county === "All counties"} onPress={() => setCounty("All counties")} />{KENYAN_COUNTIES.map((item) => <Chip key={item} label={item} selected={county === item} onPress={() => { setCounty(item); setTownFilter("Any town"); setNeighbourhoodFilter("Any neighbourhood"); }} />)}</ScrollView>
      <Text style={styles.cardTitle}>Town</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7 }}><Chip label="Any town" selected={townFilter === "Any town"} onPress={() => setTownFilter("Any town")} />{(county === "All counties" ? Object.values(COUNTY_TOWNS).flat() : COUNTY_TOWNS[county as keyof typeof COUNTY_TOWNS]).map((town) => <Chip key={town} label={town} selected={townFilter === town} onPress={() => setTownFilter(town)} />)}</ScrollView>
      <Text style={styles.cardTitle}>Neighbourhood</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7 }}>{neighbourhoods.map((item) => <Chip key={item} label={item} selected={neighbourhoodFilter === item} onPress={() => setNeighbourhoodFilter(item)} />)}</ScrollView>
      <Text style={styles.cardTitle}>Sort by</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7 }}>{SORTS.map((item) => <Chip key={item} label={item} selected={sort === item} onPress={() => setSort(item)} />)}</ScrollView>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}><Chip label="Nearby" icon="navigate-outline" selected={nearby} onPress={() => void requestNearby()} /><Chip label="Verified only" icon="checkmark-circle-outline" selected={verifiedOnly} onPress={() => setVerifiedOnly(!verifiedOnly)} /><Chip label="Followed only" icon="people-outline" selected={followedOnly} onPress={() => setFollowedOnly((value) => !value)} /><Chip label="Rating 4.5+" icon="star-outline" selected={minRating > 0} onPress={() => setMinRating(minRating ? 0 : 4.5)} /><Chip label="Any price" selected={priceLevel === "Any price"} onPress={() => setPriceLevel("Any price")} />{["KSh", "KSh KSh", "KSh KSh KSh"].map((item) => <Chip key={item} label={item} selected={priceLevel === item} onPress={() => setPriceLevel(item)} />)}</View>
      <Text style={styles.caption}>The native map uses approximate public-area markers only. A business without a matched area coordinate remains visible in the list.</Text>
    </View> : null}
    <View style={styles.rowBetween}><SectionTitle title={query ? `Results (${filtered.length})` : t("popular", app.settings.language)} /><Pressable accessibilityRole="button" onPress={() => void requestNearby()}><Text style={styles.link}>{nearby ? "All areas" : "Near me"}</Text></Pressable></View>
    <View style={styles.row}><Button title={mapMode ? t("listView", app.settings.language) : t("mapView", app.settings.language)} icon={mapMode ? "list-outline" : "map-outline"} variant="outline" small onPress={() => setMapMode((value) => !value)} /><Text style={styles.caption}>{filtered.length} businesses</Text></View>
    {mapMode ? <BusinessMap businesses={filtered} blockedUserIds={app.blockedUsers} onOpenBusiness={(id) => router.push({ pathname: "/business/[id]", params: { id } })} /> : filtered.map((business) => <BusinessCard key={business.id} business={business} />)}
    {!filtered.length ? <EmptyState title={query.trim() ? `No results for "${query.trim()}"` : t("noBusinessResults", app.settings.language)} detail="Try a broader search or clear the filters. You can browse local businesses without signing in." icon="search-outline" action="Clear filters" onAction={clearFilters} /> : null}
    {products.length ? <><SectionTitle title={t("productsWorthDiscovering", app.settings.language)} action="See all" onAction={() => router.push("/products")} /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>{products.map(({ product }) => <ProductCard key={product.id} product={product} />)}</ScrollView></> : null}
    <Text style={styles.caption}>Nearby location permission is requested only after you choose "Near me". You can also filter manually by county, town and neighbourhood.</Text>
  </Page>;
}