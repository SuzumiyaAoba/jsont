/**
 * Web platform service implementation
 * Provides browser-specific implementations for platform operations
 */

import type {
  ClipboardResult,
  ClipboardService,
  FileInfo,
  FileSystemResult,
  FileSystemService,
  NotificationOptions,
  NotificationResult,
  NotificationService,
  ProcessService,
  StorageService,
} from "./PlatformService";
import { PlatformService, PlatformUtils } from "./PlatformService";

/**
 * Web file system service implementation
 * Limited file system access in browsers - uses File System Access API where available
 */
class WebFileSystemService implements FileSystemService {
  private supportsFileSystemAccess = "showOpenFilePicker" in window;

  async readFile(_path: string): Promise<FileSystemResult<string>> {
    if (this.supportsFileSystemAccess) {
      try {
        // Use File System Access API if available
        const [fileHandle] = await (window as any).showOpenFilePicker({
          types: [
            {
              description: "Text files",
              accept: { "text/*": [".txt", ".json", ".yaml", ".yml", ".md"] },
            },
          ],
        });
        const file = await fileHandle.getFile();
        const content = await file.text();
        return { success: true, data: content };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to read file",
          errorCode: "FILE_ACCESS_DENIED",
        };
      }
    }

    return {
      success: false,
      error: "File system access not supported in this browser",
      errorCode: "NOT_SUPPORTED",
    };
  }

  async writeFile(
    _path: string,
    content: string,
  ): Promise<FileSystemResult<void>> {
    if (this.supportsFileSystemAccess) {
      try {
        // Use File System Access API if available
        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: _path.split("/").pop() || "file.txt",
          types: [
            {
              description: "Text files",
              accept: { "text/*": [".txt", ".json", ".yaml", ".yml", ".md"] },
            },
          ],
        });
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to write file",
          errorCode: "FILE_ACCESS_DENIED",
        };
      }
    }

    // Fallback: trigger download
    try {
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = _path.split("/").pop() || "file.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to download file",
        errorCode: "DOWNLOAD_FAILED",
      };
    }
  }

  async exists(_path: string): Promise<FileSystemResult<boolean>> {
    // Browser can't check arbitrary file existence
    return {
      success: false,
      error: "File existence check not supported in browser",
      errorCode: "NOT_SUPPORTED",
    };
  }

  async stat(_path: string): Promise<FileSystemResult<FileInfo>> {
    return {
      success: false,
      error: "File stat not supported in browser",
      errorCode: "NOT_SUPPORTED",
    };
  }

  async readDir(path: string): Promise<FileSystemResult<FileInfo[]>> {
    if (this.supportsFileSystemAccess) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker();
        const entries: FileInfo[] = [];

        for await (const [name, handle] of dirHandle.entries()) {
          const isFile = handle.kind === "file";
          const fileInfo: FileInfo = {
            name,
            path: `${path}/${name}`,
            size: isFile ? (await handle.getFile()).size : 0,
            isDirectory: !isFile,
            isFile,
            lastModified: isFile
              ? new Date((await handle.getFile()).lastModified)
              : new Date(),
            permissions: {
              readable: true,
              writable: false, // Simplified
              executable: false,
            },
          };
          entries.push(fileInfo);
        }

        return { success: true, data: entries };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to read directory",
          errorCode: "DIRECTORY_ACCESS_DENIED",
        };
      }
    }

    return {
      success: false,
      error: "Directory reading not supported in this browser",
      errorCode: "NOT_SUPPORTED",
    };
  }

  async mkdir(
    _path: string,
    _recursive?: boolean,
  ): Promise<FileSystemResult<void>> {
    return {
      success: false,
      error: "Directory creation not supported in browser",
      errorCode: "NOT_SUPPORTED",
    };
  }

  async remove(
    _path: string,
    _recursive?: boolean,
  ): Promise<FileSystemResult<void>> {
    return {
      success: false,
      error: "File deletion not supported in browser",
      errorCode: "NOT_SUPPORTED",
    };
  }

  async copy(
    _source: string,
    _destination: string,
  ): Promise<FileSystemResult<void>> {
    return {
      success: false,
      error: "File copying not supported in browser",
      errorCode: "NOT_SUPPORTED",
    };
  }

  async move(
    _source: string,
    _destination: string,
  ): Promise<FileSystemResult<void>> {
    return {
      success: false,
      error: "File moving not supported in browser",
      errorCode: "NOT_SUPPORTED",
    };
  }

  async getCwd(): Promise<FileSystemResult<string>> {
    // Return a virtual current directory
    return { success: true, data: "/" };
  }

  async setCwd(_path: string): Promise<FileSystemResult<void>> {
    return {
      success: false,
      error: "Changing directory not supported in browser",
      errorCode: "NOT_SUPPORTED",
    };
  }

  joinPath(...segments: string[]): string {
    return segments.join("/").replace(/\/+/g, "/");
  }

  resolvePath(path: string): string {
    // Simplified path resolution for web
    return path.startsWith("/") ? path : `/${path}`;
  }

  dirname(path: string): string {
    const parts = path.split("/");
    return parts.slice(0, -1).join("/") || "/";
  }

  basename(path: string, ext?: string): string {
    const base = path.split("/").pop() || "";
    if (ext && base.endsWith(ext)) {
      return base.slice(0, -ext.length);
    }
    return base;
  }

  extname(path: string): string {
    const base = path.split("/").pop() || "";
    const dotIndex = base.lastIndexOf(".");
    return dotIndex > 0 ? base.slice(dotIndex) : "";
  }
}

