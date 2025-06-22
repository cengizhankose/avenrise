import {
    type Action,
    type ActionExample,
    type IAgentRuntime,
    type Memory,
    type State,
    type HandlerCallback,
    elizaLogger,
    composeContext,
    generateObject,
    ModelClass,
} from "@elizaos/core";
import {
    Keypair,
    TransactionBuilder,
    Networks,
    Operation,
    Asset,
    Memo,
    BASE_FEE,
    Horizon,
} from "@stellar/stellar-sdk";
import { validateLaunchtubeConfig } from "../environment";
import { LaunchtubeService } from "../services/launchtubeService";
import type { StellarTransactionDetails } from "../types";

function isValidStellarAddress(address: string): boolean {
    return (
        typeof address === "string" &&
        address.length === 56 &&
        address.startsWith("G") &&
        /^[A-Z0-9]+$/.test(address)
    );
}

const submitTransactionTemplate = `Extract the Stellar transaction details from the following message:

Message: {{userMessage}}

CRITICAL: All account addresses are STELLAR PUBLIC KEYS that start with G and are exactly 56 characters long.
DO NOT interpret them as usernames, herotags, or any other addressing system.
STELLAR PUBLIC KEYS look like: GA6QDEN2WHZ3C4PVEM75ZXYGHQSZ6EAYRVRBG5HKWGIX7XFNX4EKUREI

Based on the message, identify the transaction type and extract relevant details:

TRANSACTION TYPES:
1. "payment" - Send XLM or assets between accounts
2. "createAccount" - Create a new Stellar account
3. "changeTrust" - Establish trustline for an asset
4. "pathPayment" - Send payment through a path
5. "xdr" - Direct XDR submission

REQUIRED FIELDS BY TYPE:
- payment: sourceAccount, destinationAccount, amount, asset (optional: memo)
- createAccount: sourceAccount, destinationAccount, startingBalance
- changeTrust: sourceAccount, trustAsset (code, issuer), trustLimit (optional)
- pathPayment: sourceAccount, destinationAccount, sendAsset, sendMax, destAsset, destAmount, path (optional)
- xdr: xdr (the XDR string)

STELLAR ADDRESS FORMAT:
- All addresses are 56-character strings starting with G (like GA6QDEN2WHZ3C4PVEM75ZXYGHQSZ6EAYRVRBG5HKWGIX7XFNX4EKUREI)
- NEVER modify or interpret these addresses - use them exactly as provided
- If an address is incomplete or unclear, set the field to null

ASSET FORMAT:
- For XLM: {"code": "XLM"}
- For other assets: {"code": "USDC", "issuer": "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"}

Extract these details as a JSON object with the "type" field indicating the transaction type.

Examples:
- "Send 100 XLM to GA6QDEN2WHZ3C4PVEM75ZXYGHQSZ6EAYRVRBG5HKWGIX7XFNX4EKUREI" → 
  {"type": "payment", "destinationAccount": "GA6QDEN2WHZ3C4PVEM75ZXYGHQSZ6EAYRVRBG5HKWGIX7XFNX4EKUREI", "amount": "100", "asset": {"code": "XLM"}}
- "Create account GA6QDEN2WHZ3C4PVEM75ZXYGHQSZ6EAYRVRBG5HKWGIX7XFNX4EKUREI with 5 XLM" → 
  {"type": "createAccount", "destinationAccount": "GA6QDEN2WHZ3C4PVEM75ZXYGHQSZ6EAYRVRBG5HKWGIX7XFNX4EKUREI", "startingBalance": "5"}`;

