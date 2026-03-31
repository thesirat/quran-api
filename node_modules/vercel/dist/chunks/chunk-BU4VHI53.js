import { createRequire as __createRequire } from 'node:module';
import { fileURLToPath as __fileURLToPath } from 'node:url';
import { dirname as __dirname_ } from 'node:path';
const require = __createRequire(import.meta.url);
const __filename = __fileURLToPath(import.meta.url);
const __dirname = __dirname_(__filename);
import {
  routesCommand
} from "./chunk-SV3GZCMS.js";
import {
  devCommand
} from "./chunk-ZFRYHXOW.js";
import {
  activityCommand
} from "./chunk-3KZHRNXR.js";
import {
  alertsCommand
} from "./chunk-7DONLUDG.js";
import {
  metricsCommand
} from "./chunk-U2VTKOYW.js";
import {
  listCommand
} from "./chunk-2MZ2A7NV.js";
import {
  buildCommand,
  pullCommand
} from "./chunk-UNW5ZUOV.js";
import {
  envCommand
} from "./chunk-AACAZGTQ.js";
import {
  confirmOption,
  forceOption,
  formatOption,
  jsonOption,
  limitOption,
  nextOption,
  packageName,
  yesOption
} from "./chunk-N7ABINT7.js";
import {
  output_manager_default
} from "./chunk-FDJURQMQ.js";

// src/commands/deploy/command.ts
var deprecatedArchiveSplitTgz = "split-tgz";
var initSubcommand = {
  name: "init",
  aliases: [],
  description: "Create a manual deployment that can be continued later",
  hidden: true,
  arguments: [],
  options: [
    {
      ...forceOption,
      description: "Force a new deployment even if nothing has changed"
    },
    {
      name: "with-cache",
      shorthand: null,
      type: Boolean,
      deprecated: false,
      description: 'Retain build cache when using "--force"'
    },
    {
      name: "public",
      shorthand: "p",
      type: Boolean,
      deprecated: false,
      description: "Deployment is public (`/_src`) is exposed)"
    },
    {
      name: "env",
      shorthand: "e",
      type: [String],
      argument: "KEY=VALUE",
      deprecated: false,
      description: "Specify environment variables during run-time (e.g. `-e KEY1=value1 -e KEY2=value2`)"
    },
    {
      name: "build-env",
      shorthand: "b",
      type: [String],
      argument: "KEY=VALUE",
      deprecated: false,
      description: "Specify environment variables during build-time (e.g. `-b KEY1=value1 -b KEY2=value2`)"
    },
    {
      name: "meta",
      shorthand: "m",
      type: [String],
      argument: "KEY=VALUE",
      deprecated: false,
      description: "Specify metadata for the deployment (e.g. `-m KEY1=value1 -m KEY2=value2`)"
    },
    {
      name: "regions",
      shorthand: null,
      type: String,
      argument: "REGION",
      deprecated: false,
      description: "Set default regions to enable the deployment on"
    },
    {
      name: "prod",
      shorthand: null,
      type: Boolean,
      deprecated: false,
      description: "Create a production deployment (shorthand for `--target=production`)"
    },
    {
      name: "archive",
      shorthand: null,
      type: String,
      argument: "FORMAT",
      deprecated: false,
      description: "Compress the deployment code into an archive before uploading it"
    },
    {
      name: "skip-domain",
      shorthand: null,
      type: Boolean,
      deprecated: false,
      description: "Disable the automatic promotion (aliasing) of the relevant domains to a new production deployment. You can use `vc promote` to complete the domain-assignment process later"
    },
    {
      ...yesOption,
      description: "Use default options to skip all prompts"
    },
    {
      name: "target",
      shorthand: null,
      type: String,
      argument: "TARGET",
      deprecated: false,
      description: "Specify the target deployment environment"
    },
    formatOption,
    jsonOption,
    confirmOption
  ],
  examples: [
    {
      name: "Create a manual deployment",
      value: "vercel deploy init"
    },
    {
      name: "Create a manual production deployment",
      value: "vercel deploy init --prod"
    }
  ]
};
var continueSubcommand = {
  name: "continue",
  aliases: [],
  description: "Continue a manual deployment by uploading build outputs",
  hidden: true,
  arguments: [],
  options: [
    {
      name: "id",
      shorthand: null,
      type: String,
      argument: "ID",
      deprecated: false,
      description: "The deployment ID to continue (e.g. dpl_xxx)"
    },
    {
      name: "archive",
      shorthand: null,
      type: String,
      argument: "FORMAT",
      deprecated: false,
      description: "Compress the deployment code into an archive before uploading it"
    }
  ],
  examples: [
    {
      name: "Continue a deployment by ID",
      value: "vercel deploy continue --id dpl_xxx"
    }
  ]
};
var deployCommand = {
  name: "deploy",
  aliases: [],
  description: "Deploy your project to Vercel. The `deploy` command is the default command for the Vercel CLI, and can be omitted (`vc deploy my-app` equals `vc my-app`).",
  arguments: [
    {
      name: "project-path",
      required: false
    }
  ],
  subcommands: [initSubcommand, continueSubcommand],
  options: [
    {
      ...forceOption,
      description: "Force a new deployment even if nothing has changed"
    },
    {
      name: "with-cache",
      shorthand: null,
      type: Boolean,
      deprecated: false,
      description: 'Retain build cache when using "--force"'
    },
    {
      name: "public",
      shorthand: "p",
      type: Boolean,
      deprecated: false,
      description: "Deployment is public (`/_src`) is exposed)"
    },
    {
      name: "env",
      shorthand: "e",
      type: [String],
      argument: "KEY=VALUE",
      deprecated: false,
      description: "Specify environment variables during run-time (e.g. `-e KEY1=value1 -e KEY2=value2`)"
    },
    {
      name: "build-env",
      shorthand: "b",
      type: [String],
      argument: "KEY=VALUE",
      deprecated: false,
      description: "Specify environment variables during build-time (e.g. `-b KEY1=value1 -b KEY2=value2`)"
    },
    {
      name: "meta",
      shorthand: "m",
      type: [String],
      argument: "KEY=VALUE",
      deprecated: false,
      description: "Specify metadata for the deployment (e.g. `-m KEY1=value1 -m KEY2=value2`)"
    },
    {
      name: "regions",
      shorthand: null,
      type: String,
      argument: "REGION",
      deprecated: false,
      description: "Set default regions to enable the deployment on"
    },
    {
      name: "prebuilt",
      shorthand: null,
      type: Boolean,
      deprecated: false,
      description: "Use in combination with `vc build`. Deploy an existing build"
    },
    {
      name: "prod",
      shorthand: null,
      type: Boolean,
      deprecated: false,
      description: "Create a production deployment (shorthand for `--target=production`)"
    },
    {
      name: "archive",
      shorthand: null,
      type: String,
      argument: "FORMAT",
      deprecated: false,
      description: "Compress the deployment code into an archive before uploading it"
    },
    {
      name: "no-wait",
      shorthand: null,
      type: Boolean,
      deprecated: false,
      description: "Don't wait for the deployment to finish"
    },
    {
      name: "skip-domain",
      shorthand: null,
      type: Boolean,
      deprecated: false,
      description: "Disable the automatic promotion (aliasing) of the relevant domains to a new production deployment. You can use `vc promote` to complete the domain-assignment process later"
    },
    {
      ...yesOption,
      description: "Use default options to skip all prompts"
    },
    {
      name: "logs",
      shorthand: "l",
      type: Boolean,
      deprecated: false,
      description: "Print the build logs"
    },
    {
      name: "guidance",
      shorthand: null,
      type: Boolean,
      deprecated: false,
      description: "Receive command suggestions once deployment is complete"
    },
    {
      name: "no-logs",
      shorthand: null,
      type: Boolean,
      deprecated: true,
      description: "Do not print the build logs"
    },
    {
      name: "name",
      shorthand: "n",
      type: String,
      deprecated: true
    },
    {
      name: "no-clipboard",
      shorthand: null,
      type: Boolean,
      deprecated: true
    },
    {
      name: "target",
      shorthand: null,
      type: String,
      argument: "TARGET",
      deprecated: false,
      description: "Specify the target deployment environment"
    },
    formatOption,
    jsonOption,
    confirmOption
  ],
  examples: [
    {
      name: "Deploy the current directory",
      value: "vercel"
    },
    {
      name: "Deploy a custom path",
      value: "vercel /usr/src/project"
    },
    {
      name: "Deploy with run-time Environment Variables",
      value: "vercel -e NODE_ENV=production"
    },
    {
      name: "Deploy with prebuilt outputs",
      value: ["vercel build", "vercel deploy --prebuilt"]
    },
    {
      name: "Write Deployment URL to a file",
      value: "vercel > deployment-url.txt"
    }
  ]
};

// src/commands/link/command.ts
var addSubcommand = {
  name: "add",
  aliases: [],
  description: "Add additional Vercel Projects to an existing repository link. Requires an existing repo.json (created by `link --repo`).",
  arguments: [],
  options: [
    {
      ...yesOption,
      description: "Skip questions when adding projects using default scope and settings"
    }
  ],
  examples: [
    {
      name: "Add projects to an existing repository link",
      value: `${packageName} link add`
    }
  ]
};
var linkCommand = {
  name: "link",
  aliases: [],
  description: "Link a local directory to a Vercel Project.",
  arguments: [],
  subcommands: [addSubcommand],
  options: [
    {
      name: "repo",
      description: "Link multiple projects based on Git repository (alpha)",
      shorthand: "r",
      type: Boolean,
      deprecated: false
    },
    {
      name: "project",
      description: "Project name or ID to link to (required for non-interactive)",
      shorthand: "p",
      argument: "NAME_OR_ID",
      type: String,
      deprecated: false
    },
    {
      name: "team",
      description: "Scope: team ID or slug (use with --project for non-interactive)",
      shorthand: null,
      argument: "TEAM_ID_OR_SLUG",
      type: String,
      deprecated: false
    },
    {
      ...yesOption,
      description: "Skip questions when setting up new project using default scope and settings"
    },
    confirmOption
  ],
  examples: [
    {
      name: "Link current directory to a Vercel Project",
      value: `${packageName} link`
    },
    {
      name: "Link current directory with default options and skip questions",
      value: `${packageName} link --yes`
    },
    {
      name: "Non-interactive: link to an existing project (CI/agents)",
      value: `${packageName} link --yes --team <team-id> --project <project-name-or-id>`
    },
    {
      name: "Link a specific directory to a Vercel Project",
      value: `${packageName} link --cwd /path/to/project`
    },
    {
      name: "Link to the current Git repository, allowing for multiple Vercel Projects to be linked simultaneously (useful for monorepos)",
      value: `${packageName} link --repo`
    },
    {
      name: "Add additional projects to an existing repository link",
      value: `${packageName} link add`
    }
  ]
};

// src/commands/agent/command.ts
var agentCommand = {
  name: "agent",
  aliases: [],
  description: "Generate an AGENTS.md file with Vercel deployment best practices",
  arguments: [
    {
      name: "init",
      required: false
    }
  ],
  options: [
    {
      ...yesOption,
      description: "Skip confirmation prompt"
    }
  ],
  examples: [
    {
      name: "Generate AGENTS.md with Vercel best practices",
      value: `${packageName} agent init`
    },
    {
      name: "Skip confirmation prompt (useful for CI)",
      value: `${packageName} agent init --yes`
    }
  ]
};

// src/commands/alias/command.ts
var setSubcommand = {
  name: "set",
  aliases: [],
  description: "Create a new alias",
  default: true,
  arguments: [
    {
      name: "deployment",
      required: true
    },
    {
      name: "alias",
      required: true
    }
  ],
  options: [],
  examples: []
};
var listSubcommand = {
  name: "list",
  aliases: ["ls"],
  description: "Show all aliases",
  arguments: [],
  options: [limitOption, nextOption, formatOption],
  examples: []
};
var removeSubcommand = {
  name: "remove",
  aliases: ["rm"],
  description: "Remove an alias using its hostname",
  arguments: [
    {
      name: "alias",
      required: true
    }
  ],
  options: [
    {
      ...yesOption,
      description: "Skip the confirmation prompt when removing an alias"
    }
  ],
  examples: []
};
var aliasCommand = {
  name: "alias",
  aliases: ["aliases", "ln"],
  description: "Interact with deployment aliases",
  arguments: [],
  subcommands: [listSubcommand, removeSubcommand, setSubcommand],
  options: [],
  examples: [
    {
      name: "Add a new alias to `my-api.vercel.app`",
      value: `${packageName} alias set api-ownv3nc9f8.vercel.app my-api.vercel.app`
    },
    {
      name: "Custom domains work as alias targets",
      value: `${packageName} alias set api-ownv3nc9f8.vercel.app my-api.com`
    },
    {
      name: "The subcommand `set` is the default and can be skipped. Protocols in the URLs are unneeded and ignored",
      value: `${packageName} alias api-ownv3nc9f8.vercel.app my-api.com`
    }
  ]
};

// src/commands/api/command.ts
var listSubcommand2 = {
  name: "list",
  aliases: ["ls"],
  description: "List all available API endpoints",
  arguments: [],
  options: [
    formatOption,
    {
      name: "refresh",
      shorthand: null,
      type: Boolean,
      deprecated: false,
      description: "Force refresh the cached OpenAPI spec"
    }
  ],
  examples: [
    {
      name: "List all endpoints in table format",
      value: `${packageName} api ls`
    },
    {
      name: "List all endpoints as JSON",
      value: `${packageName} api ls --format json`
    }
  ]
};
var apiCommand = {
  name: "api",
  aliases: [],
  description: "Make authenticated HTTP requests to the Vercel API",
  arguments: [
    {
      name: "endpoint",
      required: false
    }
  ],
  subcommands: [listSubcommand2],
  options: [
    {
      name: "method",
      shorthand: "X",
      type: String,
      argument: "METHOD",
      deprecated: false,
      description: "HTTP method (GET, POST, PUT, PATCH, DELETE). Defaults to GET, or POST if body is provided"
    },
    {
      name: "field",
      shorthand: "F",
      type: [String],
      argument: "KEY=VALUE",
      deprecated: false,
      description: "Add a typed parameter (numbers, booleans parsed). Use @file for file contents"
    },
    {
      name: "raw-field",
      shorthand: "f",
      type: [String],
      argument: "KEY=VALUE",
      deprecated: false,
      description: "Add a string parameter (no type parsing)"
    },
    {
      name: "header",
      shorthand: "H",
      type: [String],
      argument: "KEY:VALUE",
      deprecated: false,
      description: "Add a custom HTTP header"
    },
    {
      name: "input",
      shorthand: null,
      type: String,
      argument: "FILE",
      deprecated: false,
      description: "Read request body from file (use - for stdin)"
    },
    {
      name: "paginate",
      shorthand: null,
      type: Boolean,
      deprecated: false,
      description: "Fetch all pages of results"
    },
    {
      name: "include",
      shorthand: "i",
      type: Boolean,
      deprecated: false,
      description: "Include response headers in output"
    },
    {
      name: "silent",
      shorthand: null,
      type: Boolean,
      deprecated: false,
      description: "Suppress response output"
    },
    {
      name: "verbose",
      shorthand: null,
      type: Boolean,
      deprecated: false,
      description: "Show debug information including full request/response"
    },
    {
      name: "raw",
      shorthand: null,
      type: Boolean,
      deprecated: false,
      description: "Output raw JSON without pretty-printing"
    },
    {
      name: "refresh",
      shorthand: null,
      type: Boolean,
      deprecated: false,
      description: "Force refresh the cached OpenAPI spec"
    },
    {
      name: "generate",
      shorthand: null,
      type: String,
      argument: "FORMAT",
      deprecated: false,
      description: "Generate output instead of executing (e.g., --generate=curl)"
    },
    {
      name: "dangerously-skip-permissions",
      shorthand: null,
      type: Boolean,
      deprecated: false,
      description: "Skip confirmation prompts for DELETE operations (use with caution)"
    }
  ],
  examples: [
    {
      name: "Get current user information",
      value: `${packageName} api /v2/user`
    },
    {
      name: "List projects with team scope",
      value: `${packageName} api /v9/projects --scope my-team`
    },
    {
      name: "Create a new project",
      value: `${packageName} api /v10/projects -X POST -F name=my-project`
    },
    {
      name: "Delete a deployment",
      value: `${packageName} api /v13/deployments/dpl_abc123 -X DELETE`
    },
    {
      name: "Paginate through all deployments",
      value: `${packageName} api /v6/deployments --paginate`
    },
    {
      name: "Post JSON from file",
      value: `${packageName} api /v10/projects -X POST --input config.json`
    },
    {
      name: "Add custom header",
      value: `${packageName} api /v2/user -H "X-Custom-Header: value"`
    },
    {
      name: "Interactive mode (select endpoint)",
      value: `${packageName} api`
    }
  ]
};

