import { submitTransaction, checkCredits } from "./actions";
import { LaunchtubeService } from "./services/launchtubeService";

export const launchtubePlugin = {
    name: "launchtube",
    description: "Submit Stellar and Soroban transactions via Launchtube",
    actions: [submitTransaction, checkCredits],
    evaluators: [],
    providers: [],
    services: [new LaunchtubeService() as any],
    clients: [],
    adapters: [],
};

export default launchtubePlugin;

// Export individual components for granular usage
export * from "./actions";
export * from "./services";
export * from "./types";
export * from "./environment";
