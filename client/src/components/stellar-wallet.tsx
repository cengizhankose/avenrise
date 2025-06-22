import { useState, useEffect } from "react";
import { Keypair, Horizon } from "@stellar/stellar-sdk";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, Wallet, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StellarWalletState {
    isConnected: boolean;
    publicKey: string | null;
    balance: string | null;
    network: "testnet" | "mainnet";
}

export function StellarWallet() {
    const [walletState, setWalletState] = useState<StellarWalletState>({
        isConnected: false,
        publicKey: null,
        balance: null,
        network: "testnet",
    });
    const [secretKey, setSecretKey] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const connectWallet = async () => {
        if (!secretKey.trim()) {
            toast({
                title: "Error",
                description: "Please enter a secret key",
                variant: "destructive",
            });
            return;
        }

        try {
            setIsLoading(true);

            // Validate and create keypair
            const keypair = Keypair.fromSecret(secretKey.trim());
            const publicKey = keypair.publicKey();

            // Connect to Horizon server
            const serverUrl =
                walletState.network === "mainnet"
                    ? "https://horizon.stellar.org"
                    : "https://horizon-testnet.stellar.org";

            const server = new Horizon.Server(serverUrl);

            try {
                // Load account to check if it exists
                const account = await server.loadAccount(publicKey);

                // Get XLM balance
                const xlmBalance = account.balances.find(
                    (balance: any) => balance.asset_type === "native"
                );

                const balance = xlmBalance ? xlmBalance.balance : "0";

                setWalletState({
                    isConnected: true,
                    publicKey,
                    balance,
                    network: walletState.network,
                });

                // Store in localStorage for persistence
                localStorage.setItem(
                    "stellar_wallet",
                    JSON.stringify({
                        secretKey: secretKey.trim(),
                        publicKey,
                        network: walletState.network,
                    })
                );

                toast({
                    title: "Wallet Connected",
                    description: `Connected to ${publicKey.substring(0, 8)}...`,
                });
            } catch (error: any) {
                if (error.response?.status === 404) {
                    // Account doesn't exist yet
                    setWalletState({
                        isConnected: true,
                        publicKey,
                        balance: "0",
                        network: walletState.network,
                    });

                    toast({
                        title: "Wallet Connected",
                        description: "Account not funded yet. Balance: 0 XLM",
                        variant: "default",
                    });
                } else {
                    throw error;
                }
            }
        } catch (error: any) {
            console.error("Error connecting wallet:", error);
            toast({
                title: "Connection Failed",
                description: error?.message || "Failed to connect wallet",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const disconnectWallet = () => {
        setWalletState({
            isConnected: false,
            publicKey: null,
            balance: null,
            network: walletState.network,
        });
        setSecretKey("");
        localStorage.removeItem("stellar_wallet");

        toast({
            title: "Wallet Disconnected",
            description: "Wallet has been disconnected",
        });
    };

    const refreshBalance = async () => {
        if (!walletState.publicKey) return;

        try {
            setIsLoading(true);

            const serverUrl =
                walletState.network === "mainnet"
                    ? "https://horizon.stellar.org"
                    : "https://horizon-testnet.stellar.org";

            const server = new Horizon.Server(serverUrl);
            const account = await server.loadAccount(walletState.publicKey);

            const xlmBalance = account.balances.find(
                (balance: any) => balance.asset_type === "native"
            );

            const balance = xlmBalance ? xlmBalance.balance : "0";

            setWalletState((prev) => ({
                ...prev,
                balance,
            }));

            toast({
                title: "Balance Updated",
                description: `Current balance: ${parseFloat(balance).toFixed(
                    7
                )} XLM`,
            });
        } catch (error) {
            console.error("Error refreshing balance:", error);
            toast({
                title: "Refresh Failed",
                description: "Failed to refresh balance",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const copyAddress = () => {
        if (walletState.publicKey) {
            navigator.clipboard.writeText(walletState.publicKey);
            toast({
                title: "Address Copied",
                description: "Public key copied to clipboard",
            });
        }
    };

    const switchNetwork = (network: "testnet" | "mainnet") => {
        setWalletState((prev) => ({
            ...prev,
            network,
        }));

        if (walletState.isConnected) {
            // Disconnect and reconnect on new network
            disconnectWallet();
        }
    };

    // Load wallet from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem("stellar_wallet");
        if (stored) {
            try {
                const {
                    secretKey: storedSecretKey,
                    publicKey,
                    network,
                } = JSON.parse(stored);
                setSecretKey(storedSecretKey);
                setWalletState((prev) => ({
                    ...prev,
                    isConnected: true,
                    publicKey,
                    network,
                }));

                // Refresh balance
                setTimeout(() => refreshBalance(), 1000);
            } catch (error) {
                console.error("Error loading stored wallet:", error);
                localStorage.removeItem("stellar_wallet");
            }
        }
    }, []);

    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Stellar Wallet
                </CardTitle>
                <CardDescription>
                    Connect your Stellar wallet to interact with the network
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Network Selection */}
                <div className="flex gap-2">
                    <Button
                        variant={
                            walletState.network === "testnet"
                                ? "default"
                                : "outline"
                        }
                        size="sm"
                        onClick={() => switchNetwork("testnet")}
                        disabled={walletState.isConnected}
                    >
                        Testnet
                    </Button>
                    <Button
                        variant={
                            walletState.network === "mainnet"
                                ? "default"
                                : "outline"
                        }
                        size="sm"
                        onClick={() => switchNetwork("mainnet")}
                        disabled={walletState.isConnected}
                    >
                        Mainnet
                    </Button>
                </div>

                {!walletState.isConnected ? (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="secret-key">Secret Key</Label>
                            <Input
                                id="secret-key"
                                type="password"
                                placeholder="Enter your Stellar secret key (S...)"
                                value={secretKey}
                                onChange={(e) => setSecretKey(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        <Button
                            onClick={connectWallet}
                            disabled={isLoading || !secretKey.trim()}
                            className="w-full"
                        >
                            {isLoading ? "Connecting..." : "Connect Wallet"}
                        </Button>
                    </>
                ) : (
                    <>
                        <div className="space-y-2">
                            <Label>Public Key</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    value={walletState.publicKey || ""}
                                    readOnly
                                    className="font-mono text-sm"
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={copyAddress}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div>
                                <Label>Balance</Label>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-bold">
                                        {walletState.balance
                                            ? parseFloat(
                                                  walletState.balance
                                              ).toFixed(7)
                                            : "0"}{" "}
                                        XLM
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={refreshBalance}
                                        disabled={isLoading}
                                    >
                                        <RefreshCw
                                            className={`h-4 w-4 ${
                                                isLoading ? "animate-spin" : ""
                                            }`}
                                        />
                                    </Button>
                                </div>
                            </div>
                            <Badge variant="secondary">
                                {walletState.network}
                            </Badge>
                        </div>

                        <Button
                            onClick={disconnectWallet}
                            variant="outline"
                            className="w-full"
                        >
                            Disconnect
                        </Button>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