// src/commands/bisect/command.ts
var bisectCommand = {
  name: "bisect",
  aliases: [],
  description: "Bisect the current project interactively or via an automated test script.",
  arguments: [],
  options: [
    {
      name: "bad",
      description: "Known bad URL",
      argument: "URL",
      shorthand: "b",
      type: String,
      deprecated: false
    },
    {
      name: "good",
      description: "Known good URL",
      argument: "URL",
      shorthand: "g",
      type: String,
      deprecated: false
    },
    {
      name: "open",
      description: "Automatically open each URL in the browser",
      argument: "URL",
      shorthand: "o",
      type: Boolean,
      deprecated: false
    },
    {
      name: "path",
      description: "Subpath of the deployment URL to test",
      argument: "PATH",
      shorthand: "p",
      type: String,
      deprecated: false
    },
    {
      name: "run",
      description: "Test script to run for each deployment",
      argument: "SCRIPT",
      shorthand: "r",
      type: String,
      deprecated: false
    }
  ],
  examples: [
    {
      name: "Bisect the current project interactively",
      value: `${packageName} bisect`
    },
    {
      name: "Bisect with a known bad deployment",
      value: `${packageName} bisect --bad example-310pce9i0.vercel.app`
    },
    {
      name: "Automated bisect with a run script",
      value: `${packageName} bisect --run ./test.sh`
    }
  ]
};

// src/commands/buy/command.ts
var SUPPORTED_CREDIT_TYPES = ["v0", "gateway", "agent"];
var CREDIT_TYPE_LABELS = {
  v0: "v0",
  gateway: "AI Gateway",
  agent: "Vercel Agent"
};
var creditsSubcommand = {
  name: "credits",
  aliases: [],
  description: "Purchase Vercel credits for your team",
  arguments: [
    {
      name: "credit-type",
      required: true
    },
    {
      name: "amount",
      required: true
    }
  ],
  options: [
    {
      ...yesOption,
      description: "Skip the confirmation prompt"
    },
    formatOption,
    jsonOption
  ],
  examples: [
    {
      name: "Purchase $100 of v0 credits",
      value: `${packageName} buy credits v0 100`
    },
    {
      name: "Purchase $250 of AI Gateway credits",
      value: `${packageName} buy credits gateway 250`
    },
    {
      name: "Purchase $50 of Vercel Agent credits",
      value: `${packageName} buy credits agent 50`
    }
  ]
};
var SUPPORTED_ADDON_ALIASES = ["siem"];
var ADDON_LABELS = {
  siem: "SIEM"
};
var addonSubcommand = {
  name: "addon",
  aliases: ["addons"],
  description: "Purchase a Vercel addon for your team",
  arguments: [
    {
      name: "addon-name",
      required: true
    },
    {
      name: "quantity",
      required: true
    }
  ],
  options: [
    {
      ...yesOption,
      description: "Skip the confirmation prompt"
    },
    formatOption,
    jsonOption
  ],
  examples: [
    {
      name: "Purchase 1 unit of the SIEM addon",
      value: `${packageName} buy addon siem 1`
    }
  ]
};
var proSubcommand = {
  name: "pro",
  aliases: [],
  description: "Purchase a Vercel Pro subscription for your team",
  arguments: [],
  options: [
    {
      ...yesOption,
      description: "Skip the confirmation prompt"
    },
    formatOption,
    jsonOption
  ],
  examples: [
    {
      name: "Upgrade your team to Vercel Pro",
      value: `${packageName} buy pro`
    },
    {
      name: "Upgrade without confirmation prompt",
      value: `${packageName} buy pro --yes`
    }
  ]
};
var v0Subcommand = {
  name: "v0",
  aliases: [],
  description: "Purchase a v0 subscription for your team",
  arguments: [],
  options: [],
  examples: [
    {
      name: "Purchase v0 for your team",
      value: `${packageName} buy v0`
    }
  ]
};
var domainSubcommand = {
  name: "domain",
  aliases: [],
  description: "Purchase a domain name",
  arguments: [
    {
      name: "domain",
      required: true
    }
  ],
  options: [],
  examples: [
    {
      name: "Purchase a domain",
      value: `${packageName} buy domain example.com`
    }
  ]
};
var buyCommand = {
  name: "buy",
  aliases: [],
  description: "Purchase Vercel products for your team",
  arguments: [],
  subcommands: [
    creditsSubcommand,
    addonSubcommand,
    proSubcommand,
    v0Subcommand,
    domainSubcommand
  ],
  options: [],
  examples: [
    {
      name: "Purchase $100 of v0 credits",
      value: `${packageName} buy credits v0 100`
    },
    {
      name: "Purchase the SIEM addon",
      value: `${packageName} buy addon siem 1`
    },
    {
      name: "Upgrade to Pro",
      value: `${packageName} buy pro`
    },
    {
      name: "Purchase v0",
      value: `${packageName} buy v0`
    },
    {
      name: "Purchase a domain",
      value: `${packageName} buy domain example.com`
    }
  ]
};

// src/commands/cache/command.ts
var purgeSubcommand = {
  name: "purge",
  aliases: [],
  description: "Purge cache for the current project",
  arguments: [],
  options: [
    yesOption,
    {
      name: "type",
      description: "Type of cache to purge",
      shorthand: null,
      type: String,
      argument: "TYPE",
      deprecated: false
    }
  ],
  examples: [
    {
      name: "Purge all caches for the current project",
      value: `${packageName} cache purge`
    },
    {
      name: "Purge only the CDN cache",
      value: `${packageName} cache purge --type cdn`
    },
    {
      name: "Purge only the data cache",
      value: `${packageName} cache purge --type data`
    }
  ]
};
var invalidateSubcommand = {
  name: "invalidate",
  aliases: [],
  description: "Invalidate all cached content by tag",
  arguments: [],
  options: [
    yesOption,
    {
      name: "tag",
      description: "Tags to invalidate (comma-separated)",
      shorthand: null,
      type: String,
      argument: "TAGS",
      deprecated: false
    },
    {
      name: "srcimg",
      description: "Source Image to invalidate",
      shorthand: null,
      type: String,
      argument: "SRCIMG",
      deprecated: false
    }
  ],
  examples: [
    {
      name: "Invalidate all cached content associated with a tag",
      value: `${packageName} cache invalidate --tag foo`
    },
    {
      name: "Invalidate all cached content associated with any one of multiple tags",
      value: `${packageName} cache invalidate --tag foo,bar,baz`
    },
    {
      name: "Invalidate all cached content associated with a source image",
      value: `${packageName} cache invalidate --srcimg /api/avatar/1`
    }
  ]
};
var dangerouslyDeleteSubcommand = {
  name: "dangerously-delete",
  aliases: [],
  description: "Dangerously delete all cached content by tag",
  arguments: [],
  options: [
    yesOption,
    {
      name: "tag",
      description: "Tags to delete (comma-separated)",
      shorthand: null,
      type: String,
      argument: "TAGS",
      deprecated: false
    },
    {
      name: "srcimg",
      description: "Source Image to delete",
      shorthand: null,
      type: String,
      argument: "SRCIMG",
      deprecated: false
    },
    {
      name: "revalidation-deadline-seconds",
      description: "Revalidation deadline in seconds",
      shorthand: null,
      type: Number,
      argument: "REVALIDATION-DEADLINE-SECONDS",
      deprecated: false
    }
  ],
  examples: [
    {
      name: "Dangerously delete all cached content associated with a tag",
      value: `${packageName} cache dangerously-delete --tag foo`
    },
    {
      name: "Dangerously delete all cached content associated with a tag if not accessed in the next hour",
      value: `${packageName} cache dangerously-delete --tag foo --revalidation-deadline-seconds 3600`
    },
    {
      name: "Dangerously delete all cached content associated with a source image",
      value: `${packageName} cache dangerously-delete --srcimg /api/avatar/1`
    },
    {
      name: "Dangerously delete all cached content associated with a source image if not accessed in the next hour",
      value: `${packageName} cache dangerously-delete --srcimg /api/avatar/1 --revalidation-deadline-seconds 3600`
    }
  ]
};
var cacheCommand = {
  name: "cache",
  aliases: [],
  description: "Manage cache for a Project",
  arguments: [],
  subcommands: [
    purgeSubcommand,
    invalidateSubcommand,
    dangerouslyDeleteSubcommand
  ],
  options: [],
  examples: []
};

// src/commands/certs/command.ts
var removeSubcommand2 = {
  name: "remove",
  aliases: ["rm"],
  description: "Remove a certificate by id",
  arguments: [
    {
      name: "id",
      required: true
    }
  ],
  options: [],
  examples: [
    {
      name: "Remove a certificate",
      value: `${packageName} certs rm id`
    }
  ]
};
var issueSubcommand = {
  name: "issue",
  aliases: [],
  description: "Issue a new certificate for a domain",
  arguments: [
    {
      name: "cn",
      required: true
    }
  ],
  options: [
    {
      name: "challenge-only",
      description: "Only show challenges needed to issue a certificate",
      shorthand: null,
      type: Boolean,
      deprecated: false
    },
    {
      name: "crt",
      description: "Certificate file",
      argument: "FILE",
      shorthand: null,
      type: String,
      deprecated: false
    },
    {
      name: "key",
      description: "Certificate key file",
      argument: "FILE",
      shorthand: null,
      type: String,
      deprecated: false
    },
    {
      name: "ca",
      description: "CA certificate chain file",
      argument: "FILE",
      shorthand: null,
      type: String,
      deprecated: false
    },
    { name: "overwrite", shorthand: null, type: Boolean, deprecated: false }
  ],
  examples: [
    {
      name: 'Generate a certificate with the cnames "acme.com" and "www.acme.com"`',
      value: `${packageName} certs issue acme.com www.acme.com`
    }
  ]
};
var listSubcommand3 = {
  name: "list",
  aliases: ["ls"],
  description: "Show all available certificates",
  arguments: [],
  options: [limitOption, nextOption],
  examples: [
    {
      name: "Paginate results, where `1584722256178` is the time in milliseconds since the UNIX epoch.",
      value: `${packageName} certs ls --next 1584722256178`
    }
  ]
};
var addSubcommand2 = {
  name: "add",
  aliases: [],
  description: "Add a new certificate",
  arguments: [],
  options: [
    {
      name: "crt",
      description: "Certificate file",
      argument: "FILE",
      shorthand: null,
      type: String,
      deprecated: false
    },
    {
      name: "key",
      description: "Certificate key file",
      argument: "FILE",
      shorthand: null,
      type: String,
      deprecated: false
    },
    {
      name: "ca",
      description: "CA certificate chain file",
      argument: "FILE",
      shorthand: null,
      type: String,
      deprecated: false
    },
    {
      name: "overwrite",
      description: "",
      shorthand: null,
      type: Boolean,
      deprecated: true
    }
  ],
  examples: []
};
var certsCommand = {
  name: "certs",
  aliases: ["cert"],
  description: "Interact with SSL certificates. This command is intended for advanced use only. By default, Vercel manages your certificates automatically.",
  arguments: [],
  subcommands: [
    addSubcommand2,
    issueSubcommand,
    listSubcommand3,
    removeSubcommand2
  ],
  options: [],
  examples: [
    ...issueSubcommand.examples,
    ...removeSubcommand2.examples,
    ...listSubcommand3.examples
  ]
};

// src/commands/contract/command.ts
var contractCommand = {
  name: "contract",
  aliases: [],
  description: "Show contract information for all billing periods",
  arguments: [],
  options: [formatOption, jsonOption],
  examples: [
    {
      name: "Show contract information for all billing periods",
      value: `${packageName} contract`
    },
    {
      name: "Show contract information for all billing periods as JSON",
      value: `${packageName} contract --format json`
    }
  ]
};

// src/commands/crons/command.ts
var addSubcommand3 = {
  name: "add",
  aliases: [],
  description: "Add a cron job to vercel.json",
  arguments: [],
  options: [
    {
      name: "path",
      shorthand: null,
      type: String,
      argument: "PATH",
      deprecated: false,
      description: "The API route path for the cron job (must start with /)"
    },
    {
      name: "schedule",
      shorthand: null,
      type: String,
      argument: "EXPRESSION",
      deprecated: false,
      description: 'The cron schedule expression (e.g. "0 10 * * *")'
    }
  ],
  examples: [
    {
      name: "Add a cron job interactively",
      value: `${packageName} crons add`
    },
    {
      name: "Add a cron job with flags",
      value: `${packageName} crons add --path /api/cron --schedule "0 10 * * *"`
    }
  ]
};
var listSubcommand4 = {
  name: "list",
  aliases: ["ls"],
  description: "List all cron jobs for a project",
  default: true,
  arguments: [],
  options: [formatOption],
  examples: [
    {
      name: "List all cron jobs",
      value: `${packageName} crons ls`
    },
    {
      name: "List all cron jobs as JSON",
      value: `${packageName} crons ls --format json`
    }
  ]
};
var runSubcommand = {
  name: "run",
  aliases: [],
  description: "Trigger a cron job to run immediately",
  arguments: [
    {
      name: "path",
      required: false
    }
  ],
  options: [],
  examples: [
    {
      name: "Trigger a specific cron job",
      value: `${packageName} crons run /api/cron`
    }
  ]
};
var cronsCommand = {
  name: "crons",
  aliases: ["cron"],
  description: "Manage cron jobs for a project",
  arguments: [],
  subcommands: [addSubcommand3, listSubcommand4, runSubcommand],
  options: [],
  examples: []
};

