/**
 * Help mode keyboard input handler
 */

import type { KeyboardInput } from "@core/types/app";
import { useCallback } from "react";

export interface HelpHandlerDependencies {
  helpVisible: boolean;
  setHelpVisible: (visible: boolean | ((prev: boolean) => boolean)) => void;
  keybindings: any;
  updateDebugInfo: (action: string, input: string) => void;
}

export function useHelpHandler(deps: HelpHandlerDependencies) {
  const { helpVisible, setHelpVisible, keybindings, updateDebugInfo } = deps;

  const handleHelpInput = useCallback(
    (input: string, key: KeyboardInput): boolean => {
      if (!helpVisible) return false;

      // Handle help mode inputs - only allow help close or exit
      if (keybindings.isHelp(input, key)) {
        if (process.stdout.write) {
          // Restore main screen buffer and clear
          process.stdout.write("\x1b[?1049l"); // Switch back to main screen buffer
          process.stdout.write("\x1b[2J\x1b[H\x1b[0m"); // Clear and reset
        }
        setHelpVisible(false);
        updateDebugInfo("Close help (?)", input);
        return true;
      } else if (key.escape) {
        if (process.stdout.write) {
          // Restore main screen buffer and clear
          process.stdout.write("\x1b[?1049l"); // Switch back to main screen buffer
          process.stdout.write("\x1b[2J\x1b[H\x1b[0m"); // Clear and reset
        }
        setHelpVisible(false);
        updateDebugInfo("Close help (Esc)", input);
        return true;
      }
      // Ignore all other keys when help is visible
      return true;
    },
    [helpVisible, keybindings, setHelpVisible, updateDebugInfo],
  );

  return { handleHelpInput };
}
