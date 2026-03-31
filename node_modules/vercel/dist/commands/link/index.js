import { createRequire as __createRequire } from 'node:module';
import { fileURLToPath as __fileURLToPath } from 'node:url';
import { dirname as __dirname_ } from 'node:path';
const require = __createRequire(import.meta.url);
const __filename = __fileURLToPath(import.meta.url);
const __dirname = __dirname_(__filename);
import {
  autoInstallAgentTooling
} from "../../chunks/chunk-NKBY7GFB.js";
import {
  getSubcommand
} from "../../chunks/chunk-YPQSDAEW.js";
import {
  addSubcommand6 as addSubcommand,
  getCommandAliases,
  linkCommand
} from "../../chunks/chunk-BU4VHI53.js";
import "../../chunks/chunk-SV3GZCMS.js";
import "../../chunks/chunk-ZFRYHXOW.js";
import "../../chunks/chunk-3KZHRNXR.js";
import "../../chunks/chunk-7DONLUDG.js";
import "../../chunks/chunk-U2VTKOYW.js";
import "../../chunks/chunk-2MZ2A7NV.js";
import {
  ensureLink
} from "../../chunks/chunk-LRHAZC7D.js";
import "../../chunks/chunk-V53ANR46.js";
import "../../chunks/chunk-FUK3AUXL.js";
import "../../chunks/chunk-UNW5ZUOV.js";
import {
  help
} from "../../chunks/chunk-O5OD4JWH.js";
import {
  addRepoLink,
  ensureRepoLink,
  getTeams
} from "../../chunks/chunk-AACAZGTQ.js";
import {
  TelemetryClient
} from "../../chunks/chunk-MXPZBZ2X.js";
import "../../chunks/chunk-SOTR4CXR.js";
import "../../chunks/chunk-CTY6ZEQZ.js";
import "../../chunks/chunk-AY4LBM3J.js";
import "../../chunks/chunk-GGP5R3FU.js";
import {
  cmd,
  getFlagsSpecification,
  parseArguments,
  printError
} from "../../chunks/chunk-N7ABINT7.js";
import {
  output_manager_default
} from "../../chunks/chunk-FDJURQMQ.js";
import "../../chunks/chunk-S7KYDPEM.js";
import "../../chunks/chunk-TZ2YI2VH.js";

// src/util/telemetry/commands/link/index.ts
var LinkTelemetryClient = class extends TelemetryClient {
  trackCliArgumentCwd() {
    this.trackCliArgument({
      arg: "cwd",
      value: this.redactedValue
    });
  }
  trackCliFlagRepo(flag) {
    if (flag) {
      this.trackCliFlag("repo");
    }
  }
  trackCliFlagYes(yes) {
    if (yes) {
      this.trackCliFlag("yes");
    }
  }
  trackCliFlagConfirm(flag) {
    if (flag) {
      this.trackCliFlag("confirm");
    }
  }
  trackCliOptionProject(project) {
    if (project) {
      this.trackCliOption({
        option: "project",
        value: this.redactedValue
      });
    }
  }
  trackCliOptionTeam(value) {
    if (value) {
      this.trackCliOption({
        option: "team",
        value: this.redactedValue
      });
    }
  }
  trackCliOptionProjectId(value) {
    if (value) {
      this.trackCliOption({
        option: "project-id",
        value: this.redactedValue
      });
    }
  }
  trackCliSubcommandAdd(actual) {
    this.trackCliSubcommand({
      subcommand: "add",
      value: actual
    });
  }
};

// src/commands/link/index.ts
var COMMAND_CONFIG = {
  add: getCommandAliases(addSubcommand)
};
async function link(client) {
  let parsedArgs = null;
  const flagsSpecification = getFlagsSpecification(linkCommand.options);
  try {
    parsedArgs = parseArguments(client.argv.slice(2), flagsSpecification, {
      permissive: true
    });
  } catch (error) {
    printError(error);
    return 1;
  }
  const { subcommand, subcommandOriginal } = getSubcommand(
    parsedArgs.args.slice(1),
    COMMAND_CONFIG
  );
  const telemetry = new LinkTelemetryClient({
    opts: {
      store: client.telemetryEventStore
    }
  });
  function printHelp(command) {
    output_manager_default.print(
      help(command, { parent: linkCommand, columns: client.stderr.columns })
    );
  }
  if (subcommand === "add") {
    if (parsedArgs.flags["--help"]) {
      telemetry.trackCliFlagHelp("link", subcommandOriginal);
      printHelp(addSubcommand);
      return 2;
    }
    telemetry.trackCliSubcommandAdd(subcommandOriginal);
    const yes2 = !!parsedArgs.flags["--yes"];
    try {
      await addRepoLink(client, client.cwd, { yes: yes2 });
    } catch (err) {
      output_manager_default.prettyError(err);
      return 1;
    }
    await autoInstallAgentTooling(client, {
      autoConfirm: yes2
    });
    return 0;
  }
  try {
    parsedArgs = parseArguments(client.argv.slice(2), flagsSpecification);
  } catch (error) {
    printError(error);
    return 1;
  }
  if (parsedArgs.flags["--help"]) {
    telemetry.trackCliFlagHelp("link");
    output_manager_default.print(help(linkCommand, { columns: client.stderr.columns }));
    return 2;
  }
  telemetry.trackCliFlagRepo(parsedArgs.flags["--repo"]);
  telemetry.trackCliFlagYes(parsedArgs.flags["--yes"]);
  telemetry.trackCliOptionProject(parsedArgs.flags["--project"]);
  if ("--confirm" in parsedArgs.flags) {
    telemetry.trackCliFlagConfirm(parsedArgs.flags["--confirm"]);
    output_manager_default.warn("`--confirm` is deprecated, please use `--yes` instead");
    parsedArgs.flags["--yes"] = parsedArgs.flags["--confirm"];
  }
  const yes = !!parsedArgs.flags["--yes"];
  let cwd = parsedArgs.args[1];
  if (cwd) {
    telemetry.trackCliArgumentCwd();
    output_manager_default.warn(
      `The ${cmd("vc link <directory>")} syntax is deprecated, please use ${cmd(
        `vc link --cwd ${cwd}`
      )} instead`
    );
  } else {
    cwd = client.cwd;
  }
  if (parsedArgs.flags["--repo"]) {
    output_manager_default.warn(`The ${cmd("--repo")} flag is in alpha, please report issues`);
    try {
      await ensureRepoLink(client, cwd, { yes, overwrite: true });
    } catch (err) {
      output_manager_default.prettyError(err);
      return 1;
    }
  } else {
    const teamFlag = parsedArgs.flags["--team"];
    if (typeof teamFlag === "string" && !client.config.currentTeam) {
      try {
        const teams = await getTeams(client);
        const related = teams.find(
          (t) => t.id === teamFlag || t.slug === teamFlag
        );
        if (related) {
          client.config.currentTeam = related.id;
        }
      } catch {
      }
    }
    const linkNonInteractive = client.nonInteractive || client.argv.includes("--non-interactive");
    const link2 = await ensureLink("link", client, cwd, {
      autoConfirm: yes,
      forceDelete: true,
      projectName: parsedArgs.flags["--project"],
      successEmoji: "success",
      nonInteractive: linkNonInteractive
    });
    if (typeof link2 === "number") {
      return link2;
    }
  }
  await autoInstallAgentTooling(client, {
    autoConfirm: yes
  });
  return 0;
}
export {
  link as default
};
