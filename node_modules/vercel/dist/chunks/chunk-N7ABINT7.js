import { createRequire as __createRequire } from 'node:module';
import { fileURLToPath as __fileURLToPath } from 'node:url';
import { dirname as __dirname_ } from 'node:path';
const require = __createRequire(import.meta.url);
const __filename = __fileURLToPath(import.meta.url);
const __dirname = __dirname_(__filename);
import {
  output_manager_default,
  require_dist
} from "./chunk-FDJURQMQ.js";
import {
  require_source
} from "./chunk-S7KYDPEM.js";
import {
  __commonJS,
  __esm,
  __export,
  __require,
  __toESM
} from "./chunk-TZ2YI2VH.js";

// ../../internals/get-package-json/dist/index.js
var require_dist2 = __commonJS({
  "../../internals/get-package-json/dist/index.js"(exports, module) {
    "use strict";
    var __create = Object.create;
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __getProtoOf = Object.getPrototypeOf;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __export2 = (target, all) => {
      for (var name in all)
        __defProp(target, name, { get: all[name], enumerable: true });
    };
    var __copyProps = (to, from, except, desc) => {
      if (from && typeof from === "object" || typeof from === "function") {
        for (let key of __getOwnPropNames(from))
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
      }
      return to;
    };
    var __toESM2 = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
      // If the importer is in node compatibility mode or this is not an ESM
      // file that has been converted to a CommonJS file using a Babel-
      // compatible transform (i.e. "__esModule" has not been set), then set
      // "default" to the CommonJS "module.exports" for node compatibility.
      isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
      mod
    ));
    var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
    var src_exports = {};
    __export2(src_exports, {
      getPackageJSON: () => getPackageJSON2
    });
    module.exports = __toCommonJS(src_exports);
    var import_fs = __toESM2(__require("fs"));
    var import_path = __toESM2(__require("path"));
    var import_url = __require("url");
    var cache = /* @__PURE__ */ new Map();
    function getPackageJSONPath(dir) {
      return import_path.default.join(dir, "package.json");
    }
    function captureCallerCallSite() {
      const _prepareStackTrace = Error.prepareStackTrace;
      let callSite;
      try {
        Error.prepareStackTrace = (_, stack) => stack;
        const callSites = new Error().stack;
        callSite = callSites[2];
      } finally {
        Error.prepareStackTrace = _prepareStackTrace;
      }
      return callSite;
    }
    function getPackageJSON2() {
      const callSite = captureCallerCallSite();
      let filePath = callSite.getFileName() || callSite.getEvalOrigin();
      if (filePath.startsWith("file://")) {
        filePath = (0, import_url.fileURLToPath)(filePath);
      }
      let rootDir = import_path.default.dirname(filePath);
      let packageJSONPath = getPackageJSONPath(rootDir);
      while (!import_fs.default.existsSync(packageJSONPath)) {
        rootDir = import_path.default.join(rootDir, "..");
        packageJSONPath = getPackageJSONPath(rootDir);
      }
      let packageJSON = cache.get(packageJSONPath);
      if (!packageJSON) {
        packageJSON = JSON.parse(import_fs.default.readFileSync(packageJSONPath, "utf-8"));
        cache.set(packageJSONPath, packageJSON);
      }
      return packageJSON;
    }
  }
});

// src/util/pkg.ts
var pkg_exports = {};
__export(pkg_exports, {
  default: () => pkg_default
});
var import_get_package_json, pkg_default;
var init_pkg = __esm({
  "src/util/pkg.ts"() {
    "use strict";
    import_get_package_json = __toESM(require_dist2(), 1);
    pkg_default = (0, import_get_package_json.getPackageJSON)();
  }
});

// ../../node_modules/.pnpm/title@3.4.1/node_modules/title/lib/lower-case.js
var require_lower_case = __commonJS({
  "../../node_modules/.pnpm/title@3.4.1/node_modules/title/lib/lower-case.js"(exports, module) {
    var conjunctions = [
      "for",
      "and",
      "nor",
      "but",
      "or",
      "yet",
      "so"
    ];
    var articles = [
      "a",
      "an",
      "the"
    ];
    var prepositions = [
      "aboard",
      "about",
      "above",
      "across",
      "after",
      "against",
      "along",
      "amid",
      "among",
      "anti",
      "around",
      "as",
      "at",
      "before",
      "behind",
      "below",
      "beneath",
      "beside",
      "besides",
      "between",
      "beyond",
      "but",
      "by",
      "concerning",
      "considering",
      "despite",
      "down",
      "during",
      "except",
      "excepting",
      "excluding",
      "following",
      "for",
      "from",
      "in",
      "inside",
      "into",
      "like",
      "minus",
      "near",
      "of",
      "off",
      "on",
      "onto",
      "opposite",
      "over",
      "past",
      "per",
      "plus",
      "regarding",
      "round",
      "save",
      "since",
      "than",
      "through",
      "to",
      "toward",
      "towards",
      "under",
      "underneath",
      "unlike",
      "until",
      "up",
      "upon",
      "versus",
      "via",
      "with",
      "within",
      "without"
    ];
    module.exports = /* @__PURE__ */ new Set([
      ...conjunctions,
      ...articles,
      ...prepositions
    ]);
  }
});

// ../../node_modules/.pnpm/title@3.4.1/node_modules/title/lib/specials.js
var require_specials = __commonJS({
  "../../node_modules/.pnpm/title@3.4.1/node_modules/title/lib/specials.js"(exports, module) {
    var intended = [
      "ZEIT",
      "ZEIT Inc.",
      "CLI",
      "API",
      "HTTP",
      "HTTPS",
      "JSX",
      "DNS",
      "URL",
      "now.sh",
      "now.json",
      "CI",
      "CDN",
      "package.json",
      "GitHub",
      "CSS",
      "JS",
      "HTML",
      "WordPress",
      "JavaScript",
      "Next.js",
      "Node.js"
    ];
    module.exports = intended;
  }
});

