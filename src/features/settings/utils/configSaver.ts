/**
 * Configuration saving utilities
 */

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import yaml from "js-yaml";
import { flatToNestedConfig } from "./configMapper";

/**
 * Get the path to the user's config file
 */
export function getConfigPath(): string {
  const configDir = path.join(os.homedir(), ".config", "jsont");
  return path.join(configDir, "config.yaml");
}

/**
 * Ensure config directory exists
 */
async function ensureConfigDir(): Promise<void> {
  const configDir = path.dirname(getConfigPath());
  try {
    await fs.access(configDir);
  } catch {
    await fs.mkdir(configDir, { recursive: true });
  }
}

/**
 * Save settings to config file
 */
export async function saveConfigToFile(
  settings: Record<string, unknown>,
): Promise<void> {
  try {
    await ensureConfigDir();

    const nestedConfig = flatToNestedConfig(settings);
    const yamlContent = yaml.dump(nestedConfig, {
      indent: 2,
      quotingType: '"',
      forceQuotes: false,
    });

    const configPath = getConfigPath();
    await fs.writeFile(configPath, yamlContent, "utf8");

    // Settings saved successfully
  } catch (error) {
    // TODO: Show error message in UI
    if (process.env["NODE_ENV"] === "development") {
      console.error("Failed to save settings:", error);
    }
    throw error;
  }
}

/**
 * Create a backup of the current config file
 */
export async function backupConfigFile(): Promise<string> {
  const configPath = getConfigPath();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = `${configPath}.backup-${timestamp}`;

  try {
    await fs.copyFile(configPath, backupPath);
    return backupPath;
  } catch (error) {
    // If original doesn't exist, that's OK
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") {
      return "";
    }
    throw error;
  }
}
