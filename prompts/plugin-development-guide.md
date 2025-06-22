# GigabaldAI Plugin Development Guide

## Executive Summary

This document provides a comprehensive guide for developing plugins within the GigabaldAI ecosystem. Based on analysis of the existing plugin architecture, this guide covers the complete plugin development lifecycle from conception to deployment, including architectural patterns, best practices, and advanced development techniques.

---

## Table of Contents

1. [Plugin Architecture Overview](#plugin-architecture-overview)
2. [Core Plugin Components](#core-plugin-components)
3. [Plugin Development Patterns](#plugin-development-patterns)
4. [Step-by-Step Plugin Creation](#step-by-step-plugin-creation)
5. [Advanced Plugin Techniques](#advanced-plugin-techniques)
6. [Testing and Validation](#testing-and-validation)
7. [Deployment and Distribution](#deployment-and-distribution)
8. [Best Practices and Common Pitfalls](#best-practices-and-common-pitfalls)
9. [Plugin Examples and Templates](#plugin-examples-and-templates)

---

## Plugin Architecture Overview

### Core Plugin Interface

The GigabaldAI plugin system is built around a modular architecture that allows for extensible functionality through the `Plugin` interface:

```typescript
interface Plugin {
    name: string; // Unique identifier for the plugin
    description: string; // Brief description of plugin functionality
    config?: { [key: string]: any }; // Optional plugin configuration
    actions?: Action[]; // Custom behaviors the agent can perform
    providers?: Provider[]; // Context providers for message generation
    evaluators?: Evaluator[]; // Response assessment and reflection
    services?: Service[]; // Background services and API integrations
    clients?: Client[]; // Platform integrations (Discord, Twitter, etc.)
    adapters?: Adapter[]; // Database/cache adapters
}
```

### Plugin Loading Mechanism

Plugins are loaded and registered through a sophisticated system:

1. **Character File Integration**: Plugins are specified in character JSON files
2. **Dynamic Import**: Plugins are dynamically imported at runtime
3. **Registration**: Each plugin component is registered with the agent runtime
4. **Initialization**: Services and clients are initialized after registration

```typescript
// Plugin loading from character file
this.plugins.forEach((plugin) => {
    plugin.actions?.forEach((action) => this.registerAction(action));
    plugin.evaluators?.forEach((evaluator) =>
        this.registerEvaluator(evaluator)
    );
    plugin.services?.forEach((service) => this.registerService(service));
    plugin.providers?.forEach((provider) =>
        this.registerContextProvider(provider)
    );
    plugin.adapters?.forEach((adapter) => this.registerAdapter(adapter));
});
```

---

## Core Plugin Components

### 1. Actions

Actions define what the agent can do. They are triggered by message content and perform specific operations.

#### Action Interface Structure

```typescript
interface Action {
    name: string; // Unique action identifier (e.g., "SEND_TOKEN")
    similes: string[]; // Alternative names/triggers
    description: string; // Detailed description of the action
    validate: Validator; // Function to check if action can be executed
    handler: Handler; // Core implementation logic
    examples: ActionExample[][]; // Sample usage patterns
    suppressInitialMessage?: boolean; // Optional flag to suppress initial response
}
```

#### Action Implementation Pattern

```typescript
export const customAction: Action = {
    name: "CUSTOM_ACTION",
    similes: ["ALTERNATE_NAME", "OTHER_TRIGGER"],
    description: "Detailed description of when and how to use this action",

    validate: async (runtime: IAgentRuntime, message: Memory) => {
        // Validation logic - check permissions, configuration, etc.
        const hasRequiredConfig = runtime.getSetting("REQUIRED_API_KEY");
        return !!hasRequiredConfig;
    },

    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State,
        options?: any,
        callback?: HandlerCallback
    ) => {
        try {
            // Core action logic
            const result = await performOperation(runtime, message);

            // Provide feedback via callback
            if (callback) {
                callback({
                    text: `Operation completed successfully: ${result}`,
                    content: { success: true, data: result },
                });
            }

            return true;
        } catch (error) {
            if (callback) {
                callback({
                    text: `Error: ${error.message}`,
                    content: { error: error.message },
                });
            }
            return false;
        }
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "Trigger message example" },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Response example",
                    action: "CUSTOM_ACTION",
                },
            },
        ],
    ],
};
```

### 2. Providers

Providers inject contextual information into the agent's state for better decision-making.

#### Provider Interface

```typescript
interface Provider {
    get: (
        runtime: IAgentRuntime,
        message: Memory,
        state?: State
    ) => Promise<string>;
}
```

#### Provider Implementation Example

```typescript
export const customProvider: Provider = {
    get: async (runtime: IAgentRuntime, message: Memory, state?: State) => {
        try {
            // Gather contextual information
            const contextData = await fetchContextualData(runtime, message);

            // Format for injection into agent context
            return `Relevant context: ${contextData.summary}`;
        } catch (error) {
            elizaLogger.error("Provider error:", error);
            return "";
        }
    },
};
```

### 3. Evaluators

Evaluators assess agent responses and extract information for learning and improvement.

#### Evaluator Implementation Pattern

```typescript
export const customEvaluator: Evaluator = {
    name: "CUSTOM_EVALUATOR",
    similes: ["ALT_EVALUATOR"],
    description: "Evaluates specific aspects of conversation",

    validate: async (runtime: IAgentRuntime, message: Memory) => {
        // Determine when to run this evaluator
        const messageCount = await runtime.messageManager.countMemories(
            message.roomId
        );
        return messageCount % 5 === 0; // Run every 5 messages
    },

    handler: async (runtime: IAgentRuntime, message: Memory) => {
        // Analysis and extraction logic
        const analysis = await analyzeConversation(runtime, message);

        // Store results or trigger actions based on evaluation
        await storeEvaluationResults(runtime, analysis);

        return analysis;
    },

    examples: [
        // Example evaluation scenarios
    ],
};
```

### 4. Services

Services provide background functionality and API integrations.

#### Service Implementation Pattern

```typescript
export class CustomService extends Service {
    static serviceType: ServiceType = ServiceType.CUSTOM;

    private client?: CustomAPIClient;

    async initialize(runtime: IAgentRuntime): Promise<void> {
        const apiKey = runtime.getSetting("CUSTOM_API_KEY");
        if (!apiKey) {
            throw new Error("CUSTOM_API_KEY is not configured");
        }

        this.client = new CustomAPIClient(apiKey);
    }

    getInstance(): CustomService {
        return CustomService.getInstance();
    }

    async performOperation(data: any): Promise<any> {
        if (!this.client) {
            throw new Error("Service not initialized");
        }

        return await this.client.operation(data);
    }
}
```

---

## Plugin Development Patterns

### 1. Simple Plugin Pattern

For basic functionality without external dependencies:

```typescript
// src/index.ts
import type { Plugin } from "@elizaos/core";
import { simpleAction } from "./actions/simpleAction";
import { simpleProvider } from "./providers/simpleProvider";

export const simplePlugin: Plugin = {
    name: "simple-plugin",
    description: "A simple plugin example",
    actions: [simpleAction],
    providers: [simpleProvider],
    evaluators: [],
    services: [],
};

export default simplePlugin;
```

### 2. Service-Integrated Plugin Pattern

For plugins requiring external API integration:

```typescript
// src/index.ts
import type { Plugin } from "@elizaos/core";
import { apiAction } from "./actions/apiAction";
import { APIService } from "./services/apiService";

export const apiPlugin: Plugin = {
    name: "api-plugin",
    description: "Plugin with external API integration",
    actions: [apiAction],
    services: [new APIService()],
    evaluators: [],
    providers: [],
};

export default apiPlugin;
```

### 3. Complex Multi-Component Plugin Pattern

For comprehensive plugins with multiple components:

```typescript
// src/index.ts
import type { Plugin } from "@elizaos/core";
import * as actions from "./actions";
import * as providers from "./providers";
import * as evaluators from "./evaluators";
import { ComplexService } from "./services/complexService";

export const complexPlugin: Plugin = {
    name: "complex-plugin",
    description: "Comprehensive plugin with multiple components",
    actions: Object.values(actions),
    providers: Object.values(providers),
    evaluators: Object.values(evaluators),
    services: [new ComplexService()],
};

export default complexPlugin;
```

---

## Step-by-Step Plugin Creation

### Step 1: Project Setup

1. **Create Plugin Directory**

```bash
mkdir packages/plugin-your-name
cd packages/plugin-your-name
```

2. **Initialize Package Configuration**

```json
// package.json
{
    "name": "@elizaos/plugin-your-name",
    "version": "0.1.0",
    "type": "module",
    "main": "dist/index.js",
    "module": "dist/index.js",
    "types": "dist/index.d.ts",
    "exports": {
        "./package.json": "./package.json",
        ".": {
            "import": {
                "@elizaos/source": "./src/index.ts",
                "types": "./dist/index.d.ts",
                "default": "./dist/index.js"
            }
        }
    },
    "files": ["dist"],
    "dependencies": {
        "@elizaos/core": "workspace:*",
        "tsup": "8.3.5"
    },
    "scripts": {
        "build": "tsup --format esm --dts",
        "dev": "tsup --format esm --dts --watch",
        "test": "vitest run"
    },
    "publishConfig": {
        "access": "public"
    }
}
```

3. **TypeScript Configuration**

```json
// tsconfig.json
{
    "extends": "../core/tsconfig.json",
    "compilerOptions": {
        "outDir": "dist",
        "rootDir": "src",
        "types": ["node"]
    },
    "include": ["src/**/*.ts"]
}
```

### Step 2: Create Directory Structure

```
src/
├── index.ts              # Main plugin export
├── actions/              # Action implementations
│   ├── index.ts         # Action exports
│   └── yourAction.ts    # Individual actions
├── providers/            # Provider implementations
│   ├── index.ts         # Provider exports
│   └── yourProvider.ts  # Individual providers
├── evaluators/           # Evaluator implementations
│   ├── index.ts         # Evaluator exports
│   └── yourEvaluator.ts # Individual evaluators
├── services/             # Service implementations
│   └── yourService.ts   # Service classes
├── types/               # Type definitions
│   └── index.ts         # Plugin-specific types
├── utils/               # Utility functions
│   └── helpers.ts       # Helper functions
└── environment.ts       # Environment validation
```

### Step 3: Implement Core Components

1. **Environment Validation**

```typescript
// src/environment.ts
import { z } from "zod";
import type { IAgentRuntime } from "@elizaos/core";

const configSchema = z.object({
    API_KEY: z.string().min(1, "API key is required"),
    ENDPOINT_URL: z.string().url().optional(),
});

export type PluginConfig = z.infer<typeof configSchema>;

export async function validateConfig(
    runtime: IAgentRuntime
): Promise<PluginConfig> {
    try {
        const config = {
            API_KEY:
                runtime.getSetting("YOUR_API_KEY") || process.env.YOUR_API_KEY,
            ENDPOINT_URL:
                runtime.getSetting("YOUR_ENDPOINT") ||
                process.env.YOUR_ENDPOINT,
        };

        return configSchema.parse(config);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join("\n");
            throw new Error(
                `Plugin configuration validation failed:\n${errorMessages}`
            );
        }
        throw error;
    }
}
```

2. **Action Implementation**

```typescript
// src/actions/yourAction.ts
import {
    type Action,
    type ActionExample,
    type IAgentRuntime,
    type Memory,
    type State,
    type HandlerCallback,
    elizaLogger,
    composeContext,
    generateObject,
    ModelClass,
} from "@elizaos/core";
import { validateConfig } from "../environment";

export const yourAction: Action = {
    name: "YOUR_ACTION",
    similes: ["ALTERNATIVE_NAME"],
    description: "Description of what this action does",

    validate: async (runtime: IAgentRuntime, message: Memory) => {
        try {
            await validateConfig(runtime);
            return true;
        } catch (error) {
            elizaLogger.error("Action validation failed:", error);
            return false;
        }
    },

    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: any,
        callback?: HandlerCallback
    ) => {
        elizaLogger.log("Starting YOUR_ACTION handler...");

        try {
            const config = await validateConfig(runtime);

            // Implement your action logic here
            const result = await performYourOperation(config, message);

            if (callback) {
                callback({
                    text: `Operation completed: ${result}`,
                    content: { success: true, data: result },
                });
            }

            return true;
        } catch (error) {
            elizaLogger.error("Action handler error:", error);

            if (callback) {
                callback({
                    text: `Error: ${error.message}`,
                    content: { error: error.message },
                });
            }

            return false;
        }
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "Please perform the operation" },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll perform that operation for you",
                    action: "YOUR_ACTION",
                },
            },
        ],
    ],
};

async function performYourOperation(
    config: any,
    message: Memory
): Promise<string> {
    // Implement your core logic here
    return "Operation result";
}
```

### Step 4: Plugin Assembly

```typescript
// src/index.ts
import type { Plugin } from "@elizaos/core";
import { yourAction } from "./actions/yourAction";
import { yourProvider } from "./providers/yourProvider";
import { yourEvaluator } from "./evaluators/yourEvaluator";
import { YourService } from "./services/yourService";

export const yourPlugin: Plugin = {
    name: "your-plugin",
    description: "Your plugin description",
    actions: [yourAction],
    providers: [yourProvider],
    evaluators: [yourEvaluator],
    services: [new YourService()],
};

export default yourPlugin;

// Export individual components for granular usage
export * from "./actions";
export * from "./providers";
export * from "./evaluators";
export * from "./services";
export * from "./types";
```

---

## Advanced Plugin Techniques

### 1. State Management

Plugins can maintain state across interactions:

```typescript
class StatefulPlugin {
    private state = new Map<string, any>();

    setState(key: string, value: any): void {
        this.state.set(key, value);
    }

    getState(key: string): any {
        return this.state.get(key);
    }

    clearState(): void {
        this.state.clear();
    }
}
```

### 2. Inter-Plugin Communication

Plugins can communicate through the runtime:

```typescript
// Plugin A saves data
runtime.cacheManager.set("shared-data", data);

// Plugin B retrieves data
const sharedData = await runtime.cacheManager.get("shared-data");
```

### 3. Dynamic Action Registration

Actions can be registered conditionally:

```typescript
export const conditionalPlugin: Plugin = {
    name: "conditional-plugin",
    description: "Plugin with conditional actions",
    get actions() {
        const actions = [baseAction];

        if (process.env.ENABLE_ADVANCED_FEATURES === "true") {
            actions.push(advancedAction);
        }

        return actions;
    },
};
```

### 4. Template Customization

Plugins can provide custom templates:

```typescript
const customTemplate = `
# Custom Context
{{customContext}}

# Task
Perform custom operation based on:
{{userRequest}}

Response format: JSON
`;

// Use in action handler
const context = composeContext({
    state,
    template: customTemplate,
});
```

### 5. Error Handling Patterns

Comprehensive error handling:

```typescript
class PluginError extends Error {
    constructor(message: string, public code: string, public details?: any) {
        super(message);
        this.name = "PluginError";
    }
}

// Usage in action
try {
    await riskyOperation();
} catch (error) {
    if (error instanceof PluginError) {
        // Handle plugin-specific errors
        elizaLogger.error(`Plugin error ${error.code}:`, error.message);
    } else {
        // Handle generic errors
        elizaLogger.error("Unexpected error:", error);
    }
    throw new PluginError("Operation failed", "OPERATION_ERROR", error);
}
```

---

## Testing and Validation

### 1. Unit Testing Setup

```typescript
// __tests__/yourAction.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { yourAction } from "../src/actions/yourAction";
import type { IAgentRuntime, Memory } from "@elizaos/core";

describe("yourAction", () => {
    let mockRuntime: IAgentRuntime;
    let mockMessage: Memory;

    beforeEach(() => {
        mockRuntime = {
            getSetting: vi.fn().mockReturnValue("mock-api-key"),
            agentId: "test-agent",
            // ... other mock properties
        } as unknown as IAgentRuntime;

        mockMessage = {
            id: "test-message",
            content: { text: "test message" },
            userId: "test-user",
            roomId: "test-room",
        } as Memory;
    });

    it("should validate successfully with proper config", async () => {
        const isValid = await yourAction.validate(mockRuntime, mockMessage);
        expect(isValid).toBe(true);
    });

    it("should handle action execution", async () => {
        const mockCallback = vi.fn();
        const result = await yourAction.handler(
            mockRuntime,
            mockMessage,
            {} as any,
            {},
            mockCallback
        );

        expect(result).toBe(true);
        expect(mockCallback).toHaveBeenCalled();
    });
});
```

### 2. Integration Testing

```typescript
// __tests__/integration.test.ts
import { describe, it, expect } from "vitest";
import { AgentRuntime } from "@elizaos/core";
import { yourPlugin } from "../src";

describe("Plugin Integration", () => {
    it("should register plugin components correctly", async () => {
        const runtime = new AgentRuntime({
            // ... runtime config
            plugins: [yourPlugin],
        });

        await runtime.initialize();

        // Verify actions are registered
        expect(runtime.actions).toContainEqual(
            expect.objectContaining({ name: "YOUR_ACTION" })
        );
    });
});
```

### 3. End-to-End Testing

```typescript
// __tests__/e2e.test.ts
import { describe, it, expect } from "vitest";
import { runAiTest } from "@elizaos/core/test_resources";

describe("Plugin E2E", () => {
    it("should perform complete action flow", async () => {
        const result = await runAiTest({
            messages: [
                {
                    user: "user1",
                    content: { text: "trigger your action" },
                },
            ],
            expected: "Operation completed",
            character: {
                // ... character config with your plugin
                plugins: [yourPlugin],
            },
        });

        expect(result.success).toBe(true);
    });
});
```

---

## Deployment and Distribution

### 1. Build Configuration

```typescript
// tsup.config.ts
import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/index.ts"],
    format: ["esm"],
    dts: true,
    clean: true,
    sourcemap: true,
    minify: false,
    external: ["@elizaos/core"],
});
```

### 2. Package Publishing

```bash
# Build the plugin
pnpm build

# Test locally
pnpm link

# Publish to npm
npm publish --access public
```

### 3. Character Integration

```json
// character.json
{
    "name": "Your Agent",
    "plugins": ["@elizaos/plugin-your-name"],
    "settings": {
        "secrets": {
            "YOUR_API_KEY": "your-api-key-here"
        }
    }
}
```

### 4. Environment Configuration

```bash
# .env
YOUR_API_KEY=your-api-key
YOUR_ENDPOINT=https://api.example.com
```

---

## Best Practices and Common Pitfalls

### Best Practices

1. **Modularity**: Keep plugins focused on specific functionality
2. **Error Handling**: Implement comprehensive error handling with meaningful messages
3. **Validation**: Always validate inputs and configuration
4. **Documentation**: Provide clear documentation and examples
5. **Testing**: Include comprehensive tests for all functionality
6. **Security**: Never hardcode secrets; use environment variables
7. **Performance**: Optimize for memory usage and execution speed
8. **Logging**: Use structured logging for debugging and monitoring

### Common Pitfalls

1. **Missing Validation**: Not validating configuration or inputs
2. **Poor Error Handling**: Throwing generic errors without context
3. **Memory Leaks**: Not cleaning up resources or event listeners
4. **Blocking Operations**: Using synchronous operations in async contexts
5. **Hardcoded Values**: Embedding configuration in code instead of using settings
6. **Insufficient Testing**: Not testing error conditions and edge cases
7. **Circular Dependencies**: Creating dependency cycles between plugins

### Security Considerations

1. **Secret Management**: Store sensitive data in environment variables
2. **Input Validation**: Sanitize and validate all user inputs
3. **API Security**: Use proper authentication and rate limiting
4. **Access Control**: Implement user authorization checks
5. **Data Privacy**: Handle user data in compliance with privacy regulations

---

## Plugin Examples and Templates

### Minimal Plugin Template

```typescript
// Minimal plugin with single action
import type { Plugin } from "@elizaos/core";

const minimalAction = {
    name: "MINIMAL_ACTION",
    similes: [],
    description: "A minimal action example",
    validate: async () => true,
    handler: async () => {
        console.log("Minimal action executed");
        return true;
    },
    examples: [],
};

export const minimalPlugin: Plugin = {
    name: "minimal-plugin",
    description: "Minimal plugin example",
    actions: [minimalAction],
};
```

### API Integration Template

```typescript
// Plugin with external API integration
import type { Plugin } from "@elizaos/core";

class APIService extends Service {
    static serviceType = ServiceType.API;
    private client?: any;

    async initialize(runtime: IAgentRuntime): Promise<void> {
        const apiKey = runtime.getSetting("API_KEY");
        this.client = new APIClient(apiKey);
    }

    async callAPI(data: any): Promise<any> {
        return await this.client.call(data);
    }
}

const apiAction = {
    name: "API_ACTION",
    similes: ["CALL_API"],
    description: "Makes API calls",
    validate: async (runtime) => !!runtime.getSetting("API_KEY"),
    handler: async (runtime, message, state, options, callback) => {
        const service = runtime.getService(ServiceType.API);
        const result = await service.callAPI(message.content.text);
        callback?.({ text: `API result: ${result}` });
        return true;
    },
    examples: [],
};

export const apiPlugin: Plugin = {
    name: "api-plugin",
    description: "API integration plugin",
    actions: [apiAction],
    services: [new APIService()],
};
```

### Blockchain Integration Template

```typescript
// Blockchain plugin template
import type { Plugin } from "@elizaos/core";

const transferAction = {
    name: "TRANSFER_TOKEN",
    similes: ["SEND_TOKEN", "PAY"],
    description: "Transfer tokens on blockchain",

    validate: async (runtime, message) => {
        const privateKey = runtime.getSetting("WALLET_PRIVATE_KEY");
        return !!privateKey;
    },

    handler: async (runtime, message, state, options, callback) => {
        try {
            // Extract transfer details from message
            const { recipient, amount, token } = extractTransferInfo(message);

            // Perform blockchain transaction
            const txHash = await performTransfer(recipient, amount, token);

            callback?.({
                text: `Transfer completed! Transaction: ${txHash}`,
                content: { txHash, recipient, amount, token },
            });

            return true;
        } catch (error) {
            callback?.({
                text: `Transfer failed: ${error.message}`,
                content: { error: error.message },
            });
            return false;
        }
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "Send 100 USDC to alice.eth" },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll send 100 USDC to alice.eth",
                    action: "TRANSFER_TOKEN",
                },
            },
        ],
    ],
};

export const blockchainPlugin: Plugin = {
    name: "blockchain-plugin",
    description: "Blockchain transaction plugin",
    actions: [transferAction],
};
```

---

## Conclusion

This comprehensive guide provides the foundation for developing robust, scalable plugins for the GigabaldAI ecosystem. By following these patterns and best practices, developers can create plugins that integrate seamlessly with the agent runtime while providing powerful new capabilities.

Remember to:

-   Start with simple implementations and gradually add complexity
-   Test thoroughly at each development stage
-   Follow security best practices for handling sensitive data
-   Document your plugin comprehensively for future maintainers
-   Contribute back to the community by sharing useful plugins

For additional support and examples, refer to the existing plugins in the GigabaldAI repository and the community resources available through the ElizaOS ecosystem.
