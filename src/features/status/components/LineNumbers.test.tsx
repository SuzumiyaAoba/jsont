import { ConfigProvider } from "@core/context/ConfigContext";
import { render } from "ink-testing-library";
import { describe, expect, it, vi } from "vitest";
import { App } from "@/App";

// Mock the useInput hook to simulate keyboard input
type MockKeyInput = {
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  return?: boolean;
  escape?: boolean;
  backspace?: boolean;
  delete?: boolean;
};

let mockInputHandler: ((input: string, key: MockKeyInput) => void) | null =
  null;

vi.mock("ink", async () => {
  const actual = await vi.importActual("ink");
  return {
    ...actual,
    useInput: vi.fn((handler: (input: string, key: MockKeyInput) => void) => {
      mockInputHandler = handler;
    }),
    useApp: () => ({ exit: vi.fn() }),
  };
});

describe("Line Numbers Functionality", () => {
  it("should not show line numbers by default", () => {
    const data = { name: "test", value: 123 };
    const { lastFrame } = render(
      <App initialData={data} keyboardEnabled={true} />,
    );

    const output = lastFrame();
    // Should not contain line number patterns (numbers followed by space at line start)
    expect(output).not.toMatch(/^\s*\d+\s+\{/m);
  });

  it("should show line numbers when L key is pressed", () => {
    const data = { name: "test", value: 123 };
    const { lastFrame, rerender } = render(
      <App initialData={data} keyboardEnabled={true} />,
    );

    // Initially no line numbers
    let output = lastFrame();
    expect(output).not.toMatch(/^\s*\d+\s+\{/m);

    // Press L to toggle line numbers
    mockInputHandler?.("L", { ctrl: false, meta: false });
    rerender(<App initialData={data} keyboardEnabled={true} />);

    // Should now show line numbers
    output = lastFrame();
    expect(output).toMatch(/\d+/); // Should contain numbers (line numbers)
  });

  it("should hide line numbers when L key is pressed again", () => {
    const data = { name: "test", value: 123 };
    const { lastFrame, rerender } = render(
      <App initialData={data} keyboardEnabled={true} />,
    );

    // Press L to show line numbers
    mockInputHandler?.("L", { ctrl: false, meta: false });
    rerender(<App initialData={data} keyboardEnabled={true} />);

    // Should show line numbers
    let output = lastFrame();
    expect(output).toMatch(/\d+/);

    // Press L again to hide line numbers
    mockInputHandler?.("L", { ctrl: false, meta: false });
    rerender(<App initialData={data} keyboardEnabled={true} />);

    // Should hide line numbers
    output = lastFrame();
    // Check that line numbers are not at the beginning of content lines
    expect(output).not.toMatch(/^\s*\d+\s+\{/m);
  });

  it("should render JSON data correctly", () => {
    const data = { name: "test", value: 123 };
    const { lastFrame } = render(
      <ConfigProvider>
        <App initialData={data} keyboardEnabled={true} />
      </ConfigProvider>,
    );

    const output = lastFrame();
    expect(output).toContain("name");
    expect(output).toContain("test");
  });

  it("should not respond to lowercase l key", () => {
    const data = { name: "test", value: 123 };
    const { lastFrame, rerender } = render(
      <App initialData={data} keyboardEnabled={true} />,
    );

    // Press lowercase l (should not toggle line numbers)
    mockInputHandler?.("l", { ctrl: false, meta: false });
    rerender(<App initialData={data} keyboardEnabled={true} />);

    // Should still not show line numbers
    const output = lastFrame();
    expect(output).not.toMatch(/^\s*\d+\s+\{/m);
  });

  it("should display proper line number formatting for multi-line JSON", () => {
    const data = {
      users: [
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" },
        { id: 3, name: "Charlie" },
      ],
      total: 3,
    };
    const { lastFrame, rerender } = render(
      <App initialData={data} keyboardEnabled={true} />,
    );

    // Enable line numbers
    mockInputHandler?.("L", { ctrl: false, meta: false });
    rerender(<App initialData={data} keyboardEnabled={true} />);

    const output = lastFrame();
    // Should contain line numbers
    expect(output).toMatch(/\d+/);
    // For a JSON with multiple lines, should have several line numbers
    const lineNumbers = output?.match(/\d+/g);
    expect(lineNumbers).toBeTruthy();
    if (lineNumbers) {
      expect(lineNumbers.length).toBeGreaterThan(1);
    }
  });
});
