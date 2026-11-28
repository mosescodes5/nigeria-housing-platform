import { describe, expect, it } from "vitest";
import { sanitizeFileName, sniffFile } from "./validate";

describe("sniffFile", () => {
  it("recognises PDF, JPEG and PNG by content", () => {
    expect(sniffFile(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]))?.ext).toBe("pdf");
    expect(sniffFile(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))?.mime).toBe("image/jpeg");
    expect(sniffFile(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]))?.ext).toBe("png");
  });
  it("rejects anything else, including scripts renamed to .pdf", () => {
    expect(sniffFile(new TextEncoder().encode("<script>alert(1)</script>"))).toBeNull();
    expect(sniffFile(new Uint8Array([]))).toBeNull();
  });
});

describe("sanitizeFileName", () => {
  it("strips paths and unsafe characters", () => {
    expect(sanitizeFileName("../../etc/passwd")).toBe("passwd");
    expect(sanitizeFileName("C:\\docs\\deed<1>.pdf")).toBe("deed1.pdf");
    expect(sanitizeFileName("")).toBe("document");
  });
});
