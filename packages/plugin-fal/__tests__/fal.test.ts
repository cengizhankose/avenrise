import { describe, it, expect } from "vitest";
import { falPlugin } from "../src";

describe("FAL Plugin", () => {
    it("should have correct plugin structure", () => {
        expect(falPlugin).toBeDefined();
        expect(falPlugin.name).toBe("fal");
        expect(falPlugin.description).toContain("Image and video generation");
        expect(falPlugin.actions).toBeDefined();
        expect(falPlugin.services).toBeDefined();
        expect(falPlugin.actions.length).toBe(2); // generateImage and generateVideo
        expect(falPlugin.services.length).toBe(1); // FalService
    });

    it("should export actions with correct names", () => {
        const actionNames = falPlugin.actions.map((action) => action.name);
        expect(actionNames).toContain("GENERATE_IMAGE");
        expect(actionNames).toContain("GENERATE_VIDEO");
    });

    it("should have proper action similes", () => {
        const imageAction = falPlugin.actions.find(
            (action) => action.name === "GENERATE_IMAGE"
        );
        const videoAction = falPlugin.actions.find(
            (action) => action.name === "GENERATE_VIDEO"
        );

        expect(imageAction?.similes).toContain("CREATE_IMAGE");
        expect(imageAction?.similes).toContain("MAKE_IMAGE");
        expect(videoAction?.similes).toContain("CREATE_VIDEO");
        expect(videoAction?.similes).toContain("MAKE_VIDEO");
    });
});
