import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button, LocalNote, Page, SectionTitle, TopBar, styles as bizStyles } from "@/components/biz-ui";

type BillingCycle = "monthly" | "yearly";

interface Plan {
  id: string;
  name: string;
  tagline: string;
  monthlyPrice: string;
  yearlyPrice: string;
  current: boolean;
  popular?: boolean;
  features: string[];
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Essential tools to get started",
    monthlyPrice: "$0",
    yearlyPrice: "$0",
    current: true,
    features: [
      "Personal profile & portfolio",
      "Unlimited standard posts",
      "Direct messaging with connections",
    ],
  },
  {
    id: "creator",
    name: "Creator",
    tagline: "Grow your audience & track engagement",
    monthlyPrice: "$9",
    yearlyPrice: "$7",
    current: false,
    features: [
      "Everything in Free",
      "Advanced audience & post insights",
      "Scheduled posts & creator studio",
      "Custom profile call-to-action links",
    ],
  },
  {
    id: "pro",
    name: "Mabiz Pro",
    tagline: "Complete toolkit for businesses & brands",
    monthlyPrice: "$24",
    yearlyPrice: "$19",
    current: false,
    popular: true,
    features: [
      "Everything in Creator",
      "Official Business Verification badge",
      "Priority placement in local search",
      "Lead capture forms & growth analytics",
      "Dedicated priority support",
    ],
  },
];

export default function SubscriptionsScreen() {
  const [billing, setBilling] = useState<BillingCycle>("yearly");
  const [notifiedPlans, setNotifiedPlans] = useState<Record<string, boolean>>({});

  const toggleNotify = (planId: string) => {
    setNotifiedPlans((prev) => ({
      ...prev,
      [planId]: !prev[planId],
    }));
  };

  return (
    <Page>
      <TopBar title="Subscriptions" back />

      {/* Header Intro */}
      <View style={localStyles.headerContainer}>
        <Text style={localStyles.heroTitle}>Upgrade your Mabiz experience</Text>
        <Text style={bizStyles.caption}>
          Unlock verified credibility, deeper analytics, and tools built to scale your reach.
        </Text>
      </View>

      <LocalNote text="Paid plans are launching soon. Join the waitlist on any tier to get early access & launch discounts." />

      {/* Billing Cycle Segmented Toggle */}
      <View style={localStyles.toggleWrapper}>
        <View style={localStyles.toggleContainer}>
          <Pressable
            onPress={() => setBilling("monthly")}
            style={[localStyles.toggleButton, billing === "monthly" && localStyles.toggleButtonActive]}
          >
            <Text style={[localStyles.toggleText, billing === "monthly" && localStyles.toggleTextActive]}>
              Monthly
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setBilling("yearly")}
            style={[localStyles.toggleButton, billing === "yearly" && localStyles.toggleButtonActive]}
          >
            <Text style={[localStyles.toggleText, billing === "yearly" && localStyles.toggleTextActive]}>
              Yearly
            </Text>
            <View style={localStyles.saveBadge}>
              <Text style={localStyles.saveBadgeText}>-20%</Text>
            </View>
          </Pressable>
        </View>
      </View>

      <SectionTitle title="Available Plans" />

      {/* Plan Cards */}
      <View style={localStyles.cardsList}>
        {PLANS.map((plan) => {
          const isNotified = !!notifiedPlans[plan.id];
          const displayPrice = billing === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;

          return (
            <View
              key={plan.id}
              style={[
                localStyles.planCard,
                plan.popular && localStyles.popularCard,
                plan.current && localStyles.currentCard,
              ]}
            >
              {/* Popular Ribbon */}
              {plan.popular && (
                <View style={localStyles.popularBadge}>
                  <Ionicons name="sparkles" size={12} color="#FFFFFF" />
                  <Text style={localStyles.popularBadgeText}>MOST POPULAR</Text>
                </View>
              )}

              {/* Card Header: Name & Price */}
              <View style={localStyles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <View style={localStyles.titleRow}>
                    <Text style={localStyles.planName}>{plan.name}</Text>
                    {plan.current && (
                      <View style={localStyles.currentPill}>
                        <Text style={localStyles.currentPillText}>ACTIVE</Text>
                      </View>
                    )}
                  </View>
                  <Text style={bizStyles.caption}>{plan.tagline}</Text>
                </View>

                <View style={localStyles.priceBox}>
                  <Text style={localStyles.priceText}>{displayPrice}</Text>
                  <Text style={localStyles.periodText}>/mo</Text>
                </View>
              </View>

              <View style={localStyles.divider} />

              {/* Feature List */}
              <View style={localStyles.featuresContainer}>
                {plan.features.map((feature, idx) => (
                  <View key={idx} style={localStyles.featureRow}>
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={plan.popular ? "#2563EB" : "#10B981"}
                    />
                    <Text style={localStyles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              {/* Action Footer */}
              <View style={localStyles.cardFooter}>
                {plan.current ? (
                  <View style={localStyles.currentPlanFooter}>
                    <Ionicons name="shield-checkmark-outline" size={16} color="#4B5563" />
                    <Text style={localStyles.currentPlanFooterText}>Your current active plan</Text>
                  </View>
                ) : (
                  <Button
                    title={isNotified ? "✓ On Early Access Waitlist" : "Notify Me at Launch"}
                    variant={isNotified ? "outline" : "primary"}
                    onPress={() => toggleNotify(plan.id)}
                  />
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Reassurance / FAQ Footer */}
      <View style={localStyles.footerInfo}>
        <View style={localStyles.footerInfoRow}>
          <Ionicons name="lock-closed-outline" size={16} color="#6B7280" />
          <Text style={localStyles.footerInfoText}>
            No charges today. Cancel or switch plans anytime once live.
          </Text>
        </View>
      </View>
    </Page>
  );
}

const localStyles = StyleSheet.create({
  headerContainer: {
    marginBottom: 12,
    gap: 4,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
    letterSpacing: -0.3,
  },
  toggleWrapper: {
    alignItems: "center",
    marginVertical: 12,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 4,
    width: "100%",
  },
  toggleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 9,
    gap: 6,
  },
  toggleButtonActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  toggleTextActive: {
    color: "#111827",
  },
  saveBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  saveBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#15803D",
  },
  cardsList: {
    gap: 16,
    marginTop: 4,
  },
  planCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  popularCard: {
    borderColor: "#2563EB",
    borderWidth: 2,
    backgroundColor: "#F8FAFF",
  },
  currentCard: {
    backgroundColor: "#FAFAFA",
  },
  popularBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#2563EB",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 10,
  },
  popularBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  planName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  currentPill: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  currentPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#374151",
  },
  priceBox: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  priceText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
  },
  periodText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6B7280",
    marginLeft: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 14,
  },
  featuresContainer: {
    gap: 10,
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureText: {
    fontSize: 13.5,
    color: "#374151",
    flex: 1,
  },
  cardFooter: {
    marginTop: 2,
  },
  currentPlanFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
  },
  currentPlanFooterText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B5563",
  },
  footerInfo: {
    marginTop: 20,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  footerInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  footerInfoText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
  },
});