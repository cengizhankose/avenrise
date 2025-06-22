# GigabaldAI - AI Influencer Agency Platform 🤖

<div align="center">
  <img src="./docs/static/img/eliza_banner.jpg" alt="GigabaldAI Banner" width="100%" />
</div>

<div align="center">

📑 [Technical Report](https://arxiv.org/pdf/2501.06781) | 📖 [Documentation](https://elizaos.github.io/eliza/) | 🎯 [Examples](https://github.com/thejoven/awesome-eliza)

</div>

## 🌟 What is GigabaldAI?

GigabaldAI is a comprehensive **AI Influencer Agency Platform** built on the Eliza OS framework. It combines the power of AI agents with modern Web3 technologies to create, manage, and deploy AI influencers for marketing, community building, and brand engagement.

### Key Features

-   🎭 **AI Influencer Management** - Create and manage diverse AI personalities with specialized expertise
-   🔗 **Multi-Platform Integration** - Deploy agents on Discord, X (Twitter), Telegram, and Web
-   🎨 **Visual Interface** - Beautiful card-based UI for browsing and interacting with AI influencers
-   💼 **Web3 Native** - Built-in support for blockchain integrations, DeFi, NFTs, and crypto marketing
-   🚀 **Extensible Architecture** - Plugin system for adding new capabilities and integrations
-   💬 **Real-time Chat** - Advanced chat interface with TTS, file uploads, and multimedia support

## 🏗️ Architecture Overview

### Core Components

1. **Agent Runtime** (`/agent`) - Core AI agent system powered by Eliza OS
2. **Client Interface** (`/client`) - React-based chat and management interface
3. **VibeAgent** (`/VibeAgent`) - Work in progress specialized UI for AI influencer discovery and interaction
4. **Plugin Ecosystem** (`/packages`) - Modular plugins for various Web3 integrations

## 🚀 Quick Start

### Prerequisites

-   [Node.js 23+](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
-   [pnpm](https://pnpm.io/installation)
-   [Python 2.7+](https://www.python.org/downloads/)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/gigabaldai.git
cd gigabaldai

# Install dependencies
pnpm install

# Build all packages
pnpm build
```

### Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your API keys:
# OpenRouter Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=google/gemini-2.5-flash-preview

# Stellar Configuration
STELLAR_PRIVATE_KEY=your_stellar_private_key_here
STELLAR_NETWORK=testnet

# Fal.ai Configuration
FAL_API_KEY=your_fal_ai_api_key_here
FAL_IMAGE_MODEL=fal-ai/flux/schnell
FAL_VIDEO_MODEL=fal-ai/luma-dream-machine

# Twitter Configuration (optional)
TWITTER_DRY_RUN=false
TWITTER_USERNAME=your_twitter_username_here
TWITTER_PASSWORD=your_twitter_password_here
TWITTER_EMAIL=your_twitter_email_here
# - Other service API keys as needed like
```

### Start the Agent

```bash
# Start the main AI agent
pnpm start

# Or start with debug logging
pnpm start:debug
```

### Start the Client Interface

```bash
# In a new terminal, start the web client
pnpm start:client
```

### Start VibeAgent (AI Influencer UI)

```bash
# In a new terminal, start VibeAgent
cd VibeAgent
pnpm dev
```

## 🔧 Development

### Project Structure

```
gigabaldai/
├── agent/                 # Main AI agent wrapper
├── client/                # React chat interface
├── VibeAgent/            # AI influencer discovery UI
├── packages/             # Core packages and plugins
│   ├── core/            # Eliza OS core
│   ├── adapter-sqlite/   # SQLite vector storage
│   ├── plugin-*/        # Various Web3 plugins
│   └── client-*/        # Platform clients
├── docs/                # Documentation site
└── scripts/             # Build and utility scripts
```

### Available Scripts

```bash
pnpm build             # Build all packages
pnpm dev               # Start development mode
pnpm start             # Start the agent
pnpm start:client      # Start web client
pnpm test              # Run test suite
pnpm clean             # Clean build artifacts
```

### Plugin Development

Create new plugins to extend functionality:

```bash
# Create a new plugin
cd packages
mkdir plugin-your-feature
# Follow the plugin template structure
```

## 🌐 Supported Integrations

### Blockchain Networks

-   **Stellar** - Native integration for payments and smart contracts
-   **MultiversX** - Multi-chain DeFi operations
-   **Solana** - High-performance blockchain integration
-   **Ethereum** - EVM-compatible smart contracts

### AI & Media Services

-   **FAL.ai** - Advanced image and video generation
-   **OpenRouter** - LLM models for conversation

### Social Platforms

-   **Twitter/X** - Automated posting and engagement

### Additional Services

-   **Web Search** - Real-time information retrieval via Tavily
-   **Vector Storage** - SQLite-based memory and embeddings

## 🎯 Use Cases

-   **Brand Marketing** - Deploy AI influencers to promote products and services
-   **Community Management** - Automate engagement and support in Web3 communities
-   **Content Creation** - Generate marketing content, articles, and social media posts
-   **DeFi Education** - Provide expertise on blockchain technology and protocols
-   **NFT Promotion** - Market and explain NFT collections and digital art
-   **Trading Analysis** - Offer market insights and investment guidance

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Run tests: `pnpm test`
5. Submit a pull request

## 📚 Documentation

For detailed documentation, visit our [documentation site](https://elizaos.github.io/eliza/) or check the `/docs` directory.

### Key Resources

-   [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) - Detailed technical overview
-   [integration-plan.md](integration-plan.md) - VibeAgent integration roadmap
-   [Character Configuration](packages/core/src/defaultCharacter.ts) - Agent personality setup

## 🛠️ System Requirements

### Minimum Requirements

-   CPU: Dual-core processor
-   RAM: 4GB
-   Storage: 2GB free space
-   Internet: Broadband connection

### Recommended

-   CPU: Quad-core processor
-   RAM: 8GB+
-   GPU: For local LLM models (optional)
-   Storage: 5GB+ for full development setup

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Built on the powerful [Eliza OS](https://github.com/elizaos/eliza) framework. Special thanks to the ElizaOS community for creating such an extensible AI agent platform.

## 🔗 Links

-   [ElizaOS Discord](https://discord.gg/elizaos) - Technical community
-   [DAO Discord](https://discord.gg/ai16z) - Broader community discussions
-   [GitHub Issues](https://github.com/your-org/gigabaldai/issues) - Bug reports and feature requests
