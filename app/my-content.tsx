import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { Button, Chip, ConfirmModal, EmptyState, Field, LocalNote, MediaImage, Page, PostCard, TopBar, VideoPreview, styles } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { useClock } from "@/hooks/use-clock";
import type { Business } from "@/types/domain";
import { BUSINESS_CONTENT_ROLES, hasBusinessRole } from "@/utils/business-permissions";
import { draftFromPost, draftFromSocialStory, filterContentIndex, type ContentIndexItem, type ContentSort } from "@/utils/create-content";
import { formatKes } from "@/utils/kenya";
import { newLocalId } from "@/utils/ids";

const FILTERS = ["All", "Posts", "Social Stories", "Drafts", "Scheduled", "Offers", "Events", "Opportunities", "Products", "Services", "Milestones", "Highlights"];
type ManagedItem = ContentIndexItem & { entity: "post" | "story" | "draft" | "scheduled" | "offer" | "event" | "opportunity" | "product" | "service" | "milestone" | "highlight"; businessId?: string; raw?: unknown };
type DeleteTarget = Pick<ManagedItem, "id" | "entity" | "businessId" | "title">;

function LocalMediaPreview({ item }: { item: ManagedItem }) {
  const raw = item.raw && typeof item.raw === "object" ? item.raw as Record<string, unknown> : {};
  const images = new Set<string>();
  const videos = new Set<string>();
  const push = (value: unknown, type?: unknown) => {
    if (typeof value !== "string" || !value.trim()) return;
    (type === "video" ? videos : images).add(value);
  };
  for (const key of ["image", "cover", "coverUri"]) push(raw[key]);
  push(raw.media, raw.mediaType ?? raw.mediaKind);
  push(raw.video, "video");
  for (const key of ["images", "mediaItems"]) {
    const list = raw[key];
    if (!Array.isArray(list)) continue;
    for (const entry of list) {
      if (typeof entry === "string") push(entry, raw.mediaKind);
      else if (entry && typeof entry === "object") {
        const media = entry as Record<string, unknown>;
        push(media.uri, media.type);
      }
    }
  }
  const imageUris = [...images].slice(0, 3);
  const videoUris = [...videos].slice(0, 1);
  return imageUris.length || videoUris.length ? <View style={{ gap: 7 }}>{imageUris.map((uri, index) => <MediaImage key={`${uri}-${index}`} uri={uri} height={135} label={`${item.title} local image ${index + 1}`} />)}{videoUris.map((uri) => <VideoPreview key={uri} uri={uri} height={165} />)}</View> : null;
}

