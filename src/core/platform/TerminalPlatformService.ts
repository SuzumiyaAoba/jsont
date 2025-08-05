/**
 * Terminal platform service implementation
 * Provides Node.js-specific implementations for platform operations
 */

import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
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
 * Terminal file system service implementation
 */
class TerminalFileSystemService implements FileSystemService {
  async readFile(filePath: string): Promise<FileSystemResult<string>> {
    try {
      const content = await fs.readFile(filePath, "utf8");
      return { success: true, data: content };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to read file",
        errorCode:
          error instanceof Error && "code" in error
            ? (error as any).code
            : "UNKNOWN",
      };
    }
  }

  async writeFile(
    filePath: string,
    content: string,
  ): Promise<FileSystemResult<void>> {
    try {
      await fs.writeFile(filePath, content, "utf8");
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to write file",
        errorCode:
          error instanceof Error && "code" in error
            ? (error as any).code
            : "UNKNOWN",
      };
    }
  }

  async exists(filePath: string): Promise<FileSystemResult<boolean>> {
    try {
      await fs.access(filePath);
      return { success: true, data: true };
    } catch {
      return { success: true, data: false };
    }
  }

  async stat(filePath: string): Promise<FileSystemResult<FileInfo>> {
    try {
      const stats = await fs.stat(filePath);
      const fileInfo: FileInfo = {
        name: path.basename(filePath),
        path: filePath,
        size: stats.size,
        isDirectory: stats.isDirectory(),
        isFile: stats.isFile(),
        lastModified: stats.mtime,
        permissions: {
          readable: true, // Simplified - in reality would check file permissions
          writable: true,
          executable: !!(stats.mode & 0o111),
        },
      };
      return { success: true, data: fileInfo };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to get file stats",
        errorCode:
          error instanceof Error && "code" in error
            ? (error as any).code
            : "UNKNOWN",
      };
    }
  }

  async readDir(dirPath: string): Promise<FileSystemResult<FileInfo[]>> {
    try {
      const entries = await fs.readdir(dirPath);
      const fileInfos: FileInfo[] = [];

      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry);
        const statResult = await this.stat(entryPath);
        if (statResult.success && statResult.data) {
          fileInfos.push(statResult.data);
        }
      }

      return { success: true, data: fileInfos };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to read directory",
        errorCode:
          error instanceof Error && "code" in error
            ? (error as any).code
            : "UNKNOWN",
      };
    }
  }

  async mkdir(
    dirPath: string,
    recursive = true,
  ): Promise<FileSystemResult<void>> {
    try {
      await fs.mkdir(dirPath, { recursive });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create directory",
        errorCode:
          error instanceof Error && "code" in error
            ? (error as any).code
            : "UNKNOWN",
      };
    }
  }

  async remove(
    targetPath: string,
    recursive = false,
  ): Promise<FileSystemResult<void>> {
    try {
      const stats = await fs.stat(targetPath);
      if (stats.isDirectory()) {
        await fs.rmdir(targetPath, { recursive });
      } else {
        await fs.unlink(targetPath);
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to remove file/directory",
        errorCode:
          error instanceof Error && "code" in error
            ? (error as any).code
            : "UNKNOWN",
      };
    }
  }

  async copy(
    source: string,
    destination: string,
  ): Promise<FileSystemResult<void>> {
    try {
      await fs.copyFile(source, destination);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to copy file",
        errorCode:
          error instanceof Error && "code" in error
            ? (error as any).code
            : "UNKNOWN",
      };
    }
  }

  async move(
    source: string,
    destination: string,
  ): Promise<FileSystemResult<void>> {
    try {
      await fs.rename(source, destination);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to move file",
        errorCode:
          error instanceof Error && "code" in error
            ? (error as any).code
            : "UNKNOWN",
      };
    }
  }

  async getCwd(): Promise<FileSystemResult<string>> {
    try {
      const cwd = process.cwd();
      return { success: true, data: cwd };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to get current directory",
      };
    }
  }

  async setCwd(newPath: string): Promise<FileSystemResult<void>> {
    try {
      process.chdir(newPath);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to change directory",
        errorCode:
          error instanceof Error && "code" in error
            ? (error as any).code
            : "UNKNOWN",
      };
    }
  }

  joinPath(...segments: string[]): string {
    return path.join(...segments);
  }

  resolvePath(filePath: string): string {
    return path.resolve(filePath);
  }

  dirname(filePath: string): string {
    return path.dirname(filePath);
  }

  basename(filePath: string, ext?: string): string {
    return path.basename(filePath, ext);
  }

  extname(filePath: string): string {
    return path.extname(filePath);
  }
}

/**
 * Terminal clipboard service implementation
 * Limited clipboard support in terminal environments
 */
class TerminalClipboardService implements ClipboardService {
  private clipboardData: string = "";

  async readText(): Promise<ClipboardResult<string>> {
    // In a real implementation, this would try to use system clipboard
    // For now, use internal clipboard simulation
    try {
      // Try to use system clipboard if available (macOS/Linux)
      if (process.platform === "darwin") {
        const { execSync } = await import("node:child_process");
        const result = execSync("pbpaste", { encoding: "utf8" });
        return { success: true, data: result };
      } else if (process.platform === "linux") {
        const { execSync } = await import("node:child_process");
        try {
          const result = execSync("xclip -selection clipboard -o", {
            encoding: "utf8",
          });
          return { success: true, data: result };
        } catch {
          // Fallback to internal clipboard
          return { success: true, data: this.clipboardData };
        }
      } else {
        // Fallback to internal clipboard for other platforms
        return { success: true, data: this.clipboardData };
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to read clipboard",
      };
    }
  }

