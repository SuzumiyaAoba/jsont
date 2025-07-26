/**
 * Settings TUI state atoms
 */

import { SETTINGS_CATEGORIES } from "@features/settings/config/settingsDefinitions";
import type { SettingsState } from "@features/settings/types/settings";
import { atom } from "jotai";

// Debounce state for navigation updates
let navigationTimeout: NodeJS.Timeout | null = null;
const NAVIGATION_DEBOUNCE_MS = 50;

// Settings TUI visibility
export const settingsVisibleAtom = atom<boolean>(false);

// Current settings state - ensure we start with the very first field
export const settingsStateAtom = atom<SettingsState>({
  activeCategory: "interface", // Start with interface category
  activeField: "display.interface.showLineNumbers", // Hard-code the first field
  isEditing: false,
  hasUnsavedChanges: false,
  previewValues: {},
  originalValues: {},
});

// Settings actions
export const openSettingsAtom = atom(null, (_, set) => {
  set(settingsVisibleAtom, true);
  // Force reset to the very first field every time
  set(settingsStateAtom, (prev) => ({
    ...prev,
    activeCategory: "interface",
    activeField: "display.interface.showLineNumbers", // Always start with the first field
    isEditing: false,
    hasUnsavedChanges: false,
    // Keep existing preview values if any
    previewValues: prev.previewValues || {},
    originalValues: prev.originalValues || {},
  }));
});

export const closeSettingsAtom = atom(null, (_, set) => {
  set(settingsVisibleAtom, false);
});

export const setActiveCategoryAtom = atom(
  null,
  (_, set, categoryId: string) => {
    // Find the category and set first field as active
    const category = SETTINGS_CATEGORIES.find((cat) => cat.id === categoryId);
    const firstFieldKey = category?.fields[0]?.key || null;

    set(settingsStateAtom, (prev) => ({
      ...prev,
      activeCategory: categoryId,
      activeField: firstFieldKey,
      isEditing: false,
    }));
  },
);

export const setActiveFieldAtom = atom(
  null,
  (_, set, fieldKey: string | null) => {
    set(settingsStateAtom, (prev) => ({
      ...prev,
      activeField: fieldKey,
      isEditing: false,
    }));
  },
);

// Debounced navigation update to prevent flickering
export const debouncedNavigationUpdateAtom = atom(
  null,
  (
    _,
    set,
    update: { categoryId?: string; fieldKey?: string; isEditing?: boolean },
  ) => {
    // Clear any pending navigation updates
    if (navigationTimeout) {
      clearTimeout(navigationTimeout);
    }

    // For immediate updates (editing state changes), apply directly
    if (update.isEditing !== undefined) {
      set(settingsStateAtom, (prev) => ({
        ...prev,
        isEditing: Boolean(update.isEditing),
      }));
      return;
    }

    // Debounce navigation updates to prevent rapid state changes
    navigationTimeout = setTimeout(() => {
      set(settingsStateAtom, (prev) => {
        const newState = { ...prev };

        if (update.categoryId !== undefined) {
          newState.activeCategory = update.categoryId;
          // Auto-select first field when changing category
          const category = SETTINGS_CATEGORIES.find(
            (cat) => cat.id === update.categoryId,
          );
          if (category && category.fields.length > 0) {
            newState.activeField = category.fields[0]?.key || null;
          }
          newState.isEditing = false;
        }

        if (update.fieldKey !== undefined) {
          newState.activeField = update.fieldKey;
          newState.isEditing = false;
        }

        return newState;
      });
    }, NAVIGATION_DEBOUNCE_MS);
  },
);

// Immediate batch navigation update for cases where debouncing is not desired
export const batchNavigationUpdateAtom = atom(
  null,
  (
    _,
    set,
    update: { categoryId?: string; fieldKey?: string; isEditing?: boolean },
  ) => {
    set(settingsStateAtom, (prev) => {
      const newState = { ...prev };

      if (update.categoryId !== undefined) {
        newState.activeCategory = update.categoryId;
        // Auto-select first field when changing category
        const category = SETTINGS_CATEGORIES.find(
          (cat) => cat.id === update.categoryId,
        );
        if (category && category.fields.length > 0) {
          newState.activeField = category.fields[0]?.key || null;
        }
      }

      if (update.fieldKey !== undefined) {
        newState.activeField = update.fieldKey;
      }

      if (update.isEditing !== undefined) {
        newState.isEditing = update.isEditing;
      } else {
        newState.isEditing = false;
      }

      return newState;
    });
  },
);

export const startEditingAtom = atom(null, (_, set) => {
  set(settingsStateAtom, (prev) => ({
    ...prev,
    isEditing: true,
  }));
});

export const stopEditingAtom = atom(null, (_, set) => {
  set(settingsStateAtom, (prev) => ({
    ...prev,
    isEditing: false,
  }));
});

export const updatePreviewValueAtom = atom(
  null,
  (_, set, { key, value }: { key: string; value: unknown }) => {
    set(settingsStateAtom, (prev) => ({
      ...prev,
      previewValues: {
        ...prev.previewValues,
        [key]: value,
      },
      hasUnsavedChanges: true,
    }));
  },
);

export const resetPreviewValuesAtom = atom(null, (_, set) => {
  set(settingsStateAtom, (prev) => ({
    ...prev,
    previewValues: { ...prev.originalValues },
    hasUnsavedChanges: false,
  }));
});

export const resetToDefaultsAtom = atom(null, (_, set) => {
  // Import default values from settings definitions
  const {
    SETTINGS_CATEGORIES,
  } = require("@features/settings/config/settingsDefinitions");
  const defaultValues: Record<string, unknown> = {};

  for (const category of SETTINGS_CATEGORIES) {
    for (const field of category.fields) {
      defaultValues[field.key] = field.defaultValue;
    }
  }

  set(settingsStateAtom, (prev) => ({
    ...prev,
    previewValues: defaultValues,
    hasUnsavedChanges: true,
  }));
});

export const saveSettingsAtom = atom(null, async (get, set) => {
  const state = get(settingsStateAtom);

  try {
    // Import dynamically to avoid issues with Node.js modules in browser
    const { saveConfigToFile } = await import(
      "@features/settings/utils/configSaver"
    );
    await saveConfigToFile(state.previewValues);

    set(settingsStateAtom, (prev) => ({
      ...prev,
      originalValues: { ...prev.previewValues },
      hasUnsavedChanges: false,
    }));

    // Show success notification
    const { showNotificationAtom } = await import("./ui");
    set(showNotificationAtom, {
      type: "success",
      message: "Settings saved successfully to config file",
      duration: 3000,
    });
  } catch (error) {
    // Show error notification in UI
    const { showNotificationAtom } = await import("./ui");
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    set(showNotificationAtom, {
      type: "error",
      message: `Failed to save settings: ${errorMessage}`,
    });

    if (process.env["NODE_ENV"] === "development") {
      console.error("Failed to save settings:", error);
    }
    throw error;
  }
});