export default function MyContentScreen() {
  const app = useAppStore();
  const now = useClock();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sort, setSort] = useState<ContentSort>("newest");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>();
  const managedBusinesses = app.businesses.filter((business) => business.ownerId === app.user.id || business.team.some((member) => member.userId === app.user.id));
  const businessById = (id?: string) => managedBusinesses.find((business) => business.id === id);

  const items: ManagedItem[] = (() => {
    const result: ManagedItem[] = [];
    const managedIds = new Set(managedBusinesses.map((business) => business.id));
    for (const post of app.posts.filter((item) => item.authorId === app.user.id)) result.push({ id: post.id, kind: "Posts", title: post.contentSubtype ?? post.kind, preview: post.caption, status: "Published locally", updatedAt: post.createdAt, identity: app.businesses.find((business) => business.id === post.identityId)?.name ?? app.user.name, entity: "post", raw: post });
    for (const story of app.socialStories.filter((item) => item.authorId === app.user.id)) result.push({ id: story.id, kind: "Social Stories", title: story.caption || "Social Story", preview: story.overlays.map((item) => item.text).join(" · "), status: now > 0 && Date.parse(story.expiresAt) <= now ? "Expired" : "Active · expires within 24 hours", updatedAt: story.createdAt, identity: app.businesses.find((business) => business.id === story.identityId)?.name ?? app.user.name, entity: "story", raw: story });
    for (const draft of app.drafts) result.push({ id: draft.id, kind: "Drafts", title: `${draft.draftType === "social-story" ? "Story" : draft.kind} draft`, preview: draft.caption, status: "Draft", updatedAt: draft.updatedAt, identity: app.businesses.find((business) => business.id === draft.identityId)?.name ?? app.user.name, entity: "draft", raw: draft });
    for (const post of app.scheduledPosts.filter((item) => item.authorId === app.user.id)) result.push({ id: post.id, kind: "Scheduled", title: post.contentSubtype ?? post.kind, preview: post.caption, status: `Scheduled locally · ${new Date(post.scheduledAt).toLocaleString("en-KE")}`, updatedAt: post.scheduledAt, identity: app.businesses.find((business) => business.id === post.identityId)?.name ?? app.user.name, entity: "scheduled", raw: post });
    for (const offer of app.businessOffers.filter((item) => managedIds.has(item.businessId))) result.push({ id: offer.id, kind: "Offers", title: offer.title, preview: offer.description, status: offer.status, updatedAt: offer.createdAt, identity: businessById(offer.businessId)?.name ?? "Business", entity: "offer", businessId: offer.businessId, raw: offer });
    for (const event of app.businessEvents.filter((item) => item.identityId === app.user.id || managedIds.has(item.identityId))) result.push({ id: event.id, kind: "Events", title: event.title, preview: event.description, status: Date.parse(event.startsAt) >= now ? "Upcoming locally" : "Past locally", updatedAt: event.createdAt, identity: businessById(event.identityId)?.name ?? app.user.name, entity: "event", businessId: event.identityKind === "business" ? event.identityId : undefined, raw: event });
    for (const opportunity of app.communityOpportunities.filter((item) => item.identityId === app.user.id || managedIds.has(item.identityId))) result.push({ id: opportunity.id, kind: "Opportunities", title: opportunity.title, preview: opportunity.description, status: opportunity.expiresAt && Date.parse(opportunity.expiresAt) <= now ? "Expired" : "Open locally", updatedAt: opportunity.createdAt, identity: businessById(opportunity.identityId)?.name ?? app.user.name, entity: "opportunity", businessId: opportunity.identityKind === "business" ? opportunity.identityId : undefined, raw: opportunity });
    for (const business of managedBusinesses) {
      for (const product of business.products) result.push({ id: product.id, kind: "Products", title: product.name, preview: `${formatKes(product.price)} · ${product.description}`, status: product.archived ? "Archived" : product.availability, updatedAt: business.joinedAt, identity: business.name, entity: "product", businessId: business.id, raw: product });
      for (const service of business.services) result.push({ id: service.id, kind: "Services", title: service.name, preview: `${service.priceLabel} · ${service.description}`, status: service.archived ? "Archived" : service.availability ?? "Available", updatedAt: business.joinedAt, identity: business.name, entity: "service", businessId: business.id, raw: service });
      for (const milestone of business.milestones) result.push({ id: milestone.id, kind: "Milestones", title: milestone.title, preview: milestone.description, status: milestone.date, updatedAt: milestone.date, identity: business.name, entity: "milestone", businessId: business.id, raw: milestone });
    }
    for (const highlight of app.storyHighlights.filter((item) => item.ownerId === app.user.id)) result.push({ id: highlight.id, kind: "Highlights", title: highlight.title, preview: `${highlight.storyIds.length} saved local Stories`, status: "Local Highlight", updatedAt: highlight.createdAt, identity: app.user.name, entity: "highlight", raw: highlight });
    return result;
  })();

  const visibleItems = filterContentIndex(items, query, typeFilter, sort).filter((item) => statusFilter === "All" || item.status.toLocaleLowerCase("en-KE").includes(statusFilter.toLocaleLowerCase("en-KE")));
  if (!app.isAuthenticated) return <Page><TopBar title="My Content" back /><EmptyState title="Sign in to manage your content" detail="Your local demo content appears here after signing in on this device." action="Sign in" onAction={() => router.push("/auth/login")} /></Page>;

  const edit = (item: ManagedItem) => {
    if (item.entity === "post") router.push({ pathname: "/(tabs)/create", params: { postId: item.id } });
    else if (item.entity === "story") router.push({ pathname: "/create-social-story", params: { storyId: item.id } });
    else if (item.entity === "draft") { const draft = item.raw as { draftType?: string }; router.push(draft.draftType === "social-story" ? { pathname: "/create-social-story", params: { draftId: item.id } } : { pathname: "/(tabs)/create", params: { draftId: item.id } }); }
    else if (item.entity === "scheduled") router.push({ pathname: "/(tabs)/create", params: { scheduledId: item.id } });
    else if (item.entity === "offer") router.push({ pathname: "/create-listing", params: { kind: "offer", offerId: item.id } });
    else if (item.entity === "event") router.push({ pathname: "/create-listing", params: { kind: "event", eventId: item.id } });
    else if (item.entity === "opportunity") router.push({ pathname: "/create-listing", params: { kind: "opportunity", opportunityId: item.id } });
    else if (item.entity === "product" || item.entity === "service") router.push({ pathname: "/create-catalog-item", params: { kind: item.entity, itemId: item.id, businessId: item.businessId } });
    else if (item.entity === "milestone") router.push({ pathname: "/milestones", params: { businessId: item.businessId, milestoneId: item.id } });
    else if (item.entity === "highlight") router.push({ pathname: "/story-highlight/[id]", params: { id: item.id } });
  };

  const remove = () => {
    if (!deleteTarget) return;
    const { entity, id, businessId: targetBusinessId } = deleteTarget;
    if (entity === "post") app.deletePost(id);
    else if (entity === "story") app.removeSocialStory(id);
    else if (entity === "draft") app.removeDraft(id);
    else if (entity === "scheduled") app.removeScheduledPost(id);
    else if (entity === "offer") app.removeBusinessOffer(id);
    else if (entity === "event") app.removeBusinessEvent(id);
    else if (entity === "opportunity") app.removeCommunityOpportunity(id);
    else if (entity === "highlight") app.removeStoryHighlight(id);
    else {
      const business = businessById(targetBusinessId);
      if (business && entity === "product" && hasBusinessRole(business, app.user.id, BUSINESS_CONTENT_ROLES)) app.updateBusiness(business.id, { products: business.products.filter((product) => product.id !== id) }, BUSINESS_CONTENT_ROLES);
      if (business && entity === "service" && hasBusinessRole(business, app.user.id, BUSINESS_CONTENT_ROLES)) app.updateBusiness(business.id, { services: business.services.filter((service) => service.id !== id) }, BUSINESS_CONTENT_ROLES);
      if (business && entity === "milestone" && hasBusinessRole(business, app.user.id)) app.updateBusiness(business.id, { milestones: business.milestones.filter((milestone) => milestone.id !== id) });
    }
    setDeleteTarget(undefined);
  };

  const duplicate = (item: ManagedItem) => {
    if (item.entity === "post") app.saveDraft(draftFromPost(item.raw as Parameters<typeof draftFromPost>[0], newLocalId("draft")));
    else if (item.entity === "story") app.saveDraft(draftFromSocialStory(item.raw as Parameters<typeof draftFromSocialStory>[0], newLocalId("story-draft")));
  };
  const canEdit = (item: ManagedItem) => !["offer", "event", "opportunity", "product", "service", "milestone"].includes(item.entity) || (item.entity === "milestone" ? Boolean(businessById(item.businessId) && hasBusinessRole(businessById(item.businessId) as Business, app.user.id)) : Boolean(businessById(item.businessId) && hasBusinessRole(businessById(item.businessId) as Business, app.user.id, BUSINESS_CONTENT_ROLES)));
  const canDelete = canEdit;
  const canDuplicate = (item: ManagedItem) => item.entity === "post" || item.entity === "story";

  return <Page>
    <TopBar title="My Content" back />
    <LocalNote text="Unified local content manager · edits and deletion affect this device only · no content is synced or shared" />
    <View style={styles.rowBetween}><Text style={styles.sectionHeading}>Your content · {items.length}</Text><Button title="Create" icon="add-outline" small variant="soft" onPress={() => router.push("/(tabs)/create")} /></View>
    <Field label="Search all content" value={query} onChangeText={setQuery} placeholder="Caption, title, business, status" />
    <Text style={styles.label}>Content type</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>{FILTERS.map((filter) => <Chip key={filter} label={filter} selected={typeFilter === filter} onPress={() => setTypeFilter(filter)} />)}</View>
    <Text style={styles.label}>Status and order</Text><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7 }}>{["All", "Active", "Expired", "Draft", "Scheduled", "Archived", "Published"].map((status) => <Chip key={status} label={status} selected={statusFilter === status} onPress={() => setStatusFilter(status)} />)}</View>
    <View style={styles.row}><Button title="Newest" icon="time-outline" small variant={sort === "newest" ? "soft" : "outline"} onPress={() => setSort("newest")} /><Button title="Oldest" icon="time-outline" small variant={sort === "oldest" ? "soft" : "outline"} onPress={() => setSort("oldest")} /><Button title="Name" icon="text-outline" small variant={sort === "name" ? "soft" : "outline"} onPress={() => setSort("name")} /><Text style={styles.caption}>{visibleItems.length} shown</Text></View>
    {visibleItems.map((item) => <View key={`${item.kind}:${item.id}`} style={{ gap: 7 }}><View style={[styles.rowBetween, { paddingHorizontal: 4, flexWrap: "wrap" }]}><View style={{ flex: 1, gap: 2 }}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.caption}>{item.kind} · {item.identity} · {item.status}</Text><Text style={styles.caption}>{item.preview}</Text></View><View style={{ flexDirection: "row", flexWrap: "wrap", gap: 5 }}>{canEdit(item) ? <Button title="Edit" icon="create-outline" small variant="outline" onPress={() => edit(item)} /> : null}{canDuplicate(item) ? <Button title="Duplicate" icon="copy-outline" small variant="soft" onPress={() => duplicate(item)} /> : null}{canDelete(item) ? <Button title="Delete" icon="trash-outline" small variant="danger" onPress={() => setDeleteTarget({ id: item.id, entity: item.entity, businessId: item.businessId, title: item.title })} /> : null}</View></View>{item.entity === "post" ? <PostCard post={item.raw as Parameters<typeof PostCard>[0]["post"]} /> : <LocalMediaPreview item={item} />}</View>)}
    {!visibleItems.length ? <EmptyState title={items.length ? "No content matches these filters" : "No local content yet"} detail={items.length ? "Adjust the type, status or search, or clear the filters." : "Create a post, Story, listing or catalogue item. It will appear here after saving locally."} icon="documents-outline" action="Clear filters" onAction={() => { setQuery(""); setTypeFilter("All"); setStatusFilter("All"); setSort("newest"); }} /> : null}
    <ConfirmModal visible={Boolean(deleteTarget)} title={`Delete “${deleteTarget?.title ?? "content"}”?`} detail="This action removes the selected record from this device only. It cannot delete a server copy, because local demo records were never uploaded." confirmLabel="Delete locally" destructive onCancel={() => setDeleteTarget(undefined)} onConfirm={remove} />
  </Page>;
}
