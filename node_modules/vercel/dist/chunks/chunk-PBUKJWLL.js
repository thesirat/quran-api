import { createRequire as __createRequire } from 'node:module';
import { fileURLToPath as __fileURLToPath } from 'node:url';
import { dirname as __dirname_ } from 'node:path';
const require = __createRequire(import.meta.url);
const __filename = __fileURLToPath(import.meta.url);
const __dirname = __dirname_(__filename);
import {
  getUpdateCommand
} from "./chunk-JFTBLO4O.js";
import {
  login
} from "./chunk-LRGCB3GI.js";
import {
  loginCommand
} from "./chunk-BU4VHI53.js";
import {
  help
} from "./chunk-O5OD4JWH.js";
import {
  TelemetryClient
} from "./chunk-MXPZBZ2X.js";
import {
  getFlagsSpecification,
  parseArguments,
  printError,
  require_strip_ansi
} from "./chunk-N7ABINT7.js";
import {
  output_manager_default
} from "./chunk-FDJURQMQ.js";
import {
  require_source
} from "./chunk-S7KYDPEM.js";
import {
  __commonJS,
  __toESM
} from "./chunk-TZ2YI2VH.js";

// ../../node_modules/.pnpm/jaro-winkler@0.2.8/node_modules/jaro-winkler/index.js
var require_jaro_winkler = __commonJS({
  "../../node_modules/.pnpm/jaro-winkler@0.2.8/node_modules/jaro-winkler/index.js"(exports, module) {
    (function(root) {
      "use strict";
      function extend(a, b) {
        for (var property in b) {
          if (b.hasOwnProperty(property)) {
            a[property] = b[property];
          }
        }
        return a;
      }
      function distance2(s1, s2, options) {
        var m = 0;
        var defaults = { caseSensitive: true };
        var settings = extend(defaults, options);
        var i;
        var j;
        if (s1.length === 0 || s2.length === 0) {
          return 0;
        }
        if (!settings.caseSensitive) {
          s1 = s1.toUpperCase();
          s2 = s2.toUpperCase();
        }
        if (s1 === s2) {
          return 1;
        }
        var range = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
        var s1Matches = new Array(s1.length);
        var s2Matches = new Array(s2.length);
        for (i = 0; i < s1.length; i++) {
          var low = i >= range ? i - range : 0;
          var high = i + range <= s2.length - 1 ? i + range : s2.length - 1;
          for (j = low; j <= high; j++) {
            if (s1Matches[i] !== true && s2Matches[j] !== true && s1[i] === s2[j]) {
              ++m;
              s1Matches[i] = s2Matches[j] = true;
              break;
            }
          }
        }
        if (m === 0) {
          return 0;
        }
        var k = 0;
        var numTrans = 0;
        for (i = 0; i < s1.length; i++) {
          if (s1Matches[i] === true) {
            for (j = k; j < s2.length; j++) {
              if (s2Matches[j] === true) {
                k = j + 1;
                break;
              }
            }
            if (s1[i] !== s2[j]) {
              ++numTrans;
            }
          }
        }
        var weight = (m / s1.length + m / s2.length + (m - numTrans / 2) / m) / 3;
        var l = 0;
        var p = 0.1;
        if (weight > 0.7) {
          while (s1[l] === s2[l] && l < 4) {
            ++l;
          }
          weight = weight + l * p * (1 - weight);
        }
        return weight;
      }
      if (typeof define === "function" && define.amd) {
        define([], function() {
          return distance2;
        });
      } else if (typeof exports === "object") {
        module.exports = distance2;
      } else {
        root.distance = distance2;
      }
    })(exports);
  }
});

// src/util/upgrade.ts
import { spawn } from "child_process";
async function executeUpgrade() {
  const updateCommand = await getUpdateCommand();
  const [command, ...args] = updateCommand.split(" ");
  output_manager_default.log(`Upgrading Vercel CLI...`);
  output_manager_default.debug(`Executing: ${updateCommand}`);
  return new Promise((resolve) => {
    const stdout = [];
    const stderr = [];
    const upgradeProcess = spawn(command, args, {
      stdio: ["inherit", "pipe", "pipe"],
      shell: false
    });
    upgradeProcess.stdout?.on("data", (data) => {
      stdout.push(data);
    });
    upgradeProcess.stderr?.on("data", (data) => {
      stderr.push(data);
    });
    upgradeProcess.on("error", (err) => {
      output_manager_default.error(`Failed to execute upgrade command: ${err.message}`);
      output_manager_default.log(`You can try running the command manually: ${updateCommand}`);
      resolve(1);
    });
    upgradeProcess.on("close", (code) => {
      if (code === 0) {
        output_manager_default.success("Vercel CLI has been upgraded successfully!");
      } else {
        const stdoutStr = Buffer.concat(stdout).toString();
        const stderrStr = Buffer.concat(stderr).toString();
        if (stdoutStr) {
          output_manager_default.print(stdoutStr);
        }
        if (stderrStr) {
          output_manager_default.print(stderrStr);
        }
        output_manager_default.error(`Upgrade failed with exit code ${code ?? "unknown"}`);
        output_manager_default.log(
          `You can try running the command manually: ${updateCommand}`
        );
      }
      resolve(code ?? 1);
    });
  });
}

// src/commands/login/index.ts
var import_chalk = __toESM(require_source(), 1);

// src/util/telemetry/commands/login/index.ts
var LoginTelemetryClient = class extends TelemetryClient {
  /**
   * Tracks the state of the login process.
   * - `started` when the user initiates the login process.
   * - `canceled` when the user cancels the login process.
   * - `error` when the user encounters an error during the login process.
   * - `success` when the user successfully logs in.
   */
  trackState(...args) {
    this.trackLoginState(...args);
  }
};

