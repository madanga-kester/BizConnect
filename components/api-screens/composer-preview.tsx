import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { Avatar, Button, styles } from "@/components/biz-ui";
import { colors } from "@/theme/tokens";
import type { Business, UserProfile } from "@/types/domain";
import { useThemeContext } from "@/lib/theme-provider";

type Props = {
  user: Pick<UserProfile, "name" | "avatar">;
  selectedType: string;
  kind: "text" | "product" | "announcement";
  showPoll: boolean;
  identityKind: "personal" | "business";
  businessId: string;
  activeBusiness?: Business;
  audience: "public" | "followers" | "private";
  location: string;
  allowComments: boolean;
  pollQuestion: string;
  pollOptions: string[];
  productName: string;
  productPrice: string;
  productUrl: string;
  announcementTitle: string;
  caption: string;
  pickedStrip: ReactNode;
  urls: string;
  busy: boolean;
  busyLabel: string;
  isAuthenticated: boolean;
  onPublish: () => void;
  onEdit: () => void;
};

export function ComposerPreview(p: Props) {
  useThemeContext();
  return (
    <View style={{ gap: 14, paddingTop: 6 }}>
      <View style={{ gap: 3 }}>
        <Text style={{ color: colors.navy, fontSize: 19, fontWeight: "800" }}>Review before publishing</Text>
        <Text style={styles.caption}>Check the content and settings. Go back if you want to make a change.</Text>
      </View>
      <View style={{ padding: 14, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <Avatar
            name={p.identityKind === "business" ? p.activeBusiness?.name ?? "Business" : p.user.name}
            image={p.identityKind === "business" ? p.activeBusiness?.logo : p.user.avatar}
            size={36}
          />
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.navy, fontSize: 14, fontWeight: "800" }}>
              {p.identityKind === "business" ? p.activeBusiness?.name ?? p.businessId : p.user.name}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 11 }}>
              {p.audience} {p.location ? `· ${p.location}` : ""}
            </Text>
          </View>
          <Text style={{ color: colors.emeraldDark, fontSize: 11, fontWeight: "800" }}>{p.selectedType.toUpperCase()}</Text>
        </View>
        {p.showPoll ? (
          <View style={{ gap: 7 }}>
            <Text style={{ color: colors.navy, fontSize: 15, fontWeight: "800" }}>{p.pollQuestion}</Text>
            {p.pollOptions.filter((option) => option.trim()).map((option, index) => (
              <View key={`${index}-${option}`} style={{ padding: 10, borderRadius: 10, borderWidth: 1, borderColor: colors.border }}>
                <Text style={styles.body}>{option}</Text>
              </View>
            ))}
          </View>
        ) : null}
        {p.kind === "product" && !p.showPoll ? (
          <View style={{ gap: 4 }}>
            <Text style={{ color: colors.navy, fontSize: 17, fontWeight: "800" }}>{p.productName}</Text>
            {p.productPrice.trim() ? <Text style={{ color: colors.emeraldDark, fontSize: 15, fontWeight: "800" }}>{p.productPrice}</Text> : null}
            {p.productUrl.trim() ? <Text style={{ color: colors.emeraldDark, fontSize: 12 }}>{p.productUrl}</Text> : null}
          </View>
        ) : null}
        {p.kind === "announcement" && !p.showPoll ? (
          <Text style={{ color: colors.navy, fontSize: 17, fontWeight: "800" }}>{p.announcementTitle}</Text>
        ) : null}
        {p.caption.trim() ? <Text style={{ color: colors.navy, fontSize: 14, lineHeight: 20 }}>{p.caption.trim()}</Text> : null}
        {p.pickedStrip}
        {p.urls.trim() ? (
          <Text style={styles.caption}>{p.urls.split(/\n|,/).filter((url) => url.trim()).length} hosted media attachment(s)</Text>
        ) : null}
      </View>
      <View style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 14, overflow: "hidden" }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", padding: 13, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <Text style={styles.body}>Audience</Text>
          <Text style={{ ...styles.body, textTransform: "capitalize" }}>{p.audience}</Text>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", padding: 13, backgroundColor: colors.surface }}>
          <Text style={styles.body}>Comments</Text>
          <Text style={styles.body}>{p.allowComments ? "On" : "Off"}</Text>
        </View>
      </View>
      {p.busyLabel ? <Text style={styles.caption}>{p.busyLabel}</Text> : null}
      <Button title={p.busy ? "Publishing…" : "Publish post"} disabled={p.busy || !p.isAuthenticated} onPress={p.onPublish} />
      <Button title="Edit post" variant="outline" disabled={p.busy} onPress={p.onEdit} />
    </View>
  );
}