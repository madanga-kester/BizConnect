import type { PageRequest } from "@/lib/api/contracts";
import { createMockServices } from "@/lib/services/mock-services";

export const mockServices = createMockServices();

/** Compatibility reads delegate to the full in-memory adapter; they never call a server. */
export const mockApi = {
  readonlyMode: "mock-local" as const,
  listBusinesses(request: PageRequest = { limit: 10 }) {
    return mockServices.businesses.list(request);
  },
  listPosts(request: PageRequest = { limit: 5 }) {
    return mockServices.posts.listFeed({ ...request, mode: "for-you" });
  },
  listStories(request: PageRequest = { limit: 10 }) {
    return mockServices.stories.listStories(request);
  },
  listOpportunities(request: PageRequest = { limit: 10 }) {
    return mockServices.stories.listOpportunities(request);
  },
  listNotifications(request: PageRequest = { limit: 10 }) {
    return mockServices.notifications.list(request);
  },
  getBusiness(businessId: string) {
    return mockServices.businesses.get(businessId);
  },
};
