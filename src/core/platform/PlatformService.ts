/**
 * Multi-platform service abstraction
 * Provides unified interfaces for platform-specific operations
 */

/**
 * File system operation result
 */
// biome-ignore lint/suspicious/noExplicitAny: Generic result type
export interface FileSystemResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

/**
 * File information metadata
 */
export interface FileInfo {
  name: string;
  path: string;
  size: number;
  isDirectory: boolean;
  isFile: boolean;
  lastModified: Date;
  permissions?: {
    readable: boolean;
    writable: boolean;
    executable: boolean;
  };
}

/**
 * File system operations interface
 */
export interface FileSystemService {
  /**
   * Read file contents as text
   */
  readFile(path: string): Promise<FileSystemResult<string>>;

  /**
   * Write text content to file
   */
  writeFile(path: string, content: string): Promise<FileSystemResult<void>>;

  /**
   * Check if file or directory exists
   */
  exists(path: string): Promise<FileSystemResult<boolean>>;

  /**
   * Get file or directory information
   */
  stat(path: string): Promise<FileSystemResult<FileInfo>>;

  /**
   * List directory contents
   */
  readDir(path: string): Promise<FileSystemResult<FileInfo[]>>;

  /**
   * Create directory (recursive)
   */
  mkdir(path: string, recursive?: boolean): Promise<FileSystemResult<void>>;

  /**
   * Delete file or directory
   */
  remove(path: string, recursive?: boolean): Promise<FileSystemResult<void>>;

  /**
   * Copy file or directory
   */
  copy(source: string, destination: string): Promise<FileSystemResult<void>>;

  /**
   * Move/rename file or directory
   */
  move(source: string, destination: string): Promise<FileSystemResult<void>>;

  /**
   * Get current working directory
   */
  getCwd(): Promise<FileSystemResult<string>>;

  /**
   * Change current working directory
   */
  setCwd(path: string): Promise<FileSystemResult<void>>;

  /**
   * Join path segments
   */
  joinPath(...segments: string[]): string;

  /**
   * Resolve absolute path
   */
  resolvePath(path: string): string;

  /**
   * Get path dirname
   */
  dirname(path: string): string;

  /**
   * Get path basename
   */
  basename(path: string, ext?: string): string;

  /**
   * Get path extension
   */
  extname(path: string): string;
}

/**
 * Clipboard operation result
 */
// biome-ignore lint/suspicious/noExplicitAny: Generic result type
export interface ClipboardResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Clipboard operations interface
 */
export interface ClipboardService {
  /**
   * Read text from clipboard
   */
  readText(): Promise<ClipboardResult<string>>;

  /**
   * Write text to clipboard
   */
  writeText(text: string): Promise<ClipboardResult<void>>;

  /**
   * Check if clipboard operations are supported
   */
  isSupported(): boolean;

  /**
   * Clear clipboard contents
   */
  clear(): Promise<ClipboardResult<void>>;
}

/**
 * Notification types
 */
export type NotificationType = "info" | "success" | "warning" | "error";

/**
 * Notification options
 */
export interface NotificationOptions {
  title?: string;
  message: string;
  type: NotificationType;
  duration?: number; // milliseconds, 0 for persistent
  actions?: NotificationAction[];
  icon?: string;
  tag?: string; // for grouping/replacing notifications
}

/**
 * Notification action
 */
export interface NotificationAction {
  label: string;
  action: string;
  primary?: boolean;
}

/**
 * Notification result
 */
export interface NotificationResult {
  success: boolean;
  notificationId?: string;
  error?: string;
}

/**
 * Notification service interface
 */
export interface NotificationService {
  /**
   * Show a notification
   */
  show(options: NotificationOptions): Promise<NotificationResult>;

  /**
   * Dismiss a notification by ID
   */
  dismiss(notificationId: string): Promise<NotificationResult>;

  /**
   * Dismiss all notifications
   */
  dismissAll(): Promise<NotificationResult>;

  /**
   * Check if notifications are supported
   */
  isSupported(): boolean;

  /**
   * Request notification permission (web only)
   */
  requestPermission?(): Promise<boolean>;
}

/**
 * Process operations interface
 */
export interface ProcessService {
  /**
   * Get process environment variables
   */
  getEnv(key?: string): string | Record<string, string | undefined>;

  /**
   * Set process environment variable
   */
  setEnv(key: string, value: string): void;

  /**
   * Get process platform
   */
  getPlatform(): string;

  /**
   * Get process architecture
   */
  getArch(): string;

  /**
   * Get process version
   */
  getVersion(): string;

  /**
   * Exit process with code
   */
  exit(code?: number): void;

  /**
   * Get command line arguments
   */
  getArgs(): string[];

  /**
   * Get process ID
   */
  getPid(): number;

  /**
   * Check if running in TTY
   */
  isTTY(): boolean;
}

/**
 * Storage operations interface
 */
export interface StorageService {
  /**
   * Get item from storage
   */
  getItem(key: string): Promise<string | null>;

  /**
   * Set item in storage
   */
  setItem(key: string, value: string): Promise<void>;

  /**
   * Remove item from storage
   */
  removeItem(key: string): Promise<void>;

  /**
   * Clear all storage
   */
  clear(): Promise<void>;

  /**
   * Get all storage keys
   */
  keys(): Promise<string[]>;

  /**
   * Get storage size in bytes
   */
  getSize(): Promise<number>;
}

/**
 * Platform capabilities
 */
