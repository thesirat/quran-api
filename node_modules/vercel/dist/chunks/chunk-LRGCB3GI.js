import { createRequire as __createRequire } from 'node:module';
import { fileURLToPath as __fileURLToPath } from 'node:url';
import { dirname as __dirname_ } from 'node:path';
const require = __createRequire(import.meta.url);
const __filename = __fileURLToPath(import.meta.url);
const __dirname = __dirname_(__filename);
import {
  highlight
} from "./chunk-V5P25P7F.js";
import {
  autoInstallAgentTooling
} from "./chunk-NKBY7GFB.js";
import {
  ua_default
} from "./chunk-5ZVJYXLU.js";
import {
  getLocalPathConfig
} from "./chunk-FUK3AUXL.js";
import {
  DEFAULT_VERCEL_CONFIG_FILENAME,
  VERCEL_CONFIG_EXTENSIONS,
  VERCEL_DIR,
  createPrompt,
  esm_default,
  esm_default2,
  esm_default3,
  global_path_default,
  humanizePath,
  isBackspaceKey,
  isEnterKey,
  makeTheme,
  onExit,
  require_cli_width,
  require_dist as require_dist2,
  require_graceful_fs,
  require_lib2 as require_lib,
  require_lib3 as require_lib2,
  require_source as require_source2,
  require_wrap_ansi,
  useKeypress,
  usePrefix,
  useState
} from "./chunk-AACAZGTQ.js";
import {
  getUser
} from "./chunk-AY4LBM3J.js";
import {
  APIError,
  NowError,
  getCommandName,
  printError,
  require_strip_ansi
} from "./chunk-N7ABINT7.js";
import {
  emoji,
  link_default,
  output_manager_default,
  prependEmoji,
  require_ansi_escapes,
  require_dist,
  require_signal_exit
} from "./chunk-FDJURQMQ.js";
import {
  require_source
} from "./chunk-S7KYDPEM.js";
import {
  __commonJS,
  __publicField,
  __require,
  __toESM
} from "./chunk-TZ2YI2VH.js";

// ../../node_modules/.pnpm/strip-bom@3.0.0/node_modules/strip-bom/index.js
var require_strip_bom = __commonJS({
  "../../node_modules/.pnpm/strip-bom@3.0.0/node_modules/strip-bom/index.js"(exports, module) {
    "use strict";
    module.exports = (x) => {
      if (typeof x !== "string") {
        throw new TypeError("Expected a string, got " + typeof x);
      }
      if (x.charCodeAt(0) === 65279) {
        return x.slice(1);
      }
      return x;
    };
  }
});

// ../../node_modules/.pnpm/is-arrayish@0.2.1/node_modules/is-arrayish/index.js
var require_is_arrayish = __commonJS({
  "../../node_modules/.pnpm/is-arrayish@0.2.1/node_modules/is-arrayish/index.js"(exports, module) {
    "use strict";
    module.exports = function isArrayish(obj) {
      if (!obj) {
        return false;
      }
      return obj instanceof Array || Array.isArray(obj) || obj.length >= 0 && obj.splice instanceof Function;
    };
  }
});

// ../../node_modules/.pnpm/error-ex@1.3.2/node_modules/error-ex/index.js
var require_error_ex = __commonJS({
  "../../node_modules/.pnpm/error-ex@1.3.2/node_modules/error-ex/index.js"(exports, module) {
    "use strict";
    var util = __require("util");
    var isArrayish = require_is_arrayish();
    var errorEx = function errorEx2(name, properties) {
      if (!name || name.constructor !== String) {
        properties = name || {};
        name = Error.name;
      }
      var errorExError = function ErrorEXError(message) {
        if (!this) {
          return new ErrorEXError(message);
        }
        message = message instanceof Error ? message.message : message || this.message;
        Error.call(this, message);
        Error.captureStackTrace(this, errorExError);
        this.name = name;
        Object.defineProperty(this, "message", {
          configurable: true,
          enumerable: false,
          get: function() {
            var newMessage = message.split(/\r?\n/g);
            for (var key in properties) {
              if (!properties.hasOwnProperty(key)) {
                continue;
              }
              var modifier = properties[key];
              if ("message" in modifier) {
                newMessage = modifier.message(this[key], newMessage) || newMessage;
                if (!isArrayish(newMessage)) {
                  newMessage = [newMessage];
                }
              }
            }
            return newMessage.join("\n");
          },
          set: function(v) {
            message = v;
          }
        });
        var overwrittenStack = null;
        var stackDescriptor = Object.getOwnPropertyDescriptor(this, "stack");
        var stackGetter = stackDescriptor.get;
        var stackValue = stackDescriptor.value;
        delete stackDescriptor.value;
        delete stackDescriptor.writable;
        stackDescriptor.set = function(newstack) {
          overwrittenStack = newstack;
        };
        stackDescriptor.get = function() {
          var stack = (overwrittenStack || (stackGetter ? stackGetter.call(this) : stackValue)).split(/\r?\n+/g);
          if (!overwrittenStack) {
            stack[0] = this.name + ": " + this.message;
          }
          var lineCount = 1;
          for (var key in properties) {
            if (!properties.hasOwnProperty(key)) {
              continue;
            }
            var modifier = properties[key];
            if ("line" in modifier) {
              var line = modifier.line(this[key]);
              if (line) {
                stack.splice(lineCount++, 0, "    " + line);
              }
            }
            if ("stack" in modifier) {
              modifier.stack(this[key], stack);
            }
          }
          return stack.join("\n");
        };
        Object.defineProperty(this, "stack", stackDescriptor);
      };
      if (Object.setPrototypeOf) {
        Object.setPrototypeOf(errorExError.prototype, Error.prototype);
        Object.setPrototypeOf(errorExError, Error);
      } else {
        util.inherits(errorExError, Error);
      }
      return errorExError;
    };
    errorEx.append = function(str, def) {
      return {
        message: function(v, message) {
          v = v || def;
          if (v) {
            message[0] += " " + str.replace("%s", v.toString());
          }
          return message;
        }
      };
    };
    errorEx.line = function(str, def) {
      return {
        line: function(v) {
          v = v || def;
          if (v) {
            return str.replace("%s", v.toString());
          }
          return null;
        }
      };
    };
    module.exports = errorEx;
  }
});

// ../../node_modules/.pnpm/parse-json@3.0.0/node_modules/parse-json/vendor/unicode.js
var require_unicode = __commonJS({
  "../../node_modules/.pnpm/parse-json@3.0.0/node_modules/parse-json/vendor/unicode.js"(exports, module) {
    var Uni = module.exports;
    module.exports.isWhiteSpace = function isWhiteSpace(x) {
      return x === " " || x === "\xA0" || x === "\uFEFF" || x >= "	" && x <= "\r" || x === "\u1680" || x === "\u180E" || x >= "\u2000" && x <= "\u200A" || x === "\u2028" || x === "\u2029" || x === "\u202F" || x === "\u205F" || x === "\u3000";
    };
    module.exports.isWhiteSpaceJSON = function isWhiteSpaceJSON(x) {
      return x === " " || x === "	" || x === "\n" || x === "\r";
    };
    module.exports.isLineTerminator = function isLineTerminator(x) {
      return x === "\n" || x === "\r" || x === "\u2028" || x === "\u2029";
    };
    module.exports.isLineTerminatorJSON = function isLineTerminatorJSON(x) {
      return x === "\n" || x === "\r";
    };
    module.exports.isIdentifierStart = function isIdentifierStart(x) {
      return x === "$" || x === "_" || x >= "A" && x <= "Z" || x >= "a" && x <= "z" || x >= "\x80" && Uni.NonAsciiIdentifierStart.test(x);
    };
    module.exports.isIdentifierPart = function isIdentifierPart(x) {
      return x === "$" || x === "_" || x >= "A" && x <= "Z" || x >= "a" && x <= "z" || x >= "0" && x <= "9" || x >= "\x80" && Uni.NonAsciiIdentifierPart.test(x);
    };
    module.exports.NonAsciiIdentifierStart = /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0\u08A2-\u08AC\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097F\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F0\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191C\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA697\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA793\uA7A0-\uA7AA\uA7F8-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA80-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]/;
    module.exports.NonAsciiIdentifierPart = /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u0527\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0\u08A2-\u08AC\u08E4-\u08FE\u0900-\u0963\u0966-\u096F\u0971-\u0977\u0979-\u097F\u0981-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C01-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C33\u0C35-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C82\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D02\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F0\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191C\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1D00-\u1DE6\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA697\uA69F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA793\uA7A0-\uA7AA\uA7F8-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A\uAA7B\uAA80-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE26\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]/;
  }
});

// ../../node_modules/.pnpm/parse-json@3.0.0/node_modules/parse-json/vendor/parse.js
var require_parse = __commonJS({
  "../../node_modules/.pnpm/parse-json@3.0.0/node_modules/parse-json/vendor/parse.js"(exports, module) {
    var Uni = require_unicode();
    function isHexDigit(x) {
      return x >= "0" && x <= "9" || x >= "A" && x <= "F" || x >= "a" && x <= "f";
    }
    function isOctDigit(x) {
      return x >= "0" && x <= "7";
    }
    function isDecDigit(x) {
      return x >= "0" && x <= "9";
    }
    var unescapeMap = {
      "'": "'",
      '"': '"',
      "\\": "\\",
      "b": "\b",
      "f": "\f",
      "n": "\n",
      "r": "\r",
      "t": "	",
      "v": "\v",
      "/": "/"
    };
    function formatError(input, msg, position, lineno, column, json5) {
      var result = msg + " at " + (lineno + 1) + ":" + (column + 1), tmppos = position - column - 1, srcline = "", underline = "";
      var isLineTerminator = json5 ? Uni.isLineTerminator : Uni.isLineTerminatorJSON;
      if (tmppos < position - 70) {
        tmppos = position - 70;
      }
      while (1) {
        var chr = input[++tmppos];
        if (isLineTerminator(chr) || tmppos === input.length) {
          if (position >= tmppos) {
            underline += "^";
          }
          break;
        }
        srcline += chr;
        if (position === tmppos) {
          underline += "^";
        } else if (position > tmppos) {
          underline += input[tmppos] === "	" ? "	" : " ";
        }
        if (srcline.length > 78)
          break;
      }
      return result + "\n" + srcline + "\n" + underline;
    }
    function parse(input, options) {
      var json5 = !(options.mode === "json" || options.legacy);
      var isLineTerminator = json5 ? Uni.isLineTerminator : Uni.isLineTerminatorJSON;
      var isWhiteSpace = json5 ? Uni.isWhiteSpace : Uni.isWhiteSpaceJSON;
      var length = input.length, lineno = 0, linestart = 0, position = 0, stack = [];
      var tokenStart = function() {
      };
      var tokenEnd = function(v) {
        return v;
      };
      if (options._tokenize) {
        ;
        (function() {
          var start = null;
          tokenStart = function() {
            if (start !== null)
              throw Error("internal error, token overlap");
            start = position;
          };
          tokenEnd = function(v, type) {
            if (start != position) {
              var hash = {
                raw: input.substr(start, position - start),
                type,
                stack: stack.slice(0)
              };
              if (v !== void 0)
                hash.value = v;
              options._tokenize.call(null, hash);
            }
            start = null;
            return v;
          };
        })();
      }
      function fail(msg) {
        var column = position - linestart;
        if (!msg) {
          if (position < length) {
            var token = "'" + JSON.stringify(input[position]).replace(/^"|"$/g, "").replace(/'/g, "\\'").replace(/\\"/g, '"') + "'";
            if (!msg)
              msg = "Unexpected token " + token;
          } else {
            if (!msg)
              msg = "Unexpected end of input";
          }
        }
        var error = SyntaxError(formatError(input, msg, position, lineno, column, json5));
        error.row = lineno + 1;
        error.column = column + 1;
        throw error;
      }
      function newline(chr) {
        if (chr === "\r" && input[position] === "\n")
          position++;
        linestart = position;
        lineno++;
      }
      function parseGeneric() {
        var result;
        while (position < length) {
          tokenStart();
          var chr = input[position++];
          if (chr === '"' || chr === "'" && json5) {
            return tokenEnd(parseString(chr), "literal");
          } else if (chr === "{") {
            tokenEnd(void 0, "separator");
            return parseObject();
          } else if (chr === "[") {
            tokenEnd(void 0, "separator");
            return parseArray();
          } else if (chr === "-" || chr === "." || isDecDigit(chr) || json5 && (chr === "+" || chr === "I" || chr === "N")) {
            return tokenEnd(parseNumber(), "literal");
          } else if (chr === "n") {
            parseKeyword("null");
            return tokenEnd(null, "literal");
          } else if (chr === "t") {
            parseKeyword("true");
            return tokenEnd(true, "literal");
          } else if (chr === "f") {
            parseKeyword("false");
            return tokenEnd(false, "literal");
          } else {
            position--;
            return tokenEnd(void 0);
          }
        }
      }
      function parseKey() {
        var result;
        while (position < length) {
          tokenStart();
          var chr = input[position++];
          if (chr === '"' || chr === "'" && json5) {
            return tokenEnd(parseString(chr), "key");
          } else if (chr === "{") {
            tokenEnd(void 0, "separator");
            return parseObject();
          } else if (chr === "[") {
            tokenEnd(void 0, "separator");
            return parseArray();
          } else if (chr === "." || isDecDigit(chr)) {
            return tokenEnd(parseNumber(true), "key");
          } else if (json5 && Uni.isIdentifierStart(chr) || chr === "\\" && input[position] === "u") {
            var rollback = position - 1;
            var result = parseIdentifier();
            if (result === void 0) {
              position = rollback;
              return tokenEnd(void 0);
            } else {
              return tokenEnd(result, "key");
            }
          } else {
            position--;
            return tokenEnd(void 0);
          }
        }
      }
      function skipWhiteSpace() {
        tokenStart();
        while (position < length) {
          var chr = input[position++];
          if (isLineTerminator(chr)) {
            position--;
            tokenEnd(void 0, "whitespace");
            tokenStart();
            position++;
            newline(chr);
            tokenEnd(void 0, "newline");
            tokenStart();
          } else if (isWhiteSpace(chr)) {
          } else if (chr === "/" && json5 && (input[position] === "/" || input[position] === "*")) {
            position--;
            tokenEnd(void 0, "whitespace");
            tokenStart();
            position++;
            skipComment(input[position++] === "*");
            tokenEnd(void 0, "comment");
            tokenStart();
          } else {
            position--;
            break;
          }
        }
        return tokenEnd(void 0, "whitespace");
      }
      function skipComment(multi) {
        while (position < length) {
          var chr = input[position++];
          if (isLineTerminator(chr)) {
            if (!multi) {
              position--;
              return;
            }
            newline(chr);
          } else if (chr === "*" && multi) {
            if (input[position] === "/") {
              position++;
              return;
            }
          } else {
          }
        }
        if (multi) {
          fail("Unclosed multiline comment");
        }
      }
      function parseKeyword(keyword) {
        var _pos = position;
        var len = keyword.length;
        for (var i = 1; i < len; i++) {
          if (position >= length || keyword[i] != input[position]) {
            position = _pos - 1;
            fail();
          }
          position++;
        }
      }
      function parseObject() {
        var result = options.null_prototype ? /* @__PURE__ */ Object.create(null) : {}, empty_object = {}, is_non_empty = false;
        while (position < length) {
          skipWhiteSpace();
          var item1 = parseKey();
          skipWhiteSpace();
          tokenStart();
          var chr = input[position++];
          tokenEnd(void 0, "separator");
          if (chr === "}" && item1 === void 0) {
            if (!json5 && is_non_empty) {
              position--;
              fail("Trailing comma in object");
            }
            return result;
          } else if (chr === ":" && item1 !== void 0) {
            skipWhiteSpace();
            stack.push(item1);
            var item2 = parseGeneric();
            stack.pop();
            if (item2 === void 0)
              fail("No value found for key " + item1);
            if (typeof item1 !== "string") {
              if (!json5 || typeof item1 !== "number") {
                fail("Wrong key type: " + item1);
              }
            }
            if ((item1 in empty_object || empty_object[item1] != null) && options.reserved_keys !== "replace") {
              if (options.reserved_keys === "throw") {
                fail("Reserved key: " + item1);
              } else {
              }
            } else {
              if (typeof options.reviver === "function") {
                item2 = options.reviver.call(null, item1, item2);
              }
              if (item2 !== void 0) {
                is_non_empty = true;
                Object.defineProperty(result, item1, {
                  value: item2,
                  enumerable: true,
                  configurable: true,
                  writable: true
                });
              }
            }
            skipWhiteSpace();
            tokenStart();
            var chr = input[position++];
            tokenEnd(void 0, "separator");
            if (chr === ",") {
              continue;
            } else if (chr === "}") {
              return result;
            } else {
              fail();
            }
          } else {
            position--;
            fail();
          }
        }
        fail();
      }
      function parseArray() {
        var result = [];
        while (position < length) {
          skipWhiteSpace();
          stack.push(result.length);
          var item = parseGeneric();
          stack.pop();
          skipWhiteSpace();
          tokenStart();
          var chr = input[position++];
          tokenEnd(void 0, "separator");
          if (item !== void 0) {
            if (typeof options.reviver === "function") {
              item = options.reviver.call(null, String(result.length), item);
            }
            if (item === void 0) {
              result.length++;
              item = true;
            } else {
              result.push(item);
            }
          }
          if (chr === ",") {
            if (item === void 0) {
              fail("Elisions are not supported");
            }
          } else if (chr === "]") {
            if (!json5 && item === void 0 && result.length) {
              position--;
              fail("Trailing comma in array");
            }
            return result;
          } else {
            position--;
            fail();
          }
        }
      }
      function parseNumber() {
        position--;
        var start = position, chr = input[position++], t;
        var to_num = function(is_octal2) {
          var str = input.substr(start, position - start);
          if (is_octal2) {
            var result = parseInt(str.replace(/^0o?/, ""), 8);
          } else {
            var result = Number(str);
          }
          if (Number.isNaN(result)) {
            position--;
            fail('Bad numeric literal - "' + input.substr(start, position - start + 1) + '"');
          } else if (!json5 && !str.match(/^-?(0|[1-9][0-9]*)(\.[0-9]+)?(e[+-]?[0-9]+)?$/i)) {
            position--;
            fail('Non-json numeric literal - "' + input.substr(start, position - start + 1) + '"');
          } else {
            return result;
          }
        };
        if (chr === "-" || chr === "+" && json5)
          chr = input[position++];
        if (chr === "N" && json5) {
          parseKeyword("NaN");
          return NaN;
        }
        if (chr === "I" && json5) {
          parseKeyword("Infinity");
          return to_num();
        }
        if (chr >= "1" && chr <= "9") {
          while (position < length && isDecDigit(input[position]))
            position++;
          chr = input[position++];
        }
        if (chr === "0") {
          chr = input[position++];
          var is_octal = chr === "o" || chr === "O" || isOctDigit(chr);
          var is_hex = chr === "x" || chr === "X";
          if (json5 && (is_octal || is_hex)) {
            while (position < length && (is_hex ? isHexDigit : isOctDigit)(input[position]))
              position++;
            var sign = 1;
            if (input[start] === "-") {
              sign = -1;
              start++;
            } else if (input[start] === "+") {
              start++;
            }
            return sign * to_num(is_octal);
          }
        }
        if (chr === ".") {
          while (position < length && isDecDigit(input[position]))
            position++;
          chr = input[position++];
        }
        if (chr === "e" || chr === "E") {
          chr = input[position++];
          if (chr === "-" || chr === "+")
            position++;
          while (position < length && isDecDigit(input[position]))
            position++;
          chr = input[position++];
        }
        position--;
        return to_num();
      }
      function parseIdentifier() {
        position--;
        var result = "";
        while (position < length) {
          var chr = input[position++];
          if (chr === "\\" && input[position] === "u" && isHexDigit(input[position + 1]) && isHexDigit(input[position + 2]) && isHexDigit(input[position + 3]) && isHexDigit(input[position + 4])) {
            chr = String.fromCharCode(parseInt(input.substr(position + 1, 4), 16));
            position += 5;
          }
          if (result.length) {
            if (Uni.isIdentifierPart(chr)) {
              result += chr;
            } else {
              position--;
              return result;
            }
          } else {
            if (Uni.isIdentifierStart(chr)) {
              result += chr;
            } else {
              return void 0;
            }
          }
        }
        fail();
      }
      function parseString(endChar) {
        var result = "";
        while (position < length) {
          var chr = input[position++];
          if (chr === endChar) {
            return result;
          } else if (chr === "\\") {
            if (position >= length)
              fail();
            chr = input[position++];
            if (unescapeMap[chr] && (json5 || chr != "v" && chr != "'")) {
              result += unescapeMap[chr];
            } else if (json5 && isLineTerminator(chr)) {
              newline(chr);
            } else if (chr === "u" || chr === "x" && json5) {
              var off = chr === "u" ? 4 : 2;
              for (var i = 0; i < off; i++) {
                if (position >= length)
                  fail();
                if (!isHexDigit(input[position]))
                  fail("Bad escape sequence");
                position++;
              }
              result += String.fromCharCode(parseInt(input.substr(position - off, off), 16));
            } else if (json5 && isOctDigit(chr)) {
              if (chr < "4" && isOctDigit(input[position]) && isOctDigit(input[position + 1])) {
                var digits = 3;
              } else if (isOctDigit(input[position])) {
                var digits = 2;
              } else {
                var digits = 1;
              }
              position += digits - 1;
              result += String.fromCharCode(parseInt(input.substr(position - digits, digits), 8));
            } else if (json5) {
              result += chr;
            } else {
              position--;
              fail();
            }
          } else if (isLineTerminator(chr)) {
            fail();
          } else {
            if (!json5 && chr.charCodeAt(0) < 32) {
              position--;
              fail("Unexpected control character");
            }
            result += chr;
          }
        }
        fail();
      }
      skipWhiteSpace();
      var return_value = parseGeneric();
      if (return_value !== void 0 || position < length) {
        skipWhiteSpace();
        if (position >= length) {
          if (typeof options.reviver === "function") {
            return_value = options.reviver.call(null, "", return_value);
          }
          return return_value;
        } else {
          fail();
        }
      } else {
        if (position) {
          fail("No data, only a whitespace");
        } else {
          fail("No data, empty input");
        }
      }
    }
    module.exports.parse = function parseJSON(input, options) {
      if (typeof options === "function") {
        options = {
          reviver: options
        };
      }
      if (input === void 0) {
        return void 0;
      }
      if (typeof input !== "string")
        input = String(input);
      if (options == null)
        options = {};
      if (options.reserved_keys == null)
        options.reserved_keys = "ignore";
      if (options.reserved_keys === "throw" || options.reserved_keys === "ignore") {
        if (options.null_prototype == null) {
          options.null_prototype = true;
        }
      }
      try {
        return parse(input, options);
      } catch (err) {
        if (err instanceof SyntaxError && err.row != null && err.column != null) {
          var old_err = err;
          err = SyntaxError(old_err.message);
          err.column = old_err.column;
          err.row = old_err.row;
        }
        throw err;
      }
    };
    module.exports.tokenize = function tokenizeJSON(input, options) {
      if (options == null)
        options = {};
      options._tokenize = function(smth) {
        if (options._addstack)
          smth.stack.unshift.apply(smth.stack, options._addstack);
        tokens.push(smth);
      };
      var tokens = [];
      tokens.data = module.exports.parse(input, options);
      return tokens;
    };
  }
});

