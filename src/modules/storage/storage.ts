import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export interface FileStorage {
  put(key: string, data: Uint8Array): Promise<void>;
  get(key: string): Promise<Uint8Array | null>;
}

/** Development/test adapter. Files live outside the public folder and are served only through authorised routes. */
export class LocalFileStorage implements FileStorage {
  private readonly root: string;
  constructor(root: string) {
    this.root = path.resolve(root);
  }

  private resolve(key: string): string {
    const full = path.resolve(this.root, key);
    if (!full.startsWith(this.root + path.sep)) throw new Error("Invalid storage key");
    return full;
  }

  async put(key: string, data: Uint8Array): Promise<void> {
    const full = this.resolve(key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, data);
  }

  async get(key: string): Promise<Uint8Array | null> {
    try {
      return await readFile(this.resolve(key));
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw e;
    }
  }
}

export class StorageUnavailableError extends Error {}

/** Production object storage (private bucket, encryption at rest) is part of Phase 7. */
export function getStorage(): FileStorage {
  const env = process.env.APP_ENV;
  if (env === "local" || env === "test") return new LocalFileStorage(process.env.LOCAL_STORAGE_DIR ?? ".storage");
  throw new StorageUnavailableError("No object storage is configured for this environment");
}