// ../../node_modules/.pnpm/title@3.4.1/node_modules/title/lib/index.js
var require_lib = __commonJS({
  "../../node_modules/.pnpm/title@3.4.1/node_modules/title/lib/index.js"(exports, module) {
    var lowerCase = require_lower_case();
    var specials = require_specials();
    var regex = /(?:(?:(\s?(?:^|[.\(\)!?;:"-])\s*)(\w))|(\w))(\w*[’']*\w*)/g;
    var convertToRegExp = (specials2) => specials2.map((s) => [new RegExp(`\\b${s}\\b`, "gi"), s]);
    function parseMatch(match) {
      const firstCharacter = match[0];
      if (/\s/.test(firstCharacter)) {
        return match.substr(1);
      }
      if (/[\(\)]/.test(firstCharacter)) {
        return null;
      }
      return match;
    }
    module.exports = (str, options = {}) => {
      str = str.toLowerCase().replace(regex, (m, lead = "", forced, lower, rest) => {
        const parsedMatch = parseMatch(m);
        if (!parsedMatch) {
          return m;
        }
        if (!forced) {
          const fullLower = lower + rest;
          if (lowerCase.has(fullLower)) {
            return parsedMatch;
          }
        }
        return lead + (lower || forced).toUpperCase() + rest;
      });
      const customSpecials = options.special || [];
      const replace = [...specials, ...customSpecials];
      const replaceRegExp = convertToRegExp(replace);
      replaceRegExp.forEach(([pattern, s]) => {
        str = str.replace(pattern, s);
      });
      return str;
    };
  }
});

// ../../node_modules/.pnpm/arg@5.0.0/node_modules/arg/index.js
var require_arg = __commonJS({
  "../../node_modules/.pnpm/arg@5.0.0/node_modules/arg/index.js"(exports, module) {
    var flagSymbol = Symbol("arg flag");
    var ArgError = class _ArgError extends Error {
      constructor(msg, code2) {
        super(msg);
        this.name = "ArgError";
        this.code = code2;
        Object.setPrototypeOf(this, _ArgError.prototype);
      }
    };
    function arg2(opts, { argv = process.argv.slice(2), permissive = false, stopAtPositional = false } = {}) {
      if (!opts) {
        throw new ArgError("argument specification object is required", "ARG_CONFIG_NO_SPEC");
      }
      const result = { _: [] };
      const aliases = {};
      const handlers = {};
      for (const key of Object.keys(opts)) {
        if (!key) {
          throw new ArgError("argument key cannot be an empty string", "ARG_CONFIG_EMPTY_KEY");
        }
        if (key[0] !== "-") {
          throw new ArgError(`argument key must start with '-' but found: '${key}'`, "ARG_CONFIG_NONOPT_KEY");
        }
        if (key.length === 1) {
          throw new ArgError(`argument key must have a name; singular '-' keys are not allowed: ${key}`, "ARG_CONFIG_NONAME_KEY");
        }
        if (typeof opts[key] === "string") {
          aliases[key] = opts[key];
          continue;
        }
        let type = opts[key];
        let isFlag = false;
        if (Array.isArray(type) && type.length === 1 && typeof type[0] === "function") {
          const [fn] = type;
          type = (value, name, prev = []) => {
            prev.push(fn(value, name, prev[prev.length - 1]));
            return prev;
          };
          isFlag = fn === Boolean || fn[flagSymbol] === true;
        } else if (typeof type === "function") {
          isFlag = type === Boolean || type[flagSymbol] === true;
        } else {
          throw new ArgError(`type missing or not a function or valid array type: ${key}`, "ARG_CONFIG_VAD_TYPE");
        }
        if (key[1] !== "-" && key.length > 2) {
          throw new ArgError(`short argument keys (with a single hyphen) must have only one character: ${key}`, "ARG_CONFIG_SHORTOPT_TOOLONG");
        }
        handlers[key] = [type, isFlag];
      }
      for (let i = 0, len = argv.length; i < len; i++) {
        const wholeArg = argv[i];
        if (stopAtPositional && result._.length > 0) {
          result._ = result._.concat(argv.slice(i));
          break;
        }
        if (wholeArg === "--") {
          result._ = result._.concat(argv.slice(i + 1));
          break;
        }
        if (wholeArg.length > 1 && wholeArg[0] === "-") {
          const separatedArguments = wholeArg[1] === "-" || wholeArg.length === 2 ? [wholeArg] : wholeArg.slice(1).split("").map((a) => `-${a}`);
          for (let j = 0; j < separatedArguments.length; j++) {
            const arg3 = separatedArguments[j];
            const [originalArgName, argStr] = arg3[1] === "-" ? arg3.split(/=(.*)/, 2) : [arg3, void 0];
            let argName = originalArgName;
            while (argName in aliases) {
              argName = aliases[argName];
            }
            if (!(argName in handlers)) {
              if (permissive) {
                result._.push(arg3);
                continue;
              } else {
                throw new ArgError(`unknown or unexpected option: ${originalArgName}`, "ARG_UNKNOWN_OPTION");
              }
            }
            const [type, isFlag] = handlers[argName];
            if (!isFlag && j + 1 < separatedArguments.length) {
              throw new ArgError(`option requires argument (but was followed by another short argument): ${originalArgName}`, "ARG_MISSING_REQUIRED_SHORTARG");
            }
            if (isFlag) {
              result[argName] = type(true, argName, result[argName]);
            } else if (argStr === void 0) {
              if (argv.length < i + 2 || argv[i + 1].length > 1 && argv[i + 1][0] === "-" && !(argv[i + 1].match(/^-?\d*(\.(?=\d))?\d*$/) && (type === Number || // eslint-disable-next-line no-undef
              typeof BigInt !== "undefined" && type === BigInt))) {
                const extended = originalArgName === argName ? "" : ` (alias for ${argName})`;
                throw new ArgError(`option requires argument: ${originalArgName}${extended}`, "ARG_MISSING_REQUIRED_LONGARG");
              }
              result[argName] = type(argv[i + 1], argName, result[argName]);
              ++i;
            } else {
              result[argName] = type(argStr, argName, result[argName]);
            }
          }
        } else {
          result._.push(wholeArg);
        }
      }
      return result;
    }
    arg2.flag = (fn) => {
      fn[flagSymbol] = true;
      return fn;
    };
    arg2.COUNT = arg2.flag((v, name, existingCount) => (existingCount || 0) + 1);
    arg2.ArgError = ArgError;
    module.exports = arg2;
  }
});

// ../../node_modules/.pnpm/bytes@3.0.0/node_modules/bytes/index.js
var require_bytes = __commonJS({
  "../../node_modules/.pnpm/bytes@3.0.0/node_modules/bytes/index.js"(exports, module) {
    "use strict";
    module.exports = bytes3;
    module.exports.format = format;
    module.exports.parse = parse;
    var formatThousandsRegExp = /\B(?=(\d{3})+(?!\d))/g;
    var formatDecimalsRegExp = /(?:\.0*|(\.[^0]+)0+)$/;
    var map = {
      b: 1,
      kb: 1 << 10,
      mb: 1 << 20,
      gb: 1 << 30,
      tb: (1 << 30) * 1024
    };
    var parseRegExp = /^((-|\+)?(\d+(?:\.\d+)?)) *(kb|mb|gb|tb)$/i;
    function bytes3(value, options) {
      if (typeof value === "string") {
        return parse(value);
      }
      if (typeof value === "number") {
        return format(value, options);
      }
      return null;
    }
    function format(value, options) {
      if (!Number.isFinite(value)) {
        return null;
      }
      var mag = Math.abs(value);
      var thousandsSeparator = options && options.thousandsSeparator || "";
      var unitSeparator = options && options.unitSeparator || "";
      var decimalPlaces = options && options.decimalPlaces !== void 0 ? options.decimalPlaces : 2;
      var fixedDecimals = Boolean(options && options.fixedDecimals);
      var unit = options && options.unit || "";
      if (!unit || !map[unit.toLowerCase()]) {
        if (mag >= map.tb) {
          unit = "TB";
        } else if (mag >= map.gb) {
          unit = "GB";
        } else if (mag >= map.mb) {
          unit = "MB";
        } else if (mag >= map.kb) {
          unit = "KB";
        } else {
          unit = "B";
        }
      }
      var val = value / map[unit.toLowerCase()];
      var str = val.toFixed(decimalPlaces);
      if (!fixedDecimals) {
        str = str.replace(formatDecimalsRegExp, "$1");
      }
      if (thousandsSeparator) {
        str = str.replace(formatThousandsRegExp, thousandsSeparator);
      }
      return str + unitSeparator + unit;
    }
    function parse(val) {
      if (typeof val === "number" && !isNaN(val)) {
        return val;
      }
      if (typeof val !== "string") {
        return null;
      }
      var results = parseRegExp.exec(val);
      var floatValue;
      var unit = "b";
      if (!results) {
        floatValue = parseInt(val, 10);
        unit = "b";
      } else {
        floatValue = parseFloat(results[1]);
        unit = results[4].toLowerCase();
      }
      return Math.floor(map[unit] * floatValue);
    }
  }
});

// ../../node_modules/.pnpm/ansi-regex@5.0.1/node_modules/ansi-regex/index.js
var require_ansi_regex = __commonJS({
  "../../node_modules/.pnpm/ansi-regex@5.0.1/node_modules/ansi-regex/index.js"(exports, module) {
    "use strict";
    module.exports = ({ onlyFirst = false } = {}) => {
      const pattern = [
        "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
        "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))"
      ].join("|");
      return new RegExp(pattern, onlyFirst ? void 0 : "g");
    };
  }
});

// ../../node_modules/.pnpm/strip-ansi@6.0.1/node_modules/strip-ansi/index.js
var require_strip_ansi = __commonJS({
  "../../node_modules/.pnpm/strip-ansi@6.0.1/node_modules/strip-ansi/index.js"(exports, module) {
    "use strict";
    var ansiRegex = require_ansi_regex();
    module.exports = (string) => typeof string === "string" ? string.replace(ansiRegex(), "") : string;
  }
});

// ../../node_modules/.pnpm/is-fullwidth-code-point@3.0.0/node_modules/is-fullwidth-code-point/index.js
var require_is_fullwidth_code_point = __commonJS({
  "../../node_modules/.pnpm/is-fullwidth-code-point@3.0.0/node_modules/is-fullwidth-code-point/index.js"(exports, module) {
    "use strict";
    var isFullwidthCodePoint = (codePoint) => {
      if (Number.isNaN(codePoint)) {
        return false;
      }
      if (codePoint >= 4352 && (codePoint <= 4447 || // Hangul Jamo
      codePoint === 9001 || // LEFT-POINTING ANGLE BRACKET
      codePoint === 9002 || // RIGHT-POINTING ANGLE BRACKET
      // CJK Radicals Supplement .. Enclosed CJK Letters and Months
      11904 <= codePoint && codePoint <= 12871 && codePoint !== 12351 || // Enclosed CJK Letters and Months .. CJK Unified Ideographs Extension A
      12880 <= codePoint && codePoint <= 19903 || // CJK Unified Ideographs .. Yi Radicals
      19968 <= codePoint && codePoint <= 42182 || // Hangul Jamo Extended-A
      43360 <= codePoint && codePoint <= 43388 || // Hangul Syllables
      44032 <= codePoint && codePoint <= 55203 || // CJK Compatibility Ideographs
      63744 <= codePoint && codePoint <= 64255 || // Vertical Forms
      65040 <= codePoint && codePoint <= 65049 || // CJK Compatibility Forms .. Small Form Variants
      65072 <= codePoint && codePoint <= 65131 || // Halfwidth and Fullwidth Forms
      65281 <= codePoint && codePoint <= 65376 || 65504 <= codePoint && codePoint <= 65510 || // Kana Supplement
      110592 <= codePoint && codePoint <= 110593 || // Enclosed Ideographic Supplement
      127488 <= codePoint && codePoint <= 127569 || // CJK Unified Ideographs Extension B .. Tertiary Ideographic Plane
      131072 <= codePoint && codePoint <= 262141)) {
        return true;
      }
      return false;
    };
    module.exports = isFullwidthCodePoint;
    module.exports.default = isFullwidthCodePoint;
  }
});

// ../../node_modules/.pnpm/emoji-regex@8.0.0/node_modules/emoji-regex/index.js
var require_emoji_regex = __commonJS({
  "../../node_modules/.pnpm/emoji-regex@8.0.0/node_modules/emoji-regex/index.js"(exports, module) {
    "use strict";
    module.exports = function() {
      return /\uD83C\uDFF4\uDB40\uDC67\uDB40\uDC62(?:\uDB40\uDC65\uDB40\uDC6E\uDB40\uDC67|\uDB40\uDC73\uDB40\uDC63\uDB40\uDC74|\uDB40\uDC77\uDB40\uDC6C\uDB40\uDC73)\uDB40\uDC7F|\uD83D\uDC68(?:\uD83C\uDFFC\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68\uD83C\uDFFB|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFE])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFE\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFD])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFC])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D)?\uD83D\uDC68|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|(?:\uD83D[\uDC68\uDC69])\u200D(?:\uD83D[\uDC66\uDC67])|[\u2695\u2696\u2708]\uFE0F|\uD83D[\uDC66\uDC67]|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|(?:\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708])\uFE0F|\uD83C\uDFFB\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C[\uDFFB-\uDFFF])|(?:\uD83E\uDDD1\uD83C\uDFFB\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFC\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)\uD83C\uDFFB|\uD83E\uDDD1(?:\uD83C\uDFFF\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])|\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1)|(?:\uD83E\uDDD1\uD83C\uDFFE\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFF\u200D\uD83E\uDD1D\u200D(?:\uD83D[\uDC68\uDC69]))(?:\uD83C[\uDFFB-\uDFFE])|(?:\uD83E\uDDD1\uD83C\uDFFC\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFD\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)(?:\uD83C[\uDFFB\uDFFC])|\uD83D\uDC69(?:\uD83C\uDFFE\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB-\uDFFD\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFC\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFD-\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFB\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFC-\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFD\u200D(?:\uD83E\uDD1D\u200D\uD83D\uDC68(?:\uD83C[\uDFFB\uDFFC\uDFFE\uDFFF])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\u200D(?:\u2764\uFE0F\u200D(?:\uD83D\uDC8B\u200D(?:\uD83D[\uDC68\uDC69])|\uD83D[\uDC68\uDC69])|\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD])|\uD83C\uDFFF\u200D(?:\uD83C[\uDF3E\uDF73\uDF93\uDFA4\uDFA8\uDFEB\uDFED]|\uD83D[\uDCBB\uDCBC\uDD27\uDD2C\uDE80\uDE92]|\uD83E[\uDDAF-\uDDB3\uDDBC\uDDBD]))|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67]))|(?:\uD83E\uDDD1\uD83C\uDFFD\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1|\uD83D\uDC69\uD83C\uDFFE\u200D\uD83E\uDD1D\u200D\uD83D\uDC69)(?:\uD83C[\uDFFB-\uDFFD])|\uD83D\uDC69\u200D\uD83D\uDC66\u200D\uD83D\uDC66|\uD83D\uDC69\u200D\uD83D\uDC69\u200D(?:\uD83D[\uDC66\uDC67])|(?:\uD83D\uDC41\uFE0F\u200D\uD83D\uDDE8|\uD83D\uDC69(?:\uD83C\uDFFF\u200D[\u2695\u2696\u2708]|\uD83C\uDFFE\u200D[\u2695\u2696\u2708]|\uD83C\uDFFC\u200D[\u2695\u2696\u2708]|\uD83C\uDFFB\u200D[\u2695\u2696\u2708]|\uD83C\uDFFD\u200D[\u2695\u2696\u2708]|\u200D[\u2695\u2696\u2708])|(?:(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)\uFE0F|\uD83D\uDC6F|\uD83E[\uDD3C\uDDDE\uDDDF])\u200D[\u2640\u2642]|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD6-\uDDDD])(?:(?:\uD83C[\uDFFB-\uDFFF])\u200D[\u2640\u2642]|\u200D[\u2640\u2642])|\uD83C\uDFF4\u200D\u2620)\uFE0F|\uD83D\uDC69\u200D\uD83D\uDC67\u200D(?:\uD83D[\uDC66\uDC67])|\uD83C\uDFF3\uFE0F\u200D\uD83C\uDF08|\uD83D\uDC15\u200D\uD83E\uDDBA|\uD83D\uDC69\u200D\uD83D\uDC66|\uD83D\uDC69\u200D\uD83D\uDC67|\uD83C\uDDFD\uD83C\uDDF0|\uD83C\uDDF4\uD83C\uDDF2|\uD83C\uDDF6\uD83C\uDDE6|[#\*0-9]\uFE0F\u20E3|\uD83C\uDDE7(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEF\uDDF1-\uDDF4\uDDF6-\uDDF9\uDDFB\uDDFC\uDDFE\uDDFF])|\uD83C\uDDF9(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDED\uDDEF-\uDDF4\uDDF7\uDDF9\uDDFB\uDDFC\uDDFF])|\uD83C\uDDEA(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDED\uDDF7-\uDDFA])|\uD83E\uDDD1(?:\uD83C[\uDFFB-\uDFFF])|\uD83C\uDDF7(?:\uD83C[\uDDEA\uDDF4\uDDF8\uDDFA\uDDFC])|\uD83D\uDC69(?:\uD83C[\uDFFB-\uDFFF])|\uD83C\uDDF2(?:\uD83C[\uDDE6\uDDE8-\uDDED\uDDF0-\uDDFF])|\uD83C\uDDE6(?:\uD83C[\uDDE8-\uDDEC\uDDEE\uDDF1\uDDF2\uDDF4\uDDF6-\uDDFA\uDDFC\uDDFD\uDDFF])|\uD83C\uDDF0(?:\uD83C[\uDDEA\uDDEC-\uDDEE\uDDF2\uDDF3\uDDF5\uDDF7\uDDFC\uDDFE\uDDFF])|\uD83C\uDDED(?:\uD83C[\uDDF0\uDDF2\uDDF3\uDDF7\uDDF9\uDDFA])|\uD83C\uDDE9(?:\uD83C[\uDDEA\uDDEC\uDDEF\uDDF0\uDDF2\uDDF4\uDDFF])|\uD83C\uDDFE(?:\uD83C[\uDDEA\uDDF9])|\uD83C\uDDEC(?:\uD83C[\uDDE6\uDDE7\uDDE9-\uDDEE\uDDF1-\uDDF3\uDDF5-\uDDFA\uDDFC\uDDFE])|\uD83C\uDDF8(?:\uD83C[\uDDE6-\uDDEA\uDDEC-\uDDF4\uDDF7-\uDDF9\uDDFB\uDDFD-\uDDFF])|\uD83C\uDDEB(?:\uD83C[\uDDEE-\uDDF0\uDDF2\uDDF4\uDDF7])|\uD83C\uDDF5(?:\uD83C[\uDDE6\uDDEA-\uDDED\uDDF0-\uDDF3\uDDF7-\uDDF9\uDDFC\uDDFE])|\uD83C\uDDFB(?:\uD83C[\uDDE6\uDDE8\uDDEA\uDDEC\uDDEE\uDDF3\uDDFA])|\uD83C\uDDF3(?:\uD83C[\uDDE6\uDDE8\uDDEA-\uDDEC\uDDEE\uDDF1\uDDF4\uDDF5\uDDF7\uDDFA\uDDFF])|\uD83C\uDDE8(?:\uD83C[\uDDE6\uDDE8\uDDE9\uDDEB-\uDDEE\uDDF0-\uDDF5\uDDF7\uDDFA-\uDDFF])|\uD83C\uDDF1(?:\uD83C[\uDDE6-\uDDE8\uDDEE\uDDF0\uDDF7-\uDDFB\uDDFE])|\uD83C\uDDFF(?:\uD83C[\uDDE6\uDDF2\uDDFC])|\uD83C\uDDFC(?:\uD83C[\uDDEB\uDDF8])|\uD83C\uDDFA(?:\uD83C[\uDDE6\uDDEC\uDDF2\uDDF3\uDDF8\uDDFE\uDDFF])|\uD83C\uDDEE(?:\uD83C[\uDDE8-\uDDEA\uDDF1-\uDDF4\uDDF6-\uDDF9])|\uD83C\uDDEF(?:\uD83C[\uDDEA\uDDF2\uDDF4\uDDF5])|(?:\uD83C[\uDFC3\uDFC4\uDFCA]|\uD83D[\uDC6E\uDC71\uDC73\uDC77\uDC81\uDC82\uDC86\uDC87\uDE45-\uDE47\uDE4B\uDE4D\uDE4E\uDEA3\uDEB4-\uDEB6]|\uD83E[\uDD26\uDD37-\uDD39\uDD3D\uDD3E\uDDB8\uDDB9\uDDCD-\uDDCF\uDDD6-\uDDDD])(?:\uD83C[\uDFFB-\uDFFF])|(?:\u26F9|\uD83C[\uDFCB\uDFCC]|\uD83D\uDD75)(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u261D\u270A-\u270D]|\uD83C[\uDF85\uDFC2\uDFC7]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66\uDC67\uDC6B-\uDC6D\uDC70\uDC72\uDC74-\uDC76\uDC78\uDC7C\uDC83\uDC85\uDCAA\uDD74\uDD7A\uDD90\uDD95\uDD96\uDE4C\uDE4F\uDEC0\uDECC]|\uD83E[\uDD0F\uDD18-\uDD1C\uDD1E\uDD1F\uDD30-\uDD36\uDDB5\uDDB6\uDDBB\uDDD2-\uDDD5])(?:\uD83C[\uDFFB-\uDFFF])|(?:[\u231A\u231B\u23E9-\u23EC\u23F0\u23F3\u25FD\u25FE\u2614\u2615\u2648-\u2653\u267F\u2693\u26A1\u26AA\u26AB\u26BD\u26BE\u26C4\u26C5\u26CE\u26D4\u26EA\u26F2\u26F3\u26F5\u26FA\u26FD\u2705\u270A\u270B\u2728\u274C\u274E\u2753-\u2755\u2757\u2795-\u2797\u27B0\u27BF\u2B1B\u2B1C\u2B50\u2B55]|\uD83C[\uDC04\uDCCF\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE1A\uDE2F\uDE32-\uDE36\uDE38-\uDE3A\uDE50\uDE51\uDF00-\uDF20\uDF2D-\uDF35\uDF37-\uDF7C\uDF7E-\uDF93\uDFA0-\uDFCA\uDFCF-\uDFD3\uDFE0-\uDFF0\uDFF4\uDFF8-\uDFFF]|\uD83D[\uDC00-\uDC3E\uDC40\uDC42-\uDCFC\uDCFF-\uDD3D\uDD4B-\uDD4E\uDD50-\uDD67\uDD7A\uDD95\uDD96\uDDA4\uDDFB-\uDE4F\uDE80-\uDEC5\uDECC\uDED0-\uDED2\uDED5\uDEEB\uDEEC\uDEF4-\uDEFA\uDFE0-\uDFEB]|\uD83E[\uDD0D-\uDD3A\uDD3C-\uDD45\uDD47-\uDD71\uDD73-\uDD76\uDD7A-\uDDA2\uDDA5-\uDDAA\uDDAE-\uDDCA\uDDCD-\uDDFF\uDE70-\uDE73\uDE78-\uDE7A\uDE80-\uDE82\uDE90-\uDE95])|(?:[#\*0-9\xA9\xAE\u203C\u2049\u2122\u2139\u2194-\u2199\u21A9\u21AA\u231A\u231B\u2328\u23CF\u23E9-\u23F3\u23F8-\u23FA\u24C2\u25AA\u25AB\u25B6\u25C0\u25FB-\u25FE\u2600-\u2604\u260E\u2611\u2614\u2615\u2618\u261D\u2620\u2622\u2623\u2626\u262A\u262E\u262F\u2638-\u263A\u2640\u2642\u2648-\u2653\u265F\u2660\u2663\u2665\u2666\u2668\u267B\u267E\u267F\u2692-\u2697\u2699\u269B\u269C\u26A0\u26A1\u26AA\u26AB\u26B0\u26B1\u26BD\u26BE\u26C4\u26C5\u26C8\u26CE\u26CF\u26D1\u26D3\u26D4\u26E9\u26EA\u26F0-\u26F5\u26F7-\u26FA\u26FD\u2702\u2705\u2708-\u270D\u270F\u2712\u2714\u2716\u271D\u2721\u2728\u2733\u2734\u2744\u2747\u274C\u274E\u2753-\u2755\u2757\u2763\u2764\u2795-\u2797\u27A1\u27B0\u27BF\u2934\u2935\u2B05-\u2B07\u2B1B\u2B1C\u2B50\u2B55\u3030\u303D\u3297\u3299]|\uD83C[\uDC04\uDCCF\uDD70\uDD71\uDD7E\uDD7F\uDD8E\uDD91-\uDD9A\uDDE6-\uDDFF\uDE01\uDE02\uDE1A\uDE2F\uDE32-\uDE3A\uDE50\uDE51\uDF00-\uDF21\uDF24-\uDF93\uDF96\uDF97\uDF99-\uDF9B\uDF9E-\uDFF0\uDFF3-\uDFF5\uDFF7-\uDFFF]|\uD83D[\uDC00-\uDCFD\uDCFF-\uDD3D\uDD49-\uDD4E\uDD50-\uDD67\uDD6F\uDD70\uDD73-\uDD7A\uDD87\uDD8A-\uDD8D\uDD90\uDD95\uDD96\uDDA4\uDDA5\uDDA8\uDDB1\uDDB2\uDDBC\uDDC2-\uDDC4\uDDD1-\uDDD3\uDDDC-\uDDDE\uDDE1\uDDE3\uDDE8\uDDEF\uDDF3\uDDFA-\uDE4F\uDE80-\uDEC5\uDECB-\uDED2\uDED5\uDEE0-\uDEE5\uDEE9\uDEEB\uDEEC\uDEF0\uDEF3-\uDEFA\uDFE0-\uDFEB]|\uD83E[\uDD0D-\uDD3A\uDD3C-\uDD45\uDD47-\uDD71\uDD73-\uDD76\uDD7A-\uDDA2\uDDA5-\uDDAA\uDDAE-\uDDCA\uDDCD-\uDDFF\uDE70-\uDE73\uDE78-\uDE7A\uDE80-\uDE82\uDE90-\uDE95])\uFE0F|(?:[\u261D\u26F9\u270A-\u270D]|\uD83C[\uDF85\uDFC2-\uDFC4\uDFC7\uDFCA-\uDFCC]|\uD83D[\uDC42\uDC43\uDC46-\uDC50\uDC66-\uDC78\uDC7C\uDC81-\uDC83\uDC85-\uDC87\uDC8F\uDC91\uDCAA\uDD74\uDD75\uDD7A\uDD90\uDD95\uDD96\uDE45-\uDE47\uDE4B-\uDE4F\uDEA3\uDEB4-\uDEB6\uDEC0\uDECC]|\uD83E[\uDD0F\uDD18-\uDD1F\uDD26\uDD30-\uDD39\uDD3C-\uDD3E\uDDB5\uDDB6\uDDB8\uDDB9\uDDBB\uDDCD-\uDDCF\uDDD1-\uDDDD])/g;
    };
  }
});

