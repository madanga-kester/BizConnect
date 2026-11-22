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
import type { Post, UserProfile } from "@/types/domain";
import { useThemeContext } from "@/lib/theme-provider";
import { InlineError } from "./inline-error";
import { ProfileHeader } from "./profile-header";

export function ApiPersonProfile({ personId }: { personId: string }) {
  useThemeContext();
  const services = useMabizServices();
  const app = useAppStore();
  const [person, setPerson] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [profileError, setProfileError] = useState(false);
  const [postsError, setPostsError] = useState(false);
  const [actionError, setActionError] = useState("");
  const isSelf = personId === app.user.id || personId === "me";

  const load = useCallback(async () => {
    setLoading(true);
    setProfileError(false);
    setPostsError(false);
    const profileId = isSelf ? "me" : personId;
    const [profileResult, postsResult, followResult] = await Promise.all([
      services.users.getProfile(profileId),
      services.posts.listUserPosts(profileId, pageRequest()),
      isSelf
        ? Promise.resolve(null)
        : services.users.getFollowStatus(personId),
    ]);
    if (!profileResult.ok) setProfileError(true);
    else setPerson(profileResult.data);
    // A posts failure must not hide the profile: it is shown in the Posts section.
    if (!postsResult.ok) setPostsError(true);
    else setPosts(postsResult.data.items);
    if (followResult?.ok) {
      setFollowing(followResult.data.following);
      setFollowerCount(followResult.data.followerCount);
    }
    setLoading(false);
  }, [isSelf, personId, services]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleFollow = async () => {
    if (!app.isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    if (busy) return;
    const wasFollowing = following;
    const prevCount = followerCount;
    const base = prevCount ?? person?.followers;
    // Optimistic update, rolled back if the request fails.
    setBusy(true);
    setActionError("");
    setFollowing(!wasFollowing);
    if (typeof base === "number")
      setFollowerCount(Math.max(0, base + (wasFollowing ? -1 : 1)));
    const result = wasFollowing
      ? await services.users.unfollow(personId)
      : await services.users.follow(personId);
    if (!result.ok) {
      setFollowing(wasFollowing);
      setFollowerCount(prevCount);
      setActionError("Couldn't update follow. Please try again.");
    } else {
      const status = await services.users.getFollowStatus(personId);
      if (status.ok) {
        setFollowing(status.data.following);
        setFollowerCount(status.data.followerCount);
      }
    }
    setBusy(false);
  };

  const openList = (tab: "Followers" | "Following") =>
    router.push({
      pathname: "/menu/followers",
      // Pass the profile being viewed so the list isn't always the signed-in user's.
      params: isSelf ? { tab } : { personId, tab },
    });

  return (
    <Page onRefresh={() => void load()} refreshing={loading}>
      <TopBar title={isSelf ? "Your profile" : "Profile"} back />

      {loading && !person ? <LoadingState label="Loading profile" /> : null}

      {!loading && !person && profileError ? (
        <InlineError
          message="Couldn't load this profile. Check your connection and try again."
          onRetry={() => void load()}
        />
      ) : null}

      {person ? (
        <>
          <ProfileHeader
            name={person.name}
            image={person.avatar}
            subtitle={`@${person.username} · ${person.town}, ${person.county}`}
            bio={person.bio}
            stats={[
              {
                value: followerCount ?? person.followers,
                label: "Followers",
                onPress: () => openList("Followers"),
              },
              {
                value: person.following,
                label: "Following",
                onPress: () => openList("Following"),
              },
              { value: posts.length, label: "Posts" },
            ]}
          >
            {!isSelf ? (
              <View style={localStyles.actionRow}>
                <View style={localStyles.actionCell}>
                  <Button
                    title={following ? "Following" : "Follow"}
                    icon={
                      following ? "checkmark-outline" : "person-add-outline"
                    }
                    variant={following ? "soft" : "primary"}
                    disabled={busy}
                    onPress={() => void toggleFollow()}
                  />
                </View>
              </View>
            ) : null}

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
            <SectionTitle title="Posts" />
            {postsError ? (
              <InlineError
                message="Couldn't load posts."
                onRetry={() => void load()}
              />
            ) : posts.length ? (
              posts.map((post) => <ApiPostCard key={post.id} post={post} />)
            ) : (
              <EmptyState
                title="No posts"
                detail="This profile has no posts visible to you."
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
