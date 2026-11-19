import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Alert, Platform, ScrollView, Text, View } from "react-native";
import { Button, Chip, Field, LoadingState, LocalNote, MediaImage, Page, SectionTitle, TopBar, styles } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { useMabizServices, useMabizServiceMode } from "@/lib/services/service-provider";
import { colors } from "@/theme/tokens";
import { KENYAN_COUNTIES, COUNTY_TOWNS, formatKes, isValidKenyanPhone } from "@/utils/kenya";
import type { Business, County } from "@/types/domain";
import { newLocalId } from "@/utils/ids";
import { useThemeContext } from "@/lib/theme-provider";

const KEY = "Mabiz-business-registration-draft";
const CATEGORIES = ["Fashion", "Food & restaurants", "Bakery & baked goods", "Natural hair salon", "Beauty & cosmetics", "Electronics", "Agriculture", "Furniture", "Construction", "Education", "Technology", "Transport", "Professional services", "Health & wellness", "Entertainment", "Home services", "Retail"];
interface Form { name: string; category: string; subcategory: string; description: string; about: string; originStory: string; founder: string; county: County; town: string; neighbourhood: string; serviceAreas: string; phone: string; whatsapp: string; email: string; website: string; logo: string; instagram: string; facebook: string; tiktok: string; operatingHours: string; businessType: "products" | "services" | "hybrid"; visibility: "public" | "private"; productName: string; productDescription: string; productPrice: string; serviceName: string; servicePrice: string; }
const EMPTY: Form = { name: "", category: "Fashion", subcategory: "", description: "", about: "", originStory: "", founder: "", county: "Nairobi", town: "Nairobi", neighbourhood: "", serviceAreas: "", phone: "", whatsapp: "", email: "", website: "", logo: "", instagram: "", facebook: "", tiktok: "", operatingHours: "", businessType: "hybrid", visibility: "public", productName: "", productDescription: "", productPrice: "", serviceName: "", servicePrice: "" };
function notify(title: string, message: string) { if (Platform.OS === "web") window.alert(`${title}\n\n${message}`); else Alert.alert(title, message); }
function formFromBusiness(business: Business): Form {
  return { ...EMPTY, name: business.name, category: business.category, subcategory: business.subcategory, description: business.description, about: business.about, originStory: business.originStory, founder: business.founder, county: business.county, town: business.town, neighbourhood: business.neighbourhood, serviceAreas: business.serviceAreas.join(", "), phone: business.phone, whatsapp: business.whatsapp, email: business.email, website: business.website ?? "", logo: business.logo ?? "", instagram: business.socialLinks?.instagram ?? "", facebook: business.socialLinks?.facebook ?? "", tiktok: business.socialLinks?.tiktok ?? "", businessType: business.businessType ?? "hybrid", visibility: business.visibility ?? "public", operatingHours: business.operatingHours ?? "", productName: business.products[0]?.name ?? "", productDescription: business.products[0]?.description ?? "", productPrice: business.products[0] ? String(business.products[0].price) : "", serviceName: business.services[0]?.name ?? "", servicePrice: business.services[0]?.priceLabel ?? "" };
}

export default function CreateBusinessScreen() {
  useThemeContext();
  const app = useAppStore();
  const { id } = useLocalSearchParams<{ id?: string }>();
  if (!app.hasHydrated) return <Page><TopBar title="Create a business" back /><LoadingState label="Preparing your business profile" /></Page>;
  return <BusinessForm key={id ?? "new-business"} app={app} id={id} />;
}