// ../../node_modules/.pnpm/string-width@4.2.3/node_modules/string-width/index.js
var require_string_width = __commonJS({
  "../../node_modules/.pnpm/string-width@4.2.3/node_modules/string-width/index.js"(exports, module) {
    "use strict";
    var stripAnsi = require_strip_ansi();
    var isFullwidthCodePoint = require_is_fullwidth_code_point();
    var emojiRegex = require_emoji_regex();
    var stringWidth = (string) => {
      if (typeof string !== "string" || string.length === 0) {
        return 0;
      }
      string = stripAnsi(string);
      if (string.length === 0) {
        return 0;
      }
      string = string.replace(emojiRegex(), "  ");
      let width = 0;
      for (let i = 0; i < string.length; i++) {
        const code2 = string.codePointAt(i);
        if (code2 <= 31 || code2 >= 127 && code2 <= 159) {
          continue;
        }
        if (code2 >= 768 && code2 <= 879) {
          continue;
        }
        if (code2 > 65535) {
          i++;
        }
        width += isFullwidthCodePoint(code2) ? 2 : 1;
      }
      return width;
    };
    module.exports = stringWidth;
    module.exports.default = stringWidth;
  }
});

// src/util/output/cmd.ts
var import_chalk = __toESM(require_source(), 1);
function cmd(text) {
  return `${import_chalk.default.gray("`")}${import_chalk.default.cyan(text)}${import_chalk.default.gray("`")}`;
}

