import {
    Service,
    type IAgentRuntime,
    ServiceType,
    elizaLogger,
} from "@elizaos/core";
import * as fal from "@fal-ai/serverless-client";
import { validateFalConfig, type FalConfig } from "../environment";
import type {
    ImageGenerationRequest,
    ImageGenerationResponse,
    VideoGenerationRequest,
    VideoGenerationResponse,
} from "../types";

export class FalService extends Service {
    private config: FalConfig | null = null;

    static get serviceType(): ServiceType {
        return ServiceType.IMAGE_DESCRIPTION;
    }

    async initialize(runtime: IAgentRuntime): Promise<void> {
        try {
            this.config = await validateFalConfig(runtime);

            // Configure the fal client with the API key
            fal.config({
                credentials: this.config.FAL_API_KEY,
            });

            elizaLogger.log("FAL service initialized successfully");
        } catch (error) {
            elizaLogger.error("Failed to initialize FAL service:", error);
            throw error;
        }
    }

    getInstance(): FalService {
        return FalService.getInstance();
    }

    async generateImage(
        request: ImageGenerationRequest
    ): Promise<ImageGenerationResponse> {
        if (!this.config) {
            throw new Error("FAL service not initialized");
        }

        try {
            elizaLogger.log("Generating image with FAL:", request.prompt);

            const result = await fal.subscribe(this.config.FAL_IMAGE_MODEL, {
                input: {
                    prompt: request.prompt,
                    image_size: request.image_size || "landscape_4_3",
                    num_inference_steps: request.num_inference_steps || 4,
                    guidance_scale: request.guidance_scale || 3.5,
                    num_images: request.num_images || 1,
                    seed: request.seed,
                },
                logs: true,
                onQueueUpdate: (update) => {
                    if (update.status === "IN_PROGRESS") {
                        elizaLogger.log("Image generation in progress...");
                    }
                },
            });

            elizaLogger.log("Image generation completed successfully");
            // Extract data from fal.ai response structure
            return (result as any).data || (result as ImageGenerationResponse);
        } catch (error) {
            elizaLogger.error("Image generation failed:", error);
            throw error;
        }
    }

    async generateVideo(
        request: VideoGenerationRequest
    ): Promise<VideoGenerationResponse> {
        if (!this.config) {
            throw new Error("FAL service not initialized");
        }

        try {
            elizaLogger.log("Generating video with FAL:", request.prompt);

            const result = await fal.subscribe(this.config.FAL_VIDEO_MODEL, {
                input: {
                    prompt: request.prompt,
                    duration: request.duration || 5,
                    aspect_ratio: request.aspect_ratio || "16:9",
                    num_inference_steps: request.num_inference_steps || 30,
                },
                logs: true,
                onQueueUpdate: (update) => {
                    if (update.status === "IN_PROGRESS") {
                        elizaLogger.log("Video generation in progress...");
                    }
                },
            });

            elizaLogger.log("Video generation completed successfully");
            // Extract data from fal.ai response structure
            return (result as any).data || (result as VideoGenerationResponse);
        } catch (error) {
            elizaLogger.error("Video generation failed:", error);
            throw error;
        }
    }
}