// src/commands/login/index.ts
async function login2(client, options) {
  let parsedArgs = null;
  const flagsSpecification = getFlagsSpecification(loginCommand.options);
  const telemetry = new LoginTelemetryClient({
    opts: {
      store: client.telemetryEventStore
    }
  });
  try {
    if (options.shouldParseArgs) {
      parsedArgs = parseArguments(client.argv.slice(2), flagsSpecification);
    }
  } catch (error) {
    printError(error);
    return 1;
  }
  if (parsedArgs?.flags["--help"]) {
    telemetry.trackCliFlagHelp("login");
    output_manager_default.print(help(loginCommand, { columns: client.stderr.columns }));
    return 0;
  }
  if (parsedArgs?.flags["--token"]) {
    output_manager_default.error('`--token` may not be used with the "login" command');
    return 2;
  }
  if (options.shouldParseArgs && parsedArgs) {
    const obsoleteFlags = Object.keys(parsedArgs.flags).filter((flag) => {
      const flagKey = flag.replace("--", "");
      const option = loginCommand.options.find((o) => o.name === flagKey);
      if (!option || typeof option === "number")
        return;
      return "deprecated" in option && option.deprecated;
    });
    if (obsoleteFlags.length) {
      const flags = obsoleteFlags.map((f) => import_chalk.default.bold(f)).join(", ");
      output_manager_default.warn(`The following flags are deprecated: ${flags}`);
    }
    const obsoleteArguments = parsedArgs.args.slice(1);
    if (obsoleteArguments.length) {
      const args = obsoleteArguments.map((a) => import_chalk.default.bold(a)).join(", ");
      output_manager_default.warn(`The following arguments are deprecated: ${args}`);
    }
    if (obsoleteArguments.length || obsoleteFlags.length) {
      output_manager_default.print(
        `Read more in our ${output_manager_default.link("changelog", "https://vercel.com/changelog/new-vercel-cli-login-flow")}.
`
      );
    }
  }
  telemetry.trackState("started");
  return await login(client, telemetry);
}

// src/util/output/box.ts
var import_chalk2 = __toESM(require_source(), 1);
var import_strip_ansi = __toESM(require_strip_ansi(), 1);
var border = ["\u2500", "\u256D", "\u256E", "\u2502", "\u2502", "\u2570", "\u256F"];
var nothing = ["\u2500", "", "", "", "", "", ""];
function box(message, {
  borderColor,
  padding = 1,
  textAlignment = "center",
  terminalColumns: cols = process.stdout.columns || process.env.COLUMNS && parseInt(process.env.COLUMNS, 10) || 80
} = {}) {
  const lines = message.split(/\r?\n/).map((line) => [line, (0, import_strip_ansi.default)(line).length]);
  const maxLine = lines.reduce((p, [, len]) => Math.max(p, len), 0);
  const borderColorFn = borderColor && import_chalk2.default[borderColor] || import_chalk2.default.yellow;
  const clampedSidePadding = Math.max(1, padding * 3);
  const narrowMode = maxLine + 2 + clampedSidePadding * 2 > cols;
  const sidePadding = narrowMode ? 0 : clampedSidePadding;
  const innerWidth = Math.min(maxLine + sidePadding * 2, cols);
  const [hr, topLeft, topRight, left, right, bottomLeft, bottomRight] = narrowMode ? nothing : border;
  const spacerRow = narrowMode ? "\n".repeat(padding) : `${borderColorFn(`${left}${" ".repeat(innerWidth)}${right}`)}
`.repeat(
    padding
  );
  const renderLine = ([line, len]) => {
    let leftPadding = 0;
    let rightPadding = 0;
    if (!narrowMode) {
      leftPadding = sidePadding;
      rightPadding = sidePadding;
      if (textAlignment === "center") {
        leftPadding += Math.floor((maxLine - len) / 2);
        rightPadding += maxLine - len - leftPadding + sidePadding;
      } else if (textAlignment === "right") {
        leftPadding += maxLine - len;
      } else if (textAlignment === "left") {
        rightPadding += maxLine - len;
      }
    }
    return borderColorFn(left) + " ".repeat(leftPadding) + line + " ".repeat(rightPadding) + borderColorFn(right);
  };
  return borderColorFn(`${topLeft}${hr.repeat(innerWidth)}${topRight}`) + "\n" + spacerRow + lines.map(renderLine).join("\n") + "\n" + spacerRow + borderColorFn(`${bottomLeft}${hr.repeat(innerWidth)}${bottomRight}`);
}

// src/util/did-you-mean.ts
var import_jaro_winkler = __toESM(require_jaro_winkler(), 1);
var did_you_mean_default = didYouMean;
function didYouMean(input, list, threshold = 0.5) {
  const rated = list.map((item) => [dashAwareDistance(input, item), item]);
  const found = rated.filter((item) => item[0] > threshold);
  if (found.length) {
    const highestRated = found.reduce((accu, curr) => {
      return accu[0] > curr[0] ? accu : curr;
    });
    return highestRated[1];
  }
}
function dashAwareDistance(word, dashWord) {
  const fullDistance = (0, import_jaro_winkler.default)(word, dashWord);
  const distances = dashWord.split("-").map((w) => (0, import_jaro_winkler.default)(w, word));
  const meanDistance = distances.reduce((accu, curr) => accu + curr) / distances.length;
  return fullDistance > meanDistance ? fullDistance : meanDistance;
}

export {
  did_you_mean_default,
  executeUpgrade,
  login2 as login,
  box
};
