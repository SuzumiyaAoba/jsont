/**
 * JSON TUI Viewer - Main Entry Point
 * Refactored for better separation of concerns and maintainability
 */

import { AppService } from "./core/services/appService.js";
import { handleFatalError } from "./core/utils/errorHandler.js";

async function main(): Promise<void> {
  const appService = new AppService();
  await appService.run();
}

// Run the application with proper error handling
main().catch(handleFatalError);
