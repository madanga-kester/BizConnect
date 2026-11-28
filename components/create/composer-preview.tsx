import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Avatar, Button, styles } from "@/components/biz-ui";
import { colors, createThemedStyles } from "@/theme/tokens";
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
    <View style={localStyles.root}>
      <View style={localStyles.headerBand}>
        <Text style={localStyles.heading}>Review before publishing</Text>
        <Text style={styles.caption}>
          Check the content and settings. Go back if you want to make a change.
        </Text>
      </View>

      <View style={localStyles.previewBand}>
        <View style={localStyles.authorRow}>
          <Avatar
            name={
              p.identityKind === "business"
                ? p.activeBusiness?.name ?? "Business"
                : p.user.name
            }
            image={
              p.identityKind === "business"
                ? p.activeBusiness?.logo
                : p.user.avatar
            }
            size={38}
          />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={localStyles.authorName}>
              {p.identityKind === "business"
                ? p.activeBusiness?.name ?? p.businessId
                : p.user.name}
            </Text>
            <Text style={[styles.caption, { textTransform: "capitalize" }]}>
              {p.audience}
              {p.location ? ` · ${p.location}` : ""}
            </Text>
          </View>
          <Text style={localStyles.typeLabel}>
            {p.selectedType.toUpperCase()}
          </Text>
        </View>

        {p.showPoll ? (
          <View style={{ gap: 7 }}>
            <Text style={localStyles.pollQuestion}>{p.pollQuestion}</Text>
            {p.pollOptions
              .filter((option) => option.trim())
              .map((option, index) => (
                <View
                  key={`${index}-${option}`}
                  style={localStyles.pollOptionRow}
                >
                  <Text style={styles.body}>{option}</Text>
                </View>
              ))}
          </View>
        ) : null}

        {p.kind === "product" && !p.showPoll ? (
          <View style={{ gap: 4 }}>
            <Text style={localStyles.itemTitle}>{p.productName}</Text>
            {p.productPrice.trim() ? (
              <Text style={localStyles.priceText}>{p.productPrice}</Text>
            ) : null}
            {p.productUrl.trim() ? (
              <Text style={localStyles.linkText}>{p.productUrl}</Text>
            ) : null}
          </View>
        ) : null}

        {p.kind === "announcement" && !p.showPoll ? (
          <Text style={localStyles.itemTitle}>{p.announcementTitle}</Text>
        ) : null}

        {p.caption.trim() ? (
          <Text style={localStyles.captionText}>{p.caption.trim()}</Text>
        ) : null}

        {p.pickedStrip}

        {p.urls.trim() ? (
          <Text style={styles.caption}>
            {(() => {
              const n = p.urls.split(/\n|,/).filter((url) => url.trim()).length;
              return `${n} attachment${n === 1 ? "" : "s"}`;
            })()}
          </Text>
        ) : null}
      </View>

      <View style={localStyles.metaBand}>
        <View style={localStyles.metaRow}>
          <Text style={styles.body}>Audience</Text>
          <Text style={[styles.body, { textTransform: "capitalize" }]}>
            {p.audience}
          </Text>
        </View>
        <View style={[localStyles.metaRow, localStyles.metaRowLast]}>
          <Text style={styles.body}>Comments</Text>
          <Text style={styles.body}>{p.allowComments ? "On" : "Off"}</Text>
        </View>
      </View>

      <View style={localStyles.actionsBand}>
        {p.busyLabel ? <Text style={styles.caption}>{p.busyLabel}</Text> : null}
        <Button
          title={p.busy ? "Publishing…" : "Publish post"}
          disabled={p.busy || !p.isAuthenticated}
          onPress={p.onPublish}
        />
        <Button
          title="Edit post"
          variant="outline"
          disabled={p.busy}
          onPress={p.onEdit}
        />
      </View>
    </View>
  );
}

const localStyles = createThemedStyles(() =>
  StyleSheet.create({
    root: {
      backgroundColor: colors.surface,
    },
    headerBand: {
      gap: 3,
      marginHorizontal: -16,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    heading: {
      color: colors.ink,
      fontSize: 19,
      fontWeight: "800",
      letterSpacing: -0.2,
    },
    previewBand: {
      gap: 10,
      marginHorizontal: -16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: colors.surface,
      borderBottomWidth: 6,
      borderBottomColor: colors.canvas,
    },
    authorRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    authorName: {
      color: colors.ink,
      fontSize: 14,
      fontWeight: "700",
    },
    typeLabel: {
      color: colors.emeraldDark,
      fontSize: 11,
      fontWeight: "800",
    },
    pollQuestion: {
      color: colors.ink,
      fontSize: 15,
      fontWeight: "700",
    },
    pollOptionRow: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    itemTitle: {
      color: colors.ink,
      fontSize: 17,
      fontWeight: "800",
    },
    priceText: {
      color: colors.emeraldDark,
      fontSize: 15,
      fontWeight: "700",
    },
    linkText: {
      color: colors.emeraldDark,
      fontSize: 12,
    },
    captionText: {
      color: colors.ink,
      fontSize: 14,
      lineHeight: 20,
    },
    metaBand: {
      marginHorizontal: -16,
      backgroundColor: colors.surface,
      borderBottomWidth: 6,
      borderBottomColor: colors.canvas,
    },
    metaRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 13,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    metaRowLast: {
      borderBottomWidth: 0,
    },
    actionsBand: {
      gap: 10,
      marginHorizontal: -16,
      paddingHorizontal: 16,
      paddingTop: 14,
      paddingBottom: 20,
      backgroundColor: colors.surface,
    },
  })
);