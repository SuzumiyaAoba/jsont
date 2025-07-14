/**
 * jq Query Examples Component
 */

import { Box, Text } from "ink";
import { getJqExamples } from "../utils/jqTransform";

interface JqExamplesProps {
  selectedIndex: number;
  isVisible: boolean;
}

export function JqExamples({ selectedIndex, isVisible }: JqExamplesProps) {
  if (!isVisible) return null;

  const examples = getJqExamples();

  return (
    <Box
      borderStyle="single"
      borderColor="cyan"
      padding={1}
      width="100%"
      flexDirection="column"
    >
      <Box marginBottom={1}>
        <Text bold color="cyan">
          jq Query Examples
        </Text>
        <Text color="gray"> (↑/↓: navigate, Enter: select, Esc: close)</Text>
      </Box>

      <Box flexDirection="column">
        {examples.map((example, index) => (
          <Box key={example}>
            <Text
              color={index === selectedIndex ? "black" : "white"}
              backgroundColor={index === selectedIndex ? "cyan" : undefined}
            >
              {example}
            </Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
