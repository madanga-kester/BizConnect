import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Avatar, Button, MediaImage, VideoPreview } from "@/components/biz-ui";
import type { PostComposer } from "@/components/create/use-post-composer";
import { colors } from "@/theme/tokens";
import { useThemeContext } from "@/lib/theme-provider";

export function StepReview({ composer }: { composer: PostComposer }) {
  useThemeContext();
  const {
    app,
    identity,
    kind,
    media,
    caption,
    location,
    taggedBusinesses,
    selectedProduct,
    pollQuestion,
    pollOptions,
    audience,
    setAudience,
    commentsOn,
    setCommentsOn,
    sharingOn,
    setSharingOn,
    loading,
    setStep,
    setShowPublishConfirm,
    setShowScheduleConfirm,
  } = composer;

  const cleanPollOptions = pollOptions.map((o) => o.trim()).filter(Boolean);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Final review</Text>
        <Text style={styles.subtitle}>
          Verify your preview and distribution rules before publishing.
        </Text>
      </View>

      {/* Feed Card Simulation */}
      <View style={styles.previewCard}>
        <View style={styles.previewTopRow}>
          <View style={styles.authorBlock}>
            <Avatar
              name={identity?.name ?? app.user.name}
              image={identity?.logo ?? app.user.avatar}
              size={38}
            />
            <View>
              <Text style={styles.authorName}>{identity?.name ?? app.user.name}</Text>
              <View style={styles.metaLine}>
                <Text style={styles.metaText}>
                  {audience === "public" ? "Public" : "Followers"}
                </Text>
                {location ? (
                  <>
                    <Text style={styles.metaDot}>·</Text>
                    <Text style={styles.metaText} numberOfLines={1}>
                      {location}
                    </Text>
                  </>
                ) : null}
              </View>
            </View>
          </View>

          <Pressable onPress={() => setStep(1)} style={styles.editLink}>
            <Text style={styles.editLinkText}>Edit text</Text>
          </Pressable>
        </View>

        <Text style={styles.captionPreview}>{caption || "No caption provided."}</Text>

        {media ? (
          kind === "video" ? (
            <VideoPreview uri={media} height={190} />
          ) : (
            <MediaImage uri={media} height={190} label="Post preview image" />
          )
        ) : null}

        {kind === "poll" && cleanPollOptions.length >= 2 ? (
          <View style={styles.pollPreviewBox}>
            <Text style={styles.pollPreviewQuestion}>
              {pollQuestion.trim() || caption.trim()}
            </Text>
            {cleanPollOptions.map((opt, idx) => (
              <View key={idx} style={styles.pollPreviewOption}>
                <Text style={styles.pollPreviewOptionText}>{opt}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {(selectedProduct || taggedBusinesses.length > 0) ? (
          <View style={styles.attachmentSummaryRow}>
            {selectedProduct ? (
              <View style={styles.badge}>
                <Ionicons name="pricetag-outline" size={12} color={colors.navy} />
                <Text style={styles.badgeText}>{selectedProduct.name}</Text>
              </View>
            ) : null}
            {taggedBusinesses.length > 0 ? (
              <View style={styles.badge}>
                <Ionicons name="people-outline" size={12} color={colors.navy} />
                <Text style={styles.badgeText}>{taggedBusinesses.length} tagged</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      {/* Compact Distribution & Interaction Controls */}
      <View style={styles.settingsCard}>
        <View style={styles.settingsHeader}>
          <Text style={styles.settingsHeading}>Distribution controls</Text>
          <Pressable onPress={() => setStep(2)}>
            <Text style={styles.editLinkText}>Edit details</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => setAudience(audience === "public" ? "followers" : "public")}
          style={[styles.settingRow, styles.settingRowBorder]}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="globe-outline" size={17} color={colors.navy} />
            <Text style={styles.settingLabel}>Audience</Text>
          </View>
          <View style={styles.settingRight}>
            <Text style={styles.settingValue}>
              {audience === "public" ? "Public" : "Followers"}
            </Text>
            <Ionicons name="swap-vertical-outline" size={14} color={colors.muted} />
          </View>
        </Pressable>

        <Pressable
          onPress={() => setCommentsOn((v) => !v)}
          style={[styles.settingRow, styles.settingRowBorder]}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="chatbubble-outline" size={17} color={colors.navy} />
            <Text style={styles.settingLabel}>Comments</Text>
          </View>
          <Text style={styles.settingValue}>{commentsOn ? "Enabled" : "Disabled"}</Text>
        </Pressable>

        <Pressable onPress={() => setSharingOn((v) => !v)} style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <Ionicons name="arrow-redo-outline" size={17} color={colors.navy} />
            <Text style={styles.settingLabel}>Resharing</Text>
          </View>
          <Text style={styles.settingValue}>{sharingOn ? "Enabled" : "Disabled"}</Text>
        </Pressable>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsStack}>
        <Button
          title={loading ? "Publishing..." : "Publish now"}
          disabled={loading}
          onPress={() => setShowPublishConfirm(true)}
        />
        <View style={styles.secondaryActionsRow}>
          <View style={styles.halfBtn}>
            <Button title="Back" variant="outline" onPress={() => setStep(2)} />
          </View>
          <View style={styles.halfBtn}>
            <Button
              title="Schedule"
              icon="time-outline"
              variant="outline"
              disabled={loading}
              onPress={() => setShowScheduleConfirm(true)}
            />
          </View>
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
  },
  previewCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  previewTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  authorBlock: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  authorName: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: "800",
  },
  metaLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 1,
  },
  metaText: {
    color: colors.muted,
    fontSize: 11,
  },
  metaDot: {
    color: colors.muted,
    fontSize: 11,
  },
  editLink: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  editLinkText: {
    color: colors.navy,
    fontSize: 12,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  captionPreview: {
    color: colors.navy,
    fontSize: 14,
    lineHeight: 21,
  },
  pollPreviewBox: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.subtle,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  pollPreviewQuestion: {
    color: colors.navy,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 2,
  },
  pollPreviewOption: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pollPreviewOptionText: {
    color: colors.navy,
    fontSize: 12,
    fontWeight: "600",
  },
  attachmentSummaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingTop: 4,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: colors.subtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeText: {
    color: colors.navy,
    fontSize: 11,
    fontWeight: "600",
  },
  settingsCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  settingsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: colors.subtle,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingsHeading: {
    color: colors.navy,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  settingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  settingLabel: {
    color: colors.navy,
    fontSize: 14,
    fontWeight: "600",
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  settingValue: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
  },
  actionsStack: {
    gap: 10,
    marginTop: 4,
  },
  secondaryActionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  halfBtn: {
    flex: 1,
  },
});
