/**
 * Interactive Settings TUI Main Component
 */

import type { KeyboardInput } from "@core/types/app";
import {
  batchNavigationUpdateAtom,
  closeSettingsAtom,
  debouncedNavigationUpdateAtom,
  resetPreviewValuesAtom,
  resetToDefaultsAtom,
  saveSettingsAtom,
  settingsStateAtom,
  stopEditingAtom,
} from "@store/atoms/settings";
import { Box, useInput } from "ink";
import { useAtom, useSetAtom } from "jotai";
import { useCallback, useEffect, useMemo } from "react";
import {
  getCategoryById,
  getFieldByKey,
  SETTINGS_CATEGORIES,
} from "../config/settingsDefinitions";
import { useCurrentConfigValues } from "../utils/configMapper";
import { SettingsCategory } from "./SettingsCategory";
import { SettingsDescriptionPanel } from "./SettingsDescriptionPanel";
import { SettingsFooter } from "./SettingsFooter";
import { SettingsHeader } from "./SettingsHeader";

interface SettingsViewerProps {
  width: number;
  height: number;
}

export function SettingsViewer({ width, height }: SettingsViewerProps) {
  const [settingsState, setSettingsState] = useAtom(settingsStateAtom);
  const closeSettings = useSetAtom(closeSettingsAtom);
  const currentConfigValues = useCurrentConfigValues();

  // Memoized setters to prevent unnecessary re-renders
  const debouncedNavigationUpdate = useSetAtom(debouncedNavigationUpdateAtom);
  const batchNavigationUpdate = useSetAtom(batchNavigationUpdateAtom);
  const stopEditing = useSetAtom(stopEditingAtom);
  const saveSettings = useSetAtom(saveSettingsAtom);
  const resetPreview = useSetAtom(resetPreviewValuesAtom);
  const resetToDefaults = useSetAtom(resetToDefaultsAtom);

  // Initialize with current config values - only once on mount
  useEffect(() => {
    setSettingsState((prev) => {
      // Initialize preview values if empty
      if (Object.keys(prev.previewValues).length === 0) {
        return {
          ...prev,
          previewValues: currentConfigValues,
          originalValues: currentConfigValues,
        };
      }
      return prev;
    });
  }, [currentConfigValues, setSettingsState]); // Initialize when config values are available

  // Memoize current category to prevent re-calculations
  const currentCategory = useMemo(() => {
    return getCategoryById(settingsState.activeCategory);
  }, [settingsState.activeCategory]);

  // Memoize field indices to prevent unnecessary navigation calculations
  const navigationData = useMemo(() => {
    if (!currentCategory) {
      return {
        currentFieldIndex: -1,
        currentCategoryIndex: 0,
        hasFields: false,
      };
    }

    const currentFieldIndex = settingsState.activeField
      ? currentCategory.fields.findIndex(
          (f) => f.key === settingsState.activeField,
        )
      : -1;

    const currentCategoryIndex = SETTINGS_CATEGORIES.findIndex(
      (cat) => cat.id === settingsState.activeCategory,
    );

    return {
      currentFieldIndex,
      currentCategoryIndex,
      hasFields: currentCategory.fields.length > 0,
    };
  }, [
    currentCategory,
    settingsState.activeField,
    settingsState.activeCategory,
  ]);

  // Handle keyboard input
  const handleKeyInput = useCallback(
    (input: string, key: KeyboardInput) => {
      // Global shortcuts
      if (key.escape || input === "q") {
        if (settingsState.isEditing) {
          stopEditing();
          return;
        }
        if (settingsState.hasUnsavedChanges) {
          // TODO: Show confirmation dialog
          resetPreview();
        }
        closeSettings();
        return;
      }

      if (input === "s" && key.ctrl) {
        saveSettings();
        return;
      }

      if (input === "r" && key.ctrl) {
        resetPreview();
        return;
      }

      if (input === "d" && key.ctrl) {
        resetToDefaults();
        return;
      }

      // If editing, delegate to field editor
      if (settingsState.isEditing) {
        // Field editing will be handled by individual field components
        return;
      }

      // Category navigation (Tab/Shift+Tab)
      if (key.tab) {
        const { currentCategoryIndex } = navigationData;
        const nextIndex = key.shift
          ? (currentCategoryIndex - 1 + SETTINGS_CATEGORIES.length) %
            SETTINGS_CATEGORIES.length
          : (currentCategoryIndex + 1) % SETTINGS_CATEGORIES.length;
        const nextCategory = SETTINGS_CATEGORIES[nextIndex];
        if (nextCategory) {
          batchNavigationUpdate({ categoryId: nextCategory.id });
        }
        return;
      }

      // Field navigation within category
      if (!currentCategory || !navigationData.hasFields) return;

      const { currentFieldIndex } = navigationData;

      if (key.downArrow || input === "j") {
        const nextIndex =
          (currentFieldIndex + 1) % currentCategory.fields.length;
        const nextField = currentCategory.fields[nextIndex];
        if (nextField) {
          debouncedNavigationUpdate({ fieldKey: nextField.key });
        }
      } else if (key.upArrow || input === "k") {
        const prevIndex =
          (currentFieldIndex - 1 + currentCategory.fields.length) %
          currentCategory.fields.length;
        const prevField = currentCategory.fields[prevIndex];
        if (prevField) {
          debouncedNavigationUpdate({ fieldKey: prevField.key });
        }
      } else if (key.return || input === "e") {
        // Start editing current field
        if (settingsState.activeField) {
          debouncedNavigationUpdate({ isEditing: true });
        }
      }
    },
    [
      settingsState.isEditing,
      settingsState.hasUnsavedChanges,
      settingsState.activeField,
      currentCategory,
      navigationData,
      closeSettings,
      debouncedNavigationUpdate,
      batchNavigationUpdate,
      stopEditing,
      saveSettings,
      resetPreview,
      resetToDefaults,
    ],
  );

  useInput(handleKeyInput, { isActive: true });

  // Calculate layout dimensions for 2-pane layout - maximize screen usage
  const headerHeight = 4; // Header with title and tabs
  const footerHeight = settingsState.isEditing ? 3 : 4; // Compact footer
  const contentHeight = Math.max(10, height - headerHeight - footerHeight); // Use most of available height

  // Split content area: 60% for settings list, 40% for description panel
  const settingsWidth = Math.floor(width * 0.6);
  const descriptionWidth = width - settingsWidth;

  // Get current field information for description panel
  const currentField = settingsState.activeField
    ? getFieldByKey(settingsState.activeField)
    : null;
  const currentValue = settingsState.activeField
    ? (settingsState.previewValues[settingsState.activeField] ??
      currentField?.field.defaultValue)
    : undefined;
  const originalValue = settingsState.activeField
    ? settingsState.originalValues[settingsState.activeField]
    : undefined;

  return (
    <Box
      flexDirection="column"
      width={width}
      height={height}
      justifyContent="flex-start"
    >
      {/* Header */}
      <SettingsHeader
        currentCategory={settingsState.activeCategory}
        hasUnsavedChanges={settingsState.hasUnsavedChanges}
        categories={SETTINGS_CATEGORIES}
      />

      {/* Main Content - Two Pane Layout */}
      <Box flexGrow={1} flexDirection="row">
        {/* Left Pane - Settings List */}
        <Box width={settingsWidth}>
          {currentCategory && (
            <SettingsCategory
              category={currentCategory}
              activeField={settingsState.activeField}
              isEditing={settingsState.isEditing}
              previewValues={settingsState.previewValues}
              originalValues={settingsState.originalValues}
              height={contentHeight}
            />
          )}
        </Box>

        {/* Right Pane - Description Panel */}
        <Box width={descriptionWidth}>
          <SettingsDescriptionPanel
            field={currentField?.field || null}
            currentValue={currentValue}
            originalValue={originalValue}
            isEditing={settingsState.isEditing}
            width={descriptionWidth}
            height={contentHeight}
          />
        </Box>
      </Box>

      {/* Footer */}
      <SettingsFooter
        isEditing={settingsState.isEditing}
        hasUnsavedChanges={settingsState.hasUnsavedChanges}
      />
    </Box>
  );
}
