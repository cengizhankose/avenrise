# @elizaos/plugin-fal

A plugin for GigabaldAI that provides image and video generation capabilities using fal.ai's API.

## Features

-   **Image Generation**: Generate high-quality images with detailed pose descriptions
-   **Video Generation**: Create dynamic videos with motion and scene descriptions
-   **Context-Aware Prompts**: Automatically creates detailed prompts based on conversation context
-   **Pose Description Enhancement**: Takes simple requests and expands them into comprehensive visual descriptions

## Installation

```bash
npm install @elizaos/plugin-fal
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Required: Your fal.ai API key
FAL_API_KEY=your-fal-api-key-here

# Optional: Custom model names (defaults provided)
FAL_IMAGE_MODEL=fal-ai/flux/schnell
FAL_VIDEO_MODEL=fal-ai/luma-dream-machine
```

### Character File Integration

Add the plugin to your character's JSON file:

```json
{
    "name": "Your Agent",
    "plugins": ["@elizaos/plugin-fal"],
    "settings": {
        "secrets": {
            "FAL_API_KEY": "your-fal-api-key-here",
            "FAL_IMAGE_MODEL": "fal-ai/flux/schnell",
            "FAL_VIDEO_MODEL": "fal-ai/luma-dream-machine"
        }
    }
}
```

## Usage

### Image Generation

The plugin responds to various image generation requests:

```
User: "Generate an image of a confident bald man in sunglasses"
Agent: *Creates detailed pose description and generates image*

User: "Create a picture of someone doing a funny pose"
Agent: *Expands into detailed humorous pose specification*
```

**Trigger words**:

-   GENERATE_IMAGE, CREATE_IMAGE, MAKE_IMAGE
-   DRAW_IMAGE, GENERATE_PICTURE, CREATE_PICTURE
-   MAKE_PICTURE, GENERATE_PHOTO, CREATE_PHOTO

### Video Generation

```
User: "Generate a video of someone walking confidently"
Agent: *Creates detailed motion description and generates video*

User: "Make a video of dynamic action"
Agent: *Generates action-packed video with movement*
```

**Trigger words**:

-   GENERATE_VIDEO, CREATE_VIDEO, MAKE_VIDEO
-   GENERATE_CLIP, CREATE_CLIP, MAKE_CLIP
-   VIDEO_GENERATION, GENERATE_MOVIE, CREATE_MOVIE

## Detailed Pose Enhancement

The plugin automatically enhances simple requests into detailed descriptions. For example:

**Input**: "Generate an image of a confident person"

**Enhanced Description**:

> "A confident individual with upright posture, shoulders back and chest forward, maintaining direct eye contact with a slight smile, wearing professional attire with clean lines, standing against a neutral background with soft lighting that emphasizes their assured demeanor and commanding presence..."

This follows the style example you provided, creating highly detailed visual descriptions that include:

-   Physical appearance and facial features
-   Specific pose and body positioning
-   Clothing and accessories
-   Facial expressions and emotional state
-   Camera angles and technical details
-   Lighting and composition
-   Background and environment

## API Reference

### Actions

#### GENERATE_IMAGE

-   **Description**: Generates images with detailed pose descriptions
-   **Input**: Natural language image request
-   **Output**: Generated image with detailed prompt used

#### GENERATE_VIDEO

-   **Description**: Generates videos with motion descriptions
-   **Input**: Natural language video request
-   **Output**: Generated video with detailed prompt used

### Service

#### FalService

-   **generateImage(request)**: Generate image using fal.ai
-   **generateVideo(request)**: Generate video using fal.ai

## Supported fal.ai Models

### Image Models (Default: fal-ai/flux/schnell)

-   fal-ai/flux/schnell
-   fal-ai/flux/dev
-   fal-ai/stable-diffusion-xl

### Video Models (Default: fal-ai/luma-dream-machine)

-   fal-ai/luma-dream-machine
-   fal-ai/minimax/video-01
-   fal-ai/runway-gen3/turbo/image-to-video

## Error Handling

The plugin includes comprehensive error handling:

-   Configuration validation
-   API key verification
-   Network error handling
-   Service availability checks

## Development

```bash
# Build the plugin
pnpm build

# Watch for changes
pnpm dev

# Run linting
pnpm lint

# Format code
pnpm format
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
