export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const SIGNATURES = [
  { mime: "application/pdf", ext: "pdf", bytes: [0x25, 0x50, 0x44, 0x46, 0x2d] },
  { mime: "image/jpeg", ext: "jpg", bytes: [0xff, 0xd8, 0xff] },
  { mime: "image/png", ext: "png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
] as const;

/** Identifies the file from its content. The browser-supplied type and extension are never trusted. */
export function sniffFile(data: Uint8Array): { mime: string; ext: string } | null {
  for (const s of SIGNATURES) {
    if (data.length >= s.bytes.length && s.bytes.every((b, i) => data[i] === b)) return { mime: s.mime, ext: s.ext };
  }
  return null;
}

export function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "";
  // eslint-disable-next-line no-control-regex
  const cleaned = base.replace(/[\u0000-\u001f"<>|:*?]/g, "").trim().slice(0, 100);
  return cleaned || "document";
}
