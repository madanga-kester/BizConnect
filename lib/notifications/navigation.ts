import { router } from "expo-router";
import type { NotificationItem } from "@/types/domain";

export interface NotificationDestination {
  kind?: string;
  targetType?: string;
  targetId?: string;
  businessId?: string;
  postId?: string;
  conversationId?: string;
  catalogItemId?: string;
}

function first(...values: Array<string | undefined>): string | undefined {
  return values.find((value) => typeof value === "string" && value.length > 0);
}

export function navigateToNotification(item: NotificationDestination | NotificationItem): void {
  const target = (item.targetType ?? "").toLowerCase();
  const conversationId = first(item.conversationId, target === "conversation" ? item.targetId : undefined);
  const postId = first(item.postId, target === "post" ? item.targetId : undefined);
  const catalogItemId = first(item.catalogItemId, target === "catalog_item" || target === "catalogue_item" ? item.targetId : undefined);
  const businessId = first(item.businessId, target === "business" || target === "team" ? item.targetId : undefined);

  if (conversationId) router.push({ pathname: "/messages/[id]", params: { id: conversationId } });
  else if (postId) router.push({ pathname: "/post/[id]", params: { id: postId } });
  else if (catalogItemId) router.push({ pathname: "/product/[id]", params: { id: catalogItemId } });
  else if (businessId) router.push({ pathname: "/business/[id]", params: { id: businessId } });
  else router.push("/notifications");
}