// ../../node_modules/.pnpm/parse-json@3.0.0/node_modules/parse-json/index.js
var require_parse_json = __commonJS({
  "../../node_modules/.pnpm/parse-json@3.0.0/node_modules/parse-json/index.js"(exports, module) {
    "use strict";
    var errorEx = require_error_ex();
    var fallback = require_parse();
    function appendPosition(message) {
      const posRe = / at (\d+:\d+) in/;
      const numbers = posRe.exec(message);
      return message.replace(posRe, " in") + ":" + numbers[1];
    }
    var JSONError = errorEx("JSONError", {
      fileName: errorEx.append("in %s"),
      appendPosition: {
        message: (shouldAppend, original) => {
          if (shouldAppend) {
            original[0] = appendPosition(original[0]);
          }
          return original;
        }
      }
    });
    module.exports = (input, reviver, filename) => {
      if (typeof reviver === "string") {
        filename = reviver;
        reviver = null;
      }
      try {
        try {
          return JSON.parse(input, reviver);
        } catch (err) {
          fallback.parse(input, {
            mode: "json",
            reviver
          });
          throw err;
        }
      } catch (err) {
        const jsonErr = new JSONError(err);
        if (filename) {
          jsonErr.fileName = filename;
          jsonErr.appendPosition = true;
        }
        throw jsonErr;
      }
    };
  }
});

// ../../node_modules/.pnpm/pify@2.3.0/node_modules/pify/index.js
var require_pify = __commonJS({
  "../../node_modules/.pnpm/pify@2.3.0/node_modules/pify/index.js"(exports, module) {
    "use strict";
    var processFn = function(fn, P, opts) {
      return function() {
        var that = this;
        var args = new Array(arguments.length);
        for (var i = 0; i < arguments.length; i++) {
          args[i] = arguments[i];
        }
        return new P(function(resolve, reject) {
          args.push(function(err, result) {
            if (err) {
              reject(err);
            } else if (opts.multiArgs) {
              var results = new Array(arguments.length - 1);
              for (var i2 = 1; i2 < arguments.length; i2++) {
                results[i2 - 1] = arguments[i2];
              }
              resolve(results);
            } else {
              resolve(result);
            }
          });
          fn.apply(that, args);
        });
      };
    };
    var pify = module.exports = function(obj, P, opts) {
      if (typeof P !== "function") {
        opts = P;
        P = Promise;
      }
      opts = opts || {};
      opts.exclude = opts.exclude || [/.+Sync$/];
      var filter = function(key) {
        var match = function(pattern) {
          return typeof pattern === "string" ? key === pattern : pattern.test(key);
        };
        return opts.include ? opts.include.some(match) : !opts.exclude.some(match);
      };
      var ret = typeof obj === "function" ? function() {
        if (opts.excludeMain) {
          return obj.apply(this, arguments);
        }
        return processFn(obj, P, opts).apply(this, arguments);
      } : {};
      return Object.keys(obj).reduce(function(ret2, key) {
        var x = obj[key];
        ret2[key] = typeof x === "function" && filter(key) ? processFn(x, P, opts) : x;
        return ret2;
      }, ret);
    };
    pify.all = pify;
  }
});

// ../../node_modules/.pnpm/load-json-file@3.0.0/node_modules/load-json-file/index.js
var require_load_json_file = __commonJS({
  "../../node_modules/.pnpm/load-json-file@3.0.0/node_modules/load-json-file/index.js"(exports, module) {
    "use strict";
    var path = __require("path");
    var fs = require_graceful_fs();
    var stripBom = require_strip_bom();
    var parseJson = require_parse_json();
    var pify = require_pify();
    var parse = (data, fp) => parseJson(stripBom(data), path.relative(".", fp));
    module.exports = (fp) => pify(fs.readFile)(fp, "utf8").then((data) => parse(data, fp));
    module.exports.sync = (fp) => parse(fs.readFileSync(fp, "utf8"), fp);
  }
});

// ../../node_modules/.pnpm/imurmurhash@0.1.4/node_modules/imurmurhash/imurmurhash.js
var require_imurmurhash = __commonJS({
  "../../node_modules/.pnpm/imurmurhash@0.1.4/node_modules/imurmurhash/imurmurhash.js"(exports, module) {
    (function() {
      var cache;
      function MurmurHash3(key, seed) {
        var m = this instanceof MurmurHash3 ? this : cache;
        m.reset(seed);
        if (typeof key === "string" && key.length > 0) {
          m.hash(key);
        }
        if (m !== this) {
          return m;
        }
      }
      ;
      MurmurHash3.prototype.hash = function(key) {
        var h1, k1, i, top, len;
        len = key.length;
        this.len += len;
        k1 = this.k1;
        i = 0;
        switch (this.rem) {
          case 0:
            k1 ^= len > i ? key.charCodeAt(i++) & 65535 : 0;
          case 1:
            k1 ^= len > i ? (key.charCodeAt(i++) & 65535) << 8 : 0;
          case 2:
            k1 ^= len > i ? (key.charCodeAt(i++) & 65535) << 16 : 0;
          case 3:
            k1 ^= len > i ? (key.charCodeAt(i) & 255) << 24 : 0;
            k1 ^= len > i ? (key.charCodeAt(i++) & 65280) >> 8 : 0;
        }
        this.rem = len + this.rem & 3;
        len -= this.rem;
        if (len > 0) {
          h1 = this.h1;
          while (1) {
            k1 = k1 * 11601 + (k1 & 65535) * 3432906752 & 4294967295;
            k1 = k1 << 15 | k1 >>> 17;
            k1 = k1 * 13715 + (k1 & 65535) * 461832192 & 4294967295;
            h1 ^= k1;
            h1 = h1 << 13 | h1 >>> 19;
            h1 = h1 * 5 + 3864292196 & 4294967295;
            if (i >= len) {
              break;
            }
            k1 = key.charCodeAt(i++) & 65535 ^ (key.charCodeAt(i++) & 65535) << 8 ^ (key.charCodeAt(i++) & 65535) << 16;
            top = key.charCodeAt(i++);
            k1 ^= (top & 255) << 24 ^ (top & 65280) >> 8;
          }
          k1 = 0;
          switch (this.rem) {
            case 3:
              k1 ^= (key.charCodeAt(i + 2) & 65535) << 16;
            case 2:
              k1 ^= (key.charCodeAt(i + 1) & 65535) << 8;
            case 1:
              k1 ^= key.charCodeAt(i) & 65535;
          }
          this.h1 = h1;
        }
        this.k1 = k1;
        return this;
      };
      MurmurHash3.prototype.result = function() {
        var k1, h1;
        k1 = this.k1;
        h1 = this.h1;
        if (k1 > 0) {
          k1 = k1 * 11601 + (k1 & 65535) * 3432906752 & 4294967295;
          k1 = k1 << 15 | k1 >>> 17;
          k1 = k1 * 13715 + (k1 & 65535) * 461832192 & 4294967295;
          h1 ^= k1;
        }
        h1 ^= this.len;
        h1 ^= h1 >>> 16;
        h1 = h1 * 51819 + (h1 & 65535) * 2246770688 & 4294967295;
        h1 ^= h1 >>> 13;
        h1 = h1 * 44597 + (h1 & 65535) * 3266445312 & 4294967295;
        h1 ^= h1 >>> 16;
        return h1 >>> 0;
      };
      MurmurHash3.prototype.reset = function(seed) {
        this.h1 = typeof seed === "number" ? seed : 0;
        this.rem = this.k1 = this.len = 0;
        return this;
      };
      cache = new MurmurHash3();
      if (typeof module != "undefined") {
        module.exports = MurmurHash3;
      } else {
        this.MurmurHash3 = MurmurHash3;
      }
    })();
  }
});

