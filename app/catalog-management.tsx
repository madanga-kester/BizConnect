import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { ApiCatalogManagement } from "@/components/api-catalog-screens";
import { Button, Chip, ConfirmModal, EmptyState, LocalNote, MediaImage, Page, SectionTitle, TopBar, VideoPreview, styles } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { useMabizServiceMode } from "@/lib/services/service-provider";
import { formatKes } from "@/utils/kenya";
import { BUSINESS_CONTENT_ROLES, getBusinessRole, hasBusinessRole } from "@/utils/business-permissions";
import type { Business, Product, Service } from "@/types/domain";

type ItemKind = "Products" | "Services";

export default function CatalogManagementScreen() {
  const app = useAppStore();
  const apiMode = useMabizServiceMode() === "api";
  const business = app.businesses.find((item) => item.id === app.activeBusinessId);

  if (!app.isAuthenticated) return <Page><TopBar title="Manage catalogue" back /><EmptyState title="Sign in to manage a catalogue" detail="Product and service changes stay on this device in the local demo." action="Sign in" onAction={() => router.push("/auth/login")} /></Page>;
  if (!business) return <Page><TopBar title="Manage catalogue" back /><EmptyState title="Choose a business first" detail="Switch to one of your business identities in your profile." action="Open profile" onAction={() => router.push("/(tabs)/profile")} /></Page>;
  if (!hasBusinessRole(business, app.user.id, BUSINESS_CONTENT_ROLES)) return <Page><TopBar title="Manage catalogue" back /><EmptyState title="You do not have catalogue access" detail="Ask a business Owner or Administrator to add you to the team." /></Page>;

  // Stage 5: API mode reads and writes the server catalogue instead of the device store.
  if (apiMode) return <ApiCatalogManagement businessId={business.id} />;
  return <MockCatalogManagement business={business} />;
}