// src/commands/curl/command.ts
var curlCommand = {
  name: "curl",
  aliases: [],
  description: "Execute curl with automatic deployment URL and protection bypass.",
  arguments: [
    {
      name: "path",
      required: true
    }
  ],
  options: [
    {
      ...yesOption,
      description: "Skip confirmation when linking is required (e.g. in non-interactive mode)"
    },
    {
      name: "deployment",
      shorthand: null,
      type: String,
      deprecated: false,
      description: "The deployment ID or URL to target",
      argument: "ID|URL"
    },
    {
      name: "protection-bypass",
      shorthand: null,
      type: String,
      deprecated: false,
      description: "Protection bypass secret for accessing protected deployments",
      argument: "SECRET"
    }
  ],
  examples: [
    {
      name: "Make a GET request to an API endpoint",
      value: `${packageName} curl /api/hello`
    },
    {
      name: "Make a POST request with data",
      value: `${packageName} curl /api/users -- --request POST --data '{"name": "John"}'`
    },
    {
      name: "Target a specific deployment by ID",
      value: `${packageName} curl /api/status --deployment ERiL45NJvP8ghWxgbvCM447bmxwV`
    },
    {
      name: "Target a specific deployment by URL",
      value: `${packageName} curl /api/status --deployment https://your-project-abc123.vercel.app`
    },
    {
      name: "Use curl flags after the separator",
      value: `${packageName} curl /api/test -- --header "Content-Type: application/json" --request PUT`
    },
    {
      name: "Use with protection bypass secret",
      value: `${packageName} curl /api/protected --protection-bypass <secret> -- --request GET`
    }
  ]
};

// src/commands/dns/command.ts
var importSubcommand = {
  name: "import",
  aliases: [],
  description: "Import a DNS zone file (see below for examples)",
  arguments: [
    {
      name: "domain",
      required: true
    },
    {
      name: "zonefile",
      required: true
    }
  ],
  options: [],
  examples: []
};
var listSubcommand5 = {
  name: "list",
  aliases: ["ls"],
  description: "List all DNS entries for a domain",
  default: true,
  arguments: [
    {
      name: "domain",
      required: true
    }
  ],
  options: [limitOption, nextOption],
  examples: []
};
var addSubcommand4 = {
  name: "add",
  aliases: [],
  description: "Add a new DNS entry (see below for examples)",
  arguments: [
    {
      name: "domain",
      required: true
    },
    {
      name: "details",
      required: true
    }
  ],
  options: [],
  examples: []
};
var removeSubcommand3 = {
  name: "remove",
  aliases: ["rm"],
  description: "Remove a DNS entry using its ID",
  arguments: [
    {
      name: "id",
      required: true
    }
  ],
  options: [
    {
      ...yesOption,
      description: "Skip the confirmation prompt when removing a DNS record"
    }
  ],
  examples: []
};
var dnsCommand = {
  name: "dns",
  aliases: [],
  description: "Interact with DNS entries for a project",
  arguments: [],
  subcommands: [
    addSubcommand4,
    importSubcommand,
    listSubcommand5,
    removeSubcommand3
  ],
  options: [],
  examples: [
    {
      name: "Add an A record for a subdomain",
      value: [
        `${packageName} dns add <DOMAIN> <SUBDOMAIN> <A | AAAA | ALIAS | CNAME | TXT>  <VALUE>`,
        `${packageName} dns add zeit.rocks api A 198.51.100.100`
      ]
    },
    {
      name: "Add an MX record (@ as a name refers to the domain)",
      value: [
        `${packageName} dns add <DOMAIN> '@' MX <RECORD VALUE> <PRIORITY>`,
        `${packageName} dns add zeit.rocks '@' MX mail.zeit.rocks 10`
      ]
    },
    {
      name: "Add an SRV record",
      value: [
        `${packageName} dns add <DOMAIN> <NAME> SRV <PRIORITY> <WEIGHT> <PORT> <TARGET>`,
        `${packageName} dns add zeit.rocks '@' SRV 10 0 389 zeit.party`
      ]
    },
    {
      name: "Add a CAA record",
      value: [
        `${packageName} dns add <DOMAIN> <NAME> CAA '<FLAGS> <TAG> "<VALUE>"'`,
        `${packageName} dns add zeit.rocks '@' CAA '0 issue "example.com"'`
      ]
    },
    {
      name: "Import a Zone file",
      value: [
        `${packageName} dns import <DOMAIN> <FILE>`,
        `${packageName} dns import zeit.rocks ./zonefile.txt`
      ]
    },
    {
      name: "Paginate results, where `1584722256178` is the time in milliseconds since the UNIX epoch",
      value: [
        `${packageName} dns ls --next 1584722256178`,
        `${packageName} dns ls zeit.rocks --next 1584722256178`
      ]
    }
  ]
};

// src/commands/domains/command.ts
var listSubcommand6 = {
  name: "list",
  aliases: ["ls"],
  description: "Show all domains in a list",
  default: true,
  arguments: [],
  options: [limitOption, nextOption, formatOption],
  examples: [
    {
      name: "Paginate results, where `1584722256178` is the time in milliseconds since the UNIX epoch",
      value: `${packageName} domains ls --next 1584722256178`
    }
  ]
};
var inspectSubcommand = {
  name: "inspect",
  aliases: [],
  description: "Displays information related to a domain",
  arguments: [
    {
      name: "domain",
      required: true
    }
  ],
  options: [],
  examples: []
};
var addSubcommand5 = {
  name: "add",
  aliases: [],
  description: "Add a domain name that you already own to a Vercel Team",
  arguments: [
    {
      name: "domain",
      required: true
    },
    {
      name: "project",
      required: true
    }
  ],
  options: [
    {
      ...forceOption,
      shorthand: null,
      description: "Force a domain name for a project and remove it from an existing one"
    }
  ],
  examples: [
    {
      name: "Add a domain that you already own",
      value: [
        `${packageName} domains add domain-name.com`,
        "Make sure the domain's DNS nameservers are at least 2 of the ones listed on https://vercel.com/edge-network",
        `NOTE: Running ${packageName} alias will automatically register your domain if it's configured with these nameservers (no need to 'domains add')`
      ]
    }
  ]
};
var removeSubcommand4 = {
  name: "remove",
  aliases: ["rm"],
  description: "Remove ownership of a domain name from a Vercel Team",
  arguments: [
    {
      name: "domain",
      required: true
    }
  ],
  options: [
    {
      ...yesOption,
      description: "Skip the confirmation prompt when removing a domain"
    }
  ],
  examples: []
};
var buySubcommand = {
  name: "buy",
  aliases: [],
  description: "Purchase a new domain name",
  arguments: [
    {
      name: "domain",
      required: true
    }
  ],
  options: [],
  examples: []
};
var moveSubcommand = {
  name: "move",
  aliases: [],
  description: "Move ownership of a domain name to another Vercel Team",
  arguments: [
    {
      name: "domain",
      required: true
    },
    {
      name: "destination",
      required: true
    }
  ],
  options: [
    {
      ...yesOption,
      description: "Skip the confirmation prompt when moving a domain"
    }
  ],
  examples: []
};
var transferInSubcommand = {
  name: "transfer-in",
  aliases: [],
  description: "Transfer in a domain name to Vercel",
  arguments: [
    {
      name: "domain",
      required: true
    }
  ],
  options: [
    {
      name: "code",
      argument: "CODE",
      shorthand: null,
      type: String,
      deprecated: false
    }
  ],
  examples: []
};
var domainsCommand = {
  name: "domains",
  aliases: ["domain"],
  description: "Manage domains",
  arguments: [],
  subcommands: [
    listSubcommand6,
    inspectSubcommand,
    addSubcommand5,
    buySubcommand,
    moveSubcommand,
    transferInSubcommand,
    removeSubcommand4
  ],
  options: [],
  examples: []
};

// src/commands/flags/command.ts
var listSubcommand7 = {
  name: "list",
  aliases: ["ls"],
  description: "List all feature flags for the current project",
  default: true,
  arguments: [],
  options: [
    {
      name: "state",
      shorthand: "s",
      type: String,
      deprecated: false,
      description: "Filter flags by state (active or archived)",
      argument: "STATE"
    },
    {
      name: "json",
      shorthand: null,
      type: Boolean,
      deprecated: false,
      description: "Output in JSON format"
    }
  ],
  examples: [
    {
      name: "List all active flags",
      value: `${packageName} flags ls`
    },
    {
      name: "List archived flags",
      value: `${packageName} flags ls --state archived`
    },
    {
      name: "List flags as JSON",
      value: `${packageName} flags ls --json`
    }
  ]
};
var inspectSubcommand2 = {
  name: "inspect",
  aliases: [],
  description: "Display information about a feature flag",
  arguments: [
    {
      name: "flag",
      required: true
    }
  ],
  options: [],
  examples: [
    {
      name: "Show details of a feature flag",
      value: `${packageName} flags inspect my-feature-flag`
    }
  ]
};
var createSubcommand = {
  name: "create",
  aliases: ["add"],
  description: "Create a new feature flag",
  arguments: [
    {
      name: "slug",
      required: true
    }
  ],
  options: [
    {
      name: "kind",
      shorthand: "k",
      type: String,
      deprecated: false,
      description: "The type of the flag value (boolean, string, or number)",
      argument: "KIND"
    },
    {
      name: "description",
      shorthand: "d",
      type: String,
      deprecated: false,
      description: "Description of the feature flag",
      argument: "TEXT"
    },
    {
      name: "variant",
      shorthand: "v",
      type: [String],
      deprecated: false,
      description: "Variant definition as VALUE[=LABEL] (can be repeated for string and number flags)",
      argument: "VALUE[=LABEL]"
    }
  ],
  examples: [
    {
      name: "Create a boolean feature flag",
      value: `${packageName} flags create my-feature`
    },
    {
      name: "Create a string feature flag with description",
      value: `${packageName} flags create my-feature --kind string --description "My feature flag"`
    },
    {
      name: "Create a string feature flag with explicit variants",
      value: `${packageName} flags add my-feature --kind string --variant control="Welcome back" --variant treatment="New onboarding"`
    }
  ]
};
var openSubcommand = {
  name: "open",
  aliases: [],
  description: "Open feature flags in the Vercel dashboard",
  arguments: [
    {
      name: "flag",
      required: false
    }
  ],
  options: [],
  examples: [
    {
      name: "Open the project feature flags dashboard",
      value: `${packageName} flags open`
    },
    {
      name: "Open a specific feature flag",
      value: `${packageName} flags open my-feature-flag`
    }
  ]
};
var updateSubcommand = {
  name: "update",
  aliases: [],
  description: "Update an existing feature flag",
  arguments: [
    {
      name: "flag",
      required: true
    }
  ],
  options: [
    {
      name: "variant",
      shorthand: "v",
      type: String,
      deprecated: false,
      description: "Variant ID or value to update",
      argument: "VARIANT"
    },
    {
      name: "value",
      shorthand: null,
      type: String,
      deprecated: false,
      description: "New variant value",
      argument: "VALUE"
    },
    {
      name: "label",
      shorthand: "l",
      type: String,
      deprecated: false,
      description: "New variant label",
      argument: "LABEL"
    },
    {
      name: "message",
      shorthand: null,
      type: String,
      deprecated: false,
      description: "Optional revision message for the update",
      argument: "TEXT"
    }
  ],
  examples: [
    {
      name: "Update a string variant value and label",
      value: `${packageName} flags update my-feature --variant control --value welcome-back --label "Welcome back"`
    },
    {
      name: "Update a variant with a revision message",
      value: `${packageName} flags update my-feature --variant control --label "Control" --message "Rename control variant"`
    },
    {
      name: "Rename a boolean variant label",
      value: `${packageName} flags update my-feature --variant false --label "Disabled"`
    }
  ]
};
var setSubcommand2 = {
  name: "set",
  aliases: [],
  description: "Set the served variant for a feature flag in an environment",
  arguments: [
    {
      name: "flag",
      required: true
    }
  ],
  options: [
    {
      name: "environment",
      shorthand: "e",
      type: String,
      deprecated: false,
      description: "The environment to set the variant in (production, preview, or development)",
      argument: "ENV"
    },
    {
      name: "variant",
      shorthand: "v",
      type: String,
      deprecated: false,
      description: "The variant ID or value to serve",
      argument: "VARIANT"
    },
    {
      name: "message",
      shorthand: null,
      type: String,
      deprecated: false,
      description: "Optional revision message for the update",
      argument: "TEXT"
    }
  ],
  examples: [
    {
      name: "Set a string variant in production",
      value: `${packageName} flags set welcome-message --environment production --variant control`
    },
    {
      name: "Set a number variant in preview",
      value: `${packageName} flags set bucket-size -e preview --variant 20`
    },
    {
      name: "Set a boolean flag to true in development",
      value: `${packageName} flags set my-feature -e development --variant true`
    }
  ]
};
var removeSubcommand5 = {
  name: "remove",
  aliases: ["rm"],
  description: "Delete a feature flag",
  arguments: [
    {
      name: "flag",
      required: true
    }
  ],
  options: [
    {
      ...yesOption,
      description: "Skip the confirmation prompt when deleting a flag"
    }
  ],
  examples: [
    {
      name: "Delete a feature flag",
      value: `${packageName} flags rm my-feature-flag`
    },
    {
      name: "Delete without confirmation",
      value: `${packageName} flags rm my-feature-flag --yes`
    }
  ]
};
var archiveSubcommand = {
  name: "archive",
  aliases: [],
  description: "Archive a feature flag",
  arguments: [
    {
      name: "flag",
      required: true
    }
  ],
  options: [
    {
      ...yesOption,
      description: "Skip the confirmation prompt when archiving a flag"
    }
  ],
  examples: [
    {
      name: "Archive a feature flag",
      value: `${packageName} flags archive my-feature-flag`
    },
    {
      name: "Archive without confirmation",
      value: `${packageName} flags archive my-feature-flag --yes`
    }
  ]
};
var disableSubcommand = {
  name: "disable",
  aliases: [],
  description: "Shortcut to serve the false variant of a boolean feature flag in an environment",
  arguments: [
    {
      name: "flag",
      required: true
    }
  ],
  options: [
    {
      name: "environment",
      shorthand: "e",
      type: String,
      deprecated: false,
      description: "The environment to disable the flag in (production, preview, or development)",
      argument: "ENV"
    },
    {
      name: "variant",
      shorthand: "v",
      type: String,
      deprecated: false,
      description: "The variant ID or value to serve while the flag is disabled",
      argument: "VARIANT"
    },
    {
      name: "message",
      shorthand: null,
      type: String,
      deprecated: false,
      description: "Optional revision message for the update",
      argument: "TEXT"
    }
  ],
  examples: [
    {
      name: "Disable a flag in production",
      value: `${packageName} flags disable my-feature --environment production`
    },
    {
      name: "Disable a flag with a specific variant",
      value: `${packageName} flags disable my-feature -e production --variant false`
    },
    {
      name: "Disable a flag with a revision message",
      value: `${packageName} flags disable my-feature -e production --message "Pause rollout in production"`
    }
  ]
};
var enableSubcommand = {
  name: "enable",
  aliases: [],
  description: "Shortcut to serve the true variant of a boolean feature flag in an environment",
  arguments: [
    {
      name: "flag",
      required: true
    }
  ],
  options: [
    {
      name: "environment",
      shorthand: "e",
      type: String,
      deprecated: false,
      description: "The environment to enable the flag in (production, preview, or development)",
      argument: "ENV"
    },
    {
      name: "message",
      shorthand: null,
      type: String,
      deprecated: false,
      description: "Optional revision message for the update",
      argument: "TEXT"
    }
  ],
  examples: [
    {
      name: "Enable a flag in production",
      value: `${packageName} flags enable my-feature --environment production`
    },
    {
      name: "Enable a flag with a revision message",
      value: `${packageName} flags enable my-feature --environment production --message "Resume production rollout"`
    }
  ]
};
var sdkKeysListSubcommand = {
  name: "list",
  aliases: ["ls"],
  description: "List all SDK keys for the current project",
  arguments: [],
  options: [
    {
      name: "json",
      shorthand: null,
      type: Boolean,
      deprecated: false,
      description: "Output in JSON format"
    }
  ],
  examples: [
    {
      name: "List all SDK keys",
      value: `${packageName} flags sdk-keys ls`
    },
    {
      name: "List SDK keys as JSON",
      value: `${packageName} flags sdk-keys ls --json`
    }
  ]
};
var sdkKeysAddSubcommand = {
  name: "add",
  aliases: [],
  description: "Create a new SDK key",
  arguments: [],
  options: [
    {
      name: "type",
      // No shorthand: `-t` is already used globally for `--token`
      shorthand: null,
      type: String,
      deprecated: false,
      description: "The type of SDK key (server, client, or mobile)",
      argument: "TYPE"
    },
    {
      name: "environment",
      shorthand: "e",
      type: String,
      deprecated: false,
      description: "The environment for the SDK key",
      argument: "ENV"
    },
    {
      name: "label",
      shorthand: "l",
      type: String,
      deprecated: false,
      description: "Optional label for the SDK key",
      argument: "LABEL"
    }
  ],
  examples: [
    {
      name: "Create a server SDK key for production",
      value: `${packageName} flags sdk-keys add --type server --environment production`
    },
    {
      name: "Create a client SDK key with a label",
      value: `${packageName} flags sdk-keys add --type client -e preview --label "Preview App"`
    }
  ]
};
var sdkKeysRemoveSubcommand = {
  name: "remove",
  aliases: ["rm"],
  description: "Delete an SDK key",
  arguments: [
    {
      name: "key",
      required: true
    }
  ],
  options: [
    {
      ...yesOption,
      description: "Skip the confirmation prompt when deleting an SDK key"
    }
  ],
  examples: [
    {
      name: "Delete an SDK key",
      value: `${packageName} flags sdk-keys rm <hash-key>`
    }
  ]
};
var sdkKeysSubcommand = {
  name: "sdk-keys",
  aliases: [],
  description: "Manage SDK keys for feature flags",
  arguments: [],
  subcommands: [
    sdkKeysListSubcommand,
    sdkKeysAddSubcommand,
    sdkKeysRemoveSubcommand
  ],
  options: [],
  examples: []
};
var prepareSubcommand = {
  name: "prepare",
  aliases: [],
  description: "Prepare flag definition fallbacks for the build",
  arguments: [],
  options: [],
  examples: []
};
var flagsCommand = {
  name: "flags",
  aliases: [],
  description: "Manage feature flags for a Vercel project",
  // Hidden during initial rollout. Will be unhidden once the feature is
  // generally available and public documentation is published.
  hidden: true,
  arguments: [],
  subcommands: [
    listSubcommand7,
    inspectSubcommand2,
    createSubcommand,
    openSubcommand,
    updateSubcommand,
    setSubcommand2,
    removeSubcommand5,
    archiveSubcommand,
    disableSubcommand,
    enableSubcommand,
    sdkKeysSubcommand,
    prepareSubcommand
  ],
  options: [],
  examples: []
};

