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
import type { ImageGenerationRequest } from "../types";

// Template for generating detailed pose descriptions based on context
const poseDescriptionTemplate = `# Detailed Pose Description Generator

## Context
You are an expert in creating hyper-detailed visual descriptions for AI image generation. Your task is to take a user's basic request and expand it into a highly detailed prompt that captures specific pose, appearance, and aesthetic details.

## Current Context
Character: {{agentName}}
User Request: {{userRequest}}
Conversation Context: {{recentMessages}}

## Example Style
Here's an example of the detailed style you should follow:

"A bald, confident man with a smooth, well-shaped scalp, wearing reflective aviator sunglasses that hide his eyes but emphasize his strong brow ridge, a wide and perfectly aligned white smile showcasing high energy and charisma, a chiseled jawline and sharp chin that enhance his bold appearance, smooth and evenly tanned skin suggesting a Mediterranean or sun-kissed look, dressed in a black leather jacket over a vibrant yellow shirt with a futuristic skull print, exuding a rockstar or biker vibe, set against a psychedelic, radiant backdrop that amplifies his loud, charismatic, and dominant personality.

A humorous male pose features the subject mid-squat, knees outward like a sumo wrestler, feet firmly planted at shoulder width, elbows resting on knees with hands forming exaggerated "finger guns" pointed sideways, chin tucked slightly to emphasize a dramatic double chin, eyes wide open with an over-the-top surprised expression, mouth forming an exaggerated "O" as if caught mid-gasp, shoulders rolled forward for comedic hunch, head tilted slightly off-axis for asymmetry, shot from a low angle (worm's-eye view) with a 24mm wide-angle lens to exaggerate proportions, using shallow depth of field (f/2.8) to blur the background but keep the subject crisp, lit with a single softbox from camera left for dramatic side shadows, framed in a tight crop for maximum facial distortion, adding motion blur to one hand as if rapidly firing the finger guns."

## Instructions
1. Take the user's request and conversation context
2. Create a highly detailed description that includes:
   - Physical appearance details (facial features, build, skin tone)
   - Specific pose and body positioning
   - Clothing and accessories with specific details
   - Facial expression and emotional state
   - Camera angle and technical photography details
   - Lighting and composition notes
   - Background and environment details
3. Make it vivid, specific, and suitable for AI image generation
4. Keep the description focused and coherent while being extremely detailed

## Your Task
Based on the user's request "{{userRequest}}" and the conversation context, create a detailed pose description suitable for AI image generation.

Respond with only the detailed description, no additional text or formatting.`;

export const generateImage: Action = {
    name: "GENERATE_IMAGE",
    similes: [
        "CREATE_IMAGE",
        "MAKE_IMAGE",
        "DRAW_IMAGE",
        "GENERATE_PICTURE",
        "CREATE_PICTURE",
        "MAKE_PICTURE",
        "GENERATE_PHOTO",
        "CREATE_PHOTO",
        "IMAGE_GENERATION",
    ],
    suppressInitialMessage: true,
    description:
        "Generate an image using fal.ai based on a detailed description of the requested scene, pose, and context",

    validate: async (runtime: IAgentRuntime, message: Memory) => {
        try {
            await validateFalConfig(runtime);
            return true;
        } catch (error) {
            elizaLogger.error("Image generation validation failed:", error);
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
        elizaLogger.log("Starting image generation...");

        try {
            // Compose state for context
            const currentState = await runtime.composeState(message);

            // Generate detailed pose description
            const poseContext = composeContext({
                state: {
                    ...currentState,
                    userRequest: message.content.text,
                },
                template: poseDescriptionTemplate,
            });

            elizaLogger.log("Generating detailed pose description...");
            const detailedPrompt = await generateText({
                runtime,
                context: poseContext,
                modelClass: ModelClass.LARGE,
            });

            elizaLogger.log("Generated detailed prompt:", detailedPrompt);

            // Get FAL service
            const falService = runtime.getService<FalService>(
                ServiceType.IMAGE_DESCRIPTION
            );
            if (!falService) {
                throw new Error("FAL service not available");
            }

            // Prepare image generation request
            const imageRequest: ImageGenerationRequest = {
                prompt: detailedPrompt,
                image_size: "landscape_4_3",
                num_inference_steps: 4,
                guidance_scale: 3.5,
                num_images: 1,
            };

            // Generate image
            elizaLogger.log("Generating image with FAL...");
            const imageResult = await falService.generateImage(imageRequest);

            if (
                imageResult &&
                imageResult.images &&
                imageResult.images.length > 0
            ) {
                const imageUrl = imageResult.images[0].url;

                if (callback) {
                    callback({
                        text: "",
                        content: {
                            text: "",
                            action: "GENERATE_IMAGE",
                            source: "fal.ai",
                            attachments: [
                                {
                                    id:
                                        imageResult.images[0].file_name ||
                                        `generated-${Date.now()}`,
                                    url: imageUrl,
                                    title: "Generated Image",
                                    source: "fal.ai",
                                    description: message.content.text,
                                    text: imageUrl,
                                    contentType:
                                        imageResult.images[0].content_type ||
                                        "image/jpeg",
                                },
                            ],
                        },
                    });
                }

                return true;
            } else {
                throw new Error("No image generated");
            }
        } catch (error) {
            elizaLogger.error("Image generation failed:", error);

            if (callback) {
                callback({
                    text: `Sorry, I couldn't generate the image. Error: ${error.message}`,
                    content: {
                        error: error.message,
                        action: "GENERATE_IMAGE",
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
                    text: "Generate an image of a confident bald man in sunglasses",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll create a detailed image for you with a comprehensive pose description!",
                    action: "GENERATE_IMAGE",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Create a picture of someone doing a funny pose",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll generate a humorous image with detailed pose specifications!",
                    action: "GENERATE_IMAGE",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Make an image of a charismatic person" },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll create a detailed image showing charisma and confidence!",
                    action: "GENERATE_IMAGE",
                },
            },
        ],
    ],
};
