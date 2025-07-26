/**
 * NotificationToast component for displaying user notifications
 */

import { dismissNotificationAtom, notificationAtom } from "@store/atoms/ui";
import { Box, Text, useInput } from "ink";
import { useAtom, useSetAtom } from "jotai";

// Configuration object for notification types - defined outside component to prevent re-creation
const notificationConfig = {
  success: { color: "green" as const, icon: "✓" },
  error: { color: "red" as const, icon: "✗" },
  warning: { color: "yellow" as const, icon: "⚠" },
  info: { color: "blue" as const, icon: "ℹ" },
} as const;

export function NotificationToast() {
  const [notification] = useAtom(notificationAtom);
  const dismissNotification = useSetAtom(dismissNotificationAtom);

  // Handle keyboard input to dismiss notification
  useInput(
    (input, key) => {
      if (notification && (key.escape || input === "q")) {
        dismissNotification();
      }
    },
    { isActive: !!notification },
  );

  if (!notification) {
    return null;
  }

  // Get configuration for the notification type, with fallback to info
  const config =
    notificationConfig[notification.type as keyof typeof notificationConfig] ||
    notificationConfig.info;

  return (
    <Box width={60} paddingX={2} paddingY={1} flexDirection="column">
      <Box justifyContent="space-between" alignItems="center">
        <Box alignItems="center">
          <Text color={config.color} bold>
            {config.icon} {notification.type.toUpperCase()}
          </Text>
        </Box>
        <Text dimColor>ESC to dismiss</Text>
      </Box>

      <Box marginTop={1}>
        <Text wrap="wrap">{notification.message}</Text>
      </Box>

      {notification.type !== "error" && (
        <Box marginTop={1}>
          <Text dimColor>Auto-dismissing in a few seconds...</Text>
        </Box>
      )}
    </Box>
  );
}
