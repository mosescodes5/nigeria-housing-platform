import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LocalFileStorage, StorageUnavailableError, getStorage } from "./storage";

describe("LocalFileStorage", () => {
  it("round-trips files and returns null for missing ones", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "storage-"));
    const s = new LocalFileStorage(dir);
    await s.put("properties/p1/a.pdf", new Uint8Array([1, 2, 3]));
    expect(Array.from((await s.get("properties/p1/a.pdf"))!)).toEqual([1, 2, 3]);
    expect(await s.get("properties/p1/missing.pdf")).toBeNull();
  });

  it("rejects keys that escape the storage root", async () => {
    const s = new LocalFileStorage(await mkdtemp(path.join(os.tmpdir(), "storage-")));
    await expect(s.put("../escape.txt", new Uint8Array([1]))).rejects.toThrow("Invalid storage key");
    await expect(s.get("/etc/passwd")).rejects.toThrow("Invalid storage key");
  });
});

describe("getStorage", () => {
  it("refuses to fall back to local disk outside local/test", () => {
    const prev = process.env.APP_ENV;
    process.env.APP_ENV = "production";
    expect(() => getStorage()).toThrow(StorageUnavailableError);
    process.env.APP_ENV = prev;
  });
});
