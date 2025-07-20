/**
 * Comprehensive Help System Component
 */

import type { AppMode } from "@core/types/app";
import { Box, Text } from "ink";
import { useMemo } from "react";
import { getHelpContentForMode } from "../utils/helpUtils";

export interface HelpViewerProps {
  /** Current application mode */
  mode: AppMode;
  /** Height of the help viewer in terminal lines */
  height?: number;
  /** Width of the help viewer in characters */
  width?: number;
}

export function HelpViewer({ mode, height = 20, width = 80 }: HelpViewerProps) {
  const helpContent = useMemo(
    () => getHelpContentForMode(mode).sections,
    [mode],
  );

  return (
    <Box
      flexDirection="column"
      width={width}
      height={height}
      justifyContent="center"
      alignItems="center"
    >
      {/* Help content with border frame */}
      <Box
        flexDirection="column"
        width={Math.min(width - 4, 76)}
        height={Math.min(height - 4, 18)}
        borderStyle="double"
        borderColor="cyan"
        paddingX={2}
        paddingY={1}
      >
        {/* Header */}
        <Box justifyContent="center" marginBottom={1}>
          <Text color="cyan" bold>
            HELP - {mode.toUpperCase()} MODE
          </Text>
        </Box>

        {/* Help Content */}
        <Box flexDirection="column" flexGrow={1}>
          {helpContent.map((section, _sectionIndex) => (
            <Box key={section.title} flexDirection="column" marginBottom={1}>
              <Text color="yellow" bold>
                {section.title}
              </Text>
              <Box height={1} />
              {section.shortcuts.map((shortcut, index) => (
                <Box
                  key={`${shortcut.key}-${index}`}
                  flexDirection="row"
                  marginLeft={2}
                >
                  <Text color="cyan" bold>
                    {shortcut.key.padEnd(12)}
                  </Text>
                  <Text color="white">{shortcut.description}</Text>
                </Box>
              ))}
              {/* Add extra spacing after each section */}
              <Box height={1} />
            </Box>
          ))}
        </Box>

        {/* Footer */}
        <Box justifyContent="center" marginTop={1}>
          <Text color="gray" italic>
            Press ? again or Esc to close help
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
