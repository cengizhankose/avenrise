# @elizaos-plugins/plugin-launchtube

A plugin for GigabaldAI that enables Stellar and Soroban transaction submission via Launchtube.

## Overview

Launchtube is a hosted relay service that takes your Soroban/Stellar transactions, pays the fees, manages sequence/nonce logic, and pushes them on-chain. This plugin provides a seamless interface for AI agents to interact with the Launchtube service.

## Features

-   **Submit Stellar Transactions**: Submit pre-built XDR transactions via Launchtube
-   **Submit Soroban Contracts**: Execute Soroban smart contract functions
-   **Credit Management**: Check remaining Launchtube credits
-   **Multi-Network Support**: Works with both testnet and mainnet
-   **Error Handling**: Comprehensive error handling and user feedback

## Installation

```bash
pnpm install @elizaos-plugins/plugin-launchtube
```

## Configuration

Add the following environment variables to your `.env` file:

```bash
# Required
LAUNCHTUBE_API_KEY=your_jwt_token_here

# Optional
LAUNCHTUBE_BASE_URL=https://testnet.launchtube.xyz  # or https://launchtube.xyz for mainnet
STELLAR_NETWORK=testnet  # or mainnet
```

## Character Configuration

Add the plugin to your character file:

```json
{
    "name": "Your Agent",
    "plugins": ["@elizaos-plugins/plugin-launchtube"],
    "settings": {
        "secrets": {
            "LAUNCHTUBE_API_KEY": "your_jwt_token_here"
        }
    }
}
```

## Getting Launchtube Tokens

### Testnet

1. Visit https://testnet.launchtube.xyz/gen
2. Copy a JWT token
3. Activate it: `curl -G "https://testnet.launchtube.xyz/activate" --data-urlencode "token=$TOKEN"`

### Mainnet

-   Contact the Launchtube team via Discord #launchtube channel for mainnet tokens

## Actions

### SUBMIT_STELLAR_TRANSACTION

Submit Stellar or Soroban transactions via Launchtube.

**Triggers**:

-   "Submit this XDR transaction"
-   "Broadcast this Stellar transaction"
-   "Execute this Soroban contract"
-   "Send via Launchtube"

**Usage Examples**:

```
Submit this Stellar transaction XDR: AAAAAgAAAAB8QdJH1UMl0PH0vRs+DqS8QGu2...
```

```
Execute this Soroban contract call: invoke contract CCW67TSZV3SSS2HXMBQ5JFGCKJNXKZM7UQUWUZPUTHXSTZGX5LMLBAE function transfer
```

### CHECK_LAUNCHTUBE_CREDITS

Check remaining credits in your Launchtube account.

**Triggers**:

-   "How many credits do I have?"
-   "Check my Launchtube balance"
-   "What's my remaining credits?"

**Usage Examples**:

```
How many credits do I have left in Launchtube?
```

## API Reference

### LaunchtubeService

The main service class that handles Launchtube API communication.

#### Methods

-   `initialize(runtime)`: Initialize the service with configuration
-   `submitTransaction(request)`: Submit a transaction to Launchtube
-   `checkCredits()`: Check remaining account credits
-   `activateToken(token)`: Activate a JWT token
-   `claimToken(code)`: Claim a new token with a claim code

### Types

-   `LaunchtubeSubmissionRequest`: Transaction submission parameters
-   `LaunchtubeSubmissionResponse`: Transaction submission response
-   `LaunchtubeCreditsResponse`: Credits check response
-   `StellarTransactionDetails`: Extracted transaction details

## Error Handling

The plugin includes comprehensive error handling:

-   Configuration validation
-   API error responses
-   Network connectivity issues
-   Invalid transaction formats
-   Insufficient credits

All errors are logged and provide user-friendly feedback.

## Security Considerations

-   Store JWT tokens securely in environment variables
-   Never commit tokens to version control
-   Use testnet for development and testing
-   Monitor credit usage to prevent unexpected depletion

## Contributing

Contributions are welcome! Please read the [Contributing Guide](../../CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](../../LICENSE) for details.

## Support

-   GitHub Issues: [Report issues](../../issues)
-   Documentation: [Plugin Development Guide](../../docs/plugin-development-guide.md)
-   Community: [ElizaOS Discord](https://discord.gg/elizaos)

## Changelog

### v0.1.0

-   Initial release
-   Basic transaction submission via XDR
-   Credit checking functionality
-   Testnet and mainnet support