// ../../node_modules/.pnpm/write-file-atomic@2.4.3/node_modules/write-file-atomic/index.js
var require_write_file_atomic = __commonJS({
  "../../node_modules/.pnpm/write-file-atomic@2.4.3/node_modules/write-file-atomic/index.js"(exports, module) {
    "use strict";
    module.exports = writeFile;
    module.exports.sync = writeFileSync;
    module.exports._getTmpname = getTmpname;
    module.exports._cleanupOnExit = cleanupOnExit;
    var fs = require_graceful_fs();
    var MurmurHash3 = require_imurmurhash();
    var onExit2 = require_signal_exit();
    var path = __require("path");
    var activeFiles = {};
    var threadId = function getId() {
      try {
        var workerThreads = __require("worker_threads");
        return workerThreads.threadId;
      } catch (e) {
        return 0;
      }
    }();
    var invocations = 0;
    function getTmpname(filename) {
      return filename + "." + MurmurHash3(__filename).hash(String(process.pid)).hash(String(threadId)).hash(String(++invocations)).result();
    }
    function cleanupOnExit(tmpfile) {
      return function() {
        try {
          fs.unlinkSync(typeof tmpfile === "function" ? tmpfile() : tmpfile);
        } catch (_) {
        }
      };
    }
    function writeFile(filename, data, options, callback) {
      if (options) {
        if (options instanceof Function) {
          callback = options;
          options = {};
        } else if (typeof options === "string") {
          options = { encoding: options };
        }
      } else {
        options = {};
      }
      var Promise2 = options.Promise || global.Promise;
      var truename;
      var fd;
      var tmpfile;
      var removeOnExitHandler = onExit2(cleanupOnExit(() => tmpfile));
      var absoluteName = path.resolve(filename);
      new Promise2(function serializeSameFile(resolve) {
        if (!activeFiles[absoluteName])
          activeFiles[absoluteName] = [];
        activeFiles[absoluteName].push(resolve);
        if (activeFiles[absoluteName].length === 1)
          resolve();
      }).then(function getRealPath() {
        return new Promise2(function(resolve) {
          fs.realpath(filename, function(_, realname) {
            truename = realname || filename;
            tmpfile = getTmpname(truename);
            resolve();
          });
        });
      }).then(function stat() {
        return new Promise2(function stat2(resolve) {
          if (options.mode && options.chown)
            resolve();
          else {
            fs.stat(truename, function(err, stats) {
              if (err || !stats)
                resolve();
              else {
                options = Object.assign({}, options);
                if (options.mode == null) {
                  options.mode = stats.mode;
                }
                if (options.chown == null && process.getuid) {
                  options.chown = { uid: stats.uid, gid: stats.gid };
                }
                resolve();
              }
            });
          }
        });
      }).then(function thenWriteFile() {
        return new Promise2(function(resolve, reject) {
          fs.open(tmpfile, "w", options.mode, function(err, _fd) {
            fd = _fd;
            if (err)
              reject(err);
            else
              resolve();
          });
        });
      }).then(function write() {
        return new Promise2(function(resolve, reject) {
          if (Buffer.isBuffer(data)) {
            fs.write(fd, data, 0, data.length, 0, function(err) {
              if (err)
                reject(err);
              else
                resolve();
            });
          } else if (data != null) {
            fs.write(fd, String(data), 0, String(options.encoding || "utf8"), function(err) {
              if (err)
                reject(err);
              else
                resolve();
            });
          } else
            resolve();
        });
      }).then(function syncAndClose() {
        return new Promise2(function(resolve, reject) {
          if (options.fsync !== false) {
            fs.fsync(fd, function(err) {
              if (err)
                fs.close(fd, () => reject(err));
              else
                fs.close(fd, resolve);
            });
          } else {
            fs.close(fd, resolve);
          }
        });
      }).then(function chown() {
        fd = null;
        if (options.chown) {
          return new Promise2(function(resolve, reject) {
            fs.chown(tmpfile, options.chown.uid, options.chown.gid, function(err) {
              if (err)
                reject(err);
              else
                resolve();
            });
          });
        }
      }).then(function chmod() {
        if (options.mode) {
          return new Promise2(function(resolve, reject) {
            fs.chmod(tmpfile, options.mode, function(err) {
              if (err)
                reject(err);
              else
                resolve();
            });
          });
        }
      }).then(function rename() {
        return new Promise2(function(resolve, reject) {
          fs.rename(tmpfile, truename, function(err) {
            if (err)
              reject(err);
            else
              resolve();
          });
        });
      }).then(function success() {
        removeOnExitHandler();
        callback();
      }, function fail(err) {
        return new Promise2((resolve) => {
          return fd ? fs.close(fd, resolve) : resolve();
        }).then(() => {
          removeOnExitHandler();
          fs.unlink(tmpfile, function() {
            callback(err);
          });
        });
      }).then(function checkQueue() {
        activeFiles[absoluteName].shift();
        if (activeFiles[absoluteName].length > 0) {
          activeFiles[absoluteName][0]();
        } else
          delete activeFiles[absoluteName];
      });
    }
    function writeFileSync(filename, data, options) {
      if (typeof options === "string")
        options = { encoding: options };
      else if (!options)
        options = {};
      try {
        filename = fs.realpathSync(filename);
      } catch (ex) {
      }
      var tmpfile = getTmpname(filename);
      if (!options.mode || !options.chown) {
        try {
          var stats = fs.statSync(filename);
          options = Object.assign({}, options);
          if (!options.mode) {
            options.mode = stats.mode;
          }
          if (!options.chown && process.getuid) {
            options.chown = { uid: stats.uid, gid: stats.gid };
          }
        } catch (ex) {
        }
      }
      var fd;
      var cleanup = cleanupOnExit(tmpfile);
      var removeOnExitHandler = onExit2(cleanup);
      try {
        fd = fs.openSync(tmpfile, "w", options.mode);
        if (Buffer.isBuffer(data)) {
          fs.writeSync(fd, data, 0, data.length, 0);
        } else if (data != null) {
          fs.writeSync(fd, String(data), 0, String(options.encoding || "utf8"));
        }
        if (options.fsync !== false) {
          fs.fsyncSync(fd);
        }
        fs.closeSync(fd);
        if (options.chown)
          fs.chownSync(tmpfile, options.chown.uid, options.chown.gid);
        if (options.mode)
          fs.chmodSync(tmpfile, options.mode);
        fs.renameSync(tmpfile, filename);
        removeOnExitHandler();
      } catch (err) {
        if (fd) {
          try {
            fs.closeSync(fd);
          } catch (ex) {
          }
        }
        removeOnExitHandler();
        cleanup();
        throw err;
      }
    }
  }
});

// ../../node_modules/.pnpm/is-plain-obj@1.1.0/node_modules/is-plain-obj/index.js
var require_is_plain_obj = __commonJS({
  "../../node_modules/.pnpm/is-plain-obj@1.1.0/node_modules/is-plain-obj/index.js"(exports, module) {
    "use strict";
    var toString = Object.prototype.toString;
    module.exports = function(x) {
      var prototype;
      return toString.call(x) === "[object Object]" && (prototype = Object.getPrototypeOf(x), prototype === null || prototype === Object.getPrototypeOf({}));
    };
  }
});

// ../../node_modules/.pnpm/sort-keys@1.1.2/node_modules/sort-keys/index.js
var require_sort_keys = __commonJS({
  "../../node_modules/.pnpm/sort-keys@1.1.2/node_modules/sort-keys/index.js"(exports, module) {
    "use strict";
    var isPlainObj = require_is_plain_obj();
    module.exports = function(obj, opts) {
      if (!isPlainObj(obj)) {
        throw new TypeError("Expected a plain object");
      }
      opts = opts || {};
      if (typeof opts === "function") {
        opts = { compare: opts };
      }
      var deep = opts.deep;
      var seenInput = [];
      var seenOutput = [];
      var sortKeys = function(x) {
        var seenIndex = seenInput.indexOf(x);
        if (seenIndex !== -1) {
          return seenOutput[seenIndex];
        }
        var ret = {};
        var keys = Object.keys(x).sort(opts.compare);
        seenInput.push(x);
        seenOutput.push(ret);
        for (var i = 0; i < keys.length; i++) {
          var key = keys[i];
          var val = x[key];
          ret[key] = deep && isPlainObj(val) ? sortKeys(val) : val;
        }
        return ret;
      };
      return sortKeys(obj);
    };
  }
});

// ../../node_modules/.pnpm/pify@3.0.0/node_modules/pify/index.js
var require_pify2 = __commonJS({
  "../../node_modules/.pnpm/pify@3.0.0/node_modules/pify/index.js"(exports, module) {
    "use strict";
    var processFn = (fn, opts) => function() {
      const P = opts.promiseModule;
      const args = new Array(arguments.length);
      for (let i = 0; i < arguments.length; i++) {
        args[i] = arguments[i];
      }
      return new P((resolve, reject) => {
        if (opts.errorFirst) {
          args.push(function(err, result) {
            if (opts.multiArgs) {
              const results = new Array(arguments.length - 1);
              for (let i = 1; i < arguments.length; i++) {
                results[i - 1] = arguments[i];
              }
              if (err) {
                results.unshift(err);
                reject(results);
              } else {
                resolve(results);
              }
            } else if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          });
        } else {
          args.push(function(result) {
            if (opts.multiArgs) {
              const results = new Array(arguments.length - 1);
              for (let i = 0; i < arguments.length; i++) {
                results[i] = arguments[i];
              }
              resolve(results);
            } else {
              resolve(result);
            }
          });
        }
        fn.apply(this, args);
      });
    };
    module.exports = (obj, opts) => {
      opts = Object.assign({
        exclude: [/.+(Sync|Stream)$/],
        errorFirst: true,
        promiseModule: Promise
      }, opts);
      const filter = (key) => {
        const match = (pattern) => typeof pattern === "string" ? key === pattern : pattern.test(key);
        return opts.include ? opts.include.some(match) : !opts.exclude.some(match);
      };
      let ret;
      if (typeof obj === "function") {
        ret = function() {
          if (opts.excludeMain) {
            return obj.apply(this, arguments);
          }
          return processFn(obj, opts).apply(this, arguments);
        };
      } else {
        ret = Object.create(Object.getPrototypeOf(obj));
      }
      for (const key in obj) {
        const x = obj[key];
        ret[key] = typeof x === "function" && filter(key) ? processFn(x, opts) : x;
      }
      return ret;
    };
  }
});

