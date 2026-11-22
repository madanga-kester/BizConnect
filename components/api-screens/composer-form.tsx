import { Ionicons } from "@expo/vector-icons";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { Avatar, Button, Chip, Field, styles } from "@/components/biz-ui";
import { colors, createThemedStyles } from "@/theme/tokens";
import type { Business, UserProfile } from "@/types/domain";
import { useThemeContext } from "@/lib/theme-provider";

type Set<T> = Dispatch<SetStateAction<T>>;

type Props = {
  user: Pick<UserProfile, "name" | "avatar">;
  selectedType: string;
  kind: "text" | "product" | "announcement";
  showPoll: boolean;
  identityKind: "personal" | "business";
  onToggleIdentity: () => void;
  businessId: string;
  setBusinessId: Set<string>;
  activeBusiness?: Business;
  ownedBusinesses: Business[];
  caption: string;
  setCaption: Set<string>;
  pollQuestion: string;
  setPollQuestion: Set<string>;
  pollOptions: string[];
  setPollOptions: Set<string[]>;
  productName: string;
  setProductName: Set<string>;
  productPrice: string;
  setProductPrice: Set<string>;
  productUrl: string;
  setProductUrl: Set<string>;
  announcementTitle: string;
  setAnnouncementTitle: Set<string>;
  pickedCount: number;
  pickedStrip: ReactNode;
  busy: boolean;
  onOpenGallery: (type: "image" | "video") => void;
  mediaType: "image" | "video";
  setMediaType: Set<"image" | "video">;
  urls: string;
  setUrls: Set<string>;
  altText: string;
  setAltText: Set<string>;
  location: string;
  setLocation: Set<string>;
  audience: "public" | "followers" | "private";
  setAudience: Set<"public" | "followers" | "private">;
  allowComments: boolean;
  setAllowComments: Set<boolean>;
  onChangeType: () => void;
  onPreview: () => void;
};

