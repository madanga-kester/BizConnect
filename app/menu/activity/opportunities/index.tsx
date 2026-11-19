import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Share, Text, View } from "react-native";
import { Button, Chip, ConfirmModal, LocalNote, Page, SectionTitle, TopBar, styles } from "@/components/biz-ui";
import { OPPORTUNITIES } from "@/data/seed";
import { useAppStore } from "@/hooks/use-app-store";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { colors } from "@/theme/tokens";
import { formatKes } from "@/utils/kenya";
import { useThemeContext } from "@/lib/theme-provider";

export default function OpportunitiesScreen() {
  useThemeContext();
  const app = useAppStore(); const requireAuth = useRequireAuth();
  const [deleteId, setDeleteId] = useState<string>();
  return <Page><TopBar title="Business ideas" back right={<Button title="Create" icon="add-outline" small onPress={() => router.push({ pathname: "/create-listing", params: { kind: "opportunity" } })} />} /><View style={{ backgroundColor: colors.navy, borderRadius: 21, padding: 17, gap: 8 }}><Text style={{ color: colors.orange, fontWeight: "800", fontSize: 11 }}>BUSINESS IDEAS & OPPORTUNITIES</Text><Text style={{ color: colors.white, fontSize: 22, fontWeight: "800", lineHeight: 28 }}>A practical first step, not a promise.</Text><Text style={{ color: "#D9E2E9", lineHeight: 20 }}>Explore starter ideas, skills, equipment and the questions to ask before you invest.</Text><Button title="Publish a community opportunity" icon="megaphone-outline" variant="soft" onPress={() => router.push({ pathname: "/create-listing", params: { kind: "opportunity" } })} /></View>
    <LocalNote text="Startup amounts are estimates. Tips and lessons are user-submitted or editorial and are not verified facts." />
    <SectionTitle title={`Device-only community listings · ${app.communityOpportunities.length}`} />
    {app.communityOpportunities.map((item) => <View key={item.id} style={[styles.card, { padding: 14, gap: 7 }]}><View style={styles.rowBetween}><Text style={[styles.sectionHeading, { flex: 1 }]}>{item.title}</Text><Chip label={item.category} /></View><Text style={styles.caption}>{item.location || "Location not set"} · {item.identityKind === "business" ? app.businesses.find((business) => business.id === item.identityId)?.name ?? "Business" : app.user.name}</Text><Text style={styles.body}>{item.description}</Text>{item.requirements ? <Text style={styles.caption}>Requirements: {item.requirements}</Text> : null}{item.contactInstructions ? <Text style={styles.caption}>Contact: {item.contactInstructions}</Text> : null}{item.category === "investment" ? <Text style={{ color: colors.warning, fontSize: 11, fontWeight: "700" }}>{item.investmentDisclosure}</Text> : null}<View style={styles.row}><Button title="Edit" icon="create-outline" small variant="outline" onPress={() => router.push({ pathname: "/create-listing", params: { kind: "opportunity", opportunityId: item.id } })} /><Button title="Delete" icon="trash-outline" small variant="danger" onPress={() => setDeleteId(item.id)} /></View><Text style={styles.caption}>Private to this device · not discoverable or shared</Text></View>)}
    {app.communityOpportunities.length === 0 ? <Text style={styles.caption}>No device-only opportunity listings yet. Seeded idea examples appear below.</Text> : null}
    {OPPORTUNITIES.map((idea) => { const saved = app.savedOpportunities.includes(idea.id); return <View key={idea.id} style={[styles.card, { padding: 15, gap: 10 }]}>
      <View style={styles.rowBetween}><View style={{ flex: 1, gap: 3 }}><Text style={styles.sectionHeading}>{idea.title}</Text><Text style={styles.caption}>{idea.industry} · {idea.county}</Text></View><Button title={saved ? "Saved" : "Save"} icon={saved ? "bookmark" : "bookmark-outline"} variant="soft" small onPress={() => requireAuth(() => app.toggleOpportunitySave(idea.id))} /></View>
      <View style={{ backgroundColor: colors.orangeTint, borderRadius: 13, padding: 11, gap: 4 }}><Text style={{ color: colors.warning, fontSize: 11, fontWeight: "800" }}>ESTIMATED START-UP COST</Text><Text style={{ color: colors.navy, fontSize: 19, fontWeight: "800" }}>{formatKes(idea.startupCostMin)} – {formatKes(idea.startupCostMax)}</Text><Text style={styles.caption}>Indicative only. Actual prices, permits and compliance requirements vary by county, supplier and business model.</Text></View>
      <Text style={styles.body}>{idea.opportunity}</Text>
      <SectionTitle title="Start-up requirements" />{idea.requirements.map((item) => <View key={item} style={styles.row}><Ionicons name="checkmark-circle-outline" color={colors.emerald} size={17} /><Text style={[styles.body, { flex: 1 }]}>{item}</Text></View>)}
      <SectionTitle title="Equipment & resources" />{idea.equipment.map((item) => <Chip key={item} label={item} icon="construct-outline" />)}
      <SectionTitle title="Skills to build" />{idea.skills.map((item) => <Chip key={item} label={item} icon="school-outline" />)}
      <View style={[styles.card, { padding: 12, backgroundColor: colors.emeraldTint, gap: 6 }]}><Text style={styles.cardTitle}>Advice · {idea.sourceLabel}</Text><Text style={styles.body}>{idea.advice}</Text></View>
      <Button title="Share this idea" icon="share-social-outline" variant="outline" onPress={() => void Share.share({ message: `${idea.title}\nEstimated startup range: ${formatKes(idea.startupCostMin)}–${formatKes(idea.startupCostMax)}\n\n${idea.opportunity}\n\nEstimate and founder advice are not verified facts.` })} />
    </View>; })}
    <ConfirmModal visible={Boolean(deleteId)} title="Delete this opportunity?" detail="This removes the listing from this device only." confirmLabel="Delete locally" destructive onCancel={() => setDeleteId(undefined)} onConfirm={() => { if (deleteId) app.removeCommunityOpportunity(deleteId); setDeleteId(undefined); }} />
  </Page>;
}