export const submitTransaction: Action = {
    name: "SUBMIT_STELLAR_TRANSACTION",
    similes: [
        "LAUNCHTUBE_SUBMIT",
        "STELLAR_SEND",
        "STELLAR_PAYMENT",
        "SUBMIT_TX",
        "SEND_STELLAR",
        "EXECUTE_STELLAR",
        "BROADCAST_TX",
        "CREATE_ACCOUNT",
        "TRUST_ASSET",
        "STELLAR_TRUST",
    ],
    description:
        "Submit a Stellar transaction by building XDR from transaction details",

    validate: async (runtime: IAgentRuntime, message: Memory) => {
        try {
            await validateLaunchtubeConfig(runtime);
            return true;
        } catch (error) {
            elizaLogger.error("Launchtube validation failed:", error);
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
        elizaLogger.log("Starting SUBMIT_STELLAR_TRANSACTION handler...");

        try {
            // Compose context for transaction extraction
            const context = composeContext({
                state: {
                    ...state,
                    userMessage: message.content.text,
                },
                template: submitTransactionTemplate,
            });

            // Extract transaction details from the message
            elizaLogger.log("=== TRANSACTION EXTRACTION DEBUG ===");
            elizaLogger.log("Original user message:", message.content.text);
            elizaLogger.log("Generated context for AI:", context);

            const transactionDetails = (await generateObject({
                runtime,
                context,
                modelClass: ModelClass.LARGE,
            })) as unknown as StellarTransactionDetails;

            elizaLogger.log("=== EXTRACTED TRANSACTION DETAILS ===");
            elizaLogger.log(
                "Full extracted object:",
                JSON.stringify(transactionDetails, null, 2)
            );
            elizaLogger.log("Transaction type:", transactionDetails.type);
            elizaLogger.log(
                "Source account:",
                transactionDetails.sourceAccount
            );
            elizaLogger.log(
                "Destination account:",
                transactionDetails.destinationAccount
            );
            elizaLogger.log("Amount:", transactionDetails.amount);
            elizaLogger.log("Asset:", transactionDetails.asset);
            elizaLogger.log("=== END EXTRACTION DEBUG ===");

            // Validate Stellar addresses
            if (transactionDetails.sourceAccount) {
                if (!isValidStellarAddress(transactionDetails.sourceAccount)) {
                    throw new Error(
                        `Invalid source account format: ${transactionDetails.sourceAccount}. Must be a 56-character Stellar public key starting with G.`
                    );
                }
            }

            if (transactionDetails.destinationAccount) {
                if (
                    !isValidStellarAddress(
                        transactionDetails.destinationAccount
                    )
                ) {
                    throw new Error(
                        `Invalid destination account format: ${transactionDetails.destinationAccount}. Must be a 56-character Stellar public key starting with G.`
                    );
                }
            }

            elizaLogger.log("=== ADDRESS VALIDATION PASSED ===");

            // Get Launchtube service
            const launchtubeService = new LaunchtubeService();
            await launchtubeService.initialize(runtime);

            let xdr: string;

            // Handle direct XDR submission
            if (transactionDetails.type === "xdr" && transactionDetails.xdr) {
                xdr = transactionDetails.xdr;
            } else {
                // Build XDR from transaction details
                xdr = await buildTransactionXDR(runtime, transactionDetails);
            }

            elizaLogger.log(
                "Built transaction XDR:",
                xdr.substring(0, 100) + "..."
            );

            // Submit to Launchtube
            const result = await launchtubeService.submitTransaction({
                xdr: xdr,
                sim: true, // Let Launchtube handle simulation
            });

            if (result.status === "success") {
                callback?.({
                    text:
                        `✅ Transaction submitted successfully!\n\n` +
                        `Transaction Hash: ${result.tx}\n` +
                        `Credits Remaining: ${
                            result.details?.creditsRemaining || "Unknown"
                        }\n\n` +
                        `Transaction Type: ${transactionDetails.type}\n` +
                        `${formatTransactionSummary(transactionDetails)}`,
                    content: {
                        action: "SUBMIT_STELLAR_TRANSACTION",
                        success: true,
                        transactionHash: result.tx,
                        creditsRemaining: result.details?.creditsRemaining,
                        details: result.details,
                        transactionType: transactionDetails.type,
                    },
                });
            } else {
                callback?.({
                    text: `❌ Transaction submission failed: ${result.error}`,
                    content: {
                        action: "SUBMIT_STELLAR_TRANSACTION",
                        success: false,
                        error: result.error,
                    },
                });
            }

            return result.status === "success";
        } catch (error) {
            elizaLogger.error("Submit transaction handler error:", error);

            callback?.({
                text: `❌ Error submitting transaction: ${error.message}`,
                content: {
                    action: "SUBMIT_STELLAR_TRANSACTION",
                    success: false,
                    error: error.message,
                },
            });

            return false;
        }
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Send 100 XLM from GBXYZ123... to GABC456...",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll send 100 XLM to that account for you via Launchtube",
                    action: "SUBMIT_STELLAR_TRANSACTION",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Create a new Stellar account GBXYZ123... with 5 XLM starting balance",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll create that new Stellar account with 5 XLM starting balance",
                    action: "SUBMIT_STELLAR_TRANSACTION",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Establish trust for USDC token from issuer GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll establish a trustline for that USDC token",
                    action: "SUBMIT_STELLAR_TRANSACTION",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Send 50 USDC from GBXYZ... to GABC... with memo 'payment for services'",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll send 50 USDC with that memo via Launchtube",
                    action: "SUBMIT_STELLAR_TRANSACTION",
                },
            },
        ],
    ],
};

