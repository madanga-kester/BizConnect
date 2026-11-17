import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { Avatar, Button, MediaImage, VideoPreview } from "@/components/biz-ui";
import type { PostComposer } from "@/components/create/use-post-composer";
import { colors } from "@/theme/tokens";

export function StepReview({ composer }: { composer: PostComposer }) {
  const {
    app,
    identity,
    kind,
    media,
    caption,
    audience,
    setAudience,
    commentsOn,
    setCommentsOn,
    sharingOn,
    setSharingOn,
    loading,
    setShowPublishConfirm,
    setShowScheduleConfirm,
  } = composer;

  return (
    <View style={{ gap: 14, paddingTop: 4 }}>
      <Text style={{ color: colors.navy, fontSize: 18, fontWeight: "800" }}>Review post</Text>

      <View
        style={{
          padding: 14,
          borderRadius: 16,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          gap: 10,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Avatar name={identity?.name ?? app.user.name} image={identity?.logo ?? app.user.avatar} size={36} />
            <View>
              <Text style={{ color: colors.navy, fontSize: 14, fontWeight: "800" }}>
                {identity?.name ?? app.user.name}
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Ionicons name="globe-outline" size={11} color={colors.muted} />
                <Text style={{ color: colors.muted, fontSize: 11 }}>
                  {audience === "public" ? "Public" : "Followers"}
                </Text>
                <Ionicons name="chevron-down" size={10} color={colors.muted} />
              </View>
            </View>
          </View>
          <Ionicons name="ellipsis-horizontal" size={18} color={colors.muted} />
        </View>

        {media ? (
          kind === "video" ? (
            <VideoPreview uri={media} height={190} />
          ) : (
            <MediaImage uri={media} height={190} label="Post preview image" />
          )
        ) : null}

        <Text style={{ color: colors.navy, fontSize: 14, lineHeight: 20 }}>
          {caption || "No caption provided."}
        </Text>
      </View>

      <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 16, overflow: "hidden" }}>
        <Pressable
          onPress={() => setAudience(audience === "public" ? "followers" : "public")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 14,
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Ionicons name="globe-outline" size={18} color={colors.navy} />
            <Text style={{ color: colors.navy, fontSize: 14, fontWeight: "600" }}>Audience</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={{ color: colors.muted, fontSize: 14, fontWeight: "600" }}>
              {audience === "public" ? "Public" : "Followers"}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          </View>
        </Pressable>

        <Pressable
          onPress={() => setCommentsOn((v) => !v)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 14,
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Ionicons name="chatbubble-outline" size={18} color={colors.navy} />
            <Text style={{ color: colors.navy, fontSize: 14, fontWeight: "600" }}>Comments</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={{ color: colors.muted, fontSize: 14, fontWeight: "600" }}>
              {commentsOn ? "On" : "Off"}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          </View>
        </Pressable>

        <Pressable
          onPress={() => setSharingOn((v) => !v)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 14,
            backgroundColor: colors.surface,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Ionicons name="arrow-redo-outline" size={18} color={colors.navy} />
            <Text style={{ color: colors.navy, fontSize: 14, fontWeight: "600" }}>Sharing</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Text style={{ color: colors.muted, fontSize: 14, fontWeight: "600" }}>
              {sharingOn ? "On" : "Off"}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          </View>
        </Pressable>
      </View>

      <View style={{ gap: 8, marginTop: 8 }}>
        <Button
          title={loading ? "Sharing..." : "Share post"}
          disabled={loading}
          onPress={() => setShowPublishConfirm(true)}
        />
        <Button
          title="Schedule"
          icon="time-outline"
          variant="outline"
          onPress={() => setShowScheduleConfirm(true)}
        />
      </View>
    </View>
  );
}