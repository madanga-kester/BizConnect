import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Modal, Pressable, ScrollView, Share, Text, TextInput, View } from "react-native";
import { Button, Chip, EmptyState, Field, LoadingState, MediaImage, Page, SectionTitle, TopBar, styles } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { useMabizServices } from "@/lib/services/service-provider";
import { colors } from "@/theme/tokens";
import { BUSINESS_CONTENT_ROLES, getBusinessRole, hasBusinessRole } from "@/utils/business-permissions";
import { KENYAN_COUNTIES, formatKes } from "@/utils/kenya";
import { MAX_CATALOGUE_GALLERY_IMAGES, catalogUploadIssue } from "@/lib/api/catalog-media";
import type { Result } from "@/lib/api/contracts";
import type { CatalogGalleryEntry, CatalogSort, CatalogStatusFilter } from "@/lib/api/feature-contracts";
import type { Business, CatalogAvailabilityStatus, CatalogVisitType, Product, Service } from "@/types/domain";
import { useThemeContext } from "@/lib/theme-provider";

const LIMIT = 20;
const errorText = (error: { message: string; code?: string }) => `${error.message}${error.code ? ` (${error.code})` : ""}`;

const CATALOG_STATUSES: readonly CatalogStatusFilter[] = ["published", "draft", "archived"];
const AVAILABILITY_OPTIONS: readonly CatalogAvailabilityStatus[] = ["available", "on_request", "fully_booked", "seasonal"];
const VISIT_TYPE_OPTIONS: readonly CatalogVisitType[] = ["onsite", "remote", "hybrid"];
const SORT_OPTIONS: readonly { value: CatalogSort; label: string }[] = [
  { value: "new", label: "Newest" },
  { value: "price_asc", label: "Price low to high" },
  { value: "price_desc", label: "Price high to low" },
  { value: "title", label: "Title A–Z" },
];
const COUNTY_OPTIONS: readonly Business["county"][] = KENYAN_COUNTIES;

type CatalogItem = Product | Service;
type EditorImageState = "pending" | "uploading" | "uploaded" | "failed";
interface EditorImage {
  key: string;
  uri: string;
  fileName: string;
  contentType: string;
  sizeBytes?: number;
  altText: string;
  mediaAssetId?: string;
  state: EditorImageState;
  error?: string;
}

function priceLabelFor(priceKsh: number | null | undefined, priceNote?: string, priceNegotiable?: boolean): string {
  const parts: string[] = [];
  if (typeof priceKsh === "number" && Number.isFinite(priceKsh)) parts.push(formatKes(priceKsh));
  if (priceNote?.trim()) parts.push(priceNote.trim());
  if (priceNegotiable) parts.push("Negotiable");
  return parts.join(" · ") || "Price on request";
}

function itemPriceLine(item: CatalogItem): string {
  // `price` is 0 for a server item with no price, so only priceKsh decides whether a number is real.
  const label = priceLabelFor(typeof item.priceKsh === "number" ? item.priceKsh : null, item.priceNote, item.priceNegotiable);
  if (label !== "Price on request") return label;
  return "priceLabel" in item && item.priceLabel ? item.priceLabel : label;
}

function galleryEntries(images: EditorImage[]): CatalogGalleryEntry[] {
  return images
    .filter((image): image is EditorImage & { mediaAssetId: string } => Boolean(image.mediaAssetId))
    .map((image) => ({ mediaAssetId: image.mediaAssetId, altText: image.altText.trim() }));
}

function isCatalogueNotFound(result: Result<CatalogItem>): boolean {
  if (result.ok) return false;
  return result.error.status === 404 || result.error.code === "CATALOGUE_ITEM_NOT_FOUND" || result.error.code === "NOT_FOUND";
}

function AlertBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  useThemeContext();
  return <View accessibilityRole="alert" style={{ gap: 8, padding: 12, backgroundColor: colors.orangeTint, borderRadius: 14 }}>
    <Text style={styles.body}>{message}</Text>
    {onRetry ? <Button title="Retry" small variant="outline" onPress={onRetry} /> : null}
  </View>;
}

