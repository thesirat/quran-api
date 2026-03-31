import { createRequire as __createRequire } from 'node:module';
import { fileURLToPath as __fileURLToPath } from 'node:url';
import { dirname as __dirname_ } from 'node:path';
const require = __createRequire(import.meta.url);
const __filename = __fileURLToPath(import.meta.url);
const __dirname = __dirname_(__filename);
import {
  global_path_default
} from "./chunk-AACAZGTQ.js";
import {
  output_manager_default
} from "./chunk-FDJURQMQ.js";
import {
  require_source
} from "./chunk-S7KYDPEM.js";
import {
  __toESM
} from "./chunk-TZ2YI2VH.js";

// src/util/agent/auto-install-agentic.ts
var import_chalk = __toESM(require_source(), 1);
import { readFile, writeFile, readdir } from "fs/promises";
import { access } from "fs/promises";
import { join } from "path";
import { homedir } from "os";
import { spawn } from "child_process";
import { KNOWN_AGENTS } from "@vercel/detect-agent";
var PREFS_FILE = "agent-preferences.json";
var AGENT_TO_TARGET = {
  [KNOWN_AGENTS.CLAUDE]: "claude-code",
  [KNOWN_AGENTS.COWORK]: "claude-code",
  [KNOWN_AGENTS.CURSOR]: "cursor",
  [KNOWN_AGENTS.CURSOR_CLI]: "cursor"
};
async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}
async function readPrefs() {
  try {
    const raw = await readFile(
      join(global_path_default(), PREFS_FILE),
      "utf-8"
    );
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
async function writePrefs(prefs) {
  try {
    await writeFile(
      join(global_path_default(), PREFS_FILE),
      JSON.stringify(prefs, null, 2),
      "utf-8"
    );
  } catch {
  }
}
async function getPluginTargets(agentName) {
  if (agentName && AGENT_TO_TARGET[agentName]) {
    return [AGENT_TO_TARGET[agentName]];
  }
  const home = homedir();
  const targets = [];
  if (await fileExists(join(home, ".claude"))) {
    targets.push("claude-code");
  }
  if (await fileExists(join(home, ".cursor"))) {
    targets.push("cursor");
  }
  return targets;
}
async function isPluginInClaudeRegistry() {
  try {
    const raw = await readFile(
      join(homedir(), ".claude", "plugins", "installed_plugins.json"),
      "utf-8"
    );
    const data = JSON.parse(raw);
    const plugins = data?.plugins ?? {};
    return Object.keys(plugins).some(
      (key) => key.toLowerCase().includes("vercel-plugin")
    );
  } catch {
    return false;
  }
}
async function isPluginInCursorPlugins() {
  const pluginsDir = join(homedir(), ".cursor", "plugins");
  try {
    const entries = await readdir(pluginsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory())
        continue;
      if (entry.name.includes("vercel-plugin")) {
        return true;
      }
    }
  } catch {
    return false;
  }
  return false;
}
async function isPluginInstalledForTarget(target) {
  if (target === "claude-code") {
    return isPluginInClaudeRegistry();
  }
  if (target === "cursor") {
    return await isPluginInClaudeRegistry() || await isPluginInCursorPlugins();
  }
  return false;
}
async function confirm(client, message, autoConfirm) {
  if (autoConfirm && !client.isAgent) {
    return true;
  }
  if (!client.stdin.isTTY) {
    return false;
  }
  return client.input.confirm(message, true);
}
async function autoInstallAgentTooling(client, options) {
  try {
    const prefs = await readPrefs();
    if (!prefs.pluginDismissed) {
      const targets = await getPluginTargets(client.agentName);
      const uninstalledTargets = [];
      for (const target of targets) {
        if (!await isPluginInstalledForTarget(target)) {
          uninstalledTargets.push(target);
        }
      }
      if (uninstalledTargets.length > 0) {
        if (client.isAgent && !client.stdin.isTTY) {
          const next = uninstalledTargets.map((target) => ({
            command: `npx plugins add vercel/vercel-plugin --target ${target} -y`,
            when: `Install Vercel plugin for ${target}`
          }));
          client.stdout.write(
            `${JSON.stringify(
              {
                status: "action_required",
                reason: "plugin_install",
                message: "The Vercel plugin enhances your agent experience. Would you like to install it?",
                next
              },
              null,
              2
            )}
`
          );
          prefs.pluginDismissed = true;
          await writePrefs(prefs);
          return;
        }
        const targetList = uninstalledTargets.join(", ");
        output_manager_default.log(
          `The Vercel plugin installs on your agent harness (${targetList}) to give your AI agent the ability to manage deployments, environments, and more.`
        );
        const accepted = await confirm(
          client,
          "Install the Vercel plugin?",
          options?.autoConfirm
        );
        if (accepted) {
          let interrupted = false;
          for (const target of uninstalledTargets) {
            if (interrupted)
              break;
            output_manager_default.spinner(`Installing Vercel plugin for ${target}...`);
            const exitCode = await new Promise((resolve) => {
              const child = spawn(
                "npx",
                [
                  "plugins",
                  "add",
                  "vercel/vercel-plugin",
                  "--target",
                  target,
                  "-y"
                ],
                { stdio: "pipe" }
              );
              const onSigint = () => {
                interrupted = true;
                child.kill();
              };
              process.once("SIGINT", onSigint);
              child.on("close", (c) => {
                process.removeListener("SIGINT", onSigint);
                resolve(c ?? 1);
              });
              child.on("error", () => {
                process.removeListener("SIGINT", onSigint);
                resolve(1);
              });
            });
            output_manager_default.stopSpinner();
            if (interrupted) {
              output_manager_default.log("Plugin installation cancelled.");
              break;
            }
            if (exitCode === 0) {
              output_manager_default.success(`Installed Vercel plugin for ${target}`);
            } else {
              output_manager_default.debug(`Failed to install Vercel plugin for ${target}`);
            }
          }
        } else {
          prefs.pluginDismissed = true;
          await writePrefs(prefs);
        }
      }
    }
  } catch (err) {
    output_manager_default.debug(`Auto-install agent tooling failed: ${err}`);
  }
}
async function showPluginTipIfNeeded() {
  try {
    const prefs = await readPrefs();
    if (prefs.pluginDismissed)
      return;
    const targets = await getPluginTargets();
    for (const target of targets) {
      if (!await isPluginInstalledForTarget(target)) {
        output_manager_default.log(
          import_chalk.default.dim(
            "Tip: Run `npx plugins add vercel/vercel-plugin` to enhance your agent experience"
          )
        );
        return;
      }
    }
  } catch {
  }
}

export {
  autoInstallAgentTooling,
  showPluginTipIfNeeded
};