// ../../node_modules/.pnpm/make-dir@1.3.0/node_modules/make-dir/index.js
var require_make_dir = __commonJS({
  "../../node_modules/.pnpm/make-dir@1.3.0/node_modules/make-dir/index.js"(exports, module) {
    "use strict";
    var fs = __require("fs");
    var path = __require("path");
    var pify = require_pify2();
    var defaults = {
      mode: 511 & ~process.umask(),
      fs
    };
    var checkPath = (pth) => {
      if (process.platform === "win32") {
        const pathHasInvalidWinCharacters = /[<>:"|?*]/.test(pth.replace(path.parse(pth).root, ""));
        if (pathHasInvalidWinCharacters) {
          const err = new Error(`Path contains invalid characters: ${pth}`);
          err.code = "EINVAL";
          throw err;
        }
      }
    };
    module.exports = (input, opts) => Promise.resolve().then(() => {
      checkPath(input);
      opts = Object.assign({}, defaults, opts);
      const mkdir = pify(opts.fs.mkdir);
      const stat = pify(opts.fs.stat);
      const make = (pth) => {
        return mkdir(pth, opts.mode).then(() => pth).catch((err) => {
          if (err.code === "ENOENT") {
            if (err.message.includes("null bytes") || path.dirname(pth) === pth) {
              throw err;
            }
            return make(path.dirname(pth)).then(() => make(pth));
          }
          return stat(pth).then((stats) => stats.isDirectory() ? pth : Promise.reject()).catch(() => {
            throw err;
          });
        });
      };
      return make(path.resolve(input));
    });
    module.exports.sync = (input, opts) => {
      checkPath(input);
      opts = Object.assign({}, defaults, opts);
      const make = (pth) => {
        try {
          opts.fs.mkdirSync(pth, opts.mode);
        } catch (err) {
          if (err.code === "ENOENT") {
            if (err.message.includes("null bytes") || path.dirname(pth) === pth) {
              throw err;
            }
            make(path.dirname(pth));
            return make(pth);
          }
          try {
            if (!opts.fs.statSync(pth).isDirectory()) {
              throw new Error("The path is not a directory");
            }
          } catch (_) {
            throw err;
          }
        }
        return pth;
      };
      return make(path.resolve(input));
    };
  }
});

// ../../node_modules/.pnpm/detect-indent@5.0.0/node_modules/detect-indent/index.js
var require_detect_indent = __commonJS({
  "../../node_modules/.pnpm/detect-indent@5.0.0/node_modules/detect-indent/index.js"(exports, module) {
    "use strict";
    var INDENT_RE = /^(?:( )+|\t+)/;
    function getMostUsed(indents) {
      let result = 0;
      let maxUsed = 0;
      let maxWeight = 0;
      for (const entry of indents) {
        const key = entry[0];
        const val = entry[1];
        const u = val[0];
        const w = val[1];
        if (u > maxUsed || u === maxUsed && w > maxWeight) {
          maxUsed = u;
          maxWeight = w;
          result = Number(key);
        }
      }
      return result;
    }
    module.exports = (str) => {
      if (typeof str !== "string") {
        throw new TypeError("Expected a string");
      }
      let tabs = 0;
      let spaces = 0;
      let prev = 0;
      const indents = /* @__PURE__ */ new Map();
      let current;
      let isIndent;
      for (const line of str.split(/\n/g)) {
        if (!line) {
          continue;
        }
        let indent2;
        const matches = line.match(INDENT_RE);
        if (matches) {
          indent2 = matches[0].length;
          if (matches[1]) {
            spaces++;
          } else {
            tabs++;
          }
        } else {
          indent2 = 0;
        }
        const diff = indent2 - prev;
        prev = indent2;
        if (diff) {
          isIndent = diff > 0;
          current = indents.get(isIndent ? diff : -diff);
          if (current) {
            current[0]++;
          } else {
            current = [1, 0];
            indents.set(diff, current);
          }
        } else if (current) {
          current[1] += Number(isIndent);
        }
      }
      const amount = getMostUsed(indents);
      let type;
      let indent;
      if (!amount) {
        type = null;
        indent = "";
      } else if (spaces >= tabs) {
        type = "space";
        indent = " ".repeat(amount);
      } else {
        type = "tab";
        indent = "	".repeat(amount);
      }
      return {
        amount,
        type,
        indent
      };
    };
  }
});

// ../../node_modules/.pnpm/write-json-file@2.2.0/node_modules/write-json-file/index.js
var require_write_json_file = __commonJS({
  "../../node_modules/.pnpm/write-json-file@2.2.0/node_modules/write-json-file/index.js"(exports, module) {
    "use strict";
    var path = __require("path");
    var fs = require_graceful_fs();
    var writeFileAtomic = require_write_file_atomic();
    var sortKeys = require_sort_keys();
    var makeDir = require_make_dir();
    var pify = require_pify();
    var detectIndent = require_detect_indent();
    var init = (fn, fp, data, opts) => {
      if (!fp) {
        throw new TypeError("Expected a filepath");
      }
      if (data === void 0) {
        throw new TypeError("Expected data to stringify");
      }
      opts = Object.assign({
        indent: "	",
        sortKeys: false
      }, opts);
      if (opts.sortKeys) {
        data = sortKeys(data, {
          deep: true,
          compare: typeof opts.sortKeys === "function" && opts.sortKeys
        });
      }
      return fn(fp, data, opts);
    };
    var readFile = (fp) => pify(fs.readFile)(fp, "utf8").catch(() => {
    });
    var main = (fp, data, opts) => {
      return (opts.detectIndent ? readFile(fp) : Promise.resolve()).then((str) => {
        const indent = str ? detectIndent(str).indent : opts.indent;
        const json = JSON.stringify(data, opts.replacer, indent);
        return pify(writeFileAtomic)(fp, `${json}
`, { mode: opts.mode });
      });
    };
    var mainSync = (fp, data, opts) => {
      let indent = opts.indent;
      if (opts.detectIndent) {
        try {
          const file = fs.readFileSync(fp, "utf8");
          indent = detectIndent(file).indent;
        } catch (err) {
          if (err.code !== "ENOENT") {
            throw err;
          }
        }
      }
      const json = JSON.stringify(data, opts.replacer, indent);
      return writeFileAtomic.sync(fp, `${json}
`, { mode: opts.mode });
    };
    module.exports = (fp, data, opts) => {
      return makeDir(path.dirname(fp), { fs }).then(() => init(main, fp, data, opts));
    };
    module.exports.sync = (fp, data, opts) => {
      makeDir.sync(path.dirname(fp), { fs });
      init(mainSync, fp, data, opts);
    };
  }
});

// ../../node_modules/.pnpm/yoctocolors-cjs@2.1.3/node_modules/yoctocolors-cjs/index.js
var require_yoctocolors_cjs = __commonJS({
  "../../node_modules/.pnpm/yoctocolors-cjs@2.1.3/node_modules/yoctocolors-cjs/index.js"(exports, module) {
    var tty = __require("tty");
    var hasColors = tty?.WriteStream?.prototype?.hasColors?.() ?? false;
    var format = (open2, close) => {
      if (!hasColors) {
        return (input) => input;
      }
      const openCode = `\x1B[${open2}m`;
      const closeCode = `\x1B[${close}m`;
      return (input) => {
        const string = input + "";
        let index = string.indexOf(closeCode);
        if (index === -1) {
          return openCode + string + closeCode;
        }
        let result = openCode;
        let lastIndex = 0;
        const reopenOnNestedClose = close === 22;
        const replaceCode = (reopenOnNestedClose ? closeCode : "") + openCode;
        while (index !== -1) {
          result += string.slice(lastIndex, index) + replaceCode;
          lastIndex = index + closeCode.length;
          index = string.indexOf(closeCode, lastIndex);
        }
        result += string.slice(lastIndex) + closeCode;
        return result;
      };
    };
    var colors4 = {};
    colors4.reset = format(0, 0);
    colors4.bold = format(1, 22);
    colors4.dim = format(2, 22);
    colors4.italic = format(3, 23);
    colors4.underline = format(4, 24);
    colors4.overline = format(53, 55);
    colors4.inverse = format(7, 27);
    colors4.hidden = format(8, 28);
    colors4.strikethrough = format(9, 29);
    colors4.black = format(30, 39);
    colors4.red = format(31, 39);
    colors4.green = format(32, 39);
    colors4.yellow = format(33, 39);
    colors4.blue = format(34, 39);
    colors4.magenta = format(35, 39);
    colors4.cyan = format(36, 39);
    colors4.white = format(37, 39);
    colors4.gray = format(90, 39);
    colors4.bgBlack = format(40, 49);
    colors4.bgRed = format(41, 49);
    colors4.bgGreen = format(42, 49);
    colors4.bgYellow = format(43, 49);
    colors4.bgBlue = format(44, 49);
    colors4.bgMagenta = format(45, 49);
    colors4.bgCyan = format(46, 49);
    colors4.bgWhite = format(47, 49);
    colors4.bgGray = format(100, 49);
    colors4.redBright = format(91, 39);
    colors4.greenBright = format(92, 39);
    colors4.yellowBright = format(93, 39);
    colors4.blueBright = format(94, 39);
    colors4.magentaBright = format(95, 39);
    colors4.cyanBright = format(96, 39);
    colors4.whiteBright = format(97, 39);
    colors4.bgRedBright = format(101, 49);
    colors4.bgGreenBright = format(102, 49);
    colors4.bgYellowBright = format(103, 49);
    colors4.bgBlueBright = format(104, 49);
    colors4.bgMagentaBright = format(105, 49);
    colors4.bgCyanBright = format(106, 49);
    colors4.bgWhiteBright = format(107, 49);
    module.exports = colors4;
  }
});

// ../../node_modules/.pnpm/retry@0.10.1/node_modules/retry/lib/retry_operation.js
var require_retry_operation = __commonJS({
  "../../node_modules/.pnpm/retry@0.10.1/node_modules/retry/lib/retry_operation.js"(exports, module) {
    function RetryOperation(timeouts, options) {
      if (typeof options === "boolean") {
        options = { forever: options };
      }
      this._timeouts = timeouts;
      this._options = options || {};
      this._fn = null;
      this._errors = [];
      this._attempts = 1;
      this._operationTimeout = null;
      this._operationTimeoutCb = null;
      this._timeout = null;
      if (this._options.forever) {
        this._cachedTimeouts = this._timeouts.slice(0);
      }
    }
    module.exports = RetryOperation;
    RetryOperation.prototype.stop = function() {
      if (this._timeout) {
        clearTimeout(this._timeout);
      }
      this._timeouts = [];
      this._cachedTimeouts = null;
    };
    RetryOperation.prototype.retry = function(err) {
      if (this._timeout) {
        clearTimeout(this._timeout);
      }
      if (!err) {
        return false;
      }
      this._errors.push(err);
      var timeout = this._timeouts.shift();
      if (timeout === void 0) {
        if (this._cachedTimeouts) {
          this._errors.splice(this._errors.length - 1, this._errors.length);
          this._timeouts = this._cachedTimeouts.slice(0);
          timeout = this._timeouts.shift();
        } else {
          return false;
        }
      }
      var self = this;
      var timer = setTimeout(function() {
        self._attempts++;
        if (self._operationTimeoutCb) {
          self._timeout = setTimeout(function() {
            self._operationTimeoutCb(self._attempts);
          }, self._operationTimeout);
          if (this._options.unref) {
            self._timeout.unref();
          }
        }
        self._fn(self._attempts);
      }, timeout);
      if (this._options.unref) {
        timer.unref();
      }
      return true;
    };
    RetryOperation.prototype.attempt = function(fn, timeoutOps) {
      this._fn = fn;
      if (timeoutOps) {
        if (timeoutOps.timeout) {
          this._operationTimeout = timeoutOps.timeout;
        }
        if (timeoutOps.cb) {
          this._operationTimeoutCb = timeoutOps.cb;
        }
      }
      var self = this;
      if (this._operationTimeoutCb) {
        this._timeout = setTimeout(function() {
          self._operationTimeoutCb();
        }, self._operationTimeout);
      }
      this._fn(this._attempts);
    };
    RetryOperation.prototype.try = function(fn) {
      console.log("Using RetryOperation.try() is deprecated");
      this.attempt(fn);
    };
    RetryOperation.prototype.start = function(fn) {
      console.log("Using RetryOperation.start() is deprecated");
      this.attempt(fn);
    };
    RetryOperation.prototype.start = RetryOperation.prototype.try;
    RetryOperation.prototype.errors = function() {
      return this._errors;
    };
    RetryOperation.prototype.attempts = function() {
      return this._attempts;
    };
    RetryOperation.prototype.mainError = function() {
      if (this._errors.length === 0) {
        return null;
      }
      var counts = {};
      var mainError = null;
      var mainErrorCount = 0;
      for (var i = 0; i < this._errors.length; i++) {
        var error = this._errors[i];
        var message = error.message;
        var count = (counts[message] || 0) + 1;
        counts[message] = count;
        if (count >= mainErrorCount) {
          mainError = error;
          mainErrorCount = count;
        }
      }
      return mainError;
    };
  }
});

// ../../node_modules/.pnpm/retry@0.10.1/node_modules/retry/lib/retry.js
var require_retry = __commonJS({
  "../../node_modules/.pnpm/retry@0.10.1/node_modules/retry/lib/retry.js"(exports) {
    var RetryOperation = require_retry_operation();
    exports.operation = function(options) {
      var timeouts = exports.timeouts(options);
      return new RetryOperation(timeouts, {
        forever: options && options.forever,
        unref: options && options.unref
      });
    };
    exports.timeouts = function(options) {
      if (options instanceof Array) {
        return [].concat(options);
      }
      var opts = {
        retries: 10,
        factor: 2,
        minTimeout: 1 * 1e3,
        maxTimeout: Infinity,
        randomize: false
      };
      for (var key in options) {
        opts[key] = options[key];
      }
      if (opts.minTimeout > opts.maxTimeout) {
        throw new Error("minTimeout is greater than maxTimeout");
      }
      var timeouts = [];
      for (var i = 0; i < opts.retries; i++) {
        timeouts.push(this.createTimeout(i, opts));
      }
      if (options && options.forever && !timeouts.length) {
        timeouts.push(this.createTimeout(i, opts));
      }
      timeouts.sort(function(a, b) {
        return a - b;
      });
      return timeouts;
    };
    exports.createTimeout = function(attempt, opts) {
      var random = opts.randomize ? Math.random() + 1 : 1;
      var timeout = Math.round(random * opts.minTimeout * Math.pow(opts.factor, attempt));
      timeout = Math.min(timeout, opts.maxTimeout);
      return timeout;
    };
    exports.wrap = function(obj, options, methods) {
      if (options instanceof Array) {
        methods = options;
        options = null;
      }
      if (!methods) {
        methods = [];
        for (var key in obj) {
          if (typeof obj[key] === "function") {
            methods.push(key);
          }
        }
      }
      for (var i = 0; i < methods.length; i++) {
        var method = methods[i];
        var original = obj[method];
        obj[method] = function retryWrapper() {
          var op = exports.operation(options);
          var args = Array.prototype.slice.call(arguments);
          var callback = args.pop();
          args.push(function(err) {
            if (op.retry(err)) {
              return;
            }
            if (err) {
              arguments[0] = op.mainError();
            }
            callback.apply(this, arguments);
          });
          op.attempt(function() {
            original.apply(obj, args);
          });
        };
        obj[method].options = options;
      }
    };
  }
});

// ../../node_modules/.pnpm/retry@0.10.1/node_modules/retry/index.js
var require_retry2 = __commonJS({
  "../../node_modules/.pnpm/retry@0.10.1/node_modules/retry/index.js"(exports, module) {
    module.exports = require_retry();
  }
});

// ../../node_modules/.pnpm/async-retry@1.1.3/node_modules/async-retry/dist/index.js
var require_dist3 = __commonJS({
  "../../node_modules/.pnpm/async-retry@1.1.3/node_modules/async-retry/dist/index.js"(exports, module) {
    "use strict";
    var retrier = require_retry2();
    module.exports = function(fn, opts) {
      opts = opts || {};
      return new Promise(function(resolve, reject) {
        var op = retrier.operation(opts);
        var bail = function bail2(err) {
          return reject(err || new Error("Aborted"));
        };
        var onError = function onError2(err) {
          if (err.bail) {
            return bail(err);
          }
          if (!op.retry(err)) {
            reject(op.mainError());
          } else if (opts.onRetry) {
            opts.onRetry(err);
          }
        };
        op.attempt(function(num) {
          var val = void 0;
          try {
            val = fn(bail, num);
          } catch (err) {
            return onError(err);
          }
          Promise.resolve(val).then(resolve, onError);
        });
      });
    };
  }
});

// ../../node_modules/.pnpm/is-docker@2.2.1/node_modules/is-docker/index.js
var require_is_docker = __commonJS({
  "../../node_modules/.pnpm/is-docker@2.2.1/node_modules/is-docker/index.js"(exports, module) {
    "use strict";
    var fs = __require("fs");
    var isDocker;
    function hasDockerEnv() {
      try {
        fs.statSync("/.dockerenv");
        return true;
      } catch (_) {
        return false;
      }
    }
    function hasDockerCGroup() {
      try {
        return fs.readFileSync("/proc/self/cgroup", "utf8").includes("docker");
      } catch (_) {
        return false;
      }
    }
    module.exports = () => {
      if (isDocker === void 0) {
        isDocker = hasDockerEnv() || hasDockerCGroup();
      }
      return isDocker;
    };
  }
});

// ../../node_modules/.pnpm/is-wsl@2.2.0/node_modules/is-wsl/index.js
var require_is_wsl = __commonJS({
  "../../node_modules/.pnpm/is-wsl@2.2.0/node_modules/is-wsl/index.js"(exports, module) {
    "use strict";
    var os = __require("os");
    var fs = __require("fs");
    var isDocker = require_is_docker();
    var isWsl = () => {
      if (process.platform !== "linux") {
        return false;
      }
      if (os.release().toLowerCase().includes("microsoft")) {
        if (isDocker()) {
          return false;
        }
        return true;
      }
      try {
        return fs.readFileSync("/proc/version", "utf8").toLowerCase().includes("microsoft") ? !isDocker() : false;
      } catch (_) {
        return false;
      }
    };
    if (process.env.__IS_WSL_TEST__) {
      module.exports = isWsl;
    } else {
      module.exports = isWsl();
    }
  }
});

// ../../node_modules/.pnpm/define-lazy-prop@2.0.0/node_modules/define-lazy-prop/index.js
var require_define_lazy_prop = __commonJS({
  "../../node_modules/.pnpm/define-lazy-prop@2.0.0/node_modules/define-lazy-prop/index.js"(exports, module) {
    "use strict";
    module.exports = (object, propertyName, fn) => {
      const define = (value) => Object.defineProperty(object, propertyName, { value, enumerable: true, writable: true });
      Object.defineProperty(object, propertyName, {
        configurable: true,
        enumerable: true,
        get() {
          const result = fn();
          define(result);
          return result;
        },
        set(value) {
          define(value);
        }
      });
      return object;
    };
  }
});

// ../../node_modules/.pnpm/open@8.4.0/node_modules/open/index.js
var require_open = __commonJS({
  "../../node_modules/.pnpm/open@8.4.0/node_modules/open/index.js"(exports, module) {
    var path = __require("path");
    var childProcess = __require("child_process");
    var { promises: fs, constants: fsConstants } = __require("fs");
    var isWsl = require_is_wsl();
    var isDocker = require_is_docker();
    var defineLazyProperty = require_define_lazy_prop();
    var localXdgOpenPath = path.join(__dirname, "xdg-open");
    var { platform, arch } = process;
    var getWslDrivesMountPoint = (() => {
      const defaultMountPoint = "/mnt/";
      let mountPoint;
      return async function() {
        if (mountPoint) {
          return mountPoint;
        }
        const configFilePath = "/etc/wsl.conf";
        let isConfigFileExists = false;
        try {
          await fs.access(configFilePath, fsConstants.F_OK);
          isConfigFileExists = true;
        } catch {
        }
        if (!isConfigFileExists) {
          return defaultMountPoint;
        }
        const configContent = await fs.readFile(configFilePath, { encoding: "utf8" });
        const configMountPoint = /(?<!#.*)root\s*=\s*(?<mountPoint>.*)/g.exec(configContent);
        if (!configMountPoint) {
          return defaultMountPoint;
        }
        mountPoint = configMountPoint.groups.mountPoint.trim();
        mountPoint = mountPoint.endsWith("/") ? mountPoint : `${mountPoint}/`;
        return mountPoint;
      };
    })();
    var pTryEach = async (array, mapper) => {
      let latestError;
      for (const item of array) {
        try {
          return await mapper(item);
        } catch (error) {
          latestError = error;
        }
      }
      throw latestError;
    };
    var baseOpen = async (options) => {
      options = {
        wait: false,
        background: false,
        newInstance: false,
        allowNonzeroExitCode: false,
        ...options
      };
      if (Array.isArray(options.app)) {
        return pTryEach(options.app, (singleApp) => baseOpen({
          ...options,
          app: singleApp
        }));
      }
      let { name: app, arguments: appArguments = [] } = options.app || {};
      appArguments = [...appArguments];
      if (Array.isArray(app)) {
        return pTryEach(app, (appName) => baseOpen({
          ...options,
          app: {
            name: appName,
            arguments: appArguments
          }
        }));
      }
      let command;
      const cliArguments = [];
      const childProcessOptions = {};
      if (platform === "darwin") {
        command = "open";
        if (options.wait) {
          cliArguments.push("--wait-apps");
        }
        if (options.background) {
          cliArguments.push("--background");
        }
        if (options.newInstance) {
          cliArguments.push("--new");
        }
        if (app) {
          cliArguments.push("-a", app);
        }
      } else if (platform === "win32" || isWsl && !isDocker()) {
        const mountPoint = await getWslDrivesMountPoint();
        command = isWsl ? `${mountPoint}c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe` : `${process.env.SYSTEMROOT}\\System32\\WindowsPowerShell\\v1.0\\powershell`;
        cliArguments.push(
          "-NoProfile",
          "-NonInteractive",
          "\u2013ExecutionPolicy",
          "Bypass",
          "-EncodedCommand"
        );
        if (!isWsl) {
          childProcessOptions.windowsVerbatimArguments = true;
        }
        const encodedArguments = ["Start"];
        if (options.wait) {
          encodedArguments.push("-Wait");
        }
        if (app) {
          encodedArguments.push(`"\`"${app}\`""`, "-ArgumentList");
          if (options.target) {
            appArguments.unshift(options.target);
          }
        } else if (options.target) {
          encodedArguments.push(`"${options.target}"`);
        }
        if (appArguments.length > 0) {
          appArguments = appArguments.map((arg) => `"\`"${arg}\`""`);
          encodedArguments.push(appArguments.join(","));
        }
        options.target = Buffer.from(encodedArguments.join(" "), "utf16le").toString("base64");
      } else {
        if (app) {
          command = app;
        } else {
          const isBundled = !__dirname || __dirname === "/";
          let exeLocalXdgOpen = false;
          try {
            await fs.access(localXdgOpenPath, fsConstants.X_OK);
            exeLocalXdgOpen = true;
          } catch {
          }
          const useSystemXdgOpen = process.versions.electron || platform === "android" || isBundled || !exeLocalXdgOpen;
          command = useSystemXdgOpen ? "xdg-open" : localXdgOpenPath;
        }
        if (appArguments.length > 0) {
          cliArguments.push(...appArguments);
        }
        if (!options.wait) {
          childProcessOptions.stdio = "ignore";
          childProcessOptions.detached = true;
        }
      }
      if (options.target) {
        cliArguments.push(options.target);
      }
      if (platform === "darwin" && appArguments.length > 0) {
        cliArguments.push("--args", ...appArguments);
      }
      const subprocess = childProcess.spawn(command, cliArguments, childProcessOptions);
      if (options.wait) {
        return new Promise((resolve, reject) => {
          subprocess.once("error", reject);
          subprocess.once("close", (exitCode) => {
            if (options.allowNonzeroExitCode && exitCode > 0) {
              reject(new Error(`Exited with code ${exitCode}`));
              return;
            }
            resolve(subprocess);
          });
        });
      }
      subprocess.unref();
      return subprocess;
    };
    var open2 = (target, options) => {
      if (typeof target !== "string") {
        throw new TypeError("Expected a `target`");
      }
      return baseOpen({
        ...options,
        target
      });
    };
    var openApp = (name, options) => {
      if (typeof name !== "string") {
        throw new TypeError("Expected a `name`");
      }
      const { arguments: appArguments = [] } = options || {};
      if (appArguments !== void 0 && appArguments !== null && !Array.isArray(appArguments)) {
        throw new TypeError("Expected `appArguments` as Array type");
      }
      return baseOpen({
        ...options,
        app: {
          name,
          arguments: appArguments
        }
      });
    };
    function detectArchBinary(binary) {
      if (typeof binary === "string" || Array.isArray(binary)) {
        return binary;
      }
      const { [arch]: archBinary } = binary;
      if (!archBinary) {
        throw new Error(`${arch} is not supported`);
      }
      return archBinary;
    }
    function detectPlatformBinary({ [platform]: platformBinary }, { wsl }) {
      if (wsl && isWsl) {
        return detectArchBinary(wsl);
      }
      if (!platformBinary) {
        throw new Error(`${platform} is not supported`);
      }
      return detectArchBinary(platformBinary);
    }
    var apps = {};
    defineLazyProperty(apps, "chrome", () => detectPlatformBinary({
      darwin: "google chrome",
      win32: "chrome",
      linux: ["google-chrome", "google-chrome-stable", "chromium"]
    }, {
      wsl: {
        ia32: "/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe",
        x64: ["/mnt/c/Program Files/Google/Chrome/Application/chrome.exe", "/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe"]
      }
    }));
    defineLazyProperty(apps, "firefox", () => detectPlatformBinary({
      darwin: "firefox",
      win32: "C:\\Program Files\\Mozilla Firefox\\firefox.exe",
      linux: "firefox"
    }, {
      wsl: "/mnt/c/Program Files/Mozilla Firefox/firefox.exe"
    }));
    defineLazyProperty(apps, "edge", () => detectPlatformBinary({
      darwin: "microsoft edge",
      win32: "msedge",
      linux: ["microsoft-edge", "microsoft-edge-dev"]
    }, {
      wsl: "/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
    }));
    open2.apps = apps;
    open2.openApp = openApp;
    module.exports = open2;
  }
});

// src/util/config/files.ts
var import_load_json_file = __toESM(require_load_json_file(), 1);
var import_write_json_file = __toESM(require_write_json_file(), 1);
var import_client = __toESM(require_dist2(), 1);
import { join, basename, dirname } from "path";
import { accessSync, constants } from "fs";
var import_error_utils = __toESM(require_dist(), 1);
var VERCEL_DIR2 = global_path_default();
var CONFIG_FILE_PATH = join(VERCEL_DIR2, "config.json");
var AUTH_CONFIG_FILE_PATH = join(VERCEL_DIR2, "auth.json");
var readConfigFile = () => {
  const config = import_load_json_file.default.sync(CONFIG_FILE_PATH);
  return config;
};
var writeToConfigFile = (stuff) => {
  try {
    import_write_json_file.default.sync(CONFIG_FILE_PATH, stuff, { indent: 2 });
  } catch (err) {
    if ((0, import_error_utils.isErrnoException)(err)) {
      if ((0, import_error_utils.isErrnoException)(err) && err.code === "EPERM") {
        output_manager_default.error(
          `Not able to create ${highlight(
            CONFIG_FILE_PATH
          )} (operation not permitted).`
        );
        process.exit(1);
      } else if (err.code === "EBADF") {
        output_manager_default.error(
          `Not able to create ${highlight(
            CONFIG_FILE_PATH
          )} (bad file descriptor).`
        );
        process.exit(1);
      }
    }
    throw err;
  }
};
var readAuthConfigFile = () => {
  const config = import_load_json_file.default.sync(AUTH_CONFIG_FILE_PATH);
  return config;
};
var writeToAuthConfigFile = (authConfig) => {
  if (authConfig.skipWrite) {
    return;
  }
  try {
    return import_write_json_file.default.sync(AUTH_CONFIG_FILE_PATH, authConfig, {
      indent: 2,
      mode: 384
    });
  } catch (err) {
    if ((0, import_error_utils.isErrnoException)(err)) {
      if (err.code === "EPERM") {
        output_manager_default.error(
          `Not able to create ${highlight(
            AUTH_CONFIG_FILE_PATH
          )} (operation not permitted).`
        );
        process.exit(1);
      } else if (err.code === "EBADF") {
        output_manager_default.error(
          `Not able to create ${highlight(
            AUTH_CONFIG_FILE_PATH
          )} (bad file descriptor).`
        );
        process.exit(1);
      }
    }
    throw err;
  }
};
function getConfigFilePath() {
  return CONFIG_FILE_PATH;
}
function getAuthConfigFilePath() {
  return AUTH_CONFIG_FILE_PATH;
}
function readLocalConfig(prefix = process.cwd()) {
  let config = void 0;
  let target = "";
  try {
    target = getLocalPathConfig(prefix);
  } catch (err) {
    if (err instanceof NowError) {
      output_manager_default.error(err.message);
      process.exit(1);
    } else {
      throw err;
    }
  }
  if (!target) {
    return;
  }
  try {
    accessSync(target, constants.F_OK);
    config = import_load_json_file.default.sync(target);
  } catch (err) {
    if ((0, import_error_utils.isErrnoException)(err) && err.code === "ENOENT") {
    } else if ((0, import_error_utils.isError)(err) && err.name === "JSONError") {
      output_manager_default.error(err.message);
      process.exit(1);
    } else if ((0, import_error_utils.isErrnoException)(err)) {
      const code = err.code ? ` (${err.code})` : "";
      output_manager_default.error(`Failed to read config file: ${target}${code}`);
      process.exit(1);
    } else {
      output_manager_default.prettyError(err);
      process.exit(1);
    }
  }
  if (!config) {
    return;
  }
  const isCompiledConfig = basename(target) === "vercel.json" && basename(dirname(target)) === VERCEL_DIR;
  if (isCompiledConfig) {
    const workPath = dirname(dirname(target));
    let sourceFile = null;
    for (const ext of VERCEL_CONFIG_EXTENSIONS) {
      const configPath = join(workPath, `vercel.${ext}`);
      try {
        accessSync(configPath, constants.F_OK);
        sourceFile = basename(configPath);
        break;
      } catch {
      }
    }
    config[import_client.fileNameSymbol] = sourceFile || DEFAULT_VERCEL_CONFIG_FILENAME;
  } else {
    config[import_client.fileNameSymbol] = basename(target);
  }
  return config;
}

// src/util/client.ts
var import_chalk5 = __toESM(require_source(), 1);

// ../../node_modules/.pnpm/@inquirer+confirm@3.1.2/node_modules/@inquirer/confirm/dist/esm/index.mjs
var esm_default4 = createPrompt((config, done) => {
  const { transformer = (answer) => answer ? "yes" : "no" } = config;
  const [status, setStatus] = useState("pending");
  const [value, setValue] = useState("");
  const theme = makeTheme(config.theme);
  const prefix = usePrefix({ theme });
  useKeypress((key, rl) => {
    if (isEnterKey(key)) {
      let answer = config.default !== false;
      if (/^(y|yes)/i.test(value))
        answer = true;
      else if (/^(n|no)/i.test(value))
        answer = false;
      setValue(transformer(answer));
      setStatus("done");
      done(answer);
    } else {
      setValue(rl.line);
    }
  });
  let formattedValue = value;
  let defaultValue = "";
  if (status === "done") {
    formattedValue = theme.style.answer(value);
  } else {
    defaultValue = ` ${theme.style.defaultAnswer(config.default === false ? "y/N" : "Y/n")}`;
  }
  const message = theme.style.message(config.message);
  return `${prefix} ${message}${defaultValue} ${formattedValue}`;
});

// ../../node_modules/.pnpm/@inquirer+expand@2.1.2/node_modules/@inquirer/expand/dist/esm/index.mjs
var import_chalk = __toESM(require_source2(), 1);
var helpChoice = {
  key: "h",
  name: "Help, list all options",
  value: void 0
};
function getChoiceKey(choice, key) {
  if (key === "name") {
    if ("name" in choice)
      return choice.name;
    return choice.value;
  }
  if ("value" in choice)
    return choice.value;
  return choice.name;
}
var esm_default5 = createPrompt((config, done) => {
  const { choices, default: defaultKey = "h", expanded: defaultExpandState = false } = config;
  const [status, setStatus] = useState("pending");
  const [value, setValue] = useState("");
  const [expanded, setExpanded] = useState(defaultExpandState);
  const [errorMsg, setError] = useState(void 0);
  const theme = makeTheme(config.theme);
  const prefix = usePrefix({ theme });
  useKeypress((event, rl) => {
    if (isEnterKey(event)) {
      const answer = (value || defaultKey).toLowerCase();
      if (answer === "h" && !expanded) {
        setExpanded(true);
      } else {
        const selectedChoice = choices.find(({ key }) => key === answer);
        if (selectedChoice) {
          const finalValue = getChoiceKey(selectedChoice, "value");
          setValue(finalValue);
          setStatus("done");
          done(finalValue);
        } else if (value === "") {
          setError("Please input a value");
        } else {
          setError(`"${import_chalk.default.red(value)}" isn't an available option`);
        }
      }
    } else {
      setValue(rl.line);
      setError(void 0);
    }
  });
  const message = theme.style.message(config.message);
  if (status === "done") {
    return `${prefix} ${message} ${theme.style.answer(value)}`;
  }
  const allChoices = expanded ? choices : [...choices, helpChoice];
  let longChoices = "";
  let shortChoices = allChoices.map((choice) => {
    if (choice.key === defaultKey) {
      return choice.key.toUpperCase();
    }
    return choice.key;
  }).join("");
  shortChoices = ` ${theme.style.defaultAnswer(shortChoices)}`;
  if (expanded) {
    shortChoices = "";
    longChoices = allChoices.map((choice) => {
      const line = `  ${choice.key}) ${getChoiceKey(choice, "name")}`;
      if (choice.key === value.toLowerCase()) {
        return theme.style.highlight(line);
      }
      return line;
    }).join("\n");
  }
  let helpTip = "";
  const currentOption = allChoices.find(({ key }) => key === value.toLowerCase());
  if (currentOption) {
    helpTip = `${import_chalk.default.cyan(">>")} ${getChoiceKey(currentOption, "name")}`;
  }
  let error = "";
  if (errorMsg) {
    error = theme.style.error(errorMsg);
  }
  return [
    `${prefix} ${message}${shortChoices} ${value}`,
    [longChoices, helpTip, error].filter(Boolean).join("\n")
  ];
});

// ../../node_modules/.pnpm/@inquirer+input@2.1.2/node_modules/@inquirer/input/dist/esm/index.mjs
var esm_default6 = createPrompt((config, done) => {
  const { validate = () => true } = config;
  const theme = makeTheme(config.theme);
  const [status, setStatus] = useState("pending");
  const [defaultValue = "", setDefaultValue] = useState(config.default);
  const [errorMsg, setError] = useState(void 0);
  const [value, setValue] = useState("");
  const isLoading = status === "loading";
  const prefix = usePrefix({ isLoading, theme });
  useKeypress(async (key, rl) => {
    if (status !== "pending") {
      return;
    }
    if (isEnterKey(key)) {
      const answer = value || defaultValue;
      setStatus("loading");
      const isValid = await validate(answer);
      if (isValid === true) {
        setValue(answer);
        setStatus("done");
        done(answer);
      } else {
        rl.write(value);
        setError(isValid || "You must provide a valid value");
        setStatus("pending");
      }
    } else if (isBackspaceKey(key) && !value) {
      setDefaultValue(void 0);
    } else if (key.name === "tab" && !value) {
      setDefaultValue(void 0);
      rl.clearLine(0);
      rl.write(defaultValue);
      setValue(defaultValue);
    } else {
      setValue(rl.line);
      setError(void 0);
    }
  });
  const message = theme.style.message(config.message);
  let formattedValue = value;
  if (typeof config.transformer === "function") {
    formattedValue = config.transformer(value, { isFinal: status === "done" });
  } else if (status === "done") {
    formattedValue = theme.style.answer(value);
  }
  let defaultStr;
  if (defaultValue && status !== "done" && !value) {
    defaultStr = theme.style.defaultAnswer(defaultValue);
  }
  let error = "";
  if (errorMsg) {
    error = theme.style.error(errorMsg);
  }
  return [
    [prefix, message, defaultStr, formattedValue].filter((v) => v !== void 0).join(" "),
    error
  ];
});

// ../../node_modules/.pnpm/@inquirer+password@2.1.2/node_modules/@inquirer/password/dist/esm/index.mjs
var import_ansi_escapes = __toESM(require_ansi_escapes(), 1);
var esm_default7 = createPrompt((config, done) => {
  const { validate = () => true } = config;
  const theme = makeTheme(config.theme);
  const [status, setStatus] = useState("pending");
  const [errorMsg, setError] = useState(void 0);
  const [value, setValue] = useState("");
  const isLoading = status === "loading";
  const prefix = usePrefix({ isLoading, theme });
  useKeypress(async (key, rl) => {
    if (status !== "pending") {
      return;
    }
    if (isEnterKey(key)) {
      const answer = value;
      setStatus("loading");
      const isValid = await validate(answer);
      if (isValid === true) {
        setValue(answer);
        setStatus("done");
        done(answer);
      } else {
        rl.write(value);
        setError(isValid || "You must provide a valid value");
        setStatus("pending");
      }
    } else {
      setValue(rl.line);
      setError(void 0);
    }
  });
  const message = theme.style.message(config.message);
  let formattedValue = "";
  let helpTip;
  if (config.mask) {
    const maskChar = typeof config.mask === "string" ? config.mask : "*";
    formattedValue = maskChar.repeat(value.length);
  } else if (status !== "done") {
    helpTip = `${theme.style.help("[input is masked]")}${import_ansi_escapes.default.cursorHide}`;
  }
  if (status === "done") {
    formattedValue = theme.style.answer(formattedValue);
  }
  let error = "";
  if (errorMsg) {
    error = theme.style.error(errorMsg);
  }
  return [[prefix, message, formattedValue, helpTip].filter(Boolean).join(" "), error];
});

// ../../node_modules/.pnpm/@inquirer+core@9.2.1/node_modules/@inquirer/core/dist/esm/lib/key.mjs
var isEnterKey2 = (key) => key.name === "enter" || key.name === "return";

// ../../node_modules/.pnpm/@inquirer+core@9.2.1/node_modules/@inquirer/core/dist/esm/lib/errors.mjs
var AbortPromptError = class extends Error {
  constructor(options) {
    super();
    __publicField(this, "name", "AbortPromptError");
    __publicField(this, "message", "Prompt was aborted");
    this.cause = options?.cause;
  }
};
var CancelPromptError = class extends Error {
  constructor() {
    super(...arguments);
    __publicField(this, "name", "CancelPromptError");
    __publicField(this, "message", "Prompt was canceled");
  }
};
var ExitPromptError = class extends Error {
  constructor() {
    super(...arguments);
    __publicField(this, "name", "ExitPromptError");
  }
};
var HookError = class extends Error {
  constructor() {
    super(...arguments);
    __publicField(this, "name", "HookError");
  }
};
var ValidationError = class extends Error {
  constructor() {
    super(...arguments);
    __publicField(this, "name", "ValidationError");
  }
};

// ../../node_modules/.pnpm/@inquirer+core@9.2.1/node_modules/@inquirer/core/dist/esm/lib/use-prefix.mjs
import { AsyncResource as AsyncResource2 } from "async_hooks";

// ../../node_modules/.pnpm/@inquirer+core@9.2.1/node_modules/@inquirer/core/dist/esm/lib/hook-engine.mjs
import { AsyncLocalStorage, AsyncResource } from "async_hooks";
var hookStorage = new AsyncLocalStorage();
function createStore(rl) {
  const store = {
    rl,
    hooks: [],
    hooksCleanup: [],
    hooksEffect: [],
    index: 0,
    handleChange() {
    }
  };
  return store;
}
function withHooks(rl, cb) {
  const store = createStore(rl);
  return hookStorage.run(store, () => {
    function cycle(render) {
      store.handleChange = () => {
        store.index = 0;
        render();
      };
      store.handleChange();
    }
    return cb(cycle);
  });
}
function getStore() {
  const store = hookStorage.getStore();
  if (!store) {
    throw new HookError("[Inquirer] Hook functions can only be called from within a prompt");
  }
  return store;
}
function readline() {
  return getStore().rl;
}
function withUpdates(fn) {
  const wrapped = (...args) => {
    const store = getStore();
    let shouldUpdate = false;
    const oldHandleChange = store.handleChange;
    store.handleChange = () => {
      shouldUpdate = true;
    };
    const returnValue = fn(...args);
    if (shouldUpdate) {
      oldHandleChange();
    }
    store.handleChange = oldHandleChange;
    return returnValue;
  };
  return AsyncResource.bind(wrapped);
}
function withPointer(cb) {
  const store = getStore();
  const { index } = store;
  const pointer = {
    get() {
      return store.hooks[index];
    },
    set(value) {
      store.hooks[index] = value;
    },
    initialized: index in store.hooks
  };
  const returnValue = cb(pointer);
  store.index++;
  return returnValue;
}
function handleChange() {
  getStore().handleChange();
}
var effectScheduler = {
  queue(cb) {
    const store = getStore();
    const { index } = store;
    store.hooksEffect.push(() => {
      store.hooksCleanup[index]?.();
      const cleanFn = cb(readline());
      if (cleanFn != null && typeof cleanFn !== "function") {
        throw new ValidationError("useEffect return value must be a cleanup function or nothing.");
      }
      store.hooksCleanup[index] = cleanFn;
    });
  },
  run() {
    const store = getStore();
    withUpdates(() => {
      store.hooksEffect.forEach((effect) => {
        effect();
      });
      store.hooksEffect.length = 0;
    })();
  },
  clearAll() {
    const store = getStore();
    store.hooksCleanup.forEach((cleanFn) => {
      cleanFn?.();
    });
    store.hooksEffect.length = 0;
    store.hooksCleanup.length = 0;
  }
};

// ../../node_modules/.pnpm/@inquirer+core@9.2.1/node_modules/@inquirer/core/dist/esm/lib/use-state.mjs
function useState2(defaultValue) {
  return withPointer((pointer) => {
    const setFn = (newValue) => {
      if (pointer.get() !== newValue) {
        pointer.set(newValue);
        handleChange();
      }
    };
    if (pointer.initialized) {
      return [pointer.get(), setFn];
    }
    const value = typeof defaultValue === "function" ? defaultValue() : defaultValue;
    pointer.set(value);
    return [value, setFn];
  });
}

// ../../node_modules/.pnpm/@inquirer+core@9.2.1/node_modules/@inquirer/core/dist/esm/lib/use-effect.mjs
function useEffect(cb, depArray) {
  withPointer((pointer) => {
    const oldDeps = pointer.get();
    const hasChanged = !Array.isArray(oldDeps) || depArray.some((dep, i) => !Object.is(dep, oldDeps[i]));
    if (hasChanged) {
      effectScheduler.queue(cb);
    }
    pointer.set(depArray);
  });
}

// ../../node_modules/.pnpm/@inquirer+core@9.2.1/node_modules/@inquirer/core/dist/esm/lib/theme.mjs
var import_yoctocolors_cjs = __toESM(require_yoctocolors_cjs(), 1);
var defaultTheme = {
  prefix: {
    idle: import_yoctocolors_cjs.default.blue("?"),
    // TODO: use figure
    done: import_yoctocolors_cjs.default.green(esm_default.tick)
  },
  spinner: {
    interval: 80,
    frames: ["\u280B", "\u2819", "\u2839", "\u2838", "\u283C", "\u2834", "\u2826", "\u2827", "\u2807", "\u280F"].map((frame) => import_yoctocolors_cjs.default.yellow(frame))
  },
  style: {
    answer: import_yoctocolors_cjs.default.cyan,
    message: import_yoctocolors_cjs.default.bold,
    error: (text) => import_yoctocolors_cjs.default.red(`> ${text}`),
    defaultAnswer: (text) => import_yoctocolors_cjs.default.dim(`(${text})`),
    help: import_yoctocolors_cjs.default.dim,
    highlight: import_yoctocolors_cjs.default.cyan,
    key: (text) => import_yoctocolors_cjs.default.cyan(import_yoctocolors_cjs.default.bold(`<${text}>`))
  }
};

// ../../node_modules/.pnpm/@inquirer+core@9.2.1/node_modules/@inquirer/core/dist/esm/lib/make-theme.mjs
function isPlainObject(value) {
  if (typeof value !== "object" || value === null)
    return false;
  let proto = value;
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }
  return Object.getPrototypeOf(value) === proto;
}
function deepMerge(...objects) {
  const output = {};
  for (const obj of objects) {
    for (const [key, value] of Object.entries(obj)) {
      const prevValue = output[key];
      output[key] = isPlainObject(prevValue) && isPlainObject(value) ? deepMerge(prevValue, value) : value;
    }
  }
  return output;
}
function makeTheme2(...themes) {
  const themesToMerge = [
    defaultTheme,
    ...themes.filter((theme) => theme != null)
  ];
  return deepMerge(...themesToMerge);
}

// ../../node_modules/.pnpm/@inquirer+core@9.2.1/node_modules/@inquirer/core/dist/esm/lib/use-prefix.mjs
function usePrefix2({ status = "idle", theme }) {
  const [showLoader, setShowLoader] = useState2(false);
  const [tick, setTick] = useState2(0);
  const { prefix, spinner } = makeTheme2(theme);
  useEffect(() => {
    if (status === "loading") {
      let tickInterval;
      let inc = -1;
      const delayTimeout = setTimeout(AsyncResource2.bind(() => {
        setShowLoader(true);
        tickInterval = setInterval(AsyncResource2.bind(() => {
          inc = inc + 1;
          setTick(inc % spinner.frames.length);
        }), spinner.interval);
      }), 300);
      return () => {
        clearTimeout(delayTimeout);
        clearInterval(tickInterval);
      };
    } else {
      setShowLoader(false);
    }
  }, [status]);
  if (showLoader) {
    return spinner.frames[tick];
  }
  const iconName = status === "loading" ? "idle" : status;
  return typeof prefix === "string" ? prefix : prefix[iconName];
}

// ../../node_modules/.pnpm/@inquirer+core@9.2.1/node_modules/@inquirer/core/dist/esm/lib/use-memo.mjs
function useMemo(fn, dependencies) {
  return withPointer((pointer) => {
    const prev = pointer.get();
    if (!prev || prev.dependencies.length !== dependencies.length || prev.dependencies.some((dep, i) => dep !== dependencies[i])) {
      const value = fn();
      pointer.set({ value, dependencies });
      return value;
    }
    return prev.value;
  });
}

// ../../node_modules/.pnpm/@inquirer+core@9.2.1/node_modules/@inquirer/core/dist/esm/lib/use-ref.mjs
function useRef(val) {
  return useState2({ current: val })[0];
}

// ../../node_modules/.pnpm/@inquirer+core@9.2.1/node_modules/@inquirer/core/dist/esm/lib/use-keypress.mjs
function useKeypress2(userHandler) {
  const signal = useRef(userHandler);
  signal.current = userHandler;
  useEffect((rl) => {
    let ignore = false;
    const handler = withUpdates((_input, event) => {
      if (ignore)
        return;
      void signal.current(event, rl);
    });
    rl.input.on("keypress", handler);
    return () => {
      ignore = true;
      rl.input.removeListener("keypress", handler);
    };
  }, []);
}

// ../../node_modules/.pnpm/@inquirer+core@9.2.1/node_modules/@inquirer/core/dist/esm/lib/utils.mjs
var import_cli_width = __toESM(require_cli_width(), 1);
var import_wrap_ansi = __toESM(require_wrap_ansi(), 1);
function breakLines(content, width) {
  return content.split("\n").flatMap((line) => (0, import_wrap_ansi.default)(line, width, { trim: false, hard: true }).split("\n").map((str) => str.trimEnd())).join("\n");
}
function readlineWidth() {
  return (0, import_cli_width.default)({ defaultWidth: 80, output: readline().output });
}

// ../../node_modules/.pnpm/@inquirer+core@9.2.1/node_modules/@inquirer/core/dist/esm/lib/pagination/lines.mjs
function split(content, width) {
  return breakLines(content, width).split("\n");
}
function rotate(count, items) {
  const max = items.length;
  const offset = (count % max + max) % max;
  return [...items.slice(offset), ...items.slice(0, offset)];
}
function lines({ items, width, renderItem, active, position: requested, pageSize }) {
  const layouts = items.map((item, index) => ({
    item,
    index,
    isActive: index === active
  }));
  const layoutsInPage = rotate(active - requested, layouts).slice(0, pageSize);
  const renderItemAt = (index) => layoutsInPage[index] == null ? [] : split(renderItem(layoutsInPage[index]), width);
  const pageBuffer = Array.from({ length: pageSize });
  const activeItem = renderItemAt(requested).slice(0, pageSize);
  const position = requested + activeItem.length <= pageSize ? requested : pageSize - activeItem.length;
  pageBuffer.splice(position, activeItem.length, ...activeItem);
  let bufferPointer = position + activeItem.length;
  let layoutPointer = requested + 1;
  while (bufferPointer < pageSize && layoutPointer < layoutsInPage.length) {
    for (const line of renderItemAt(layoutPointer)) {
      pageBuffer[bufferPointer++] = line;
      if (bufferPointer >= pageSize)
        break;
    }
    layoutPointer++;
  }
  bufferPointer = position - 1;
  layoutPointer = requested - 1;
  while (bufferPointer >= 0 && layoutPointer >= 0) {
    for (const line of renderItemAt(layoutPointer).reverse()) {
      pageBuffer[bufferPointer--] = line;
      if (bufferPointer < 0)
        break;
    }
    layoutPointer--;
  }
  return pageBuffer.filter((line) => typeof line === "string");
}

// ../../node_modules/.pnpm/@inquirer+core@9.2.1/node_modules/@inquirer/core/dist/esm/lib/pagination/position.mjs
function finite({ active, pageSize, total }) {
  const middle = Math.floor(pageSize / 2);
  if (total <= pageSize || active < middle)
    return active;
  if (active >= total - middle)
    return active + pageSize - total;
  return middle;
}
function infinite({ active, lastActive, total, pageSize, pointer }) {
  if (total <= pageSize)
    return active;
  if (lastActive < active && active - lastActive < pageSize) {
    return Math.min(Math.floor(pageSize / 2), pointer + active - lastActive);
  }
  return pointer;
}

// ../../node_modules/.pnpm/@inquirer+core@9.2.1/node_modules/@inquirer/core/dist/esm/lib/pagination/use-pagination.mjs
function usePagination({ items, active, renderItem, pageSize, loop = true }) {
  const state = useRef({ position: 0, lastActive: 0 });
  const position = loop ? infinite({
    active,
    lastActive: state.current.lastActive,
    total: items.length,
    pageSize,
    pointer: state.current.position
  }) : finite({
    active,
    total: items.length,
    pageSize
  });
  state.current.position = position;
  state.current.lastActive = active;
  return lines({
    items,
    width: readlineWidth(),
    renderItem,
    active,
    position,
    pageSize
  }).join("\n");
}

// ../../node_modules/.pnpm/@inquirer+core@9.2.1/node_modules/@inquirer/core/dist/esm/lib/create-prompt.mjs
var import_mute_stream = __toESM(require_lib(), 1);
import * as readline2 from "readline";
import { AsyncResource as AsyncResource3 } from "async_hooks";

// ../../node_modules/.pnpm/@inquirer+core@9.2.1/node_modules/@inquirer/core/dist/esm/lib/screen-manager.mjs
var import_strip_ansi = __toESM(require_strip_ansi(), 1);
var import_ansi_escapes2 = __toESM(require_ansi_escapes(), 1);
var height = (content) => content.split("\n").length;
var lastLine = (content) => content.split("\n").pop() ?? "";
function cursorDown(n) {
  return n > 0 ? import_ansi_escapes2.default.cursorDown(n) : "";
}
var ScreenManager = class {
  constructor(rl) {
    __publicField(this, "rl");
    // These variables are keeping information to allow correct prompt re-rendering
    __publicField(this, "height", 0);
    __publicField(this, "extraLinesUnderPrompt", 0);
    __publicField(this, "cursorPos");
    this.rl = rl;
    this.rl = rl;
    this.cursorPos = rl.getCursorPos();
  }
  write(content) {
    this.rl.output.unmute();
    this.rl.output.write(content);
    this.rl.output.mute();
  }
  render(content, bottomContent = "") {
    const promptLine = lastLine(content);
    const rawPromptLine = (0, import_strip_ansi.default)(promptLine);
    let prompt = rawPromptLine;
    if (this.rl.line.length > 0) {
      prompt = prompt.slice(0, -this.rl.line.length);
    }
    this.rl.setPrompt(prompt);
    this.cursorPos = this.rl.getCursorPos();
    const width = readlineWidth();
    content = breakLines(content, width);
    bottomContent = breakLines(bottomContent, width);
    if (rawPromptLine.length % width === 0) {
      content += "\n";
    }
    let output = content + (bottomContent ? "\n" + bottomContent : "");
    const promptLineUpDiff = Math.floor(rawPromptLine.length / width) - this.cursorPos.rows;
    const bottomContentHeight = promptLineUpDiff + (bottomContent ? height(bottomContent) : 0);
    if (bottomContentHeight > 0)
      output += import_ansi_escapes2.default.cursorUp(bottomContentHeight);
    output += import_ansi_escapes2.default.cursorTo(this.cursorPos.cols);
    this.write(cursorDown(this.extraLinesUnderPrompt) + import_ansi_escapes2.default.eraseLines(this.height) + output);
    this.extraLinesUnderPrompt = bottomContentHeight;
    this.height = height(output);
  }
  checkCursorPos() {
    const cursorPos = this.rl.getCursorPos();
    if (cursorPos.cols !== this.cursorPos.cols) {
      this.write(import_ansi_escapes2.default.cursorTo(cursorPos.cols));
      this.cursorPos = cursorPos;
    }
  }
  done({ clearContent }) {
    this.rl.setPrompt("");
    let output = cursorDown(this.extraLinesUnderPrompt);
    output += clearContent ? import_ansi_escapes2.default.eraseLines(this.height) : "\n";
    output += import_ansi_escapes2.default.cursorShow;
    this.write(output);
    this.rl.close();
  }
};

// ../../node_modules/.pnpm/@inquirer+core@9.2.1/node_modules/@inquirer/core/dist/esm/lib/promise-polyfill.mjs
var PromisePolyfill = class extends Promise {
  // Available starting from Node 22
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/withResolvers
  static withResolver() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  }
};

