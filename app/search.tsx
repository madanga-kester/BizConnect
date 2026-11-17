import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Avatar, BusinessCard, Chip, EmptyState, Page, PostCard, ProductCard, SectionTitle, TopBar, styles } from "@/components/biz-ui";
import { PEOPLE, STORIES } from "@/data/seed";
import { useAppStore } from "@/hooks/use-app-store";
import { colors } from "@/theme/tokens";
import { filterVisibleBusinesses, filterVisiblePosts, profileRestriction } from "@/utils/privacy-policy";

const SUGGESTIONS = ["Fashion in Nairobi", "Coastal food", "Made to order furniture", "Founder stories", "Business opportunities"];
const TYPES = ["All", "Businesses", "People", "Products", "Services", "Stories", "Posts", "Videos"];

export default function SearchScreen() {
  const app = useAppStore();
  const { q } = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(q ?? "");
  const [type, setType] = useState("All");
  const normalized = query.trim().toLowerCase();
  const visibleBusinesses = useMemo(() => filterVisibleBusinesses(app.businesses, app.blockedUsers), [app.businesses, app.blockedUsers]);
  const matches = (value: string) => !normalized || value.toLowerCase().includes(normalized);
  const businesses = visibleBusinesses.filter((business) => matches(`${business.name} ${business.category} ${business.town} ${business.neighbourhood} ${business.description}`));
  const visibleBusinessIds = new Set(visibleBusinesses.map((business) => business.id));
  const products = visibleBusinesses.flatMap((business) => business.products).filter((product) => matches(`${product.name} ${product.description} ${product.category}`));
  const services = visibleBusinesses.flatMap((business) => business.services).filter((service) => matches(`${service.name} ${service.description} ${service.category}`));
  const stories = STORIES.filter((story) => {
    const business = app.businesses.find((item) => item.id === story.businessId);
    const founder = PEOPLE.find((person) => person.id === story.founderId);
    if (app.blockedUsers.includes(story.founderId) || (business && !visibleBusinessIds.has(business.id))) return false;
    if (founder && profileRestriction(founder, app.user.id, app.followedPeople, app.blockedUsers)) return false;
    return matches(`${story.title} ${story.intro} ${story.category}`);
  });
  const visiblePosts = useMemo(() => filterVisiblePosts(app.posts, {
    viewerId: app.user.id,
    people: [...PEOPLE.filter((person) => person.id !== app.user.id), app.user],
    businesses: app.businesses,
    blockedUserIds: app.blockedUsers,
    hiddenPostIds: app.hiddenPosts,
    followedPeople: app.followedPeople,
  }), [app.posts, app.user, app.businesses, app.blockedUsers, app.hiddenPosts, app.followedPeople]);
  const posts = visiblePosts.filter((post) => matches(`${post.caption} ${post.location} ${post.hashtags.join(" ")}`));
  const videos = posts.filter((post) => post.video || post.kind === "video");
  const people = PEOPLE.filter((person) => !profileRestriction(person, app.user.id, app.followedPeople, app.blockedUsers) && matches(`${person.name} ${person.username} ${person.bio}`));
  const hasSelectedResults = type === "Businesses" ? businesses.length > 0 : type === "People" ? people.length > 0 : type === "Products" ? products.length > 0 : type === "Services" ? services.length > 0 : type === "Stories" ? stories.length > 0 : type === "Videos" ? videos.length > 0 : type === "Posts" ? posts.length > 0 : Boolean(businesses.length || people.length || products.length || services.length || stories.length || posts.length || videos.length);
  const submit = () => { if (query.trim()) app.recordSearch(query.trim()); };

  return <Page>
    <TopBar title="Search Mabiz" back />
    <View style={styles.inputWrap}><Ionicons name="search" size={19} color={colors.muted} /><TextInput value={query} onChangeText={setQuery} onSubmitEditing={submit} autoFocus placeholder="People, businesses, products…" placeholderTextColor={colors.muted} style={{ flex: 1, padding: 10, color: colors.ink }} returnKeyType="search" accessibilityLabel="Search Mabiz" /><Pressable accessibilityRole="button" onPress={submit}><Text style={styles.link}>Search</Text></Pressable></View>
    {!normalized ? <>
      <SectionTitle title="Try searching for" />
      {SUGGESTIONS.map((suggestion) => <Pressable key={suggestion} accessibilityRole="button" onPress={() => { setQuery(suggestion); app.recordSearch(suggestion); }} style={styles.actionTile}><Ionicons name="trending-up-outline" size={18} color={colors.muted} /><Text style={[styles.body, { flex: 1 }]}>{suggestion}</Text><Ionicons name="arrow-up-outline" size={16} color={colors.muted} /></Pressable>)}
      <SectionTitle title="Recent searches" action="View all" onAction={() => router.push("/search-history")} />
      {app.searchHistory.length ? app.searchHistory.slice(0, 5).map((item) => <Chip key={item} label={item} icon="time-outline" onPress={() => setQuery(item)} />) : <EmptyState title="No recent searches yet" detail="Search for a business, founder, product or story and it will appear here on this device." icon="time-outline" />}
    </> : <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>{TYPES.map((item) => <Chip key={item} label={item} selected={type === item} onPress={() => setType(item)} />)}</ScrollView>
      {type === "All" || type === "Businesses" ? <><SectionTitle title={`Businesses (${businesses.length})`} />{businesses.map((business) => <BusinessCard key={business.id} business={business} />)}</> : null}
      {type === "All" || type === "People" ? <><SectionTitle title={`People (${people.length})`} />{people.map((person) => <Pressable key={person.id} onPress={() => router.push({ pathname: "/person/[id]", params: { id: person.id } })} style={styles.actionTile}><Avatar name={person.name} size={38} /><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{person.name}</Text><Text style={styles.caption}>@{person.username} · {person.town}</Text></View><Text style={styles.link}>View</Text></Pressable>)}</> : null}
      {type === "All" || type === "Products" ? <><SectionTitle title={`Products (${products.length})`} /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>{products.map((product) => <ProductCard key={product.id} product={product} />)}</ScrollView></> : null}
      {type === "All" || type === "Services" ? <><SectionTitle title={`Services (${services.length})`} />{services.map((service) => <View key={service.id} style={[styles.card, { padding: 13, gap: 4 }]}><Text style={styles.cardTitle}>{service.name}</Text><Text style={styles.caption}>{service.priceLabel} · {service.location}</Text></View>)}</> : null}
      {type === "All" || type === "Stories" ? <><SectionTitle title={`Founder stories (${stories.length})`} />{stories.map((story) => <Pressable key={story.id} accessibilityRole="button" onPress={() => router.push({ pathname: "/story/[id]", params: { id: story.id } })} style={styles.actionTile}><Ionicons name="book-outline" size={20} color={colors.emerald} /><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{story.title}</Text><Text style={styles.caption}>{story.category} · {story.durationMinutes} min</Text></View></Pressable>)}</> : null}
      {type === "Posts" ? <><SectionTitle title={`Posts (${posts.length})`} />{posts.map((post) => <PostCard key={post.id} post={post} />)}</> : null}
      {type === "Videos" ? <><SectionTitle title={`Videos (${videos.length})`} />{videos.map((post) => <Pressable key={post.id} accessibilityRole="button" onPress={() => router.push("/videos")} style={styles.actionTile}><Text style={[styles.body, { flex: 1 }]}>{post.caption}</Text><Text style={styles.link}>Watch</Text></Pressable>)}</> : null}
      {type === "All" ? <><SectionTitle title={`Recent posts (${posts.length})`} />{posts.slice(0, 4).map((post) => <PostCard key={post.id} post={post} />)}</> : null}
      {!hasSelectedResults ? <EmptyState title={type === "All" ? "No results found" : `No ${type.toLowerCase()} found`} detail="Try another name or category, or clear your search to start again." icon="search-outline" action="Clear search" onAction={() => { setQuery(""); setType("All"); }} /> : null}
    </>}
  </Page>;
}
