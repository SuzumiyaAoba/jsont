/**
 * Tests for multi-platform component abstraction
 */

import { describe, expect, it, vi } from "vitest";
import {
  createComponentDemoApp,
  MultiPlatformButton,
  MultiPlatformComponentFactory,
  MultiPlatformContainer,
  MultiPlatformText,
  PHASE_2_1_SUMMARY,
} from "./ComponentDemo";

// Mock dependencies
const mockRenderManager = {
  render: vi.fn((node) => node),
} as any; // Intentional any for test mock

const mockPlatformService = {
  getCapabilities: vi.fn(() => ({ type: "terminal" })),
} as any; // Intentional any for test mock

describe("Multi-Platform Component Abstraction", () => {
  describe("MultiPlatformButton", () => {
    it("should create a button with correct properties", () => {
      const button = new MultiPlatformButton(
        { text: "Test Button", variant: "primary" },
        mockRenderManager,
        mockPlatformService,
      );

      const renderNode = button.render();

      expect(renderNode.type).toBe("button");
      expect(renderNode.content).toBe("Test Button");
      expect(renderNode.style?.backgroundColor).toBe("#007acc");
      expect(renderNode.style?.color).toBe("white");
    });

    it("should create secondary variant button", () => {
      const button = new MultiPlatformButton(
        { text: "Secondary", variant: "secondary" },
        mockRenderManager,
        mockPlatformService,
      );

      const renderNode = button.render();

      expect(renderNode.style?.backgroundColor).toBe("transparent");
      expect(renderNode.style?.color).toBe("#007acc");
    });

    it("should handle click events", () => {
      const onClick = vi.fn();
      const button = new MultiPlatformButton(
        { text: "Clickable", onClick },
        mockRenderManager,
        mockPlatformService,
      );

      const renderNode = button.render();

      expect(renderNode.props["onClick"]).toBe(onClick);
    });
  });

  describe("MultiPlatformContainer", () => {
    it("should create a container with layout properties", () => {
      const container = new MultiPlatformContainer(
        { direction: "row", gap: 2, padding: 1 },
        mockRenderManager,
        mockPlatformService,
      );

      const renderNode = container.render();

      expect(renderNode.type).toBe("container");
      expect(renderNode.props["direction"]).toBe("row");
      expect(renderNode.props["gap"]).toBe(2);
      expect(renderNode.props["padding"]).toBe(1);
    });

    it("should manage child components", () => {
      const container = new MultiPlatformContainer(
        {},
        mockRenderManager,
        mockPlatformService,
      );

      const child1 = new MultiPlatformText(
        { content: "Child 1" },
        mockRenderManager,
        mockPlatformService,
      );

      const child2 = new MultiPlatformText(
        { content: "Child 2" },
        mockRenderManager,
        mockPlatformService,
      );

      container.addChild(child1);
      container.addChild(child2);

      const renderNode = container.render();

      expect(renderNode.children).toHaveLength(2);
      expect(renderNode.children?.[0]?.content).toBe("Child 1");
      expect(renderNode.children?.[1]?.content).toBe("Child 2");
    });

    it("should remove child components", () => {
      const container = new MultiPlatformContainer(
        {},
        mockRenderManager,
        mockPlatformService,
      );

      const child = new MultiPlatformText(
        { content: "Child" },
        mockRenderManager,
        mockPlatformService,
      );

      container.addChild(child);
      expect(container.render().children).toHaveLength(1);

      container.removeChild(child.getId());
      expect(container.render().children).toHaveLength(0);
    });
  });

  describe("MultiPlatformText", () => {
    it("should create text with styling", () => {
      const text = new MultiPlatformText(
        { content: "Hello World", color: "red", bold: true },
        mockRenderManager,
        mockPlatformService,
      );

      const renderNode = text.render();

      expect(renderNode.type).toBe("text");
      expect(renderNode.content).toBe("Hello World");
      expect(renderNode.style?.color).toBe("red");
      expect(renderNode.style?.bold).toBe(true);
    });
  });

  describe("MultiPlatformComponentFactory", () => {
    it("should create components through factory", () => {
      const factory = new MultiPlatformComponentFactory(
        mockRenderManager,
        mockPlatformService,
      );

      const button = factory.createButton({ text: "Factory Button" });
      const container = factory.createContainer({ direction: "row" });
      const text = factory.createText({ content: "Factory Text" });

      expect(button.render().type).toBe("button");
      expect(container.render().type).toBe("container");
      expect(text.render().type).toBe("text");
    });
  });

  describe("createComponentDemoApp", () => {
    it("should create a complete demo application", () => {
      const app = createComponentDemoApp(
        mockRenderManager,
        mockPlatformService,
      );

      const renderNode = app.render();

      expect(renderNode.type).toBe("container");
      expect(renderNode.children).toHaveLength(3); // title, description, button container

      // Check title
      expect(renderNode.children?.[0]?.content).toContain(
        "Multi-Platform Component Demo",
      );

      // Check description
      expect(renderNode.children?.[1]?.content).toContain(
        "platform-independent",
      );

      // Check button container
      const buttonContainer = renderNode.children?.[2];
      expect(buttonContainer?.type).toBe("container");
      expect(buttonContainer?.children).toHaveLength(2); // two buttons
    });
  });

  describe("Component State Management", () => {
    it("should update component properties", () => {
      const button = new MultiPlatformButton(
        { text: "Original" },
        mockRenderManager,
        mockPlatformService,
      );

      expect(button.render().content).toBe("Original");

      button.updateProps({ text: "Updated" });

      expect(button.render().content).toBe("Updated");
    });

    it("should maintain unique component IDs", () => {
      const button1 = new MultiPlatformButton(
        { text: "Button 1" },
        mockRenderManager,
        mockPlatformService,
      );

      const button2 = new MultiPlatformButton(
        { text: "Button 2" },
        mockRenderManager,
        mockPlatformService,
      );

      expect(button1.getId()).not.toBe(button2.getId());
      expect(button1.getId()).toMatch(/^component-/);
      expect(button2.getId()).toMatch(/^component-/);
    });
  });

  describe("Platform Independence Verification", () => {
    it("should render to platform-specific output", () => {
      const button = new MultiPlatformButton(
        { text: "Platform Test" },
        mockRenderManager,
        mockPlatformService,
      );

      const platformOutput = button.renderToPlatform();

      expect(mockRenderManager.render).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "button",
          content: "Platform Test",
        }),
      );

      expect(platformOutput).toBeDefined();
    });

    it("should work with different render managers", () => {
      const terminalRenderManager = {
        render: vi.fn((node) => `Terminal: ${node.type}`),
      } as any; // Intentional any for test mock
      const webRenderManager = {
        render: vi.fn((node) => `Web: ${node.type}`),
      } as any; // Intentional any for test mock

      const terminalButton = new MultiPlatformButton(
        { text: "Test" },
        terminalRenderManager,
        mockPlatformService,
      );

      const webButton = new MultiPlatformButton(
        { text: "Test" },
        webRenderManager,
        mockPlatformService,
      );

      const terminalOutput = terminalButton.renderToPlatform();
      const webOutput = webButton.renderToPlatform();

      expect(terminalOutput).toBe("Terminal: button");
      expect(webOutput).toBe("Web: button");
    });
  });

  describe("Phase 2.1 Summary", () => {
    it("should document completed features", () => {
      expect(PHASE_2_1_SUMMARY.completed).toHaveLength(7);
      expect(PHASE_2_1_SUMMARY.completed[0]).toContain("AbstractComponent");
      expect(PHASE_2_1_SUMMARY.completed[6]).toContain("demonstration");
    });

    it("should document key benefits", () => {
      expect(PHASE_2_1_SUMMARY.benefits).toHaveLength(5);
      expect(PHASE_2_1_SUMMARY.benefits[0]).toContain("Platform-independent");
      expect(PHASE_2_1_SUMMARY.benefits[4]).toContain("extensibility");
    });

    it("should outline next steps", () => {
      expect(PHASE_2_1_SUMMARY.nextSteps).toHaveLength(3);
      expect(PHASE_2_1_SUMMARY.nextSteps[0]).toContain("Phase 2.2");
      expect(PHASE_2_1_SUMMARY.nextSteps[2]).toContain("Phase 4.1");
    });
  });

  describe("Architecture Validation", () => {
    it("should demonstrate clean separation of concerns", () => {
      // Business logic is independent of rendering platform
      const button = new MultiPlatformButton(
        { text: "Test", onClick: vi.fn() },
        mockRenderManager,
        mockPlatformService,
      );

      const renderNode = button.render();

      // The render node is platform-independent
      expect(renderNode).toMatchObject({
        type: "button",
        content: "Test",
        key: expect.any(String),
        props: expect.objectContaining({
          onClick: expect.any(Function),
        }),
        style: expect.any(Object),
      });

      // The actual rendering is delegated to the render manager
      button.renderToPlatform();
      expect(mockRenderManager.render).toHaveBeenCalledWith(renderNode);
    });

    it("should support component composition", () => {
      // Components can be composed hierarchically
      const parent = new MultiPlatformContainer(
        { direction: "column" },
        mockRenderManager,
        mockPlatformService,
      );

      const child1 = new MultiPlatformText(
        { content: "Child 1" },
        mockRenderManager,
        mockPlatformService,
      );

      const child2 = new MultiPlatformButton(
        { text: "Child 2" },
        mockRenderManager,
        mockPlatformService,
      );

      parent.addChild(child1);
      parent.addChild(child2);

      const renderNode = parent.render();

      expect(renderNode.children).toHaveLength(2);
      expect(renderNode.children?.[0]?.type).toBe("text");
      expect(renderNode.children?.[1]?.type).toBe("button");
    });

    it("should enable easy testing without platform dependencies", () => {
      // This test itself demonstrates that we can test component logic
      // without needing Ink, React, or any platform-specific dependencies

      const component = new MultiPlatformText(
        { content: "Testable", color: "blue" },
        mockRenderManager,
        mockPlatformService,
      );

      const result = component.render();

      expect(result).toEqual({
        type: "text",
        key: expect.any(String),
        props: {
          bold: undefined,
          color: "blue",
        },
        content: "Testable",
        style: {
          color: "blue",
          bold: undefined,
        },
      });
    });
  });
});
