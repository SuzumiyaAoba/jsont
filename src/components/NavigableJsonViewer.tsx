/**
 * NavigableJsonViewer Component
 * F2: Simple Navigation - Main Navigation Component
 */

import { Box, Text } from "ink";
import type React from "react";
import { useEffect } from "react";
import { useNavigation } from "../hooks/useNavigation.js";
import { useTheme } from "../hooks/useTheme.js";
import type {
  JsonValue,
  NavigationItem,
  NavigationOptions,
} from "../types/index.js";

interface NavigableJsonViewerProps {
  data: JsonValue;
  selectedIndex?: number;
  onNavigate?: (selectedIndex: number, currentPath: string[]) => void;
  onScroll?: (scrollOffset: number) => void;
  currentPath?: string[];
  viewportHeight?: number;
  options?: NavigationOptions;
  themeName?: string;
}

/**
 * Renders a single navigation item with proper styling
 */
function NavigationItemComponent({
  item,
  isSelected,
  index,
  getColor,
}: {
  item: NavigationItem;
  isSelected: boolean;
  index: number;
  getColor: (
    colorKey: keyof import("../types/theme.js").JsonColorScheme,
  ) => string;
}) {
  const indent = "  ".repeat(item.depth);
  const selectionIndicator = isSelected ? "→ " : "  ";

  const renderValue = (value: JsonValue): React.ReactNode => {
    if (value === null) {
      return <Text color={getColor("null")}>null</Text>;
    }

    if (typeof value === "string") {
      return <Text color={getColor("strings")}>"{value}"</Text>;
    }

    if (typeof value === "number") {
      return <Text color={getColor("numbers")}>{value}</Text>;
    }

    if (typeof value === "boolean") {
      return <Text color={getColor("booleans")}>{value.toString()}</Text>;
    }

    if (Array.isArray(value)) {
      return <Text color={getColor("structural")}>[{value.length} items]</Text>;
    }

    if (typeof value === "object") {
      const keys = Object.keys(value);
      return (
        <Text color={getColor("keys")}>
          {"{"}...{keys.length} keys{"}"}
        </Text>
      );
    }

    return <Text color={getColor("text")}>{String(value)}</Text>;
  };

  return (
    <Box data-testid={`json-item-${index}`} data-selected={isSelected}>
      <Text color={isSelected ? getColor("text") : getColor("null")}>
        {selectionIndicator}
      </Text>
      <Text color={isSelected ? getColor("text") : getColor("null")}>
        {indent}
      </Text>

      {item.type === "property" || item.type === "array-item" ? (
        <>
          <Text color={isSelected ? getColor("text") : getColor("keys")}>
            {item.type === "array-item" ? `[${item.key}]` : `"${item.key}"`}
          </Text>
          <Text color={isSelected ? getColor("text") : getColor("text")}>
            :{" "}
          </Text>
          {renderValue(item.value)}
        </>
      ) : (
        renderValue(item.value)
      )}
    </Box>
  );
}

/**
 * Status bar showing navigation information
 */
function NavigationStatusBar({
  selectedIndex,
  totalItems,
  currentPath: _currentPath,
  pathString,
}: {
  selectedIndex: number;
  totalItems: number;
  currentPath: string[];
  pathString: string;
}) {
  return (
    <Box borderStyle="single" borderColor="gray" padding={0}>
      <Box flexGrow={1}>
        <Text color="cyan">
          Item {selectedIndex + 1} of {totalItems}
        </Text>
        <Text color="gray"> | </Text>
        <Text color="yellow" data-testid="current-path">
          Path: {pathString}
        </Text>
      </Box>
      <Box>
        <Text color="gray">
          j/k: Navigate | Ctrl+d/u: Page | g/G: Jump | ↑↓: Arrow keys
        </Text>
      </Box>
    </Box>
  );
}

/**
 * Main navigable JSON viewer component
 */
export function NavigableJsonViewer({
  data,
  selectedIndex: controlledSelectedIndex,
  onNavigate,
  onScroll,
  currentPath: controlledCurrentPath,
  viewportHeight = 20,
  options = {},
  themeName,
}: NavigableJsonViewerProps) {
  const { getColor } = useTheme(themeName);
  const navigationOptions = {
    viewportHeight,
    enableKeyboardNavigation: options.enableKeyboardNavigation ?? true,
    initialSelectedIndex: controlledSelectedIndex || 0,
    ...options,
  };

  const navigation = useNavigation(data, navigationOptions);

  // Use controlled state if provided, otherwise use hook state
  const selectedIndex = controlledSelectedIndex ?? navigation.selectedIndex;
  const currentPath = controlledCurrentPath ?? navigation.currentPath;
  const pathString = navigation.getPathString();

  // Notify parent of navigation changes
  useEffect(() => {
    if (onNavigate) {
      onNavigate(selectedIndex, currentPath);
    }
  }, [selectedIndex, currentPath, onNavigate]);

  // Notify parent of scroll changes
  useEffect(() => {
    if (onScroll) {
      onScroll(navigation.scrollOffset);
    }
  }, [navigation.scrollOffset, onScroll]);

  if (!data) {
    return (
      <Box flexGrow={1} justifyContent="center" alignItems="center">
        <Text color={getColor("null")}>No JSON data to display</Text>
      </Box>
    );
  }

  if (navigation.flatItems.length === 0) {
    return (
      <Box flexGrow={1} justifyContent="center" alignItems="center">
        <Text color={getColor("null")}>Empty JSON structure</Text>
      </Box>
    );
  }

  const visibleItems = navigation.getVisibleItems();

  return (
    <Box flexDirection="column" width="100%" height="100%">
      {/* Navigation status bar */}
      <NavigationStatusBar
        selectedIndex={selectedIndex}
        totalItems={navigation.flatItems.length}
        currentPath={currentPath}
        pathString={pathString}
      />

      {/* Main content area */}
      <Box
        flexGrow={1}
        width="100%"
        flexDirection="column"
        padding={1}
        // role="tree"
        // tabIndex={0}
      >
        {visibleItems.map((item, visibleIndex) => {
          const actualIndex = navigation.scrollOffset + visibleIndex;
          const isSelected = actualIndex === selectedIndex;
          // Create unique key that includes both index and full path to prevent duplicates
          const uniqueKey = `nav-${actualIndex}-${item.path.join(".")}-${item.key}-${item.depth}`;

          return (
            <NavigationItemComponent
              key={uniqueKey}
              item={item}
              isSelected={isSelected}
              index={actualIndex}
              getColor={getColor}
            />
          );
        })}
      </Box>
    </Box>
  );
}
