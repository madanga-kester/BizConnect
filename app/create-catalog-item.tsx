import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Alert, Platform, Text, View } from "react-native";
import { Button, Chip, ConfirmModal, EmptyState, Field, LocalNote, MediaImage, Page, TopBar, VideoPreview, styles } from "@/components/biz-ui";
import { ApiCatalogItemEditor } from "@/components/api-catalog-screens";
import { useAppStore } from "@/hooks/use-app-store";
import { useBizConnectServiceMode } from "@/lib/services/service-provider";
import { colors } from "@/theme/tokens";
import { BUSINESS_CONTENT_ROLES } from "@/utils/business-permissions";
import { newLocalId } from "@/utils/ids";
import type { Product, Service } from "@/types/domain";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

function tell(title: string, message: string) { if (Platform.OS === "web") window.alert(`${title}\n\n${message}`); else Alert.alert(title, message); }

export default function CreateCatalogItemScreen() {
  const { kind: requestedKind, itemId } = useLocalSearchParams<{ kind?: string; itemId?: string }>();
  const kind = requestedKind === "service" ? "service" : "product";
  // API mode writes to the BizConnect catalogue; the local demo path below is unchanged.
  const apiMode = useBizConnectServiceMode() === "api";
  if (apiMode) return <ApiCatalogItemEditor kind={kind} itemId={itemId} />;
  return <MockCreateCatalogItemScreen kind={kind} itemId={itemId} />;
}

