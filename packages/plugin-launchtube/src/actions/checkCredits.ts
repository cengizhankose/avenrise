import {
    type Action,
    type ActionExample,
    type IAgentRuntime,
    type Memory,
    type State,
    type HandlerCallback,
    elizaLogger,
} from "@elizaos/core";
import { validateLaunchtubeConfig } from "../environment";
import { LaunchtubeService } from "../services/launchtubeService";

export const checkCredits: Action = {
    name: "CHECK_LAUNCHTUBE_CREDITS",
    similes: [
        "LAUNCHTUBE_CREDITS",
        "CHECK_BALANCE",
        "CREDITS_REMAINING",
        "LAUNCHTUBE_BALANCE",
        "STELLAR_CREDITS",
    ],
    description: "Check remaining credits in Launchtube account",

    validate: async (runtime: IAgentRuntime, message: Memory) => {
        try {
            await validateLaunchtubeConfig(runtime);
            return true;
        } catch (error) {
            elizaLogger.error("Launchtube validation failed:", error);
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
        elizaLogger.log("Starting CHECK_LAUNCHTUBE_CREDITS handler...");

        try {
            // Get Launchtube service
            const launchtubeService = new LaunchtubeService();
            await launchtubeService.initialize(runtime);

            // Check credits
            const result = await launchtubeService.checkCredits();

            elizaLogger.log("Processing credits response in action:", {
                resultCredits: result.credits,
                resultType: typeof result.credits,
            });

            // Parse credits with better error handling
            const creditsString = result.credits;
            const credits = parseInt(creditsString, 10);

            elizaLogger.log("Credits parsing result:", {
                creditsString,
                credits,
                isNaN: isNaN(credits),
            });

            const creditsInXLM = isNaN(credits) ? 0 : credits / 10000000; // Convert stroops to XLM

            // Prepare response text based on parsing success
            let responseText: string;
            if (isNaN(credits)) {
                responseText =
                    `💰 Launchtube Credits Status:\n\n` +
                    `⚠️ Unable to parse credits response: "${creditsString}"\n` +
                    `Raw response type: ${typeof creditsString}\n\n` +
                    `Please check your Launchtube API configuration.`;
            } else {
                responseText =
                    `💰 Launchtube Credits Status:\n\n` +
                    `Credits: ${credits.toLocaleString()} stroops\n` +
                    `Equivalent: ${creditsInXLM.toFixed(7)} XLM\n` +
                    `Status: ${
                        credits > 0
                            ? "✅ Ready for transactions"
                            : "⚠️ Low credits"
                    }\n\n` +
                    `You can use these credits to submit transactions via Launchtube.`;
            }

            callback?.({
                text: responseText,
                content: {
                    action: "CHECK_LAUNCHTUBE_CREDITS",
                    success: !isNaN(credits),
                    credits: credits,
                    creditsInXLM: creditsInXLM,
                    creditsString: result.credits,
                    parsingError: isNaN(credits),
                },
            });

            return true;
        } catch (error) {
            elizaLogger.error("Check credits handler error:", error);

            callback?.({
                text: `❌ Error checking credits: ${error.message}`,
                content: {
                    action: "CHECK_LAUNCHTUBE_CREDITS",
                    success: false,
                    error: error.message,
                },
            });

            return false;
        }
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "How many credits do I have left in Launchtube?",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Let me check your Launchtube credits for you",
                    action: "CHECK_LAUNCHTUBE_CREDITS",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Check my Launchtube balance",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll check your Launchtube account balance",
                    action: "CHECK_LAUNCHTUBE_CREDITS",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "What's my remaining Stellar credits?",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll check your remaining Stellar credits in Launchtube",
                    action: "CHECK_LAUNCHTUBE_CREDITS",
                },
            },
        ],
    ],
};