// src/util/pkg-name.ts
var import_title = __toESM(require_lib(), 1);
init_pkg();
var packageName = pkg_default.name;
function getTitleName() {
  const str = packageName;
  return (0, import_title.default)(str);
}
function getCommandName(subcommands) {
  let vercel = packageName;
  if (subcommands) {
    vercel = `${vercel} ${subcommands}`;
  }
  return cmd(vercel);
}
function getCommandNamePlain(subcommands) {
  return subcommands ? `${packageName} ${subcommands}` : packageName;
}

// src/util/get-flags-specification.ts
function getFlagsSpecification(options) {
  const flagsSpecification = {};
  for (const option of options) {
    flagsSpecification[`--${option.name}`] = option.type;
    if (option.shorthand) {
      flagsSpecification[`-${option.shorthand}`] = `--${option.name}`;
    }
  }
  return flagsSpecification;
}

// src/util/arg-common.ts
var globalCommandOptions = [
  {
    name: "help",
    shorthand: "h",
    type: Boolean,
    description: "Output usage information",
    deprecated: false
  },
  {
    name: "version",
    shorthand: "v",
    type: Boolean,
    description: "Output the version number",
    deprecated: false
  },
  {
    name: "cwd",
    shorthand: null,
    type: String,
    argument: "DIR",
    description: "Sets the current working directory for a single run of a command",
    deprecated: false
  },
  {
    name: "local-config",
    shorthand: "A",
    type: String,
    argument: "FILE",
    description: "Path to the local `vercel.json` file",
    deprecated: false
  },
  {
    name: "global-config",
    shorthand: "Q",
    type: String,
    argument: "DIR",
    description: "Path to the global `.vercel` directory",
    deprecated: false
  },
  {
    name: "debug",
    shorthand: "d",
    type: Boolean,
    description: "Debug mode (default off)",
    deprecated: false
  },
  {
    name: "no-color",
    shorthand: null,
    type: Boolean,
    description: "No color mode (default off)",
    deprecated: false
  },
  {
    name: "non-interactive",
    shorthand: null,
    type: Boolean,
    description: "Run without interactive prompts; when an agent is detected this is the default",
    deprecated: false
  },
  {
    name: "scope",
    shorthand: "S",
    type: String,
    description: "Set a custom scope",
    deprecated: false
  },
  {
    name: "token",
    shorthand: "t",
    type: String,
    argument: "TOKEN",
    description: "Login token",
    deprecated: false
  },
  { name: "team", shorthand: "T", type: String, deprecated: false },
  { name: "api", shorthand: null, type: String, deprecated: false }
];
var GLOBAL_CLI_FLAG_NAMES = (() => {
  const set = /* @__PURE__ */ new Set();
  for (const opt of globalCommandOptions) {
    set.add(`--${opt.name}`);
    if (opt.shorthand) {
      set.add(`-${opt.shorthand}`);
    }
  }
  return set;
})();
function globalCliFlagTakesValue(flagName) {
  const normalized = flagName.includes("=") ? flagName.slice(0, flagName.indexOf("=")) : flagName;
  for (const opt of globalCommandOptions) {
    if (`--${opt.name}` === normalized) {
      return opt.type === String;
    }
    if (opt.shorthand && `-${opt.shorthand}` === normalized) {
      return opt.type === String;
    }
  }
  return false;
}
var SUBCOMMAND_FLAG_TAKES_VALUE = /* @__PURE__ */ new Set([
  "--status",
  "--name",
  "--slug",
  "--version",
  // redirects list --version
  "--search",
  "--format",
  "--page",
  "--per-page"
]);
function suggestionFlagTakesSeparateValue(flagName) {
  const name = flagName.includes("=") ? flagName.slice(0, flagName.indexOf("=")) : flagName;
  if (globalCliFlagTakesValue(name))
    return true;
  return SUBCOMMAND_FLAG_TAKES_VALUE.has(name);
}
function getSameSubcommandSuggestionFlags(args) {
  const out = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (!a.startsWith("-"))
      continue;
    out.push(a);
    if (a.includes("="))
      continue;
    const name = a;
    if (suggestionFlagTakesSeparateValue(name) && i + 1 < args.length && !args[i + 1].startsWith("-")) {
      out.push(args[++i]);
    }
  }
  return out;
}
var GLOBAL_OPTIONS = getFlagsSpecification(globalCommandOptions);
var arg_common_default = () => GLOBAL_OPTIONS;
var yesOption = {
  name: "yes",
  shorthand: "y",
  type: Boolean,
  deprecated: false,
  description: "Accept default value for all prompts"
};
var nextOption = {
  name: "next",
  shorthand: "N",
  type: Number,
  deprecated: false,
  description: "Show next page of results",
  argument: "MS"
};
var confirmOption = {
  name: "confirm",
  shorthand: "c",
  type: Boolean,
  deprecated: true
};
var limitOption = {
  name: "limit",
  shorthand: null,
  type: Number,
  deprecated: false,
  description: "Number of results to return per page (default: 20, max: 100)",
  argument: "NUMBER"
};
var forceOption = {
  name: "force",
  shorthand: "f",
  type: Boolean,
  deprecated: false
};
var formatOption = {
  name: "format",
  shorthand: "F",
  type: String,
  argument: "FORMAT",
  description: "Specify the output format (json)",
  deprecated: false
};
var jsonOption = {
  name: "json",
  shorthand: null,
  type: Boolean,
  deprecated: true,
  description: "DEPRECATED: Use --format=json instead"
};
var allOption = {
  name: "all",
  shorthand: "a",
  type: Boolean,
  deprecated: false,
  description: "List resources across all projects"
};
var GLOBAL_LONG_TO_OPT = /* @__PURE__ */ new Map();
var GLOBAL_SHORT_TO_OPT = /* @__PURE__ */ new Map();
for (const opt of globalCommandOptions) {
  GLOBAL_LONG_TO_OPT.set(`--${opt.name}`, opt);
  if (opt.shorthand) {
    GLOBAL_SHORT_TO_OPT.set(`-${opt.shorthand}`, opt);
  }
}
function getGlobalFlagsOnlyFromArgs(args) {
  const out = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    let opt;
    if (a.startsWith("--") && a.includes("=")) {
      const name = a.slice(2).split("=")[0];
      opt = GLOBAL_LONG_TO_OPT.get(`--${name}`);
      if (opt)
        out.push(a);
      continue;
    }
    opt = GLOBAL_LONG_TO_OPT.get(a) || GLOBAL_SHORT_TO_OPT.get(a);
    if (!opt)
      continue;
    out.push(a);
    if (opt.type === String && !a.includes("=")) {
      const next = args[i + 1];
      if (next && !next.startsWith("-")) {
        out.push(next);
        i++;
      }
    }
  }
  return out;
}
function getCommandNameWithGlobalFlags(commandTemplate, argv) {
  const flags = getGlobalFlagsOnlyFromArgs(argv.slice(2));
  return getCommandNamePlain(`${commandTemplate} ${flags.join(" ")}`.trim());
}

