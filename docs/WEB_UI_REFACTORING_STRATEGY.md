# Web UI Refactoring Strategy

## Overview

This document outlines a comprehensive refactoring strategy to prepare the jsont codebase for Web UI support while maintaining full backward compatibility with the existing terminal UI. The strategy builds on the current excellent architectural foundation to create a truly multi-platform application.

## Current Architecture Assessment

### ✅ Excellent Foundation (80% Web-Ready)

**Strengths:**
- **UI-agnostic engines**: JsonEngine, TreeEngine, SearchEngine are completely UI-independent
- **Clean separation**: Core business logic separated from presentation layers
- **Command pattern**: Perfect for multi-platform interaction models
- **Type safety**: Comprehensive TypeScript coverage
- **State management**: Jotai atoms easily adaptable to web contexts

**Recent Architectural Improvements:**
- 100% separation between core logic and UI layers achieved
- ViewportOptions interface separates UI dimensions from core rendering
- Presentational/Container component pattern implemented
- Engine interfaces completely UI-agnostic

### ⚠️ Areas Requiring Abstraction

**Terminal Dependencies:**
- **Input System**: Direct dependency on Ink's `useInput` hook
- **Rendering System**: 37+ components using Ink primitives (Box, Text)
- **Platform Services**: TTY handling, process management, file system access
- **Component Architecture**: Mixed UI and business logic concerns

## Refactoring Strategy

### Phase 1: Foundation Abstraction (Weeks 1-2)

#### 1.1 Input System Abstraction

**Current State:**
```typescript
// Terminal-specific input handling
useInput((input, key) => {
  // Handle keyboard events
}, { isActive: keyboardEnabled });
```

**Proposed Abstraction:**
```typescript
// src/core/input/InputSystem.ts
export interface InputEvent {
  type: 'keyboard' | 'mouse' | 'touch';
  key?: string;
  modifiers: InputModifiers;
  position?: { x: number; y: number };
  preventDefault(): void;
}

export interface InputModifiers {
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  meta: boolean;
}

export abstract class InputAdapter {
  abstract registerHandler(handler: InputHandler): void;
  abstract unregisterHandler(handler: InputHandler): void;
  abstract isActive(): boolean;
}

export interface InputHandler {
  canHandle(event: InputEvent): boolean;
  handle(event: InputEvent): boolean;
  priority: number;
}

// Input Manager for coordinating multiple handlers
export class InputManager {
  private handlers: InputHandler[] = [];
  private adapter: InputAdapter;

  constructor(adapter: InputAdapter) {
    this.adapter = adapter;
  }

  registerHandler(handler: InputHandler): void {
    this.handlers.push(handler);
    this.handlers.sort((a, b) => b.priority - a.priority);
  }

  processEvent(event: InputEvent): boolean {
    for (const handler of this.handlers) {
      if (handler.canHandle(event) && handler.handle(event)) {
        return true;
      }
    }
    return false;
  }
}
```

**Platform Implementations:**
```typescript
// Terminal Implementation
export class TerminalInputAdapter extends InputAdapter {
  constructor(private useInput: typeof import('ink').useInput) {}
  
  registerHandler(handler: InputHandler): void {
    this.useInput((input, key) => {
      const event = this.mapInkEventToInputEvent(input, key);
      this.inputManager.processEvent(event);
    });
  }

  private mapInkEventToInputEvent(input: string, key: any): InputEvent {
    return {
      type: 'keyboard',
      key: input,
      modifiers: {
        ctrl: key.ctrl || false,
        alt: key.alt || false,
        shift: key.shift || false,
        meta: key.meta || false,
      },
      preventDefault: () => {},
    };
  }
}

// Web Implementation
export class WebInputAdapter extends InputAdapter {
  registerHandler(handler: InputHandler): void {
    document.addEventListener('keydown', (e) => {
      const event = this.mapDOMEventToInputEvent(e);
      this.inputManager.processEvent(event);
    });
  }

  private mapDOMEventToInputEvent(e: KeyboardEvent): InputEvent {
    return {
      type: 'keyboard',
      key: e.key,
      modifiers: {
        ctrl: e.ctrlKey,
        alt: e.altKey,
        shift: e.shiftKey,
        meta: e.metaKey,
      },
      preventDefault: () => e.preventDefault(),
    };
  }
}
```

