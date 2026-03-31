import { createRequire as __createRequire } from 'node:module';
import { fileURLToPath as __fileURLToPath } from 'node:url';
import { dirname as __dirname_ } from 'node:path';
const require = __createRequire(import.meta.url);
const __filename = __fileURLToPath(import.meta.url);
const __dirname = __dirname_(__filename);
import {
  validateAllProjectMutualExclusivity
} from "./chunk-IE7MNZ56.js";
import {
  isAPIError
} from "./chunk-N7ABINT7.js";
import {
  output_manager_default
} from "./chunk-FDJURQMQ.js";

// src/commands/metrics/output.ts
function getRollupColumnName(measure, aggregation) {
  return `${measure}_${aggregation}`;
}
function formatQueryJson(query, response) {
  return JSON.stringify(
    {
      query,
      summary: response.summary ?? [],
      data: response.data ?? [],
      statistics: response.statistics ?? {}
    },
    null,
    2
  );
}
function formatSchemaDetailJson(event) {
  return JSON.stringify(
    {
      event: event.name,
      description: event.description,
      dimensions: event.dimensions.map((d) => ({
        name: d.name,
        label: d.label
      })),
      measures: event.measures.map((m) => ({
        name: m.name,
        label: m.label,
        unit: m.unit,
        aggregations: m.aggregations,
        defaultAggregation: m.defaultAggregation
      }))
    },
    null,
    2
  );
}
function formatSchemaListJson(events) {
  return JSON.stringify(events, null, 2);
}
function formatErrorJson(code, message, allowedValues) {
  const error = {
    code,
    message
  };
  if (allowedValues && allowedValues.length > 0) {
    error.allowedValues = allowedValues;
  }
  return JSON.stringify({ error }, null, 2);
}

// src/commands/metrics/schema-api.ts
var EVENT_ALIASES = {
  edgeRequest: "incomingRequest"
};
var REVERSE_ALIASES = Object.fromEntries(
  Object.entries(EVENT_ALIASES).map(([cli, api]) => [api, cli])
);
function toApiEventName(cliName) {
  return EVENT_ALIASES[cliName] ?? cliName;
}
function toCliEventName(apiName) {
  return REVERSE_ALIASES[apiName] ?? apiName;
}
function toMeasureSchema(measure) {
  return {
    name: measure.name,
    label: measure.label,
    unit: measure.unit,
    aggregations: measure.aggregations,
    defaultAggregation: measure.defaultAggregation
  };
}
function getEventNames(schema) {
  return Object.keys(schema).sort();
}
function getEvent(schema, name) {
  return schema[name];
}
function getQueryEngineEventName(schema, name) {
  const event = getEvent(schema, name);
  return event?.queryEngineEvent ?? name;
}
function getDimensions(schema, eventName) {
  return getEvent(schema, eventName)?.dimensions ?? [];
}
function getMeasures(schema, eventName) {
  return getEvent(schema, eventName)?.measures ?? [];
}
function getDefaultAggregation(schema, eventName, measureName) {
  const event = getEvent(schema, eventName);
  const measure = event?.measures.find((m) => m.name === measureName);
  return measure?.defaultAggregation ?? "sum";
}
function getAggregations(schema, eventName, measureName) {
  const event = getEvent(schema, eventName);
  const measure = event?.measures.find((m) => m.name === measureName);
  return measure?.aggregations ?? [];
}
async function fetchSchema(client, accountId) {
  const { events } = await client.fetch(
    "/v1/observability/schema?source=cli",
    { accountId }
  );
  const details = await Promise.all(
    events.map(async (event) => {
      const detail = await client.fetch(
        `/v1/observability/schema/${encodeURIComponent(event.name)}`,
        { accountId }
      );
      const cliEventName = toCliEventName(detail.name);
      const schema = {
        description: detail.description,
        dimensions: detail.dimensions.map((dimension) => ({
          name: dimension.name,
          label: dimension.label
        })),
        measures: detail.measures.map(toMeasureSchema)
      };
      const queryEngineEvent = toApiEventName(cliEventName);
      if (queryEngineEvent !== cliEventName) {
        schema.queryEngineEvent = queryEngineEvent;
      }
      return [cliEventName, schema];
    })
  );
  return Object.fromEntries(details);
}
async function fetchSchemaOrExit(client, accountId, jsonOutput) {
  try {
    return await fetchSchema(client, accountId);
  } catch (err) {
    if (isAPIError(err) && (err.status === 401 || err.status === 403)) {
      const message2 = "The metrics schema API request was not authorized. Run `vercel login` to authenticate and `vercel switch` to select a team, then try again.";
      if (jsonOutput) {
        client.stdout.write(formatErrorJson("SCHEMA_UNAUTHORIZED", message2));
      } else {
        output_manager_default.error(message2);
      }
      return 1;
    }
    const message = err instanceof Error ? `Failed to fetch metrics schema: ${err.message}` : `Failed to fetch metrics schema: ${String(err)}`;
    if (jsonOutput) {
      client.stdout.write(formatErrorJson("SCHEMA_FETCH_FAILED", message));
    } else {
      output_manager_default.error(message);
    }
    return 1;
  }
}

// src/commands/metrics/validation.ts
function validateEvent(schema, event) {
  if (getEvent(schema, event)) {
    return { valid: true };
  }
  return {
    valid: false,
    code: "UNKNOWN_EVENT",
    message: `Unknown event "${event}".`,
    allowedValues: getEventNames(schema)
  };
}
function validateMeasure(schema, event, measure) {
  const measures = getMeasures(schema, event);
  if (measures.some((m) => m.name === measure)) {
    return { valid: true };
  }
  return {
    valid: false,
    code: "UNKNOWN_MEASURE",
    message: `Measure "${measure}" is not available for event "${event}".`,
    allowedValues: measures.map((m) => m.name)
  };
}
function validateAggregation(schema, event, measure, aggregation) {
  const aggs = getAggregations(schema, event, measure);
  const found = aggs.find((agg) => agg === aggregation);
  if (found) {
    return { valid: true, value: found };
  }
  return {
    valid: false,
    code: "INVALID_AGGREGATION",
    message: `Aggregation "${aggregation}" is not valid for measure "${measure}" on event "${event}".`,
    allowedValues: [...aggs]
  };
}
function validateGroupBy(schema, event, dims) {
  const dimensions = getDimensions(schema, event);
  for (const dim of dims) {
    const found = dimensions.find((d) => d.name === dim);
    if (!found) {
      return {
        valid: false,
        code: "UNKNOWN_DIMENSION",
        message: `Dimension "${dim}" is not available for event "${event}".`,
        allowedValues: dimensions.map((d) => d.name)
      };
    }
  }
  return { valid: true };
}
function validateMutualExclusivity(all, project) {
  return validateAllProjectMutualExclusivity(all, project);
}
function validateRequiredEvent(event) {
  if (event) {
    return { valid: true, value: event };
  }
  return {
    valid: false,
    code: "MISSING_EVENT",
    message: "Missing required flag --event. Specify the event type to query.\n\nRun 'vercel metrics schema' to see available events."
  };
}

export {
  getRollupColumnName,
  formatQueryJson,
  formatSchemaDetailJson,
  formatSchemaListJson,
  formatErrorJson,
  getEventNames,
  getEvent,
  getQueryEngineEventName,
  getMeasures,
  getDefaultAggregation,
  fetchSchemaOrExit,
  validateEvent,
  validateMeasure,
  validateAggregation,
  validateGroupBy,
  validateMutualExclusivity,
  validateRequiredEvent
};
