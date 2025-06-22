# Launchtube Plugin Transaction Examples

This document provides comprehensive examples of how to use the Launchtube plugin to submit various Stellar transactions.

## 🔧 **Setup Requirements**

Before using the plugin, ensure these environment variables are set:

```bash
LAUNCHTUBE_API_KEY="your_jwt_token_here"
LAUNCHTUBE_BASE_URL="https://testnet.launchtube.xyz"  # or mainnet
STELLAR_NETWORK="testnet"  # or "mainnet"
```

## 📝 **Transaction Types & Examples**

### 1. **Payment Transaction** 💸

Send XLM or assets between accounts.

**Required Data:**

-   `sourceAccount`: Sender's public key (G...)
-   `destinationAccount`: Recipient's public key (G...)
-   `amount`: Amount to send (string)
-   `asset`: Asset details (optional for XLM)
-   `memo`: Optional memo (string)

**Example Prompts:**

```
"Send 100 XLM from GBXYZ123ABC456DEF789GHI012JKL345MNO678PQR901STU234VWX567YZ890 to GABC456DEF789GHI012JKL345MNO678PQR901STU234VWX567YZ890ABC123DEF"

"Transfer 50.5 XLM to GBTEST123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEF with memo 'payment for services'"

"Send 1000 USDC from GBSENDER123456789ABCDEF to GBRECEIVER987654321FEDCBA using USDC issued by GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
```

**Extracted Data Format:**

```json
{
    "type": "payment",
    "sourceAccount": "GBXYZ123ABC456DEF789GHI012JKL345MNO678PQR901STU234VWX567YZ890",
    "destinationAccount": "GABC456DEF789GHI012JKL345MNO678PQR901STU234VWX567YZ890ABC123DEF",
    "amount": "100",
    "asset": { "code": "XLM" },
    "memo": "payment for services"
}
```

### 2. **Create Account Transaction** 🆕

Create a new Stellar account with initial funding.

**Required Data:**

-   `sourceAccount`: Funding account's public key (G...)
-   `destinationAccount`: New account's public key (G...)
-   `startingBalance`: Initial XLM balance (minimum 1 XLM)

**Example Prompts:**

```
"Create a new Stellar account GBNEWACCOUNT123456789ABCDEF with 5 XLM starting balance from GBFUNDER123456789ABCDEF"

"Fund new account GBCHILD987654321FEDCBA with 10 XLM from my account GBPARENT123456789ABCDEF"

"Initialize account GBTEST555666777888999 with minimum balance 1 XLM"
```

**Extracted Data Format:**

```json
{
    "type": "createAccount",
    "sourceAccount": "GBFUNDER123456789ABCDEF...",
    "destinationAccount": "GBNEWACCOUNT123456789ABCDEF...",
    "startingBalance": "5"
}
```

### 3. **Change Trust Transaction** 🤝

Establish trustlines for custom assets.

**Required Data:**

-   `sourceAccount`: Account creating the trustline (G...)
-   `trustAsset`: Asset details with code and issuer
-   `trustLimit`: Maximum trust amount (optional, unlimited if not specified)

**Example Prompts:**

```
"Establish trust for USDC token from issuer GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN on account GBTRUSTER123456789ABCDEF"

"Create trustline for BTC asset issued by GBTCISSUER987654321FEDCBA with limit 1000 BTC"

"Trust EURC from GEURCISSUER555666777888999 with unlimited trust limit"
```

**Extracted Data Format:**

```json
{
    "type": "changeTrust",
    "sourceAccount": "GBTRUSTER123456789ABCDEF...",
    "trustAsset": {
        "code": "USDC",
        "issuer": "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
    },
    "trustLimit": "1000"
}
```

### 4. **Path Payment Transaction** 🛤️

Send payments through intermediate assets.

**Required Data:**

-   `sourceAccount`: Sender's public key (G...)
-   `destinationAccount`: Recipient's public key (G...)
-   `sendAsset`: Asset being sent
-   `sendMax`: Maximum amount willing to send
-   `destAsset`: Asset to be received
-   `destAmount`: Exact amount to be received
-   `path`: Optional intermediate assets

