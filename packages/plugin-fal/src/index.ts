import type { Plugin } from "@elizaos/core";
import * as actions from "./actions";
import { FalService } from "./services/falService";

export const falPlugin: Plugin = {
    name: "fal",
    description:
        "Image and video generation using fal.ai API with detailed pose descriptions",
    actions: Object.values(actions),
    evaluators: [],
    providers: [],
    services: [new FalService()],
    clients: [],
    adapters: [],
};

export default falPlugin;

// Export individual components for granular usage
export * from "./actions";
export * from "./services/falService";
export * from "./types";
export * from "./environment";
