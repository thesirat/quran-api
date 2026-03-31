import { createRequire as __createRequire } from 'node:module';
import { fileURLToPath as __fileURLToPath } from 'node:url';
import { dirname as __dirname_ } from 'node:path';
const require = __createRequire(import.meta.url);
const __filename = __fileURLToPath(import.meta.url);
const __dirname = __dirname_(__filename);
import {
  fetchSchemaOrExit,
  formatErrorJson,
  formatSchemaDetailJson,
  formatSchemaListJson,
  getEvent,
  getEventNames,
  validateEvent
} from "./chunk-MTX2A6OC.js";
import "./chunk-IE7MNZ56.js";
import {
  indent_default
} from "./chunk-A3NYPUKZ.js";
import {
  formatTable
} from "./chunk-E3DU27YT.js";
import {
  getScope
} from "./chunk-QIZEWDZG.js";
import {
  validateJsonOutput
} from "./chunk-XPKWKPWA.js";
import {
  schemaSubcommand
} from "./chunk-U2VTKOYW.js";
import "./chunk-CTY6ZEQZ.js";
import {
  require_pluralize
} from "./chunk-AY4LBM3J.js";
import "./chunk-GGP5R3FU.js";
import {
  getFlagsSpecification,
  parseArguments,
  printError
} from "./chunk-N7ABINT7.js";
import {
  output_manager_default
} from "./chunk-FDJURQMQ.js";
import "./chunk-S7KYDPEM.js";
import {
  __toESM
} from "./chunk-TZ2YI2VH.js";

// src/commands/metrics/schema.ts
var import_pluralize = __toESM(require_pluralize(), 1);
async function schema(client, telemetry) {
  let parsedArgs;
  const flagsSpecification = getFlagsSpecification(schemaSubcommand.options);
  try {
    parsedArgs = parseArguments(client.argv.slice(2), flagsSpecification);
  } catch (err) {
    printError(err);
    return 1;
  }
  const flags = parsedArgs.flags;
  const formatResult = validateJsonOutput(flags);
  if (!formatResult.valid) {
    output_manager_default.error(formatResult.error);
    return 1;
  }
  const jsonOutput = formatResult.jsonOutput;
  const event = flags["--event"];
  telemetry.trackCliOptionEvent(event);
  telemetry.trackCliOptionFormat(flags["--format"]);
  const { team } = await getScope(client);
  if (!team) {
    const message = "The metrics schema API request was not authorized. Run `vercel login` to authenticate and `vercel switch` to select a team, then try again.";
    if (jsonOutput) {
      client.stdout.write(formatErrorJson("SCHEMA_UNAUTHORIZED", message));
    } else {
      output_manager_default.error(message);
    }
    return 1;
  }
  const schemaData = await fetchSchemaOrExit(client, team.id, jsonOutput);
  if (typeof schemaData === "number") {
    return schemaData;
  }
  if (event) {
    const eventResult = validateEvent(schemaData, event);
    if (!eventResult.valid) {
      if (jsonOutput) {
        client.stdout.write(
          formatErrorJson(
            eventResult.code,
            eventResult.message,
            eventResult.allowedValues
          )
        );
      } else {
        output_manager_default.error(eventResult.message);
        if (eventResult.allowedValues) {
          output_manager_default.print(
            `
Available events: ${eventResult.allowedValues.join(", ")}
`
          );
        }
      }
      return 1;
    }
    const eventData = getEvent(schemaData, event);
    const eventWithName = { ...eventData, name: event };
    if (jsonOutput) {
      client.stdout.write(formatSchemaDetailJson(eventWithName));
    } else {
      output_manager_default.log(`Event: ${event} - ${eventData.description}`);
      const dimTable = formatDimensionsTable(eventWithName.dimensions);
      if (dimTable) {
        output_manager_default.print(dimTable);
        output_manager_default.print("\n");
      }
      const measTable = formatMeasuresTable(eventWithName.measures);
      if (measTable) {
        output_manager_default.print(measTable);
        output_manager_default.print("\n");
      }
    }
  } else {
    const events = getEventNames(schemaData).map((name) => ({
      name,
      description: getEvent(schemaData, name).description
    }));
    if (jsonOutput) {
      client.stdout.write(formatSchemaListJson(events));
    } else {
      output_manager_default.log(`${(0, import_pluralize.default)("Event", events.length, true)} found`);
      output_manager_default.print(formatEventsTable(events));
      output_manager_default.print("\n");
    }
  }
  return 0;
}
function formatEventsTable(events) {
  return indent_default(
    formatTable(
      ["Event", "Description"],
      ["l", "l"],
      [{ rows: events.map((e) => [e.name, e.description]) }]
    ),
    1
  );
}
function formatDimensionsTable(dimensions) {
  if (dimensions.length === 0) {
    return null;
  }
  return indent_default(
    formatTable(
      ["Dimension", "Label"],
      ["l", "l"],
      [
        {
          rows: dimensions.map((d) => [d.name, d.label])
        }
      ]
    ),
    1
  );
}
function formatMeasuresTable(measures) {
  if (measures.length === 0) {
    return null;
  }
  return indent_default(
    formatTable(
      ["Measure", "Label", "Unit", "Aggregations"],
      ["l", "l", "l", "l"],
      [
        {
          rows: measures.map((m) => [
            m.name,
            m.label,
            m.unit,
            m.aggregations.join(", ")
          ])
        }
      ]
    ),
    1
  );
}
export {
  schema as default
};