**Example Prompts:**

```
"Send path payment: send max 110 XLM to deliver exactly 100 USDC to GBRECEIVER123456789ABCDEF through USDC issuer GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"

"Path payment from GBSENDER123: send max 1000 USDC to get exactly 50 BTC for GBRECEIVER456 via BTC issuer GBTCISSUER789"
```

**Extracted Data Format:**

```json
{
    "type": "pathPayment",
    "sourceAccount": "GBSENDER123456789ABCDEF...",
    "destinationAccount": "GBRECEIVER123456789ABCDEF...",
    "sendAsset": { "code": "XLM" },
    "sendMax": "110",
    "destAsset": {
        "code": "USDC",
        "issuer": "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
    },
    "destAmount": "100",
    "path": []
}
```

### 5. **Direct XDR Submission** 📄

Submit pre-built XDR transactions directly.

**Required Data:**

-   `xdr`: The XDR string of the transaction

**Example Prompts:**

```
"Submit this XDR transaction: AAAAAgAAAAB8QdJH1UMl0PH0vRs+DqS8QGu2QCR/fk8P6qNk7L5gNQAAAGQAAI1zAAAADgAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAABAAAAAHxB0kfVQyXQ8fS9Gz4OpLxAa7ZAJH9+Tw/qo2TsvmA1AAAAAQAAAAB8QdJH1UMl0PH0vRs+DqS8QGu2QCR/fk8P6qNk7L5gNQAAAAAAAAABAAAAAAAAAAA="

"Execute this pre-signed transaction XDR: [paste your XDR here]"
```

## 🎯 **Prompt Writing Tips**

### ✅ **Good Prompts:**

-   Include full Stellar public keys (56 characters starting with G)
-   Specify exact amounts as numbers or strings
-   Mention asset codes and issuers clearly
-   Use clear action words: "send", "create", "trust", "establish"

### ❌ **Avoid:**

-   Shortened or incomplete public keys
-   Ambiguous amounts ("some", "a lot")
-   Missing asset issuers for custom assets
-   Unclear transaction intentions

## 🔍 **Account Key Examples**

**Valid Stellar Public Keys:**

```
GBXYZ123ABC456DEF789GHI012JKL345MNO678PQR901STU234VWX567YZ890
GABC456DEF789GHI012JKL345MNO678PQR901STU234VWX567YZ890ABC123DEF
GDTEST123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJ
```

**Common Asset Issuers:**

```
USDC: GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN
USDT: GCQTGZQQ5G4PTM2GL7CDIFKUBIPEC52BROAQIAPW53XBRJVN6ZJVTG6V
yXLM: GARDNV3Q7YGT4AKSDF25LT32YSCCW4EV22Y2TV3I2PU2MMXJTEDL5T55
```

## 🚀 **Complete Example Workflow**

```
User: "Send 50 XLM from GBSENDER123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEF to GBRECEIVER987654321FEDCBAHGFEDCBA0987654321ZYXWVUTSRQPONMLKJI with memo 'monthly payment'"

Agent Response:
✅ Transaction submitted successfully!

Transaction Hash: a1b2c3d4e5f6789012345678901234567890abcdef
Credits Remaining: 999,950,000 stroops

Transaction Type: payment
Amount: 50 XLM
To: GBRECEIVER987654321FEDCBAHGFEDCBA0987654321ZYXWVUTSRQPONMLKJI
```

## 🔧 **Troubleshooting**

**Common Issues:**

1. **Invalid public key**: Ensure 56-character G-prefixed keys
2. **Insufficient balance**: Source account needs enough XLM + fees
3. **Missing trustline**: Recipient must trust custom assets
4. **Network mismatch**: Check testnet vs mainnet configuration
5. **Invalid asset issuer**: Verify issuer public key is correct

**Error Messages:**

-   `"Source account is required"` → Include sourceAccount in prompt
-   `"Payment requires destinationAccount and amount"` → Specify recipient and amount
-   `"Change trust requires trustAsset with code and issuer"` → Include asset details
