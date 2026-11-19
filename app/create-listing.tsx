import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Platform, Text, View } from "react-native";
import { Button, Chip, ConfirmModal, Field, LocalNote, MediaImage, Page, TopBar, styles } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { useClock } from "@/hooks/use-clock";
import { colors } from "@/theme/tokens";
import type { BusinessEvent, BusinessOffer, CommunityOpportunity } from "@/types/domain";
import { getBusinessOfferStatus } from "@/utils/business-offer-status";
import { newLocalId } from "@/utils/ids";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { useThemeContext } from "@/lib/theme-provider";

type ListingKind = "offer" | "event" | "opportunity";
const OFFER_TYPES: BusinessOffer["kind"][] = ["discount", "limited-time", "seasonal", "bundle", "coupon", "free-delivery", "clearance", "special-deal"];
const EVENT_TYPES: BusinessEvent["category"][] = ["networking", "workshop", "training", "meetup", "launch", "webinar", "promotion", "entrepreneurship"];
const OPPORTUNITY_TYPES: CommunityOpportunity["category"][] = ["idea", "startup", "partnership", "collaboration", "investment", "supplier", "distributor", "franchise", "mentorship-request", "mentorship-offer", "job", "advice", "market-gap", "feedback"];
function tell(message: string, detail?: string) { const content = detail ? `${message}\n\n${detail}` : message; if (Platform.OS === "web") window.alert(content); else Alert.alert(detail ? message : "Check details", detail ?? message); }
function parseLocalDate(value: string): string | undefined { const parsed = new Date(value.trim()); return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString(); }
function titleCase(value: string) { return value.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }

export default function CreateListingScreen() {
  useThemeContext();
  const app = useAppStore();
  const clockNow = useClock(30_000);
  const { kind: requestedKind, offerId, eventId, opportunityId } = useLocalSearchParams<{ kind?: string; offerId?: string; eventId?: string; opportunityId?: string }>();
  const kind: ListingKind = requestedKind === "offer" || requestedKind === "event" || requestedKind === "opportunity" ? requestedKind : "opportunity";
  const existingOffer = kind === "offer" ? app.businessOffers.find((item) => item.id === offerId) : undefined;
  const existingEvent = kind === "event" ? app.businessEvents.find((item) => item.id === eventId) : undefined;
  const existingOpportunity = kind === "opportunity" ? app.communityOpportunities.find((item) => item.id === opportunityId) : undefined;
  const existing = existingOffer ?? existingEvent ?? existingOpportunity;
  const localDateInput = (value?: string) => value ? value.slice(0, 16) : "";
  const [identityId, setIdentityId] = useState(existingEvent?.identityId ?? existingOpportunity?.identityId ?? existingOffer?.businessId ?? app.activeBusinessId ?? app.user.id);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [category, setCategory] = useState<string>(existingOffer?.kind ?? existingEvent?.category ?? existingOpportunity?.category ?? (kind === "offer" ? OFFER_TYPES[0] : kind === "event" ? EVENT_TYPES[0] : OPPORTUNITY_TYPES[0]));
  const [image, setImage] = useState<string | undefined>(existingOffer?.image ?? existingEvent?.cover ?? existingOpportunity?.image);
  const [startDate, setStartDate] = useState(localDateInput(existingOffer?.startsAt ?? existingEvent?.startsAt));
  const [endDate, setEndDate] = useState(localDateInput(existingOffer?.expiresAt ?? existingEvent?.endsAt ?? existingOpportunity?.expiresAt));
  const [location, setLocation] = useState(existingEvent?.online ? existingEvent.location.replace(/^Online · /, "") : existingEvent?.location ?? existingOpportunity?.location ?? `${app.user.town}, ${app.user.county}`);
  const [price, setPrice] = useState(existingOffer?.originalPrice?.toString() ?? "");
  const [discountPrice, setDiscountPrice] = useState(existingOffer?.discountedPrice?.toString() ?? "");
  const [associatedProductId, setAssociatedProductId] = useState(existingOffer?.productId ?? "");
  const [associatedServiceId, setAssociatedServiceId] = useState(existingOffer?.serviceId ?? "");
  const [terms, setTerms] = useState(existingOffer?.terms ?? existingEvent?.registrationInstructions ?? "");
  const [requirements, setRequirements] = useState(existingOpportunity?.requirements ?? "");
  const [contact, setContact] = useState(existingEvent?.contact ?? existingOpportunity?.contactInstructions ?? app.user.phone ?? "");
  const [online, setOnline] = useState(existingEvent?.online ?? false);
  const [disclosure, setDisclosure] = useState(existingOpportunity?.investmentDisclosure ?? "");
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const businesses = app.businesses.filter((business) => business.ownerId === app.user.id || business.team.some((member) => member.userId === app.user.id));
  const business = businesses.find((item) => item.id === identityId);
  const identityKind = business ? "business" as const : "personal" as const;
  const snapshotKey = JSON.stringify({ identityId, title, description, category, image, startDate, endDate, location, price, discountPrice, associatedProductId, associatedServiceId, terms, requirements, contact, online, disclosure });
  const unsaved = useUnsavedChanges(snapshotKey);

  const chooseImage = async () => {
    try {
      const Picker = await import("expo-image-picker");
      const permission = await Picker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return tell("Allow access to your library to choose a cover image.");
      const result = await Picker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, quality: 0.75 });
      if (!result.canceled && result.assets[0]) setImage(result.assets[0].uri);
    } catch { tell("Image selection is unavailable here. You can still save this listing without an image."); }
  };

  const save = (confirmed = false) => {
    if (!app.isAuthenticated) { router.push("/auth/login"); return; }
    if (!title.trim() || description.trim().length < 8) return tell("Add a title and a description of at least 8 characters.");
    if (kind === "offer") {
      if (!business) return tell("Offers must be associated with a business you manage. Select a business identity first.");
      const startsAt = parseLocalDate(startDate); const expiresAt = parseLocalDate(endDate);
      if (!startsAt || !expiresAt || expiresAt <= startsAt) return tell("Enter a valid start date and expiry date after the start. Use YYYY-MM-DD or an ISO date/time.");
      if (new Date(expiresAt).getTime() <= clockNow) return tell("Offer expiry must be in the future.", "Choose a future expiry date so the offer is not saved with an incorrect active status.");
      const originalPrice = price.trim() ? Number(price) : undefined; const discountedPrice = discountPrice.trim() ? Number(discountPrice) : undefined;
      if ((price.trim() && (!Number.isFinite(originalPrice) || originalPrice! < 0)) || (discountPrice.trim() && (!Number.isFinite(discountedPrice) || discountedPrice! < 0)) || (originalPrice !== undefined && discountedPrice !== undefined && discountedPrice > originalPrice)) return tell("Check the offer prices", "Use non-negative KSh prices, and ensure the offer price does not exceed the original price.");
      if (!confirmed) { setConfirmSave(true); return; }
      setBusy(true);
      const offer: BusinessOffer = { id: existingOffer?.id ?? newLocalId("offer"), businessId: business.id, title: title.trim(), description: description.trim(), kind: category as BusinessOffer["kind"], image, originalPrice, discountedPrice, startsAt, expiresAt, terms: terms.trim(), ...(associatedProductId ? { productId: associatedProductId } : {}), ...(associatedServiceId ? { serviceId: associatedServiceId } : {}), status: getBusinessOfferStatus(startsAt, expiresAt, clockNow), createdAt: existingOffer?.createdAt ?? new Date().toISOString() };
      if (existingOffer) app.updateBusinessOffer(offer.id, offer); else app.addBusinessOffer(offer);
      unsaved.markSaved(); setBusy(false); setConfirmSave(false); tell("Offer saved on this device only. It is not advertised, redeemable, or available to other users."); router.replace("/offers"); return;
    }
    if (kind === "event") {
      const startsAt = parseLocalDate(startDate);
      if (!startsAt || new Date(startsAt).getTime() <= new Date().getTime()) return tell("Enter a valid future event date/time. Use YYYY-MM-DD or an ISO date/time.");
      const endsAt = endDate.trim() ? parseLocalDate(endDate) : undefined;
      if (endDate.trim() && (!endsAt || endsAt <= startsAt)) return tell("Check the event end time", "The optional end date/time must be valid and later than the event start.");
      if (!location.trim() || !contact.trim()) return tell("Add a location/online venue and contact or registration instructions.");
      if (!confirmed) { setConfirmSave(true); return; }
      setBusy(true);
      const event: BusinessEvent = { id: existingEvent?.id ?? newLocalId("event"), identityKind, identityId: business?.id ?? app.user.id, title: title.trim(), description: description.trim(), category: category as BusinessEvent["category"], startsAt, ...(endsAt ? { endsAt } : {}), location: online ? `Online · ${location.trim()}` : location.trim(), online, registrationInstructions: terms.trim(), contact: contact.trim(), cover: image, createdAt: existingEvent?.createdAt ?? new Date().toISOString() };
      if (existingEvent) app.updateBusinessEvent(event.id, event); else app.addBusinessEvent(event);
      unsaved.markSaved(); setBusy(false); setConfirmSave(false); tell("Event saved locally. It is not listed in a shared event discovery service."); router.replace("/events"); return;
    }
    if ((category === "investment") && !disclosure.trim()) return tell("Investment-related listings require an explicit disclosure. Do not promise returns or imply guaranteed results.");
    const opportunityExpiry = endDate.trim() ? parseLocalDate(endDate) : undefined;
    if (endDate.trim() && !opportunityExpiry) return tell("Check the expiry date", "Enter a valid date/time or leave the optional expiry blank. The date was not saved.");
    if (!confirmed) { setConfirmSave(true); return; }
    setBusy(true);
    const opportunity: CommunityOpportunity = { id: existingOpportunity?.id ?? newLocalId("community-opportunity"), identityKind, identityId: business?.id ?? app.user.id, title: title.trim(), description: description.trim(), category: category as CommunityOpportunity["category"], location: location.trim(), requirements: requirements.trim(), contactInstructions: contact.trim(), image, ...(opportunityExpiry ? { expiresAt: opportunityExpiry } : {}), ...(category === "investment" ? { investmentDisclosure: disclosure.trim() } : {}), createdAt: existingOpportunity?.createdAt ?? new Date().toISOString() };
    if (existingOpportunity) app.updateCommunityOpportunity(opportunity.id, opportunity); else app.addCommunityOpportunity(opportunity);
    unsaved.markSaved(); setBusy(false); setConfirmSave(false); tell("Opportunity saved locally. Other users cannot see or respond to it."); router.replace("/menu/activity/opportunities");
  };

  if (!app.isAuthenticated) return <Page><TopBar title={`Create ${kind}`} back /><Button title="Sign in to create" icon="log-in-outline" onPress={() => router.push("/auth/login")} /></Page>;
  const kinds = kind === "offer" ? OFFER_TYPES : kind === "event" ? EVENT_TYPES : OPPORTUNITY_TYPES;
  return <Page>
    <TopBar title={`${existing ? "Edit" : kind === "offer" ? "Create" : kind === "event" ? "Create" : "Publish"} ${kind}`} back />
    <View style={{ backgroundColor: colors.navy, borderRadius: 20, padding: 17, gap: 7 }}><Text style={{ color: colors.orange, fontWeight: "800", fontSize: 11, letterSpacing: 1 }}>{kind.toUpperCase()} · LOCAL DEMO</Text><Text style={{ color: colors.white, fontSize: 21, fontWeight: "800" }}>{kind === "offer" ? "Share a clear deal." : kind === "event" ? "Bring people together." : "Put an opportunity in motion."}</Text><Text style={{ color: "#D9E2E9", lineHeight: 19 }}>Review every detail. This local demo does not publish to a shared service.</Text></View>
    <LocalNote text="Saved only on this device · no public listing, notifications, registration or redemption" />
    <Text style={styles.label}>Publish as</Text>{existingEvent ? <Text style={styles.caption}>Event identity is fixed at creation. This editor does not reassign it.</Text> : null}<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}><Chip label={`Personal · ${app.user.name}`} selected={!business} onPress={() => { if (!existingEvent) setIdentityId(app.user.id); }} />{businesses.map((item) => <Chip key={item.id} label={item.name} selected={item.id === business?.id} onPress={() => { if (!existingEvent) setIdentityId(item.id); }} />)}</View>
    <Field label="Title" value={title} onChangeText={setTitle} placeholder={kind === "offer" ? "e.g. Weekend bundle offer" : kind === "event" ? "e.g. Founder networking breakfast" : "e.g. Local supplier partnership"} maxLength={100} />
    <Text style={styles.label}>Category</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>{kinds.map((item) => <Chip key={item} label={titleCase(item)} selected={category === item} onPress={() => setCategory(item)} />)}</View>
    <Field label="Description" value={description} onChangeText={setDescription} placeholder="Useful details, who it is for, and what is involved" multiline maxLength={1500} />
    <Button title={image ? "Change cover image" : "Choose cover image"} icon="image-outline" variant="outline" onPress={() => void chooseImage()} />{image ? <MediaImage uri={image} height={180} label={title || "Cover image"} /> : null}
    {kind === "offer" ? <><Text style={styles.label}>Associated product or service (optional)</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}><Chip label="General offer" selected={!associatedProductId && !associatedServiceId} onPress={() => { setAssociatedProductId(""); setAssociatedServiceId(""); }} />{business?.products.map((item) => <Chip key={item.id} label={`Product · ${item.name}`} selected={associatedProductId === item.id} onPress={() => { setAssociatedProductId(item.id); setAssociatedServiceId(""); }} />)}{business?.services.map((item) => <Chip key={item.id} label={`Service · ${item.name}`} selected={associatedServiceId === item.id} onPress={() => { setAssociatedServiceId(item.id); setAssociatedProductId(""); }} />)}</View><Field label="Starts at · YYYY-MM-DD or ISO date/time" value={startDate} onChangeText={setStartDate} placeholder="2026-12-01T09:00" /><Field label="Expires at · YYYY-MM-DD or ISO date/time" value={endDate} onChangeText={setEndDate} placeholder="2026-12-10T23:59" /><View style={styles.row}><View style={{ flex: 1 }}><Field label="Original price · KSh (optional)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" /></View><View style={{ flex: 1 }}><Field label="Offer price · KSh (optional)" value={discountPrice} onChangeText={setDiscountPrice} keyboardType="decimal-pad" /></View></View><Field label="Terms and conditions" value={terms} onChangeText={setTerms} placeholder="Eligibility, redemption, and exclusions" multiline /><Text style={styles.caption}>The local demo records dates/status, but does not create coupons, take payments, or guarantee redemption.</Text></> : null}
    {kind === "event" ? <><Field label="Date and time · YYYY-MM-DD or ISO date/time" value={startDate} onChangeText={setStartDate} placeholder="2026-12-01T09:00" /><Field label="End date/time (optional)" value={endDate} onChangeText={setEndDate} placeholder="2026-12-01T12:00" /><Text style={styles.label}>Format</Text><View style={styles.row}><Chip label="In person" selected={!online} onPress={() => setOnline(false)} /><Chip label="Online" selected={online} onPress={() => setOnline(true)} /></View><Field label={online ? "Meeting link or online venue" : "Physical venue"} value={location} onChangeText={setLocation} placeholder="Town, venue, or secure meeting link" /><Field label="Registration instructions" value={terms} onChangeText={setTerms} placeholder="How should attendees register?" multiline /><Field label="Contact information" value={contact} onChangeText={setContact} placeholder="Phone, email or registration URL" /></> : null}
    {kind === "opportunity" ? <><Field label="Location" value={location} onChangeText={setLocation} placeholder="Town, county, Kenya-wide" /><Field label="Requirements and terms" value={requirements} onChangeText={setRequirements} placeholder="Experience, resources, eligibility" multiline /><Field label="Contact or enquiry instructions" value={contact} onChangeText={setContact} placeholder="How interested people can follow up" multiline /><Field label="Expiry date (optional) · YYYY-MM-DD" value={endDate} onChangeText={setEndDate} placeholder="2026-12-31" />{category === "investment" ? <><Field label="Investment disclosure (required)" value={disclosure} onChangeText={setDisclosure} placeholder="No guaranteed returns; describe risks, uncertainty, and due diligence plainly." multiline /><Text style={{ color: colors.warning, fontSize: 12, fontWeight: "700" }}>Never promise guaranteed returns. Investment listings remain subject to moderation and applicable restrictions.</Text></> : null}</> : null}
    {preview ? <View style={[styles.card, { padding: 13, gap: 8 }]}><View style={styles.row}><Ionicons name="eye-outline" size={18} color={colors.emeraldDark} /><Text style={styles.sectionHeading}>Preview</Text></View><Text style={styles.cardTitle}>{title || "Untitled"}</Text><Text style={styles.caption}>{titleCase(category)} · {business?.name ?? app.user.name}</Text>{image ? <MediaImage uri={image} height={155} label="Listing preview" /> : null}<Text style={styles.body}>{description || "Description"}</Text>{startDate ? <Text style={styles.caption}>{startDate}{endDate ? ` · until ${endDate}` : ""}</Text> : null}<Text style={styles.caption}>{location}</Text></View> : null}
    <View style={styles.row}><Button title={preview ? "Hide preview" : "Preview"} icon="eye-outline" variant="outline" onPress={() => setPreview((value) => !value)} /><Button title={busy ? "Saving…" : existing ? "Review changes" : "Review and save locally"} icon="save-outline" disabled={busy || clockNow === 0} onPress={() => save()} /></View>
    <ConfirmModal visible={confirmSave} title={`Save ${kind} on this device?`} detail="Review the preview, then confirm. This is a local demo record only; it is not published, shared or sent to a server." confirmLabel="Save locally" onCancel={() => setConfirmSave(false)} onConfirm={() => save(true)} />
    <ConfirmModal visible={unsaved.confirmVisible} title="Discard unsaved changes?" detail="Your edits have not been saved. Leaving will discard them; the existing listing, if any, remains unchanged." confirmLabel="Discard changes" destructive onCancel={unsaved.stay} onConfirm={unsaved.discardAndLeave} />
  </Page>;
}