// ../../node_modules/.pnpm/@inquirer+core@9.2.1/node_modules/@inquirer/core/dist/esm/lib/create-prompt.mjs
function createPrompt2(view) {
  const prompt = (config, context = {}) => {
    const { input = process.stdin, signal } = context;
    const cleanups = /* @__PURE__ */ new Set();
    const output = new import_mute_stream.default();
    output.pipe(context.output ?? process.stdout);
    const rl = readline2.createInterface({
      terminal: true,
      input,
      output
    });
    const screen = new ScreenManager(rl);
    const { promise, resolve, reject } = PromisePolyfill.withResolver();
    const cancel = () => reject(new CancelPromptError());
    if (signal) {
      const abort = () => reject(new AbortPromptError({ cause: signal.reason }));
      if (signal.aborted) {
        abort();
        return Object.assign(promise, { cancel });
      }
      signal.addEventListener("abort", abort);
      cleanups.add(() => signal.removeEventListener("abort", abort));
    }
    cleanups.add(onExit((code, signal2) => {
      reject(new ExitPromptError(`User force closed the prompt with ${code} ${signal2}`));
    }));
    const checkCursorPos = () => screen.checkCursorPos();
    rl.input.on("keypress", checkCursorPos);
    cleanups.add(() => rl.input.removeListener("keypress", checkCursorPos));
    return withHooks(rl, (cycle) => {
      const hooksCleanup = AsyncResource3.bind(() => effectScheduler.clearAll());
      rl.on("close", hooksCleanup);
      cleanups.add(() => rl.removeListener("close", hooksCleanup));
      cycle(() => {
        try {
          const nextView = view(config, (value) => {
            setImmediate(() => resolve(value));
          });
          const [content, bottomContent] = typeof nextView === "string" ? [nextView] : nextView;
          screen.render(content, bottomContent);
          effectScheduler.run();
        } catch (error) {
          reject(error);
        }
      });
      return Object.assign(promise.then((answer) => {
        effectScheduler.clearAll();
        return answer;
      }, (error) => {
        effectScheduler.clearAll();
        throw error;
      }).finally(() => {
        cleanups.forEach((cleanup) => cleanup());
        screen.done({ clearContent: Boolean(context?.clearPromptOnDone) });
        output.end();
      }).then(() => promise), { cancel });
    });
  };
  return prompt;
}

