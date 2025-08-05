/**
 * Basic example demonstrating the multi-platform rendering system
 * Shows how to create UI components that work on both terminal and web
 */

import type { ReactElement } from "react";
import type { RenderManager, RenderNode } from "../RenderSystem";

/**
 * Create a simple JSON viewer component using the abstract rendering system
 */
export function createJsonViewerComponent(
  renderManager: RenderManager,
  data: any,
): RenderNode {
  // Create the main container
  const container = renderManager.createLayout({
    direction: "column",
    padding: 2,
    gap: 1,
  });

  // Add title
  const title = renderManager.createText("JSON Viewer", {
    bold: true,
    color: "blue",
    fontSize: 18,
  });

  // Add data content
  const content = renderManager.createText(JSON.stringify(data, null, 2), {
    fontFamily: "monospace",
    backgroundColor: "#f5f5f5",
    padding: 1,
  });

  // Add action buttons
  const buttonContainer = renderManager.createLayout({
    direction: "row",
    gap: 1,
    justify: "start",
  });

  const copyButton = renderManager.createButton(
    "Copy",
    () => {
      console.log("Copy clicked");
    },
    {
      color: "white",
      backgroundColor: "blue",
    },
  );

  const exportButton = renderManager.createButton(
    "Export",
    () => {
      console.log("Export clicked");
    },
    {
      color: "white",
      backgroundColor: "green",
    },
  );

  // Assemble the component tree
  buttonContainer.children = [copyButton, exportButton];
  container.children = [title, content, buttonContainer];

  return container;
}

/**
 * Example of creating a settings form
 */
export function createSettingsFormComponent(
  renderManager: RenderManager,
): RenderNode {
  const form = renderManager.createLayout({
    direction: "column",
    padding: 2,
    gap: 2,
  });

  // Form title
  const title = renderManager.createText("Settings", {
    bold: true,
    fontSize: 16,
    color: "green",
  });

  // Theme selection
  const themeSection = renderManager.createLayout({
    direction: "column",
    gap: 1,
  });

  const themeLabel = renderManager.createText("Theme:", {
    bold: true,
  });

  const themeInput = renderManager.createInput({
    type: "text",
    placeholder: "Enter theme (light/dark)",
    value: "light",
  });

  themeSection.children = [themeLabel, themeInput];

  // Font size selection
  const fontSection = renderManager.createLayout({
    direction: "column",
    gap: 1,
  });

  const fontLabel = renderManager.createText("Font Size:", {
    bold: true,
  });

  const fontInput = renderManager.createInput({
    type: "number",
    placeholder: "Font size",
    value: "14",
  });

  fontSection.children = [fontLabel, fontInput];

  // Action buttons
  const actions = renderManager.createLayout({
    direction: "row",
    gap: 1,
    justify: "end",
  });

  const cancelButton = renderManager.createButton("Cancel", () => {
    console.log("Cancel clicked");
  });

  const saveButton = renderManager.createButton(
    "Save",
    () => {
      console.log("Save clicked");
    },
    {
      color: "white",
      backgroundColor: "blue",
    },
  );

  actions.children = [cancelButton, saveButton];

  // Assemble the form
  form.children = [title, themeSection, fontSection, actions];

  return form;
}

/**
 * Example usage with terminal adapter
 */
export function TerminalExample(): ReactElement {
  const { createTerminalRenderAdapter, RenderManager } = require("../index");

  const adapter = createTerminalRenderAdapter();
  const renderManager = new RenderManager(adapter);

  const sampleData = {
    name: "jsont",
    version: "1.0.0",
    features: ["JSON viewing", "Multi-platform UI", "Tree navigation"],
    settings: {
      theme: "dark",
      fontSize: 14,
    },
  };

  const component = createJsonViewerComponent(renderManager, sampleData);

  return renderManager.render(component);
}

/**
 * Example usage with web adapter
 */
export function WebExample(): ReactElement {
  const { createWebRenderAdapter, RenderManager } = require("../index");

  const adapter = createWebRenderAdapter();
  const renderManager = new RenderManager(adapter);

  const settingsForm = createSettingsFormComponent(renderManager);

  return renderManager.render(settingsForm);
}

/**
 * Example showing platform detection and adapter selection
 */
export function createAdaptiveComponent(data: any): ReactElement {
  const {
    createTerminalRenderAdapter,
    createWebRenderAdapter,
    RenderManager,
  } = require("../index");

  // Detect platform
  const isWeb = typeof window !== "undefined";

  // Create appropriate adapter
  const adapter = isWeb
    ? createWebRenderAdapter("jsont-app")
    : createTerminalRenderAdapter();

  const renderManager = new RenderManager(adapter);

  // Create component that works on both platforms
  const component = createJsonViewerComponent(renderManager, data);

  return renderManager.render(component);
}

/**
 * Performance example showing lazy rendering for large datasets
 */
export function createVirtualizedList(
  renderManager: RenderManager,
  items: any[],
  visibleCount = 10,
): RenderNode {
  const container = renderManager.createLayout({
    direction: "column",
  });

  // Set additional styles that are not in LayoutOptions
  container.style = {
    ...container.style,
    height: "100%",
    overflow: "auto",
  };

  // Only render visible items (simplified virtualization)
  const visibleItems = items.slice(0, visibleCount);

  const itemNodes = visibleItems.map((item, index) => {
    return renderManager.createText(`${index + 1}. ${JSON.stringify(item)}`, {
      padding: 1,
      backgroundColor: index % 2 === 0 ? "#f9f9f9" : "transparent",
    });
  });

  container.children = itemNodes;

  return container;
}
