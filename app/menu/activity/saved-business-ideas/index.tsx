import { router } from "expo-router";
import { Text, View } from "react-native";
import { BusinessCard, Button, EmptyState, Page, SectionTitle, TopBar, styles } from "@/components/biz-ui";
import { OPPORTUNITIES } from "@/data/seed";
import { useAppStore } from "@/hooks/use-app-store";
import { useThemeContext } from "@/lib/theme-provider";
import { colors } from "@/theme/tokens";
import { formatKes } from "@/utils/kenya";
import { filterVisibleBusinesses } from "@/utils/privacy-policy";

export default function SavedBusinessIdeasScreen() {
  useThemeContext();
  const app = useAppStore();
  const businesses = filterVisibleBusinesses(app.businesses, app.blockedUsers).filter((business) =>
    app.savedBusinesses.includes(business.id)
  );
  const ideas = OPPORTUNITIES.filter((item) => app.savedOpportunities.includes(item.id));

  if (!app.isAuthenticated) {
    return (
      <Page>
        <TopBar title="Business ideas & opportunities" back />
        <EmptyState
          title="Sign in to see your saved items"
          detail="Your saved businesses and ideas are personal to this local demo profile."
          icon="lock-closed-outline"
          action="Sign in"
          onAction={() => router.push("/auth/login")}
        />
      </Page>
    );
  }

  return (
    <Page>
      <TopBar title="Business ideas & opportunities" back />

      <SectionTitle title={`Saved businesses (${businesses.length})`} />
      {businesses.length ? (
        businesses.map((business) => <BusinessCard key={business.id} business={business} />)
      ) : (
        <EmptyState
          title="No saved businesses"
          detail="Bookmark a business profile to keep it here."
          icon="storefront-outline"
          action="Discover businesses"
          onAction={() => router.push("/(tabs)/discover")}
        />
      )}

      <SectionTitle title={`Saved opportunities (${ideas.length})`} />
      {ideas.length ? (
        ideas.map((idea) => (
          <View key={idea.id} style={[styles.card, { padding: 14, gap: 8 }]}>
            <Text style={styles.cardTitle}>{idea.title}</Text>
            <Text style={styles.caption}>
              {idea.industry} | {idea.county}
            </Text>
            <Text style={{ color: colors.emeraldDark, fontWeight: "800" }}>
              {formatKes(idea.startupCostMin)} to {formatKes(idea.startupCostMax)} estimated
            </Text>
            <Text style={styles.caption}>Cost range is an estimate, not a verified fact.</Text>
            <Button
              title="Remove from saved"
              icon="bookmark"
              variant="soft"
              small
              onPress={() => app.toggleOpportunitySave(idea.id)}
            />
          </View>
        ))
      ) : (
        <EmptyState
          title="No saved opportunities"
          detail="Save a business idea to return to it here."
          icon="bulb-outline"
        />
      )}

      <Button
        title="Browse business ideas"
        icon="bulb-outline"
        variant="outline"
        onPress={() => router.push("/menu/activity/opportunities")}
      />
    </Page>
  );
}