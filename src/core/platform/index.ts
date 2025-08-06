/**
 * Multi-platform service system exports
 * Provides unified platform abstraction for file system, clipboard, notifications, etc.
 */

// Re-export key types for convenience
export type {
  ClipboardResult,
  ClipboardService,
  FileInfo,
  FileSystemResult,
  FileSystemService,
  NotificationAction,
  NotificationOptions,
  NotificationResult,
  NotificationService,
  NotificationType,
  PlatformCapabilities,
  ProcessService,
  StorageService,
} from "@core/platform/PlatformService";
// Core platform service interfaces and abstractions
export * from "@core/platform/PlatformService";
// Platform-specific implementations
export * from "@core/platform/TerminalPlatformService";
export * from "@core/platform/WebPlatformService";

import {
  PlatformService,
  PlatformServiceManager,
  PlatformUtils,
} from "@core/platform/PlatformService";
import {
  createTerminalPlatformService,
  TerminalPlatformService,
} from "@core/platform/TerminalPlatformService";
import {
  createWebPlatformService,
  WebPlatformService,
} from "@core/platform/WebPlatformService";
import type { Result } from "neverthrow";

// Export the classes and functions
export {
  PlatformService,
  PlatformServiceManager,
  PlatformUtils,
  TerminalPlatformService,
  createTerminalPlatformService,
  WebPlatformService,
  createWebPlatformService,
};

/**
 * Auto-detect and create appropriate platform service
 */
export function createPlatformService() {
  const platformType = PlatformUtils.detectPlatformType();

  switch (platformType) {
    case "terminal":
      return createTerminalPlatformService();
    case "web":
    case "mobile":
      return createWebPlatformService();
    case "desktop":
      // For now, use terminal service for desktop
      return createTerminalPlatformService();
    default:
      return createTerminalPlatformService();
  }
}

/**
 * Initialize platform service globally
 */
export async function initializePlatformService(service?: PlatformService) {
  const platformService = service || createPlatformService();
  const manager = PlatformServiceManager.getInstance();

  manager.setService(platformService);
  await manager.initialize();

  return platformService;
}

/**
 * Get the global platform service instance
 */
export function getPlatformService(): Result<PlatformService, Error> {
  const manager = PlatformServiceManager.getInstance();
  return manager.getService();
}

/**
 * Cleanup global platform service
 */
export async function cleanupPlatformService(): Promise<void> {
  const manager = PlatformServiceManager.getInstance();
  await manager.cleanup();
}

/**
 * Type guard to check if platform service is available
 */
export function hasPlatformService(): boolean {
  const manager = PlatformServiceManager.getInstance();
  return manager.hasService();
}
