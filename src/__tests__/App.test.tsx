import { ConfigProvider } from "@core/context/ConfigContext.js";
import { render } from "ink-testing-library";
import { describe, expect, it, vi } from "vitest";
import { App } from "@/App.js";

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

// Mock input handler for useInput hook
// @ts-expect-error - mockInputHandler is used in the mock setup but TypeScript can't detect it
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

describe("App", () => {
  it("should render without error", () => {
    const data = { key: "value" };
    const { lastFrame } = render(
      <ConfigProvider>
        <App initialData={data} keyboardEnabled={true} />
      </ConfigProvider>,
    );

    // Should show JSON content
    const output = lastFrame();
    expect(output).toContain("key");
    expect(output).toContain("value");
  });

  it("should render when no data is provided", () => {
    const { lastFrame } = render(
      <ConfigProvider>
        <App
          initialData={null}
          initialError="Test error"
          keyboardEnabled={true}
        />
      </ConfigProvider>,
    );

    const output = lastFrame();
    expect(output).toContain("No JSON data to display");
  });

  it("should show JSON content when keyboard is enabled", () => {
    const data = { test: "data" };
    const { lastFrame } = render(
      <ConfigProvider>
        <App initialData={data} keyboardEnabled={true} />
      </ConfigProvider>,
    );

    const output = lastFrame();
    expect(output).toContain("test");
    expect(output).toContain("data");
  });

  it("should show initializing message when keyboard is disabled", () => {
    const data = { test: "data" };
    const { lastFrame } = render(
      <ConfigProvider>
        <App initialData={data} keyboardEnabled={false} />
      </ConfigProvider>,
    );

    const output = lastFrame();
    // The keyboard unavailable message should be present when not in help mode
    expect(output).toContain("Keyboard input unavailable");
  });

  it("should handle null data gracefully", () => {
    const { lastFrame } = render(
      <ConfigProvider>
        <App initialData={null} keyboardEnabled={true} />
      </ConfigProvider>,
    );

    const output = lastFrame();
    expect(output).toContain("No JSON data to display");
  });
});
