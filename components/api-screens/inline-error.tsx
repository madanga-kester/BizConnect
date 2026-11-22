import { StyleSheet, Text, View } from "react-native";
import { Button, styles } from "@/components/biz-ui";
import { colors, createThemedStyles } from "@/theme/tokens";
import { useThemeContext } from "@/lib/theme-provider";

/** Local, human-readable error with an optional retry. Use it inside the
 *  section that failed so the rest of the page can still render. */
export function InlineError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  useThemeContext();
  return (
    <View accessibilityRole="alert" style={localStyles.box}>
      <Text style={[styles.body, { color: colors.danger }]}>{message}</Text>
      {onRetry ? (
        <Button title="Try again" small variant="outline" onPress={onRetry} />
      ) : null}
    </View>
  );
}

const localStyles = createThemedStyles(() =>
  StyleSheet.create({
    box: { gap: 10, paddingVertical: 8 },
  })
);