// src/util/get-args.ts
var import_arg = __toESM(require_arg(), 1);
function getArgs(argv, argsOptions, argOptions = {}) {
  return (0, import_arg.default)(Object.assign({}, arg_common_default(), argsOptions), {
    ...argOptions,
    argv
  });
}
function parseArguments(args, flagsSpecification, parserOptions = {}) {
  const { _: positional, ...rest } = (0, import_arg.default)(
    Object.assign({}, arg_common_default(), flagsSpecification),
    {
      ...parserOptions,
      argv: args
    }
  );
  return { args: positional, flags: rest };
}

// src/util/now-error.ts
var NowError = class extends Error {
  constructor({
    code: code2,
    message,
    meta
  }) {
    super(message);
    this.code = code2;
    this.meta = meta;
  }
};

// src/util/output/code.ts
var import_chalk2 = __toESM(require_source(), 1);
function code(cmd2, { backticks = true } = {}) {
  const tick = backticks ? import_chalk2.default.gray("`") : "";
  return `${tick}${import_chalk2.default.bold(cmd2)}${tick}`;
}

// src/util/errors-ts.ts
var import_bytes = __toESM(require_bytes(), 1);
import { NowBuildError } from "@vercel/build-utils";
var import_chalk3 = __toESM(require_source(), 1);
var import_error_utils = __toESM(require_dist(), 1);
var APIError = class extends Error {
  constructor(message, response, body) {
    super();
    this.message = `${message} (${response.status})`;
    this.status = response.status;
    this.serverMessage = message;
    if (body) {
      for (const field of Object.keys(body)) {
        if (field !== "message") {
          this[field] = body[field];
        }
      }
    }
    if (response.status === 429 || response.status === 503) {
      const parsed = parseRetryAfterHeaderAsMillis(
        response.headers.get("Retry-After")
      );
      this.retryAfterMs = parsed ?? (response.status === 429 ? 0 : void 0);
    }
  }
};
function parseRetryAfterHeaderAsMillis(header) {
  if (!header)
    return void 0;
  let retryAfterMs = Number(header) * 1e3;
  if (Number.isNaN(retryAfterMs)) {
    retryAfterMs = Date.parse(header);
    if (Number.isNaN(retryAfterMs)) {
      return void 0;
    } else {
      retryAfterMs = retryAfterMs - Date.now();
    }
  }
  return Math.max(retryAfterMs, 0);
}
function isAPIError(v) {
  return (0, import_error_utils.isError)(v) && "status" in v;
}
var TeamDeleted = class extends NowError {
  constructor() {
    super({
      code: "TEAM_DELETED",
      message: `Your team was deleted or you were removed from the team. You can switch to a different one using ${getCommandName(
        `switch`
      )}.`,
      meta: {}
    });
  }
};
var InvalidToken = class extends NowError {
  constructor(tokenSource) {
    let message;
    if (tokenSource === "flag") {
      message = "The token provided via `--token` argument is not valid. Please provide a valid token.";
    } else if (tokenSource === "env") {
      message = "The token provided via VERCEL_TOKEN environment variable is not valid. Please provide a valid token.";
    } else {
      message = `The specified token is not valid. Use ${getCommandName(
        "login"
      )} to generate a new token.`;
    }
    super({
      code: "NOT_AUTHORIZED",
      message,
      meta: {}
    });
  }
};
var MissingUser = class extends NowError {
  constructor() {
    super({
      code: "MISSING_USER",
      message: `Not able to load user, missing from response`,
      meta: {}
    });
  }
};
var DomainAlreadyExists = class extends NowError {
  constructor(domain) {
    super({
      code: "DOMAIN_ALREADY_EXISTS",
      meta: { domain },
      message: `The domain ${domain} already exists under a different context.`
    });
  }
};
var DomainPermissionDenied = class extends NowError {
  constructor(domain, context) {
    super({
      code: "DOMAIN_PERMISSION_DENIED",
      meta: { domain, context },
      message: `You don't have access to the domain ${domain} under ${context}.`
    });
  }
};
var DomainExternal = class extends NowError {
  constructor(domain) {
    super({
      code: "DOMAIN_EXTERNAL",
      meta: { domain },
      message: `The domain ${domain} must point to zeit.world.`
    });
  }
};
var SourceNotFound = class extends NowError {
  constructor() {
    super({
      code: "SOURCE_NOT_FOUND",
      meta: {},
      message: `Not able to purchase. Please add a payment method using the dashboard.`
    });
  }
};
var DomainNotFound = class extends NowError {
  constructor(domain, contextName) {
    super({
      code: "DOMAIN_NOT_FOUND",
      meta: { domain },
      message: `Domain not found by "${domain}"${contextName ? ` under ${import_chalk3.default.bold(contextName)}` : ""}.`
    });
  }
};
var DomainNotVerified = class extends NowError {
  constructor(domain) {
    super({
      code: "DOMAIN_NOT_VERIFIED",
      meta: { domain },
      message: `The domain ${domain} is not verified.`
    });
  }
};
var DomainVerificationFailed = class extends NowError {
  constructor({
    domain,
    nsVerification,
    txtVerification,
    purchased = false
  }) {
    super({
      code: "DOMAIN_VERIFICATION_FAILED",
      meta: { domain, nsVerification, txtVerification, purchased },
      message: `We can't verify the domain ${domain}. Both Name Servers and DNS TXT verifications failed.`
    });
  }
};
var InvalidDomain = class extends NowError {
  constructor(domain, message) {
    super({
      code: "INVALID_DOMAIN",
      meta: { domain },
      message: message || `The domain ${domain} is not valid.`
    });
  }
};
var NotDomainOwner = class extends NowError {
  constructor(message) {
    super({
      code: "NOT_DOMAIN_OWNER",
      meta: {},
      message
    });
  }
};
var InvalidDeploymentId = class extends NowError {
  constructor(id) {
    super({
      code: "INVALID_DEPLOYMENT_ID",
      meta: { id },
      message: `The deployment id "${id}" is not valid.`
    });
  }
};
var UnsupportedTLD = class extends NowError {
  constructor(domain) {
    super({
      code: "UNSUPPORTED_TLD",
      meta: { domain },
      message: `The TLD for domain name ${domain} is not supported.`
    });
  }
};
var TLDNotSupportedViaCLI = class extends NowError {
  constructor(domain) {
    super({
      code: "UNSUPPORTED_TLD_VIA_CLI",
      meta: { domain },
      message: `Purchased for the TLD for domain name ${domain} are not supported via the CLI. Use the REST API or the dashboard to purchase.`
    });
  }
};
var DomainNotAvailable = class extends NowError {
  constructor(domain) {
    super({
      code: "DOMAIN_NOT_AVAILABLE",
      meta: { domain },
      message: `The domain ${domain} is not available to be purchased.`
    });
  }
};
var UnexpectedDomainPurchaseError = class extends NowError {
  constructor(domain) {
    super({
      code: "UNEXPECTED_DOMAIN_PURCHASE_ERROR",
      meta: { domain },
      message: `An unexpected error happened while purchasing.`
    });
  }
};
var UnexpectedDomainTransferError = class extends NowError {
  constructor(domain) {
    super({
      code: "UNEXPECTED_DOMAIN_TRANSFER_ERROR",
      meta: { domain },
      message: `An unexpected error happened while transferring.`
    });
  }
};
var DomainPaymentError = class extends NowError {
  constructor() {
    super({
      code: "DOMAIN_PAYMENT_ERROR",
      meta: {},
      message: `Your card was declined.`
    });
  }
};
var DomainPurchasePending = class extends NowError {
  constructor(domain) {
    super({
      code: "DOMAIN_PURCHASE_PENDING",
      meta: { domain },
      message: `The domain purchase for ${domain} is pending.`
    });
  }
};
var UserAborted = class extends NowError {
  constructor() {
    super({
      code: "USER_ABORTED",
      meta: {},
      message: `The user canceled the operation.`
    });
  }
};
var CertNotFound = class extends NowError {
  constructor(id) {
    super({
      code: "CERT_NOT_FOUND",
      meta: { id },
      message: `The cert ${id} can't be found.`
    });
  }
};
var CertsPermissionDenied = class extends NowError {
  constructor(context, domain) {
    super({
      code: "CERTS_PERMISSION_DENIED",
      meta: { domain },
      message: `You don't have access to ${domain}'s certs under ${context}.`
    });
  }
};
var CertOrderNotFound = class extends NowError {
  constructor(cns) {
    super({
      code: "CERT_ORDER_NOT_FOUND",
      meta: { cns },
      message: `No cert order could be found for cns ${cns.join(" ,")}`
    });
  }
};
var TooManyRequests = class extends NowError {
  constructor(api, retryAfterMs) {
    super({
      code: "TOO_MANY_REQUESTS",
      meta: { api, retryAfterMs },
      message: `Rate limited. Too many requests to the same endpoint.`
    });
  }
};
var CertError = class extends NowError {
  constructor({
    cns,
    code: code2,
    message,
    helpUrl
  }) {
    super({
      code: `CERT_ERROR`,
      meta: { cns, code: code2, helpUrl },
      message
    });
  }
};
var CertConfigurationError = class extends NowError {
  constructor({
    cns,
    message,
    external,
    type,
    helpUrl
  }) {
    super({
      code: `CERT_CONFIGURATION_ERROR`,
      meta: { cns, helpUrl, external, type },
      message
    });
  }
};
var DeploymentNotFound = class extends NowError {
  constructor({ context, id = "" }) {
    super({
      code: "DEPLOYMENT_NOT_FOUND",
      meta: { id, context },
      message: `Can't find the deployment "${id}" under the context "${context}"`
    });
  }
};
var DeploymentNotReady = class extends NowError {
  constructor({ url = "" }) {
    super({
      code: "DEPLOYMENT_NOT_READY",
      meta: { url },
      message: `The deployment https://${url} is not ready.`
    });
  }
};
var DeploymentFailedAliasImpossible = class extends NowError {
  constructor() {
    super({
      code: "DEPLOYMENT_FAILED_ALIAS_IMPOSSIBLE",
      meta: {},
      message: `The deployment build has failed and cannot be aliased`
    });
  }
};
var DeploymentPermissionDenied = class extends NowError {
  constructor(id, context) {
    super({
      code: "DEPLOYMENT_PERMISSION_DENIED",
      meta: { id, context },
      message: `You don't have access to the deployment ${id} under ${context}.`
    });
  }
};
var InvalidAlias = class extends NowError {
  constructor(alias) {
    super({
      code: "INVALID_ALIAS",
      meta: { alias },
      message: `The given alias ${alias} is not valid`
    });
  }
};
var AliasInUse = class extends NowError {
  constructor(alias) {
    super({
      code: "ALIAS_IN_USE",
      meta: { alias },
      message: `The alias is already in use`
    });
  }
};
var CertMissing = class extends NowError {
  constructor(domain) {
    super({
      code: "CERT_MISSING",
      meta: { domain },
      message: `The certificate for domain ${domain} is missing`
    });
  }
};
var CantParseJSONFile = class extends NowError {
  constructor(file, parseErrorLocation) {
    const message = `Can't parse json file ${file}: ${parseErrorLocation}`;
    super({
      code: "CANT_PARSE_JSON_FILE",
      meta: { file, parseErrorLocation },
      message
    });
  }
};
var ConflictingConfigFiles = class extends NowBuildError {
  constructor(files, message, link) {
    super({
      code: "CONFLICTING_CONFIG_FILES",
      message: message || "Cannot use both a `vercel.json` and `now.json` file. Please delete the `now.json` file.",
      link: link || "https://vercel.link/combining-old-and-new-config"
    });
    this.files = files;
  }
};
var CantFindConfig = class extends NowError {
  constructor(paths) {
    super({
      code: "CANT_FIND_CONFIG",
      meta: { paths },
      message: `Can't find a configuration file in the given locations.`
    });
  }
};
var WorkingDirectoryDoesNotExist = class extends NowError {
  constructor() {
    super({
      code: "CWD_DOES_NOT_EXIST",
      meta: {},
      message: "The current working directory does not exist."
    });
  }
};
var NoAliasInConfig = class extends NowError {
  constructor() {
    super({
      code: "NO_ALIAS_IN_CONFIG",
      meta: {},
      message: `There is no alias set up in config file.`
    });
  }
};
var InvalidAliasInConfig = class extends NowError {
  constructor(value) {
    super({
      code: "INVALID_ALIAS_IN_CONFIG",
      meta: { value },
      message: `Invalid alias option in configuration.`
    });
  }
};
var DNSPermissionDenied = class extends NowError {
  constructor(domain) {
    super({
      code: "DNS_PERMISSION_DENIED",
      meta: { domain },
      message: `You don't have access to the DNS records of ${domain}.`
    });
  }
};
var DNSInvalidPort = class extends NowError {
  constructor() {
    super({
      code: "DNS_INVALID_PORT",
      meta: {},
      message: `Invalid <port> parameter. A number was expected`
    });
  }
};
var DNSInvalidType = class extends NowError {
  constructor(type) {
    super({
      code: "DNS_INVALID_TYPE",
      meta: { type },
      message: `Invalid <type> parameter "${type}". Expected one of A, AAAA, ALIAS, CAA, CNAME, MX, SRV, TXT`
    });
  }
};
var DNSConflictingRecord = class extends NowError {
  constructor(record) {
    super({
      code: "DNS_CONFLICTING_RECORD",
      meta: { record },
      message: ` A conflicting record exists "${record}".`
    });
  }
};
var DomainRemovalConflict = class extends NowError {
  constructor({
    aliases,
    certs,
    message,
    pendingAsyncPurchase,
    resolvable,
    suffix,
    transferring
  }) {
    super({
      code: "domain_removal_conflict",
      meta: {
        aliases,
        certs,
        pendingAsyncPurchase,
        suffix,
        transferring,
        resolvable
      },
      message
    });
  }
};
var DomainMoveConflict = class extends NowError {
  constructor({
    message,
    pendingAsyncPurchase,
    resolvable,
    suffix
  }) {
    super({
      code: "domain_move_conflict",
      meta: {
        pendingAsyncPurchase,
        resolvable,
        suffix
      },
      message
    });
  }
};
var InvalidMoveDestination = class extends NowError {
  constructor(destination) {
    super({
      code: "INVALID_MOVE_DESTINATION",
      message: `Invalid move destination "${destination}"`,
      meta: { destination }
    });
  }
};
var LambdaSizeExceededError = class extends NowError {
  constructor(size, maxLambdaSize) {
    super({
      code: "MAX_LAMBDA_SIZE_EXCEEDED",
      message: `The lambda function size (${(0, import_bytes.default)(
        size
      ).toLowerCase()}) exceeds the maximum size limit (${(0, import_bytes.default)(
        maxLambdaSize
      ).toLowerCase()}).`,
      meta: { size, maxLambdaSize }
    });
  }
};
var MissingDotenvVarsError = class extends NowError {
  constructor(type, missing) {
    let message;
    if (missing.length === 1) {
      message = `Env var ${JSON.stringify(missing[0])} is not defined in ${code(
        type
      )} file`;
    } else {
      message = [
        `The following env vars are not defined in ${code(type)} file:`,
        ...missing.map((name) => `  - ${JSON.stringify(name)}`)
      ].join("\n");
    }
    message += "\nRead more: https://err.sh/vercel/missing-env-file";
    super({
      code: "MISSING_DOTENV_VARS",
      message,
      meta: { type, missing }
    });
  }
};
var DeploymentsRateLimited = class extends NowError {
  constructor(message) {
    super({
      code: "DEPLOYMENTS_RATE_LIMITED",
      meta: {},
      message
    });
  }
};
var BuildsRateLimited = class extends NowError {
  constructor(message) {
    super({
      code: "BUILDS_RATE_LIMITED",
      meta: {},
      message
    });
  }
};
var ProjectNotFound = class extends NowError {
  constructor(nameOrId) {
    super({
      code: "PROJECT_NOT_FOUND",
      meta: {},
      message: `There is no project for "${nameOrId}"`
    });
  }
};
var AliasDomainConfigured = class extends NowError {
  constructor({ message }) {
    super({
      code: "DOMAIN_CONFIGURED",
      meta: {},
      message
    });
  }
};
var MissingBuildScript = class extends NowError {
  constructor({ message }) {
    super({
      code: "MISSING_BUILD_SCRIPT",
      meta: {},
      message
    });
  }
};
var ConflictingFilePath = class extends NowError {
  constructor({ message }) {
    super({
      code: "CONFLICTING_FILE_PATH",
      meta: {},
      message
    });
  }
};
var ConflictingPathSegment = class extends NowError {
  constructor({ message }) {
    super({
      code: "CONFLICTING_PATH_SEGMENT",
      meta: {},
      message
    });
  }
};
var BuildError = class extends NowError {
  constructor({
    message,
    meta
  }) {
    super({
      code: "BUILD_ERROR",
      meta,
      message
    });
  }
};
var SchemaValidationFailed = class extends NowError {
  constructor(message, keyword, dataPath, params) {
    super({
      code: "SCHEMA_VALIDATION_FAILED",
      meta: { message, keyword, dataPath, params },
      message: `Schema verification failed`
    });
  }
};
var InvalidLocalConfig = class extends NowError {
  constructor(value) {
    super({
      code: "INVALID_LOCAL_CONFIG",
      meta: { value },
      message: `Invalid local config parameter [${value.map((localConfig) => `"${localConfig}"`).join(", ")}]. A string was expected.`
    });
  }
};

