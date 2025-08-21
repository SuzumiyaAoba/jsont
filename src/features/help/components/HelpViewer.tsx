/**
 * Comprehensive Help System Component
 */

import type { KeyBindings } from "@core/config/types";
import type { AppMode } from "@core/types/app";
import { Box, Text } from "ink";
import { useMemo } from "react";
import { getHelpContentForMode } from "../utils/helpUtils";

export interface HelpViewerProps {
  /** Current application mode */
  mode: AppMode;
  /** Keybindings configuration */
  keybindings: KeyBindings;
  /** Height of the help viewer in terminal lines */
  height?: number;
  /** Width of the help viewer in characters */
  width?: number;
  /** Height (in terminal rows) of the property details area reserved below the help viewer. Must be >= 0. */
  propertyDetailsHeight?: number;
}

export function HelpViewer({
  mode,
  keybindings,
  height = 20,
  width = 80,
  propertyDetailsHeight = 0,
}: HelpViewerProps) {
  const helpContent = useMemo(
    () => getHelpContentForMode(mode, keybindings).sections,
    [mode, keybindings],
  );

  // Sanitize input to prevent negative values
  const reservedBottom = Math.max(0, Math.floor(propertyDetailsHeight));

  // Layout constants
  const contentPadding = 4;
  const minContentHeight = 10;

  return (
    <Box
      flexDirection="column"
      width={width}
      height={height}
      justifyContent="center"
      alignItems="center"
      paddingBottom={reservedBottom}
    >
      {/* Help content with border frame */}
      <Box
        flexDirection="column"
        width={Math.min(width - contentPadding, 76)}
        height={Math.max(
          height - reservedBottom - contentPadding,
          minContentHeight,
        )}
        borderStyle="double"
        borderColor="cyan"
        paddingX={2}
        paddingY={1}
      >
        {/* Header */}
        <Box justifyContent="center">
          <Text color="cyan" bold>
            HELP - {mode.toUpperCase()} MODE
          </Text>
        </Box>

        {/* Empty line after header */}
        <Text> </Text>

        {/* Help Content */}
        {helpContent.map((section, sectionIndex) => (
          <Box key={section.title} flexDirection="column">
            <Text color="yellow" bold>
              {section.title}
            </Text>
            {section.shortcuts.map((shortcut, index) => (
              <Text key={`${section.title}-${shortcut.key}-${index}`}>
                <Text color="cyan" bold>
                  {`  ${shortcut.key.padEnd(18)}`}
                </Text>
                <Text color="white">{shortcut.description}</Text>
              </Text>
            ))}
            {/* Add spacing between sections except for the last one */}
            {sectionIndex < helpContent.length - 1 && <Text> </Text>}
          </Box>
        ))}

        {/* Empty line before footer */}
        <Text> </Text>

        {/* Footer */}
        <Box justifyContent="center">
          <Text color="gray" italic>
            Press ? again or Esc to close help
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