#### 1.2 Rendering System Abstraction

**Current State:**
```typescript
// Terminal-specific rendering
return (
  <Box flexDirection="column">
    <Text color="green">Content</Text>
  </Box>
);
```

**Proposed Abstraction:**
```typescript
// src/core/rendering/RenderSystem.ts
export interface RenderNode {
  type: 'container' | 'text' | 'input';
  props: Record<string, any>;
  children?: RenderNode[];
  key?: string;
}

export interface LayoutOptions {
  direction: 'row' | 'column';
  justify: 'start' | 'center' | 'end' | 'space-between';
  align: 'start' | 'center' | 'end';
  wrap: boolean;
  gap?: number;
}

export interface TextStyle {
  color?: string;
  backgroundColor?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

export abstract class RenderAdapter {
  abstract render(node: RenderNode): any;
  abstract createContainer(options: LayoutOptions): RenderNode;
  abstract createText(content: string, style?: TextStyle): RenderNode;
  abstract createInput(options: InputFieldOptions): RenderNode;
}

export interface ViewportInfo {
  width: number;
  height: number;
  scrollX: number;
  scrollY: number;
}

// Render Manager for coordinating rendering
export class RenderManager {
  constructor(private adapter: RenderAdapter) {}

  render(node: RenderNode): any {
    return this.adapter.render(node);
  }

  createLayout(options: LayoutOptions, children: RenderNode[]): RenderNode {
    const container = this.adapter.createContainer(options);
    container.children = children;
    return container;
  }
}
```

**Platform Implementations:**
```typescript
// Terminal Implementation
export class TerminalRenderAdapter extends RenderAdapter {
  render(node: RenderNode): JSX.Element {
    return this.renderToInk(node);
  }
  
  private renderToInk(node: RenderNode): JSX.Element {
    switch (node.type) {
      case 'container':
        return (
          <Box {...this.mapToInkProps(node.props)}>
            {node.children?.map(child => this.renderToInk(child))}
          </Box>
        );
      case 'text':
        return <Text {...this.mapToInkProps(node.props)}>{node.props.content}</Text>;
      default:
        return <></>;
    }
  }

  private mapToInkProps(props: any): any {
    return {
      flexDirection: props.direction,
      justifyContent: props.justify,
      color: props.color,
      backgroundColor: props.backgroundColor,
      // ... other mappings
    };
  }
}

// Web Implementation
export class WebRenderAdapter extends RenderAdapter {
  render(node: RenderNode): JSX.Element {
    return this.renderToReact(node);
  }
  
  private renderToReact(node: RenderNode): JSX.Element {
    switch (node.type) {
      case 'container':
        return (
          <div style={this.mapToWebStyles(node.props)}>
            {node.children?.map(child => this.renderToReact(child))}
          </div>
        );
      case 'text':
        return (
          <span style={this.mapToWebStyles(node.props)}>
            {node.props.content}
          </span>
        );
      default:
        return <></>;
    }
  }

  private mapToWebStyles(props: any): React.CSSProperties {
    return {
      display: 'flex',
      flexDirection: props.direction === 'column' ? 'column' : 'row',
      justifyContent: props.justify,
      color: props.color,
      backgroundColor: props.backgroundColor,
      // ... other mappings
    };
  }
}
```

#### 1.3 Platform Service Abstraction

