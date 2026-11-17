import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { ConfirmModal, EmptyState, LoadingState, Page, TopBar } from "@/components/biz-ui";
import { ApiPostComposer } from "@/components/api-social-screens";
import { StepDetails } from "@/components/create/step-details";
import { StepReview } from "@/components/create/step-review";
import { StepWrite } from "@/components/create/step-write";
import { usePostComposer } from "@/components/create/use-post-composer";
import { useAppStore } from "@/hooks/use-app-store";
import { useBizConnectServiceMode } from "@/lib/services/service-provider";
import { colors } from "@/theme/tokens";

export default function CreateScreen() {
  const apiMode = useBizConnectServiceMode() === "api";
  return apiMode ? <ApiPostComposer /> : <MockCreateScreen />;
}

function MockCreateScreen() {
  const app = useAppStore();
  const { draftId, postId } = useLocalSearchParams<{ draftId?: string; postId?: string }>();

  if (!app.hasHydrated) {
    return (
      <Page>
        <TopBar title="Create post" back />
        <LoadingState label="Preparing studio..." />
      </Page>
    );
  }

  return <CreateWizard app={app} draftId={draftId} postId={postId} />;
}

function CreateWizard({
  app,
  draftId,
  postId,
}: {
  app: ReturnType<typeof useAppStore>;
  draftId?: string;
  postId?: string;
}) {
  const composer = usePostComposer(app, draftId, postId);
  const {
    step,
    setStep,
    handleSaveDraft,
    showPublishConfirm,
    setShowPublishConfirm,
    showScheduleConfirm,
    setShowScheduleConfirm,
    finalizePublish,
  } = composer;

  return (
    <Page>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 }}>
        <Pressable
          onPress={() => (step > 1 ? setStep((s) => (s === 3 ? 2 : 1)) : router.back())}
          style={{ padding: 4 }}
        >
          <Ionicons name="arrow-back" size={22} color={colors.navy} />
        </Pressable>
        <Text style={{ color: colors.navy, fontSize: 17, fontWeight: "800" }}>Create post</Text>
        <Pressable onPress={handleSaveDraft}>
          <Text style={{ color: colors.emeraldDark, fontSize: 14, fontWeight: "700" }}>Save draft</Text>
        </Pressable>
      </View>

      {!app.isAuthenticated ? (
        <EmptyState
          title="Sign in to create posts"
          detail="Publishing and saving drafts require sign-in."
          icon="lock-closed-outline"
          action="Sign in"
          onAction={() => router.push("/auth/login")}
        />
      ) : null}

      {step === 1 && <StepWrite composer={composer} />}
      {step === 2 && <StepDetails composer={composer} />}
      {step === 3 && <StepReview composer={composer} />}

      <ConfirmModal
        visible={showPublishConfirm}
        title="Share post?"
        detail="Your post will be published immediately."
        confirmLabel="Share"
        onCancel={() => setShowPublishConfirm(false)}
        onConfirm={() => void finalizePublish(false)}
      />

      <ConfirmModal
        visible={showScheduleConfirm}
        title="Schedule post?"
        detail="Your post will be queued for tomorrow."
        confirmLabel="Schedule"
        onCancel={() => setShowScheduleConfirm(false)}
        onConfirm={() => void finalizePublish(true)}
      />
    </Page>
  );
}