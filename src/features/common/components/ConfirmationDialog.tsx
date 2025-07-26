/**
 * ConfirmationDialog component for user confirmations
 */

import {
  confirmationDialogAtom,
  dismissConfirmationAtom,
} from "@store/atoms/ui";
import { Box, Text, useInput } from "ink";
import { useAtom, useSetAtom } from "jotai";
import { useCallback } from "react";

interface ConfirmationDialogProps {
  terminalWidth?: number;
}

export function ConfirmationDialog({
  terminalWidth = 80,
}: ConfirmationDialogProps = {}) {
  const [dialog] = useAtom(confirmationDialogAtom);
  const dismissConfirmation = useSetAtom(dismissConfirmationAtom);

  const handleConfirm = useCallback(() => {
    if (dialog) {
      dialog.onConfirm();
      dismissConfirmation();
    }
  }, [dialog, dismissConfirmation]);

  const handleCancel = useCallback(() => {
    if (dialog?.onCancel) {
      dialog.onCancel();
    }
    dismissConfirmation();
  }, [dialog, dismissConfirmation]);

  // Handle keyboard input
  useInput(
    (input, key) => {
      if (!dialog) return;

      if (key.return || input === "y") {
        handleConfirm();
      } else if (key.escape || input === "n" || input === "q") {
        handleCancel();
      }
    },
    { isActive: !!dialog },
  );

  if (!dialog) {
    return null;
  }

  const confirmText = dialog.confirmText ?? "Yes";
  const cancelText = dialog.cancelText ?? "No";

  // Calculate responsive width (max 80, min 40, or 80% of terminal width)
  const dialogWidth = Math.min(
    80,
    Math.max(40, Math.floor(terminalWidth * 0.8)),
  );

  return (
    <Box
      width={dialogWidth}
      paddingX={3}
      paddingY={2}
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
    >
      <Box marginBottom={1}>
        <Text bold color="yellow">
          {dialog.title}
        </Text>
      </Box>

      <Box marginBottom={2}>
        <Text wrap="wrap">{dialog.message}</Text>
      </Box>

      <Box flexDirection="row" justifyContent="center" columnGap={4}>
        <Box>
          <Text backgroundColor="green" color="black" bold>
            {" "}
            {confirmText} (y/Enter){" "}
          </Text>
        </Box>
        <Box>
          <Text backgroundColor="red" color="white" bold>
            {" "}
            {cancelText} (n/ESC){" "}
          </Text>
        </Box>
      </Box>

      <Box marginTop={1}>
        <Text dimColor>Press Enter/y to confirm, ESC/n to cancel</Text>
      </Box>
    </Box>
  );
}