export interface PlatformCapabilities {
  /** Platform type */
  type: "terminal" | "web" | "desktop" | "mobile";
  /** File system access */
  hasFileSystem: boolean;
  /** Clipboard access */
  hasClipboard: boolean;
  /** Notification support */
  hasNotifications: boolean;
  /** Process control */
  hasProcessControl: boolean;
  /** Local storage */
  hasStorage: boolean;
  /** Network access */
  hasNetwork: boolean;
  /** Multi-threading support */
  hasWorkers: boolean;
}

/**
 * Abstract platform service providing unified access to platform-specific operations
 */
export abstract class PlatformService {
  protected capabilities: PlatformCapabilities;

  constructor(capabilities: PlatformCapabilities) {
    this.capabilities = capabilities;
  }

  /**
   * Get platform capabilities
   */
  getCapabilities(): PlatformCapabilities {
    return { ...this.capabilities };
  }

  /**
   * Check if a specific capability is supported
   */
  hasCapability(capability: keyof Omit<PlatformCapabilities, "type">): boolean {
    return this.capabilities[capability];
  }

  /**
   * Get file system service
   */
  abstract getFileSystem(): FileSystemService;

  /**
   * Get clipboard service
   */
  abstract getClipboard(): ClipboardService;

  /**
   * Get notification service
   */
  abstract getNotifications(): NotificationService;

  /**
   * Get process service
   */
  abstract getProcess(): ProcessService;

  /**
   * Get storage service
   */
  abstract getStorage(): StorageService;

  /**
   * Initialize platform service
   */
  abstract initialize(): Promise<void>;

  /**
   * Cleanup platform service
   */
  abstract cleanup(): Promise<void>;

  /**
   * Create a safe error result
   */
  // biome-ignore lint/suspicious/noExplicitAny: Generic error result type
  protected createErrorResult<T = any>(
    error: string,
    errorCode?: string,
  ): FileSystemResult<T> {
    const result: FileSystemResult<T> = {
      success: false,
      error,
    };
    if (errorCode !== undefined) {
      result.errorCode = errorCode;
    }
    return result;
  }

  /**
   * Create a success result
   */
  // biome-ignore lint/suspicious/noExplicitAny: Generic success result type
  protected createSuccessResult<T = any>(data?: T): FileSystemResult<T> {
    const result: FileSystemResult<T> = {
      success: true,
    };
    if (data !== undefined) {
      result.data = data;
    }
    return result;
  }
}

/**
 * Platform service manager
 */
export class PlatformServiceManager {
  private static instance: PlatformServiceManager;
  private currentService: PlatformService | null = null;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): PlatformServiceManager {
    if (!PlatformServiceManager.instance) {
      PlatformServiceManager.instance = new PlatformServiceManager();
    }
    return PlatformServiceManager.instance;
  }

  /**
   * Set the current platform service
   */
  setService(service: PlatformService): void {
    this.currentService = service;
  }

  /**
   * Get the current platform service
   */
  getService(): PlatformService {
    if (!this.currentService) {
      throw new Error(
        "No platform service has been set. Call setService() first.",
      );
    }
    return this.currentService;
  }

  /**
   * Initialize the current service
   */
  async initialize(): Promise<void> {
    if (this.currentService) {
      await this.currentService.initialize();
    }
  }

  /**
   * Cleanup the current service
   */
  async cleanup(): Promise<void> {
    if (this.currentService) {
      await this.currentService.cleanup();
      this.currentService = null;
    }
  }

  /**
   * Check if a service is set
   */
  hasService(): boolean {
    return this.currentService !== null;
  }

  /**
   * Get platform capabilities
   */
  getCapabilities(): PlatformCapabilities | null {
    return this.currentService?.getCapabilities() || null;
  }
}

/**
 * Utility functions for platform operations
 */
// biome-ignore lint/complexity/noStaticOnlyClass: Utility class pattern for platform operations
export class PlatformUtils {
  /**
   * Detect current platform type
   */
  static detectPlatformType(): PlatformCapabilities["type"] {
    if (typeof window !== "undefined") {
      // Web environment
      if (
        typeof window.orientation !== "undefined" ||
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        )
      ) {
        return "mobile";
      }
      return "web";
    }

    if (typeof process !== "undefined") {
      // Node.js environment
      return "terminal";
    }

    // Fallback
    return "terminal";
  }

  /**
   * Create default capabilities for a platform type
   */
  static createDefaultCapabilities(
    type: PlatformCapabilities["type"],
  ): PlatformCapabilities {
    switch (type) {
      case "terminal":
        return {
          type,
          hasFileSystem: true,
          hasClipboard: false, // Limited clipboard support in terminal
          hasNotifications: false, // No GUI notifications
          hasProcessControl: true,
          hasStorage: true, // File-based storage
          hasNetwork: true,
          hasWorkers: true, // Worker threads in Node.js
        };

      case "web":
        return {
          type,
          hasFileSystem: false, // Limited file system access
          hasClipboard: true,
          hasNotifications: true,
          hasProcessControl: false,
          hasStorage: true, // localStorage/sessionStorage
          hasNetwork: true,
          hasWorkers: true, // Web Workers
        };

      case "desktop":
        return {
          type,
          hasFileSystem: true,
          hasClipboard: true,
          hasNotifications: true,
          hasProcessControl: true,
          hasStorage: true,
          hasNetwork: true,
          hasWorkers: true,
        };

      case "mobile":
        return {
          type,
          hasFileSystem: false, // Limited file access
          hasClipboard: true,
          hasNotifications: true,
          hasProcessControl: false,
          hasStorage: true,
          hasNetwork: true,
          hasWorkers: true,
        };

      default:
        return {
          type: "terminal",
          hasFileSystem: false,
          hasClipboard: false,
          hasNotifications: false,
          hasProcessControl: false,
          hasStorage: false,
          hasNetwork: false,
          hasWorkers: false,
        };
    }
  }
}
