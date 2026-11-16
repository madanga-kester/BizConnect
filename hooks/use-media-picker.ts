import { Platform } from "react-native";

export type PickedMedia = {
  uri: string;
  mediaType: "image" | "video";
  contentType: string;
  fileName: string;
  sizeBytes: number;
};

export type PickResult = {
  items: PickedMedia[];
  error?: string;
};

function fallbackFileName(type: "image" | "video", index: number): string {
  const extension = type === "image" ? "jpg" : "mp4";
  return `${type === "image" ? "photo" : "video"}-${Date.now()}-${index}.${extension}`;
}

export async function pickFromGallery(type: "image" | "video", limit = 10): Promise<PickResult> {
  try {
    const ImagePicker = await import("expo-image-picker");

    if (Platform.OS !== "web") {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        return { items: [], error: "Allow access to your media library in Settings to attach media." };
      }
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: [type === "image" ? "images" : "videos"],
      allowsMultipleSelection: type === "image",
      selectionLimit: type === "image" ? Math.max(1, limit) : 1,
      quality: 0.75,
    });

    if (res.canceled || !res.assets || res.assets.length === 0) return { items: [] };

    const items: PickedMedia[] = [];
    for (let index = 0; index < res.assets.length; index += 1) {
      const asset = res.assets[index];
      let sizeBytes = asset.fileSize;
      if (sizeBytes === undefined && Platform.OS !== "web") {
        const FileSystem = await import("expo-file-system/legacy");
        const info = await FileSystem.getInfoAsync(asset.uri);
        if (info.exists) sizeBytes = info.size;
      }
      if (sizeBytes === undefined) {
        return { items: [], error: "The size of the selected file could not be read." };
      }
      items.push({
        uri: asset.uri,
        mediaType: type,
        contentType: asset.mimeType ?? (type === "image" ? "image/jpeg" : "video/mp4"),
        fileName: asset.fileName ?? fallbackFileName(type, index),
        sizeBytes,
      });
    }
    return { items };
  } catch {
    return { items: [], error: "Media selection is not available in this environment." };
  }
}