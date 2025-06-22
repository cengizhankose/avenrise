import { describe, it, expect, beforeEach, vi } from "vitest";
import { launchtubePlugin } from "../src";
import { submitTransaction, checkCredits } from "../src/actions";
import { LaunchtubeService } from "../src/services/launchtubeService";

describe("Launchtube Plugin", () => {
    it("should export the plugin correctly", () => {
        expect(launchtubePlugin).toBeDefined();
        expect(launchtubePlugin.name).toBe("launchtube");
        expect(launchtubePlugin.description).toContain("Stellar");
        expect(launchtubePlugin.actions).toHaveLength(2);
        expect(launchtubePlugin.services).toHaveLength(1);
    });

    it("should export actions", () => {
        expect(submitTransaction).toBeDefined();
        expect(submitTransaction.name).toBe("SUBMIT_STELLAR_TRANSACTION");
        expect(checkCredits).toBeDefined();
        expect(checkCredits.name).toBe("CHECK_LAUNCHTUBE_CREDITS");
    });

    it("should export services", () => {
        expect(LaunchtubeService).toBeDefined();
    });
});

describe("LaunchtubeService", () => {
    let service: LaunchtubeService;
    let mockRuntime: any;

    beforeEach(() => {
        service = new LaunchtubeService();
        mockRuntime = {
            getSetting: vi.fn().mockImplementation((key: string) => {
                switch (key) {
                    case "LAUNCHTUBE_API_KEY":
                        return "test-api-key";
                    case "LAUNCHTUBE_BASE_URL":
                        return "https://testnet.launchtube.xyz";
                    case "STELLAR_NETWORK":
                        return "testnet";
                    default:
                        return undefined;
                }
            }),
        };
    });

    it("should initialize with valid config", async () => {
        await expect(service.initialize(mockRuntime)).resolves.not.toThrow();
    });

    it("should fail initialization without API key", async () => {
        mockRuntime.getSetting.mockReturnValue(undefined);
        await expect(service.initialize(mockRuntime)).rejects.toThrow();
    });
});

describe("Actions Validation", () => {
    let mockRuntime: any;
    let mockMessage: any;

    beforeEach(() => {
        mockRuntime = {
            getSetting: vi.fn().mockReturnValue("test-api-key"),
        };
        mockMessage = {
            content: { text: "test message" },
            userId: "test-user",
            roomId: "test-room",
        };
    });

    it("should validate submitTransaction action", async () => {
        const isValid = await submitTransaction.validate(
            mockRuntime,
            mockMessage
        );
        expect(isValid).toBe(true);
    });

    it("should validate checkCredits action", async () => {
        const isValid = await checkCredits.validate(mockRuntime, mockMessage);
        expect(isValid).toBe(true);
    });

    it("should fail validation without API key", async () => {
        mockRuntime.getSetting.mockReturnValue(undefined);

        const isValidSubmit = await submitTransaction.validate(
            mockRuntime,
            mockMessage
        );
        const isValidCredits = await checkCredits.validate(
            mockRuntime,
            mockMessage
        );

        expect(isValidSubmit).toBe(false);
        expect(isValidCredits).toBe(false);
    });
});