function MockCatalogManagement({ business }: { business: Business }) {
  const app = useAppStore();
  const [kind, setKind] = useState<ItemKind>("Products");
  const [visibility, setVisibility] = useState<"Active" | "Archived" | "All">("Active");
  const [removeId, setRemoveId] = useState<string>();

  const role = getBusinessRole(business, app.user.id);
  const currentBusiness = () => {
    const current = app.businesses.find((item) => item.id === business.id);
    return app.isAuthenticated && current && hasBusinessRole(current, app.user.id, BUSINESS_CONTENT_ROLES) ? current : undefined;
  };
  const products = business.products.filter((item) => visibility === "All" || Boolean(item.archived) === (visibility === "Archived"));
  const services = business.services.filter((item) => visibility === "All" || Boolean(item.archived) === (visibility === "Archived"));
  const toggleProductArchive = (productId: string) => {
    const current = currentBusiness();
    if (!current) return;
    app.updateBusiness(current.id, { products: current.products.map((item) => item.id === productId ? { ...item, archived: !item.archived } : item) }, BUSINESS_CONTENT_ROLES);
  };
  const toggleServiceArchive = (serviceId: string) => {
    const current = currentBusiness();
    if (!current) return;
    app.updateBusiness(current.id, { services: current.services.map((item) => item.id === serviceId ? { ...item, archived: !item.archived } : item) }, BUSINESS_CONTENT_ROLES);
  };
  const remove = () => {
    const current = currentBusiness();
    if (!current || !removeId) { setRemoveId(undefined); return; }
    app.updateBusiness(current.id, kind === "Products" ? { products: current.products.filter((item) => item.id !== removeId) } : { services: current.services.filter((item) => item.id !== removeId) }, BUSINESS_CONTENT_ROLES);
    setRemoveId(undefined);
  };
  const editProduct = (item: Product) => router.push({ pathname: "/create-catalog-item", params: { kind: "product", itemId: item.id } });
  const editService = (item: Service) => router.push({ pathname: "/create-catalog-item", params: { kind: "service", itemId: item.id } });

  return <Page>
    <TopBar title="Manage catalogue" back />
    <LocalNote text={`${business.name} · ${role} · local catalogue only · no checkout, payments, inventory sync or public upload`} />
    <View style={{ flexDirection: "row", gap: 8 }}>
      <Chip label={`Products · ${business.products.length}`} selected={kind === "Products"} onPress={() => setKind("Products")} />
      <Chip label={`Services · ${business.services.length}`} selected={kind === "Services"} onPress={() => setKind("Services")} />
    </View>
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>
      {(["Active", "Archived", "All"] as const).map((item) => <Chip key={item} label={item} selected={visibility === item} onPress={() => setVisibility(item)} />)}
    </View>
    <View style={styles.row}>
      <Button title={`Create ${kind === "Products" ? "product" : "service"}`} icon="add-outline" onPress={() => router.push({ pathname: "/create-catalog-item", params: { kind: kind === "Products" ? "product" : "service" } })} />
      <Button title="Business profile" icon="business-outline" variant="outline" onPress={() => router.push({ pathname: "/business/[id]", params: { id: business.id } })} />
    </View>
    <SectionTitle title={`${visibility} ${kind.toLocaleLowerCase("en-KE")}`} />
    {kind === "Products" ? products.map((item) => <View key={item.id} style={[styles.card, { padding: 13, gap: 8 }]}>
      <View style={styles.rowBetween}><View style={{ flex: 1 }}><View style={styles.rowBetween}><View style={{ flex: 1 }}><View style={styles.row}><Chip label={item.archived ? "Archived" : item.availability} selected={item.archived} /><Chip label={item.category} /></View><SectionTitle title={item.name} /></View></View><View style={styles.row}><Chip label={formatKes(item.price)} /><Chip label={item.discountedPrice !== undefined ? `Offer ${formatKes(item.discountedPrice)}` : "Regular price"} /></View></View></View>
      <View style={{ gap: 7 }}>{(item.images?.length ? item.images : item.image ? [item.image] : []).map((uri, index) => <MediaImage key={`${uri}-${index}`} uri={uri} height={150} label={`${item.name} image ${index + 1}`} />)}{item.video ? <VideoPreview uri={item.video} height={190} /> : null}</View>
      <View><Text style={styles.body}>{item.description}</Text><Text style={styles.caption}>{item.location} · {item.stockQuantity === undefined ? "Stock not specified" : `${item.stockQuantity} in demo stock`}</Text>{item.variations?.length ? <Text style={styles.caption}>Variations · {item.variations.map((variation) => `${variation.name}: ${variation.options.join(", ")}`).join(" · ")}</Text> : null}{item.sizes?.length ? <Text style={styles.caption}>Sizes · {item.sizes.join(", ")}</Text> : null}{item.colours?.length ? <Text style={styles.caption}>Colours · {item.colours.join(", ")}</Text> : null}{item.specifications ? <Text style={styles.caption}>Specifications · {item.specifications}</Text> : null}{item.collectionAndDelivery ? <Text style={styles.caption}>Collection/delivery · {item.collectionAndDelivery}</Text> : null}</View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}><Button title="Edit" icon="create-outline" small variant="outline" onPress={() => editProduct(item)} /><Button title={item.archived ? "Restore" : "Archive"} icon={item.archived ? "refresh-outline" : "archive-outline"} small variant="soft" onPress={() => toggleProductArchive(item.id)} /><Button title="Delete" icon="trash-outline" small variant="danger" onPress={() => setRemoveId(item.id)} /></View>
    </View>) : services.map((item) => <View key={item.id} style={[styles.card, { padding: 13, gap: 8 }]}>
      <View style={styles.rowBetween}><View style={{ flex: 1, gap: 4 }}><View style={styles.row}><Chip label={item.archived ? "Archived" : item.availability ?? "Available"} selected={item.archived} /><Chip label={item.category} /></View><SectionTitle title={item.name} /><View style={styles.row}><Chip label={item.priceLabel} />{item.pricingModel ? <Chip label={`${item.pricingModel} pricing`} /> : null}</View></View></View>
      <View style={{ gap: 7 }}>{item.images?.map((uri, index) => <MediaImage key={`${uri}-${index}`} uri={uri} height={150} label={`${item.name} image ${index + 1}`} />)}{item.video ? <VideoPreview uri={item.video} height={190} /> : null}</View>
      <View><Text style={styles.body}>{item.description}</Text><Text style={styles.caption}>{item.location} · {item.durationMinutes ? `${item.durationMinutes} minutes` : "Duration not specified"}</Text>{item.serviceAreas?.length ? <Text style={styles.caption}>Service areas · {item.serviceAreas.join(", ")}</Text> : null}{item.workingHours ? <Text style={styles.caption}>Hours · {item.workingHours}</Text> : null}{item.bookingInstructions ? <Text style={styles.caption}>Booking · {item.bookingInstructions}</Text> : null}</View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}><Button title="Edit" icon="create-outline" small variant="outline" onPress={() => editService(item)} /><Button title={item.archived ? "Restore" : "Archive"} icon={item.archived ? "refresh-outline" : "archive-outline"} small variant="soft" onPress={() => toggleServiceArchive(item.id)} /><Button title="Delete" icon="trash-outline" small variant="danger" onPress={() => setRemoveId(item.id)} /></View>
    </View>)}
    {kind === "Products" && !products.length ? <EmptyState title={`No ${visibility.toLocaleLowerCase("en-KE")} products`} detail="Add a catalogue product or change the visibility filter." icon="pricetag-outline" action="Create product" onAction={() => router.push({ pathname: "/create-catalog-item", params: { kind: "product" } })} /> : null}
    {kind === "Services" && !services.length ? <EmptyState title={`No ${visibility.toLocaleLowerCase("en-KE")} services`} detail="Add a catalogue service or change the visibility filter." icon="briefcase-outline" action="Create service" onAction={() => router.push({ pathname: "/create-catalog-item", params: { kind: "service" } })} /> : null}
    <ConfirmModal visible={Boolean(removeId)} title={`Delete this ${kind === "Products" ? "product" : "service"}?`} detail="The record is removed from this device’s business catalogue only. No remote catalogue is modified." confirmLabel="Delete locally" destructive onCancel={() => setRemoveId(undefined)} onConfirm={remove} />
  </Page>;
}