// src/commands/git/command.ts
var connectSubcommand = {
  name: "connect",
  aliases: [],
  description: "Connect your Vercel Project to your Git repository or provide the remote URL to your Git repository",
  arguments: [
    {
      name: "git-url",
      required: false
    }
  ],
  options: [yesOption, confirmOption],
  examples: [
    {
      name: "Connect your Vercel Project to your Git repository defined in your local `.git` config",
      value: `${packageName} git connect`
    },
    {
      name: "Connect your Vercel Project to a Git repository using the remote URL",
      value: `${packageName} git connect https://github.com/user/repo.git`
    }
  ]
};
var disconnectSubcommand = {
  name: "disconnect",
  aliases: [],
  description: "Disconnect the Git repository from your Vercel Project",
  arguments: [],
  options: [yesOption, confirmOption],
  examples: [
    {
      name: "Disconnect the Git repository",
      value: `${packageName} git disconnect`
    }
  ]
};
var gitCommand = {
  name: "git",
  aliases: [],
  description: "Manage your Git repository connection to the current Project",
  arguments: [],
  subcommands: [connectSubcommand, disconnectSubcommand],
  options: [],
  examples: []
};

// src/commands/guidance/command.ts
var statusSubcommand = {
  name: "status",
  aliases: [],
  description: "Shows whether guidance messages are enabled or disabled",
  arguments: [],
  options: [],
  examples: []
};
var enableSubcommand2 = {
  name: "enable",
  aliases: [],
  description: "Enables guidance messages",
  arguments: [],
  options: [],
  examples: []
};
var disableSubcommand2 = {
  name: "disable",
  aliases: [],
  description: "Disables guidance messages",
  arguments: [],
  options: [],
  examples: []
};
var guidanceCommand = {
  name: "guidance",
  aliases: [],
  description: "Allows you to enable or disable guidance messages",
  arguments: [],
  subcommands: [enableSubcommand2, disableSubcommand2, statusSubcommand],
  options: [],
  examples: []
};

// src/commands/httpstat/command.ts
var httpstatCommand = {
  name: "httpstat",
  aliases: [],
  description: "Execute httpstat with automatic deployment URL and protection bypass to visualize HTTP timing statistics.",
  arguments: [
    {
      name: "path",
      required: true
    }
  ],
  options: [
    {
      ...yesOption,
      description: "Skip confirmation when linking is required (e.g. in non-interactive mode)"
    },
    {
      name: "deployment",
      shorthand: null,
      type: String,
      deprecated: false,
      description: "The deployment ID or URL to target",
      argument: "ID|URL"
    },
    {
      name: "protection-bypass",
      shorthand: null,
      type: String,
      deprecated: false,
      description: "Protection bypass secret for accessing protected deployments",
      argument: "SECRET"
    }
  ],
  examples: [
    {
      name: "Visualize timing for a GET request to an API endpoint",
      value: `${packageName} httpstat /api/hello`
    },
    {
      name: "Make a POST request with data and see timing details",
      value: `${packageName} httpstat /api/users -- -X POST -d '{"name": "John"}'`
    },
    {
      name: "Target a specific deployment by ID",
      value: `${packageName} httpstat /api/status --deployment ERiL45NJvP8ghWxgbvCM447bmxwV`
    },
    {
      name: "Use curl flags after the separator",
      value: `${packageName} httpstat /api/test -- -H "Content-Type: application/json" -X PUT`
    },
    {
      name: "Use with protection bypass secret",
      value: `${packageName} httpstat /api/protected --protection-bypass <secret>`
    }
  ]
};

// src/commands/init/command.ts
var initCommand = {
  name: "init",
  aliases: [],
  description: "Initialize example Vercel Projects",
  arguments: [
    {
      name: "example",
      required: false
    },
    {
      name: "dir",
      required: false
    }
  ],
  options: [
    {
      ...forceOption,
      description: "Overwrite destination directory if exists [off]",
      argument: void 0
    }
  ],
  examples: [
    {
      name: "Choose from all available examples",
      value: `${packageName} init`
    },
    {
      name: "Initialize example project into a new directory",
      value: `${packageName} init <example>`
    },
    {
      name: "Initialize example project into specified directory",
      value: `${packageName} <example> <dir>`
    },
    {
      name: "Initialize example project without checking",
      value: `${packageName} init <example> --force`
    }
  ]
};

// src/commands/inspect/command.ts
var inspectCommand = {
  name: "inspect",
  aliases: [],
  description: "Show information about a deployment.",
  arguments: [
    {
      name: "url|deploymentId",
      required: true
    }
  ],
  options: [
    {
      name: "timeout",
      description: "Time to wait for deployment completion [3m]",
      argument: "TIME",
      shorthand: null,
      type: String,
      deprecated: false
    },
    {
      name: "wait",
      description: "Blocks until deployment completes",
      shorthand: null,
      type: Boolean,
      deprecated: false
    },
    {
      name: "logs",
      shorthand: "l",
      type: Boolean,
      deprecated: false,
      description: "Prints the build logs instead of the deployment summary"
    },
    formatOption,
    jsonOption
  ],
  examples: [
    {
      name: "Get information about a deployment by its unique URL",
      value: `${packageName} inspect my-deployment-ji2fjij2.vercel.app`
    },
    {
      name: "Get information about the deployment an alias points to",
      value: `${packageName} inspect my-deployment.vercel.app`
    },
    {
      name: "Get information about a deployment by piping in the URL",
      value: `echo my-deployment.vercel.app | ${packageName} inspect`
    },
    {
      name: "Wait up to 90 seconds for deployment to complete",
      value: `${packageName} inspect my-deployment.vercel.app --wait --timeout 90s`
    },
    {
      name: "Get deployment build logs",
      value: `${packageName} inspect my-deployment.vercel.app --logs`
    },
    {
      name: "Get deployment information as JSON",
      value: `${packageName} inspect my-deployment.vercel.app --format=json`
    }
  ]
};

// src/commands/integration/command.ts
var addSubcommand6 = {
  name: "add",
  aliases: [],
  description: "Installs a marketplace integration",
  arguments: [
    {
      name: "integration",
      required: true
    }
  ],
  options: [
    {
      name: "name",
      description: "Custom name for the resource (auto-generated if not provided)",
      shorthand: "n",
      type: String,
      deprecated: false,
      argument: "NAME"
    },
    {
      name: "metadata",
      description: "Metadata for the resource as KEY=VALUE (can be repeated). Run `vercel integration add <name> --help` to see available keys.",
      shorthand: "m",
      type: [String],
      deprecated: false,
      argument: "KEY=VALUE"
    },
    {
      name: "plan",
      shorthand: "p",
      type: String,
      deprecated: false,
      argument: "PLAN_ID",
      description: "Billing plan ID to use for the resource"
    },
    {
      name: "no-connect",
      shorthand: null,
      type: Boolean,
      deprecated: false,
      description: "Skip connecting the resource to the current project (also skips env pull)"
    },
    {
      name: "no-env-pull",
      shorthand: null,
      type: Boolean,
      deprecated: false,
      description: "Skip running env pull after provisioning"
    },
    {
      name: "environment",
      shorthand: "e",
      type: [String],
      deprecated: false,
      argument: "ENV",
      description: "Environment to connect (can be repeated: production, preview, development). Defaults to all."
    },
    {
      name: "prefix",
      shorthand: null,
      type: String,
      deprecated: false,
      argument: "PREFIX",
      description: "Prefix for environment variable names (e.g., --prefix NEON2_ creates NEON2_DATABASE_URL instead of DATABASE_URL)"
    },
    {
      name: "installation-id",
      shorthand: null,
      type: String,
      deprecated: false,
      argument: "ID",
      description: "Installation ID to use when multiple installations exist for the integration"
    },
    formatOption
  ],
  examples: [
    {
      name: "Install a marketplace integration (auto-generates resource name)",
      value: [
        `${packageName} integration add <integration-name>`,
        `${packageName} integration add acme`
      ]
    },
    {
      name: "Install a specific product from an integration",
      value: [
        `${packageName} integration add <integration>/<product>`,
        `${packageName} integration add acme/acme-redis`
      ]
    },
    {
      name: "Install with a custom resource name",
      value: [
        `${packageName} integration add acme --name my-database`,
        `${packageName} integration add acme -n my-database`
      ]
    },
    {
      name: "Install with metadata options",
      value: [
        `${packageName} integration add acme --metadata region=us-east-1`,
        `${packageName} integration add acme -m region=us-east-1 -m version=16`,
        `${packageName} integration add acme -m auth=true`,
        `${packageName} integration add acme -m "readRegions=sfo1,iad1"`
      ]
    },
    {
      name: "Install with a specific billing plan",
      value: [
        `${packageName} integration add acme --plan pro`,
        `${packageName} integration add acme -p pro`
      ]
    },
    {
      name: "Install and connect to specific environments only",
      value: [
        `${packageName} integration add acme --environment production`,
        `${packageName} integration add acme -e production -e preview`
      ]
    },
    {
      name: "Install without connecting to the current project",
      value: `${packageName} integration add acme --no-connect`
    },
    {
      name: "Install without pulling environment variables",
      value: `${packageName} integration add acme --no-env-pull`
    },
    {
      name: "Install with a prefix for environment variable names",
      value: `${packageName} integration add acme --prefix NEON2_`
    },
    {
      name: "Output as JSON",
      value: `${packageName} integration add acme --format=json`
    },
    {
      name: "Show available products for an integration",
      value: `${packageName} integration add acme --help`
    },
    {
      name: "Discover available marketplace products and their slugs",
      value: `${packageName} integration discover`
    }
  ]
};
var openSubcommand2 = {
  name: "open",
  aliases: [],
  description: "Opens a marketplace integration's or resource's dashboard via SSO",
  arguments: [
    {
      name: "name",
      required: true
    },
    {
      name: "resource",
      required: false
    }
  ],
  options: [formatOption],
  examples: [
    {
      name: "Open a marketplace integration's dashboard",
      value: [
        `${packageName} integration open <integration-name>`,
        `${packageName} integration open acme`
      ]
    },
    {
      name: "Open a resource's dashboard within an integration",
      value: [
        `${packageName} integration open <integration-name> <resource-name>`,
        `${packageName} integration open acme my-acme-store`
      ]
    },
    {
      name: "Get the SSO link as JSON",
      value: [
        `${packageName} integration open acme --format=json`,
        `${packageName} integration open acme my-acme-store --format=json`
      ]
    }
  ]
};
var listSubcommand8 = {
  name: "list",
  aliases: ["ls"],
  description: "List resources from marketplace integrations for the current project",
  arguments: [
    {
      name: "project",
      required: false
    }
  ],
  options: [
    {
      name: "integration",
      description: "Limits the resources listed to a designated integration",
      shorthand: "i",
      type: String,
      deprecated: false,
      argument: "NAME"
    },
    {
      name: "all",
      description: "Lists all resources regardless of project",
      shorthand: "a",
      type: Boolean,
      deprecated: false
    },
    formatOption
  ],
  examples: [
    {
      name: "List resources for the current linked project",
      value: [`${packageName} integration list`]
    },
    {
      name: "Filter the resources to a single integration",
      value: [
        `${packageName} integration list --integration <integration>`,
        `${packageName} integration list --integration acme`,
        `${packageName} integration list -i acme`
      ]
    },
    {
      name: "List all marketplace resources for the current team",
      value: [
        `${packageName} integration list --all`,
        `${packageName} integration list -a`
      ]
    },
    {
      name: "List resources as JSON",
      value: [`${packageName} integration list --format=json`]
    }
  ]
};
var discoverSubcommand = {
  name: "discover",
  aliases: [],
  description: "Discover available marketplace integrations",
  arguments: [
    {
      name: "query",
      required: false
    }
  ],
  options: [formatOption, jsonOption],
  examples: [
    {
      name: "Discover marketplace integrations",
      value: [`${packageName} integration discover`]
    },
    {
      name: "Search for integrations matching a query",
      value: [
        `${packageName} integration discover postgres`,
        `${packageName} integration discover aws`
      ]
    },
    {
      name: "Discover marketplace integrations as JSON",
      value: [`${packageName} integration discover --format=json`]
    }
  ]
};
var balanceSubcommand = {
  name: "balance",
  aliases: [],
  description: "Shows the balances and thresholds of a specified marketplace integration",
  arguments: [
    {
      name: "integration",
      required: true
    }
  ],
  options: [formatOption],
  examples: [
    {
      name: "Show the balance(s) & threshold(s) of a marketplace integration",
      value: [
        `${packageName} integration balance <integration-name>`,
        `${packageName} integration balance acme`
      ]
    },
    {
      name: "Output as JSON",
      value: `${packageName} integration balance acme --format=json`
    }
  ]
};
var removeSubcommand6 = {
  name: "remove",
  aliases: [],
  description: "Uninstalls a marketplace integration. Resources must be removed first using `integration-resource remove`.",
  arguments: [
    {
      name: "integration",
      required: true
    }
  ],
  options: [
    {
      ...yesOption,
      description: "Skip the confirmation prompt when uninstalling an integration"
    },
    formatOption
  ],
  examples: [
    {
      name: "Uninstall an integration",
      value: [
        `${packageName} integration remove <integration>`,
        `${packageName} integration remove acme`
      ]
    },
    {
      name: "Remove a resource before uninstalling",
      value: `${packageName} integration-resource remove <resource-name> --disconnect-all --yes`
    },
    {
      name: "Output as JSON",
      value: `${packageName} integration remove acme --format=json --yes`
    }
  ]
};
var guideSubcommand = {
  name: "guide",
  aliases: [],
  description: "Show getting started guides and code snippets for a marketplace integration",
  arguments: [
    {
      name: "integration",
      required: true
    }
  ],
  options: [
    {
      name: "framework",
      shorthand: "f",
      type: String,
      deprecated: false,
      argument: "FRAMEWORK",
      description: "Select a framework guide without interactive prompt (e.g., nextjs, remix, astro, nuxtjs, sveltekit)"
    }
  ],
  examples: [
    {
      name: "Show guides for a single-product integration",
      value: [
        `${packageName} integration guide <integration-name>`,
        `${packageName} integration guide neon`
      ]
    },
    {
      name: "Show guides for a specific product of a multi-product integration",
      value: [
        `${packageName} integration guide <integration>/<product>`,
        `${packageName} integration guide aws/aws-dynamodb`
      ]
    },
    {
      name: "Show the Next.js guide without prompts (useful for CI/agents)",
      value: `${packageName} integration guide neon --framework nextjs`
    },
    {
      name: "Discover available integrations and product slugs",
      value: `${packageName} integration discover`
    }
  ]
};
var integrationCommand = {
  name: "integration",
  aliases: [],
  description: "Manage marketplace integrations. To manage individual resources (disconnect, remove), see `integration-resource`.",
  options: [],
  arguments: [],
  subcommands: [
    addSubcommand6,
    balanceSubcommand,
    discoverSubcommand,
    guideSubcommand,
    listSubcommand8,
    openSubcommand2,
    removeSubcommand6
  ],
  examples: [
    {
      name: "Install a specific product from an integration",
      value: `${packageName} integration add acme/acme-redis`
    }
  ]
};

