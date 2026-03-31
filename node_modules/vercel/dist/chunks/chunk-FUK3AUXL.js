import { createRequire as __createRequire } from 'node:module';
import { fileURLToPath as __fileURLToPath } from 'node:url';
import { dirname as __dirname_ } from 'node:path';
const require = __createRequire(import.meta.url);
const __filename = __fileURLToPath(import.meta.url);
const __dirname = __dirname_(__filename);
import {
  VERCEL_DIR
} from "./chunk-AACAZGTQ.js";
import {
  ConflictingConfigFiles,
  InvalidLocalConfig,
  getArgs
} from "./chunk-N7ABINT7.js";

// src/util/config/local-path.ts
import path from "path";
import { existsSync } from "fs";
function getLocalPathConfig(prefix) {
  const argv = getArgs(process.argv.slice(2), {}, { permissive: true });
  const customPath = argv["--local-config"];
  if (customPath) {
    if (typeof customPath !== "string") {
      throw new InvalidLocalConfig(customPath);
    }
    return path.resolve(prefix, customPath);
  }
  const vercelConfigPath = path.join(prefix, "vercel.json");
  const nowConfigPath = path.join(prefix, "now.json");
  const vercelConfigExists = existsSync(vercelConfigPath);
  const nowConfigExists = existsSync(nowConfigPath);
  if (nowConfigExists && vercelConfigExists) {
    throw new ConflictingConfigFiles([vercelConfigPath, nowConfigPath]);
  }
  const compiledConfigPath = path.join(prefix, VERCEL_DIR, "vercel.json");
  const compiledConfigExists = existsSync(compiledConfigPath);
  if (compiledConfigExists) {
    return compiledConfigPath;
  }
  if (nowConfigExists) {
    return nowConfigPath;
  }
  return vercelConfigPath;
}

export {
  getLocalPathConfig
};