/**
 * Web clipboard service implementation
 */
class WebClipboardService implements ClipboardService {
  async readText(): Promise<ClipboardResult<string>> {
    if (!navigator.clipboard) {
      return {
        success: false,
        error: "Clipboard API not supported",
      };
    }

    try {
      const text = await navigator.clipboard.readText();
      return { success: true, data: text };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to read clipboard",
      };
    }
  }

  async writeText(text: string): Promise<ClipboardResult<void>> {
    if (!navigator.clipboard) {
      // Fallback to execCommand
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to copy to clipboard",
        };
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to write to clipboard",
      };
    }
  }

  isSupported(): boolean {
    return !!(navigator.clipboard || document.execCommand);
  }

  async clear(): Promise<ClipboardResult<void>> {
    return this.writeText("");
  }
}

/**
 * Web notification service implementation
 */
class WebNotificationService implements NotificationService {
  private activeNotifications = new Map<string, Notification>();

  async show(options: NotificationOptions): Promise<NotificationResult> {
    if (!("Notification" in window)) {
      return {
        success: false,
        error: "Notifications not supported in this browser",
      };
    }

    // Request permission if needed
    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        return {
          success: false,
          error: "Notification permission denied",
        };
      }
    }

    if (Notification.permission !== "granted") {
      return {
        success: false,
        error: "Notification permission not granted",
      };
    }

    const notificationId =
      options.tag || `notification-${++this.notificationCounter}`;

    try {
      const notificationOptions: any = {
        body: options.message,
      };

      if (options.icon !== undefined) {
        notificationOptions.icon = options.icon;
      }

      if (options.tag !== undefined) {
        notificationOptions.tag = options.tag;
      }

      const notification = new Notification(
        options.title || "jsont",
        notificationOptions,
      );

      this.activeNotifications.set(notificationId, notification);

      // Auto-dismiss after duration
      if (options.duration && options.duration > 0) {
        setTimeout(() => {
          notification.close();
          this.activeNotifications.delete(notificationId);
        }, options.duration);
      }

      notification.onclick = () => {
        window.focus();
        notification.close();
        this.activeNotifications.delete(notificationId);
      };

      notification.onclose = () => {
        this.activeNotifications.delete(notificationId);
      };

      return { success: true, notificationId };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to show notification",
      };
    }
  }

  async dismiss(notificationId: string): Promise<NotificationResult> {
    const notification = this.activeNotifications.get(notificationId);
    if (notification) {
      notification.close();
      this.activeNotifications.delete(notificationId);
    }
    return { success: true };
  }

  async dismissAll(): Promise<NotificationResult> {
    for (const [_id, notification] of this.activeNotifications) {
      notification.close();
    }
    this.activeNotifications.clear();
    return { success: true };
  }

  isSupported(): boolean {
    return "Notification" in window;
  }

  async requestPermission(): Promise<boolean> {
    if (!("Notification" in window)) {
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    const permission = await Notification.requestPermission();
    return permission === "granted";
  }
}

