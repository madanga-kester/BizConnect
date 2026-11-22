import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  Avatar,
  EmptyState,
  LoadingState,
  Page,
  TopBar,
  styles,
} from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { useMabizServices } from "@/lib/services/service-provider";
import { pageRequest } from "@/lib/api-helpers";
import { colors, createThemedStyles } from "@/theme/tokens";
import type { UserProfile } from "@/types/domain";
import { useThemeContext } from "@/lib/theme-provider";
import { InlineError } from "./inline-error";

type Tab = "Followers" | "Following";

/**
 * - `selectedBusinessId` set  -> that business's followers (no tabs).
 * - `personId` set            -> that person's lists.
 * - neither                   -> the signed-in user's lists ("me").
 * - `initialTab` lets a tapped stat open the matching tab.
 * The route file must forward `businessId`, `personId` and `tab` params.
 */
export function ApiFollowersScreen({
  selectedBusinessId,
  personId,
  initialTab,
}: {
  selectedBusinessId?: string;
  personId?: string;
  initialTab?: string;
}) {
  useThemeContext();
  const services = useMabizServices();
  const app = useAppStore();
  const isBusiness = Boolean(selectedBusinessId);
  const userId = personId && personId !== app.user.id ? personId : "me";
  const [list, setList] = useState<Tab>(
    initialTab === "Following" ? "Following" : "Followers"
  );
  const [people, setPeople] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setFailed(false);
    const result = isBusiness
      ? await services.businesses.listFollowers(
          selectedBusinessId as string,
          pageRequest()
        )
      : list === "Followers"
        ? await services.users.listFollowers(userId, pageRequest())
        : await services.users.listFollowing(userId, pageRequest());
    if (!result.ok) {
      setPeople([]);
      setFailed(true);
    } else setPeople(result.data.items);
    setLoading(false);
  }, [isBusiness, selectedBusinessId, list, userId, services]);

  useEffect(() => {
    if (app.isAuthenticated) void load();
  }, [load, app.isAuthenticated]);

  return (
    <Page onRefresh={() => void load()} refreshing={loading}>
      <TopBar
        title={isBusiness ? "Followers" : "Followers & following"}
        back
      />
      {!app.isAuthenticated ? (
        <EmptyState
          title="Sign in to see followers"
          detail="Create an account or sign in to view followers and who people follow."
          icon="lock-closed-outline"
          action="Sign in"
          onAction={() => router.push("/auth/login")}
        />
      ) : (
        <>
          {!isBusiness ? (
            <View accessibilityRole="tablist" style={localStyles.tabBar}>
              {(["Followers", "Following"] as const).map((tab) => {
                const active = list === tab;
                return (
                  <Pressable
                    key={tab}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    onPress={() => setList(tab)}
                    style={[localStyles.tab, active && localStyles.tabActive]}
                  >
                    <Text
                      style={[
                        localStyles.tabText,
                        active && localStyles.tabTextActive,
                      ]}
                    >
                      {tab}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {failed ? (
            <InlineError
              message="Couldn't load this list. Check your connection and try again."
              onRetry={() => void load()}
            />
          ) : null}

          {loading && !people.length ? (
            <LoadingState label="Loading list" />
          ) : null}

          {!loading && !failed && !people.length ? (
            <EmptyState
              title={
                list === "Followers" || isBusiness
                  ? "No followers yet"
                  : "Not following anyone yet"
              }
              detail={
                list === "Followers" || isBusiness
                  ? "When people follow, they will show up here."
                  : "Accounts followed will show up here."
              }
              icon="people-outline"
            />
          ) : null}

          {people.length > 0 ? (
            <View style={localStyles.listContainer}>
              {people.map((person) => (
                <Pressable
                  key={person.id}
                  accessibilityRole="button"
                  accessibilityLabel={`View ${person.name}'s profile`}
                  onPress={() =>
                    router.push({
                      pathname: "/person/[id]",
                      params: { id: person.id },
                    })
                  }
                  style={({ pressed }) => [
                    localStyles.personRow,
                    pressed && { opacity: 0.6 },
                  ]}
                >
                  <Avatar name={person.name} image={person.avatar} size={46} />
                  <View style={localStyles.personInfo}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {person.name}
                    </Text>
                    <Text style={styles.caption} numberOfLines={1}>
                      @{person.username} · {person.town}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={colors.muted}
                  />
                </Pressable>
              ))}
            </View>
          ) : null}
        </>
      )}
    </Page>
  );
}

const localStyles = createThemedStyles(() =>
  StyleSheet.create({
    tabBar: {
      flexDirection: "row",
      marginHorizontal: -16,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    tab: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
    },
    tabActive: { borderBottomColor: colors.ink },
    tabText: { fontSize: 14, fontWeight: "600", color: colors.muted },
    tabTextActive: { color: colors.ink, fontWeight: "700" },
    listContainer: {
      marginHorizontal: -16,
      backgroundColor: colors.surface,
    },
    personRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    personInfo: { flex: 1, gap: 2 },
  })
);
