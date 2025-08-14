/**
 * Property details display component - shows full property information at the bottom of the screen
 */

import { Box, Text } from "ink";
import type React from "react";
import type {
  PropertyDetails,
  PropertyDetailsConfig,
} from "../types/propertyDetails";

export interface PropertyDetailsDisplayProps {
  /** Property details to display */
  details: PropertyDetails | null;

  /** Configuration for the display */
  config: PropertyDetailsConfig;

  /** Available width for the display */
  width: number;

  /** Available height for the display (optional, defaults to config.maxHeight) */
  height?: number;
}

/**
 * PropertyDetailsDisplay component
 *
 * Displays full property information without truncation at the bottom of the screen
 */
export function PropertyDetailsDisplay({
  details,
  config,
  width,
}: Omit<PropertyDetailsDisplayProps, "height">) {
  if (!config.enabled || !details) {
    return null;
  }

  // Calculate available width for content (accounting for borders and padding)
  const contentWidth = Math.max(0, width - 2);

  // Prepare display text sections - always create all sections
  const sections: React.ReactElement[] = [];

  // Define label width for right alignment (longest label is "Children")
  const LABEL_WIDTH = 8; // "Children".length

  // Path section - always reserve space
  if (config.showPath && details.pathString) {
    sections.push(
      <Text key="path">
        <Text color="gray" dimColor>
          {"Path".padStart(LABEL_WIDTH)}
        </Text>{" "}
        {details.pathString}
      </Text>,
    );
  } else if (config.showPath) {
    sections.push(
      <Text key="path">
        <Text color="gray" dimColor>
          {"Path".padStart(LABEL_WIDTH)}
        </Text>{" "}
        -
      </Text>,
    );
  }

  // Key section - always reserve space
  if (details.key !== null && details.key !== "") {
    const keyText =
      typeof details.key === "number" ? `[${details.key}]` : `"${details.key}"`;
    sections.push(
      <Text key="key">
        <Text color="gray" dimColor>
          {"Key".padStart(LABEL_WIDTH)}
        </Text>{" "}
        {keyText}
      </Text>,
    );
  } else {
    sections.push(
      <Text key="key">
        <Text color="gray" dimColor>
          {"Key".padStart(LABEL_WIDTH)}
        </Text>{" "}
        root
      </Text>,
    );
  }

  // Type section - always reserve space
  if (config.showType) {
    sections.push(
      <Text key="type">
        <Text color="gray" dimColor>
          {"Type".padStart(LABEL_WIDTH)}
        </Text>{" "}
        {details.type}
      </Text>,
    );
  }

  // Children count section - always reserve space
  if (config.showChildrenCount) {
    if (details.hasChildren && details.childrenCount !== undefined) {
      const countText =
        details.type === "array"
          ? `${details.childrenCount} items`
          : `${details.childrenCount} properties`;
      sections.push(
        <Text key="children">
          <Text color="gray" dimColor>
            {"Children".padStart(LABEL_WIDTH)}
          </Text>{" "}
          {countText}
        </Text>,
      );
    } else {
      sections.push(
        <Text key="children">
          <Text color="gray" dimColor>
            {"Children".padStart(LABEL_WIDTH)}
          </Text>{" "}
          -
        </Text>,
      );
    }
  }

  // Value section (always shown)
  sections.push(
    <Text key="value">
      <Text color="gray" dimColor>
        {"Value".padStart(LABEL_WIDTH)}
      </Text>{" "}
      {details.valueString}
    </Text>,
  );

  // Show all available sections (don't limit by height parameter)
  const sectionsToShow = sections;

  return (
    <Box
      flexDirection="column"
      width={width}
      height={8} // Fixed height: 1 header + 5 content + 2 borders
      borderStyle="single"
      borderColor="gray"
    >
      {/* Header */}
      <Box width={contentWidth}>
        <Text color="cyan" bold>
          Property Details
        </Text>
      </Box>

      {/* Content */}
      {sectionsToShow.map((section) => (
        <Box key={section.key} width={contentWidth}>
          {section}
        </Box>
      ))}
    </Box>
  );
}

/**
 * Compact version of property details display for smaller screens
 */
export function CompactPropertyDetailsDisplay({
  details,
  config,
  width,
}: Omit<PropertyDetailsDisplayProps, "height">) {
  if (!config.enabled || !details) {
    return null;
  }

  const contentWidth = Math.max(0, width - 2);

  // Create a single line with the most important information
  const keyText =
    details.key !== null && details.key !== ""
      ? typeof details.key === "number"
        ? `[${details.key}]`
        : `"${details.key}"`
      : "root";

  const compactInfo = `${keyText}: ${details.valueString}`;

  const displayText =
    compactInfo.length <= contentWidth
      ? compactInfo
      : `${compactInfo.slice(0, contentWidth - 3)}...`;

  return (
    <Box
      width={width}
      height={3} // Single line + top/bottom borders
      borderStyle="single"
      borderColor="gray"
    >
      <Text>{displayText}</Text>
    </Box>
  );
}