function BusinessForm({ app, id }: { app: ReturnType<typeof useAppStore>; id?: string }) {
  useThemeContext();
  const services = useMabizServices();
  const apiMode = useMabizServiceMode() === "api";
  const existing = app.businesses.find((business) => business.id === id);
  const [draftReady, setDraftReady] = useState(Boolean(existing));
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Form>(() => existing ? formFromBusiness(existing) : EMPTY);
  const [cover, setCover] = useState<string | undefined>(existing?.cover);
  const [busy, setBusy] = useState(false);
  const patch = (value: Partial<Form>) => setForm((s) => ({ ...s, ...value }));
  const draftKey = id ? `${KEY}:${id}` : KEY;
  useEffect(() => {
    if (existing) return;
    let active = true;
    void AsyncStorage.getItem(draftKey).then((raw) => {
      if (!active) return;
      if (raw) {
        try { const saved = JSON.parse(raw) as { form?: Partial<Form>; step?: number; cover?: string }; setForm({ ...EMPTY, ...saved.form }); setStep(saved.step ?? 1); setCover(saved.cover); }
        catch { notify("Draft could not be restored", "The saved business draft is unreadable. You can start a fresh profile."); }
      }
      setDraftReady(true);
    }).catch(() => { if (active) setDraftReady(true); });
    return () => { active = false; };
  }, [draftKey, existing]);
  useEffect(() => {
    if (!apiMode || !id || existing) return;
    let active = true;
    void services.businesses.get(id).then((result) => {
      if (!active) return;
      if (result.ok) { app.upsertApiBusiness(result.data); setForm(formFromBusiness(result.data)); setCover(result.data.cover); setDraftReady(true); }
      else { notify("Business could not be loaded", result.error.message); setDraftReady(true); }
    });
    return () => { active = false; };
  }, [apiMode, id, existing, services, app.upsertApiBusiness]);
  useEffect(() => { if (draftReady) void AsyncStorage.setItem(draftKey, JSON.stringify({ form, step, cover })); }, [draftKey, draftReady, form, step, cover]);
  const pickCover = async () => { try { const Picker = await import("expo-image-picker"); const p = await Picker.requestMediaLibraryPermissionsAsync(); if (!p.granted) return notify("Permission needed", "Allow access to choose a business photo from your device."); const result = await Picker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: true, aspect: [3, 2], quality: 0.72 }); if (!result.canceled) setCover(result.assets[0].uri); } catch { notify("Media unavailable", "You can complete the business profile without a cover photo."); } };
  const next = () => {
    if (step === 1 && (!form.name.trim() || !form.description.trim())) return notify("Complete the basics", "Add a business name and short description to continue.");
    if (step === 3 && form.productPrice && (!Number.isFinite(Number(form.productPrice)) || Number(form.productPrice) < 0)) return notify("Check the product price", "Enter a non-negative price in Kenyan shillings.");
    if (step === 5 && form.phone && !isValidKenyanPhone(form.phone)) return notify("Check the phone number", "Enter a valid Kenyan number such as +254 712 345 678.");
    setStep((s) => Math.min(6, s + 1));
  };
  const publish = async () => {
    if (!app.isAuthenticated) return router.push("/auth/login");
    if (existing && existing.ownerId !== app.user.id && !existing.team.some((member) => member.userId === app.user.id && (member.role === "Owner" || member.role === "Administrator" || member.role === "Content Manager"))) return notify("You cannot edit this business", "Your business role does not allow profile changes.");
    if (apiMode) {
      setBusy(true);
      const shared = {
        name: form.name.trim(), category: form.category, subcategory: form.subcategory.trim() || form.category,
        description: form.description.trim(), about: form.about.trim() || form.description.trim(),
        founder: form.founder.trim() || app.user.name, originStory: form.originStory.trim() || "The founder's story is still taking shape.",
        county: form.county, town: form.town, neighbourhood: form.neighbourhood.trim() || form.town,
        serviceAreas: form.serviceAreas.split(",").map((item) => item.trim()).filter(Boolean),
        phone: form.phone.trim() || undefined, whatsapp: form.whatsapp.trim() || undefined,
        email: form.email.trim() || undefined, website: form.website.trim() || undefined,
        socialLinks: Object.fromEntries([["instagram", form.instagram], ["facebook", form.facebook], ["tiktok", form.tiktok]].filter(([, value]) => value.trim()).map(([key, value]) => [key, value.trim()])),
        priceRange: "KSh KSh" as const, operatingHours: form.operatingHours.trim() || "Hours not listed yet",
        businessType: form.businessType, visibility: form.visibility, logo: form.logo.trim() || undefined,
        ...(cover && /^https?:\/\//i.test(cover) ? { cover } : {}),
      };
      const result = existing ? await services.businesses.update(existing.id, shared) : await services.businesses.create(shared);
      setBusy(false);
      if (!result.ok) return notify("Business was not saved", result.error.message);
      app.upsertApiBusiness(result.data);
      await AsyncStorage.removeItem(draftKey);
      notify(existing ? "Business profile updated" : "Business profile created", "The Mabiz API saved your business profile.");
      router.replace({ pathname: "/business/[id]", params: { id: result.data.id } });
      return;
    }

    const now = new Date().toISOString();
    const businessId = existing?.id ?? newLocalId("business");
    const newBusiness: Business = {
      id: businessId, ownerId: existing?.ownerId ?? app.user.id, name: form.name.trim(), slug: form.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-"), category: form.category, subcategory: form.subcategory || form.category, description: form.description.trim(), about: form.about.trim() || form.description.trim(), founder: form.founder.trim() || app.user.name, founderId: existing?.founderId ?? app.user.id, originStory: form.originStory.trim() || "The founder's story is still taking shape.", county: form.county, town: form.town, neighbourhood: form.neighbourhood || form.town, serviceAreas: form.serviceAreas.split(",").map((x) => x.trim()).filter(Boolean), phone: form.phone, whatsapp: form.whatsapp || form.phone, email: form.email, ...(form.website ? { website: form.website } : {}), socialLinks: Object.fromEntries([["instagram", form.instagram], ["facebook", form.facebook], ["tiktok", form.tiktok]].filter(([, value]) => value.trim()).map(([key, value]) => [key, value.trim()])), businessType: form.businessType, visibility: form.visibility, priceRange: "KSh KSh", rating: existing?.rating ?? 0, followers: existing?.followers ?? 0, verified: existing?.verified ?? false, verificationStatus: existing?.verificationStatus ?? "not_requested", verificationHistory: existing?.verificationHistory ?? [], cover, logo: form.logo.trim() || existing?.logo || form.name.slice(0, 2).toUpperCase(), operatingHours: form.operatingHours.trim() || existing?.operatingHours || "Hours not listed yet", joinedAt: now, team: existing?.team ?? [{ userId: app.user.id, role: "Owner", joinedAt: now, displayName: app.user.name, email: "owner@example.com" }], products: form.productName.trim() ? [{ ...(existing?.products[0] ?? {}), id: existing?.products[0]?.id ?? newLocalId("product"), businessId, name: form.productName, description: form.productDescription, price: Number(form.productPrice) || 0, availability: existing?.products[0]?.availability ?? "Available", location: `${form.town}, ${form.county}`, image: cover ?? existing?.products[0]?.image, category: form.category }, ...(existing?.products.slice(1) ?? [])] : existing?.products ?? [], services: form.serviceName.trim() ? [{ ...(existing?.services[0] ?? {}), id: existing?.services[0]?.id ?? newLocalId("service"), businessId, name: form.serviceName, description: existing?.services[0]?.description ?? form.description, priceLabel: form.servicePrice || "Contact for a quote", location: `${form.town}, ${form.county}`, category: form.category }, ...(existing?.services.slice(1) ?? [])] : existing?.services ?? [], milestones: existing?.milestones ?? [], analytics: existing?.analytics ?? { profileViews: 0, postEngagement: 0, followersThisMonth: 0, videoViews: 0, productViews: 0, enquiries: 0 },
    };
    newBusiness.products = newBusiness.products.map((product) => ({ ...product, businessId: newBusiness.id }));
    newBusiness.services = newBusiness.services.map((service) => ({ ...service, businessId: newBusiness.id }));
    setBusy(true); await new Promise((resolve) => setTimeout(resolve, 250)); if (existing) app.updateBusiness(newBusiness.id, newBusiness, ["Owner", "Administrator", "Content Manager"]); else app.addBusiness(newBusiness); await AsyncStorage.removeItem(draftKey); setBusy(false); notify(existing ? "Business profile updated locally" : "Profile saved locally", "Changes are stored on this device only; they have not been published to a server."); router.replace({ pathname: "/business/[id]", params: { id: newBusiness.id } });
  };
  const stepNames = ["Basics", "Our story", "Offerings", "Location", "Contact", "Preview"];
  return <Page>
    <TopBar title={existing ? "Edit business profile" : "Create a business"} back />
    <LocalNote text={apiMode ? "API mode · this form saves business profiles to the Mabiz C# backend." : "Your six-step profile changes are stored on this device. Nothing is published to a server."} />
    <View style={styles.rowBetween}><Text style={styles.sectionHeading}>Step {step} of 6</Text><Text style={styles.caption}>{stepNames[step - 1]}</Text></View>
    <View style={{ height: 5, borderRadius: 5, backgroundColor: colors.border, overflow: "hidden" }}><View style={{ width: `${step / 6 * 100}%`, height: 5, backgroundColor: colors.emerald }} /></View>
    {step === 1 ? <View style={{ gap: 13 }}><Field label="Business name" value={form.name} onChangeText={(name) => patch({ name })} placeholder="e.g. Tawi Studio" /><Text style={styles.label}>Business type</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>{(["products", "services", "hybrid"] as const).map((item) => <Chip key={item} label={item[0].toUpperCase() + item.slice(1)} selected={form.businessType === item} onPress={() => patch({ businessType: item })} />)}</View><Text style={styles.label}>Category</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>{CATEGORIES.map((item) => <Chip key={item} label={item} selected={form.category === item} onPress={() => patch({ category: item })} />)}</View><Field label="Subcategory" value={form.subcategory} onChangeText={(subcategory) => patch({ subcategory })} placeholder="A little more detail" /><Field label="Short description" value={form.description} onChangeText={(description) => patch({ description })} placeholder="What do you offer, and what makes it yours?" multiline /><Button title={cover ? "Change cover photo" : "Choose cover photo"} icon="image-outline" variant="soft" onPress={() => void pickCover()} />{cover ? <MediaImage uri={cover} height={155} label="Business cover preview" /> : null}</View> : null}
    {step === 2 ? <View style={{ gap: 13 }}><Field label="How did the business start?" value={form.originStory} onChangeText={(originStory) => patch({ originStory })} placeholder="Share the moment or need that started it…" multiline /><Field label="Why did you decide to start?" value={form.about} onChangeText={(about) => patch({ about })} placeholder="What purpose or gap did you see?" multiline /><Field label="Founder information" value={form.founder} onChangeText={(founder) => patch({ founder })} placeholder={app.user.name} /><Text style={styles.caption}>Your story can be updated later. Founder accounts are not automatically independently verified.</Text></View> : null}
    {step === 3 ? <View style={{ gap: 12 }}><SectionTitle title="Add a product" /><Field label="Product name" value={form.productName} onChangeText={(productName) => patch({ productName })} placeholder="Optional" /><Field label="Product description" value={form.productDescription} onChangeText={(productDescription) => patch({ productDescription })} placeholder="What should customers know?" multiline /><Field label="Price in KSh" value={form.productPrice} onChangeText={(productPrice) => patch({ productPrice })} placeholder="e.g. 2400" keyboardType="numeric" /><SectionTitle title="Add a service" /><Field label="Service name" value={form.serviceName} onChangeText={(serviceName) => patch({ serviceName })} placeholder="Optional" /><Field label="Price or range" value={form.servicePrice} onChangeText={(servicePrice) => patch({ servicePrice })} placeholder="e.g. From KSh 1,500" /><Text style={styles.caption}>Add availability, details and more items after saving.</Text></View> : null}
    {step === 4 ? <View style={{ gap: 12 }}><Text style={styles.label}>County</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7 }}>{KENYAN_COUNTIES.map((county) => <Chip key={county} label={county} selected={form.county === county} onPress={() => patch({ county, town: COUNTY_TOWNS[county][0] })} />)}</ScrollView><Text style={styles.label}>Town</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7 }}>{COUNTY_TOWNS[form.county].map((town) => <Chip key={town} label={town} selected={form.town === town} onPress={() => patch({ town })} />)}</ScrollView><Field label="Neighbourhood" value={form.neighbourhood} onChangeText={(neighbourhood) => patch({ neighbourhood })} placeholder="e.g. Kilimani" /><Field label="Service areas" value={form.serviceAreas} onChangeText={(serviceAreas) => patch({ serviceAreas })} placeholder="Separate areas with commas" /><Text style={styles.caption}>This is a public business service area. Precise personal location is never displayed.</Text></View> : null}
    {step === 5 ? <View style={{ gap: 12 }}><Field label="Business phone" value={form.phone} onChangeText={(phone) => patch({ phone })} placeholder="+254 712 345 678" keyboardType="phone-pad" /><Field label="WhatsApp" value={form.whatsapp} onChangeText={(whatsapp) => patch({ whatsapp })} placeholder="Same as business phone" keyboardType="phone-pad" /><Field label="Business email" value={form.email} onChangeText={(email) => patch({ email })} placeholder="hello@example.com" keyboardType="email-address" autoCapitalize="none" /><Field label="Website" value={form.website} onChangeText={(website) => patch({ website })} placeholder="https://… (optional)" autoCapitalize="none" /><Field label="Logo image URL" value={form.logo} onChangeText={(logo) => patch({ logo })} placeholder="https://… (optional)" autoCapitalize="none" /><Field label="Hosted cover image URL" value={cover ?? ""} onChangeText={(value) => setCover(value || undefined)} placeholder="https://… (optional)" autoCapitalize="none" /><Field label="Instagram URL" value={form.instagram} onChangeText={(instagram) => patch({ instagram })} placeholder="https://instagram.com/…" autoCapitalize="none" /><Field label="Facebook URL" value={form.facebook} onChangeText={(facebook) => patch({ facebook })} placeholder="https://facebook.com/…" autoCapitalize="none" /><Field label="TikTok URL" value={form.tiktok} onChangeText={(tiktok) => patch({ tiktok })} placeholder="https://tiktok.com/@…" autoCapitalize="none" /><Field label="Operating hours" value={form.operatingHours} onChangeText={(operatingHours) => patch({ operatingHours })} placeholder="e.g. Mon–Sat, 9am–6pm" /><Text style={styles.label}>Profile visibility</Text><View style={{ flexDirection: "row", gap: 8 }}><Button title="Public" small variant={form.visibility === "public" ? "soft" : "outline"} onPress={() => patch({ visibility: "public" })} /><Button title="Private" small variant={form.visibility === "private" ? "soft" : "outline"} onPress={() => patch({ visibility: "private" })} /></View><Text style={styles.caption}>{apiMode ? "API mode stores URL references only. A device photo chosen earlier is a local preview and is not uploaded to a server." : "Products and services can be expanded from business catalogue management."}</Text></View> : null}
    {step === 6 ? <View style={{ gap: 11 }}><SectionTitle title="Preview your profile" /><View style={styles.card}><MediaImage uri={cover} height={150} label={form.category} /><View style={{ padding: 14, gap: 8 }}><Text style={styles.sectionHeading}>{form.name}</Text><Text style={styles.caption}>{form.category} · {form.neighbourhood || form.town}, {form.county}</Text><Text style={styles.body}>{form.description}</Text><Text style={styles.body}>{form.about || form.originStory}</Text>{form.productName ? <Text style={styles.caption}>{form.productName} · {formatKes(Number(form.productPrice) || 0)}</Text> : null}{form.serviceName ? <Text style={styles.caption}>{form.serviceName} · {form.servicePrice || "Contact for a quote"}</Text> : null}<Text style={styles.caption}>{form.phone} · {form.email}</Text></View></View><Text style={{ color: colors.warning, fontWeight: "700", fontSize: 12 }}>Not verified · Verification is a separate request and is never automatic.</Text></View> : null}
    <View style={styles.rowBetween}><Button title="Save & continue later" icon="save-outline" variant="outline" small onPress={() => { void AsyncStorage.setItem(draftKey, JSON.stringify({ form, step, cover })); notify("Draft saved", "Continue this six-step business profile later from this device."); }} />{step > 1 ? <Button title="Back" variant="quiet" onPress={() => setStep((s) => s - 1)} /> : null}{step < 6 ? <Button title="Continue" icon="arrow-forward" onPress={next} /> : <Button title={busy ? "Saving…" : "Save business profile"} icon="checkmark" disabled={busy} onPress={() => void publish()} />}</View>
  </Page>;
}