  async writeText(text: string): Promise<ClipboardResult<void>> {
    try {
      // Try to use system clipboard if available
      if (process.platform === "darwin") {
        const { execSync } = await import("node:child_process");
        execSync("pbcopy", { input: text });
        return { success: true };
      } else if (process.platform === "linux") {
        const { execSync } = await import("node:child_process");
        try {
          execSync("xclip -selection clipboard", { input: text });
          return { success: true };
        } catch {
          // Fallback to internal clipboard
          this.clipboardData = text;
          return { success: true };
        }
      } else {
        // Fallback to internal clipboard
        this.clipboardData = text;
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to write clipboard",
      };
    }
  }

  isSupported(): boolean {
    return process.platform === "darwin" || process.platform === "linux";
  }

  async clear(): Promise<ClipboardResult<void>> {
    return this.writeText("");
  }
}

/**
 * Terminal notification service implementation
 * Limited notification support - uses console output
 */
class TerminalNotificationService implements NotificationService {
  async show(options: NotificationOptions): Promise<NotificationResult> {
    const notificationId = `notification-${++this.notificationCounter}`;

    // Format notification for terminal output
    const typeSymbols = {
      info: "ℹ",
      success: "✓",
      warning: "⚠",
      error: "✗",
    };

    const symbol = typeSymbols[options.type] || "ℹ";
    const title = options.title ? `${options.title}: ` : "";
    const message = `${symbol} ${title}${options.message}`;

    // Output to stderr for notifications
    console.error(message);

    return { success: true, notificationId };
  }

  async dismiss(_notificationId: string): Promise<NotificationResult> {
    // Terminal notifications can't be dismissed once shown
    return { success: true };
  }

  async dismissAll(): Promise<NotificationResult> {
    // Terminal notifications can't be dismissed
    return { success: true };
  }

  isSupported(): boolean {
    return true; // Console output is always supported
  }
}

/**
 * Terminal process service implementation
 */
class TerminalProcessService implements ProcessService {
  getEnv(key?: string): string | Record<string, string | undefined> {
    if (key) {
      return process.env[key] || "";
    }
    return { ...process.env };
  }

  setEnv(key: string, value: string): void {
    process.env[key] = value;
  }

  getPlatform(): string {
    return process.platform;
  }

  getArch(): string {
    return process.arch;
  }

  getVersion(): string {
    return process.version;
  }

  exit(code = 0): void {
    process.exit(code);
  }

  getArgs(): string[] {
    return process.argv.slice(2);
  }

  getPid(): number {
    return process.pid;
  }

  isTTY(): boolean {
    return process.stdout.isTTY || false;
  }
}

/**
 * Terminal storage service implementation
 * Uses file-based storage in the user's home directory
 */
class TerminalStorageService implements StorageService {
  private storageDir: string;
  private storagePath: string;

  constructor() {
    this.storageDir = path.join(os.homedir(), ".jsont");
    this.storagePath = path.join(this.storageDir, "storage.json");
  }

  private async ensureStorageDir(): Promise<void> {
    try {
      await fs.access(this.storageDir);
    } catch {
      await fs.mkdir(this.storageDir, { recursive: true });
    }
  }

  private async loadStorage(): Promise<Record<string, string>> {
    try {
      const content = await fs.readFile(this.storagePath, "utf8");
      return JSON.parse(content);
    } catch {
      return {};
    }
  }

  private async saveStorage(data: Record<string, string>): Promise<void> {
    await this.ensureStorageDir();
    await fs.writeFile(this.storagePath, JSON.stringify(data, null, 2), "utf8");
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const storage = await this.loadStorage();
      return storage[key] || null;
    } catch {
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    const storage = await this.loadStorage();
    storage[key] = value;
    await this.saveStorage(storage);
  }

  async removeItem(key: string): Promise<void> {
    const storage = await this.loadStorage();
    delete storage[key];
    await this.saveStorage(storage);
  }

  async clear(): Promise<void> {
    await this.saveStorage({});
  }

  async keys(): Promise<string[]> {
    const storage = await this.loadStorage();
    return Object.keys(storage);
  }

  async getSize(): Promise<number> {
    try {
      const stats = await fs.stat(this.storagePath);
      return stats.size;
    } catch {
      return 0;
    }
  }
}

/**
 * Terminal platform service implementation
 */
export class TerminalPlatformService extends PlatformService {
  private fileSystemService: TerminalFileSystemService;
  private clipboardService: TerminalClipboardService;
  private notificationService: TerminalNotificationService;
  private processService: TerminalProcessService;
  private storageService: TerminalStorageService;

  constructor() {
    const capabilities = PlatformUtils.createDefaultCapabilities("terminal");
    super(capabilities);

    this.fileSystemService = new TerminalFileSystemService();
    this.clipboardService = new TerminalClipboardService();
    this.notificationService = new TerminalNotificationService();
    this.processService = new TerminalProcessService();
    this.storageService = new TerminalStorageService();
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
    // Terminal platform service doesn't need special initialization
  }

  async cleanup(): Promise<void> {
    // Terminal platform service doesn't need special cleanup
  }
}

/**
 * Utility to create a terminal platform service instance
 */
export function createTerminalPlatformService(): TerminalPlatformService {
  return new TerminalPlatformService();
}