export function ComposerForm(p: Props) {
  useThemeContext();
  return (
    <View style={localStyles.root}>
      <View style={localStyles.typeBand}>
        <View style={localStyles.typeMeta}>
          <Text style={localStyles.typeHeading}>{p.selectedType}</Text>
          <Text style={styles.caption}>Build your post below.</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={p.onChangeType}
          hitSlop={6}
          style={({ pressed }) => [pressed && { opacity: 0.6 }]}
        >
          <Text style={localStyles.changeTypeText}>Change type</Text>
        </Pressable>
      </View>

      <View style={localStyles.identityBand}>
        <Pressable
          accessibilityRole="button"
          onPress={p.onToggleIdentity}
          style={({ pressed }) => [
            localStyles.identityRow,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Avatar
            name={
              p.identityKind === "business"
                ? p.activeBusiness?.name ?? "Business"
                : p.user.name
            }
            image={
              p.identityKind === "business"
                ? p.activeBusiness?.logo
                : p.user.avatar
            }
            size={42}
          />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={localStyles.identityName}>
              {p.identityKind === "business"
                ? p.activeBusiness?.name ?? "Business profile"
                : p.user.name}
            </Text>
            <Text style={styles.caption}>
              {p.identityKind === "business"
                ? "Posting as business · Tap to change"
                : "Posting to your profile · Tap to change"}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={18} color={colors.muted} />
        </Pressable>

        {p.identityKind === "business" ? (
          <View style={{ gap: 8, marginTop: 10 }}>
            {p.ownedBusinesses.length > 0 ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {p.ownedBusinesses.map((b) => (
                  <Chip
                    key={b.id}
                    label={b.name}
                    selected={p.businessId === b.id}
                    onPress={() => p.setBusinessId(b.id)}
                  />
                ))}
              </View>
            ) : null}
            {p.ownedBusinesses.length === 0 ? (
              <Field
                label="Business ID"
                value={p.businessId}
                onChangeText={p.setBusinessId}
                placeholder="Enter business ID"
                autoCapitalize="none"
              />
            ) : null}
          </View>
        ) : null}
      </View>

      <View style={localStyles.contentBand}>
        {p.showPoll ? (
          <View style={{ gap: 10 }}>
            <Text style={localStyles.blockHeading}>Your poll question</Text>
            <Field
              label="Question"
              value={p.pollQuestion}
              onChangeText={p.setPollQuestion}
              placeholder="What do you want to ask?"
            />
            {p.pollOptions.map((item, index) => (
              <View
                key={index}
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <View style={{ flex: 1 }}>
                  <Field
                    label={`Option ${index + 1}`}
                    value={item}
                    onChangeText={(value) =>
                      p.setPollOptions((items) =>
                        items.map((opt, idx) => (idx === index ? value : opt))
                      )
                    }
                    placeholder={`Choice ${index + 1}`}
                  />
                </View>
                {p.pollOptions.length > 2 ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove option ${index + 1}`}
                    onPress={() =>
                      p.setPollOptions((items) =>
                        items.filter((_, idx) => idx !== index)
                      )
                    }
                    hitSlop={6}
                  >
                    <Ionicons
                      name="close-circle-outline"
                      size={22}
                      color={colors.muted}
                    />
                  </Pressable>
                ) : null}
              </View>
            ))}
            <Button
              title="Add another option"
              small
              variant="outline"
              disabled={p.pollOptions.length >= 6}
              onPress={() => p.setPollOptions((items) => [...items, ""])}
            />
            <Field
              label="Add context (optional)"
              value={p.caption}
              onChangeText={p.setCaption}
              multiline
              placeholder="Add a little context for your audience…"
            />
          </View>
        ) : p.kind === "product" ? (
          <View style={{ gap: 10 }}>
            <Text style={localStyles.blockHeading}>Product information</Text>
            <Field
              label="Product name"
              value={p.productName}
              onChangeText={p.setProductName}
              placeholder="e.g. Handmade leather bag"
            />
            <Field
              label="Price (optional)"
              value={p.productPrice}
              onChangeText={p.setProductPrice}
              placeholder="e.g. KSh 3,500"
            />
            <Field
              label="Product link (optional)"
              value={p.productUrl}
              onChangeText={p.setProductUrl}
              placeholder="https://yourstore.com/product"
              autoCapitalize="none"
            />
            <Field
              label="Description"
              value={p.caption}
              onChangeText={p.setCaption}
              multiline
              placeholder="Describe the product, its features and how to order…"
            />
          </View>
        ) : p.kind === "announcement" ? (
          <View style={{ gap: 10 }}>
            <Text style={localStyles.blockHeading}>Business announcement</Text>
            <Field
              label="Headline"
              value={p.announcementTitle}
              onChangeText={p.setAnnouncementTitle}
              placeholder="What’s the update?"
            />
            <Field
              label="Details"
              value={p.caption}
              onChangeText={p.setCaption}
              multiline
              placeholder="Share the news, dates, details or next steps…"
            />
          </View>
        ) : (
          <TextInput
            style={localStyles.captionInput}
            placeholder="What would you like to share?"
            placeholderTextColor={colors.muted}
            multiline
            maxLength={1000}
            value={p.caption}
            onChangeText={p.setCaption}
          />
        )}
      </View>

      <View style={localStyles.mediaBand}>
        <Text style={localStyles.blockHeading}>Add photos or video</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Button
              title="Photo"
              small
              icon="image-outline"
              variant="outline"
              disabled={p.busy}
              onPress={() => p.onOpenGallery("image")}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              title="Video"
              small
              icon="videocam-outline"
              variant="outline"
              disabled={p.busy}
              onPress={() => p.onOpenGallery("video")}
            />
          </View>
        </View>
        {p.pickedStrip}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text style={styles.caption}>Or add hosted media</Text>
          <View style={styles.row}>
            <Chip
              label="Image"
              selected={p.mediaType === "image"}
              onPress={() => p.setMediaType("image")}
            />
            <Chip
              label="Video"
              selected={p.mediaType === "video"}
              onPress={() => p.setMediaType("video")}
            />
          </View>
        </View>
        <Field
          label="HTTPS media URL(s) (optional)"
          value={p.urls}
          onChangeText={p.setUrls}
          multiline
          placeholder="https://cdn.example.com/photo.jpg"
        />
        {p.pickedCount > 0 || p.urls.trim() ? (
          <Field
            label="Alt text (optional)"
            value={p.altText}
            onChangeText={p.setAltText}
            placeholder="Describe the attached media"
          />
        ) : null}
      </View>

      <View style={localStyles.settingsBand}>
        <Field
          label="Location (optional)"
          value={p.location}
          onChangeText={p.setLocation}
          placeholder="Town or area"
        />

        <View style={localStyles.settingRow}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Ionicons name="globe-outline" size={20} color={colors.ink} />
            <Text style={styles.body}>Who can see this?</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              p.setAudience((value) =>
                value === "public"
                  ? "followers"
                  : value === "followers"
                    ? "private"
                    : "public"
              )
            }
            hitSlop={6}
            style={({ pressed }) => [
              { flexDirection: "row", alignItems: "center", gap: 4 },
              pressed && { opacity: 0.6 },
            ]}
          >
            <Text style={localStyles.audienceValue}>{p.audience}</Text>
            <Ionicons
              name="chevron-down"
              size={14}
              color={colors.emeraldDark}
            />
          </Pressable>
        </View>

        <View style={localStyles.settingRow}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Ionicons name="chatbubble-outline" size={20} color={colors.ink} />
            <Text style={styles.body}>Allow comments</Text>
          </View>
          <Switch
            value={p.allowComments}
            onValueChange={p.setAllowComments}
            trackColor={{ false: colors.border, true: colors.emerald }}
            thumbColor={colors.white}
          />
        </View>

        <Button title="Preview post" onPress={p.onPreview} />
      </View>
    </View>
  );
}

const localStyles = createThemedStyles(() =>
  StyleSheet.create({
    root: {
      backgroundColor: colors.surface,
    },
    typeBand: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginHorizontal: -16,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    typeMeta: {
      gap: 2,
    },
    typeHeading: {
      color: colors.ink,
      fontSize: 19,
      fontWeight: "800",
      letterSpacing: -0.2,
    },
    changeTypeText: {
      color: colors.emeraldDark,
      fontSize: 14,
      fontWeight: "700",
    },
    identityBand: {
      marginHorizontal: -16,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 6,
      borderBottomColor: colors.canvas,
    },
    identityRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    identityName: {
      color: colors.ink,
      fontSize: 15,
      fontWeight: "700",
    },
    contentBand: {
      marginHorizontal: -16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: colors.surface,
      borderBottomWidth: 6,
      borderBottomColor: colors.canvas,
    },
    blockHeading: {
      color: colors.ink,
      fontSize: 14,
      fontWeight: "700",
    },
    captionInput: {
      color: colors.ink,
      fontSize: 16,
      lineHeight: 22,
      minHeight: 150,
      textAlignVertical: "top",
      paddingTop: 2,
    },
    mediaBand: {
      gap: 10,
      marginHorizontal: -16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: colors.surface,
      borderBottomWidth: 6,
      borderBottomColor: colors.canvas,
    },
    settingsBand: {
      gap: 14,
      marginHorizontal: -16,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 20,
      backgroundColor: colors.surface,
    },
    settingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 4,
    },
    audienceValue: {
      color: colors.emeraldDark,
      fontWeight: "700",
      textTransform: "capitalize",
    },
  })
);