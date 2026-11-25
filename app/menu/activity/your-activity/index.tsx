import { router } from "expo-router";
import { BusinessCard, EmptyState, Page, TopBar } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { filterVisibleBusinesses } from "@/utils/privacy-policy";
export default function RecentlyViewedScreen() { const app = useAppStore(); const visibleBusinesses = filterVisibleBusinesses(app.businesses, app.blockedUsers); const items = app.recentlyViewed.map((id) => visibleBusinesses.find((business) => business.id === id)).filter((business): business is NonNullable<typeof business> => Boolean(business)); return <Page><TopBar title="Recently viewed" back />{items.length ? items.map((business) => <BusinessCard key={business.id} business={business} />) : <EmptyState title="Nothing viewed recently" detail="Explore a business profile and it will appear here on this device." action="Discover businesses" onAction={() => router.replace("/discover")} />}</Page>; }
