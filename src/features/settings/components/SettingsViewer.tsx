/**
 * Interactive Settings TUI Main Component
 */

import {
  closeSettingsAtom,
  resetPreviewValuesAtom,
  resetToDefaultsAtom,
  saveSettingsAtom,
  setActiveCategoryAtom,
  setActiveFieldAtom,
  settingsStateAtom,
  startEditingAtom,
  stopEditingAtom,
} from "@store/atoms/settings";
import { Box, useInput } from "ink";
import { useAtom, useSetAtom } from "jotai";
import { useCallback, useEffect, useMemo } from "react";
import {
  getCategoryById,
  SETTINGS_CATEGORIES,
} from "../config/settingsDefinitions";
import { useCurrentConfigValues } from "../utils/configMapper";
import { SettingsCategory } from "./SettingsCategory";
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

  // Initialize with current config values
  useEffect(() => {
    setSettingsState((prev) => ({
      ...prev,
      previewValues: currentConfigValues,
      originalValues: currentConfigValues,
    }));
  }, [currentConfigValues, setSettingsState]);
  const setActiveCategory = useSetAtom(setActiveCategoryAtom);
  const setActiveField = useSetAtom(setActiveFieldAtom);
  const startEditing = useSetAtom(startEditingAtom);
  const stopEditing = useSetAtom(stopEditingAtom);
  const saveSettings = useSetAtom(saveSettingsAtom);
  const resetPreview = useSetAtom(resetPreviewValuesAtom);
  const resetToDefaults = useSetAtom(resetToDefaultsAtom);

  // Get current category
  const currentCategory = useMemo(() => {
    return getCategoryById(settingsState.activeCategory);
  }, [settingsState.activeCategory]);

  // Get current field index for navigation
  const currentFieldIndex = useMemo(() => {
    if (!currentCategory || !settingsState.activeField) return -1;
    return currentCategory.fields.findIndex(
      (f) => f.key === settingsState.activeField,
    );
  }, [currentCategory, settingsState.activeField]);

  // Category navigation
  const currentCategoryIndex = useMemo(() => {
    return SETTINGS_CATEGORIES.findIndex(
      (cat) => cat.id === settingsState.activeCategory,
    );
  }, [settingsState.activeCategory]);

  // Handle keyboard input
  const handleKeyInput = useCallback(
    (input: string, key: any) => {
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
        const nextIndex = key.shift
          ? (currentCategoryIndex - 1 + SETTINGS_CATEGORIES.length) %
            SETTINGS_CATEGORIES.length
          : (currentCategoryIndex + 1) % SETTINGS_CATEGORIES.length;
        const nextCategory = SETTINGS_CATEGORIES[nextIndex];
        if (nextCategory) {
          setActiveCategory(nextCategory.id);
        }
        return;
      }

      // Field navigation within category
      if (!currentCategory) return;

      if (key.downArrow || input === "j") {
        const nextIndex =
          (currentFieldIndex + 1) % currentCategory.fields.length;
        const nextField = currentCategory.fields[nextIndex];
        if (nextField) {
          setActiveField(nextField.key);
        }
      } else if (key.upArrow || input === "k") {
        const prevIndex =
          (currentFieldIndex - 1 + currentCategory.fields.length) %
          currentCategory.fields.length;
        const prevField = currentCategory.fields[prevIndex];
        if (prevField) {
          setActiveField(prevField.key);
        }
      } else if (key.return || input === "e") {
        // Start editing current field
        if (settingsState.activeField) {
          startEditing();
        }
      }
    },
    [
      settingsState.isEditing,
      settingsState.hasUnsavedChanges,
      settingsState.activeField,
      currentCategory,
      currentFieldIndex,
      currentCategoryIndex,
      closeSettings,
      setActiveCategory,
      setActiveField,
      startEditing,
      stopEditing,
      saveSettings,
      resetPreview,
      resetToDefaults,
    ],
  );

  useInput(handleKeyInput, { isActive: true });

  // Calculate layout dimensions
  const headerHeight = 4; // Header with title and tabs
  const footerHeight = settingsState.isEditing ? 3 : 4; // Footer changes based on editing state
  const contentHeight = Math.max(10, height - headerHeight - footerHeight); // Ensure minimum height

  return (
    <Box flexDirection="column" width={width} height={height}>
      {/* Header */}
      <SettingsHeader
        currentCategory={settingsState.activeCategory}
        hasUnsavedChanges={settingsState.hasUnsavedChanges}
        categories={SETTINGS_CATEGORIES}
      />

      {/* Main Content */}
      <Box flexGrow={1} height={contentHeight}>
        {currentCategory && (
          <SettingsCategory
            category={currentCategory}
            activeField={settingsState.activeField}
            isEditing={settingsState.isEditing}
            previewValues={settingsState.previewValues}
            height={contentHeight}
          />
        )}
      </Box>

      {/* Footer */}
      <SettingsFooter
        isEditing={settingsState.isEditing}
        hasUnsavedChanges={settingsState.hasUnsavedChanges}
      />
    </Box>
  );
}
