/**
 * Platform service usage examples
 * Demonstrates how to use the unified platform abstraction
 */

import type { PlatformService } from "../PlatformService";
import { 
  createPlatformService, 
  initializePlatformService
} from "../index";

/**
 * Example: File operations across platforms
 */
export class FileOperationsExample {
  private platformService: PlatformService;

  constructor(platformService: PlatformService) {
    this.platformService = platformService;
  }

  /**
   * Save JSON data to file (works on both terminal and web)
   */
  async saveJsonFile(data: any, filename = "data.json"): Promise<boolean> {
    const fileSystem = this.platformService.getFileSystem();
    const jsonContent = JSON.stringify(data, null, 2);

    const result = await fileSystem.writeFile(filename, jsonContent);
    if (result.success) {
      console.log(`✅ Successfully saved ${filename}`);
      return true;
    } else {
      console.error(`❌ Failed to save ${filename}: ${result.error}`);
      return false;
    }
  }

  /**
   * Load JSON data from file
   */
  async loadJsonFile(filename: string): Promise<any | null> {
    const fileSystem = this.platformService.getFileSystem();

    const result = await fileSystem.readFile(filename);
    if (result.success && result.data) {
      try {
        return JSON.parse(result.data);
      } catch (error) {
        console.error(`❌ Invalid JSON in ${filename}: ${error}`);
        return null;
      }
    } else {
      console.error(`❌ Failed to load ${filename}: ${result.error}`);
      return null;
    }
  }

  /**
   * List directory contents (terminal only)
   */
  async listDirectory(path = "."): Promise<string[]> {
    const fileSystem = this.platformService.getFileSystem();

    const result = await fileSystem.readDir(path);
    if (result.success && result.data) {
      return result.data.map(info => info.name);
    } else {
      console.log(`ℹ️  Directory listing not available: ${result.error}`);
      return [];
    }
  }

  /**
   * Check platform capabilities
   */
  checkCapabilities(): void {
    const capabilities = this.platformService.getCapabilities();
    console.log("Platform Capabilities:");
    console.log(`  Type: ${capabilities.type}`);
    console.log(`  File System: ${capabilities.hasFileSystem ? "✅" : "❌"}`);
    console.log(`  Clipboard: ${capabilities.hasClipboard ? "✅" : "❌"}`);
    console.log(`  Notifications: ${capabilities.hasNotifications ? "✅" : "❌"}`);
    console.log(`  Storage: ${capabilities.hasStorage ? "✅" : "❌"}`);
  }
}

/**
 * Example: Clipboard operations
 */
export class ClipboardExample {
  private platformService: PlatformService;

  constructor(platformService: PlatformService) {
    this.platformService = platformService;
  }

  /**
   * Copy JSON data to clipboard
   */
  async copyToClipboard(data: any): Promise<boolean> {
    if (!this.platformService.hasCapability("hasClipboard")) {
      console.log("ℹ️  Clipboard not supported on this platform");
      return false;
    }

    const clipboard = this.platformService.getClipboard();
    const jsonString = JSON.stringify(data, null, 2);

    const result = await clipboard.writeText(jsonString);
    if (result.success) {
      console.log("✅ Copied to clipboard");
      return true;
    } else {
      console.error(`❌ Failed to copy: ${result.error}`);
      return false;
    }
  }

  /**
   * Paste JSON data from clipboard
   */
  async pasteFromClipboard(): Promise<any | null> {
    if (!this.platformService.hasCapability("hasClipboard")) {
      console.log("ℹ️  Clipboard not supported on this platform");
      return null;
    }

    const clipboard = this.platformService.getClipboard();
    const result = await clipboard.readText();

    if (result.success && result.data) {
      try {
        return JSON.parse(result.data);
      } catch (error) {
        console.log("ℹ️  Clipboard content is not valid JSON");
        return result.data; // Return as string
      }
    } else {
      console.error(`❌ Failed to read clipboard: ${result.error}`);
      return null;
    }
  }
}

/**
 * Example: Notification system
 */
export class NotificationExample {
  private platformService: PlatformService;

  constructor(platformService: PlatformService) {
    this.platformService = platformService;
  }

  /**
   * Show success notification
   */
  async showSuccess(message: string, title = "Success"): Promise<void> {
    if (!this.platformService.hasCapability("hasNotifications")) {
      console.log(`✅ ${title}: ${message}`);
      return;
    }

    const notifications = this.platformService.getNotifications();
    await notifications.show({
      type: "success",
      title,
      message,
      duration: 3000,
    });
  }

  /**
   * Show error notification
   */
  async showError(message: string, title = "Error"): Promise<void> {
    if (!this.platformService.hasCapability("hasNotifications")) {
      console.error(`❌ ${title}: ${message}`);
      return;
    }

    const notifications = this.platformService.getNotifications();
    await notifications.show({
      type: "error",
      title,
      message,
      duration: 5000,
    });
  }

  /**
   * Show info notification
   */
  async showInfo(message: string, title = "Info"): Promise<void> {
    if (!this.platformService.hasCapability("hasNotifications")) {
      console.log(`ℹ️  ${title}: ${message}`);
      return;
    }

    const notifications = this.platformService.getNotifications();
    await notifications.show({
      type: "info",
      title,
      message,
      duration: 3000,
    });
  }
}

