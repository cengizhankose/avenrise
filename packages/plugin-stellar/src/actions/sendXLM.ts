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
    BASE_FEE,
    Horizon,
    Memo,
    Asset,
} from "@stellar/stellar-sdk";
import { validateStellarConfig } from "../environment";
import { z } from "zod";

const sendXLMTemplate = `Extract the payment details from the following message:

Message: {{userMessage}}

Extract:
- destinationAddress: The recipient Stellar address (56-character string starting with G)
- amount: The amount of XLM to send (as a string number)
- memo: Optional memo text

Example addresses: GA6QDEN2WHZ3C4PVEM75ZXYGHQSZ6EAYRVRBG5HKWGIX7XFNX4EKUREI

Respond with JSON: {"destinationAddress": "address", "amount": "amount", "memo": "optional_memo"}`;

const paymentDetailsSchema = z.object({
    destinationAddress: z
        .string()
        .describe("The recipient's Stellar public key"),
    amount: z.string().describe("The amount of XLM to send"),
    memo: z.string().optional().describe("Optional transaction memo"),
});

function isValidStellarAddress(address: string): boolean {
    return (
        typeof address === "string" &&
        address.length === 56 &&
        address.startsWith("G") &&
        /^[A-Z0-9]+$/.test(address)
    );
}

export const sendXLM: Action = {
    name: "SEND_XLM",
    similes: [
        "SEND_STELLAR",
        "PAY_XLM",
        "TRANSFER_XLM",
        "STELLAR_PAYMENT",
        "SEND_LUMENS",
        "XLM_TRANSFER",
    ],
    description: "Send XLM to another Stellar account",

    validate: async (runtime: IAgentRuntime, message: Memory) => {
        try {
            await validateStellarConfig(runtime);
            return true;
        } catch (error) {
            elizaLogger.error("Stellar send XLM validation failed:", error);
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
        elizaLogger.log("Starting SEND_XLM handler...");

        try {
            const config = await validateStellarConfig(runtime);

            // Extract payment details from message
            const context = composeContext({
                state: {
                    ...state,
                    userMessage: message.content.text,
                },
                template: sendXLMTemplate,
            });

            const paymentResult = await generateObject({
                runtime,
                context,
                modelClass: ModelClass.LARGE,
                schema: paymentDetailsSchema,
            });

            elizaLogger.log("Payment result:", paymentResult);

            // Extract the actual result from the object
            let paymentDetails: any;
            if (
                paymentResult &&
                typeof paymentResult === "object" &&
                "object" in paymentResult
            ) {
                paymentDetails = (paymentResult as any).object;
            } else {
                paymentDetails = paymentResult;
            }

            if (
                !paymentDetails ||
                !paymentDetails.destinationAddress ||
                !paymentDetails.amount
            ) {
                throw new Error(
                    "Could not extract payment details from the message"
                );
            }

            elizaLogger.log("Extracted payment details:", paymentDetails);

            // Validate destination address
            if (!isValidStellarAddress(paymentDetails.destinationAddress)) {
                throw new Error(
                    `Invalid destination address: ${paymentDetails.destinationAddress}. Must be a 56-character Stellar public key starting with G.`
                );
            }

            // Validate amount
            const amount = parseFloat(paymentDetails.amount);
            if (isNaN(amount) || amount <= 0) {
                throw new Error(
                    `Invalid amount: ${paymentDetails.amount}. Must be a positive number.`
                );
            }

            // Create keypair from private key
            const sourceKeypair = Keypair.fromSecret(
                config.STELLAR_PRIVATE_KEY
            );
            const sourcePublicKey = sourceKeypair.publicKey();

            elizaLogger.log(
                `Sending ${amount} XLM from ${sourcePublicKey} to ${paymentDetails.destinationAddress}`
            );

            // Connect to Stellar network
            const serverUrl =
                config.STELLAR_NETWORK === "mainnet"
                    ? "https://horizon.stellar.org"
                    : "https://horizon-testnet.stellar.org";

            const server = new Horizon.Server(serverUrl);
            const networkPassphrase =
                config.STELLAR_NETWORK === "mainnet"
                    ? Networks.PUBLIC
                    : Networks.TESTNET;

            // Load source account
            const sourceAccount = await server.loadAccount(sourcePublicKey);

            // Build transaction
            const transactionBuilder = new TransactionBuilder(sourceAccount, {
                fee: BASE_FEE,
                networkPassphrase: networkPassphrase,
            });

            // Add payment operation
            transactionBuilder.addOperation(
                Operation.payment({
                    destination: paymentDetails.destinationAddress,
                    asset: Asset.native(),
                    amount: paymentDetails.amount,
                })
            );

            // Add memo if provided
            if (paymentDetails.memo) {
                transactionBuilder.addMemo(Memo.text(paymentDetails.memo));
            }

            // Set timeout and build
            transactionBuilder.setTimeout(180);
            const transaction = transactionBuilder.build();

            // Sign transaction
            transaction.sign(sourceKeypair);

            // Submit transaction
            const result = await server.submitTransaction(transaction);

            const txHash = result.hash;
            const explorerUrl =
                config.STELLAR_NETWORK === "mainnet"
                    ? `https://stellar.expert/explorer/public/tx/${txHash}`
                    : `https://stellar.expert/explorer/testnet/tx/${txHash}`;

            callback?.({
                text: `Successfully sent ${amount} XLM to ${paymentDetails.destinationAddress}. Transaction: ${txHash}`,
                content: {
                    success: true,
                    txHash: txHash,
                    amount: paymentDetails.amount,
                    destination: paymentDetails.destinationAddress,
                    explorerUrl: explorerUrl,
                    memo: paymentDetails.memo,
                },
            });

            elizaLogger.log(`Transaction successful: ${txHash}`);
            elizaLogger.log(`Explorer URL: ${explorerUrl}`);

            return true;
        } catch (error: any) {
            elizaLogger.error("Error sending XLM:", error);

            callback?.({
                text: `Error sending XLM: ${error?.message || error}`,
                content: { error: error?.message || error },
            });

            return false;
        }
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Send 100 XLM to GA6QDEN2WHZ3C4PVEM75ZXYGHQSZ6EAYRVRBG5HKWGIX7XFNX4EKUREI",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll send 100 XLM to that address",
                    action: "SEND_XLM",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Transfer 50.5 lumens to GA6QDEN2WHZ3C4PVEM75ZXYGHQSZ6EAYRVRBG5HKWGIX7XFNX4EKUREI with memo 'payment for services'",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll transfer 50.5 XLM with that memo",
                    action: "SEND_XLM",
                },
            },
        ],
    ],
};
