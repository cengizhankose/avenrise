import { elizaLogger } from "@elizaos/core";
import fetch from "cross-fetch";
import type {
    ILaunchtubeService,
    LaunchtubeSubmissionRequest,
    LaunchtubeSubmissionResponse,
    LaunchtubeCreditsResponse,
    LaunchtubeGenerateTokensRequest,
    LaunchtubeGenerateTokensResponse,
} from "../types";
import {
    validateLaunchtubeConfig,
    type LaunchtubeConfig,
} from "../environment";

export class LaunchtubeService {
    private static instance: LaunchtubeService | null = null;
    private config?: LaunchtubeConfig;
    private runtime?: any;

    static getInstance(): LaunchtubeService {
        if (!LaunchtubeService.instance) {
            LaunchtubeService.instance = new LaunchtubeService();
        }
        return LaunchtubeService.instance;
    }

    async initialize(runtime?: any): Promise<void> {
        if (runtime) {
            this.runtime = runtime;
            this.config = await validateLaunchtubeConfig(runtime);
            elizaLogger.log("LaunchtubeService initialized with config:", {
                baseUrl: this.config.LAUNCHTUBE_BASE_URL,
                network: this.config.STELLAR_NETWORK,
            });
        }
    }

    getInstance(): LaunchtubeService {
        return LaunchtubeService.getInstance();
    }

    private async makeRequest(
        endpoint: string,
        options: {
            method?: string;
            body?: string;
            headers?: Record<string, string>;
        } = {}
    ): Promise<Response> {
        if (!this.config) {
            throw new Error("LaunchtubeService not initialized");
        }

        const url = `${this.config.LAUNCHTUBE_BASE_URL}${endpoint}`;
        const headers = {
            Authorization: `Bearer ${this.config.LAUNCHTUBE_API_KEY}`,
            ...options.headers,
        };

        elizaLogger.log(`Making Launchtube request to: ${url}`);

        const response = await fetch(url, {
            method: options.method || "GET",
            headers,
            body: options.body,
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `Launchtube API error (${response.status}): ${errorText}`
            );
        }

        return response;
    }

    async submitTransaction(
        request: LaunchtubeSubmissionRequest
    ): Promise<LaunchtubeSubmissionResponse> {
        try {
            elizaLogger.log("Submitting transaction to Launchtube:", request);

            const body = new URLSearchParams();

            if (request.xdr) {
                body.append("xdr", request.xdr);
            }

            if (request.func) {
                body.append("func", request.func);
            }

            if (request.auth) {
                request.auth.forEach((authEntry) => {
                    body.append("auth[]", authEntry);
                });
            }

            if (request.sim !== undefined) {
                body.append("sim", request.sim.toString());
            }

            const response = await this.makeRequest("/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: body.toString(),
            });

            const result = await response.json();
            const creditsRemaining = response.headers.get(
                "X-Credits-Remaining"
            );

            elizaLogger.log("Transaction submitted successfully:", {
                result,
                creditsRemaining,
            });

            return {
                status: "success",
                tx: result.tx || result.hash,
                details: {
                    ...result,
                    creditsRemaining,
                },
            };
        } catch (error) {
            elizaLogger.error("Failed to submit transaction:", error);
            return {
                status: "error",
                error: error.message,
            };
        }
    }

    async checkCredits(): Promise<LaunchtubeCreditsResponse> {
        try {
            elizaLogger.log(
                "Requesting credits from Launchtube /info endpoint..."
            );
            const response = await this.makeRequest("/info");
            const responseText = await response.text();

            elizaLogger.log("Raw credits response from Launchtube:", {
                responseText: responseText,
                type: typeof responseText,
                length: responseText.length,
                trimmed: responseText.trim(),
            });

            // Parse JSON response to extract credits
            const parsed = JSON.parse(responseText.trim());
            elizaLogger.log("Parsed JSON response:", parsed);

            // Extract credits as string for consistent interface
            const credits = parsed.credits?.toString() || "0";

            elizaLogger.log("Extracted credits:", {
                credits,
                activated: parsed.activated,
            });

            return { credits };
        } catch (error) {
            elizaLogger.error("Failed to check credits:", error);
            throw error;
        }
    }

    async activateToken(token: string): Promise<void> {
        try {
            elizaLogger.log("Activating token");

            const body = new URLSearchParams();
            body.append("token", token);

            await this.makeRequest("/activate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: body.toString(),
            });

            elizaLogger.log("Token activated successfully");
        } catch (error) {
            elizaLogger.error("Failed to activate token:", error);
            throw error;
        }
    }

    async claimToken(code: string): Promise<string> {
        try {
            elizaLogger.log("Claiming token with code");

            const body = new URLSearchParams();
            body.append("code", code);

            const response = await this.makeRequest("/claim", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: body.toString(),
            });

            const html = await response.text();

            // Extract token from HTML response (this is a simplified approach)
            // In a real implementation, you might want to parse the HTML more carefully
            const tokenMatch = html.match(/token["\s]*[:=]["\s]*([^"'\s]+)/i);
            if (!tokenMatch) {
                throw new Error("Could not extract token from claim response");
            }

            const token = tokenMatch[1];
            elizaLogger.log("Token claimed successfully");

            return token;
        } catch (error) {
            elizaLogger.error("Failed to claim token:", error);
            throw error;
        }
    }

    async generateTokens(
        request: LaunchtubeGenerateTokensRequest
    ): Promise<LaunchtubeGenerateTokensResponse> {
        try {
            elizaLogger.log("Generating tokens:", request);

            const url = new URL("/gen", this.config!.LAUNCHTUBE_BASE_URL);
            url.searchParams.set("ttl", request.ttl.toString());
            url.searchParams.set("credits", request.credits.toString());
            url.searchParams.set("count", request.count.toString());

            const response = await fetch(url.toString(), {
                headers: {
                    Authorization: `Bearer ${this.config!.LAUNCHTUBE_API_KEY}`,
                },
            });

            if (!response.ok) {
                throw new Error(
                    `Failed to generate tokens: ${response.status}`
                );
            }

            const tokens = await response.json();

            elizaLogger.log(`Generated ${tokens.length} tokens`);

            return { tokens };
        } catch (error) {
            elizaLogger.error("Failed to generate tokens:", error);
            throw error;
        }
    }
}
