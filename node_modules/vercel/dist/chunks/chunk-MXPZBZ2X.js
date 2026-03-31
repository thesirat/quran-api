import { createRequire as __createRequire } from 'node:module';
import { fileURLToPath as __fileURLToPath } from 'node:url';
import { dirname as __dirname_ } from 'node:path';
const require = __createRequire(import.meta.url);
const __filename = __fileURLToPath(import.meta.url);
const __dirname = __dirname_(__filename);
import {
  output_manager_default
} from "./chunk-FDJURQMQ.js";
import {
  __commonJS,
  __toESM
} from "./chunk-TZ2YI2VH.js";

// ../../internals/constants/dist/index.js
var require_dist = __commonJS({
  "../../internals/constants/dist/index.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.TITLE = exports.NAME = exports.LOGO = exports.PROJECT_ENV_TARGET = void 0;
    exports.PROJECT_ENV_TARGET = [
      "production",
      "preview",
      "development"
    ];
    exports.LOGO = "\u25B2";
    exports.NAME = "vercel";
    exports.TITLE = "Vercel";
  }
});

// src/util/telemetry/index.ts
import { randomUUID } from "crypto";
import os from "os";
var import_constants = __toESM(require_dist(), 1);
import { spawn } from "child_process";
import { cloneEnv } from "@vercel/build-utils";
var LogLabel = `['telemetry']:`;
var TelemetryClient = class {
  constructor({ opts }) {
    this.redactedValue = "[REDACTED]";
    this.noValueToTriggerPrompt = "[TRIGGER_PROMPT]";
    this.redactedArgumentsLength = (args) => {
      if (args && args.length === 1) {
        return "ONE";
      }
      if (args.length > 1) {
        return "MANY";
      }
      return "NONE";
    };
    this.redactedTargetName = (target) => {
      if (import_constants.PROJECT_ENV_TARGET.includes(target)) {
        return target;
      }
      return this.redactedValue;
    };
    this.isDebug = opts.isDebug || false;
    this.store = opts.store;
  }
  track(eventData) {
    if (this.isDebug) {
      output_manager_default.debug(`${LogLabel} ${eventData.key}:${eventData.value}`);
    }
    const event = {
      id: randomUUID(),
      eventTime: Date.now(),
      ...eventData
    };
    this.store.add(event);
  }
  trackCliCommand(eventData) {
    this.track({
      key: `command:${eventData.command}`,
      value: eventData.value
    });
  }
  trackCliSubcommand(eventData) {
    this.track({
      key: `subcommand:${eventData.subcommand}`,
      value: eventData.value
    });
  }
  trackCliArgument(eventData) {
    if (eventData.value) {
      this.track({
        key: `argument:${eventData.arg}`,
        value: eventData.value
      });
    }
  }
  trackCliOption(eventData) {
    this.track({
      key: `option:${eventData.option}`,
      value: eventData.value
    });
  }
  trackCommandOutput(eventData) {
    this.track({
      key: `output:${eventData.key}`,
      value: eventData.value
    });
  }
  trackCliFlag(flag) {
    this.track({
      key: `flag:${flag}`,
      value: "TRUE"
    });
  }
  trackOidcTokenRefresh(count) {
    this.track({
      key: "oidc-token-refresh",
      value: `${count}`
    });
  }
  trackCPUs() {
    this.track({
      key: "cpu_count",
      value: String(os.cpus().length)
    });
  }
  trackAgenticUse(agent) {
    if (agent) {
      this.track({
        key: "agent",
        value: agent
      });
    }
  }
  trackPlatform() {
    this.track({
      key: "platform",
      value: os.platform()
    });
  }
  trackArch() {
    this.track({
      key: "arch",
      value: os.arch()
    });
  }
  trackCI(ciVendorName) {
    if (ciVendorName) {
      this.track({
        key: "ci",
        value: ciVendorName
      });
    }
  }
  trackStdinIsTTY(isTTY) {
    this.track({
      key: "stdin_is_tty",
      value: isTTY ? "true" : "false"
    });
  }
  trackVersion(version) {
    if (version) {
      this.track({
        key: "version",
        value: version
      });
    }
  }
  trackDefaultDeploy() {
    this.track({
      key: "default-deploy",
      value: "TRUE"
    });
  }
  trackExtension() {
    this.track({
      key: "extension",
      value: this.redactedValue
    });
  }
  trackLoginState(state) {
    if (state === "started")
      this.loginAttempt = randomUUID();
    if (this.loginAttempt) {
      this.track({ key: `login:attempt:${this.loginAttempt}`, value: state });
    }
    if (state !== "started")
      this.loginAttempt = void 0;
  }
  trackCliFlagHelp(command, subcommands) {
    let subcommand;
    if (subcommands) {
      subcommand = Array.isArray(subcommands) ? subcommands[0] : subcommands;
    }
    this.track({
      key: "flag:help",
      value: subcommand ? `${command}:${subcommand}` : command
    });
  }
  /**
   * Tracks the --format option for JSON output.
   * This is a common option across many commands, so it's defined in the base class.
   */
  trackCliOptionFormat(format) {
    if (format) {
      const allowedFormat = ["json"].includes(format) ? format : this.redactedValue;
      this.trackCliOption({
        option: "format",
        value: allowedFormat
      });
    }
  }
};
var TelemetryEventStore = class {
  constructor(opts) {
    this.teamId = "NO_TEAM_ID";
    this.userId = "NO_USER_ID";
    this.projectId = "NO_PROJECT_ID";
    this.isDebug = opts?.isDebug || false;
    this.sessionId = randomUUID();
    this.events = [];
    this.config = opts?.config;
  }
  add(event) {
    event.sessionId = this.sessionId;
    event.teamId = this.teamId;
    event.userId = this.userId;
    event.projectId = this.projectId;
    this.events.push(event);
  }
  updateTeamId(teamId) {
    if (teamId) {
      this.teamId = teamId;
    }
  }
  updateUserId(userId) {
    if (userId) {
      this.userId = userId;
    }
  }
  updateProjectId(projectId) {
    if (projectId) {
      this.projectId = projectId;
    }
  }
  get hasUserId() {
    return this.userId !== "NO_USER_ID";
  }
  get readonlyEvents() {
    return Array.from(this.events);
  }
  reset() {
    this.events = [];
  }
  get enabled() {
    if (process.env.VERCEL_TELEMETRY_DISABLED) {
      return false;
    }
    return this.config?.enabled ?? true;
  }
  async save() {
    if (this.isDebug) {
      output_manager_default.log(`${LogLabel} Flushing Events`);
      for (const event of this.events) {
        event.teamId = this.teamId;
        event.userId = this.userId;
        event.projectId = this.projectId;
        output_manager_default.log(JSON.stringify(event));
      }
      return;
    }
    if (this.enabled) {
      const sessionId = this.events[0].sessionId;
      if (!sessionId) {
        output_manager_default.debug("Unable to send metrics: no session ID");
        return;
      }
      const events = this.events.map((event) => {
        delete event.sessionId;
        delete event.teamId;
        delete event.userId;
        delete event.projectId;
        const { eventTime, ...rest } = event;
        return {
          event_time: eventTime,
          team_id: this.teamId,
          user_id: this.userId,
          project_id: this.projectId,
          ...rest
        };
      });
      const payload = {
        headers: {
          "Client-id": "vercel-cli",
          "x-vercel-cli-topic-id": "generic",
          "x-vercel-cli-session-id": sessionId
        },
        body: events
      };
      await this.sendToSubprocess(payload, output_manager_default.debugEnabled);
    }
  }
  /**
   * Send the telemetry events to a subprocess, this invokes the `telemetry flush` command
   * and passes a stringified payload to the subprocess, there's a risk that if the event payload
   * increases in size, it may exceed the maximum buffer size for the subprocess, in which case the
   * child process will error and not send anything.
   * FIXME: handle max buffer size
   */
  async sendToSubprocess(payload, outputDebugEnabled) {
    const args = [process.execPath, process.argv[0], process.argv[1]];
    if (args[0] === args[1]) {
      args.shift();
    }
    const nodeBinaryPath = args[0];
    const script = [
      ...args.slice(1),
      "telemetry",
      "flush",
      JSON.stringify(payload)
    ];
    const env = cloneEnv(process.env, {
      VERCEL_TELEMETRY_DISABLED: "1"
    });
    if (outputDebugEnabled) {
      return new Promise((resolve) => {
        const childProcess = spawn(nodeBinaryPath, script, {
          env,
          stdio: ["ignore", "pipe", "pipe"]
        });
        childProcess.stderr.on("data", (data) => output_manager_default.debug(data.toString()));
        childProcess.stdout.on("data", (data) => output_manager_default.debug(data.toString()));
        childProcess.on("error", (d) => {
          output_manager_default.debug(d);
        });
        const timeout = setTimeout(() => {
          output_manager_default.debug("Telemetry subprocess killed due to timeout");
          childProcess.kill();
        }, 2e3);
        childProcess.on("exit", (code) => {
          output_manager_default.debug(`Telemetry subprocess exited with code ${code}`);
          childProcess.unref();
          timeout.unref();
          resolve();
        });
      });
    } else {
      const childProcess = spawn(nodeBinaryPath, script, {
        stdio: "ignore",
        env,
        windowsHide: true,
        detached: true
      });
      childProcess.unref();
    }
  }
};

export {
  require_dist,
  TelemetryClient,
  TelemetryEventStore
};
