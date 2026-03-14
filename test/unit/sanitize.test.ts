import { describe, it, expect } from "vitest";
import { sanitizeText } from "@/lib/sanitize";

describe("sanitizeText", () => {
    it("trims leading and trailing whitespace", () => {
        expect(sanitizeText("  hello world  ")).toBe("hello world");
    });

    it("collapses multiple spaces into one", () => {
        expect(sanitizeText("hello    world")).toBe("hello world");
    });

    it("collapses tabs and newlines into spaces", () => {
        expect(sanitizeText("hello\t\tworld\nfoo")).toBe("hello world foo");
    });

    it("handles empty string", () => {
        expect(sanitizeText("")).toBe("");
    });

    it("handles string with only whitespace", () => {
        expect(sanitizeText("   \t\n  ")).toBe("");
    });

    it("does not modify already clean text", () => {
        expect(sanitizeText("hello world")).toBe("hello world");
    });
});
