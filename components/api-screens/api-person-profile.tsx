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
import type { Post, UserProfile } from "@/types/domain";

export function ApiPersonProfile({ personId }: { personId: string }) {
  const services = useMabizServices();
  const app = useAppStore();
  const [person, setPerson] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [following, setFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const isSelf = personId === app.user.id || personId === "me";
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const profileId = isSelf ? "me" : personId;
    const [profileResult, postsResult, followResult] = await Promise.all([
      services.users.getProfile(profileId),
      services.posts.listUserPosts(profileId, pageRequest()),
      isSelf ? Promise.resolve(null) : services.users.getFollowStatus(personId),
    ]);
    if (!profileResult.ok) setError(errorText(profileResult.error));
    else setPerson(profileResult.data);
    if (!postsResult.ok)
      setError((current) =>
        current ? `${current}; posts: ${errorText(postsResult.error)}` : `Posts: ${errorText(postsResult.error)}`
      );
    else setPosts(postsResult.data.items);
    if (followResult) {
      if (!followResult.ok) setActionError(errorText(followResult.error));
      else {
        setFollowing(followResult.data.following);
        setFollowerCount(followResult.data.followerCount);
      }
    }
    setLoading(false);
  }, [isSelf, personId, services]);
  useEffect(() => {
    void load();
  }, [load]);
  const toggleFollow = async () => {
    setBusy(true);
    setActionError("");
    const result = following ? await services.users.unfollow(personId) : await services.users.follow(personId);
    if (!result.ok) setActionError(errorText(result.error));
    else {
      const status = await services.users.getFollowStatus(personId);
      if (!status.ok) setActionError(errorText(status.error));
      else {
        setFollowing(status.data.following);
        setFollowerCount(status.data.followerCount);
      }
    }
    setBusy(false);
  };
  return (
    <Page onRefresh={() => void load()} refreshing={loading}>
      <TopBar title="Founder profile" back />
      {error ? (
        <View accessibilityRole="alert">
          <Text style={styles.body}>Profile error: {error}</Text>
          <Button title="Retry" small variant="outline" onPress={() => void load()} />
        </View>
      ) : null}
      {loading ? <LoadingState label="Loading profile from server" /> : null}
      {!loading && !error && person ? (
        <>
          <View style={{ alignItems: "center", gap: 8, padding: 16, backgroundColor: colors.surface, borderRadius: 20 }}>
            <Avatar name={person.name} image={person.avatar} size={82} ring />
            <Text style={styles.sectionHeading}>{person.name}</Text>
            <Text style={styles.caption}>
              @{person.username} · {person.town}, {person.county}
            </Text>
            <Text style={[styles.body, { textAlign: "center" }]}>{person.bio}</Text>
            <View style={styles.row}>
              <Stat value={followerCount ?? person.followers} label="Followers" />
              <Stat value={person.following} label="Following" />
              <Stat value={posts.length} label="Posts" />
            </View>
            {!isSelf ? (
              <Button
                title={busy ? "Working…" : following ? "Following · unfollow" : "Follow"}
                icon={following ? "checkmark" : "person-add-outline"}
                variant={following ? "soft" : "primary"}
                disabled={busy || !app.isAuthenticated}
                onPress={() => void toggleFollow()}
              />
            ) : null}
            {actionError ? (
              <Text accessibilityRole="alert" style={{ ...styles.caption, color: colors.danger }}>
                Follow error: {actionError}
              </Text>
            ) : null}
            <Button title="Followers & following" variant="outline" onPress={() => router.push("/menu/followers")} />
          </View>
          <SectionTitle title="Posts" />
          {posts.length ? (
            posts.map((post) => <ApiPostCard key={post.id} post={post} />)
          ) : (
            <EmptyState
              title="No posts"
              detail="This profile has not published posts visible to you."
              icon="albums-outline"
            />
          )}
        </>
      ) : null}
    </Page>
  );
}