/**
 * Web process service implementation
 */
class WebProcessService implements ProcessService {
  getEnv(key?: string): string | Record<string, string | undefined> {
    // Browser doesn't have environment variables
    if (key) {
      return "";
    }
    return {};
  }

  setEnv(_key: string, _value: string): void {
    // Can't set environment variables in browser
  }

  getPlatform(): string {
    return navigator.platform || "web";
  }

  getArch(): string {
    // Limited architecture detection in browser
    return "unknown";
  }

  getVersion(): string {
    return navigator.userAgent;
  }

  exit(_code?: number): void {
    // Can't exit the browser process, but can close the tab
    if (window.close) {
      window.close();
    }
  }

  getArgs(): string[] {
    // Parse URL parameters as arguments
    const params = new URLSearchParams(window.location.search);
    const args: string[] = [];
    for (const [key, value] of params) {
      args.push(`--${key}=${value}`);
    }
    return args;
  }

  getPid(): number {
    // Browser doesn't have process ID concept
    return -1;
  }

  isTTY(): boolean {
    // Browser is not a TTY
    return false;
  }
}

/**
 * Web storage service implementation
 * Uses localStorage for persistence
 */
class WebStorageService implements StorageService {
  private storage = typeof localStorage !== "undefined" ? localStorage : null;

  async getItem(key: string): Promise<string | null> {
    if (!this.storage) {
      return null;
    }
    try {
      return this.storage.getItem(key);
    } catch {
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    if (!this.storage) {
      throw new Error("localStorage not available");
    }
    try {
      this.storage.setItem(key, value);
    } catch (error) {
      throw new Error(
        `Failed to set item: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  async removeItem(key: string): Promise<void> {
    if (!this.storage) {
      return;
    }
    try {
      this.storage.removeItem(key);
    } catch {
      // Ignore errors
    }
  }

  async clear(): Promise<void> {
    if (!this.storage) {
      return;
    }
    try {
      this.storage.clear();
    } catch {
      // Ignore errors
    }
  }

  async keys(): Promise<string[]> {
    if (!this.storage) {
      return [];
    }
    try {
      const keys: string[] = [];
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key) {
          keys.push(key);
        }
      }
      return keys;
    } catch {
      return [];
    }
  }

  async getSize(): Promise<number> {
    if (!this.storage) {
      return 0;
    }
    try {
      let size = 0;
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key) {
          const value = this.storage.getItem(key);
          if (value) {
            size += key.length + value.length;
          }
        }
      }
      return size;
    } catch {
      return 0;
    }
  }
}

/**
 * Web platform service implementation
 */
export class WebPlatformService extends PlatformService {
  private fileSystemService: WebFileSystemService;
  private clipboardService: WebClipboardService;
  private notificationService: WebNotificationService;
  private processService: WebProcessService;
  private storageService: WebStorageService;

  constructor() {
    const capabilities = PlatformUtils.createDefaultCapabilities("web");
    super(capabilities);

    this.fileSystemService = new WebFileSystemService();
    this.clipboardService = new WebClipboardService();
    this.notificationService = new WebNotificationService();
    this.processService = new WebProcessService();
    this.storageService = new WebStorageService();
  }

  getFileSystem(): FileSystemService {
    return this.fileSystemService;
  }

  getClipboard(): ClipboardService {
    return this.clipboardService;
  }

  getNotifications(): NotificationService {
    return this.notificationService;
  }

  getProcess(): ProcessService {
    return this.processService;
  }

  getStorage(): StorageService {
    return this.storageService;
  }

  async initialize(): Promise<void> {
    // Request notification permission on initialization
    if (this.notificationService.isSupported()) {
      await this.notificationService.requestPermission?.();
    }
  }

  async cleanup(): Promise<void> {
    // Dismiss all active notifications
    await this.notificationService.dismissAll();
  }
}

/**
 * Utility to create a web platform service instance
 */
export function createWebPlatformService(): WebPlatformService {
  return new WebPlatformService();
}
