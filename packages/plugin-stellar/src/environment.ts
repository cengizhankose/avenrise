import { z } from "zod";
import type { IAgentRuntime } from "@elizaos/core";

const stellarConfigSchema = z.object({
    STELLAR_PRIVATE_KEY: z.string().min(1, "Stellar private key is required"),
    STELLAR_NETWORK: z.enum(["mainnet", "testnet"]).default("testnet"),
});

export type StellarConfig = z.infer<typeof stellarConfigSchema>;

export async function validateStellarConfig(
    runtime: IAgentRuntime
): Promise<StellarConfig> {
    try {
        const config = {
            STELLAR_PRIVATE_KEY:
                runtime.getSetting("STELLAR_PRIVATE_KEY") ||
                process.env.STELLAR_PRIVATE_KEY,
            STELLAR_NETWORK:
                runtime.getSetting("STELLAR_NETWORK") ||
                process.env.STELLAR_NETWORK ||
                "testnet",
        };

        return stellarConfigSchema.parse(config);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors
                .map((err) => `${err.path.join(".")}: ${err.message}`)
                .join("\n");
            throw new Error(
                `Stellar plugin configuration validation failed:\n${errorMessages}`
            );
        }
        throw error;
    }
}
