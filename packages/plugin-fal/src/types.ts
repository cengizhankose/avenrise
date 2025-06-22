export interface ImageGenerationRequest {
    prompt: string;
    image_size?: string;
    num_inference_steps?: number;
    guidance_scale?: number;
    num_images?: number;
    seed?: number;
}

export interface VideoGenerationRequest {
    prompt: string;
    duration?: number;
    aspect_ratio?: string;
    num_inference_steps?: number;
}

export interface ImageGenerationResponse {
    images: Array<{
        url: string;
        file_name: string;
        file_size: number;
        content_type: string;
    }>;
    timings?: {
        inference: number;
    };
    seed?: number;
    has_nsfw_concepts?: boolean[];
}

export interface VideoGenerationResponse {
    video: {
        url: string;
        file_name: string;
        file_size: number;
        content_type: string;
    };
    timings?: {
        inference: number;
    };
}

export interface PoseDescriptionRequest {
    context: string;
    userPrompt: string;
}

export interface PoseDescriptionResponse {
    detailedPrompt: string;
}