function MockCreateCatalogItemScreen({ kind, itemId }: { kind: "product" | "service"; itemId?: string }) {
  const app = useAppStore();
  const businesses = app.businesses.filter((item) => item.ownerId === app.user.id || item.team.some((member) => member.userId === app.user.id && BUSINESS_CONTENT_ROLES.includes(member.role)));
  const existingProduct = kind === "product" ? businesses.flatMap((item) => item.products).find((item) => item.id === itemId) : undefined;
  const existingService = kind === "service" ? businesses.flatMap((item) => item.services).find((item) => item.id === itemId) : undefined;
  const existing = existingProduct ?? existingService;
  const initialBusinessId = existing?.businessId ?? (app.activeBusinessId && businesses.some((item) => item.id === app.activeBusinessId) ? app.activeBusinessId : businesses[0]?.id);
  const [businessId, setBusinessId] = useState(initialBusinessId);
  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [category, setCategory] = useState(existing?.category ?? "");
  const [price, setPrice] = useState(existingProduct ? String(existingProduct.price) : existingService?.priceLabel ?? "");
  const [discountPrice, setDiscountPrice] = useState(existingProduct?.discountedPrice?.toString() ?? "");
  const [availability, setAvailability] = useState<Product["availability"]>(existingProduct?.availability ?? (existingService?.availability?.includes("Limited") ? "Limited" : existingService?.availability === "Unavailable" ? "Out of stock" : "Available"));
  const [location, setLocation] = useState(existing?.location ?? "");
  const [media, setMedia] = useState<string[]>(existingProduct?.images ?? existingService?.images ?? (existingProduct?.image ? [existingProduct.image] : []));
  const [video, setVideo] = useState(existingProduct?.video ?? existingService?.video ?? "");
  const [variations, setVariations] = useState(existingProduct?.variations?.map((item) => `${item.name}: ${item.options.join(", ")}`).join("\n") ?? "");
  const [sizes, setSizes] = useState(existingProduct?.sizes?.join(", ") ?? "");
  const [colours, setColours] = useState(existingProduct?.colours?.join(", ") ?? "");
  const [specifications, setSpecifications] = useState(existingProduct?.specifications ?? "");
  const [collectionDelivery, setCollectionDelivery] = useState(existingProduct?.collectionAndDelivery ?? "");
  const [stock, setStock] = useState(existingProduct?.stockQuantity?.toString() ?? "");
  const [pricingModel, setPricingModel] = useState<NonNullable<Service["pricingModel"]>>(existingService?.pricingModel ?? "fixed");
  const [serviceAreas, setServiceAreas] = useState(existingService?.serviceAreas?.join(", ") ?? "");
  const [workingHours, setWorkingHours] = useState(existingService?.workingHours ?? "");
  const [duration, setDuration] = useState(existingService?.durationMinutes?.toString() ?? "");
  const [booking, setBooking] = useState(existingService?.bookingInstructions ?? "");
  const [archived, setArchived] = useState(existing?.archived ?? false);
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const business = businesses.find((item) => item.id === businessId);
  const snapshotKey = JSON.stringify({ businessId, name, description, category, price, discountPrice, availability, location, media, video, variations, sizes, colours, specifications, collectionDelivery, stock, pricingModel, serviceAreas, workingHours, duration, booking, archived });
  const unsaved = useUnsavedChanges(snapshotKey);

  const chooseMedia = async (videos = false) => {
    try {
      const Picker = await import("expo-image-picker");
      const permission = await Picker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return tell("Media access needed", "Allow photo/video access to choose catalogue media.");
      const result = await Picker.launchImageLibraryAsync({ mediaTypes: [videos ? "videos" : "images"], allowsMultipleSelection: !videos, selectionLimit: 6, allowsEditing: false, quality: 0.75, videoMaxDuration: 120 });
      if (result.canceled || !result.assets.length) return;
      const sizeLimit = videos ? 100 * 1024 * 1024 : 12 * 1024 * 1024;
      const invalid = result.assets.find((asset) => asset.fileSize !== undefined && asset.fileSize > sizeLimit);
      if (invalid) return tell("File too large", `${videos ? "Video" : "Each image"} must be at most ${videos ? "100 MB" : "12 MB"}.`);
      if (videos) {
        const asset = result.assets[0];
        if (asset.mimeType && !asset.mimeType.startsWith("video/")) return tell("Unsupported video", "Choose a video file for this catalogue item.");
        if (asset.duration != null && asset.duration > 120_000) return tell("Video too long", "Catalogue video clips must be 2 minutes or less.");
        setVideo(asset.uri);
      }
      else {
        const Manipulator = await import("expo-image-manipulator");
        const optimized = await Promise.all(result.assets.slice(0, 6).map((asset) => Manipulator.manipulateAsync(asset.uri, [{ resize: { width: 1800 } }], { compress: 0.78, format: Manipulator.SaveFormat.JPEG })));
        setMedia(optimized.map((item) => item.uri));
      }
    } catch { tell("Media unavailable", "You can save this item without media. Files remain local in this demo."); }
  };

  const save = (confirmed = false) => {
    if (!app.isAuthenticated) { router.push("/auth/login"); return; }
    if (!business || !name.trim() || description.trim().length < 8 || !category.trim()) return tell("Complete required details", "Choose a managed business, add a name, category and description of at least 8 characters.");
    const current = app.businesses.find((item) => item.id === business.id);
    if (!current || !(current.ownerId === app.user.id || current.team.some((member) => member.userId === app.user.id && BUSINESS_CONTENT_ROLES.includes(member.role)))) return tell("Catalogue access changed", "Your business content role no longer allows this change.");
    if (kind === "product") {
      const numericPrice = Number(price); const numericDiscount = discountPrice.trim() ? Number(discountPrice) : undefined; const numericStock = stock.trim() ? Number(stock) : undefined;
      if (!Number.isFinite(numericPrice) || numericPrice < 0 || numericDiscount !== undefined && (!Number.isFinite(numericDiscount) || numericDiscount < 0 || numericDiscount > numericPrice) || numericStock !== undefined && (!Number.isInteger(numericStock) || numericStock < 0)) return tell("Check product pricing/stock", "Use a valid KSh price; discount cannot exceed the original price; stock must be a non-negative whole number.");
      const parsedVariations = variations.trim() ? variations.split("\n").map((line) => { const [variationName, options = ""] = line.split(":"); return { name: variationName.trim(), options: options.split(",").map((item) => item.trim()).filter(Boolean) }; }) : [];
      if (parsedVariations.some((item) => !item.name || !item.options.length)) return tell("Check product variations", "Each variation needs a name and at least one comma-separated option.");
      const product: Product = { id: existingProduct?.id ?? newLocalId("product"), businessId: business.id, name: name.trim(), description: description.trim(), price: numericPrice, discountedPrice: numericDiscount, availability, location: location.trim() || business.town, image: media[0], images: media, video: video || undefined, category: category.trim(), variations: parsedVariations, sizes: sizes.split(",").map((item) => item.trim()).filter(Boolean), colours: colours.split(",").map((item) => item.trim()).filter(Boolean), specifications: specifications.trim(), collectionAndDelivery: collectionDelivery.trim(), stockQuantity: numericStock, archived };
      if (!confirmed) { setConfirmSave(true); return; }
      setBusy(true); app.updateBusiness(business.id, { products: existingProduct ? current.products.map((item) => item.id === product.id ? product : item) : [product, ...current.products] }, BUSINESS_CONTENT_ROLES); unsaved.markSaved(); setBusy(false); setConfirmSave(false); tell(existingProduct ? "Product updated locally" : "Product saved locally", "The product is stored in this business catalogue on this device only. It was not published or uploaded."); router.replace({ pathname: "/business/[id]", params: { id: business.id } }); return;
    }
    if (pricingModel === "fixed" && !price.trim()) return tell("Add service pricing", "Provide a KSh price or change the pricing model to quote/package/hourly/daily.");
    const service: Service = { id: existingService?.id ?? newLocalId("service"), businessId: business.id, name: name.trim(), description: description.trim(), priceLabel: price.trim() || (pricingModel === "quote" ? "Request a quote" : titleFor(pricingModel)), pricingModel, location: location.trim() || business.town, category: category.trim(), images: media, video: video || undefined, serviceAreas: serviceAreas.split(",").map((item) => item.trim()).filter(Boolean), availability: availability === "Out of stock" ? "Unavailable" : availability === "Limited" ? "Limited availability" : availability, workingHours: workingHours.trim(), durationMinutes: duration.trim() ? Number(duration) : undefined, bookingInstructions: booking.trim(), archived };
    if (service.durationMinutes !== undefined && (!Number.isInteger(service.durationMinutes) || service.durationMinutes < 1 || service.durationMinutes > 10080)) return tell("Check service duration", "Enter a whole number of minutes from 1 to 10,080.");
    if (!confirmed) { setConfirmSave(true); return; }
    setBusy(true); app.updateBusiness(business.id, { services: existingService ? current.services.map((item) => item.id === service.id ? service : item) : [service, ...current.services] }, BUSINESS_CONTENT_ROLES); unsaved.markSaved(); setBusy(false); setConfirmSave(false); tell(existingService ? "Service updated locally" : "Service saved locally", "The service is stored in this business catalogue on this device only. It was not published or uploaded."); router.replace({ pathname: "/business/[id]", params: { id: business.id } });
  };

  return <Page><TopBar title={`${existing ? "Edit" : "Create"} ${kind}`} back /><View style={{ backgroundColor: colors.navy, borderRadius: 19, padding: 16, gap: 7 }}><Text style={{ color: colors.orange, fontWeight: "800", fontSize: 11, letterSpacing: 1 }}>BUSINESS CATALOGUE</Text><Text style={{ color: colors.white, fontSize: 21, fontWeight: "800" }}>{existing ? `Update ${kind} details.` : `Create a ${kind} item.`}</Text><Text style={{ color: "#D9E2E9", lineHeight: 19 }}>Saved into the existing business catalogue, on this device only.</Text></View><LocalNote text="Local catalogue record · not publicly published · no image/video upload or server inventory sync" />
    {!app.isAuthenticated ? <Button title="Sign in to create catalogue items" icon="log-in-outline" onPress={() => router.push("/auth/login")} /> : null}
    {businesses.length ? <><Text style={styles.label}>Managed business</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>{businesses.map((item) => <Chip key={item.id} label={item.name} selected={businessId === item.id} onPress={() => setBusinessId(item.id)} />)}</View><Field label={`${kind === "product" ? "Product" : "Service"} name`} value={name} onChangeText={setName} maxLength={100} /><Field label="Category" value={category} onChangeText={setCategory} placeholder="e.g. Clothing, Catering, Accounting" /><Field label="Description" value={description} onChangeText={setDescription} multiline maxLength={1800} placeholder="Explain features, value and who this is for" /><View style={styles.row}><View style={{ flex: 1 }}><Field label={kind === "product" ? "Price · KSh" : "Price or label"} value={price} onChangeText={setPrice} keyboardType={kind === "product" ? "decimal-pad" : "default"} placeholder={kind === "product" ? "0.00" : "KSh 1,500 / session"} /></View>{kind === "product" ? <View style={{ flex: 1 }}><Field label="Discounted price · KSh" value={discountPrice} onChangeText={setDiscountPrice} keyboardType="decimal-pad" /></View> : null}</View>
    {kind === "service" ? <><Text style={styles.label}>Pricing model</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>{(["fixed", "hourly", "daily", "quote", "package"] as const).map((item) => <Chip key={item} label={item} selected={pricingModel === item} onPress={() => setPricingModel(item)} />)}</View></> : null}
    <Text style={styles.label}>Availability</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>{(["Available", "Limited", "Made to order", "Out of stock"] as const).map((item) => <Chip key={item} label={item} selected={availability === item} onPress={() => setAvailability(item)} />)}</View><Chip label={archived ? "Archived · hidden from active catalogue" : "Visible in active catalogue"} selected={archived} onPress={() => setArchived((value) => !value)} />
    <Field label="Location" value={location} onChangeText={setLocation} placeholder={business?.town ?? "Town, county"} />
    <View style={styles.row}><Button title={`Choose ${kind} photos`} icon="images-outline" variant="outline" small onPress={() => void chooseMedia(false)} /><Button title={`Choose ${kind} video`} icon="videocam-outline" variant="outline" small onPress={() => void chooseMedia(true)} /></View>{media.length ? <View style={{ gap: 7 }}>{media.map((uri, index) => <View key={`${uri}-${index}`}><Text style={styles.caption}>Image {index + 1} of {media.length}</Text><MediaImage uri={uri} height={160} label={`${name || kind} image ${index + 1}`} /></View>)}</View> : null}{video ? <View style={{ gap: 6 }}><VideoPreview uri={video} height={195} /><Button title="Remove selected video" icon="trash-outline" small variant="quiet" onPress={() => setVideo("")} /></View> : null}
    {kind === "product" ? <><Field label="Variations · one per line, Name: option, option" value={variations} onChangeText={setVariations} placeholder={'Colour: black, tan\nSize: S, M, L'} multiline /><Field label="Sizes · comma-separated" value={sizes} onChangeText={setSizes} /><Field label="Colours · comma-separated" value={colours} onChangeText={setColours} /><Field label="Specifications" value={specifications} onChangeText={setSpecifications} multiline /><Field label="Stock quantity" value={stock} onChangeText={setStock} keyboardType="number-pad" /><Field label="Collection and delivery information" value={collectionDelivery} onChangeText={setCollectionDelivery} multiline /></> : <><Field label="Service areas · comma-separated" value={serviceAreas} onChangeText={setServiceAreas} placeholder="Nairobi, Kiambu" /><Field label="Working hours" value={workingHours} onChangeText={setWorkingHours} placeholder="Mon–Fri, 9am–5pm" /><Field label="Service duration · minutes" value={duration} onChangeText={setDuration} keyboardType="number-pad" /><Text style={styles.caption}>Availability: {availability === "Out of stock" ? "Unavailable" : availability}</Text><Field label="Booking and enquiry instructions" value={booking} onChangeText={setBooking} multiline /></>}
    {preview ? <View style={[styles.card, { padding: 13, gap: 8 }]}><Text style={styles.sectionHeading}>Preview · {business?.name ?? "Business"}</Text><Text style={styles.cardTitle}>{name}</Text><Text style={styles.caption}>{category} · {kind === "product" ? `KSh ${price}` : price || titleFor(pricingModel)}</Text><Text style={styles.body}>{description}</Text>{media.map((uri, index) => <MediaImage key={`${uri}-${index}`} uri={uri} height={170} label={`Preview ${index + 1}`} />)}{video ? <VideoPreview uri={video} height={210} /> : null}<Text style={styles.caption}>{location || business?.town || "Location"} · {availability}</Text></View> : null}
    <View style={styles.row}><Button title={preview ? "Hide preview" : "Preview"} icon="eye-outline" variant="outline" onPress={() => setPreview((value) => !value)} /><Button title={busy ? "Saving…" : existing ? "Review changes" : `Review ${kind} details`} icon="save-outline" disabled={busy} onPress={() => save()} /></View></> : <EmptyState title="No managed businesses" detail="Create a business or ask an owner to add you as a content manager before creating catalogue items." icon="business-outline" action="Create business" onAction={() => router.push("/create-business")} />}
    <ConfirmModal visible={confirmSave} title={`Save ${kind} locally?`} detail="Confirm the preview and save this item only to the selected business catalogue on this device. It will not be uploaded, publicly listed or synced." confirmLabel="Save locally" onCancel={() => setConfirmSave(false)} onConfirm={() => save(true)} />
    <ConfirmModal visible={unsaved.confirmVisible} title="Discard unsaved changes?" detail="Your edits have not been saved. Leaving will discard them; the existing catalogue item, if any, remains unchanged." confirmLabel="Discard changes" destructive onCancel={unsaved.stay} onConfirm={unsaved.discardAndLeave} />
  </Page>;
}

function titleFor(model: NonNullable<Service["pricingModel"]>) { return model === "hourly" ? "Hourly rate" : model === "daily" ? "Daily rate" : model === "package" ? "Package pricing" : "Price"; }
