/**
 * Property details display component - shows full property information at the bottom of the screen
 */

import { Box, Text } from "ink";
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

  // Prepare display text sections
  const sections: string[] = [];

  // Path section
  if (config.showPath && details.pathString) {
    sections.push(`Path: ${details.pathString}`);
  }

  // Key section
  if (details.key !== null && details.key !== "") {
    const keyText =
      typeof details.key === "number" ? `[${details.key}]` : `"${details.key}"`;
    sections.push(`Key: ${keyText}`);
  }

  // Type section
  if (config.showType) {
    sections.push(`Type: ${details.type}`);
  }

  // Children count section
  if (
    config.showChildrenCount &&
    details.hasChildren &&
    details.childrenCount !== undefined
  ) {
    const countText =
      details.type === "array"
        ? `${details.childrenCount} items`
        : `${details.childrenCount} properties`;
    sections.push(`Children: ${countText}`);
  }

  // Value section (always shown)
  sections.push(`Value: ${details.valueString}`);

  // Truncate sections if they exceed available width
  const truncatedSections = sections.map((section) => {
    if (section.length <= contentWidth) {
      return section;
    }
    return `${section.slice(0, contentWidth - 3)}...`;
  });

  // Show all available sections (don't limit by height parameter)
  const sectionsToShow = truncatedSections;

  return (
    <Box
      flexDirection="column"
      width={width}
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
        <Box key={section} width={contentWidth}>
          <Text>{section}</Text>
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
