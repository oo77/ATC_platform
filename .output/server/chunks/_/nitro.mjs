import process from 'node:process';globalThis._importMeta_=globalThis._importMeta_||{url:"file:///_entry.js",env:process.env};import { Bot, InputFile, InlineKeyboard, Keyboard } from 'grammy';
import { v4 } from 'uuid';
import http from 'node:http';
import https from 'node:https';
import { EventEmitter } from 'node:events';
import { Buffer as Buffer$1 } from 'node:buffer';
import { promises, existsSync } from 'node:fs';
import { resolve as resolve$1, dirname as dirname$1, join } from 'node:path';
import { createHash } from 'node:crypto';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'node:url';
import jwt from 'jsonwebtoken';

const suspectProtoRx = /"(?:_|\\u0{2}5[Ff]){2}(?:p|\\u0{2}70)(?:r|\\u0{2}72)(?:o|\\u0{2}6[Ff])(?:t|\\u0{2}74)(?:o|\\u0{2}6[Ff])(?:_|\\u0{2}5[Ff]){2}"\s*:/;
const suspectConstructorRx = /"(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)"\s*:/;
const JsonSigRx = /^\s*["[{]|^\s*-?\d{1,16}(\.\d{1,17})?([Ee][+-]?\d+)?\s*$/;
function jsonParseTransform(key, value) {
  if (key === "__proto__" || key === "constructor" && value && typeof value === "object" && "prototype" in value) {
    warnKeyDropped(key);
    return;
  }
  return value;
}
function warnKeyDropped(key) {
  console.warn(`[destr] Dropping "${key}" key to prevent prototype pollution.`);
}
function destr(value, options = {}) {
  if (typeof value !== "string") {
    return value;
  }
  if (value[0] === '"' && value[value.length - 1] === '"' && value.indexOf("\\") === -1) {
    return value.slice(1, -1);
  }
  const _value = value.trim();
  if (_value.length <= 9) {
    switch (_value.toLowerCase()) {
      case "true": {
        return true;
      }
      case "false": {
        return false;
      }
      case "undefined": {
        return void 0;
      }
      case "null": {
        return null;
      }
      case "nan": {
        return Number.NaN;
      }
      case "infinity": {
        return Number.POSITIVE_INFINITY;
      }
      case "-infinity": {
        return Number.NEGATIVE_INFINITY;
      }
    }
  }
  if (!JsonSigRx.test(value)) {
    if (options.strict) {
      throw new SyntaxError("[destr] Invalid JSON");
    }
    return value;
  }
  try {
    if (suspectProtoRx.test(value) || suspectConstructorRx.test(value)) {
      if (options.strict) {
        throw new Error("[destr] Possible prototype pollution");
      }
      return JSON.parse(value, jsonParseTransform);
    }
    return JSON.parse(value);
  } catch (error) {
    if (options.strict) {
      throw error;
    }
    return value;
  }
}

const HASH_RE = /#/g;
const AMPERSAND_RE = /&/g;
const SLASH_RE = /\//g;
const EQUAL_RE = /=/g;
const PLUS_RE = /\+/g;
const ENC_CARET_RE = /%5e/gi;
const ENC_BACKTICK_RE = /%60/gi;
const ENC_PIPE_RE = /%7c/gi;
const ENC_SPACE_RE = /%20/gi;
const ENC_SLASH_RE = /%2f/gi;
function encode(text) {
  return encodeURI("" + text).replace(ENC_PIPE_RE, "|");
}
function encodeQueryValue(input) {
  return encode(typeof input === "string" ? input : JSON.stringify(input)).replace(PLUS_RE, "%2B").replace(ENC_SPACE_RE, "+").replace(HASH_RE, "%23").replace(AMPERSAND_RE, "%26").replace(ENC_BACKTICK_RE, "`").replace(ENC_CARET_RE, "^").replace(SLASH_RE, "%2F");
}
function encodeQueryKey(text) {
  return encodeQueryValue(text).replace(EQUAL_RE, "%3D");
}
function decode$2(text = "") {
  try {
    return decodeURIComponent("" + text);
  } catch {
    return "" + text;
  }
}
function decodePath(text) {
  return decode$2(text.replace(ENC_SLASH_RE, "%252F"));
}
function decodeQueryKey(text) {
  return decode$2(text.replace(PLUS_RE, " "));
}
function decodeQueryValue(text) {
  return decode$2(text.replace(PLUS_RE, " "));
}

function parseQuery(parametersString = "") {
  const object = /* @__PURE__ */ Object.create(null);
  if (parametersString[0] === "?") {
    parametersString = parametersString.slice(1);
  }
  for (const parameter of parametersString.split("&")) {
    const s = parameter.match(/([^=]+)=?(.*)/) || [];
    if (s.length < 2) {
      continue;
    }
    const key = decodeQueryKey(s[1]);
    if (key === "__proto__" || key === "constructor") {
      continue;
    }
    const value = decodeQueryValue(s[2] || "");
    if (object[key] === void 0) {
      object[key] = value;
    } else if (Array.isArray(object[key])) {
      object[key].push(value);
    } else {
      object[key] = [object[key], value];
    }
  }
  return object;
}
function encodeQueryItem(key, value) {
  if (typeof value === "number" || typeof value === "boolean") {
    value = String(value);
  }
  if (!value) {
    return encodeQueryKey(key);
  }
  if (Array.isArray(value)) {
    return value.map(
      (_value) => `${encodeQueryKey(key)}=${encodeQueryValue(_value)}`
    ).join("&");
  }
  return `${encodeQueryKey(key)}=${encodeQueryValue(value)}`;
}
function stringifyQuery(query) {
  return Object.keys(query).filter((k) => query[k] !== void 0).map((k) => encodeQueryItem(k, query[k])).filter(Boolean).join("&");
}

const PROTOCOL_STRICT_REGEX = /^[\s\w\0+.-]{2,}:([/\\]{1,2})/;
const PROTOCOL_REGEX = /^[\s\w\0+.-]{2,}:([/\\]{2})?/;
const PROTOCOL_RELATIVE_REGEX = /^([/\\]\s*){2,}[^/\\]/;
const PROTOCOL_SCRIPT_RE = /^[\s\0]*(blob|data|javascript|vbscript):$/i;
const TRAILING_SLASH_RE = /\/$|\/\?|\/#/;
const JOIN_LEADING_SLASH_RE = /^\.?\//;
function hasProtocol(inputString, opts = {}) {
  if (typeof opts === "boolean") {
    opts = { acceptRelative: opts };
  }
  if (opts.strict) {
    return PROTOCOL_STRICT_REGEX.test(inputString);
  }
  return PROTOCOL_REGEX.test(inputString) || (opts.acceptRelative ? PROTOCOL_RELATIVE_REGEX.test(inputString) : false);
}
function isScriptProtocol(protocol) {
  return !!protocol && PROTOCOL_SCRIPT_RE.test(protocol);
}
function hasTrailingSlash(input = "", respectQueryAndFragment) {
  if (!respectQueryAndFragment) {
    return input.endsWith("/");
  }
  return TRAILING_SLASH_RE.test(input);
}
function withoutTrailingSlash(input = "", respectQueryAndFragment) {
  if (!respectQueryAndFragment) {
    return (hasTrailingSlash(input) ? input.slice(0, -1) : input) || "/";
  }
  if (!hasTrailingSlash(input, true)) {
    return input || "/";
  }
  let path = input;
  let fragment = "";
  const fragmentIndex = input.indexOf("#");
  if (fragmentIndex !== -1) {
    path = input.slice(0, fragmentIndex);
    fragment = input.slice(fragmentIndex);
  }
  const [s0, ...s] = path.split("?");
  const cleanPath = s0.endsWith("/") ? s0.slice(0, -1) : s0;
  return (cleanPath || "/") + (s.length > 0 ? `?${s.join("?")}` : "") + fragment;
}
function withTrailingSlash(input = "", respectQueryAndFragment) {
  if (!respectQueryAndFragment) {
    return input.endsWith("/") ? input : input + "/";
  }
  if (hasTrailingSlash(input, true)) {
    return input || "/";
  }
  let path = input;
  let fragment = "";
  const fragmentIndex = input.indexOf("#");
  if (fragmentIndex !== -1) {
    path = input.slice(0, fragmentIndex);
    fragment = input.slice(fragmentIndex);
    if (!path) {
      return fragment;
    }
  }
  const [s0, ...s] = path.split("?");
  return s0 + "/" + (s.length > 0 ? `?${s.join("?")}` : "") + fragment;
}
function hasLeadingSlash(input = "") {
  return input.startsWith("/");
}
function withLeadingSlash(input = "") {
  return hasLeadingSlash(input) ? input : "/" + input;
}
function withBase(input, base) {
  if (isEmptyURL(base) || hasProtocol(input)) {
    return input;
  }
  const _base = withoutTrailingSlash(base);
  if (input.startsWith(_base)) {
    const nextChar = input[_base.length];
    if (!nextChar || nextChar === "/" || nextChar === "?") {
      return input;
    }
  }
  return joinURL(_base, input);
}
function withoutBase(input, base) {
  if (isEmptyURL(base)) {
    return input;
  }
  const _base = withoutTrailingSlash(base);
  if (!input.startsWith(_base)) {
    return input;
  }
  const nextChar = input[_base.length];
  if (nextChar && nextChar !== "/" && nextChar !== "?") {
    return input;
  }
  const trimmed = input.slice(_base.length);
  return trimmed[0] === "/" ? trimmed : "/" + trimmed;
}
function withQuery(input, query) {
  const parsed = parseURL(input);
  const mergedQuery = { ...parseQuery(parsed.search), ...query };
  parsed.search = stringifyQuery(mergedQuery);
  return stringifyParsedURL(parsed);
}
function getQuery$2(input) {
  return parseQuery(parseURL(input).search);
}
function isEmptyURL(url) {
  return !url || url === "/";
}
function isNonEmptyURL(url) {
  return url && url !== "/";
}
function joinURL(base, ...input) {
  let url = base || "";
  for (const segment of input.filter((url2) => isNonEmptyURL(url2))) {
    if (url) {
      const _segment = segment.replace(JOIN_LEADING_SLASH_RE, "");
      url = withTrailingSlash(url) + _segment;
    } else {
      url = segment;
    }
  }
  return url;
}
function joinRelativeURL(..._input) {
  const JOIN_SEGMENT_SPLIT_RE = /\/(?!\/)/;
  const input = _input.filter(Boolean);
  const segments = [];
  let segmentsDepth = 0;
  for (const i of input) {
    if (!i || i === "/") {
      continue;
    }
    for (const [sindex, s] of i.split(JOIN_SEGMENT_SPLIT_RE).entries()) {
      if (!s || s === ".") {
        continue;
      }
      if (s === "..") {
        if (segments.length === 1 && hasProtocol(segments[0])) {
          continue;
        }
        segments.pop();
        segmentsDepth--;
        continue;
      }
      if (sindex === 1 && segments[segments.length - 1]?.endsWith(":/")) {
        segments[segments.length - 1] += "/" + s;
        continue;
      }
      segments.push(s);
      segmentsDepth++;
    }
  }
  let url = segments.join("/");
  if (segmentsDepth >= 0) {
    if (input[0]?.startsWith("/") && !url.startsWith("/")) {
      url = "/" + url;
    } else if (input[0]?.startsWith("./") && !url.startsWith("./")) {
      url = "./" + url;
    }
  } else {
    url = "../".repeat(-1 * segmentsDepth) + url;
  }
  if (input[input.length - 1]?.endsWith("/") && !url.endsWith("/")) {
    url += "/";
  }
  return url;
}

const protocolRelative = Symbol.for("ufo:protocolRelative");
function parseURL(input = "", defaultProto) {
  const _specialProtoMatch = input.match(
    /^[\s\0]*(blob:|data:|javascript:|vbscript:)(.*)/i
  );
  if (_specialProtoMatch) {
    const [, _proto, _pathname = ""] = _specialProtoMatch;
    return {
      protocol: _proto.toLowerCase(),
      pathname: _pathname,
      href: _proto + _pathname,
      auth: "",
      host: "",
      search: "",
      hash: ""
    };
  }
  if (!hasProtocol(input, { acceptRelative: true })) {
    return parsePath(input);
  }
  const [, protocol = "", auth, hostAndPath = ""] = input.replace(/\\/g, "/").match(/^[\s\0]*([\w+.-]{2,}:)?\/\/([^/@]+@)?(.*)/) || [];
  let [, host = "", path = ""] = hostAndPath.match(/([^#/?]*)(.*)?/) || [];
  if (protocol === "file:") {
    path = path.replace(/\/(?=[A-Za-z]:)/, "");
  }
  const { pathname, search, hash } = parsePath(path);
  return {
    protocol: protocol.toLowerCase(),
    auth: auth ? auth.slice(0, Math.max(0, auth.length - 1)) : "",
    host,
    pathname,
    search,
    hash,
    [protocolRelative]: !protocol
  };
}
function parsePath(input = "") {
  const [pathname = "", search = "", hash = ""] = (input.match(/([^#?]*)(\?[^#]*)?(#.*)?/) || []).splice(1);
  return {
    pathname,
    search,
    hash
  };
}
function stringifyParsedURL(parsed) {
  const pathname = parsed.pathname || "";
  const search = parsed.search ? (parsed.search.startsWith("?") ? "" : "?") + parsed.search : "";
  const hash = parsed.hash || "";
  const auth = parsed.auth ? parsed.auth + "@" : "";
  const host = parsed.host || "";
  const proto = parsed.protocol || parsed[protocolRelative] ? (parsed.protocol || "") + "//" : "";
  return proto + auth + host + pathname + search + hash;
}

const NODE_TYPES = {
  NORMAL: 0,
  WILDCARD: 1,
  PLACEHOLDER: 2
};

function createRouter$1(options = {}) {
  const ctx = {
    options,
    rootNode: createRadixNode(),
    staticRoutesMap: {}
  };
  const normalizeTrailingSlash = (p) => options.strictTrailingSlash ? p : p.replace(/\/$/, "") || "/";
  if (options.routes) {
    for (const path in options.routes) {
      insert(ctx, normalizeTrailingSlash(path), options.routes[path]);
    }
  }
  return {
    ctx,
    lookup: (path) => lookup(ctx, normalizeTrailingSlash(path)),
    insert: (path, data) => insert(ctx, normalizeTrailingSlash(path), data),
    remove: (path) => remove(ctx, normalizeTrailingSlash(path))
  };
}
function lookup(ctx, path) {
  const staticPathNode = ctx.staticRoutesMap[path];
  if (staticPathNode) {
    return staticPathNode.data;
  }
  const sections = path.split("/");
  const params = {};
  let paramsFound = false;
  let wildcardNode = null;
  let node = ctx.rootNode;
  let wildCardParam = null;
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    if (node.wildcardChildNode !== null) {
      wildcardNode = node.wildcardChildNode;
      wildCardParam = sections.slice(i).join("/");
    }
    const nextNode = node.children.get(section);
    if (nextNode === void 0) {
      if (node && node.placeholderChildren.length > 1) {
        const remaining = sections.length - i;
        node = node.placeholderChildren.find((c) => c.maxDepth === remaining) || null;
      } else {
        node = node.placeholderChildren[0] || null;
      }
      if (!node) {
        break;
      }
      if (node.paramName) {
        params[node.paramName] = section;
      }
      paramsFound = true;
    } else {
      node = nextNode;
    }
  }
  if ((node === null || node.data === null) && wildcardNode !== null) {
    node = wildcardNode;
    params[node.paramName || "_"] = wildCardParam;
    paramsFound = true;
  }
  if (!node) {
    return null;
  }
  if (paramsFound) {
    return {
      ...node.data,
      params: paramsFound ? params : void 0
    };
  }
  return node.data;
}
function insert(ctx, path, data) {
  let isStaticRoute = true;
  const sections = path.split("/");
  let node = ctx.rootNode;
  let _unnamedPlaceholderCtr = 0;
  const matchedNodes = [node];
  for (const section of sections) {
    let childNode;
    if (childNode = node.children.get(section)) {
      node = childNode;
    } else {
      const type = getNodeType(section);
      childNode = createRadixNode({ type, parent: node });
      node.children.set(section, childNode);
      if (type === NODE_TYPES.PLACEHOLDER) {
        childNode.paramName = section === "*" ? `_${_unnamedPlaceholderCtr++}` : section.slice(1);
        node.placeholderChildren.push(childNode);
        isStaticRoute = false;
      } else if (type === NODE_TYPES.WILDCARD) {
        node.wildcardChildNode = childNode;
        childNode.paramName = section.slice(
          3
          /* "**:" */
        ) || "_";
        isStaticRoute = false;
      }
      matchedNodes.push(childNode);
      node = childNode;
    }
  }
  for (const [depth, node2] of matchedNodes.entries()) {
    node2.maxDepth = Math.max(matchedNodes.length - depth, node2.maxDepth || 0);
  }
  node.data = data;
  if (isStaticRoute === true) {
    ctx.staticRoutesMap[path] = node;
  }
  return node;
}
function remove(ctx, path) {
  let success = false;
  const sections = path.split("/");
  let node = ctx.rootNode;
  for (const section of sections) {
    node = node.children.get(section);
    if (!node) {
      return success;
    }
  }
  if (node.data) {
    const lastSection = sections.at(-1) || "";
    node.data = null;
    if (Object.keys(node.children).length === 0 && node.parent) {
      node.parent.children.delete(lastSection);
      node.parent.wildcardChildNode = null;
      node.parent.placeholderChildren = [];
    }
    success = true;
  }
  return success;
}
function createRadixNode(options = {}) {
  return {
    type: options.type || NODE_TYPES.NORMAL,
    maxDepth: 0,
    parent: options.parent || null,
    children: /* @__PURE__ */ new Map(),
    data: options.data || null,
    paramName: options.paramName || null,
    wildcardChildNode: null,
    placeholderChildren: []
  };
}
function getNodeType(str) {
  if (str.startsWith("**")) {
    return NODE_TYPES.WILDCARD;
  }
  if (str[0] === ":" || str === "*") {
    return NODE_TYPES.PLACEHOLDER;
  }
  return NODE_TYPES.NORMAL;
}

function toRouteMatcher(router) {
  const table = _routerNodeToTable("", router.ctx.rootNode);
  return _createMatcher(table, router.ctx.options.strictTrailingSlash);
}
function _createMatcher(table, strictTrailingSlash) {
  return {
    ctx: { table },
    matchAll: (path) => _matchRoutes(path, table, strictTrailingSlash)
  };
}
function _createRouteTable() {
  return {
    static: /* @__PURE__ */ new Map(),
    wildcard: /* @__PURE__ */ new Map(),
    dynamic: /* @__PURE__ */ new Map()
  };
}
function _matchRoutes(path, table, strictTrailingSlash) {
  if (strictTrailingSlash !== true && path.endsWith("/")) {
    path = path.slice(0, -1) || "/";
  }
  const matches = [];
  for (const [key, value] of _sortRoutesMap(table.wildcard)) {
    if (path === key || path.startsWith(key + "/")) {
      matches.push(value);
    }
  }
  for (const [key, value] of _sortRoutesMap(table.dynamic)) {
    if (path.startsWith(key + "/")) {
      const subPath = "/" + path.slice(key.length).split("/").splice(2).join("/");
      matches.push(..._matchRoutes(subPath, value));
    }
  }
  const staticMatch = table.static.get(path);
  if (staticMatch) {
    matches.push(staticMatch);
  }
  return matches.filter(Boolean);
}
function _sortRoutesMap(m) {
  return [...m.entries()].sort((a, b) => a[0].length - b[0].length);
}
function _routerNodeToTable(initialPath, initialNode) {
  const table = _createRouteTable();
  function _addNode(path, node) {
    if (path) {
      if (node.type === NODE_TYPES.NORMAL && !(path.includes("*") || path.includes(":"))) {
        if (node.data) {
          table.static.set(path, node.data);
        }
      } else if (node.type === NODE_TYPES.WILDCARD) {
        table.wildcard.set(path.replace("/**", ""), node.data);
      } else if (node.type === NODE_TYPES.PLACEHOLDER) {
        const subTable = _routerNodeToTable("", node);
        if (node.data) {
          subTable.static.set("/", node.data);
        }
        table.dynamic.set(path.replace(/\/\*|\/:\w+/, ""), subTable);
        return;
      }
    }
    for (const [childPath, child] of node.children.entries()) {
      _addNode(`${path}/${childPath}`.replace("//", "/"), child);
    }
  }
  _addNode(initialPath, initialNode);
  return table;
}

function isPlainObject(value) {
  if (value === null || typeof value !== "object") {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== null && prototype !== Object.prototype && Object.getPrototypeOf(prototype) !== null) {
    return false;
  }
  if (Symbol.iterator in value) {
    return false;
  }
  if (Symbol.toStringTag in value) {
    return Object.prototype.toString.call(value) === "[object Module]";
  }
  return true;
}

function _defu(baseObject, defaults, namespace = ".", merger) {
  if (!isPlainObject(defaults)) {
    return _defu(baseObject, {}, namespace, merger);
  }
  const object = Object.assign({}, defaults);
  for (const key in baseObject) {
    if (key === "__proto__" || key === "constructor") {
      continue;
    }
    const value = baseObject[key];
    if (value === null || value === void 0) {
      continue;
    }
    if (merger && merger(object, key, value, namespace)) {
      continue;
    }
    if (Array.isArray(value) && Array.isArray(object[key])) {
      object[key] = [...value, ...object[key]];
    } else if (isPlainObject(value) && isPlainObject(object[key])) {
      object[key] = _defu(
        value,
        object[key],
        (namespace ? `${namespace}.` : "") + key.toString(),
        merger
      );
    } else {
      object[key] = value;
    }
  }
  return object;
}
function createDefu(merger) {
  return (...arguments_) => (
    // eslint-disable-next-line unicorn/no-array-reduce
    arguments_.reduce((p, c) => _defu(p, c, "", merger), {})
  );
}
const defu = createDefu();
const defuFn = createDefu((object, key, currentValue) => {
  if (object[key] !== void 0 && typeof currentValue === "function") {
    object[key] = currentValue(object[key]);
    return true;
  }
});

function o$1(n){throw new Error(`${n} is not implemented yet!`)}let i$2 = class i extends EventEmitter{__unenv__={};readableEncoding=null;readableEnded=true;readableFlowing=false;readableHighWaterMark=0;readableLength=0;readableObjectMode=false;readableAborted=false;readableDidRead=false;closed=false;errored=null;readable=false;destroyed=false;static from(e,t){return new i(t)}constructor(e){super();}_read(e){}read(e){}setEncoding(e){return this}pause(){return this}resume(){return this}isPaused(){return  true}unpipe(e){return this}unshift(e,t){}wrap(e){return this}push(e,t){return  false}_destroy(e,t){this.removeAllListeners();}destroy(e){return this.destroyed=true,this._destroy(e),this}pipe(e,t){return {}}compose(e,t){throw new Error("Method not implemented.")}[Symbol.asyncDispose](){return this.destroy(),Promise.resolve()}async*[Symbol.asyncIterator](){throw o$1("Readable.asyncIterator")}iterator(e){throw o$1("Readable.iterator")}map(e,t){throw o$1("Readable.map")}filter(e,t){throw o$1("Readable.filter")}forEach(e,t){throw o$1("Readable.forEach")}reduce(e,t,r){throw o$1("Readable.reduce")}find(e,t){throw o$1("Readable.find")}findIndex(e,t){throw o$1("Readable.findIndex")}some(e,t){throw o$1("Readable.some")}toArray(e){throw o$1("Readable.toArray")}every(e,t){throw o$1("Readable.every")}flatMap(e,t){throw o$1("Readable.flatMap")}drop(e,t){throw o$1("Readable.drop")}take(e,t){throw o$1("Readable.take")}asIndexedPairs(e){throw o$1("Readable.asIndexedPairs")}};let l$2 = class l extends EventEmitter{__unenv__={};writable=true;writableEnded=false;writableFinished=false;writableHighWaterMark=0;writableLength=0;writableObjectMode=false;writableCorked=0;closed=false;errored=null;writableNeedDrain=false;writableAborted=false;destroyed=false;_data;_encoding="utf8";constructor(e){super();}pipe(e,t){return {}}_write(e,t,r){if(this.writableEnded){r&&r();return}if(this._data===void 0)this._data=e;else {const s=typeof this._data=="string"?Buffer$1.from(this._data,this._encoding||t||"utf8"):this._data,a=typeof e=="string"?Buffer$1.from(e,t||this._encoding||"utf8"):e;this._data=Buffer$1.concat([s,a]);}this._encoding=t,r&&r();}_writev(e,t){}_destroy(e,t){}_final(e){}write(e,t,r){const s=typeof t=="string"?this._encoding:"utf8",a=typeof t=="function"?t:typeof r=="function"?r:void 0;return this._write(e,s,a),true}setDefaultEncoding(e){return this}end(e,t,r){const s=typeof e=="function"?e:typeof t=="function"?t:typeof r=="function"?r:void 0;if(this.writableEnded)return s&&s(),this;const a=e===s?void 0:e;if(a){const u=t===s?void 0:t;this.write(a,u,s);}return this.writableEnded=true,this.writableFinished=true,this.emit("close"),this.emit("finish"),this}cork(){}uncork(){}destroy(e){return this.destroyed=true,delete this._data,this.removeAllListeners(),this}compose(e,t){throw new Error("Method not implemented.")}[Symbol.asyncDispose](){return Promise.resolve()}};const c$2=class c{allowHalfOpen=true;_destroy;constructor(e=new i$2,t=new l$2){Object.assign(this,e),Object.assign(this,t),this._destroy=m$1(e._destroy,t._destroy);}};function _$2(){return Object.assign(c$2.prototype,i$2.prototype),Object.assign(c$2.prototype,l$2.prototype),c$2}function m$1(...n){return function(...e){for(const t of n)t(...e);}}const g$1=_$2();let A$1 = class A extends g$1{__unenv__={};bufferSize=0;bytesRead=0;bytesWritten=0;connecting=false;destroyed=false;pending=false;localAddress="";localPort=0;remoteAddress="";remoteFamily="";remotePort=0;autoSelectFamilyAttemptedAddresses=[];readyState="readOnly";constructor(e){super();}write(e,t,r){return  false}connect(e,t,r){return this}end(e,t,r){return this}setEncoding(e){return this}pause(){return this}resume(){return this}setTimeout(e,t){return this}setNoDelay(e){return this}setKeepAlive(e,t){return this}address(){return {}}unref(){return this}ref(){return this}destroySoon(){this.destroy();}resetAndDestroy(){const e=new Error("ERR_SOCKET_CLOSED");return e.code="ERR_SOCKET_CLOSED",this.destroy(e),this}};let y$1 = class y extends i$2{aborted=false;httpVersion="1.1";httpVersionMajor=1;httpVersionMinor=1;complete=true;connection;socket;headers={};trailers={};method="GET";url="/";statusCode=200;statusMessage="";closed=false;errored=null;readable=false;constructor(e){super(),this.socket=this.connection=e||new A$1;}get rawHeaders(){const e=this.headers,t=[];for(const r in e)if(Array.isArray(e[r]))for(const s of e[r])t.push(r,s);else t.push(r,e[r]);return t}get rawTrailers(){return []}setTimeout(e,t){return this}get headersDistinct(){return p$1(this.headers)}get trailersDistinct(){return p$1(this.trailers)}};function p$1(n){const e={};for(const[t,r]of Object.entries(n))t&&(e[t]=(Array.isArray(r)?r:[r]).filter(Boolean));return e}class w extends l$2{statusCode=200;statusMessage="";upgrading=false;chunkedEncoding=false;shouldKeepAlive=false;useChunkedEncodingByDefault=false;sendDate=false;finished=false;headersSent=false;strictContentLength=false;connection=null;socket=null;req;_headers={};constructor(e){super(),this.req=e;}assignSocket(e){e._httpMessage=this,this.socket=e,this.connection=e,this.emit("socket",e),this._flush();}_flush(){this.flushHeaders();}detachSocket(e){}writeContinue(e){}writeHead(e,t,r){e&&(this.statusCode=e),typeof t=="string"&&(this.statusMessage=t,t=void 0);const s=r||t;if(s&&!Array.isArray(s))for(const a in s)this.setHeader(a,s[a]);return this.headersSent=true,this}writeProcessing(){}setTimeout(e,t){return this}appendHeader(e,t){e=e.toLowerCase();const r=this._headers[e],s=[...Array.isArray(r)?r:[r],...Array.isArray(t)?t:[t]].filter(Boolean);return this._headers[e]=s.length>1?s:s[0],this}setHeader(e,t){return this._headers[e.toLowerCase()]=t,this}setHeaders(e){for(const[t,r]of Object.entries(e))this.setHeader(t,r);return this}getHeader(e){return this._headers[e.toLowerCase()]}getHeaders(){return this._headers}getHeaderNames(){return Object.keys(this._headers)}hasHeader(e){return e.toLowerCase()in this._headers}removeHeader(e){delete this._headers[e.toLowerCase()];}addTrailers(e){}flushHeaders(){}writeEarlyHints(e,t){typeof t=="function"&&t();}}const E=(()=>{const n=function(){};return n.prototype=Object.create(null),n})();function R$2(n={}){const e=new E,t=Array.isArray(n)||H(n)?n:Object.entries(n);for(const[r,s]of t)if(s){if(e[r]===void 0){e[r]=s;continue}e[r]=[...Array.isArray(e[r])?e[r]:[e[r]],...Array.isArray(s)?s:[s]];}return e}function H(n){return typeof n?.entries=="function"}function v$1(n={}){if(n instanceof Headers)return n;const e=new Headers;for(const[t,r]of Object.entries(n))if(r!==void 0){if(Array.isArray(r)){for(const s of r)e.append(t,String(s));continue}e.set(t,String(r));}return e}const S$2=new Set([101,204,205,304]);async function b$2(n,e){const t=new y$1,r=new w(t);t.url=e.url?.toString()||"/";let s;if(!t.url.startsWith("/")){const d=new URL(t.url);s=d.host,t.url=d.pathname+d.search+d.hash;}t.method=e.method||"GET",t.headers=R$2(e.headers||{}),t.headers.host||(t.headers.host=e.host||s||"localhost"),t.connection.encrypted=t.connection.encrypted||e.protocol==="https",t.body=e.body||null,t.__unenv__=e.context,await n(t,r);let a=r._data;(S$2.has(r.statusCode)||t.method.toUpperCase()==="HEAD")&&(a=null,delete r._headers["content-length"]);const u={status:r.statusCode,statusText:r.statusMessage,headers:r._headers,body:a};return t.destroy(),r.destroy(),u}async function C$1(n,e,t={}){try{const r=await b$2(n,{url:e,...t});return new Response(r.body,{status:r.status,statusText:r.statusText,headers:v$1(r.headers)})}catch(r){return new Response(r.toString(),{status:Number.parseInt(r.statusCode||r.code)||500,statusText:r.statusText})}}

function hasProp$2(obj, prop) {
  try {
    return prop in obj;
  } catch {
    return false;
  }
}

let H3Error$2 = class H3Error extends Error {
  static __h3_error__ = true;
  statusCode = 500;
  fatal = false;
  unhandled = false;
  statusMessage;
  data;
  cause;
  constructor(message, opts = {}) {
    super(message, opts);
    if (opts.cause && !this.cause) {
      this.cause = opts.cause;
    }
  }
  toJSON() {
    const obj = {
      message: this.message,
      statusCode: sanitizeStatusCode$2(this.statusCode, 500)
    };
    if (this.statusMessage) {
      obj.statusMessage = sanitizeStatusMessage$2(this.statusMessage);
    }
    if (this.data !== void 0) {
      obj.data = this.data;
    }
    return obj;
  }
};
function createError$3(input) {
  if (typeof input === "string") {
    return new H3Error$2(input);
  }
  if (isError$2(input)) {
    return input;
  }
  const err = new H3Error$2(input.message ?? input.statusMessage ?? "", {
    cause: input.cause || input
  });
  if (hasProp$2(input, "stack")) {
    try {
      Object.defineProperty(err, "stack", {
        get() {
          return input.stack;
        }
      });
    } catch {
      try {
        err.stack = input.stack;
      } catch {
      }
    }
  }
  if (input.data) {
    err.data = input.data;
  }
  if (input.statusCode) {
    err.statusCode = sanitizeStatusCode$2(input.statusCode, err.statusCode);
  } else if (input.status) {
    err.statusCode = sanitizeStatusCode$2(input.status, err.statusCode);
  }
  if (input.statusMessage) {
    err.statusMessage = input.statusMessage;
  } else if (input.statusText) {
    err.statusMessage = input.statusText;
  }
  if (err.statusMessage) {
    const originalMessage = err.statusMessage;
    const sanitizedMessage = sanitizeStatusMessage$2(err.statusMessage);
    if (sanitizedMessage !== originalMessage) {
      console.warn(
        "[h3] Please prefer using `message` for longer error messages instead of `statusMessage`. In the future, `statusMessage` will be sanitized by default."
      );
    }
  }
  if (input.fatal !== void 0) {
    err.fatal = input.fatal;
  }
  if (input.unhandled !== void 0) {
    err.unhandled = input.unhandled;
  }
  return err;
}
function sendError(event, error, debug) {
  if (event.handled) {
    return;
  }
  const h3Error = isError$2(error) ? error : createError$3(error);
  const responseBody = {
    statusCode: h3Error.statusCode,
    statusMessage: h3Error.statusMessage,
    stack: [],
    data: h3Error.data
  };
  if (debug) {
    responseBody.stack = (h3Error.stack || "").split("\n").map((l) => l.trim());
  }
  if (event.handled) {
    return;
  }
  const _code = Number.parseInt(h3Error.statusCode);
  setResponseStatus$1(event, _code, h3Error.statusMessage);
  event.node.res.setHeader("content-type", MIMES.json);
  event.node.res.end(JSON.stringify(responseBody, void 0, 2));
}
function isError$2(input) {
  return input?.constructor?.__h3_error__ === true;
}
function isMethod$1(event, expected, allowHead) {
  if (typeof expected === "string") {
    if (event.method === expected) {
      return true;
    }
  } else if (expected.includes(event.method)) {
    return true;
  }
  return false;
}
function assertMethod$1(event, expected, allowHead) {
  if (!isMethod$1(event, expected)) {
    throw createError$3({
      statusCode: 405,
      statusMessage: "HTTP method is not allowed."
    });
  }
}
function getRequestHeaders$2(event) {
  const _headers = {};
  for (const key in event.node.req.headers) {
    const val = event.node.req.headers[key];
    _headers[key] = Array.isArray(val) ? val.filter(Boolean).join(", ") : val;
  }
  return _headers;
}
function getRequestHeader$2(event, name) {
  const headers = getRequestHeaders$2(event);
  const value = headers[name.toLowerCase()];
  return value;
}
function getRequestHost(event, opts = {}) {
  if (opts.xForwardedHost) {
    const _header = event.node.req.headers["x-forwarded-host"];
    const xForwardedHost = (_header || "").split(",").shift()?.trim();
    if (xForwardedHost) {
      return xForwardedHost;
    }
  }
  return event.node.req.headers.host || "localhost";
}
function getRequestProtocol(event, opts = {}) {
  if (opts.xForwardedProto !== false && event.node.req.headers["x-forwarded-proto"] === "https") {
    return "https";
  }
  return event.node.req.connection?.encrypted ? "https" : "http";
}
function getRequestURL(event, opts = {}) {
  const host = getRequestHost(event, opts);
  const protocol = getRequestProtocol(event, opts);
  const path = (event.node.req.originalUrl || event.path).replace(
    /^[/\\]+/g,
    "/"
  );
  return new URL(path, `${protocol}://${host}`);
}

const RawBodySymbol$1 = Symbol.for("h3RawBody");
const PayloadMethods$1$1 = ["PATCH", "POST", "PUT", "DELETE"];
function readRawBody$1(event, encoding = "utf8") {
  assertMethod$1(event, PayloadMethods$1$1);
  const _rawBody = event._requestBody || event.web?.request?.body || event.node.req[RawBodySymbol$1] || event.node.req.rawBody || event.node.req.body;
  if (_rawBody) {
    const promise2 = Promise.resolve(_rawBody).then((_resolved) => {
      if (Buffer.isBuffer(_resolved)) {
        return _resolved;
      }
      if (typeof _resolved.pipeTo === "function") {
        return new Promise((resolve, reject) => {
          const chunks = [];
          _resolved.pipeTo(
            new WritableStream({
              write(chunk) {
                chunks.push(chunk);
              },
              close() {
                resolve(Buffer.concat(chunks));
              },
              abort(reason) {
                reject(reason);
              }
            })
          ).catch(reject);
        });
      } else if (typeof _resolved.pipe === "function") {
        return new Promise((resolve, reject) => {
          const chunks = [];
          _resolved.on("data", (chunk) => {
            chunks.push(chunk);
          }).on("end", () => {
            resolve(Buffer.concat(chunks));
          }).on("error", reject);
        });
      }
      if (_resolved.constructor === Object) {
        return Buffer.from(JSON.stringify(_resolved));
      }
      if (_resolved instanceof URLSearchParams) {
        return Buffer.from(_resolved.toString());
      }
      if (_resolved instanceof FormData) {
        return new Response(_resolved).bytes().then((uint8arr) => Buffer.from(uint8arr));
      }
      return Buffer.from(_resolved);
    });
    return encoding ? promise2.then((buff) => buff.toString(encoding)) : promise2;
  }
  if (!Number.parseInt(event.node.req.headers["content-length"] || "") && !/\bchunked\b/i.test(
    String(event.node.req.headers["transfer-encoding"] ?? "")
  )) {
    return Promise.resolve(void 0);
  }
  const promise = event.node.req[RawBodySymbol$1] = new Promise(
    (resolve, reject) => {
      const bodyData = [];
      event.node.req.on("error", (err) => {
        reject(err);
      }).on("data", (chunk) => {
        bodyData.push(chunk);
      }).on("end", () => {
        resolve(Buffer.concat(bodyData));
      });
    }
  );
  const result = encoding ? promise.then((buff) => buff.toString(encoding)) : promise;
  return result;
}
function getRequestWebStream(event) {
  if (!PayloadMethods$1$1.includes(event.method)) {
    return;
  }
  const bodyStream = event.web?.request?.body || event._requestBody;
  if (bodyStream) {
    return bodyStream;
  }
  const _hasRawBody = RawBodySymbol$1 in event.node.req || "rawBody" in event.node.req || "body" in event.node.req || "__unenv__" in event.node.req;
  if (_hasRawBody) {
    return new ReadableStream({
      async start(controller) {
        const _rawBody = await readRawBody$1(event, false);
        if (_rawBody) {
          controller.enqueue(_rawBody);
        }
        controller.close();
      }
    });
  }
  return new ReadableStream({
    start: (controller) => {
      event.node.req.on("data", (chunk) => {
        controller.enqueue(chunk);
      });
      event.node.req.on("end", () => {
        controller.close();
      });
      event.node.req.on("error", (err) => {
        controller.error(err);
      });
    }
  });
}

function handleCacheHeaders(event, opts) {
  const cacheControls = ["public", ...opts.cacheControls || []];
  let cacheMatched = false;
  if (opts.maxAge !== void 0) {
    cacheControls.push(`max-age=${+opts.maxAge}`, `s-maxage=${+opts.maxAge}`);
  }
  if (opts.modifiedTime) {
    const modifiedTime = new Date(opts.modifiedTime);
    const ifModifiedSince = event.node.req.headers["if-modified-since"];
    event.node.res.setHeader("last-modified", modifiedTime.toUTCString());
    if (ifModifiedSince && new Date(ifModifiedSince) >= modifiedTime) {
      cacheMatched = true;
    }
  }
  if (opts.etag) {
    event.node.res.setHeader("etag", opts.etag);
    const ifNonMatch = event.node.req.headers["if-none-match"];
    if (ifNonMatch === opts.etag) {
      cacheMatched = true;
    }
  }
  event.node.res.setHeader("cache-control", cacheControls.join(", "));
  if (cacheMatched) {
    event.node.res.statusCode = 304;
    if (!event.handled) {
      event.node.res.end();
    }
    return true;
  }
  return false;
}

const MIMES = {
  html: "text/html",
  json: "application/json"
};

const DISALLOWED_STATUS_CHARS$2 = /[^\u0009\u0020-\u007E]/g;
function sanitizeStatusMessage$2(statusMessage = "") {
  return statusMessage.replace(DISALLOWED_STATUS_CHARS$2, "");
}
function sanitizeStatusCode$2(statusCode, defaultStatusCode = 200) {
  if (!statusCode) {
    return defaultStatusCode;
  }
  if (typeof statusCode === "string") {
    statusCode = Number.parseInt(statusCode, 10);
  }
  if (statusCode < 100 || statusCode > 999) {
    return defaultStatusCode;
  }
  return statusCode;
}
function splitCookiesString$1(cookiesString) {
  if (Array.isArray(cookiesString)) {
    return cookiesString.flatMap((c) => splitCookiesString$1(c));
  }
  if (typeof cookiesString !== "string") {
    return [];
  }
  const cookiesStrings = [];
  let pos = 0;
  let start;
  let ch;
  let lastComma;
  let nextStart;
  let cookiesSeparatorFound;
  const skipWhitespace = () => {
    while (pos < cookiesString.length && /\s/.test(cookiesString.charAt(pos))) {
      pos += 1;
    }
    return pos < cookiesString.length;
  };
  const notSpecialChar = () => {
    ch = cookiesString.charAt(pos);
    return ch !== "=" && ch !== ";" && ch !== ",";
  };
  while (pos < cookiesString.length) {
    start = pos;
    cookiesSeparatorFound = false;
    while (skipWhitespace()) {
      ch = cookiesString.charAt(pos);
      if (ch === ",") {
        lastComma = pos;
        pos += 1;
        skipWhitespace();
        nextStart = pos;
        while (pos < cookiesString.length && notSpecialChar()) {
          pos += 1;
        }
        if (pos < cookiesString.length && cookiesString.charAt(pos) === "=") {
          cookiesSeparatorFound = true;
          pos = nextStart;
          cookiesStrings.push(cookiesString.slice(start, lastComma));
          start = pos;
        } else {
          pos = lastComma + 1;
        }
      } else {
        pos += 1;
      }
    }
    if (!cookiesSeparatorFound || pos >= cookiesString.length) {
      cookiesStrings.push(cookiesString.slice(start));
    }
  }
  return cookiesStrings;
}

const defer$1 = typeof setImmediate === "undefined" ? (fn) => fn() : setImmediate;
function send$1(event, data, type) {
  if (type) {
    defaultContentType(event, type);
  }
  return new Promise((resolve) => {
    defer$1(() => {
      if (!event.handled) {
        event.node.res.end(data);
      }
      resolve();
    });
  });
}
function sendNoContent(event, code) {
  if (event.handled) {
    return;
  }
  if (!code && event.node.res.statusCode !== 200) {
    code = event.node.res.statusCode;
  }
  const _code = sanitizeStatusCode$2(code, 204);
  if (_code === 204) {
    event.node.res.removeHeader("content-length");
  }
  event.node.res.writeHead(_code);
  event.node.res.end();
}
function setResponseStatus$1(event, code, text) {
  if (code) {
    event.node.res.statusCode = sanitizeStatusCode$2(
      code,
      event.node.res.statusCode
    );
  }
  if (text) {
    event.node.res.statusMessage = sanitizeStatusMessage$2(text);
  }
}
function getResponseStatus$1(event) {
  return event.node.res.statusCode;
}
function defaultContentType(event, type) {
  if (type && event.node.res.statusCode !== 304 && !event.node.res.getHeader("content-type")) {
    event.node.res.setHeader("content-type", type);
  }
}
function sendRedirect(event, location, code = 302) {
  event.node.res.statusCode = sanitizeStatusCode$2(
    code,
    event.node.res.statusCode
  );
  event.node.res.setHeader("location", location);
  const encodedLoc = location.replace(/"/g, "%22");
  const html = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${encodedLoc}"></head></html>`;
  return send$1(event, html, MIMES.html);
}
function getResponseHeader(event, name) {
  return event.node.res.getHeader(name);
}
function setResponseHeaders$1(event, headers) {
  for (const [name, value] of Object.entries(headers)) {
    event.node.res.setHeader(
      name,
      value
    );
  }
}
const setHeaders = setResponseHeaders$1;
function setResponseHeader$2(event, name, value) {
  event.node.res.setHeader(name, value);
}
function appendResponseHeader$2(event, name, value) {
  let current = event.node.res.getHeader(name);
  if (!current) {
    event.node.res.setHeader(name, value);
    return;
  }
  if (!Array.isArray(current)) {
    current = [current.toString()];
  }
  event.node.res.setHeader(name, [...current, value]);
}
function removeResponseHeader(event, name) {
  return event.node.res.removeHeader(name);
}
function isStream(data) {
  if (!data || typeof data !== "object") {
    return false;
  }
  if (typeof data.pipe === "function") {
    if (typeof data._read === "function") {
      return true;
    }
    if (typeof data.abort === "function") {
      return true;
    }
  }
  if (typeof data.pipeTo === "function") {
    return true;
  }
  return false;
}
function isWebResponse(data) {
  return typeof Response !== "undefined" && data instanceof Response;
}
function sendStream$1(event, stream) {
  if (!stream || typeof stream !== "object") {
    throw new Error("[h3] Invalid stream provided.");
  }
  event.node.res._data = stream;
  if (!event.node.res.socket) {
    event._handled = true;
    return Promise.resolve();
  }
  if (hasProp$2(stream, "pipeTo") && typeof stream.pipeTo === "function") {
    return stream.pipeTo(
      new WritableStream({
        write(chunk) {
          event.node.res.write(chunk);
        }
      })
    ).then(() => {
      event.node.res.end();
    });
  }
  if (hasProp$2(stream, "pipe") && typeof stream.pipe === "function") {
    return new Promise((resolve, reject) => {
      stream.pipe(event.node.res);
      if (stream.on) {
        stream.on("end", () => {
          event.node.res.end();
          resolve();
        });
        stream.on("error", (error) => {
          reject(error);
        });
      }
      event.node.res.on("close", () => {
        if (stream.abort) {
          stream.abort();
        }
      });
    });
  }
  throw new Error("[h3] Invalid or incompatible stream provided.");
}
function sendWebResponse(event, response) {
  for (const [key, value] of response.headers) {
    if (key === "set-cookie") {
      event.node.res.appendHeader(key, splitCookiesString$1(value));
    } else {
      event.node.res.setHeader(key, value);
    }
  }
  if (response.status) {
    event.node.res.statusCode = sanitizeStatusCode$2(
      response.status,
      event.node.res.statusCode
    );
  }
  if (response.statusText) {
    event.node.res.statusMessage = sanitizeStatusMessage$2(response.statusText);
  }
  if (response.redirected) {
    event.node.res.setHeader("location", response.url);
  }
  if (!response.body) {
    event.node.res.end();
    return;
  }
  return sendStream$1(event, response.body);
}

const PayloadMethods = /* @__PURE__ */ new Set(["PATCH", "POST", "PUT", "DELETE"]);
const ignoredHeaders = /* @__PURE__ */ new Set([
  "transfer-encoding",
  "accept-encoding",
  "connection",
  "keep-alive",
  "upgrade",
  "expect",
  "host",
  "accept"
]);
async function proxyRequest(event, target, opts = {}) {
  let body;
  let duplex;
  if (PayloadMethods.has(event.method)) {
    if (opts.streamRequest) {
      body = getRequestWebStream(event);
      duplex = "half";
    } else {
      body = await readRawBody$1(event, false).catch(() => void 0);
    }
  }
  const method = opts.fetchOptions?.method || event.method;
  const fetchHeaders = mergeHeaders$1(
    getProxyRequestHeaders(event, { host: target.startsWith("/") }),
    opts.fetchOptions?.headers,
    opts.headers
  );
  return sendProxy(event, target, {
    ...opts,
    fetchOptions: {
      method,
      body,
      duplex,
      ...opts.fetchOptions,
      headers: fetchHeaders
    }
  });
}
async function sendProxy(event, target, opts = {}) {
  let response;
  try {
    response = await _getFetch(opts.fetch)(target, {
      headers: opts.headers,
      ignoreResponseError: true,
      // make $ofetch.raw transparent
      ...opts.fetchOptions
    });
  } catch (error) {
    throw createError$3({
      status: 502,
      statusMessage: "Bad Gateway",
      cause: error
    });
  }
  event.node.res.statusCode = sanitizeStatusCode$2(
    response.status,
    event.node.res.statusCode
  );
  event.node.res.statusMessage = sanitizeStatusMessage$2(response.statusText);
  const cookies = [];
  for (const [key, value] of response.headers.entries()) {
    if (key === "content-encoding") {
      continue;
    }
    if (key === "content-length") {
      continue;
    }
    if (key === "set-cookie") {
      cookies.push(...splitCookiesString$1(value));
      continue;
    }
    event.node.res.setHeader(key, value);
  }
  if (cookies.length > 0) {
    event.node.res.setHeader(
      "set-cookie",
      cookies.map((cookie) => {
        if (opts.cookieDomainRewrite) {
          cookie = rewriteCookieProperty(
            cookie,
            opts.cookieDomainRewrite,
            "domain"
          );
        }
        if (opts.cookiePathRewrite) {
          cookie = rewriteCookieProperty(
            cookie,
            opts.cookiePathRewrite,
            "path"
          );
        }
        return cookie;
      })
    );
  }
  if (opts.onResponse) {
    await opts.onResponse(event, response);
  }
  if (response._data !== void 0) {
    return response._data;
  }
  if (event.handled) {
    return;
  }
  if (opts.sendStream === false) {
    const data = new Uint8Array(await response.arrayBuffer());
    return event.node.res.end(data);
  }
  if (response.body) {
    for await (const chunk of response.body) {
      event.node.res.write(chunk);
    }
  }
  return event.node.res.end();
}
function getProxyRequestHeaders(event, opts) {
  const headers = /* @__PURE__ */ Object.create(null);
  const reqHeaders = getRequestHeaders$2(event);
  for (const name in reqHeaders) {
    if (!ignoredHeaders.has(name) || name === "host" && opts?.host) {
      headers[name] = reqHeaders[name];
    }
  }
  return headers;
}
function fetchWithEvent(event, req, init, options) {
  return _getFetch(options?.fetch)(req, {
    ...init,
    context: init?.context || event.context,
    headers: {
      ...getProxyRequestHeaders(event, {
        host: typeof req === "string" && req.startsWith("/")
      }),
      ...init?.headers
    }
  });
}
function _getFetch(_fetch) {
  if (_fetch) {
    return _fetch;
  }
  if (globalThis.fetch) {
    return globalThis.fetch;
  }
  throw new Error(
    "fetch is not available. Try importing `node-fetch-native/polyfill` for Node.js."
  );
}
function rewriteCookieProperty(header, map, property) {
  const _map = typeof map === "string" ? { "*": map } : map;
  return header.replace(
    new RegExp(`(;\\s*${property}=)([^;]+)`, "gi"),
    (match, prefix, previousValue) => {
      let newValue;
      if (previousValue in _map) {
        newValue = _map[previousValue];
      } else if ("*" in _map) {
        newValue = _map["*"];
      } else {
        return match;
      }
      return newValue ? prefix + newValue : "";
    }
  );
}
function mergeHeaders$1(defaults, ...inputs) {
  const _inputs = inputs.filter(Boolean);
  if (_inputs.length === 0) {
    return defaults;
  }
  const merged = new Headers(defaults);
  for (const input of _inputs) {
    const entries = Array.isArray(input) ? input : typeof input.entries === "function" ? input.entries() : Object.entries(input);
    for (const [key, value] of entries) {
      if (value !== void 0) {
        merged.set(key, value);
      }
    }
  }
  return merged;
}

class H3Event {
  "__is_event__" = true;
  // Context
  node;
  // Node
  web;
  // Web
  context = {};
  // Shared
  // Request
  _method;
  _path;
  _headers;
  _requestBody;
  // Response
  _handled = false;
  // Hooks
  _onBeforeResponseCalled;
  _onAfterResponseCalled;
  constructor(req, res) {
    this.node = { req, res };
  }
  // --- Request ---
  get method() {
    if (!this._method) {
      this._method = (this.node.req.method || "GET").toUpperCase();
    }
    return this._method;
  }
  get path() {
    return this._path || this.node.req.url || "/";
  }
  get headers() {
    if (!this._headers) {
      this._headers = _normalizeNodeHeaders(this.node.req.headers);
    }
    return this._headers;
  }
  // --- Respoonse ---
  get handled() {
    return this._handled || this.node.res.writableEnded || this.node.res.headersSent;
  }
  respondWith(response) {
    return Promise.resolve(response).then(
      (_response) => sendWebResponse(this, _response)
    );
  }
  // --- Utils ---
  toString() {
    return `[${this.method}] ${this.path}`;
  }
  toJSON() {
    return this.toString();
  }
  // --- Deprecated ---
  /** @deprecated Please use `event.node.req` instead. */
  get req() {
    return this.node.req;
  }
  /** @deprecated Please use `event.node.res` instead. */
  get res() {
    return this.node.res;
  }
}
function isEvent(input) {
  return hasProp$2(input, "__is_event__");
}
function createEvent(req, res) {
  return new H3Event(req, res);
}
function _normalizeNodeHeaders(nodeHeaders) {
  const headers = new Headers();
  for (const [name, value] of Object.entries(nodeHeaders)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(name, item);
      }
    } else if (value) {
      headers.set(name, value);
    }
  }
  return headers;
}

function defineEventHandler$1(handler) {
  if (typeof handler === "function") {
    handler.__is_handler__ = true;
    return handler;
  }
  const _hooks = {
    onRequest: _normalizeArray$1(handler.onRequest),
    onBeforeResponse: _normalizeArray$1(handler.onBeforeResponse)
  };
  const _handler = (event) => {
    return _callHandler$1(event, handler.handler, _hooks);
  };
  _handler.__is_handler__ = true;
  _handler.__resolve__ = handler.handler.__resolve__;
  _handler.__websocket__ = handler.websocket;
  return _handler;
}
function _normalizeArray$1(input) {
  return input ? Array.isArray(input) ? input : [input] : void 0;
}
async function _callHandler$1(event, handler, hooks) {
  if (hooks.onRequest) {
    for (const hook of hooks.onRequest) {
      await hook(event);
      if (event.handled) {
        return;
      }
    }
  }
  const body = await handler(event);
  const response = { body };
  if (hooks.onBeforeResponse) {
    for (const hook of hooks.onBeforeResponse) {
      await hook(event, response);
    }
  }
  return response.body;
}
const eventHandler = defineEventHandler$1;
function isEventHandler(input) {
  return hasProp$2(input, "__is_handler__");
}
function toEventHandler(input, _, _route) {
  if (!isEventHandler(input)) {
    console.warn(
      "[h3] Implicit event handler conversion is deprecated. Use `eventHandler()` or `fromNodeMiddleware()` to define event handlers.",
      _route && _route !== "/" ? `
     Route: ${_route}` : "",
      `
     Handler: ${input}`
    );
  }
  return input;
}
function defineLazyEventHandler(factory) {
  let _promise;
  let _resolved;
  const resolveHandler = () => {
    if (_resolved) {
      return Promise.resolve(_resolved);
    }
    if (!_promise) {
      _promise = Promise.resolve(factory()).then((r) => {
        const handler2 = r.default || r;
        if (typeof handler2 !== "function") {
          throw new TypeError(
            "Invalid lazy handler result. It should be a function:",
            handler2
          );
        }
        _resolved = { handler: toEventHandler(r.default || r) };
        return _resolved;
      });
    }
    return _promise;
  };
  const handler = eventHandler((event) => {
    if (_resolved) {
      return _resolved.handler(event);
    }
    return resolveHandler().then((r) => r.handler(event));
  });
  handler.__resolve__ = resolveHandler;
  return handler;
}
const lazyEventHandler = defineLazyEventHandler;

function createApp(options = {}) {
  const stack = [];
  const handler = createAppEventHandler(stack, options);
  const resolve = createResolver(stack);
  handler.__resolve__ = resolve;
  const getWebsocket = cachedFn(() => websocketOptions(resolve, options));
  const app = {
    // @ts-expect-error
    use: (arg1, arg2, arg3) => use(app, arg1, arg2, arg3),
    resolve,
    handler,
    stack,
    options,
    get websocket() {
      return getWebsocket();
    }
  };
  return app;
}
function use(app, arg1, arg2, arg3) {
  if (Array.isArray(arg1)) {
    for (const i of arg1) {
      use(app, i, arg2, arg3);
    }
  } else if (Array.isArray(arg2)) {
    for (const i of arg2) {
      use(app, arg1, i, arg3);
    }
  } else if (typeof arg1 === "string") {
    app.stack.push(
      normalizeLayer({ ...arg3, route: arg1, handler: arg2 })
    );
  } else if (typeof arg1 === "function") {
    app.stack.push(normalizeLayer({ ...arg2, handler: arg1 }));
  } else {
    app.stack.push(normalizeLayer({ ...arg1 }));
  }
  return app;
}
function createAppEventHandler(stack, options) {
  const spacing = options.debug ? 2 : void 0;
  return eventHandler(async (event) => {
    event.node.req.originalUrl = event.node.req.originalUrl || event.node.req.url || "/";
    const _reqPath = event._path || event.node.req.url || "/";
    let _layerPath;
    if (options.onRequest) {
      await options.onRequest(event);
    }
    for (const layer of stack) {
      if (layer.route.length > 1) {
        if (!_reqPath.startsWith(layer.route)) {
          continue;
        }
        _layerPath = _reqPath.slice(layer.route.length) || "/";
      } else {
        _layerPath = _reqPath;
      }
      if (layer.match && !layer.match(_layerPath, event)) {
        continue;
      }
      event._path = _layerPath;
      event.node.req.url = _layerPath;
      const val = await layer.handler(event);
      const _body = val === void 0 ? void 0 : await val;
      if (_body !== void 0) {
        const _response = { body: _body };
        if (options.onBeforeResponse) {
          event._onBeforeResponseCalled = true;
          await options.onBeforeResponse(event, _response);
        }
        await handleHandlerResponse(event, _response.body, spacing);
        if (options.onAfterResponse) {
          event._onAfterResponseCalled = true;
          await options.onAfterResponse(event, _response);
        }
        return;
      }
      if (event.handled) {
        if (options.onAfterResponse) {
          event._onAfterResponseCalled = true;
          await options.onAfterResponse(event, void 0);
        }
        return;
      }
    }
    if (!event.handled) {
      throw createError$3({
        statusCode: 404,
        statusMessage: `Cannot find any path matching ${event.path || "/"}.`
      });
    }
    if (options.onAfterResponse) {
      event._onAfterResponseCalled = true;
      await options.onAfterResponse(event, void 0);
    }
  });
}
function createResolver(stack) {
  return async (path) => {
    let _layerPath;
    for (const layer of stack) {
      if (layer.route === "/" && !layer.handler.__resolve__) {
        continue;
      }
      if (!path.startsWith(layer.route)) {
        continue;
      }
      _layerPath = path.slice(layer.route.length) || "/";
      if (layer.match && !layer.match(_layerPath, void 0)) {
        continue;
      }
      let res = { route: layer.route, handler: layer.handler };
      if (res.handler.__resolve__) {
        const _res = await res.handler.__resolve__(_layerPath);
        if (!_res) {
          continue;
        }
        res = {
          ...res,
          ..._res,
          route: joinURL(res.route || "/", _res.route || "/")
        };
      }
      return res;
    }
  };
}
function normalizeLayer(input) {
  let handler = input.handler;
  if (handler.handler) {
    handler = handler.handler;
  }
  if (input.lazy) {
    handler = lazyEventHandler(handler);
  } else if (!isEventHandler(handler)) {
    handler = toEventHandler(handler, void 0, input.route);
  }
  return {
    route: withoutTrailingSlash(input.route),
    match: input.match,
    handler
  };
}
function handleHandlerResponse(event, val, jsonSpace) {
  if (val === null) {
    return sendNoContent(event);
  }
  if (val) {
    if (isWebResponse(val)) {
      return sendWebResponse(event, val);
    }
    if (isStream(val)) {
      return sendStream$1(event, val);
    }
    if (val.buffer) {
      return send$1(event, val);
    }
    if (val.arrayBuffer && typeof val.arrayBuffer === "function") {
      return val.arrayBuffer().then((arrayBuffer) => {
        return send$1(event, Buffer.from(arrayBuffer), val.type);
      });
    }
    if (val instanceof Error) {
      throw createError$3(val);
    }
    if (typeof val.end === "function") {
      return true;
    }
  }
  const valType = typeof val;
  if (valType === "string") {
    return send$1(event, val, MIMES.html);
  }
  if (valType === "object" || valType === "boolean" || valType === "number") {
    return send$1(event, JSON.stringify(val, void 0, jsonSpace), MIMES.json);
  }
  if (valType === "bigint") {
    return send$1(event, val.toString(), MIMES.json);
  }
  throw createError$3({
    statusCode: 500,
    statusMessage: `[h3] Cannot send ${valType} as response.`
  });
}
function cachedFn(fn) {
  let cache;
  return () => {
    if (!cache) {
      cache = fn();
    }
    return cache;
  };
}
function websocketOptions(evResolver, appOptions) {
  return {
    ...appOptions.websocket,
    async resolve(info) {
      const url = info.request?.url || info.url || "/";
      const { pathname } = typeof url === "string" ? parseURL(url) : url;
      const resolved = await evResolver(pathname);
      return resolved?.handler?.__websocket__ || {};
    }
  };
}

const RouterMethods = [
  "connect",
  "delete",
  "get",
  "head",
  "options",
  "post",
  "put",
  "trace",
  "patch"
];
function createRouter(opts = {}) {
  const _router = createRouter$1({});
  const routes = {};
  let _matcher;
  const router = {};
  const addRoute = (path, handler, method) => {
    let route = routes[path];
    if (!route) {
      routes[path] = route = { path, handlers: {} };
      _router.insert(path, route);
    }
    if (Array.isArray(method)) {
      for (const m of method) {
        addRoute(path, handler, m);
      }
    } else {
      route.handlers[method] = toEventHandler(handler, void 0, path);
    }
    return router;
  };
  router.use = router.add = (path, handler, method) => addRoute(path, handler, method || "all");
  for (const method of RouterMethods) {
    router[method] = (path, handle) => router.add(path, handle, method);
  }
  const matchHandler = (path = "/", method = "get") => {
    const qIndex = path.indexOf("?");
    if (qIndex !== -1) {
      path = path.slice(0, Math.max(0, qIndex));
    }
    const matched = _router.lookup(path);
    if (!matched || !matched.handlers) {
      return {
        error: createError$3({
          statusCode: 404,
          name: "Not Found",
          statusMessage: `Cannot find any route matching ${path || "/"}.`
        })
      };
    }
    let handler = matched.handlers[method] || matched.handlers.all;
    if (!handler) {
      if (!_matcher) {
        _matcher = toRouteMatcher(_router);
      }
      const _matches = _matcher.matchAll(path).reverse();
      for (const _match of _matches) {
        if (_match.handlers[method]) {
          handler = _match.handlers[method];
          matched.handlers[method] = matched.handlers[method] || handler;
          break;
        }
        if (_match.handlers.all) {
          handler = _match.handlers.all;
          matched.handlers.all = matched.handlers.all || handler;
          break;
        }
      }
    }
    if (!handler) {
      return {
        error: createError$3({
          statusCode: 405,
          name: "Method Not Allowed",
          statusMessage: `Method ${method} is not allowed on this route.`
        })
      };
    }
    return { matched, handler };
  };
  const isPreemptive = opts.preemptive || opts.preemtive;
  router.handler = eventHandler((event) => {
    const match = matchHandler(
      event.path,
      event.method.toLowerCase()
    );
    if ("error" in match) {
      if (isPreemptive) {
        throw match.error;
      } else {
        return;
      }
    }
    event.context.matchedRoute = match.matched;
    const params = match.matched.params || {};
    event.context.params = params;
    return Promise.resolve(match.handler(event)).then((res) => {
      if (res === void 0 && isPreemptive) {
        return null;
      }
      return res;
    });
  });
  router.handler.__resolve__ = async (path) => {
    path = withLeadingSlash(path);
    const match = matchHandler(path);
    if ("error" in match) {
      return;
    }
    let res = {
      route: match.matched.path,
      handler: match.handler
    };
    if (match.handler.__resolve__) {
      const _res = await match.handler.__resolve__(path);
      if (!_res) {
        return;
      }
      res = { ...res, ..._res };
    }
    return res;
  };
  return router;
}
function toNodeListener(app) {
  const toNodeHandle = async function(req, res) {
    const event = createEvent(req, res);
    try {
      await app.handler(event);
    } catch (_error) {
      const error = createError$3(_error);
      if (!isError$2(_error)) {
        error.unhandled = true;
      }
      setResponseStatus$1(event, error.statusCode, error.statusMessage);
      if (app.options.onError) {
        await app.options.onError(error, event);
      }
      if (event.handled) {
        return;
      }
      if (error.unhandled || error.fatal) {
        console.error("[h3]", error.fatal ? "[fatal]" : "[unhandled]", error);
      }
      if (app.options.onBeforeResponse && !event._onBeforeResponseCalled) {
        await app.options.onBeforeResponse(event, { body: error });
      }
      await sendError(event, error, !!app.options.debug);
      if (app.options.onAfterResponse && !event._onAfterResponseCalled) {
        await app.options.onAfterResponse(event, { body: error });
      }
    }
  };
  return toNodeHandle;
}

function flatHooks(configHooks, hooks = {}, parentName) {
  for (const key in configHooks) {
    const subHook = configHooks[key];
    const name = parentName ? `${parentName}:${key}` : key;
    if (typeof subHook === "object" && subHook !== null) {
      flatHooks(subHook, hooks, name);
    } else if (typeof subHook === "function") {
      hooks[name] = subHook;
    }
  }
  return hooks;
}
const defaultTask = { run: (function_) => function_() };
const _createTask = () => defaultTask;
const createTask = typeof console.createTask !== "undefined" ? console.createTask : _createTask;
function serialTaskCaller(hooks, args) {
  const name = args.shift();
  const task = createTask(name);
  return hooks.reduce(
    (promise, hookFunction) => promise.then(() => task.run(() => hookFunction(...args))),
    Promise.resolve()
  );
}
function parallelTaskCaller(hooks, args) {
  const name = args.shift();
  const task = createTask(name);
  return Promise.all(hooks.map((hook) => task.run(() => hook(...args))));
}
function callEachWith(callbacks, arg0) {
  for (const callback of [...callbacks]) {
    callback(arg0);
  }
}

class Hookable {
  constructor() {
    this._hooks = {};
    this._before = void 0;
    this._after = void 0;
    this._deprecatedMessages = void 0;
    this._deprecatedHooks = {};
    this.hook = this.hook.bind(this);
    this.callHook = this.callHook.bind(this);
    this.callHookWith = this.callHookWith.bind(this);
  }
  hook(name, function_, options = {}) {
    if (!name || typeof function_ !== "function") {
      return () => {
      };
    }
    const originalName = name;
    let dep;
    while (this._deprecatedHooks[name]) {
      dep = this._deprecatedHooks[name];
      name = dep.to;
    }
    if (dep && !options.allowDeprecated) {
      let message = dep.message;
      if (!message) {
        message = `${originalName} hook has been deprecated` + (dep.to ? `, please use ${dep.to}` : "");
      }
      if (!this._deprecatedMessages) {
        this._deprecatedMessages = /* @__PURE__ */ new Set();
      }
      if (!this._deprecatedMessages.has(message)) {
        console.warn(message);
        this._deprecatedMessages.add(message);
      }
    }
    if (!function_.name) {
      try {
        Object.defineProperty(function_, "name", {
          get: () => "_" + name.replace(/\W+/g, "_") + "_hook_cb",
          configurable: true
        });
      } catch {
      }
    }
    this._hooks[name] = this._hooks[name] || [];
    this._hooks[name].push(function_);
    return () => {
      if (function_) {
        this.removeHook(name, function_);
        function_ = void 0;
      }
    };
  }
  hookOnce(name, function_) {
    let _unreg;
    let _function = (...arguments_) => {
      if (typeof _unreg === "function") {
        _unreg();
      }
      _unreg = void 0;
      _function = void 0;
      return function_(...arguments_);
    };
    _unreg = this.hook(name, _function);
    return _unreg;
  }
  removeHook(name, function_) {
    if (this._hooks[name]) {
      const index = this._hooks[name].indexOf(function_);
      if (index !== -1) {
        this._hooks[name].splice(index, 1);
      }
      if (this._hooks[name].length === 0) {
        delete this._hooks[name];
      }
    }
  }
  deprecateHook(name, deprecated) {
    this._deprecatedHooks[name] = typeof deprecated === "string" ? { to: deprecated } : deprecated;
    const _hooks = this._hooks[name] || [];
    delete this._hooks[name];
    for (const hook of _hooks) {
      this.hook(name, hook);
    }
  }
  deprecateHooks(deprecatedHooks) {
    Object.assign(this._deprecatedHooks, deprecatedHooks);
    for (const name in deprecatedHooks) {
      this.deprecateHook(name, deprecatedHooks[name]);
    }
  }
  addHooks(configHooks) {
    const hooks = flatHooks(configHooks);
    const removeFns = Object.keys(hooks).map(
      (key) => this.hook(key, hooks[key])
    );
    return () => {
      for (const unreg of removeFns.splice(0, removeFns.length)) {
        unreg();
      }
    };
  }
  removeHooks(configHooks) {
    const hooks = flatHooks(configHooks);
    for (const key in hooks) {
      this.removeHook(key, hooks[key]);
    }
  }
  removeAllHooks() {
    for (const key in this._hooks) {
      delete this._hooks[key];
    }
  }
  callHook(name, ...arguments_) {
    arguments_.unshift(name);
    return this.callHookWith(serialTaskCaller, name, ...arguments_);
  }
  callHookParallel(name, ...arguments_) {
    arguments_.unshift(name);
    return this.callHookWith(parallelTaskCaller, name, ...arguments_);
  }
  callHookWith(caller, name, ...arguments_) {
    const event = this._before || this._after ? { name, args: arguments_, context: {} } : void 0;
    if (this._before) {
      callEachWith(this._before, event);
    }
    const result = caller(
      name in this._hooks ? [...this._hooks[name]] : [],
      arguments_
    );
    if (result instanceof Promise) {
      return result.finally(() => {
        if (this._after && event) {
          callEachWith(this._after, event);
        }
      });
    }
    if (this._after && event) {
      callEachWith(this._after, event);
    }
    return result;
  }
  beforeEach(function_) {
    this._before = this._before || [];
    this._before.push(function_);
    return () => {
      if (this._before !== void 0) {
        const index = this._before.indexOf(function_);
        if (index !== -1) {
          this._before.splice(index, 1);
        }
      }
    };
  }
  afterEach(function_) {
    this._after = this._after || [];
    this._after.push(function_);
    return () => {
      if (this._after !== void 0) {
        const index = this._after.indexOf(function_);
        if (index !== -1) {
          this._after.splice(index, 1);
        }
      }
    };
  }
}
function createHooks() {
  return new Hookable();
}

const s$1=globalThis.Headers,i$1=globalThis.AbortController,l$1=globalThis.fetch||(()=>{throw new Error("[node-fetch-native] Failed to fetch: `globalThis.fetch` is not available!")});

class FetchError extends Error {
  constructor(message, opts) {
    super(message, opts);
    this.name = "FetchError";
    if (opts?.cause && !this.cause) {
      this.cause = opts.cause;
    }
  }
}
function createFetchError(ctx) {
  const errorMessage = ctx.error?.message || ctx.error?.toString() || "";
  const method = ctx.request?.method || ctx.options?.method || "GET";
  const url = ctx.request?.url || String(ctx.request) || "/";
  const requestStr = `[${method}] ${JSON.stringify(url)}`;
  const statusStr = ctx.response ? `${ctx.response.status} ${ctx.response.statusText}` : "<no response>";
  const message = `${requestStr}: ${statusStr}${errorMessage ? ` ${errorMessage}` : ""}`;
  const fetchError = new FetchError(
    message,
    ctx.error ? { cause: ctx.error } : void 0
  );
  for (const key of ["request", "options", "response"]) {
    Object.defineProperty(fetchError, key, {
      get() {
        return ctx[key];
      }
    });
  }
  for (const [key, refKey] of [
    ["data", "_data"],
    ["status", "status"],
    ["statusCode", "status"],
    ["statusText", "statusText"],
    ["statusMessage", "statusText"]
  ]) {
    Object.defineProperty(fetchError, key, {
      get() {
        return ctx.response && ctx.response[refKey];
      }
    });
  }
  return fetchError;
}

const payloadMethods = new Set(
  Object.freeze(["PATCH", "POST", "PUT", "DELETE"])
);
function isPayloadMethod(method = "GET") {
  return payloadMethods.has(method.toUpperCase());
}
function isJSONSerializable(value) {
  if (value === void 0) {
    return false;
  }
  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean" || t === null) {
    return true;
  }
  if (t !== "object") {
    return false;
  }
  if (Array.isArray(value)) {
    return true;
  }
  if (value.buffer) {
    return false;
  }
  if (value instanceof FormData || value instanceof URLSearchParams) {
    return false;
  }
  return value.constructor && value.constructor.name === "Object" || typeof value.toJSON === "function";
}
const textTypes = /* @__PURE__ */ new Set([
  "image/svg",
  "application/xml",
  "application/xhtml",
  "application/html"
]);
const JSON_RE = /^application\/(?:[\w!#$%&*.^`~-]*\+)?json(;.+)?$/i;
function detectResponseType(_contentType = "") {
  if (!_contentType) {
    return "json";
  }
  const contentType = _contentType.split(";").shift() || "";
  if (JSON_RE.test(contentType)) {
    return "json";
  }
  if (contentType === "text/event-stream") {
    return "stream";
  }
  if (textTypes.has(contentType) || contentType.startsWith("text/")) {
    return "text";
  }
  return "blob";
}
function resolveFetchOptions(request, input, defaults, Headers) {
  const headers = mergeHeaders(
    input?.headers ?? request?.headers,
    defaults?.headers,
    Headers
  );
  let query;
  if (defaults?.query || defaults?.params || input?.params || input?.query) {
    query = {
      ...defaults?.params,
      ...defaults?.query,
      ...input?.params,
      ...input?.query
    };
  }
  return {
    ...defaults,
    ...input,
    query,
    params: query,
    headers
  };
}
function mergeHeaders(input, defaults, Headers) {
  if (!defaults) {
    return new Headers(input);
  }
  const headers = new Headers(defaults);
  if (input) {
    for (const [key, value] of Symbol.iterator in input || Array.isArray(input) ? input : new Headers(input)) {
      headers.set(key, value);
    }
  }
  return headers;
}
async function callHooks(context, hooks) {
  if (hooks) {
    if (Array.isArray(hooks)) {
      for (const hook of hooks) {
        await hook(context);
      }
    } else {
      await hooks(context);
    }
  }
}

const retryStatusCodes = /* @__PURE__ */ new Set([
  408,
  // Request Timeout
  409,
  // Conflict
  425,
  // Too Early (Experimental)
  429,
  // Too Many Requests
  500,
  // Internal Server Error
  502,
  // Bad Gateway
  503,
  // Service Unavailable
  504
  // Gateway Timeout
]);
const nullBodyResponses = /* @__PURE__ */ new Set([101, 204, 205, 304]);
function createFetch(globalOptions = {}) {
  const {
    fetch = globalThis.fetch,
    Headers = globalThis.Headers,
    AbortController = globalThis.AbortController
  } = globalOptions;
  async function onError(context) {
    const isAbort = context.error && context.error.name === "AbortError" && !context.options.timeout || false;
    if (context.options.retry !== false && !isAbort) {
      let retries;
      if (typeof context.options.retry === "number") {
        retries = context.options.retry;
      } else {
        retries = isPayloadMethod(context.options.method) ? 0 : 1;
      }
      const responseCode = context.response && context.response.status || 500;
      if (retries > 0 && (Array.isArray(context.options.retryStatusCodes) ? context.options.retryStatusCodes.includes(responseCode) : retryStatusCodes.has(responseCode))) {
        const retryDelay = typeof context.options.retryDelay === "function" ? context.options.retryDelay(context) : context.options.retryDelay || 0;
        if (retryDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
        return $fetchRaw(context.request, {
          ...context.options,
          retry: retries - 1
        });
      }
    }
    const error = createFetchError(context);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(error, $fetchRaw);
    }
    throw error;
  }
  const $fetchRaw = async function $fetchRaw2(_request, _options = {}) {
    const context = {
      request: _request,
      options: resolveFetchOptions(
        _request,
        _options,
        globalOptions.defaults,
        Headers
      ),
      response: void 0,
      error: void 0
    };
    if (context.options.method) {
      context.options.method = context.options.method.toUpperCase();
    }
    if (context.options.onRequest) {
      await callHooks(context, context.options.onRequest);
      if (!(context.options.headers instanceof Headers)) {
        context.options.headers = new Headers(
          context.options.headers || {}
          /* compat */
        );
      }
    }
    if (typeof context.request === "string") {
      if (context.options.baseURL) {
        context.request = withBase(context.request, context.options.baseURL);
      }
      if (context.options.query) {
        context.request = withQuery(context.request, context.options.query);
        delete context.options.query;
      }
      if ("query" in context.options) {
        delete context.options.query;
      }
      if ("params" in context.options) {
        delete context.options.params;
      }
    }
    if (context.options.body && isPayloadMethod(context.options.method)) {
      if (isJSONSerializable(context.options.body)) {
        const contentType = context.options.headers.get("content-type");
        if (typeof context.options.body !== "string") {
          context.options.body = contentType === "application/x-www-form-urlencoded" ? new URLSearchParams(
            context.options.body
          ).toString() : JSON.stringify(context.options.body);
        }
        if (!contentType) {
          context.options.headers.set("content-type", "application/json");
        }
        if (!context.options.headers.has("accept")) {
          context.options.headers.set("accept", "application/json");
        }
      } else if (
        // ReadableStream Body
        "pipeTo" in context.options.body && typeof context.options.body.pipeTo === "function" || // Node.js Stream Body
        typeof context.options.body.pipe === "function"
      ) {
        if (!("duplex" in context.options)) {
          context.options.duplex = "half";
        }
      }
    }
    let abortTimeout;
    if (!context.options.signal && context.options.timeout) {
      const controller = new AbortController();
      abortTimeout = setTimeout(() => {
        const error = new Error(
          "[TimeoutError]: The operation was aborted due to timeout"
        );
        error.name = "TimeoutError";
        error.code = 23;
        controller.abort(error);
      }, context.options.timeout);
      context.options.signal = controller.signal;
    }
    try {
      context.response = await fetch(
        context.request,
        context.options
      );
    } catch (error) {
      context.error = error;
      if (context.options.onRequestError) {
        await callHooks(
          context,
          context.options.onRequestError
        );
      }
      return await onError(context);
    } finally {
      if (abortTimeout) {
        clearTimeout(abortTimeout);
      }
    }
    const hasBody = (context.response.body || // https://github.com/unjs/ofetch/issues/324
    // https://github.com/unjs/ofetch/issues/294
    // https://github.com/JakeChampion/fetch/issues/1454
    context.response._bodyInit) && !nullBodyResponses.has(context.response.status) && context.options.method !== "HEAD";
    if (hasBody) {
      const responseType = (context.options.parseResponse ? "json" : context.options.responseType) || detectResponseType(context.response.headers.get("content-type") || "");
      switch (responseType) {
        case "json": {
          const data = await context.response.text();
          const parseFunction = context.options.parseResponse || destr;
          context.response._data = parseFunction(data);
          break;
        }
        case "stream": {
          context.response._data = context.response.body || context.response._bodyInit;
          break;
        }
        default: {
          context.response._data = await context.response[responseType]();
        }
      }
    }
    if (context.options.onResponse) {
      await callHooks(
        context,
        context.options.onResponse
      );
    }
    if (!context.options.ignoreResponseError && context.response.status >= 400 && context.response.status < 600) {
      if (context.options.onResponseError) {
        await callHooks(
          context,
          context.options.onResponseError
        );
      }
      return await onError(context);
    }
    return context.response;
  };
  const $fetch = async function $fetch2(request, options) {
    const r = await $fetchRaw(request, options);
    return r._data;
  };
  $fetch.raw = $fetchRaw;
  $fetch.native = (...args) => fetch(...args);
  $fetch.create = (defaultOptions = {}, customGlobalOptions = {}) => createFetch({
    ...globalOptions,
    ...customGlobalOptions,
    defaults: {
      ...globalOptions.defaults,
      ...customGlobalOptions.defaults,
      ...defaultOptions
    }
  });
  return $fetch;
}

function createNodeFetch() {
  const useKeepAlive = JSON.parse(process.env.FETCH_KEEP_ALIVE || "false");
  if (!useKeepAlive) {
    return l$1;
  }
  const agentOptions = { keepAlive: true };
  const httpAgent = new http.Agent(agentOptions);
  const httpsAgent = new https.Agent(agentOptions);
  const nodeFetchOptions = {
    agent(parsedURL) {
      return parsedURL.protocol === "http:" ? httpAgent : httpsAgent;
    }
  };
  return function nodeFetchWithKeepAlive(input, init) {
    return l$1(input, { ...nodeFetchOptions, ...init });
  };
}
const fetch = globalThis.fetch ? (...args) => globalThis.fetch(...args) : createNodeFetch();
const Headers$1 = globalThis.Headers || s$1;
const AbortController = globalThis.AbortController || i$1;
const ofetch = createFetch({ fetch, Headers: Headers$1, AbortController });
const $fetch = ofetch;

function wrapToPromise(value) {
  if (!value || typeof value.then !== "function") {
    return Promise.resolve(value);
  }
  return value;
}
function asyncCall(function_, ...arguments_) {
  try {
    return wrapToPromise(function_(...arguments_));
  } catch (error) {
    return Promise.reject(error);
  }
}
function isPrimitive(value) {
  const type = typeof value;
  return value === null || type !== "object" && type !== "function";
}
function isPureObject(value) {
  const proto = Object.getPrototypeOf(value);
  return !proto || proto.isPrototypeOf(Object);
}
function stringify(value) {
  if (isPrimitive(value)) {
    return String(value);
  }
  if (isPureObject(value) || Array.isArray(value)) {
    return JSON.stringify(value);
  }
  if (typeof value.toJSON === "function") {
    return stringify(value.toJSON());
  }
  throw new Error("[unstorage] Cannot stringify value!");
}
const BASE64_PREFIX = "base64:";
function serializeRaw(value) {
  if (typeof value === "string") {
    return value;
  }
  return BASE64_PREFIX + base64Encode(value);
}
function deserializeRaw(value) {
  if (typeof value !== "string") {
    return value;
  }
  if (!value.startsWith(BASE64_PREFIX)) {
    return value;
  }
  return base64Decode(value.slice(BASE64_PREFIX.length));
}
function base64Decode(input) {
  if (globalThis.Buffer) {
    return Buffer.from(input, "base64");
  }
  return Uint8Array.from(
    globalThis.atob(input),
    (c) => c.codePointAt(0)
  );
}
function base64Encode(input) {
  if (globalThis.Buffer) {
    return Buffer.from(input).toString("base64");
  }
  return globalThis.btoa(String.fromCodePoint(...input));
}

const storageKeyProperties = [
  "has",
  "hasItem",
  "get",
  "getItem",
  "getItemRaw",
  "set",
  "setItem",
  "setItemRaw",
  "del",
  "remove",
  "removeItem",
  "getMeta",
  "setMeta",
  "removeMeta",
  "getKeys",
  "clear",
  "mount",
  "unmount"
];
function prefixStorage(storage, base) {
  base = normalizeBaseKey(base);
  if (!base) {
    return storage;
  }
  const nsStorage = { ...storage };
  for (const property of storageKeyProperties) {
    nsStorage[property] = (key = "", ...args) => (
      // @ts-ignore
      storage[property](base + key, ...args)
    );
  }
  nsStorage.getKeys = (key = "", ...arguments_) => storage.getKeys(base + key, ...arguments_).then((keys) => keys.map((key2) => key2.slice(base.length)));
  nsStorage.keys = nsStorage.getKeys;
  nsStorage.getItems = async (items, commonOptions) => {
    const prefixedItems = items.map(
      (item) => typeof item === "string" ? base + item : { ...item, key: base + item.key }
    );
    const results = await storage.getItems(prefixedItems, commonOptions);
    return results.map((entry) => ({
      key: entry.key.slice(base.length),
      value: entry.value
    }));
  };
  nsStorage.setItems = async (items, commonOptions) => {
    const prefixedItems = items.map((item) => ({
      key: base + item.key,
      value: item.value,
      options: item.options
    }));
    return storage.setItems(prefixedItems, commonOptions);
  };
  return nsStorage;
}
function normalizeKey$1(key) {
  if (!key) {
    return "";
  }
  return key.split("?")[0]?.replace(/[/\\]/g, ":").replace(/:+/g, ":").replace(/^:|:$/g, "") || "";
}
function joinKeys(...keys) {
  return normalizeKey$1(keys.join(":"));
}
function normalizeBaseKey(base) {
  base = normalizeKey$1(base);
  return base ? base + ":" : "";
}
function filterKeyByDepth(key, depth) {
  if (depth === void 0) {
    return true;
  }
  let substrCount = 0;
  let index = key.indexOf(":");
  while (index > -1) {
    substrCount++;
    index = key.indexOf(":", index + 1);
  }
  return substrCount <= depth;
}
function filterKeyByBase(key, base) {
  if (base) {
    return key.startsWith(base) && key[key.length - 1] !== "$";
  }
  return key[key.length - 1] !== "$";
}

function defineDriver$1(factory) {
  return factory;
}

const DRIVER_NAME$1 = "memory";
const memory = defineDriver$1(() => {
  const data = /* @__PURE__ */ new Map();
  return {
    name: DRIVER_NAME$1,
    getInstance: () => data,
    hasItem(key) {
      return data.has(key);
    },
    getItem(key) {
      return data.get(key) ?? null;
    },
    getItemRaw(key) {
      return data.get(key) ?? null;
    },
    setItem(key, value) {
      data.set(key, value);
    },
    setItemRaw(key, value) {
      data.set(key, value);
    },
    removeItem(key) {
      data.delete(key);
    },
    getKeys() {
      return [...data.keys()];
    },
    clear() {
      data.clear();
    },
    dispose() {
      data.clear();
    }
  };
});

function createStorage(options = {}) {
  const context = {
    mounts: { "": options.driver || memory() },
    mountpoints: [""],
    watching: false,
    watchListeners: [],
    unwatch: {}
  };
  const getMount = (key) => {
    for (const base of context.mountpoints) {
      if (key.startsWith(base)) {
        return {
          base,
          relativeKey: key.slice(base.length),
          driver: context.mounts[base]
        };
      }
    }
    return {
      base: "",
      relativeKey: key,
      driver: context.mounts[""]
    };
  };
  const getMounts = (base, includeParent) => {
    return context.mountpoints.filter(
      (mountpoint) => mountpoint.startsWith(base) || includeParent && base.startsWith(mountpoint)
    ).map((mountpoint) => ({
      relativeBase: base.length > mountpoint.length ? base.slice(mountpoint.length) : void 0,
      mountpoint,
      driver: context.mounts[mountpoint]
    }));
  };
  const onChange = (event, key) => {
    if (!context.watching) {
      return;
    }
    key = normalizeKey$1(key);
    for (const listener of context.watchListeners) {
      listener(event, key);
    }
  };
  const startWatch = async () => {
    if (context.watching) {
      return;
    }
    context.watching = true;
    for (const mountpoint in context.mounts) {
      context.unwatch[mountpoint] = await watch(
        context.mounts[mountpoint],
        onChange,
        mountpoint
      );
    }
  };
  const stopWatch = async () => {
    if (!context.watching) {
      return;
    }
    for (const mountpoint in context.unwatch) {
      await context.unwatch[mountpoint]();
    }
    context.unwatch = {};
    context.watching = false;
  };
  const runBatch = (items, commonOptions, cb) => {
    const batches = /* @__PURE__ */ new Map();
    const getBatch = (mount) => {
      let batch = batches.get(mount.base);
      if (!batch) {
        batch = {
          driver: mount.driver,
          base: mount.base,
          items: []
        };
        batches.set(mount.base, batch);
      }
      return batch;
    };
    for (const item of items) {
      const isStringItem = typeof item === "string";
      const key = normalizeKey$1(isStringItem ? item : item.key);
      const value = isStringItem ? void 0 : item.value;
      const options2 = isStringItem || !item.options ? commonOptions : { ...commonOptions, ...item.options };
      const mount = getMount(key);
      getBatch(mount).items.push({
        key,
        value,
        relativeKey: mount.relativeKey,
        options: options2
      });
    }
    return Promise.all([...batches.values()].map((batch) => cb(batch))).then(
      (r) => r.flat()
    );
  };
  const storage = {
    // Item
    hasItem(key, opts = {}) {
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      return asyncCall(driver.hasItem, relativeKey, opts);
    },
    getItem(key, opts = {}) {
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      return asyncCall(driver.getItem, relativeKey, opts).then(
        (value) => destr(value)
      );
    },
    getItems(items, commonOptions = {}) {
      return runBatch(items, commonOptions, (batch) => {
        if (batch.driver.getItems) {
          return asyncCall(
            batch.driver.getItems,
            batch.items.map((item) => ({
              key: item.relativeKey,
              options: item.options
            })),
            commonOptions
          ).then(
            (r) => r.map((item) => ({
              key: joinKeys(batch.base, item.key),
              value: destr(item.value)
            }))
          );
        }
        return Promise.all(
          batch.items.map((item) => {
            return asyncCall(
              batch.driver.getItem,
              item.relativeKey,
              item.options
            ).then((value) => ({
              key: item.key,
              value: destr(value)
            }));
          })
        );
      });
    },
    getItemRaw(key, opts = {}) {
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (driver.getItemRaw) {
        return asyncCall(driver.getItemRaw, relativeKey, opts);
      }
      return asyncCall(driver.getItem, relativeKey, opts).then(
        (value) => deserializeRaw(value)
      );
    },
    async setItem(key, value, opts = {}) {
      if (value === void 0) {
        return storage.removeItem(key);
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (!driver.setItem) {
        return;
      }
      await asyncCall(driver.setItem, relativeKey, stringify(value), opts);
      if (!driver.watch) {
        onChange("update", key);
      }
    },
    async setItems(items, commonOptions) {
      await runBatch(items, commonOptions, async (batch) => {
        if (batch.driver.setItems) {
          return asyncCall(
            batch.driver.setItems,
            batch.items.map((item) => ({
              key: item.relativeKey,
              value: stringify(item.value),
              options: item.options
            })),
            commonOptions
          );
        }
        if (!batch.driver.setItem) {
          return;
        }
        await Promise.all(
          batch.items.map((item) => {
            return asyncCall(
              batch.driver.setItem,
              item.relativeKey,
              stringify(item.value),
              item.options
            );
          })
        );
      });
    },
    async setItemRaw(key, value, opts = {}) {
      if (value === void 0) {
        return storage.removeItem(key, opts);
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (driver.setItemRaw) {
        await asyncCall(driver.setItemRaw, relativeKey, value, opts);
      } else if (driver.setItem) {
        await asyncCall(driver.setItem, relativeKey, serializeRaw(value), opts);
      } else {
        return;
      }
      if (!driver.watch) {
        onChange("update", key);
      }
    },
    async removeItem(key, opts = {}) {
      if (typeof opts === "boolean") {
        opts = { removeMeta: opts };
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      if (!driver.removeItem) {
        return;
      }
      await asyncCall(driver.removeItem, relativeKey, opts);
      if (opts.removeMeta || opts.removeMata) {
        await asyncCall(driver.removeItem, relativeKey + "$", opts);
      }
      if (!driver.watch) {
        onChange("remove", key);
      }
    },
    // Meta
    async getMeta(key, opts = {}) {
      if (typeof opts === "boolean") {
        opts = { nativeOnly: opts };
      }
      key = normalizeKey$1(key);
      const { relativeKey, driver } = getMount(key);
      const meta = /* @__PURE__ */ Object.create(null);
      if (driver.getMeta) {
        Object.assign(meta, await asyncCall(driver.getMeta, relativeKey, opts));
      }
      if (!opts.nativeOnly) {
        const value = await asyncCall(
          driver.getItem,
          relativeKey + "$",
          opts
        ).then((value_) => destr(value_));
        if (value && typeof value === "object") {
          if (typeof value.atime === "string") {
            value.atime = new Date(value.atime);
          }
          if (typeof value.mtime === "string") {
            value.mtime = new Date(value.mtime);
          }
          Object.assign(meta, value);
        }
      }
      return meta;
    },
    setMeta(key, value, opts = {}) {
      return this.setItem(key + "$", value, opts);
    },
    removeMeta(key, opts = {}) {
      return this.removeItem(key + "$", opts);
    },
    // Keys
    async getKeys(base, opts = {}) {
      base = normalizeBaseKey(base);
      const mounts = getMounts(base, true);
      let maskedMounts = [];
      const allKeys = [];
      let allMountsSupportMaxDepth = true;
      for (const mount of mounts) {
        if (!mount.driver.flags?.maxDepth) {
          allMountsSupportMaxDepth = false;
        }
        const rawKeys = await asyncCall(
          mount.driver.getKeys,
          mount.relativeBase,
          opts
        );
        for (const key of rawKeys) {
          const fullKey = mount.mountpoint + normalizeKey$1(key);
          if (!maskedMounts.some((p) => fullKey.startsWith(p))) {
            allKeys.push(fullKey);
          }
        }
        maskedMounts = [
          mount.mountpoint,
          ...maskedMounts.filter((p) => !p.startsWith(mount.mountpoint))
        ];
      }
      const shouldFilterByDepth = opts.maxDepth !== void 0 && !allMountsSupportMaxDepth;
      return allKeys.filter(
        (key) => (!shouldFilterByDepth || filterKeyByDepth(key, opts.maxDepth)) && filterKeyByBase(key, base)
      );
    },
    // Utils
    async clear(base, opts = {}) {
      base = normalizeBaseKey(base);
      await Promise.all(
        getMounts(base, false).map(async (m) => {
          if (m.driver.clear) {
            return asyncCall(m.driver.clear, m.relativeBase, opts);
          }
          if (m.driver.removeItem) {
            const keys = await m.driver.getKeys(m.relativeBase || "", opts);
            return Promise.all(
              keys.map((key) => m.driver.removeItem(key, opts))
            );
          }
        })
      );
    },
    async dispose() {
      await Promise.all(
        Object.values(context.mounts).map((driver) => dispose(driver))
      );
    },
    async watch(callback) {
      await startWatch();
      context.watchListeners.push(callback);
      return async () => {
        context.watchListeners = context.watchListeners.filter(
          (listener) => listener !== callback
        );
        if (context.watchListeners.length === 0) {
          await stopWatch();
        }
      };
    },
    async unwatch() {
      context.watchListeners = [];
      await stopWatch();
    },
    // Mount
    mount(base, driver) {
      base = normalizeBaseKey(base);
      if (base && context.mounts[base]) {
        throw new Error(`already mounted at ${base}`);
      }
      if (base) {
        context.mountpoints.push(base);
        context.mountpoints.sort((a, b) => b.length - a.length);
      }
      context.mounts[base] = driver;
      if (context.watching) {
        Promise.resolve(watch(driver, onChange, base)).then((unwatcher) => {
          context.unwatch[base] = unwatcher;
        }).catch(console.error);
      }
      return storage;
    },
    async unmount(base, _dispose = true) {
      base = normalizeBaseKey(base);
      if (!base || !context.mounts[base]) {
        return;
      }
      if (context.watching && base in context.unwatch) {
        context.unwatch[base]?.();
        delete context.unwatch[base];
      }
      if (_dispose) {
        await dispose(context.mounts[base]);
      }
      context.mountpoints = context.mountpoints.filter((key) => key !== base);
      delete context.mounts[base];
    },
    getMount(key = "") {
      key = normalizeKey$1(key) + ":";
      const m = getMount(key);
      return {
        driver: m.driver,
        base: m.base
      };
    },
    getMounts(base = "", opts = {}) {
      base = normalizeKey$1(base);
      const mounts = getMounts(base, opts.parents);
      return mounts.map((m) => ({
        driver: m.driver,
        base: m.mountpoint
      }));
    },
    // Aliases
    keys: (base, opts = {}) => storage.getKeys(base, opts),
    get: (key, opts = {}) => storage.getItem(key, opts),
    set: (key, value, opts = {}) => storage.setItem(key, value, opts),
    has: (key, opts = {}) => storage.hasItem(key, opts),
    del: (key, opts = {}) => storage.removeItem(key, opts),
    remove: (key, opts = {}) => storage.removeItem(key, opts)
  };
  return storage;
}
function watch(driver, onChange, base) {
  return driver.watch ? driver.watch((event, key) => onChange(event, base + key)) : () => {
  };
}
async function dispose(driver) {
  if (typeof driver.dispose === "function") {
    await asyncCall(driver.dispose);
  }
}

const _assets = {

};

const normalizeKey = function normalizeKey(key) {
  if (!key) {
    return "";
  }
  return key.split("?")[0]?.replace(/[/\\]/g, ":").replace(/:+/g, ":").replace(/^:|:$/g, "") || "";
};

const assets$1 = {
  getKeys() {
    return Promise.resolve(Object.keys(_assets))
  },
  hasItem (id) {
    id = normalizeKey(id);
    return Promise.resolve(id in _assets)
  },
  getItem (id) {
    id = normalizeKey(id);
    return Promise.resolve(_assets[id] ? _assets[id].import() : null)
  },
  getMeta (id) {
    id = normalizeKey(id);
    return Promise.resolve(_assets[id] ? _assets[id].meta : {})
  }
};

function defineDriver(factory) {
  return factory;
}
function createError$2(driver, message, opts) {
  const err = new Error(`[unstorage] [${driver}] ${message}`, opts);
  if (Error.captureStackTrace) {
    Error.captureStackTrace(err, createError$2);
  }
  return err;
}
function createRequiredError(driver, name) {
  if (Array.isArray(name)) {
    return createError$2(
      driver,
      `Missing some of the required options ${name.map((n) => "`" + n + "`").join(", ")}`
    );
  }
  return createError$2(driver, `Missing required option \`${name}\`.`);
}

function ignoreNotfound(err) {
  return err.code === "ENOENT" || err.code === "EISDIR" ? null : err;
}
function ignoreExists(err) {
  return err.code === "EEXIST" ? null : err;
}
async function writeFile(path, data, encoding) {
  await ensuredir(dirname$1(path));
  return promises.writeFile(path, data, encoding);
}
function readFile(path, encoding) {
  return promises.readFile(path, encoding).catch(ignoreNotfound);
}
function unlink(path) {
  return promises.unlink(path).catch(ignoreNotfound);
}
function readdir(dir) {
  return promises.readdir(dir, { withFileTypes: true }).catch(ignoreNotfound).then((r) => r || []);
}
async function ensuredir(dir) {
  if (existsSync(dir)) {
    return;
  }
  await ensuredir(dirname$1(dir)).catch(ignoreExists);
  await promises.mkdir(dir).catch(ignoreExists);
}
async function readdirRecursive(dir, ignore, maxDepth) {
  if (ignore && ignore(dir)) {
    return [];
  }
  const entries = await readdir(dir);
  const files = [];
  await Promise.all(
    entries.map(async (entry) => {
      const entryPath = resolve$1(dir, entry.name);
      if (entry.isDirectory()) {
        if (maxDepth === void 0 || maxDepth > 0) {
          const dirFiles = await readdirRecursive(
            entryPath,
            ignore,
            maxDepth === void 0 ? void 0 : maxDepth - 1
          );
          files.push(...dirFiles.map((f) => entry.name + "/" + f));
        }
      } else {
        if (!(ignore && ignore(entry.name))) {
          files.push(entry.name);
        }
      }
    })
  );
  return files;
}
async function rmRecursive(dir) {
  const entries = await readdir(dir);
  await Promise.all(
    entries.map((entry) => {
      const entryPath = resolve$1(dir, entry.name);
      if (entry.isDirectory()) {
        return rmRecursive(entryPath).then(() => promises.rmdir(entryPath));
      } else {
        return promises.unlink(entryPath);
      }
    })
  );
}

const PATH_TRAVERSE_RE = /\.\.:|\.\.$/;
const DRIVER_NAME = "fs-lite";
const unstorage_47drivers_47fs_45lite = defineDriver((opts = {}) => {
  if (!opts.base) {
    throw createRequiredError(DRIVER_NAME, "base");
  }
  opts.base = resolve$1(opts.base);
  const r = (key) => {
    if (PATH_TRAVERSE_RE.test(key)) {
      throw createError$2(
        DRIVER_NAME,
        `Invalid key: ${JSON.stringify(key)}. It should not contain .. segments`
      );
    }
    const resolved = join(opts.base, key.replace(/:/g, "/"));
    return resolved;
  };
  return {
    name: DRIVER_NAME,
    options: opts,
    flags: {
      maxDepth: true
    },
    hasItem(key) {
      return existsSync(r(key));
    },
    getItem(key) {
      return readFile(r(key), "utf8");
    },
    getItemRaw(key) {
      return readFile(r(key));
    },
    async getMeta(key) {
      const { atime, mtime, size, birthtime, ctime } = await promises.stat(r(key)).catch(() => ({}));
      return { atime, mtime, size, birthtime, ctime };
    },
    setItem(key, value) {
      if (opts.readOnly) {
        return;
      }
      return writeFile(r(key), value, "utf8");
    },
    setItemRaw(key, value) {
      if (opts.readOnly) {
        return;
      }
      return writeFile(r(key), value);
    },
    removeItem(key) {
      if (opts.readOnly) {
        return;
      }
      return unlink(r(key));
    },
    getKeys(_base, topts) {
      return readdirRecursive(r("."), opts.ignore, topts?.maxDepth);
    },
    async clear() {
      if (opts.readOnly || opts.noClear) {
        return;
      }
      await rmRecursive(r("."));
    }
  };
});

const storage = createStorage({});

storage.mount('/assets', assets$1);

storage.mount('data', unstorage_47drivers_47fs_45lite({"driver":"fsLite","base":"./.data/kv"}));

function useStorage(base = "") {
  return base ? prefixStorage(storage, base) : storage;
}

function serialize$2(o){return typeof o=="string"?`'${o}'`:new c$1().serialize(o)}const c$1=/*@__PURE__*/function(){class o{#t=new Map;compare(t,r){const e=typeof t,n=typeof r;return e==="string"&&n==="string"?t.localeCompare(r):e==="number"&&n==="number"?t-r:String.prototype.localeCompare.call(this.serialize(t,true),this.serialize(r,true))}serialize(t,r){if(t===null)return "null";switch(typeof t){case "string":return r?t:`'${t}'`;case "bigint":return `${t}n`;case "object":return this.$object(t);case "function":return this.$function(t)}return String(t)}serializeObject(t){const r=Object.prototype.toString.call(t);if(r!=="[object Object]")return this.serializeBuiltInType(r.length<10?`unknown:${r}`:r.slice(8,-1),t);const e=t.constructor,n=e===Object||e===void 0?"":e.name;if(n!==""&&globalThis[n]===e)return this.serializeBuiltInType(n,t);if(typeof t.toJSON=="function"){const i=t.toJSON();return n+(i!==null&&typeof i=="object"?this.$object(i):`(${this.serialize(i)})`)}return this.serializeObjectEntries(n,Object.entries(t))}serializeBuiltInType(t,r){const e=this["$"+t];if(e)return e.call(this,r);if(typeof r?.entries=="function")return this.serializeObjectEntries(t,r.entries());throw new Error(`Cannot serialize ${t}`)}serializeObjectEntries(t,r){const e=Array.from(r).sort((i,a)=>this.compare(i[0],a[0]));let n=`${t}{`;for(let i=0;i<e.length;i++){const[a,l]=e[i];n+=`${this.serialize(a,true)}:${this.serialize(l)}`,i<e.length-1&&(n+=",");}return n+"}"}$object(t){let r=this.#t.get(t);return r===void 0&&(this.#t.set(t,`#${this.#t.size}`),r=this.serializeObject(t),this.#t.set(t,r)),r}$function(t){const r=Function.prototype.toString.call(t);return r.slice(-15)==="[native code] }"?`${t.name||""}()[native]`:`${t.name}(${t.length})${r.replace(/\s*\n\s*/g,"")}`}$Array(t){let r="[";for(let e=0;e<t.length;e++)r+=this.serialize(t[e]),e<t.length-1&&(r+=",");return r+"]"}$Date(t){try{return `Date(${t.toISOString()})`}catch{return "Date(null)"}}$ArrayBuffer(t){return `ArrayBuffer[${new Uint8Array(t).join(",")}]`}$Set(t){return `Set${this.$Array(Array.from(t).sort((r,e)=>this.compare(r,e)))}`}$Map(t){return this.serializeObjectEntries("Map",t.entries())}}for(const s of ["Error","RegExp","URL"])o.prototype["$"+s]=function(t){return `${s}(${t})`};for(const s of ["Int8Array","Uint8Array","Uint8ClampedArray","Int16Array","Uint16Array","Int32Array","Uint32Array","Float32Array","Float64Array"])o.prototype["$"+s]=function(t){return `${s}[${t.join(",")}]`};for(const s of ["BigInt64Array","BigUint64Array"])o.prototype["$"+s]=function(t){return `${s}[${t.join("n,")}${t.length>0?"n":""}]`};return o}();

function isEqual(object1, object2) {
  if (object1 === object2) {
    return true;
  }
  if (serialize$2(object1) === serialize$2(object2)) {
    return true;
  }
  return false;
}

const e=globalThis.process?.getBuiltinModule?.("crypto")?.hash,r$1="sha256",s="base64url";function digest(t){if(e)return e(r$1,t,s);const o=createHash(r$1).update(t);return globalThis.process?.versions?.webcontainer?o.digest().toString(s):o.digest(s)}

const Hasher = /* @__PURE__ */ (() => {
  class Hasher2 {
    buff = "";
    #context = /* @__PURE__ */ new Map();
    write(str) {
      this.buff += str;
    }
    dispatch(value) {
      const type = value === null ? "null" : typeof value;
      return this[type](value);
    }
    object(object) {
      if (object && typeof object.toJSON === "function") {
        return this.object(object.toJSON());
      }
      const objString = Object.prototype.toString.call(object);
      let objType = "";
      const objectLength = objString.length;
      objType = objectLength < 10 ? "unknown:[" + objString + "]" : objString.slice(8, objectLength - 1);
      objType = objType.toLowerCase();
      let objectNumber = null;
      if ((objectNumber = this.#context.get(object)) === void 0) {
        this.#context.set(object, this.#context.size);
      } else {
        return this.dispatch("[CIRCULAR:" + objectNumber + "]");
      }
      if (typeof Buffer !== "undefined" && Buffer.isBuffer && Buffer.isBuffer(object)) {
        this.write("buffer:");
        return this.write(object.toString("utf8"));
      }
      if (objType !== "object" && objType !== "function" && objType !== "asyncfunction") {
        if (this[objType]) {
          this[objType](object);
        } else {
          this.unknown(object, objType);
        }
      } else {
        const keys = Object.keys(object).sort();
        const extraKeys = [];
        this.write("object:" + (keys.length + extraKeys.length) + ":");
        const dispatchForKey = (key) => {
          this.dispatch(key);
          this.write(":");
          this.dispatch(object[key]);
          this.write(",");
        };
        for (const key of keys) {
          dispatchForKey(key);
        }
        for (const key of extraKeys) {
          dispatchForKey(key);
        }
      }
    }
    array(arr, unordered) {
      unordered = unordered === void 0 ? false : unordered;
      this.write("array:" + arr.length + ":");
      if (!unordered || arr.length <= 1) {
        for (const entry of arr) {
          this.dispatch(entry);
        }
        return;
      }
      const contextAdditions = /* @__PURE__ */ new Map();
      const entries = arr.map((entry) => {
        const hasher = new Hasher2();
        hasher.dispatch(entry);
        for (const [key, value] of hasher.#context) {
          contextAdditions.set(key, value);
        }
        return hasher.toString();
      });
      this.#context = contextAdditions;
      entries.sort();
      return this.array(entries, false);
    }
    date(date) {
      return this.write("date:" + date.toJSON());
    }
    symbol(sym) {
      return this.write("symbol:" + sym.toString());
    }
    unknown(value, type) {
      this.write(type);
      if (!value) {
        return;
      }
      this.write(":");
      if (value && typeof value.entries === "function") {
        return this.array(
          [...value.entries()],
          true
          /* ordered */
        );
      }
    }
    error(err) {
      return this.write("error:" + err.toString());
    }
    boolean(bool) {
      return this.write("bool:" + bool);
    }
    string(string) {
      this.write("string:" + string.length + ":");
      this.write(string);
    }
    function(fn) {
      this.write("fn:");
      if (isNativeFunction(fn)) {
        this.dispatch("[native]");
      } else {
        this.dispatch(fn.toString());
      }
    }
    number(number) {
      return this.write("number:" + number);
    }
    null() {
      return this.write("Null");
    }
    undefined() {
      return this.write("Undefined");
    }
    regexp(regex) {
      return this.write("regex:" + regex.toString());
    }
    arraybuffer(arr) {
      this.write("arraybuffer:");
      return this.dispatch(new Uint8Array(arr));
    }
    url(url) {
      return this.write("url:" + url.toString());
    }
    map(map) {
      this.write("map:");
      const arr = [...map];
      return this.array(arr, false);
    }
    set(set) {
      this.write("set:");
      const arr = [...set];
      return this.array(arr, false);
    }
    bigint(number) {
      return this.write("bigint:" + number.toString());
    }
  }
  for (const type of [
    "uint8array",
    "uint8clampedarray",
    "unt8array",
    "uint16array",
    "unt16array",
    "uint32array",
    "unt32array",
    "float32array",
    "float64array"
  ]) {
    Hasher2.prototype[type] = function(arr) {
      this.write(type + ":");
      return this.array([...arr], false);
    };
  }
  function isNativeFunction(f) {
    if (typeof f !== "function") {
      return false;
    }
    return Function.prototype.toString.call(f).slice(
      -15
      /* "[native code] }".length */
    ) === "[native code] }";
  }
  return Hasher2;
})();
function serialize$1(object) {
  const hasher = new Hasher();
  hasher.dispatch(object);
  return hasher.buff;
}
function hash(value) {
  return digest(typeof value === "string" ? value : serialize$1(value)).replace(/[-_]/g, "").slice(0, 10);
}

function defaultCacheOptions() {
  return {
    name: "_",
    base: "/cache",
    swr: true,
    maxAge: 1
  };
}
function defineCachedFunction(fn, opts = {}) {
  opts = { ...defaultCacheOptions(), ...opts };
  const pending = {};
  const group = opts.group || "nitro/functions";
  const name = opts.name || fn.name || "_";
  const integrity = opts.integrity || hash([fn, opts]);
  const validate = opts.validate || ((entry) => entry.value !== void 0);
  async function get(key, resolver, shouldInvalidateCache, event) {
    const cacheKey = [opts.base, group, name, key + ".json"].filter(Boolean).join(":").replace(/:\/$/, ":index");
    let entry = await useStorage().getItem(cacheKey).catch((error) => {
      console.error(`[cache] Cache read error.`, error);
      useNitroApp().captureError(error, { event, tags: ["cache"] });
    }) || {};
    if (typeof entry !== "object") {
      entry = {};
      const error = new Error("Malformed data read from cache.");
      console.error("[cache]", error);
      useNitroApp().captureError(error, { event, tags: ["cache"] });
    }
    const ttl = (opts.maxAge ?? 0) * 1e3;
    if (ttl) {
      entry.expires = Date.now() + ttl;
    }
    const expired = shouldInvalidateCache || entry.integrity !== integrity || ttl && Date.now() - (entry.mtime || 0) > ttl || validate(entry) === false;
    const _resolve = async () => {
      const isPending = pending[key];
      if (!isPending) {
        if (entry.value !== void 0 && (opts.staleMaxAge || 0) >= 0 && opts.swr === false) {
          entry.value = void 0;
          entry.integrity = void 0;
          entry.mtime = void 0;
          entry.expires = void 0;
        }
        pending[key] = Promise.resolve(resolver());
      }
      try {
        entry.value = await pending[key];
      } catch (error) {
        if (!isPending) {
          delete pending[key];
        }
        throw error;
      }
      if (!isPending) {
        entry.mtime = Date.now();
        entry.integrity = integrity;
        delete pending[key];
        if (validate(entry) !== false) {
          let setOpts;
          if (opts.maxAge && !opts.swr) {
            setOpts = { ttl: opts.maxAge };
          }
          const promise = useStorage().setItem(cacheKey, entry, setOpts).catch((error) => {
            console.error(`[cache] Cache write error.`, error);
            useNitroApp().captureError(error, { event, tags: ["cache"] });
          });
          if (event?.waitUntil) {
            event.waitUntil(promise);
          }
        }
      }
    };
    const _resolvePromise = expired ? _resolve() : Promise.resolve();
    if (entry.value === void 0) {
      await _resolvePromise;
    } else if (expired && event && event.waitUntil) {
      event.waitUntil(_resolvePromise);
    }
    if (opts.swr && validate(entry) !== false) {
      _resolvePromise.catch((error) => {
        console.error(`[cache] SWR handler error.`, error);
        useNitroApp().captureError(error, { event, tags: ["cache"] });
      });
      return entry;
    }
    return _resolvePromise.then(() => entry);
  }
  return async (...args) => {
    const shouldBypassCache = await opts.shouldBypassCache?.(...args);
    if (shouldBypassCache) {
      return fn(...args);
    }
    const key = await (opts.getKey || getKey)(...args);
    const shouldInvalidateCache = await opts.shouldInvalidateCache?.(...args);
    const entry = await get(
      key,
      () => fn(...args),
      shouldInvalidateCache,
      args[0] && isEvent(args[0]) ? args[0] : void 0
    );
    let value = entry.value;
    if (opts.transform) {
      value = await opts.transform(entry, ...args) || value;
    }
    return value;
  };
}
function cachedFunction(fn, opts = {}) {
  return defineCachedFunction(fn, opts);
}
function getKey(...args) {
  return args.length > 0 ? hash(args) : "";
}
function escapeKey(key) {
  return String(key).replace(/\W/g, "");
}
function defineCachedEventHandler(handler, opts = defaultCacheOptions()) {
  const variableHeaderNames = (opts.varies || []).filter(Boolean).map((h) => h.toLowerCase()).sort();
  const _opts = {
    ...opts,
    getKey: async (event) => {
      const customKey = await opts.getKey?.(event);
      if (customKey) {
        return escapeKey(customKey);
      }
      const _path = event.node.req.originalUrl || event.node.req.url || event.path;
      let _pathname;
      try {
        _pathname = escapeKey(decodeURI(parseURL(_path).pathname)).slice(0, 16) || "index";
      } catch {
        _pathname = "-";
      }
      const _hashedPath = `${_pathname}.${hash(_path)}`;
      const _headers = variableHeaderNames.map((header) => [header, event.node.req.headers[header]]).map(([name, value]) => `${escapeKey(name)}.${hash(value)}`);
      return [_hashedPath, ..._headers].join(":");
    },
    validate: (entry) => {
      if (!entry.value) {
        return false;
      }
      if (entry.value.code >= 400) {
        return false;
      }
      if (entry.value.body === void 0) {
        return false;
      }
      if (entry.value.headers.etag === "undefined" || entry.value.headers["last-modified"] === "undefined") {
        return false;
      }
      return true;
    },
    group: opts.group || "nitro/handlers",
    integrity: opts.integrity || hash([handler, opts])
  };
  const _cachedHandler = cachedFunction(
    async (incomingEvent) => {
      const variableHeaders = {};
      for (const header of variableHeaderNames) {
        const value = incomingEvent.node.req.headers[header];
        if (value !== void 0) {
          variableHeaders[header] = value;
        }
      }
      const reqProxy = cloneWithProxy(incomingEvent.node.req, {
        headers: variableHeaders
      });
      const resHeaders = {};
      let _resSendBody;
      const resProxy = cloneWithProxy(incomingEvent.node.res, {
        statusCode: 200,
        writableEnded: false,
        writableFinished: false,
        headersSent: false,
        closed: false,
        getHeader(name) {
          return resHeaders[name];
        },
        setHeader(name, value) {
          resHeaders[name] = value;
          return this;
        },
        getHeaderNames() {
          return Object.keys(resHeaders);
        },
        hasHeader(name) {
          return name in resHeaders;
        },
        removeHeader(name) {
          delete resHeaders[name];
        },
        getHeaders() {
          return resHeaders;
        },
        end(chunk, arg2, arg3) {
          if (typeof chunk === "string") {
            _resSendBody = chunk;
          }
          if (typeof arg2 === "function") {
            arg2();
          }
          if (typeof arg3 === "function") {
            arg3();
          }
          return this;
        },
        write(chunk, arg2, arg3) {
          if (typeof chunk === "string") {
            _resSendBody = chunk;
          }
          if (typeof arg2 === "function") {
            arg2(void 0);
          }
          if (typeof arg3 === "function") {
            arg3();
          }
          return true;
        },
        writeHead(statusCode, headers2) {
          this.statusCode = statusCode;
          if (headers2) {
            if (Array.isArray(headers2) || typeof headers2 === "string") {
              throw new TypeError("Raw headers  is not supported.");
            }
            for (const header in headers2) {
              const value = headers2[header];
              if (value !== void 0) {
                this.setHeader(
                  header,
                  value
                );
              }
            }
          }
          return this;
        }
      });
      const event = createEvent(reqProxy, resProxy);
      event.fetch = (url, fetchOptions) => fetchWithEvent(event, url, fetchOptions, {
        fetch: useNitroApp().localFetch
      });
      event.$fetch = (url, fetchOptions) => fetchWithEvent(event, url, fetchOptions, {
        fetch: globalThis.$fetch
      });
      event.waitUntil = incomingEvent.waitUntil;
      event.context = incomingEvent.context;
      event.context.cache = {
        options: _opts
      };
      const body = await handler(event) || _resSendBody;
      const headers = event.node.res.getHeaders();
      headers.etag = String(
        headers.Etag || headers.etag || `W/"${hash(body)}"`
      );
      headers["last-modified"] = String(
        headers["Last-Modified"] || headers["last-modified"] || (/* @__PURE__ */ new Date()).toUTCString()
      );
      const cacheControl = [];
      if (opts.swr) {
        if (opts.maxAge) {
          cacheControl.push(`s-maxage=${opts.maxAge}`);
        }
        if (opts.staleMaxAge) {
          cacheControl.push(`stale-while-revalidate=${opts.staleMaxAge}`);
        } else {
          cacheControl.push("stale-while-revalidate");
        }
      } else if (opts.maxAge) {
        cacheControl.push(`max-age=${opts.maxAge}`);
      }
      if (cacheControl.length > 0) {
        headers["cache-control"] = cacheControl.join(", ");
      }
      const cacheEntry = {
        code: event.node.res.statusCode,
        headers,
        body
      };
      return cacheEntry;
    },
    _opts
  );
  return defineEventHandler$1(async (event) => {
    if (opts.headersOnly) {
      if (handleCacheHeaders(event, { maxAge: opts.maxAge })) {
        return;
      }
      return handler(event);
    }
    const response = await _cachedHandler(
      event
    );
    if (event.node.res.headersSent || event.node.res.writableEnded) {
      return response.body;
    }
    if (handleCacheHeaders(event, {
      modifiedTime: new Date(response.headers["last-modified"]),
      etag: response.headers.etag,
      maxAge: opts.maxAge
    })) {
      return;
    }
    event.node.res.statusCode = response.code;
    for (const name in response.headers) {
      const value = response.headers[name];
      if (name === "set-cookie") {
        event.node.res.appendHeader(
          name,
          splitCookiesString$1(value)
        );
      } else {
        if (value !== void 0) {
          event.node.res.setHeader(name, value);
        }
      }
    }
    return response.body;
  });
}
function cloneWithProxy(obj, overrides) {
  return new Proxy(obj, {
    get(target, property, receiver) {
      if (property in overrides) {
        return overrides[property];
      }
      return Reflect.get(target, property, receiver);
    },
    set(target, property, value, receiver) {
      if (property in overrides) {
        overrides[property] = value;
        return true;
      }
      return Reflect.set(target, property, value, receiver);
    }
  });
}
const cachedEventHandler = defineCachedEventHandler;

function klona(x) {
	if (typeof x !== 'object') return x;

	var k, tmp, str=Object.prototype.toString.call(x);

	if (str === '[object Object]') {
		if (x.constructor !== Object && typeof x.constructor === 'function') {
			tmp = new x.constructor();
			for (k in x) {
				if (x.hasOwnProperty(k) && tmp[k] !== x[k]) {
					tmp[k] = klona(x[k]);
				}
			}
		} else {
			tmp = {}; // null
			for (k in x) {
				if (k === '__proto__') {
					Object.defineProperty(tmp, k, {
						value: klona(x[k]),
						configurable: true,
						enumerable: true,
						writable: true,
					});
				} else {
					tmp[k] = klona(x[k]);
				}
			}
		}
		return tmp;
	}

	if (str === '[object Array]') {
		k = x.length;
		for (tmp=Array(k); k--;) {
			tmp[k] = klona(x[k]);
		}
		return tmp;
	}

	if (str === '[object Set]') {
		tmp = new Set;
		x.forEach(function (val) {
			tmp.add(klona(val));
		});
		return tmp;
	}

	if (str === '[object Map]') {
		tmp = new Map;
		x.forEach(function (val, key) {
			tmp.set(klona(key), klona(val));
		});
		return tmp;
	}

	if (str === '[object Date]') {
		return new Date(+x);
	}

	if (str === '[object RegExp]') {
		tmp = new RegExp(x.source, x.flags);
		tmp.lastIndex = x.lastIndex;
		return tmp;
	}

	if (str === '[object DataView]') {
		return new x.constructor( klona(x.buffer) );
	}

	if (str === '[object ArrayBuffer]') {
		return x.slice(0);
	}

	// ArrayBuffer.isView(x)
	// ~> `new` bcuz `Buffer.slice` => ref
	if (str.slice(-6) === 'Array]') {
		return new x.constructor(x);
	}

	return x;
}

const inlineAppConfig = {
  "nuxt": {}
};



const appConfig = defuFn(inlineAppConfig);

const NUMBER_CHAR_RE = /\d/;
const STR_SPLITTERS = ["-", "_", "/", "."];
function isUppercase(char = "") {
  if (NUMBER_CHAR_RE.test(char)) {
    return void 0;
  }
  return char !== char.toLowerCase();
}
function splitByCase(str, separators) {
  const splitters = STR_SPLITTERS;
  const parts = [];
  if (!str || typeof str !== "string") {
    return parts;
  }
  let buff = "";
  let previousUpper;
  let previousSplitter;
  for (const char of str) {
    const isSplitter = splitters.includes(char);
    if (isSplitter === true) {
      parts.push(buff);
      buff = "";
      previousUpper = void 0;
      continue;
    }
    const isUpper = isUppercase(char);
    if (previousSplitter === false) {
      if (previousUpper === false && isUpper === true) {
        parts.push(buff);
        buff = char;
        previousUpper = isUpper;
        continue;
      }
      if (previousUpper === true && isUpper === false && buff.length > 1) {
        const lastChar = buff.at(-1);
        parts.push(buff.slice(0, Math.max(0, buff.length - 1)));
        buff = lastChar + char;
        previousUpper = isUpper;
        continue;
      }
    }
    buff += char;
    previousUpper = isUpper;
    previousSplitter = isSplitter;
  }
  parts.push(buff);
  return parts;
}
function kebabCase(str, joiner) {
  return str ? (Array.isArray(str) ? str : splitByCase(str)).map((p) => p.toLowerCase()).join(joiner) : "";
}
function snakeCase(str) {
  return kebabCase(str || "", "_");
}

function getEnv(key, opts) {
  const envKey = snakeCase(key).toUpperCase();
  return destr(
    process.env[opts.prefix + envKey] ?? process.env[opts.altPrefix + envKey]
  );
}
function _isObject(input) {
  return typeof input === "object" && !Array.isArray(input);
}
function applyEnv(obj, opts, parentKey = "") {
  for (const key in obj) {
    const subKey = parentKey ? `${parentKey}_${key}` : key;
    const envValue = getEnv(subKey, opts);
    if (_isObject(obj[key])) {
      if (_isObject(envValue)) {
        obj[key] = { ...obj[key], ...envValue };
        applyEnv(obj[key], opts, subKey);
      } else if (envValue === void 0) {
        applyEnv(obj[key], opts, subKey);
      } else {
        obj[key] = envValue ?? obj[key];
      }
    } else {
      obj[key] = envValue ?? obj[key];
    }
    if (opts.envExpansion && typeof obj[key] === "string") {
      obj[key] = _expandFromEnv(obj[key]);
    }
  }
  return obj;
}
const envExpandRx = /\{\{([^{}]*)\}\}/g;
function _expandFromEnv(value) {
  return value.replace(envExpandRx, (match, key) => {
    return process.env[key] || match;
  });
}

const _inlineRuntimeConfig = {
  "app": {
    "baseURL": "/",
    "buildId": "0b0e2424-ca24-4b48-81c2-0eaa34b203c2",
    "buildAssetsDir": "/_nuxt/",
    "cdnURL": ""
  },
  "nitro": {
    "envPrefix": "NUXT_",
    "routeRules": {
      "/__nuxt_error": {
        "cache": false
      },
      "/_nuxt/builds/meta/**": {
        "headers": {
          "cache-control": "public, max-age=31536000, immutable"
        }
      },
      "/_nuxt/builds/**": {
        "headers": {
          "cache-control": "public, max-age=1, immutable"
        }
      },
      "/storage/**": {
        "headers": {
          "cache-control": "public, max-age=604800, immutable"
        }
      },
      "/_nuxt/**": {
        "headers": {
          "cache-control": "public, max-age=31536000, immutable"
        }
      }
    }
  },
  "public": {}
};
const envOptions = {
  prefix: "NITRO_",
  altPrefix: _inlineRuntimeConfig.nitro.envPrefix ?? process.env.NITRO_ENV_PREFIX ?? "_",
  envExpansion: _inlineRuntimeConfig.nitro.envExpansion ?? process.env.NITRO_ENV_EXPANSION ?? false
};
const _sharedRuntimeConfig = _deepFreeze(
  applyEnv(klona(_inlineRuntimeConfig), envOptions)
);
function useRuntimeConfig(event) {
  if (!event) {
    return _sharedRuntimeConfig;
  }
  if (event.context.nitro.runtimeConfig) {
    return event.context.nitro.runtimeConfig;
  }
  const runtimeConfig = klona(_inlineRuntimeConfig);
  applyEnv(runtimeConfig, envOptions);
  event.context.nitro.runtimeConfig = runtimeConfig;
  return runtimeConfig;
}
_deepFreeze(klona(appConfig));
function _deepFreeze(object) {
  const propNames = Object.getOwnPropertyNames(object);
  for (const name of propNames) {
    const value = object[name];
    if (value && typeof value === "object") {
      _deepFreeze(value);
    }
  }
  return Object.freeze(object);
}
new Proxy(/* @__PURE__ */ Object.create(null), {
  get: (_, prop) => {
    console.warn(
      "Please use `useRuntimeConfig()` instead of accessing config directly."
    );
    const runtimeConfig = useRuntimeConfig();
    if (prop in runtimeConfig) {
      return runtimeConfig[prop];
    }
    return void 0;
  }
});

function createContext(opts = {}) {
  let currentInstance;
  let isSingleton = false;
  const checkConflict = (instance) => {
    if (currentInstance && currentInstance !== instance) {
      throw new Error("Context conflict");
    }
  };
  let als;
  if (opts.asyncContext) {
    const _AsyncLocalStorage = opts.AsyncLocalStorage || globalThis.AsyncLocalStorage;
    if (_AsyncLocalStorage) {
      als = new _AsyncLocalStorage();
    } else {
      console.warn("[unctx] `AsyncLocalStorage` is not provided.");
    }
  }
  const _getCurrentInstance = () => {
    if (als) {
      const instance = als.getStore();
      if (instance !== void 0) {
        return instance;
      }
    }
    return currentInstance;
  };
  return {
    use: () => {
      const _instance = _getCurrentInstance();
      if (_instance === void 0) {
        throw new Error("Context is not available");
      }
      return _instance;
    },
    tryUse: () => {
      return _getCurrentInstance();
    },
    set: (instance, replace) => {
      if (!replace) {
        checkConflict(instance);
      }
      currentInstance = instance;
      isSingleton = true;
    },
    unset: () => {
      currentInstance = void 0;
      isSingleton = false;
    },
    call: (instance, callback) => {
      checkConflict(instance);
      currentInstance = instance;
      try {
        return als ? als.run(instance, callback) : callback();
      } finally {
        if (!isSingleton) {
          currentInstance = void 0;
        }
      }
    },
    async callAsync(instance, callback) {
      currentInstance = instance;
      const onRestore = () => {
        currentInstance = instance;
      };
      const onLeave = () => currentInstance === instance ? onRestore : void 0;
      asyncHandlers.add(onLeave);
      try {
        const r = als ? als.run(instance, callback) : callback();
        if (!isSingleton) {
          currentInstance = void 0;
        }
        return await r;
      } finally {
        asyncHandlers.delete(onLeave);
      }
    }
  };
}
function createNamespace(defaultOpts = {}) {
  const contexts = {};
  return {
    get(key, opts = {}) {
      if (!contexts[key]) {
        contexts[key] = createContext({ ...defaultOpts, ...opts });
      }
      return contexts[key];
    }
  };
}
const _globalThis = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : {};
const globalKey = "__unctx__";
const defaultNamespace = _globalThis[globalKey] || (_globalThis[globalKey] = createNamespace());
const getContext = (key, opts = {}) => defaultNamespace.get(key, opts);
const asyncHandlersKey = "__unctx_async_handlers__";
const asyncHandlers = _globalThis[asyncHandlersKey] || (_globalThis[asyncHandlersKey] = /* @__PURE__ */ new Set());
function executeAsync(function_) {
  const restores = [];
  for (const leaveHandler of asyncHandlers) {
    const restore2 = leaveHandler();
    if (restore2) {
      restores.push(restore2);
    }
  }
  const restore = () => {
    for (const restore2 of restores) {
      restore2();
    }
  };
  let awaitable = function_();
  if (awaitable && typeof awaitable === "object" && "catch" in awaitable) {
    awaitable = awaitable.catch((error) => {
      restore();
      throw error;
    });
  }
  return [awaitable, restore];
}

const config = useRuntimeConfig();
const _routeRulesMatcher = toRouteMatcher(
  createRouter$1({ routes: config.nitro.routeRules })
);
function createRouteRulesHandler(ctx) {
  return eventHandler((event) => {
    const routeRules = getRouteRules(event);
    if (routeRules.headers) {
      setHeaders(event, routeRules.headers);
    }
    if (routeRules.redirect) {
      let target = routeRules.redirect.to;
      if (target.endsWith("/**")) {
        let targetPath = event.path;
        const strpBase = routeRules.redirect._redirectStripBase;
        if (strpBase) {
          targetPath = withoutBase(targetPath, strpBase);
        }
        target = joinURL(target.slice(0, -3), targetPath);
      } else if (event.path.includes("?")) {
        const query = getQuery$2(event.path);
        target = withQuery(target, query);
      }
      return sendRedirect(event, target, routeRules.redirect.statusCode);
    }
    if (routeRules.proxy) {
      let target = routeRules.proxy.to;
      if (target.endsWith("/**")) {
        let targetPath = event.path;
        const strpBase = routeRules.proxy._proxyStripBase;
        if (strpBase) {
          targetPath = withoutBase(targetPath, strpBase);
        }
        target = joinURL(target.slice(0, -3), targetPath);
      } else if (event.path.includes("?")) {
        const query = getQuery$2(event.path);
        target = withQuery(target, query);
      }
      return proxyRequest(event, target, {
        fetch: ctx.localFetch,
        ...routeRules.proxy
      });
    }
  });
}
function getRouteRules(event) {
  event.context._nitro = event.context._nitro || {};
  if (!event.context._nitro.routeRules) {
    event.context._nitro.routeRules = getRouteRulesForPath(
      withoutBase(event.path.split("?")[0], useRuntimeConfig().app.baseURL)
    );
  }
  return event.context._nitro.routeRules;
}
function getRouteRulesForPath(path) {
  return defu({}, ..._routeRulesMatcher.matchAll(path).reverse());
}

function _captureError(error, type) {
  console.error(`[${type}]`, error);
  useNitroApp().captureError(error, { tags: [type] });
}
function trapUnhandledNodeErrors() {
  process.on(
    "unhandledRejection",
    (error) => _captureError(error, "unhandledRejection")
  );
  process.on(
    "uncaughtException",
    (error) => _captureError(error, "uncaughtException")
  );
}
function joinHeaders(value) {
  return Array.isArray(value) ? value.join(", ") : String(value);
}
function normalizeFetchResponse(response) {
  if (!response.headers.has("set-cookie")) {
    return response;
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: normalizeCookieHeaders(response.headers)
  });
}
function normalizeCookieHeader(header = "") {
  return splitCookiesString$1(joinHeaders(header));
}
function normalizeCookieHeaders(headers) {
  const outgoingHeaders = new Headers();
  for (const [name, header] of headers) {
    if (name === "set-cookie") {
      for (const cookie of normalizeCookieHeader(header)) {
        outgoingHeaders.append("set-cookie", cookie);
      }
    } else {
      outgoingHeaders.set(name, joinHeaders(header));
    }
  }
  return outgoingHeaders;
}

function hasProp$1(obj, prop) {
  try {
    return prop in obj;
  } catch {
    return false;
  }
}

let H3Error$1 = class H3Error extends Error {
  static __h3_error__ = true;
  statusCode = 500;
  fatal = false;
  unhandled = false;
  statusMessage;
  data;
  cause;
  constructor(message, opts = {}) {
    super(message, opts);
    if (opts.cause && !this.cause) {
      this.cause = opts.cause;
    }
  }
  toJSON() {
    const obj = {
      message: this.message,
      statusCode: sanitizeStatusCode$1(this.statusCode, 500)
    };
    if (this.statusMessage) {
      obj.statusMessage = sanitizeStatusMessage$1(this.statusMessage);
    }
    if (this.data !== void 0) {
      obj.data = this.data;
    }
    return obj;
  }
};
function createError$1(input) {
  if (typeof input === "string") {
    return new H3Error$1(input);
  }
  if (isError$1(input)) {
    return input;
  }
  const err = new H3Error$1(input.message ?? input.statusMessage ?? "", {
    cause: input.cause || input
  });
  if (hasProp$1(input, "stack")) {
    try {
      Object.defineProperty(err, "stack", {
        get() {
          return input.stack;
        }
      });
    } catch {
      try {
        err.stack = input.stack;
      } catch {
      }
    }
  }
  if (input.data) {
    err.data = input.data;
  }
  if (input.statusCode) {
    err.statusCode = sanitizeStatusCode$1(input.statusCode, err.statusCode);
  } else if (input.status) {
    err.statusCode = sanitizeStatusCode$1(input.status, err.statusCode);
  }
  if (input.statusMessage) {
    err.statusMessage = input.statusMessage;
  } else if (input.statusText) {
    err.statusMessage = input.statusText;
  }
  if (err.statusMessage) {
    const originalMessage = err.statusMessage;
    const sanitizedMessage = sanitizeStatusMessage$1(err.statusMessage);
    if (sanitizedMessage !== originalMessage) {
      console.warn(
        "[h3] Please prefer using `message` for longer error messages instead of `statusMessage`. In the future, `statusMessage` will be sanitized by default."
      );
    }
  }
  if (input.fatal !== void 0) {
    err.fatal = input.fatal;
  }
  if (input.unhandled !== void 0) {
    err.unhandled = input.unhandled;
  }
  return err;
}
function isError$1(input) {
  return input?.constructor?.__h3_error__ === true;
}

function getQuery$1(event) {
  return getQuery$2(event.path || "");
}
function getRequestHeaders$1(event) {
  const _headers = {};
  for (const key in event.node.req.headers) {
    const val = event.node.req.headers[key];
    _headers[key] = Array.isArray(val) ? val.filter(Boolean).join(", ") : val;
  }
  return _headers;
}
function getRequestHeader$1(event, name) {
  const headers = getRequestHeaders$1(event);
  const value = headers[name.toLowerCase()];
  return value;
}

const DISALLOWED_STATUS_CHARS$1 = /[^\u0009\u0020-\u007E]/g;
function sanitizeStatusMessage$1(statusMessage = "") {
  return statusMessage.replace(DISALLOWED_STATUS_CHARS$1, "");
}
function sanitizeStatusCode$1(statusCode, defaultStatusCode = 200) {
  if (!statusCode) {
    return defaultStatusCode;
  }
  if (typeof statusCode === "string") {
    statusCode = Number.parseInt(statusCode, 10);
  }
  if (statusCode < 100 || statusCode > 999) {
    return defaultStatusCode;
  }
  return statusCode;
}

const defer = typeof setImmediate === "undefined" ? (fn) => fn() : setImmediate;
function send(event, data, type) {
  return new Promise((resolve) => {
    defer(() => {
      if (!event.handled) {
        event.node.res.end(data);
      }
      resolve();
    });
  });
}
function setResponseStatus(event, code, text) {
  if (code) {
    event.node.res.statusCode = sanitizeStatusCode$1(
      code,
      event.node.res.statusCode
    );
  }
  if (text) {
    event.node.res.statusMessage = sanitizeStatusMessage$1(text);
  }
}
function getResponseStatus(event) {
  return event.node.res.statusCode;
}
function getResponseStatusText(event) {
  return event.node.res.statusMessage;
}
function setResponseHeaders(event, headers) {
  for (const [name, value] of Object.entries(headers)) {
    event.node.res.setHeader(
      name,
      value
    );
  }
}
function setResponseHeader$1(event, name, value) {
  event.node.res.setHeader(name, value);
}
function appendResponseHeader$1(event, name, value) {
  let current = event.node.res.getHeader(name);
  if (!current) {
    event.node.res.setHeader(name, value);
    return;
  }
  if (!Array.isArray(current)) {
    current = [current.toString()];
  }
  event.node.res.setHeader(name, [...current, value]);
}

function isJsonRequest(event) {
  if (hasReqHeader(event, "accept", "text/html")) {
    return false;
  }
  return hasReqHeader(event, "accept", "application/json") || hasReqHeader(event, "user-agent", "curl/") || hasReqHeader(event, "user-agent", "httpie/") || hasReqHeader(event, "sec-fetch-mode", "cors") || event.path.startsWith("/api/") || event.path.endsWith(".json");
}
function hasReqHeader(event, name, includes) {
  const value = getRequestHeader$1(event, name);
  return value && typeof value === "string" && value.toLowerCase().includes(includes);
}

const errorHandler$0 = (async function errorhandler(error, event, { defaultHandler }) {
  if (event.handled || isJsonRequest(event)) {
    return;
  }
  const defaultRes = await defaultHandler(error, event, { json: true });
  const statusCode = error.statusCode || 500;
  if (statusCode === 404 && defaultRes.status === 302) {
    setResponseHeaders(event, defaultRes.headers);
    setResponseStatus(event, defaultRes.status, defaultRes.statusText);
    return send(event, JSON.stringify(defaultRes.body, null, 2));
  }
  const errorObject = defaultRes.body;
  const url = new URL(errorObject.url);
  errorObject.url = withoutBase(url.pathname, useRuntimeConfig(event).app.baseURL) + url.search + url.hash;
  errorObject.message ||= "Server Error";
  errorObject.data ||= error.data;
  errorObject.statusMessage ||= error.statusMessage;
  delete defaultRes.headers["content-type"];
  delete defaultRes.headers["content-security-policy"];
  setResponseHeaders(event, defaultRes.headers);
  const reqHeaders = getRequestHeaders$1(event);
  const isRenderingError = event.path.startsWith("/__nuxt_error") || !!reqHeaders["x-nuxt-error"];
  const res = isRenderingError ? null : await useNitroApp().localFetch(
    withQuery(joinURL(useRuntimeConfig(event).app.baseURL, "/__nuxt_error"), errorObject),
    {
      headers: { ...reqHeaders, "x-nuxt-error": "true" },
      redirect: "manual"
    }
  ).catch(() => null);
  if (event.handled) {
    return;
  }
  if (!res) {
    const { template } = await import('./error-500.mjs');
    setResponseHeader$1(event, "Content-Type", "text/html;charset=UTF-8");
    return send(event, template(errorObject));
  }
  const html = await res.text();
  for (const [header, value] of res.headers.entries()) {
    if (header === "set-cookie") {
      appendResponseHeader$1(event, header, value);
      continue;
    }
    setResponseHeader$1(event, header, value);
  }
  setResponseStatus(event, res.status && res.status !== 200 ? res.status : defaultRes.status, res.statusText || defaultRes.statusText);
  return send(event, html);
});

function defineNitroErrorHandler(handler) {
  return handler;
}

const errorHandler$1 = defineNitroErrorHandler(
  function defaultNitroErrorHandler(error, event) {
    const res = defaultHandler(error, event);
    setResponseHeaders$1(event, res.headers);
    setResponseStatus$1(event, res.status, res.statusText);
    return send$1(event, JSON.stringify(res.body, null, 2));
  }
);
function defaultHandler(error, event, opts) {
  const isSensitive = error.unhandled || error.fatal;
  const statusCode = error.statusCode || 500;
  const statusMessage = error.statusMessage || "Server Error";
  const url = getRequestURL(event, { xForwardedHost: true, xForwardedProto: true });
  if (statusCode === 404) {
    const baseURL = "/";
    if (/^\/[^/]/.test(baseURL) && !url.pathname.startsWith(baseURL)) {
      const redirectTo = `${baseURL}${url.pathname.slice(1)}${url.search}`;
      return {
        status: 302,
        statusText: "Found",
        headers: { location: redirectTo },
        body: `Redirecting...`
      };
    }
  }
  if (isSensitive && !opts?.silent) {
    const tags = [error.unhandled && "[unhandled]", error.fatal && "[fatal]"].filter(Boolean).join(" ");
    console.error(`[request error] ${tags} [${event.method}] ${url}
`, error);
  }
  const headers = {
    "content-type": "application/json",
    // Prevent browser from guessing the MIME types of resources.
    "x-content-type-options": "nosniff",
    // Prevent error page from being embedded in an iframe
    "x-frame-options": "DENY",
    // Prevent browsers from sending the Referer header
    "referrer-policy": "no-referrer",
    // Disable the execution of any js
    "content-security-policy": "script-src 'none'; frame-ancestors 'none';"
  };
  setResponseStatus$1(event, statusCode, statusMessage);
  if (statusCode === 404 || !getResponseHeader(event, "cache-control")) {
    headers["cache-control"] = "no-cache";
  }
  const body = {
    error: true,
    url: url.href,
    statusCode,
    statusMessage,
    message: isSensitive ? "Server Error" : error.message,
    data: isSensitive ? void 0 : error.data
  };
  return {
    status: statusCode,
    statusText: statusMessage,
    headers,
    body
  };
}

const errorHandlers = [errorHandler$0, errorHandler$1];

async function errorHandler(error, event) {
  for (const handler of errorHandlers) {
    try {
      await handler(error, event, { defaultHandler });
      if (event.handled) {
        return; // Response handled
      }
    } catch(error) {
      // Handler itself thrown, log and continue
      console.error(error);
    }
  }
  // H3 will handle fallback
}

function defineNitroPlugin(def) {
  return def;
}

const AIVEN_CA_CERTIFICATE = "-----BEGIN CERTIFICATE-----\nMIIEUDCCArigAwIBAgIUTAG7gMPqpM+PfUHgMf9lLG4b+bEwDQYJKoZIhvcNAQEM\nBQAwQDE+MDwGA1UEAww1NDUyZWFmYzMtNDU4NC00Njg4LWI1NDAtODJiYWU4ZTE0\nZDc0IEdFTiAxIFByb2plY3QgQ0EwHhcNMjUxMDMwMDcyNjUxWhcNMzUxMDI4MDcy\nNjUxWjBAMT4wPAYDVQQDDDU0NTJlYWZjMy00NTg0LTQ2ODgtYjU0MC04MmJhZThl\nMTRkNzQgR0VOIDEgUHJvamVjdCBDQTCCAaIwDQYJKoZIhvcNAQEBBQADggGPADCC\nAYoCggGBAKmKyGKzFAYjQJGdtlrtvXPuaZacnbjrde5BYQdU52IX5tJeWQ58N27o\npDbMrZhlOCvHd57K5Oxkp6V5alnI0/ekuTN8eoIYvjtNqtE72gIN6I808+nk1K/0\ntPxrvTURAFEvxyhf77JEIWOAz+OJ0fYfDmoIIp+IY5b0wp/sLhNO1u1m2+8tDglu\nbTSO4139nJo0D8ApafMpF5sQ5Vpci6wk9u6W3XpJ/+wJuJ5Oioe/mjEv/TKCkmzn\nwX4ALgiONVI3qxPV7RaynNY/SRpBX5kcuChrP/3+WZ9QsRwyPI530Kz2nZX10XVm\n5ik/tEVJAjf08yrhAjLxZ4paBt3Pcy9egNWIeA2ixMy49qu1QkDkCrw8t4K79oAC\nBy/bj5aVGbup2W+Q5hc83AQ2IhmWVWChnJI9dcg1l7T4AAqXJPBtp1AWGhHcldNH\n3Ao/aavgLE9kTcEWLO5P1izMKaYsqhpsQEx3lmWcLi4wPJn7F2f0pQ0Q5rJZ74Z6\nRNrZ80/c5wIDAQABo0IwQDAdBgNVHQ4EFgQUT+zOIhiQP49iiJ8dkJIeB0JY3JUw\nEgYDVR0TAQH/BAgwBgEB/wIBADALBgNVHQ8EBAMCAQYwDQYJKoZIhvcNAQEMBQAD\nggGBACVlQGNrmSCfIaevjuMDqvdGB7NZYJM3Fkr4m7bAtDD0WYxgneH9HmcaWcpA\nCtzbv64vP/wBIMRKzj3DeglUIe1hwaXQq4mcNuoGt4TMHzktdZhisgxCdjYFVIcS\nqjbsK1XOPChn/WFmEqCN+FsTdXIi4CeQPSFKFOIVxM+UKRk/nx2DV2PDwN/pt3A/\nGq10ujVDZNTdQlBSLIf5b+qtIVQRJ66cHpIaTTWZvkw++0ULbA8dK0f7sdrd751A\nlK1uTg9e3TEeW7TTdKqsr/8F8VVrJDtKjJLSN7IbM4QmnzBC/QAkNnuPEaDwwmyj\n5XEdvDcAa+VfZXRXSjAi05fsgw5f94dqJlos2oEDmeEN4tx3y0VItPUXOZNbWg7r\nJPPGg3mrBuICcqd1h9OgyYo+siTwHITM/kL0fgLzNWHEyYQ5GLigzvXNw+WLlWsh\niLd4pScmXlOmyIbdtAhxRwmNLBDupx/C3H8pTGl0nFKA3P3Sb/Ftw53wewc51flt\nZ7dREA==\n-----END CERTIFICATE-----";
function getSslConfig() {
  const sslEnabled = process.env.DATABASE_SSL === "true";
  if (!sslEnabled) {
    return void 0;
  }
  const caCertEnv = process.env.DATABASE_SSL_CA;
  if (caCertEnv) {
    console.log("\u{1F512} SSL enabled with CA certificate from environment variable");
    try {
      let ca;
      const isBase64 = !caCertEnv.includes("-----BEGIN CERTIFICATE-----") && /^[A-Za-z0-9+/=]+$/.test(caCertEnv.replace(/\s/g, ""));
      if (isBase64) {
        console.log("\u{1F4E6} Detected Base64 encoded certificate");
        ca = Buffer.from(caCertEnv, "base64");
      } else {
        let cleanCert = caCertEnv.trim();
        if (cleanCert.startsWith('"') && cleanCert.endsWith('"'))
          cleanCert = cleanCert.slice(1, -1);
        if (cleanCert.startsWith("'") && cleanCert.endsWith("'"))
          cleanCert = cleanCert.slice(1, -1);
        cleanCert = cleanCert.replace(/\\n/g, "\n");
        if (!cleanCert.includes("-----BEGIN CERTIFICATE-----")) {
          console.warn(
            "\u26A0\uFE0F Invalid certificate format (missing headers). Fallback to non-verified SSL."
          );
          return { rejectUnauthorized: false };
        }
        ca = Buffer.from(cleanCert, "utf-8");
      }
      console.log("\u{1F512} CA certificate processed successfully. Size:", ca.length);
      return { ca, rejectUnauthorized: true };
    } catch (e) {
      console.error("\u274C Error processing CA certificate:", e.message);
      return { rejectUnauthorized: false };
    }
  }
  console.log("\u{1F512} SSL enabled with built-in Aiven CA certificate");
  return {
    ca: Buffer.from(AIVEN_CA_CERTIFICATE, "utf-8"),
    rejectUnauthorized: true
  };
}
const dbConfig = {
  host: process.env.DATABASE_HOST || "localhost",
  port: parseInt(process.env.DATABASE_PORT || "3306"),
  user: process.env.DATABASE_USER || "root",
  password: process.env.DATABASE_PASSWORD || "",
  database: process.env.DATABASE_NAME || "atc_test",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  ssl: getSslConfig()
  // Примечание: max_allowed_packet настраивается на сервере MySQL, а не в клиенте
  // Для работы с большими данными (шаблоны с изображениями) убедитесь, что на сервере установлено:
  // SET GLOBAL max_allowed_packet = 67108864; -- 64MB
};
let pool = null;
function getDbPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
    console.log("\u2705 MySQL connection pool created");
  }
  return pool;
}
async function executeQuery(query, params) {
  const connection = await getDbPool().getConnection();
  try {
    const [rows] = await connection.execute(query, params);
    return rows;
  } finally {
    connection.release();
  }
}
async function executeTransaction(callback) {
  const connection = await getDbPool().getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
async function testConnection() {
  try {
    const connection = await getDbPool().getConnection();
    await connection.ping();
    connection.release();
    console.log("\u2705 Database connection successful");
    return true;
  } catch (error) {
    console.error("\u274C Database connection failed:", error);
    return false;
  }
}

const db = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  executeQuery: executeQuery,
  executeTransaction: executeTransaction,
  getDbPool: getDbPool,
  testConnection: testConnection
}, Symbol.toStringTag, { value: 'Module' }));

const description$i = "Initial Consolidated Schema";
const up$i = async (connection) => {
  console.log("!!! DEBUG: I AM RUNNING MODIFIED INITIAL SCHEMA !!!");
  console.log("\u{1F504} Running Initial Schema Migration...");
  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(191) PRIMARY KEY,
      role ENUM('ADMIN', 'MANAGER', 'TEACHER', 'STUDENT') NOT NULL DEFAULT 'STUDENT',
      name VARCHAR(191) NOT NULL,
      email VARCHAR(191) NOT NULL UNIQUE,
      password_hash VARCHAR(191) NOT NULL,
      phone VARCHAR(191),
      workplace VARCHAR(191),
      position VARCHAR(191),
      pinfl VARCHAR(14),
      
      student_id VARCHAR(191) NULL COMMENT 'Link to student record',
      instructor_id VARCHAR(191) NULL COMMENT 'Link to instructor record',
      
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_email (email),
      INDEX idx_name (name),
      INDEX idx_role (role),
      INDEX idx_pinfl (pinfl),
      INDEX idx_student_id (student_id),
      INDEX idx_instructor_id (instructor_id),
      FULLTEXT INDEX ft_search_user (name, email, phone)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('\u2705 Table "users" created');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS organizations (
      id VARCHAR(191) PRIMARY KEY,
      code VARCHAR(100) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      short_name VARCHAR(100),
      contact_phone VARCHAR(20),
      contact_email VARCHAR(100),
      address TEXT,
      description TEXT,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      students_count INT NOT NULL DEFAULT 0,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_code (code),
      INDEX idx_name (name),
      INDEX idx_is_active (is_active),
      FULLTEXT INDEX ft_search (name, short_name, address)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('\u2705 Table "organizations" created');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS organization_representatives (
      id VARCHAR(191) PRIMARY KEY,
      organization_id VARCHAR(191) NOT NULL,
      full_name VARCHAR(255) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      telegram_chat_id BIGINT UNIQUE,
      telegram_username VARCHAR(100),
      status ENUM('pending', 'approved', 'blocked') NOT NULL DEFAULT 'pending',
      access_groups JSON COMMENT 'JSON array of group IDs',
      notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
      last_activity_at DATETIME(3),
      approved_by VARCHAR(191),
      approved_at DATETIME(3),
      blocked_reason TEXT,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_organization_id (organization_id),
      INDEX idx_telegram_chat_id (telegram_chat_id),
      INDEX idx_status (status),
      CONSTRAINT fk_representatives_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_representatives_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('\u2705 Table "organization_representatives" created');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS students (
      id VARCHAR(191) PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      pinfl VARCHAR(14) NOT NULL UNIQUE,
      organization VARCHAR(255) NOT NULL COMMENT 'Legacy text name',
      organization_id VARCHAR(191) NULL,
      department VARCHAR(255),
      position VARCHAR(255) NOT NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_pinfl (pinfl),
      INDEX idx_full_name (full_name),
      INDEX idx_organization_id (organization_id),
      FULLTEXT INDEX ft_search (full_name, organization, position),
      CONSTRAINT fk_students_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('\u2705 Table "students" created');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS instructors (
      id VARCHAR(191) PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(50),
      hire_date DATE,
      contract_info TEXT,
      max_hours INT DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_full_name (full_name),
      INDEX idx_is_active (is_active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('\u2705 Table "instructors" created');
  await connection.query(`
    ALTER TABLE users
    ADD CONSTRAINT fk_users_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT fk_users_instructor FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE SET NULL ON UPDATE CASCADE
  `);
  await connection.query(`
    CREATE TABLE IF NOT EXISTS certificate_templates (
      id VARCHAR(191) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      template_file_url VARCHAR(500),
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('\u2705 Table "certificate_templates" created');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS courses (
      id VARCHAR(191) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      short_name VARCHAR(10) NOT NULL,
      code VARCHAR(20) NOT NULL UNIQUE,
      description TEXT,
      total_hours INT NOT NULL DEFAULT 0,
      certificate_template_id VARCHAR(191),
      is_active BOOLEAN DEFAULT TRUE,
      
      is_archived BOOLEAN NOT NULL DEFAULT FALSE,
      archived_at DATETIME(3) NULL,
      archived_by VARCHAR(191) NULL,
      
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_name (name),
      INDEX idx_code (code),
      INDEX idx_archived (is_archived),
      CONSTRAINT fk_courses_certificate_template FOREIGN KEY (certificate_template_id) REFERENCES certificate_templates(id) ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_courses_archived_by FOREIGN KEY (archived_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('\u2705 Table "courses" created');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS disciplines (
      id VARCHAR(191) PRIMARY KEY,
      course_id VARCHAR(191) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      hours INT NOT NULL DEFAULT 0,
      theory_hours INT NOT NULL DEFAULT 0,
      practice_hours INT NOT NULL DEFAULT 0,
      assessment_hours INT NOT NULL DEFAULT 0,
      order_index INT NOT NULL DEFAULT 0,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_course_id (course_id),
      CONSTRAINT fk_disciplines_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('\u2705 Table "disciplines" created');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS discipline_instructors (
      id VARCHAR(191) PRIMARY KEY,
      discipline_id VARCHAR(191) NOT NULL,
      instructor_id VARCHAR(191) NOT NULL,
      is_primary BOOLEAN DEFAULT FALSE,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      
      UNIQUE INDEX idx_discipline_instructor (discipline_id, instructor_id),
      CONSTRAINT fk_di_discipline FOREIGN KEY (discipline_id) REFERENCES disciplines(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_di_instructor FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('\u2705 Table "discipline_instructors" created');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS study_groups (
      id VARCHAR(191) PRIMARY KEY,
      code VARCHAR(50) NOT NULL UNIQUE,
      course_id VARCHAR(191) NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      classroom VARCHAR(100),
      description TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      
      is_archived BOOLEAN NOT NULL DEFAULT FALSE,
      archived_at DATETIME(3) NULL,
      archived_by VARCHAR(191) NULL,
      
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_dates (start_date, end_date),
      INDEX idx_archived (is_archived),
      CONSTRAINT fk_study_groups_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT fk_study_groups_archived_by FOREIGN KEY (archived_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('\u2705 Table "study_groups" created');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS study_group_students (
      id VARCHAR(191) PRIMARY KEY,
      group_id VARCHAR(191) NOT NULL,
      student_id VARCHAR(191) NOT NULL,
      enrolled_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      
      UNIQUE INDEX idx_group_student (group_id, student_id),
      CONSTRAINT fk_sgs_group FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_sgs_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('\u2705 Table "study_group_students" created');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS classrooms (
      id VARCHAR(191) PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      capacity INT DEFAULT 0,
      description TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schedule_events (
      id VARCHAR(191) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      group_id VARCHAR(191),
      discipline_id VARCHAR(191),
      instructor_id VARCHAR(191),
      classroom_id VARCHAR(191),
      start_time DATETIME NOT NULL,
      end_time DATETIME NOT NULL,
      duration_minutes INT NULL COMMENT 'Duration in minutes',
      academic_hours INT NULL COMMENT 'Number of academic hours',
      original_event_id VARCHAR(191) NULL COMMENT 'Original event ID for retakes',
      
      is_all_day BOOLEAN DEFAULT FALSE,
      color VARCHAR(20) DEFAULT 'primary',
      event_type ENUM('theory', 'practice', 'assessment', 'other') DEFAULT 'theory',
      
      allowed_student_ids JSON NULL COMMENT 'List of allowed student IDs (e.g. for retakes)',
      
      is_recurring BOOLEAN DEFAULT FALSE,
      recurrence_rule TEXT,
      notes TEXT,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_date_range (start_time, end_time),
      INDEX idx_original_event_id (original_event_id),
      CONSTRAINT fk_schedule_group FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_schedule_discipline FOREIGN KEY (discipline_id) REFERENCES disciplines(id) ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_schedule_instructor FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_schedule_classroom FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_schedule_original FOREIGN KEY (original_event_id) REFERENCES schedule_events(id) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('\u2705 Table "schedule_events" created');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS attendance (
      id VARCHAR(191) PRIMARY KEY,
      student_id VARCHAR(191) NOT NULL,
      schedule_event_id VARCHAR(191) NOT NULL,
      hours_attended DECIMAL(3,1) NOT NULL DEFAULT 0,
      max_hours DECIMAL(3,1) NOT NULL,
      notes TEXT,
      marked_by VARCHAR(191),
      marked_at DATETIME(3),
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      UNIQUE INDEX idx_attendance_student_event (student_id, schedule_event_id),
      CONSTRAINT fk_attendance_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_attendance_event FOREIGN KEY (schedule_event_id) REFERENCES schedule_events(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_attendance_marked_by FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('\u2705 Table "attendance" created');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS grades (
      id VARCHAR(191) PRIMARY KEY,
      student_id VARCHAR(191) NOT NULL,
      schedule_event_id VARCHAR(191) NOT NULL,
      grade INT NOT NULL,
      notes TEXT,
      graded_by VARCHAR(191),
      graded_at DATETIME(3),
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      UNIQUE INDEX idx_grades_student_event (student_id, schedule_event_id),
      CONSTRAINT fk_grades_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_grades_event FOREIGN KEY (schedule_event_id) REFERENCES schedule_events(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_grades_graded_by FOREIGN KEY (graded_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('\u2705 Table "grades" created');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS final_grades (
      id VARCHAR(191) PRIMARY KEY,
      student_id VARCHAR(191) NOT NULL,
      group_id VARCHAR(191) NOT NULL,
      discipline_id VARCHAR(191) NOT NULL,
      final_grade INT,
      attendance_percent DECIMAL(5,2),
      status ENUM('in_progress', 'passed', 'failed', 'not_allowed') NOT NULL DEFAULT 'in_progress',
      notes TEXT,
      graded_by VARCHAR(191),
      graded_at DATETIME(3),
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      UNIQUE INDEX idx_final_grades_student_group_discipline (student_id, group_id, discipline_id),
      CONSTRAINT fk_final_grades_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_final_grades_group FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_final_grades_discipline FOREIGN KEY (discipline_id) REFERENCES disciplines(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('\u2705 Table "final_grades" created');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schedule_periods (
      id INT PRIMARY KEY AUTO_INCREMENT,
      period_number INT NOT NULL,
      start_time VARCHAR(5) NOT NULL,
      end_time VARCHAR(5) NOT NULL,
      is_after_break BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_period_number (period_number)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('\u2705 Table "schedule_periods" created');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schedule_settings (
      id INT PRIMARY KEY AUTO_INCREMENT,
      setting_key VARCHAR(100) NOT NULL UNIQUE,
      setting_value TEXT NOT NULL,
      description VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('\u2705 Table "schedule_settings" created');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS issued_certificates (
      id VARCHAR(191) PRIMARY KEY,
      
      -- Optional links (can be null for standalone)
      group_id VARCHAR(191) NULL,
      template_id VARCHAR(191) NULL,
      
      student_id VARCHAR(191) NOT NULL,
      certificate_number VARCHAR(100) NOT NULL,
      issue_date DATE NOT NULL,
      expiry_date DATE,
      
      -- Standalone Fields
      course_name VARCHAR(255) NULL,
      course_code VARCHAR(50) NULL,
      course_hours INT NULL,
      group_code VARCHAR(50) NULL,
      group_start_date DATE NULL,
      group_end_date DATE NULL,
      source_type ENUM('group_journal', 'manual', 'import') NOT NULL DEFAULT 'group_journal',
      
      pdf_file_url VARCHAR(500),
      status ENUM('issued', 'revoked') DEFAULT 'issued',
      
      variables_data JSON NULL COMMENT 'Snapshot of data at time of issue',
      
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_student_id (student_id),
      INDEX idx_certificate_number (certificate_number),
      INDEX idx_source_type (source_type),
      INDEX idx_student_source (student_id, source_type),
      
      CONSTRAINT fk_issued_cert_group FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_issued_cert_template FOREIGN KEY (template_id) REFERENCES certificate_templates(id) ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_issued_cert_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('\u2705 Table "issued_certificates" created');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS folders (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      uuid CHAR(36) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      parent_id INT UNSIGNED NULL,
      path VARCHAR(1024) NOT NULL,
      user_id VARCHAR(36) NULL,
      password_hash VARCHAR(255) NULL,
      is_system BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      INDEX idx_parent_id (parent_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('\u2705 Table "folders" created');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS files (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      uuid CHAR(36) NOT NULL UNIQUE,
      filename VARCHAR(255) NOT NULL,
      original_filename VARCHAR(255) NULL,
      stored_name VARCHAR(255) NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      size_bytes INT UNSIGNED NOT NULL,
      extension VARCHAR(10) NOT NULL,
      storage_path VARCHAR(500) NOT NULL,
      full_path VARCHAR(1000) NOT NULL,
      
      category ENUM('profile', 'certificate_template', 'certificate_generated', 'course_material', 'course_media', 'course_cover', 'group_gallery', 'group_file', 'group_report', 'assignment', 'other') NOT NULL,
      
      folder_id INT UNSIGNED NULL,
      user_id VARCHAR(36) NULL,
      course_id INT UNSIGNED NULL,
      group_id VARCHAR(191) NULL,
      assignment_id INT UNSIGNED NULL,
      
      metadata JSON NULL,
      is_public BOOLEAN DEFAULT FALSE,
      access_level ENUM('public', 'authenticated', 'owner', 'admin') DEFAULT 'authenticated',
      uploaded_by VARCHAR(36) NOT NULL,
      uploaded_by_user VARCHAR(191) NULL COMMENT 'FK to users table',
      uploaded_at_time DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
      
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      
      INDEX idx_uuid (uuid),
      INDEX idx_folder_id (folder_id),
      INDEX idx_group_id (group_id),
      INDEX idx_files_group_category (group_id, category),
      CONSTRAINT fk_files_uploaded_by_user FOREIGN KEY (uploaded_by_user) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('\u2705 Table "files" created');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(191) NOT NULL,
      action_type ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'IMPORT', 'EXPORT', 'VIEW', 'DOWNLOAD', 'UPLOAD') NOT NULL,
      entity_type ENUM(
        'USER', 'STUDENT', 'CERTIFICATE', 'COURSE', 'DISCIPLINE', 
        'INSTRUCTOR', 'FILE', 'FOLDER', 'SYSTEM', 'GROUP', 
        'SCHEDULE', 'ATTENDANCE', 'GRADE', 'ORGANIZATION', 'REPRESENTATIVE', 'LIBRARY_BOOK', 'TEST'
      ) NOT NULL,
      entity_id VARCHAR(191) NULL,
      entity_name VARCHAR(255) NULL,
      details JSON NULL,
      ip_address VARCHAR(45) NULL,
      user_agent TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_id (user_id),
      INDEX idx_action_type (action_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('\u2705 Table "activity_logs" created');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS telegram_bot_sessions (
      id VARCHAR(191) PRIMARY KEY,
      chat_id BIGINT NOT NULL UNIQUE,
      state VARCHAR(50) NOT NULL DEFAULT 'idle',
      data JSON,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('\u2705 Table "telegram_bot_sessions" created');
  console.log("\u{1F331} Seeding initial data...");
  const [existingAdmin] = await connection.query(
    "SELECT id FROM users WHERE email = ? LIMIT 1",
    ["admin@atc.uz"]
  );
  if (!existingAdmin || existingAdmin.length === 0) {
    const adminPassword = "admin123";
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const adminId = randomUUID();
    await connection.query(
      `INSERT INTO users (id, role, name, email, password_hash, created_at, updated_at) 
       VALUES (?, 'ADMIN', '\u0410\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440', 'admin@atc.uz', ?, NOW(3), NOW(3))`,
      [adminId, hashedPassword]
    );
    console.log("\u2705 Default admin user created");
  }
  const [existingPeriods] = await connection.query(
    "SELECT COUNT(*) as count FROM schedule_periods"
  );
  if (existingPeriods[0].count === 0) {
    await connection.query(`
      INSERT INTO schedule_periods (period_number, start_time, end_time, is_after_break) VALUES
      (1, '09:00', '09:40', FALSE),
      (2, '09:40', '10:20', FALSE),
      (3, '10:30', '11:10', FALSE),
      (4, '11:10', '11:50', FALSE),
      (5, '12:00', '12:40', TRUE),
      (6, '12:40', '13:20', FALSE),
      (7, '14:00', '14:40', TRUE),
      (8, '14:40', '15:20', FALSE),
      (9, '15:30', '16:10', FALSE),
      (10, '16:10', '16:50', FALSE)
    `);
    console.log("\u2705 Default schedule periods created");
  }
};
const down$i = async (connection) => {
  console.log("\u{1F504} Rolling back Initial Schema Migration...");
  await connection.query("SET FOREIGN_KEY_CHECKS = 0");
  const tables = [
    "users",
    "organizations",
    "organization_representatives",
    "students",
    "instructors",
    "certificate_templates",
    "courses",
    "disciplines",
    "discipline_instructors",
    "study_groups",
    "study_group_students",
    "classrooms",
    "schedule_events",
    "attendance",
    "grades",
    "final_grades",
    "schedule_periods",
    "schedule_settings",
    "issued_certificates",
    "folders",
    "files",
    "activity_logs",
    "telegram_bot_sessions"
  ];
  for (const table of tables) {
    await connection.query(`DROP TABLE IF EXISTS ${table}`);
    console.log(`\u{1F5D1}\uFE0F  Dropped table ${table}`);
  }
  await connection.query("SET FOREIGN_KEY_CHECKS = 1");
  console.log("\u2705 Initial Schema rolled back");
};

const description$h = "Testing System Module";
const up$h = async (connection) => {
  console.log("\u{1F504} Running migration: Testing System Module");
  await connection.query(`
    CREATE TABLE IF NOT EXISTS question_banks (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(50) NOT NULL UNIQUE,
      description TEXT NULL,
      category VARCHAR(100) NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_by VARCHAR(191) NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_category (category),
      FULLTEXT INDEX ft_search (name, description, category),
      CONSTRAINT fk_question_banks_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await connection.query(`
    CREATE TABLE IF NOT EXISTS questions (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      bank_id VARCHAR(191) NOT NULL,
      question_type ENUM('single', 'multiple', 'text', 'order', 'match') NOT NULL DEFAULT 'single',
      question_text TEXT NOT NULL,
      question_media JSON NULL,
      options JSON NOT NULL,
      points INT NOT NULL DEFAULT 1,
      explanation TEXT NULL,
      difficulty ENUM('easy', 'medium', 'hard') NOT NULL DEFAULT 'medium',
      tags JSON NULL,
      order_index INT NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_bank_id (bank_id),
      FULLTEXT INDEX ft_question_text (question_text),
      CONSTRAINT fk_questions_bank FOREIGN KEY (bank_id) REFERENCES question_banks(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await connection.query(`
    CREATE TABLE IF NOT EXISTS test_templates (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      bank_id VARCHAR(191) NOT NULL,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(50) NOT NULL UNIQUE,
      description TEXT NULL,
      questions_mode ENUM('all', 'random', 'manual') NOT NULL DEFAULT 'all',
      questions_count INT NULL,
      time_limit_minutes INT NULL,
      passing_score INT NOT NULL DEFAULT 60,
      max_attempts INT NOT NULL DEFAULT 1,
      shuffle_questions BOOLEAN NOT NULL DEFAULT TRUE,
      shuffle_options BOOLEAN NOT NULL DEFAULT TRUE,
      questions_per_page INT NOT NULL DEFAULT 1,
      show_results ENUM('immediately', 'after_deadline', 'manual', 'never') NOT NULL DEFAULT 'immediately',
      allow_back BOOLEAN NOT NULL DEFAULT TRUE,
      proctoring_enabled BOOLEAN NOT NULL DEFAULT FALSE,
      proctoring_settings JSON NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_by VARCHAR(191) NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_bank_id (bank_id),
      CONSTRAINT fk_test_templates_bank FOREIGN KEY (bank_id) REFERENCES question_banks(id) ON DELETE CASCADE,
      CONSTRAINT fk_test_templates_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await connection.query(`
    CREATE TABLE IF NOT EXISTS test_template_questions (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      template_id VARCHAR(191) NOT NULL,
      question_id VARCHAR(191) NOT NULL,
      order_index INT NOT NULL DEFAULT 0,
      points_override INT NULL,
      
      UNIQUE KEY uk_template_question (template_id, question_id),
      CONSTRAINT fk_ttq_template FOREIGN KEY (template_id) REFERENCES test_templates(id) ON DELETE CASCADE,
      CONSTRAINT fk_ttq_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await connection.query(`
    CREATE TABLE IF NOT EXISTS discipline_tests (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      discipline_id VARCHAR(191) NOT NULL,
      test_template_id VARCHAR(191) NOT NULL,
      is_required BOOLEAN NOT NULL DEFAULT FALSE,
      order_index INT NOT NULL DEFAULT 0,
      notes TEXT NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      
      UNIQUE KEY uk_discipline_test (discipline_id, test_template_id),
      CONSTRAINT fk_discipline_tests_discipline FOREIGN KEY (discipline_id) REFERENCES disciplines(id) ON DELETE CASCADE,
      CONSTRAINT fk_discipline_tests_template FOREIGN KEY (test_template_id) REFERENCES test_templates(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await connection.query(`
    CREATE TABLE IF NOT EXISTS test_assignments (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      schedule_event_id VARCHAR(191) NOT NULL,
      test_template_id VARCHAR(191) NOT NULL,
      group_id VARCHAR(191) NOT NULL,
      
      allowed_student_ids JSON NULL COMMENT 'List of allowed student IDs (e.g. for retakes)',
      
      time_limit_override INT NULL,
      passing_score_override INT NULL,
      start_date DATETIME(3) NULL,
      end_date DATETIME(3) NULL,
      status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'scheduled',
      assigned_by VARCHAR(191) NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      UNIQUE KEY uk_schedule_event (schedule_event_id),
      CONSTRAINT fk_test_assignments_event FOREIGN KEY (schedule_event_id) REFERENCES schedule_events(id) ON DELETE CASCADE,
      CONSTRAINT fk_test_assignments_template FOREIGN KEY (test_template_id) REFERENCES test_templates(id) ON DELETE RESTRICT,
      CONSTRAINT fk_test_assignments_group FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE CASCADE,
      CONSTRAINT fk_test_assignments_assigned_by FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await connection.query(`
    CREATE TABLE IF NOT EXISTS test_sessions (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      assignment_id VARCHAR(191) NOT NULL,
      student_id VARCHAR(191) NOT NULL,
      attempt_number INT NOT NULL DEFAULT 1,
      status ENUM('in_progress', 'completed', 'timeout', 'cancelled', 'violation') NOT NULL DEFAULT 'in_progress',
      questions_order JSON NULL,
      current_question_index INT NOT NULL DEFAULT 0,
      started_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      completed_at DATETIME(3) NULL,
      time_spent_seconds INT NULL,
      total_points INT NULL,
      max_points INT NULL,
      score_percent DECIMAL(5, 2) NULL,
      passed BOOLEAN NULL,
      grade INT NULL,
      violations JSON NULL,
      ip_address VARCHAR(45) NULL,
      user_agent TEXT NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      UNIQUE KEY uk_assignment_student_attempt (assignment_id, student_id, attempt_number),
      CONSTRAINT fk_test_sessions_assignment FOREIGN KEY (assignment_id) REFERENCES test_assignments(id) ON DELETE CASCADE,
      CONSTRAINT fk_test_sessions_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await connection.query(`
    CREATE TABLE IF NOT EXISTS test_answers (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      session_id VARCHAR(191) NOT NULL,
      question_id VARCHAR(191) NOT NULL,
      answer_data JSON NOT NULL,
      is_correct BOOLEAN NULL,
      points_earned INT NOT NULL DEFAULT 0,
      answered_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      time_spent_seconds INT NULL,
      
      UNIQUE KEY uk_session_question (session_id, question_id),
      CONSTRAINT fk_test_answers_session FOREIGN KEY (session_id) REFERENCES test_sessions(id) ON DELETE CASCADE,
      CONSTRAINT fk_test_answers_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("\u2705 Testing System tables created");
};
const down$h = async (connection) => {
  console.log("\u{1F504} Rolling back Testing System Module");
  const tables = [
    "test_answers",
    "test_sessions",
    "test_assignments",
    "discipline_tests",
    "test_template_questions",
    "test_templates",
    "questions",
    "question_banks"
  ];
  for (const table of tables) {
    await connection.query(`DROP TABLE IF EXISTS ${table}`);
  }
  console.log("\u2705 Tables dropped");
};

const description$g = "Attendance Marking System & Triggers";
const up$g = async (connection) => {
  console.log("\u{1F504} Running migration: Attendance Marking System");
  await connection.query(`
    CREATE TABLE IF NOT EXISTS attendance_marking_status (
      id VARCHAR(191) PRIMARY KEY,
      schedule_event_id VARCHAR(191) NOT NULL UNIQUE,
      status ENUM('pending', 'in_progress', 'on_time', 'late', 'overdue', 'approved') NOT NULL DEFAULT 'pending',
      marked_by VARCHAR(191),
      marked_at DATETIME(3),
      deadline DATETIME(3) NOT NULL,
      late_deadline DATETIME(3) NOT NULL,
      late_reason TEXT,
      approved_by VARCHAR(191),
      approved_at DATETIME(3),
      students_count INT NOT NULL DEFAULT 0,
      marked_count INT NOT NULL DEFAULT 0,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_ams_status (status),
      CONSTRAINT fk_ams_schedule_event FOREIGN KEY (schedule_event_id) REFERENCES schedule_events(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_ams_marked_by FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_ams_approved_by FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await connection.query(`
    CREATE TABLE IF NOT EXISTS attendance_marking_requests (
      id VARCHAR(191) PRIMARY KEY,
      schedule_event_id VARCHAR(191) NOT NULL,
      instructor_id VARCHAR(191) NOT NULL,
      reason TEXT NOT NULL,
      status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
      reviewed_by VARCHAR(191),
      reviewed_at DATETIME(3),
      review_comment TEXT,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      CONSTRAINT fk_amr_schedule_event FOREIGN KEY (schedule_event_id) REFERENCES schedule_events(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_amr_instructor FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_amr_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await connection.query(`
    CREATE TABLE IF NOT EXISTS attendance_settings (
      id INT PRIMARY KEY AUTO_INCREMENT,
      setting_key VARCHAR(100) NOT NULL UNIQUE,
      setting_value VARCHAR(255) NOT NULL,
      description TEXT,
      updated_by VARCHAR(191),
      updated_at DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      CONSTRAINT fk_as_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await connection.query(`
    INSERT INTO attendance_settings (setting_key, setting_value, description) VALUES
    ('ATTENDANCE_MARK_DEADLINE_HOURS', '24', 'Hours after event for standard marking'),
    ('ATTENDANCE_EDIT_DEADLINE_HOURS', '72', 'Hours after event for late marking'),
    ('ATTENDANCE_LATE_MARK_ALLOWED', 'true', 'Allow late marking (24-72h)'),
    ('ATTENDANCE_REQUIRE_APPROVAL_AFTER_DEADLINE', 'true', 'Require admin approval after 72h'),
    ('ATTENDANCE_REMINDER_HOURS_BEFORE', '2', 'Reminder hours before deadline'),
    ('ATTENDANCE_NOTIFICATION_ADMIN_THRESHOLD', '48', 'Notify admin after N hours un-marked'),
    ('ATTENDANCE_AUTO_CREATE_STATUS', 'true', 'Auto-create status on event creation')
    ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
  `);
  try {
    await connection.query(
      `DROP TRIGGER IF EXISTS trg_schedule_event_after_insert`
    );
    await connection.query(`
      CREATE TRIGGER trg_schedule_event_after_insert
      AFTER INSERT ON schedule_events
      FOR EACH ROW
      BEGIN
        DECLARE deadline_hours INT DEFAULT 24;
        DECLARE late_deadline_hours INT DEFAULT 72;
        DECLARE students_cnt INT DEFAULT 0;
        
        -- Get settings
        SELECT CAST(setting_value AS UNSIGNED) INTO deadline_hours 
        FROM attendance_settings WHERE setting_key = 'ATTENDANCE_MARK_DEADLINE_HOURS' LIMIT 1;
        
        SELECT CAST(setting_value AS UNSIGNED) INTO late_deadline_hours 
        FROM attendance_settings WHERE setting_key = 'ATTENDANCE_EDIT_DEADLINE_HOURS' LIMIT 1;
        
        -- Count students (using study_group_students)
        IF NEW.group_id IS NOT NULL THEN
          SELECT COUNT(*) INTO students_cnt 
          FROM study_group_students WHERE group_id = NEW.group_id;
        END IF;
        
        -- Create status record
        INSERT INTO attendance_marking_status (
          id, schedule_event_id, status, deadline, late_deadline, students_count
        ) VALUES (
          UUID(), NEW.id, 'pending',
          DATE_ADD(NEW.end_time, INTERVAL IFNULL(deadline_hours, 24) HOUR),
          DATE_ADD(NEW.end_time, INTERVAL IFNULL(late_deadline_hours, 72) HOUR),
          students_cnt
        );
      END
    `);
    console.log("\u2705 Trigger trg_schedule_event_after_insert created");
  } catch (error) {
    console.log("\u26A0\uFE0F Trigger creation warning:", error.message);
  }
  console.log("\u2705 Attendance Marking System tables created");
};
const down$g = async (connection) => {
  console.log("\u{1F504} Rolling back Attendance Marking System");
  await connection.query(
    "DROP TRIGGER IF EXISTS trg_schedule_event_after_insert"
  );
  await connection.query("DROP TABLE IF EXISTS attendance_marking_requests");
  await connection.query("DROP TABLE IF EXISTS attendance_marking_status");
  await connection.query("DROP TABLE IF EXISTS attendance_settings");
};

const description$f = "Student Portal Module";
const up$f = async (connection) => {
  console.log("\u{1F504} Running migration: Student Portal Module");
  await connection.query(`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id VARCHAR(191) NOT NULL PRIMARY KEY,
      theme ENUM('light', 'dark', 'auto') NOT NULL DEFAULT 'light',
      language ENUM('ru', 'en', 'uz') NOT NULL DEFAULT 'ru',
      notifications_email BOOLEAN NOT NULL DEFAULT TRUE,
      notifications_push BOOLEAN NOT NULL DEFAULT TRUE,
      notifications_sms BOOLEAN NOT NULL DEFAULT FALSE,
      compact_mode BOOLEAN NOT NULL DEFAULT FALSE,
      font_size ENUM('small', 'medium', 'large') NOT NULL DEFAULT 'medium',
      sidebar_color VARCHAR(50) DEFAULT 'default',
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      CONSTRAINT fk_user_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await connection.query(`
    CREATE TABLE IF NOT EXISTS support_tickets (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      user_id VARCHAR(191) NOT NULL,
      ticket_type ENUM('technical', 'question', 'feature', 'bug', 'other') NOT NULL,
      priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
      subject VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      attachments JSON NULL,
      status ENUM('new', 'in_progress', 'resolved', 'closed') NOT NULL DEFAULT 'new',
      assigned_to VARCHAR(191) NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      resolved_at DATETIME(3) NULL,
      
      INDEX idx_user_id (user_id),
      INDEX idx_status (status),
      CONSTRAINT fk_support_tickets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_support_tickets_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await connection.query(`
    CREATE TABLE IF NOT EXISTS student_notifications (
      id VARCHAR(191) NOT NULL PRIMARY KEY,
      student_id VARCHAR(191) NOT NULL,
      type ENUM(
        'TEST_UPCOMING', 'TEST_TODAY', 'TEST_OVERDUE',
        'DEADLINE_WARNING', 'DEADLINE_CRITICAL',
        'SCHEDULE_CHANGE', 'GRADE_POSTED'
      ) NOT NULL,
      priority ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'medium',
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      link VARCHAR(500) NULL,
      metadata JSON NULL,
      is_read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      
      INDEX idx_student_id (student_id),
      INDEX idx_is_read (is_read),
      CONSTRAINT fk_student_notifications_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("\u2705 Student Portal tables created");
};
const down$f = async (connection) => {
  console.log("\u{1F504} Rolling back Student Portal Module");
  await connection.query("DROP TABLE IF EXISTS student_notifications");
  await connection.query("DROP TABLE IF EXISTS support_tickets");
  await connection.query("DROP TABLE IF EXISTS user_settings");
};

const description$e = "Schedule Templates for mass assignment";
const up$e = async (connection) => {
  console.log("\u{1F504} Running migration: Schedule Templates");
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schedule_templates (
      id VARCHAR(191) PRIMARY KEY,
      name VARCHAR(255) NOT NULL COMMENT 'Template Name',
      description TEXT,
      source_group_id VARCHAR(191) COMMENT 'Source Group ID (for reference)',
      events_data JSON NOT NULL COMMENT 'Serialized events data',
      created_by VARCHAR(191) NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_name (name),
      INDEX idx_created_by (created_by),
      CONSTRAINT fk_schedule_templates_source_group FOREIGN KEY (source_group_id) REFERENCES study_groups(id) ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_schedule_templates_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("\u2705 Created table: schedule_templates");
};
const down$e = async (connection) => {
  console.log("\u{1F504} Rolling back Schedule Templates");
  await connection.query(`DROP TABLE IF EXISTS schedule_templates`);
};

const description$d = "Library System";
async function up$d(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS books (
      id VARCHAR(36) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      author VARCHAR(255) NULL,
      description TEXT NULL,
      category VARCHAR(100) NULL,
      isbn VARCHAR(20) NULL,
      language VARCHAR(10) NULL,
      
      original_file_path VARCHAR(500) NOT NULL,
      cover_path VARCHAR(500) NULL,
      
      total_pages INT NOT NULL DEFAULT 0,
      file_size_bytes BIGINT DEFAULT 0,
      
      status ENUM('processing', 'ready', 'error') DEFAULT 'processing',
      processing_error TEXT NULL,
      is_published BOOLEAN DEFAULT FALSE,
      
      uploaded_by VARCHAR(191) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      processed_at TIMESTAMP NULL,
      deleted_at TIMESTAMP NULL,
      
      INDEX idx_books_status (status),
      INDEX idx_books_published (is_published),
      INDEX idx_books_category (category),
      INDEX idx_books_deleted (deleted_at),
      FOREIGN KEY (uploaded_by) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  await connection.query(`
    CREATE TABLE IF NOT EXISTS book_pages (
      id VARCHAR(36) PRIMARY KEY,
      book_id VARCHAR(36) NOT NULL,
      page_number INT NOT NULL,
      image_path VARCHAR(500) NOT NULL,
      width INT NULL,
      height INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      UNIQUE KEY uk_book_page (book_id, page_number),
      INDEX idx_book_pages_book_id (book_id),
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  await connection.query(`
    CREATE TABLE IF NOT EXISTS book_access (
      id VARCHAR(36) PRIMARY KEY,
      book_id VARCHAR(36) NOT NULL,
      
      user_id VARCHAR(191) NULL,
      group_id VARCHAR(191) NULL,
      course_id VARCHAR(191) NULL,
      role_name VARCHAR(50) NULL,
      
      expires_at TIMESTAMP NULL,
      
      granted_by VARCHAR(191) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      INDEX idx_book_access_book_id (book_id),
      INDEX idx_book_access_user_id (user_id),
      INDEX idx_book_access_group_id (group_id),
      INDEX idx_book_access_course_id (course_id),
      INDEX idx_book_access_expires (expires_at),
      
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (granted_by) REFERENCES users(id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  await connection.query(`
    CREATE TABLE IF NOT EXISTS book_reading_sessions (
      id VARCHAR(36) PRIMARY KEY,
      book_id VARCHAR(36) NOT NULL,
      user_id VARCHAR(191) NOT NULL,
      
      session_token VARCHAR(64) NOT NULL UNIQUE,
      current_page INT DEFAULT 1,
      
      ip_address VARCHAR(45) NULL,
      user_agent TEXT NULL,
      
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ended_at TIMESTAMP NULL,
      
      INDEX idx_reading_sessions_book_user (book_id, user_id),
      INDEX idx_reading_sessions_token (session_token),
      INDEX idx_reading_sessions_activity (last_activity_at),
      
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  await connection.query(`
    CREATE TABLE IF NOT EXISTS book_reading_progress (
      id VARCHAR(36) PRIMARY KEY,
      book_id VARCHAR(36) NOT NULL,
      user_id VARCHAR(191) NOT NULL,
      
      last_page INT DEFAULT 1,
      last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      UNIQUE KEY uk_book_user_progress (book_id, user_id),
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log("\u2705 Library System tables created");
}
async function down$d(connection) {
  await connection.query("DROP TABLE IF EXISTS book_reading_progress");
  await connection.query("DROP TABLE IF EXISTS book_reading_sessions");
  await connection.query("DROP TABLE IF EXISTS book_access");
  await connection.query("DROP TABLE IF EXISTS book_pages");
  await connection.query("DROP TABLE IF EXISTS books");
}

const description$c = "AI Certificate Import System";
const up$c = async (connection) => {
  console.log("\u{1F504} Running migration: AI Certificate Import System");
  const [tables] = await connection.query(
    "SHOW TABLES LIKE 'issued_certificates'"
  );
  if (!tables || tables.length === 0) {
    throw new Error(
      "\u274C \u0422\u0430\u0431\u043B\u0438\u0446\u0430 issued_certificates \u043D\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442! \u0417\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u0435 \u0431\u0430\u0437\u043E\u0432\u0443\u044E \u043C\u0438\u0433\u0440\u0430\u0446\u0438\u044E \u0441\u043D\u0430\u0447\u0430\u043B\u0430."
    );
  }
  console.log(
    "\u{1F4DD} \u0414\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043F\u043E\u043B\u0435\u0439 \u0434\u043B\u044F AI-\u0438\u043C\u043F\u043E\u0440\u0442\u0430 \u0432 \u0442\u0430\u0431\u043B\u0438\u0446\u0443 issued_certificates..."
  );
  const [columns] = await connection.query(
    "SHOW COLUMNS FROM issued_certificates LIKE 'ai_extracted_data'"
  );
  if (!columns || columns.length === 0) {
    await connection.query(`
      ALTER TABLE issued_certificates
        -- AI-\u0434\u0430\u043D\u043D\u044B\u0435
        ADD COLUMN ai_extracted_data JSON NULL COMMENT '\u0414\u0430\u043D\u043D\u044B\u0435, \u0438\u0437\u0432\u043B\u0435\u0447\u0451\u043D\u043D\u044B\u0435 AI \u0438\u0437 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430',
        ADD COLUMN ai_confidence DECIMAL(3,2) NULL COMMENT '\u0423\u0440\u043E\u0432\u0435\u043D\u044C \u0443\u0432\u0435\u0440\u0435\u043D\u043D\u043E\u0441\u0442\u0438 AI (0.00-1.00)',
        ADD COLUMN ai_processing_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT NULL COMMENT '\u0421\u0442\u0430\u0442\u0443\u0441 AI-\u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438',
        ADD COLUMN ai_processing_error TEXT NULL COMMENT '\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 AI-\u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0435',
        
        -- \u041C\u0435\u0442\u0430\u0434\u0430\u043D\u043D\u044B\u0435 \u0438\u043C\u043F\u043E\u0440\u0442\u0430
        ADD COLUMN import_source ENUM('manual', 'ai_scan', 'excel', 'group_journal') DEFAULT 'group_journal' COMMENT '\u0418\u0441\u0442\u043E\u0447\u043D\u0438\u043A \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430',
        ADD COLUMN original_file_url VARCHAR(500) NULL COMMENT 'URL \u043E\u0440\u0438\u0433\u0438\u043D\u0430\u043B\u044C\u043D\u043E\u0433\u043E \u043E\u0442\u0441\u043A\u0430\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u043E\u0433\u043E \u0444\u0430\u0439\u043B\u0430',
        
        -- \u0414\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0435 \u043F\u043E\u043B\u044F \u0438\u0437 AI-Certificate
        ADD COLUMN course_hours_ai INT NULL COMMENT '\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u0447\u0430\u0441\u043E\u0432 \u043A\u0443\u0440\u0441\u0430 (\u0438\u0437 AI)',
        ADD COLUMN issuing_organization VARCHAR(300) NULL COMMENT '\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F, \u0432\u044B\u0434\u0430\u0432\u0448\u0430\u044F \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442',
        
        -- \u0418\u043D\u0434\u0435\u043A\u0441\u044B
        ADD INDEX idx_import_source (import_source),
        ADD INDEX idx_ai_processing_status (ai_processing_status),
        ADD INDEX idx_ai_confidence (ai_confidence)
    `);
    console.log("\u2705 \u041F\u043E\u043B\u044F AI-\u0438\u043C\u043F\u043E\u0440\u0442\u0430 \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u044B \u0432 issued_certificates");
  } else {
    console.log(
      "\u26A0\uFE0F  \u041F\u043E\u043B\u044F AI-\u0438\u043C\u043F\u043E\u0440\u0442\u0430 \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u044E\u0442 \u0432 issued_certificates, \u043F\u0440\u043E\u043F\u0443\u0441\u043A\u0430\u0435\u043C"
    );
  }
  console.log("\u{1F4DD} \u0421\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u0442\u0430\u0431\u043B\u0438\u0446\u044B ai_certificate_processing_logs...");
  await connection.query(`
    CREATE TABLE IF NOT EXISTS ai_certificate_processing_logs (
      id VARCHAR(191) PRIMARY KEY,
      certificate_id VARCHAR(191) NULL COMMENT 'ID \u0441\u043E\u0437\u0434\u0430\u043D\u043D\u043E\u0433\u043E \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430 (\u0435\u0441\u043B\u0438 \u0443\u0441\u043F\u0435\u0448\u043D\u043E)',
      original_filename VARCHAR(255) NOT NULL,
      file_size_bytes INT NOT NULL,
      processing_started_at DATETIME(3) NOT NULL,
      processing_completed_at DATETIME(3) NULL,
      processing_duration_ms INT NULL,
      
      -- AI-\u0434\u0430\u043D\u043D\u044B\u0435
      ai_model VARCHAR(50) NOT NULL COMMENT '\u041C\u043E\u0434\u0435\u043B\u044C AI (gpt-4o, gpt-3.5-turbo)',
      ai_tokens_used INT NULL,
      ai_cost_usd DECIMAL(10,6) NULL,
      ai_confidence DECIMAL(3,2) NULL,
      
      -- \u0420\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442
      status ENUM('success', 'failed', 'partial') NOT NULL,
      extracted_data JSON NULL,
      error_message TEXT NULL,
      
      -- \u0421\u043E\u043F\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0441\u043E \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0435\u043C
      matched_student_id VARCHAR(191) NULL,
      match_method ENUM('exact_pinfl', 'exact_name', 'fuzzy_ai', 'manual') NULL,
      match_confidence DECIMAL(3,2) NULL,
      
      -- \u0410\u0443\u0434\u0438\u0442
      processed_by VARCHAR(191) NOT NULL COMMENT 'ID \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0430',
      ip_address VARCHAR(45) NULL,
      
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      
      INDEX idx_certificate_id (certificate_id),
      INDEX idx_status (status),
      INDEX idx_processed_by (processed_by),
      INDEX idx_created_at (created_at),
      INDEX idx_match_method (match_method),
      
      CONSTRAINT fk_ai_logs_certificate
        FOREIGN KEY (certificate_id) REFERENCES issued_certificates(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_ai_logs_student
        FOREIGN KEY (matched_student_id) REFERENCES students(id)
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_ai_logs_user
        FOREIGN KEY (processed_by) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("\u2705 \u0422\u0430\u0431\u043B\u0438\u0446\u0430 ai_certificate_processing_logs \u0441\u043E\u0437\u0434\u0430\u043D\u0430");
  console.log("\u2705 Migration completed successfully");
};
const down$c = async (connection) => {
  console.log("\u{1F504} Rolling back migration: AI Certificate Import System");
  console.log("\u{1F4DD} \u0423\u0434\u0430\u043B\u0435\u043D\u0438\u0435 \u0442\u0430\u0431\u043B\u0438\u0446\u044B ai_certificate_processing_logs...");
  await connection.query(`DROP TABLE IF EXISTS ai_certificate_processing_logs`);
  console.log("\u2705 \u0422\u0430\u0431\u043B\u0438\u0446\u0430 ai_certificate_processing_logs \u0443\u0434\u0430\u043B\u0435\u043D\u0430");
  console.log("\u{1F4DD} \u0423\u0434\u0430\u043B\u0435\u043D\u0438\u0435 \u043F\u043E\u043B\u0435\u0439 AI-\u0438\u043C\u043F\u043E\u0440\u0442\u0430 \u0438\u0437 issued_certificates...");
  const [columns] = await connection.query(
    "SHOW COLUMNS FROM issued_certificates LIKE 'ai_extracted_data'"
  );
  if (columns && columns.length > 0) {
    await connection.query(`
      ALTER TABLE issued_certificates
        DROP INDEX IF EXISTS idx_import_source,
        DROP INDEX IF EXISTS idx_ai_processing_status,
        DROP INDEX IF EXISTS idx_ai_confidence
    `);
    await connection.query(`
      ALTER TABLE issued_certificates
        DROP COLUMN IF EXISTS ai_extracted_data,
        DROP COLUMN IF EXISTS ai_confidence,
        DROP COLUMN IF EXISTS ai_processing_status,
        DROP COLUMN IF EXISTS ai_processing_error,
        DROP COLUMN IF EXISTS import_source,
        DROP COLUMN IF EXISTS original_file_url,
        DROP COLUMN IF EXISTS course_hours_ai,
        DROP COLUMN IF EXISTS issuing_organization
    `);
    console.log("\u2705 \u041F\u043E\u043B\u044F AI-\u0438\u043C\u043F\u043E\u0440\u0442\u0430 \u0443\u0434\u0430\u043B\u0435\u043D\u044B \u0438\u0437 issued_certificates");
  } else {
    console.log("\u26A0\uFE0F  \u041F\u043E\u043B\u044F AI-\u0438\u043C\u043F\u043E\u0440\u0442\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B \u0432 issued_certificates");
  }
  console.log("\u2705 Rollback completed successfully");
};

const description$b = "Add missing columns to issued_certificates";
const up$b = async (connection) => {
  console.log("\u{1F504} Running migration: Fix Issued Certificates Schema");
  const columnExists = async (columnName) => {
    const [columns] = await connection.query(
      `SHOW COLUMNS FROM issued_certificates LIKE '${columnName}'`
    );
    return columns && columns.length > 0;
  };
  const columnsToAdd = [];
  if (!await columnExists("issued_by")) {
    columnsToAdd.push(
      "ADD COLUMN issued_by VARCHAR(191) NULL COMMENT 'User ID who issued the certificate'"
    );
    columnsToAdd.push(
      "ADD CONSTRAINT fk_issued_cert_issuer FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE"
    );
  }
  if (!await columnExists("issued_at")) {
    columnsToAdd.push("ADD COLUMN issued_at DATETIME(3) NULL");
  }
  if (!await columnExists("revoked_by")) {
    columnsToAdd.push(
      "ADD COLUMN revoked_by VARCHAR(191) NULL COMMENT 'User ID who revoked the certificate'"
    );
    columnsToAdd.push(
      "ADD CONSTRAINT fk_issued_cert_revoker FOREIGN KEY (revoked_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE"
    );
  }
  if (!await columnExists("revoked_at")) {
    columnsToAdd.push("ADD COLUMN revoked_at DATETIME(3) NULL");
  }
  if (!await columnExists("revoke_reason")) {
    columnsToAdd.push("ADD COLUMN revoke_reason TEXT NULL");
  }
  if (!await columnExists("notes")) {
    columnsToAdd.push("ADD COLUMN notes TEXT NULL");
  }
  if (!await columnExists("warnings")) {
    columnsToAdd.push("ADD COLUMN warnings JSON NULL");
  }
  if (columnsToAdd.length > 0) {
    const queryParts = [];
    if (!await columnExists("issued_by"))
      queryParts.push(
        "ADD COLUMN issued_by VARCHAR(191) NULL COMMENT 'User ID who issued the certificate'"
      );
    if (!await columnExists("issued_at"))
      queryParts.push("ADD COLUMN issued_at DATETIME(3) NULL");
    if (!await columnExists("revoked_by"))
      queryParts.push(
        "ADD COLUMN revoked_by VARCHAR(191) NULL COMMENT 'User ID who revoked the certificate'"
      );
    if (!await columnExists("revoked_at"))
      queryParts.push("ADD COLUMN revoked_at DATETIME(3) NULL");
    if (!await columnExists("revoke_reason"))
      queryParts.push("ADD COLUMN revoke_reason TEXT NULL");
    if (!await columnExists("notes"))
      queryParts.push("ADD COLUMN notes TEXT NULL");
    if (!await columnExists("warnings"))
      queryParts.push("ADD COLUMN warnings JSON NULL");
    if (queryParts.length > 0) {
      await connection.query(
        `ALTER TABLE issued_certificates ${queryParts.join(", ")}`
      );
      console.log("\u2705 Added missing columns");
    }
    if (!await columnExists("issued_by")) ;
  }
  if (!await columnExists("issued_by")) {
    await connection.query(
      "ALTER TABLE issued_certificates ADD COLUMN issued_by VARCHAR(191) NULL"
    );
    await connection.query(
      "ALTER TABLE issued_certificates ADD CONSTRAINT fk_issued_cert_issuer FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE"
    );
    console.log("\u2705 Added issued_by");
  }
  if (!await columnExists("issued_at")) {
    await connection.query(
      "ALTER TABLE issued_certificates ADD COLUMN issued_at DATETIME(3) NULL"
    );
    console.log("\u2705 Added issued_at");
  }
  if (!await columnExists("revoked_by")) {
    await connection.query(
      "ALTER TABLE issued_certificates ADD COLUMN revoked_by VARCHAR(191) NULL"
    );
    await connection.query(
      "ALTER TABLE issued_certificates ADD CONSTRAINT fk_issued_cert_revoker FOREIGN KEY (revoked_by) REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE"
    );
    console.log("\u2705 Added revoked_by");
  }
  if (!await columnExists("revoked_at")) {
    await connection.query(
      "ALTER TABLE issued_certificates ADD COLUMN revoked_at DATETIME(3) NULL"
    );
    console.log("\u2705 Added revoked_at");
  }
  if (!await columnExists("revoke_reason")) {
    await connection.query(
      "ALTER TABLE issued_certificates ADD COLUMN revoke_reason TEXT NULL"
    );
    console.log("\u2705 Added revoke_reason");
  }
  if (!await columnExists("notes")) {
    await connection.query(
      "ALTER TABLE issued_certificates ADD COLUMN notes TEXT NULL"
    );
    console.log("\u2705 Added notes");
  }
  if (!await columnExists("warnings")) {
    await connection.query(
      "ALTER TABLE issued_certificates ADD COLUMN warnings JSON NULL"
    );
    console.log("\u2705 Added warnings");
  }
  if (!await columnExists("docx_file_url")) {
    await connection.query(
      "ALTER TABLE issued_certificates ADD COLUMN docx_file_url VARCHAR(500) NULL"
    );
    console.log("\u2705 Added docx_file_url");
  }
  console.log("\u2705 Migration completed");
};
const down$b = async (connection) => {
  console.log("\u{1F504} Rolling back: Fix Issued Certificates Schema");
  try {
    await connection.query(
      "ALTER TABLE issued_certificates DROP FOREIGN KEY fk_issued_cert_issuer"
    );
  } catch (e) {
  }
  try {
    await connection.query(
      "ALTER TABLE issued_certificates DROP FOREIGN KEY fk_issued_cert_revoker"
    );
  } catch (e) {
  }
  const columns = [
    "issued_by",
    "issued_at",
    "revoked_by",
    "revoked_at",
    "revoke_reason",
    "notes",
    "warnings",
    "docx_file_url"
  ];
  await connection.query(
    `ALTER TABLE issued_certificates DROP COLUMN ${columns.join(", DROP COLUMN ")}`
  );
  console.log("\u2705 Rollback completed");
};

const description$a = "Add docx_file_url column";
const up$a = async (connection) => {
  console.log("\u{1F504} Running migration: Add docx_file_url column");
  const [columns] = await connection.query(
    "SHOW COLUMNS FROM issued_certificates LIKE 'docx_file_url'"
  );
  if (!columns || columns.length === 0) {
    await connection.query(
      "ALTER TABLE issued_certificates ADD COLUMN docx_file_url VARCHAR(500) NULL COMMENT 'URL to the generated DOCX file'"
    );
    console.log("\u2705 Added docx_file_url column");
  } else {
    console.log("\u26A0\uFE0F docx_file_url column already exists");
  }
};
const down$a = async (connection) => {
  console.log("\u{1F504} Rolling back: Add docx_file_url column");
  try {
    const [columns] = await connection.query(
      "SHOW COLUMNS FROM issued_certificates LIKE 'docx_file_url'"
    );
    if (columns && columns.length > 0) {
      await connection.query(
        "ALTER TABLE issued_certificates DROP COLUMN docx_file_url"
      );
      console.log("\u2705 Dropped docx_file_url column");
    }
  } catch (error) {
    console.error("\u26A0\uFE0F Failed to drop docx_file_url: " + error.message);
  }
};

const description$9 = "Add user_id column to students table";
const up$9 = async (connection) => {
  console.log("\u{1F504} Adding user_id column to students table...");
  const [columns] = await connection.query(
    `SELECT COLUMN_NAME 
     FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'students' 
     AND COLUMN_NAME = 'user_id'`
  );
  if (columns.length > 0) {
    console.log("\u26A0\uFE0F  Column user_id already exists, skipping...");
    return;
  }
  await connection.query(`
    ALTER TABLE students
    ADD COLUMN user_id VARCHAR(191) NULL COMMENT 'Link to user account' AFTER position,
    ADD INDEX idx_user_id (user_id),
    ADD CONSTRAINT fk_students_user 
      FOREIGN KEY (user_id) 
      REFERENCES users(id) 
      ON DELETE SET NULL 
      ON UPDATE CASCADE
  `);
  console.log("\u2705 Column user_id added to students table");
  console.log("\u{1F504} Syncing existing user-student relationships...");
  await connection.query(`
    UPDATE students s
    INNER JOIN users u ON u.student_id = s.id
    SET s.user_id = u.id
    WHERE s.user_id IS NULL
  `);
  console.log("\u2705 Existing relationships synced");
};
const down$9 = async (connection) => {
  console.log("\u{1F504} Removing user_id column from students table...");
  const [columns] = await connection.query(
    `SELECT COLUMN_NAME 
     FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME = 'students' 
     AND COLUMN_NAME = 'user_id'`
  );
  if (columns.length === 0) {
    console.log("\u26A0\uFE0F  Column user_id does not exist, skipping...");
    return;
  }
  await connection.query(`
    ALTER TABLE students
    DROP FOREIGN KEY fk_students_user,
    DROP INDEX idx_user_id,
    DROP COLUMN user_id
  `);
  console.log("\u2705 Column user_id removed from students table");
};

const description$8 = "AI Settings System - \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u043F\u0440\u043E\u0432\u0430\u0439\u0434\u0435\u0440\u043E\u0432, \u043B\u0438\u043C\u0438\u0442\u044B \u0442\u043E\u043A\u0435\u043D\u043E\u0432, \u043B\u043E\u0433\u0438 \u043E\u0448\u0438\u0431\u043E\u043A";
const up$8 = async (connection) => {
  console.log("\u{1F504} Running migration: AI Settings System");
  await connection.query(`
    CREATE TABLE IF NOT EXISTS ai_settings (
      id VARCHAR(36) PRIMARY KEY,
      
      -- \u041E\u0441\u043D\u043E\u0432\u043D\u044B\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u043F\u0440\u043E\u0432\u0430\u0439\u0434\u0435\u0440\u0430
      provider ENUM('openai', 'openrouter', 'anthropic', 'custom') NOT NULL DEFAULT 'openrouter',
      api_key_encrypted VARCHAR(500) NOT NULL,
      api_key_last_four VARCHAR(4) NULL,
      api_key_name VARCHAR(100) NULL,
      base_url VARCHAR(500) NULL,
      
      -- \u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u043C\u043E\u0434\u0435\u043B\u0435\u0439
      vision_model VARCHAR(100) NOT NULL DEFAULT 'openai/gpt-4o',
      text_model VARCHAR(100) NOT NULL DEFAULT 'openai/gpt-3.5-turbo',
      
      -- \u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B \u0437\u0430\u043F\u0440\u043E\u0441\u043E\u0432
      max_tokens INT NOT NULL DEFAULT 1500,
      temperature DECIMAL(3,2) NOT NULL DEFAULT 0.10,
      
      -- \u041B\u0438\u043C\u0438\u0442\u044B \u0438 \u0431\u044E\u0434\u0436\u0435\u0442
      monthly_budget_usd DECIMAL(10,2) NULL,
      daily_budget_usd DECIMAL(10,2) NULL,
      max_tokens_per_request INT NOT NULL DEFAULT 4000,
      max_requests_per_day INT NULL,
      
      -- \u0421\u0442\u0430\u0442\u0443\u0441 \u0438 \u043C\u0435\u0442\u0430\u0434\u0430\u043D\u043D\u044B\u0435
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      is_default BOOLEAN NOT NULL DEFAULT FALSE,
      last_used_at DATETIME NULL,
      last_error_at DATETIME NULL,
      last_error_message TEXT NULL,
      
      -- \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u0435 \u0442\u043E\u043A\u0435\u043D\u043E\u0432 (\u043D\u0430\u043A\u043E\u043F\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0435 \u0441\u0447\u0435\u0442\u0447\u0438\u043A\u0438)
      total_tokens_used BIGINT NOT NULL DEFAULT 0,
      total_prompt_tokens BIGINT NOT NULL DEFAULT 0,
      total_completion_tokens BIGINT NOT NULL DEFAULT 0,
      total_cost_usd DECIMAL(10,4) NOT NULL DEFAULT 0,
      tokens_used_today BIGINT NOT NULL DEFAULT 0,
      tokens_used_this_month BIGINT NOT NULL DEFAULT 0,
      last_usage_reset_date DATE NULL,
      
      -- \u0410\u0443\u0434\u0438\u0442
      created_by VARCHAR(36) NULL,
      updated_by VARCHAR(36) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      
      -- \u0418\u043D\u0434\u0435\u043A\u0441\u044B
      INDEX idx_provider (provider),
      INDEX idx_is_active (is_active),
      INDEX idx_is_default (is_default),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("\u2705 Created table ai_settings");
  await connection.query(`
    CREATE TABLE IF NOT EXISTS ai_token_usage_history (
      id VARCHAR(36) PRIMARY KEY,
      setting_id VARCHAR(36) NOT NULL,
      
      -- \u0414\u0435\u0442\u0430\u043B\u0438 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u044F
      model VARCHAR(100) NOT NULL,
      operation_type ENUM('vision', 'text', 'embedding', 'other') NOT NULL DEFAULT 'vision',
      prompt_tokens INT NOT NULL DEFAULT 0,
      completion_tokens INT NOT NULL DEFAULT 0,
      total_tokens INT NOT NULL DEFAULT 0,
      cost_usd DECIMAL(10,6) NOT NULL DEFAULT 0,
      
      -- \u041A\u043E\u043D\u0442\u0435\u043A\u0441\u0442 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u044F
      certificate_log_id VARCHAR(36) NULL,
      user_id VARCHAR(36) NULL,
      
      -- \u0421\u0442\u0430\u0442\u0443\u0441
      status ENUM('success', 'failed', 'partial') NOT NULL DEFAULT 'success',
      error_code VARCHAR(50) NULL,
      error_message TEXT NULL,
      
      -- \u0412\u0440\u0435\u043C\u044F
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      
      -- \u0418\u043D\u0434\u0435\u043A\u0441\u044B
      INDEX idx_setting_id (setting_id),
      INDEX idx_created_at (created_at),
      INDEX idx_status (status),
      INDEX idx_operation_type (operation_type),
      
      -- \u0412\u043D\u0435\u0448\u043D\u0438\u0439 \u043A\u043B\u044E\u0447
      FOREIGN KEY (setting_id) REFERENCES ai_settings(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("\u2705 Created table ai_token_usage_history");
  await connection.query(`
    CREATE TABLE IF NOT EXISTS ai_api_errors (
      id VARCHAR(36) PRIMARY KEY,
      setting_id VARCHAR(36) NULL,
      
      -- \u0414\u0435\u0442\u0430\u043B\u0438 \u043E\u0448\u0438\u0431\u043A\u0438
      error_code VARCHAR(50) NOT NULL,
      error_type ENUM('rate_limit', 'insufficient_credits', 'invalid_key', 'model_error', 'network', 'other') NOT NULL,
      error_message TEXT NOT NULL,
      
      -- \u041A\u043E\u043D\u0442\u0435\u043A\u0441\u0442
      model VARCHAR(100) NULL,
      tokens_requested INT NULL,
      tokens_available INT NULL,
      
      -- \u041C\u0435\u0442\u0430\u0434\u0430\u043D\u043D\u044B\u0435
      request_payload JSON NULL,
      response_raw TEXT NULL,
      user_id VARCHAR(36) NULL,
      
      -- \u0412\u0440\u0435\u043C\u044F
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      resolved_at DATETIME NULL,
      
      -- \u0418\u043D\u0434\u0435\u043A\u0441\u044B
      INDEX idx_setting_id (setting_id),
      INDEX idx_error_type (error_type),
      INDEX idx_error_code (error_code),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("\u2705 Created table ai_api_errors");
  console.log("\u2705 Migration completed: AI Settings System");
};
const down$8 = async (connection) => {
  console.log("\u{1F504} Rolling back migration: AI Settings System");
  await connection.query(`DROP TABLE IF EXISTS ai_api_errors`);
  console.log("\u2705 Dropped table ai_api_errors");
  await connection.query(`DROP TABLE IF EXISTS ai_token_usage_history`);
  console.log("\u2705 Dropped table ai_token_usage_history");
  await connection.query(`DROP TABLE IF EXISTS ai_settings`);
  console.log("\u2705 Dropped table ai_settings");
  console.log("\u2705 Rollback completed: AI Settings System");
};

const description$7 = "Add language column to questions table";
const up$7 = async (connection) => {
  console.log("\u{1F504} Running migration: Add language column to questions table");
  try {
    await connection.query(`
      ALTER TABLE questions 
      ADD COLUMN language ENUM('ru', 'uz', 'en') NOT NULL DEFAULT 'ru' 
      AFTER difficulty
    `);
  } catch (error) {
    if (error.errno === 1060) {
      console.log("\u26A0\uFE0F Column language already exists, skipping");
    } else {
      throw error;
    }
  }
  try {
    await connection.query(`
      ALTER TABLE questions 
      ADD INDEX idx_language (language)
    `);
  } catch (error) {
    if (error.errno === 1061) {
      console.log("\u26A0\uFE0F Index idx_language already exists, skipping");
    } else {
      throw error;
    }
  }
  console.log("\u2705 Language column added to questions table");
};
const down$7 = async (connection) => {
  console.log("\u{1F504} Rolling back: Remove language column from questions table");
  await connection.query(`
    ALTER TABLE questions 
    DROP INDEX idx_language
  `);
  await connection.query(`
    ALTER TABLE questions 
    DROP COLUMN language
  `);
  console.log("\u2705 Language column removed from questions table");
};

const description$6 = "Fix AI Logs Foreign Key for Representatives";
const up$6 = async (connection) => {
  console.log("\u{1F504} Running migration: Fix AI Logs Foreign Key");
  try {
    await connection.query(`
      ALTER TABLE ai_certificate_processing_logs
      DROP FOREIGN KEY fk_ai_logs_user
    `);
    console.log("\u2705 \u0412\u043D\u0435\u0448\u043D\u0438\u0439 \u043A\u043B\u044E\u0447 fk_ai_logs_user \u0443\u0434\u0430\u043B\u0435\u043D");
  } catch (error) {
    if (error.code === "ER_CANT_DROP_FIELD_OR_KEY") {
      console.log(
        "\u26A0\uFE0F \u0412\u043D\u0435\u0448\u043D\u0438\u0439 \u043A\u043B\u044E\u0447 fk_ai_logs_user \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D, \u043F\u0440\u043E\u043F\u0443\u0441\u043A\u0430\u0435\u043C \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u0435"
      );
    } else {
      throw error;
    }
  }
  await connection.query(`
    ALTER TABLE ai_certificate_processing_logs
    MODIFY COLUMN processed_by VARCHAR(191) NULL COMMENT 'ID \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0430 \u0438\u043B\u0438 \u043F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u0438\u0442\u0435\u043B\u044F',
    ADD COLUMN representative_id VARCHAR(191) NULL COMMENT 'ID \u043F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u0438\u0442\u0435\u043B\u044F \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438 (\u0435\u0441\u043B\u0438 \u043F\u0440\u0438\u043C\u0435\u043D\u0438\u043C\u043E)',
    ADD INDEX idx_representative_id (representative_id),
    ADD CONSTRAINT fk_ai_logs_representative
      FOREIGN KEY (representative_id) REFERENCES organization_representatives(id)
      ON DELETE SET NULL ON UPDATE CASCADE
  `);
  console.log("\u2705 \u0422\u0430\u0431\u043B\u0438\u0446\u0430 ai_certificate_processing_logs \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0430");
};
const down$6 = async (connection) => {
  console.log("\u{1F504} Rolling back migration: Fix AI Logs Foreign Key");
  await connection.query(`
    ALTER TABLE ai_certificate_processing_logs
    DROP FOREIGN KEY fk_ai_logs_representative,
    DROP COLUMN representative_id
  `);
  try {
    await connection.query(`
      ALTER TABLE ai_certificate_processing_logs
      MODIFY COLUMN processed_by VARCHAR(191) NOT NULL COMMENT 'ID \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0430',
      ADD CONSTRAINT fk_ai_logs_user
        FOREIGN KEY (processed_by) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
    `);
  } catch (e) {
    console.warn(
      "\u26A0\uFE0F \u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C FK fk_ai_logs_user \u043F\u0440\u0438 \u043E\u0442\u043A\u0430\u0442\u0435 (\u0432\u043E\u0437\u043C\u043E\u0436\u043D\u043E \u0435\u0441\u0442\u044C \u043D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435):",
      e
    );
  }
};

const description$5 = "Add missing columns to certificate_templates";
const up$5 = async (connection) => {
  console.log("\u{1F504} Adding missing columns to certificate_templates...");
  const columnsToAdd = [
    {
      name: "original_file_url",
      definition: "VARCHAR(500) NULL COMMENT 'URL \u043E\u0440\u0438\u0433\u0438\u043D\u0430\u043B\u044C\u043D\u043E\u0433\u043E \u0444\u0430\u0439\u043B\u0430 \u0448\u0430\u0431\u043B\u043E\u043D\u0430 (DOCX)' AFTER template_file_url"
    },
    {
      name: "variables",
      definition: "JSON NULL COMMENT '\u041F\u0435\u0440\u0435\u043C\u0435\u043D\u043D\u044B\u0435 \u0434\u043B\u044F \u043F\u043E\u0434\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0438 \u0432 \u0448\u0430\u0431\u043B\u043E\u043D' AFTER original_file_url"
    },
    {
      name: "qr_settings",
      definition: "JSON NULL COMMENT '\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 QR-\u043A\u043E\u0434\u0430' AFTER variables"
    },
    {
      name: "number_format",
      definition: "VARCHAR(100) NOT NULL DEFAULT 'ATC{YY}_{CODE}_{NUM}' COMMENT '\u0424\u043E\u0440\u043C\u0430\u0442 \u043D\u043E\u043C\u0435\u0440\u0430 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430' AFTER qr_settings"
    },
    {
      name: "last_number",
      definition: "INT NOT NULL DEFAULT 0 COMMENT '\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0439 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u043D\u044B\u0439 \u043D\u043E\u043C\u0435\u0440' AFTER number_format"
    },
    {
      name: "template_data",
      definition: "JSON NULL COMMENT '\u0414\u0430\u043D\u043D\u044B\u0435 \u0432\u0438\u0437\u0443\u0430\u043B\u044C\u043D\u043E\u0433\u043E \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440\u0430' AFTER last_number"
    },
    {
      name: "layout",
      definition: "ENUM('A4_portrait', 'A4_landscape', 'letter_portrait', 'letter_landscape') NULL COMMENT '\u0424\u043E\u0440\u043C\u0430\u0442 \u0438 \u043E\u0440\u0438\u0435\u043D\u0442\u0430\u0446\u0438\u044F' AFTER template_data"
    },
    {
      name: "background_url",
      definition: "VARCHAR(500) NULL COMMENT 'URL \u0444\u043E\u043D\u043E\u0432\u043E\u0433\u043E \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F' AFTER layout"
    }
  ];
  for (const column of columnsToAdd) {
    const [existing] = await connection.query(
      `SHOW COLUMNS FROM certificate_templates LIKE ?`,
      [column.name]
    );
    if (!existing || existing.length === 0) {
      await connection.query(`
        ALTER TABLE certificate_templates
        ADD COLUMN ${column.name} ${column.definition}
      `);
      console.log(`\u2705 Column '${column.name}' added`);
    } else {
      console.log(`\u2139\uFE0F  Column '${column.name}' already exists`);
    }
  }
  console.log("\u2705 Migration completed successfully");
};
const down$5 = async (connection) => {
  console.log("\u{1F504} Removing added columns from certificate_templates...");
  const columnsToRemove = [
    "background_url",
    "layout",
    "template_data",
    "last_number",
    "number_format",
    "qr_settings",
    "variables",
    "original_file_url"
  ];
  for (const columnName of columnsToRemove) {
    const [existing] = await connection.query(
      `SHOW COLUMNS FROM certificate_templates LIKE ?`,
      [columnName]
    );
    if (existing && existing.length > 0) {
      await connection.query(`
        ALTER TABLE certificate_templates
        DROP COLUMN ${columnName}
      `);
      console.log(`\u2705 Column '${columnName}' removed`);
    }
  }
  console.log("\u2705 Rollback completed successfully");
};

const description$4 = "Add missing columns to certificate_templates (part 2)";
const up$4 = async (connection) => {
  console.log("\u{1F504} Adding missing columns to certificate_templates...");
  const columnsToAdd = [
    {
      name: "original_file_url",
      definition: "VARCHAR(500) NULL COMMENT 'Original template file URL (DOCX)'"
    },
    {
      name: "variables",
      definition: "JSON NULL COMMENT 'Variables for template substitution'"
    },
    {
      name: "qr_settings",
      definition: "JSON NULL COMMENT 'QR code settings'"
    },
    {
      name: "number_format",
      definition: "VARCHAR(100) NOT NULL DEFAULT 'ATC{YY}_{CODE}_{NUM}' COMMENT 'Certificate number format'"
    },
    {
      name: "last_number",
      definition: "INT NOT NULL DEFAULT 0 COMMENT 'Last used number'"
    },
    {
      name: "template_data",
      definition: "JSON NULL COMMENT 'Visual editor data'"
    },
    {
      name: "layout",
      definition: "ENUM('A4_portrait', 'A4_landscape', 'letter_portrait', 'letter_landscape') NULL COMMENT 'Layout format and orientation'"
    },
    {
      name: "background_url",
      definition: "VARCHAR(500) NULL COMMENT 'Background image URL'"
    }
  ];
  for (const column of columnsToAdd) {
    const [existing] = await connection.query(
      `SHOW COLUMNS FROM certificate_templates LIKE ?`,
      [column.name]
    );
    if (!existing || existing.length === 0) {
      try {
        await connection.query(`
          ALTER TABLE certificate_templates
          ADD COLUMN ${column.name} ${column.definition}
        `);
        console.log(`\u2705 Column '${column.name}' added`);
      } catch (err) {
        if (err.code !== "ER_DUP_FIELDNAME") {
          throw err;
        }
        console.log(
          `\u2139\uFE0F  Column '${column.name}' already exists (concurrent add)`
        );
      }
    } else {
      console.log(`\u2139\uFE0F  Column '${column.name}' already exists`);
    }
  }
  console.log("\u2705 Migration completed successfully");
};
const down$4 = async (connection) => {
  console.log("\u{1F504} Removing added columns from certificate_templates...");
  const columnsToRemove = [
    "background_url",
    "layout",
    "template_data",
    "last_number",
    "number_format",
    "qr_settings",
    "variables",
    "original_file_url"
  ];
  for (const columnName of columnsToRemove) {
    const [existing] = await connection.query(
      `SHOW COLUMNS FROM certificate_templates LIKE ?`,
      [columnName]
    );
    if (existing && existing.length > 0) {
      await connection.query(`
        ALTER TABLE certificate_templates
        DROP COLUMN ${columnName}
      `);
      console.log(`\u2705 Column '${columnName}' removed`);
    }
  }
  console.log("\u2705 Rollback completed successfully");
};

const description$3 = "Add user_id column to instructors table";
const up$3 = async (connection) => {
  console.log("\u{1F504} Adding user_id column to instructors table...");
  const [columns] = await connection.query(
    `SELECT COLUMN_NAME 
     FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() 
       AND TABLE_NAME = 'instructors' 
       AND COLUMN_NAME = 'user_id'`
  );
  if (columns.length > 0) {
    console.log("\u26A0\uFE0F  Column user_id already exists in instructors table");
    return;
  }
  await connection.query(`
    ALTER TABLE instructors
    ADD COLUMN user_id VARCHAR(191) NULL COMMENT 'Link to user account for authentication'
    AFTER is_active
  `);
  console.log("\u2705 Column user_id added to instructors table");
  await connection.query(`
    ALTER TABLE instructors
    ADD INDEX idx_user_id (user_id)
  `);
  console.log("\u2705 Index idx_user_id added");
  await connection.query(`
    ALTER TABLE instructors
    ADD CONSTRAINT fk_instructors_user 
    FOREIGN KEY (user_id) REFERENCES users(id) 
    ON DELETE SET NULL 
    ON UPDATE CASCADE
  `);
  console.log("\u2705 Foreign key constraint fk_instructors_user added");
};
const down$3 = async (connection) => {
  console.log("\u{1F504} Removing user_id column from instructors table...");
  await connection.query(`
    ALTER TABLE instructors
    DROP FOREIGN KEY fk_instructors_user
  `);
  console.log("\u2705 Foreign key constraint fk_instructors_user dropped");
  await connection.query(`
    ALTER TABLE instructors
    DROP INDEX idx_user_id
  `);
  console.log("\u2705 Index idx_user_id dropped");
  await connection.query(`
    ALTER TABLE instructors
    DROP COLUMN user_id
  `);
  console.log("\u2705 Column user_id removed from instructors table");
};

const description$2 = "\u0414\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0442\u0440\u0435\u0445\u044A\u044F\u0437\u044B\u0447\u043D\u044B\u0445 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0439 \u0434\u043B\u044F \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0439 \u0438 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u0435 \u043A\u0440\u0430\u0442\u043A\u043E\u0433\u043E \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044F";
async function up$2(connection) {
  await connection.query(`
    ALTER TABLE organizations
    ADD COLUMN name_uz VARCHAR(255) NULL AFTER name,
    ADD COLUMN name_en VARCHAR(255) NULL AFTER name_uz,
    ADD COLUMN name_ru VARCHAR(255) NULL AFTER name_en;
  `);
  await connection.query(`
    UPDATE organizations SET name_ru = name WHERE name IS NOT NULL;
  `);
  await connection.query(`
    ALTER TABLE organizations DROP COLUMN short_name;
  `);
}
async function down$2(connection) {
  await connection.query(`
    ALTER TABLE organizations ADD COLUMN short_name VARCHAR(100) NULL AFTER name;
  `);
  await connection.query(`
    ALTER TABLE organizations
    DROP COLUMN name_uz,
    DROP COLUMN name_en,
    DROP COLUMN name_ru;
  `);
}

const description$1 = "Add certificate_validity_months column to courses table";
const up$1 = async (connection) => {
  console.log(
    "\u{1F504} Running Migration: Add certificate_validity_months to courses..."
  );
  await connection.query(`
    ALTER TABLE courses
    ADD COLUMN certificate_validity_months INT NULL COMMENT 'Validity period in months, null for permanent'
    AFTER certificate_template_id
  `);
  console.log(
    '\u2705 Added column "certificate_validity_months" to "courses" table'
  );
};
const down$1 = async (connection) => {
  console.log(
    "\u{1F504} Rolling back Migration: Remove certificate_validity_months from courses..."
  );
  await connection.query(`
    ALTER TABLE courses
    DROP COLUMN certificate_validity_months
  `);
  console.log(
    '\u2705 Removed column "certificate_validity_months" from "courses" table'
  );
};

const description = "Face Recognition System";
const up = async (connection) => {
  console.log("\u{1F504} Running migration: Face Recognition System");
  await connection.query(`
    CREATE TABLE IF NOT EXISTS student_face_embeddings (
      id VARCHAR(191) PRIMARY KEY,
      student_id VARCHAR(191) NOT NULL,
      
      -- \u0412\u0435\u043A\u0442\u043E\u0440\u043D\u043E\u0435 \u043F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043B\u0438\u0446\u0430 (512 float32 = 2048 bytes)
      embedding BLOB NOT NULL COMMENT 'Face embedding vector (512 dimensions)',
      
      -- \u041C\u0435\u0442\u0430\u0434\u0430\u043D\u043D\u044B\u0435 \u043C\u043E\u0434\u0435\u043B\u0438
      embedding_model VARCHAR(50) NOT NULL DEFAULT 'face_recognition' COMMENT 'Model name: face_recognition, facenet, arcface',
      embedding_version VARCHAR(20) DEFAULT '1.0' COMMENT 'Model version for compatibility',
      
      -- \u041A\u0430\u0447\u0435\u0441\u0442\u0432\u043E \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438
      quality_score FLOAT DEFAULT NULL COMMENT 'Image quality score (0-1)',
      face_size_pixels INT DEFAULT NULL COMMENT 'Face size in original image',
      brightness_level FLOAT DEFAULT NULL COMMENT 'Lighting conditions',
      
      -- \u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0441\u0442\u044C\u044E
      is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Active embedding for recognition',
      
      -- \u0414\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u0430\u044F \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F
      captured_at DATETIME(3) NOT NULL COMMENT 'When the face was registered',
      registered_by VARCHAR(191) NULL COMMENT 'User who registered this face',
      notes TEXT NULL COMMENT 'Additional notes',
      
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_student_id (student_id),
      INDEX idx_active (is_active),
      INDEX idx_student_active (student_id, is_active),
      INDEX idx_model (embedding_model),
      INDEX idx_captured_at (captured_at),
      
      CONSTRAINT fk_face_student 
        FOREIGN KEY (student_id) REFERENCES students(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_face_registered_by 
        FOREIGN KEY (registered_by) REFERENCES users(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('\u2705 Table "student_face_embeddings" created');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS face_recognition_logs (
      id VARCHAR(191) PRIMARY KEY,
      
      -- \u0421\u0432\u044F\u0437\u0438
      student_id VARCHAR(191) NULL COMMENT 'NULL if face not recognized',
      schedule_event_id VARCHAR(191) NULL COMMENT 'Related schedule event',
      
      -- \u0420\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u044B \u0440\u0430\u0441\u043F\u043E\u0437\u043D\u0430\u0432\u0430\u043D\u0438\u044F
      recognition_confidence FLOAT NULL COMMENT 'Confidence score (0-1)',
      distance FLOAT NULL COMMENT 'Face distance metric',
      status ENUM('success', 'failed', 'unknown_face', 'multiple_faces', 'no_face') NOT NULL,
      
      -- \u0418\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044F \u043E \u043A\u0430\u0434\u0440\u0435
      captured_image_path VARCHAR(500) NULL COMMENT 'Path to saved frame',
      image_width INT NULL,
      image_height INT NULL,
      face_location JSON NULL COMMENT 'Face bounding box coordinates',
      
      -- \u0414\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u0430\u044F \u0434\u0438\u0430\u0433\u043D\u043E\u0441\u0442\u0438\u043A\u0430
      processing_time_ms INT NULL COMMENT 'Recognition processing time',
      total_embeddings_compared INT NULL COMMENT 'Number of embeddings compared',
      error_message TEXT NULL COMMENT 'Error details if failed',
      
      recognized_at DATETIME(3) NOT NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      
      INDEX idx_student (student_id),
      INDEX idx_event (schedule_event_id),
      INDEX idx_status (status),
      INDEX idx_recognized_at (recognized_at),
      INDEX idx_event_date (schedule_event_id, recognized_at),
      
      CONSTRAINT fk_fr_student 
        FOREIGN KEY (student_id) REFERENCES students(id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_fr_event 
        FOREIGN KEY (schedule_event_id) REFERENCES schedule_events(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('\u2705 Table "face_recognition_logs" created');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS face_recognition_settings (
      id INT PRIMARY KEY AUTO_INCREMENT,
      setting_key VARCHAR(100) NOT NULL UNIQUE,
      setting_value VARCHAR(500) NOT NULL,
      description TEXT,
      updated_by VARCHAR(191) NULL,
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      CONSTRAINT fk_frs_updated_by 
        FOREIGN KEY (updated_by) REFERENCES users(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('\u2705 Table "face_recognition_settings" created');
  await connection.query(`
    INSERT INTO face_recognition_settings (setting_key, setting_value, description) VALUES
    ('RECOGNITION_THRESHOLD', '0.6', 'Minimum confidence for face recognition (0-1)'),
    ('MAX_FACE_DISTANCE', '0.4', 'Maximum distance for face_recognition library'),
    ('MIN_QUALITY_SCORE', '0.5', 'Minimum quality score for registration'),
    ('AUTO_MARK_ATTENDANCE', 'true', 'Automatically mark attendance on recognition'),
    ('SAVE_RECOGNITION_IMAGES', 'true', 'Save captured frames for audit'),
    ('IMAGE_RETENTION_DAYS', '7', 'Days to keep recognition images'),
    ('LOG_RETENTION_DAYS', '30', 'Days to keep recognition logs'),
    ('ALLOW_MULTIPLE_EMBEDDINGS', 'false', 'Allow multiple active embeddings per student'),
    ('REQUIRE_MANUAL_APPROVAL', 'false', 'Require manual approval for new registrations')
    ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)
  `);
  console.log("\u2705 Default settings inserted");
  console.log("\u2705 Face Recognition System migration completed");
};
const down = async (connection) => {
  console.log("\u{1F504} Rolling back Face Recognition System migration");
  await connection.query("SET FOREIGN_KEY_CHECKS = 0");
  await connection.query("DROP TABLE IF EXISTS face_recognition_logs");
  console.log('\u{1F5D1}\uFE0F  Dropped table "face_recognition_logs"');
  await connection.query("DROP TABLE IF EXISTS student_face_embeddings");
  console.log('\u{1F5D1}\uFE0F  Dropped table "student_face_embeddings"');
  await connection.query("DROP TABLE IF EXISTS face_recognition_settings");
  console.log('\u{1F5D1}\uFE0F  Dropped table "face_recognition_settings"');
  await connection.query("SET FOREIGN_KEY_CHECKS = 1");
  console.log("\u2705 Face Recognition System migration rolled back");
};

const MIGRATIONS_REGISTRY = [
  // ============================================================
  // Миграция 001: Начальная консолидированная схема
  // Объединяет все core-модули и базовую структуру
  // ============================================================
  {
    name: "20251224_001_initial_schema",
    up: up$i,
    down: down$i,
    description: description$i
  },
  // ============================================================
  // Миграция 002: Система тестирования
  // ============================================================
  {
    name: "20260104_002_testing_system",
    up: up$h,
    down: down$h,
    description: description$h
  },
  // ============================================================
  // Миграция 003: Система посещаемости (отметки, триггеры)
  // ============================================================
  {
    name: "20260109_003_attendance_system",
    up: up$g,
    down: down$g,
    description: description$g
  },
  // ============================================================
  // Миграция 004: Портал студента (Настройки, Поддержка, Уведомления)
  // ============================================================
  {
    name: "20260110_004_student_portal",
    up: up$f,
    down: down$f,
    description: description$f
  },
  // ============================================================
  // Миграция 005: Шаблоны расписания
  // ============================================================
  {
    name: "20260123_005_schedule_templates",
    up: up$e,
    down: down$e,
    description: description$e
  },
  // ============================================================
  // Миграция 006: Библиотека
  // ============================================================
  {
    name: "20260128_006_library_system",
    up: up$d,
    down: down$d,
    description: description$d
  },
  // ============================================================
  // Миграция 007: AI-импорт сертификатов
  // ============================================================
  {
    name: "20260203_007_ai_certificate_import",
    up: up$c,
    down: down$c,
    description: description$c
  },
  // ============================================================
  // Миграция 008: Исправление схемы сертификатов
  // ============================================================
  {
    name: "20260203_008_fix_issued_certificates_schema",
    up: up$b,
    down: down$b,
    description: description$b
  },
  // ============================================================
  // Миграция 009: Ensure docx_file_url
  // ============================================================
  {
    name: "20260203_009_ensure_docx_file_url",
    up: up$a,
    down: down$a,
    description: description$a
  },
  // ============================================================
  // Миграция 010: Add user_id to students table
  // ============================================================
  {
    name: "20260203_010_add_user_id_to_students",
    up: up$9,
    down: down$9,
    description: description$9
  },
  // ============================================================
  // Миграция 011: Система настроек AI
  // ============================================================
  {
    name: "20260203_011_ai_settings",
    up: up$8,
    down: down$8,
    description: description$8
  },
  // ============================================================
  // Миграция 012: Добавление колонки language в таблицу questions
  // ============================================================
  {
    name: "20260206_012_add_language_to_questions",
    up: up$7,
    down: down$7,
    description: description$7
  },
  // ============================================================
  // Миграция 013: Fix AI Logs Foreign Key
  // ============================================================
  {
    name: "20260206_013_fix_ai_logs_foreign_key",
    up: up$6,
    down: down$6,
    description: description$6
  },
  // ============================================================
  // Миграция 014: Add number_format and last_number to certificate_templates
  // ============================================================
  {
    name: "20260209_014_add_number_format_to_templates",
    up: up$5,
    down: down$5,
    description: description$5
  },
  // ============================================================
  // Миграция 015: Fix certificate_templates columns
  // ============================================================
  {
    name: "20260209_015_fix_certificate_templates_columns",
    up: up$4,
    down: down$4,
    description: description$4
  },
  // ============================================================
  // Миграция 017: Add user_id to instructors table
  // ============================================================
  {
    name: "20260212_017_add_user_id_to_instructors",
    up: up$3,
    down: down$3,
    description: description$3
  },
  // ============================================================
  // Миграция 018: Add multilingual name fields to organizations
  // ============================================================
  {
    name: "20260213_018_add_organization_languages",
    up: up$2,
    down: down$2,
    description: description$2
  },
  // ============================================================
  // Миграция 019: Add certificate_validity_months to courses
  // ============================================================
  {
    name: "20260216_019_add_certificate_validity_to_courses",
    up: up$1,
    down: down$1,
    description: description$1
  },
  // ============================================================
  // Миграция 020: Face Recognition System
  // ============================================================
  {
    name: "20260216_020_face_recognition_system",
    up: up,
    down: down,
    description: description
  }
  // ============================================================
  // Новые миграции добавлять ниже
  // ============================================================
];
const LEGACY_MIGRATIONS_INCLUDED_IN_CONSOLIDATED = [
  // Original legacy
  "20251215_001_create_users_table",
  "20251215_002_seed_admin_user",
  "20251216_003_create_students_tables",
  "20251216_004_create_courses_tables",
  "20251217_005_update_instructors_table",
  "20251218_add_discipline_hours_breakdown",
  "20251218_007_create_files_table",
  "20251218_008_add_folders_support",
  "20251219_009_add_folder_password",
  "20251219_009_create_activity_logs_table",
  "20251222_010_create_study_groups_tables",
  "20251222_011_create_schedule_events_table",
  "20251224_012_fix_schedule_event_type",
  "20251224_013_create_organizations_table",
  "20251224_014_create_representatives_table",
  "20251224_015_create_telegram_sessions_table",
  "20251224_016_create_schedule_settings_table",
  "20251224_001_consolidated_schema",
  // Deleted in Feb 2026 consolidation
  "20251225_020_attendance_grades",
  "20251226_021_certificate_templates_extended",
  "20251226_022_certificate_visual_editor",
  "20251229_023_certificate_validity_and_permissions",
  "20251229_024_telegram_bot_requests",
  "20251229_025_unify_certificates",
  "20251230_026_user_entity_links",
  "20260103_027_activity_log_enum_expansion",
  "20260103_027_activity_log_view_action",
  "20260104_028_testing_system",
  "20260105_029_test_preview_mode",
  "20260105_030_preview_sessions_nullable_assignment",
  "20260105_031_preview_sessions_nullable_student",
  "20260105_032_multilang_questions",
  "20260106_033_grades_from_test",
  "20260106_034_certificate_standalone",
  "20260108_035_student_portal_tables",
  "20260108_036_student_notifications",
  "20260109_037_activity_log_action_types",
  "20260109_038_attendance_marking_system",
  "20260109_039_fix_attendance_trigger",
  "20260109_040_backfill_marking_status",
  "20260113_041_retake_system",
  "20260113_042_retake_linked_events",
  "20260113_043_schedule_events_allowed_students",
  "20260113_044_add_user_relations",
  "20260113_045_link_existing_users",
  "20260114_046_group_archive_system",
  "20260114_047_extend_files_for_groups",
  "20260114_048_course_archive_system",
  "20260115_051_add_user_search_indexes",
  "20260115_052_link_users_by_email",
  "20260121_001_add_academic_hour_setting",
  "20260121_002_add_duration_minutes",
  "20260122_001_add_academic_hours",
  "20260122_002_fix_files_group_id_type",
  "20260123_001_schedule_templates",
  "20260128_002_fix_missing_allowed_student_ids",
  "20260128_003_library_system"
];
async function createMigrationsTable(connection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      description TEXT,
      executed_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      
      INDEX idx_name (name),
      INDEX idx_executed_at (executed_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}
async function getExecutedMigrations(connection) {
  const [rows] = await connection.query(
    "SELECT name FROM migrations ORDER BY executed_at ASC"
  );
  return rows.map((row) => row.name);
}
async function recordMigration(connection, name, description) {
  await connection.query(
    "INSERT INTO migrations (name, description) VALUES (?, ?)",
    [name, description || null]
  );
}
function loadMigrations() {
  console.log(
    `\u{1F4CB} Loaded ${MIGRATIONS_REGISTRY.length} migrations from static registry`
  );
  return MIGRATIONS_REGISTRY;
}
function hasLegacyMigrationsApplied(executedMigrations) {
  return executedMigrations.some(
    (m) => LEGACY_MIGRATIONS_INCLUDED_IN_CONSOLIDATED.includes(m)
  );
}
async function consolidateMigrationRecords(connection) {
  console.log("\u{1F504} Consolidating old migration records...");
  if (LEGACY_MIGRATIONS_INCLUDED_IN_CONSOLIDATED.length > 0) {
    for (const legacyMigration of LEGACY_MIGRATIONS_INCLUDED_IN_CONSOLIDATED) {
      await connection.query("DELETE FROM migrations WHERE name = ?", [
        legacyMigration
      ]);
    }
  }
  await connection.query(
    `INSERT IGNORE INTO migrations (name, description) VALUES (?, ?)`,
    ["20251224_001_initial_schema", description$i]
  );
  console.log("\u2705 Migration records consolidated");
}
async function runMigrations() {
  console.log("\u{1F504} Starting database migrations...");
  try {
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error("Failed to connect to database");
    }
    const pool = getDbPool();
    const connection = await pool.getConnection();
    try {
      await createMigrationsTable(connection);
      let executedMigrations = [];
      try {
        executedMigrations = await getExecutedMigrations(connection);
      } catch (error) {
        if (error.errno === 1932 || error.sqlMessage && error.sqlMessage.includes("doesn't exist in engine")) {
          console.warn(
            "\u26A0\uFE0F  Migrations table corruption detected. Attempting to repair..."
          );
          try {
            await connection.query("DROP TABLE IF EXISTS migrations");
            await createMigrationsTable(connection);
            const [tables] = await connection.query(
              "SHOW TABLES LIKE 'users'"
            );
            if (tables.length > 0) {
              console.log(
                "\u2139\uFE0F  Existing tables detected. Assuming previous migrations were applied."
              );
              console.log(
                "\u2139\uFE0F  Will attempt to re-verify all migrations (safe mode)."
              );
              executedMigrations = [];
            } else {
              executedMigrations = [];
            }
          } catch (repairError) {
            console.error("\u274C Failed to repair migrations table:", repairError);
            throw error;
          }
        } else {
          throw error;
        }
      }
      console.log(`\u2139\uFE0F  Found ${executedMigrations.length} executed migrations`);
      if (hasLegacyMigrationsApplied(executedMigrations)) {
        console.log("\u2139\uFE0F  Legacy migrations detected, consolidating records...");
        await consolidateMigrationRecords(connection);
        executedMigrations = await getExecutedMigrations(connection);
      }
      const allMigrations = loadMigrations();
      console.log(`\u2139\uFE0F  Found ${allMigrations.length} migration files`);
      const pendingMigrations = allMigrations.filter(
        (migration) => !executedMigrations.includes(migration.name)
      );
      if (pendingMigrations.length === 0) {
        console.log("\u2705 All migrations are up to date");
        return;
      }
      console.log(
        `\u{1F504} Running ${pendingMigrations.length} pending migrations...`
      );
      for (const migration of pendingMigrations) {
        console.log(`
\u{1F4E6} Migration: ${migration.name}`);
        if (migration.description) {
          console.log(`   ${migration.description}`);
        }
        await connection.beginTransaction();
        try {
          await migration.up(connection);
          await recordMigration(
            connection,
            migration.name,
            migration.description
          );
          await connection.commit();
          console.log(`\u2705 Migration ${migration.name} completed`);
        } catch (error) {
          await connection.rollback();
          console.error(`\u274C Migration ${migration.name} failed:`, error);
          throw error;
        }
      }
      console.log("\n\u2705 All migrations completed successfully");
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("\u274C Migration process failed:", error);
    throw error;
  }
}

let migrationPromise = null;
let migrationCompleted = false;
let migrationError = null;
async function ensureMigrations() {
  if (migrationCompleted) {
    return;
  }
  if (migrationError) {
    throw migrationError;
  }
  if (migrationPromise) {
    return migrationPromise;
  }
  migrationPromise = (async () => {
    try {
      console.log("\u{1F504} [AutoMigrations] Running database migrations...");
      await runMigrations();
      migrationCompleted = true;
      console.log("\u2705 [AutoMigrations] Migrations completed successfully");
    } catch (error) {
      migrationError = error instanceof Error ? error : new Error(String(error));
      console.error("\u274C [AutoMigrations] Migration failed:", migrationError.message);
      throw migrationError;
    }
  })();
  return migrationPromise;
}
const _c_t2byW8CidkJq45RdCuw1V1O3BgV8OIfM_xQSpMHb8 = defineNitroPlugin((nitroApp) => {
  const autoMigrate = process.env.AUTO_MIGRATE === "true";
  console.log(`\u{1F527} [AutoMigrations] Plugin loaded`);
  console.log(`   - NODE_ENV: ${"production"}`);
  console.log(`   - AUTO_MIGRATE: ${autoMigrate ? "enabled" : "disabled"}`);
  if (!autoMigrate) {
    console.log("\u2139\uFE0F  [AutoMigrations] Skipped (AUTO_MIGRATE != true)");
    return;
  }
  ensureMigrations().catch((error) => {
    console.error("\u274C [AutoMigrations] Startup migration failed:", error);
  });
  nitroApp.hooks.hook("request", async (event) => {
    const path = event.path || "";
    if (path.startsWith("/_nuxt/") || path.startsWith("/favicon") || path === "/health" || path === "/__nuxt_error") {
      return;
    }
    if (path.startsWith("/api/")) {
      try {
        await ensureMigrations();
      } catch (error) {
        console.error("\u274C [AutoMigrations] Request blocked due to migration failure");
      }
    }
  });
});

const BOT_MESSAGES = {
  // Приветствие
  WELCOME: `\u{1F44B} *\u0414\u043E\u0431\u0440\u043E \u043F\u043E\u0436\u0430\u043B\u043E\u0432\u0430\u0442\u044C!*

\u042F \u0431\u043E\u0442 \u0443\u0447\u0435\u0431\u043D\u043E\u0433\u043E \u0446\u0435\u043D\u0442\u0440\u0430. \u042F \u043F\u043E\u043C\u043E\u0433\u0443 \u0432\u0430\u043C \u043E\u0442\u0441\u043B\u0435\u0436\u0438\u0432\u0430\u0442\u044C \u0438\u043D\u0444\u043E\u0440\u043C\u0430\u0446\u0438\u044E \u043E \u0432\u0430\u0448\u0438\u0445 \u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u0430\u0445, \u043F\u0440\u043E\u0445\u043E\u0434\u044F\u0449\u0438\u0445 \u043E\u0431\u0443\u0447\u0435\u043D\u0438\u0435.

\u0414\u043B\u044F \u043D\u0430\u0447\u0430\u043B\u0430 \u0440\u0430\u0431\u043E\u0442\u044B \u0432\u0430\u043C \u043D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E \u0437\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u0442\u044C\u0441\u044F.`,
  // Регистрация
  ASK_NAME: `\u{1F4DD} *\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044F*

\u041F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430, \u0432\u0432\u0435\u0434\u0438\u0442\u0435 \u0432\u0430\u0448\u0435 *\u0424\u0418\u041E* (\u0424\u0430\u043C\u0438\u043B\u0438\u044F \u0418\u043C\u044F \u041E\u0442\u0447\u0435\u0441\u0442\u0432\u043E):`,
  ASK_PHONE: `\u{1F4F1} *\u041D\u043E\u043C\u0435\u0440 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0430*

\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0432\u0430\u0448 \u043D\u043E\u043C\u0435\u0440 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0430 \u0432 \u0444\u043E\u0440\u043C\u0430\u0442\u0435: *+998XXXXXXXXX*

\u0418\u043B\u0438 \u043D\u0430\u0436\u043C\u0438\u0442\u0435 \u043A\u043D\u043E\u043F\u043A\u0443 \u043D\u0438\u0436\u0435, \u0447\u0442\u043E\u0431\u044B \u043E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u043A\u043E\u043D\u0442\u0430\u043A\u0442:`,
  ASK_ORGANIZATION: `\u{1F3E2} *\u0412\u044B\u0431\u043E\u0440 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438*

\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0432\u0430\u0448\u0443 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044E \u0438\u0437 \u0441\u043F\u0438\u0441\u043A\u0430 \u0438\u043B\u0438 \u0432\u0432\u0435\u0434\u0438\u0442\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435, \u0435\u0441\u043B\u0438 \u0435\u0451 \u043D\u0435\u0442 \u0432 \u0441\u043F\u0438\u0441\u043A\u0435:`,
  REGISTRATION_COMPLETE: `\u2705 *\u0417\u0430\u044F\u0432\u043A\u0430 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0430!*

\u0412\u0430\u0448\u0430 \u0437\u0430\u044F\u0432\u043A\u0430 \u043D\u0430 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044E \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0430 \u0438 \u043E\u0436\u0438\u0434\u0430\u0435\u0442 \u043E\u0434\u043E\u0431\u0440\u0435\u043D\u0438\u044F \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u043E\u043C.

\u0412\u044B \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u0435 \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u0435, \u043A\u043E\u0433\u0434\u0430 \u0437\u0430\u044F\u0432\u043A\u0430 \u0431\u0443\u0434\u0435\u0442 \u0440\u0430\u0441\u0441\u043C\u043E\u0442\u0440\u0435\u043D\u0430.

\u0427\u0442\u043E\u0431\u044B \u043F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u0441\u0442\u0430\u0442\u0443\u0441 \u0437\u0430\u044F\u0432\u043A\u0438, \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435 \u043A\u043E\u043C\u0430\u043D\u0434\u0443 /status`,
  ALREADY_REGISTERED: `\u2139\uFE0F *\u0412\u044B \u0443\u0436\u0435 \u0437\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u043D\u044B*

\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435 /status \u0447\u0442\u043E\u0431\u044B \u0443\u0437\u043D\u0430\u0442\u044C \u0441\u0442\u0430\u0442\u0443\u0441 \u0432\u0430\u0448\u0435\u0439 \u0437\u0430\u044F\u0432\u043A\u0438.`,
  // Статусы
  STATUS_PENDING: `\u23F3 *\u0421\u0442\u0430\u0442\u0443\u0441: \u041E\u0436\u0438\u0434\u0430\u0435\u0442 \u043E\u0434\u043E\u0431\u0440\u0435\u043D\u0438\u044F*

\u0412\u0430\u0448\u0430 \u0437\u0430\u044F\u0432\u043A\u0430 \u043D\u0430\u0445\u043E\u0434\u0438\u0442\u0441\u044F \u043D\u0430 \u0440\u0430\u0441\u0441\u043C\u043E\u0442\u0440\u0435\u043D\u0438\u0438 \u0443 \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0430.
\u041F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430, \u0434\u043E\u0436\u0434\u0438\u0442\u0435\u0441\u044C \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F.`,
  STATUS_APPROVED: `\u2705 *\u0421\u0442\u0430\u0442\u0443\u0441: \u041E\u0434\u043E\u0431\u0440\u0435\u043D*

\u0412\u0430\u0448\u0430 \u0437\u0430\u044F\u0432\u043A\u0430 \u043E\u0434\u043E\u0431\u0440\u0435\u043D\u0430! \u0412\u0430\u043C \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0435 \u043A\u043E\u043C\u0430\u043D\u0434\u044B:
\u2022 /students \u2014 \u0441\u043F\u0438\u0441\u043E\u043A \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0435\u0439 \u0432\u0430\u0448\u0435\u0439 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438
\u2022 /schedule \u2014 \u0440\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u0437\u0430\u043D\u044F\u0442\u0438\u0439
\u2022 /certificates \u2014 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u044B \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0435\u0439`,
  STATUS_BLOCKED: (reason) => `\u{1F6AB} *\u0421\u0442\u0430\u0442\u0443\u0441: \u0417\u0430\u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u0430\u043D*

\u041A \u0441\u043E\u0436\u0430\u043B\u0435\u043D\u0438\u044E, \u0432\u0430\u0448\u0430 \u0437\u0430\u044F\u0432\u043A\u0430 \u0431\u044B\u043B\u0430 \u043E\u0442\u043A\u043B\u043E\u043D\u0435\u043D\u0430.

*\u041F\u0440\u0438\u0447\u0438\u043D\u0430:* ${reason || "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u0430"}

\u0415\u0441\u043B\u0438 \u0432\u044B \u0441\u0447\u0438\u0442\u0430\u0435\u0442\u0435 \u044D\u0442\u043E \u043E\u0448\u0438\u0431\u043A\u043E\u0439, \u0441\u0432\u044F\u0436\u0438\u0442\u0435\u0441\u044C \u0441 \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u043E\u043C \u0443\u0447\u0435\u0431\u043D\u043E\u0433\u043E \u0446\u0435\u043D\u0442\u0440\u0430.`,
  // Уведомления
  NOTIFICATION_APPROVED: `\u{1F389} *\u041F\u043E\u0437\u0434\u0440\u0430\u0432\u043B\u044F\u0435\u043C!*

\u0412\u0430\u0448\u0430 \u0437\u0430\u044F\u0432\u043A\u0430 \u043D\u0430 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044E \u0431\u044B\u043B\u0430 *\u043E\u0434\u043E\u0431\u0440\u0435\u043D\u0430*!

\u0422\u0435\u043F\u0435\u0440\u044C \u0432\u0430\u043C \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B \u043A\u043E\u043C\u0430\u043D\u0434\u044B:
\u2022 /students \u2014 \u0441\u043F\u0438\u0441\u043E\u043A \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0435\u0439 \u0432\u0430\u0448\u0435\u0439 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438
\u2022 /schedule \u2014 \u0440\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u0437\u0430\u043D\u044F\u0442\u0438\u0439
\u2022 /certificates \u2014 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u044B \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0435\u0439`,
  NOTIFICATION_BLOCKED: (reason) => `\u274C *\u0417\u0430\u044F\u0432\u043A\u0430 \u043E\u0442\u043A\u043B\u043E\u043D\u0435\u043D\u0430*

\u041A \u0441\u043E\u0436\u0430\u043B\u0435\u043D\u0438\u044E, \u0432\u0430\u0448\u0430 \u0437\u0430\u044F\u0432\u043A\u0430 \u0431\u044B\u043B\u0430 \u043E\u0442\u043A\u043B\u043E\u043D\u0435\u043D\u0430.

*\u041F\u0440\u0438\u0447\u0438\u043D\u0430:* ${reason || "\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u0430"}

\u0415\u0441\u043B\u0438 \u0432\u044B \u0441\u0447\u0438\u0442\u0430\u0435\u0442\u0435 \u044D\u0442\u043E \u043E\u0448\u0438\u0431\u043A\u043E\u0439, \u0441\u0432\u044F\u0436\u0438\u0442\u0435\u0441\u044C \u0441 \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u043E\u043C.`,
  // Ошибки
  ERROR_NO_PERMISSION: `\u{1F6AB} *\u0414\u043E\u0441\u0442\u0443\u043F \u0437\u0430\u043F\u0440\u0435\u0449\u0451\u043D*

\u042D\u0442\u0430 \u043A\u043E\u043C\u0430\u043D\u0434\u0430 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u0430 \u0442\u043E\u043B\u044C\u043A\u043E \u0434\u043B\u044F \u043E\u0434\u043E\u0431\u0440\u0435\u043D\u043D\u044B\u0445 \u043F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u0438\u0442\u0435\u043B\u0435\u0439 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0439.

\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435 /status \u0447\u0442\u043E\u0431\u044B \u043F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u0441\u0442\u0430\u0442\u0443\u0441 \u0432\u0430\u0448\u0435\u0439 \u0437\u0430\u044F\u0432\u043A\u0438.`,
  ERROR_NOT_REGISTERED: `\u2753 *\u0412\u044B \u043D\u0435 \u0437\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u043D\u044B*

\u0414\u043B\u044F \u0434\u043E\u0441\u0442\u0443\u043F\u0430 \u043A \u0444\u0443\u043D\u043A\u0446\u0438\u044F\u043C \u0431\u043E\u0442\u0430 \u043D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E \u043F\u0440\u043E\u0439\u0442\u0438 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044E.
\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435 /start \u0434\u043B\u044F \u043D\u0430\u0447\u0430\u043B\u0430 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438.`,
  ERROR_GENERAL: `\u26A0\uFE0F *\u041F\u0440\u043E\u0438\u0437\u043E\u0448\u043B\u0430 \u043E\u0448\u0438\u0431\u043A\u0430*

\u041F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430, \u043F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u043F\u043E\u0437\u0436\u0435 \u0438\u043B\u0438 \u0441\u0432\u044F\u0436\u0438\u0442\u0435\u0441\u044C \u0441 \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u043E\u043C.`,
  // Валидация
  INVALID_NAME: `\u274C *\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0444\u043E\u0440\u043C\u0430\u0442 \u0424\u0418\u041E*

\u041F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430, \u0432\u0432\u0435\u0434\u0438\u0442\u0435 \u043F\u043E\u043B\u043D\u043E\u0435 \u0424\u0418\u041E (\u043C\u0438\u043D\u0438\u043C\u0443\u043C 3 \u0441\u0438\u043C\u0432\u043E\u043B\u0430).
\u041D\u0430\u043F\u0440\u0438\u043C\u0435\u0440: *\u0418\u0432\u0430\u043D\u043E\u0432 \u0418\u0432\u0430\u043D \u0418\u0432\u0430\u043D\u043E\u0432\u0438\u0447*`,
  INVALID_PHONE: `\u274C *\u041D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0444\u043E\u0440\u043C\u0430\u0442 \u043D\u043E\u043C\u0435\u0440\u0430*

\u041F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430, \u0432\u0432\u0435\u0434\u0438\u0442\u0435 \u043D\u043E\u043C\u0435\u0440 \u0432 \u0444\u043E\u0440\u043C\u0430\u0442\u0435: *+998XXXXXXXXX*
\u041D\u0430\u043F\u0440\u0438\u043C\u0435\u0440: *+998901234567*`,
  // Помощь
  HELP: `\u{1F4DA} *\u0421\u043F\u0440\u0430\u0432\u043A\u0430 \u043F\u043E \u043A\u043E\u043C\u0430\u043D\u0434\u0430\u043C*

/start \u2014 \u043D\u0430\u0447\u0430\u0442\u044C \u0440\u0430\u0431\u043E\u0442\u0443 / \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044F
/status \u2014 \u043F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u0441\u0442\u0430\u0442\u0443\u0441 \u0437\u0430\u044F\u0432\u043A\u0438
/students \u2014 \u0441\u043F\u0438\u0441\u043E\u043A \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0435\u0439 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438
/schedule \u2014 \u0440\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u0437\u0430\u043D\u044F\u0442\u0438\u0439
/certificates \u2014 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u044B \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0435\u0439
/help \u2014 \u044D\u0442\u0430 \u0441\u043F\u0440\u0430\u0432\u043A\u0430

*\u0414\u043E\u0441\u0442\u0443\u043F \u043A \u043A\u043E\u043C\u0430\u043D\u0434\u0430\u043C /students, /schedule \u0438 /certificates* \u043F\u0440\u0435\u0434\u043E\u0441\u0442\u0430\u0432\u043B\u044F\u0435\u0442\u0441\u044F \u043F\u043E\u0441\u043B\u0435 \u043E\u0434\u043E\u0431\u0440\u0435\u043D\u0438\u044F \u0432\u0430\u0448\u0435\u0439 \u0437\u0430\u044F\u0432\u043A\u0438 \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u043E\u043C.`,
  // Пустые данные
  NO_STUDENTS: `\u{1F4ED} *\u041D\u0435\u0442 \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0435\u0439*

\u0412 \u0434\u0430\u043D\u043D\u044B\u0439 \u043C\u043E\u043C\u0435\u043D\u0442 \u043D\u0435\u0442 \u0430\u043A\u0442\u0438\u0432\u043D\u044B\u0445 \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0435\u0439 \u043E\u0442 \u0432\u0430\u0448\u0435\u0439 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438.`,
  NO_SCHEDULE: `\u{1F4ED} *\u041D\u0435\u0442 \u0437\u0430\u043D\u044F\u0442\u0438\u0439*

\u0412 \u0431\u043B\u0438\u0436\u0430\u0439\u0448\u0435\u0435 \u0432\u0440\u0435\u043C\u044F \u043D\u0435\u0442 \u0437\u0430\u043F\u043B\u0430\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0445 \u0437\u0430\u043D\u044F\u0442\u0438\u0439 \u0434\u043B\u044F \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0435\u0439 \u0432\u0430\u0448\u0435\u0439 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438.`,
  NO_CERTIFICATES: `\u{1F4ED} *\u041D\u0435\u0442 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432*

\u0412 \u0434\u0430\u043D\u043D\u044B\u0439 \u043C\u043E\u043C\u0435\u043D\u0442 \u043D\u0435\u0442 \u0432\u044B\u0434\u0430\u043D\u043D\u044B\u0445 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432 \u0434\u043B\u044F \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0435\u0439 \u0432\u0430\u0448\u0435\u0439 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438.`,
  CERTIFICATES_HEADER: `\u{1F4DC} *\u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u044B \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0435\u0439 \u0432\u0430\u0448\u0435\u0439 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438:*

`,
  CERTIFICATE_SENT: (studentName, certificateNumber) => `\u2705 \u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 *${certificateNumber}* \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u044F *${studentName}* \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D.`,
  CERTIFICATE_SEND_ERROR: (studentName) => `\u274C \u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u044F *${studentName}*. \u0424\u0430\u0439\u043B \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D.`,
  CERTIFICATE_REQUEST_RECEIVED: `\u{1F4E5} *\u0417\u0430\u043F\u0440\u043E\u0441 \u043D\u0430 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u044B \u043F\u043E\u043B\u0443\u0447\u0435\u043D*

\u0412\u0430\u0448 \u0437\u0430\u043F\u0440\u043E\u0441 \u043D\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u0435 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432 \u043E\u0431\u0440\u0430\u0431\u0430\u0442\u044B\u0432\u0430\u0435\u0442\u0441\u044F. \u0424\u0430\u0439\u043B\u044B \u0431\u0443\u0434\u0443\u0442 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u044B \u0432 \u0431\u043B\u0438\u0436\u0430\u0439\u0448\u0435\u0435 \u0432\u0440\u0435\u043C\u044F.`,
  CERTIFICATE_SENDING_LIMIT: `\u26A0\uFE0F *\u041B\u0438\u043C\u0438\u0442 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0438*

\u0412\u044B \u043C\u043E\u0436\u0435\u0442\u0435 \u0437\u0430\u043F\u0440\u043E\u0441\u0438\u0442\u044C \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0443 \u043D\u0435 \u0431\u043E\u043B\u0435\u0435 10 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432 \u0437\u0430 \u0440\u0430\u0437. \u0414\u043B\u044F \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0434\u0440\u0443\u0433\u0438\u0445 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432 \u043F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u0435 \u043A\u043E\u043C\u0430\u043D\u0434\u0443.`
};
function validateName(name) {
  const trimmed = name.trim();
  return trimmed.length >= 3 && /^[а-яёА-ЯЁa-zA-Z\s\-]+$/u.test(trimmed);
}
function validatePhone(phone) {
  const cleaned = phone.replace(/[^\d+]/g, "");
  return /^\+998\d{9}$/.test(cleaned);
}
function normalizePhone(phone) {
  let cleaned = phone.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("998") && !cleaned.startsWith("+")) {
    cleaned = "+" + cleaned;
  }
  if (cleaned.startsWith("9") && cleaned.length === 9) {
    cleaned = "+998" + cleaned;
  }
  return cleaned;
}
function formatDate(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}
function formatStudentsList(students) {
  if (students.length === 0) {
    return BOT_MESSAGES.NO_STUDENTS;
  }
  const byGroup = students.reduce(
    (acc, student) => {
      const key = student.groupName;
      if (!acc[key]) {
        acc[key] = {
          courseName: student.courseName,
          startDate: student.startDate,
          endDate: student.endDate,
          students: []
        };
      }
      acc[key].students.push(student.fullName);
      return acc;
    },
    {}
  );
  let message = "\u{1F4DA} *\u0421\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0438 \u0432\u0430\u0448\u0435\u0439 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438:*\n\n";
  let totalStudents = 0;
  for (const [groupName, group] of Object.entries(byGroup)) {
    message += `*\u0413\u0440\u0443\u043F\u043F\u0430: ${groupName}* (${group.startDate} - ${group.endDate})
`;
    message += `\u{1F4D6} _${group.courseName}_
`;
    group.students.forEach((name, index) => {
      const prefix = index === group.students.length - 1 ? "\u2514" : "\u251C";
      message += `${prefix} ${name}
`;
      totalStudents++;
    });
    message += "\n";
  }
  message += `*\u0412\u0441\u0435\u0433\u043E \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0435\u0439:* ${totalStudents}`;
  return message;
}
function formatSchedule(events) {
  if (events.length === 0) {
    return BOT_MESSAGES.NO_SCHEDULE;
  }
  const byDate = events.reduce(
    (acc, event) => {
      if (!acc[event.date]) {
        acc[event.date] = [];
      }
      const dateEvents = acc[event.date];
      if (dateEvents) {
        dateEvents.push(event);
      }
      return acc;
    },
    {}
  );
  let message = "\u{1F4C5} *\u0420\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u0437\u0430\u043D\u044F\u0442\u0438\u0439:*\n\n";
  for (const [date, dateEvents] of Object.entries(byDate)) {
    const dateObj = new Date(date);
    const dayName = dateObj.toLocaleDateString("ru-RU", { weekday: "long" });
    message += `\u{1F5D3} *${formatDate(date)}* (${dayName})

`;
    for (const event of dateEvents) {
      const typeEmoji = event.eventType === "theory" ? "\u{1F4D6}" : event.eventType === "practice" ? "\u{1F4BB}" : "\u{1F4DD}";
      const typeName = event.eventType === "theory" ? "\u0422\u0435\u043E\u0440\u0438\u044F" : event.eventType === "practice" ? "\u041F\u0440\u0430\u043A\u0442\u0438\u043A\u0430" : "\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u0437\u043D\u0430\u043D\u0438\u0439";
      message += `${event.startTime} - ${event.endTime} | ${typeName}
`;
      message += `${typeEmoji} ${event.disciplineName}
`;
      message += `\u{1F468}\u200D\u{1F3EB} \u041F\u0440\u0435\u043F\u043E\u0434\u0430\u0432\u0430\u0442\u0435\u043B\u044C: ${event.instructorName}
`;
      if (event.location) {
        message += `\u{1F6AA} \u0410\u0443\u0434\u0438\u0442\u043E\u0440\u0438\u044F: ${event.location}
`;
      }
      message += `\u{1F465} \u0413\u0440\u0443\u043F\u043F\u0430: ${event.groupName}

`;
    }
  }
  return message;
}
function formatCertificatesList(certificates) {
  if (certificates.length === 0) {
    return BOT_MESSAGES.NO_CERTIFICATES;
  }
  let message = BOT_MESSAGES.CERTIFICATES_HEADER;
  let totalIssued = 0;
  let totalRevoked = 0;
  const byCourse = certificates.reduce(
    (acc, cert) => {
      const key = `${cert.courseName} (${cert.groupCode})`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(cert);
      return acc;
    },
    {}
  );
  for (const [courseGroup, certs] of Object.entries(byCourse)) {
    message += `\u{1F4DA} *${courseGroup}*
`;
    for (const cert of certs) {
      const statusIcon = cert.status === "issued" ? "\u2705" : "\u274C";
      const passedIcon = cert.hasPassed ? "\u{1F393}" : "\u26A0\uFE0F";
      const passedText = cert.hasPassed ? "\u041F\u0440\u043E\u0448\u0451\u043B \u043E\u0431\u0443\u0447\u0435\u043D\u0438\u0435" : "\u041D\u0435 \u0441\u043E\u043E\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0443\u0435\u0442 \u0442\u0440\u0435\u0431\u043E\u0432\u0430\u043D\u0438\u044F\u043C";
      message += `${statusIcon} *${cert.studentName}*
`;
      message += `   \u{1F4DC} \u2116 ${cert.certificateNumber}
`;
      message += `   \u{1F4C5} \u0412\u044B\u0434\u0430\u043D: ${cert.issueDate}
`;
      message += `   ${passedIcon} ${passedText}`;
      if (cert.attendancePercent !== null && cert.attendancePercent !== void 0) {
        const percent = Number(cert.attendancePercent);
        if (!isNaN(percent)) {
          message += ` (\u043F\u043E\u0441\u0435\u0449.: ${percent.toFixed(0)}%)`;
        }
      }
      message += "\n";
      if (cert.status === "revoked") {
        message += `   \u26D4 _\u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 \u043E\u0442\u043E\u0437\u0432\u0430\u043D_
`;
        totalRevoked++;
      } else {
        totalIssued++;
      }
      message += "\n";
    }
  }
  message += `\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501
`;
  message += `*\u0418\u0442\u043E\u0433\u043E:* ${certificates.length} \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432
`;
  message += `\u2705 \u0410\u043A\u0442\u0438\u0432\u043D\u044B\u0445: ${totalIssued} | \u274C \u041E\u0442\u043E\u0437\u0432\u0430\u043D\u043E: ${totalRevoked}

`;
  message += `_\u0414\u043B\u044F \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0444\u0430\u0439\u043B\u0430 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430 \u043E\u0442\u0432\u0435\u0442\u044C\u0442\u0435 \u043D\u043E\u043C\u0435\u0440\u043E\u043C \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430 \u0438\u043B\u0438 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435 \u043A\u043D\u043E\u043F\u043A\u0438 \u043D\u0438\u0436\u0435._`;
  return message;
}
function createOrganizationsKeyboard(organizations) {
  const keyboard = new InlineKeyboard();
  organizations.forEach((org, index) => {
    keyboard.text(org.name, `org_${org.id}`);
    if (index < organizations.length - 1) {
      keyboard.row();
    }
  });
  return keyboard;
}
let botInstance = null;
function getBot() {
  if (!botInstance) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.warn(
        "[TelegramBot] TELEGRAM_BOT_TOKEN \u043D\u0435 \u0437\u0430\u0434\u0430\u043D \u0432 \u043F\u0435\u0440\u0435\u043C\u0435\u043D\u043D\u044B\u0445 \u043E\u043A\u0440\u0443\u0436\u0435\u043D\u0438\u044F"
      );
      return null;
    }
    botInstance = new Bot(token);
    console.log("[TelegramBot] \u0411\u043E\u0442 \u0438\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D");
  }
  return botInstance;
}
async function sendMessage(chatId, text, options) {
  const bot = getBot();
  if (!bot) {
    console.error("[TelegramBot] \u0411\u043E\u0442 \u043D\u0435 \u0438\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D");
    return false;
  }
  try {
    await bot.api.sendMessage(chatId, text, {
      parse_mode: options?.parseMode || "Markdown",
      reply_markup: options?.replyMarkup
    });
    return true;
  } catch (error) {
    console.error("[TelegramBot] \u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0438 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F:", error);
    return false;
  }
}
async function sendMessageWithContactButton(chatId, text) {
  const bot = getBot();
  if (!bot) {
    console.error("[TelegramBot] \u0411\u043E\u0442 \u043D\u0435 \u0438\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D");
    return false;
  }
  try {
    const keyboard = new Keyboard().requestContact("\u{1F4F1} \u041E\u0442\u043F\u0440\u0430\u0432\u0438\u0442\u044C \u043C\u043E\u0439 \u043A\u043E\u043D\u0442\u0430\u043A\u0442").resized().oneTime();
    await bot.api.sendMessage(chatId, text, {
      parse_mode: "Markdown",
      reply_markup: keyboard
    });
    return true;
  } catch (error) {
    console.error(
      "[TelegramBot] \u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0438 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F \u0441 \u043A\u043E\u043D\u0442\u0430\u043A\u0442\u043E\u043C:",
      error
    );
    return false;
  }
}
async function sendDocument(chatId, document, caption, filename) {
  const bot = getBot();
  if (!bot) {
    console.error("[TelegramBot] \u0411\u043E\u0442 \u043D\u0435 \u0438\u043D\u0438\u0446\u0438\u0430\u043B\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u043D");
    return false;
  }
  try {
    let fileToSend;
    if (Buffer.isBuffer(document)) {
      if (!filename) {
        throw new Error("Filename \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D \u043F\u0440\u0438 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0435 Buffer");
      }
      fileToSend = new InputFile(document, filename);
    } else {
      fileToSend = document;
    }
    await bot.api.sendDocument(chatId, fileToSend, {
      caption,
      parse_mode: "Markdown"
    });
    console.log(`[TelegramBot] \u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D \u0432 \u0447\u0430\u0442 ${chatId}`);
    return true;
  } catch (error) {
    console.error("[TelegramBot] \u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0438 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430:", error);
    return false;
  }
}
function verifyWebhookSecret(secret) {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expectedSecret) {
    console.warn("[TelegramBot] TELEGRAM_WEBHOOK_SECRET \u043D\u0435 \u0437\u0430\u0434\u0430\u043D");
    return true;
  }
  return secret === expectedSecret;
}

class RateLimiter {
  limits = /* @__PURE__ */ new Map();
  config;
  constructor(config) {
    this.config = {
      maxRequests: config?.maxRequests || 10,
      // 10 запросов
      windowMs: config?.windowMs || 60 * 1e3,
      // за 1 минуту
      blockDurationMs: config?.blockDurationMs || 5 * 60 * 1e3,
      // блокировка на 5 минут
      warningThreshold: config?.warningThreshold || 8
      // предупреждение при 8 запросах
    };
  }
  /**
   * Проверить лимит для пользователя
   */
  check(chatId) {
    const now = Date.now();
    let entry = this.limits.get(chatId);
    if (!entry) {
      entry = {
        requests: [],
        blocked: false,
        warningsSent: 0
      };
      this.limits.set(chatId, entry);
    }
    if (entry.blocked && entry.blockedUntil) {
      if (now < entry.blockedUntil) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: new Date(entry.blockedUntil)
        };
      } else {
        entry.blocked = false;
        entry.blockedUntil = void 0;
        entry.requests = [];
        entry.warningsSent = 0;
        console.log(`[RateLimiter] \u0411\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u043A\u0430 \u0441\u043D\u044F\u0442\u0430 \u0434\u043B\u044F chatId: ${chatId}`);
      }
    }
    entry.requests = entry.requests.filter((time) => now - time < this.config.windowMs);
    if (entry.requests.length >= this.config.maxRequests) {
      entry.blocked = true;
      entry.blockedUntil = now + this.config.blockDurationMs;
      console.warn(`[RateLimiter] \u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u0437\u0430\u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u0430\u043D \u0437\u0430 \u0441\u043F\u0430\u043C: ${chatId}`, {
        requests: entry.requests.length,
        blockedUntil: new Date(entry.blockedUntil).toISOString()
      });
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(entry.blockedUntil)
      };
    }
    entry.requests.push(now);
    const remaining = this.config.maxRequests - entry.requests.length;
    const isWarning = entry.requests.length >= this.config.warningThreshold;
    if (isWarning && entry.warningsSent === 0) {
      entry.warningsSent++;
      console.log(`[RateLimiter] \u041F\u0440\u0435\u0434\u0443\u043F\u0440\u0435\u0436\u0434\u0435\u043D\u0438\u0435 \u0434\u043B\u044F chatId: ${chatId} (${entry.requests.length}/${this.config.maxRequests})`);
    }
    return {
      allowed: true,
      remaining,
      isWarning: isWarning && entry.warningsSent === 1
    };
  }
  /**
   * Сбросить лимит для пользователя (например, для админов)
   */
  reset(chatId) {
    this.limits.delete(chatId);
    console.log(`[RateLimiter] \u041B\u0438\u043C\u0438\u0442 \u0441\u0431\u0440\u043E\u0448\u0435\u043D \u0434\u043B\u044F chatId: ${chatId}`);
  }
  /**
   * Проверить, заблокирован ли пользователь
   */
  isBlocked(chatId) {
    const entry = this.limits.get(chatId);
    if (!entry || !entry.blocked) return false;
    if (entry.blockedUntil && Date.now() < entry.blockedUntil) {
      return true;
    }
    return false;
  }
  /**
   * Получить информацию о лимитах пользователя
   */
  getInfo(chatId) {
    const now = Date.now();
    const entry = this.limits.get(chatId);
    if (!entry) {
      return {
        requests: 0,
        remaining: this.config.maxRequests,
        blocked: false
      };
    }
    const recentRequests = entry.requests.filter(
      (time) => now - time < this.config.windowMs
    );
    return {
      requests: recentRequests.length,
      remaining: this.config.maxRequests - recentRequests.length,
      blocked: entry.blocked || false,
      blockedUntil: entry.blockedUntil ? new Date(entry.blockedUntil) : void 0
    };
  }
  /**
   * Очистить старые записи
   */
  cleanup() {
    const now = Date.now();
    let deleted = 0;
    for (const [chatId, entry] of this.limits.entries()) {
      const lastRequest = entry.requests[entry.requests.length - 1] || 0;
      const isInactive = now - lastRequest > 60 * 60 * 1e3;
      const isNotBlocked = !entry.blocked || entry.blockedUntil && now > entry.blockedUntil;
      if (isInactive && isNotBlocked) {
        this.limits.delete(chatId);
        deleted++;
      }
    }
    if (deleted > 0) {
      console.log(`[RateLimiter] \u041E\u0447\u0438\u0449\u0435\u043D\u043E ${deleted} \u043D\u0435\u0430\u043A\u0442\u0438\u0432\u043D\u044B\u0445 \u0437\u0430\u043F\u0438\u0441\u0435\u0439`);
    }
    return deleted;
  }
  /**
   * Получить статистику
   */
  getStats() {
    const now = Date.now();
    let blockedUsers = 0;
    let activeUsers = 0;
    for (const entry of this.limits.values()) {
      if (entry.blocked && entry.blockedUntil && now < entry.blockedUntil) {
        blockedUsers++;
      }
      const recentRequests = entry.requests.filter(
        (time) => now - time < this.config.windowMs
      );
      if (recentRequests.length > 0) {
        activeUsers++;
      }
    }
    return {
      totalUsers: this.limits.size,
      blockedUsers,
      activeUsers
    };
  }
  /**
   * Получить конфигурацию
   */
  getConfig() {
    return { ...this.config };
  }
  /**
   * Обновить конфигурацию
   */
  updateConfig(config) {
    this.config = { ...this.config, ...config };
    console.log("[RateLimiter] \u041A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u044F \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0430:", this.config);
  }
}
const rateLimiter = new RateLimiter();
const cleanupInterval$1 = setInterval(() => {
  rateLimiter.cleanup();
}, 30 * 60 * 1e3);
if (typeof process !== "undefined") {
  process.on("beforeExit", () => {
    clearInterval(cleanupInterval$1);
  });
}
function formatBlockDuration(resetAt) {
  if (!resetAt) return "";
  const now = Date.now();
  const diff = resetAt.getTime() - now;
  if (diff <= 0) return "\u0441\u0435\u0439\u0447\u0430\u0441";
  const minutes = Math.ceil(diff / (60 * 1e3));
  if (minutes < 60) {
    return `${minutes} ${getMinutesWord(minutes)}`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} ${getHoursWord(hours)}`;
  }
  return `${hours} ${getHoursWord(hours)} ${remainingMinutes} ${getMinutesWord(remainingMinutes)}`;
}
function getMinutesWord(n) {
  if (n % 10 === 1 && n % 100 !== 11) return "\u043C\u0438\u043D\u0443\u0442\u0443";
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return "\u043C\u0438\u043D\u0443\u0442\u044B";
  return "\u043C\u0438\u043D\u0443\u0442";
}
function getHoursWord(n) {
  if (n % 10 === 1 && n % 100 !== 11) return "\u0447\u0430\u0441";
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return "\u0447\u0430\u0441\u0430";
  return "\u0447\u0430\u0441\u043E\u0432";
}
function logRateLimiterStats() {
  const stats = rateLimiter.getStats();
  console.log("[RateLimiter] \u0421\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0430:", stats);
}
setInterval(() => {
  logRateLimiterStats();
}, 60 * 60 * 1e3);

class BotCache {
  cache = /* @__PURE__ */ new Map();
  defaultTTL = 5 * 60 * 1e3;
  // 5 минут
  stats = {
    hits: 0,
    misses: 0
  };
  /**
   * Сохранить данные в кэш
   */
  set(key, data, ttl) {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + (ttl || this.defaultTTL)
    });
  }
  /**
   * Получить данные из кэша
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }
    this.stats.hits++;
    return entry.data;
  }
  /**
   * Получить или установить значение
   * Если значение есть в кэше - вернуть его
   * Если нет - выполнить функцию и закэшировать результат
   */
  async getOrSet(key, fetchFn, ttl) {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }
    const data = await fetchFn();
    this.set(key, data, ttl);
    return data;
  }
  /**
   * Инвалидировать кэш по паттерну
   * Например: invalidate('students:') удалит все ключи, содержащие 'students:'
   */
  invalidate(pattern) {
    let deleted = 0;
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        deleted++;
      }
    }
    console.log(`[BotCache] \u0418\u043D\u0432\u0430\u043B\u0438\u0434\u0438\u0440\u043E\u0432\u0430\u043D\u043E ${deleted} \u0437\u0430\u043F\u0438\u0441\u0435\u0439 \u043F\u043E \u043F\u0430\u0442\u0442\u0435\u0440\u043D\u0443: ${pattern}`);
    return deleted;
  }
  /**
   * Удалить конкретный ключ
   */
  delete(key) {
    return this.cache.delete(key);
  }
  /**
   * Очистить весь кэш
   */
  clear() {
    this.cache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
    console.log("[BotCache] \u041A\u044D\u0448 \u043F\u043E\u043B\u043D\u043E\u0441\u0442\u044C\u044E \u043E\u0447\u0438\u0449\u0435\u043D");
  }
  /**
   * Автоматическая очистка устаревших записей
   */
  cleanup() {
    const now = Date.now();
    let deleted = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        deleted++;
      }
    }
    if (deleted > 0) {
      console.log(`[BotCache] \u041E\u0447\u0438\u0449\u0435\u043D\u043E ${deleted} \u0443\u0441\u0442\u0430\u0440\u0435\u0432\u0448\u0438\u0445 \u0437\u0430\u043F\u0438\u0441\u0435\u0439`);
    }
    return deleted;
  }
  /**
   * Получить статистику кэша
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.cache.size,
      hitRate: total > 0 ? this.stats.hits / total * 100 : 0
    };
  }
  /**
   * Проверить наличие ключа
   */
  has(key) {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }
  /**
   * Получить все ключи (для отладки)
   */
  keys() {
    return Array.from(this.cache.keys());
  }
  /**
   * Получить размер кэша
   */
  size() {
    return this.cache.size;
  }
}
const botCache = new BotCache();
const cleanupInterval = setInterval(() => {
  botCache.cleanup();
}, 10 * 60 * 1e3);
if (typeof process !== "undefined") {
  process.on("beforeExit", () => {
    clearInterval(cleanupInterval);
    botCache.clear();
  });
}
const CacheKeys = {
  students: (organizationId, courseId) => `students:${organizationId}${courseId ? `:${courseId}` : ""}`,
  schedule: (organizationId, startDate, endDate) => `schedule:${organizationId}${startDate ? `:${startDate}` : ""}${endDate ? `:${endDate}` : ""}`,
  certificates: (organizationId, period) => `certificates:${organizationId}${period ? `:${period}` : ""}`,
  representative: (chatId) => `representative:${chatId}`,
  organization: (organizationId) => `organization:${organizationId}`
};
function invalidateRelatedCache(entityType, entityId) {
  switch (entityType) {
    case "student":
      botCache.invalidate("students:");
      break;
    case "schedule":
    case "event":
      botCache.invalidate("schedule:");
      break;
    case "certificate":
      botCache.invalidate("certificates:");
      break;
    case "organization":
      break;
    case "representative":
      break;
    default:
      console.warn(`[BotCache] \u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0439 \u0442\u0438\u043F \u0441\u0443\u0449\u043D\u043E\u0441\u0442\u0438 \u0434\u043B\u044F \u0438\u043D\u0432\u0430\u043B\u0438\u0434\u0430\u0446\u0438\u0438: ${entityType}`);
  }
}
function logCacheStats() {
  const stats = botCache.getStats();
  console.log("[BotCache] \u0421\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0430:", {
    hits: stats.hits,
    misses: stats.misses,
    size: stats.size,
    hitRate: `${stats.hitRate.toFixed(2)}%`
  });
}
setInterval(() => {
  logCacheStats();
}, 60 * 60 * 1e3);

function mapRowToSession(row) {
  let data = {};
  if (row.data) {
    try {
      data = typeof row.data === "string" ? JSON.parse(row.data) : row.data;
    } catch {
      data = {};
    }
  }
  return {
    id: row.id,
    chatId: row.chat_id,
    state: row.state,
    data,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
async function getSession(chatId) {
  const rows = await executeQuery(
    "SELECT * FROM telegram_bot_sessions WHERE chat_id = ? LIMIT 1",
    [chatId]
  );
  return rows.length > 0 ? mapRowToSession(rows[0]) : null;
}
async function createSession(input) {
  const id = `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const now = /* @__PURE__ */ new Date();
  const state = input.state || "idle";
  const dataJson = input.data ? JSON.stringify(input.data) : "{}";
  await executeQuery(
    `INSERT INTO telegram_bot_sessions (id, chat_id, state, data, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, input.chatId, state, dataJson, now, now]
  );
  const session = await getSession(input.chatId);
  if (!session) {
    throw new Error("Failed to create session");
  }
  return session;
}
async function updateSession(chatId, input) {
  const existing = await getSession(chatId);
  if (!existing) {
    return null;
  }
  const updates = ["updated_at = ?"];
  const params = [/* @__PURE__ */ new Date()];
  if (input.state !== void 0) {
    updates.push("state = ?");
    params.push(input.state);
  }
  if (input.data !== void 0) {
    updates.push("data = ?");
    params.push(JSON.stringify(input.data));
  }
  params.push(chatId);
  await executeQuery(
    `UPDATE telegram_bot_sessions SET ${updates.join(", ")} WHERE chat_id = ?`,
    params
  );
  return getSession(chatId);
}
async function getOrCreateSession(chatId) {
  let session = await getSession(chatId);
  if (!session) {
    session = await createSession({ chatId, state: "idle", data: {} });
  }
  return session;
}

const DEFAULT_PERMISSIONS = {
  can_view_students: true,
  can_view_schedule: true,
  can_view_certificates: true,
  can_request_certificates: true
};
function mapRowToRepresentative(row) {
  let accessGroups = null;
  if (row.access_groups) {
    try {
      accessGroups = JSON.parse(row.access_groups);
    } catch {
      accessGroups = null;
    }
  }
  let permissions = { ...DEFAULT_PERMISSIONS };
  if (row.permissions) {
    try {
      const parsed = JSON.parse(row.permissions);
      permissions = {
        can_view_students: parsed.can_view_students ?? true,
        can_view_schedule: parsed.can_view_schedule ?? true,
        can_view_certificates: parsed.can_view_certificates ?? true,
        can_request_certificates: parsed.can_request_certificates ?? true
      };
    } catch {
      permissions = { ...DEFAULT_PERMISSIONS };
    }
  }
  return {
    id: row.id,
    organizationId: row.organization_id,
    organizationName: row.organization_name,
    fullName: row.full_name,
    phone: row.phone,
    telegramChatId: row.telegram_chat_id,
    telegramUsername: row.telegram_username,
    status: row.status,
    accessGroups,
    permissions,
    notificationsEnabled: Boolean(row.notifications_enabled),
    canReceiveNotifications: Boolean(row.can_receive_notifications ?? true),
    lastActivityAt: row.last_activity_at,
    approvedBy: row.approved_by,
    approvedByName: row.approved_by_name,
    approvedAt: row.approved_at,
    blockedReason: row.blocked_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
async function getRepresentativesPaginated(params = {}) {
  const { page = 1, limit = 20, status, organizationId, search } = params;
  const conditions = [];
  const queryParams = [];
  if (status) {
    conditions.push("r.status = ?");
    queryParams.push(status);
  }
  if (organizationId) {
    conditions.push("r.organization_id = ?");
    queryParams.push(organizationId);
  }
  if (search) {
    conditions.push(
      "(r.full_name LIKE ? OR r.phone LIKE ? OR r.telegram_username LIKE ? OR o.name LIKE ?)"
    );
    const searchPattern = `%${search}%`;
    queryParams.push(
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern
    );
  }
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const countQuery = `
    SELECT COUNT(*) as total 
    FROM organization_representatives r
    LEFT JOIN organizations o ON r.organization_id = o.id
    ${whereClause}
  `;
  const countResult = await executeQuery(countQuery, queryParams);
  const total = countResult[0]?.total || 0;
  const offset = (page - 1) * limit;
  const dataQuery = `
    SELECT 
      r.*,
      o.name as organization_name,
      u.name as approved_by_name
    FROM organization_representatives r
    LEFT JOIN organizations o ON r.organization_id = o.id
    LEFT JOIN users u ON r.approved_by = u.id
    ${whereClause}
    ORDER BY 
      CASE r.status 
        WHEN 'pending' THEN 0 
        WHEN 'approved' THEN 1 
        WHEN 'blocked' THEN 2 
      END,
      r.created_at DESC
    LIMIT ? OFFSET ?
  `;
  const dataParams = [...queryParams, limit, offset];
  const rows = await executeQuery(dataQuery, dataParams);
  return {
    data: rows.map(mapRowToRepresentative),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}
async function getRepresentativeById(id) {
  const rows = await executeQuery(
    `SELECT 
      r.*,
      o.name as organization_name,
      u.name as approved_by_name
    FROM organization_representatives r
    LEFT JOIN organizations o ON r.organization_id = o.id
    LEFT JOIN users u ON r.approved_by = u.id
    WHERE r.id = ? LIMIT 1`,
    [id]
  );
  return rows.length > 0 ? mapRowToRepresentative(rows[0]) : null;
}
async function getRepresentativeByTelegramChatId(chatId) {
  const rows = await executeQuery(
    `SELECT 
      r.*,
      o.name as organization_name
    FROM organization_representatives r
    LEFT JOIN organizations o ON r.organization_id = o.id
    WHERE r.telegram_chat_id = ? LIMIT 1`,
    [chatId]
  );
  return rows.length > 0 ? mapRowToRepresentative(rows[0]) : null;
}
async function getPendingRepresentatives() {
  const rows = await executeQuery(
    `SELECT 
      r.*,
      o.name as organization_name
    FROM organization_representatives r
    LEFT JOIN organizations o ON r.organization_id = o.id
    WHERE r.status = 'pending'
    ORDER BY r.created_at ASC`
  );
  return rows.map(mapRowToRepresentative);
}
async function createRepresentative(data) {
  const id = v4();
  const now = /* @__PURE__ */ new Date();
  await executeQuery(
    `INSERT INTO organization_representatives 
      (id, organization_id, full_name, phone, telegram_chat_id, telegram_username, status, notifications_enabled, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', 1, ?, ?)`,
    [
      id,
      data.organizationId,
      data.fullName,
      data.phone,
      data.telegramChatId || null,
      data.telegramUsername || null,
      now,
      now
    ]
  );
  const representative = await getRepresentativeById(id);
  if (!representative) {
    throw new Error("Failed to create representative");
  }
  return representative;
}
async function updateRepresentative(id, data) {
  const updates = ["updated_at = ?"];
  const params = [/* @__PURE__ */ new Date()];
  if (data.fullName !== void 0) {
    updates.push("full_name = ?");
    params.push(data.fullName);
  }
  if (data.phone !== void 0) {
    updates.push("phone = ?");
    params.push(data.phone);
  }
  if (data.accessGroups !== void 0) {
    updates.push("access_groups = ?");
    params.push(data.accessGroups ? JSON.stringify(data.accessGroups) : null);
  }
  if (data.notificationsEnabled !== void 0) {
    updates.push("notifications_enabled = ?");
    params.push(data.notificationsEnabled ? 1 : 0);
  }
  if (data.canReceiveNotifications !== void 0) {
    updates.push("can_receive_notifications = ?");
    params.push(data.canReceiveNotifications ? 1 : 0);
  }
  if (data.permissions !== void 0) {
    updates.push("permissions = ?");
    params.push(JSON.stringify(data.permissions));
  }
  params.push(id);
  await executeQuery(
    `UPDATE organization_representatives SET ${updates.join(", ")} WHERE id = ?`,
    params
  );
  return getRepresentativeById(id);
}
async function approveRepresentative(id, approvedBy, accessGroups) {
  const now = /* @__PURE__ */ new Date();
  await executeQuery(
    `UPDATE organization_representatives 
     SET status = 'approved', 
         approved_by = ?, 
         approved_at = ?,
         access_groups = ?,
         blocked_reason = NULL,
         updated_at = ?
     WHERE id = ?`,
    [
      approvedBy,
      now,
      accessGroups ? JSON.stringify(accessGroups) : null,
      now,
      id
    ]
  );
  return getRepresentativeById(id);
}
async function blockRepresentative(id, blockedBy, reason) {
  const now = /* @__PURE__ */ new Date();
  await executeQuery(
    `UPDATE organization_representatives 
     SET status = 'blocked', 
         blocked_reason = ?,
         approved_by = ?,
         updated_at = ?
     WHERE id = ?`,
    [reason, blockedBy, now, id]
  );
  return getRepresentativeById(id);
}
async function unblockRepresentative(id, unblockedBy) {
  const now = /* @__PURE__ */ new Date();
  await executeQuery(
    `UPDATE organization_representatives 
     SET status = 'approved', 
         blocked_reason = NULL,
         approved_by = ?,
         updated_at = ?
     WHERE id = ?`,
    [unblockedBy, now, id]
  );
  return getRepresentativeById(id);
}
async function deleteRepresentative(id) {
  const result = await executeQuery(
    "DELETE FROM organization_representatives WHERE id = ?",
    [id]
  );
  return result.affectedRows > 0;
}
async function updateLastActivity(id) {
  await executeQuery(
    "UPDATE organization_representatives SET last_activity_at = ? WHERE id = ?",
    [/* @__PURE__ */ new Date(), id]
  );
}
async function getRepresentativeStats() {
  const rows = await executeQuery(
    `SELECT status, COUNT(*) as count 
     FROM organization_representatives 
     GROUP BY status`
  );
  const stats = {
    total: 0,
    pending: 0,
    approved: 0,
    blocked: 0
  };
  for (const row of rows) {
    stats[row.status] = row.count;
    stats.total += row.count;
  }
  return stats;
}

function mapRowToOrganization(row) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    nameUz: row.name_uz,
    nameEn: row.name_en,
    nameRu: row.name_ru,
    contactPhone: row.contact_phone,
    contactEmail: row.contact_email,
    address: row.address,
    description: row.description,
    isActive: Boolean(row.is_active),
    studentsCount: row.students_count || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
function generateCodeFromName(name) {
  return name.toLowerCase().replace(/[^a-zа-яё0-9\s]/gi, "").replace(/\s+/g, "_").substring(0, 100) || v4().substring(0, 8);
}
async function getAllOrganizations() {
  const rows = await executeQuery(
    "SELECT * FROM organizations ORDER BY name ASC"
  );
  return rows.map(mapRowToOrganization);
}
async function getOrganizationsPaginated(params = {}) {
  const { page = 1, limit = 20, filters = {} } = params;
  const offset = (page - 1) * limit;
  const { search, isActive } = filters;
  const conditions = [];
  const queryParams = [];
  if (search) {
    conditions.push(
      "(name LIKE ? OR name_uz LIKE ? OR name_en LIKE ? OR name_ru LIKE ? OR code LIKE ?)"
    );
    const searchPattern = `%${search}%`;
    queryParams.push(
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern,
      searchPattern
    );
  }
  if (isActive !== void 0) {
    conditions.push("is_active = ?");
    queryParams.push(isActive);
  }
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const countQuery = `SELECT COUNT(*) as total FROM organizations ${whereClause}`;
  const countResult = await executeQuery(countQuery, queryParams);
  const total = countResult[0]?.total || 0;
  const dataQuery = `
    SELECT * FROM organizations 
    ${whereClause}
    ORDER BY name ASC
    LIMIT ? OFFSET ?
  `;
  const rows = await executeQuery(dataQuery, [
    ...queryParams,
    limit,
    offset
  ]);
  return {
    data: rows.map(mapRowToOrganization),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}
async function getOrganizationById(id) {
  const rows = await executeQuery(
    "SELECT * FROM organizations WHERE id = ?",
    [id]
  );
  return rows.length > 0 ? mapRowToOrganization(rows[0]) : null;
}
async function getOrganizationByName(name) {
  const rows = await executeQuery(
    "SELECT * FROM organizations WHERE name = ?",
    [name.trim()]
  );
  return rows.length > 0 ? mapRowToOrganization(rows[0]) : null;
}
async function searchOrganizations(query, limit = 10) {
  const rows = await executeQuery(
    `SELECT * FROM organizations 
     WHERE name LIKE ? OR name_uz LIKE ? OR name_en LIKE ? OR name_ru LIKE ?
     ORDER BY name ASC
     LIMIT ?`,
    [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`, limit]
  );
  return rows.map(mapRowToOrganization);
}
async function organizationCodeExists(code, excludeId) {
  let query = "SELECT COUNT(*) as total FROM organizations WHERE code = ?";
  const params = [code];
  if (excludeId) {
    query += " AND id != ?";
    params.push(excludeId);
  }
  const result = await executeQuery(query, params);
  return (result[0]?.total || 0) > 0;
}
async function createOrganization(data) {
  const id = v4();
  const now = /* @__PURE__ */ new Date();
  let code = data.code?.trim();
  if (!code) {
    code = generateCodeFromName(data.name);
    let suffix = 0;
    let finalCode = code;
    while (await organizationCodeExists(finalCode)) {
      suffix++;
      finalCode = `${code}_${suffix}`;
    }
    code = finalCode;
  }
  await executeQuery(
    `INSERT INTO organizations 
     (id, code, name, name_uz, name_en, name_ru, contact_phone, contact_email, address, description, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      code,
      data.name.trim(),
      data.nameUz?.trim() || null,
      data.nameEn?.trim() || null,
      data.nameRu?.trim() || null,
      data.contactPhone?.trim() || null,
      data.contactEmail?.trim() || null,
      data.address?.trim() || null,
      data.description?.trim() || null,
      data.isActive !== false,
      now,
      now
    ]
  );
  const created = await getOrganizationById(id);
  if (!created) {
    throw new Error("Failed to create organization");
  }
  return created;
}
async function updateOrganization(id, data) {
  const existing = await getOrganizationById(id);
  if (!existing) {
    return null;
  }
  const updates = [];
  const params = [];
  if (data.code !== void 0) {
    updates.push("code = ?");
    params.push(data.code.trim());
  }
  if (data.name !== void 0) {
    updates.push("name = ?");
    params.push(data.name.trim());
  }
  if (data.nameUz !== void 0) {
    updates.push("name_uz = ?");
    params.push(data.nameUz?.trim() || null);
  }
  if (data.nameEn !== void 0) {
    updates.push("name_en = ?");
    params.push(data.nameEn?.trim() || null);
  }
  if (data.nameRu !== void 0) {
    updates.push("name_ru = ?");
    params.push(data.nameRu?.trim() || null);
  }
  if (data.contactPhone !== void 0) {
    updates.push("contact_phone = ?");
    params.push(data.contactPhone?.trim() || null);
  }
  if (data.contactEmail !== void 0) {
    updates.push("contact_email = ?");
    params.push(data.contactEmail?.trim() || null);
  }
  if (data.address !== void 0) {
    updates.push("address = ?");
    params.push(data.address?.trim() || null);
  }
  if (data.description !== void 0) {
    updates.push("description = ?");
    params.push(data.description?.trim() || null);
  }
  if (data.isActive !== void 0) {
    updates.push("is_active = ?");
    params.push(data.isActive);
  }
  if (updates.length === 0) {
    return existing;
  }
  updates.push("updated_at = ?");
  params.push(/* @__PURE__ */ new Date());
  params.push(id);
  await executeQuery(
    `UPDATE organizations SET ${updates.join(", ")} WHERE id = ?`,
    params
  );
  return getOrganizationById(id);
}
async function deleteOrganization(id) {
  const studentsCount = await executeQuery(
    "SELECT COUNT(*) as total FROM students WHERE organization_id = ?",
    [id]
  );
  if ((studentsCount[0]?.total || 0) > 0) {
    throw new Error("\u041D\u0435\u0432\u043E\u0437\u043C\u043E\u0436\u043D\u043E \u0443\u0434\u0430\u043B\u0438\u0442\u044C \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044E: \u0435\u0441\u0442\u044C \u0441\u0432\u044F\u0437\u0430\u043D\u043D\u044B\u0435 \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0438");
  }
  const result = await executeQuery(
    "DELETE FROM organizations WHERE id = ?",
    [id]
  );
  return result.affectedRows > 0;
}
async function getOrCreateOrganizationByName(name, names) {
  const trimmedName = name.trim();
  const existing = await getOrganizationByName(trimmedName);
  if (existing) {
    return existing;
  }
  return createOrganization({
    name: trimmedName,
    nameUz: names?.nameUz,
    nameEn: names?.nameEn,
    nameRu: names?.nameRu
  });
}
async function updateStudentsCount(organizationId) {
  await executeQuery(
    `UPDATE organizations 
     SET students_count = (SELECT COUNT(*) FROM students WHERE organization_id = ?)
     WHERE id = ?`,
    [organizationId, organizationId]
  );
}
async function getOrganizationsStats() {
  const stats = await executeQuery(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
      SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive,
      SUM(CASE WHEN students_count > 0 THEN 1 ELSE 0 END) as with_students
    FROM organizations
  `);
  const row = stats[0];
  return {
    total: row?.total || 0,
    active: row?.active || 0,
    inactive: row?.inactive || 0,
    withStudents: row?.with_students || 0
  };
}

const organizationRepository = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  createOrganization: createOrganization,
  deleteOrganization: deleteOrganization,
  getAllOrganizations: getAllOrganizations,
  getOrCreateOrganizationByName: getOrCreateOrganizationByName,
  getOrganizationById: getOrganizationById,
  getOrganizationByName: getOrganizationByName,
  getOrganizationsPaginated: getOrganizationsPaginated,
  getOrganizationsStats: getOrganizationsStats,
  organizationCodeExists: organizationCodeExists,
  searchOrganizations: searchOrganizations,
  updateOrganization: updateOrganization,
  updateStudentsCount: updateStudentsCount
}, Symbol.toStringTag, { value: 'Module' }));

async function handleUpdate(update) {
  try {
    if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
      return;
    }
    if (update.message) {
      await handleMessage(update.message);
      return;
    }
    console.log("[TelegramBot] \u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0439 \u0442\u0438\u043F \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F:", update);
  } catch (error) {
    console.error("[TelegramBot] \u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F:", error);
  }
}
async function handleMessage(message) {
  const chatId = String(message.chat.id);
  const text = message.text?.trim() || "";
  const username = message.from?.username || null;
  console.log(`[TelegramBot] \u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u043E\u0442 ${chatId}: ${text}`);
  const rateLimit = rateLimiter.check(chatId);
  if (!rateLimit.allowed) {
    const blockDuration = formatBlockDuration(rateLimit.resetAt);
    await sendMessage(
      chatId,
      `\u26A0\uFE0F *\u0421\u043B\u0438\u0448\u043A\u043E\u043C \u043C\u043D\u043E\u0433\u043E \u0437\u0430\u043F\u0440\u043E\u0441\u043E\u0432!*

\u0412\u044B \u043F\u0440\u0435\u0432\u044B\u0441\u0438\u043B\u0438 \u043B\u0438\u043C\u0438\u0442 \u0437\u0430\u043F\u0440\u043E\u0441\u043E\u0432 \u043A \u0431\u043E\u0442\u0443.

\u{1F512} \u0414\u043E\u0441\u0442\u0443\u043F \u0432\u0440\u0435\u043C\u0435\u043D\u043D\u043E \u043E\u0433\u0440\u0430\u043D\u0438\u0447\u0435\u043D.
\u23F1 \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0441\u043D\u043E\u0432\u0430 \u0447\u0435\u0440\u0435\u0437: *${blockDuration}*

_\u041F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430, \u043D\u0435 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u044F\u0439\u0442\u0435 \u043A\u043E\u043C\u0430\u043D\u0434\u044B \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u0447\u0430\u0441\u0442\u043E._`
    );
    return;
  }
  if (rateLimit.isWarning) {
    await sendMessage(
      chatId,
      `\u26A0\uFE0F *\u0412\u043D\u0438\u043C\u0430\u043D\u0438\u0435!*

\u0412\u044B \u043F\u0440\u0438\u0431\u043B\u0438\u0436\u0430\u0435\u0442\u0435\u0441\u044C \u043A \u043B\u0438\u043C\u0438\u0442\u0443 \u0437\u0430\u043F\u0440\u043E\u0441\u043E\u0432.
\u041E\u0441\u0442\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u043F\u0440\u043E\u0441\u043E\u0432: *${rateLimit.remaining}*

_\u041F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430, \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435 \u043A\u043E\u043C\u0430\u043D\u0434\u044B \u0443\u043C\u0435\u0440\u0435\u043D\u043D\u043E._`
    );
  }
  if (text.startsWith("/")) {
    await handleCommand(chatId, text, username);
    return;
  }
  if (message.contact) {
    await handleContactMessage(chatId, message.contact.phone_number);
    return;
  }
  await handleTextMessage(chatId, text);
}
async function handleCommand(chatId, command, username) {
  const parts = command.split("@");
  const cleanCommand = (parts[0] || command).toLowerCase();
  switch (cleanCommand) {
    case "/start":
      await commandStart(chatId, username);
      break;
    case "/status":
      await commandStatus(chatId);
      break;
    case "/students":
      await commandStudents(chatId);
      break;
    case "/schedule":
      await commandSchedule(chatId);
      break;
    case "/certificates":
      await commandCertificates(chatId);
      break;
    case "/help":
      await commandHelp(chatId);
      break;
    default:
      await sendMessage(chatId, BOT_MESSAGES.HELP);
  }
}
async function commandStart(chatId, username) {
  const representative = await getRepresentativeByTelegramChatId(chatId);
  if (representative) {
    await sendMessage(chatId, BOT_MESSAGES.ALREADY_REGISTERED);
    await commandStatus(chatId);
    return;
  }
  await getOrCreateSession(chatId);
  await sendMessage(chatId, BOT_MESSAGES.WELCOME);
  await updateSession(chatId, {
    state: "awaiting_name",
    data: { username }
  });
  await sendMessage(chatId, BOT_MESSAGES.ASK_NAME);
  console.log(`[TelegramBot] \u041D\u0430\u0447\u0430\u0442\u0430 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044F \u0434\u043B\u044F chatId: ${chatId}`);
}
async function commandStatus(chatId) {
  const representative = await getRepresentativeByTelegramChatId(chatId);
  if (!representative) {
    const session = await getOrCreateSession(chatId);
    if (session.state === "pending_approval") {
      await sendMessage(chatId, BOT_MESSAGES.STATUS_PENDING);
    } else {
      await sendMessage(chatId, BOT_MESSAGES.ERROR_NOT_REGISTERED);
    }
    return;
  }
  switch (representative.status) {
    case "pending":
      await sendMessage(chatId, BOT_MESSAGES.STATUS_PENDING);
      break;
    case "approved":
      await sendMessage(chatId, BOT_MESSAGES.STATUS_APPROVED);
      await updateLastActivity(representative.id);
      break;
    case "blocked":
      await sendMessage(
        chatId,
        BOT_MESSAGES.STATUS_BLOCKED(representative.blockedReason || "")
      );
      break;
  }
}
async function commandStudents(chatId) {
  const startTime = Date.now();
  const representative = await getRepresentativeByTelegramChatId(chatId);
  if (!representative || representative.status !== "approved") {
    await sendMessage(chatId, BOT_MESSAGES.ERROR_NO_PERMISSION);
    return;
  }
  if (!representative.permissions.can_view_students) {
    await sendMessage(
      chatId,
      "\u{1F6AB} *\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0430*\n\n\u0423 \u0432\u0430\u0441 \u043D\u0435\u0442 \u0440\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u0438\u044F \u043D\u0430 \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440 \u0441\u043F\u0438\u0441\u043A\u0430 \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0435\u0439. \u041E\u0431\u0440\u0430\u0442\u0438\u0442\u0435\u0441\u044C \u043A \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0443 \u0443\u0447\u0435\u0431\u043D\u043E\u0433\u043E \u0446\u0435\u043D\u0442\u0440\u0430."
    );
    const { logBotRequest } = await import('./botLogger.mjs');
    await logBotRequest({
      representativeId: representative.id,
      chatId,
      command: "/students",
      status: "denied",
      errorMessage: "\u041D\u0435\u0442 \u0440\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u0438\u044F can_view_students",
      responseTimeMs: Date.now() - startTime
    });
    return;
  }
  try {
    const cacheKey = CacheKeys.students(representative.organizationId);
    let students = botCache.get(cacheKey);
    if (!students) {
      console.log(`[TelegramBot] Cache MISS \u0434\u043B\u044F students: ${representative.organizationId}`);
      students = await getStudentsForRepresentative(representative);
      botCache.set(cacheKey, students);
    } else {
      console.log(`[TelegramBot] Cache HIT \u0434\u043B\u044F students: ${representative.organizationId}`);
    }
    if (students.length === 0) {
      await sendMessage(chatId, BOT_MESSAGES.NO_STUDENTS);
      return;
    }
    const courses = /* @__PURE__ */ new Set();
    for (const student of students) {
      if (student.courseName) {
        courses.add(student.courseName);
      }
    }
    const sortedCourses = Array.from(courses).slice(0, 6);
    const { InlineKeyboard } = await import('grammy');
    const keyboard = new InlineKeyboard();
    keyboard.text("\u{1F4CB} \u0412\u0441\u0435 \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0438", "stc_all");
    keyboard.row();
    for (let i = 0; i < sortedCourses.length; i++) {
      const course = sortedCourses[i];
      const shortName = course.length > 25 ? course.substring(0, 22) + "..." : course;
      keyboard.text(`\u{1F4DA} ${shortName}`, `stc_${i}`);
      keyboard.row();
    }
    await updateSession(chatId, {
      data: { coursesList: sortedCourses }
    });
    await sendMessage(
      chatId,
      "\u{1F465} *\u0421\u043F\u0438\u0441\u043E\u043A \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0435\u0439*\n\n\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043A\u0443\u0440\u0441 \u0434\u043B\u044F \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0430:",
      { replyMarkup: keyboard }
    );
    await updateLastActivity(representative.id);
    const { logBotRequest } = await import('./botLogger.mjs');
    await logBotRequest({
      representativeId: representative.id,
      chatId,
      command: "/students",
      status: "success",
      requestData: {
        studentsCount: students.length,
        coursesCount: courses.size,
        cached: students === botCache.get(cacheKey)
        // Был ли запрос из кэша
      },
      responseTimeMs: Date.now() - startTime
    });
    console.log(
      `[TelegramBot] \u0421\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0438: \u043F\u043E\u043A\u0430\u0437\u0430\u043D\u044B \u043A\u0443\u0440\u0441\u044B (${courses.size}) \u0434\u043B\u044F chatId: ${chatId}`
    );
  } catch (error) {
    console.error("[TelegramBot] \u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u043E\u0432:", error);
    await sendMessage(chatId, BOT_MESSAGES.ERROR_GENERAL);
    const { logBotRequest } = await import('./botLogger.mjs');
    await logBotRequest({
      representativeId: representative.id,
      chatId,
      command: "/students",
      status: "error",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      responseTimeMs: Date.now() - startTime
    });
  }
}
async function commandSchedule(chatId) {
  const startTime = Date.now();
  const representative = await getRepresentativeByTelegramChatId(chatId);
  if (!representative || representative.status !== "approved") {
    await sendMessage(chatId, BOT_MESSAGES.ERROR_NO_PERMISSION);
    return;
  }
  if (!representative.permissions.can_view_schedule) {
    await sendMessage(
      chatId,
      "\u{1F6AB} *\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0430*\n\n\u0423 \u0432\u0430\u0441 \u043D\u0435\u0442 \u0440\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u0438\u044F \u043D\u0430 \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440 \u0440\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u044F. \u041E\u0431\u0440\u0430\u0442\u0438\u0442\u0435\u0441\u044C \u043A \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0443 \u0443\u0447\u0435\u0431\u043D\u043E\u0433\u043E \u0446\u0435\u043D\u0442\u0440\u0430."
    );
    const { logBotRequest } = await import('./botLogger.mjs');
    await logBotRequest({
      representativeId: representative.id,
      chatId,
      command: "/schedule",
      status: "denied",
      errorMessage: "\u041D\u0435\u0442 \u0440\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u0438\u044F can_view_schedule",
      responseTimeMs: Date.now() - startTime
    });
    return;
  }
  try {
    const cacheKey = CacheKeys.schedule(representative.organizationId);
    let schedule = botCache.get(cacheKey);
    if (!schedule) {
      console.log(`[TelegramBot] Cache MISS \u0434\u043B\u044F schedule: ${representative.organizationId}`);
      schedule = await getScheduleForRepresentative(representative);
      botCache.set(cacheKey, schedule);
    } else {
      console.log(`[TelegramBot] Cache HIT \u0434\u043B\u044F schedule: ${representative.organizationId}`);
    }
    const message = formatSchedule(schedule);
    await sendMessage(chatId, message);
    await updateLastActivity(representative.id);
    const { logBotRequest } = await import('./botLogger.mjs');
    await logBotRequest({
      representativeId: representative.id,
      chatId,
      command: "/schedule",
      status: "success",
      requestData: {
        eventsCount: schedule.length,
        cached: schedule === botCache.get(cacheKey)
      },
      responseTimeMs: Date.now() - startTime
    });
  } catch (error) {
    console.error("[TelegramBot] \u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0440\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u044F:", error);
    await sendMessage(chatId, BOT_MESSAGES.ERROR_GENERAL);
    const { logBotRequest } = await import('./botLogger.mjs');
    await logBotRequest({
      representativeId: representative.id,
      chatId,
      command: "/schedule",
      status: "error",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      responseTimeMs: Date.now() - startTime
    });
  }
}
async function commandCertificates(chatId) {
  const startTime = Date.now();
  const representative = await getRepresentativeByTelegramChatId(chatId);
  if (!representative || representative.status !== "approved") {
    await sendMessage(chatId, BOT_MESSAGES.ERROR_NO_PERMISSION);
    return;
  }
  if (!representative.permissions.can_view_certificates) {
    await sendMessage(
      chatId,
      "\u{1F6AB} *\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0430*\n\n\u0423 \u0432\u0430\u0441 \u043D\u0435\u0442 \u0440\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u0438\u044F \u043D\u0430 \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432. \u041E\u0431\u0440\u0430\u0442\u0438\u0442\u0435\u0441\u044C \u043A \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0443 \u0443\u0447\u0435\u0431\u043D\u043E\u0433\u043E \u0446\u0435\u043D\u0442\u0440\u0430."
    );
    const { logBotRequest } = await import('./botLogger.mjs');
    await logBotRequest({
      representativeId: representative.id,
      chatId,
      command: "/certificates",
      status: "denied",
      errorMessage: "\u041D\u0435\u0442 \u0440\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u0438\u044F can_view_certificates",
      responseTimeMs: Date.now() - startTime
    });
    return;
  }
  try {
    const cacheKey = CacheKeys.certificates(representative.organizationId);
    let certificates = botCache.get(cacheKey);
    if (!certificates) {
      console.log(`[TelegramBot] Cache MISS \u0434\u043B\u044F certificates: ${representative.organizationId}`);
      certificates = await getCertificatesForRepresentative(representative);
      botCache.set(cacheKey, certificates);
    } else {
      console.log(`[TelegramBot] Cache HIT \u0434\u043B\u044F certificates: ${representative.organizationId}`);
    }
    if (certificates.length === 0) {
      await sendMessage(chatId, BOT_MESSAGES.NO_CERTIFICATES);
      return;
    }
    const periods = /* @__PURE__ */ new Set();
    for (const cert of certificates) {
      if (cert.issueDate) {
        const parts = cert.issueDate.split(".");
        if (parts.length === 3) {
          const month = parts[1];
          const year = parts[2];
          periods.add(`${month}.${year}`);
        }
      }
    }
    const sortedPeriods = Array.from(periods).sort((a, b) => {
      const [aMonth, aYear] = a.split(".").map(Number);
      const [bMonth, bYear] = b.split(".").map(Number);
      if (aYear !== bYear) return bYear - aYear;
      return bMonth - aMonth;
    });
    const { InlineKeyboard } = await import('grammy');
    const keyboard = new InlineKeyboard();
    keyboard.text("\u{1F4CB} \u0412\u0441\u0435 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u044B", "certs_period_all");
    keyboard.row();
    let buttonsInRow = 0;
    for (const period of sortedPeriods.slice(0, 6)) {
      keyboard.text(`\u{1F4C5} ${period}`, `certs_period_${period}`);
      buttonsInRow++;
      if (buttonsInRow >= 3) {
        keyboard.row();
        buttonsInRow = 0;
      }
    }
    await sendMessage(
      chatId,
      "\u{1F4DC} *\u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u044B \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0435\u0439*\n\n\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043F\u0435\u0440\u0438\u043E\u0434 \u0434\u043B\u044F \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0430 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432:",
      { replyMarkup: keyboard }
    );
    await updateLastActivity(representative.id);
    const { logBotRequest } = await import('./botLogger.mjs');
    await logBotRequest({
      representativeId: representative.id,
      chatId,
      command: "/certificates",
      status: "success",
      requestData: {
        certificatesCount: certificates.length,
        periodsCount: sortedPeriods.length,
        cached: certificates === botCache.get(cacheKey)
      },
      responseTimeMs: Date.now() - startTime
    });
    console.log(
      `[TelegramBot] \u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u044B: \u043F\u043E\u043A\u0430\u0437\u0430\u043D\u044B \u043F\u0435\u0440\u0438\u043E\u0434\u044B (${sortedPeriods.length}) \u0434\u043B\u044F chatId: ${chatId}`
    );
  } catch (error) {
    console.error("[TelegramBot] \u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432:", error);
    await sendMessage(chatId, BOT_MESSAGES.ERROR_GENERAL);
    const { logBotRequest } = await import('./botLogger.mjs');
    await logBotRequest({
      representativeId: representative.id,
      chatId,
      command: "/certificates",
      status: "error",
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      responseTimeMs: Date.now() - startTime
    });
  }
}
async function commandHelp(chatId) {
  await sendMessage(chatId, BOT_MESSAGES.HELP);
}
async function handleTextMessage(chatId, text, username) {
  const session = await getOrCreateSession(chatId);
  switch (session.state) {
    case "awaiting_name":
      await handleNameInput(chatId, text, session.data);
      break;
    case "awaiting_phone":
      await handlePhoneInput(chatId, text, session.data);
      break;
    case "awaiting_organization":
      await handleOrganizationInput(chatId, text, session.data);
      break;
    case "pending_approval":
      await sendMessage(chatId, BOT_MESSAGES.STATUS_PENDING);
      break;
    case "completed":
    case "idle":
    default:
      await sendMessage(chatId, BOT_MESSAGES.HELP);
  }
}
async function handleNameInput(chatId, name, sessionData) {
  if (!validateName(name)) {
    await sendMessage(chatId, BOT_MESSAGES.INVALID_NAME);
    return;
  }
  await updateSession(chatId, {
    state: "awaiting_phone",
    data: { ...sessionData, fullName: name.trim() }
  });
  await sendMessageWithContactButton(chatId, BOT_MESSAGES.ASK_PHONE);
  console.log(`[TelegramBot] chatId ${chatId}: \u0424\u0418\u041E \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u043E - ${name}`);
}
async function handlePhoneInput(chatId, phone, sessionData) {
  const normalized = normalizePhone(phone);
  if (!validatePhone(normalized)) {
    await sendMessage(chatId, BOT_MESSAGES.INVALID_PHONE);
    return;
  }
  await updateSession(chatId, {
    state: "awaiting_organization",
    data: { ...sessionData, phone: normalized }
  });
  const organizations = await getAllOrganizations();
  if (organizations.length > 0) {
    const topOrganizations = organizations.slice(0, 10).map((org) => ({
      id: org.id,
      name: org.name.length > 30 ? org.name.substring(0, 27) + "..." : org.name
    }));
    const keyboard = createOrganizationsKeyboard(topOrganizations);
    await sendMessage(chatId, BOT_MESSAGES.ASK_ORGANIZATION, {
      replyMarkup: keyboard
    });
  } else {
    await sendMessage(chatId, BOT_MESSAGES.ASK_ORGANIZATION);
  }
  console.log(
    `[TelegramBot] chatId ${chatId}: \u0442\u0435\u043B\u0435\u0444\u043E\u043D \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D - ${normalized}`
  );
}
async function handleContactMessage(chatId, phoneNumber, username) {
  const session = await getOrCreateSession(chatId);
  if (session.state !== "awaiting_phone") {
    return;
  }
  const normalized = normalizePhone(phoneNumber);
  await handlePhoneInput(chatId, normalized, session.data);
}
async function handleOrganizationInput(chatId, organizationName, sessionData) {
  try {
    const organization = await getOrCreateOrganizationByName(organizationName);
    await createRepresentativeFromSession(chatId, sessionData, organization.id);
    console.log(
      `[TelegramBot] chatId ${chatId}: \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F \u0432\u044B\u0431\u0440\u0430\u043D\u0430 - ${organization.name}`
    );
  } catch (error) {
    console.error("[TelegramBot] \u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u043F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u0438\u0442\u0435\u043B\u044F:", error);
    await sendMessage(chatId, BOT_MESSAGES.ERROR_GENERAL);
  }
}
async function handleCallbackQuery(query) {
  const chatId = String(query.from.id);
  const data = query.data || "";
  console.log(`[TelegramBot] Callback \u043E\u0442 ${chatId}: ${data}`);
  const rateLimit = rateLimiter.check(chatId);
  if (!rateLimit.allowed) {
    const bot = getBot();
    if (bot) {
      await bot.api.answerCallbackQuery(query.id, {
        text: `\u26A0\uFE0F \u0421\u043B\u0438\u0448\u043A\u043E\u043C \u043C\u043D\u043E\u0433\u043E \u0437\u0430\u043F\u0440\u043E\u0441\u043E\u0432! \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0447\u0435\u0440\u0435\u0437 ${formatBlockDuration(rateLimit.resetAt)}`,
        show_alert: true
      });
    }
    return;
  }
  if (rateLimit.isWarning) {
    const bot = getBot();
    if (bot) {
      await bot.api.answerCallbackQuery(query.id, {
        text: `\u26A0\uFE0F \u041E\u0441\u0442\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u043F\u0440\u043E\u0441\u043E\u0432: ${rateLimit.remaining}`,
        show_alert: false
      });
    }
  } else {
    const bot = getBot();
    if (bot) {
      await bot.api.answerCallbackQuery(query.id);
    }
  }
  if (data.startsWith("org_")) {
    const organizationId = data.substring(4);
    await handleOrganizationSelection(chatId, organizationId);
    return;
  }
  if (data === "get_all_certs") {
    await handleSendAllCertificates(chatId);
    return;
  }
  if (data.startsWith("get_cert_")) {
    const certificateId = data.substring(9);
    await handleSendCertificate(chatId, certificateId);
    return;
  }
  if (data.startsWith("certs_period_")) {
    const period = data.substring(13);
    await handleCertificatesPeriodSelection(chatId, period);
    return;
  }
  if (data.startsWith("get_zip_certs_")) {
    const period = data.substring(14);
    await handleSendCertificatesArchive(chatId, period);
    return;
  }
  if (data.startsWith("stc_")) {
    const courseIndex = data.substring(4);
    await handleStudentsCourseSelection(chatId, courseIndex);
    return;
  }
  if (data.startsWith("stp_")) {
    const parts = data.substring(4).split("_");
    const courseIndex = parts[0];
    const period = parts.slice(1).join("_");
    await handleStudentsPeriodSelection(chatId, courseIndex, period);
    return;
  }
  if (data === "certs_back") {
    await commandCertificates(chatId);
    return;
  }
  if (data === "stb") {
    await commandStudents(chatId);
    return;
  }
}
async function handleOrganizationSelection(chatId, organizationId) {
  const session = await getOrCreateSession(chatId);
  if (session.state !== "awaiting_organization") {
    return;
  }
  try {
    const organization = await getOrganizationById(organizationId);
    if (!organization) {
      await sendMessage(chatId, BOT_MESSAGES.ERROR_GENERAL);
      return;
    }
    await createRepresentativeFromSession(
      chatId,
      session.data,
      organization.id
    );
    console.log(
      `[TelegramBot] chatId ${chatId}: \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F \u0432\u044B\u0431\u0440\u0430\u043D\u0430 \u043F\u043E ID - ${organization.name}`
    );
  } catch (error) {
    console.error("[TelegramBot] \u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0432\u044B\u0431\u043E\u0440\u0435 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438:", error);
    await sendMessage(chatId, BOT_MESSAGES.ERROR_GENERAL);
  }
}
async function handleSendAllCertificates(chatId) {
  const representative = await getRepresentativeByTelegramChatId(chatId);
  if (!representative || representative.status !== "approved") {
    await sendMessage(chatId, BOT_MESSAGES.ERROR_NO_PERMISSION);
    return;
  }
  if (!representative.permissions.can_request_certificates) {
    await sendMessage(
      chatId,
      "\u{1F6AB} *\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0430*\n\n\u0423 \u0432\u0430\u0441 \u043D\u0435\u0442 \u0440\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u0438\u044F \u043D\u0430 \u0437\u0430\u043F\u0440\u043E\u0441 \u0444\u0430\u0439\u043B\u043E\u0432 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432. \u041E\u0431\u0440\u0430\u0442\u0438\u0442\u0435\u0441\u044C \u043A \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0443 \u0443\u0447\u0435\u0431\u043D\u043E\u0433\u043E \u0446\u0435\u043D\u0442\u0440\u0430."
    );
    return;
  }
  try {
    await sendMessage(chatId, BOT_MESSAGES.CERTIFICATE_REQUEST_RECEIVED);
    const certificates = await getCertificatesForRepresentative(representative);
    const issuedCerts = certificates.filter(
      (c) => c.status === "issued" && c.pdfFileUrl
    );
    if (issuedCerts.length === 0) {
      await sendMessage(chatId, BOT_MESSAGES.NO_CERTIFICATES);
      return;
    }
    const certsToSend = issuedCerts.slice(0, 10);
    let sentCount = 0;
    const bot = getBot();
    if (!bot) {
      await sendMessage(chatId, BOT_MESSAGES.ERROR_GENERAL);
      return;
    }
    for (const cert of certsToSend) {
      try {
        if (cert.pdfFileUrl) {
          const fs = await import('fs');
          const path = await import('path');
          let filePath;
          if (cert.pdfFileUrl.startsWith("/storage/")) {
            filePath = path.join(process.cwd(), cert.pdfFileUrl.substring(1));
          } else if (cert.pdfFileUrl.startsWith("/")) {
            filePath = path.join(process.cwd(), "public", cert.pdfFileUrl);
          } else {
            filePath = path.join(process.cwd(), cert.pdfFileUrl);
          }
          if (!fs.existsSync(filePath)) {
            console.error(`[TelegramBot] \u0424\u0430\u0439\u043B \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D: ${filePath}`);
            await sendMessage(
              chatId,
              BOT_MESSAGES.CERTIFICATE_SEND_ERROR(cert.studentName)
            );
            continue;
          }
          await bot.api.sendDocument(
            chatId,
            new (await import('grammy')).InputFile(filePath),
            {
              caption: `\u{1F4DC} *\u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442*
${cert.studentName}
\u2116 ${cert.certificateNumber}
${cert.courseName}`,
              parse_mode: "Markdown"
            }
          );
          await markCertificateAsSent(cert.id);
          sentCount++;
        }
      } catch (error) {
        console.error(
          `[TelegramBot] \u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0438 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430 ${cert.id}:`,
          error
        );
        await sendMessage(
          chatId,
          BOT_MESSAGES.CERTIFICATE_SEND_ERROR(cert.studentName)
        );
      }
    }
    if (sentCount > 0) {
      await sendMessage(chatId, `\u2705 \u041E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E ${sentCount} \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432`);
      if (issuedCerts.length > 10) {
        await sendMessage(chatId, BOT_MESSAGES.CERTIFICATE_SENDING_LIMIT);
      }
    }
    await updateLastActivity(representative.id);
    console.log(
      `[TelegramBot] \u041E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E ${sentCount} \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432 \u0434\u043B\u044F chatId: ${chatId}`
    );
  } catch (error) {
    console.error("[TelegramBot] \u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0438 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432:", error);
    await sendMessage(chatId, BOT_MESSAGES.ERROR_GENERAL);
  }
}
async function handleSendCertificate(chatId, certificateId) {
  const representative = await getRepresentativeByTelegramChatId(chatId);
  if (!representative || representative.status !== "approved") {
    await sendMessage(chatId, BOT_MESSAGES.ERROR_NO_PERMISSION);
    return;
  }
  if (!representative.permissions.can_request_certificates) {
    await sendMessage(
      chatId,
      "\u{1F6AB} *\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0430*\n\n\u0423 \u0432\u0430\u0441 \u043D\u0435\u0442 \u0440\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u0438\u044F \u043D\u0430 \u0437\u0430\u043F\u0440\u043E\u0441 \u0444\u0430\u0439\u043B\u043E\u0432 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432."
    );
    return;
  }
  try {
    const { executeQuery } = await Promise.resolve().then(function () { return db; });
    const { getOrganizationById: getOrganizationById2 } = await Promise.resolve().then(function () { return organizationRepository; });
    const organization = await getOrganizationById2(
      representative.organizationId
    );
    if (!organization) {
      await sendMessage(chatId, BOT_MESSAGES.ERROR_GENERAL);
      return;
    }
    const certs = await executeQuery(
      `
      SELECT ic.*, s.full_name as student_name, s.organization, c.name as course_name
      FROM issued_certificates ic
      JOIN students s ON ic.student_id = s.id
      JOIN study_groups g ON ic.group_id = g.id
      JOIN courses c ON g.course_id = c.id
      WHERE ic.id = ? AND s.organization = ?
    `,
      [certificateId, organization.name]
    );
    if (certs.length === 0) {
      await sendMessage(
        chatId,
        "\u274C \u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u0438\u043B\u0438 \u043D\u0435 \u043F\u0440\u0438\u043D\u0430\u0434\u043B\u0435\u0436\u0438\u0442 \u0432\u0430\u0448\u0435\u0439 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438"
      );
      return;
    }
    const cert = certs[0];
    if (!cert.pdf_file_url) {
      await sendMessage(
        chatId,
        BOT_MESSAGES.CERTIFICATE_SEND_ERROR(cert.student_name)
      );
      return;
    }
    const bot = getBot();
    if (!bot) {
      await sendMessage(chatId, BOT_MESSAGES.ERROR_GENERAL);
      return;
    }
    const fs = await import('fs');
    const path = await import('path');
    let filePath;
    if (cert.pdf_file_url.startsWith("/storage/")) {
      filePath = path.join(process.cwd(), cert.pdf_file_url.substring(1));
    } else if (cert.pdf_file_url.startsWith("/")) {
      filePath = path.join(process.cwd(), "public", cert.pdf_file_url);
    } else {
      filePath = path.join(process.cwd(), cert.pdf_file_url);
    }
    if (!fs.existsSync(filePath)) {
      console.error(`[TelegramBot] \u0424\u0430\u0439\u043B \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D: ${filePath}`);
      await sendMessage(
        chatId,
        BOT_MESSAGES.CERTIFICATE_SEND_ERROR(cert.student_name)
      );
      return;
    }
    await bot.api.sendDocument(
      chatId,
      new (await import('grammy')).InputFile(filePath),
      {
        caption: `\u{1F4DC} *\u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442*
${cert.student_name}
\u2116 ${cert.certificate_number}
${cert.course_name}`,
        parse_mode: "Markdown"
      }
    );
    await markCertificateAsSent(certificateId);
    await sendMessage(
      chatId,
      BOT_MESSAGES.CERTIFICATE_SENT(cert.student_name, cert.certificate_number)
    );
    await updateLastActivity(representative.id);
    console.log(
      `[TelegramBot] \u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 ${certificateId} \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D \u0434\u043B\u044F chatId: ${chatId}`
    );
  } catch (error) {
    console.error("[TelegramBot] \u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0438 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430:", error);
    await sendMessage(chatId, BOT_MESSAGES.ERROR_GENERAL);
  }
}
async function markCertificateAsSent(certificateId) {
  try {
    const { executeQuery } = await Promise.resolve().then(function () { return db; });
    await executeQuery(
      "UPDATE issued_certificates SET is_sent_via_telegram = 1, sent_at = ? WHERE id = ?",
      [/* @__PURE__ */ new Date(), certificateId]
    );
  } catch (error) {
    console.error("[TelegramBot] \u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u0441\u0442\u0430\u0442\u0443\u0441\u0430 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0438:", error);
  }
}
async function handleCertificatesPeriodSelection(chatId, period) {
  const representative = await getRepresentativeByTelegramChatId(chatId);
  if (!representative || representative.status !== "approved") {
    await sendMessage(chatId, BOT_MESSAGES.ERROR_NO_PERMISSION);
    return;
  }
  try {
    let certificates = await getCertificatesForRepresentative(representative);
    if (period !== "all") {
      const [monthStr, yearStr] = period.split(".");
      certificates = certificates.filter((cert) => {
        if (!cert.issueDate) return false;
        const parts = cert.issueDate.split(".");
        if (parts.length !== 3) return false;
        const certMonth = parts[1];
        const certYear = parts[2];
        return certMonth === monthStr && certYear === yearStr;
      });
    }
    const message = formatCertificatesList(certificates);
    if (certificates.length > 0 && representative.permissions.can_request_certificates) {
      const { InlineKeyboard } = await import('grammy');
      const keyboard = new InlineKeyboard();
      keyboard.text("\u{1F4E5} \u041F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u0432\u0441\u0435 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u044B (\u0441\u043F\u0438\u0441\u043A\u043E\u043C)", "get_all_certs");
      keyboard.row();
      keyboard.text("\u{1F4E6} \u0421\u043A\u0430\u0447\u0430\u0442\u044C \u0430\u0440\u0445\u0438\u0432\u043E\u043C (ZIP)", `get_zip_certs_${period}`);
      const issuedCerts = certificates.filter(
        (c) => c.status === "issued" && c.pdfFileUrl
      );
      for (const cert of issuedCerts.slice(0, 5)) {
        keyboard.row();
        keyboard.text(`\u{1F4DC} ${cert.certificateNumber}`, `get_cert_${cert.id}`);
      }
      keyboard.row();
      keyboard.text("\u25C0\uFE0F \u041D\u0430\u0437\u0430\u0434 \u043A \u0432\u044B\u0431\u043E\u0440\u0443 \u043F\u0435\u0440\u0438\u043E\u0434\u0430", "certs_back");
      await sendMessage(chatId, message, { replyMarkup: keyboard });
    } else {
      await sendMessage(chatId, message);
    }
    await updateLastActivity(representative.id);
    console.log(
      `[TelegramBot] \u041F\u043E\u043A\u0430\u0437\u0430\u043D\u044B \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u044B \u0437\u0430 \u043F\u0435\u0440\u0438\u043E\u0434 ${period} \u0434\u043B\u044F chatId: ${chatId}, \u043D\u0430\u0439\u0434\u0435\u043D\u043E: ${certificates.length}`
    );
  } catch (error) {
    console.error("[TelegramBot] \u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432:", error);
    await sendMessage(chatId, BOT_MESSAGES.ERROR_GENERAL);
  }
}
async function handleStudentsCourseSelection(chatId, courseIndex) {
  const representative = await getRepresentativeByTelegramChatId(chatId);
  if (!representative || representative.status !== "approved") {
    await sendMessage(chatId, BOT_MESSAGES.ERROR_NO_PERMISSION);
    return;
  }
  try {
    const students = await getStudentsForRepresentative(representative);
    let courseName = null;
    if (courseIndex !== "all") {
      const session = await getOrCreateSession(chatId);
      const coursesList = session.data?.coursesList;
      const idx = parseInt(courseIndex, 10);
      if (coursesList && !isNaN(idx) && idx >= 0 && idx < coursesList.length) {
        courseName = coursesList[idx];
      }
    }
    let filteredStudents = students;
    if (courseName) {
      filteredStudents = students.filter((s) => s.courseName === courseName);
    }
    if (filteredStudents.length === 0) {
      await sendMessage(
        chatId,
        "\u{1F4CB} \u0421\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0438 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B \u0434\u043B\u044F \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u043E\u0433\u043E \u043A\u0443\u0440\u0441\u0430."
      );
      return;
    }
    const periods = /* @__PURE__ */ new Set();
    for (const student of filteredStudents) {
      if (student.startDate) {
        const parts = student.startDate.split(".");
        if (parts.length === 3) {
          const month = parts[1];
          const year = parts[2];
          periods.add(`${month}.${year}`);
        }
      }
    }
    const sortedPeriods = Array.from(periods).sort((a, b) => {
      const [aMonth, aYear] = a.split(".").map(Number);
      const [bMonth, bYear] = b.split(".").map(Number);
      if (aYear !== bYear) return bYear - aYear;
      return bMonth - aMonth;
    });
    const { InlineKeyboard } = await import('grammy');
    const keyboard = new InlineKeyboard();
    keyboard.text("\u{1F4CB} \u0412\u0441\u0435", `stp_${courseIndex}_all`);
    keyboard.row();
    let buttonsInRow = 0;
    for (const period of sortedPeriods.slice(0, 6)) {
      keyboard.text(`\u{1F4C5} ${period}`, `stp_${courseIndex}_${period}`);
      buttonsInRow++;
      if (buttonsInRow >= 3) {
        keyboard.row();
        buttonsInRow = 0;
      }
    }
    keyboard.row();
    keyboard.text("\u25C0\uFE0F \u041D\u0430\u0437\u0430\u0434 \u043A \u0432\u044B\u0431\u043E\u0440\u0443 \u043A\u0443\u0440\u0441\u0430", "stb");
    await sendMessage(chatId, "\u{1F4C5} \u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043F\u0435\u0440\u0438\u043E\u0434:", { replyMarkup: keyboard });
    await updateLastActivity(representative.id);
  } catch (error) {
    console.error("[TelegramBot] \u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0435\u0439:", error);
    await sendMessage(chatId, BOT_MESSAGES.ERROR_GENERAL);
  }
}
async function handleStudentsPeriodSelection(chatId, courseIndex, period) {
  const representative = await getRepresentativeByTelegramChatId(chatId);
  if (!representative || representative.status !== "approved") {
    await sendMessage(chatId, BOT_MESSAGES.ERROR_NO_PERMISSION);
    return;
  }
  try {
    let students = await getStudentsForRepresentative(representative);
    let courseName = null;
    if (courseIndex !== "all") {
      const session = await getOrCreateSession(chatId);
      const coursesList = session.data?.coursesList;
      const idx = parseInt(courseIndex, 10);
      if (coursesList && !isNaN(idx) && idx >= 0 && idx < coursesList.length) {
        courseName = coursesList[idx];
      }
    }
    if (courseName) {
      students = students.filter((s) => s.courseName === courseName);
    }
    if (period !== "all") {
      const [monthStr, yearStr] = period.split(".");
      students = students.filter((student) => {
        if (!student.startDate) return false;
        const parts = student.startDate.split(".");
        if (parts.length !== 3) return false;
        const studentMonth = parts[1];
        const studentYear = parts[2];
        return studentMonth === monthStr && studentYear === yearStr;
      });
    }
    const message = formatStudentsList(students);
    await sendMessage(chatId, message);
    await updateLastActivity(representative.id);
    console.log(
      `[TelegramBot] \u041F\u043E\u043A\u0430\u0437\u0430\u043D\u044B \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0438: \u043A\u0443\u0440\u0441=${courseName || "all"}, \u043F\u0435\u0440\u0438\u043E\u0434=${period}, \u043D\u0430\u0439\u0434\u0435\u043D\u043E: ${students.length}`
    );
  } catch (error) {
    console.error("[TelegramBot] \u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0435\u0439:", error);
    await sendMessage(chatId, BOT_MESSAGES.ERROR_GENERAL);
  }
}
async function createRepresentativeFromSession(chatId, sessionData, organizationId) {
  try {
    const existing = await getRepresentativeByTelegramChatId(chatId);
    if (existing) {
      await sendMessage(chatId, BOT_MESSAGES.ALREADY_REGISTERED);
      await updateSession(chatId, { state: "completed", data: {} });
      return;
    }
    const representative = await createRepresentative({
      organizationId,
      fullName: sessionData.fullName,
      phone: sessionData.phone,
      telegramChatId: chatId,
      telegramUsername: sessionData.username || void 0
    });
    await updateSession(chatId, {
      state: "pending_approval",
      data: { ...sessionData, representativeId: representative.id }
    });
    await sendMessage(chatId, BOT_MESSAGES.REGISTRATION_COMPLETE);
    console.log(
      `[TelegramBot] \u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044F \u043F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u0438\u0442\u0435\u043B\u044F: ${representative.id}, \u0424\u0418\u041E: ${representative.fullName}, \u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F: ${organizationId}`
    );
    console.log(
      `[TelegramBot] \u0421\u043E\u0437\u0434\u0430\u043D\u0430 \u0437\u0430\u044F\u0432\u043A\u0430 \u043F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u0438\u0442\u0435\u043B\u044F: ${representative.id}`
    );
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY" || error.message?.includes("Duplicate entry")) {
      await sendMessage(chatId, BOT_MESSAGES.ALREADY_REGISTERED);
      await updateSession(chatId, { state: "completed", data: {} });
      return;
    }
    console.error("[TelegramBot] \u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u043F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u0438\u0442\u0435\u043B\u044F:", error);
    throw error;
  }
}
async function getStudentsForRepresentative(representative) {
  const { executeQuery } = await Promise.resolve().then(function () { return db; });
  const { getOrganizationById: getOrganizationById2 } = await Promise.resolve().then(function () { return organizationRepository; });
  const organization = await getOrganizationById2(representative.organizationId);
  if (!organization) {
    return [];
  }
  const query = `
    SELECT 
      s.full_name,
      g.code as group_name,
      c.name as course_name,
      g.start_date,
      g.end_date
    FROM students s
    JOIN study_group_students gs ON s.id = gs.student_id
    JOIN study_groups g ON gs.group_id = g.id
    JOIN courses c ON g.course_id = c.id
    WHERE s.organization = ?
      AND g.is_active = true
    ORDER BY g.start_date DESC, s.full_name ASC
  `;
  const rows = await executeQuery(query, [organization.name]);
  return rows.map((row) => ({
    fullName: row.full_name,
    groupName: row.group_name,
    courseName: row.course_name,
    startDate: formatDateShort(row.start_date),
    endDate: formatDateShort(row.end_date)
  }));
}
async function getScheduleForRepresentative(representative) {
  const { executeQuery } = await Promise.resolve().then(function () { return db; });
  const { getOrganizationById: getOrganizationById2 } = await Promise.resolve().then(function () { return organizationRepository; });
  const organization = await getOrganizationById2(representative.organizationId);
  if (!organization) {
    return [];
  }
  const today = /* @__PURE__ */ new Date();
  const weekLater = /* @__PURE__ */ new Date();
  weekLater.setDate(weekLater.getDate() + 7);
  const query = `
    SELECT 
      se.start_time,
      se.end_time,
      se.event_type,
      se.title,
      d.name as discipline_name,
      i.full_name as instructor_name,
      c.name as classroom_name,
      g.code as group_name
    FROM schedule_events se
    JOIN study_groups g ON se.group_id = g.id
    LEFT JOIN disciplines d ON se.discipline_id = d.id
    LEFT JOIN instructors i ON se.instructor_id = i.id
    LEFT JOIN classrooms c ON se.classroom_id = c.id
    WHERE g.id IN (
      SELECT DISTINCT gs.group_id 
      FROM study_group_students gs
      JOIN students s ON gs.student_id = s.id
      WHERE s.organization = ?
    )
    AND DATE(se.start_time) BETWEEN ? AND ?
    ORDER BY se.start_time ASC
  `;
  const rows = await executeQuery(query, [
    organization.name,
    today.toISOString().split("T")[0],
    weekLater.toISOString().split("T")[0]
  ]);
  return rows.map((row) => {
    const startDate = new Date(row.start_time);
    const endDate = new Date(row.end_time);
    const datePart = startDate.toISOString().split("T")[0];
    return {
      date: datePart || "",
      startTime: startDate.toTimeString().substring(0, 5),
      endTime: endDate.toTimeString().substring(0, 5),
      eventType: row.event_type || "lesson",
      disciplineName: row.discipline_name || row.title || "\u0417\u0430\u043D\u044F\u0442\u0438\u0435",
      instructorName: row.instructor_name || "\u041D\u0435 \u043D\u0430\u0437\u043D\u0430\u0447\u0435\u043D",
      location: row.classroom_name || void 0,
      groupName: row.group_name
    };
  });
}
async function getCertificatesForRepresentative(representative) {
  const { executeQuery } = await Promise.resolve().then(function () { return db; });
  const { getOrganizationById: getOrganizationById2 } = await Promise.resolve().then(function () { return organizationRepository; });
  const organization = await getOrganizationById2(representative.organizationId);
  if (!organization) {
    return [];
  }
  const query = `
    SELECT 
      ic.id,
      ic.certificate_number,
      ic.issue_date,
      ic.status,
      ic.pdf_file_url,
      ic.warnings,
      ic.override_warnings,
      s.full_name as student_name,
      c.name as course_name,
      g.code as group_code,
      (
        SELECT ROUND(
          COALESCE(SUM(a.hours_attended), 0) * 100.0 / 
          NULLIF((SELECT SUM(d2.hours) FROM disciplines d2 WHERE d2.course_id = c.id), 0),
          1
        )
        FROM attendance a
        JOIN schedule_events se ON a.schedule_event_id = se.id
        WHERE a.student_id = s.id AND se.group_id = g.id
      ) as attendance_percent
    FROM issued_certificates ic
    JOIN students s ON ic.student_id = s.id
    JOIN study_groups g ON ic.group_id = g.id
    JOIN courses c ON g.course_id = c.id
    WHERE s.organization = ?
    ORDER BY ic.issue_date DESC, s.full_name ASC
  `;
  const rows = await executeQuery(query, [organization.name]);
  return rows.map((row) => {
    let warnings = [];
    try {
      warnings = row.warnings ? JSON.parse(row.warnings) : [];
    } catch (e) {
      console.warn(
        "[TelegramBot] \u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0440\u0430\u0441\u043F\u0430\u0440\u0441\u0438\u0442\u044C warnings \u0434\u043B\u044F \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430:",
        row.id,
        e
      );
      warnings = [];
    }
    const hasPassed = warnings.length === 0 || row.override_warnings;
    return {
      id: row.id,
      studentName: row.student_name,
      certificateNumber: row.certificate_number,
      courseName: row.course_name,
      groupCode: row.group_code,
      issueDate: formatDateShort(row.issue_date),
      status: row.status,
      pdfFileUrl: row.pdf_file_url,
      hasPassed,
      attendancePercent: row.attendance_percent
    };
  });
}
function formatDateShort(date) {
  const d = typeof date === "string" ? new Date(date) : date;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}
async function handleSendCertificatesArchive(chatId, period) {
  const representative = await getRepresentativeByTelegramChatId(chatId);
  if (!representative || representative.status !== "approved") {
    await sendMessage(chatId, BOT_MESSAGES.ERROR_NO_PERMISSION);
    return;
  }
  if (!representative.permissions.can_request_certificates) {
    await sendMessage(
      chatId,
      "\u{1F6AB} *\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0430*\n\n\u0423 \u0432\u0430\u0441 \u043D\u0435\u0442 \u0440\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u0438\u044F \u043D\u0430 \u0437\u0430\u043F\u0440\u043E\u0441 \u0444\u0430\u0439\u043B\u043E\u0432 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432."
    );
    return;
  }
  try {
    await sendMessage(
      chatId,
      "\u23F3 *\u0410\u0440\u0445\u0438\u0432\u0430\u0446\u0438\u044F \u0444\u0430\u0439\u043B\u043E\u0432...*\n\u041F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430, \u043F\u043E\u0434\u043E\u0436\u0434\u0438\u0442\u0435, \u044D\u0442\u043E \u043C\u043E\u0436\u0435\u0442 \u0437\u0430\u043D\u044F\u0442\u044C \u043D\u0435\u043A\u043E\u0442\u043E\u0440\u043E\u0435 \u0432\u0440\u0435\u043C\u044F."
    );
    const startTime = Date.now();
    let certificates = await getCertificatesForRepresentative(representative);
    if (period !== "all") {
      const [monthStr, yearStr] = period.split(".");
      certificates = certificates.filter((cert) => {
        if (!cert.issueDate) return false;
        const parts = cert.issueDate.split(".");
        if (parts.length !== 3) return false;
        const certMonth = parts[1];
        const certYear = parts[2];
        return certMonth === monthStr && certYear === yearStr;
      });
    }
    const issuedCerts = certificates.filter(
      (c) => c.status === "issued" && (c.pdfFileUrl || c.docxFileUrl)
    );
    if (issuedCerts.length === 0) {
      await sendMessage(chatId, BOT_MESSAGES.NO_CERTIFICATES);
      return;
    }
    const { createCertificatesArchive } = await import('./certificateArchiveService.mjs');
    const archive = await createCertificatesArchive(issuedCerts);
    const bot = getBot();
    if (!bot) {
      await sendMessage(chatId, BOT_MESSAGES.ERROR_GENERAL);
      return;
    }
    const { getOrganizationById: getOrganizationById2 } = await Promise.resolve().then(function () { return organizationRepository; });
    const org = await getOrganizationById2(representative.organizationId);
    const orgName = org ? org.code || "org" : "certificates";
    const fileName = `certificates_${orgName}_${period}.zip`;
    const { InputFile } = await import('grammy');
    await bot.api.sendDocument(chatId, new InputFile(archive, fileName), {
      caption: `\u{1F4E6} *\u0410\u0440\u0445\u0438\u0432 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432*
\u041F\u0435\u0440\u0438\u043E\u0434: ${period === "all" ? "\u0412\u0441\u0435 \u0432\u0440\u0435\u043C\u044F" : period}
\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E: ${issuedCerts.length}`,
      parse_mode: "Markdown"
    });
    await updateLastActivity(representative.id);
    const { logBotRequest } = await import('./botLogger.mjs');
    await logBotRequest({
      representativeId: representative.id,
      chatId,
      command: "/get_zip_certs",
      status: "success",
      requestData: { period, count: issuedCerts.length },
      responseTimeMs: Date.now() - startTime
    });
  } catch (error) {
    console.error("[TelegramBot] \u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0438 \u0430\u0440\u0445\u0438\u0432\u0430:", error);
    await sendMessage(
      chatId,
      "\u274C \u041F\u0440\u043E\u0438\u0437\u043E\u0448\u043B\u0430 \u043E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0438 \u0430\u0440\u0445\u0438\u0432\u0430. \u0412\u043E\u0437\u043C\u043E\u0436\u043D\u043E, \u0444\u0430\u0439\u043B\u044B \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B."
    );
  }
}

const _ZhNe0VSd36G5BAAfXHXL9NWkBZ1VmDZczP_El_hFET4 = defineNitroPlugin(async (nitroApp) => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.log("[TelegramBot] \u26A0\uFE0F TELEGRAM_BOT_TOKEN \u043D\u0435 \u0437\u0430\u0434\u0430\u043D, \u0431\u043E\u0442 \u043D\u0435 \u0437\u0430\u043F\u0443\u0449\u0435\u043D");
    return;
  }
  {
    console.log("[TelegramBot] \u{1F4E1} Production \u0440\u0435\u0436\u0438\u043C - \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435 webhook");
    return;
  }
});

const plugins = [
  _c_t2byW8CidkJq45RdCuw1V1O3BgV8OIfM_xQSpMHb8,
_ZhNe0VSd36G5BAAfXHXL9NWkBZ1VmDZczP_El_hFET4
];

const assets = {
  "/android-chrome-192x192.png": {
    "type": "image/png",
    "etag": "\"6fb4-/KcXKfNiL9X/lTx9JBM10o9+mO4\"",
    "mtime": "2026-01-16T14:50:45.170Z",
    "size": 28596,
    "path": "../public/android-chrome-192x192.png"
  },
  "/android-chrome-512x512.png": {
    "type": "image/png",
    "etag": "\"18e60-v7LrXw+vPuriLi16dHZsmCBCAaE\"",
    "mtime": "2026-01-16T14:50:45.171Z",
    "size": 101984,
    "path": "../public/android-chrome-512x512.png"
  },
  "/apple-touch-icon.png": {
    "type": "image/png",
    "etag": "\"63a8-crmUPC/FBayKu5DX3YVrAwIdhIE\"",
    "mtime": "2026-01-16T14:50:45.173Z",
    "size": 25512,
    "path": "../public/apple-touch-icon.png"
  },
  "/favicon-16x16.png": {
    "type": "image/png",
    "etag": "\"33b-XETnEf0h/mCLz/ulRuOpN4leRm0\"",
    "mtime": "2026-01-16T14:50:45.173Z",
    "size": 827,
    "path": "../public/favicon-16x16.png"
  },
  "/favicon-32x32.png": {
    "type": "image/png",
    "etag": "\"918-13yeWFpK0D4ZDnyciNJKBBZs1s4\"",
    "mtime": "2026-01-16T14:50:45.173Z",
    "size": 2328,
    "path": "../public/favicon-32x32.png"
  },
  "/favicon.ico": {
    "type": "image/vnd.microsoft.icon",
    "etag": "\"3c2e-3NNDyFgPPgDG69BNnPv8gfkW3Q0\"",
    "mtime": "2026-01-16T14:50:45.174Z",
    "size": 15406,
    "path": "../public/favicon.ico"
  },
  "/logo.png": {
    "type": "image/png",
    "etag": "\"226aa-gDQmVTMvz5jk8ZUO9GUnxzep6Kk\"",
    "mtime": "2026-01-16T14:50:45.260Z",
    "size": 140970,
    "path": "../public/logo.png"
  },
  "/site.webmanifest": {
    "type": "application/manifest+json",
    "etag": "\"1a1-foMSbh8dMt7LJGRaT0nHCrhIL6s\"",
    "mtime": "2026-01-16T14:50:45.260Z",
    "size": 417,
    "path": "../public/site.webmanifest"
  },
  "/favicon_io/android-chrome-192x192.png": {
    "type": "image/png",
    "etag": "\"6fb4-/KcXKfNiL9X/lTx9JBM10o9+mO4\"",
    "mtime": "2026-01-16T14:50:45.174Z",
    "size": 28596,
    "path": "../public/favicon_io/android-chrome-192x192.png"
  },
  "/favicon_io/android-chrome-512x512.png": {
    "type": "image/png",
    "etag": "\"18e60-v7LrXw+vPuriLi16dHZsmCBCAaE\"",
    "mtime": "2026-01-16T14:50:45.175Z",
    "size": 101984,
    "path": "../public/favicon_io/android-chrome-512x512.png"
  },
  "/favicon_io/apple-touch-icon.png": {
    "type": "image/png",
    "etag": "\"63a8-crmUPC/FBayKu5DX3YVrAwIdhIE\"",
    "mtime": "2026-01-16T14:50:45.175Z",
    "size": 25512,
    "path": "../public/favicon_io/apple-touch-icon.png"
  },
  "/favicon_io/favicon-16x16.png": {
    "type": "image/png",
    "etag": "\"33b-XETnEf0h/mCLz/ulRuOpN4leRm0\"",
    "mtime": "2026-01-16T14:50:45.176Z",
    "size": 827,
    "path": "../public/favicon_io/favicon-16x16.png"
  },
  "/favicon_io/favicon-32x32.png": {
    "type": "image/png",
    "etag": "\"918-13yeWFpK0D4ZDnyciNJKBBZs1s4\"",
    "mtime": "2026-01-16T14:50:45.176Z",
    "size": 2328,
    "path": "../public/favicon_io/favicon-32x32.png"
  },
  "/favicon_io/favicon.ico": {
    "type": "image/vnd.microsoft.icon",
    "etag": "\"3c2e-3NNDyFgPPgDG69BNnPv8gfkW3Q0\"",
    "mtime": "2026-01-16T14:50:45.176Z",
    "size": 15406,
    "path": "../public/favicon_io/favicon.ico"
  },
  "/favicon_io/site.webmanifest": {
    "type": "application/manifest+json",
    "etag": "\"107-vzG6+RvdL83iSkXj8qG+M3M8b2k\"",
    "mtime": "2026-01-16T14:50:45.177Z",
    "size": 263,
    "path": "../public/favicon_io/site.webmanifest"
  },
  "/fonts/Poppins-Bold.ttf": {
    "type": "font/ttf",
    "etag": "\"2615c-ReTVgsu02rK7rT9iT62a5WfGZUc\"",
    "mtime": "2026-01-16T14:50:45.179Z",
    "size": 155996,
    "path": "../public/fonts/Poppins-Bold.ttf"
  },
  "/fonts/Poppins-Regular.ttf": {
    "type": "font/ttf",
    "etag": "\"2723c-hqQlvlqRnYZym4WyvB0H2lzkE9Q\"",
    "mtime": "2026-01-16T14:50:45.180Z",
    "size": 160316,
    "path": "../public/fonts/Poppins-Regular.ttf"
  },
  "/_nuxt/625HVSDQ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"d513-0tHlvYbAAAqukcpVMsFAFDBNHzs\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 54547,
    "path": "../public/_nuxt/625HVSDQ.js"
  },
  "/_nuxt/8LVoMU2R.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"129-8N9cnBB3Mw/RCT7WgJELi0gOKQQ\"",
    "mtime": "2026-02-17T07:37:46.619Z",
    "size": 297,
    "path": "../public/_nuxt/8LVoMU2R.js"
  },
  "/_nuxt/ai-import-certificates.LmPXZNMA.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"437-BO/Ex+8QRb4yzP1+IO1jF3FGsck\"",
    "mtime": "2026-02-17T07:37:46.618Z",
    "size": 1079,
    "path": "../public/_nuxt/ai-import-certificates.LmPXZNMA.css"
  },
  "/_nuxt/AwvV_Lqp.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"15808-72AU7pjqXDD2AL50xXj3yf6CHUI\"",
    "mtime": "2026-02-17T07:37:46.619Z",
    "size": 88072,
    "path": "../public/_nuxt/AwvV_Lqp.js"
  },
  "/_nuxt/B3Qfz7sO.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"12e2-ic6djoGtruOh9S09LQh2L1Tm6+8\"",
    "mtime": "2026-02-17T07:37:46.621Z",
    "size": 4834,
    "path": "../public/_nuxt/B3Qfz7sO.js"
  },
  "/_nuxt/BbkEkFsF.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"263-AysfIFpY/Y/irVTSCS2RIQfYmJc\"",
    "mtime": "2026-02-17T07:37:46.619Z",
    "size": 611,
    "path": "../public/_nuxt/BbkEkFsF.js"
  },
  "/_nuxt/Bd-ycxNi.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1d88-jFWURw+ZX4x3OWk4T5hSgAyQw8A\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 7560,
    "path": "../public/_nuxt/Bd-ycxNi.js"
  },
  "/_nuxt/BDjZpoYe.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"41c-7CjdaLgUmbmCRF6wf7njZuO3rzs\"",
    "mtime": "2026-02-17T07:37:46.619Z",
    "size": 1052,
    "path": "../public/_nuxt/BDjZpoYe.js"
  },
  "/_nuxt/BdRSuk0d.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"98c5-Rxd6K8DIRmAkAlNJ212uDJG2Ji4\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 39109,
    "path": "../public/_nuxt/BdRSuk0d.js"
  },
  "/_nuxt/BFBOxgT2.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"c5-WGrAlUWuifNjTXkDgV66xaFxQ+M\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 197,
    "path": "../public/_nuxt/BFBOxgT2.js"
  },
  "/_nuxt/BfNrAPXq.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1489-29WCqdAbbHRkvH3HOMfgG5jvMy4\"",
    "mtime": "2026-02-17T07:37:46.622Z",
    "size": 5257,
    "path": "../public/_nuxt/BfNrAPXq.js"
  },
  "/_nuxt/BHiRq_jT.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"ce2-Uvwo+vDBZlkDlpmIteB06ofvsqI\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 3298,
    "path": "../public/_nuxt/BHiRq_jT.js"
  },
  "/_nuxt/BIg-aNNr.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3058-4pywXR6bGTjiikmSwDkrrAn6FZ0\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 12376,
    "path": "../public/_nuxt/BIg-aNNr.js"
  },
  "/_nuxt/BJeCGT2-.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"11b-bv1ickFxZX4/1dNx2ZHB4wKFRRw\"",
    "mtime": "2026-02-17T07:37:46.621Z",
    "size": 283,
    "path": "../public/_nuxt/BJeCGT2-.js"
  },
  "/_nuxt/BjHlhNFN.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4d0e-EHOP5kP10+wOl0Yq0mCxBiXavq0\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 19726,
    "path": "../public/_nuxt/BjHlhNFN.js"
  },
  "/_nuxt/BJSmDEn_.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"485c-8AXCd0T/Z/c+9tpfcE7ROvqDojY\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 18524,
    "path": "../public/_nuxt/BJSmDEn_.js"
  },
  "/_nuxt/BKg9m4wI.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1400-XA26d2CU/iwnVAzc8zB/5X6toaA\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 5120,
    "path": "../public/_nuxt/BKg9m4wI.js"
  },
  "/_nuxt/blank.DD79PFJD.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"3c-d5GKE/AFH2gviHRxT+GWqMmLvVc\"",
    "mtime": "2026-02-17T07:37:46.618Z",
    "size": 60,
    "path": "../public/_nuxt/blank.DD79PFJD.css"
  },
  "/_nuxt/Bldf0XAT.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"42f07-S8JmlpQ2wfGznqWNWfmEKCJT7bc\"",
    "mtime": "2026-02-17T07:37:46.621Z",
    "size": 274183,
    "path": "../public/_nuxt/Bldf0XAT.js"
  },
  "/_nuxt/BLDR1O4k.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"9b-X3IU3674meLY/G1GdxgzjYy06YQ\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 155,
    "path": "../public/_nuxt/BLDR1O4k.js"
  },
  "/_nuxt/BMofnORk.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"83c-URWJq/ZlPZ5MycUVZ4hcXOT3WrA\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 2108,
    "path": "../public/_nuxt/BMofnORk.js"
  },
  "/_nuxt/BmQYkErQ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"7258-bEhEwsTldcllJLqMq8BnXBDlGhk\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 29272,
    "path": "../public/_nuxt/BmQYkErQ.js"
  },
  "/_nuxt/BNigTcCY.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"c5c-JpBaa2fX8IKyQ38KcQuW1TkPTcw\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 3164,
    "path": "../public/_nuxt/BNigTcCY.js"
  },
  "/_nuxt/BNYLIOcC.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"bd55-o5kF6Yh+eMInsbIACVdVwCEnQvc\"",
    "mtime": "2026-02-17T07:37:46.621Z",
    "size": 48469,
    "path": "../public/_nuxt/BNYLIOcC.js"
  },
  "/_nuxt/BqNnZPOd.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"f81-tRMfqURIQ0RlCS/2qfmHn212Kds\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 3969,
    "path": "../public/_nuxt/BqNnZPOd.js"
  },
  "/_nuxt/BTp1RmNK.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"67a74-8eoII2pt6UnWR/uUqpo7fx0F0oI\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 424564,
    "path": "../public/_nuxt/BTp1RmNK.js"
  },
  "/_nuxt/BU3bPrCg.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"a7e2-OV/3U3w+Jj9i8khmeL4PKUFosQg\"",
    "mtime": "2026-02-17T07:37:46.621Z",
    "size": 42978,
    "path": "../public/_nuxt/BU3bPrCg.js"
  },
  "/_nuxt/Bv-z54qD.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"14ed-Q63cgHid+3wGNFhAwCIL/Li7j/M\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 5357,
    "path": "../public/_nuxt/Bv-z54qD.js"
  },
  "/_nuxt/BXVVfxou.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"26c29-gM9gIZbKpHUYq9m3M6m3PD8oSUw\"",
    "mtime": "2026-02-17T07:37:46.621Z",
    "size": 158761,
    "path": "../public/_nuxt/BXVVfxou.js"
  },
  "/_nuxt/BylynD0E.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"65729-jyyEeq5xNqhPUDVj92+NtJm3kN4\"",
    "mtime": "2026-02-17T07:37:46.621Z",
    "size": 415529,
    "path": "../public/_nuxt/BylynD0E.js"
  },
  "/_nuxt/Bzr520pe.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"57b1-Lzf72MDN5f8y33DhieFbJ2OruHY\"",
    "mtime": "2026-02-17T07:37:46.621Z",
    "size": 22449,
    "path": "../public/_nuxt/Bzr520pe.js"
  },
  "/_nuxt/B_TnuA9b.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"6f59-JaZCW1Z4QlJNWKa3BrQD4Gx/z/s\"",
    "mtime": "2026-02-17T07:37:46.619Z",
    "size": 28505,
    "path": "../public/_nuxt/B_TnuA9b.js"
  },
  "/_nuxt/C1ucb4WH.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"464-gAJEmbb/NTM90SNXAz2C3LOwaeY\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 1124,
    "path": "../public/_nuxt/C1ucb4WH.js"
  },
  "/_nuxt/Caj9Z7Wo.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"5645-3ywHkTq/hSJ7TKb4nybbZFYN0Lo\"",
    "mtime": "2026-02-17T07:37:46.619Z",
    "size": 22085,
    "path": "../public/_nuxt/Caj9Z7Wo.js"
  },
  "/_nuxt/CAn-Sr93.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"10ea5-fn2vJ0UqzFH06HrjU6wfp3HHdeU\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 69285,
    "path": "../public/_nuxt/CAn-Sr93.js"
  },
  "/_nuxt/CCdEwOI2.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"bc18-+JQ1WOARHReacxlLEQemjmHkIHI\"",
    "mtime": "2026-02-17T07:37:46.621Z",
    "size": 48152,
    "path": "../public/_nuxt/CCdEwOI2.js"
  },
  "/_nuxt/CEEKqvky.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3375-Gk9gtKRVWB8bLAXRWUdUys1BP+g\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 13173,
    "path": "../public/_nuxt/CEEKqvky.js"
  },
  "/_nuxt/certificates.D7BYOF0A.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"130-56UesPv9fA7/E8XWkXMPtxZuvFU\"",
    "mtime": "2026-02-17T07:37:46.618Z",
    "size": 304,
    "path": "../public/_nuxt/certificates.D7BYOF0A.css"
  },
  "/_nuxt/CFbq0LVm.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"ffc-ubl/atQVLcNF21ibPOlupYS3/m4\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 4092,
    "path": "../public/_nuxt/CFbq0LVm.js"
  },
  "/_nuxt/CFqcS5dN.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"dab-4SaLUIEgD8yM7mDl0DNFMJOA6Y4\"",
    "mtime": "2026-02-17T07:37:46.618Z",
    "size": 3499,
    "path": "../public/_nuxt/CFqcS5dN.js"
  },
  "/_nuxt/Cgh56uhd.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"266-pecZb1rqCcNgsOYdkDhdVsmryxE\"",
    "mtime": "2026-02-17T07:37:46.618Z",
    "size": 614,
    "path": "../public/_nuxt/Cgh56uhd.js"
  },
  "/_nuxt/CHLymgqe.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4a-H7J2sNZ6C+PmYy+NQTGIl7BmJyM\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 74,
    "path": "../public/_nuxt/CHLymgqe.js"
  },
  "/_nuxt/CJXznU7N.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"31f5-hOEYmX54EF2xdSalzxXD9UECsqc\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 12789,
    "path": "../public/_nuxt/CJXznU7N.js"
  },
  "/_nuxt/CK3aI5R7.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4123-wunRjWGd+auUqW/kROuJCO30wT8\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 16675,
    "path": "../public/_nuxt/CK3aI5R7.js"
  },
  "/_nuxt/CkN6Qlmg.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4be1-2sFcanxCBzL1IFXh49fTu5XAYBM\"",
    "mtime": "2026-02-17T07:37:46.619Z",
    "size": 19425,
    "path": "../public/_nuxt/CkN6Qlmg.js"
  },
  "/_nuxt/CLk2uR0a.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3954-LTSHOuObxraVjPIFrd/eqeriefU\"",
    "mtime": "2026-02-17T07:37:46.619Z",
    "size": 14676,
    "path": "../public/_nuxt/CLk2uR0a.js"
  },
  "/_nuxt/CLxbNtK6.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"11424-+Pop90V/LQvdA6lKOMWWTBzOQeA\"",
    "mtime": "2026-02-17T07:37:46.619Z",
    "size": 70692,
    "path": "../public/_nuxt/CLxbNtK6.js"
  },
  "/_nuxt/CNREWQ41.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"5feeb-VqtGTuhffo66uM+aa6iTRhXif2A\"",
    "mtime": "2026-02-17T07:37:46.619Z",
    "size": 392939,
    "path": "../public/_nuxt/CNREWQ41.js"
  },
  "/_nuxt/CNsCCJlI.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"a4f5-GlardJiV4eRjQQnreNDS+999Trg\"",
    "mtime": "2026-02-17T07:37:46.619Z",
    "size": 42229,
    "path": "../public/_nuxt/CNsCCJlI.js"
  },
  "/_nuxt/CpIW2CsP.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"502-AATCUx2fmTsZF+p+SSWrKGibIno\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 1282,
    "path": "../public/_nuxt/CpIW2CsP.js"
  },
  "/_nuxt/CqdpKe-B.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"5e5-QdL1K2xfI5VMCNmsV6/NlphJln4\"",
    "mtime": "2026-02-17T07:37:46.621Z",
    "size": 1509,
    "path": "../public/_nuxt/CqdpKe-B.js"
  },
  "/_nuxt/CQFInmze.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2937-fMCHeslnKUA4lduDfo/AfTfxSOE\"",
    "mtime": "2026-02-17T07:37:46.621Z",
    "size": 10551,
    "path": "../public/_nuxt/CQFInmze.js"
  },
  "/_nuxt/CRUGdXr-.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"40-AgUOyVdFsGEVjCohZTw++tQPUZg\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 64,
    "path": "../public/_nuxt/CRUGdXr-.js"
  },
  "/_nuxt/CSl5XP98.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"544c-+qkBvZr0MKZVD2mb6rhrauVO4z8\"",
    "mtime": "2026-02-17T07:37:46.621Z",
    "size": 21580,
    "path": "../public/_nuxt/CSl5XP98.js"
  },
  "/_nuxt/CVPIVCKZ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"16e09-NAoBsWXPmTRnCzwxPkIR/VW4AbI\"",
    "mtime": "2026-02-17T07:37:46.621Z",
    "size": 93705,
    "path": "../public/_nuxt/CVPIVCKZ.js"
  },
  "/_nuxt/CVqvr-Q5.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"433-epB34A6L/cWiM3ZHPa9AZ5gpvfE\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 1075,
    "path": "../public/_nuxt/CVqvr-Q5.js"
  },
  "/_nuxt/CWhzyIkm.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3e29-ZoPH306HqB7Y8pHJhh1nV96aiyw\"",
    "mtime": "2026-02-17T07:37:46.619Z",
    "size": 15913,
    "path": "../public/_nuxt/CWhzyIkm.js"
  },
  "/_nuxt/CX6nKigg.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"286-ACVjDe191PyEh8CAakebcd9rMwo\"",
    "mtime": "2026-02-17T07:37:46.619Z",
    "size": 646,
    "path": "../public/_nuxt/CX6nKigg.js"
  },
  "/_nuxt/CXUnm2r_.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"ee9-YexfyASza0fcDB/mxIkE3+ZIp48\"",
    "mtime": "2026-02-17T07:37:46.618Z",
    "size": 3817,
    "path": "../public/_nuxt/CXUnm2r_.js"
  },
  "/_nuxt/CyDLpZDf.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"9f3-6M3C7Q6Ywy/SzB03Ma7UqgJewbk\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 2547,
    "path": "../public/_nuxt/CyDLpZDf.js"
  },
  "/_nuxt/CZA6dx5Q.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4f17-OfHaiFsFqBKgjKkFYvCe2MbcaW0\"",
    "mtime": "2026-02-17T07:37:46.619Z",
    "size": 20247,
    "path": "../public/_nuxt/CZA6dx5Q.js"
  },
  "/_nuxt/CzPN4sNf.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"35ff-9tZ5pQX5OtCD0VgWoZEqf9EOOGI\"",
    "mtime": "2026-02-17T07:37:46.619Z",
    "size": 13823,
    "path": "../public/_nuxt/CzPN4sNf.js"
  },
  "/_nuxt/C_NN4JOp.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"25d5-8nNEo6BAi6h+nQPKXSx5ETCLGKw\"",
    "mtime": "2026-02-17T07:37:46.619Z",
    "size": 9685,
    "path": "../public/_nuxt/C_NN4JOp.js"
  },
  "/_nuxt/C_rSYvUd.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2b25-8wrDR1BnCQ75s2r8xpK1EAFpIrI\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 11045,
    "path": "../public/_nuxt/C_rSYvUd.js"
  },
  "/_nuxt/D-2Cuf-m.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"15c-vPGzu7o9f4Cy5Gcvvr3FQRaadJA\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 348,
    "path": "../public/_nuxt/D-2Cuf-m.js"
  },
  "/_nuxt/D0i-plLZ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1369-ElLJt8er4KXg42xhzOv6hfTfyD8\"",
    "mtime": "2026-02-17T07:37:46.621Z",
    "size": 4969,
    "path": "../public/_nuxt/D0i-plLZ.js"
  },
  "/_nuxt/D72tt0Rr.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"137db-TnjdX7+tA0ZjWHxfuS7HpoqvQlI\"",
    "mtime": "2026-02-17T07:37:46.619Z",
    "size": 79835,
    "path": "../public/_nuxt/D72tt0Rr.js"
  },
  "/_nuxt/D81SDHNc.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"456f-zfIaW8Jmc7q1O9Y+AeSidtwMCCU\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 17775,
    "path": "../public/_nuxt/D81SDHNc.js"
  },
  "/_nuxt/D85chq4P.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2229-sGCIXX/PjZauUOZLZQGmLjJ+ixI\"",
    "mtime": "2026-02-17T07:37:46.619Z",
    "size": 8745,
    "path": "../public/_nuxt/D85chq4P.js"
  },
  "/_nuxt/D95Hy-bC.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"44fd-bhWmZHIInMXSwJDrfXqOOHR516c\"",
    "mtime": "2026-02-17T07:37:46.619Z",
    "size": 17661,
    "path": "../public/_nuxt/D95Hy-bC.js"
  },
  "/_nuxt/DbDyPcRw.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"181-eYQgd/wKtz48ZbqlYmrBs2uVLCk\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 385,
    "path": "../public/_nuxt/DbDyPcRw.js"
  },
  "/_nuxt/DBQUohbJ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"15b4-67hDKx2SvMy5EoD3fVHtOBFpSz0\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 5556,
    "path": "../public/_nuxt/DBQUohbJ.js"
  },
  "/_nuxt/DCvMrdi-.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"2c04-sv0wiuOh3jTnLZJ/nMfC/l5et4A\"",
    "mtime": "2026-02-17T07:37:46.619Z",
    "size": 11268,
    "path": "../public/_nuxt/DCvMrdi-.js"
  },
  "/_nuxt/DDVcx6Bu.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"14b5f-7zrKvl6exk+276ZInmiauj3vd2M\"",
    "mtime": "2026-02-17T07:37:46.619Z",
    "size": 84831,
    "path": "../public/_nuxt/DDVcx6Bu.js"
  },
  "/_nuxt/default.BG7diMZ9.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"97a-w0jHJSqpj6OOZy5J7porbjl5RwQ\"",
    "mtime": "2026-02-17T07:37:46.618Z",
    "size": 2426,
    "path": "../public/_nuxt/default.BG7diMZ9.css"
  },
  "/_nuxt/DHt4CjJ-.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"a7b-WHaRieAhgqUk5No1i1q7FO+H9JM\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 2683,
    "path": "../public/_nuxt/DHt4CjJ-.js"
  },
  "/_nuxt/DIBXnmGY.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3599-kCevKflqa2a5eyWot0/6jF004ks\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 13721,
    "path": "../public/_nuxt/DIBXnmGY.js"
  },
  "/_nuxt/DKPy8-Ta.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"c991-HCezh/2XHENvs+1/Pp82PNJJGl0\"",
    "mtime": "2026-02-17T07:37:46.621Z",
    "size": 51601,
    "path": "../public/_nuxt/DKPy8-Ta.js"
  },
  "/_nuxt/DkuYzCwJ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1e3-zFJ02lHvZyhz1e1nrQ9YyOGtUbc\"",
    "mtime": "2026-02-17T07:37:46.619Z",
    "size": 483,
    "path": "../public/_nuxt/DkuYzCwJ.js"
  },
  "/_nuxt/DlAUqK2U.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"5b-eFCz/UrraTh721pgAl0VxBNR1es\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 91,
    "path": "../public/_nuxt/DlAUqK2U.js"
  },
  "/_nuxt/DlZaGH1J.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"e3-ubWc251UTRn1oqiBfysTu3YFZHI\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 227,
    "path": "../public/_nuxt/DlZaGH1J.js"
  },
  "/_nuxt/DMdYYa2f.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"b1e8-ijDbzVxXCNvUnZyQxBhIOdbOMac\"",
    "mtime": "2026-02-17T07:37:46.619Z",
    "size": 45544,
    "path": "../public/_nuxt/DMdYYa2f.js"
  },
  "/_nuxt/DOQeVpzL.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"60a6-9lq2qYVVyt1e5tf0mL1k/4piFws\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 24742,
    "path": "../public/_nuxt/DOQeVpzL.js"
  },
  "/_nuxt/DQW4_z1t.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"89c3-TTcweXdfh3+BP0av/VEDhe/9bik\"",
    "mtime": "2026-02-17T07:37:46.619Z",
    "size": 35267,
    "path": "../public/_nuxt/DQW4_z1t.js"
  },
  "/_nuxt/DRp6JMY_.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"278c-p8GVcNN57zFHMkmqr5jZCPG0RCc\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 10124,
    "path": "../public/_nuxt/DRp6JMY_.js"
  },
  "/_nuxt/Drs-OYmu.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3f10-FapqjGB5QTNbjZ4oXRRQpyRjUQE\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 16144,
    "path": "../public/_nuxt/Drs-OYmu.js"
  },
  "/_nuxt/DSdf2cDZ.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"d3a-ssVeOLiJcLRoqq/Mqd42S9+F9IY\"",
    "mtime": "2026-02-17T07:37:46.621Z",
    "size": 3386,
    "path": "../public/_nuxt/DSdf2cDZ.js"
  },
  "/_nuxt/DTlttCXC.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"305b-DqzgNvdlP3msscSMqkB3w6Sb1l4\"",
    "mtime": "2026-02-17T07:37:46.619Z",
    "size": 12379,
    "path": "../public/_nuxt/DTlttCXC.js"
  },
  "/_nuxt/DuOejHQH.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"208dd-yeE/VvxyewXTydACyUCx77F/0ME\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 133341,
    "path": "../public/_nuxt/DuOejHQH.js"
  },
  "/_nuxt/DV0XJymg.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"1378-gG01fPS2zHaWnpF7CDhjiTynOhM\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 4984,
    "path": "../public/_nuxt/DV0XJymg.js"
  },
  "/_nuxt/DVCvjknM.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3ff-nOPzYSgKrIMvAZ5EtHFaAb2TgDk\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 1023,
    "path": "../public/_nuxt/DVCvjknM.js"
  },
  "/_nuxt/DVL-QcDc.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"483-uEN0QAYutQnloR3vyZnSTlJD11k\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 1155,
    "path": "../public/_nuxt/DVL-QcDc.js"
  },
  "/_nuxt/DW2J_Y_n.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"113e-Kzln53vE5wpr8UB4WLaTUIsEMX8\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 4414,
    "path": "../public/_nuxt/DW2J_Y_n.js"
  },
  "/_nuxt/Dx11rT4o.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"467a-ltKES5CMdBdhdDIAv3n2skI1m8Q\"",
    "mtime": "2026-02-17T07:37:46.621Z",
    "size": 18042,
    "path": "../public/_nuxt/Dx11rT4o.js"
  },
  "/_nuxt/D_QqaAjN.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"ff98-tbb4tYku+pm2Ema4lF899z39vi4\"",
    "mtime": "2026-02-17T07:37:46.621Z",
    "size": 65432,
    "path": "../public/_nuxt/D_QqaAjN.js"
  },
  "/_nuxt/editor.CmO0KxH7.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"89d5-XcvHyRxjPEp6lOD1gJBjYzX20gw\"",
    "mtime": "2026-02-17T07:37:46.618Z",
    "size": 35285,
    "path": "../public/_nuxt/editor.CmO0KxH7.css"
  },
  "/_nuxt/entry.Ccj0OWH5.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"36a7d-mJedzxwd0AuBpAUxwOhBkZ2n1Jk\"",
    "mtime": "2026-02-17T07:37:46.618Z",
    "size": 223869,
    "path": "../public/_nuxt/entry.Ccj0OWH5.css"
  },
  "/_nuxt/error-404.BLrjNXsr.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"97e-ux3Kf4+ihfyFcowzAldNPQXA150\"",
    "mtime": "2026-02-17T07:37:46.618Z",
    "size": 2430,
    "path": "../public/_nuxt/error-404.BLrjNXsr.css"
  },
  "/_nuxt/error-500.DLkAwcfL.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"773-7U3+/YOnRI78bW08LgoSaI1sGo0\"",
    "mtime": "2026-02-17T07:37:46.601Z",
    "size": 1907,
    "path": "../public/_nuxt/error-500.DLkAwcfL.css"
  },
  "/_nuxt/ETPkf32v.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"10e-e6ecIeJL6hfr8aZGF7ThkQ4cNvM\"",
    "mtime": "2026-02-17T07:37:46.619Z",
    "size": 270,
    "path": "../public/_nuxt/ETPkf32v.js"
  },
  "/_nuxt/Ge7aVWlp.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"312b9-7w6zj3oDGIZgBuhBeCBRTCU1ngk\"",
    "mtime": "2026-02-17T07:37:46.621Z",
    "size": 201401,
    "path": "../public/_nuxt/Ge7aVWlp.js"
  },
  "/_nuxt/GLV6bXvn.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"c1b0e-ai8CArnzEh5VZ3Wr38IPSGkixWg\"",
    "mtime": "2026-02-17T07:37:46.623Z",
    "size": 793358,
    "path": "../public/_nuxt/GLV6bXvn.js"
  },
  "/_nuxt/HpEt9Uyk.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"42e-aW2s6AdQqq0ESewPA1XIYVBFqVA\"",
    "mtime": "2026-02-17T07:37:46.619Z",
    "size": 1070,
    "path": "../public/_nuxt/HpEt9Uyk.js"
  },
  "/_nuxt/index.DFq5GNq3.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"19e-a13u4eRWjVVkl/0fQNMSOJzb6B4\"",
    "mtime": "2026-02-17T07:37:46.618Z",
    "size": 414,
    "path": "../public/_nuxt/index.DFq5GNq3.css"
  },
  "/_nuxt/index.DJq8bBda.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"aa7-KZRlAomPLClPLvDcRnQllpaUung\"",
    "mtime": "2026-02-17T07:37:46.618Z",
    "size": 2727,
    "path": "../public/_nuxt/index.DJq8bBda.css"
  },
  "/_nuxt/index.DqEK38LF.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"25-mJlw9uVxw+Tr4GmABh/EQf1lFPA\"",
    "mtime": "2026-02-17T07:37:46.618Z",
    "size": 37,
    "path": "../public/_nuxt/index.DqEK38LF.css"
  },
  "/_nuxt/index.DquFj3O4.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"dcbe-kwmi3hFcuJPGnDCNs4Lrwh1bVbY\"",
    "mtime": "2026-02-17T07:37:46.618Z",
    "size": 56510,
    "path": "../public/_nuxt/index.DquFj3O4.css"
  },
  "/_nuxt/index.Eoru5CXy.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"3d32-sGQ9+X+8zdM7O+97UrJmfLjNEXA\"",
    "mtime": "2026-02-17T07:37:46.618Z",
    "size": 15666,
    "path": "../public/_nuxt/index.Eoru5CXy.css"
  },
  "/_nuxt/JX9M957j.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"353-eIWvm5x1egtQQCBGQaLHkgqQdzA\"",
    "mtime": "2026-02-17T07:37:46.619Z",
    "size": 851,
    "path": "../public/_nuxt/JX9M957j.js"
  },
  "/_nuxt/Lqo7GKtw.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"9c-wlA71986iQkyGIIq0mien4NEFtw\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 156,
    "path": "../public/_nuxt/Lqo7GKtw.js"
  },
  "/_nuxt/pWOVuSBC.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"4259-IfOhsnwXF0KloolD9SRS83pAEPo\"",
    "mtime": "2026-02-17T07:37:46.619Z",
    "size": 16985,
    "path": "../public/_nuxt/pWOVuSBC.js"
  },
  "/_nuxt/q44rLC6z.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"e4-G95dFArNCeUpRKP/yxHwXllK3c0\"",
    "mtime": "2026-02-17T07:37:46.621Z",
    "size": 228,
    "path": "../public/_nuxt/q44rLC6z.js"
  },
  "/_nuxt/schedule.BnjZroeW.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"2e87-51vKAQ65fpXFrxhA9EEgeDvCCwg\"",
    "mtime": "2026-02-17T07:37:46.618Z",
    "size": 11911,
    "path": "../public/_nuxt/schedule.BnjZroeW.css"
  },
  "/_nuxt/Syq1A2Zk.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"27c-rW5cx911JDsffZUHDeDek+nde1M\"",
    "mtime": "2026-02-17T07:37:46.619Z",
    "size": 636,
    "path": "../public/_nuxt/Syq1A2Zk.js"
  },
  "/_nuxt/Tmlno52m.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"3651-3tmHzoUjCX6PMOoLVHiliILKvD4\"",
    "mtime": "2026-02-17T07:37:46.619Z",
    "size": 13905,
    "path": "../public/_nuxt/Tmlno52m.js"
  },
  "/_nuxt/UFmxYCVi.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"166a-mFlMG1aE55nA+Q3Qmr7cEO9LF2U\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 5738,
    "path": "../public/_nuxt/UFmxYCVi.js"
  },
  "/_nuxt/Venw9Erh.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"ef4f-Bj9btGEAsgmJgMk5x94pBaGEc1A\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 61263,
    "path": "../public/_nuxt/Venw9Erh.js"
  },
  "/_nuxt/Wo1FWjcC.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"370a-Ii1oc959vr5rjokVKAmB4koflK8\"",
    "mtime": "2026-02-17T07:37:46.620Z",
    "size": 14090,
    "path": "../public/_nuxt/Wo1FWjcC.js"
  },
  "/_nuxt/xypuBDru.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"987a-AGejlsObpsZLWREgHR+HrrURZVQ\"",
    "mtime": "2026-02-17T07:37:46.621Z",
    "size": 39034,
    "path": "../public/_nuxt/xypuBDru.js"
  },
  "/_nuxt/_6Ji3naK.js": {
    "type": "text/javascript; charset=utf-8",
    "etag": "\"12e34-AfqmsA0VySp05mMrI3FfZR/8/yc\"",
    "mtime": "2026-02-17T07:37:46.621Z",
    "size": 77364,
    "path": "../public/_nuxt/_6Ji3naK.js"
  },
  "/_nuxt/_id_.C8uC9UML.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"189-NTZnFQk4Xn859yixo9iru/cYEIo\"",
    "mtime": "2026-02-17T07:37:46.618Z",
    "size": 393,
    "path": "../public/_nuxt/_id_.C8uC9UML.css"
  },
  "/_nuxt/_id_.Drpkajhx.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"311-dsnEBedBk9gEKW0PlqzSRsUCYWo\"",
    "mtime": "2026-02-17T07:37:46.618Z",
    "size": 785,
    "path": "../public/_nuxt/_id_.Drpkajhx.css"
  },
  "/images/brand/brand-01.svg": {
    "type": "image/svg+xml",
    "etag": "\"62d-sV/qcAa/afCKy5NxLSVrPV4UIAw\"",
    "mtime": "2026-01-16T14:50:45.181Z",
    "size": 1581,
    "path": "../public/images/brand/brand-01.svg"
  },
  "/images/brand/brand-02.svg": {
    "type": "image/svg+xml",
    "etag": "\"2df-j+wVddO+cdR59fQnLKKKlQlHp9M\"",
    "mtime": "2026-01-16T14:50:45.181Z",
    "size": 735,
    "path": "../public/images/brand/brand-02.svg"
  },
  "/images/brand/brand-03.svg": {
    "type": "image/svg+xml",
    "etag": "\"349-6puob6eLlSmkoO2iLP19iFzcFxM\"",
    "mtime": "2026-01-16T14:50:45.181Z",
    "size": 841,
    "path": "../public/images/brand/brand-03.svg"
  },
  "/images/brand/brand-04.svg": {
    "type": "image/svg+xml",
    "etag": "\"cee-GLE+mWGrjBjpGhbgmBqFm6aMbTM\"",
    "mtime": "2026-01-16T14:50:45.182Z",
    "size": 3310,
    "path": "../public/images/brand/brand-04.svg"
  },
  "/images/brand/brand-05.svg": {
    "type": "image/svg+xml",
    "etag": "\"4a3-z6z0kVXmAEfkFDndUcqAb00J/2E\"",
    "mtime": "2026-01-16T14:50:45.182Z",
    "size": 1187,
    "path": "../public/images/brand/brand-05.svg"
  },
  "/images/brand/brand-06.svg": {
    "type": "image/svg+xml",
    "etag": "\"2b0-Rc0f1Rilzm4AEDNKpy0XK0f8n70\"",
    "mtime": "2026-01-16T14:50:45.182Z",
    "size": 688,
    "path": "../public/images/brand/brand-06.svg"
  },
  "/images/brand/brand-07.svg": {
    "type": "image/svg+xml",
    "etag": "\"465-RjeeFtWU5pyQcDG+Uja9aZcOKbE\"",
    "mtime": "2026-01-16T14:50:45.183Z",
    "size": 1125,
    "path": "../public/images/brand/brand-07.svg"
  },
  "/images/brand/brand-08.svg": {
    "type": "image/svg+xml",
    "etag": "\"a6e-zRRFb+PEVHspCPizAqhuz00MKBE\"",
    "mtime": "2026-01-16T14:50:45.183Z",
    "size": 2670,
    "path": "../public/images/brand/brand-08.svg"
  },
  "/images/brand/brand-09.svg": {
    "type": "image/svg+xml",
    "etag": "\"381-qj5oFjbhEPe3f6YFQAtBaXfsHWU\"",
    "mtime": "2026-01-16T14:50:45.184Z",
    "size": 897,
    "path": "../public/images/brand/brand-09.svg"
  },
  "/images/brand/brand-10.svg": {
    "type": "image/svg+xml",
    "etag": "\"910-AqgrSWtCxYlQ/YUC/TaDonv2BG0\"",
    "mtime": "2026-01-16T14:50:45.184Z",
    "size": 2320,
    "path": "../public/images/brand/brand-10.svg"
  },
  "/images/brand/brand-11.svg": {
    "type": "image/svg+xml",
    "etag": "\"43f-DlFbKNWGxbod1NrJL3yl0Yvk1b8\"",
    "mtime": "2026-01-16T14:50:45.184Z",
    "size": 1087,
    "path": "../public/images/brand/brand-11.svg"
  },
  "/images/brand/brand-12.svg": {
    "type": "image/svg+xml",
    "etag": "\"608-EduR+Q/O0y0U2Q5XdX4Lu/l19bY\"",
    "mtime": "2026-01-16T14:50:45.185Z",
    "size": 1544,
    "path": "../public/images/brand/brand-12.svg"
  },
  "/images/brand/brand-13.svg": {
    "type": "image/svg+xml",
    "etag": "\"559-xKDiSZy5gV/XgRCasEEMPX3ikLg\"",
    "mtime": "2026-01-16T14:50:45.185Z",
    "size": 1369,
    "path": "../public/images/brand/brand-13.svg"
  },
  "/images/brand/brand-14.svg": {
    "type": "image/svg+xml",
    "etag": "\"69c-YOrzTVvKFN15uHptD0Y2mD1o4bE\"",
    "mtime": "2026-01-16T14:50:45.185Z",
    "size": 1692,
    "path": "../public/images/brand/brand-14.svg"
  },
  "/images/brand/brand-15.svg": {
    "type": "image/svg+xml",
    "etag": "\"481-oxoBDqmB0R9YCTQodqSqTVaZzRI\"",
    "mtime": "2026-01-16T14:50:45.186Z",
    "size": 1153,
    "path": "../public/images/brand/brand-15.svg"
  },
  "/images/carousel/carousel-01.png": {
    "type": "image/png",
    "etag": "\"d92ec-QgdOoMfh3vOr+87Y6l4DkfPeFKE\"",
    "mtime": "2026-01-16T14:50:45.200Z",
    "size": 889580,
    "path": "../public/images/carousel/carousel-01.png"
  },
  "/images/carousel/carousel-02.png": {
    "type": "image/png",
    "etag": "\"b00ed-RKJ5wCutncXLaU0LgKXW7h5DeLw\"",
    "mtime": "2026-01-16T14:50:45.203Z",
    "size": 721133,
    "path": "../public/images/carousel/carousel-02.png"
  },
  "/images/carousel/carousel-03.png": {
    "type": "image/png",
    "etag": "\"713e8-oHvLKsj2IP+9LaD6x6Jk7oeY95U\"",
    "mtime": "2026-01-16T14:50:45.205Z",
    "size": 463848,
    "path": "../public/images/carousel/carousel-03.png"
  },
  "/images/carousel/carousel-04.png": {
    "type": "image/png",
    "etag": "\"d4403-ZjbO5XUiatD8hul+BnGCYKa99PA\"",
    "mtime": "2026-01-16T14:50:45.209Z",
    "size": 869379,
    "path": "../public/images/carousel/carousel-04.png"
  },
  "/images/chat/chat.jpg": {
    "type": "image/jpeg",
    "etag": "\"11ac0-4/7VHS2rckrFInf0KHX/NnC8E3A\"",
    "mtime": "2026-01-16T14:50:45.210Z",
    "size": 72384,
    "path": "../public/images/chat/chat.jpg"
  },
  "/images/cards/card-01.jpg": {
    "type": "image/jpeg",
    "etag": "\"38b84-GpQZDU9Jpxc1ACIiken2iwZa1eo\"",
    "mtime": "2026-01-16T14:50:45.187Z",
    "size": 232324,
    "path": "../public/images/cards/card-01.jpg"
  },
  "/images/cards/card-01.png": {
    "type": "image/png",
    "etag": "\"569f3-tf6Z9OnmQnxJeYXQaGZCOTVgeSk\"",
    "mtime": "2026-01-16T14:50:45.189Z",
    "size": 354803,
    "path": "../public/images/cards/card-01.png"
  },
  "/images/cards/card-02.jpg": {
    "type": "image/jpeg",
    "etag": "\"2862a-WVqCd5J6QvfbLxU5OJEl530h/aM\"",
    "mtime": "2026-01-16T14:50:45.191Z",
    "size": 165418,
    "path": "../public/images/cards/card-02.jpg"
  },
  "/images/cards/card-02.png": {
    "type": "image/png",
    "etag": "\"4185f-+71tbQd9CcJq56pZk7Ow5VYQc7I\"",
    "mtime": "2026-01-16T14:50:45.193Z",
    "size": 268383,
    "path": "../public/images/cards/card-02.png"
  },
  "/images/cards/card-03.jpg": {
    "type": "image/jpeg",
    "etag": "\"2f343-uOMkH6YO5upcM68Qymd0LBqx7vg\"",
    "mtime": "2026-01-16T14:50:45.194Z",
    "size": 193347,
    "path": "../public/images/cards/card-03.jpg"
  },
  "/images/cards/card-03.png": {
    "type": "image/png",
    "etag": "\"4e228-Ocn8KtM0BeVWD1s86bCT/JnkaEc\"",
    "mtime": "2026-01-16T14:50:45.195Z",
    "size": 320040,
    "path": "../public/images/cards/card-03.png"
  },
  "/images/country/country-01.svg": {
    "type": "image/svg+xml",
    "etag": "\"8a3-VJHYnkP1MZ+ztnbFPKp9EdY2NLo\"",
    "mtime": "2026-01-16T14:50:45.210Z",
    "size": 2211,
    "path": "../public/images/country/country-01.svg"
  },
  "/images/country/country-02.svg": {
    "type": "image/svg+xml",
    "etag": "\"2b4-PEvX+jCnvDx3uFAckT5qP8mVRog\"",
    "mtime": "2026-01-16T14:50:45.211Z",
    "size": 692,
    "path": "../public/images/country/country-02.svg"
  },
  "/images/country/country-03.svg": {
    "type": "image/svg+xml",
    "etag": "\"750-e90fjhxGN3E+FW0ZNZqEJt3jobQ\"",
    "mtime": "2026-01-16T14:50:45.211Z",
    "size": 1872,
    "path": "../public/images/country/country-03.svg"
  },
  "/images/country/country-04.svg": {
    "type": "image/svg+xml",
    "etag": "\"9b1-1W9WDfAubzE1Vy0NE9VFgU7fd+Q\"",
    "mtime": "2026-01-16T14:50:45.211Z",
    "size": 2481,
    "path": "../public/images/country/country-04.svg"
  },
  "/images/country/country-05.svg": {
    "type": "image/svg+xml",
    "etag": "\"302-zQOIynwHTvKZkb9FlWuY+I/1kk8\"",
    "mtime": "2026-01-16T14:50:45.212Z",
    "size": 770,
    "path": "../public/images/country/country-05.svg"
  },
  "/images/country/country-06.svg": {
    "type": "image/svg+xml",
    "etag": "\"38d-s8upQ4VUV8eDTOzEwwHJYNzkdjU\"",
    "mtime": "2026-01-16T14:50:45.212Z",
    "size": 909,
    "path": "../public/images/country/country-06.svg"
  },
  "/images/country/country-07.svg": {
    "type": "image/svg+xml",
    "etag": "\"376-qKBK0nunAjQ0T1Lce+b1ZXKRglk\"",
    "mtime": "2026-01-16T14:50:45.212Z",
    "size": 886,
    "path": "../public/images/country/country-07.svg"
  },
  "/images/country/country-08.svg": {
    "type": "image/svg+xml",
    "etag": "\"2ca-0dZdz54mxc7AnI9RVGd7+3MJDVY\"",
    "mtime": "2026-01-16T14:50:45.213Z",
    "size": 714,
    "path": "../public/images/country/country-08.svg"
  },
  "/images/error/404-dark.svg": {
    "type": "image/svg+xml",
    "etag": "\"893-Me9U8bfg9y/V2pxsF2xy/Iz3uc8\"",
    "mtime": "2026-01-16T14:50:45.213Z",
    "size": 2195,
    "path": "../public/images/error/404-dark.svg"
  },
  "/images/error/404.svg": {
    "type": "image/svg+xml",
    "etag": "\"893-AF2FRowHUw0wfvx52YWVI+7J+lg\"",
    "mtime": "2026-01-16T14:50:45.213Z",
    "size": 2195,
    "path": "../public/images/error/404.svg"
  },
  "/images/error/500-dark.svg": {
    "type": "image/svg+xml",
    "etag": "\"b1b-RZlhL6CnVjnd8r7m5tylDcyCsnc\"",
    "mtime": "2026-01-16T14:50:45.214Z",
    "size": 2843,
    "path": "../public/images/error/500-dark.svg"
  },
  "/images/error/500.svg": {
    "type": "image/svg+xml",
    "etag": "\"b1b-bUFH0mHPCQSWAB2A7gzNEcLt1IY\"",
    "mtime": "2026-01-16T14:50:45.214Z",
    "size": 2843,
    "path": "../public/images/error/500.svg"
  },
  "/images/error/503-dark.svg": {
    "type": "image/svg+xml",
    "etag": "\"bea-8SucYsPjnw0L6njy5DtJ/ZK3lnc\"",
    "mtime": "2026-01-16T14:50:45.214Z",
    "size": 3050,
    "path": "../public/images/error/503-dark.svg"
  },
  "/images/error/503.svg": {
    "type": "image/svg+xml",
    "etag": "\"be6-QHWRf3SrehWoThjnNPG4DAZK9lw\"",
    "mtime": "2026-01-16T14:50:45.215Z",
    "size": 3046,
    "path": "../public/images/error/503.svg"
  },
  "/images/error/maintenance-dark.svg": {
    "type": "image/svg+xml",
    "etag": "\"ef9-8H/5rnYjlTltlUPdrDekPn1+7PY\"",
    "mtime": "2026-01-16T14:50:45.215Z",
    "size": 3833,
    "path": "../public/images/error/maintenance-dark.svg"
  },
  "/images/error/maintenance.svg": {
    "type": "image/svg+xml",
    "etag": "\"eff-BsEtR2v0C++mwqgCGVaNuH0RTuI\"",
    "mtime": "2026-01-16T14:50:45.215Z",
    "size": 3839,
    "path": "../public/images/error/maintenance.svg"
  },
  "/images/error/success-dark.svg": {
    "type": "image/svg+xml",
    "etag": "\"a4b-7xO55x9E7cQaCzfF5oIK08BJHMw\"",
    "mtime": "2026-01-16T14:50:45.216Z",
    "size": 2635,
    "path": "../public/images/error/success-dark.svg"
  },
  "/images/error/success.svg": {
    "type": "image/svg+xml",
    "etag": "\"a4b-2uLFe+rAx9Fda2Ou3d5lDlp/vCQ\"",
    "mtime": "2026-01-16T14:50:45.216Z",
    "size": 2635,
    "path": "../public/images/error/success.svg"
  },
  "/images/icons/file-image-dark.svg": {
    "type": "image/svg+xml",
    "etag": "\"6b3-IqeVzXgMzvNPThMyRZnBm5e7sls\"",
    "mtime": "2026-01-16T14:50:45.234Z",
    "size": 1715,
    "path": "../public/images/icons/file-image-dark.svg"
  },
  "/images/icons/file-image.svg": {
    "type": "image/svg+xml",
    "etag": "\"6b3-6KatN9QSODeA1tM9nRXsCtivldg\"",
    "mtime": "2026-01-16T14:50:45.235Z",
    "size": 1715,
    "path": "../public/images/icons/file-image.svg"
  },
  "/images/icons/file-pdf-dark.svg": {
    "type": "image/svg+xml",
    "etag": "\"ec7-INfurhQXd1Dn22uT3j7566YeVX0\"",
    "mtime": "2026-01-16T14:50:45.235Z",
    "size": 3783,
    "path": "../public/images/icons/file-pdf-dark.svg"
  },
  "/images/icons/file-pdf.svg": {
    "type": "image/svg+xml",
    "etag": "\"ec7-OZngSOw94SX4gTFTY0iUYBYmrfI\"",
    "mtime": "2026-01-16T14:50:45.235Z",
    "size": 3783,
    "path": "../public/images/icons/file-pdf.svg"
  },
  "/images/icons/file-video-dark.svg": {
    "type": "image/svg+xml",
    "etag": "\"537-qjZh2AKbRjJBpt4huq2mHBZGlqg\"",
    "mtime": "2026-01-16T14:50:45.235Z",
    "size": 1335,
    "path": "../public/images/icons/file-video-dark.svg"
  },
  "/images/icons/file-video.svg": {
    "type": "image/svg+xml",
    "etag": "\"537-zGv9FXfzjvGh120481+IebihyGw\"",
    "mtime": "2026-01-16T14:50:45.236Z",
    "size": 1335,
    "path": "../public/images/icons/file-video.svg"
  },
  "/images/grid-image/image-01.png": {
    "type": "image/png",
    "etag": "\"1318bd-uv7j2V5Kzf0zLbmWtLd8ZFhkulQ\"",
    "mtime": "2026-01-16T14:50:45.225Z",
    "size": 1251517,
    "path": "../public/images/grid-image/image-01.png"
  },
  "/images/grid-image/image-02.png": {
    "type": "image/png",
    "etag": "\"50635-juNoo4X5oN0m//Qwb3jLjmDWufU\"",
    "mtime": "2026-01-16T14:50:45.228Z",
    "size": 329269,
    "path": "../public/images/grid-image/image-02.png"
  },
  "/images/grid-image/image-03.png": {
    "type": "image/png",
    "etag": "\"765a9-KNl9vOfMe71H6ZeliVH5bkOH8gw\"",
    "mtime": "2026-01-16T14:50:45.231Z",
    "size": 484777,
    "path": "../public/images/grid-image/image-03.png"
  },
  "/images/grid-image/image-04.png": {
    "type": "image/png",
    "etag": "\"330d9-xwvZ25JzopyAzA82m2ECPL9gRFs\"",
    "mtime": "2026-01-16T14:50:45.232Z",
    "size": 209113,
    "path": "../public/images/grid-image/image-04.png"
  },
  "/images/grid-image/image-05.png": {
    "type": "image/png",
    "etag": "\"24fad-Kef/+7ccK2srFZjrzz7u/85c3y8\"",
    "mtime": "2026-01-16T14:50:45.233Z",
    "size": 151469,
    "path": "../public/images/grid-image/image-05.png"
  },
  "/images/grid-image/image-06.png": {
    "type": "image/png",
    "etag": "\"14006-liFQHD0/dN9FfMEDeUWW9z7Ag7A\"",
    "mtime": "2026-01-16T14:50:45.234Z",
    "size": 81926,
    "path": "../public/images/grid-image/image-06.png"
  },
  "/images/logo/auth-logo.svg": {
    "type": "image/svg+xml",
    "etag": "\"1936-Z/6CxAVkffk59nmpZhNQK/jHDgg\"",
    "mtime": "2026-01-16T14:50:45.236Z",
    "size": 6454,
    "path": "../public/images/logo/auth-logo.svg"
  },
  "/images/logo/logo-dark.svg": {
    "type": "image/svg+xml",
    "etag": "\"18d3-9VVnnQjKpf2a/laDDNTW+pGOjVc\"",
    "mtime": "2026-01-16T14:50:45.237Z",
    "size": 6355,
    "path": "../public/images/logo/logo-dark.svg"
  },
  "/images/logo/logo-icon.svg": {
    "type": "image/svg+xml",
    "etag": "\"d8c-zR+QojkMVF12sXNMJpDThrqQ9Z4\"",
    "mtime": "2026-01-16T14:50:45.237Z",
    "size": 3468,
    "path": "../public/images/logo/logo-icon.svg"
  },
  "/images/logo/logo.svg": {
    "type": "image/svg+xml",
    "etag": "\"192c-Wee1t63R8CmLDH8qiCriRm/vTXs\"",
    "mtime": "2026-01-16T14:50:45.237Z",
    "size": 6444,
    "path": "../public/images/logo/logo.svg"
  },
  "/images/product/product-01.jpg": {
    "type": "image/jpeg",
    "etag": "\"1d03-ECPQbZ8FFYLywd7DbNF5vBMeZBE\"",
    "mtime": "2026-01-16T14:50:45.238Z",
    "size": 7427,
    "path": "../public/images/product/product-01.jpg"
  },
  "/images/product/product-02.jpg": {
    "type": "image/jpeg",
    "etag": "\"2a4b-Qqke70gTTNoR7Hq8APAPor8ElgQ\"",
    "mtime": "2026-01-16T14:50:45.238Z",
    "size": 10827,
    "path": "../public/images/product/product-02.jpg"
  },
  "/images/product/product-03.jpg": {
    "type": "image/jpeg",
    "etag": "\"18b9-/bCW/KcxJ6aHAFblTz3cqJGTvhY\"",
    "mtime": "2026-01-16T14:50:45.239Z",
    "size": 6329,
    "path": "../public/images/product/product-03.jpg"
  },
  "/images/product/product-04.jpg": {
    "type": "image/jpeg",
    "etag": "\"10a5-1zBtyjGBgfL+BT9TZRvJWI8ZBXE\"",
    "mtime": "2026-01-16T14:50:45.239Z",
    "size": 4261,
    "path": "../public/images/product/product-04.jpg"
  },
  "/images/product/product-05.jpg": {
    "type": "image/jpeg",
    "etag": "\"c01-FWnHam55BbI8KIxkJOlxo3YtcV8\"",
    "mtime": "2026-01-16T14:50:45.239Z",
    "size": 3073,
    "path": "../public/images/product/product-05.jpg"
  },
  "/images/shape/grid-01.svg": {
    "type": "image/svg+xml",
    "etag": "\"17c5-gzcCBKLsKHv1v988tiGdoKxs0+o\"",
    "mtime": "2026-01-16T14:50:45.240Z",
    "size": 6085,
    "path": "../public/images/shape/grid-01.svg"
  },
  "/images/task/google-drive.svg": {
    "type": "image/svg+xml",
    "etag": "\"ae4-CUD8hnA/6eSBr2RaoV0PL1d/r4I\"",
    "mtime": "2026-01-16T14:50:45.240Z",
    "size": 2788,
    "path": "../public/images/task/google-drive.svg"
  },
  "/images/task/pdf.svg": {
    "type": "image/svg+xml",
    "etag": "\"852-vQQXl9jHoUtIlgD7SfoGB0UAW8o\"",
    "mtime": "2026-01-16T14:50:45.240Z",
    "size": 2130,
    "path": "../public/images/task/pdf.svg"
  },
  "/images/task/task.jpg": {
    "type": "image/jpeg",
    "etag": "\"12853-7cQUMNWqbwENoJIoiRPFIbfYr2s\"",
    "mtime": "2026-01-16T14:50:45.241Z",
    "size": 75859,
    "path": "../public/images/task/task.jpg"
  },
  "/images/task/task.png": {
    "type": "image/png",
    "etag": "\"23bca-I92maobAvKSN/4A41TR0CDIlTko\"",
    "mtime": "2026-01-16T14:50:45.242Z",
    "size": 146378,
    "path": "../public/images/task/task.png"
  },
  "/images/user/owner.jpg": {
    "type": "image/jpeg",
    "etag": "\"2530d-kCwz6h/RBBAQ/dPreOzqT79YD6Y\"",
    "mtime": "2026-01-16T14:50:45.244Z",
    "size": 152333,
    "path": "../public/images/user/owner.jpg"
  },
  "/images/user/user-01.jpg": {
    "type": "image/jpeg",
    "etag": "\"4878-cQ+l85bSJ3O0eKWTgRE86+b0XJM\"",
    "mtime": "2026-01-16T14:50:45.244Z",
    "size": 18552,
    "path": "../public/images/user/user-01.jpg"
  },
  "/images/user/user-02.jpg": {
    "type": "image/jpeg",
    "etag": "\"2558-17UfmfRUxPx8YeMoG1rpJ9yd5hg\"",
    "mtime": "2026-01-16T14:50:45.245Z",
    "size": 9560,
    "path": "../public/images/user/user-02.jpg"
  },
  "/images/user/user-03.jpg": {
    "type": "image/jpeg",
    "etag": "\"3262-p+MLa+0AowJXo+NVpX6zfHrDljc\"",
    "mtime": "2026-01-16T14:50:45.245Z",
    "size": 12898,
    "path": "../public/images/user/user-03.jpg"
  },
  "/images/user/user-04.jpg": {
    "type": "image/jpeg",
    "etag": "\"2527-IOeka64O/esaTz9iKwT1hZ9r7d4\"",
    "mtime": "2026-01-16T14:50:45.246Z",
    "size": 9511,
    "path": "../public/images/user/user-04.jpg"
  },
  "/images/user/user-05.jpg": {
    "type": "image/jpeg",
    "etag": "\"1dd3-WlE/93a8gHPBWGj/9+uH22W6KqE\"",
    "mtime": "2026-01-16T14:50:45.246Z",
    "size": 7635,
    "path": "../public/images/user/user-05.jpg"
  },
  "/images/user/user-06.jpg": {
    "type": "image/jpeg",
    "etag": "\"1c9e-ITXinvQ7P37LnM9haJ4zT5MUKH4\"",
    "mtime": "2026-01-16T14:50:45.246Z",
    "size": 7326,
    "path": "../public/images/user/user-06.jpg"
  },
  "/images/user/user-07.jpg": {
    "type": "image/jpeg",
    "etag": "\"1542-OjVoFVGvYQfxHfuqHykb+XZ0Eys\"",
    "mtime": "2026-01-16T14:50:45.247Z",
    "size": 5442,
    "path": "../public/images/user/user-07.jpg"
  },
  "/images/user/user-08.jpg": {
    "type": "image/jpeg",
    "etag": "\"1257-vnv7Ez+orX5qmwn6OcQJCQpksUk\"",
    "mtime": "2026-01-16T14:50:45.247Z",
    "size": 4695,
    "path": "../public/images/user/user-08.jpg"
  },
  "/images/user/user-09.jpg": {
    "type": "image/jpeg",
    "etag": "\"14a2-GSsKrbDaFdOzXQwCWhomK89llcU\"",
    "mtime": "2026-01-16T14:50:45.247Z",
    "size": 5282,
    "path": "../public/images/user/user-09.jpg"
  },
  "/images/user/user-10.jpg": {
    "type": "image/jpeg",
    "etag": "\"1526-YrX8aI5z2iSePLdH1SYewDHoE2c\"",
    "mtime": "2026-01-16T14:50:45.248Z",
    "size": 5414,
    "path": "../public/images/user/user-10.jpg"
  },
  "/images/user/user-11.jpg": {
    "type": "image/jpeg",
    "etag": "\"1322-HF2P+4Al6OALkAqJ76P4JQnT6u8\"",
    "mtime": "2026-01-16T14:50:45.248Z",
    "size": 4898,
    "path": "../public/images/user/user-11.jpg"
  },
  "/images/user/user-12.jpg": {
    "type": "image/jpeg",
    "etag": "\"147a-ybB4WYLXUDdjqqjbsWTL6jUAAYA\"",
    "mtime": "2026-01-16T14:50:45.249Z",
    "size": 5242,
    "path": "../public/images/user/user-12.jpg"
  },
  "/images/user/user-13.jpg": {
    "type": "image/jpeg",
    "etag": "\"102b-2o88kMk46H/wgY/+dlEYPZ2ni8c\"",
    "mtime": "2026-01-16T14:50:45.249Z",
    "size": 4139,
    "path": "../public/images/user/user-13.jpg"
  },
  "/images/user/user-14.jpg": {
    "type": "image/jpeg",
    "etag": "\"1312-Hia5SE/us29Ltux6Ow6cmYk72AA\"",
    "mtime": "2026-01-16T14:50:45.249Z",
    "size": 4882,
    "path": "../public/images/user/user-14.jpg"
  },
  "/images/user/user-15.jpg": {
    "type": "image/jpeg",
    "etag": "\"17ba-43EJYUv0KiCHoCp3Fk/yfPPzQik\"",
    "mtime": "2026-01-16T14:50:45.250Z",
    "size": 6074,
    "path": "../public/images/user/user-15.jpg"
  },
  "/images/user/user-16.jpg": {
    "type": "image/jpeg",
    "etag": "\"14c6-q8Ei1842O3rx1LbPXvLSsQcpZN4\"",
    "mtime": "2026-01-16T14:50:45.250Z",
    "size": 5318,
    "path": "../public/images/user/user-16.jpg"
  },
  "/images/user/user-17.jpg": {
    "type": "image/jpeg",
    "etag": "\"298a-GKRabxD+9sLUeOrg7lluEa1YlXc\"",
    "mtime": "2026-01-16T14:50:45.250Z",
    "size": 10634,
    "path": "../public/images/user/user-17.jpg"
  },
  "/images/user/user-18.jpg": {
    "type": "image/jpeg",
    "etag": "\"2664-yLvPbD6opLgORXonWwg5hySXkpY\"",
    "mtime": "2026-01-16T14:50:45.251Z",
    "size": 9828,
    "path": "../public/images/user/user-18.jpg"
  },
  "/images/user/user-19.jpg": {
    "type": "image/jpeg",
    "etag": "\"22fb-7AbTflE6OkAQt3Cy7bXoNDd8r04\"",
    "mtime": "2026-01-16T14:50:45.251Z",
    "size": 8955,
    "path": "../public/images/user/user-19.jpg"
  },
  "/images/user/user-20.jpg": {
    "type": "image/jpeg",
    "etag": "\"21dc-23Dsu1rRL1ScmkBVkB8c9RbJHaA\"",
    "mtime": "2026-01-16T14:50:45.251Z",
    "size": 8668,
    "path": "../public/images/user/user-20.jpg"
  },
  "/images/user/user-21.jpg": {
    "type": "image/jpeg",
    "etag": "\"210c-qgkKdi7R/s5jSc1fY9qH5vb0ZFE\"",
    "mtime": "2026-01-16T14:50:45.252Z",
    "size": 8460,
    "path": "../public/images/user/user-21.jpg"
  },
  "/images/user/user-22.jpg": {
    "type": "image/jpeg",
    "etag": "\"11bd-zHTylNVjfbTWUvzvj2b5vSYpSxI\"",
    "mtime": "2026-01-16T14:50:45.252Z",
    "size": 4541,
    "path": "../public/images/user/user-22.jpg"
  },
  "/images/user/user-23.jpg": {
    "type": "image/jpeg",
    "etag": "\"1290-bl0EkoBy9y+9LNwSVWwmORu4czo\"",
    "mtime": "2026-01-16T14:50:45.252Z",
    "size": 4752,
    "path": "../public/images/user/user-23.jpg"
  },
  "/images/user/user-24.jpg": {
    "type": "image/jpeg",
    "etag": "\"12ee-260T3b31APFxIzsAKqiUXfsozsU\"",
    "mtime": "2026-01-16T14:50:45.253Z",
    "size": 4846,
    "path": "../public/images/user/user-24.jpg"
  },
  "/images/user/user-25.jpg": {
    "type": "image/jpeg",
    "etag": "\"1391-qT47pCEbcAVHNy4SDju/3gNdnOw\"",
    "mtime": "2026-01-16T14:50:45.253Z",
    "size": 5009,
    "path": "../public/images/user/user-25.jpg"
  },
  "/images/user/user-26.jpg": {
    "type": "image/jpeg",
    "etag": "\"16fa-IzdNe0LmgDESz0BPHKGceJZLp5g\"",
    "mtime": "2026-01-16T14:50:45.254Z",
    "size": 5882,
    "path": "../public/images/user/user-26.jpg"
  },
  "/images/user/user-27.jpg": {
    "type": "image/jpeg",
    "etag": "\"151e-KMYvdx68zNf4Rx2AzZnxjCB1rMc\"",
    "mtime": "2026-01-16T14:50:45.254Z",
    "size": 5406,
    "path": "../public/images/user/user-27.jpg"
  },
  "/images/user/user-28.jpg": {
    "type": "image/jpeg",
    "etag": "\"1291-1i5bY8gXutayaUP2HhfyGBW052o\"",
    "mtime": "2026-01-16T14:50:45.254Z",
    "size": 4753,
    "path": "../public/images/user/user-28.jpg"
  },
  "/images/user/user-29.jpg": {
    "type": "image/jpeg",
    "etag": "\"13d8-g7O1HS2FmjDIf0QArfzPimNLgF8\"",
    "mtime": "2026-01-16T14:50:45.255Z",
    "size": 5080,
    "path": "../public/images/user/user-29.jpg"
  },
  "/images/user/user-30.jpg": {
    "type": "image/jpeg",
    "etag": "\"114a-yYiC0r1Ye6ceyM11VnQj731zvyY\"",
    "mtime": "2026-01-16T14:50:45.255Z",
    "size": 4426,
    "path": "../public/images/user/user-30.jpg"
  },
  "/images/user/user-31.jpg": {
    "type": "image/jpeg",
    "etag": "\"e12-GKjr5nBTKPEw9sjk+Q0bIi/WWao\"",
    "mtime": "2026-01-16T14:50:45.255Z",
    "size": 3602,
    "path": "../public/images/user/user-31.jpg"
  },
  "/images/user/user-32.jpg": {
    "type": "image/jpeg",
    "etag": "\"1447-sT8bhmu7FkPHUyxIptNe6ma59/o\"",
    "mtime": "2026-01-16T14:50:45.256Z",
    "size": 5191,
    "path": "../public/images/user/user-32.jpg"
  },
  "/images/user/user-33.jpg": {
    "type": "image/jpeg",
    "etag": "\"1491-w/YsUXLnuGAfHxFccV1hpufetY8\"",
    "mtime": "2026-01-16T14:50:45.256Z",
    "size": 5265,
    "path": "../public/images/user/user-33.jpg"
  },
  "/images/user/user-34.jpg": {
    "type": "image/jpeg",
    "etag": "\"3821-f8QGnOa3YHJkFA/3M6ikhoWsjYc\"",
    "mtime": "2026-01-16T14:50:45.256Z",
    "size": 14369,
    "path": "../public/images/user/user-34.jpg"
  },
  "/images/user/user-35.jpg": {
    "type": "image/jpeg",
    "etag": "\"3275-OD1ZqXl2oM5XvBJzL2V8/zmX3Q4\"",
    "mtime": "2026-01-16T14:50:45.257Z",
    "size": 12917,
    "path": "../public/images/user/user-35.jpg"
  },
  "/images/user/user-36.jpg": {
    "type": "image/jpeg",
    "etag": "\"359e-JRetTb8TL/W4XUbY7NSfc5PNN8A\"",
    "mtime": "2026-01-16T14:50:45.257Z",
    "size": 13726,
    "path": "../public/images/user/user-36.jpg"
  },
  "/images/user/user-37.jpg": {
    "type": "image/jpeg",
    "etag": "\"2f47-WvQOvfwKhN2knkHLJOGgYyA61h0\"",
    "mtime": "2026-01-16T14:50:45.258Z",
    "size": 12103,
    "path": "../public/images/user/user-37.jpg"
  },
  "/images/video-thumb/thumb-16.png": {
    "type": "image/png",
    "etag": "\"1da9e-Z/46xA5hTMoOZVOEcV4IiTCPQns\"",
    "mtime": "2026-01-16T14:50:45.259Z",
    "size": 121502,
    "path": "../public/images/video-thumb/thumb-16.png"
  },
  "/images/video-thumb/youtube-icon-84.svg": {
    "type": "image/svg+xml",
    "etag": "\"2b7-mLbi20SYFDht5doMnlz1bhnlElg\"",
    "mtime": "2026-01-16T14:50:45.259Z",
    "size": 695,
    "path": "../public/images/video-thumb/youtube-icon-84.svg"
  },
  "/uploads/certificate-backgrounds/.gitignore": {
    "type": "text/plain; charset=utf-8",
    "etag": "\"6f-+nTtYYhehs6i2nyo52jIMX/bX3E\"",
    "mtime": "2026-02-12T09:30:23.959Z",
    "size": 111,
    "path": "../public/uploads/certificate-backgrounds/.gitignore"
  },
  "/uploads/certificate-backgrounds/b45809f8-66ba-473e-98ff-bf33affe9c94_920d90e6-5832-4907-a1b9-23a53c196e45.png": {
    "type": "image/png",
    "etag": "\"10d995-lx3jcUUnRorsknahwu5BYKtE9a8\"",
    "mtime": "2026-02-12T09:55:15.375Z",
    "size": 1104277,
    "path": "../public/uploads/certificate-backgrounds/b45809f8-66ba-473e-98ff-bf33affe9c94_920d90e6-5832-4907-a1b9-23a53c196e45.png"
  },
  "/uploads/certificate-images/.gitignore": {
    "type": "text/plain; charset=utf-8",
    "etag": "\"82-VV58SE0wW5ku4/6yPjEYSB5v18Q\"",
    "mtime": "2026-02-12T09:30:30.009Z",
    "size": 130,
    "path": "../public/uploads/certificate-images/.gitignore"
  },
  "/uploads/certificate-images/b45809f8-66ba-473e-98ff-bf33affe9c94_2dc838d4-7088-42e3-b029-0168cd1df149.png": {
    "type": "image/png",
    "etag": "\"10d995-lx3jcUUnRorsknahwu5BYKtE9a8\"",
    "mtime": "2026-02-12T09:55:00.078Z",
    "size": 1104277,
    "path": "../public/uploads/certificate-images/b45809f8-66ba-473e-98ff-bf33affe9c94_2dc838d4-7088-42e3-b029-0168cd1df149.png"
  },
  "/_nuxt/builds/latest.json": {
    "type": "application/json",
    "etag": "\"47-Eb3geyPG7bTmonuXtb+2a1K+cwg\"",
    "mtime": "2026-02-17T07:38:09.612Z",
    "size": 71,
    "path": "../public/_nuxt/builds/latest.json"
  },
  "/_nuxt/builds/meta/0b0e2424-ca24-4b48-81c2-0eaa34b203c2.json": {
    "type": "application/json",
    "etag": "\"8b-buTzEnIWfk1cbEOc5pUOrnbqC3U\"",
    "mtime": "2026-02-17T07:38:09.612Z",
    "size": 139,
    "path": "../public/_nuxt/builds/meta/0b0e2424-ca24-4b48-81c2-0eaa34b203c2.json"
  }
};

const _DRIVE_LETTER_START_RE = /^[A-Za-z]:\//;
function normalizeWindowsPath(input = "") {
  if (!input) {
    return input;
  }
  return input.replace(/\\/g, "/").replace(_DRIVE_LETTER_START_RE, (r) => r.toUpperCase());
}
const _IS_ABSOLUTE_RE = /^[/\\](?![/\\])|^[/\\]{2}(?!\.)|^[A-Za-z]:[/\\]/;
const _DRIVE_LETTER_RE = /^[A-Za-z]:$/;
function cwd() {
  if (typeof process !== "undefined" && typeof process.cwd === "function") {
    return process.cwd().replace(/\\/g, "/");
  }
  return "/";
}
const resolve = function(...arguments_) {
  arguments_ = arguments_.map((argument) => normalizeWindowsPath(argument));
  let resolvedPath = "";
  let resolvedAbsolute = false;
  for (let index = arguments_.length - 1; index >= -1 && !resolvedAbsolute; index--) {
    const path = index >= 0 ? arguments_[index] : cwd();
    if (!path || path.length === 0) {
      continue;
    }
    resolvedPath = `${path}/${resolvedPath}`;
    resolvedAbsolute = isAbsolute(path);
  }
  resolvedPath = normalizeString(resolvedPath, !resolvedAbsolute);
  if (resolvedAbsolute && !isAbsolute(resolvedPath)) {
    return `/${resolvedPath}`;
  }
  return resolvedPath.length > 0 ? resolvedPath : ".";
};
function normalizeString(path, allowAboveRoot) {
  let res = "";
  let lastSegmentLength = 0;
  let lastSlash = -1;
  let dots = 0;
  let char = null;
  for (let index = 0; index <= path.length; ++index) {
    if (index < path.length) {
      char = path[index];
    } else if (char === "/") {
      break;
    } else {
      char = "/";
    }
    if (char === "/") {
      if (lastSlash === index - 1 || dots === 1) ; else if (dots === 2) {
        if (res.length < 2 || lastSegmentLength !== 2 || res[res.length - 1] !== "." || res[res.length - 2] !== ".") {
          if (res.length > 2) {
            const lastSlashIndex = res.lastIndexOf("/");
            if (lastSlashIndex === -1) {
              res = "";
              lastSegmentLength = 0;
            } else {
              res = res.slice(0, lastSlashIndex);
              lastSegmentLength = res.length - 1 - res.lastIndexOf("/");
            }
            lastSlash = index;
            dots = 0;
            continue;
          } else if (res.length > 0) {
            res = "";
            lastSegmentLength = 0;
            lastSlash = index;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          res += res.length > 0 ? "/.." : "..";
          lastSegmentLength = 2;
        }
      } else {
        if (res.length > 0) {
          res += `/${path.slice(lastSlash + 1, index)}`;
        } else {
          res = path.slice(lastSlash + 1, index);
        }
        lastSegmentLength = index - lastSlash - 1;
      }
      lastSlash = index;
      dots = 0;
    } else if (char === "." && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}
const isAbsolute = function(p) {
  return _IS_ABSOLUTE_RE.test(p);
};
const dirname = function(p) {
  const segments = normalizeWindowsPath(p).replace(/\/$/, "").split("/").slice(0, -1);
  if (segments.length === 1 && _DRIVE_LETTER_RE.test(segments[0])) {
    segments[0] += "/";
  }
  return segments.join("/") || (isAbsolute(p) ? "/" : ".");
};

function readAsset (id) {
  const serverDir = dirname(fileURLToPath(globalThis._importMeta_.url));
  return promises.readFile(resolve(serverDir, assets[id].path))
}

const publicAssetBases = {"/_nuxt/builds/meta/":{"maxAge":31536000},"/_nuxt/builds/":{"maxAge":1},"/storage/":{"maxAge":604800},"/_nuxt/":{"maxAge":31536000}};

function isPublicAssetURL(id = '') {
  if (assets[id]) {
    return true
  }
  for (const base in publicAssetBases) {
    if (id.startsWith(base)) { return true }
  }
  return false
}

function getAsset (id) {
  return assets[id]
}

const METHODS = /* @__PURE__ */ new Set(["HEAD", "GET"]);
const EncodingMap = { gzip: ".gz", br: ".br" };
const _vG0UXR = eventHandler((event) => {
  if (event.method && !METHODS.has(event.method)) {
    return;
  }
  let id = decodePath(
    withLeadingSlash(withoutTrailingSlash(parseURL(event.path).pathname))
  );
  let asset;
  const encodingHeader = String(
    getRequestHeader$2(event, "accept-encoding") || ""
  );
  const encodings = [
    ...encodingHeader.split(",").map((e) => EncodingMap[e.trim()]).filter(Boolean).sort(),
    ""
  ];
  if (encodings.length > 1) {
    appendResponseHeader$2(event, "Vary", "Accept-Encoding");
  }
  for (const encoding of encodings) {
    for (const _id of [id + encoding, joinURL(id, "index.html" + encoding)]) {
      const _asset = getAsset(_id);
      if (_asset) {
        asset = _asset;
        id = _id;
        break;
      }
    }
  }
  if (!asset) {
    if (isPublicAssetURL(id)) {
      removeResponseHeader(event, "Cache-Control");
      throw createError$3({ statusCode: 404 });
    }
    return;
  }
  const ifNotMatch = getRequestHeader$2(event, "if-none-match") === asset.etag;
  if (ifNotMatch) {
    setResponseStatus$1(event, 304, "Not Modified");
    return "";
  }
  const ifModifiedSinceH = getRequestHeader$2(event, "if-modified-since");
  const mtimeDate = new Date(asset.mtime);
  if (ifModifiedSinceH && asset.mtime && new Date(ifModifiedSinceH) >= mtimeDate) {
    setResponseStatus$1(event, 304, "Not Modified");
    return "";
  }
  if (asset.type && !getResponseHeader(event, "Content-Type")) {
    setResponseHeader$2(event, "Content-Type", asset.type);
  }
  if (asset.etag && !getResponseHeader(event, "ETag")) {
    setResponseHeader$2(event, "ETag", asset.etag);
  }
  if (asset.mtime && !getResponseHeader(event, "Last-Modified")) {
    setResponseHeader$2(event, "Last-Modified", mtimeDate.toUTCString());
  }
  if (asset.encoding && !getResponseHeader(event, "Content-Encoding")) {
    setResponseHeader$2(event, "Content-Encoding", asset.encoding);
  }
  if (asset.size > 0 && !getResponseHeader(event, "Content-Length")) {
    setResponseHeader$2(event, "Content-Length", asset.size);
  }
  return readAsset(id);
});

function parse$2(str, options) {
  if (typeof str !== "string") {
    throw new TypeError("argument str must be a string");
  }
  const obj = {};
  const opt = {};
  const dec = opt.decode || decode$1;
  let index = 0;
  while (index < str.length) {
    const eqIdx = str.indexOf("=", index);
    if (eqIdx === -1) {
      break;
    }
    let endIdx = str.indexOf(";", index);
    if (endIdx === -1) {
      endIdx = str.length;
    } else if (endIdx < eqIdx) {
      index = str.lastIndexOf(";", eqIdx - 1) + 1;
      continue;
    }
    const key = str.slice(index, eqIdx).trim();
    if (opt?.filter && !opt?.filter(key)) {
      index = endIdx + 1;
      continue;
    }
    if (void 0 === obj[key]) {
      let val = str.slice(eqIdx + 1, endIdx).trim();
      if (val.codePointAt(0) === 34) {
        val = val.slice(1, -1);
      }
      obj[key] = tryDecode$1(val, dec);
    }
    index = endIdx + 1;
  }
  return obj;
}
function decode$1(str) {
  return str.includes("%") ? decodeURIComponent(str) : str;
}
function tryDecode$1(str, decode2) {
  try {
    return decode2(str);
  } catch {
    return str;
  }
}

const fieldContentRegExp = /^[\u0009\u0020-\u007E\u0080-\u00FF]+$/;
function serialize(name, value, options) {
  const opt = options || {};
  const enc = opt.encode || encodeURIComponent;
  if (typeof enc !== "function") {
    throw new TypeError("option encode is invalid");
  }
  if (!fieldContentRegExp.test(name)) {
    throw new TypeError("argument name is invalid");
  }
  const encodedValue = enc(value);
  if (encodedValue && !fieldContentRegExp.test(encodedValue)) {
    throw new TypeError("argument val is invalid");
  }
  let str = name + "=" + encodedValue;
  if (void 0 !== opt.maxAge && opt.maxAge !== null) {
    const maxAge = opt.maxAge - 0;
    if (Number.isNaN(maxAge) || !Number.isFinite(maxAge)) {
      throw new TypeError("option maxAge is invalid");
    }
    str += "; Max-Age=" + Math.floor(maxAge);
  }
  if (opt.domain) {
    if (!fieldContentRegExp.test(opt.domain)) {
      throw new TypeError("option domain is invalid");
    }
    str += "; Domain=" + opt.domain;
  }
  if (opt.path) {
    if (!fieldContentRegExp.test(opt.path)) {
      throw new TypeError("option path is invalid");
    }
    str += "; Path=" + opt.path;
  }
  if (opt.expires) {
    if (!isDate(opt.expires) || Number.isNaN(opt.expires.valueOf())) {
      throw new TypeError("option expires is invalid");
    }
    str += "; Expires=" + opt.expires.toUTCString();
  }
  if (opt.httpOnly) {
    str += "; HttpOnly";
  }
  if (opt.secure) {
    str += "; Secure";
  }
  if (opt.priority) {
    const priority = typeof opt.priority === "string" ? opt.priority.toLowerCase() : opt.priority;
    switch (priority) {
      case "low": {
        str += "; Priority=Low";
        break;
      }
      case "medium": {
        str += "; Priority=Medium";
        break;
      }
      case "high": {
        str += "; Priority=High";
        break;
      }
      default: {
        throw new TypeError("option priority is invalid");
      }
    }
  }
  if (opt.sameSite) {
    const sameSite = typeof opt.sameSite === "string" ? opt.sameSite.toLowerCase() : opt.sameSite;
    switch (sameSite) {
      case true: {
        str += "; SameSite=Strict";
        break;
      }
      case "lax": {
        str += "; SameSite=Lax";
        break;
      }
      case "strict": {
        str += "; SameSite=Strict";
        break;
      }
      case "none": {
        str += "; SameSite=None";
        break;
      }
      default: {
        throw new TypeError("option sameSite is invalid");
      }
    }
  }
  if (opt.partitioned) {
    str += "; Partitioned";
  }
  return str;
}
function isDate(val) {
  return Object.prototype.toString.call(val) === "[object Date]" || val instanceof Date;
}

function parseSetCookie(setCookieValue, options) {
  const parts = (setCookieValue || "").split(";").filter((str) => typeof str === "string" && !!str.trim());
  const nameValuePairStr = parts.shift() || "";
  const parsed = _parseNameValuePair(nameValuePairStr);
  const name = parsed.name;
  let value = parsed.value;
  try {
    value = options?.decode === false ? value : (options?.decode || decodeURIComponent)(value);
  } catch {
  }
  const cookie = {
    name,
    value
  };
  for (const part of parts) {
    const sides = part.split("=");
    const partKey = (sides.shift() || "").trimStart().toLowerCase();
    const partValue = sides.join("=");
    switch (partKey) {
      case "expires": {
        cookie.expires = new Date(partValue);
        break;
      }
      case "max-age": {
        cookie.maxAge = Number.parseInt(partValue, 10);
        break;
      }
      case "secure": {
        cookie.secure = true;
        break;
      }
      case "httponly": {
        cookie.httpOnly = true;
        break;
      }
      case "samesite": {
        cookie.sameSite = partValue;
        break;
      }
      default: {
        cookie[partKey] = partValue;
      }
    }
  }
  return cookie;
}
function _parseNameValuePair(nameValuePairStr) {
  let name = "";
  let value = "";
  const nameValueArr = nameValuePairStr.split("=");
  if (nameValueArr.length > 1) {
    name = nameValueArr.shift();
    value = nameValueArr.join("=");
  } else {
    value = nameValuePairStr;
  }
  return { name, value };
}

function hasProp(obj, prop) {
  try {
    return prop in obj;
  } catch {
    return false;
  }
}

class H3Error extends Error {
  static __h3_error__ = true;
  statusCode = 500;
  fatal = false;
  unhandled = false;
  statusMessage;
  data;
  cause;
  constructor(message, opts = {}) {
    super(message, opts);
    if (opts.cause && !this.cause) {
      this.cause = opts.cause;
    }
  }
  toJSON() {
    const obj = {
      message: this.message,
      statusCode: sanitizeStatusCode(this.statusCode, 500)
    };
    if (this.statusMessage) {
      obj.statusMessage = sanitizeStatusMessage(this.statusMessage);
    }
    if (this.data !== void 0) {
      obj.data = this.data;
    }
    return obj;
  }
}
function createError(input) {
  if (typeof input === "string") {
    return new H3Error(input);
  }
  if (isError(input)) {
    return input;
  }
  const err = new H3Error(input.message ?? input.statusMessage ?? "", {
    cause: input.cause || input
  });
  if (hasProp(input, "stack")) {
    try {
      Object.defineProperty(err, "stack", {
        get() {
          return input.stack;
        }
      });
    } catch {
      try {
        err.stack = input.stack;
      } catch {
      }
    }
  }
  if (input.data) {
    err.data = input.data;
  }
  if (input.statusCode) {
    err.statusCode = sanitizeStatusCode(input.statusCode, err.statusCode);
  } else if (input.status) {
    err.statusCode = sanitizeStatusCode(input.status, err.statusCode);
  }
  if (input.statusMessage) {
    err.statusMessage = input.statusMessage;
  } else if (input.statusText) {
    err.statusMessage = input.statusText;
  }
  if (err.statusMessage) {
    const originalMessage = err.statusMessage;
    const sanitizedMessage = sanitizeStatusMessage(err.statusMessage);
    if (sanitizedMessage !== originalMessage) {
      console.warn(
        "[h3] Please prefer using `message` for longer error messages instead of `statusMessage`. In the future, `statusMessage` will be sanitized by default."
      );
    }
  }
  if (input.fatal !== void 0) {
    err.fatal = input.fatal;
  }
  if (input.unhandled !== void 0) {
    err.unhandled = input.unhandled;
  }
  return err;
}
function isError(input) {
  return input?.constructor?.__h3_error__ === true;
}

function parse$1(multipartBodyBuffer, boundary) {
  let lastline = "";
  let state = 0 /* INIT */;
  let buffer = [];
  const allParts = [];
  let currentPartHeaders = [];
  for (let i = 0; i < multipartBodyBuffer.length; i++) {
    const prevByte = i > 0 ? multipartBodyBuffer[i - 1] : null;
    const currByte = multipartBodyBuffer[i];
    const newLineChar = currByte === 10 || currByte === 13;
    if (!newLineChar) {
      lastline += String.fromCodePoint(currByte);
    }
    const newLineDetected = currByte === 10 && prevByte === 13;
    if (0 /* INIT */ === state && newLineDetected) {
      if ("--" + boundary === lastline) {
        state = 1 /* READING_HEADERS */;
      }
      lastline = "";
    } else if (1 /* READING_HEADERS */ === state && newLineDetected) {
      if (lastline.length > 0) {
        const i2 = lastline.indexOf(":");
        if (i2 > 0) {
          const name = lastline.slice(0, i2).toLowerCase();
          const value = lastline.slice(i2 + 1).trim();
          currentPartHeaders.push([name, value]);
        }
      } else {
        state = 2 /* READING_DATA */;
        buffer = [];
      }
      lastline = "";
    } else if (2 /* READING_DATA */ === state) {
      if (lastline.length > boundary.length + 4) {
        lastline = "";
      }
      if ("--" + boundary === lastline) {
        const j = buffer.length - lastline.length;
        const part = buffer.slice(0, j - 1);
        allParts.push(process$1(part, currentPartHeaders));
        buffer = [];
        currentPartHeaders = [];
        lastline = "";
        state = 3 /* READING_PART_SEPARATOR */;
      } else {
        buffer.push(currByte);
      }
      if (newLineDetected) {
        lastline = "";
      }
    } else if (3 /* READING_PART_SEPARATOR */ === state && newLineDetected) {
      state = 1 /* READING_HEADERS */;
    }
  }
  return allParts;
}
function process$1(data, headers) {
  const dataObj = {};
  const contentDispositionHeader = headers.find((h) => h[0] === "content-disposition")?.[1] || "";
  for (const i of contentDispositionHeader.split(";")) {
    const s = i.split("=");
    if (s.length !== 2) {
      continue;
    }
    const key = (s[0] || "").trim();
    if (key === "name" || key === "filename") {
      const _value = (s[1] || "").trim().replace(/"/g, "");
      dataObj[key] = Buffer.from(_value, "latin1").toString("utf8");
    }
  }
  const contentType = headers.find((h) => h[0] === "content-type")?.[1] || "";
  if (contentType) {
    dataObj.type = contentType;
  }
  dataObj.data = Buffer.from(data);
  return dataObj;
}

function getQuery(event) {
  return getQuery$2(event.path || "");
}
function getRouterParams(event, opts = {}) {
  let params = event.context.params || {};
  if (opts.decode) {
    params = { ...params };
    for (const key in params) {
      params[key] = decode$2(params[key]);
    }
  }
  return params;
}
function getRouterParam(event, name, opts = {}) {
  const params = getRouterParams(event, opts);
  return params[name];
}
function isMethod(event, expected, allowHead) {
  if (typeof expected === "string") {
    if (event.method === expected) {
      return true;
    }
  } else if (expected.includes(event.method)) {
    return true;
  }
  return false;
}
function assertMethod(event, expected, allowHead) {
  if (!isMethod(event, expected)) {
    throw createError({
      statusCode: 405,
      statusMessage: "HTTP method is not allowed."
    });
  }
}
function getRequestHeaders(event) {
  const _headers = {};
  for (const key in event.node.req.headers) {
    const val = event.node.req.headers[key];
    _headers[key] = Array.isArray(val) ? val.filter(Boolean).join(", ") : val;
  }
  return _headers;
}
const getHeaders = getRequestHeaders;
function getRequestHeader(event, name) {
  const headers = getRequestHeaders(event);
  const value = headers[name.toLowerCase()];
  return value;
}
const getHeader = getRequestHeader;
function getRequestIP(event, opts = {}) {
  if (event.context.clientAddress) {
    return event.context.clientAddress;
  }
  if (opts.xForwardedFor) {
    const xForwardedFor = getRequestHeader(event, "x-forwarded-for")?.split(",").shift()?.trim();
    if (xForwardedFor) {
      return xForwardedFor;
    }
  }
  if (event.node.req.socket.remoteAddress) {
    return event.node.req.socket.remoteAddress;
  }
}

const RawBodySymbol = Symbol.for("h3RawBody");
const ParsedBodySymbol = Symbol.for("h3ParsedBody");
const PayloadMethods$1 = ["PATCH", "POST", "PUT", "DELETE"];
function readRawBody(event, encoding = "utf8") {
  assertMethod(event, PayloadMethods$1);
  const _rawBody = event._requestBody || event.web?.request?.body || event.node.req[RawBodySymbol] || event.node.req.rawBody || event.node.req.body;
  if (_rawBody) {
    const promise2 = Promise.resolve(_rawBody).then((_resolved) => {
      if (Buffer.isBuffer(_resolved)) {
        return _resolved;
      }
      if (typeof _resolved.pipeTo === "function") {
        return new Promise((resolve, reject) => {
          const chunks = [];
          _resolved.pipeTo(
            new WritableStream({
              write(chunk) {
                chunks.push(chunk);
              },
              close() {
                resolve(Buffer.concat(chunks));
              },
              abort(reason) {
                reject(reason);
              }
            })
          ).catch(reject);
        });
      } else if (typeof _resolved.pipe === "function") {
        return new Promise((resolve, reject) => {
          const chunks = [];
          _resolved.on("data", (chunk) => {
            chunks.push(chunk);
          }).on("end", () => {
            resolve(Buffer.concat(chunks));
          }).on("error", reject);
        });
      }
      if (_resolved.constructor === Object) {
        return Buffer.from(JSON.stringify(_resolved));
      }
      if (_resolved instanceof URLSearchParams) {
        return Buffer.from(_resolved.toString());
      }
      if (_resolved instanceof FormData) {
        return new Response(_resolved).bytes().then((uint8arr) => Buffer.from(uint8arr));
      }
      return Buffer.from(_resolved);
    });
    return encoding ? promise2.then((buff) => buff.toString(encoding)) : promise2;
  }
  if (!Number.parseInt(event.node.req.headers["content-length"] || "") && !/\bchunked\b/i.test(
    String(event.node.req.headers["transfer-encoding"] ?? "")
  )) {
    return Promise.resolve(void 0);
  }
  const promise = event.node.req[RawBodySymbol] = new Promise(
    (resolve, reject) => {
      const bodyData = [];
      event.node.req.on("error", (err) => {
        reject(err);
      }).on("data", (chunk) => {
        bodyData.push(chunk);
      }).on("end", () => {
        resolve(Buffer.concat(bodyData));
      });
    }
  );
  const result = encoding ? promise.then((buff) => buff.toString(encoding)) : promise;
  return result;
}
async function readBody(event, options = {}) {
  const request = event.node.req;
  if (hasProp(request, ParsedBodySymbol)) {
    return request[ParsedBodySymbol];
  }
  const contentType = request.headers["content-type"] || "";
  const body = await readRawBody(event);
  let parsed;
  if (contentType === "application/json") {
    parsed = _parseJSON(body, options.strict ?? true);
  } else if (contentType.startsWith("application/x-www-form-urlencoded")) {
    parsed = _parseURLEncodedBody(body);
  } else if (contentType.startsWith("text/")) {
    parsed = body;
  } else {
    parsed = _parseJSON(body, options.strict ?? false);
  }
  request[ParsedBodySymbol] = parsed;
  return parsed;
}
async function readMultipartFormData(event) {
  const contentType = getRequestHeader(event, "content-type");
  if (!contentType || !contentType.startsWith("multipart/form-data")) {
    return;
  }
  const boundary = contentType.match(/boundary=([^;]*)(;|$)/i)?.[1];
  if (!boundary) {
    return;
  }
  const body = await readRawBody(event, false);
  if (!body) {
    return;
  }
  return parse$1(body, boundary);
}
function _parseJSON(body = "", strict) {
  if (!body) {
    return void 0;
  }
  try {
    return destr(body, { strict });
  } catch {
    throw createError({
      statusCode: 400,
      statusMessage: "Bad Request",
      message: "Invalid JSON body"
    });
  }
}
function _parseURLEncodedBody(body) {
  const form = new URLSearchParams(body);
  const parsedForm = /* @__PURE__ */ Object.create(null);
  for (const [key, value] of form.entries()) {
    if (hasProp(parsedForm, key)) {
      if (!Array.isArray(parsedForm[key])) {
        parsedForm[key] = [parsedForm[key]];
      }
      parsedForm[key].push(value);
    } else {
      parsedForm[key] = value;
    }
  }
  return parsedForm;
}

const DISALLOWED_STATUS_CHARS = /[^\u0009\u0020-\u007E]/g;
function sanitizeStatusMessage(statusMessage = "") {
  return statusMessage.replace(DISALLOWED_STATUS_CHARS, "");
}
function sanitizeStatusCode(statusCode, defaultStatusCode = 200) {
  if (!statusCode) {
    return defaultStatusCode;
  }
  if (typeof statusCode === "string") {
    statusCode = Number.parseInt(statusCode, 10);
  }
  if (statusCode < 100 || statusCode > 999) {
    return defaultStatusCode;
  }
  return statusCode;
}

function getDistinctCookieKey(name, opts) {
  return [name, opts.domain || "", opts.path || "/"].join(";");
}

function parseCookies(event) {
  return parse$2(event.node.req.headers.cookie || "");
}
function getCookie(event, name) {
  return parseCookies(event)[name];
}
function setCookie(event, name, value, serializeOptions = {}) {
  if (!serializeOptions.path) {
    serializeOptions = { path: "/", ...serializeOptions };
  }
  const newCookie = serialize(name, value, serializeOptions);
  const currentCookies = splitCookiesString(
    event.node.res.getHeader("set-cookie")
  );
  if (currentCookies.length === 0) {
    event.node.res.setHeader("set-cookie", newCookie);
    return;
  }
  const newCookieKey = getDistinctCookieKey(name, serializeOptions);
  event.node.res.removeHeader("set-cookie");
  for (const cookie of currentCookies) {
    const parsed = parseSetCookie(cookie);
    const key = getDistinctCookieKey(parsed.name, parsed);
    if (key === newCookieKey) {
      continue;
    }
    event.node.res.appendHeader("set-cookie", cookie);
  }
  event.node.res.appendHeader("set-cookie", newCookie);
}
function deleteCookie(event, name, serializeOptions) {
  setCookie(event, name, "", {
    ...serializeOptions,
    maxAge: 0
  });
}
function splitCookiesString(cookiesString) {
  if (Array.isArray(cookiesString)) {
    return cookiesString.flatMap((c) => splitCookiesString(c));
  }
  if (typeof cookiesString !== "string") {
    return [];
  }
  const cookiesStrings = [];
  let pos = 0;
  let start;
  let ch;
  let lastComma;
  let nextStart;
  let cookiesSeparatorFound;
  const skipWhitespace = () => {
    while (pos < cookiesString.length && /\s/.test(cookiesString.charAt(pos))) {
      pos += 1;
    }
    return pos < cookiesString.length;
  };
  const notSpecialChar = () => {
    ch = cookiesString.charAt(pos);
    return ch !== "=" && ch !== ";" && ch !== ",";
  };
  while (pos < cookiesString.length) {
    start = pos;
    cookiesSeparatorFound = false;
    while (skipWhitespace()) {
      ch = cookiesString.charAt(pos);
      if (ch === ",") {
        lastComma = pos;
        pos += 1;
        skipWhitespace();
        nextStart = pos;
        while (pos < cookiesString.length && notSpecialChar()) {
          pos += 1;
        }
        if (pos < cookiesString.length && cookiesString.charAt(pos) === "=") {
          cookiesSeparatorFound = true;
          pos = nextStart;
          cookiesStrings.push(cookiesString.slice(start, lastComma));
          start = pos;
        } else {
          pos = lastComma + 1;
        }
      } else {
        pos += 1;
      }
    }
    if (!cookiesSeparatorFound || pos >= cookiesString.length) {
      cookiesStrings.push(cookiesString.slice(start));
    }
  }
  return cookiesStrings;
}

typeof setImmediate === "undefined" ? (fn) => fn() : setImmediate;
function setResponseHeader(event, name, value) {
  event.node.res.setHeader(name, value);
}
const setHeader = setResponseHeader;
function appendResponseHeader(event, name, value) {
  let current = event.node.res.getHeader(name);
  if (!current) {
    event.node.res.setHeader(name, value);
    return;
  }
  if (!Array.isArray(current)) {
    current = [current.toString()];
  }
  event.node.res.setHeader(name, [...current, value]);
}
const appendHeader = appendResponseHeader;
function sendStream(event, stream) {
  if (!stream || typeof stream !== "object") {
    throw new Error("[h3] Invalid stream provided.");
  }
  event.node.res._data = stream;
  if (!event.node.res.socket) {
    event._handled = true;
    return Promise.resolve();
  }
  if (hasProp(stream, "pipeTo") && typeof stream.pipeTo === "function") {
    return stream.pipeTo(
      new WritableStream({
        write(chunk) {
          event.node.res.write(chunk);
        }
      })
    ).then(() => {
      event.node.res.end();
    });
  }
  if (hasProp(stream, "pipe") && typeof stream.pipe === "function") {
    return new Promise((resolve, reject) => {
      stream.pipe(event.node.res);
      if (stream.on) {
        stream.on("end", () => {
          event.node.res.end();
          resolve();
        });
        stream.on("error", (error) => {
          reject(error);
        });
      }
      event.node.res.on("close", () => {
        if (stream.abort) {
          stream.abort();
        }
      });
    });
  }
  throw new Error("[h3] Invalid or incompatible stream provided.");
}

function defineEventHandler(handler) {
  if (typeof handler === "function") {
    handler.__is_handler__ = true;
    return handler;
  }
  const _hooks = {
    onRequest: _normalizeArray(handler.onRequest),
    onBeforeResponse: _normalizeArray(handler.onBeforeResponse)
  };
  const _handler = (event) => {
    return _callHandler(event, handler.handler, _hooks);
  };
  _handler.__is_handler__ = true;
  _handler.__resolve__ = handler.handler.__resolve__;
  _handler.__websocket__ = handler.websocket;
  return _handler;
}
function _normalizeArray(input) {
  return input ? Array.isArray(input) ? input : [input] : void 0;
}
async function _callHandler(event, handler, hooks) {
  if (hooks.onRequest) {
    for (const hook of hooks.onRequest) {
      await hook(event);
      if (event.handled) {
        return;
      }
    }
  }
  const body = await handler(event);
  const response = { body };
  if (hooks.onBeforeResponse) {
    for (const hook of hooks.onBeforeResponse) {
      await hook(event, response);
    }
  }
  return response.body;
}

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "your-refresh-secret";
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "30d";
const SALT_ROUNDS = 10;
async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}
async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
}
function generateRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN
  });
}
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}
function verifyRefreshToken(token) {
  try {
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET);
    return decoded;
  } catch (error) {
    console.error("Refresh token verification failed:", error);
    return null;
  }
}
function extractToken(authHeader) {
  if (!authHeader) {
    return null;
  }
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }
  return parts[1] || null;
}
function toPublicUser(user) {
  const { password_hash, student_id, instructor_id, ...rest } = user;
  return {
    ...rest,
    studentId: student_id || null,
    instructorId: instructor_id || null
  };
}
function createTokenPayload(user) {
  return {
    userId: user.id,
    email: user.email,
    role: user.role
  };
}
function requireAuth(event) {
  if (!event.context.user) {
    throw createError({
      statusCode: 401,
      message: "Unauthorized"
    });
  }
  return event.context.user;
}

const auth = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  createTokenPayload: createTokenPayload,
  extractToken: extractToken,
  generateRefreshToken: generateRefreshToken,
  generateToken: generateToken,
  hashPassword: hashPassword,
  requireAuth: requireAuth,
  toPublicUser: toPublicUser,
  verifyPassword: verifyPassword,
  verifyRefreshToken: verifyRefreshToken,
  verifyToken: verifyToken
}, Symbol.toStringTag, { value: 'Module' }));

var UserRole = /* @__PURE__ */ ((UserRole2) => {
  UserRole2["ADMIN"] = "ADMIN";
  UserRole2["MANAGER"] = "MANAGER";
  UserRole2["TEACHER"] = "TEACHER";
  UserRole2["STUDENT"] = "STUDENT";
  return UserRole2;
})(UserRole || {});

const PUBLIC_ROUTES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/refresh",
  "/api/db/test",
  "/api/db/init",
  "/api/certificates/download",
  // Скачивание сертификатов (защищено UUID)
  "/api/debug",
  // Debug endpoints (только для разработки!)
  "/api/tg-app"
  // Telegram Mini App (использует свою систему авторизации)
];
const ROLE_PROTECTED_ROUTES = {
  "/api/admin": [UserRole.ADMIN],
  "/api/users": [UserRole.ADMIN, UserRole.MANAGER],
  "/api/teachers": [UserRole.ADMIN, UserRole.MANAGER],
  "/api/students/my-courses": [
    UserRole.STUDENT,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.TEACHER
  ],
  "/api/students/notifications": [
    UserRole.STUDENT,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.TEACHER
  ],
  "/api/students/dashboard": [
    UserRole.STUDENT,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.TEACHER
  ],
  "/api/students": [UserRole.ADMIN, UserRole.MANAGER, UserRole.TEACHER],
  "/api/schedule/settings": [
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.TEACHER
  ],
  "/api/schedule/periods": [UserRole.ADMIN, UserRole.MANAGER, UserRole.TEACHER]
};
function isPublicRoute(path) {
  return PUBLIC_ROUTES.some((route) => path.startsWith(route));
}
function getRequiredRoles(path) {
  let matchedRoles = null;
  let longestMatch = 0;
  for (const [route, roles] of Object.entries(ROLE_PROTECTED_ROUTES)) {
    if (path.startsWith(route) && route.length > longestMatch) {
      matchedRoles = roles;
      longestMatch = route.length;
    }
  }
  return matchedRoles;
}
function hasRequiredRole(userRole, requiredRoles) {
  return requiredRoles.includes(userRole);
}
const _nfk6fU = defineEventHandler(async (event) => {
  const path = event.path;
  if (!path.startsWith("/api")) {
    return;
  }
  if (isPublicRoute(path)) {
    return;
  }
  const requiredRoles = getRequiredRoles(path);
  const requiresStrictAuth = requiredRoles !== null;
  let token;
  const authHeader = getHeader(event, "authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  } else {
    token = getCookie(event, "auth_token");
  }
  if (!token && requiresStrictAuth) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
      message: "\u0422\u043E\u043A\u0435\u043D \u043D\u0435 \u043F\u0440\u0435\u0434\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D. \u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u0430\u0443\u0442\u0435\u043D\u0442\u0438\u0444\u0438\u043A\u0430\u0446\u0438\u044F."
    });
  }
  if (!token) {
    return;
  }
  const payload = verifyToken(token);
  if (!payload) {
    if (requiresStrictAuth) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized",
        message: "\u041D\u0435\u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0439 \u0438\u043B\u0438 \u0438\u0441\u0442\u0435\u043A\u0448\u0438\u0439 \u0442\u043E\u043A\u0435\u043D."
      });
    }
    return;
  }
  if (requiredRoles && !hasRequiredRole(payload.role, requiredRoles)) {
    throw createError({
      statusCode: 403,
      statusMessage: "Forbidden",
      message: `\u0414\u043E\u0441\u0442\u0443\u043F \u0437\u0430\u043F\u0440\u0435\u0449\u0435\u043D. \u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u043E\u0434\u043D\u0430 \u0438\u0437 \u0440\u043E\u043B\u0435\u0439: ${requiredRoles.join(", ")}`
    });
  }
  event.context.user = {
    id: payload.userId,
    email: payload.email,
    role: payload.role
  };
});

const _SxA8c9 = defineEventHandler(() => {});

const _lazy_kGngi_ = () => import('../routes/api/index.get.mjs');
const _lazy_1KsdaF = () => import('../routes/api/activity-logs/user/_userId_.get.mjs');
const _lazy_0tn3_G = () => import('../routes/api/admin/ai-settings/_id_.delete.mjs');
const _lazy_wGpnC1 = () => import('../routes/api/admin/ai-settings/_id_.put.mjs');
const _lazy_YxVLUl = () => import('../routes/api/admin/ai-settings/errors.get.mjs');
const _lazy_BhRKxh = () => import('../routes/api/admin/index.get.mjs');
const _lazy_nYLGrD = () => import('../routes/api/admin/index.post.mjs');
const _lazy_LrLhc3 = () => import('../routes/api/admin/ai-settings/stats.get.mjs');
const _lazy_p4hxmb = () => import('../routes/api/admin/ai-settings/test.post.mjs');
const _lazy_V7W94i = () => import('../routes/api/admin/ai-settings/usage.get.mjs');
const _lazy_krpoYG = () => import('../routes/api/admin/dashboard.get.mjs');
const _lazy_knUe3G = () => import('../routes/api/ai-certificates/batch/analyze.post.mjs');
const _lazy_rifk6q = () => import('../routes/api/ai-certificates/batch/confirm.post.mjs');
const _lazy_KG4lHu = () => import('../routes/api/ai-certificates/batch/upload.post.mjs');
const _lazy_7oH8d_ = () => import('../routes/api/ai-certificates/logs.get.mjs');
const _lazy_8RhZ77 = () => import('../routes/api/ai-certificates/search-students.get.mjs');
const _lazy_PfvZv5 = () => import('../routes/api/ai-certificates/stats.get.mjs');
const _lazy_iST699 = () => import('../routes/api/index.post.mjs');
const _lazy_P_5vgp = () => import('../routes/api/attendance/journal.get.mjs');
const _lazy_RI6t9X = () => import('../routes/api/attendance/marking/check/_eventId_.get.mjs');
const _lazy_VFeKPD = () => import('../routes/api/attendance/marking/overdue.get.mjs');
const _lazy_4AG02n = () => import('../routes/api/attendance/marking/pending.get.mjs');
const _lazy_5QD9ut = () => import('../routes/api/attendance/marking/requests.get.mjs');
const _lazy_1bS97y = () => import('../routes/api/attendance/marking/requests.post.mjs');
const _lazy_F41Duh = () => import('../routes/api/attendance/marking/requests/_id_.put.mjs');
const _lazy_inb8gR = () => import('../routes/api/attendance/marking/settings.get.mjs');
const _lazy_Rm42JG = () => import('../routes/api/attendance/marking/settings.put.mjs');
const _lazy_HNfCFt = () => import('../routes/api/attendance/marking/status.get.mjs');
const _lazy_E6zn_y = () => import('../routes/api/auth/login.post.mjs');
const _lazy_lnGnE9 = () => import('../routes/api/auth/logout.post.mjs');
const _lazy_8NTn9n = () => import('../routes/api/auth/refresh.post.mjs');
const _lazy_z8iHfO = () => import('../routes/api/auth/register.post.mjs');
const _lazy_DxolEN = () => import('../routes/api/auth/verify.get.mjs');
const _lazy_P9THBa = () => import('../routes/api/certificates/_id_.delete.mjs');
const _lazy_t1SnMA = () => import('../routes/api/certificates/_id_.get.mjs');
const _lazy_zrrFxZ = () => import('../routes/api/certificates/_id/revoke.patch.mjs');
const _lazy_7MNNzg = () => import('../routes/api/certificates/download/_id_.get.mjs');
const _lazy_qSlY55 = () => import('../routes/api/certificates/import/analyze.post.mjs');
const _lazy_Er_jaD = () => import('../routes/api/certificates/import/execute.post.mjs');
const _lazy_aQjyyL = () => import('../routes/api/certificates/import/status/_id_.get.mjs');
const _lazy_jZV72V = () => import('../routes/api/index.get2.mjs');
const _lazy_cqDwX5 = () => import('../routes/api/certificates/issue/_groupId_.get.mjs');
const _lazy_Y2r3TZ = () => import('../routes/api/certificates/issue/_groupId_.post.mjs');
const _lazy_SkCTIz = () => import('../routes/api/certificates/issue/_groupId/instructors.get.mjs');
const _lazy_LlEg8I = () => import('../routes/api/certificates/manual.post.mjs');
const _lazy_KaBWGO = () => import('../routes/api/certificates/my.get.mjs');
const _lazy_U92eBw = () => import('../routes/api/certificates/report/_groupId_.get.mjs');
const _lazy_Z8CCdo = () => import('../routes/api/certificates/templates/_id_.delete.mjs');
const _lazy_pb0cXx = () => import('../routes/api/certificates/templates/_id_.get.mjs');
const _lazy_TVr0lD = () => import('../routes/api/certificates/templates/_id_.put.mjs');
const _lazy_QKlKF9 = () => import('../routes/api/certificates/templates/_id/duplicate.post.mjs');
const _lazy_FykHOg = () => import('../routes/api/certificates/templates/_id/preview.get.mjs');
const _lazy_Qzu4jw = () => import('../routes/api/certificates/templates/_id/sync-counter.post.mjs');
const _lazy_dKcUNM = () => import('../routes/api/certificates/templates/_id/upload-background.post.mjs');
const _lazy_5aw3mJ = () => import('../routes/api/certificates/templates/_id/upload-image.post.mjs');
const _lazy_oEPTOE = () => import('../routes/api/certificates/index.get.mjs');
const _lazy_kIlELP = () => import('../routes/api/certificates/index.post.mjs');
const _lazy_LpbGSs = () => import('../routes/api/certificates/templates/sources.get.mjs');
const _lazy_sb7l8u = () => import('../routes/api/classrooms/_id_.delete.mjs');
const _lazy_M3hG5_ = () => import('../routes/api/classrooms/_id_.put.mjs');
const _lazy_ayL_mQ = () => import('../routes/api/index.get3.mjs');
const _lazy_oasPsk = () => import('../routes/api/index.post2.mjs');
const _lazy_luSr2c = () => import('../routes/api/courses/_id_.delete.mjs');
const _lazy_wXxvOb = () => import('../routes/api/courses/_id_.get.mjs');
const _lazy_O3Ich3 = () => import('../routes/api/courses/_id_.put.mjs');
const _lazy_XRy_vS = () => import('../routes/api/courses/_id/archive.put.mjs');
const _lazy_v0b2ql = () => import('../routes/api/courses/_id/disciplines.post.mjs');
const _lazy_QqDaik = () => import('../routes/api/courses/_id/disciplines/_disciplineId_.delete.mjs');
const _lazy_BUZ02a = () => import('../routes/api/courses/_id/disciplines/_disciplineId_.patch.mjs');
const _lazy_unWk8U = () => import('../routes/api/index.get4.mjs');
const _lazy_aWaBOq = () => import('../routes/api/index.post3.mjs');
const _lazy_5AcIJl = () => import('../routes/api/courses/templates.get.mjs');
const _lazy_ymYQKZ = () => import('../routes/api/db/init.get.mjs');
const _lazy_Cczys_ = () => import('../routes/api/debug/fix-instructor-link.get.mjs');
const _lazy_sYVZWS = () => import('../routes/api/discipline-tests/_id_.delete.mjs');
const _lazy_Q3XdVj = () => import('../routes/api/discipline-tests/_id_.put.mjs');
const _lazy_3I1Q_q = () => import('../routes/api/index.get5.mjs');
const _lazy_qAzvm6 = () => import('../routes/api/index.post4.mjs');
const _lazy_CqjHwr = () => import('../routes/api/environment/check-db.get.mjs');
const _lazy_14zDks = () => import('../routes/api/environment/current.get.mjs');
const _lazy_dzGJJW = () => import('../routes/api/environment/migrate.post.mjs');
const _lazy_V0fAWw = () => import('../routes/api/environment/restart.post.mjs');
const _lazy_L92fU1 = () => import('../routes/api/environment/save.post.mjs');
const _lazy_Z4cyJy = () => import('../routes/api/environment/test-connection.post.mjs');
const _lazy_rMN2iV = () => import('../routes/api/files/_uuid_.delete.mjs');
const _lazy_Rakq_c = () => import('../routes/api/files/_uuid_.get.mjs');
const _lazy_nnRUZI = () => import('../routes/api/files/_uuid/rename.put.mjs');
const _lazy_4ymflF = () => import('../routes/api/index.get6.mjs');
const _lazy_pq7O8B = () => import('../routes/api/files/sync.post.mjs');
const _lazy_2wERvP = () => import('../routes/api/files/upload.post.mjs');
const _lazy_kWgden = () => import('../routes/api/final-grades/bulk.post.mjs');
const _lazy_p0J7NH = () => import('../routes/api/index.post5.mjs');
const _lazy_KJAGoW = () => import('../routes/api/folders/_id/contents.get.mjs');
const _lazy_uLE8VM = () => import('../routes/api/folders/_id/move.put.mjs');
const _lazy_H4L3lR = () => import('../routes/api/folders/_id/path.get.mjs');
const _lazy_GaybyW = () => import('../routes/api/folders/_id/remove-password.delete.mjs');
const _lazy_5PsV4B = () => import('../routes/api/folders/_id/rename.put.mjs');
const _lazy_hlsHnu = () => import('../routes/api/folders/_id/set-password.post.mjs');
const _lazy_PJAdN6 = () => import('../routes/api/folders/_id/verify-password.post.mjs');
const _lazy_dqAF2_ = () => import('../routes/api/folders/by-name/_name_.get.mjs');
const _lazy_jZx3nW = () => import('../routes/api/index.get7.mjs');
const _lazy_YepCVu = () => import('../routes/api/index.post6.mjs');
const _lazy_ZvA5PR = () => import('../routes/api/index.post7.mjs');
const _lazy_sqJaSm = () => import('../routes/api/groups/_id_.delete.mjs');
const _lazy_5w1iz0 = () => import('../routes/api/groups/_id_.get.mjs');
const _lazy_Ip_46a = () => import('../routes/api/groups/_id_.put.mjs');
const _lazy_U3T4D5 = () => import('../routes/api/groups/_id/archive.put.mjs');
const _lazy_LP2qZZ = () => import('../routes/api/groups/_id/disciplines.get.mjs');
const _lazy_s01JrA = () => import('../routes/api/groups/_id/reports/_fileId_.delete.mjs');
const _lazy_97lnlO = () => import('../routes/api/groups/_id/reports/_fileId_.get.mjs');
const _lazy_zgz7vG = () => import('../routes/api/groups/_id/index.get.mjs');
const _lazy_qmWHmA = () => import('../routes/api/groups/_id/index.post.mjs');
const _lazy_rrJ5d1 = () => import('../routes/api/groups/_id/students/_studentId_.delete.mjs');
const _lazy_c4WdHM = () => import('../routes/api/groups/_id/index.post2.mjs');
const _lazy_5tjRR5 = () => import('../routes/api/groups/_id/students/transfer.post.mjs');
const _lazy_KSa4ce = () => import('../routes/api/index.get8.mjs');
const _lazy_VmNAb3 = () => import('../routes/api/index.post8.mjs');
const _lazy_Dqx8Xh = () => import('../routes/api/groups/select.get.mjs');
const _lazy_9M9yOJ = () => import('../routes/api/instructors/_id_.delete.mjs');
const _lazy_5uwSJ1 = () => import('../routes/api/instructors/_id_.get.mjs');
const _lazy_cKbvZE = () => import('../routes/api/instructors/_id_.put.mjs');
const _lazy_WXbRvc = () => import('../routes/api/instructors/_id/course-history.get.mjs');
const _lazy_R0e89X = () => import('../routes/api/instructors/_id/hours.get.mjs');
const _lazy_xE1uBg = () => import('../routes/api/instructors/_id/hours/check.get.mjs');
const _lazy_RVmkfz = () => import('../routes/api/instructors/all.get.mjs');
const _lazy_GCmKJv = () => import('../routes/api/index.get9.mjs');
const _lazy_uYc0IA = () => import('../routes/api/index.post9.mjs');
const _lazy_GZvmaw = () => import('../routes/api/library/admin/books/_id/access/_userId_.delete.mjs');
const _lazy_vg5BT3 = () => import('../routes/api/library/admin/books/_id/index.delete.mjs');
const _lazy_w8kwKo = () => import('../routes/api/library/admin/books/_id/index.get.mjs');
const _lazy_ScE3cj = () => import('../routes/api/library/admin/books/_id/index.post.mjs');
const _lazy_na1gne = () => import('../routes/api/library/admin/books/_id/analytics.get.mjs');
const _lazy_zU6PES = () => import('../routes/api/library/admin/books/index.delete.mjs');
const _lazy_BgvfcW = () => import('../routes/api/library/admin/books/index.get.mjs');
const _lazy_6QadK_ = () => import('../routes/api/library/admin/books/index.patch.mjs');
const _lazy_2KN7zQ = () => import('../routes/api/library/admin/books/_id/reprocess.post.mjs');
const _lazy_rdCBJo = () => import('../routes/api/library/admin/books/export.get.mjs');
const _lazy_3dRWbc = () => import('../routes/api/library/admin/index.get.mjs');
const _lazy_f_MERD = () => import('../routes/api/library/admin/index.post.mjs');
const _lazy_2LgOBS = () => import('../routes/api/library/catalog/_id_.get.mjs');
const _lazy_d2U7R4 = () => import('../routes/api/library/index.get.mjs');
const _lazy_LTwTKF = () => import('../routes/api/library/covers/_bookId_.get.mjs');
const _lazy_h9z28b = () => import('../routes/api/library/reading/_bookId/end.post.mjs');
const _lazy_xE2GaF = () => import('../routes/api/library/reading/_bookId/page/_pageNumber_.get.mjs');
const _lazy_abFgMK = () => import('../routes/api/library/reading/_bookId/progress.get.mjs');
const _lazy_lwiN0j = () => import('../routes/api/library/reading/_bookId/progress.post.mjs');
const _lazy_Hrzioh = () => import('../routes/api/library/reading/_bookId/start.post.mjs');
const _lazy_eRaMrf = () => import('../routes/api/maintain/fix-certificate-paths.get.mjs');
const _lazy_IiUwZr = () => import('../routes/api/manager/dashboard.get.mjs');
const _lazy_oMnjMW = () => import('../routes/api/organizations/_id_.delete.mjs');
const _lazy_l_PJ2B = () => import('../routes/api/organizations/_id_.get.mjs');
const _lazy_os3dpF = () => import('../routes/api/organizations/_id_.put.mjs');
const _lazy_7_Xrbm = () => import('../routes/api/organizations/_id/certificates/archive.get.mjs');
const _lazy_cMJsLt = () => import('../routes/api/organizations/_id/courses.get.mjs');
const _lazy_rb1BCC = () => import('../routes/api/organizations/_id/groups.get.mjs');
const _lazy_QJWgmH = () => import('../routes/api/organizations/_id/stats.get.mjs');
const _lazy_fryp5e = () => import('../routes/api/index.get10.mjs');
const _lazy_Ujz97K = () => import('../routes/api/index.post10.mjs');
const _lazy_NVY535 = () => import('../routes/api/organizations/search.get.mjs');
const _lazy_yjRtPO = () => import('../routes/api/organizations/stats.get.mjs');
const _lazy_3FVpv5 = () => import('../routes/api/index.get11.mjs');
const _lazy_x8_KlX = () => import('../routes/api/index.put.mjs');
const _lazy_3LQ6Xc = () => import('../routes/api/profile/password.put.mjs');
const _lazy_W0woDW = () => import('../routes/api/profile/settings.get.mjs');
const _lazy_LuX4BE = () => import('../routes/api/profile/settings.put.mjs');
const _lazy_JBQiuS = () => import('../routes/api/profile/stats/admin.get.mjs');
const _lazy_wxCbsT = () => import('../routes/api/reports/log-download.post.mjs');
const _lazy_XAQZHu = () => import('../routes/api/representatives/_id_.delete.mjs');
const _lazy_WoL2Xr = () => import('../routes/api/representatives/_id_.get.mjs');
const _lazy_ZX8bpf = () => import('../routes/api/representatives/_id_.patch.mjs');
const _lazy_oRNmM1 = () => import('../routes/api/representatives/_id/approve.post.mjs');
const _lazy_sMjT5I = () => import('../routes/api/representatives/_id/block.post.mjs');
const _lazy_4gagOT = () => import('../routes/api/representatives/_id/requests.get.mjs');
const _lazy_QCpKdw = () => import('../routes/api/representatives/_id/unblock.post.mjs');
const _lazy_J6OIMd = () => import('../routes/api/index.get12.mjs');
const _lazy_i0QPFl = () => import('../routes/api/representatives/pending.get.mjs');
const _lazy_I0Rbhx = () => import('../routes/api/representatives/stats.get.mjs');
const _lazy_5wAxvw = () => import('../routes/api/schedule/_id_.delete.mjs');
const _lazy_lqYges = () => import('../routes/api/schedule/_id_.put.mjs');
const _lazy_04JgUb = () => import('../routes/api/schedule/bulk-copy.post.mjs');
const _lazy_JH6jK9 = () => import('../routes/api/schedule/bulk-delete.post.mjs');
const _lazy_wbSnRO = () => import('../routes/api/schedule/bulk-move.post.mjs');
const _lazy_GUfI46 = () => import('../routes/api/index.get13.mjs');
const _lazy_nmBN59 = () => import('../routes/api/index.post11.mjs');
const _lazy_2wd6vW = () => import('../routes/api/schedule/index.get.mjs');
const _lazy_bJF0DS = () => import('../routes/api/schedule/index.put.mjs');
const _lazy_Z4bUd1 = () => import('../routes/api/schedule/retake.post.mjs');
const _lazy_2mgcux = () => import('../routes/api/schedule/index.get2.mjs');
const _lazy_8xwhFX = () => import('../routes/api/schedule/index.put2.mjs');
const _lazy_Ok8uie = () => import('../routes/api/schedule/templates/_id_.delete.mjs');
const _lazy_XPSY3n = () => import('../routes/api/schedule/templates/_id/apply.post.mjs');
const _lazy_3vSO_2 = () => import('../routes/api/schedule/index.get3.mjs');
const _lazy_JUpmko = () => import('../routes/api/schedule/index.post.mjs');
const _lazy_RDYsgA = () => import('../routes/api/students/_id_.delete.mjs');
const _lazy_tHLd8w = () => import('../routes/api/students/_id_.get.mjs');
const _lazy_HbV7u6 = () => import('../routes/api/students/_id_.put.mjs');
const _lazy_ng8Oxw = () => import('../routes/api/students/_id/certificates.post.mjs');
const _lazy_PHyrFI = () => import('../routes/api/students/_id/courses.get.mjs');
const _lazy_p3iGcG = () => import('../routes/api/students/_id/reset-password.post.mjs');
const _lazy_Nsih3R = () => import('../routes/api/students/dashboard.get.mjs');
const _lazy_aQEzEE = () => import('../routes/api/students/import/analyze.post.mjs');
const _lazy_zCp5Wp = () => import('../routes/api/students/import/execute.post.mjs');
const _lazy_KbX4xn = () => import('../routes/api/students/import/status/_jobId_.get.mjs');
const _lazy_5Qs2Yv = () => import('../routes/api/index.get14.mjs');
const _lazy_Qvq2Mv = () => import('../routes/api/index.post12.mjs');
const _lazy_iKoY6j = () => import('../routes/api/students/my-courses.get.mjs');
const _lazy_2BhJV3 = () => import('../routes/api/students/my-courses/_id_.get.mjs');
const _lazy_aXS6go = () => import('../routes/api/students/notifications.get.mjs');
const _lazy_go4j4E = () => import('../routes/api/students/notifications/_id/read.post.mjs');
const _lazy_6x2DAS = () => import('../routes/api/students/notifications/_id/read.put.mjs');
const _lazy__a6PzZ = () => import('../routes/api/students/notifications/read-all.put.mjs');
const _lazy_fiIUQL = () => import('../routes/api/students/upcoming-deadlines.get.mjs');
const _lazy_ZxPAeS = () => import('../routes/api/support/tickets.get.mjs');
const _lazy_aacx9X = () => import('../routes/api/support/tickets.post.mjs');
const _lazy_9BpiP0 = () => import('../routes/api/teacher/dashboard.get.mjs');
const _lazy_7SLwrl = () => import('../routes/api/telegram/send.post.mjs');
const _lazy_0vZ840 = () => import('../routes/api/telegram/setup-webhook.post.mjs');
const _lazy_Sf1uDj = () => import('../routes/api/telegram/webhook-info.get.mjs');
const _lazy_2vQbnU = () => import('../routes/api/telegram/webhook.delete.mjs');
const _lazy_bN_duN = () => import('../routes/api/telegram/webhook.post.mjs');
const _lazy_3CVq4w = () => import('../routes/api/test-bank/banks/_id_.delete.mjs');
const _lazy_x7lFub = () => import('../routes/api/test-bank/banks/_id_.get.mjs');
const _lazy_EVS9Se = () => import('../routes/api/test-bank/banks/_id_.put.mjs');
const _lazy_OeofP_ = () => import('../routes/api/test-bank/banks/_id/validate-languages.get.mjs');
const _lazy_TzNkDr = () => import('../routes/api/test-bank/banks/categories.get.mjs');
const _lazy_Regwma = () => import('../routes/api/test-bank/index.get.mjs');
const _lazy_4pm42h = () => import('../routes/api/test-bank/index.post.mjs');
const _lazy_N_9qTd = () => import('../routes/api/test-bank/banks/select.get.mjs');
const _lazy_uQ4bJb = () => import('../routes/api/test-bank/questions/_id_.delete.mjs');
const _lazy_Xafitr = () => import('../routes/api/test-bank/questions/_id_.get.mjs');
const _lazy_GtwLcR = () => import('../routes/api/test-bank/questions/_id_.put.mjs');
const _lazy_jJZksf = () => import('../routes/api/test-bank/questions/import.post.mjs');
const _lazy_sOpQmH = () => import('../routes/api/test-bank/index.get2.mjs');
const _lazy_HyOjVl = () => import('../routes/api/test-bank/index.post2.mjs');
const _lazy_BACazn = () => import('../routes/api/test-bank/questions/reorder.put.mjs');
const _lazy_FEgEtS = () => import('../routes/api/test-bank/questions/stats-by-language.get.mjs');
const _lazy_t1p5FD = () => import('../routes/api/test-bank/templates/_id_.delete.mjs');
const _lazy_V3n_Va = () => import('../routes/api/test-bank/templates/_id_.get.mjs');
const _lazy_9RnLVR = () => import('../routes/api/test-bank/templates/_id_.put.mjs');
const _lazy_R7mKV9 = () => import('../routes/api/test-bank/templates/_id/analytics.get.mjs');
const _lazy_pdBMUm = () => import('../routes/api/test-bank/templates/_id/preview.post.mjs');
const _lazy_znAsva = () => import('../routes/api/test-bank/templates/_id/questions.put.mjs');
const _lazy_RzL44x = () => import('../routes/api/test-bank/templates/_id/validate-languages.get.mjs');
const _lazy_1Ehs1I = () => import('../routes/api/test-bank/index.get3.mjs');
const _lazy_w1TVe2 = () => import('../routes/api/test-bank/index.post3.mjs');
const _lazy_zKGiZe = () => import('../routes/api/test-bank/templates/select.get.mjs');
const _lazy_5HpVTM = () => import('../routes/api/test/check-instructor.get.mjs');
const _lazy_3OafG6 = () => import('../routes/api/test/db-check.get.mjs');
const _lazy_6rhb7E = () => import('../routes/api/test/fix-instructor-link.post.mjs');
const _lazy_5wxVje = () => import('../routes/api/test/permission-context.get.mjs');
const _lazy_9JEqK5 = () => import('../routes/api/tests/assignments/_id_.delete.mjs');
const _lazy_CnZi_N = () => import('../routes/api/tests/assignments/_id_.get.mjs');
const _lazy_W4bmB6 = () => import('../routes/api/tests/assignments/_id/available-languages.get.mjs');
const _lazy_PlEb7r = () => import('../routes/api/tests/assignments/_id/results.get.mjs');
const _lazy_d36vIv = () => import('../routes/api/tests/assignments/by-event/_eventId_.get.mjs');
const _lazy_dzfs7z = () => import('../routes/api/tests/index.post.mjs');
const _lazy_cHa4Ml = () => import('../routes/api/tests/my.get.mjs');
const _lazy_hqX8U2 = () => import('../routes/api/tests/sessions/_id_.get.mjs');
const _lazy_9PVrUn = () => import('../routes/api/tests/sessions/_id/answer.post.mjs');
const _lazy_J1MEwE = () => import('../routes/api/tests/sessions/_id/details.get.mjs');
const _lazy_TNUxm3 = () => import('../routes/api/tests/sessions/_id/finish.post.mjs');
const _lazy_HbMtdm = () => import('../routes/api/tests/sessions/_id/violation.post.mjs');
const _lazy_dCivI3 = () => import('../routes/api/tests/sessions/start.post.mjs');
const _lazy_8Kby92 = () => import('../routes/api/tg-app/auth.post.mjs');
const _lazy_uJ513i = () => import('../routes/api/tg-app/certificates.get.mjs');
const _lazy_1mRy8e = () => import('../routes/api/tg-app/certificates/ai-batch/analyze.post.mjs');
const _lazy_KwPt1i = () => import('../routes/api/tg-app/certificates/ai-batch/confirm.post.mjs');
const _lazy_MJKk7X = () => import('../routes/api/tg-app/certificates/ai-batch/upload.post.mjs');
const _lazy_SnGqn9 = () => import('../routes/api/tg-app/certificates/manual.post.mjs');
const _lazy_j1WoOy = () => import('../routes/api/tg-app/download-group-certificates.post.mjs');
const _lazy_ruXobX = () => import('../routes/api/tg-app/organizations.get.mjs');
const _lazy_zsXOrd = () => import('../routes/api/tg-app/register.post.mjs');
const _lazy_QsrfN_ = () => import('../routes/api/tg-app/schedule.get.mjs');
const _lazy_l5kY1v = () => import('../routes/api/tg-app/send-certificate.post.mjs');
const _lazy_4uJ6lX = () => import('../routes/api/tg-app/students/_id_.get.mjs');
const _lazy_cUGQbX = () => import('../routes/api/tg-app/index.get.mjs');
const _lazy_pxTJNw = () => import('../routes/api/tg-app/students/search.get.mjs');
const _lazy_d6fDUa = () => import('../routes/api/users/_id_.delete.mjs');
const _lazy_mKWqkd = () => import('../routes/api/users/_id_.get.mjs');
const _lazy_9a1IIK = () => import('../routes/api/users/_id_.put.mjs');
const _lazy_ydM1RH = () => import('../routes/api/users/_id/password.put.mjs');
const _lazy_yRPtcB = () => import('../routes/api/index.get15.mjs');
const _lazy_DL58eV = () => import('../routes/api/index.post13.mjs');
const _lazy_EuKWFj = () => import('../routes/api/users/search.get.mjs');
const _lazy_AsWJ6K = () => import('../routes/renderer.mjs').then(function (n) { return n.r; });

const handlers = [
  { route: '', handler: _vG0UXR, lazy: false, middleware: true, method: undefined },
  { route: '', handler: _nfk6fU, lazy: false, middleware: true, method: undefined },
  { route: '/api/activity-logs', handler: _lazy_kGngi_, lazy: true, middleware: false, method: "get" },
  { route: '/api/activity-logs/user/:userId', handler: _lazy_1KsdaF, lazy: true, middleware: false, method: "get" },
  { route: '/api/admin/ai-settings/:id', handler: _lazy_0tn3_G, lazy: true, middleware: false, method: "delete" },
  { route: '/api/admin/ai-settings/:id', handler: _lazy_wGpnC1, lazy: true, middleware: false, method: "put" },
  { route: '/api/admin/ai-settings/errors', handler: _lazy_YxVLUl, lazy: true, middleware: false, method: "get" },
  { route: '/api/admin/ai-settings', handler: _lazy_BhRKxh, lazy: true, middleware: false, method: "get" },
  { route: '/api/admin/ai-settings', handler: _lazy_nYLGrD, lazy: true, middleware: false, method: "post" },
  { route: '/api/admin/ai-settings/stats', handler: _lazy_LrLhc3, lazy: true, middleware: false, method: "get" },
  { route: '/api/admin/ai-settings/test', handler: _lazy_p4hxmb, lazy: true, middleware: false, method: "post" },
  { route: '/api/admin/ai-settings/usage', handler: _lazy_V7W94i, lazy: true, middleware: false, method: "get" },
  { route: '/api/admin/dashboard', handler: _lazy_krpoYG, lazy: true, middleware: false, method: "get" },
  { route: '/api/ai-certificates/batch/analyze', handler: _lazy_knUe3G, lazy: true, middleware: false, method: "post" },
  { route: '/api/ai-certificates/batch/confirm', handler: _lazy_rifk6q, lazy: true, middleware: false, method: "post" },
  { route: '/api/ai-certificates/batch/upload', handler: _lazy_KG4lHu, lazy: true, middleware: false, method: "post" },
  { route: '/api/ai-certificates/logs', handler: _lazy_7oH8d_, lazy: true, middleware: false, method: "get" },
  { route: '/api/ai-certificates/search-students', handler: _lazy_8RhZ77, lazy: true, middleware: false, method: "get" },
  { route: '/api/ai-certificates/stats', handler: _lazy_PfvZv5, lazy: true, middleware: false, method: "get" },
  { route: '/api/attendance', handler: _lazy_iST699, lazy: true, middleware: false, method: "post" },
  { route: '/api/attendance/journal', handler: _lazy_P_5vgp, lazy: true, middleware: false, method: "get" },
  { route: '/api/attendance/marking/check/:eventId', handler: _lazy_RI6t9X, lazy: true, middleware: false, method: "get" },
  { route: '/api/attendance/marking/overdue', handler: _lazy_VFeKPD, lazy: true, middleware: false, method: "get" },
  { route: '/api/attendance/marking/pending', handler: _lazy_4AG02n, lazy: true, middleware: false, method: "get" },
  { route: '/api/attendance/marking/requests', handler: _lazy_5QD9ut, lazy: true, middleware: false, method: "get" },
  { route: '/api/attendance/marking/requests', handler: _lazy_1bS97y, lazy: true, middleware: false, method: "post" },
  { route: '/api/attendance/marking/requests/:id', handler: _lazy_F41Duh, lazy: true, middleware: false, method: "put" },
  { route: '/api/attendance/marking/settings', handler: _lazy_inb8gR, lazy: true, middleware: false, method: "get" },
  { route: '/api/attendance/marking/settings', handler: _lazy_Rm42JG, lazy: true, middleware: false, method: "put" },
  { route: '/api/attendance/marking/status', handler: _lazy_HNfCFt, lazy: true, middleware: false, method: "get" },
  { route: '/api/auth/login', handler: _lazy_E6zn_y, lazy: true, middleware: false, method: "post" },
  { route: '/api/auth/logout', handler: _lazy_lnGnE9, lazy: true, middleware: false, method: "post" },
  { route: '/api/auth/refresh', handler: _lazy_8NTn9n, lazy: true, middleware: false, method: "post" },
  { route: '/api/auth/register', handler: _lazy_z8iHfO, lazy: true, middleware: false, method: "post" },
  { route: '/api/auth/verify', handler: _lazy_DxolEN, lazy: true, middleware: false, method: "get" },
  { route: '/api/certificates/:id', handler: _lazy_P9THBa, lazy: true, middleware: false, method: "delete" },
  { route: '/api/certificates/:id', handler: _lazy_t1SnMA, lazy: true, middleware: false, method: "get" },
  { route: '/api/certificates/:id/revoke', handler: _lazy_zrrFxZ, lazy: true, middleware: false, method: "patch" },
  { route: '/api/certificates/download/:id', handler: _lazy_7MNNzg, lazy: true, middleware: false, method: "get" },
  { route: '/api/certificates/import/analyze', handler: _lazy_qSlY55, lazy: true, middleware: false, method: "post" },
  { route: '/api/certificates/import/execute', handler: _lazy_Er_jaD, lazy: true, middleware: false, method: "post" },
  { route: '/api/certificates/import/status/:id', handler: _lazy_aQjyyL, lazy: true, middleware: false, method: "get" },
  { route: '/api/certificates', handler: _lazy_jZV72V, lazy: true, middleware: false, method: "get" },
  { route: '/api/certificates/issue/:groupId', handler: _lazy_cqDwX5, lazy: true, middleware: false, method: "get" },
  { route: '/api/certificates/issue/:groupId', handler: _lazy_Y2r3TZ, lazy: true, middleware: false, method: "post" },
  { route: '/api/certificates/issue/:groupId/instructors', handler: _lazy_SkCTIz, lazy: true, middleware: false, method: "get" },
  { route: '/api/certificates/manual', handler: _lazy_LlEg8I, lazy: true, middleware: false, method: "post" },
  { route: '/api/certificates/my', handler: _lazy_KaBWGO, lazy: true, middleware: false, method: "get" },
  { route: '/api/certificates/report/:groupId', handler: _lazy_U92eBw, lazy: true, middleware: false, method: "get" },
  { route: '/api/certificates/templates/:id', handler: _lazy_Z8CCdo, lazy: true, middleware: false, method: "delete" },
  { route: '/api/certificates/templates/:id', handler: _lazy_pb0cXx, lazy: true, middleware: false, method: "get" },
  { route: '/api/certificates/templates/:id', handler: _lazy_TVr0lD, lazy: true, middleware: false, method: "put" },
  { route: '/api/certificates/templates/:id/duplicate', handler: _lazy_QKlKF9, lazy: true, middleware: false, method: "post" },
  { route: '/api/certificates/templates/:id/preview', handler: _lazy_FykHOg, lazy: true, middleware: false, method: "get" },
  { route: '/api/certificates/templates/:id/sync-counter', handler: _lazy_Qzu4jw, lazy: true, middleware: false, method: "post" },
  { route: '/api/certificates/templates/:id/upload-background', handler: _lazy_dKcUNM, lazy: true, middleware: false, method: "post" },
  { route: '/api/certificates/templates/:id/upload-image', handler: _lazy_5aw3mJ, lazy: true, middleware: false, method: "post" },
  { route: '/api/certificates/templates', handler: _lazy_oEPTOE, lazy: true, middleware: false, method: "get" },
  { route: '/api/certificates/templates', handler: _lazy_kIlELP, lazy: true, middleware: false, method: "post" },
  { route: '/api/certificates/templates/sources', handler: _lazy_LpbGSs, lazy: true, middleware: false, method: "get" },
  { route: '/api/classrooms/:id', handler: _lazy_sb7l8u, lazy: true, middleware: false, method: "delete" },
  { route: '/api/classrooms/:id', handler: _lazy_M3hG5_, lazy: true, middleware: false, method: "put" },
  { route: '/api/classrooms', handler: _lazy_ayL_mQ, lazy: true, middleware: false, method: "get" },
  { route: '/api/classrooms', handler: _lazy_oasPsk, lazy: true, middleware: false, method: "post" },
  { route: '/api/courses/:id', handler: _lazy_luSr2c, lazy: true, middleware: false, method: "delete" },
  { route: '/api/courses/:id', handler: _lazy_wXxvOb, lazy: true, middleware: false, method: "get" },
  { route: '/api/courses/:id', handler: _lazy_O3Ich3, lazy: true, middleware: false, method: "put" },
  { route: '/api/courses/:id/archive', handler: _lazy_XRy_vS, lazy: true, middleware: false, method: "put" },
  { route: '/api/courses/:id/disciplines', handler: _lazy_v0b2ql, lazy: true, middleware: false, method: "post" },
  { route: '/api/courses/:id/disciplines/:disciplineId', handler: _lazy_QqDaik, lazy: true, middleware: false, method: "delete" },
  { route: '/api/courses/:id/disciplines/:disciplineId', handler: _lazy_BUZ02a, lazy: true, middleware: false, method: "patch" },
  { route: '/api/courses', handler: _lazy_unWk8U, lazy: true, middleware: false, method: "get" },
  { route: '/api/courses', handler: _lazy_aWaBOq, lazy: true, middleware: false, method: "post" },
  { route: '/api/courses/templates', handler: _lazy_5AcIJl, lazy: true, middleware: false, method: "get" },
  { route: '/api/db/init', handler: _lazy_ymYQKZ, lazy: true, middleware: false, method: "get" },
  { route: '/api/debug/fix-instructor-link', handler: _lazy_Cczys_, lazy: true, middleware: false, method: "get" },
  { route: '/api/discipline-tests/:id', handler: _lazy_sYVZWS, lazy: true, middleware: false, method: "delete" },
  { route: '/api/discipline-tests/:id', handler: _lazy_Q3XdVj, lazy: true, middleware: false, method: "put" },
  { route: '/api/discipline-tests', handler: _lazy_3I1Q_q, lazy: true, middleware: false, method: "get" },
  { route: '/api/discipline-tests', handler: _lazy_qAzvm6, lazy: true, middleware: false, method: "post" },
  { route: '/api/environment/check-db', handler: _lazy_CqjHwr, lazy: true, middleware: false, method: "get" },
  { route: '/api/environment/current', handler: _lazy_14zDks, lazy: true, middleware: false, method: "get" },
  { route: '/api/environment/migrate', handler: _lazy_dzGJJW, lazy: true, middleware: false, method: "post" },
  { route: '/api/environment/restart', handler: _lazy_V0fAWw, lazy: true, middleware: false, method: "post" },
  { route: '/api/environment/save', handler: _lazy_L92fU1, lazy: true, middleware: false, method: "post" },
  { route: '/api/environment/test-connection', handler: _lazy_Z4cyJy, lazy: true, middleware: false, method: "post" },
  { route: '/api/files/:uuid', handler: _lazy_rMN2iV, lazy: true, middleware: false, method: "delete" },
  { route: '/api/files/:uuid', handler: _lazy_Rakq_c, lazy: true, middleware: false, method: "get" },
  { route: '/api/files/:uuid/rename', handler: _lazy_nnRUZI, lazy: true, middleware: false, method: "put" },
  { route: '/api/files', handler: _lazy_4ymflF, lazy: true, middleware: false, method: "get" },
  { route: '/api/files/sync', handler: _lazy_pq7O8B, lazy: true, middleware: false, method: "post" },
  { route: '/api/files/upload', handler: _lazy_2wERvP, lazy: true, middleware: false, method: "post" },
  { route: '/api/final-grades/bulk', handler: _lazy_kWgden, lazy: true, middleware: false, method: "post" },
  { route: '/api/final-grades', handler: _lazy_p0J7NH, lazy: true, middleware: false, method: "post" },
  { route: '/api/folders/:id/contents', handler: _lazy_KJAGoW, lazy: true, middleware: false, method: "get" },
  { route: '/api/folders/:id/move', handler: _lazy_uLE8VM, lazy: true, middleware: false, method: "put" },
  { route: '/api/folders/:id/path', handler: _lazy_H4L3lR, lazy: true, middleware: false, method: "get" },
  { route: '/api/folders/:id/remove-password', handler: _lazy_GaybyW, lazy: true, middleware: false, method: "delete" },
  { route: '/api/folders/:id/rename', handler: _lazy_5PsV4B, lazy: true, middleware: false, method: "put" },
  { route: '/api/folders/:id/set-password', handler: _lazy_hlsHnu, lazy: true, middleware: false, method: "post" },
  { route: '/api/folders/:id/verify-password', handler: _lazy_PJAdN6, lazy: true, middleware: false, method: "post" },
  { route: '/api/folders/by-name/:name', handler: _lazy_dqAF2_, lazy: true, middleware: false, method: "get" },
  { route: '/api/folders', handler: _lazy_jZx3nW, lazy: true, middleware: false, method: "get" },
  { route: '/api/folders', handler: _lazy_YepCVu, lazy: true, middleware: false, method: "post" },
  { route: '/api/grades', handler: _lazy_ZvA5PR, lazy: true, middleware: false, method: "post" },
  { route: '/api/groups/:id', handler: _lazy_sqJaSm, lazy: true, middleware: false, method: "delete" },
  { route: '/api/groups/:id', handler: _lazy_5w1iz0, lazy: true, middleware: false, method: "get" },
  { route: '/api/groups/:id', handler: _lazy_Ip_46a, lazy: true, middleware: false, method: "put" },
  { route: '/api/groups/:id/archive', handler: _lazy_U3T4D5, lazy: true, middleware: false, method: "put" },
  { route: '/api/groups/:id/disciplines', handler: _lazy_LP2qZZ, lazy: true, middleware: false, method: "get" },
  { route: '/api/groups/:id/reports/:fileId', handler: _lazy_s01JrA, lazy: true, middleware: false, method: "delete" },
  { route: '/api/groups/:id/reports/:fileId', handler: _lazy_97lnlO, lazy: true, middleware: false, method: "get" },
  { route: '/api/groups/:id/reports', handler: _lazy_zgz7vG, lazy: true, middleware: false, method: "get" },
  { route: '/api/groups/:id/reports', handler: _lazy_qmWHmA, lazy: true, middleware: false, method: "post" },
  { route: '/api/groups/:id/students/:studentId', handler: _lazy_rrJ5d1, lazy: true, middleware: false, method: "delete" },
  { route: '/api/groups/:id/students', handler: _lazy_c4WdHM, lazy: true, middleware: false, method: "post" },
  { route: '/api/groups/:id/students/transfer', handler: _lazy_5tjRR5, lazy: true, middleware: false, method: "post" },
  { route: '/api/groups', handler: _lazy_KSa4ce, lazy: true, middleware: false, method: "get" },
  { route: '/api/groups', handler: _lazy_VmNAb3, lazy: true, middleware: false, method: "post" },
  { route: '/api/groups/select', handler: _lazy_Dqx8Xh, lazy: true, middleware: false, method: "get" },
  { route: '/api/instructors/:id', handler: _lazy_9M9yOJ, lazy: true, middleware: false, method: "delete" },
  { route: '/api/instructors/:id', handler: _lazy_5uwSJ1, lazy: true, middleware: false, method: "get" },
  { route: '/api/instructors/:id', handler: _lazy_cKbvZE, lazy: true, middleware: false, method: "put" },
  { route: '/api/instructors/:id/course-history', handler: _lazy_WXbRvc, lazy: true, middleware: false, method: "get" },
  { route: '/api/instructors/:id/hours', handler: _lazy_R0e89X, lazy: true, middleware: false, method: "get" },
  { route: '/api/instructors/:id/hours/check', handler: _lazy_xE1uBg, lazy: true, middleware: false, method: "get" },
  { route: '/api/instructors/all', handler: _lazy_RVmkfz, lazy: true, middleware: false, method: "get" },
  { route: '/api/instructors', handler: _lazy_GCmKJv, lazy: true, middleware: false, method: "get" },
  { route: '/api/instructors', handler: _lazy_uYc0IA, lazy: true, middleware: false, method: "post" },
  { route: '/api/library/admin/books/:id/access/:userId', handler: _lazy_GZvmaw, lazy: true, middleware: false, method: "delete" },
  { route: '/api/library/admin/books/:id/access', handler: _lazy_vg5BT3, lazy: true, middleware: false, method: "delete" },
  { route: '/api/library/admin/books/:id/access', handler: _lazy_w8kwKo, lazy: true, middleware: false, method: "get" },
  { route: '/api/library/admin/books/:id/access', handler: _lazy_ScE3cj, lazy: true, middleware: false, method: "post" },
  { route: '/api/library/admin/books/:id/analytics', handler: _lazy_na1gne, lazy: true, middleware: false, method: "get" },
  { route: '/api/library/admin/books/:id', handler: _lazy_zU6PES, lazy: true, middleware: false, method: "delete" },
  { route: '/api/library/admin/books/:id', handler: _lazy_BgvfcW, lazy: true, middleware: false, method: "get" },
  { route: '/api/library/admin/books/:id', handler: _lazy_6QadK_, lazy: true, middleware: false, method: "patch" },
  { route: '/api/library/admin/books/:id/reprocess', handler: _lazy_2KN7zQ, lazy: true, middleware: false, method: "post" },
  { route: '/api/library/admin/books/export', handler: _lazy_rdCBJo, lazy: true, middleware: false, method: "get" },
  { route: '/api/library/admin/books', handler: _lazy_3dRWbc, lazy: true, middleware: false, method: "get" },
  { route: '/api/library/admin/books', handler: _lazy_f_MERD, lazy: true, middleware: false, method: "post" },
  { route: '/api/library/catalog/:id', handler: _lazy_2LgOBS, lazy: true, middleware: false, method: "get" },
  { route: '/api/library/catalog', handler: _lazy_d2U7R4, lazy: true, middleware: false, method: "get" },
  { route: '/api/library/covers/:bookId', handler: _lazy_LTwTKF, lazy: true, middleware: false, method: "get" },
  { route: '/api/library/reading/:bookId/end', handler: _lazy_h9z28b, lazy: true, middleware: false, method: "post" },
  { route: '/api/library/reading/:bookId/page/:pageNumber', handler: _lazy_xE2GaF, lazy: true, middleware: false, method: "get" },
  { route: '/api/library/reading/:bookId/progress', handler: _lazy_abFgMK, lazy: true, middleware: false, method: "get" },
  { route: '/api/library/reading/:bookId/progress', handler: _lazy_lwiN0j, lazy: true, middleware: false, method: "post" },
  { route: '/api/library/reading/:bookId/start', handler: _lazy_Hrzioh, lazy: true, middleware: false, method: "post" },
  { route: '/api/maintain/fix-certificate-paths', handler: _lazy_eRaMrf, lazy: true, middleware: false, method: "get" },
  { route: '/api/manager/dashboard', handler: _lazy_IiUwZr, lazy: true, middleware: false, method: "get" },
  { route: '/api/organizations/:id', handler: _lazy_oMnjMW, lazy: true, middleware: false, method: "delete" },
  { route: '/api/organizations/:id', handler: _lazy_l_PJ2B, lazy: true, middleware: false, method: "get" },
  { route: '/api/organizations/:id', handler: _lazy_os3dpF, lazy: true, middleware: false, method: "put" },
  { route: '/api/organizations/:id/certificates/archive', handler: _lazy_7_Xrbm, lazy: true, middleware: false, method: "get" },
  { route: '/api/organizations/:id/courses', handler: _lazy_cMJsLt, lazy: true, middleware: false, method: "get" },
  { route: '/api/organizations/:id/groups', handler: _lazy_rb1BCC, lazy: true, middleware: false, method: "get" },
  { route: '/api/organizations/:id/stats', handler: _lazy_QJWgmH, lazy: true, middleware: false, method: "get" },
  { route: '/api/organizations', handler: _lazy_fryp5e, lazy: true, middleware: false, method: "get" },
  { route: '/api/organizations', handler: _lazy_Ujz97K, lazy: true, middleware: false, method: "post" },
  { route: '/api/organizations/search', handler: _lazy_NVY535, lazy: true, middleware: false, method: "get" },
  { route: '/api/organizations/stats', handler: _lazy_yjRtPO, lazy: true, middleware: false, method: "get" },
  { route: '/api/profile', handler: _lazy_3FVpv5, lazy: true, middleware: false, method: "get" },
  { route: '/api/profile', handler: _lazy_x8_KlX, lazy: true, middleware: false, method: "put" },
  { route: '/api/profile/password', handler: _lazy_3LQ6Xc, lazy: true, middleware: false, method: "put" },
  { route: '/api/profile/settings', handler: _lazy_W0woDW, lazy: true, middleware: false, method: "get" },
  { route: '/api/profile/settings', handler: _lazy_LuX4BE, lazy: true, middleware: false, method: "put" },
  { route: '/api/profile/stats/admin', handler: _lazy_JBQiuS, lazy: true, middleware: false, method: "get" },
  { route: '/api/reports/log-download', handler: _lazy_wxCbsT, lazy: true, middleware: false, method: "post" },
  { route: '/api/representatives/:id', handler: _lazy_XAQZHu, lazy: true, middleware: false, method: "delete" },
  { route: '/api/representatives/:id', handler: _lazy_WoL2Xr, lazy: true, middleware: false, method: "get" },
  { route: '/api/representatives/:id', handler: _lazy_ZX8bpf, lazy: true, middleware: false, method: "patch" },
  { route: '/api/representatives/:id/approve', handler: _lazy_oRNmM1, lazy: true, middleware: false, method: "post" },
  { route: '/api/representatives/:id/block', handler: _lazy_sMjT5I, lazy: true, middleware: false, method: "post" },
  { route: '/api/representatives/:id/requests', handler: _lazy_4gagOT, lazy: true, middleware: false, method: "get" },
  { route: '/api/representatives/:id/unblock', handler: _lazy_QCpKdw, lazy: true, middleware: false, method: "post" },
  { route: '/api/representatives', handler: _lazy_J6OIMd, lazy: true, middleware: false, method: "get" },
  { route: '/api/representatives/pending', handler: _lazy_i0QPFl, lazy: true, middleware: false, method: "get" },
  { route: '/api/representatives/stats', handler: _lazy_I0Rbhx, lazy: true, middleware: false, method: "get" },
  { route: '/api/schedule/:id', handler: _lazy_5wAxvw, lazy: true, middleware: false, method: "delete" },
  { route: '/api/schedule/:id', handler: _lazy_lqYges, lazy: true, middleware: false, method: "put" },
  { route: '/api/schedule/bulk-copy', handler: _lazy_04JgUb, lazy: true, middleware: false, method: "post" },
  { route: '/api/schedule/bulk-delete', handler: _lazy_JH6jK9, lazy: true, middleware: false, method: "post" },
  { route: '/api/schedule/bulk-move', handler: _lazy_wbSnRO, lazy: true, middleware: false, method: "post" },
  { route: '/api/schedule', handler: _lazy_GUfI46, lazy: true, middleware: false, method: "get" },
  { route: '/api/schedule', handler: _lazy_nmBN59, lazy: true, middleware: false, method: "post" },
  { route: '/api/schedule/periods', handler: _lazy_2wd6vW, lazy: true, middleware: false, method: "get" },
  { route: '/api/schedule/periods', handler: _lazy_bJF0DS, lazy: true, middleware: false, method: "put" },
  { route: '/api/schedule/retake', handler: _lazy_Z4bUd1, lazy: true, middleware: false, method: "post" },
  { route: '/api/schedule/settings', handler: _lazy_2mgcux, lazy: true, middleware: false, method: "get" },
  { route: '/api/schedule/settings', handler: _lazy_8xwhFX, lazy: true, middleware: false, method: "put" },
  { route: '/api/schedule/templates/:id', handler: _lazy_Ok8uie, lazy: true, middleware: false, method: "delete" },
  { route: '/api/schedule/templates/:id/apply', handler: _lazy_XPSY3n, lazy: true, middleware: false, method: "post" },
  { route: '/api/schedule/templates', handler: _lazy_3vSO_2, lazy: true, middleware: false, method: "get" },
  { route: '/api/schedule/templates', handler: _lazy_JUpmko, lazy: true, middleware: false, method: "post" },
  { route: '/api/students/:id', handler: _lazy_RDYsgA, lazy: true, middleware: false, method: "delete" },
  { route: '/api/students/:id', handler: _lazy_tHLd8w, lazy: true, middleware: false, method: "get" },
  { route: '/api/students/:id', handler: _lazy_HbV7u6, lazy: true, middleware: false, method: "put" },
  { route: '/api/students/:id/certificates', handler: _lazy_ng8Oxw, lazy: true, middleware: false, method: "post" },
  { route: '/api/students/:id/courses', handler: _lazy_PHyrFI, lazy: true, middleware: false, method: "get" },
  { route: '/api/students/:id/reset-password', handler: _lazy_p3iGcG, lazy: true, middleware: false, method: "post" },
  { route: '/api/students/dashboard', handler: _lazy_Nsih3R, lazy: true, middleware: false, method: "get" },
  { route: '/api/students/import/analyze', handler: _lazy_aQEzEE, lazy: true, middleware: false, method: "post" },
  { route: '/api/students/import/execute', handler: _lazy_zCp5Wp, lazy: true, middleware: false, method: "post" },
  { route: '/api/students/import/status/:jobId', handler: _lazy_KbX4xn, lazy: true, middleware: false, method: "get" },
  { route: '/api/students', handler: _lazy_5Qs2Yv, lazy: true, middleware: false, method: "get" },
  { route: '/api/students', handler: _lazy_Qvq2Mv, lazy: true, middleware: false, method: "post" },
  { route: '/api/students/my-courses', handler: _lazy_iKoY6j, lazy: true, middleware: false, method: "get" },
  { route: '/api/students/my-courses/:id', handler: _lazy_2BhJV3, lazy: true, middleware: false, method: "get" },
  { route: '/api/students/notifications', handler: _lazy_aXS6go, lazy: true, middleware: false, method: "get" },
  { route: '/api/students/notifications/:id/read', handler: _lazy_go4j4E, lazy: true, middleware: false, method: "post" },
  { route: '/api/students/notifications/:id/read', handler: _lazy_6x2DAS, lazy: true, middleware: false, method: "put" },
  { route: '/api/students/notifications/read-all', handler: _lazy__a6PzZ, lazy: true, middleware: false, method: "put" },
  { route: '/api/students/upcoming-deadlines', handler: _lazy_fiIUQL, lazy: true, middleware: false, method: "get" },
  { route: '/api/support/tickets', handler: _lazy_ZxPAeS, lazy: true, middleware: false, method: "get" },
  { route: '/api/support/tickets', handler: _lazy_aacx9X, lazy: true, middleware: false, method: "post" },
  { route: '/api/teacher/dashboard', handler: _lazy_9BpiP0, lazy: true, middleware: false, method: "get" },
  { route: '/api/telegram/send', handler: _lazy_7SLwrl, lazy: true, middleware: false, method: "post" },
  { route: '/api/telegram/setup-webhook', handler: _lazy_0vZ840, lazy: true, middleware: false, method: "post" },
  { route: '/api/telegram/webhook-info', handler: _lazy_Sf1uDj, lazy: true, middleware: false, method: "get" },
  { route: '/api/telegram/webhook', handler: _lazy_2vQbnU, lazy: true, middleware: false, method: "delete" },
  { route: '/api/telegram/webhook', handler: _lazy_bN_duN, lazy: true, middleware: false, method: "post" },
  { route: '/api/test-bank/banks/:id', handler: _lazy_3CVq4w, lazy: true, middleware: false, method: "delete" },
  { route: '/api/test-bank/banks/:id', handler: _lazy_x7lFub, lazy: true, middleware: false, method: "get" },
  { route: '/api/test-bank/banks/:id', handler: _lazy_EVS9Se, lazy: true, middleware: false, method: "put" },
  { route: '/api/test-bank/banks/:id/validate-languages', handler: _lazy_OeofP_, lazy: true, middleware: false, method: "get" },
  { route: '/api/test-bank/banks/categories', handler: _lazy_TzNkDr, lazy: true, middleware: false, method: "get" },
  { route: '/api/test-bank/banks', handler: _lazy_Regwma, lazy: true, middleware: false, method: "get" },
  { route: '/api/test-bank/banks', handler: _lazy_4pm42h, lazy: true, middleware: false, method: "post" },
  { route: '/api/test-bank/banks/select', handler: _lazy_N_9qTd, lazy: true, middleware: false, method: "get" },
  { route: '/api/test-bank/questions/:id', handler: _lazy_uQ4bJb, lazy: true, middleware: false, method: "delete" },
  { route: '/api/test-bank/questions/:id', handler: _lazy_Xafitr, lazy: true, middleware: false, method: "get" },
  { route: '/api/test-bank/questions/:id', handler: _lazy_GtwLcR, lazy: true, middleware: false, method: "put" },
  { route: '/api/test-bank/questions/import', handler: _lazy_jJZksf, lazy: true, middleware: false, method: "post" },
  { route: '/api/test-bank/questions', handler: _lazy_sOpQmH, lazy: true, middleware: false, method: "get" },
  { route: '/api/test-bank/questions', handler: _lazy_HyOjVl, lazy: true, middleware: false, method: "post" },
  { route: '/api/test-bank/questions/reorder', handler: _lazy_BACazn, lazy: true, middleware: false, method: "put" },
  { route: '/api/test-bank/questions/stats-by-language', handler: _lazy_FEgEtS, lazy: true, middleware: false, method: "get" },
  { route: '/api/test-bank/templates/:id', handler: _lazy_t1p5FD, lazy: true, middleware: false, method: "delete" },
  { route: '/api/test-bank/templates/:id', handler: _lazy_V3n_Va, lazy: true, middleware: false, method: "get" },
  { route: '/api/test-bank/templates/:id', handler: _lazy_9RnLVR, lazy: true, middleware: false, method: "put" },
  { route: '/api/test-bank/templates/:id/analytics', handler: _lazy_R7mKV9, lazy: true, middleware: false, method: "get" },
  { route: '/api/test-bank/templates/:id/preview', handler: _lazy_pdBMUm, lazy: true, middleware: false, method: "post" },
  { route: '/api/test-bank/templates/:id/questions', handler: _lazy_znAsva, lazy: true, middleware: false, method: "put" },
  { route: '/api/test-bank/templates/:id/validate-languages', handler: _lazy_RzL44x, lazy: true, middleware: false, method: "get" },
  { route: '/api/test-bank/templates', handler: _lazy_1Ehs1I, lazy: true, middleware: false, method: "get" },
  { route: '/api/test-bank/templates', handler: _lazy_w1TVe2, lazy: true, middleware: false, method: "post" },
  { route: '/api/test-bank/templates/select', handler: _lazy_zKGiZe, lazy: true, middleware: false, method: "get" },
  { route: '/api/test/check-instructor', handler: _lazy_5HpVTM, lazy: true, middleware: false, method: "get" },
  { route: '/api/test/db-check', handler: _lazy_3OafG6, lazy: true, middleware: false, method: "get" },
  { route: '/api/test/fix-instructor-link', handler: _lazy_6rhb7E, lazy: true, middleware: false, method: "post" },
  { route: '/api/test/permission-context', handler: _lazy_5wxVje, lazy: true, middleware: false, method: "get" },
  { route: '/api/tests/assignments/:id', handler: _lazy_9JEqK5, lazy: true, middleware: false, method: "delete" },
  { route: '/api/tests/assignments/:id', handler: _lazy_CnZi_N, lazy: true, middleware: false, method: "get" },
  { route: '/api/tests/assignments/:id/available-languages', handler: _lazy_W4bmB6, lazy: true, middleware: false, method: "get" },
  { route: '/api/tests/assignments/:id/results', handler: _lazy_PlEb7r, lazy: true, middleware: false, method: "get" },
  { route: '/api/tests/assignments/by-event/:eventId', handler: _lazy_d36vIv, lazy: true, middleware: false, method: "get" },
  { route: '/api/tests/assignments', handler: _lazy_dzfs7z, lazy: true, middleware: false, method: "post" },
  { route: '/api/tests/my', handler: _lazy_cHa4Ml, lazy: true, middleware: false, method: "get" },
  { route: '/api/tests/sessions/:id', handler: _lazy_hqX8U2, lazy: true, middleware: false, method: "get" },
  { route: '/api/tests/sessions/:id/answer', handler: _lazy_9PVrUn, lazy: true, middleware: false, method: "post" },
  { route: '/api/tests/sessions/:id/details', handler: _lazy_J1MEwE, lazy: true, middleware: false, method: "get" },
  { route: '/api/tests/sessions/:id/finish', handler: _lazy_TNUxm3, lazy: true, middleware: false, method: "post" },
  { route: '/api/tests/sessions/:id/violation', handler: _lazy_HbMtdm, lazy: true, middleware: false, method: "post" },
  { route: '/api/tests/sessions/start', handler: _lazy_dCivI3, lazy: true, middleware: false, method: "post" },
  { route: '/api/tg-app/auth', handler: _lazy_8Kby92, lazy: true, middleware: false, method: "post" },
  { route: '/api/tg-app/certificates', handler: _lazy_uJ513i, lazy: true, middleware: false, method: "get" },
  { route: '/api/tg-app/certificates/ai-batch/analyze', handler: _lazy_1mRy8e, lazy: true, middleware: false, method: "post" },
  { route: '/api/tg-app/certificates/ai-batch/confirm', handler: _lazy_KwPt1i, lazy: true, middleware: false, method: "post" },
  { route: '/api/tg-app/certificates/ai-batch/upload', handler: _lazy_MJKk7X, lazy: true, middleware: false, method: "post" },
  { route: '/api/tg-app/certificates/manual', handler: _lazy_SnGqn9, lazy: true, middleware: false, method: "post" },
  { route: '/api/tg-app/download-group-certificates', handler: _lazy_j1WoOy, lazy: true, middleware: false, method: "post" },
  { route: '/api/tg-app/organizations', handler: _lazy_ruXobX, lazy: true, middleware: false, method: "get" },
  { route: '/api/tg-app/register', handler: _lazy_zsXOrd, lazy: true, middleware: false, method: "post" },
  { route: '/api/tg-app/schedule', handler: _lazy_QsrfN_, lazy: true, middleware: false, method: "get" },
  { route: '/api/tg-app/send-certificate', handler: _lazy_l5kY1v, lazy: true, middleware: false, method: "post" },
  { route: '/api/tg-app/students/:id', handler: _lazy_4uJ6lX, lazy: true, middleware: false, method: "get" },
  { route: '/api/tg-app/students', handler: _lazy_cUGQbX, lazy: true, middleware: false, method: "get" },
  { route: '/api/tg-app/students/search', handler: _lazy_pxTJNw, lazy: true, middleware: false, method: "get" },
  { route: '/api/users/:id', handler: _lazy_d6fDUa, lazy: true, middleware: false, method: "delete" },
  { route: '/api/users/:id', handler: _lazy_mKWqkd, lazy: true, middleware: false, method: "get" },
  { route: '/api/users/:id', handler: _lazy_9a1IIK, lazy: true, middleware: false, method: "put" },
  { route: '/api/users/:id/password', handler: _lazy_ydM1RH, lazy: true, middleware: false, method: "put" },
  { route: '/api/users', handler: _lazy_yRPtcB, lazy: true, middleware: false, method: "get" },
  { route: '/api/users', handler: _lazy_DL58eV, lazy: true, middleware: false, method: "post" },
  { route: '/api/users/search', handler: _lazy_EuKWFj, lazy: true, middleware: false, method: "get" },
  { route: '/__nuxt_error', handler: _lazy_AsWJ6K, lazy: true, middleware: false, method: undefined },
  { route: '/__nuxt_island/**', handler: _SxA8c9, lazy: false, middleware: false, method: undefined },
  { route: '/**', handler: _lazy_AsWJ6K, lazy: true, middleware: false, method: undefined }
];

function createNitroApp() {
  const config = useRuntimeConfig();
  const hooks = createHooks();
  const captureError = (error, context = {}) => {
    const promise = hooks.callHookParallel("error", error, context).catch((error_) => {
      console.error("Error while capturing another error", error_);
    });
    if (context.event && isEvent(context.event)) {
      const errors = context.event.context.nitro?.errors;
      if (errors) {
        errors.push({ error, context });
      }
      if (context.event.waitUntil) {
        context.event.waitUntil(promise);
      }
    }
  };
  const h3App = createApp({
    debug: destr(false),
    onError: (error, event) => {
      captureError(error, { event, tags: ["request"] });
      return errorHandler(error, event);
    },
    onRequest: async (event) => {
      event.context.nitro = event.context.nitro || { errors: [] };
      const fetchContext = event.node.req?.__unenv__;
      if (fetchContext?._platform) {
        event.context = {
          _platform: fetchContext?._platform,
          // #3335
          ...fetchContext._platform,
          ...event.context
        };
      }
      if (!event.context.waitUntil && fetchContext?.waitUntil) {
        event.context.waitUntil = fetchContext.waitUntil;
      }
      event.fetch = (req, init) => fetchWithEvent(event, req, init, { fetch: localFetch });
      event.$fetch = (req, init) => fetchWithEvent(event, req, init, {
        fetch: $fetch
      });
      event.waitUntil = (promise) => {
        if (!event.context.nitro._waitUntilPromises) {
          event.context.nitro._waitUntilPromises = [];
        }
        event.context.nitro._waitUntilPromises.push(promise);
        if (event.context.waitUntil) {
          event.context.waitUntil(promise);
        }
      };
      event.captureError = (error, context) => {
        captureError(error, { event, ...context });
      };
      await nitroApp.hooks.callHook("request", event).catch((error) => {
        captureError(error, { event, tags: ["request"] });
      });
    },
    onBeforeResponse: async (event, response) => {
      await nitroApp.hooks.callHook("beforeResponse", event, response).catch((error) => {
        captureError(error, { event, tags: ["request", "response"] });
      });
    },
    onAfterResponse: async (event, response) => {
      await nitroApp.hooks.callHook("afterResponse", event, response).catch((error) => {
        captureError(error, { event, tags: ["request", "response"] });
      });
    }
  });
  const router = createRouter({
    preemptive: true
  });
  const nodeHandler = toNodeListener(h3App);
  const localCall = (aRequest) => b$2(
    nodeHandler,
    aRequest
  );
  const localFetch = (input, init) => {
    if (!input.toString().startsWith("/")) {
      return globalThis.fetch(input, init);
    }
    return C$1(
      nodeHandler,
      input,
      init
    ).then((response) => normalizeFetchResponse(response));
  };
  const $fetch = createFetch({
    fetch: localFetch,
    Headers: Headers$1,
    defaults: { baseURL: config.app.baseURL }
  });
  globalThis.$fetch = $fetch;
  h3App.use(createRouteRulesHandler({ localFetch }));
  for (const h of handlers) {
    let handler = h.lazy ? lazyEventHandler(h.handler) : h.handler;
    if (h.middleware || !h.route) {
      const middlewareBase = (config.app.baseURL + (h.route || "/")).replace(
        /\/+/g,
        "/"
      );
      h3App.use(middlewareBase, handler);
    } else {
      const routeRules = getRouteRulesForPath(
        h.route.replace(/:\w+|\*\*/g, "_")
      );
      if (routeRules.cache) {
        handler = cachedEventHandler(handler, {
          group: "nitro/routes",
          ...routeRules.cache
        });
      }
      router.use(h.route, handler, h.method);
    }
  }
  h3App.use(config.app.baseURL, router.handler);
  const app = {
    hooks,
    h3App,
    router,
    localCall,
    localFetch,
    captureError
  };
  return app;
}
function runNitroPlugins(nitroApp2) {
  for (const plugin of plugins) {
    try {
      plugin(nitroApp2);
    } catch (error) {
      nitroApp2.captureError(error, { tags: ["plugin"] });
      throw error;
    }
  }
}
const nitroApp = createNitroApp();
function useNitroApp() {
  return nitroApp;
}
runNitroPlugins(nitroApp);

function defineRenderHandler(render) {
  const runtimeConfig = useRuntimeConfig();
  return eventHandler(async (event) => {
    const nitroApp = useNitroApp();
    const ctx = { event, render, response: void 0 };
    await nitroApp.hooks.callHook("render:before", ctx);
    if (!ctx.response) {
      if (event.path === `${runtimeConfig.app.baseURL}favicon.ico`) {
        setResponseHeader$2(event, "Content-Type", "image/x-icon");
        return send$1(
          event,
          "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        );
      }
      ctx.response = await ctx.render(event);
      if (!ctx.response) {
        const _currentStatus = getResponseStatus$1(event);
        setResponseStatus$1(event, _currentStatus === 200 ? 500 : _currentStatus);
        return send$1(
          event,
          "No response returned from render handler: " + event.path
        );
      }
    }
    await nitroApp.hooks.callHook("render:response", ctx.response, ctx);
    if (ctx.response.headers) {
      setResponseHeaders$1(event, ctx.response.headers);
    }
    if (ctx.response.statusCode || ctx.response.statusMessage) {
      setResponseStatus$1(
        event,
        ctx.response.statusCode,
        ctx.response.statusMessage
      );
    }
    return ctx.response.body;
  });
}

function h(n,t,e,r,s,i,a,l){return h.fromTZ(h.tp(n,t,e,r,s,i,a),l)}h.fromTZISO=(n,t,e)=>h.fromTZ(k(n,t),e);h.fromTZ=function(n,t){let e=new Date(Date.UTC(n.y,n.m-1,n.d,n.h,n.i,n.s)),r=D$1(n.tz,e),s=new Date(e.getTime()-r),i=D$1(n.tz,s);if(i-r===0)return s;{let a=new Date(e.getTime()-i),l=D$1(n.tz,a);if(l-i===0)return a;if(!t&&l-i>0)return a;if(t)throw new Error("Invalid date passed to fromTZ()");return s}};h.toTZ=function(n,t){let e=n.toLocaleString("en-US",{timeZone:t}).replace(/[\u202f]/," "),r=new Date(e);return {y:r.getFullYear(),m:r.getMonth()+1,d:r.getDate(),h:r.getHours(),i:r.getMinutes(),s:r.getSeconds(),tz:t}};h.tp=(n,t,e,r,s,i,a)=>({y:n,m:t,d:e,h:r,i:s,s:i,tz:a});function D$1(n,t=new Date){let e=t.toLocaleString("en-US",{timeZone:n,timeZoneName:"shortOffset"}).split(" ").slice(-1)[0],r=t.toLocaleString("en-US").replace(/[\u202f]/," ");return Date.parse(`${r} GMT`)-Date.parse(`${r} ${e}`)}function k(n,t){let e=new Date(Date.parse(n));if(isNaN(e))throw new Error("minitz: Invalid ISO8601 passed to parser.");let r=n.substring(9);return n.includes("Z")||r.includes("-")||r.includes("+")?h.tp(e.getUTCFullYear(),e.getUTCMonth()+1,e.getUTCDate(),e.getUTCHours(),e.getUTCMinutes(),e.getUTCSeconds(),"Etc/UTC"):h.tp(e.getFullYear(),e.getMonth()+1,e.getDate(),e.getHours(),e.getMinutes(),e.getSeconds(),t)}h.minitz=h;var b$1=32,p=31|b$1,v=[1,2,4,8,16],d=class{pattern;timezone;second;minute;hour;day;month;dayOfWeek;lastDayOfMonth;starDOM;starDOW;constructor(t,e){this.pattern=t,this.timezone=e,this.second=Array(60).fill(0),this.minute=Array(60).fill(0),this.hour=Array(24).fill(0),this.day=Array(31).fill(0),this.month=Array(12).fill(0),this.dayOfWeek=Array(7).fill(0),this.lastDayOfMonth=false,this.starDOM=false,this.starDOW=false,this.parse();}parse(){if(!(typeof this.pattern=="string"||this.pattern instanceof String))throw new TypeError("CronPattern: Pattern has to be of type string.");this.pattern.indexOf("@")>=0&&(this.pattern=this.handleNicknames(this.pattern).trim());let t=this.pattern.replace(/\s+/g," ").split(" ");if(t.length<5||t.length>6)throw new TypeError("CronPattern: invalid configuration format ('"+this.pattern+"'), exactly five or six space separated parts are required.");if(t.length===5&&t.unshift("0"),t[3].indexOf("L")>=0&&(t[3]=t[3].replace("L",""),this.lastDayOfMonth=true),t[3]=="*"&&(this.starDOM=true),t[4].length>=3&&(t[4]=this.replaceAlphaMonths(t[4])),t[5].length>=3&&(t[5]=this.replaceAlphaDays(t[5])),t[5]=="*"&&(this.starDOW=true),this.pattern.indexOf("?")>=0){let e=new f$1(new Date,this.timezone).getDate(true);t[0]=t[0].replace("?",e.getSeconds().toString()),t[1]=t[1].replace("?",e.getMinutes().toString()),t[2]=t[2].replace("?",e.getHours().toString()),this.starDOM||(t[3]=t[3].replace("?",e.getDate().toString())),t[4]=t[4].replace("?",(e.getMonth()+1).toString()),this.starDOW||(t[5]=t[5].replace("?",e.getDay().toString()));}this.throwAtIllegalCharacters(t),this.partToArray("second",t[0],0,1),this.partToArray("minute",t[1],0,1),this.partToArray("hour",t[2],0,1),this.partToArray("day",t[3],-1,1),this.partToArray("month",t[4],-1,1),this.partToArray("dayOfWeek",t[5],0,p),this.dayOfWeek[7]&&(this.dayOfWeek[0]=this.dayOfWeek[7]);}partToArray(t,e,r,s){let i=this[t],a=t==="day"&&this.lastDayOfMonth;if(e===""&&!a)throw new TypeError("CronPattern: configuration entry "+t+" ("+e+") is empty, check for trailing spaces.");if(e==="*")return i.fill(s);let l=e.split(",");if(l.length>1)for(let o=0;o<l.length;o++)this.partToArray(t,l[o],r,s);else e.indexOf("-")!==-1&&e.indexOf("/")!==-1?this.handleRangeWithStepping(e,t,r,s):e.indexOf("-")!==-1?this.handleRange(e,t,r,s):e.indexOf("/")!==-1?this.handleStepping(e,t,r,s):e!==""&&this.handleNumber(e,t,r,s);}throwAtIllegalCharacters(t){for(let e=0;e<t.length;e++)if((e===5?/[^/*0-9,\-#L]+/:/[^/*0-9,-]+/).test(t[e]))throw new TypeError("CronPattern: configuration entry "+e+" ("+t[e]+") contains illegal characters.")}handleNumber(t,e,r,s){let i=this.extractNth(t,e),a=parseInt(i[0],10)+r;if(isNaN(a))throw new TypeError("CronPattern: "+e+" is not a number: '"+t+"'");this.setPart(e,a,i[1]||s);}setPart(t,e,r){if(!Object.prototype.hasOwnProperty.call(this,t))throw new TypeError("CronPattern: Invalid part specified: "+t);if(t==="dayOfWeek"){if(e===7&&(e=0),e<0||e>6)throw new RangeError("CronPattern: Invalid value for dayOfWeek: "+e);this.setNthWeekdayOfMonth(e,r);return}if(t==="second"||t==="minute"){if(e<0||e>=60)throw new RangeError("CronPattern: Invalid value for "+t+": "+e)}else if(t==="hour"){if(e<0||e>=24)throw new RangeError("CronPattern: Invalid value for "+t+": "+e)}else if(t==="day"){if(e<0||e>=31)throw new RangeError("CronPattern: Invalid value for "+t+": "+e)}else if(t==="month"&&(e<0||e>=12))throw new RangeError("CronPattern: Invalid value for "+t+": "+e);this[t][e]=r;}handleRangeWithStepping(t,e,r,s){let i=this.extractNth(t,e),a=i[0].match(/^(\d+)-(\d+)\/(\d+)$/);if(a===null)throw new TypeError("CronPattern: Syntax error, illegal range with stepping: '"+t+"'");let[,l,o,u]=a,c=parseInt(l,10)+r,w=parseInt(o,10)+r,C=parseInt(u,10);if(isNaN(c))throw new TypeError("CronPattern: Syntax error, illegal lower range (NaN)");if(isNaN(w))throw new TypeError("CronPattern: Syntax error, illegal upper range (NaN)");if(isNaN(C))throw new TypeError("CronPattern: Syntax error, illegal stepping: (NaN)");if(C===0)throw new TypeError("CronPattern: Syntax error, illegal stepping: 0");if(C>this[e].length)throw new TypeError("CronPattern: Syntax error, steps cannot be greater than maximum value of part ("+this[e].length+")");if(c>w)throw new TypeError("CronPattern: From value is larger than to value: '"+t+"'");for(let T=c;T<=w;T+=C)this.setPart(e,T,i[1]||s);}extractNth(t,e){let r=t,s;if(r.includes("#")){if(e!=="dayOfWeek")throw new Error("CronPattern: nth (#) only allowed in day-of-week field");s=r.split("#")[1],r=r.split("#")[0];}return [r,s]}handleRange(t,e,r,s){let i=this.extractNth(t,e),a=i[0].split("-");if(a.length!==2)throw new TypeError("CronPattern: Syntax error, illegal range: '"+t+"'");let l=parseInt(a[0],10)+r,o=parseInt(a[1],10)+r;if(isNaN(l))throw new TypeError("CronPattern: Syntax error, illegal lower range (NaN)");if(isNaN(o))throw new TypeError("CronPattern: Syntax error, illegal upper range (NaN)");if(l>o)throw new TypeError("CronPattern: From value is larger than to value: '"+t+"'");for(let u=l;u<=o;u++)this.setPart(e,u,i[1]||s);}handleStepping(t,e,r,s){let i=this.extractNth(t,e),a=i[0].split("/");if(a.length!==2)throw new TypeError("CronPattern: Syntax error, illegal stepping: '"+t+"'");a[0]===""&&(a[0]="*");let l=0;a[0]!=="*"&&(l=parseInt(a[0],10)+r);let o=parseInt(a[1],10);if(isNaN(o))throw new TypeError("CronPattern: Syntax error, illegal stepping: (NaN)");if(o===0)throw new TypeError("CronPattern: Syntax error, illegal stepping: 0");if(o>this[e].length)throw new TypeError("CronPattern: Syntax error, max steps for part is ("+this[e].length+")");for(let u=l;u<this[e].length;u+=o)this.setPart(e,u,i[1]||s);}replaceAlphaDays(t){return t.replace(/-sun/gi,"-7").replace(/sun/gi,"0").replace(/mon/gi,"1").replace(/tue/gi,"2").replace(/wed/gi,"3").replace(/thu/gi,"4").replace(/fri/gi,"5").replace(/sat/gi,"6")}replaceAlphaMonths(t){return t.replace(/jan/gi,"1").replace(/feb/gi,"2").replace(/mar/gi,"3").replace(/apr/gi,"4").replace(/may/gi,"5").replace(/jun/gi,"6").replace(/jul/gi,"7").replace(/aug/gi,"8").replace(/sep/gi,"9").replace(/oct/gi,"10").replace(/nov/gi,"11").replace(/dec/gi,"12")}handleNicknames(t){let e=t.trim().toLowerCase();return e==="@yearly"||e==="@annually"?"0 0 1 1 *":e==="@monthly"?"0 0 1 * *":e==="@weekly"?"0 0 * * 0":e==="@daily"?"0 0 * * *":e==="@hourly"?"0 * * * *":t}setNthWeekdayOfMonth(t,e){if(typeof e!="number"&&e==="L")this.dayOfWeek[t]=this.dayOfWeek[t]|b$1;else if(e===p)this.dayOfWeek[t]=p;else if(e<6&&e>0)this.dayOfWeek[t]=this.dayOfWeek[t]|v[e-1];else throw new TypeError(`CronPattern: nth weekday out of range, should be 1-5 or L. Value: ${e}, Type: ${typeof e}`)}};var O$1=[31,28,31,30,31,30,31,31,30,31,30,31],m=[["month","year",0],["day","month",-1],["hour","day",0],["minute","hour",0],["second","minute",0]],f$1=class n{tz;ms;second;minute;hour;day;month;year;constructor(t,e){if(this.tz=e,t&&t instanceof Date)if(!isNaN(t))this.fromDate(t);else throw new TypeError("CronDate: Invalid date passed to CronDate constructor");else if(t===void 0)this.fromDate(new Date);else if(t&&typeof t=="string")this.fromString(t);else if(t instanceof n)this.fromCronDate(t);else throw new TypeError("CronDate: Invalid type ("+typeof t+") passed to CronDate constructor")}isNthWeekdayOfMonth(t,e,r,s){let a=new Date(Date.UTC(t,e,r)).getUTCDay(),l=0;for(let o=1;o<=r;o++)new Date(Date.UTC(t,e,o)).getUTCDay()===a&&l++;if(s&p&&v[l-1]&s)return  true;if(s&b$1){let o=new Date(Date.UTC(t,e+1,0)).getUTCDate();for(let u=r+1;u<=o;u++)if(new Date(Date.UTC(t,e,u)).getUTCDay()===a)return  false;return  true}return  false}fromDate(t){if(this.tz!==void 0)if(typeof this.tz=="number")this.ms=t.getUTCMilliseconds(),this.second=t.getUTCSeconds(),this.minute=t.getUTCMinutes()+this.tz,this.hour=t.getUTCHours(),this.day=t.getUTCDate(),this.month=t.getUTCMonth(),this.year=t.getUTCFullYear(),this.apply();else {let e=h.toTZ(t,this.tz);this.ms=t.getMilliseconds(),this.second=e.s,this.minute=e.i,this.hour=e.h,this.day=e.d,this.month=e.m-1,this.year=e.y;}else this.ms=t.getMilliseconds(),this.second=t.getSeconds(),this.minute=t.getMinutes(),this.hour=t.getHours(),this.day=t.getDate(),this.month=t.getMonth(),this.year=t.getFullYear();}fromCronDate(t){this.tz=t.tz,this.year=t.year,this.month=t.month,this.day=t.day,this.hour=t.hour,this.minute=t.minute,this.second=t.second,this.ms=t.ms;}apply(){if(this.month>11||this.day>O$1[this.month]||this.hour>59||this.minute>59||this.second>59||this.hour<0||this.minute<0||this.second<0){let t=new Date(Date.UTC(this.year,this.month,this.day,this.hour,this.minute,this.second,this.ms));return this.ms=t.getUTCMilliseconds(),this.second=t.getUTCSeconds(),this.minute=t.getUTCMinutes(),this.hour=t.getUTCHours(),this.day=t.getUTCDate(),this.month=t.getUTCMonth(),this.year=t.getUTCFullYear(),true}else return  false}fromString(t){if(typeof this.tz=="number"){let e=h.fromTZISO(t);this.ms=e.getUTCMilliseconds(),this.second=e.getUTCSeconds(),this.minute=e.getUTCMinutes(),this.hour=e.getUTCHours(),this.day=e.getUTCDate(),this.month=e.getUTCMonth(),this.year=e.getUTCFullYear(),this.apply();}else return this.fromDate(h.fromTZISO(t,this.tz))}findNext(t,e,r,s){let i=this[e],a;r.lastDayOfMonth&&(this.month!==1?a=O$1[this.month]:a=new Date(Date.UTC(this.year,this.month+1,0,0,0,0,0)).getUTCDate());let l=!r.starDOW&&e=="day"?new Date(Date.UTC(this.year,this.month,1,0,0,0,0)).getUTCDay():void 0;for(let o=this[e]+s;o<r[e].length;o++){let u=r[e][o];if(e==="day"&&r.lastDayOfMonth&&o-s==a&&(u=1),e==="day"&&!r.starDOW){let c=r.dayOfWeek[(l+(o-s-1))%7];if(c&&c&p)c=this.isNthWeekdayOfMonth(this.year,this.month,o-s,c)?1:0;else if(c)throw new Error(`CronDate: Invalid value for dayOfWeek encountered. ${c}`);t.legacyMode&&!r.starDOM?u=u||c:u=u&&c;}if(u)return this[e]=o-s,i!==this[e]?2:1}return 3}recurse(t,e,r){let s=this.findNext(e,m[r][0],t,m[r][2]);if(s>1){let i=r+1;for(;i<m.length;)this[m[i][0]]=-m[i][2],i++;if(s===3)return this[m[r][1]]++,this[m[r][0]]=-m[r][2],this.apply(),this.recurse(t,e,0);if(this.apply())return this.recurse(t,e,r-1)}return r+=1,r>=m.length?this:this.year>=3e3?null:this.recurse(t,e,r)}increment(t,e,r){return this.second+=e.interval!==void 0&&e.interval>1&&r?e.interval:1,this.ms=0,this.apply(),this.recurse(t,e,0)}getDate(t){return t||this.tz===void 0?new Date(this.year,this.month,this.day,this.hour,this.minute,this.second,this.ms):typeof this.tz=="number"?new Date(Date.UTC(this.year,this.month,this.day,this.hour,this.minute-this.tz,this.second,this.ms)):h.fromTZ(h.tp(this.year,this.month+1,this.day,this.hour,this.minute,this.second,this.tz),false)}getTime(){return this.getDate(false).getTime()}};function N$1(n){if(n===void 0&&(n={}),delete n.name,n.legacyMode=n.legacyMode===void 0?true:n.legacyMode,n.paused=n.paused===void 0?false:n.paused,n.maxRuns=n.maxRuns===void 0?1/0:n.maxRuns,n.catch=n.catch===void 0?false:n.catch,n.interval=n.interval===void 0?0:parseInt(n.interval.toString(),10),n.utcOffset=n.utcOffset===void 0?void 0:parseInt(n.utcOffset.toString(),10),n.unref=n.unref===void 0?false:n.unref,n.startAt&&(n.startAt=new f$1(n.startAt,n.timezone)),n.stopAt&&(n.stopAt=new f$1(n.stopAt,n.timezone)),n.interval!==null){if(isNaN(n.interval))throw new Error("CronOptions: Supplied value for interval is not a number");if(n.interval<0)throw new Error("CronOptions: Supplied value for interval can not be negative")}if(n.utcOffset!==void 0){if(isNaN(n.utcOffset))throw new Error("CronOptions: Invalid value passed for utcOffset, should be number representing minutes offset from UTC.");if(n.utcOffset<-870||n.utcOffset>870)throw new Error("CronOptions: utcOffset out of bounds.");if(n.utcOffset!==void 0&&n.timezone)throw new Error("CronOptions: Combining 'utcOffset' with 'timezone' is not allowed.")}if(n.unref!==true&&n.unref!==false)throw new Error("CronOptions: Unref should be either true, false or undefined(false).");return n}function g(n){return Object.prototype.toString.call(n)==="[object Function]"||typeof n=="function"||n instanceof Function}function S$1(n){return g(n)}function P$1(n){typeof Deno<"u"&&typeof Deno.unrefTimer<"u"?Deno.unrefTimer(n):n&&typeof n.unref<"u"&&n.unref();}var _$1=30*1e3,y=[],R$1=class R{name;options;_states;fn;constructor(t,e,r){let s,i;if(g(e))i=e;else if(typeof e=="object")s=e;else if(e!==void 0)throw new Error("Cron: Invalid argument passed for optionsIn. Should be one of function, or object (options).");if(g(r))i=r;else if(typeof r=="object")s=r;else if(r!==void 0)throw new Error("Cron: Invalid argument passed for funcIn. Should be one of function, or object (options).");if(this.name=s?.name,this.options=N$1(s),this._states={kill:false,blocking:false,previousRun:void 0,currentRun:void 0,once:void 0,currentTimeout:void 0,maxRuns:s?s.maxRuns:void 0,paused:s?s.paused:false,pattern:new d("* * * * *")},t&&(t instanceof Date||typeof t=="string"&&t.indexOf(":")>0)?this._states.once=new f$1(t,this.options.timezone||this.options.utcOffset):this._states.pattern=new d(t,this.options.timezone),this.name){if(y.find(l=>l.name===this.name))throw new Error("Cron: Tried to initialize new named job '"+this.name+"', but name already taken.");y.push(this);}return i!==void 0&&S$1(i)&&(this.fn=i,this.schedule()),this}nextRun(t){let e=this._next(t);return e?e.getDate(false):null}nextRuns(t,e){this._states.maxRuns!==void 0&&t>this._states.maxRuns&&(t=this._states.maxRuns);let r=[],s=e||this._states.currentRun||void 0;for(;t--&&(s=this.nextRun(s));)r.push(s);return r}getPattern(){return this._states.pattern?this._states.pattern.pattern:void 0}isRunning(){let t=this.nextRun(this._states.currentRun),e=!this._states.paused,r=this.fn!==void 0,s=!this._states.kill;return e&&r&&s&&t!==null}isStopped(){return this._states.kill}isBusy(){return this._states.blocking}currentRun(){return this._states.currentRun?this._states.currentRun.getDate():null}previousRun(){return this._states.previousRun?this._states.previousRun.getDate():null}msToNext(t){let e=this._next(t);return e?t instanceof f$1||t instanceof Date?e.getTime()-t.getTime():e.getTime()-new f$1(t).getTime():null}stop(){this._states.kill=true,this._states.currentTimeout&&clearTimeout(this._states.currentTimeout);let t=y.indexOf(this);t>=0&&y.splice(t,1);}pause(){return this._states.paused=true,!this._states.kill}resume(){return this._states.paused=false,!this._states.kill}schedule(t){if(t&&this.fn)throw new Error("Cron: It is not allowed to schedule two functions using the same Croner instance.");t&&(this.fn=t);let e=this.msToNext(),r=this.nextRun(this._states.currentRun);return e==null||isNaN(e)||r===null?this:(e>_$1&&(e=_$1),this._states.currentTimeout=setTimeout(()=>this._checkTrigger(r),e),this._states.currentTimeout&&this.options.unref&&P$1(this._states.currentTimeout),this)}async _trigger(t){if(this._states.blocking=true,this._states.currentRun=new f$1(void 0,this.options.timezone||this.options.utcOffset),this.options.catch)try{this.fn!==void 0&&await this.fn(this,this.options.context);}catch(e){g(this.options.catch)&&this.options.catch(e,this);}else this.fn!==void 0&&await this.fn(this,this.options.context);this._states.previousRun=new f$1(t,this.options.timezone||this.options.utcOffset),this._states.blocking=false;}async trigger(){await this._trigger();}runsLeft(){return this._states.maxRuns}_checkTrigger(t){let e=new Date,r=!this._states.paused&&e.getTime()>=t.getTime(),s=this._states.blocking&&this.options.protect;r&&!s?(this._states.maxRuns!==void 0&&this._states.maxRuns--,this._trigger()):r&&s&&g(this.options.protect)&&setTimeout(()=>this.options.protect(this),0),this.schedule();}_next(t){let e=!!(t||this._states.currentRun),r=false;!t&&this.options.startAt&&this.options.interval&&([t,e]=this._calculatePreviousRun(t,e),r=!t),t=new f$1(t,this.options.timezone||this.options.utcOffset),this.options.startAt&&t&&t.getTime()<this.options.startAt.getTime()&&(t=this.options.startAt);let s=this._states.once||new f$1(t,this.options.timezone||this.options.utcOffset);return !r&&s!==this._states.once&&(s=s.increment(this._states.pattern,this.options,e)),this._states.once&&this._states.once.getTime()<=t.getTime()||s===null||this._states.maxRuns!==void 0&&this._states.maxRuns<=0||this._states.kill||this.options.stopAt&&s.getTime()>=this.options.stopAt.getTime()?null:s}_calculatePreviousRun(t,e){let r=new f$1(void 0,this.options.timezone||this.options.utcOffset),s=t;if(this.options.startAt.getTime()<=r.getTime()){s=this.options.startAt;let i=s.getTime()+this.options.interval*1e3;for(;i<=r.getTime();)s=new f$1(s,this.options.timezone||this.options.utcOffset).increment(this._states.pattern,this.options,true),i=s.getTime()+this.options.interval*1e3;e=true;}return s===null&&(s=void 0),[s,e]}};

const r=Object.create(null),i=e=>globalThis.process?.env||globalThis._importMeta_.env||globalThis.Deno?.env.toObject()||globalThis.__env__||(e?r:globalThis),o=new Proxy(r,{get(e,s){return i()[s]??r[s]},has(e,s){const E=i();return s in E||s in r},set(e,s,E){const B=i(true);return B[s]=E,true},deleteProperty(e,s){if(!s)return  false;const E=i(true);return delete E[s],true},ownKeys(){const e=i(true);return Object.keys(e)}}),t=typeof process<"u"&&process.env&&"production"||"",f=[["APPVEYOR"],["AWS_AMPLIFY","AWS_APP_ID",{ci:true}],["AZURE_PIPELINES","SYSTEM_TEAMFOUNDATIONCOLLECTIONURI"],["AZURE_STATIC","INPUT_AZURE_STATIC_WEB_APPS_API_TOKEN"],["APPCIRCLE","AC_APPCIRCLE"],["BAMBOO","bamboo_planKey"],["BITBUCKET","BITBUCKET_COMMIT"],["BITRISE","BITRISE_IO"],["BUDDY","BUDDY_WORKSPACE_ID"],["BUILDKITE"],["CIRCLE","CIRCLECI"],["CIRRUS","CIRRUS_CI"],["CLOUDFLARE_PAGES","CF_PAGES",{ci:true}],["CLOUDFLARE_WORKERS","WORKERS_CI",{ci:true}],["CODEBUILD","CODEBUILD_BUILD_ARN"],["CODEFRESH","CF_BUILD_ID"],["DRONE"],["DRONE","DRONE_BUILD_EVENT"],["DSARI"],["GITHUB_ACTIONS"],["GITLAB","GITLAB_CI"],["GITLAB","CI_MERGE_REQUEST_ID"],["GOCD","GO_PIPELINE_LABEL"],["LAYERCI"],["HUDSON","HUDSON_URL"],["JENKINS","JENKINS_URL"],["MAGNUM"],["NETLIFY"],["NETLIFY","NETLIFY_LOCAL",{ci:false}],["NEVERCODE"],["RENDER"],["SAIL","SAILCI"],["SEMAPHORE"],["SCREWDRIVER"],["SHIPPABLE"],["SOLANO","TDDIUM"],["STRIDER"],["TEAMCITY","TEAMCITY_VERSION"],["TRAVIS"],["VERCEL","NOW_BUILDER"],["VERCEL","VERCEL",{ci:false}],["VERCEL","VERCEL_ENV",{ci:false}],["APPCENTER","APPCENTER_BUILD_ID"],["CODESANDBOX","CODESANDBOX_SSE",{ci:false}],["CODESANDBOX","CODESANDBOX_HOST",{ci:false}],["STACKBLITZ"],["STORMKIT"],["CLEAVR"],["ZEABUR"],["CODESPHERE","CODESPHERE_APP_ID",{ci:true}],["RAILWAY","RAILWAY_PROJECT_ID"],["RAILWAY","RAILWAY_SERVICE_ID"],["DENO-DEPLOY","DENO_DEPLOYMENT_ID"],["FIREBASE_APP_HOSTING","FIREBASE_APP_HOSTING",{ci:true}]];function b(){if(globalThis.process?.env)for(const e of f){const s=e[1]||e[0];if(globalThis.process?.env[s])return {name:e[0].toLowerCase(),...e[2]}}return globalThis.process?.env?.SHELL==="/bin/jsh"&&globalThis.process?.versions?.webcontainer?{name:"stackblitz",ci:false}:{name:"",ci:false}}const l=b();l.name;function n(e){return e?e!=="false":false}const I=globalThis.process?.platform||"",T=n(o.CI)||l.ci!==false,R=n(globalThis.process?.stdout&&globalThis.process?.stdout.isTTY);n(o.DEBUG);const a=t==="test"||n(o.TEST);n(o.MINIMAL)||T||a||!R;const A=/^win/i.test(I);!n(o.NO_COLOR)&&(n(o.FORCE_COLOR)||(R||A)&&o.TERM!=="dumb"||T);const C=(globalThis.process?.versions?.node||"").replace(/^v/,"")||null;Number(C?.split(".")[0])||null;const W=globalThis.process||Object.create(null),_={versions:{}};new Proxy(W,{get(e,s){if(s==="env")return o;if(s in e)return e[s];if(s in _)return _[s]}});const O=globalThis.process?.release?.name==="node",c=!!globalThis.Bun||!!globalThis.process?.versions?.bun,D=!!globalThis.Deno,L=!!globalThis.fastly,S=!!globalThis.Netlify,u=!!globalThis.EdgeRuntime,N=globalThis.navigator?.userAgent==="Cloudflare-Workers",F=[[S,"netlify"],[u,"edge-light"],[N,"workerd"],[L,"fastly"],[D,"deno"],[c,"bun"],[O,"node"]];function G(){const e=F.find(s=>s[0]);if(e)return {name:e[1]}}const P=G();P?.name||"";

const scheduledTasks = [{"cron":"0 * * * *","tasks":["check-deadlines"]}];

const tasks = {
  "check-deadlines": {
          meta: {
            description: "",
          },
          resolve: () => import('../tasks/check-deadlines.mjs').then(r => r.default || r),
        }
};

function defineTask(def) {
  if (typeof def.run !== "function") {
    def.run = () => {
      throw new TypeError("Task must implement a `run` method!");
    };
  }
  return def;
}
const __runningTasks__ = {};
async function runTask(name, {
  payload = {},
  context = {}
} = {}) {
  if (__runningTasks__[name]) {
    return __runningTasks__[name];
  }
  if (!(name in tasks)) {
    throw createError$3({
      message: `Task \`${name}\` is not available!`,
      statusCode: 404
    });
  }
  if (!tasks[name].resolve) {
    throw createError$3({
      message: `Task \`${name}\` is not implemented!`,
      statusCode: 501
    });
  }
  const handler = await tasks[name].resolve();
  const taskEvent = { name, payload, context };
  __runningTasks__[name] = handler.run(taskEvent);
  try {
    const res = await __runningTasks__[name];
    return res;
  } finally {
    delete __runningTasks__[name];
  }
}
function startScheduleRunner() {
  if (!scheduledTasks || scheduledTasks.length === 0 || a) {
    return;
  }
  const payload = {
    scheduledTime: Date.now()
  };
  for (const schedule of scheduledTasks) {
    new R$1(schedule.cron, async () => {
      await Promise.all(
        schedule.tasks.map(
          (name) => runTask(name, {
            payload,
            context: {}
          }).catch((error) => {
            console.error(
              `Error while running scheduled task "${name}"`,
              error
            );
          })
        )
      );
    });
  }
}

function parse(str, options) {
  if (typeof str !== "string") {
    throw new TypeError("argument str must be a string");
  }
  const obj = {};
  const opt = options || {};
  const dec = opt.decode || decode;
  let index = 0;
  while (index < str.length) {
    const eqIdx = str.indexOf("=", index);
    if (eqIdx === -1) {
      break;
    }
    let endIdx = str.indexOf(";", index);
    if (endIdx === -1) {
      endIdx = str.length;
    } else if (endIdx < eqIdx) {
      index = str.lastIndexOf(";", eqIdx - 1) + 1;
      continue;
    }
    const key = str.slice(index, eqIdx).trim();
    if (opt?.filter && !opt?.filter(key)) {
      index = endIdx + 1;
      continue;
    }
    if (void 0 === obj[key]) {
      let val = str.slice(eqIdx + 1, endIdx).trim();
      if (val.codePointAt(0) === 34) {
        val = val.slice(1, -1);
      }
      obj[key] = tryDecode(val, dec);
    }
    index = endIdx + 1;
  }
  return obj;
}
function decode(str) {
  return str.includes("%") ? decodeURIComponent(str) : str;
}
function tryDecode(str, decode2) {
  try {
    return decode2(str);
  } catch {
    return str;
  }
}

const debug = (...args) => {
};
function GracefulShutdown(server, opts) {
  opts = opts || {};
  const options = Object.assign(
    {
      signals: "SIGINT SIGTERM",
      timeout: 3e4,
      development: false,
      forceExit: true,
      onShutdown: (signal) => Promise.resolve(signal),
      preShutdown: (signal) => Promise.resolve(signal)
    },
    opts
  );
  let isShuttingDown = false;
  const connections = {};
  let connectionCounter = 0;
  const secureConnections = {};
  let secureConnectionCounter = 0;
  let failed = false;
  let finalRun = false;
  function onceFactory() {
    let called = false;
    return (emitter, events, callback) => {
      function call() {
        if (!called) {
          called = true;
          return Reflect.apply(callback, this, arguments);
        }
      }
      for (const e of events) {
        emitter.on(e, call);
      }
    };
  }
  const signals = options.signals.split(" ").map((s) => s.trim()).filter((s) => s.length > 0);
  const once = onceFactory();
  once(process, signals, (signal) => {
    debug("received shut down signal", signal);
    shutdown(signal).then(() => {
      if (options.forceExit) {
        process.exit(failed ? 1 : 0);
      }
    }).catch((error) => {
      debug("server shut down error occurred", error);
      process.exit(1);
    });
  });
  function isFunction(functionToCheck) {
    const getType = Object.prototype.toString.call(functionToCheck);
    return /^\[object\s([A-Za-z]+)?Function]$/.test(getType);
  }
  function destroy(socket, force = false) {
    if (socket._isIdle && isShuttingDown || force) {
      socket.destroy();
      if (socket.server instanceof http.Server) {
        delete connections[socket._connectionId];
      } else {
        delete secureConnections[socket._connectionId];
      }
    }
  }
  function destroyAllConnections(force = false) {
    debug("Destroy Connections : " + (force ? "forced close" : "close"));
    let counter = 0;
    let secureCounter = 0;
    for (const key of Object.keys(connections)) {
      const socket = connections[key];
      const serverResponse = socket._httpMessage;
      if (serverResponse && !force) {
        if (!serverResponse.headersSent) {
          serverResponse.setHeader("connection", "close");
        }
      } else {
        counter++;
        destroy(socket);
      }
    }
    debug("Connections destroyed : " + counter);
    debug("Connection Counter    : " + connectionCounter);
    for (const key of Object.keys(secureConnections)) {
      const socket = secureConnections[key];
      const serverResponse = socket._httpMessage;
      if (serverResponse && !force) {
        if (!serverResponse.headersSent) {
          serverResponse.setHeader("connection", "close");
        }
      } else {
        secureCounter++;
        destroy(socket);
      }
    }
    debug("Secure Connections destroyed : " + secureCounter);
    debug("Secure Connection Counter    : " + secureConnectionCounter);
  }
  server.on("request", (req, res) => {
    req.socket._isIdle = false;
    if (isShuttingDown && !res.headersSent) {
      res.setHeader("connection", "close");
    }
    res.on("finish", () => {
      req.socket._isIdle = true;
      destroy(req.socket);
    });
  });
  server.on("connection", (socket) => {
    if (isShuttingDown) {
      socket.destroy();
    } else {
      const id = connectionCounter++;
      socket._isIdle = true;
      socket._connectionId = id;
      connections[id] = socket;
      socket.once("close", () => {
        delete connections[socket._connectionId];
      });
    }
  });
  server.on("secureConnection", (socket) => {
    if (isShuttingDown) {
      socket.destroy();
    } else {
      const id = secureConnectionCounter++;
      socket._isIdle = true;
      socket._connectionId = id;
      secureConnections[id] = socket;
      socket.once("close", () => {
        delete secureConnections[socket._connectionId];
      });
    }
  });
  process.on("close", () => {
    debug("closed");
  });
  function shutdown(sig) {
    function cleanupHttp() {
      destroyAllConnections();
      debug("Close http server");
      return new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) {
            return reject(err);
          }
          return resolve(true);
        });
      });
    }
    debug("shutdown signal - " + sig);
    if (options.development) {
      debug("DEV-Mode - immediate forceful shutdown");
      return process.exit(0);
    }
    function finalHandler() {
      if (!finalRun) {
        finalRun = true;
        if (options.finally && isFunction(options.finally)) {
          debug("executing finally()");
          options.finally();
        }
      }
      return Promise.resolve();
    }
    function waitForReadyToShutDown(totalNumInterval) {
      debug(`waitForReadyToShutDown... ${totalNumInterval}`);
      if (totalNumInterval === 0) {
        debug(
          `Could not close connections in time (${options.timeout}ms), will forcefully shut down`
        );
        return Promise.resolve(true);
      }
      const allConnectionsClosed = Object.keys(connections).length === 0 && Object.keys(secureConnections).length === 0;
      if (allConnectionsClosed) {
        debug("All connections closed. Continue to shutting down");
        return Promise.resolve(false);
      }
      debug("Schedule the next waitForReadyToShutdown");
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(waitForReadyToShutDown(totalNumInterval - 1));
        }, 250);
      });
    }
    if (isShuttingDown) {
      return Promise.resolve();
    }
    debug("shutting down");
    return options.preShutdown(sig).then(() => {
      isShuttingDown = true;
      cleanupHttp();
    }).then(() => {
      const pollIterations = options.timeout ? Math.round(options.timeout / 250) : 0;
      return waitForReadyToShutDown(pollIterations);
    }).then((force) => {
      debug("Do onShutdown now");
      if (force) {
        destroyAllConnections(force);
      }
      return options.onShutdown(sig);
    }).then(finalHandler).catch((error) => {
      const errString = typeof error === "string" ? error : JSON.stringify(error);
      debug(errString);
      failed = true;
      throw errString;
    });
  }
  function shutdownManual() {
    return shutdown("manual");
  }
  return shutdownManual;
}

function getGracefulShutdownConfig() {
  return {
    disabled: !!process.env.NITRO_SHUTDOWN_DISABLED,
    signals: (process.env.NITRO_SHUTDOWN_SIGNALS || "SIGTERM SIGINT").split(" ").map((s) => s.trim()),
    timeout: Number.parseInt(process.env.NITRO_SHUTDOWN_TIMEOUT || "", 10) || 3e4,
    forceExit: !process.env.NITRO_SHUTDOWN_NO_FORCE_EXIT
  };
}
function setupGracefulShutdown(listener, nitroApp) {
  const shutdownConfig = getGracefulShutdownConfig();
  if (shutdownConfig.disabled) {
    return;
  }
  GracefulShutdown(listener, {
    signals: shutdownConfig.signals.join(" "),
    timeout: shutdownConfig.timeout,
    forceExit: shutdownConfig.forceExit,
    onShutdown: async () => {
      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.warn("Graceful shutdown timeout, force exiting...");
          resolve();
        }, shutdownConfig.timeout);
        nitroApp.hooks.callHook("close").catch((error) => {
          console.error(error);
        }).finally(() => {
          clearTimeout(timeout);
          resolve();
        });
      });
    }
  });
}

export { BOT_MESSAGES as $, updateStudentsCount as A, getRequestIP as B, verifyRefreshToken as C, hashPassword as D, extractToken as E, setHeader as F, requireAuth as G, runMigrations as H, sendStream as I, invalidateRelatedCache as J, appendHeader as K, setResponseHeader as L, getOrganizationById as M, deleteOrganization as N, organizationCodeExists as O, updateOrganization as P, getOrganizationsPaginated as Q, createOrganization as R, searchOrganizations as S, getAllOrganizations as T, UserRole as U, getOrganizationsStats as V, getRepresentativeById as W, deleteRepresentative as X, updateRepresentative as Y, approveRepresentative as Z, sendMessage as _, trapUnhandledNodeErrors as a, blockRepresentative as a0, unblockRepresentative as a1, getRepresentativesPaginated as a2, getPendingRepresentatives as a3, getRepresentativeStats as a4, getBot as a5, verifyWebhookSecret as a6, handleUpdate as a7, getHeaders as a8, getRepresentativeByTelegramChatId as a9, createHooks as aA, executeAsync as aB, toRouteMatcher as aC, createRouter$1 as aD, defu as aE, parseQuery as aF, withTrailingSlash as aG, withoutTrailingSlash as aH, db as aI, auth as aJ, sendDocument as aa, validateName as ab, normalizePhone as ac, validatePhone as ad, createRepresentative as ae, joinRelativeURL as af, getResponseStatusText as ag, getResponseStatus as ah, defineRenderHandler as ai, getQuery$1 as aj, createError$1 as ak, getRouteRules as al, klona as am, hasProtocol as an, isScriptProtocol as ao, joinURL as ap, withQuery as aq, parse as ar, getRequestHeader as as, isEqual as at, sanitizeStatusCode as au, getContext as av, setCookie as aw, getCookie as ax, deleteCookie as ay, $fetch as az, startScheduleRunner as b, useNitroApp as c, destr as d, defineTask as e, executeQuery as f, defineEventHandler as g, createError as h, getQuery as i, getRouterParam as j, executeTransaction as k, readMultipartFormData as l, testConnection as m, createTokenPayload as n, generateToken as o, generateRefreshToken as p, toPublicUser as q, readBody as r, setupGracefulShutdown as s, toNodeListener as t, useRuntimeConfig as u, verifyPassword as v, getDbPool as w, getHeader as x, verifyToken as y, getOrCreateOrganizationByName as z };
//# sourceMappingURL=nitro.mjs.map
