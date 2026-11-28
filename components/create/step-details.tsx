import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { Button, Chip, Field, MediaImage, VideoPreview } from "@/components/biz-ui";
import type { PostComposer } from "@/components/create/use-post-composer";
import { colors } from "@/theme/tokens";
import { useThemeContext } from "@/lib/theme-provider";

type DetailsTab = "context" | "distribution";

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

  const [section, setSection] = useState<DetailsTab>("context");

  const contextRows = [
    {
      key: "tag" as const,
      icon: "person-outline" as const,
      title: "Tag businesses",
      summary: taggedBusinesses.length ? `${taggedBusinesses.length} selected` : "Optional",
    },
    {
      key: "location" as const,
      icon: "location-outline" as const,
      title: "Location",
      summary: location.trim() ? location : "Not set",
    },
    {
      key: "product" as const,
      icon: "pricetag-outline" as const,
      title: "Featured product",
      summary: selectedProduct ? selectedProduct.name : "None",
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Post context & reach</Text>
        <Text style={styles.subtitle}>
          Enrich your post with media or tags, then confirm who can interact.
        </Text>
      </View>

      {/* Two-Stage Segmented Control to Keep Screen Ratio Low */}
      <View style={styles.segmentedControl}>
        <Pressable
          onPress={() => setSection("context")}
          style={[styles.segmentBtn, section === "context" && styles.segmentBtnActive]}
        >
          <Text style={[styles.segmentText, section === "context" && styles.segmentTextActive]}>
            1. Media & Tags
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setSection("distribution")}
          style={[styles.segmentBtn, section === "distribution" && styles.segmentBtnActive]}
        >
          <Text
            style={[
              styles.segmentText,
              section === "distribution" && styles.segmentTextActive,
            ]}
          >
            2. Visibility & Replies
          </Text>
        </Pressable>
      </View>

      {section === "context" ? (
        <View style={styles.sectionStack}>
          {/* Media Dropzone / Preview */}
          {media ? (
            <View style={styles.mediaCard}>
              {kind === "video" ? (
                <VideoPreview uri={media} height={150} />
              ) : (
                <MediaImage uri={media} height={150} label="Attached media" />
              )}
              <View style={styles.mediaFooter}>
                <Pressable
                  onPress={() => void selectMediaFiles("images")}
                  style={styles.replaceMediaBtn}
                >
                  <Ionicons name="refresh-outline" size={14} color={colors.navy} />
                  <Text style={styles.replaceMediaText}>Replace</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setMedia(undefined);
                    setMediaItems([]);
                  }}
                  style={styles.removeMediaBtn}
                >
                  <Ionicons name="trash-outline" size={14} color={colors.muted} />
                  <Text style={styles.removeMediaText}>Remove</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={styles.mediaPickerRow}>
              <Pressable
                onPress={() => void selectMediaFiles("images")}
                style={styles.mediaPickerCard}
              >
                <Ionicons name="image-outline" size={20} color={colors.navy} />
                <Text style={styles.mediaPickerTitle}>Add photos</Text>
                <Text style={styles.mediaPickerHint}>JPG, PNG</Text>
              </Pressable>
              <Pressable
                onPress={() => void selectMediaFiles("videos")}
                style={styles.mediaPickerCard}
              >
                <Ionicons name="videocam-outline" size={20} color={colors.navy} />
                <Text style={styles.mediaPickerTitle}>Add video</Text>
                <Text style={styles.mediaPickerHint}>MP4, MOV</Text>
              </Pressable>
            </View>
          )}

          {/* Accordion List: Only Opens One Input Drawer at a Time */}
          <View style={styles.accordionCard}>
            {contextRows.map((row, idx) => {
              const isOpen = activePicker === row.key;
              return (
                <View
                  key={row.key}
                  style={[
                    styles.accordionItem,
                    idx < contextRows.length - 1 && styles.accordionBorder,
                  ]}
                >
                  <Pressable
                    onPress={() => setActivePicker(isOpen ? "none" : row.key)}
                    style={styles.accordionTrigger}
                  >
                    <Ionicons name={row.icon} size={18} color={colors.navy} />
                    <View style={styles.accordionLabelGroup}>
                      <Text style={styles.accordionTitle}>{row.title}</Text>
                      <Text style={styles.accordionSummary} numberOfLines={1}>
                        {row.summary}
                      </Text>
                    </View>
                    <Ionicons
                      name={isOpen ? "chevron-up" : "chevron-down"}
                      size={16}
                      color={colors.muted}
                    />
                  </Pressable>

                  {isOpen && row.key === "location" ? (
                    <View style={styles.accordionBody}>
                      <Field
                        label="Location"
                        value={location}
                        onChangeText={setLocation}
                        placeholder="Town or county"
                      />
                    </View>
                  ) : null}

                  {isOpen && row.key === "tag" ? (
                    <View style={styles.accordionBody}>
                      <View style={styles.chipWrap}>
                        {app.businesses.map((b) => (
                          <Chip
                            key={b.id}
                            label={b.name}
                            selected={taggedBusinesses.includes(b.id)}
                            onPress={() =>
                              setTaggedBusinesses((prev) =>
                                prev.includes(b.id)
                                  ? prev.filter((id) => id !== b.id)
                                  : [...prev, b.id]
                              )
                            }
                          />
                        ))}
                      </View>
                    </View>
                  ) : null}

                  {isOpen && row.key === "product" ? (
                    <View style={styles.accordionBody}>
                      {productsForIdentity.length ? (
                        <View style={styles.chipWrap}>
                          {productsForIdentity.map((p) => (
                            <Chip
                              key={p.id}
                              label={`${p.name} · KSh ${p.price}`}
                              selected={selectedProductId === p.id}
                              onPress={() =>
                                setSelectedProductId(
                                  selectedProductId === p.id ? undefined : p.id
                                )
                              }
                            />
                          ))}
                        </View>
                      ) : (
                        <Text style={styles.emptyHint}>
                          No active products in your catalogue yet.
                        </Text>
                      )}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>
      ) : (
        <View style={styles.sectionStack}>
          {/* Audience Selection Cards */}
          <View style={styles.settingBlock}>
            <Text style={styles.blockLabel}>Who can view this post</Text>
            <View style={styles.audienceGrid}>
              {(
                [
                  {
                    value: "public",
                    title: "Public",
                    desc: "Visible across feeds and search",
                    icon: "globe-outline",
                  },
                  {
                    value: "followers",
                    title: "Followers",
                    desc: "Only people following this profile",
                    icon: "people-outline",
                  },
                ] as const
              ).map((opt) => {
                const selected = audience === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => setAudience(opt.value)}
                    style={[styles.audienceCard, selected && styles.audienceCardSelected]}
                  >
                    <View style={styles.audienceCardTop}>
                      <Ionicons
                        name={opt.icon}
                        size={18}
                        color={selected ? colors.white : colors.navy}
                      />
                      <Text
                        style={[
                          styles.audienceCardTitle,
                          selected && styles.audienceCardTitleSelected,
                        ]}
                      >
                        {opt.title}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.audienceCardDesc,
                        selected && styles.audienceCardDescSelected,
                      ]}
                    >
                      {opt.desc}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Interaction Toggle */}
          <View style={styles.toggleCard}>
            <View style={styles.toggleInfo}>
              <Text style={styles.toggleTitle}>Allow comments</Text>
              <Text style={styles.toggleDesc}>
                Let readers reply directly beneath this post
              </Text>
            </View>
            <Switch
              value={commentsOn}
              onValueChange={setCommentsOn}
              trackColor={{ false: colors.border, true: colors.emerald }}
              thumbColor={colors.white}
            />
          </View>
        </View>
      )}

      {/* Navigation Footer */}
      <View style={styles.navRow}>
        <View style={styles.navBtn}>
          <Button
            title="Back"
            variant="outline"
            onPress={() => {
              if (section === "distribution") setSection("context");
              else setStep(1);
            }}
          />
        </View>
        <View style={styles.navBtn}>
          <Button
            title={section === "context" ? "Next: Visibility" : "Review post"}
            onPress={() => {
              if (section === "context") setSection("distribution");
              else setStep(3);
            }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingTop: 4,
  },
  header: {
    gap: 4,
  },
  title: {
    color: colors.navy,
    fontSize: 18,
    fontWeight: "800",
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  segmentedControl: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 12,
    backgroundColor: colors.subtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 9,
  },
  segmentBtnActive: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  segmentTextActive: {
    color: colors.navy,
    fontWeight: "700",
  },
  sectionStack: {
    gap: 12,
  },
  mediaPickerRow: {
    flexDirection: "row",
    gap: 10,
  },
  mediaPickerCard: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  mediaPickerTitle: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 4,
  },
  mediaPickerHint: {
    color: colors.muted,
    fontSize: 11,
  },
  mediaCard: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  mediaFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 12,
  },
  replaceMediaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.subtle,
  },
  replaceMediaText: {
    color: colors.navy,
    fontSize: 12,
    fontWeight: "600",
  },
  removeMediaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  removeMediaText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  accordionCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  accordionItem: {
    backgroundColor: colors.surface,
  },
  accordionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  accordionTrigger: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  accordionLabelGroup: {
    flex: 1,
    gap: 2,
  },
  accordionTitle: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: "600",
  },
  accordionSummary: {
    color: colors.muted,
    fontSize: 12,
  },
  accordionBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 4,
    backgroundColor: colors.subtle,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  chipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingTop: 6,
  },
  emptyHint: {
    color: colors.muted,
    fontSize: 12,
    paddingVertical: 6,
  },
  settingBlock: {
    gap: 8,
  },
  blockLabel: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: "700",
  },
  audienceGrid: {
    flexDirection: "row",
    gap: 10,
  },
  audienceCard: {
    flex: 1,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  audienceCardSelected: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  audienceCardTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  audienceCardTitle: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: "700",
  },
  audienceCardTitleSelected: {
    color: colors.white,
  },
  audienceCardDesc: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 15,
  },
  audienceCardDescSelected: {
    color: colors.border,
  },
  toggleCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  toggleInfo: {
    flex: 1,
    gap: 2,
  },
  toggleTitle: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: "600",
  },
  toggleDesc: {
    color: colors.muted,
    fontSize: 12,
  },
  navRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  navBtn: {
    flex: 1,
  },
});
