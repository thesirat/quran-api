import { createRequire as __createRequire } from 'node:module';
import { fileURLToPath as __fileURLToPath } from 'node:url';
import { dirname as __dirname_ } from 'node:path';
const require = __createRequire(import.meta.url);
const __filename = __fileURLToPath(import.meta.url);
const __dirname = __dirname_(__filename);
import {
  updateRouteVersion
} from "./chunk-PMSMUMUO.js";
import {
  getRouteVersions
} from "./chunk-AHU7WNL2.js";
import {
  confirmAction,
  ensureProjectLink,
  getRoutes,
  parseSubcommandArgs,
  printDiffSummary,
  withGlobalFlags
} from "./chunk-MRUCUMUG.js";
import {
  discardSubcommand
} from "./chunk-SV3GZCMS.js";
import "./chunk-V7AUULPM.js";
import {
  outputAgentError
} from "./chunk-AACAZGTQ.js";
import "./chunk-MXPZBZ2X.js";
import {
  stamp_default
} from "./chunk-SOTR4CXR.js";
import "./chunk-AY4LBM3J.js";
import "./chunk-GGP5R3FU.js";
import {
  getCommandName
} from "./chunk-N7ABINT7.js";
import {
  output_manager_default
} from "./chunk-FDJURQMQ.js";
import {
  require_source
} from "./chunk-S7KYDPEM.js";
import {
  __toESM
} from "./chunk-TZ2YI2VH.js";

// src/commands/routes/discard.ts
var import_chalk = __toESM(require_source(), 1);
async function discard(client, argv) {
  const parsed = await parseSubcommandArgs(argv, discardSubcommand, client);
  if (typeof parsed === "number")
    return parsed;
  const link = await ensureProjectLink(client);
  if (typeof link === "number")
    return link;
  const { project, org } = link;
  const teamId = org.type === "team" ? org.id : void 0;
  output_manager_default.spinner(`Fetching route versions for ${import_chalk.default.bold(project.name)}`);
  const { versions } = await getRouteVersions(client, project.id, { teamId });
  const stagingVersion = versions.find((v) => v.isStaging);
  if (!stagingVersion) {
    output_manager_default.warn(
      `No staged changes to discard. Make changes first with ${import_chalk.default.cyan(
        getCommandName("routes add")
      )}.`
    );
    return 0;
  }
  output_manager_default.spinner("Fetching staged changes");
  const { routes: diffRoutes } = await getRoutes(client, project.id, {
    teamId,
    versionId: stagingVersion.id,
    diff: true
  });
  const changedRoutes = diffRoutes.filter((r) => r.action !== void 0);
  if (changedRoutes.length > 0) {
    output_manager_default.print(`
${import_chalk.default.bold("Changes to be discarded:")}

`);
    printDiffSummary(changedRoutes);
    output_manager_default.print("\n");
  } else {
    output_manager_default.print(
      `
${import_chalk.default.gray("No changes detected in staging version.")}

`
    );
  }
  const confirmed = await confirmAction(
    client,
    parsed.flags["--yes"],
    "Discard all staged changes?",
    `This action cannot be undone.`
  );
  if (!confirmed) {
    output_manager_default.log("Canceled");
    return 0;
  }
  const updateStamp = stamp_default();
  output_manager_default.spinner("Discarding staged changes");
  try {
    await updateRouteVersion(client, project.id, stagingVersion.id, "discard", {
      teamId
    });
    output_manager_default.log(
      `${import_chalk.default.cyan("Success!")} Staged changes discarded ${import_chalk.default.gray(
        updateStamp()
      )}`
    );
    return 0;
  } catch (e) {
    const error = e;
    const msg = error.message || "Failed to discard staged changes";
    if (client.nonInteractive) {
      outputAgentError(client, {
        status: "error",
        reason: "api_error",
        message: msg,
        next: [{ command: withGlobalFlags(client, "routes discard --yes") }]
      });
      process.exit(1);
      return 1;
    }
    output_manager_default.error(msg);
    return 1;
  }
}
export {
  discard as default
};
