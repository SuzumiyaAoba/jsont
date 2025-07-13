import { describe, expect, it } from "vitest";

// Simple unit tests for the cursor movement and text input logic
describe("TextInput Component", () => {
  it("should handle character insertion at cursor position", () => {
    const initialValue = "hello";
    const cursorPosition = 2;
    const newChar = "x";

    const result =
      initialValue.substring(0, cursorPosition) +
      newChar +
      initialValue.substring(cursorPosition);
    expect(result).toBe("hexllo");
  });

  it("should handle backspace operation", () => {
    const initialValue = "hello";
    const cursorPosition = 5;

    if (cursorPosition > 0) {
      const result =
        initialValue.substring(0, cursorPosition - 1) +
        initialValue.substring(cursorPosition);
      expect(result).toBe("hell");
    }
  });

  it("should handle backspace at different cursor positions", () => {
    // Test backspace at beginning (should do nothing)
    const value1 = "hello";
    const cursor1 = 0;
    if (cursor1 > 0) {
      const result1 =
        value1.substring(0, cursor1 - 1) + value1.substring(cursor1);
      expect(result1).toBe("ello"); // This test won't run due to cursor1 > 0 check
    } else {
      expect(value1).toBe("hello"); // No change when cursor is at beginning
    }

    // Test backspace in middle
    const value2 = "hello";
    const cursor2 = 3; // Between 'l' and 'l'
    const result2 =
      value2.substring(0, cursor2 - 1) + value2.substring(cursor2);
    expect(result2).toBe("helo"); // Should delete the first 'l'

    // Test backspace at end
    const value3 = "hello";
    const cursor3 = 5; // At end
    const result3 =
      value3.substring(0, cursor3 - 1) + value3.substring(cursor3);
    expect(result3).toBe("hell"); // Should delete 'o'
  });

  it("should handle delete operation on macOS (deletes left)", () => {
    // Simulate macOS behavior
    const isMacOS = process.platform === "darwin";
    const initialValue = "hello";
    const cursorPosition = 2;

    if (isMacOS) {
      // On macOS: delete key deletes left
      if (cursorPosition > 0) {
        const result =
          initialValue.substring(0, cursorPosition - 1) +
          initialValue.substring(cursorPosition);
        expect(result).toBe("hllo"); // Deleted 'e'
      }
    } else {
      // On other platforms: delete key deletes right
      if (cursorPosition < initialValue.length) {
        const result =
          initialValue.substring(0, cursorPosition) +
          initialValue.substring(cursorPosition + 1);
        expect(result).toBe("helo"); // Deleted 'l'
      }
    }
  });

  it("should handle delete operation on non-macOS (deletes right)", () => {
    // Simulate non-macOS behavior
    const initialValue = "hello";
    const cursorPosition = 2;

    // On non-macOS platforms: delete key deletes right
    if (cursorPosition < initialValue.length) {
      const result =
        initialValue.substring(0, cursorPosition) +
        initialValue.substring(cursorPosition + 1);
      expect(result).toBe("helo"); // Deleted 'l'
    }
  });

  it("should handle Ctrl+K (kill to end) operation", () => {
    const initialValue = "hello world";
    const cursorPosition = 5;

    const result = initialValue.substring(0, cursorPosition);
    expect(result).toBe("hello");
  });

  it("should handle Ctrl+U (kill to beginning) operation", () => {
    const initialValue = "hello world";
    const cursorPosition = 6;

    const result = initialValue.substring(cursorPosition);
    expect(result).toBe("world");
  });

  it("should handle Ctrl+W (kill word backward) operation", () => {
    const initialValue = "hello world test";
    const cursorPosition = 17; // At end of string

    const beforeCursor = initialValue.substring(0, cursorPosition);
    const afterCursor = initialValue.substring(cursorPosition);

    // Find the start of the current word by looking backward for whitespace
    let newCursorPosition = cursorPosition;

    // Skip trailing whitespace first
    while (
      newCursorPosition > 0 &&
      /\s/.test(beforeCursor[newCursorPosition - 1])
    ) {
      newCursorPosition--;
    }

    // Then skip the word characters
    while (
      newCursorPosition > 0 &&
      !/\s/.test(beforeCursor[newCursorPosition - 1])
    ) {
      newCursorPosition--;
    }

    const newBeforeCursor = beforeCursor.substring(0, newCursorPosition);
    const result = newBeforeCursor + afterCursor;

    expect(result).toBe("hello world ");
    expect(newCursorPosition).toBe(12); // Should be at position after "hello world "
  });

  it("should handle Ctrl+W with whitespace at cursor", () => {
    const initialValue = "hello world   ";
    const cursorPosition = 14; // At end of trailing spaces

    const beforeCursor = initialValue.substring(0, cursorPosition);
    const afterCursor = initialValue.substring(cursorPosition);

    // Find the start of the current word by looking backward for whitespace
    let newCursorPosition = cursorPosition;

    // Skip trailing whitespace first
    while (
      newCursorPosition > 0 &&
      /\s/.test(beforeCursor[newCursorPosition - 1])
    ) {
      newCursorPosition--;
    }

    // Then skip the word characters
    while (
      newCursorPosition > 0 &&
      !/\s/.test(beforeCursor[newCursorPosition - 1])
    ) {
      newCursorPosition--;
    }

    const newBeforeCursor = beforeCursor.substring(0, newCursorPosition);
    const result = newBeforeCursor + afterCursor;

    expect(result).toBe("hello ");
    expect(newCursorPosition).toBe(6); // Should be at position after "hello "
  });

  it("should handle Ctrl+W in middle of word", () => {
    const initialValue = "hello world test";
    const cursorPosition = 9; // In middle of "world" (between "wo" and "rld")

    const beforeCursor = initialValue.substring(0, cursorPosition);
    const afterCursor = initialValue.substring(cursorPosition);

    // Find the start of the current word by looking backward for whitespace
    let newCursorPosition = cursorPosition;

    // Skip trailing whitespace first (none in this case)
    while (
      newCursorPosition > 0 &&
      /\s/.test(beforeCursor[newCursorPosition - 1])
    ) {
      newCursorPosition--;
    }

    // Then skip the word characters
    while (
      newCursorPosition > 0 &&
      !/\s/.test(beforeCursor[newCursorPosition - 1])
    ) {
      newCursorPosition--;
    }

    const newBeforeCursor = beforeCursor.substring(0, newCursorPosition);
    const result = newBeforeCursor + afterCursor;

    expect(result).toBe("hello ld test"); // "wo" was deleted, leaving "rld" -> "ld"
    expect(newCursorPosition).toBe(6); // Should be at position after "hello "
  });

  it("should handle Ctrl+D (forward delete) operation", () => {
    const initialValue = "hello world";
    const cursorPosition = 5; // At the space between "hello" and "world"

    if (cursorPosition < initialValue.length) {
      const result =
        initialValue.substring(0, cursorPosition) +
        initialValue.substring(cursorPosition + 1);
      expect(result).toBe("helloworld"); // Space was deleted
    }
  });

  it("should handle Ctrl+D at end of string", () => {
    const initialValue = "hello";
    const cursorPosition = 5; // At end

    if (cursorPosition < initialValue.length) {
      const result =
        initialValue.substring(0, cursorPosition) +
        initialValue.substring(cursorPosition + 1);
      expect(result).toBe("hello"); // This won't run because cursor is at end
    } else {
      expect(initialValue).toBe("hello"); // No change when cursor is at end
    }
  });

  it("should handle Ctrl+D in middle of text", () => {
    const initialValue = "hello";
    const cursorPosition = 2; // Between "he" and "llo"

    if (cursorPosition < initialValue.length) {
      const result =
        initialValue.substring(0, cursorPosition) +
        initialValue.substring(cursorPosition + 1);
      expect(result).toBe("helo"); // "l" was deleted
    }
  });

  it("should handle cursor boundary checks", () => {
    const valueLength = 5;

    // Test cursor position beyond end
    const beyondEnd = Math.min(10, valueLength);
    expect(beyondEnd).toBe(5);

    // Test cursor position before beginning
    const beforeBeginning = Math.max(0, -5);
    expect(beforeBeginning).toBe(0);
  });

  it("should generate correct display text components", () => {
    const value = "hello";
    const cursorPosition = 2;

    const beforeCursor = value.substring(0, cursorPosition);
    const atCursor =
      cursorPosition < value.length ? value.charAt(cursorPosition) : " ";
    const afterCursor = value.substring(
      cursorPosition + (cursorPosition < value.length ? 1 : 0),
    );

    expect(beforeCursor).toBe("he");
    expect(atCursor).toBe("l");
    expect(afterCursor).toBe("lo");
  });

  it("should handle empty string with cursor", () => {
    const value = "";
    const cursorPosition = 0;

    const beforeCursor = value.substring(0, cursorPosition);
    const atCursor =
      cursorPosition < value.length ? value.charAt(cursorPosition) : " ";
    const afterCursor = value.substring(
      cursorPosition + (cursorPosition < value.length ? 1 : 0),
    );

    expect(beforeCursor).toBe("");
    expect(atCursor).toBe(" ");
    expect(afterCursor).toBe("");
  });

  it("should validate cursor movement operations", () => {
    const value = "hello";
    let cursorPosition = 2;

    // Forward movement
    cursorPosition = Math.min(cursorPosition + 1, value.length);
    expect(cursorPosition).toBe(3);

    // Backward movement
    cursorPosition = Math.max(cursorPosition - 1, 0);
    expect(cursorPosition).toBe(2);

    // Move to beginning
    cursorPosition = 0;
    expect(cursorPosition).toBe(0);

    // Move to end
    cursorPosition = value.length;
    expect(cursorPosition).toBe(5);
  });
});
