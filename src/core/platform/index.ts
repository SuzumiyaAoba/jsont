/**
 * Multi-platform service system exports
 * Provides unified platform abstraction for file system, clipboard, notifications, etc.
 */

// Core platform service interfaces and abstractions
export * from "./PlatformService";

// Platform-specific implementations
export * from "./TerminalPlatformService";
export * from "./WebPlatformService";

// Re-export key types for convenience
export type {
  FileSystemService,
  FileSystemResult,
  FileInfo,
  ClipboardService,
  ClipboardResult,
  NotificationService,
  NotificationOptions,
  NotificationResult,
  NotificationType,
  NotificationAction,
  ProcessService,
  StorageService,
  PlatformCapabilities,
} from "./PlatformService";

import {
  PlatformService,
  PlatformServiceManager,
  PlatformUtils,
} from "./PlatformService";

import {
  TerminalPlatformService,
  createTerminalPlatformService,
} from "./TerminalPlatformService";

import {
  WebPlatformService,
  createWebPlatformService,
} from "./WebPlatformService";

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
export function getPlatformService(): PlatformService {
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