**Proposed Architecture:**
```typescript
// src/core/platform/PlatformService.ts
export interface PlatformCapabilities {
  hasFileSystem: boolean;
  hasClipboard: boolean;
  hasNotifications: boolean;
  canExitApplication: boolean;
  supportedExportFormats: string[];
}

export abstract class PlatformService {
  abstract getCapabilities(): PlatformCapabilities;
  abstract readFile(path: string): Promise<string>;
  abstract writeFile(path: string, content: string): Promise<void>;
  abstract copyToClipboard(text: string): Promise<void>;
  abstract showNotification(message: string, type?: 'info' | 'warning' | 'error'): Promise<void>;
  abstract exit(code?: number): void;
  abstract openExternalLink(url: string): Promise<void>;
}

// Terminal Implementation
export class TerminalPlatformService extends PlatformService {
  getCapabilities(): PlatformCapabilities {
    return {
      hasFileSystem: true,
      hasClipboard: true,
      hasNotifications: false,
      canExitApplication: true,
      supportedExportFormats: ['json', 'yaml', 'csv', 'xml', 'sql'],
    };
  }

  async readFile(path: string): Promise<string> {
    const fs = await import('fs/promises');
    return fs.readFile(path, 'utf-8');
  }

  async writeFile(path: string, content: string): Promise<void> {
    const fs = await import('fs/promises');
    await fs.writeFile(path, content, 'utf-8');
  }

  async copyToClipboard(text: string): Promise<void> {
    // Implementation using clipboardy or similar
  }

  exit(code = 0): void {
    process.exit(code);
  }
}

// Web Implementation
export class WebPlatformService extends PlatformService {
  getCapabilities(): PlatformCapabilities {
    return {
      hasFileSystem: false,
      hasClipboard: true,
      hasNotifications: true,
      canExitApplication: false,
      supportedExportFormats: ['json', 'yaml', 'csv', 'xml'], // No SQL in browser
    };
  }

  async readFile(path: string): Promise<string> {
    throw new Error('File system access not available in web context');
  }

  async writeFile(path: string, content: string): Promise<void> {
    // Trigger download
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = path;
    a.click();
    URL.revokeObjectURL(url);
  }

  async copyToClipboard(text: string): Promise<void> {
    await navigator.clipboard.writeText(text);
  }

  async showNotification(message: string, type = 'info'): Promise<void> {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(message);
    } else {
      // Fallback to in-app notification
      console.log(`${type.toUpperCase()}: ${message}`);
    }
  }

  exit(): void {
    // Web apps can't exit, maybe show a message or redirect
    console.log('Application exit requested (not supported in web context)');
  }
}
```

### Phase 2: Component Migration (Weeks 3-4)

#### 2.1 Abstract Component Base Classes

```typescript
// src/core/components/AbstractComponent.ts
export interface ComponentProps {
  style?: ComponentStyle;
  children?: React.ReactNode;
  className?: string;
}

export interface ComponentStyle {
  width?: number | string;
  height?: number | string;
  padding?: number | string;
  margin?: number | string;
  backgroundColor?: string;
  color?: string;
  border?: BorderStyle;
  borderRadius?: number;
}

export interface BorderStyle {
  width?: number;
  style?: 'solid' | 'dashed' | 'dotted';
  color?: string;
}

export abstract class AbstractComponent<T extends ComponentProps = ComponentProps> {
  constructor(protected renderManager: RenderManager) {}
  
  abstract render(props: T): RenderNode;
  
  protected createContainer(options: LayoutOptions): RenderNode {
    return this.renderManager.createLayout(options, []);
  }
  
  protected createText(content: string, style?: TextStyle): RenderNode {
    return {
      type: 'text',
      props: { content, ...style },
    };
  }
}
```

#### 2.2 Platform-Specific Component Implementations

```typescript
// Terminal Components
export class TerminalContainer extends AbstractComponent<ContainerProps> {
  render(props: ContainerProps): RenderNode {
    return {
      type: 'container',
      props: this.mapToInkProps(props),
      children: this.renderChildren(props.children),
    };
  }

  private mapToInkProps(props: ContainerProps): any {
    return {
      flexDirection: props.direction || 'column',
      justifyContent: props.justify,
      alignItems: props.align,
      width: props.style?.width,
      height: props.style?.height,
      // ... other Ink-specific mappings
    };
  }
}

// Web Components
export class WebContainer extends AbstractComponent<ContainerProps> {
  render(props: ContainerProps): RenderNode {
    return {
      type: 'container',
      props: this.mapToWebProps(props),
      children: this.renderChildren(props.children),
    };
  }

  private mapToWebProps(props: ContainerProps): React.CSSProperties {
    return {
      display: 'flex',
      flexDirection: props.direction === 'row' ? 'row' : 'column',
      justifyContent: props.justify,
      alignItems: props.align,
      width: props.style?.width,
      height: props.style?.height,
      padding: props.style?.padding,
      margin: props.style?.margin,
      backgroundColor: props.style?.backgroundColor,
      color: props.style?.color,
      border: this.formatBorder(props.style?.border),
      borderRadius: props.style?.borderRadius,
    };
  }
}
```

### Phase 3: Configuration System Enhancement (Week 5)