// src/commands/install/command.ts
var installCommand = {
  name: "install",
  aliases: ["i"],
  description: "Install an integration from the marketplace (alias for `integration add`)",
  arguments: [
    {
      name: "integration",
      required: true
    }
  ],
  options: addSubcommand6.options,
  examples: [
    {
      name: "Install an integration from the marketplace",
      value: `${packageName} install acme`
    },
    {
      name: "Install a specific product",
      value: `${packageName} install acme/acme-redis`
    }
  ]
};

// src/commands/integration-resource/command.ts
var removeSubcommand7 = {
  name: "remove",
  aliases: ["rm"],
  description: "Delete an integration resource",
  arguments: [
    {
      name: "resource",
      required: true
    }
  ],
  options: [
    {
      name: "disconnect-all",
      description: "Disconnects all projects from the specified resource before deletion",
      shorthand: "a",
      type: Boolean,
      deprecated: false
    },
    {
      ...yesOption,
      description: "Skip the confirmation prompt when deleting a resource"
    },
    formatOption
  ],
  examples: [
    {
      name: "Delete a resource",
      value: [
        `${packageName} integration-resource remove <resource>`,
        `${packageName} integration-resource remove my-acme-resource`
      ]
    },
    {
      name: "Disconnect all projects from a resource, then delete it",
      value: [
        `${packageName} integration-resource remove <resource> --disconnect-all`,
        `${packageName} integration-resource remove my-acme-resource --disconnect-all`,
        `${packageName} integration-resource remove my-acme-resource -a`
      ]
    },
    {
      name: "Output as JSON",
      value: `${packageName} integration-resource remove my-acme-resource --format=json --yes`
    }
  ]
};
var disconnectSubcommand2 = {
  name: "disconnect",
  aliases: [],
  description: "Disconnect a resource from a project, or the current project",
  arguments: [
    {
      name: "resource",
      required: true
    },
    {
      name: "project",
      required: false
    }
  ],
  options: [
    {
      name: "all",
      description: "Disconnects all projects from the specified resource",
      shorthand: "a",
      type: Boolean,
      deprecated: false
    },
    {
      ...yesOption,
      description: "Skip the confirmation prompt when disconnecting a resource"
    },
    formatOption
  ],
  examples: [
    {
      name: "Disconnect a resource from the current project",
      value: [
        `${packageName} integration-resource disconnect <resource>`,
        `${packageName} integration-resource disconnect my-acme-resource`
      ]
    },
    {
      name: "Disconnect all projects from a resource",
      value: [
        `${packageName} integration-resource disconnect <resource> --all`,
        `${packageName} integration-resource disconnect my-acme-resource --all`,
        `${packageName} integration-resource disconnect my-acme-resource -a`
      ]
    },
    {
      name: "Disconnect a resource from a specified project",
      value: [
        `${packageName} integration-resource disconnect <resource> <project>`,
        `${packageName} integration-resource disconnect my-acme-resource my-project`
      ]
    },
    {
      name: "Output as JSON",
      value: `${packageName} integration-resource disconnect my-acme-resource --format=json --yes`
    }
  ]
};
var createThresholdSubcommand = {
  name: "create-threshold",
  aliases: [],
  description: "Creates a threshold for a resource (or installation, if the integration uses installation-level thresholds)",
  arguments: [
    {
      name: "resource",
      required: true
    },
    {
      name: "minimum",
      required: true
    },
    {
      name: "spend",
      required: true
    },
    {
      name: "limit",
      required: true
    }
  ],
  options: [
    {
      ...yesOption,
      description: "Skip the confirmation prompt when creating a threshold"
    }
  ],
  examples: [
    {
      name: "create threshold",
      value: [
        `${packageName} integration-resource create-threshold <resource> <minimum> <spend> <limit> [options]`,
        `${packageName} integration-resource create-threshold my-acme-resource 50 100 2000`,
        `${packageName} integration-resource create-threshold my-acme-resource 50 100 2000 --yes`
      ]
    }
  ]
};
var integrationResourceCommand = {
  name: "integration-resource",
  aliases: ["ir"],
  description: "Manage marketplace integration resources",
  options: [],
  arguments: [],
  subcommands: [
    createThresholdSubcommand,
    disconnectSubcommand2,
    removeSubcommand7
  ],
  examples: []
};

// src/commands/login/command.ts
var loginCommand = {
  name: "login",
  aliases: [],
  description: "Sign in to your Vercel account.",
  arguments: [
    {
      name: "email or team id",
      required: false
    }
  ],
  options: [
    {
      name: "github",
      description: "Log in with GitHub",
      shorthand: null,
      type: Boolean,
      deprecated: true
    },
    {
      name: "oob",
      description: 'Log in with "out of band" authentication',
      shorthand: null,
      type: Boolean,
      deprecated: true
    },
    { name: "gitlab", shorthand: null, type: Boolean, deprecated: true },
    { name: "bitbucket", shorthand: null, type: Boolean, deprecated: true },
    {
      name: "future",
      description: "Sign in using OAuth Device Authorization",
      shorthand: null,
      type: Boolean,
      deprecated: true
    }
  ],
  examples: [
    {
      name: "Sign in to your Vercel account.",
      value: `${packageName} login`
    }
  ]
};

// src/commands/logout/command.ts
var logoutCommand = {
  name: "logout",
  aliases: [],
  description: "Sign out the currently authenticated user.",
  arguments: [],
  options: [],
  examples: [
    {
      name: "Sign out the currently authenticated user.",
      value: `${packageName} logout`
    }
  ]
};

// src/commands/logs/command.ts
var CommandTimeout = "5 minutes";
var logsCommand = {
  name: "logs",
  aliases: ["log"],
  description: "Display request logs for a project.\n\nSource types: \u03BB = serverless, \u03B5 = edge/middleware, \u25C7 = static/external",
  arguments: [
    {
      name: "url|deploymentId",
      required: false
    }
  ],
  options: [
    {
      name: "project",
      shorthand: "p",
      type: String,
      deprecated: false,
      description: "Project ID or name (defaults to linked project)"
    },
    {
      name: "deployment",
      shorthand: "d",
      type: String,
      deprecated: false,
      description: "Filter logs to a specific deployment ID or URL (alternative to positional argument)"
    },
    {
      name: "environment",
      shorthand: null,
      type: String,
      deprecated: false,
      description: "Filter by environment: production or preview"
    },
    {
      name: "level",
      shorthand: null,
      type: [String],
      deprecated: false,
      description: "Filter by log level: error, warning, info, fatal"
    },
    {
      name: "status-code",
      shorthand: null,
      type: String,
      deprecated: false,
      description: "Filter by HTTP status code (e.g., 500, 4xx)"
    },
    {
      name: "source",
      shorthand: null,
      type: [String],
      deprecated: false,
      description: "Filter by source: serverless, edge-function, edge-middleware, static"
    },
    {
      name: "since",
      shorthand: null,
      type: String,
      deprecated: false,
      description: "Start time (ISO format or relative: 1h, 30m)"
    },
    {
      name: "until",
      shorthand: null,
      type: String,
      deprecated: false,
      description: "End time (ISO format or relative, default: now)"
    },
    {
      name: "limit",
      shorthand: "n",
      type: Number,
      deprecated: false,
      description: "Maximum number of results (default: 100)"
    },
    {
      name: "json",
      shorthand: "j",
      type: Boolean,
      deprecated: false,
      description: "Output logs as JSON Lines for piping to other tools"
    },
    {
      name: "follow",
      shorthand: "f",
      type: Boolean,
      deprecated: false,
      description: "Stream live runtime logs (implicit when deployment URL/ID is specified)"
    },
    {
      name: "no-follow",
      shorthand: null,
      type: Boolean,
      deprecated: false,
      description: "Disable implicit --follow for deployment arguments"
    },
    {
      name: "query",
      shorthand: "q",
      type: String,
      deprecated: false,
      description: "Full-text search query"
    },
    {
      name: "search",
      shorthand: null,
      type: String,
      deprecated: false,
      description: 'Advanced search query (supports filter syntax, e.g. "status:500 error")'
    },
    {
      name: "request-id",
      shorthand: null,
      type: String,
      deprecated: false,
      description: "Filter by request ID"
    },
    {
      name: "expand",
      shorthand: "x",
      type: Boolean,
      deprecated: false,
      description: "Show full log message below each request line"
    },
    {
      name: "branch",
      shorthand: "b",
      type: String,
      deprecated: false,
      description: "Filter by git branch (defaults to current branch when in a git repo)"
    },
    {
      name: "no-branch",
      shorthand: null,
      type: Boolean,
      deprecated: false,
      description: "Disable auto-detection of git branch"
    }
  ],
  examples: [
    {
      name: "Stream live logs for a deployment URL",
      value: `${packageName} logs https://my-app-xxxxx.vercel.app`
    },
    {
      name: "Stream live logs for a deployment ID",
      value: `${packageName} logs dpl_xxxxx`
    },
    {
      name: "Display recent logs for the linked project",
      value: `${packageName} logs`
    },
    {
      name: "Display error logs from the last hour",
      value: `${packageName} logs --level error --since 1h`
    },
    {
      name: "Display logs for a specific deployment (historical)",
      value: `${packageName} logs dpl_xxxxx --no-follow`
    },
    {
      name: "Filter logs by status code and output as JSON",
      value: `${packageName} logs --status-code 500 --json`
    },
    {
      name: "Search logs and pipe to jq",
      value: `${packageName} logs --query "timeout" --json | jq '.message'`
    },
    {
      name: "Use advanced search query with filters",
      value: `${packageName} logs --search 'status:500 error' --json | jq '.message'`
    },
    {
      name: "Display production logs only",
      value: `${packageName} logs --environment production`
    },
    {
      name: "Display logs for a specific request",
      value: `${packageName} logs --request-id req_xxxxx`
    },
    {
      name: "Display logs with full message details",
      value: `${packageName} logs --expand`
    },
    {
      name: "Display logs for a specific branch",
      value: `${packageName} logs --branch feature-x`
    },
    {
      name: "Display logs for all branches (disable auto-detection)",
      value: `${packageName} logs --no-branch`
    }
  ]
};

// src/commands/mcp/command.ts
var mcpCommand = {
  name: "mcp",
  aliases: [],
  description: "Set up MCP agents and configuration for Vercel integration",
  arguments: [],
  options: [
    {
      name: "project",
      description: "Set up project-specific MCP access for the currently linked project",
      shorthand: null,
      type: Boolean,
      deprecated: false
    },
    {
      name: "clients",
      description: "Comma-separated list of MCP clients to set up. In interactive mode, skips the client picker when set. Required in non-interactive mode. Options: Claude Code, Claude.ai and Claude for desktop, Cursor, VS Code with Copilot",
      shorthand: null,
      type: String,
      argument: "CLIENTS",
      deprecated: false
    }
  ],
  examples: [
    {
      name: "Interactively set up MCP agents",
      value: `${packageName} mcp`
    },
    {
      name: "Set up project-specific MCP access",
      value: `${packageName} mcp --project`
    },
    {
      name: "Non-interactive: set up Cursor and VS Code",
      value: `${packageName} mcp --clients "Cursor,VS Code with Copilot"`
    }
  ]
};

