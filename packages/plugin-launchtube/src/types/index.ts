export interface LaunchtubeSubmissionRequest {
    xdr?: string; // Transaction XDR
    func?: string; // HostFunction XDR
    auth?: string[]; // Array of SorobanAuthorizationEntry XDRs
    sim?: boolean; // Whether to simulate (default true)
}

export interface LaunchtubeSubmissionResponse {
    status: string;
    tx?: string; // Transaction hash
    error?: string;
    details?: any;
}

export interface LaunchtubeCreditsResponse {
    credits: string; // Remaining credits in stroops
}

export interface LaunchtubeTokenActivationRequest {
    token: string;
}

export interface LaunchtubeClaimRequest {
    code: string;
}

export interface LaunchtubeGenerateTokensRequest {
    ttl: number; // Time to live in seconds
    credits: number; // Credits in stroops
    count: number; // Number of tokens to generate
}

export interface LaunchtubeGenerateTokensResponse {
    tokens: string[];
}

export interface ILaunchtubeService {
    initialize(): Promise<void>;
    submitTransaction(
        request: LaunchtubeSubmissionRequest
    ): Promise<LaunchtubeSubmissionResponse>;
    checkCredits(): Promise<LaunchtubeCreditsResponse>;
    activateToken(token: string): Promise<void>;
    claimToken(code: string): Promise<string>;
    generateTokens?(
        request: LaunchtubeGenerateTokensRequest
    ): Promise<LaunchtubeGenerateTokensResponse>;
}

export interface StellarTransactionDetails {
    type:
        | "payment"
        | "createAccount"
        | "pathPayment"
        | "manageBuyOffer"
        | "manageSellOffer"
        | "setOptions"
        | "changeTrust"
        | "allowTrust"
        | "accountMerge"
        | "manageData"
        | "bumpSequence"
        | "createClaimableBalance"
        | "claimClaimableBalance"
        | "contract"
        | "xdr";
    sourceAccount?: string;
    destinationAccount?: string;
    amount?: string;
    asset?: {
        code?: string;
        issuer?: string;
    };
    memo?: string;
    memoType?: "text" | "id" | "hash" | "return";
    // Contract-specific fields
    contractId?: string;
    functionName?: string;
    functionArgs?: any[];
    // XDR-specific field
    xdr?: string;
    // Path payment fields
    sendAsset?: {
        code?: string;
        issuer?: string;
    };
    sendMax?: string;
    destAsset?: {
        code?: string;
        issuer?: string;
    };
    destAmount?: string;
    path?: Array<{
        code?: string;
        issuer?: string;
    }>;
    // Trust line fields
    trustAsset?: {
        code: string;
        issuer: string;
    };
    trustLimit?: string;
    // Account creation fields
    startingBalance?: string;
}
