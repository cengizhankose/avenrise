import {
    type Action,
    type ActionExample,
    type IAgentRuntime,
    type Memory,
    type State,
    type HandlerCallback,
    elizaLogger,
    composeContext,
    generateText,
    ModelClass,
    ServiceType,
} from "@elizaos/core";
import { validateFalConfig } from "../environment";
import { FalService } from "../services/falService";
import type { VideoGenerationRequest } from "../types";

// Template for generating detailed video descriptions
const videoDescriptionTemplate = `# Video Generation Prompt Creator

## Context
You are an expert in creating detailed prompts for AI video generation. Your task is to take a user's request and expand it into a comprehensive video prompt that describes motion, scene, and visual elements.

## Current Context
Character: {{agentName}}
User Request: {{userRequest}}
Conversation Context: {{recentMessages}}

## Instructions
Create a detailed video generation prompt that includes:
1. Subject description and appearance
2. Specific actions and movements
3. Camera angles and motion
4. Environment and background
5. Lighting and mood
6. Duration and pacing elements

## Your Task
Based on the user's request "{{userRequest}}" and the conversation context, create a detailed video description suitable for AI video generation.

Make it vivid, specific, and focused on motion and visual storytelling. Keep it under 200 words but highly descriptive.

Respond with only the detailed description, no additional text or formatting.`;

export const generateVideo: Action = {
    name: "GENERATE_VIDEO",
    similes: [
        "CREATE_VIDEO",
        "MAKE_VIDEO",
        "GENERATE_CLIP",
        "CREATE_CLIP",
        "MAKE_CLIP",
        "VIDEO_GENERATION",
        "GENERATE_MOVIE",
        "CREATE_MOVIE",
    ],
    suppressInitialMessage: true,
    description:
        "Generate a video using fal.ai based on a detailed description of the requested scene and motion",

    validate: async (runtime: IAgentRuntime, message: Memory) => {
        try {
            await validateFalConfig(runtime);
            return true;
        } catch (error) {
            elizaLogger.error("Video generation validation failed:", error);
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
        elizaLogger.log("Starting video generation...");

        try {
            // Compose state for context
            const currentState = await runtime.composeState(message);

            // Generate detailed video description
            const videoContext = composeContext({
                state: {
                    ...currentState,
                    userRequest: message.content.text,
                },
                template: videoDescriptionTemplate,
            });

            elizaLogger.log("Generating detailed video description...");
            const detailedPrompt = await generateText({
                runtime,
                context: videoContext,
                modelClass: ModelClass.LARGE,
            });

            elizaLogger.log("Generated video prompt:", detailedPrompt);

            // Get FAL service
            const falService = runtime.getService<FalService>(
                ServiceType.IMAGE_DESCRIPTION
            );
            if (!falService) {
                throw new Error("FAL service not available");
            }

            // Prepare video generation request
            const videoRequest: VideoGenerationRequest = {
                prompt: detailedPrompt,
                duration: 5,
                aspect_ratio: "16:9",
                num_inference_steps: 30,
            };

            // Generate video
            elizaLogger.log("Generating video with FAL...");
            const videoResult = await falService.generateVideo(videoRequest);

            if (videoResult && videoResult.video) {
                const videoUrl = videoResult.video.url;

                if (callback) {
                    callback({
                        text: `I've generated a video based on your request! Here's the description I used: "${detailedPrompt}"`,
                        content: {
                            text: `Generated video: ${videoUrl}`,
                            action: "GENERATE_VIDEO",
                            source: "fal.ai",
                            attachments: [
                                {
                                    id: videoResult.video.file_name,
                                    url: videoUrl,
                                    title: "Generated Video",
                                    source: "fal.ai",
                                    description: detailedPrompt,
                                    text: detailedPrompt,
                                    contentType: videoResult.video.content_type,
                                },
                            ],
                        },
                    });
                }

                return true;
            } else {
                throw new Error("No video generated");
            }
        } catch (error) {
            elizaLogger.error("Video generation failed:", error);

            if (callback) {
                callback({
                    text: `Sorry, I couldn't generate the video. Error: ${error.message}`,
                    content: {
                        error: error.message,
                        action: "GENERATE_VIDEO",
                    },
                });
            }

            return false;
        }
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Generate a video of someone walking confidently",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll create a detailed video showing confident movement and motion!",
                    action: "GENERATE_VIDEO",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Create a video of a funny dance" },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll generate a humorous video with entertaining dance moves!",
                    action: "GENERATE_VIDEO",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Make a video of dynamic action" },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll create an action-packed video with dynamic motion!",
                    action: "GENERATE_VIDEO",
                },
            },
        ],
    ],
};