// src/commands/microfrontends/command.ts
var createGroupSubcommand = {
  name: "create-group",
  aliases: [],
  description: "Create a new microfrontends group to compose multiple projects into one cohesive application with shared routing",
  arguments: [],
  options: [
    {
      name: "name",
      shorthand: null,
      type: String,
      deprecated: false,
      description: "Name of the microfrontends group"
    },
    {
      name: "project",
      shorthand: null,
      type: [String],
      deprecated: false,
      description: "Project name to include (repeatable)"
    },
    {
      name: "default-app",
      shorthand: null,
      type: String,
      deprecated: false,
      description: "Project name for the default application"
    },
    {
      name: "default-route",
      shorthand: null,
      type: String,
      deprecated: false,
      description: "Default route for the default application"
    }
  ],
  examples: [
    {
      name: "Create a microfrontends group interactively",
      value: `${packageName} microfrontends create-group`
    },
    {
      name: "Create a microfrontends group with flags",
      value: `${packageName} mf create-group --name="My Group" --project=web --project=docs --default-app=web`
    }
  ]
};
var addToGroupSubcommand = {
  name: "add-to-group",
  aliases: [],
  description: "Add the current project to a microfrontends group so it can be independently deployed as part of the microfrontends group",
  arguments: [],
  options: [
    {
      name: "group",
      shorthand: null,
      type: String,
      deprecated: false,
      description: "Name of the microfrontends group to add to"
    },
    {
      name: "default-route",
      shorthand: null,
      type: String,
      deprecated: false,
      description: "Default route for this project (e.g. /docs)"
    }
  ],
  examples: [
    {
      name: "Add current project to a group interactively",
      value: `${packageName} microfrontends add-to-group`
    },
    {
      name: "Add current project to a group with flags",
      value: `${packageName} mf add-to-group --group="My Group" --default-route=/docs`
    }
  ]
};
var removeFromGroupSubcommand = {
  name: "remove-from-group",
  aliases: [],
  description: "Remove the current project from its microfrontends group so it is no longer part of the composed application",
  arguments: [],
  options: [
    {
      ...yesOption,
      description: "Skip project linking confirmation"
    }
  ],
  examples: [
    {
      name: "Remove current project from its group interactively",
      value: `${packageName} microfrontends remove-from-group`
    }
  ]
};
var deleteGroupSubcommand = {
  name: "delete-group",
  aliases: [],
  description: "Delete a microfrontends group and all of its settings. This action is not reversible.",
  arguments: [],
  options: [
    {
      ...yesOption,
      description: "Skip project linking confirmation"
    },
    {
      name: "group",
      shorthand: null,
      type: String,
      deprecated: false,
      description: "Name or ID of the microfrontends group to delete"
    }
  ],
  examples: [
    {
      name: "Delete a microfrontends group interactively",
      value: `${packageName} microfrontends delete-group`
    },
    {
      name: "Delete a microfrontends group with flags",
      value: `${packageName} mf delete-group --group="My Group"`
    }
  ]
};
var pullSubcommand = {
  name: "pull",
  aliases: [],
  description: "Pull a Vercel Microfrontends configuration into your project",
  arguments: [],
  options: [
    {
      ...yesOption,
      description: "Skip confirmation when linking is required (e.g. in non-interactive mode)"
    },
    {
      name: "dpl",
      shorthand: null,
      deprecated: false,
      type: String,
      description: "The deploymentId to use for pulling the microfrontends configuration"
    }
  ],
  examples: [
    {
      name: "Pull a microfrontends configuration",
      value: `${packageName} microfrontends pull`
    },
    {
      name: "Pull a microfrontends configuration for a specific deployment",
      value: `${packageName} microfrontends pull --dpl=<deployment-id>`
    }
  ]
};
var inspectGroupSubcommand = {
  name: "inspect-group",
  aliases: [],
  description: "Inspect a microfrontends group and return project metadata used for setup automation",
  arguments: [],
  options: [
    {
      name: "group",
      shorthand: null,
      type: String,
      deprecated: false,
      description: "Name or ID of the microfrontends group to inspect"
    },
    {
      name: "config-file-name",
      shorthand: null,
      type: String,
      deprecated: false,
      description: "Custom microfrontends config file path/name relative to the default app root (must end with .json or .jsonc)"
    },
    formatOption
  ],
  examples: [
    {
      name: "Inspect a microfrontends group interactively",
      value: `${packageName} microfrontends inspect-group`
    },
    {
      name: "Inspect a microfrontends group as JSON",
      value: `${packageName} mf inspect-group --group="My Group" --format=json`
    }
  ]
};
var microfrontendsCommand = {
  name: "microfrontends",
  aliases: ["mf"],
  description: "Manage microfrontends groups that compose multiple projects into one cohesive application",
  arguments: [],
  subcommands: [
    createGroupSubcommand,
    addToGroupSubcommand,
    removeFromGroupSubcommand,
    deleteGroupSubcommand,
    inspectGroupSubcommand,
    pullSubcommand
  ],
  options: [],
  examples: []
};

// src/commands/open/command.ts
var openCommand = {
  name: "open",
  aliases: [],
  description: "Opens the current project in the Vercel Dashboard.",
  arguments: [],
  options: [
    {
      ...yesOption,
      description: "Skip confirmation when linking is required (e.g. in non-interactive mode)"
    }
  ],
  examples: [
    {
      name: "Open the current project in the Vercel Dashboard",
      value: `${packageName} open`
    }
  ]
};

// src/commands/project/command.ts
var addSubcommand7 = {
  name: "add",
  aliases: [],
  description: "Add a new project",
  arguments: [
    {
      name: "name",
      required: true
    }
  ],
  options: [],
  examples: [
    {
      name: "Add a new project",
      value: `${packageName} project add my-project`
    }
  ]
};
var inspectSubcommand3 = {
  name: "inspect",
  aliases: [],
  description: "Displays information related to a project",
  arguments: [
    {
      name: "name",
      required: false
    }
  ],
  options: [yesOption],
  examples: [
    {
      name: "Inspect the linked project from the current directory",
      value: `${packageName} project inspect`
    },
    {
      name: 'Inspect the project named "my-project"',
      value: `${packageName} project inspect my-project`
    }
  ]
};
var listSubcommand9 = {
  name: "list",
  aliases: ["ls"],
  description: "Show all projects in the selected scope",
  default: true,
  arguments: [],
  options: [
    nextOption,
    formatOption,
    jsonOption,
    {
      name: "update-required",
      description: "A list of projects affected by an upcoming deprecation",
      shorthand: null,
      type: Boolean,
      deprecated: false
    }
  ],
  examples: [
    {
      name: "Paginate projects, where `1584722256178` is the time in milliseconds since the UNIX epoch",
      value: `${packageName} project ls --next 1584722256178`
    },
    {
      name: "List projects using a deprecated Node.js version in JSON format",
      value: `${packageName} project ls --update-required --format=json`
    }
  ]
};
var removeSubcommand8 = {
  name: "remove",
  aliases: ["rm"],
  description: "Delete a project",
  arguments: [
    {
      name: "name",
      required: true
    }
  ],
  options: [],
  examples: []
};
var tokenSubcommand = {
  name: "token",
  aliases: [],
  description: "Get a development OIDC token for a project",
  arguments: [
    {
      name: "name",
      required: false
    }
  ],
  options: [yesOption],
  examples: [
    {
      name: "Get a development OIDC token for the linked project",
      value: `${packageName} project token`
    },
    {
      name: 'Get a development OIDC token for the project named "my-project"',
      value: `${packageName} project token my-project`
    }
  ]
};
var projectCommand = {
  name: "project",
  aliases: ["projects"],
  description: "Manage your Vercel projects",
  arguments: [],
  subcommands: [
    addSubcommand7,
    inspectSubcommand3,
    listSubcommand9,
    removeSubcommand8,
    tokenSubcommand
  ],
  options: [],
  examples: []
};

// src/commands/promote/command.ts
var statusSubcommand2 = {
  name: "status",
  aliases: [],
  description: "Show the status of any current pending promotions",
  arguments: [
    {
      name: "project",
      required: false
    }
  ],
  options: [
    {
      ...yesOption,
      description: "Skip the confirmation prompt when linking a Project"
    }
  ],
  examples: [
    {
      name: "Show the status of any current pending promotions",
      value: [
        `${packageName} promote status`,
        `${packageName} promote status <project>`,
        `${packageName} promote status --timeout 30s`
      ]
    }
  ]
};
var promoteCommand = {
  name: "promote",
  aliases: [],
  description: "Promote an existing Deployment to current",
  arguments: [
    {
      name: "url|deploymentId",
      required: true
    }
  ],
  subcommands: [statusSubcommand2],
  options: [
    {
      name: "timeout",
      description: "Time to wait for promotion completion [3m]",
      argument: "TIME",
      shorthand: null,
      type: String,
      deprecated: false
    },
    {
      ...yesOption,
      description: "Skip the confirmation prompt when linking a Project"
    }
  ],
  examples: [
    {
      name: "Promote a Deployment using ID or URL",
      value: `${packageName} promote <deployment id|url>`
    }
  ]
};

// src/commands/redeploy/command.ts
var redeployCommand = {
  name: "redeploy",
  aliases: [],
  description: "Rebuild and deploy a previous deployment.",
  arguments: [
    {
      name: "url|deploymentId",
      required: false
    }
  ],
  options: [
    {
      name: "no-wait",
      shorthand: null,
      description: "Don't wait for the redeploy to finish",
      type: Boolean,
      deprecated: false
    },
    {
      name: "target",
      shorthand: null,
      argument: "TARGET",
      description: "Redeploy to a specific target environment",
      type: String,
      deprecated: false
    }
  ],
  examples: [
    {
      name: "Rebuild and deploy an existing deployment using id or url",
      value: `${packageName} redeploy my-deployment.vercel.app`
    },
    {
      name: "Write Deployment URL to a file",
      value: `${packageName} redeploy my-deployment.vercel.app > deployment-url.txt`
    },
    {
      name: "Rebuild and deploy an existing deployment to a specific target environment",
      value: `${packageName} redeploy my-deployment.vercel.app --target preview`
    }
  ]
};

// src/commands/redirects/command.ts
var listSubcommand10 = {
  name: "list",
  aliases: ["ls"],
  description: "List all redirects for the current project. These redirects apply to all deployments and environments. There may also be redirects defined in a deployment that are not listed here.",
  arguments: [],
  options: [
    {
      name: "search",
      description: "Search for redirects by source or destination",
      shorthand: "s",
      type: String,
      argument: "QUERY",
      deprecated: false
    },
    {
      name: "page",
      description: "Page number to display",
      shorthand: null,
      type: Number,
      argument: "NUMBER",
      deprecated: false
    },
    {
      name: "per-page",
      description: "Number of redirects per page (default: 50)",
      shorthand: null,
      type: Number,
      argument: "NUMBER",
      deprecated: false
    },
    {
      name: "staging",
      description: "List redirects from the staging version",
      shorthand: null,
      type: Boolean,
      deprecated: false
    },
    {
      name: "version",
      description: "List redirects from a specific version ID",
      shorthand: null,
      type: String,
      argument: "VERSION_ID",
      deprecated: false
    }
  ],
  examples: [
    {
      name: "List all redirects",
      value: `${packageName} redirects list`
    },
    {
      name: "Search for redirects",
      value: `${packageName} redirects list --search "/old-path"`
    },
    {
      name: "List redirects on page 2",
      value: `${packageName} redirects list --page 2`
    },
    {
      name: "List redirects with custom page size",
      value: `${packageName} redirects list --per-page 25`
    }
  ]
};
var listVersionsSubcommand = {
  name: "list-versions",
  aliases: ["ls-versions"],
  description: "List all versions of redirects",
  arguments: [],
  options: [],
  examples: [
    {
      name: "List all redirect versions",
      value: `${packageName} redirects list-versions`
    }
  ]
};
var addSubcommand8 = {
  name: "add",
  aliases: [],
  description: "Add a new redirect",
  arguments: [
    {
      name: "source",
      required: false
    },
    {
      name: "destination",
      required: false
    }
  ],
  options: [
    {
      name: "status",
      description: "HTTP status code (301, 302, 307, or 308)",
      shorthand: null,
      type: Number,
      argument: "CODE",
      deprecated: false
    },
    {
      name: "case-sensitive",
      description: "Make the redirect case sensitive",
      shorthand: null,
      type: Boolean,
      deprecated: false
    },
    {
      name: "preserve-query-params",
      description: "Preserve query parameters when redirecting",
      shorthand: null,
      type: Boolean,
      deprecated: false
    },
    {
      name: "name",
      description: "Version name for this redirect (max 256 characters)",
      shorthand: null,
      type: String,
      argument: "NAME",
      deprecated: false
    },
    {
      ...yesOption,
      description: "Skip prompts and use default values"
    }
  ],
  examples: [
    {
      name: "Add a new redirect interactively",
      value: `${packageName} redirects add`
    },
    {
      name: "Add a new redirect with arguments",
      value: `${packageName} redirects add /old-path /new-path`
    },
    {
      name: "Add a redirect with all options",
      value: `${packageName} redirects add /old-path /new-path --status 301 --case-sensitive --preserve-query-params --name "My redirect"`
    },
    {
      name: "Add a redirect non-interactively",
      value: `${packageName} redirects add /old-path /new-path --yes`
    }
  ]
};
var uploadSubcommand = {
  name: "upload",
  aliases: ["import"],
  description: "Upload redirects from a CSV or JSON file",
  arguments: [
    {
      name: "file",
      required: true
    }
  ],
  options: [
    {
      ...yesOption,
      description: "Skip confirmation prompt"
    },
    {
      name: "overwrite",
      description: "Replace all existing redirects",
      shorthand: null,
      type: Boolean,
      deprecated: false
    }
  ],
  examples: [
    {
      name: "Upload redirects from CSV file",
      value: `${packageName} redirects upload redirects.csv`
    },
    {
      name: "Upload redirects from JSON file",
      value: `${packageName} redirects upload redirects.json`
    },
    {
      name: "Upload and overwrite existing redirects",
      value: `${packageName} redirects upload redirects.csv --overwrite`
    },
    {
      name: "Upload without confirmation",
      value: `${packageName} redirects upload redirects.csv --yes`
    }
  ]
};
var removeSubcommand9 = {
  name: "remove",
  aliases: ["rm"],
  description: "Remove a redirect",
  arguments: [
    {
      name: "source",
      required: true
    }
  ],
  options: [
    {
      ...yesOption,
      description: "Skip the confirmation prompt when removing a redirect"
    }
  ],
  examples: [
    {
      name: "Remove a redirect",
      value: `${packageName} redirects remove /old-path`
    }
  ]
};
var promoteSubcommand = {
  name: "promote",
  aliases: [],
  description: "Promote a staged redirects version to production",
  arguments: [
    {
      name: "version-id",
      required: true
    }
  ],
  options: [
    {
      ...yesOption,
      description: "Skip the confirmation prompt when promoting"
    }
  ],
  examples: [
    {
      name: "Promote a redirect version",
      value: `${packageName} redirects promote <version-id>`
    }
  ]
};
var restoreSubcommand = {
  name: "restore",
  aliases: [],
  description: "Restore a previous redirects version",
  arguments: [
    {
      name: "version-id",
      required: true
    }
  ],
  options: [
    {
      ...yesOption,
      description: "Skip the confirmation prompt when restoring"
    }
  ],
  examples: [
    {
      name: "Restore a redirects version",
      value: `${packageName} redirects restore <version-id>`
    }
  ]
};
var redirectsCommand = {
  name: "redirects",
  aliases: ["redirect"],
  description: "Manage redirects for a project. Redirects managed at the project level apply to all deployments and environments and take effect immediately after being created and promoted to production.",
  arguments: [],
  subcommands: [
    listSubcommand10,
    listVersionsSubcommand,
    addSubcommand8,
    uploadSubcommand,
    removeSubcommand9,
    promoteSubcommand,
    restoreSubcommand
  ],
  options: [],
  examples: []
};

// src/commands/remove/command.ts
var removeCommand = {
  name: "remove",
  aliases: ["rm"],
  description: "Remove deployment(s) by project name or deployment ID.",
  arguments: [
    {
      name: "name|deploymentId",
      required: true,
      multiple: true
    }
  ],
  options: [
    {
      ...yesOption,
      description: "Skip confirmation"
    },
    {
      name: "safe",
      shorthand: "s",
      type: Boolean,
      deprecated: false,
      description: "Skip deployments with an active alias"
    },
    { name: "hard", shorthand: null, type: Boolean, deprecated: false }
  ],
  examples: [
    {
      name: "Remove a deployment identified by Deployment ID",
      value: `${packageName} remove dpl_abcdef123456890`
    },
    {
      name: "Remove all deployments with Project name `my-app`",
      value: `${packageName} remove my-app`
    },
    {
      name: "Remove two deployments with Deployment IDs",
      value: `${packageName} remove dpl_eyWt6zuSdeus dpl_uWHoA9RQ1d1o`
    }
  ]
};

