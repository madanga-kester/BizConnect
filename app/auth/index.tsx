
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Button, Page, TopBar } from "@/components/biz-ui";
import { colors } from "@/theme/tokens";

const SLIDES = [
  {
    icon: "storefront-outline" as const,
    label: "DISCOVER LOCAL BUSINESSES",
    title: "Discover businesses worth knowing.",
    text: "Find products, services and independent businesses around your neighbourhood.",
  },
  {
    icon: "book-outline" as const,
    label: "REAL STORIES. REAL PEOPLE.",
    title: "Every business has a story.",
    text: "Explore the journeys, challenges and lessons behind growing businesses.",
  },
  {
    icon: "trending-up-outline" as const,
    label: "YOUR NEXT CHAPTER STARTS HERE",
    title: "Find connections. Create opportunities.",
    text: "Connect directly with entrepreneurs, discover ideas and grow something of your own.",
  },
];

export default function WelcomeScreen() {
  const [slide, setSlide] = useState(0);
  const item = SLIDES[slide];

  return (
    <Page
      style={{
        flexGrow: 1,
        justifyContent: "space-between",
        backgroundColor: "#F7FAF8",
      }}
    >
      <View style={{ gap: 22 }}>
        <TopBar title="BizConnect" />

        <View
          style={{
            backgroundColor: "#E8F5EE",
            borderRadius: 30,
            minHeight: 265,
            overflow: "hidden",
            padding: 22,
            justifyContent: "center",
          }}
        >
          <View
            style={{
              position: "absolute",
              width: 210,
              height: 210,
              borderRadius: 105,
              backgroundColor: "#D2EBDD",
              right: -45,
              top: -65,
            }}
          />

          <View
            style={{
              position: "absolute",
              width: 145,
              height: 145,
              borderRadius: 73,
              backgroundColor: "#C1E3D0",
              right: 55,
              bottom: -85,
            }}
          />

          <View
            style={{
              width: 105,
              height: 105,
              borderRadius: 32,
              backgroundColor: colors.emerald,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 22,
              transform: [{ rotate: "-6deg" }],
            }}
          >
            <Ionicons name={item.icon} size={48} color={colors.white} />
          </View>

          <View
            style={{
              backgroundColor: colors.white,
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 20,
              alignSelf: "flex-start",
              marginBottom: 13,
            }}
          >
            <Text
              style={{
                color: colors.emerald,
                fontSize: 10,
                fontWeight: "800",
                letterSpacing: 1,
              }}
            >
              {item.label}
            </Text>
          </View>

          <Text
            style={{
              color: colors.navy,
              fontSize: 29,
              lineHeight: 36,
              fontWeight: "800",
              maxWidth: 310,
              marginBottom: 10,
            }}
          >
            {item.title}
          </Text>

          <Text
            style={{
              color: "#52665C",
              fontSize: 14,
              lineHeight: 22,
              maxWidth: 310,
            }}
          >
            {item.text}
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", gap: 7 }}>
            {SLIDES.map((_, index) => (
              <Pressable
                key={index}
                accessibilityRole="button"
                accessibilityLabel={`Onboarding slide ${index + 1}`}
                onPress={() => setSlide(index)}
                style={{
                  width: index === slide ? 25 : 7,
                  height: 7,
                  borderRadius: 5,
                  backgroundColor:
                    index === slide ? colors.emerald : "#CBD5CE",
                }}
              />
            ))}
          </View>

          <Text style={{ color: "#718078", fontSize: 12, fontWeight: "600" }}>
            {slide + 1} of {SLIDES.length}
          </Text>
        </View>
      </View>

      <View style={{ gap: 13, paddingBottom: 8 }}>
        <Button
          title={slide === SLIDES.length - 1 ? "Get started" : "Continue"}
          icon="arrow-forward"
          onPress={() =>
            slide === SLIDES.length - 1
              ? router.push("/auth/login")
              : setSlide(slide + 1)
          }
        />

        <Text
          style={{
            color: "#87938C",
            fontSize: 11,
            textAlign: "center",
            lineHeight: 17,
          }}
        >
          Discover businesses, meet entrepreneurs and find new opportunities.
        </Text>
      </View>
    </Page>
  );
}
