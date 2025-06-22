import { z } from "zod";
import type { IAgentRuntime } from "@elizaos/core";

const launchtubeConfigSchema = z.object({
    LAUNCHTUBE_API_KEY: z.string().min(1, "Launchtube API key is required"),
    LAUNCHTUBE_BASE_URL: z
        .string()
        .url()
        .default("https://testnet.launchtube.xyz"),
    STELLAR_NETWORK: z.enum(["testnet", "mainnet"]).default("testnet"),
});

export type LaunchtubeConfig = z.infer<typeof launchtubeConfigSchema>;

export async function validateLaunchtubeConfig(
    runtime: IAgentRuntime
): Promise<LaunchtubeConfig> {
    try {
        const config = {
            LAUNCHTUBE_API_KEY:
                runtime.getSetting("LAUNCHTUBE_API_KEY") ||
                process.env.LAUNCHTUBE_API_KEY,
            LAUNCHTUBE_BASE_URL:
                runtime.getSetting("LAUNCHTUBE_BASE_URL") ||
                process.env.LAUNCHTUBE_BASE_URL ||
                "https://testnet.launchtube.xyz",
            STELLAR_NETWORK:
                runtime.getSetting("STELLAR_NETWORK") ||
                process.env.STELLAR_NETWORK ||
                "testnet",
        };

        return launchtubeConfigSchema.parse(config);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join("\n");
            throw new Error(
                `Launchtube plugin configuration validation failed:\n${errorMessages}`
            );
        }
        throw error;
    }
}
