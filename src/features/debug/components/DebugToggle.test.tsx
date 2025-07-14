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

describe("Debug Toggle Functionality", () => {
  it("should not show debug bar by default", () => {
    const data = { name: "test", value: 123 };
    const { lastFrame } = render(
      <App initialData={data} keyboardEnabled={true} />,
    );

    const output = lastFrame();
    expect(output).not.toContain("DEBUG:");
  });

  it("should render JSON data without debug bar initially", () => {
    const data = { name: "test", value: 123 };
    const { lastFrame } = render(
      <App initialData={data} keyboardEnabled={true} />,
    );

    // Should show JSON data without debug bar
    const output = lastFrame();
    expect(output).toContain("name");
    expect(output).toContain("test");
    expect(output).not.toContain("DEBUG:");
  });

  it("should render different JSON data types correctly", () => {
    const data = { name: "test", value: 123 };
    const { lastFrame } = render(
      <App initialData={data} keyboardEnabled={true} />,
    );

    // Should show JSON data with correct formatting
    const output = lastFrame();
    expect(output).toContain("name");
    expect(output).toContain("test");
    expect(output).toContain("value");
    expect(output).toContain("123");
  });

  it("should render with keyboard enabled", () => {
    const data = { name: "test", value: 123 };
    const { lastFrame } = render(
      <App initialData={data} keyboardEnabled={true} />,
    );

    const output = lastFrame();
    expect(output).toContain("name");
    expect(output).toContain("test");
  });

  it("should not respond to lowercase d key", () => {
    const data = { name: "test", value: 123 };
    const { lastFrame, rerender } = render(
      <App initialData={data} keyboardEnabled={true} />,
    );

    // Press lowercase d (should not toggle debug)
    mockInputHandler?.("d", { ctrl: false, meta: false });
    rerender(<App initialData={data} keyboardEnabled={true} />);

    // Should still not show debug bar
    const output = lastFrame();
    expect(output).not.toContain("DEBUG:");
  });
});