// ../../node_modules/.pnpm/@inquirer+core@9.2.1/node_modules/@inquirer/core/dist/esm/lib/Separator.mjs
var import_yoctocolors_cjs2 = __toESM(require_yoctocolors_cjs(), 1);
var Separator = class {
  constructor(separator) {
    __publicField(this, "separator", import_yoctocolors_cjs2.default.dim(Array.from({ length: 15 }).join(esm_default.line)));
    __publicField(this, "type", "separator");
    if (separator) {
      this.separator = separator;
    }
  }
  static isSeparator(choice) {
    return Boolean(choice && typeof choice === "object" && "type" in choice && choice.type === "separator");
  }
};

// ../../node_modules/.pnpm/@inquirer+search@2.0.1/node_modules/@inquirer/search/dist/esm/index.mjs
var import_yoctocolors_cjs3 = __toESM(require_yoctocolors_cjs(), 1);
var searchTheme = {
  icon: { cursor: esm_default.pointer },
  style: {
    disabled: (text) => import_yoctocolors_cjs3.default.dim(`- ${text}`),
    searchTerm: (text) => import_yoctocolors_cjs3.default.cyan(text),
    description: (text) => import_yoctocolors_cjs3.default.cyan(text)
  },
  helpMode: "auto"
};
function isSelectable(item) {
  return !Separator.isSeparator(item) && !item.disabled;
}
function normalizeChoices(choices) {
  return choices.map((choice) => {
    if (Separator.isSeparator(choice))
      return choice;
    if (typeof choice === "string") {
      return {
        value: choice,
        name: choice,
        short: choice,
        disabled: false
      };
    }
    const name = choice.name ?? String(choice.value);
    return {
      value: choice.value,
      name,
      description: choice.description,
      short: choice.short ?? name,
      disabled: choice.disabled ?? false
    };
  });
}
var esm_default8 = createPrompt2((config, done) => {
  const { pageSize = 7, validate = () => true } = config;
  const theme = makeTheme2(searchTheme, config.theme);
  const firstRender = useRef(true);
  const [status, setStatus] = useState2("loading");
  const [searchTerm, setSearchTerm] = useState2("");
  const [searchResults, setSearchResults] = useState2([]);
  const [searchError, setSearchError] = useState2();
  const prefix = usePrefix2({ status, theme });
  const bounds = useMemo(() => {
    const first = searchResults.findIndex(isSelectable);
    const last = searchResults.findLastIndex(isSelectable);
    return { first, last };
  }, [searchResults]);
  const [active = bounds.first, setActive] = useState2();
  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    setSearchError(void 0);
    const fetchResults = async () => {
      try {
        const results = await config.source(searchTerm || void 0, {
          signal: controller.signal
        });
        if (!controller.signal.aborted) {
          setActive(void 0);
          setSearchError(void 0);
          setSearchResults(normalizeChoices(results));
          setStatus("idle");
        }
      } catch (error2) {
        if (!controller.signal.aborted && error2 instanceof Error) {
          setSearchError(error2.message);
        }
      }
    };
    void fetchResults();
    return () => {
      controller.abort();
    };
  }, [searchTerm]);
  const selectedChoice = searchResults[active];
  useKeypress2(async (key, rl) => {
    if (isEnterKey2(key)) {
      if (selectedChoice) {
        setStatus("loading");
        const isValid = await validate(selectedChoice.value);
        setStatus("idle");
        if (isValid === true) {
          setStatus("done");
          done(selectedChoice.value);
        } else if (selectedChoice.name === searchTerm) {
          setSearchError(isValid || "You must provide a valid value");
        } else {
          rl.write(selectedChoice.name);
          setSearchTerm(selectedChoice.name);
        }
      } else {
        rl.write(searchTerm);
      }
    } else if (key.name === "tab" && selectedChoice) {
      rl.clearLine(0);
      rl.write(selectedChoice.name);
      setSearchTerm(selectedChoice.name);
    } else if (status !== "loading" && (key.name === "up" || key.name === "down")) {
      rl.clearLine(0);
      if (key.name === "up" && active !== bounds.first || key.name === "down" && active !== bounds.last) {
        const offset = key.name === "up" ? -1 : 1;
        let next = active;
        do {
          next = (next + offset + searchResults.length) % searchResults.length;
        } while (!isSelectable(searchResults[next]));
        setActive(next);
      }
    } else {
      setSearchTerm(rl.line);
    }
  });
  const message = theme.style.message(config.message, status);
  if (active > 0) {
    firstRender.current = false;
  }
  let helpTip = "";
  if (searchResults.length > 1 && (theme.helpMode === "always" || theme.helpMode === "auto" && firstRender.current)) {
    helpTip = searchResults.length > pageSize ? `
${theme.style.help("(Use arrow keys to reveal more choices)")}` : `
${theme.style.help("(Use arrow keys)")}`;
  }
  const page = usePagination({
    items: searchResults,
    active,
    renderItem({ item, isActive }) {
      if (Separator.isSeparator(item)) {
        return ` ${item.separator}`;
      }
      if (item.disabled) {
        const disabledLabel = typeof item.disabled === "string" ? item.disabled : "(disabled)";
        return theme.style.disabled(`${item.name} ${disabledLabel}`);
      }
      const color = isActive ? theme.style.highlight : (x) => x;
      const cursor = isActive ? theme.icon.cursor : ` `;
      return color(`${cursor} ${item.name}`);
    },
    pageSize,
    loop: false
  });
  let error;
  if (searchError) {
    error = theme.style.error(searchError);
  } else if (searchResults.length === 0 && searchTerm !== "" && status === "idle") {
    error = theme.style.error("No results found");
  }
  let searchStr;
  if (status === "done" && selectedChoice) {
    const answer = selectedChoice.short ?? selectedChoice.name;
    return `${prefix} ${message} ${theme.style.answer(answer)}`;
  } else {
    searchStr = theme.style.searchTerm(searchTerm);
  }
  const choiceDescription = selectedChoice?.description ? `
${theme.style.description(selectedChoice.description)}` : ``;
  return [
    [prefix, message, searchStr].filter(Boolean).join(" "),
    `${error ?? page}${helpTip}${choiceDescription}`
  ];
});

