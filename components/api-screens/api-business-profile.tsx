import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import {
  Avatar,
  Button,
  EmptyState,
  LoadingState,
  Page,
  SectionTitle,
  Stat,
  TopBar,
  styles,
} from "@/components/biz-ui";
import { ApiPostCard } from "@/components/api-post-card";
import { useAppStore } from "@/hooks/use-app-store";
import { useMabizServices } from "@/lib/services/service-provider";
import { errorText, pageRequest } from "@/lib/api-helpers";
import { colors } from "@/theme/tokens";
import type { Business, Post } from "@/types/domain";
import { useThemeContext } from "@/lib/theme-provider";

export function ApiBusinessProfile({ businessId }: { businessId: string }) {
  useThemeContext();
  const services = useMabizServices();
  const app = useAppStore();
  const [business, setBusiness] = useState<Business | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [businessResult, postsResult, followResult] = await Promise.all([
      services.businesses.get(businessId),
      services.posts.listBusinessPosts(businessId, pageRequest()),
      services.businesses.getFollowStatus(businessId),
    ]);
    if (!businessResult.ok) setError(errorText(businessResult.error));
    else setBusiness(businessResult.data);
    if (!postsResult.ok)
      setError((current) =>
        current ? `${current}; posts: ${errorText(postsResult.error)}` : `Posts: ${errorText(postsResult.error)}`
      );
    else setPosts(postsResult.data.items);
    if (!followResult.ok) setActionError(errorText(followResult.error));
    else {
      setFollowing(followResult.data.following);
      setFollowerCount(followResult.data.followerCount);
    }
    setLoading(false);
  }, [businessId, services]);
  useEffect(() => {
    void load();
  }, [load]);
  const toggleFollow = async () => {
    setBusy(true);
    setActionError("");
    const result = following
      ? await services.businesses.unfollow(businessId)
      : await services.businesses.follow(businessId);
    if (!result.ok) setActionError(errorText(result.error));
    else {
      const status = await services.businesses.getFollowStatus(businessId);
      if (!status.ok) setActionError(errorText(status.error));
      else {
        setFollowing(status.data.following);
        setFollowerCount(status.data.followerCount);
      }
    }
    setBusy(false);
  };
  const startEnquiry = async () => {
    if (!app.isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    setBusy(true);
    setActionError("");
    const result = await services.messaging.startConversation({
      businessId,
      firstMessage: "Hello, I would like to learn more about your business.",
    });
    if (!result.ok) setActionError(errorText(result.error));
    else router.push({ pathname: "/messages/[id]", params: { id: result.data.id } });
    setBusy(false);
  };
  return (
    <Page onRefresh={() => void load()} refreshing={loading}>
      <TopBar title="Business profile" back />
      {error ? (
        <View accessibilityRole="alert">
          <Text style={styles.body}>Business profile error: {error}</Text>
          <Button title="Retry" small variant="outline" onPress={() => void load()} />
        </View>
      ) : null}
      {loading ? <LoadingState label="Loading business profile" /> : null}
      {!loading && !error && business ? (
        <>
          <View style={{ padding: 17, borderRadius: 20, backgroundColor: colors.surface, gap: 9, alignItems: "center" }}>
            <Avatar name={business.name} image={business.logo} size={78} ring />
            <Text style={styles.sectionHeading}>{business.name}</Text>
            <Text style={styles.caption}>
              {business.category} · {business.town}, {business.county}
            </Text>
            <Text style={styles.body}>{business.description}</Text>
            <Stat value={followerCount ?? business.followers} label="Followers" />
            <Button
              title={busy ? "Working…" : following ? "Following · unfollow" : "Follow business"}
              icon={following ? "checkmark" : "add-outline"}
              variant={following ? "soft" : "primary"}
              disabled={busy || !app.isAuthenticated}
              onPress={() => void toggleFollow()}
            />
            <Button
              title="Message business"
              icon="chatbubble-outline"
              variant="outline"
              disabled={busy}
              onPress={() => void startEnquiry()}
            />
            {actionError ? (
              <Text accessibilityRole="alert" style={{ ...styles.caption, color: colors.danger }}>
                Follow error: {actionError}
              </Text>
            ) : null}
            <Button
              title="View followers"
              variant="outline"
              onPress={() => router.push({ pathname: "/menu/followers", params: { businessId } })}
            />
          </View>
          <SectionTitle title={`Posts · ${posts.length}`} />
          {posts.length ? (
            posts.map((post) => <ApiPostCard key={post.id} post={post} />)
          ) : (
            <EmptyState
              title="No posts yet"
              detail="Business posts that are visible to you will appear here."
              icon="albums-outline"
            />
          )}
        </>
      ) : null}
    </Page>
  );
}