/** Stage 5 management list: server offset paging, status filters and explicit lifecycle actions. */
export function ApiCatalogManagement({ businessId }: { businessId: string }) {
  useThemeContext();
  const services = useMabizServices();
  const app = useAppStore();
  const [kind, setKind] = useState<"Products" | "Services">("Products");
  const [status, setStatus] = useState<CatalogStatusFilter | "all">("all");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | undefined>();
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const load = useCallback(async (options: { next?: boolean; refresh?: boolean } = {}) => {
    if (options.next && (!nextCursor || loadingMore)) return;
    if (options.refresh) setRefreshing(true); else if (options.next) setLoadingMore(true); else setLoading(true);
    setError("");
    const page = { limit: LIMIT, cursor: options.next ? nextCursor : undefined, search: appliedSearch || undefined, status: status === "all" ? undefined : status };
    const result = kind === "Products"
      ? await services.catalog.listProducts(businessId, page)
      : await services.catalog.listServices(businessId, page);
    if (!result.ok) {
      setError(`Catalogue error: ${errorText(result.error)}`);
      if (!options.next) { setItems([]); setTotal(0); setNextCursor(undefined); }
    } else {
      setItems((current) => options.next ? [...current, ...result.data.items] : result.data.items);
      setTotal(result.data.total);
      setNextCursor(result.data.nextCursor);
    }
    setLoading(false); setRefreshing(false); setLoadingMore(false);
  }, [appliedSearch, businessId, kind, loadingMore, nextCursor, services, status]);

  useEffect(() => { setItems([]); setNextCursor(undefined); void load(); }, [kind, status, appliedSearch]);

  const changeStatus = async (item: CatalogItem, next: CatalogStatusFilter) => {
    setBusyId(item.id); setActionError("");
    const result = kind === "Products"
      ? await services.catalog.setProductStatus(businessId, item.id, next)
      : await services.catalog.setServiceStatus(businessId, item.id, next);
    setBusyId(undefined);
    if (!result.ok) { setActionError(`${item.name}: ${errorText(result.error)}`); return; }
    setItems((current) => current.map((entry) => entry.id === item.id ? result.data : entry));
  };

  const business = app.businesses.find((entry) => entry.id === businessId);
  const role = business ? getBusinessRole(business, app.user.id) : undefined;
  const createKind = kind === "Products" ? "product" : "service";

  return <Page onRefresh={() => void load({ refresh: true })} refreshing={refreshing}>
    <TopBar title="Manage catalogue" back subtitle={business ? `${business.name}${role ? ` · ${role}` : ""}` : undefined} />
    <View style={{ padding: 13, borderRadius: 15, backgroundColor: colors.emeraldTint }}>
      <Text style={styles.body}>Stage 5 catalogue · products, services, ordered galleries and publishing are stored by the Mabiz API. Archive is a status change, not a deletion.</Text>
    </View>
    <View style={styles.row}>
      <Chip label="Products" selected={kind === "Products"} onPress={() => setKind("Products")} />
      <Chip label="Services" selected={kind === "Services"} onPress={() => setKind("Services")} />
    </View>
    <View style={styles.inputWrap}>
      <Text style={{ color: colors.muted }}>⌕</Text>
      <TextInput value={search} onChangeText={setSearch} onSubmitEditing={() => setAppliedSearch(search.trim())} returnKeyType="search" placeholder="Search this catalogue" placeholderTextColor={colors.muted} style={{ flex: 1, padding: 10, color: colors.ink }} accessibilityLabel="Search this catalogue" />
      <Button title="Search" small variant="quiet" onPress={() => setAppliedSearch(search.trim())} />
    </View>
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
      <Chip label="All statuses" selected={status === "all"} onPress={() => setStatus("all")} />
      {CATALOG_STATUSES.map((entry) => <Chip key={entry} label={entry} selected={status === entry} onPress={() => setStatus(entry)} />)}
    </View>
    <View style={styles.row}>
      <Button title={`Create ${createKind}`} icon="add-outline" onPress={() => router.push({ pathname: "/create-catalog-item", params: { kind: createKind } })} />
      <Button title="Business profile" icon="business-outline" variant="outline" onPress={() => router.push({ pathname: "/business/[id]", params: { id: businessId } })} />
    </View>
    {error ? <AlertBlock message={error} onRetry={() => void load()} /> : null}
    {actionError ? <AlertBlock message={`Status change failed: ${actionError}`} /> : null}
    <SectionTitle title={`${kind} · ${total}`} />
    {loading ? <LoadingState label="Loading catalogue from the server" /> : null}
    {!loading ? items.map((item) => <View key={item.id} style={[styles.card, { padding: 13, gap: 8 }]}>
      <View style={styles.row}>
        <Chip label={item.status ?? "draft"} selected={item.status === "published"} />
        <Chip label={item.category} />
        {item.sku ? <Chip label={`SKU ${item.sku}`} /> : null}
      </View>
      <Text style={styles.cardTitle}>{item.name}</Text>
      <Text style={styles.caption}>{itemPriceLine(item)} · {item.availability ?? "Available"}</Text>
      {item.gallery?.length ? <View style={{ gap: 7 }}>{item.gallery.map((image, index) => <MediaImage key={`${image.mediaAssetId}-${index}`} uri={image.url} height={150} label={`${item.name} ${index === 0 ? "primary image" : `image ${index + 1}`}${image.altText ? `: ${image.altText}` : ""}`} />)}</View> : <Text style={styles.caption}>No gallery images on this item.</Text>}
      <Text style={styles.body} numberOfLines={3}>{item.description}</Text>
      <Text style={styles.caption}>{item.publishedAt ? `Published ${new Date(item.publishedAt).toLocaleDateString("en-KE")}` : "Not published yet"}{item.updatedAt ? ` · updated ${new Date(item.updatedAt).toLocaleDateString("en-KE")}` : ""}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
        <Button title="Edit" icon="create-outline" small variant="outline" onPress={() => router.push({ pathname: "/create-catalog-item", params: { kind: createKind, itemId: item.id } })} />
        {item.status === "published"
          ? <Button title={busyId === item.id ? "Working…" : "Unpublish"} icon="eye-off-outline" small variant="soft" disabled={busyId === item.id} onPress={() => void changeStatus(item, "draft")} />
          : <Button title={busyId === item.id ? "Working…" : "Publish"} icon="eye-outline" small variant="soft" disabled={busyId === item.id} onPress={() => void changeStatus(item, "published")} />}
        {item.status === "archived"
          ? <Button title={busyId === item.id ? "Working…" : "Restore to draft"} icon="refresh-outline" small variant="soft" disabled={busyId === item.id} onPress={() => void changeStatus(item, "draft")} />
          : <Button title={busyId === item.id ? "Working…" : "Archive"} icon="archive-outline" small variant="danger" disabled={busyId === item.id} onPress={() => void changeStatus(item, "archived")} />}
      </View>
    </View>) : null}
    {!loading && !error && !items.length ? <EmptyState title={`No ${status === "all" ? "" : `${status} `}${kind.toLocaleLowerCase("en-KE")}`} detail={appliedSearch ? `Nothing in this catalogue matches “${appliedSearch}”.` : "Create an item or change the status filter."} icon={kind === "Products" ? "pricetag-outline" : "briefcase-outline"} action={`Create ${createKind}`} onAction={() => router.push({ pathname: "/create-catalog-item", params: { kind: createKind } })} /> : null}
    {nextCursor && !loading ? <Button title={loadingMore ? "Loading…" : "Load more"} variant="outline" disabled={loadingMore} onPress={() => void load({ next: true })} /> : null}
  </Page>;
}