// src/util/client.ts
var import_async_retry = __toESM(require_dist3(), 1);
var import_node_fetch2 = __toESM(require_lib2(), 1);
import { EventEmitter } from "events";
import { URL as URL2 } from "url";

// src/util/response-error.ts
async function responseError(res, fallbackMessage = null, parsedBody = {}) {
  let bodyError;
  if (!res.ok) {
    let body;
    try {
      body = await res.json();
    } catch (_err) {
      body = parsedBody;
    }
    bodyError = body.error || body.err || body;
  }
  const msg = bodyError?.message || fallbackMessage || "Response Error";
  return new APIError(msg, res, bodyError);
}

// src/util/print-indications.ts
var import_chalk2 = __toESM(require_source(), 1);
function printIndications(res) {
  const indications = /* @__PURE__ */ new Set(["warning", "notice", "tip"]);
  const regex = /^x-(?:vercel|now)-(warning|notice|tip)-(.*)$/;
  for (const [name, payload] of res.headers) {
    const match = name.match(regex);
    if (match) {
      const [, type, identifier] = match;
      const action = res.headers.get(`x-vercel-action-${identifier}`);
      const link = res.headers.get(`x-vercel-link-${identifier}`);
      if (indications.has(type)) {
        const newline = "\n";
        const message = prependEmoji(import_chalk2.default.dim(payload), emoji(type)) + newline;
        let finalLink = "";
        if (link) {
          finalLink = import_chalk2.default.dim(`${action || "Learn More"}: ${link_default(link)}`) + newline;
        }
        output_manager_default.print(message + finalLink);
      }
    }
  }
}

// src/util/login/reauthenticate.ts
var import_chalk4 = __toESM(require_source(), 1);

// src/commands/login/future.ts
var import_chalk3 = __toESM(require_source(), 1);
var open = __toESM(require_open(), 1);
var import_ansi_escapes3 = __toESM(require_ansi_escapes(), 1);
import readline3 from "readline";
import { KNOWN_AGENTS } from "@vercel/detect-agent";

// src/util/login/update-current-team-after-login.ts
async function updateCurrentTeamAfterLogin(client, ssoTeamId) {
  if (ssoTeamId) {
    client.config.currentTeam = ssoTeamId;
  } else {
    let user = null;
    try {
      user = await getUser(client);
    } catch (_err) {
      output_manager_default.error("Failed to fetch the logged in user. Please try again.");
      return 1;
    }
    if (user.version === "northstar" && user.defaultTeamId) {
      client.config.currentTeam = user.defaultTeamId;
    } else {
      delete client.config.currentTeam;
    }
  }
}

// src/util/oauth.ts
var import_node_fetch = __toESM(require_lib2(), 1);
import { hostname } from "os";
var VERCEL_ISSUER = new URL("https://vercel.com");
var VERCEL_CLI_CLIENT_ID = "cl_HYyOPBNtFMfHhaUn9L4QPfTZz6TP47bp";
var userAgent = `${hostname()} @ ${ua_default}`;
var _as;
async function as() {
  if (!_as) {
    const discoveryResponse = await discoveryEndpointRequest(VERCEL_ISSUER);
    const [discoveryResponseError, as2] = await processDiscoveryEndpointResponse(discoveryResponse);
    if (discoveryResponseError) {
      throw discoveryResponseError;
    }
    _as = as2;
  }
  return _as;
}
async function discoveryEndpointRequest(issuer) {
  return await (0, import_node_fetch.default)(new URL(".well-known/openid-configuration", issuer), {
    headers: { "Content-Type": "application/json", "user-agent": userAgent }
  });
}
async function processDiscoveryEndpointResponse(response) {
  const json = await response.json();
  if (!response.ok) {
    return [new Error("Discovery endpoint request failed")];
  }
  if (typeof json !== "object" || json === null || !canParseURL(json.issuer) || !canParseURL(json.device_authorization_endpoint) || !canParseURL(json.token_endpoint) || !canParseURL(json.revocation_endpoint) || !canParseURL(json.jwks_uri) || !canParseURL(json.introspection_endpoint)) {
    return [new TypeError("Invalid discovery response")];
  }
  const issuer = new URL(json.issuer);
  if (issuer.href !== VERCEL_ISSUER.href) {
    return [new Error("Issuer mismatch")];
  }
  return [
    null,
    {
      issuer,
      device_authorization_endpoint: new URL(
        json.device_authorization_endpoint
      ),
      token_endpoint: new URL(json.token_endpoint),
      revocation_endpoint: new URL(json.revocation_endpoint),
      jwks_uri: new URL(json.jwks_uri),
      introspection_endpoint: new URL(json.introspection_endpoint)
    }
  ];
}
async function deviceAuthorizationRequest() {
  return await (0, import_node_fetch.default)((await as()).device_authorization_endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "user-agent": userAgent
    },
    body: new URLSearchParams({
      client_id: VERCEL_CLI_CLIENT_ID,
      scope: "openid offline_access"
    })
  });
}
async function processDeviceAuthorizationResponse(response) {
  const json = await response.json();
  if (!response.ok) {
    return [new OAuthError("Device authorization request failed", json)];
  }
  if (typeof json !== "object" || json === null)
    return [new TypeError("Expected response to be an object")];
  if (!("device_code" in json) || typeof json.device_code !== "string")
    return [new TypeError("Expected `device_code` to be a string")];
  if (!("user_code" in json) || typeof json.user_code !== "string")
    return [new TypeError("Expected `user_code` to be a string")];
  if (!("verification_uri" in json) || typeof json.verification_uri !== "string" || !canParseURL(json.verification_uri)) {
    return [new TypeError("Expected `verification_uri` to be a string")];
  }
  if (!("verification_uri_complete" in json) || typeof json.verification_uri_complete !== "string" || !canParseURL(json.verification_uri_complete)) {
    return [
      new TypeError("Expected `verification_uri_complete` to be a string")
    ];
  }
  if (!("expires_in" in json) || typeof json.expires_in !== "number")
    return [new TypeError("Expected `expires_in` to be a number")];
  if (!("interval" in json) || typeof json.interval !== "number")
    return [new TypeError("Expected `interval` to be a number")];
  return [
    null,
    {
      device_code: json.device_code,
      user_code: json.user_code,
      verification_uri: json.verification_uri,
      verification_uri_complete: json.verification_uri_complete,
      expiresAt: Date.now() + json.expires_in * 1e3,
      interval: json.interval
    }
  ];
}
async function deviceAccessTokenRequest(options) {
  try {
    return [
      null,
      await (0, import_node_fetch.default)((await as()).token_endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "user-agent": userAgent
        },
        body: new URLSearchParams({
          client_id: VERCEL_CLI_CLIENT_ID,
          grant_type: "urn:ietf:params:oauth:grant-type:device_code",
          ...options
        }),
        // TODO: Drop `node-fetch` and just use `signal`
        timeout: 10 * 1e3,
        // @ts-expect-error: Signal is part of `fetch` spec, should drop `node-fetch`
        signal: AbortSignal.timeout(10 * 1e3)
      })
    ];
  } catch (error) {
    if (error instanceof Error)
      return [error];
    return [
      new Error("An unknown error occurred. See the logs for details.", {
        cause: error
      })
    ];
  }
}
async function processTokenResponse(response) {
  const json = await response.json();
  if (!response.ok) {
    return [new OAuthError("Device access token request failed", json)];
  }
  if (typeof json !== "object" || json === null)
    return [new TypeError("Expected response to be an object")];
  if (!("access_token" in json) || typeof json.access_token !== "string")
    return [new TypeError("Expected `access_token` to be a string")];
  if (!("token_type" in json) || json.token_type !== "Bearer")
    return [new TypeError('Expected `token_type` to be "Bearer"')];
  if (!("expires_in" in json) || typeof json.expires_in !== "number")
    return [new TypeError("Expected `expires_in` to be a number")];
  if ("refresh_token" in json && (typeof json.refresh_token !== "string" || !json.refresh_token))
    return [new TypeError("Expected `refresh_token` to be a string")];
  if ("scope" in json && typeof json.scope !== "string")
    return [new TypeError("Expected `scope` to be a string")];
  return [null, json];
}
async function revocationRequest(options) {
  return await (0, import_node_fetch.default)((await as()).revocation_endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "user-agent": userAgent
    },
    body: new URLSearchParams({ ...options, client_id: VERCEL_CLI_CLIENT_ID })
  });
}
async function processRevocationResponse(response) {
  if (response.ok)
    return [null, null];
  const json = await response.json();
  return [new OAuthError("Revocation request failed", json)];
}
async function refreshTokenRequest(options) {
  return await (0, import_node_fetch.default)((await as()).token_endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "user-agent": userAgent
    },
    body: new URLSearchParams({
      client_id: VERCEL_CLI_CLIENT_ID,
      grant_type: "refresh_token",
      ...options
    })
  });
}
function processOAuthErrorResponse(json) {
  if (typeof json !== "object" || json === null)
    return new TypeError("Expected response to be an object");
  if (!("error" in json) || typeof json.error !== "string")
    return new TypeError("Expected `error` to be a string");
  if ("error_description" in json && typeof json.error_description !== "string")
    return new TypeError("Expected `error_description` to be a string");
  if ("error_uri" in json && typeof json.error_uri !== "string")
    return new TypeError("Expected `error_uri` to be a string");
  return json;
}
var OAuthError = class extends Error {
  constructor(message, response) {
    var __super = (...args) => {
      super(...args);
    };
    const error = processOAuthErrorResponse(response);
    if (error instanceof TypeError) {
      const message2 = `Unexpected server response: ${JSON.stringify(response)}`;
      __super(message2);
      this.cause = new Error(message2, { cause: error });
      this.code = "server_error";
      return;
    }
    let cause = error.error;
    if (error.error_description)
      cause += `: ${error.error_description}`;
    if (error.error_uri)
      cause += ` (${error.error_uri})`;
    __super(message, { cause });
    this.cause = new Error(cause);
    this.code = error.error;
  }
};
function isOAuthError(error) {
  return error instanceof OAuthError;
}
function canParseURL(url) {
  try {
    return !!new URL(url);
  } catch {
    return false;
  }
}

