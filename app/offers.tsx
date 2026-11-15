import { router } from "expo-router";
import { useState } from "react";
import { Button, ConfirmModal, EmptyState, LocalNote, MediaImage, Page, SectionTitle, TopBar, styles } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { useClock } from "@/hooks/use-clock";
import { Text, View } from "react-native";
import { colors } from "@/theme/tokens";

export default function OffersScreen() {
  const app = useAppStore();
  const now = useClock();
  const [removeId, setRemoveId] = useState<string>();
  const [archiveId, setArchiveId] = useState<string>();
  const offers = [...app.businessOffers].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const archive = () => { if (archiveId) app.updateBusinessOffer(archiveId, { status: "archived" }); setArchiveId(undefined); };
  const remove = () => { if (removeId) app.removeBusinessOffer(removeId); setRemoveId(undefined); };
  return <Page><TopBar title="Business offers" back right={<Button title="Create" icon="add-outline" small onPress={() => router.push({ pathname: "/create-listing", params: { kind: "offer" } })} />} />
    <View style={{ borderRadius: 20, backgroundColor: colors.navy, padding: 17, gap: 7 }}><Text style={{ color: colors.orange, fontSize: 11, fontWeight: "800", letterSpacing: 1 }}>OFFERS & PROMOTIONS</Text><Text style={{ color: colors.white, fontSize: 22, fontWeight: "800" }}>Make the terms easy to trust.</Text><Text style={{ color: "#D9E2E9", lineHeight: 19 }}>Discounts, bundles, seasonal offers and free-delivery notices.</Text></View>
    <LocalNote text="Device-only offer records · not advertised or redeemable · no price, stock or expiry enforcement" />
    <SectionTitle title={`Local offers · ${offers.length}`} />
    {!offers.length ? <EmptyState title="No offers saved" detail="Create an offer for a business profile you manage. It will remain on this device." icon="pricetags-outline" action="Create an offer" onAction={() => router.push({ pathname: "/create-listing", params: { kind: "offer" } })} /> : null}
    {offers.map((offer) => {
      const business = app.businesses.find((item) => item.id === offer.businessId);
      const derivedStatus = offer.status === "archived" ? "archived" : new Date(offer.expiresAt).getTime() <= now ? "expired" : new Date(offer.startsAt).getTime() > now ? "scheduled" : "active";
      return <View key={offer.id} style={[styles.card, { padding: 13, gap: 8 }]}>{offer.image ? <MediaImage uri={offer.image} height={155} label={offer.title} /> : null}<View style={styles.rowBetween}><Text style={[styles.sectionHeading, { flex: 1 }]}>{offer.title}</Text><Text style={{ color: derivedStatus === "active" ? colors.emeraldDark : colors.muted, fontWeight: "800", fontSize: 11 }}>{derivedStatus.toUpperCase()}</Text></View><Text style={styles.caption}>{business?.name ?? "Business"} · {offer.kind}</Text><Text style={styles.body}>{offer.description}</Text>{offer.originalPrice !== undefined || offer.discountedPrice !== undefined ? <Text style={styles.cardTitle}>{offer.originalPrice !== undefined ? `Was KSh ${offer.originalPrice.toLocaleString("en-KE")}` : ""}{offer.discountedPrice !== undefined ? ` · Now KSh ${offer.discountedPrice.toLocaleString("en-KE")}` : ""}</Text> : null}<Text style={styles.caption}>Starts {new Date(offer.startsAt).toLocaleString("en-KE")} · expires {new Date(offer.expiresAt).toLocaleString("en-KE")}</Text>{offer.terms ? <Text style={styles.caption}>Terms: {offer.terms}</Text> : null}<View style={styles.row}><Button title="Edit" icon="create-outline" small variant="outline" onPress={() => router.push({ pathname: "/create-listing", params: { kind: "offer", offerId: offer.id } })} /><Button title="Archive" icon="archive-outline" small variant="soft" disabled={derivedStatus === "archived"} onPress={() => setArchiveId(offer.id)} /><Button title="Delete" icon="trash-outline" small variant="danger" onPress={() => setRemoveId(offer.id)} /></View></View>;
    })}
    <ConfirmModal visible={Boolean(archiveId)} title="Archive this offer?" detail="It will remain in your local archive but will no longer be presented as an active offer in this demo." confirmLabel="Archive locally" onCancel={() => setArchiveId(undefined)} onConfirm={archive} />
    <ConfirmModal visible={Boolean(removeId)} title="Delete this offer?" detail="This removes the offer from this device only." confirmLabel="Delete locally" destructive onCancel={() => setRemoveId(undefined)} onConfirm={remove} />
  </Page>;
}