// src/commands/rollback/command.ts
var statusSubcommand3 = {
  name: "status",
  aliases: [],
  description: "Show the status of any current pending rollbacks",
  arguments: [
    {
      name: "project",
      required: false
    }
  ],
  options: [],
  examples: [
    {
      name: "Show the status of any current pending rollbacks",
      value: [
        `${packageName} rollback status`,
        `${packageName} rollback status <project>`,
        `${packageName} rollback status --timeout 30s`
      ]
    }
  ]
};
var rollbackCommand = {
  name: "rollback",
  aliases: [],
  description: "Quickly revert back to a previous deployment",
  arguments: [
    {
      name: "url|deploymentId",
      required: true
    }
  ],
  subcommands: [statusSubcommand3],
  options: [
    {
      name: "timeout",
      description: "Time to wait for rollback completion [3m]",
      argument: "TIME",
      shorthand: null,
      type: String,
      deprecated: false
    },
    yesOption
  ],
  examples: [
    {
      name: "Rollback a deployment using id or url",
      value: `${packageName} rollback <deployment id/url>`
    }
  ]
};

// src/commands/rolling-release/command.ts
var configureSubcommand = {
  name: "configure",
  description: "Configure rolling release settings for a project",
  aliases: [],
  arguments: [],
  examples: [
    {
      name: "Enable automatic rolling release: 10% for 5 minutes, then 50% for 10 minutes, then 100%",
      value: `${packageName} rolling-release configure --enable --advancement-type=automatic --stage=10,5m --stage=50,10m`
    },
    {
      name: "Enable manual-approval rolling release: 10%, then 50%, then 100% (each stage requires approval)",
      value: `${packageName} rolling-release configure --enable --advancement-type=manual-approval --stage=10 --stage=50`
    },
    {
      name: "Disable rolling releases",
      value: `${packageName} rolling-release configure --disable`
    },
    {
      name: "Configure with raw JSON (advanced)",
      value: `${packageName} rolling-release configure --cfg='{"enabled":true, "advancementType":"automatic", "stages":[{"targetPercentage":10,"duration":5},{"targetPercentage":100}]}'`
    }
  ],
  options: [
    {
      name: "cfg",
      shorthand: null,
      deprecated: false,
      type: String,
      description: "Raw JSON configuration (advanced). Overrides other flags."
    },
    {
      name: "enable",
      shorthand: null,
      deprecated: false,
      type: Boolean,
      description: "Enable rolling releases for this project"
    },
    {
      name: "disable",
      shorthand: null,
      deprecated: false,
      type: Boolean,
      description: "Disable rolling releases for this project"
    },
    {
      name: "advancement-type",
      shorthand: null,
      deprecated: false,
      type: String,
      argument: "TYPE",
      description: 'How stages advance: "automatic" or "manual-approval"'
    },
    {
      name: "stage",
      shorthand: null,
      deprecated: false,
      type: [String],
      argument: "PERCENTAGE[,DURATION]",
      description: 'Add a rollout stage. Percentage (1-99) with optional duration for automatic advancement (e.g. "10,5m"). Can be specified multiple times. A final 100% stage is added automatically.'
    }
  ]
};
var startSubcommand = {
  name: "start",
  description: "Start a rolling release",
  aliases: [],
  arguments: [],
  examples: [
    {
      name: "Start a rolling release",
      value: `${packageName} rr start --dpl=dpl_123`
    },
    {
      name: "Start a rolling release using URL",
      value: `${packageName} rr start --dpl=https://example.vercel.app`
    },
    {
      name: "Non-interactive (e.g. preview deployment): use --yes to promote",
      value: `${packageName} rr start --dpl=dpl_123 --yes`
    }
  ],
  options: [
    {
      name: "dpl",
      shorthand: null,
      deprecated: false,
      type: String,
      description: "The deploymentId or URL to target for the rolling release",
      required: true
    },
    yesOption
  ]
};
var approveSubcommand = {
  name: "approve",
  description: "Approve the current stage of an active rolling release",
  aliases: [],
  arguments: [],
  examples: [
    {
      name: "Approve the current stage of an active rolling release",
      value: `${packageName} rolling-release approve --currentStageIndex=0 --dpl=dpl_123`
    }
  ],
  options: [
    {
      name: "dpl",
      shorthand: null,
      deprecated: false,
      type: String,
      description: "The deploymentId of the rolling release"
    },
    {
      name: "currentStageIndex",
      shorthand: null,
      deprecated: false,
      type: String,
      description: "The current stage of a rolling release to approve"
    }
  ]
};
var abortSubcommand = {
  name: "abort",
  description: "Abort an active rolling release",
  aliases: [],
  arguments: [],
  examples: [
    {
      name: "Abort an active rolling release",
      value: `${packageName} rolling-release abort --dpl=dpl_123`
    }
  ],
  options: [
    {
      name: "dpl",
      shorthand: null,
      deprecated: false,
      type: String,
      description: "The deploymentId of the rolling release to abort"
    }
  ]
};
var completeSubcommand = {
  name: "complete",
  description: "Complete an active rolling release",
  aliases: [],
  arguments: [],
  examples: [
    {
      name: "Complete an active rolling release",
      value: `${packageName} rolling-release complete --dpl=dpl_123`
    }
  ],
  options: [
    {
      name: "dpl",
      shorthand: null,
      deprecated: false,
      type: String,
      description: "The deploymentId of the rolling release to complete"
    }
  ]
};
var fetchSubcommand = {
  name: "fetch",
  description: "Fetch details about a rolling release",
  aliases: [],
  arguments: [],
  examples: [
    {
      name: "Fetch details about a rolling release",
      value: `${packageName} rolling-release fetch`
    }
  ],
  options: []
};
var rollingReleaseCommand = {
  name: "rolling-release",
  aliases: ["rr"],
  description: "Rolling releases gradually shift traffic to a new deployment in stages, allowing you to monitor for errors before serving all traffic. Learn more: https://vercel.com/docs/rolling-releases",
  arguments: [],
  subcommands: [
    configureSubcommand,
    startSubcommand,
    approveSubcommand,
    abortSubcommand,
    completeSubcommand,
    fetchSubcommand
  ],
  options: [],
  examples: [
    {
      name: "Enable automatic rolling release with two stages",
      value: `${packageName} rr configure --enable --advancement-type=automatic --stage=10,5m --stage=50,10m`
    },
    {
      name: "Enable manual-approval rolling release",
      value: `${packageName} rr configure --enable --advancement-type=manual-approval --stage=10 --stage=50`
    },
    {
      name: "Disable rolling releases",
      value: `${packageName} rr configure --disable`
    },
    {
      name: "Start a rolling release",
      value: `${packageName} rr start --dpl=dpl_123`
    },
    {
      name: "Approve an active rolling release stage",
      value: `${packageName} rr approve --currentStageIndex=0 --dpl=dpl_123`
    },
    {
      name: "Abort an active rolling release",
      value: `${packageName} rr abort --dpl=dpl_123`
    },
    {
      name: "Complete an active rolling release",
      value: `${packageName} rr complete --dpl=dpl_123`
    }
  ]
};

// src/commands/skills/command.ts
var skillsCommand = {
  name: "skills",
  aliases: [],
  description: "Discover agent skills relevant to your project",
  arguments: [{ name: "query", required: false }],
  options: [
    {
      name: "json",
      shorthand: null,
      type: Boolean,
      deprecated: false,
      description: "Output results as JSON"
    },
    {
      name: "format",
      shorthand: null,
      type: String,
      argument: "FORMAT",
      deprecated: false,
      description: "Specify output format (json)"
    },
    yesOption
  ],
  examples: [
    {
      name: "Recommend skills based on detected project",
      value: `${packageName} skills`
    },
    {
      name: "Search for skills by keyword",
      value: `${packageName} skills nextjs`
    }
  ]
};

// src/commands/target/command.ts
var listSubcommand11 = {
  name: "list",
  aliases: ["ls"],
  description: "List targets defined for the current Project",
  arguments: [],
  options: [
    formatOption,
    {
      ...yesOption,
      description: "Skip confirmation when linking is required (e.g. in non-interactive mode)"
    }
  ],
  examples: [
    {
      name: "List all targets for the current Project",
      value: `${packageName} target ls my-project`
    }
  ]
};
var targetCommand = {
  name: "target",
  aliases: ["targets"],
  description: `Manage your Vercel Project's "targets" (custom environments).`,
  arguments: [],
  subcommands: [listSubcommand11],
  options: [],
  examples: []
};

// src/commands/teams/command.ts
var addSubcommand9 = {
  name: "add",
  aliases: ["create"],
  description: "Create a new team",
  arguments: [],
  options: [
    {
      name: "slug",
      shorthand: null,
      type: String,
      description: "Team URL slug (e.g. acme for vercel.com/acme); required in non-interactive mode",
      deprecated: false
    },
    {
      name: "name",
      shorthand: null,
      type: String,
      description: "Display name for the team; required in non-interactive mode",
      deprecated: false
    }
  ],
  examples: [
    {
      name: "Create a team (interactive)",
      value: `${packageName} teams add`
    },
    {
      name: "Create a team non-interactively",
      value: `${packageName} teams add --slug acme --name "Acme Corp"`
    }
  ]
};
var listSubcommand12 = {
  name: "list",
  aliases: ["ls"],
  description: "Show all teams that you're a member of",
  arguments: [],
  options: [
    nextOption,
    formatOption,
    { name: "since", shorthand: null, type: String, deprecated: true },
    { name: "until", shorthand: null, type: String, deprecated: true },
    { name: "count", shorthand: "C", type: Number, deprecated: true }
  ],
  examples: [
    {
      name: "Paginate results, where `1584722256178` is the time in milliseconds since the UNIX epoch",
      value: `${packageName} teams ls --next 1584722256178`
    }
  ]
};
var switchSubcommand = {
  name: "switch",
  aliases: ["change"],
  description: "Switch to a different team",
  arguments: [
    {
      name: "name",
      required: false
    }
  ],
  options: [],
  examples: [
    {
      name: "Switch to a team. If your team's url is 'vercel.com/name', then 'name' is the slug. If the slug is omitted, you can choose interactively",
      value: `${packageName} teams switch <slug>`
    }
  ]
};
var inviteSubcommand = {
  name: "invite",
  aliases: [],
  description: "Invite a new member to a team",
  arguments: [
    {
      name: "email",
      required: true,
      multiple: true
    }
  ],
  options: [],
  examples: [
    {
      name: "Invite new members (interactively)",
      value: `${packageName} teams invite`
    },
    {
      name: "Invite multiple members (required in non-interactive mode)",
      value: `${packageName} teams invite abc@vercel.com xyz@vercel.com`
    }
  ]
};
var teamsCommand = {
  name: "teams",
  aliases: ["switch", "team"],
  description: "Manage Teams under your Vercel account",
  arguments: [],
  subcommands: [
    addSubcommand9,
    inviteSubcommand,
    listSubcommand12,
    switchSubcommand
  ],
  options: [],
  examples: []
};

// src/commands/telemetry/command.ts
var statusSubcommand4 = {
  name: "status",
  aliases: [],
  description: "Shows whether telemetry collection is enabled or disabled",
  arguments: [],
  options: [],
  examples: []
};
var enableSubcommand3 = {
  name: "enable",
  aliases: [],
  description: "Enables telemetry collection",
  arguments: [],
  options: [],
  examples: []
};
var flushSubcommand = {
  name: "flush",
  aliases: [],
  description: "Internal command to flush telemetry events",
  hidden: true,
  arguments: [],
  options: [],
  examples: []
};
var disableSubcommand3 = {
  name: "disable",
  aliases: [],
  description: "Disables telemetry collection",
  arguments: [],
  options: [],
  examples: []
};
var telemetryCommand = {
  name: "telemetry",
  aliases: [],
  description: "Allows you to enable or disable telemetry collection",
  arguments: [],
  subcommands: [
    enableSubcommand3,
    disableSubcommand3,
    statusSubcommand4,
    flushSubcommand
  ],
  options: [],
  examples: []
};

// src/commands/upgrade/command.ts
var upgradeCommand = {
  name: "upgrade",
  aliases: [],
  description: "Upgrades the Vercel CLI to the latest version.",
  arguments: [],
  options: [
    {
      name: "dry-run",
      shorthand: null,
      type: Boolean,
      deprecated: false,
      description: "Show the upgrade command without executing it"
    },
    {
      ...formatOption,
      description: "Specify the output format (json) - implies --dry-run"
    },
    jsonOption
  ],
  examples: [
    {
      name: "Upgrade the Vercel CLI to the latest version",
      value: `${packageName} upgrade`
    },
    {
      name: "Show the upgrade command without running it",
      value: `${packageName} upgrade --dry-run`
    },
    {
      name: "Get upgrade information as JSON",
      value: `${packageName} upgrade --format=json`
    }
  ]
};

// src/commands/usage/command.ts
var usageCommand = {
  name: "usage",
  aliases: [],
  description: "Show billing usage (MIUs and costs) for the current billing period or a custom date range",
  arguments: [],
  options: [
    {
      name: "from",
      shorthand: null,
      type: String,
      argument: "DATE",
      description: "Start date (YYYY-MM-DD, interpreted as midnight LA time)",
      deprecated: false
    },
    {
      name: "to",
      shorthand: null,
      type: String,
      argument: "DATE",
      description: "End date (YYYY-MM-DD, interpreted as end of day LA time)",
      deprecated: false
    },
    {
      name: "breakdown",
      shorthand: null,
      type: String,
      argument: "PERIOD",
      description: "Show usage breakdown by time period instead of aggregated totals (daily, weekly, monthly)",
      deprecated: false
    },
    formatOption,
    jsonOption
  ],
  examples: [
    {
      name: "Show usage for the current billing period",
      value: `${packageName} usage`
    },
    {
      name: "Show usage for a custom date range",
      value: `${packageName} usage --from 2025-01-01 --to 2025-01-31`
    },
    {
      name: "Show daily usage breakdown",
      value: `${packageName} usage --breakdown daily`
    },
    {
      name: "Show weekly usage breakdown",
      value: `${packageName} usage --breakdown weekly`
    },
    {
      name: "Output usage data as JSON",
      value: `${packageName} usage --format json`
    }
  ]
};

// src/commands/whoami/command.ts
var whoamiCommand = {
  name: "whoami",
  aliases: [],
  description: "Shows the username of the currently logged in user.",
  arguments: [],
  options: [formatOption],
  examples: [
    {
      name: "Shows the username of the currently logged in user",
      value: `${packageName} whoami`
    }
  ]
};