// src/commands/login/future.ts
async function performDeviceCodeFlow(client, options) {
  const deviceAuthorizationResponse = await deviceAuthorizationRequest();
  output_manager_default.debug(
    `'Device Authorization response:', ${await deviceAuthorizationResponse.clone().text()}`
  );
  const [deviceAuthorizationError, deviceAuthorization] = await processDeviceAuthorizationResponse(deviceAuthorizationResponse);
  if (deviceAuthorizationError) {
    printError(deviceAuthorizationError);
    return null;
  }
  const { device_code, user_code, verification_uri, expiresAt, interval } = deviceAuthorization;
  let { verification_uri_complete } = deviceAuthorization;
  if (options?.teamId) {
    const url = new URL(verification_uri_complete);
    url.searchParams.set("team_id", options.teamId);
    verification_uri_complete = url.toString();
  }
  const isCursorAgent = client.agentName === KNOWN_AGENTS.CURSOR || client.agentName === KNOWN_AGENTS.CURSOR_CLI;
  const shouldSkipBrowser = process.env.CI && !isCursorAgent;
  output_manager_default.log(
    `
  Visit ${import_chalk3.default.bold(
      output_manager_default.link(
        verification_uri.replace("https://", ""),
        verification_uri_complete,
        { color: false, fallback: () => verification_uri_complete }
      )
    )}${output_manager_default.supportsHyperlink ? ` and enter ${import_chalk3.default.bold(user_code)}` : ""}
`
  );
  if (!shouldSkipBrowser) {
    try {
      const browserProcess = await open.default(verification_uri_complete);
      browserProcess.on("error", (error) => {
        output_manager_default.debug(`Failed to open browser: ${error}`);
      });
    } catch (error) {
      output_manager_default.debug(`Failed to open browser: ${error}`);
      if (client.isAgent && client.nonInteractive) {
        output_manager_default.log(
          `
${import_chalk3.default.yellow("\u26A0")} ${import_chalk3.default.bold("Browser could not be opened automatically.")}
`
        );
        output_manager_default.log(
          `Please ask the user to manually visit the URL above and complete the authentication process.
`
        );
      }
    }
  }
  const rl = readline3.createInterface({
    input: process.stdin,
    output: process.stdout
  }).on("SIGINT", () => {
    process.exit(0);
  });
  output_manager_default.spinner("Waiting for authentication...");
  let intervalMs = interval * 1e3;
  let result = null;
  let flowError = new Error(
    "Timed out waiting for authentication. Please try again."
  );
  async function pollForToken() {
    while (Date.now() < expiresAt) {
      const [tokenResponseError, tokenResponse] = await deviceAccessTokenRequest({ device_code });
      if (tokenResponseError) {
        if (tokenResponseError.message.includes("timeout")) {
          intervalMs *= 2;
          output_manager_default.debug(
            `Connection timeout. Slowing down, polling every ${intervalMs / 1e3}s...`
          );
          await wait(intervalMs);
          continue;
        }
        return tokenResponseError;
      }
      output_manager_default.debug(
        `'Device Access Token response:', ${await tokenResponse.clone().text()}`
      );
      const [tokensError, tokens] = await processTokenResponse(tokenResponse);
      if (isOAuthError(tokensError)) {
        const { code } = tokensError;
        switch (code) {
          case "authorization_pending":
            await wait(intervalMs);
            continue;
          case "slow_down":
            intervalMs += 5 * 1e3;
            output_manager_default.debug(
              `Authorization server requests to slow down. Polling every ${intervalMs / 1e3}s...`
            );
            await wait(intervalMs);
            continue;
          default:
            return tokensError.cause;
        }
      }
      if (tokensError)
        return tokensError;
      output_manager_default.print((0, import_ansi_escapes3.eraseLines)(2));
      result = {
        access_token: tokens.access_token,
        expires_in: tokens.expires_in,
        refresh_token: tokens.refresh_token
      };
      return;
    }
  }
  flowError = await pollForToken();
  output_manager_default.stopSpinner();
  rl.close();
  if (flowError) {
    printError(flowError);
    return null;
  }
  return result;
}
async function login(client, telemetry) {
  const tokens = await performDeviceCodeFlow(client);
  if (!tokens) {
    telemetry.trackState("error");
    return 1;
  }
  const isInitialLogin = !client.authConfig.token;
  client.updateAuthConfig({
    token: tokens.access_token,
    expiresAt: Math.floor(Date.now() / 1e3) + tokens.expires_in,
    refreshToken: tokens.refresh_token
  });
  client.updateConfig({ currentTeam: void 0 });
  if (isInitialLogin) {
    await updateCurrentTeamAfterLogin(client);
  }
  client.writeToAuthConfigFile();
  client.writeToConfigFile();
  output_manager_default.debug(`Saved credentials in "${humanizePath(global_path_default())}"`);
  output_manager_default.print(`
  ${import_chalk3.default.cyan("Congratulations!")} You are now signed in.

  To deploy something, run ${getCommandName()}.

  ${emoji("tip")} To deploy every commit automatically,
  connect a Git Repository (${import_chalk3.default.bold(output_manager_default.link("vercel.link/git", "https://vercel.link/git", { color: false }))}).
`);
  telemetry.trackState("success");
  await autoInstallAgentTooling(client);
  return 0;
}
async function wait(intervalMs) {
  await new Promise((resolve) => setTimeout(resolve, intervalMs));
}

// src/util/login/reauthenticate.ts
async function reauthenticate(client, error) {
  if (error.teamId && error.enforced) {
    output_manager_default.log(
      `You must re-authenticate with SAML to use ${(0, import_chalk4.bold)(error.scope)} scope.`
    );
  } else {
    output_manager_default.log(`You must re-authenticate to use ${(0, import_chalk4.bold)(error.scope)} scope.`);
  }
  const tokens = await performDeviceCodeFlow(client, {
    teamId: error.teamId || void 0
  });
  if (!tokens) {
    return 1;
  }
  client.updateAuthConfig({
    token: tokens.access_token,
    expiresAt: Math.floor(Date.now() / 1e3) + tokens.expires_in,
    refreshToken: tokens.refresh_token
  });
  client.writeToAuthConfigFile();
  output_manager_default.success(`Authentication complete for ${(0, import_chalk4.bold)(error.scope)} scope.`);
  return { token: tokens.access_token, email: "" };
}

// src/util/promise.ts
function sharedPromise(fn) {
  let promise = null;
  return function(...args) {
    if (!promise) {
      promise = fn.apply(this, args);
      promise.finally(() => {
        promise = null;
      });
    }
    return promise;
  };
}

// src/util/client.ts
var import_error_utils2 = __toESM(require_dist(), 1);

// src/util/sleep.ts
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// src/util/client.ts
var isSAMLError = (v) => {
  return v && v.saml;
};
var isJSONObject = (v) => {
  return v && typeof v == "object" && v.constructor === Object;
};
function isValidAccessToken(authConfig) {
  if (!authConfig.token)
    return false;
  if (typeof authConfig.expiresAt !== "number")
    return true;
  const nowInSeconds = Math.floor(Date.now() / 1e3);
  return authConfig.expiresAt >= nowInSeconds;
}
function hasRefreshToken(authConfig) {
  return "refreshToken" in authConfig;
}
var Client = class extends EventEmitter {
  constructor(opts) {
    super();
    /** Track if we've already logged the token source debug message */
    this._loggedTokenSource = false;
    this.reauthenticate = sharedPromise(async function(error) {
      const result = await reauthenticate(this, error);
      if (typeof result === "number") {
        if (error instanceof APIError) {
          output_manager_default.prettyError(error);
        } else {
          output_manager_default.error(
            `Failed to re-authenticate for ${(0, import_chalk5.bold)(error.scope)} scope`
          );
        }
        throw error;
      }
    });
    this._onRetry = (error) => {
      output_manager_default.debug(`Retrying: ${error}
${error.stack}`);
    };
    this.agent = opts.agent;
    this.argv = opts.argv;
    this.apiUrl = opts.apiUrl;
    this.authConfig = opts.authConfig;
    this.stdin = opts.stdin;
    this.stdout = opts.stdout;
    this.stderr = opts.stderr;
    this.config = opts.config;
    this.localConfig = opts.localConfig;
    this.localConfigPath = opts.localConfigPath;
    this.requestIdCounter = 1;
    this.telemetryEventStore = opts.telemetryEventStore;
    this.isAgent = opts.isAgent ?? false;
    this.agentName = opts.agentName;
    this.nonInteractive = opts.nonInteractive ?? this.isAgent;
    this.dangerouslySkipPermissions = opts.dangerouslySkipPermissions ?? false;
    const theme = {
      prefix: (0, import_chalk5.gray)("?"),
      style: { answer: import_chalk5.gray }
    };
    this.input = {
      text: (opts2) => esm_default6({ theme, ...opts2 }, { input: this.stdin, output: this.stderr }),
      password: (opts2) => esm_default7(
        { theme, ...opts2 },
        { input: this.stdin, output: this.stderr }
      ),
      checkbox: (opts2) => esm_default2(
        { theme, ...opts2 },
        { input: this.stdin, output: this.stderr }
      ),
      expand: (opts2) => esm_default5({ theme, ...opts2 }, { input: this.stdin, output: this.stderr }),
      confirm: (message, default_value) => esm_default4(
        { theme, message, default: default_value },
        { input: this.stdin, output: this.stderr }
      ),
      select: (opts2) => esm_default3(
        { theme, ...opts2 },
        { input: this.stdin, output: this.stderr }
      ),
      search: (opts2) => esm_default8(
        { theme, ...opts2 },
        { input: this.stdin, output: this.stderr }
      )
    };
  }
  retry(fn, { retries = 3, maxTimeout = Infinity } = {}) {
    return (0, import_async_retry.default)(fn, {
      retries,
      maxTimeout,
      onRetry: this._onRetry
    });
  }
  /**
   * This method silently tries to refresh the access_token if it is expired.
   *
   * If the refresh_token is also expired, it will not attempt to refresh it.
   * If there is any error during the refresh process, it will not throw an error.
   */
  async ensureAuthorized() {
    const { authConfig } = this;
    if (isValidAccessToken(authConfig)) {
      if (!this._loggedTokenSource) {
        if (authConfig.tokenSource === "flag") {
          output_manager_default.debug(
            "Using token from `--token` argument, skipping token refresh."
          );
        } else if (authConfig.tokenSource === "env") {
          output_manager_default.debug(
            "Using token from VERCEL_TOKEN environment variable, skipping token refresh."
          );
        } else {
          output_manager_default.debug("Valid access token, skipping token refresh.");
        }
        this._loggedTokenSource = true;
      }
      return;
    }
    if (!hasRefreshToken(authConfig)) {
      output_manager_default.debug("No refresh token found, emptying auth config.");
      this.emptyAuthConfig();
      this.writeToAuthConfigFile();
      return;
    }
    const tokenResponse = await refreshTokenRequest({
      refresh_token: authConfig.refreshToken
    });
    const [tokensError, tokens] = await processTokenResponse(tokenResponse);
    if (tokensError) {
      output_manager_default.debug("Error refreshing token, emptying auth config.");
      this.emptyAuthConfig();
      this.writeToAuthConfigFile();
      return;
    }
    this.updateAuthConfig({
      token: tokens.access_token,
      expiresAt: Math.floor(Date.now() / 1e3) + tokens.expires_in
    });
    if (tokens.refresh_token) {
      this.updateAuthConfig({ refreshToken: tokens.refresh_token });
    }
    this.writeToAuthConfigFile();
    this.writeToConfigFile();
    output_manager_default.debug("Tokens refreshed successfully.");
  }
  updateConfig(config) {
    this.config = { ...this.config, ...config };
  }
  writeToConfigFile() {
    writeToConfigFile(this.config);
  }
  updateAuthConfig(authConfig) {
    this.authConfig = { ...this.authConfig, ...authConfig };
  }
  emptyAuthConfig() {
    this.authConfig = {};
  }
  writeToAuthConfigFile() {
    writeToAuthConfigFile(this.authConfig);
  }
  /**
   * Confirms DELETE operations with the user.
   *
   * - DELETE operations always require confirmation (unless --dangerously-skip-permissions is used)
   * - When running under an AI agent with --dangerously-skip-permissions,
   *   a warning is displayed for visibility
   *
   * @returns true if the operation should proceed, false if canceled
   */
  async confirmMutatingOperation(url, method) {
    const normalizedMethod = (method || "GET").toUpperCase();
    const isDelete = normalizedMethod === "DELETE";
    if (!isDelete) {
      return true;
    }
    if (this.isAgent && this.dangerouslySkipPermissions) {
      const agentInfo = this.agentName ? ` (${this.agentName})` : "";
      output_manager_default.print("\n");
      output_manager_default.print(
        (0, import_chalk5.bgRed)((0, import_chalk5.white)((0, import_chalk5.bold)(" \u26A0 WARNING "))) + (0, import_chalk5.red)((0, import_chalk5.bold)(" AGENT MODE - DELETE CONFIRMATION BYPASSED\n"))
      );
      output_manager_default.print(
        (0, import_chalk5.yellow)(
          `  An AI agent${agentInfo} is executing a ${(0, import_chalk5.bold)("DELETE")} request with --dangerously-skip-permissions flag.
`
        )
      );
      output_manager_default.print((0, import_chalk5.yellow)(`  This operation will delete data: ${(0, import_chalk5.bold)(url)}
`));
      output_manager_default.print(
        (0, import_chalk5.yellow)(
          `  The --dangerously-skip-permissions flag has bypassed the confirmation prompt.

`
        )
      );
    }
    if (this.dangerouslySkipPermissions) {
      return true;
    }
    if (!this.stdin.isTTY) {
      output_manager_default.error(
        `DELETE operations require confirmation. Use ${(0, import_chalk5.bold)("--dangerously-skip-permissions")} to skip confirmation in non-interactive mode.`
      );
      return false;
    }
    const message = `You are about to perform a ${(0, import_chalk5.red)((0, import_chalk5.bold)("DELETE"))} operation on:
  ${(0, import_chalk5.bold)(url)}

Are you sure you want to proceed?`;
    output_manager_default.print("\n");
    const confirmed = await this.input.confirm(message, false);
    output_manager_default.print("\n");
    if (!confirmed) {
      output_manager_default.log("Operation canceled by user.");
    }
    return confirmed;
  }
  async _fetch(_url, opts = {}) {
    const url = new URL2(_url, this.apiUrl);
    if (opts.accountId || opts.useCurrentTeam !== false) {
      if (opts.accountId) {
        if (opts.accountId.startsWith("team_")) {
          url.searchParams.set("teamId", opts.accountId);
        } else {
          url.searchParams.delete("teamId");
        }
      } else if (opts.useCurrentTeam !== false && this.config.currentTeam) {
        url.searchParams.set("teamId", this.config.currentTeam);
      }
    }
    const headers = new import_node_fetch2.Headers(opts.headers);
    headers.set("user-agent", ua_default);
    if (this.agentName) {
      headers.set("x-ai-agent", this.agentName);
    }
    await this.ensureAuthorized();
    if (this.authConfig.token) {
      headers.set("authorization", `Bearer ${this.authConfig.token}`);
    }
    let body;
    if (isJSONObject(opts.body)) {
      body = JSON.stringify(opts.body);
      headers.set("content-type", "application/json; charset=utf-8");
    } else {
      body = opts.body;
    }
    const requestId = this.requestIdCounter++;
    return output_manager_default.time(
      (res) => {
        if (res) {
          return `#${requestId} \u2190 ${res.status} ${res.statusText}: ${res.headers.get("x-vercel-id")}`;
        } else {
          return `#${requestId} \u2192 ${opts.method || "GET"} ${url.href}`;
        }
      },
      (0, import_node_fetch2.default)(url, { agent: this.agent, ...opts, headers, body })
    );
  }
  fetch(url, opts = {}) {
    return this.retry(async (bail) => {
      const res = await this._fetch(url, opts);
      printIndications(res);
      if (!res.ok) {
        const error = await responseError(res);
        if (isSAMLError(error) && error.teamId) {
          try {
            await this.reauthenticate(error);
          } catch (reauthError) {
            return bail((0, import_error_utils2.normalizeError)(reauthError));
          }
        } else if (res.status === 429 && opts.bailOn429) {
          return bail(error);
        } else if (typeof error.retryAfterMs === "number") {
          const randomSkewMs = 3e4 * Math.random();
          await sleep(error.retryAfterMs + randomSkewMs);
        } else if (res.status >= 400 && res.status < 500) {
          return bail(error);
        }
        throw error;
      }
      if (opts.json === false) {
        return res;
      }
      const contentType = res.headers.get("content-type");
      if (!contentType) {
        return null;
      }
      return contentType.includes("application/json") ? res.json() : res;
    }, opts.retry);
  }
  async *fetchPaginated(url, opts) {
    const endpoint = typeof url === "string" ? new URL2(url, this.apiUrl) : new URL2(url.href);
    if (!endpoint.searchParams.has("limit")) {
      endpoint.searchParams.set("limit", "100");
    }
    let next;
    do {
      if (next) {
        await sleep(100);
        endpoint.searchParams.set("until", String(next));
      }
      const res = await this.fetch(
        endpoint.href,
        opts
      );
      yield res;
      next = res.pagination?.next;
    } while (next);
  }
  get cwd() {
    return process.cwd();
  }
  set cwd(v) {
    process.chdir(v);
  }
};

export {
  require_dist3 as require_dist,
  printIndications,
  require_open,
  revocationRequest,
  processRevocationResponse,
  login,
  readConfigFile,
  writeToConfigFile,
  readAuthConfigFile,
  writeToAuthConfigFile,
  getConfigFilePath,
  getAuthConfigFilePath,
  readLocalConfig,
  sleep,
  isJSONObject,
  Client
};
/*! Bundled license information:

imurmurhash/imurmurhash.js:
  (**
   * @preserve
   * JS Implementation of incremental MurmurHash3 (r150) (as of May 10, 2013)
   *
   * @author <a href="mailto:jensyt@gmail.com">Jens Taylor</a>
   * @see http://github.com/homebrewing/brauhaus-diff
   * @author <a href="mailto:gary.court@gmail.com">Gary Court</a>
   * @see http://github.com/garycourt/murmurhash-js
   * @author <a href="mailto:aappleby@gmail.com">Austin Appleby</a>
   * @see http://sites.google.com/site/murmurhash/
   *)
*/
