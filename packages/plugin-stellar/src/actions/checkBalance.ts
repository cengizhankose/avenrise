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
import { Horizon, Networks } from "@stellar/stellar-sdk";
import { validateStellarConfig } from "../environment";
import { z } from "zod";

const checkBalanceTemplate = `Extract the account address from the following message:

Message: {{userMessage}}

If the user is asking to check their own balance, use the configured wallet address.
If they specify a different Stellar address, extract it.

Stellar addresses are 56-character strings starting with G (like GA6QDEN2WHZ3C4PVEM75ZXYGHQSZ6EAYRVRBG5HKWGIX7XFNX4EKUREI).

Respond with JSON: {"address": "stellar_address_here"} or {"address": "own"} for the user's own balance.`;

const addressRequestSchema = z.object({
    address: z
        .string()
        .describe(
            "The Stellar address to check balance for, or 'own' for the user's own balance"
        ),
});

export const checkBalance: Action = {
    name: "CHECK_STELLAR_BALANCE",
    similes: [
        "CHECK_BALANCE",
        "STELLAR_BALANCE",
        "WALLET_BALANCE",
        "MY_BALANCE",
        "SHOW_BALANCE",
        "BALANCE_CHECK",
    ],
    description: "Check the XLM balance of a Stellar account",

    validate: async (runtime: IAgentRuntime, message: Memory) => {
        try {
            await validateStellarConfig(runtime);
            return true;
        } catch (error) {
            elizaLogger.error(
                "Stellar balance check validation failed:",
                error
            );
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
        elizaLogger.log("Starting CHECK_STELLAR_BALANCE handler...");

        try {
            const config = await validateStellarConfig(runtime);

            // Extract address from message
            const context = composeContext({
                state: {
                    ...state,
                    userMessage: message.content.text,
                },
                template: checkBalanceTemplate,
            });

            const addressResult = await generateObject({
                runtime,
                context,
                modelClass: ModelClass.SMALL,
                schema: addressRequestSchema,
            });

            elizaLogger.log("Address result:", addressResult);

            // Extract the actual result from the object
            let addressToCheck: string;
            if (
                addressResult &&
                typeof addressResult === "object" &&
                "object" in addressResult
            ) {
                const parsedResult = (addressResult as any).object;
                addressToCheck = parsedResult?.address;
            } else {
                addressToCheck = (addressResult as any)?.address;
            }

            if (!addressToCheck) {
                throw new Error("Could not extract address from the message");
            }

            // Determine which address to check
            let targetAddress: string;
            if (addressToCheck === "own") {
                // Extract public key from private key
                const { Keypair } = await import("@stellar/stellar-sdk");
                const keypair = Keypair.fromSecret(config.STELLAR_PRIVATE_KEY);
                targetAddress = keypair.publicKey();
            } else {
                targetAddress = addressToCheck;
            }

            elizaLogger.log(`Checking balance for address: ${targetAddress}`);

            // Validate the address format
            if (
                !targetAddress ||
                targetAddress.length !== 56 ||
                !targetAddress.startsWith("G")
            ) {
                throw new Error(
                    `Invalid Stellar address format: ${targetAddress}`
                );
            }

            // Connect to Stellar network
            const serverUrl =
                config.STELLAR_NETWORK === "mainnet"
                    ? "https://horizon.stellar.org"
                    : "https://horizon-testnet.stellar.org";

            const server = new Horizon.Server(serverUrl);

            // Get account info
            const account = await server.loadAccount(targetAddress);

            // Find XLM balance
            const xlmBalance = account.balances.find(
                (balance: any) => balance.asset_type === "native"
            );

            if (!xlmBalance) {
                callback?.({
                    text: `No XLM balance found for account ${targetAddress}`,
                    content: {
                        address: targetAddress,
                        balance: "0",
                        error: "No native balance found",
                    },
                });
                return false;
            }

            const balance = xlmBalance.balance;
            const formattedBalance = parseFloat(balance).toFixed(7);

            callback?.({
                text: `Account ${targetAddress} has ${formattedBalance} XLM`,
                content: {
                    address: targetAddress,
                    balance: formattedBalance,
                    balanceRaw: balance,
                    success: true,
                },
            });

            return true;
        } catch (error: any) {
            elizaLogger.error("Error checking Stellar balance:", error);

            callback?.({
                text: `Error checking balance: ${error?.message || error}`,
                content: { error: error?.message || error },
            });

            return false;
        }
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "What's my XLM balance?" },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Let me check your Stellar balance",
                    action: "CHECK_STELLAR_BALANCE",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "Check balance for GA6QDEN2WHZ3C4PVEM75ZXYGHQSZ6EAYRVRBG5HKWGIX7XFNX4EKUREI",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll check the XLM balance for that address",
                    action: "CHECK_STELLAR_BALANCE",
                },
            },
        ],
    ],
};