// src/commands/blob/command.ts
var ifMatchOption = {
  name: "if-match",
  shorthand: null,
  type: String,
  deprecated: false,
  description: "Only perform the operation if the blob's ETag matches this value",
  argument: "STRING"
};
var ifNoneMatchOption = {
  name: "if-none-match",
  shorthand: null,
  type: String,
  deprecated: false,
  description: "Only return content if the blob's ETag does not match this value (returns 304 if unchanged)",
  argument: "STRING"
};
var accessOption = {
  name: "access",
  shorthand: "a",
  type: String,
  deprecated: false,
  description: "Access level for the blob: public or private (default: public)",
  argument: "String",
  choices: ["public", "private"]
};
var listSubcommand13 = {
  name: "list",
  aliases: ["ls"],
  description: "List all files in the Blob store",
  arguments: [],
  options: [
    {
      name: "limit",
      shorthand: "l",
      type: Number,
      deprecated: false,
      description: "Number of results to return per page (default: 10, max: 1000)",
      argument: "NUMBER"
    },
    {
      name: "cursor",
      shorthand: "c",
      type: String,
      deprecated: false,
      description: "Cursor from previous page to start listing from",
      argument: "STRING"
    },
    {
      name: "prefix",
      shorthand: "p",
      type: String,
      deprecated: false,
      description: "Prefix to filter Blobs by",
      argument: "STRING"
    },
    {
      name: "mode",
      shorthand: "m",
      type: String,
      deprecated: false,
      description: "Mode to filter Blobs by either folded or expanded (default: expanded)",
      argument: "String",
      choices: ["folded", "expanded"]
    }
  ],
  examples: []
};
var putSubcommand = {
  name: "put",
  aliases: [],
  description: "Upload a file to the Blob store",
  arguments: [
    {
      name: "pathToFile",
      required: true
    }
  ],
  options: [
    accessOption,
    {
      name: "add-random-suffix",
      shorthand: "r",
      type: Boolean,
      deprecated: false,
      description: "Add a random suffix to the file name (default: false)",
      argument: "Boolean"
    },
    {
      name: "pathname",
      shorthand: "p",
      type: String,
      deprecated: false,
      description: "Pathname to upload the file to (default: filename)",
      argument: "String"
    },
    {
      name: "multipart",
      shorthand: "u",
      type: Boolean,
      deprecated: false,
      description: "If true upload the file in multiple small chunks for performance and reliability (default: true)",
      argument: "Boolean"
    },
    {
      name: "content-type",
      shorthand: "t",
      type: String,
      deprecated: false,
      description: "Overwrite the content-type. Will be inferred from the file extension if not provided",
      argument: "String"
    },
    {
      name: "cache-control-max-age",
      shorthand: "c",
      type: Number,
      deprecated: false,
      description: "Max-age of the cache-control header directive (default: 2592000 = 30 days)",
      argument: "Number"
    },
    {
      name: "allow-overwrite",
      shorthand: null,
      type: Boolean,
      deprecated: false,
      description: "Overwrite the file if it already exists (default: false)",
      argument: "Boolean"
    },
    {
      name: "force",
      shorthand: "f",
      type: Boolean,
      deprecated: true,
      description: "Overwrite the file if it already exists (deprecated, use --allow-overwrite)",
      argument: "Boolean"
    },
    ifMatchOption
  ],
  examples: []
};
var delSubcommand = {
  name: "del",
  aliases: [],
  description: "Delete a file from the Blob store",
  arguments: [
    {
      name: "urlsOrPathnames",
      required: true
    }
  ],
  options: [ifMatchOption],
  examples: []
};
var copySubcommand = {
  name: "copy",
  aliases: ["cp"],
  description: "Copy a file in the Blob store",
  arguments: [
    {
      name: "fromUrlOrPathname",
      required: true
    },
    {
      name: "toPathname",
      required: true
    }
  ],
  options: [
    accessOption,
    {
      name: "add-random-suffix",
      shorthand: "r",
      type: Boolean,
      deprecated: false,
      description: "Add a random suffix to the file name",
      argument: "Boolean"
    },
    {
      name: "content-type",
      shorthand: "t",
      type: String,
      deprecated: false,
      description: "Overwrite the content-type. Will be inferred from the file extension if not provided",
      argument: "String"
    },
    {
      name: "cache-control-max-age",
      shorthand: "c",
      type: Number,
      deprecated: false,
      description: "Max-age of the cache-control header directive (default: 2592000 = 30 days)",
      argument: "Number"
    },
    ifMatchOption
  ],
  examples: []
};
var getSubcommand = {
  name: "get",
  aliases: [],
  description: "Download a blob by URL or pathname",
  arguments: [
    {
      name: "urlOrPathname",
      required: true
    }
  ],
  options: [
    accessOption,
    {
      name: "output",
      shorthand: "o",
      type: String,
      deprecated: false,
      description: "Save blob content to a file instead of stdout",
      argument: "PATH"
    },
    ifNoneMatchOption
  ],
  examples: []
};
var addStoreSubcommand = {
  name: "add",
  aliases: [],
  description: "Add a new Blob store",
  arguments: [
    {
      name: "name",
      required: false
    }
  ],
  options: [
    accessOption,
    {
      name: "region",
      shorthand: "r",
      type: String,
      deprecated: false,
      description: 'Region to create the Blob store in (default: "iad1"). See https://vercel.com/docs/edge-network/regions#region-list for all available regions',
      argument: "STRING"
    }
  ],
  examples: [
    {
      name: 'Create a blob store (uses default region "iad1")',
      value: "vercel blob store add my-store"
    },
    {
      name: "Create a blob store in a specific region",
      value: "vercel blob store add my-store --region cdg1"
    },
    {
      name: "Create a private blob store",
      value: "vercel blob store add my-private-store --access private"
    }
  ]
};
var removeStoreSubcommand = {
  name: "remove",
  aliases: ["rm"],
  description: "Remove a Blob store",
  arguments: [
    {
      name: "storeId",
      required: false
    }
  ],
  options: [],
  examples: []
};
var getStoreSubcommand = {
  name: "get",
  aliases: [],
  description: "Get a Blob store",
  arguments: [
    {
      name: "storeId",
      required: false
    }
  ],
  options: [],
  examples: []
};
var createStoreSubcommand = {
  name: "create-store",
  aliases: [],
  description: "Create a new Blob store",
  arguments: [
    {
      name: "name",
      required: false
    }
  ],
  options: [
    accessOption,
    {
      name: "region",
      shorthand: "r",
      type: String,
      deprecated: false,
      description: 'Region to create the Blob store in (default: "iad1"). See https://vercel.com/docs/edge-network/regions#region-list for all available regions',
      argument: "STRING"
    }
  ],
  examples: [
    {
      name: 'Create a blob store (uses default region "iad1")',
      value: "vercel blob create-store my-store"
    },
    {
      name: "Create a blob store in a specific region",
      value: "vercel blob create-store my-store --region cdg1"
    },
    {
      name: "Create a private blob store",
      value: "vercel blob create-store my-private-store --access private"
    }
  ]
};
var deleteStoreSubcommand = {
  name: "delete-store",
  aliases: [],
  description: "Delete a Blob store",
  arguments: [
    {
      name: "storeId",
      required: false
    }
  ],
  options: [],
  examples: []
};
var getStoreInfoSubcommand = {
  name: "get-store",
  aliases: [],
  description: "Get a Blob store",
  arguments: [
    {
      name: "storeId",
      required: false
    }
  ],
  options: [],
  examples: []
};
var storeSubcommand = {
  name: "store",
  aliases: [],
  description: "Manage or create a Blob store",
  arguments: [],
  subcommands: [addStoreSubcommand, removeStoreSubcommand, getStoreSubcommand],
  options: [],
  examples: []
};
var blobCommand = {
  name: "blob",
  aliases: [],
  description: "Interact with Vercel Blob",
  arguments: [],
  subcommands: [
    listSubcommand13,
    putSubcommand,
    getSubcommand,
    delSubcommand,
    copySubcommand,
    createStoreSubcommand,
    deleteStoreSubcommand,
    getStoreInfoSubcommand,
    storeSubcommand
  ],
  options: [
    {
      name: "rw-token",
      shorthand: null,
      type: String,
      deprecated: false,
      description: "Read_Write_Token for the Blob store",
      argument: "String"
    }
  ],
  examples: []
};

// src/commands/webhooks/command.ts
var listSubcommand14 = {
  name: "list",
  aliases: ["ls"],
  description: "Show all webhooks",
  default: true,
  arguments: [],
  options: [formatOption],
  examples: [
    {
      name: "List all webhooks as JSON",
      value: `${packageName} webhooks ls --format json`
    }
  ]
};
var getSubcommand2 = {
  name: "get",
  aliases: ["inspect"],
  description: "Displays information related to a webhook",
  arguments: [
    {
      name: "id",
      required: true
    }
  ],
  options: [formatOption],
  examples: []
};
var createSubcommand2 = {
  name: "create",
  aliases: ["add"],
  description: "Create a new webhook",
  arguments: [
    {
      name: "url",
      required: true
    }
  ],
  options: [
    {
      name: "event",
      shorthand: "e",
      type: [String],
      argument: "EVENT",
      deprecated: false,
      description: "Webhook event to subscribe to (can be used multiple times)"
    },
    {
      name: "project",
      shorthand: "p",
      type: [String],
      argument: "PROJECT_ID",
      deprecated: false,
      description: "Project ID to associate with the webhook (can be used multiple times)"
    }
  ],
  examples: [
    {
      name: "Create a webhook for deployment events",
      value: `${packageName} webhooks create https://example.com/webhook --event deployment.created --event deployment.ready`
    }
  ]
};
var removeSubcommand10 = {
  name: "remove",
  aliases: ["rm", "delete"],
  description: "Remove a webhook",
  arguments: [
    {
      name: "id",
      required: true
    }
  ],
  options: [
    {
      ...yesOption,
      description: "Skip the confirmation prompt when removing a webhook"
    }
  ],
  examples: []
};
var webhooksCommand = {
  name: "webhooks",
  aliases: ["webhook"],
  description: "Manage webhooks",
  arguments: [],
  subcommands: [
    listSubcommand14,
    getSubcommand2,
    createSubcommand2,
    removeSubcommand10
  ],
  options: [],
  examples: []
};

// src/commands/index.ts
var commandsStructs = [
  agentCommand,
  alertsCommand,
  aliasCommand,
  activityCommand,
  apiCommand,
  blobCommand,
  bisectCommand,
  buildCommand,
  buyCommand,
  cacheCommand,
  certsCommand,
  contractCommand,
  cronsCommand,
  curlCommand,
  deployCommand,
  devCommand,
  dnsCommand,
  domainsCommand,
  envCommand,
  flagsCommand,
  gitCommand,
  httpstatCommand,
  initCommand,
  inspectCommand,
  installCommand,
  integrationCommand,
  integrationResourceCommand,
  linkCommand,
  listCommand,
  loginCommand,
  logoutCommand,
  logsCommand,
  mcpCommand,
  microfrontendsCommand,
  openCommand,
  projectCommand,
  promoteCommand,
  pullCommand,
  redeployCommand,
  redirectsCommand,
  removeCommand,
  routesCommand,
  rollbackCommand,
  rollingReleaseCommand,
  skillsCommand,
  targetCommand,
  teamsCommand,
  telemetryCommand,
  upgradeCommand,
  webhooksCommand,
  usageCommand,
  whoamiCommand,
  // added because we don't have a full help command
  { name: "help", aliases: [] }
];
if (process.env.FF_GUIDANCE_MODE) {
  commandsStructs.push(guidanceCommand);
}
if (process.env.FF_METRICS) {
  commandsStructs.push(metricsCommand);
}
function getCommandAliases(command) {
  return [command.name].concat(command.aliases);
}
var commands = /* @__PURE__ */ new Map();
for (const command of commandsStructs) {
  const aliases = getCommandAliases(command);
  output_manager_default.debug(
    `Registering command ${command.name} with aliases: ${JSON.stringify(aliases)}`
  );
  for (const alias of aliases) {
    output_manager_default.debug(`Setting alias ${alias} -> ${command.name}`);
    commands.set(alias, command.name);
  }
}
output_manager_default.debug(
  `All registered commands: ${JSON.stringify(Array.from(commands.entries()))}`
);
var commandNames = Array.from(commands.keys());

export {
  agentCommand,
  setSubcommand,
  listSubcommand,
  removeSubcommand,
  aliasCommand,
  listSubcommand2,
  apiCommand,
  bisectCommand,
  SUPPORTED_CREDIT_TYPES,
  CREDIT_TYPE_LABELS,
  creditsSubcommand,
  SUPPORTED_ADDON_ALIASES,
  ADDON_LABELS,
  addonSubcommand,
  proSubcommand,
  v0Subcommand,
  domainSubcommand,
  buyCommand,
  purgeSubcommand,
  invalidateSubcommand,
  dangerouslyDeleteSubcommand,
  cacheCommand,
  removeSubcommand2,
  issueSubcommand,
  listSubcommand3,
  addSubcommand2 as addSubcommand,
  certsCommand,
  contractCommand,
  addSubcommand3 as addSubcommand2,
  listSubcommand4,
  runSubcommand,
  cronsCommand,
  curlCommand,
  deprecatedArchiveSplitTgz,
  initSubcommand,
  continueSubcommand,
  deployCommand,
  importSubcommand,
  listSubcommand5,
  addSubcommand4 as addSubcommand3,
  removeSubcommand3,
  dnsCommand,
  listSubcommand6,
  inspectSubcommand,
  addSubcommand5 as addSubcommand4,
  removeSubcommand4,
  buySubcommand,
  moveSubcommand,
  transferInSubcommand,
  domainsCommand,
  listSubcommand7,
  inspectSubcommand2,
  createSubcommand,
  openSubcommand,
  updateSubcommand,
  setSubcommand2,
  removeSubcommand5,
  archiveSubcommand,
  disableSubcommand,
  enableSubcommand,
  sdkKeysListSubcommand,
  sdkKeysAddSubcommand,
  sdkKeysRemoveSubcommand,
  sdkKeysSubcommand,
  prepareSubcommand,
  flagsCommand,
  connectSubcommand,
  disconnectSubcommand,
  gitCommand,
  statusSubcommand,
  enableSubcommand2,
  disableSubcommand2,
  guidanceCommand,
  httpstatCommand,
  initCommand,
  inspectCommand,
  addSubcommand6 as addSubcommand5,
  openSubcommand2,
  listSubcommand8,
  discoverSubcommand,
  balanceSubcommand,
  removeSubcommand6,
  guideSubcommand,
  integrationCommand,
  installCommand,
  removeSubcommand7,
  disconnectSubcommand2,
  createThresholdSubcommand,
  integrationResourceCommand,
  addSubcommand as addSubcommand6,
  linkCommand,
  loginCommand,
  logoutCommand,
  CommandTimeout,
  logsCommand,
  mcpCommand,
  createGroupSubcommand,
  addToGroupSubcommand,
  removeFromGroupSubcommand,
  deleteGroupSubcommand,
  pullSubcommand,
  inspectGroupSubcommand,
  microfrontendsCommand,
  openCommand,
  addSubcommand7,
  inspectSubcommand3,
  listSubcommand9,
  removeSubcommand8,
  tokenSubcommand,
  projectCommand,
  statusSubcommand2,
  promoteCommand,
  redeployCommand,
  listSubcommand10,
  listVersionsSubcommand,
  addSubcommand8,
  uploadSubcommand,
  removeSubcommand9,
  promoteSubcommand,
  restoreSubcommand,
  redirectsCommand,
  removeCommand,
  statusSubcommand3,
  rollbackCommand,
  configureSubcommand,
  startSubcommand,
  approveSubcommand,
  abortSubcommand,
  completeSubcommand,
  fetchSubcommand,
  rollingReleaseCommand,
  skillsCommand,
  listSubcommand11,
  targetCommand,
  addSubcommand9,
  listSubcommand12,
  switchSubcommand,
  inviteSubcommand,
  teamsCommand,
  statusSubcommand4,
  enableSubcommand3,
  flushSubcommand,
  disableSubcommand3,
  telemetryCommand,
  upgradeCommand,
  usageCommand,
  whoamiCommand,
  listSubcommand13,
  putSubcommand,
  delSubcommand,
  copySubcommand,
  getSubcommand,
  addStoreSubcommand,
  removeStoreSubcommand,
  getStoreSubcommand,
  createStoreSubcommand,
  deleteStoreSubcommand,
  getStoreInfoSubcommand,
  storeSubcommand,
  blobCommand,
  listSubcommand14,
  getSubcommand2,
  createSubcommand2,
  removeSubcommand10,
  webhooksCommand,
  getCommandAliases,
  commands,
  commandNames
};