/**
 * Example: Storage operations
 */
export class StorageExample {
  private platformService: PlatformService;

  constructor(platformService: PlatformService) {
    this.platformService = platformService;
  }

  /**
   * Save user preferences
   */
  async savePreferences(preferences: any): Promise<boolean> {
    if (!this.platformService.hasCapability("hasStorage")) {
      console.log("ℹ️  Storage not available on this platform");
      return false;
    }

    const storage = this.platformService.getStorage();
    try {
      await storage.setItem("user-preferences", JSON.stringify(preferences));
      console.log("✅ Preferences saved");
      return true;
    } catch (error) {
      console.error(`❌ Failed to save preferences: ${error}`);
      return false;
    }
  }

  /**
   * Load user preferences
   */
  async loadPreferences(): Promise<any | null> {
    if (!this.platformService.hasCapability("hasStorage")) {
      console.log("ℹ️  Storage not available on this platform");
      return null;
    }

    const storage = this.platformService.getStorage();
    try {
      const data = await storage.getItem("user-preferences");
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error(`❌ Failed to load preferences: ${error}`);
      return null;
    }
  }

  /**
   * Clear all storage
   */
  async clearStorage(): Promise<void> {
    if (!this.platformService.hasCapability("hasStorage")) {
      console.log("ℹ️  Storage not available on this platform");
      return;
    }

    const storage = this.platformService.getStorage();
    try {
      await storage.clear();
      console.log("✅ Storage cleared");
    } catch (error) {
      console.error(`❌ Failed to clear storage: ${error}`);
    }
  }
}

/**
 * Complete example demonstrating platform-agnostic JSON viewer
 */
export class JsonViewerPlatformExample {
  private fileOps: FileOperationsExample;
  private clipboard: ClipboardExample;
  private notifications: NotificationExample;
  private storage: StorageExample;

  constructor(platformService: PlatformService) {
    this.fileOps = new FileOperationsExample(platformService);
    this.clipboard = new ClipboardExample(platformService);
    this.notifications = new NotificationExample(platformService);
    this.storage = new StorageExample(platformService);
  }

  /**
   * Process JSON data with platform-specific operations
   */
  async processJsonData(data: any): Promise<void> {
    console.log("Processing JSON data...");

    // Check platform capabilities
    this.fileOps.checkCapabilities();

    // Save to storage
    await this.storage.savePreferences({ lastProcessed: new Date().toISOString() });

    // Copy to clipboard
    const copied = await this.clipboard.copyToClipboard(data);
    if (copied) {
      await this.notifications.showSuccess("JSON data copied to clipboard");
    }

    // Save to file
    const saved = await this.fileOps.saveJsonFile(data, "processed-data.json");
    if (saved) {
      await this.notifications.showSuccess("JSON data saved to file");
    } else {
      await this.notifications.showError("Failed to save JSON data");
    }

    console.log("✅ JSON processing complete");
  }

  /**
   * Load and process JSON from various sources
   */
  async loadAndProcess(): Promise<void> {
    console.log("Loading JSON data...");

    // Try to load from clipboard first
    const clipboardData = await this.clipboard.pasteFromClipboard();
    if (clipboardData) {
      console.log("📋 Loaded data from clipboard");
      await this.processJsonData(clipboardData);
      return;
    }

    // Try to load from file
    const fileData = await this.fileOps.loadJsonFile("data.json");
    if (fileData) {
      console.log("📁 Loaded data from file");
      await this.processJsonData(fileData);
      return;
    }

    // Use sample data
    const sampleData = {
      message: "Hello from jsont!",
      platform: process?.platform || "web",
      timestamp: new Date().toISOString(),
      features: ["JSON viewing", "Multi-platform support", "Platform abstraction"],
    };

    console.log("📝 Using sample data");
    await this.processJsonData(sampleData);
  }
}

/**
 * Usage example
 */
export async function runPlatformServiceExamples(): Promise<void> {
  console.log("🚀 Starting platform service examples...");

  // Initialize platform service
  const platformService = await initializePlatformService();
  console.log(`Platform detected: ${platformService.getCapabilities().type}`);

  // Create example instances
  const jsonViewer = new JsonViewerPlatformExample(platformService);

  // Run the example
  await jsonViewer.loadAndProcess();

  console.log("✅ Platform service examples completed");
}

/**
 * Minimal usage example for quick start
 */
export async function quickStartExample(): Promise<void> {
  // Auto-detect platform and create service
  const platformService = createPlatformService();
  await platformService.initialize();

  // Use clipboard (if available)
  if (platformService.hasCapability("hasClipboard")) {
    const clipboard = platformService.getClipboard();
    await clipboard.writeText("Hello from jsont!");
    console.log("Copied to clipboard!");
  }

  // Use notifications (if available)
  if (platformService.hasCapability("hasNotifications")) {
    const notifications = platformService.getNotifications();
    await notifications.show({
      type: "info",
      message: "jsont platform service is working!",
      duration: 2000,
    });
  }

  // Use storage (always available)
  const storage = platformService.getStorage();
  await storage.setItem("test", "Platform service working!");
  const value = await storage.getItem("test");
  console.log(`Stored value: ${value}`);

  await platformService.cleanup();
}