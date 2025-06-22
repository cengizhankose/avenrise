# @elizaos/plugin-stellar

Stellar blockchain integration plugin for GigabaldAI that enables wallet connection, balance checking, and XLM transfers.

## Overview

This plugin provides seamless integration with the Stellar network, allowing users to connect their wallets, check balances, and send XLM payments through natural language interactions with the AI agent.

## Features

-   **Wallet Connection**: Connect to Stellar wallets using secret keys
-   **Balance Checking**: Query XLM balances for any Stellar account
-   **XLM Transfers**: Send XLM payments to other Stellar addresses
-   **Network Support**: Both Testnet and Mainnet compatibility
-   **Web Client Integration**: Built-in wallet UI component for the client

## Installation

```bash
pnpm install @elizaos/plugin-stellar
```

## Configuration

The plugin requires environment variables or runtime settings:

```env
STELLAR_PRIVATE_KEY=your-stellar-secret-key
STELLAR_NETWORK=testnet  # or mainnet
```

## Usage

### Plugin Integration

Add the plugin to your character configuration:

```json
{
    "name": "Your Agent",
    "plugins": ["@elizaos/plugin-stellar"],
    "settings": {
        "secrets": {
            "STELLAR_PRIVATE_KEY": "SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
            "STELLAR_NETWORK": "testnet"
        }
    }
}
```

### Actions

#### Check Balance

Ask the agent to check XLM balances:

```
"What's my XLM balance?"
"Check balance for GA6QDEN2WHZ3C4PVEM75ZXYGHQSZ6EAYRVRBG5HKWGIX7XFNX4EKUREI"
"Show me the balance on my Stellar wallet"
```

#### Send XLM

Request XLM transfers:

```
"Send 100 XLM to GA6QDEN2WHZ3C4PVEM75ZXYGHQSZ6EAYRVRBG5HKWGIX7XFNX4EKUREI"
"Transfer 50.5 lumens to GA6Q... with memo 'payment for services'"
"Pay 25 XLM to that address"
```

## Client Integration

The plugin includes a React component for wallet connection in the web client:

```tsx
import { StellarWallet } from "@/components/stellar-wallet";

// The component provides:
// - Network selection (Testnet/Mainnet)
// - Secret key input for wallet connection
// - Balance display and refresh
// - Address copying functionality
```

## API Reference

### Actions

#### CHECK_STELLAR_BALANCE

-   **Description**: Check XLM balance of a Stellar account
-   **Triggers**: "check balance", "my balance", "wallet balance"
-   **Parameters**: Stellar address (optional, uses connected wallet if not specified)

#### SEND_XLM

-   **Description**: Send XLM to another Stellar account
-   **Triggers**: "send xlm", "transfer lumens", "pay xlm"
-   **Parameters**:
    -   `destinationAddress`: Recipient's Stellar public key
    -   `amount`: Amount of XLM to send
    -   `memo`: Optional transaction memo

### Environment Configuration

| Variable              | Description                           | Default |
| --------------------- | ------------------------------------- | ------- |
| `STELLAR_PRIVATE_KEY` | Agent's Stellar secret key (required) | -       |
| `STELLAR_NETWORK`     | Network to use (testnet/mainnet)      | testnet |

## Security Notes

-   **Never share your secret key**: Store it securely in environment variables
-   **Use testnet for development**: Always test on testnet before mainnet
-   **Validate addresses**: The plugin validates Stellar address formats
-   **Network isolation**: Testnet and mainnet are completely separate

## Development

### Testing

```bash
# Run plugin tests
pnpm test

# Build the plugin
pnpm build
```

### Examples

Example character configuration with Stellar plugin:

```json
{
    "name": "StellarBot",
    "bio": "I help with Stellar payments and balance checks",
    "plugins": ["@elizaos/plugin-stellar"],
    "settings": {
        "secrets": {
            "STELLAR_PRIVATE_KEY": "SXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
        }
    }
}
```

## Troubleshooting

### Common Issues

1. **"Account not found" error**: Account needs to be funded with at least 1 XLM
2. **"Invalid address" error**: Ensure Stellar addresses are 56 characters starting with 'G'
3. **"Insufficient balance" error**: Account needs enough XLM to cover the transfer + fees

### Getting Test XLM

For testnet development, get free test XLM from the friendbot:

```
https://friendbot.stellar.org/?addr=YOUR_PUBLIC_KEY
```

## License

This plugin is part of the GigabaldAI project and follows the same license terms.
