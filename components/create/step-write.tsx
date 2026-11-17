import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { Avatar, Button, Field } from "@/components/biz-ui";
import { alertUser } from "@/components/create/create-helpers";
import type { PostComposer } from "@/components/create/use-post-composer";
import { colors } from "@/theme/tokens";

export function StepWrite({ composer }: { composer: PostComposer }) {
  const {
    app,
    identity,
    cycleIdentity,
    caption,
    setCaption,
    kind,
    setKind,
    media,
    pollQuestion,
    setPollQuestion,
    pollOptions,
    setPollOptions,
    selectMediaFiles,
    setActivePicker,
    setStep,
  } = composer;

  return (
    <View style={{ gap: 14, paddingTop: 4 }}>
      <Pressable onPress={cycleIdentity} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Avatar name={identity?.name ?? app.user.name} image={identity?.logo ?? app.user.avatar} size={42} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.navy, fontSize: 15, fontWeight: "800" }}>
            {identity?.name ?? app.user.name}
          </Text>
          <View
            style={{
              alignSelf: "flex-start",
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              marginTop: 2,
              paddingHorizontal: 10,
              paddingVertical: 3,
              borderRadius: 12,
              backgroundColor: colors.subtle,
            }}
          >
            <Text style={{ color: colors.muted, fontSize: 12, fontWeight: "600" }}>
              {identity ? "Posting to your business" : "Posting to your profile"}
            </Text>
            <Ionicons name="chevron-down" size={12} color={colors.muted} />
          </View>
        </View>
      </Pressable>

      <TextInput
        style={{
          color: colors.navy,
          fontSize: 16,
          minHeight: 170,
          textAlignVertical: "top",
          paddingTop: 4,
        }}
        placeholder="What would you like to share?"
        placeholderTextColor={colors.muted}
        multiline
        maxLength={1000}
        value={caption}
        onChangeText={setCaption}
      />

      {kind === "poll" ? (
        <View style={{ gap: 8, padding: 12, borderRadius: 14, backgroundColor: colors.subtle }}>
          <Field
            label="Poll question"
            placeholder="Ask a question..."
            value={pollQuestion}
            onChangeText={setPollQuestion}
          />
          {pollOptions.map((opt, i) => (
            <Field
              key={i}
              label={`Option ${i + 1}`}
              placeholder={`Option ${i + 1}`}
              value={opt}
              onChangeText={(val) => setPollOptions((prev) => prev.map((item, idx) => (idx === i ? val : item)))}
            />
          ))}
          {pollOptions.length < 4 ? (
            <Button
              title="Add option"
              small
              variant="outline"
              onPress={() => setPollOptions((prev) => [...prev, ""])}
            />
          ) : null}
        </View>
      ) : null}

      <View style={{ alignItems: "flex-end" }}>
        <Text style={{ color: colors.muted, fontSize: 11, fontVariant: ["tabular-nums"] }}>
          {caption.length}/1000
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
        {(
          [
            { label: "Post", value: "text", icon: "create-outline" },
            { label: "Question", value: "question", icon: "help-circle-outline" },
            { label: "Poll", value: "poll", icon: "stats-chart-outline" },
            { label: "Business update", value: "announcement", icon: "business-outline" },
          ] as const
        ).map((item) => {
          const active = kind === item.value || (item.value === "text" && (kind === "image" || kind === "video"));
          return (
            <Pressable
              key={item.value}
              onPress={() => setKind(item.value)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: active ? colors.emerald : colors.subtle,
              }}
            >
              <Ionicons name={item.icon} size={15} color={active ? colors.white : colors.navy} />
              <Text style={{ color: active ? colors.white : colors.navy, fontSize: 13, fontWeight: "700" }}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          paddingVertical: 12,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        {[
          { label: "Photo", icon: "image-outline" as const, onPress: () => void selectMediaFiles("images") },
          { label: "Video", icon: "videocam-outline" as const, onPress: () => void selectMediaFiles("videos") },
          {
            label: "Tag",
            icon: "person-add-outline" as const,
            onPress: () => {
              setActivePicker("tag");
              setStep(2);
            },
          },
          {
            label: "Location",
            icon: "location-outline" as const,
            onPress: () => {
              setActivePicker("location");
              setStep(2);
            },
          },
        ].map((tool) => (
          <Pressable
            key={tool.label}
            onPress={tool.onPress}
            style={{
              alignItems: "center",
              gap: 4,
              flex: 1,
              paddingVertical: 8,
              borderRadius: 12,
              backgroundColor: colors.subtle,
              marginHorizontal: 4,
            }}
          >
            <Ionicons name={tool.icon} size={20} color={colors.navy} />
            <Text style={{ color: colors.navy, fontSize: 11, fontWeight: "600" }}>{tool.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={{ marginTop: 12 }}>
        <Button
          title="Next"
          onPress={() => {
            if (caption.trim().length < 2 && !media) {
              alertUser("Content required", "Write something or attach media before proceeding.");
              return;
            }
            setStep(2);
          }}
        />
      </View>
    </View>
  );
}