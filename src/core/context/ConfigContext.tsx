/**
 * Configuration context for accessing loaded config throughout the application
 */

import { createContext, type ReactNode, useContext } from "react";
import type { JsontConfig } from "../config/index.js";
import { getConfigValue, loadConfig } from "../config/index.js";

interface ConfigContextType {
  config: JsontConfig;
}

const ConfigContext = createContext<ConfigContextType | null>(null);

interface ConfigProviderProps {
  children: ReactNode;
  config?: JsontConfig;
}

export function ConfigProvider({ children, config }: ConfigProviderProps) {
  const resolvedConfig = config ?? loadConfig();

  return (
    <ConfigContext.Provider value={{ config: resolvedConfig }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig(): JsontConfig {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return context.config;
}

/**
 * Hook to get specific configuration values
 */
export function useConfigValue<T>(path: string): T {
  const config = useConfig();
  return getConfigValue<T>(config, path);
}