/** Stage 5 editor: real multipart image upload, ordered gallery with an explicit primary, server lifecycle rules. */
export function ApiCatalogItemEditor({ kind, itemId }: { kind: "product" | "service"; itemId?: string }) {
  useThemeContext();
  const services = useMabizServices();
  const app = useAppStore();
  const manageable = app.businesses.filter((entry) => hasBusinessRole(entry, app.user.id, BUSINESS_CONTENT_ROLES));
  const [businessId, setBusinessId] = useState<string | undefined>(itemId
    ? undefined
    : app.activeBusinessId && manageable.some((entry) => entry.id === app.activeBusinessId) ? app.activeBusinessId : manageable[0]?.id);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [priceText, setPriceText] = useState("");
  const [priceNote, setPriceNote] = useState("");
  const [priceNegotiable, setPriceNegotiable] = useState(false);
  const [sku, setSku] = useState("");
  const [stockText, setStockText] = useState("");
  const [unit, setUnit] = useState("");
  const [inStock, setInStock] = useState(true);
  const [availabilityStatus, setAvailabilityStatus] = useState<CatalogAvailabilityStatus>("available");
  const [durationText, setDurationText] = useState("");
  const [leadTimeText, setLeadTimeText] = useState("");
  const [visitType, setVisitType] = useState<CatalogVisitType | undefined>();
  const [serviceAreas, setServiceAreas] = useState("");
  const [images, setImages] = useState<EditorImage[]>([]);
  const [serverStatus, setServerStatus] = useState<CatalogStatusFilter | undefined>();
  const [loading, setLoading] = useState(Boolean(itemId));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const business = manageable.find((entry) => entry.id === businessId);

  const applyLoaded = (item: CatalogItem) => {
    setBusinessId(item.businessId);
    setTitle(item.name);
    setCategory(item.category);
    setDescription(item.description);
    setPriceText(typeof item.priceKsh === "number" ? String(item.priceKsh) : "");
    setPriceNote(item.priceNote ?? "");
    setPriceNegotiable(item.priceNegotiable === true);
    setServerStatus(item.status ?? "draft");
    setImages((item.gallery ?? []).map((image, index) => ({
      key: `${image.mediaAssetId}-${index}`, uri: image.url, fileName: image.altText || `gallery-${index + 1}`,
      contentType: image.contentType, sizeBytes: image.sizeBytes, altText: image.altText,
      mediaAssetId: image.mediaAssetId, state: "uploaded" as const,
    })));
    if (kind === "product") {
      const product = item as Product;
      setSku(product.sku ?? "");
      setStockText(typeof product.stockQuantity === "number" ? String(product.stockQuantity) : "");
      setUnit(product.unit ?? "");
      setInStock(product.inStock !== false);
    } else {
      const service = item as Service;
      setAvailabilityStatus(service.availabilityStatus ?? "available");
      setDurationText(typeof service.durationMinutes === "number" ? String(service.durationMinutes) : "");
      setLeadTimeText(typeof service.leadTimeDays === "number" ? String(service.leadTimeDays) : "");
      setVisitType(service.visitType);
      setServiceAreas((service.serviceAreas ?? []).join(", "));
    }
  };

  const load = useCallback(async () => {
    if (!itemId || !businessId) return;
    setLoading(true); setError("");
    const result = kind === "product" ? await services.catalog.getProduct(businessId, itemId) : await services.catalog.getService(businessId, itemId);
    if (result.ok) applyLoaded(result.data);
    else setError(`${kind === "product" ? "Product" : "Service"} error: ${errorText(result.error)}`);
    setLoading(false);
  }, [businessId, itemId, kind, services]);

  useEffect(() => { void load(); }, [load]);

  const chooseImages = async () => {
    setActionError("");
    const remaining = MAX_CATALOGUE_GALLERY_IMAGES - images.length;
    if (remaining <= 0) { setActionError(`The server stores at most ${MAX_CATALOGUE_GALLERY_IMAGES} images per item.`); return; }
    try {
      const Picker = await import("expo-image-picker");
      const permission = await Picker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) { setActionError("Photo access is needed to choose catalogue images."); return; }
      const result = await Picker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsMultipleSelection: true, selectionLimit: remaining, allowsEditing: false, quality: 0.8 });
      if (result.canceled || !result.assets.length) return;
      const Manipulator = await import("expo-image-manipulator");
      const picked = await Promise.all(result.assets.slice(0, remaining).map(async (asset, index) => {
        try {
          const optimized = await Manipulator.manipulateAsync(asset.uri, [{ resize: { width: 1800 } }], { compress: 0.78, format: Manipulator.SaveFormat.JPEG });
          return { uri: optimized.uri, contentType: "image/jpeg", sizeBytes: asset.fileSize, fileName: asset.fileName || `catalogue-${Date.now().toString(36)}-${index}.jpg` };
        } catch {
          return { uri: asset.uri, contentType: asset.mimeType || "image/jpeg", sizeBytes: asset.fileSize, fileName: asset.fileName || "catalogue-image.jpg" };
        }
      }));
      setImages((current) => [...current, ...picked.map((entry, index) => ({ key: `${Date.now().toString(36)}-${index}`, ...entry, altText: "", state: "pending" as EditorImageState }))]);
    } catch {
      setActionError("No image could be read from this device. The item can still be saved without images.");
    }
  };

  /** Uploads one picked file and returns its gallery entry, or null when the upload failed. */
  const uploadOne = async (image: EditorImage): Promise<EditorImage | null> => {
    const issue = catalogUploadIssue({ uri: image.uri, fileName: image.fileName, contentType: image.contentType, sizeBytes: image.sizeBytes });
    if (issue) {
      setImages((current) => current.map((entry) => entry.key === image.key ? { ...entry, state: "failed" as const, error: `${issue.message} (${issue.code})` } : entry));
      return null;
    }
    if (!businessId) { setActionError("Choose the managed business before uploading images."); return null; }
    setImages((current) => current.map((entry) => entry.key === image.key ? { ...entry, state: "uploading" as const, error: undefined } : entry));
    const result = await services.catalog.uploadCatalogMedia(businessId, { uri: image.uri, fileName: image.fileName, contentType: image.contentType, sizeBytes: image.sizeBytes });
    if (!result.ok) {
      setImages((current) => current.map((entry) => entry.key === image.key ? { ...entry, state: "failed" as const, error: errorText(result.error) } : entry));
      return null;
    }
    const uploaded: EditorImage = { ...image, mediaAssetId: result.data.mediaAssetId, state: "uploaded" };
    setImages((current) => current.map((entry) => entry.key === image.key ? uploaded : entry));
    return uploaded;
  };

  const validate = (): string | null => {
    if (!business) return "Choose the managed business that owns this item.";
    if (title.trim().length < 2) return "A title of at least 2 characters is required.";
    if (description.trim().length < 8) return "A description of at least 8 characters is required.";
    if (!category.trim()) return "A category is required.";
    const numericPrice = priceText.trim() ? Number(priceText) : null;
    if (numericPrice !== null && (!Number.isFinite(numericPrice) || numericPrice < 0)) return "Price must be a non-negative KSh amount, or leave it empty.";
    if (numericPrice === null && !priceNote.trim() && !priceNegotiable) return "An item needs a price, a price note or the negotiable flag.";
    if (kind === "product") {
      if (stockText.trim()) {
        const stock = Number(stockText);
        if (!Number.isInteger(stock) || stock < 0) return "Stock quantity must be a whole number of 0 or more.";
      }
    } else {
      if (durationText.trim()) {
        const duration = Number(durationText);
        if (!Number.isInteger(duration) || duration < 1 || duration > 43200) return "Duration must be a whole number of minutes from 1 to 43,200.";
      }
      if (leadTimeText.trim()) {
        const leadTime = Number(leadTimeText);
        if (!Number.isInteger(leadTime) || leadTime < 0 || leadTime > 3650) return "Lead time must be a whole number of days from 0 to 3,650.";
      }
    }
    return null;
  };

  const save = async (publish: boolean) => {
    if (!app.isAuthenticated) { router.push("/auth/login"); return; }
    if (!businessId) { setActionError("Choose the managed business that owns this item."); return; }
    const problem = validate();
    if (problem) { setActionError(problem); return; }
    if (serverStatus === "archived") { setActionError("This item is archived, so the server refuses edits. Restore it to draft first."); return; }
    setBusy(true); setActionError("");
    // Upload first: a saved item must never claim media the server does not hold.
    const ordered: EditorImage[] = [];
    for (const image of images) {
      if (image.mediaAssetId) { ordered.push(image); continue; }
      const uploaded = await uploadOne(image);
      if (!uploaded) { setBusy(false); setActionError("An image could not be uploaded, so nothing was saved. Fix the image and save again."); return; }
      ordered.push(uploaded);
    }
    const numericPrice = priceText.trim() ? Number(priceText) : null;
    const shared = {
      name: title.trim(), description: description.trim(), category: category.trim(),
      priceKsh: numericPrice, priceNote: priceNote.trim(), priceNegotiable,
    };
    const areas = serviceAreas.split(",").map((area) => area.trim()).filter(Boolean).slice(0, 20);
    let saved: Result<CatalogItem>;
    if (kind === "product") {
      const input = {
        ...shared,
        availability: inStock ? "Available" as const : "Out of stock" as const,
        location: "",
        sku: sku.trim() || undefined,
        stockQuantity: stockText.trim() ? Number(stockText) : undefined,
        inStock,
        unit: unit.trim() || undefined,
      };
      saved = itemId
        ? await services.catalog.updateProduct(businessId, itemId, input)
        : await services.catalog.createProduct(businessId, { ...input, price: numericPrice ?? 0 });
    } else {
      const input = {
        ...shared,
        availabilityStatus,
        durationMinutes: durationText.trim() ? Number(durationText) : undefined,
        leadTimeDays: leadTimeText.trim() ? Number(leadTimeText) : undefined,
        visitType,
        serviceAreas: areas,
      };
      saved = itemId
        ? await services.catalog.updateService(businessId, itemId, input)
        : await services.catalog.createService(businessId, {
          ...input,
          priceLabel: priceLabelFor(numericPrice, priceNote.trim(), priceNegotiable),
          availability: availabilityStatus,
          location: "",
        });
    }
    if (!saved.ok) {
      setBusy(false);
      setActionError(`Nothing was saved: ${errorText(saved.error)}`);
      return;
    }
    const savedId = saved.data.id;
    setServerStatus(saved.data.status ?? "draft");
    if (ordered.length) {
      const gallery = kind === "product"
        ? await services.catalog.replaceProductGallery(businessId, savedId, galleryEntries(ordered))
        : await services.catalog.replaceServiceGallery(businessId, savedId, galleryEntries(ordered));
      if (!gallery.ok) {
        setBusy(false);
        setActionError(`The item was saved, but its gallery was not: ${errorText(gallery.error)}`);
        return;
      }
      setServerStatus(gallery.data.status ?? "draft");
    }
    if (publish) {
      const published = kind === "product"
        ? await services.catalog.setProductStatus(businessId, savedId, "published")
        : await services.catalog.setServiceStatus(businessId, savedId, "published");
      if (!published.ok) {
        setBusy(false);
        setActionError(`The item was saved as a draft, but publishing failed: ${errorText(published.error)}`);
        return;
      }
      setServerStatus("published");
    }
    setBusy(false);
    router.replace("/catalog-management");
  };

  const restoreToDraft = async () => {
    if (!itemId || !businessId) return;
    setBusy(true); setActionError("");
    const result = kind === "product"
      ? await services.catalog.setProductStatus(businessId, itemId, "draft")
      : await services.catalog.setServiceStatus(businessId, itemId, "draft");
    setBusy(false);
    if (!result.ok) { setActionError(`Restore failed: ${errorText(result.error)}`); return; }
    setServerStatus("draft");
  };

  const moveImage = (key: string, direction: -1 | 1) => setImages((current) => {
    const index = current.findIndex((entry) => entry.key === key);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= current.length) return current;
    const next = [...current];
    [next[index], next[target]] = [next[target] as EditorImage, next[index] as EditorImage];
    return next;
  });
  const makePrimary = (key: string) => setImages((current) => {
    const index = current.findIndex((entry) => entry.key === key);
    if (index <= 0) return current;
    const next = [...current];
    const [entry] = next.splice(index, 1);
    return entry ? [entry, ...next] : current;
  });
  const removeImage = (key: string) => setImages((current) => current.filter((entry) => entry.key !== key));
  const setAltText = (key: string, value: string) => setImages((current) => current.map((entry) => entry.key === key ? { ...entry, altText: value } : entry));

  if (!app.isAuthenticated) return <Page><TopBar title={`Create ${kind}`} back /><EmptyState title="Sign in to edit the catalogue" detail="Catalogue writes require an authenticated API session." icon="lock-closed-outline" action="Sign in" onAction={() => router.push("/auth/login")} /></Page>;
  if (!manageable.length) return <Page><TopBar title={`Create ${kind}`} back /><EmptyState title="No managed businesses" detail="Create a business or ask an owner to add you as a content manager." icon="business-outline" action="Create business" onAction={() => router.push("/create-business")} /></Page>;

  return <Page>
    <TopBar title={`${itemId ? "Edit" : "Create"} ${kind}`} back />
    <View style={{ padding: 13, borderRadius: 15, backgroundColor: colors.emeraldTint }}>
      <Text style={styles.body}>Stage 5 catalogue editor · chosen images are uploaded to the Mabiz media store and the item is written to the server. Nothing here is stored only on this device.</Text>
    </View>
    {error ? <AlertBlock message={error} onRetry={() => void load()} /> : null}
    {loading ? <LoadingState label="Loading item from the server" /> : null}
    <Text style={styles.label}>Managed business</Text>
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>{manageable.map((entry) => <Chip key={entry.id} label={entry.name} selected={businessId === entry.id} onPress={() => setBusinessId(entry.id)} />)}</View>
    <Field label="Title" value={title} onChangeText={setTitle} maxLength={120} placeholder="What is it called?" />
    <Field label="Category" value={category} onChangeText={setCategory} maxLength={80} placeholder="e.g. Clothing, Catering, Accounting" />
    <Field label="Description" value={description} onChangeText={setDescription} multiline maxLength={2000} placeholder="Explain features, value and who this is for" />
    <View style={styles.row}>
      <View style={{ flex: 1 }}><Field label="Price · KSh" value={priceText} onChangeText={setPriceText} keyboardType="decimal-pad" placeholder="Optional" /></View>
      <View style={{ flex: 1 }}><Field label="Price note" value={priceNote} onChangeText={setPriceNote} maxLength={200} placeholder="e.g. Per visit" /></View>
    </View>
    <Chip label={priceNegotiable ? "Price negotiable" : "Price fixed"} selected={priceNegotiable} onPress={() => setPriceNegotiable((value) => !value)} />
    {kind === "product" ? <>
      <Field label="SKU" value={sku} onChangeText={setSku} maxLength={64} autoCapitalize="characters" placeholder="Optional internal code" />
      <View style={styles.row}>
        <View style={{ flex: 1 }}><Field label="Stock quantity" value={stockText} onChangeText={setStockText} keyboardType="number-pad" placeholder="Optional" /></View>
        <View style={{ flex: 1 }}><Field label="Unit" value={unit} onChangeText={setUnit} maxLength={32} placeholder="e.g. piece" /></View>
      </View>
      <Text style={styles.label}>Stock status</Text>
      <View style={styles.row}><Chip label="In stock" selected={inStock} onPress={() => setInStock(true)} /><Chip label="Out of stock" selected={!inStock} onPress={() => setInStock(false)} /></View>
      <Text style={styles.caption}>Products use stock and SKU. Lead time, duration, visit type and service areas apply to services only.</Text>
    </> : <>
      <Text style={styles.label}>Availability</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>{AVAILABILITY_OPTIONS.map((entry) => <Chip key={entry} label={entry} selected={availabilityStatus === entry} onPress={() => setAvailabilityStatus(entry)} />)}</View>
      <View style={styles.row}>
        <View style={{ flex: 1 }}><Field label="Duration · minutes" value={durationText} onChangeText={setDurationText} keyboardType="number-pad" placeholder="Optional" /></View>
        <View style={{ flex: 1 }}><Field label="Lead time · days" value={leadTimeText} onChangeText={setLeadTimeText} keyboardType="number-pad" placeholder="Optional" /></View>
      </View>
      <Text style={styles.label}>Visit type</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>{VISIT_TYPE_OPTIONS.map((entry) => <Chip key={entry} label={entry} selected={visitType === entry} onPress={() => setVisitType(entry)} />)}<Chip label="Not specified" selected={visitType === undefined} onPress={() => setVisitType(undefined)} /></View>
      <Field label="Service areas · comma-separated" value={serviceAreas} onChangeText={setServiceAreas} placeholder="Nairobi, Kiambu" />
      <Text style={styles.caption}>Services do not carry SKU, stock or unit values; the server rejects them.</Text>
    </>}
    <SectionTitle title={`Gallery · ${images.length} of ${MAX_CATALOGUE_GALLERY_IMAGES}`} />
    <Button title="Choose images" icon="images-outline" variant="outline" small disabled={!businessId} onPress={() => void chooseImages()} />
    {actionError ? <AlertBlock message={actionError} /> : null}
    {images.length ? <View style={{ gap: 10 }}>{images.map((image, index) => <View key={image.key} style={[styles.card, { padding: 12, gap: 7 }]}>
      <Text style={styles.caption}>{index === 0 ? "Primary image" : `Image ${index + 1}`} · {image.state === "uploaded" ? "uploaded to Mabiz" : image.state === "uploading" ? "uploading…" : image.state === "failed" ? `upload failed: ${image.error}` : "not uploaded yet"}</Text>
      <MediaImage uri={image.uri} height={160} label={image.altText || `${title || kind} image ${index + 1}`} />
      <Field label="Alt text" value={image.altText} onChangeText={(value) => setAltText(image.key, value)} maxLength={200} placeholder="Describe this image" />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
        {index > 0 ? <Button title="Make primary" icon="arrow-up-outline" small variant="soft" onPress={() => makePrimary(image.key)} /> : null}
        {index > 0 ? <Button title="Move up" icon="chevron-up-outline" small variant="outline" onPress={() => moveImage(image.key, -1)} /> : null}
        {index < images.length - 1 ? <Button title="Move down" icon="chevron-down-outline" small variant="outline" onPress={() => moveImage(image.key, 1)} /> : null}
        {!image.mediaAssetId ? <Button title={image.state === "failed" ? "Retry upload" : "Upload now"} icon="cloud-upload-outline" small variant="outline" disabled={!businessId || image.state === "uploading"} onPress={() => void uploadOne(image)} /> : null}
        <Button title="Remove" icon="trash-outline" small variant="danger" onPress={() => removeImage(image.key)} />
      </View>
    </View>)}</View> : <Text style={styles.caption}>No images chosen yet. Chosen images are uploaded when you save, and image 1 is the primary image.</Text>}
    <View style={styles.row}>
      <Button title={busy ? "Saving…" : "Save draft"} icon="save-outline" disabled={busy || !businessId || loading} onPress={() => void save(false)} />
      <Button title={busy ? "Working…" : "Save and publish"} icon="globe-outline" variant="soft" disabled={busy || !businessId || loading} onPress={() => void save(true)} />
    </View>
    {serverStatus ? <Text style={styles.caption}>Server status: {serverStatus}. Publishing makes the item visible in public discovery; archiving hides it and can be reversed.</Text> : null}
    {serverStatus === "archived" && itemId ? <Button title="Restore to draft" icon="refresh-outline" variant="outline" disabled={busy} onPress={() => void restoreToDraft()} /> : null}
  </Page>;
}

