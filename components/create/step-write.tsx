import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Avatar, Button, Field, MediaImage, VideoPreview } from "@/components/biz-ui";
import { alertUser } from "@/components/create/create-helpers";
import type { PostComposer } from "@/components/create/use-post-composer";
import { colors } from "@/theme/tokens";
import { useThemeContext } from "@/lib/theme-provider";

const FORMAT_OPTIONS = [
  { label: "Standard", value: "text", icon: "document-text-outline" },
  { label: "Question", value: "question", icon: "help-circle-outline" },
  { label: "Poll", value: "poll", icon: "bar-chart-outline" },
  { label: "Update", value: "announcement", icon: "megaphone-outline" },
] as const;

export function StepWrite({ composer }: { composer: PostComposer }) {
  useThemeContext();
  const {
    app,
    identity,
    cycleIdentity,
    caption,
    setCaption,
    kind,
    setKind,
    media,
    setMedia,
    setMediaItems,
    pollQuestion,
    setPollQuestion,
    pollOptions,
    setPollOptions,
    selectMediaFiles,
    setActivePicker,
    setStep,
    handleSaveDraft,
  } = composer;

  const [formatDrawerOpen, setFormatDrawerOpen] = useState(false);

  const activeFormat =
    FORMAT_OPTIONS.find(
      (f) => f.value === kind || (f.value === "text" && (kind === "image" || kind === "video"))
    ) ?? FORMAT_OPTIONS[0];

  const canAdvance = caption.trim().length >= 2 || Boolean(media);

  const handleNext = () => {
    if (!canAdvance) {
      alertUser("Content required", "Write something or attach media before proceeding.");
      return;
    }
    setStep(2);
  };

  return (
    <View style={styles.container}>
      {/* Step Header & Identity Context */}
      <View style={styles.topRow}>
        <Pressable
          onPress={cycleIdentity}
          accessibilityRole="button"
          accessibilityLabel="Switch posting identity"
          style={styles.identityPill}
        >
          <Avatar name={identity?.name ?? app.user.name} image={identity?.logo ?? app.user.avatar} size={28} />
          <View style={styles.identityTextGroup}>
            <Text style={styles.identityName} numberOfLines={1}>
              {identity?.name ?? app.user.name}
            </Text>
            <Text style={styles.identityScope}>
              {identity ? "Business page" : "Personal profile"}
            </Text>
          </View>
          <Ionicons name="swap-horizontal-outline" size={14} color={colors.muted} />
        </Pressable>

        <Pressable onPress={handleSaveDraft} style={styles.draftButton}>
          <Text style={styles.draftButtonText}>Save draft</Text>
        </Pressable>
      </View>

      {/* Primary Distraction-Free Writing Surface */}
      <View style={styles.editorCard}>
        {/* Minimal Format Selector Trigger (Progressive Disclosure) */}
        <View style={styles.editorHeader}>
          <Pressable
            onPress={() => setFormatDrawerOpen((prev) => !prev)}
            style={styles.formatSelector}
          >
            <Ionicons name={activeFormat.icon} size={14} color={colors.navy} />
            <Text style={styles.formatSelectorText}>{activeFormat.label}</Text>
            <Ionicons
              name={formatDrawerOpen ? "chevron-up" : "chevron-down"}
              size={13}
              color={colors.muted}
            />
          </Pressable>

          <Text style={styles.charCounter}>{caption.length}/1000</Text>
        </View>

        {formatDrawerOpen ? (
          <View style={styles.formatGrid}>
            {FORMAT_OPTIONS.map((item) => {
              const isSelected = activeFormat.value === item.value;
              return (
                <Pressable
                  key={item.value}
                  onPress={() => {
                    setKind(item.value);
                    setFormatDrawerOpen(false);
                  }}
                  style={[styles.formatOption, isSelected && styles.formatOptionActive]}
                >
                  <Ionicons
                    name={item.icon}
                    size={15}
                    color={isSelected ? colors.white : colors.navy}
                  />
                  <Text
                    style={[
                      styles.formatOptionText,
                      isSelected && styles.formatOptionTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        <TextInput
          style={styles.captionInput}
          placeholder={
            kind === "question"
              ? "Ask the community a clear question..."
              : kind === "announcement"
              ? "Share a business update or milestone..."
              : "Write your post..."
          }
          placeholderTextColor={colors.muted}
          multiline
          maxLength={1000}
          value={caption}
          onChangeText={setCaption}
        />

        {/* Inline Media Preview if Attached */}
        {media ? (
          <View style={styles.mediaPreviewWrapper}>
            {kind === "video" ? (
              <VideoPreview uri={media} height={140} />
            ) : (
              <MediaImage uri={media} height={140} label="Selected media" />
            )}
            <Pressable
              onPress={() => {
                setMedia(undefined);
                setMediaItems([]);
              }}
              accessibilityLabel="Remove media"
              style={styles.removeMediaBtn}
            >
              <Ionicons name="close" size={14} color={colors.white} />
            </Pressable>
          </View>
        ) : null}

        {/* Quiet Attachment Strip */}
        <View style={styles.attachmentBar}>
          <Pressable
            onPress={() => void selectMediaFiles("images")}
            style={styles.attachmentAction}
          >
            <Ionicons name="image-outline" size={16} color={colors.navy} />
            <Text style={styles.attachmentLabel}>Photo</Text>
          </Pressable>

          <View style={styles.attachmentDivider} />

          <Pressable
            onPress={() => void selectMediaFiles("videos")}
            style={styles.attachmentAction}
          >
            <Ionicons name="videocam-outline" size={16} color={colors.navy} />
            <Text style={styles.attachmentLabel}>Video</Text>
          </Pressable>

          <View style={styles.attachmentDivider} />

          <Pressable
            onPress={() => {
              setActivePicker("tag");
              setStep(2);
            }}
            style={styles.attachmentAction}
          >
            <Ionicons name="at-outline" size={16} color={colors.navy} />
            <Text style={styles.attachmentLabel}>Tag</Text>
          </Pressable>

          <View style={styles.attachmentDivider} />

          <Pressable
            onPress={() => {
              setActivePicker("location");
              setStep(2);
            }}
            style={styles.attachmentAction}
          >
            <Ionicons name="location-outline" size={16} color={colors.navy} />
            <Text style={styles.attachmentLabel}>Place</Text>
          </Pressable>
        </View>
      </View>

      {/* Poll Builder: Only Revealed When Poll Format Is Active */}
      {kind === "poll" ? (
        <View style={styles.pollCard}>
          <View style={styles.pollHeader}>
            <Text style={styles.pollTitle}>Poll configuration</Text>
            <Text style={styles.pollSubtitle}>{pollOptions.length} of 4 options</Text>
          </View>

          <Field
            label="Poll question"
            placeholder="Ask a specific question..."
            value={pollQuestion}
            onChangeText={setPollQuestion}
          />

          <View style={styles.pollOptionsList}>
            {pollOptions.map((opt, i) => (
              <View key={i} style={styles.pollOptionRow}>
                <View style={styles.pollOptionInput}>
                  <Field
                    label={`Option ${i + 1}`}
                    placeholder={`Choice ${i + 1}`}
                    value={opt}
                    onChangeText={(val) =>
                      setPollOptions((prev) => prev.map((item, idx) => (idx === i ? val : item)))
                    }
                  />
                </View>
                {pollOptions.length > 2 ? (
                  <Pressable
                    onPress={() =>
                      setPollOptions((prev) => prev.filter((_, idx) => idx !== i))
                    }
                    accessibilityLabel={`Remove option ${i + 1}`}
                    style={styles.removeOptionBtn}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.muted} />
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>

          {pollOptions.length < 4 ? (
            <Button
              title="Add another option"
              small
              variant="outline"
              onPress={() => setPollOptions((prev) => [...prev, ""])}
            />
          ) : null}
        </View>
      ) : null}

      {/* Primary Step Action */}
      <View style={styles.footer}>
        <Button title="Continue to details" onPress={handleNext} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
    paddingTop: 4,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  identityPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  identityTextGroup: {
    flex: 1,
  },
  identityName: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: "700",
  },
  identityScope: {
    color: colors.muted,
    fontSize: 11,
  },
  draftButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  draftButtonText: {
    color: colors.navy,
    fontSize: 12,
    fontWeight: "600",
  },
  editorCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  editorHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.subtle,
  },
  formatSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formatSelectorText: {
    color: colors.navy,
    fontSize: 12,
    fontWeight: "700",
  },
  charCounter: {
    color: colors.muted,
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },
  formatGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    padding: 12,
    backgroundColor: colors.subtle,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  formatOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formatOptionActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  formatOptionText: {
    color: colors.navy,
    fontSize: 12,
    fontWeight: "600",
  },
  formatOptionTextActive: {
    color: colors.white,
  },
  captionInput: {
    color: colors.navy,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 190,
    textAlignVertical: "top",
    padding: 16,
  },
  mediaPreviewWrapper: {
    marginHorizontal: 16,
    marginBottom: 14,
    position: "relative",
    alignSelf: "flex-start",
  },
  removeMediaBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  attachmentBar: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.subtle,
    paddingVertical: 10,
  },
  attachmentAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 4,
  },
  attachmentLabel: {
    color: colors.navy,
    fontSize: 12,
    fontWeight: "600",
  },
  attachmentDivider: {
    width: 1,
    height: 16,
    backgroundColor: colors.border,
  },
  pollCard: {
    gap: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pollHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pollTitle: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: "700",
  },
  pollSubtitle: {
    color: colors.muted,
    fontSize: 11,
    fontVariant: ["tabular-nums"],
  },
  pollOptionsList: {
    gap: 8,
  },
  pollOptionRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  pollOptionInput: {
    flex: 1,
  },
  removeOptionBtn: {
    padding: 10,
    marginBottom: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.subtle,
  },
  footer: {
    marginTop: 4,
  },
});
