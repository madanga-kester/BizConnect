
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  Avatar,
  Button,
  Chip,
  EmptyState,
  Field,
  Page,
  TopBar,
  styles,
} from "@/components/biz-ui";

import { useAppStore } from "@/hooks/use-app-store";
import { useThemeContext } from "@/lib/theme-provider";
import { COUNTY_TOWNS, KENYAN_COUNTIES } from "@/utils/kenya";
import type { County } from "@/types/domain";

function feedback(message: string) {
  if (Platform.OS === "web") window.alert(message);
  else Alert.alert("Profile", message);
}

export default function EditProfileScreen() {
  useThemeContext(); // Kept exactly as it was to avoid context errors

  const app = useAppStore();

  const [name, setName] = useState(app.user.name);
  const [username, setUsername] = useState(app.user.username);
  const [bio, setBio] = useState(app.user.bio);
  const [county, setCounty] = useState<County>(app.user.county);
  const [town, setTown] = useState(app.user.town);

  // County selector state
  const [countyModal, setCountyModal] = useState(false);
  const [countySearch, setCountySearch] = useState("");

  const filteredCounties = KENYAN_COUNTIES.filter((item) =>
    item.toLowerCase().includes(countySearch.trim().toLowerCase())
  );

  if (!app.isAuthenticated) {
    return (
      <Page>
        <TopBar title="Edit profile" back />
        <EmptyState
          title="Sign in to edit your profile"
          detail="Your profile belongs to your local demo account."
          icon="lock-closed-outline"
          action="Sign in"
          onAction={() => router.push("/auth/login")}
        />
      </Page>
    );
  }

  return (
    <Page>
      <TopBar title="Edit profile" back />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={localStyles.scrollContent}
      >
        {/* Avatar / Header Section */}
        <View style={localStyles.heroSection}>
          <View style={localStyles.avatarWrap}>
            <Avatar name={name} image={app.user.avatar} size={96} />

            <View style={localStyles.avatarBadge}>
              <Text style={localStyles.avatarBadgeText}>✎</Text>
            </View>
          </View>

          <Text style={localStyles.heroName}>
            {name || "Your name"}
          </Text>

          <Text style={localStyles.heroHandle}>
            @{username.replace(/^@/, "") || "username"}
          </Text>

          <Button
            title="Change profile photo"
            variant="outline"
            small
            onPress={async () => {
              try {
                const Picker = await import("expo-image-picker");

                const p =
                  await Picker.requestMediaLibraryPermissionsAsync();

                if (!p.granted) {
                  return feedback(
                    "Allow media access to select a profile photo."
                  );
                }

                const result =
                  await Picker.launchImageLibraryAsync({
                    mediaTypes: ["images"],
                    allowsEditing: true,
                    aspect: [1, 1],
                    quality: 0.7,
                  });

                if (!result.canceled) {
                  app.updateUser({
                    avatar: result.assets[0].uri,
                  });
                }
              } catch {
                feedback("Photo selection is available on device.");
              }
            }}
          />
        </View>

        {/* Personal Info Section */}
        <View style={localStyles.section}>
          <Text style={localStyles.sectionTitle}>
            Personal info
          </Text>

          <View style={localStyles.fieldStack}>
            <Field
              label="Full name"
              value={name}
              onChangeText={setName}
            />

            <Field
              label="Username"
              value={username}
              onChangeText={setUsername}
            />
          </View>
        </View>

        {/* Biography Section */}
        <View style={localStyles.section}>
          <Text style={localStyles.sectionTitle}>
            About you
          </Text>

          <Field
            label="Biography"
            value={bio}
            onChangeText={setBio}
            multiline
            placeholder="What would you like people to know?"
          />
        </View>

        {/* Location Section */}
        <View style={localStyles.section}>
          <Text style={localStyles.sectionTitle}>
            Location
          </Text>

          {/* COUNTY SELECTOR */}
          <View style={{ gap: 9 }}>
            <Text style={styles.label}>County</Text>

            <Pressable
              onPress={() => {
                setCountySearch("");
                setCountyModal(true);
              }}
              style={({ pressed }) => [
                localStyles.countyTrigger,
                pressed && { opacity: 0.75 },
              ]}
            >
              <View style={localStyles.countyIcon}>
                <View style={localStyles.locationPin}>
                  <View style={localStyles.locationPinInner} />
                </View>
              </View>

              <View style={{ flex: 1, gap: 4 }}>
                <Text style={localStyles.countyEyebrow}>
                  SELECTED COUNTY
                </Text>

                <Text style={localStyles.countyValue}>
                  {county}
                </Text>
              </View>

              <View style={localStyles.changeButton}>
                <Text style={localStyles.changeButtonText}>
                  Change
                </Text>
                <Text style={localStyles.changeArrow}>›</Text>
              </View>
            </Pressable>
          </View>

          {/* TOWN SELECTOR */}
          <View style={{ gap: 9, marginTop: 5 }}>
            <Text style={styles.label}>Town</Text>

            <View style={localStyles.chipGrid}>
              {COUNTY_TOWNS[county].map((item) => (
                <Chip
                  key={item}
                  label={item}
                  selected={town === item}
                  onPress={() => setTown(item)}
                />
              ))}
            </View>
          </View>

          {/* PRIVACY INFORMATION */}
          <View style={localStyles.captionRow}>
            <View style={localStyles.captionDot} />

            <Text style={[styles.caption, { flex: 1 }]}>
              Your profile can be public or private in Account privacy.
              Precise location stays hidden by default.
            </Text>
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Sticky Save Button */}
      <View style={localStyles.footer}>
        <Button
          title="Save profile locally"
          onPress={() => {
            if (!app.isAuthenticated) {
              return router.push("/auth/login");
            }

            app.updateUser({
              name: name.trim(),
              username: username.replace(/^@/, "").trim(),
              bio: bio.trim(),
              county,
              town,
            });

            feedback("Profile saved on this device.");
            router.back();
          }}
        />
      </View>

      {/* ================================= */}
      {/* SEARCHABLE COUNTY BOTTOM SHEET    */}
      {/* ================================= */}

      <Modal
        visible={countyModal}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setCountyModal(false)}
      >
        <View style={localStyles.modalOverlay}>

          {/* Outside dismiss area */}
          <Pressable
            style={{ flex: 1 }}
            onPress={() => setCountyModal(false)}
          />

          {/* Bottom Sheet */}
          <View style={localStyles.bottomSheet}>

            {/* Handle */}
            <View style={localStyles.sheetHandle} />

            {/* Header */}
            <View style={localStyles.sheetHeader}>
              <View style={{ flex: 1, gap: 5 }}>
                <Text style={localStyles.sheetTitle}>
                  Select county
                </Text>

                <Text style={localStyles.sheetSubtitle}>
                  Choose your county of residence
                </Text>
              </View>

              <Pressable
                onPress={() => setCountyModal(false)}
                style={({ pressed }) => [
                  localStyles.closeButton,
                  pressed && { opacity: 0.6 },
                ]}
                accessibilityLabel="Close county selector"
              >
                <Text style={localStyles.closeButtonText}>×</Text>
              </Pressable>
            </View>

            {/* Search Input */}
            <View style={localStyles.searchContainer}>
              <Text style={localStyles.searchIcon}>⌕</Text>

              <TextInput
                value={countySearch}
                onChangeText={setCountySearch}
                placeholder="Search county..."
                placeholderTextColor="#9CA3AF"
                style={localStyles.searchInput}
                autoCorrect={false}
                autoCapitalize="words"
                returnKeyType="search"
              />

              {countySearch.length > 0 && (
                <Pressable
                  onPress={() => setCountySearch("")}
                  hitSlop={10}
                >
                  <Text style={localStyles.clearText}>
                    Clear
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Results Heading */}
            <View style={localStyles.resultsHeader}>
              <Text style={localStyles.resultsLabel}>
                ALL COUNTIES
              </Text>

              <Text style={localStyles.resultsCount}>
                {filteredCounties.length} of 47
              </Text>
            </View>

            {/* Scrollable Counties */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={localStyles.countyList}
            >
              {filteredCounties.map((item, index) => {
                const selected = county === item;

                return (
                  <Pressable
                    key={item}
                    onPress={() => {
                      setCounty(item);
                      setTown(COUNTY_TOWNS[item][0]);
                      setCountyModal(false);
                      setCountySearch("");
                    }}
                    style={({ pressed }) => [
                      localStyles.countyItem,
                      selected && localStyles.countyItemSelected,
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    {/* Number */}
                    <View
                      style={[
                        localStyles.countyNumber,
                        selected && localStyles.countyNumberSelected,
                      ]}
                    >
                      <Text
                        style={[
                          localStyles.countyNumberText,
                          selected && localStyles.countyNumberTextSelected,
                        ]}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </Text>
                    </View>

                    {/* County Name */}
                    <Text
                      style={[
                        localStyles.countyName,
                        selected && localStyles.countyNameSelected,
                      ]}
                    >
                      {item}
                    </Text>

                    {/* Selection Indicator */}
                    <View
                      style={[
                        localStyles.radioOuter,
                        selected && localStyles.radioOuterSelected,
                      ]}
                    >
                      {selected && (
                        <View style={localStyles.radioInner} />
                      )}
                    </View>
                  </Pressable>
                );
              })}

              {filteredCounties.length === 0 && (
                <View style={localStyles.emptySearch}>
                  <View style={localStyles.emptySearchIcon}>
                    <Text style={localStyles.emptySearchIconText}>
                      ⌕
                    </Text>
                  </View>

                  <Text style={localStyles.emptySearchTitle}>
                    No counties found
                  </Text>

                  <Text style={localStyles.emptySearchSubtitle}>
                    Try searching with a different name.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Page>
  );
}

const localStyles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
    gap: 20,
  },

  heroSection: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 10,
  },

  avatarWrap: {
    position: "relative",
    marginBottom: 4,
  },

  avatarBadge: {
    position: "absolute",
    bottom: 2,
    right: -4,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6366f1",
  },

  avatarBadgeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  heroName: {
    fontSize: 20,
    fontWeight: "700",
  },

  heroHandle: {
    fontSize: 15,
    opacity: 0.6,
    marginBottom: 8,
  },

  section: {
    gap: 12,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    opacity: 0.6,
    marginBottom: 4,
  },

  fieldStack: {
    gap: 14,
  },

  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  captionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 12,
  },

  captionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#6366f1",
    marginTop: 6,
  },

  footer: {
    padding: 16,
    paddingTop: 12,
  },

  // County trigger
  countyTrigger: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(128,128,128,0.22)",
  },

  countyIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "rgba(99,102,241,0.09)",
    alignItems: "center",
    justifyContent: "center",
  },

  locationPin: {
    width: 15,
    height: 15,
    borderWidth: 2,
    borderColor: "#6366f1",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  locationPinInner: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#6366f1",
  },

  countyEyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    opacity: 0.5,
  },

  countyValue: {
    fontSize: 15,
    fontWeight: "700",
  },

  changeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(99,102,241,0.08)",
  },

  changeButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6366f1",
  },

  changeArrow: {
    fontSize: 19,
    color: "#6366f1",
    marginTop: -2,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },

  bottomSheet: {
    height: "82%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 28 : 18,
    overflow: "hidden",
  },

  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 10,
    backgroundColor: "#D1D5DB",
    alignSelf: "center",
    marginBottom: 22,
  },

  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 19,
  },

  sheetTitle: {
    fontSize: 21,
    fontWeight: "800",
    color: "#171717",
    letterSpacing: -0.4,
  },

  sheetSubtitle: {
    fontSize: 13,
    color: "#858585",
  },

  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },

  closeButtonText: {
    fontSize: 23,
    color: "#525252",
    marginTop: -2,
  },

  // Search
  searchContainer: {
    height: 49,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#EEEEEE",
    marginBottom: 19,
  },

  searchIcon: {
    fontSize: 23,
    color: "#777777",
  },

  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    color: "#171717",
    padding: 0,
    outlineStyle: "none",
  } as any,

  clearText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6366f1",
  },

  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  resultsLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    color: "#929292",
  },

  resultsCount: {
    fontSize: 11,
    fontWeight: "600",
    color: "#929292",
  },

  // County rows
  countyList: {
    gap: 7,
    paddingBottom: 24,
  },

  countyItem: {
    minHeight: 56,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 13,
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },

  countyItemSelected: {
    backgroundColor: "#F1F0FF",
    borderColor: "#6366f1",
  },

  countyNumber: {
    width: 33,
    height: 33,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0F0F0",
  },

  countyNumberSelected: {
    backgroundColor: "#E2E0FF",
  },

  countyNumberText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#929292",
  },

  countyNumberTextSelected: {
    color: "#5550C8",
  },

  countyName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: "#404040",
  },

  countyNameSelected: {
    color: "#514BC1",
    fontWeight: "700",
  },

  // Radio selection
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },

  radioOuterSelected: {
    borderColor: "#6366f1",
    borderWidth: 2,
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#6366f1",
  },

  // Empty search
  emptySearch: {
    alignItems: "center",
    paddingVertical: 45,
    gap: 9,
  },

  emptySearchIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },

  emptySearchIconText: {
    fontSize: 25,
    color: "#777777",
  },

  emptySearchTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333333",
  },

  emptySearchSubtitle: {
    fontSize: 12,
    color: "#999999",
  },
});