/** Stage 5 public discovery: anonymous, server-filtered, offset-paged. */
export function ApiCatalogueDiscovery() {
  useThemeContext();
  const services = useMabizServices();
  const [kind, setKind] = useState<"Products" | "Services">("Products");
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [county, setCounty] = useState<Business["county"] | undefined>();
  const [countyModalVisible, setCountyModalVisible] = useState(false);
  const [countySearch, setCountySearch] = useState("");
  const [sort, setSort] = useState<CatalogSort>("new");
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (next = false) => {
    if (next && (!nextCursor || loadingMore)) return;
    if (next) setLoadingMore(true); else setLoading(true);
    setError("");
    const filters = { limit: LIMIT, cursor: next ? nextCursor : undefined, search: appliedSearch || undefined, county, sort };
    const result = kind === "Products" ? await services.catalog.listPublicProducts(filters) : await services.catalog.listPublicServices(filters);
    if (!result.ok) {
      setError(`Discovery error: ${errorText(result.error)}`);
      if (!next) { setItems([]); setTotal(0); setNextCursor(undefined); }
    } else {
      setItems((current) => next ? [...current, ...result.data.items] : result.data.items);
      setTotal(result.data.total);
      setNextCursor(result.data.nextCursor);
    }
    setLoading(false); setRefreshing(false); setLoadingMore(false);
  }, [appliedSearch, county, kind, loadingMore, nextCursor, services, sort]);

  useEffect(() => { setItems([]); setNextCursor(undefined); void load(false); }, [kind, appliedSearch, county, sort]);

  const detailKind = kind === "Products" ? "product" : "service";

  const closeCountyModal = () => {
    setCountyModalVisible(false);
    setCountySearch("");
  };

  const pickCounty = (value: Business["county"] | undefined) => {
    setCounty(value);
    closeCountyModal();
  };

  const filteredCounties = COUNTY_OPTIONS.filter((entry) => entry.toLowerCase().includes(countySearch.trim().toLowerCase()));

  return <Page onRefresh={() => void load(false)} refreshing={refreshing}>
    <TopBar title="Products & services" back subtitle="Published catalogue of public businesses" />
    <View style={styles.inputWrap}>
      <Text style={{ color: colors.muted }}>⌕</Text>
      <TextInput value={search} onChangeText={setSearch} onSubmitEditing={() => setAppliedSearch(search.trim())} returnKeyType="search" placeholder="Search published products and services" placeholderTextColor={colors.muted} style={{ flex: 1, padding: 10, color: colors.ink }} accessibilityLabel="Search the published catalogue" />
      <Button title="Search" small variant="quiet" onPress={() => setAppliedSearch(search.trim())} />
    </View>
    <View style={styles.row}>
      <Chip label="Products" selected={kind === "Products"} onPress={() => setKind("Products")} />
      <Chip label="Services" selected={kind === "Services"} onPress={() => setKind("Services")} />
    </View>
    <Text style={styles.label}>Sort</Text>
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>{SORT_OPTIONS.map((entry) => <Chip key={entry.value} label={entry.label} selected={sort === entry.value} onPress={() => setSort(entry.value)} />)}</View>
    <Text style={styles.label}>County</Text>
    <Pressable
      onPress={() => setCountyModalVisible(true)}
      accessibilityRole="button"
      accessibilityLabel={`County filter: ${county ?? "All counties"}. Tap to change`}
      style={[styles.inputWrap, { justifyContent: "space-between", minHeight: 48, paddingHorizontal: 12 }]}
    >
      <Text style={{ color: colors.ink }}>{county ?? "All counties"}</Text>
      <Ionicons name="chevron-down" size={19} color={colors.muted} />
    </Pressable>
    <Modal visible={countyModalVisible} transparent animationType="slide" onRequestClose={closeCountyModal}>
      <View style={{ flex: 1, backgroundColor: "rgba(10,25,20,0.55)", justifyContent: "flex-end" }}>
        <View style={{ backgroundColor: colors.white, borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, height: "82%", gap: 12 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={styles.cardTitle}>Filter by county</Text>
            <Pressable onPress={closeCountyModal} accessibilityRole="button" accessibilityLabel="Close county filter">
              <Ionicons name="close-circle-outline" size={28} color={colors.ink} />
            </Pressable>
          </View>
          <View style={styles.inputWrap}>
            <TextInput
              value={countySearch}
              onChangeText={setCountySearch}
              placeholder="Search counties"
              placeholderTextColor={colors.muted}
              style={{ flex: 1, padding: 10, color: colors.ink }}
              accessibilityLabel="Search counties"
            />
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {countySearch.trim() === "" ? (
              <Pressable onPress={() => pickCounty(undefined)} style={{ paddingVertical: 14, paddingHorizontal: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ color: colors.ink, fontWeight: county === undefined ? "800" : "500" }}>All counties</Text>
                {county === undefined ? <Ionicons name="checkmark-circle" size={20} color={colors.emerald} /> : null}
              </Pressable>
            ) : null}
            {filteredCounties.map((entry) => (
              <Pressable key={entry} onPress={() => pickCounty(entry)} style={{ paddingVertical: 14, paddingHorizontal: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ color: colors.ink, fontWeight: county === entry ? "800" : "500" }}>{entry}</Text>
                {county === entry ? <Ionicons name="checkmark-circle" size={20} color={colors.emerald} /> : null}
              </Pressable>
            ))}
            {filteredCounties.length === 0 ? <Text style={[styles.caption, { textAlign: "center", padding: 25 }]}>No matching county found.</Text> : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
    {error ? <AlertBlock message={error} onRetry={() => void load(false)} /> : null}
    <SectionTitle title={`${kind} · ${total}`} />
    {loading ? <LoadingState label="Loading published catalogue" /> : null}
    {!loading && !items.length && !error ? <EmptyState title={`No published ${kind.toLocaleLowerCase("en-KE")}`} detail={appliedSearch ? `Nothing matches “${appliedSearch}” yet.` : "Published items appear here as businesses publish them."} icon={kind === "Products" ? "pricetag-outline" : "briefcase-outline"} /> : null}
    {!loading ? <View style={{ gap: 12 }}>{items.map((item) => <View key={item.id} style={[styles.card, { padding: 13, gap: 8 }]}>
      <MediaImage uri={item.gallery?.[0]?.url} height={150} label={item.name} />
      <Text style={styles.cardTitle}>{item.name}</Text>
      <Text style={styles.caption}>{itemPriceLine(item)} · {item.category}</Text>
      <Text style={styles.caption}>{item.businessName ?? "Business"}{item.location ? ` · ${item.location}` : ""} · {item.availability ?? "Available"}</Text>
      <View style={styles.row}>
        <Button title={`View ${detailKind}`} icon="eye-outline" small variant="outline" onPress={() => router.push({ pathname: "/product/[id]", params: { id: item.slug || item.id, kind: detailKind } })} />
        {item.businessId ? <Button title="Business profile" icon="storefront-outline" small variant="quiet" onPress={() => router.push({ pathname: "/business/[id]", params: { id: item.businessId } })} /> : null}
      </View>
    </View>)}</View> : null}
    {nextCursor && !loading ? <Button title={loadingMore ? "Loading…" : "Load more"} variant="outline" disabled={loadingMore} onPress={() => void load(true)} /> : null}
    {!loading && items.length > 0 && !nextCursor ? <Text style={[styles.caption, { textAlign: "center" }]}>That is the whole published catalogue for this filter.</Text> : null}
    <Text style={styles.caption}>Prices and availability come from published server catalogue data. Contact sellers directly; there is no checkout.</Text>
  </Page>;
}

/** Stage 5 public detail: ordered gallery with an explicit primary, and 404 mapped to the not-found state. */
export function ApiCatalogItemDetail({ slugOrId, kind }: { slugOrId: string; kind?: "product" | "service" }) {
  useThemeContext();
  const services = useMabizServices();
  const [item, setItem] = useState<CatalogItem | null>(null);
  const [resolvedKind, setResolvedKind] = useState<"product" | "service">(kind ?? "product");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const app = useAppStore();
  const [startingEnquiry, setStartingEnquiry] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(""); setNotFound(false);
    if (!slugOrId) { setNotFound(true); setLoading(false); return; }
    const read = async (entry: "product" | "service") => entry === "product"
      ? await services.catalog.getPublicProduct(slugOrId)
      : await services.catalog.getPublicService(slugOrId);
    const requested = kind ?? "product";
    const first = await read(requested);
    if (first.ok) { setItem(first.data); setResolvedKind(requested); setLoading(false); return; }
    // The route guarantees only an id or slug, so an unspecified kind falls back to the other resource.
    if (!kind) {
      const second = await read("service");
      setResolvedKind("service");
      if (second.ok) { setItem(second.data); setLoading(false); return; }
      if (isCatalogueNotFound(first) && isCatalogueNotFound(second)) setNotFound(true);
      else setError(`Catalogue error: ${errorText(second.error)}`);
      setLoading(false);
      return;
    }
    if (isCatalogueNotFound(first)) setNotFound(true); else setError(`Catalogue error: ${errorText(first.error)}`);
    setLoading(false);
  }, [kind, services, slugOrId]);

  useEffect(() => { void load(); }, [load]);

  const startEnquiry = async () => {
    if (!item?.businessId) return;
    if (!app.isAuthenticated) { router.push("/auth/login"); return; }
    setStartingEnquiry(true);
    const result = await services.messaging.startConversation({ businessId: item.businessId, catalogItemId: item.id, firstMessage: `Hello, I’m interested in ${item.name}. Is it available?` });
    if (result.ok) router.push({ pathname: "/messages/[id]", params: { id: result.data.id } });
    else setError(`Enquiry error: ${errorText(result.error)}`);
    setStartingEnquiry(false);
  };

  if (loading) return <Page><TopBar title="Item details" back /><LoadingState label="Loading published item" /></Page>;
  if (notFound || !item) return <Page><TopBar title="Item details" back /><EmptyState title={`${resolvedKind === "product" ? "Product" : "Service"} not found`} detail="It may be unpublished, archived, or belong to a private business." icon="search-outline" action="Browse businesses" onAction={() => router.replace("/discover")} /></Page>;

  const gallery = item.gallery ?? [];
  const product = kind === "product" || (resolvedKind === "product" && "price" in item) ? item as Product : undefined;
  const service = product ? undefined : item as Service;
  return <Page>
    <TopBar title={`${resolvedKind === "product" ? "Product" : "Service"} details`} back right={<Button title="Share" icon="share-social-outline" variant="quiet" small onPress={() => void Share.share({ message: `${item.name} · ${item.businessName ?? "Mabiz business"} · ${itemPriceLine(item)}` })} />} />
    {error ? <AlertBlock message={error} onRetry={() => void load()} /> : null}
    {gallery.length ? <View style={{ gap: 7 }}>{gallery.map((image, index) => <View key={`${image.mediaAssetId}-${index}`} style={{ gap: 4 }}>
      <MediaImage uri={image.url} height={index === 0 ? 260 : 180} label={image.altText || `${item.name} ${index === 0 ? "primary image" : `image ${index + 1}`}`} />
      <Text style={styles.caption}>{index === 0 ? "Primary image" : `Image ${index + 1} of ${gallery.length}`}{image.altText ? ` · ${image.altText}` : ""}</Text>
    </View>)}</View> : <MediaImage height={200} label={`${item.name} has no image yet`} />}
    <View style={{ gap: 7 }}>
      <Text style={styles.sectionHeading}>{item.name}</Text>
      <Text style={{ color: colors.emeraldDark, fontSize: 22, fontWeight: "800" }}>{itemPriceLine(item)}</Text>
      <Text style={styles.caption}>{item.availability ?? "Available"} · {item.category}</Text>
      <Text style={styles.body}>{item.description}</Text>
    </View>
    <View style={[styles.card, { padding: 14, gap: 6 }]}>
      <Text style={styles.cardTitle}>Details</Text>
      {item.sku ? <Text style={styles.caption}>SKU · {item.sku}</Text> : null}
      {product && typeof product.stockQuantity === "number" ? <Text style={styles.caption}>Stock · {product.stockQuantity}{product.inStock === false ? " (marked out of stock)" : ""}</Text> : null}
      {product?.unit ? <Text style={styles.caption}>Unit · {product.unit}</Text> : null}
      {service?.durationMinutes ? <Text style={styles.caption}>Duration · {service.durationMinutes} minutes</Text> : null}
      {service?.leadTimeDays !== undefined && service?.leadTimeDays !== null ? <Text style={styles.caption}>Lead time · {service.leadTimeDays} days</Text> : null}
      {service?.visitType ? <Text style={styles.caption}>Visit type · {service.visitType}</Text> : null}
      {service?.serviceAreas?.length ? <Text style={styles.caption}>Service areas · {service.serviceAreas.join(", ")}</Text> : null}
      {item.publishedAt ? <Text style={styles.caption}>Published {new Date(item.publishedAt).toLocaleDateString("en-KE")}</Text> : null}
      {item.location ? <Text style={styles.caption}>{item.location}</Text> : null}
    </View>
    <View style={[styles.row, { flexWrap: "wrap" }]}>
      {item.businessId ? <Button title={startingEnquiry ? "Starting…" : "Ask about this item"} icon="chatbubble-outline" disabled={startingEnquiry} onPress={() => void startEnquiry()} /> : null}
      {item.businessId ? <Button title="Visit business" icon="storefront-outline" variant="outline" onPress={() => router.push({ pathname: "/business/[id]", params: { id: item.businessId } })} /> : null}
      <Button title="Browse catalogue" icon="grid-outline" variant="quiet" onPress={() => router.push("/products")} />
    </View>
    <Text style={styles.caption}>Mabiz connects buyers and sellers directly. No checkout or payment is processed in this app.</Text>
  </Page>;
}
