import { describe, it, expect, vi } from "vitest";
import { downscaleImageBase64, compressImage } from "../../utils/imageUtils";

describe("imageUtils", () => {
  it("downscaleImageBase64 should return the same string currently", () => {
    const input = "data:image/png;base64,mockbase64";
    expect(downscaleImageBase64(input)).toBe(input);
  });

  it("compressImage should resolve with base64 data and mimeType", async () => {
    const mockFile = new File(["test data"], "test.png", { type: "image/png" });

    // Mock FileReader behavior
    const originalFileReader = global.FileReader;
    const mockFileReader = {
      readAsDataURL: vi.fn(function (this: any, file: File) {
        this.result = `data:${file.type};base64,dGVzdCBkYXRh`;
        if (this.onload) {
          this.onload();
        }
      }),
      onerror: null as any,
      onload: null as any,
      result: null as any,
    } as unknown as FileReader;

    vi.stubGlobal(
      "FileReader",
      vi.fn(() => mockFileReader),
    );

    const result = await compressImage(mockFile);
    expect(result).toEqual({
      base64Data: "dGVzdCBkYXRh",
      mimeType: "image/png",
    });

    vi.unstubAllGlobals();
  });

  it("compressImage should reject on FileReader error", async () => {
    const mockFile = new File(["test data"], "test.png", { type: "image/png" });

    const mockFileReader = {
      readAsDataURL: vi.fn(function (this: any) {
        if (this.onerror) {
          this.onerror(new Error("File read error"));
        }
      }),
      onerror: null as any,
      onload: null as any,
    } as unknown as FileReader;

    vi.stubGlobal(
      "FileReader",
      vi.fn(() => mockFileReader),
    );

    await expect(compressImage(mockFile)).rejects.toThrow("File read error");

    vi.unstubAllGlobals();
  });
});
