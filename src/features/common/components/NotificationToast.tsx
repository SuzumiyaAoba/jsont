/**
 * NotificationToast component for displaying user notifications
 */

import { dismissNotificationAtom, notificationAtom } from "@store/atoms/ui";
import { Box, Text, useInput } from "ink";
import { useAtom, useSetAtom } from "jotai";

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

  const getTypeColor = (type: string) => {
    switch (type) {
      case "success":
        return "green";
      case "error":
        return "red";
      case "warning":
        return "yellow";
      default:
        return "blue";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "success":
        return "✓";
      case "error":
        return "✗";
      case "warning":
        return "⚠";
      default:
        return "ℹ";
    }
  };

  return (
    <Box width={60} paddingX={2} paddingY={1} flexDirection="column">
      <Box justifyContent="space-between" alignItems="center">
        <Box alignItems="center">
          <Text color={getTypeColor(notification.type)} bold>
            {getTypeIcon(notification.type)} {notification.type.toUpperCase()}
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