// src/util/output/error.ts
var import_chalk4 = __toESM(require_source(), 1);

// src/util/error.ts
var import_bytes2 = __toESM(require_bytes(), 1);
async function responseError(res, fallbackMessage = null, parsedBody = {}) {
  let message = "";
  let bodyError;
  if (res.status >= 400 && res.status < 500) {
    let body;
    try {
      body = await res.json();
    } catch (_err) {
      body = parsedBody;
    }
    bodyError = body.error || body.err || {};
    message = bodyError.message;
  }
  if (!message) {
    message = fallbackMessage === null ? "Response Error" : fallbackMessage;
  }
  const err = new Error(`${message} (${res.status})`);
  err.status = res.status;
  err.serverMessage = message;
  if (bodyError) {
    for (const field of Object.keys(bodyError)) {
      if (field !== "message") {
        err[field] = bodyError[field];
      }
    }
  }
  if (res.status === 429 || res.status === 503) {
    const parsed = parseRetryAfterHeaderAsMillis(
      res.headers.get("Retry-After")
    );
    err.retryAfterMs = parsed ?? (res.status === 429 ? 0 : void 0);
  }
  return err;
}
function toEnumerableError(err) {
  const enumerable = {};
  enumerable.name = err.name;
  for (const key of Object.getOwnPropertyNames(err)) {
    enumerable[key] = err[key];
  }
  return enumerable;
}
function printError(error2) {
  if (typeof error2 === "string") {
    error2 = new Error(error2);
  }
  const apiError = error2;
  const { message, stack, status, code: code2, sizeLimit } = apiError;
  output_manager_default.debug(`handling error: ${stack}`);
  if (message === "User force closed the prompt with 0 null") {
    return;
  }
  if (status === 403) {
    output_manager_default.error(
      message || `Authentication error. Run ${getCommandName("login")} to log-in again.`
    );
  } else if (status === 429) {
    output_manager_default.error(message);
  } else if (code2 === "size_limit_exceeded") {
    output_manager_default.error(`File size limit exceeded (${(0, import_bytes2.default)(sizeLimit)})`);
  } else if (message) {
    output_manager_default.prettyError(apiError);
  } else if (status === 500) {
    output_manager_default.error("Unexpected server error. Please retry.");
  } else if (code2 === "USER_ABORT") {
    output_manager_default.log("Canceled");
  } else {
    output_manager_default.error(`Unexpected error. Please try again later. (${message})`);
  }
}

