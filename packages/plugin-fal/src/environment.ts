import { z } from "zod";
import type { IAgentRuntime } from "@elizaos/core";

const configSchema = z.object({
    FAL_API_KEY: z.string().min(1, "FAL API key is required"),
    FAL_IMAGE_MODEL: z.string().min(1, "FAL image model is required"),
    FAL_VIDEO_MODEL: z.string().min(1, "FAL video model is required"),
});

export type FalConfig = z.infer<typeof configSchema>;

export async function validateFalConfig(
    runtime: IAgentRuntime
): Promise<FalConfig> {
    try {
        const config = {
            FAL_API_KEY:
                runtime.getSetting("FAL_API_KEY") || process.env.FAL_API_KEY,
            FAL_IMAGE_MODEL:
                runtime.getSetting("FAL_IMAGE_MODEL") ||
                process.env.FAL_IMAGE_MODEL ||
                "fal-ai/flux/schnell",
            FAL_VIDEO_MODEL:
                runtime.getSetting("FAL_VIDEO_MODEL") ||
                process.env.FAL_VIDEO_MODEL ||
                "fal-ai/luma-dream-machine",
        };

        return configSchema.parse(config);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join("\n");
            throw new Error(
                `FAL plugin configuration validation failed:\n${errorMessages}`
            );
        }
        throw error;
    }
}
