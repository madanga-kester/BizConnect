import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
  Avatar,
  Button,
  Chip,
  EmptyState,
  Field,
  LoadingState,
  Page,
  TopBar,
  styles,
} from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { useMabizServices } from "@/lib/services/service-provider";
import { errorText, pageRequest } from "@/lib/api-helpers";
import { colors } from "@/theme/tokens";
import type { UserProfile } from "@/types/domain";

export function ApiFollowersScreen({ selectedBusinessId }: { selectedBusinessId?: string }) {
  const services = useMabizServices();
  const app = useAppStore();
  const [list, setList] = useState<"Followers" | "Following">("Following");
  const [mode, setMode] = useState<"People" | "Businesses">("People");
  const [businessId, setBusinessId] = useState(selectedBusinessId ?? "");
  const [people, setPeople] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    if (mode === "Businesses" && list === "Following") {
      setPeople([]);
      setLoading(false);
      return;
    }
    if (mode === "Businesses" && !businessId.trim()) {
      setPeople([]);
      setError("Select or enter a business ID to view its followers.");
      setLoading(false);
      return;
    }
    const result =
      mode === "People"
        ? list === "Followers"
          ? await services.users.listFollowers("me", pageRequest())
          : await services.users.listFollowing("me", pageRequest())
        : await services.businesses.listFollowers(businessId.trim(), pageRequest());
    if (!result.ok) setError(errorText(result.error));
    else setPeople(result.data.items);
    setLoading(false);
  }, [businessId, list, mode, services]);
  useEffect(() => {
    void load();
  }, [load]);
  return (
    <Page onRefresh={() => void load()} refreshing={loading}>
      <TopBar title="Followers & following" back />
      {!app.isAuthenticated ? (
        <EmptyState
          title="Sign in to view social lists"
          detail="These lists require an authenticated API session."
          icon="lock-closed-outline"
          action="Sign in"
          onAction={() => router.push("/auth/login")}
        />
      ) : (
        <>
          <View style={styles.row}>
            <Chip label="Followers" selected={list === "Followers"} onPress={() => setList("Followers")} />
            <Chip label="Following" selected={list === "Following"} onPress={() => setList("Following")} />
          </View>
          <View style={styles.row}>
            <Chip label="People" selected={mode === "People"} onPress={() => setMode("People")} />
            <Chip label="Businesses" selected={mode === "Businesses"} onPress={() => setMode("Businesses")} />
          </View>
          {mode === "Businesses" ? (
            <Field
              label="Business ID (required for business followers)"
              value={businessId}
              onChangeText={setBusinessId}
              placeholder="Business ID"
              autoCapitalize="none"
            />
          ) : null}
          {mode === "Businesses" && list === "Following" ? (
            <Text style={styles.caption}>The API does not provide a business-following list route yet.</Text>
          ) : null}
          {error ? (
            <View accessibilityRole="alert">
              <Text style={{ ...styles.body, color: colors.danger }}>List error: {error}</Text>
              <Button title="Retry" small variant="outline" onPress={() => void load()} />
            </View>
          ) : null}
          {loading ? <LoadingState label="Loading list from server" /> : null}
          {!loading && !error && !people.length && !(mode === "Businesses" && list === "Following") ? (
            <EmptyState
              title={list === "Followers" ? "No followers yet" : "Not following anyone yet"}
              detail="This list is returned by the server."
              icon="people-outline"
            />
          ) : null}
          {people.map((person) => (
            <Pressable
              key={person.id}
              onPress={() => router.push({ pathname: "/person/[id]", params: { id: person.id } })}
              style={styles.actionTile}
            >
              <Avatar name={person.name} image={person.avatar} size={42} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{person.name}</Text>
                <Text style={styles.caption}>
                  @{person.username} · {person.town}
                </Text>
              </View>
            </Pressable>
          ))}
        </>
      )}
    </Page>
  );
}