async function buildTransactionXDR(
    runtime: IAgentRuntime,
    details: StellarTransactionDetails
): Promise<string> {
    const networkPassphrase =
        runtime.getSetting("STELLAR_NETWORK") === "mainnet"
            ? Networks.PUBLIC
            : Networks.TESTNET;

    const serverUrl =
        runtime.getSetting("STELLAR_NETWORK") === "mainnet"
            ? "https://horizon.stellar.org"
            : "https://horizon-testnet.stellar.org";

    const server = new Horizon.Server(serverUrl);

    if (!details.sourceAccount) {
        throw new Error("Source account is required for transaction building");
    }

    // Load source account
    const sourceAccount = await server.loadAccount(details.sourceAccount);

    // Create transaction builder
    const transactionBuilder = new TransactionBuilder(sourceAccount, {
        fee: BASE_FEE,
        networkPassphrase: networkPassphrase,
    });

    // Add operations based on transaction type
    switch (details.type) {
        case "payment":
            if (!details.destinationAccount || !details.amount) {
                throw new Error(
                    "Payment requires destinationAccount and amount"
                );
            }

            const asset =
                details.asset?.code === "XLM" || !details.asset?.code
                    ? Asset.native()
                    : new Asset(details.asset.code, details.asset.issuer!);

            transactionBuilder.addOperation(
                Operation.payment({
                    destination: details.destinationAccount,
                    asset: asset,
                    amount: details.amount,
                })
            );
            break;

        case "createAccount":
            if (!details.destinationAccount || !details.startingBalance) {
                throw new Error(
                    "Create account requires destinationAccount and startingBalance"
                );
            }

            transactionBuilder.addOperation(
                Operation.createAccount({
                    destination: details.destinationAccount,
                    startingBalance: details.startingBalance,
                })
            );
            break;

        case "changeTrust":
            if (!details.trustAsset?.code || !details.trustAsset?.issuer) {
                throw new Error(
                    "Change trust requires trustAsset with code and issuer"
                );
            }

            const trustAsset = new Asset(
                details.trustAsset.code,
                details.trustAsset.issuer
            );

            transactionBuilder.addOperation(
                Operation.changeTrust({
                    asset: trustAsset,
                    limit: details.trustLimit,
                })
            );
            break;

        case "pathPayment":
            if (
                !details.destinationAccount ||
                !details.sendMax ||
                !details.destAmount
            ) {
                throw new Error(
                    "Path payment requires destinationAccount, sendMax, and destAmount"
                );
            }

            const sendAsset =
                details.sendAsset?.code === "XLM" || !details.sendAsset?.code
                    ? Asset.native()
                    : new Asset(
                          details.sendAsset.code,
                          details.sendAsset.issuer!
                      );

            const destAsset =
                details.destAsset?.code === "XLM" || !details.destAsset?.code
                    ? Asset.native()
                    : new Asset(
                          details.destAsset.code,
                          details.destAsset.issuer!
                      );

            const path =
                details.path?.map((p) =>
                    p.code === "XLM"
                        ? Asset.native()
                        : new Asset(p.code!, p.issuer!)
                ) || [];

            transactionBuilder.addOperation(
                Operation.pathPaymentStrictReceive({
                    sendAsset: sendAsset,
                    sendMax: details.sendMax,
                    destination: details.destinationAccount,
                    destAsset: destAsset,
                    destAmount: details.destAmount,
                    path: path,
                })
            );
            break;

        default:
            throw new Error(`Unsupported transaction type: ${details.type}`);
    }

    // Add memo if provided
    if (details.memo) {
        const memoType = details.memoType || "text";
        switch (memoType) {
            case "text":
                transactionBuilder.addMemo(Memo.text(details.memo));
                break;
            case "id":
                transactionBuilder.addMemo(Memo.id(details.memo));
                break;
            case "hash":
                transactionBuilder.addMemo(Memo.hash(details.memo));
                break;
            case "return":
                transactionBuilder.addMemo(Memo.return(details.memo));
                break;
        }
    }

    // Build and return XDR
    const transaction = transactionBuilder.setTimeout(30).build();
    return transaction.toXDR();
}

function formatTransactionSummary(details: StellarTransactionDetails): string {
    switch (details.type) {
        case "payment":
            const assetCode = details.asset?.code || "XLM";
            return `Amount: ${details.amount} ${assetCode}\nTo: ${details.destinationAccount}`;

        case "createAccount":
            return `New Account: ${details.destinationAccount}\nStarting Balance: ${details.startingBalance} XLM`;

        case "changeTrust":
            return `Asset: ${details.trustAsset?.code}\nIssuer: ${
                details.trustAsset?.issuer
            }\nLimit: ${details.trustLimit || "Unlimited"}`;

        case "pathPayment":
            return `Send Max: ${details.sendMax} ${
                details.sendAsset?.code || "XLM"
            }\nReceive: ${details.destAmount} ${
                details.destAsset?.code || "XLM"
            }\nTo: ${details.destinationAccount}`;

        default:
            return `Type: ${details.type}`;
    }
}
