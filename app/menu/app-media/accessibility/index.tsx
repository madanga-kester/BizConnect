import { ToggleScreen } from "@/components/pref-screens";

export default function AccessibilityScreen() {
  return (
    <ToggleScreen
      title="Accessibility"
      heading="Display and motion"
      prefKey="accessibility"
      items={[
        { key: "largeText", title: "Larger text", detail: "Increase text size across the app", defaultValue: false },
        { key: "highContrast", title: "High contrast", detail: "Stronger colours for text and borders", defaultValue: false },
        { key: "reduceMotion", title: "Reduce motion", detail: "Limit animations and transitions", defaultValue: false },
      ]}
    />
  );
}