#### 3.1 Multi-Platform Configuration

```typescript
// src/core/config/ConfigSystem.ts
export abstract class ConfigAdapter {
  abstract load(): Promise<JsontConfig>;
  abstract save(config: JsontConfig): Promise<void>;
  abstract watch(callback: (config: JsontConfig) => void): void;
  abstract getDefaultPath(): string;
}

export class FileConfigAdapter extends ConfigAdapter {
  async load(): Promise<JsontConfig> {
    const configPath = this.getDefaultPath();
    try {
      const fs = await import('fs/promises');
      const content = await fs.readFile(configPath, 'utf-8');
      return yaml.parse(content) as JsontConfig;
    } catch (error) {
      return this.getDefaultConfig();
    }
  }

  async save(config: JsontConfig): Promise<void> {
    const configPath = this.getDefaultPath();
    const fs = await import('fs/promises');
    const content = yaml.stringify(config);
    await fs.writeFile(configPath, content, 'utf-8');
  }

  getDefaultPath(): string {
    const os = require('os');
    const path = require('path');
    return path.join(os.homedir(), '.config', 'jsont', 'config.yaml');
  }
}

export class WebConfigAdapter extends ConfigAdapter {
  private readonly STORAGE_KEY = 'jsont-config';

  async load(): Promise<JsontConfig> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as JsontConfig;
      }
    } catch (error) {
      console.warn('Failed to load config from localStorage:', error);
    }
    return this.getDefaultConfig();
  }

  async save(config: JsontConfig): Promise<void> {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Failed to save config to localStorage:', error);
      throw error;
    }
  }

  watch(callback: (config: JsontConfig) => void): void {
    window.addEventListener('storage', (e) => {
      if (e.key === this.STORAGE_KEY && e.newValue) {
        try {
          const config = JSON.parse(e.newValue) as JsontConfig;
          callback(config);
        } catch (error) {
          console.error('Failed to parse config from storage event:', error);
        }
      }
    });
  }

  getDefaultPath(): string {
    return 'localStorage';
  }
}

export class ConfigManager {
  constructor(private adapter: ConfigAdapter) {}
  
  async initialize(): Promise<JsontConfig> {
    return this.adapter.load();
  }

  async updateConfig(updates: Partial<JsontConfig>): Promise<void> {
    const current = await this.adapter.load();
    const updated = { ...current, ...updates };
    await this.adapter.save(updated);
  }

  watchChanges(callback: (config: JsontConfig) => void): void {
    this.adapter.watch(callback);
  }
}
```

### Phase 4: Web Application Implementation (Week 6)

#### 4.1 Web Application Structure

```typescript
// src/web/WebApp.tsx
export interface WebAppProps {
  initialData?: JsonValue;
  theme?: 'light' | 'dark';
}

export function WebApp({ initialData, theme = 'light' }: WebAppProps): JSX.Element {
  const [config, setConfig] = useState<JsontConfig>();
  const [platformService] = useState(() => new WebPlatformService());
  const [inputManager] = useState(() => new InputManager(new WebInputAdapter()));
  const [renderManager] = useState(() => new RenderManager(new WebRenderAdapter()));

  useEffect(() => {
    const configManager = new ConfigManager(new WebConfigAdapter());
    configManager.initialize().then(setConfig);
  }, []);

  if (!config) {
    return <div>Loading...</div>;
  }

  return (
    <div className={`jsont-web-app theme-${theme}`}>
      <PlatformProvider value={platformService}>
        <ConfigProvider value={config}>
          <RenderProvider value={renderManager}>
            <InputProvider value={inputManager}>
              <EngineProvider initialData={initialData}>
                <WebUIRouter />
              </EngineProvider>
            </InputProvider>
          </RenderProvider>
        </ConfigProvider>
      </PlatformProvider>
    </div>
  );
}

// Web-specific routing
function WebUIRouter(): JSX.Element {
  return (
    <div className="jsont-main-layout">
      <Header />
      <MainContent />
      <StatusBar />
    </div>
  );
}
```

#### 4.2 Web-Specific Styling

