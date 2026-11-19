import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { EmptyState, Page, styles } from "@/components/biz-ui";
import { useAppStore } from "@/hooks/use-app-store";
import { pickFromGallery, type PickedMedia } from "@/hooks/use-media-picker";
import { useMabizServices } from "@/lib/services/service-provider";
import { errorText } from "@/lib/api-helpers";
import { colors } from "@/theme/tokens";
import type { ApiPollInput } from "@/lib/api/feature-contracts";
import { ComposerForm } from "./composer-form";
import { ComposerPreview } from "./composer-preview";
import { ComposerTypePicker, type TypeChoice } from "./composer-type-picker";
import { useThemeContext } from "@/lib/theme-provider";

export function ApiPostComposer() {
  useThemeContext();
  const services = useMabizServices();
  const app = useAppStore();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [caption, setCaption] = useState("");
  const [kind, setKind] = useState<"text" | "product" | "announcement">("text");
  const [identityKind, setIdentityKind] = useState<"personal" | "business">("personal");
  const [businessId, setBusinessId] = useState("");
  const [audience, setAudience] = useState<"public" | "followers" | "private">("public");
  const [allowComments, setAllowComments] = useState(true);
  const [location, setLocation] = useState("");
  const [urls, setUrls] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [altText, setAltText] = useState("");
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [showPoll, setShowPoll] = useState(false);
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [picked, setPicked] = useState<PickedMedia[]>([]);
  const [busyLabel, setBusyLabel] = useState("");
  const uploadedUrls = useRef<Record<string, string>>({});

  const ownedBusinesses = app.businesses.filter(
    (b) => b.ownerId === app.user.id || b.team.some((m) => m.userId === app.user.id)
  );
  const activeBusiness = ownedBusinesses.find((b) => b.id === businessId);

  const validateUrl = (url: string) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "https:" && !parsed.username && !parsed.password;
    } catch {
      return false;
    }
  };

  const openGallery = async (type: "image" | "video") => {
    const maxItems = 10;
    const keepCurrent = type === "image" && picked.length > 0 && picked[0].mediaType === "image";
    const remaining = type === "image" ? maxItems - (keepCurrent ? picked.length : 0) : 1;
    if (remaining < 1) {
      setError("You can attach up to 10 photos to one post.");
      return;
    }
    setError("");
    const result = await pickFromGallery(type, remaining);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.items.length === 0) return;
    setPicked((current) => (keepCurrent ? [...current, ...result.items].slice(0, maxItems) : result.items));
  };

  const toggleIdentity = () => {
    if (identityKind === "personal") {
      setIdentityKind("business");
      if (!businessId && ownedBusinesses[0]) setBusinessId(ownedBusinesses[0].id);
    } else {
      setIdentityKind("personal");
    }
  };

  const getPublishCaption = () => {
    if (showPoll) return caption.trim();
    if (kind === "product") {
      return [
        `Product: ${productName.trim()}`,
        productPrice.trim() ? `Price: ${productPrice.trim()}` : "",
        productUrl.trim() ? `Product link: ${productUrl.trim()}` : "",
        caption.trim(),
      ].filter(Boolean).join("\n\n");
    }
    if (kind === "announcement") {
      return [announcementTitle.trim(), caption.trim()].filter(Boolean).join("\n\n");
    }
    return caption.trim();
  };

  const continueToPreview = () => {
    setError("");
    if (identityKind === "business" && !businessId.trim()) {
      setError("Select the business that will publish this post.");
      return;
    }
    if (showPoll) {
      const options = pollOptions.map((item) => item.trim()).filter(Boolean);
      if (!pollQuestion.trim()) return setError("Add a question for your poll.");
      if (options.length < 2 || options.length > 6) return setError("A poll needs 2–6 non-empty options.");
    } else if (kind === "product") {
      if (!productName.trim()) return setError("Add the product name before continuing.");
      if (productUrl.trim() && !validateUrl(productUrl.trim())) return setError("The product link must be a valid HTTPS URL.");
    } else if (kind === "announcement" && !announcementTitle.trim()) {
      return setError("Add a title for your business update.");
    } else if (!caption.trim() && picked.length === 0 && !urls.trim()) {
      return setError("Write something or attach a photo or video before continuing.");
    }
    const mediaUrls = urls.split(/\n|,/).map((url) => url.trim()).filter(Boolean);
    if (mediaUrls.some((url) => !validateUrl(url))) return setError("Every media reference must be a hosted HTTPS URL.");
    setStep(3);
  };

  const publish = async () => {
    const cleanCaption = getPublishCaption();
    if (!cleanCaption && !(showPoll && pollQuestion.trim())) {
      setError("Add content before publishing.");
      return;
    }
    const mediaUrls = urls.split(/\n|,/).map((url) => url.trim()).filter(Boolean);
    if (mediaUrls.some((url) => !validateUrl(url))) {
      setError("Every media reference must be a hosted HTTPS URL.");
      return;
    }
    if (identityKind === "business" && !businessId.trim()) {
      setError("Select the business that will publish this post.");
      return;
    }
    const options = pollOptions.map((item) => item.trim()).filter(Boolean);
    const wantsPoll = showPoll;
    if (wantsPoll && (!pollQuestion.trim() || options.length < 2 || options.length > 6)) {
      setError("A poll needs a question and 2–6 non-empty options.");
      return;
    }
    const identityId = identityKind === "personal" ? app.user.id : businessId.trim();
    setBusy(true);
    setError("");
    const alt = altText.trim() ? { altText: altText.trim() } : {};
    const stopWith = (message: string) => {
      setError(message);
      setBusy(false);
      setBusyLabel("");
    };
    const uploadedMedia: { mediaType: "image" | "video"; url: string; altText?: string }[] = [];
    for (let index = 0; index < picked.length; index += 1) {
      const item = picked[index];
      const label = `Uploading ${index + 1} of ${picked.length}`;
      let url = uploadedUrls.current[item.uri];
      if (!url) {
        setBusyLabel(label);
        const file = { uri: item.uri, fileName: item.fileName, contentType: item.contentType, sizeBytes: item.sizeBytes };
        const ticket = await services.media.begin({ fileName: file.fileName, contentType: file.contentType, sizeBytes: file.sizeBytes });
        if (!ticket.ok) return stopWith(`Upload failed: ${errorText(ticket.error)}`);
        const sent = await services.media.upload(ticket.data, file, (progress) => setBusyLabel(`${label} (${progress.percent}%)`));
        if (!sent.ok) return stopWith(`Upload failed: ${errorText(sent.error)}`);
        const completed = await services.media.complete(ticket.data);
        if (!completed.ok) return stopWith(`Upload failed: ${errorText(completed.error)}`);
        if (!validateUrl(completed.data.url)) return stopWith("The server returned a media address that cannot be attached to a post.");
        url = completed.data.url;
        uploadedUrls.current[item.uri] = url;
      }
      uploadedMedia.push({ mediaType: item.mediaType, url, ...alt });
    }
    setBusyLabel("");
    const allMedia = [...uploadedMedia, ...mediaUrls.map((url) => ({ mediaType, url, ...alt }))];
    const finalKind = showPoll || kind === "text" ? (allMedia.length > 0 ? allMedia[0].mediaType : "text") : kind;
    const result = await services.posts.create({
      kind: finalKind,
      caption: cleanCaption,
      identityKind,
      identityId,
      businessId: identityKind === "business" ? identityId : null,
      audience,
      allowComments,
      location: location.trim() || undefined,
      hashtags: [...new Set((cleanCaption.match(/#([\p{L}\p{N}_]+)/gu) ?? []).map((tag) => tag.slice(1)))],
      mediaReferences: allMedia,
    });
    if (!result.ok) {
      setError(errorText(result.error));
      setBusy(false);
      return;
    }
    if (wantsPoll) {
      const closesAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const pollInput: ApiPollInput = { question: pollQuestion.trim(), options, closesAt };
      const pollResult = await services.posts.createPoll(result.data.id, pollInput);
      if (!pollResult.ok) {
        setError(`Post published, but poll creation failed: ${errorText(pollResult.error)}`);
        setBusy(false);
        router.replace({ pathname: "/post/[id]", params: { id: result.data.id } });
        return;
      }
    }
    setBusy(false);
    router.replace("/(tabs)");
  };

  const pickedStrip = picked.length > 0 ? (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {picked.map((item, index) => (
        <View key={`${item.uri}-${index}`}>
          {item.mediaType === "image" ? (
            <Image source={{ uri: item.uri }} style={{ width: 96, height: 96, borderRadius: 12 }} />
          ) : (
            <View style={{ width: 96, height: 96, borderRadius: 12, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="videocam" size={28} color={colors.white} />
            </View>
          )}
          <Pressable accessibilityRole="button" accessibilityLabel="Remove media" disabled={busy}
            onPress={() => setPicked((current) => current.filter((_, position) => position !== index))}
            style={{ position: "absolute", right: 4, top: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="close" size={13} color={colors.white} />
          </Pressable>
        </View>
      ))}
    </ScrollView>
  ) : null;

  const useFirstBusiness = () => {
    setIdentityKind("business");
    if (!businessId && ownedBusinesses[0]) setBusinessId(ownedBusinesses[0].id);
  };

  const typeChoices: TypeChoice[] = [
    { title: "Post", detail: "Share an update, photo, video or thought.", icon: "create-outline", select: () => { setKind("text"); setShowPoll(false); } },
    { title: "Poll", detail: "Ask a question and collect votes.", icon: "stats-chart-outline", select: () => { setKind("text"); setShowPoll(true); } },
    { title: "Product", detail: "Showcase a product with its name, price and link.", icon: "pricetag-outline", select: () => { setKind("product"); setShowPoll(false); useFirstBusiness(); } },
    { title: "Business update", detail: "Share news or an announcement from your business.", icon: "business-outline", select: () => { setKind("announcement"); setShowPoll(false); useFirstBusiness(); } },
  ];
  const selectedType = showPoll ? "Poll" : kind === "product" ? "Product" : kind === "announcement" ? "Business update" : "Post";

  return (
    <Page>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 }}>
        <Pressable onPress={() => { if (step === 3) setStep(2); else if (step === 2) setStep(1); else router.back(); }} style={{ padding: 4 }}>
          <Ionicons name="arrow-back" size={22} color={colors.navy} />
        </Pressable>
        <Text style={{ color: colors.navy, fontSize: 17, fontWeight: "800" }}>{step === 1 ? "Create something" : step === 2 ? `Create ${selectedType.toLowerCase()}` : "Preview post"}</Text>
        <Pressable onPress={() => router.push("/menu/activity/drafts")}><Text style={{ color: colors.emeraldDark, fontSize: 14, fontWeight: "700" }}>Drafts</Text></Pressable>
      </View>

      {!app.isAuthenticated ? <EmptyState title="Sign in to publish" detail="Publishing requires an authenticated API session." icon="lock-closed-outline" action="Sign in" onAction={() => router.push("/auth/login")} /> : null}
      {error ? <Text accessibilityRole="alert" style={{ ...styles.body, color: colors.danger }}>{error}</Text> : null}

      {step === 1 ? (
        <ComposerTypePicker
          choices={typeChoices}
          selectedType={selectedType}
          noBusinesses={ownedBusinesses.length === 0}
          onPick={(choice) => { choice.select(); setError(""); setStep(2); }}
        />
      ) : null}

      {step === 2 ? (
        <ComposerForm
          user={app.user}
          selectedType={selectedType}
          kind={kind}
          showPoll={showPoll}
          identityKind={identityKind}
          onToggleIdentity={toggleIdentity}
          businessId={businessId}
          setBusinessId={setBusinessId}
          activeBusiness={activeBusiness}
          ownedBusinesses={ownedBusinesses}
          caption={caption}
          setCaption={setCaption}
          pollQuestion={pollQuestion}
          setPollQuestion={setPollQuestion}
          pollOptions={pollOptions}
          setPollOptions={setPollOptions}
          productName={productName}
          setProductName={setProductName}
          productPrice={productPrice}
          setProductPrice={setProductPrice}
          productUrl={productUrl}
          setProductUrl={setProductUrl}
          announcementTitle={announcementTitle}
          setAnnouncementTitle={setAnnouncementTitle}
          pickedCount={picked.length}
          pickedStrip={pickedStrip}
          busy={busy}
          onOpenGallery={(type) => void openGallery(type)}
          mediaType={mediaType}
          setMediaType={setMediaType}
          urls={urls}
          setUrls={setUrls}
          altText={altText}
          setAltText={setAltText}
          location={location}
          setLocation={setLocation}
          audience={audience}
          setAudience={setAudience}
          allowComments={allowComments}
          setAllowComments={setAllowComments}
          onChangeType={() => setStep(1)}
          onPreview={continueToPreview}
        />
      ) : null}

      {step === 3 ? (
        <ComposerPreview
          user={app.user}
          selectedType={selectedType}
          kind={kind}
          showPoll={showPoll}
          identityKind={identityKind}
          businessId={businessId}
          activeBusiness={activeBusiness}
          audience={audience}
          location={location}
          allowComments={allowComments}
          pollQuestion={pollQuestion}
          pollOptions={pollOptions}
          productName={productName}
          productPrice={productPrice}
          productUrl={productUrl}
          announcementTitle={announcementTitle}
          caption={caption}
          pickedStrip={pickedStrip}
          urls={urls}
          busy={busy}
          busyLabel={busyLabel}
          isAuthenticated={app.isAuthenticated}
          onPublish={() => void publish()}
          onEdit={() => setStep(2)}
        />
      ) : null}
    </Page>
  );
}