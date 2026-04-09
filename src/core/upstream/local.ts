import fs from "node:fs/promises";
import path from "node:path";
import { ROOT, assertSafeDataRelPath, assertLocalCorpusFilesystemAllowed, isNotFoundError } from "../data-io.js";
import type { DataReader } from "./client.js";

export function createLocalReader(): DataReader {
  return {
    async readText(relPath: string): Promise<string> {
      assertSafeDataRelPath(relPath);
      assertLocalCorpusFilesystemAllowed();
      return fs.readFile(path.join(ROOT, relPath), "utf-8");
    },

    async tryReadText(relPath: string): Promise<string | undefined> {
      try {
        return await this.readText(relPath);
      } catch (e) {
        if (isNotFoundError(e)) return undefined;
        throw e;
      }
    },

    async readBuffer(relPath: string): Promise<Buffer | null> {
      assertSafeDataRelPath(relPath);
      assertLocalCorpusFilesystemAllowed();
      try {
        return await fs.readFile(path.join(ROOT, relPath));
      } catch (e) {
        if (isNotFoundError(e)) return null;
        throw e;
      }
    },
  };
}