```css
/* src/web/styles/jsont-web.css */
.jsont-web-app {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 14px;
  line-height: 1.4;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.theme-light {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --text-primary: #333333;
  --text-secondary: #666666;
  --accent: #007acc;
  --border: #e0e0e0;
}

.theme-dark {
  --bg-primary: #1e1e1e;
  --bg-secondary: #2d2d2d;
  --text-primary: #ffffff;
  --text-secondary: #cccccc;
  --accent: #00d4ff;
  --border: #404040;
}

.jsont-main-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.jsont-tree-view {
  font-family: inherit;
  white-space: pre;
  overflow: auto;
  flex: 1;
}

.jsont-tree-line {
  padding: 2px 8px;
  cursor: pointer;
}

.jsont-tree-line:hover {
  background: var(--bg-secondary);
}

.jsont-tree-line.selected {
  background: var(--accent);
  color: white;
}

.jsont-search-input {
  padding: 8px;
  border: 1px solid var(--border);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-family: inherit;
}

.jsont-status-bar {
  background: var(--bg-secondary);
  border-top: 1px solid var(--border);
  padding: 4px 8px;
  font-size: 12px;
  display: flex;
  justify-content: space-between;
}
```

## Implementation Timeline

### Week 1-2: Foundation
- ✅ Input system abstraction
- ✅ Platform service abstraction  
- ✅ Basic rendering abstraction
- ✅ Terminal adapter implementations

### Week 3-4: Component Migration
- 🔄 Abstract component base classes
- 🔄 Migrate TreeView, SearchView, Settings
- 🔄 Platform-specific component implementations
- 🔄 Testing and validation

### Week 5: Configuration & Services
- 📋 Multi-platform configuration system
- 📋 Web storage adapter
- 📋 Enhanced platform capabilities

### Week 6: Web Implementation
- 📋 Web application structure
- 📋 Web adapters and components
- 📋 Styling and responsive design
- 📋 Testing and deployment prep

## Benefits

### Immediate Benefits
- **Better Architecture**: SOLID principles throughout
- **Improved Testability**: Complete isolation of business logic
- **Enhanced Maintainability**: Clear separation of concerns

### Web UI Benefits
- **Rapid Development**: 100% logic reuse
- **Feature Parity**: All terminal features in web
- **Consistent Behavior**: Same engines, same results
- **Shared Testing**: Test once, deploy everywhere

### Long-term Benefits
- **Mobile Support**: Same abstractions work for mobile
- **Desktop GUI**: Electron/Tauri integration ready
- **API Mode**: Headless JSON processing service
- **Plugin System**: Third-party UI implementations

## Migration Strategy

### Backward Compatibility
- All existing terminal functionality preserved
- No breaking changes to current APIs
- Gradual migration with feature flags
- Side-by-side development possible

### Risk Mitigation
- Extensive testing at each phase
- Feature flags for gradual rollout
- Rollback capability at any stage
- Comprehensive documentation

## Testing Strategy

### Multi-Platform Testing Approach

#### Unit Testing
- **Engine Tests**: All UI-agnostic engines (JsonEngine, TreeEngine, SearchEngine) tested independently
- **Adapter Tests**: Platform-specific adapters tested with mock implementations
- **Abstraction Tests**: Interface compliance and behavior consistency across platforms

#### Integration Testing
- **Cross-Platform Consistency**: Same test suites run against both terminal and web implementations
- **Input Event Testing**: Unified event handling tested across keyboard, mouse, and touch inputs
- **Rendering Consistency**: Output comparison between platform-specific rendering implementations

#### Platform-Specific Testing
- **Terminal Testing**: Existing Vitest test suite continues unchanged
- **Web Testing**: React Testing Library + jsdom for web component testing
- **Browser Testing**: Playwright for cross-browser compatibility

#### Testing Infrastructure
- **Shared Test Utilities**: Common test helpers for engine state validation
- **Mock Adapters**: Test-specific adapters for isolated testing
- **Performance Benchmarks**: Regression testing to ensure no performance degradation

## Success Metrics

- ✅ All existing tests continue to pass
- ✅ No performance degradation in terminal UI
- ✅ Web UI achieves feature parity within 6 weeks
- ✅ Clean architecture principles maintained
- ✅ Multi-platform deployment ready
- ✅ Cross-platform test coverage maintained at >95%
- ✅ Consistent behavior verified across all platforms

This refactoring strategy transforms jsont from a terminal-only application into a truly multi-platform JSON processing tool while maintaining its excellent architectural foundation and performance characteristics.