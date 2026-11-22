import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  Button,
  EmptyState,
  LoadingState,
  Page,
  SectionTitle,
  TopBar,
  styles,
} from "@/components/biz-ui";
import { ApiPostCard } from "@/components/api-post-card";
import { useAppStore } from "@/hooks/use-app-store";
import { useMabizServices } from "@/lib/services/service-provider";
import { pageRequest } from "@/lib/api-helpers";
import { colors, createThemedStyles } from "@/theme/tokens";
import type { Business, Post } from "@/types/domain";
import { useThemeContext } from "@/lib/theme-provider";
import { InlineError } from "./inline-error";
import { ProfileHeader } from "./profile-header";

export function ApiBusinessProfile({ businessId }: { businessId: string }) {
  useThemeContext();
  const services = useMabizServices();
  const app = useAppStore();
  const [business, setBusiness] = useState<Business | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);
  const [followBusy, setFollowBusy] = useState(false);
  const [messageBusy, setMessageBusy] = useState(false);
  const [businessError, setBusinessError] = useState(false);
  const [postsError, setPostsError] = useState(false);
  const [actionError, setActionError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setBusinessError(false);
    setPostsError(false);
    const [businessResult, postsResult, followResult] = await Promise.all([
      services.businesses.get(businessId),
      services.posts.listBusinessPosts(businessId, pageRequest()),
      services.businesses.getFollowStatus(businessId),
    ]);
    if (!businessResult.ok) setBusinessError(true);
    else setBusiness(businessResult.data);
    if (!postsResult.ok) setPostsError(true);
    else setPosts(postsResult.data.items);
    if (followResult.ok) {
      setFollowing(followResult.data.following);
      setFollowerCount(followResult.data.followerCount);
    }
    setLoading(false);
  }, [businessId, services]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleFollow = async () => {
    if (!app.isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    if (followBusy) return;
    const wasFollowing = following;
    const prevCount = followerCount;
    const base = prevCount ?? business?.followers;
    setFollowBusy(true);
    setActionError("");
    setFollowing(!wasFollowing);
    if (typeof base === "number")
      setFollowerCount(Math.max(0, base + (wasFollowing ? -1 : 1)));
    const result = wasFollowing
      ? await services.businesses.unfollow(businessId)
      : await services.businesses.follow(businessId);
    if (!result.ok) {
      setFollowing(wasFollowing);
      setFollowerCount(prevCount);
      setActionError("Couldn't update follow. Please try again.");
    } else {
      const status = await services.businesses.getFollowStatus(businessId);
      if (status.ok) {
        setFollowing(status.data.following);
        setFollowerCount(status.data.followerCount);
      }
    }
    setFollowBusy(false);
  };

  const startEnquiry = async () => {
    if (!app.isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    if (messageBusy) return;
    setMessageBusy(true);
    setActionError("");
    const result = await services.messaging.startConversation({
      businessId,
      firstMessage: "Hello, I would like to learn more about your business.",
    });
    if (!result.ok)
      setActionError("Couldn't start the conversation. Please try again.");
    else
      router.push({ pathname: "/messages/[id]", params: { id: result.data.id } });
    setMessageBusy(false);
  };

  const openFollowers = () =>
    router.push({ pathname: "/menu/followers", params: { businessId } });

  return (
    <Page onRefresh={() => void load()} refreshing={loading}>
      <TopBar title="Business profile" back />

      {loading && !business ? (
        <LoadingState label="Loading business profile" />
      ) : null}

      {!loading && !business && businessError ? (
        <InlineError
          message="Couldn't load this business. Check your connection and try again."
          onRetry={() => void load()}
        />
      ) : null}

      {business ? (
        <>
          <ProfileHeader
            name={business.name}
            image={business.logo}
            verified={business.verified}
            subtitle={`${business.category} · ${business.town}, ${business.county}`}
            bio={business.description}
            stats={[
              {
                value: followerCount ?? business.followers,
                label: "Followers",
                onPress: openFollowers,
              },
              { value: posts.length, label: "Posts" },
              ...(typeof business.rating === "number"
                ? [{ value: business.rating.toFixed(1), label: "Rating" }]
                : []),
            ]}
          >
            <View style={localStyles.actionRow}>
              <View style={localStyles.actionCell}>
                <Button
                  title={following ? "Following" : "Follow"}
                  icon={following ? "checkmark-outline" : "person-add-outline"}
                  variant={following ? "soft" : "primary"}
                  disabled={followBusy}
                  onPress={() => void toggleFollow()}
                />
              </View>
              <View style={localStyles.actionCell}>
                <Button
                  title="Message"
                  icon="paper-plane-outline"
                  variant="outline"
                  disabled={messageBusy}
                  onPress={() => void startEnquiry()}
                />
              </View>
            </View>

            {actionError ? (
              <Text
                accessibilityRole="alert"
                style={[styles.caption, { color: colors.danger }]}
              >
                {actionError}
              </Text>
            ) : null}
          </ProfileHeader>

          <View style={localStyles.feedSection}>
            <SectionTitle title={`Posts · ${posts.length}`} />
            {postsError ? (
              <InlineError
                message="Couldn't load posts."
                onRetry={() => void load()}
              />
            ) : posts.length ? (
              posts.map((post) => <ApiPostCard key={post.id} post={post} />)
            ) : (
              <EmptyState
                title="No posts yet"
                detail="Business posts that are visible to you will appear here."
                icon="grid-outline"
              />
            )}
          </View>
        </>
      ) : null}
    </Page>
  );
}

const localStyles = createThemedStyles(() =>
  StyleSheet.create({
    actionRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 20,
      marginTop: 6,
      width: "100%",
    },
    actionCell: { flex: 1 },
    feedSection: { paddingTop: 8, gap: 12 },
  })
);
