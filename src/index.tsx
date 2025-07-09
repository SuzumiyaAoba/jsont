/**
 * JSON TUI Viewer - Main Entry Point
 * Refactored for better separation of concerns and maintainability
 */

import { AppService } from "./services/appService";
import { handleFatalError } from "./utils/errorHandler";

async function main(): Promise<void> {
  const appService = new AppService();
  await appService.run();
}

// Run the application with proper error handling
main().catch(handleFatalError);
