import type { Plugin } from "@elizaos/core";
import { checkBalance } from "./actions/checkBalance";
import { sendXLM } from "./actions/sendXLM";

export const stellarPlugin: Plugin = {
    name: "stellar",
    description:
        "Stellar blockchain plugin for wallet integration, balance checking, and XLM transfers",
    actions: [checkBalance, sendXLM],
    evaluators: [],
    providers: [],
    services: [],
};

export default stellarPlugin;

// Export individual components for granular usage
export * from "./actions/checkBalance";
export * from "./actions/sendXLM";
export * from "./environment";
