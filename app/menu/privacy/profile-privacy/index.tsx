
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Switch,
  Text,
  View,
  StyleSheet,
  Pressable,
} from "react-native";

import {
  ActionTile,
  Avatar,
  Button,
  LocalNote,
  Page,
  SectionTitle,
  TopBar,
  styles,
} from "@/components/biz-ui";

import { PEOPLE } from "@/data/seed";
import { useAppStore } from "@/hooks/use-app-store";
import { colors, createThemedStyles } from "@/theme/tokens";
import { useThemeContext } from "@/lib/theme-provider";

const PERMISSIONS = ["everyone", "following", "nobody"] as const;

export default function PrivacyScreen() {
  useThemeContext();

  const app = useAppStore();

  const [messagePermission, setMessagePermission] = useState(
    app.settings.messagePermissions
  );

  const switchRow = (
    title: string,
    detail: string,
    value: boolean,
    change: (v: boolean) => void,
    last = false
  ) => (
    <View
      style={[
        localStyles.settingRow,
        !last && localStyles.rowDivider,
      ]}
    >
      <View style={localStyles.settingText}>
        <Text style={localStyles.settingTitle}>{title}</Text>
        <Text style={styles.caption}>{detail}</Text>
      </View>

      <Switch
        value={value}
        onValueChange={change}
        trackColor={{
          false: colors.border,
          true: colors.emerald,
        }}
        thumbColor={colors.white}
      />
    </View>
  );

  return (
    <Page>
      <TopBar title="Account privacy" back />

      <View style={localStyles.container}>

        {/* PRIVACY OVERVIEW */}
        <View style={localStyles.hero}>
          <View style={localStyles.heroIcon}>
            <Ionicons name="shield-checkmark" size={26} color={colors.white} />
          </View>
          <View style={{ flex: 1, gap: 5 }}>
            <Text style={localStyles.heroTitle}>
              Your privacy, your control
            </Text>

            <Text style={styles.caption}>
              Manage who sees your profile, contacts you
              and accesses your public information.
            </Text>
          </View>
        </View>

        <LocalNote text="These frontend privacy controls affect this device's demo data only." />

        {/* PROFILE PRIVACY */}
        <View style={localStyles.section}>
          <SectionTitle title="Personal profile" />

          <View style={localStyles.card}>
            {switchRow(
              "Private profile",
              "Limit who can view your personal profile content.",
              app.settings.privateProfile,
              (value) =>
                app.updateSettings({ privateProfile: value })
            )}

            {switchRow(
              "Hide precise location",
              "Only show your public town or county, never coordinates.",
              app.settings.hidePreciseLocation,
              (value) =>
                app.updateSettings({
                  hidePreciseLocation: value,
                }),
              true
            )}
          </View>
        </View>

        {/* MESSAGE PERMISSIONS */}
        <View style={localStyles.section}>
          <SectionTitle title="Who can message you?" />

          <View style={localStyles.card}>
            <View style={localStyles.messageIntro}>
              <Text style={localStyles.messageTitle}>
                Message permissions
              </Text>

              <Text style={styles.caption}>
                Choose who is allowed to send you messages.
              </Text>
            </View>

            <View style={localStyles.permissionList}>
              {PERMISSIONS.map((item) => {
                const selected = messagePermission === item;

                const label =
                  item === "everyone"
                    ? "Everyone"
                    : item === "following"
                      ? "People you follow"
                      : "Nobody";

                const description =
                  item === "everyone"
                    ? "Anyone can send you a message"
                    : item === "following"
                      ? "Only accounts you follow"
                      : "No one can send you messages";

                return (
                  <Pressable
                    key={item}
                    onPress={() => {
                      setMessagePermission(item);
                      app.updateSettings({
                        messagePermissions: item,
                      });
                    }}
                    style={[
                      localStyles.permissionOption,
                      selected && localStyles.permissionSelected,
                    ]}
                  >
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text
                        style={[
                          localStyles.permissionTitle,
                          selected && localStyles.selectedText,
                        ]}
                      >
                        {label}
                      </Text>

                      <Text style={styles.caption}>
                        {description}
                      </Text>
                    </View>

                    <View
                      style={[
                        localStyles.radioOuter,
                        selected && localStyles.radioActive,
                      ]}
                    >
                      {selected && (
                        <View style={localStyles.radioInner} />
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* LOCATION NOTICE */}
        <View style={localStyles.locationNotice}>
          <View style={localStyles.noticeIcon}>
            <Text style={localStyles.noticeIconText}>i</Text>
          </View>

          <View style={{ flex: 1, gap: 4 }}>
            <Text style={localStyles.noticeTitle}>
              Location access
            </Text>

            <Text style={styles.caption}>
              Location permission is requested only when you
              choose a location-based feature. Precise coordinates
              are not stored in this UI.
            </Text>
          </View>
        </View>

        {/* BLOCKED USERS */}
        <View style={localStyles.section}>
          <View style={localStyles.blockedHeader}>
            <SectionTitle title="Blocked users" />

            <View style={localStyles.countBadge}>
              <Text style={localStyles.countText}>
                {app.blockedUsers.length}
              </Text>
            </View>
          </View>

          <View style={localStyles.card}>
            {app.blockedUsers.length ? (
              app.blockedUsers.map((id, index) => {
                const person = PEOPLE.find((p) => p.id === id);

                return (
                  <View
                    key={id}
                    style={[
                      localStyles.blockedRow,
                      index !== app.blockedUsers.length - 1 &&
                        localStyles.rowDivider,
                    ]}
                  >
                    <Avatar
                      name={person?.name ?? "Mabiz user"}
                      size={44}
                    />

                    <View style={localStyles.blockedInfo}>
                      <Text style={localStyles.blockedName}>
                        {person?.name ?? "User"}
                      </Text>

                      <Text style={styles.caption}>
                        Blocked in this local demo
                      </Text>
                    </View>

                    <Button
                      title="Unblock"
                      variant="outline"
                      small
                      onPress={() => app.toggleBlock(id)}
                    />
                  </View>
                );
              })
            ) : (
              <View style={localStyles.emptyBlocked}>
                <View style={localStyles.emptyIcon}>
                  <Text style={localStyles.emptyIconText}>✓</Text>
                </View>

                <Text style={localStyles.emptyTitle}>
                  No blocked users
                </Text>

                <Text
                  style={[
                    styles.caption,
                    { textAlign: "center" },
                  ]}
                >
                  People you block will appear here.
                </Text>
              </View>
            )}
          </View>
        </View>

        <Text style={[styles.caption, localStyles.footerText]}>
          You can update these preferences whenever you want.
        </Text>
      </View>
    </Page>
  );
}

const localStyles = createThemedStyles(() => StyleSheet.create({
  container: {
    gap: 23,
    paddingBottom: 25,
  },

  // Overview
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "rgba(128,128,128,0.07)",
  },

  heroIcon: {
    width: 46,
    height: 54,
    borderRadius: 10,
    backgroundColor: colors.emeraldFill,
    alignItems: "center",
    justifyContent: "center",
  },

  heroTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.ink,
  },

  // Sections
  section: {
    gap: 12,
  },

  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },

  // Setting rows
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
    paddingHorizontal: 16,
    paddingVertical: 17,
  },

  settingText: {
    flex: 1,
    gap: 5,
  },

  settingTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.ink,
  },

  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },

  // Messaging
  messageIntro: {
    padding: 16,
    gap: 5,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },

  messageTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.ink,
  },

  permissionList: {
    padding: 10,
    gap: 7,
  },

  permissionOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 13,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "transparent",
  },

  permissionSelected: {
    backgroundColor: "rgba(16,185,129,0.07)",
    borderColor: colors.emerald,
  },

  permissionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.ink,
  },

  selectedText: {
    color: colors.emerald,
  },

  radioOuter: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  radioActive: {
    borderColor: colors.emerald,
    borderWidth: 2,
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.emerald,
  },

  // Location notice
  locationNotice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 15,
    borderRadius: 16,
    backgroundColor: "rgba(128,128,128,0.07)",
  },

  noticeIcon: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: "rgba(128,128,128,0.13)",
    alignItems: "center",
    justifyContent: "center",
  },

  noticeIconText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.ink,
  },

  noticeTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.ink,
  },

  // Blocked users
  blockedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  countBadge: {
    minWidth: 25,
    height: 25,
    borderRadius: 9,
    paddingHorizontal: 7,
    backgroundColor: "rgba(128,128,128,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  countText: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.ink,
  },

  blockedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },

  blockedInfo: {
    flex: 1,
    gap: 4,
  },

  blockedName: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.ink,
  },

  emptyBlocked: {
    alignItems: "center",
    padding: 27,
    gap: 9,
  },

  emptyIcon: {
    width: 45,
    height: 45,
    borderRadius: 15,
    backgroundColor: "rgba(16,185,129,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyIconText: {
    color: colors.emerald,
    fontSize: 21,
    fontWeight: "800",
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink,
  },

  footerText: {
    textAlign: "center",
    marginTop: -8,
  },
}));
