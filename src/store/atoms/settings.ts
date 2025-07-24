/**
 * Settings TUI state atoms
 */

import { SETTINGS_CATEGORIES } from "@features/settings/config/settingsDefinitions";
import type { SettingsState } from "@features/settings/types/settings";
import { atom } from "jotai";

// Settings TUI visibility
export const settingsVisibleAtom = atom<boolean>(false);

// Current settings state
export const settingsStateAtom = atom<SettingsState>({
  activeCategory: SETTINGS_CATEGORIES[0]?.id || "display",
  activeField: null,
  isEditing: false,
  hasUnsavedChanges: false,
  previewValues: {},
  originalValues: {},
});

// Settings actions
export const openSettingsAtom = atom(null, (_, set) => {
  set(settingsVisibleAtom, true);
  // Initialize with current config values - will be populated by component
  set(settingsStateAtom, (prev) => ({
    ...prev,
    activeCategory: SETTINGS_CATEGORIES[0]?.id || "display",
    activeField: SETTINGS_CATEGORIES[0]?.fields[0]?.key || null,
    isEditing: false,
    hasUnsavedChanges: false,
    previewValues: {},
    originalValues: {},
  }));
});

export const closeSettingsAtom = atom(null, (_, set) => {
  set(settingsVisibleAtom, false);
});

export const setActiveCategoryAtom = atom(
  null,
  (_, set, categoryId: string) => {
    // Find the category and set first field as active
    const category = SETTINGS_CATEGORIES.find(cat => cat.id === categoryId);
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

    console.log("✅ Settings saved successfully");
  } catch (error) {
    console.error("❌ Failed to save settings:", error);
    // TODO: Show error message in UI
  }
});
