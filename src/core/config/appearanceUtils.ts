/**
 * Utility functions for accessing appearance configuration
 */

import type { AppearanceConfig } from "./types.js";

export type BorderStyle = "single" | "double" | "round" | "classic";
export type ComponentType =
  | "mainContent"
  | "search"
  | "jq"
  | "help"
  | "debug"
  | "propertyDetails"
  | "export";

export type SettingsComponentType = "normal" | "editing";

/**
 * Get border style from appearance config
 */
export function getBorderStyle(appearance: AppearanceConfig): BorderStyle {
  return appearance.borders.style;
}

/**
 * Get border color for a specific component
 */
export function getBorderColor(
  appearance: AppearanceConfig,
  component: ComponentType,
): string {
  return appearance.borders.colors[component];
}

/**
 * Get border color for settings components
 */
export function getSettingsBorderColor(
  appearance: AppearanceConfig,
  type: SettingsComponentType,
): string {
  return appearance.borders.colors.settings[type];
}

/**
 * Get theme color by type
 */
export function getThemeColor(
  appearance: AppearanceConfig,
  colorType: keyof AppearanceConfig["colors"],
): string {
  if (colorType === "text") {
    return appearance.colors.text.primary;
  }
  return appearance.colors[colorType] as string;
}

/**
 * Get text color by type
 */
export function getTextColor(
  appearance: AppearanceConfig,
  textType: keyof AppearanceConfig["colors"]["text"],
): string {
  return appearance.colors.text[textType];
}

/**
 * Get component height
 */
export function getComponentHeight(
  appearance: AppearanceConfig,
  component: keyof AppearanceConfig["heights"],
): number {
  return appearance.heights[component];
}

/**
 * Get search bar height
 */
export function getSearchBarHeight(appearance: AppearanceConfig): number {
  return appearance.heights.searchBar;
}

/**
 * Get JQ input height
 */
export function getJqInputHeight(appearance: AppearanceConfig): number {
  return appearance.heights.jqInput;
}

/**
 * Get property details height
 */
export function getPropertyDetailsHeight(appearance: AppearanceConfig): number {
  return appearance.heights.propertyDetails;
}

/**
 * Get settings header height
 */
export function getSettingsHeaderHeight(appearance: AppearanceConfig): number {
  return appearance.heights.settingsHeader;
}
