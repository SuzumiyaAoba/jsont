/**
 * JSON Processing Service
 */

import { CONFIG } from "../config/constants";
import type { JsonValue } from "../types/index";
import { DebugLogger } from "../utils/debug";
import {
  getErrorMessage,
  handleInputError,
  handleNoInput,
} from "../utils/errorHandler";
import { autoReadJson } from "../utils/stdinReader";

export interface JsonProcessingResult {
  data: JsonValue | null;
  error: string | null;
}

export class JsonService {
  private debugLogger = new DebugLogger();

  /**
   * Process JSON input from file or stdin
   */
  async processInput(filePath?: string): Promise<JsonProcessingResult> {
    try {
      const result = await autoReadJson(filePath, {
        timeout: CONFIG.INPUT_TIMEOUT,
        maxSize: CONFIG.MAX_FILE_SIZE,
        extractFromText: !!filePath, // Only extract from text when reading from files
      });

      if (result.success) {
        this.debugLogger.logReadStats(result);
        this.debugLogger.logJsonData(result.data);

        return {
          data: result.data,
          error: null,
        };
      } else {
        handleNoInput(filePath);

        return {
          data: null,
          error: result.error,
        };
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      handleInputError(error, filePath);

      return {
        data: null,
        error: errorMessage,
      };
    }
  }
}