export {
  pkg_default,
  pkg_exports,
  init_pkg,
  require_lib,
  cmd,
  packageName,
  getTitleName,
  getCommandName,
  getCommandNamePlain,
  getFlagsSpecification,
  globalCommandOptions,
  GLOBAL_CLI_FLAG_NAMES,
  globalCliFlagTakesValue,
  getSameSubcommandSuggestionFlags,
  yesOption,
  nextOption,
  confirmOption,
  limitOption,
  forceOption,
  formatOption,
  jsonOption,
  allOption,
  getGlobalFlagsOnlyFromArgs,
  getCommandNameWithGlobalFlags,
  getArgs,
  parseArguments,
  require_bytes,
  NowError,
  code,
  APIError,
  isAPIError,
  TeamDeleted,
  InvalidToken,
  MissingUser,
  DomainAlreadyExists,
  DomainPermissionDenied,
  DomainExternal,
  SourceNotFound,
  DomainNotFound,
  DomainNotVerified,
  DomainVerificationFailed,
  InvalidDomain,
  NotDomainOwner,
  InvalidDeploymentId,
  UnsupportedTLD,
  TLDNotSupportedViaCLI,
  DomainNotAvailable,
  UnexpectedDomainPurchaseError,
  UnexpectedDomainTransferError,
  DomainPaymentError,
  DomainPurchasePending,
  UserAborted,
  CertNotFound,
  CertsPermissionDenied,
  CertOrderNotFound,
  TooManyRequests,
  CertError,
  CertConfigurationError,
  DeploymentNotFound,
  DeploymentNotReady,
  DeploymentFailedAliasImpossible,
  DeploymentPermissionDenied,
  InvalidAlias,
  AliasInUse,
  CertMissing,
  CantParseJSONFile,
  ConflictingConfigFiles,
  CantFindConfig,
  WorkingDirectoryDoesNotExist,
  NoAliasInConfig,
  InvalidAliasInConfig,
  DNSPermissionDenied,
  DNSInvalidPort,
  DNSInvalidType,
  DNSConflictingRecord,
  DomainRemovalConflict,
  DomainMoveConflict,
  InvalidMoveDestination,
  LambdaSizeExceededError,
  MissingDotenvVarsError,
  DeploymentsRateLimited,
  BuildsRateLimited,
  ProjectNotFound,
  AliasDomainConfigured,
  MissingBuildScript,
  ConflictingFilePath,
  ConflictingPathSegment,
  BuildError,
  SchemaValidationFailed,
  InvalidLocalConfig,
  require_strip_ansi,
  require_string_width,
  responseError,
  toEnumerableError,
  printError
};
/*! Bundled license information:

bytes/index.js:
  (*!
   * bytes
   * Copyright(c) 2012-2014 TJ Holowaychuk
   * Copyright(c) 2015 Jed Watson
   * MIT Licensed
   *)
*/
