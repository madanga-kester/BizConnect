import { Ionicons } from "@expo/vector-icons";
import { Pressable, Switch, Text, View } from "react-native";
import { Button, Chip, Field, MediaImage, VideoPreview } from "@/components/biz-ui";
import type { PostComposer } from "@/components/create/use-post-composer";
import { colors } from "@/theme/tokens";
import { useThemeContext } from "@/lib/theme-provider";

export function StepDetails({ composer }: { composer: PostComposer }) {
  useThemeContext();
  const {
    app,
    kind,
    media,
    setMedia,
    setMediaItems,
    selectMediaFiles,
    taggedBusinesses,
    setTaggedBusinesses,
    location,
    setLocation,
    selectedProduct,
    selectedProductId,
    setSelectedProductId,
    productsForIdentity,
    activePicker,
    setActivePicker,
    audience,
    setAudience,
    commentsOn,
    setCommentsOn,
    setStep,
  } = composer;

  return (
    <View style={{ gap: 14, paddingTop: 4 }}>
      <Text style={{ color: colors.navy, fontSize: 18, fontWeight: "800" }}>Add to your post</Text>

      <Pressable
        onPress={() => void selectMediaFiles("images")}
        style={{
          padding: 24,
          borderRadius: 16,
          backgroundColor: colors.subtle,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: "center",
          gap: 8,
        }}
      >
        <Ionicons name="images-outline" size={32} color={colors.muted} />
        <Text style={{ color: colors.navy, fontSize: 14, fontWeight: "700" }}>Add photos or videos</Text>
      </Pressable>

      {media ? (
        <View style={{ position: "relative", alignSelf: "flex-start" }}>
          {kind === "video" ? (
            <VideoPreview uri={media} height={130} />
          ) : (
            <MediaImage uri={media} height={120} label="Attached media" />
          )}
          <Pressable
            onPress={() => {
              setMedia(undefined);
              setMediaItems([]);
            }}
            style={{
              position: "absolute",
              right: 6,
              top: 6,
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: colors.navy,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="close" size={14} color={colors.white} />
          </Pressable>
        </View>
      ) : null}

      <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 16, overflow: "hidden" }}>
        {[
          {
            label: taggedBusinesses.length ? `Tagged (${taggedBusinesses.length})` : "Tag people",
            icon: "person-outline" as const,
            key: "tag" as const,
          },
          {
            label: location ? `Location \u00B7 ${location}` : "Add location",
            icon: "location-outline" as const,
            key: "location" as const,
          },
          {
            label: selectedProduct ? `Product \u00B7 ${selectedProduct.name}` : "Add product",
            icon: "pricetag-outline" as const,
            key: "product" as const,
          },
        ].map((row, idx, arr) => (
          <Pressable
            key={row.key}
            onPress={() => setActivePicker(activePicker === row.key ? "none" : row.key)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 14,
              backgroundColor: colors.surface,
              borderBottomWidth: idx < arr.length - 1 ? 1 : 0,
              borderBottomColor: colors.border,
              gap: 12,
            }}
          >
            <Ionicons name={row.icon} size={20} color={colors.navy} />
            <Text style={{ flex: 1, color: colors.navy, fontSize: 14, fontWeight: "600" }}>{row.label}</Text>
            <Ionicons
              name={activePicker === row.key ? "chevron-down" : "chevron-forward"}
              size={16}
              color={colors.muted}
            />
          </Pressable>
        ))}
      </View>

      {activePicker === "location" ? (
        <Field label="Location" value={location} onChangeText={setLocation} placeholder="Town or county" />
      ) : null}

      {activePicker === "tag" ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {app.businesses.map((b) => (
            <Chip
              key={b.id}
              label={b.name}
              selected={taggedBusinesses.includes(b.id)}
              onPress={() =>
                setTaggedBusinesses((prev) =>
                  prev.includes(b.id) ? prev.filter((id) => id !== b.id) : [...prev, b.id]
                )
              }
            />
          ))}
        </View>
      ) : null}

      {activePicker === "product" ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {productsForIdentity.length ? (
            productsForIdentity.map((p) => (
              <Chip
                key={p.id}
                label={`${p.name} \u00B7 KSh ${p.price}`}
                selected={selectedProductId === p.id}
                onPress={() => setSelectedProductId(selectedProductId === p.id ? undefined : p.id)}
              />
            ))
          ) : (
            <Text style={{ color: colors.muted, fontSize: 12 }}>No products in your catalogue yet.</Text>
          )}
        </View>
      ) : null}

      <View style={{ gap: 10, paddingVertical: 4 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Ionicons name="globe-outline" size={20} color={colors.navy} />
            <Text style={{ color: colors.navy, fontSize: 14, fontWeight: "600" }}>Audience</Text>
          </View>
          <Pressable
            onPress={() => setAudience(audience === "public" ? "followers" : "public")}
            style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
          >
            <Text style={{ color: colors.muted, fontSize: 14, fontWeight: "600" }}>
              {audience === "public" ? "Public" : "Followers"}
            </Text>
            <Ionicons name="chevron-down" size={14} color={colors.muted} />
          </Pressable>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Ionicons name="chatbubble-outline" size={20} color={colors.navy} />
            <Text style={{ color: colors.navy, fontSize: 14, fontWeight: "600" }}>Comments</Text>
          </View>
          <Switch
            value={commentsOn}
            onValueChange={setCommentsOn}
            trackColor={{ false: colors.border, true: colors.emerald }}
            thumbColor={colors.white}
          />
        </View>
      </View>

      <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
        <View style={{ flex: 1 }}>
          <Button title="Back" variant="outline" onPress={() => setStep(1)} />
        </View>
        <View style={{ flex: 1 }}>
          <Button title="Next" onPress={() => setStep(3)} />
        </View>
      </View>
    </View>
  );
}