import { Alert, Platform } from "react-native";
import type { PersistedComposerDraft, PostComposerSnapshot } from "@/types/create-studio";

export function alertUser(title: string, message: string) {
  if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
}

export function postDraft(id: string, snapshot: PostComposerSnapshot): PersistedComposerDraft {
  return {
    id,
    kind: snapshot.kind,
    caption: snapshot.caption,
    media: snapshot.media,
    mediaItems: snapshot.mediaItems,
    identityId: snapshot.identityId,
    businessTags: snapshot.businessTags,
    productId: snapshot.productId,
    location: snapshot.location,
    updatedAt: new Date().toISOString(),
    draftType: "post",
    composer: { version: 1, mode: "post", post: snapshot },
  };
}
