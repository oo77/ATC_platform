import { Bot, InlineKeyboard, Keyboard } from 'grammy';
import { v4 } from 'uuid';
import http from 'node:http';
import https from 'node:https';
import { EventEmitter } from 'node:events';
import { Buffer as Buffer$1 } from 'node:buffer';
import { promises, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { createHash } from 'node:crypto';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
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
    return input;
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
  const trimmed = input.slice(_base.length);
  return trimmed[0] === "/" ? trimmed : "/" + trimmed;
}
function withQuery(input, query) {
  const parsed = parseURL(input);
  const mergedQuery = { ...parseQuery(parsed.search), ...query };
  parsed.search = stringifyQuery(mergedQuery);
  return stringifyParsedURL(parsed);
}
function getQuery$1(input) {
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
function serialize$2(name, value, options) {
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

function o(n){throw new Error(`${n} is not implemented yet!`)}let i$1 = class i extends EventEmitter{__unenv__={};readableEncoding=null;readableEnded=true;readableFlowing=false;readableHighWaterMark=0;readableLength=0;readableObjectMode=false;readableAborted=false;readableDidRead=false;closed=false;errored=null;readable=false;destroyed=false;static from(e,t){return new i(t)}constructor(e){super();}_read(e){}read(e){}setEncoding(e){return this}pause(){return this}resume(){return this}isPaused(){return  true}unpipe(e){return this}unshift(e,t){}wrap(e){return this}push(e,t){return  false}_destroy(e,t){this.removeAllListeners();}destroy(e){return this.destroyed=true,this._destroy(e),this}pipe(e,t){return {}}compose(e,t){throw new Error("Method not implemented.")}[Symbol.asyncDispose](){return this.destroy(),Promise.resolve()}async*[Symbol.asyncIterator](){throw o("Readable.asyncIterator")}iterator(e){throw o("Readable.iterator")}map(e,t){throw o("Readable.map")}filter(e,t){throw o("Readable.filter")}forEach(e,t){throw o("Readable.forEach")}reduce(e,t,r){throw o("Readable.reduce")}find(e,t){throw o("Readable.find")}findIndex(e,t){throw o("Readable.findIndex")}some(e,t){throw o("Readable.some")}toArray(e){throw o("Readable.toArray")}every(e,t){throw o("Readable.every")}flatMap(e,t){throw o("Readable.flatMap")}drop(e,t){throw o("Readable.drop")}take(e,t){throw o("Readable.take")}asIndexedPairs(e){throw o("Readable.asIndexedPairs")}};let l$1 = class l extends EventEmitter{__unenv__={};writable=true;writableEnded=false;writableFinished=false;writableHighWaterMark=0;writableLength=0;writableObjectMode=false;writableCorked=0;closed=false;errored=null;writableNeedDrain=false;writableAborted=false;destroyed=false;_data;_encoding="utf8";constructor(e){super();}pipe(e,t){return {}}_write(e,t,r){if(this.writableEnded){r&&r();return}if(this._data===void 0)this._data=e;else {const s=typeof this._data=="string"?Buffer$1.from(this._data,this._encoding||t||"utf8"):this._data,a=typeof e=="string"?Buffer$1.from(e,t||this._encoding||"utf8"):e;this._data=Buffer$1.concat([s,a]);}this._encoding=t,r&&r();}_writev(e,t){}_destroy(e,t){}_final(e){}write(e,t,r){const s=typeof t=="string"?this._encoding:"utf8",a=typeof t=="function"?t:typeof r=="function"?r:void 0;return this._write(e,s,a),true}setDefaultEncoding(e){return this}end(e,t,r){const s=typeof e=="function"?e:typeof t=="function"?t:typeof r=="function"?r:void 0;if(this.writableEnded)return s&&s(),this;const a=e===s?void 0:e;if(a){const u=t===s?void 0:t;this.write(a,u,s);}return this.writableEnded=true,this.writableFinished=true,this.emit("close"),this.emit("finish"),this}cork(){}uncork(){}destroy(e){return this.destroyed=true,delete this._data,this.removeAllListeners(),this}compose(e,t){throw new Error("Method not implemented.")}[Symbol.asyncDispose](){return Promise.resolve()}};const c$1=class c{allowHalfOpen=true;_destroy;constructor(e=new i$1,t=new l$1){Object.assign(this,e),Object.assign(this,t),this._destroy=m(e._destroy,t._destroy);}};function _(){return Object.assign(c$1.prototype,i$1.prototype),Object.assign(c$1.prototype,l$1.prototype),c$1}function m(...n){return function(...e){for(const t of n)t(...e);}}const g=_();class A extends g{__unenv__={};bufferSize=0;bytesRead=0;bytesWritten=0;connecting=false;destroyed=false;pending=false;localAddress="";localPort=0;remoteAddress="";remoteFamily="";remotePort=0;autoSelectFamilyAttemptedAddresses=[];readyState="readOnly";constructor(e){super();}write(e,t,r){return  false}connect(e,t,r){return this}end(e,t,r){return this}setEncoding(e){return this}pause(){return this}resume(){return this}setTimeout(e,t){return this}setNoDelay(e){return this}setKeepAlive(e,t){return this}address(){return {}}unref(){return this}ref(){return this}destroySoon(){this.destroy();}resetAndDestroy(){const e=new Error("ERR_SOCKET_CLOSED");return e.code="ERR_SOCKET_CLOSED",this.destroy(e),this}}class y extends i$1{aborted=false;httpVersion="1.1";httpVersionMajor=1;httpVersionMinor=1;complete=true;connection;socket;headers={};trailers={};method="GET";url="/";statusCode=200;statusMessage="";closed=false;errored=null;readable=false;constructor(e){super(),this.socket=this.connection=e||new A;}get rawHeaders(){const e=this.headers,t=[];for(const r in e)if(Array.isArray(e[r]))for(const s of e[r])t.push(r,s);else t.push(r,e[r]);return t}get rawTrailers(){return []}setTimeout(e,t){return this}get headersDistinct(){return p(this.headers)}get trailersDistinct(){return p(this.trailers)}}function p(n){const e={};for(const[t,r]of Object.entries(n))t&&(e[t]=(Array.isArray(r)?r:[r]).filter(Boolean));return e}class w extends l$1{statusCode=200;statusMessage="";upgrading=false;chunkedEncoding=false;shouldKeepAlive=false;useChunkedEncodingByDefault=false;sendDate=false;finished=false;headersSent=false;strictContentLength=false;connection=null;socket=null;req;_headers={};constructor(e){super(),this.req=e;}assignSocket(e){e._httpMessage=this,this.socket=e,this.connection=e,this.emit("socket",e),this._flush();}_flush(){this.flushHeaders();}detachSocket(e){}writeContinue(e){}writeHead(e,t,r){e&&(this.statusCode=e),typeof t=="string"&&(this.statusMessage=t,t=void 0);const s=r||t;if(s&&!Array.isArray(s))for(const a in s)this.setHeader(a,s[a]);return this.headersSent=true,this}writeProcessing(){}setTimeout(e,t){return this}appendHeader(e,t){e=e.toLowerCase();const r=this._headers[e],s=[...Array.isArray(r)?r:[r],...Array.isArray(t)?t:[t]].filter(Boolean);return this._headers[e]=s.length>1?s:s[0],this}setHeader(e,t){return this._headers[e.toLowerCase()]=t,this}setHeaders(e){for(const[t,r]of Object.entries(e))this.setHeader(t,r);return this}getHeader(e){return this._headers[e.toLowerCase()]}getHeaders(){return this._headers}getHeaderNames(){return Object.keys(this._headers)}hasHeader(e){return e.toLowerCase()in this._headers}removeHeader(e){delete this._headers[e.toLowerCase()];}addTrailers(e){}flushHeaders(){}writeEarlyHints(e,t){typeof t=="function"&&t();}}const E=(()=>{const n=function(){};return n.prototype=Object.create(null),n})();function R(n={}){const e=new E,t=Array.isArray(n)||H(n)?n:Object.entries(n);for(const[r,s]of t)if(s){if(e[r]===void 0){e[r]=s;continue}e[r]=[...Array.isArray(e[r])?e[r]:[e[r]],...Array.isArray(s)?s:[s]];}return e}function H(n){return typeof n?.entries=="function"}function v(n={}){if(n instanceof Headers)return n;const e=new Headers;for(const[t,r]of Object.entries(n))if(r!==void 0){if(Array.isArray(r)){for(const s of r)e.append(t,String(s));continue}e.set(t,String(r));}return e}const S=new Set([101,204,205,304]);async function b(n,e){const t=new y,r=new w(t);t.url=e.url?.toString()||"/";let s;if(!t.url.startsWith("/")){const d=new URL(t.url);s=d.host,t.url=d.pathname+d.search+d.hash;}t.method=e.method||"GET",t.headers=R(e.headers||{}),t.headers.host||(t.headers.host=e.host||s||"localhost"),t.connection.encrypted=t.connection.encrypted||e.protocol==="https",t.body=e.body||null,t.__unenv__=e.context,await n(t,r);let a=r._data;(S.has(r.statusCode)||t.method.toUpperCase()==="HEAD")&&(a=null,delete r._headers["content-length"]);const u={status:r.statusCode,statusText:r.statusMessage,headers:r._headers,body:a};return t.destroy(),r.destroy(),u}async function C(n,e,t={}){try{const r=await b(n,{url:e,...t});return new Response(r.body,{status:r.status,statusText:r.statusText,headers:v(r.headers)})}catch(r){return new Response(r.toString(),{status:Number.parseInt(r.statusCode||r.code)||500,statusText:r.statusText})}}

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
function createError$1(input) {
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
function sendError(event, error, debug) {
  if (event.handled) {
    return;
  }
  const h3Error = isError(error) ? error : createError$1(error);
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
  setResponseStatus(event, _code, h3Error.statusMessage);
  event.node.res.setHeader("content-type", MIMES.json);
  event.node.res.end(JSON.stringify(responseBody, void 0, 2));
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
  return getQuery$1(event.path || "");
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
    throw createError$1({
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
  if (!Number.parseInt(event.node.req.headers["content-length"] || "") && !String(event.node.req.headers["transfer-encoding"] ?? "").split(",").map((e) => e.trim()).filter(Boolean).includes("chunked")) {
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
function getRequestWebStream(event) {
  if (!PayloadMethods$1.includes(event.method)) {
    return;
  }
  const bodyStream = event.web?.request?.body || event._requestBody;
  if (bodyStream) {
    return bodyStream;
  }
  const _hasRawBody = RawBodySymbol in event.node.req || "rawBody" in event.node.req || "body" in event.node.req || "__unenv__" in event.node.req;
  if (_hasRawBody) {
    return new ReadableStream({
      async start(controller) {
        const _rawBody = await readRawBody(event, false);
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
function _parseJSON(body = "", strict) {
  if (!body) {
    return void 0;
  }
  try {
    return destr(body, { strict });
  } catch {
    throw createError$1({
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
  const newCookie = serialize$2(name, value, serializeOptions);
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

const defer = typeof setImmediate === "undefined" ? (fn) => fn() : setImmediate;
function send(event, data, type) {
  if (type) {
    defaultContentType(event, type);
  }
  return new Promise((resolve) => {
    defer(() => {
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
  const _code = sanitizeStatusCode(code, 204);
  if (_code === 204) {
    event.node.res.removeHeader("content-length");
  }
  event.node.res.writeHead(_code);
  event.node.res.end();
}
function setResponseStatus(event, code, text) {
  if (code) {
    event.node.res.statusCode = sanitizeStatusCode(
      code,
      event.node.res.statusCode
    );
  }
  if (text) {
    event.node.res.statusMessage = sanitizeStatusMessage(text);
  }
}
function getResponseStatus(event) {
  return event.node.res.statusCode;
}
function getResponseStatusText(event) {
  return event.node.res.statusMessage;
}
function defaultContentType(event, type) {
  if (type && event.node.res.statusCode !== 304 && !event.node.res.getHeader("content-type")) {
    event.node.res.setHeader("content-type", type);
  }
}
function sendRedirect(event, location, code = 302) {
  event.node.res.statusCode = sanitizeStatusCode(
    code,
    event.node.res.statusCode
  );
  event.node.res.setHeader("location", location);
  const encodedLoc = location.replace(/"/g, "%22");
  const html = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${encodedLoc}"></head></html>`;
  return send(event, html, MIMES.html);
}
function getResponseHeader(event, name) {
  return event.node.res.getHeader(name);
}
function setResponseHeaders(event, headers) {
  for (const [name, value] of Object.entries(headers)) {
    event.node.res.setHeader(
      name,
      value
    );
  }
}
const setHeaders = setResponseHeaders;
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
function sendWebResponse(event, response) {
  for (const [key, value] of response.headers) {
    if (key === "set-cookie") {
      event.node.res.appendHeader(key, splitCookiesString(value));
    } else {
      event.node.res.setHeader(key, value);
    }
  }
  if (response.status) {
    event.node.res.statusCode = sanitizeStatusCode(
      response.status,
      event.node.res.statusCode
    );
  }
  if (response.statusText) {
    event.node.res.statusMessage = sanitizeStatusMessage(response.statusText);
  }
  if (response.redirected) {
    event.node.res.setHeader("location", response.url);
  }
  if (!response.body) {
    event.node.res.end();
    return;
  }
  return sendStream(event, response.body);
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
      body = await readRawBody(event, false).catch(() => void 0);
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
    throw createError$1({
      status: 502,
      statusMessage: "Bad Gateway",
      cause: error
    });
  }
  event.node.res.statusCode = sanitizeStatusCode(
    response.status,
    event.node.res.statusCode
  );
  event.node.res.statusMessage = sanitizeStatusMessage(response.statusText);
  const cookies = [];
  for (const [key, value] of response.headers.entries()) {
    if (key === "content-encoding") {
      continue;
    }
    if (key === "content-length") {
      continue;
    }
    if (key === "set-cookie") {
      cookies.push(...splitCookiesString(value));
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
  const reqHeaders = getRequestHeaders(event);
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
  return hasProp(input, "__is_event__");
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
const eventHandler = defineEventHandler;
function isEventHandler(input) {
  return hasProp(input, "__is_handler__");
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
      throw createError$1({
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
      return sendStream(event, val);
    }
    if (val.buffer) {
      return send(event, val);
    }
    if (val.arrayBuffer && typeof val.arrayBuffer === "function") {
      return val.arrayBuffer().then((arrayBuffer) => {
        return send(event, Buffer.from(arrayBuffer), val.type);
      });
    }
    if (val instanceof Error) {
      throw createError$1(val);
    }
    if (typeof val.end === "function") {
      return true;
    }
  }
  const valType = typeof val;
  if (valType === "string") {
    return send(event, val, MIMES.html);
  }
  if (valType === "object" || valType === "boolean" || valType === "number") {
    return send(event, JSON.stringify(val, void 0, jsonSpace), MIMES.json);
  }
  if (valType === "bigint") {
    return send(event, val.toString(), MIMES.json);
  }
  throw createError$1({
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
        error: createError$1({
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
        error: createError$1({
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
      const error = createError$1(_error);
      if (!isError(_error)) {
        error.unhandled = true;
      }
      setResponseStatus(event, error.statusCode, error.statusMessage);
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

const s$1=globalThis.Headers,i=globalThis.AbortController,l=globalThis.fetch||(()=>{throw new Error("[node-fetch-native] Failed to fetch: `globalThis.fetch` is not available!")});

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
    return l;
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
    return l(input, { ...nodeFetchOptions, ...init });
  };
}
const fetch = globalThis.fetch ? (...args) => globalThis.fetch(...args) : createNodeFetch();
const Headers$1 = globalThis.Headers || s$1;
const AbortController = globalThis.AbortController || i;
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

const assets = {
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
function createError(driver, message, opts) {
  const err = new Error(`[unstorage] [${driver}] ${message}`, opts);
  if (Error.captureStackTrace) {
    Error.captureStackTrace(err, createError);
  }
  return err;
}
function createRequiredError(driver, name) {
  if (Array.isArray(name)) {
    return createError(
      driver,
      `Missing some of the required options ${name.map((n) => "`" + n + "`").join(", ")}`
    );
  }
  return createError(driver, `Missing required option \`${name}\`.`);
}

function ignoreNotfound(err) {
  return err.code === "ENOENT" || err.code === "EISDIR" ? null : err;
}
function ignoreExists(err) {
  return err.code === "EEXIST" ? null : err;
}
async function writeFile(path, data, encoding) {
  await ensuredir(dirname(path));
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
  await ensuredir(dirname(dir)).catch(ignoreExists);
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
      const entryPath = resolve(dir, entry.name);
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
      const entryPath = resolve(dir, entry.name);
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
  opts.base = resolve(opts.base);
  const r = (key) => {
    if (PATH_TRAVERSE_RE.test(key)) {
      throw createError(
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

storage.mount('/assets', assets);

storage.mount('data', unstorage_47drivers_47fs_45lite({"driver":"fsLite","base":"./.data/kv"}));

function useStorage(base = "") {
  return base ? prefixStorage(storage, base) : storage;
}

function serialize$1(o){return typeof o=="string"?`'${o}'`:new c().serialize(o)}const c=/*@__PURE__*/function(){class o{#t=new Map;compare(t,r){const e=typeof t,n=typeof r;return e==="string"&&n==="string"?t.localeCompare(r):e==="number"&&n==="number"?t-r:String.prototype.localeCompare.call(this.serialize(t,true),this.serialize(r,true))}serialize(t,r){if(t===null)return "null";switch(typeof t){case "string":return r?t:`'${t}'`;case "bigint":return `${t}n`;case "object":return this.$object(t);case "function":return this.$function(t)}return String(t)}serializeObject(t){const r=Object.prototype.toString.call(t);if(r!=="[object Object]")return this.serializeBuiltInType(r.length<10?`unknown:${r}`:r.slice(8,-1),t);const e=t.constructor,n=e===Object||e===void 0?"":e.name;if(n!==""&&globalThis[n]===e)return this.serializeBuiltInType(n,t);if(typeof t.toJSON=="function"){const i=t.toJSON();return n+(i!==null&&typeof i=="object"?this.$object(i):`(${this.serialize(i)})`)}return this.serializeObjectEntries(n,Object.entries(t))}serializeBuiltInType(t,r){const e=this["$"+t];if(e)return e.call(this,r);if(typeof r?.entries=="function")return this.serializeObjectEntries(t,r.entries());throw new Error(`Cannot serialize ${t}`)}serializeObjectEntries(t,r){const e=Array.from(r).sort((i,a)=>this.compare(i[0],a[0]));let n=`${t}{`;for(let i=0;i<e.length;i++){const[a,l]=e[i];n+=`${this.serialize(a,true)}:${this.serialize(l)}`,i<e.length-1&&(n+=",");}return n+"}"}$object(t){let r=this.#t.get(t);return r===void 0&&(this.#t.set(t,`#${this.#t.size}`),r=this.serializeObject(t),this.#t.set(t,r)),r}$function(t){const r=Function.prototype.toString.call(t);return r.slice(-15)==="[native code] }"?`${t.name||""}()[native]`:`${t.name}(${t.length})${r.replace(/\s*\n\s*/g,"")}`}$Array(t){let r="[";for(let e=0;e<t.length;e++)r+=this.serialize(t[e]),e<t.length-1&&(r+=",");return r+"]"}$Date(t){try{return `Date(${t.toISOString()})`}catch{return "Date(null)"}}$ArrayBuffer(t){return `ArrayBuffer[${new Uint8Array(t).join(",")}]`}$Set(t){return `Set${this.$Array(Array.from(t).sort((r,e)=>this.compare(r,e)))}`}$Map(t){return this.serializeObjectEntries("Map",t.entries())}}for(const s of ["Error","RegExp","URL"])o.prototype["$"+s]=function(t){return `${s}(${t})`};for(const s of ["Int8Array","Uint8Array","Uint8ClampedArray","Int16Array","Uint16Array","Int32Array","Uint32Array","Float32Array","Float64Array"])o.prototype["$"+s]=function(t){return `${s}[${t.join(",")}]`};for(const s of ["BigInt64Array","BigUint64Array"])o.prototype["$"+s]=function(t){return `${s}[${t.join("n,")}${t.length>0?"n":""}]`};return o}();

function isEqual(object1, object2) {
  if (object1 === object2) {
    return true;
  }
  if (serialize$1(object1) === serialize$1(object2)) {
    return true;
  }
  return false;
}

const e=globalThis.process?.getBuiltinModule?.("crypto")?.hash,r="sha256",s="base64url";function digest(t){if(e)return e(r,t,s);const o=createHash(r).update(t);return globalThis.process?.versions?.webcontainer?o.digest().toString(s):o.digest(s)}

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
function serialize(object) {
  const hasher = new Hasher();
  hasher.dispatch(object);
  return hasher.buff;
}
function hash(value) {
  return digest(typeof value === "string" ? value : serialize(value)).replace(/[-_]/g, "").slice(0, 10);
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
  return defineEventHandler(async (event) => {
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
          splitCookiesString(value)
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
    "buildId": "d6084d63-c18e-4d57-b837-d22fbb7955c6",
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

getContext("nitro-app", {
  asyncContext: false,
  AsyncLocalStorage: void 0
});

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
        const query = getQuery$1(event.path);
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
        const query = getQuery$1(event.path);
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
  return splitCookiesString(joinHeaders(header));
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

function isJsonRequest(event) {
  if (hasReqHeader(event, "accept", "text/html")) {
    return false;
  }
  return hasReqHeader(event, "accept", "application/json") || hasReqHeader(event, "user-agent", "curl/") || hasReqHeader(event, "user-agent", "httpie/") || hasReqHeader(event, "sec-fetch-mode", "cors") || event.path.startsWith("/api/") || event.path.endsWith(".json");
}
function hasReqHeader(event, name, includes) {
  const value = getRequestHeader(event, name);
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
  const reqHeaders = getRequestHeaders(event);
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
    const { template } = await import('../_/error-500.mjs');
    setResponseHeader(event, "Content-Type", "text/html;charset=UTF-8");
    return send(event, template(errorObject));
  }
  const html = await res.text();
  for (const [header, value] of res.headers.entries()) {
    if (header === "set-cookie") {
      appendResponseHeader(event, header, value);
      continue;
    }
    setResponseHeader(event, header, value);
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
    setResponseHeaders(event, res.headers);
    setResponseStatus(event, res.status, res.statusText);
    return send(event, JSON.stringify(res.body, null, 2));
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
  setResponseStatus(event, statusCode, statusMessage);
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

const AIVEN_CA_CERTIFICATE = `-----BEGIN CERTIFICATE-----
MIIEUDCCArigAwIBAgIUTAG7gMPqpM+PfUHgMf9lLG4b+bEwDQYJKoZIhvcNAQEM
BQAwQDE+MDwGA1UEAww1NDUyZWFmYzMtNDU4NC00Njg4LWI1NDAtODJiYWU4ZTE0
ZDc0IEdFTiAxIFByb2plY3QgQ0EwHhcNMjUxMDMwMDcyNjUxWhcNMzUxMDI4MDcy
NjUxWjBAMT4wPAYDVQQDDDU0NTJlYWZjMy00NTg0LTQ2ODgtYjU0MC04MmJhZThl
MTRkNzQgR0VOIDEgUHJvamVjdCBDQTCCAaIwDQYJKoZIhvcNAQEBBQADggGPADCC
AYoCggGBAKmKyGKzFAYjQJGdtlrtvXPuaZacnbjrde5BYQdU52IX5tJeWQ58N27o
pDbMrZhlOCvHd57K5Oxkp6V5alnI0/ekuTN8eoIYvjtNqtE72gIN6I808+nk1K/0
tPxrvTURAFEvxyhf77JEIWOAz+OJ0fYfDmoIIp+IY5b0wp/sLhNO1u1m2+8tDglu
bTSO4139nJo0D8ApafMpF5sQ5Vpci6wk9u6W3XpJ/+wJuJ5Oioe/mjEv/TKCkmzn
wX4ALgiONVI3qxPV7RaynNY/SRpBX5kcuChrP/3+WZ9QsRwyPI530Kz2nZX10XVm
5ik/tEVJAjf08yrhAjLxZ4paBt3Pcy9egNWIeA2ixMy49qu1QkDkCrw8t4K79oAC
By/bj5aVGbup2W+Q5hc83AQ2IhmWVWChnJI9dcg1l7T4AAqXJPBtp1AWGhHcldNH
3Ao/aavgLE9kTcEWLO5P1izMKaYsqhpsQEx3lmWcLi4wPJn7F2f0pQ0Q5rJZ74Z6
RNrZ80/c5wIDAQABo0IwQDAdBgNVHQ4EFgQUT+zOIhiQP49iiJ8dkJIeB0JY3JUw
EgYDVR0TAQH/BAgwBgEB/wIBADALBgNVHQ8EBAMCAQYwDQYJKoZIhvcNAQEMBQAD
ggGBACVlQGNrmSCfIaevjuMDqvdGB7NZYJM3Fkr4m7bAtDD0WYxgneH9HmcaWcpA
Ctzbv64vP/wBIMRKzj3DeglUIe1hwaXQq4mcNuoGt4TMHzktdZhisgxCdjYFVIcS
qjbsK1XOPChn/WFmEqCN+FsTdXIi4CeQPSFKFOIVxM+UKRk/nx2DV2PDwN/pt3A/
Gq10ujVDZNTdQlBSLIf5b+qtIVQRJ66cHpIaTTWZvkw++0ULbA8dK0f7sdrd751A
lK1uTg9e3TEeW7TTdKqsr/8F8VVrJDtKjJLSN7IbM4QmnzBC/QAkNnuPEaDwwmyj
5XEdvDcAa+VfZXRXSjAi05fsgw5f94dqJlos2oEDmeEN4tx3y0VItPUXOZNbWg7r
JPPGg3mrBuICcqd1h9OgyYo+siTwHITM/kL0fgLzNWHEyYQ5GLigzvXNw+WLlWsh
iLd4pScmXlOmyIbdtAhxRwmNLBDupx/C3H8pTGl0nFKA3P3Sb/Ftw53wewc51flt
Z7dREA==
-----END CERTIFICATE-----`;
function getSslConfig() {
  const sslEnabled = process.env.DATABASE_SSL === "true";
  if (!sslEnabled) {
    return void 0;
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

const description$c = "\u041A\u043E\u043D\u0441\u043E\u043B\u0438\u0434\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u0430\u044F \u043C\u0438\u0433\u0440\u0430\u0446\u0438\u044F: \u043F\u043E\u043B\u043D\u0430\u044F \u0441\u0445\u0435\u043C\u0430 \u0431\u0430\u0437\u044B \u0434\u0430\u043D\u043D\u044B\u0445";
const up$f = async (connection) => {
  console.log("\u{1F504} Running consolidated migration: Full database schema");
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
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_email (email),
      INDEX idx_role (role),
      INDEX idx_pinfl (pinfl)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('\u2705 Table "users" created');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS organizations (
      id VARCHAR(191) PRIMARY KEY,
      code VARCHAR(100) NOT NULL UNIQUE COMMENT '\u0423\u043D\u0438\u043A\u0430\u043B\u044C\u043D\u044B\u0439 \u043A\u043E\u0434 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438 (\u043D\u043E\u0440\u043C\u0430\u043B\u0438\u0437\u043E\u0432\u0430\u043D\u043D\u043E\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435)',
      name VARCHAR(255) NOT NULL COMMENT '\u041F\u043E\u043B\u043D\u043E\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438',
      short_name VARCHAR(100) COMMENT '\u041A\u0440\u0430\u0442\u043A\u043E\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435',
      contact_phone VARCHAR(20) COMMENT '\u041A\u043E\u043D\u0442\u0430\u043A\u0442\u043D\u044B\u0439 \u0442\u0435\u043B\u0435\u0444\u043E\u043D',
      contact_email VARCHAR(100) COMMENT '\u041A\u043E\u043D\u0442\u0430\u043A\u0442\u043D\u044B\u0439 email',
      address TEXT COMMENT '\u0410\u0434\u0440\u0435\u0441 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438',
      description TEXT COMMENT '\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438',
      is_active BOOLEAN NOT NULL DEFAULT TRUE COMMENT '\u0410\u043A\u0442\u0438\u0432\u043D\u0430 \u043B\u0438 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F',
      students_count INT NOT NULL DEFAULT 0 COMMENT '\u041A\u044D\u0448\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u043E\u0435 \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0435\u0439',
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
    CREATE TABLE IF NOT EXISTS students (
      id VARCHAR(191) PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      pinfl VARCHAR(14) NOT NULL UNIQUE,
      organization VARCHAR(255) NOT NULL COMMENT '\u0422\u0435\u043A\u0441\u0442\u043E\u0432\u043E\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438 (legacy)',
      organization_id VARCHAR(191) NULL COMMENT '\u0421\u0441\u044B\u043B\u043A\u0430 \u043D\u0430 \u0442\u0430\u0431\u043B\u0438\u0446\u0443 organizations',
      department VARCHAR(255),
      position VARCHAR(255) NOT NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_pinfl (pinfl),
      INDEX idx_full_name (full_name),
      INDEX idx_organization (organization),
      INDEX idx_organization_id (organization_id),
      INDEX idx_position (position),
      FULLTEXT INDEX ft_search (full_name, organization, position),
      
      CONSTRAINT fk_students_organization 
        FOREIGN KEY (organization_id) REFERENCES organizations(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('\u2705 Table "students" created');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS certificates (
      id VARCHAR(191) PRIMARY KEY,
      student_id VARCHAR(191) NOT NULL,
      course_name VARCHAR(255) NOT NULL,
      issue_date DATE NOT NULL,
      certificate_number VARCHAR(100) NOT NULL,
      file_url VARCHAR(500),
      expiry_date DATE,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_student_id (student_id),
      INDEX idx_certificate_number (certificate_number),
      INDEX idx_issue_date (issue_date),
      INDEX idx_expiry_date (expiry_date),
      
      CONSTRAINT fk_certificates_student 
        FOREIGN KEY (student_id) REFERENCES students(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('\u2705 Table "certificates" created');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS instructors (
      id VARCHAR(191) PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255),
      phone VARCHAR(50),
      hire_date DATE COMMENT '\u0414\u0430\u0442\u0430 \u043F\u0440\u0438\u0435\u043C\u0430 \u043D\u0430 \u0440\u0430\u0431\u043E\u0442\u0443',
      contract_info TEXT COMMENT '\u0414\u0430\u043D\u043D\u044B\u0435 \u043E \u0442\u0440\u0443\u0434\u043E\u0432\u043E\u043C \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0435',
      max_hours INT DEFAULT 0 COMMENT '\u041C\u0430\u043A\u0441\u0438\u043C\u0430\u043B\u044C\u043D\u044B\u0435 \u0447\u0430\u0441\u044B \u0434\u043B\u044F \u043E\u0442\u0447\u0435\u0442\u043D\u043E\u0441\u0442\u0438',
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_full_name (full_name),
      INDEX idx_email (email),
      INDEX idx_is_active (is_active),
      FULLTEXT INDEX ft_instructor_search (full_name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('\u2705 Table "instructors" created');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS certificate_templates (
      id VARCHAR(191) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      template_file_url VARCHAR(500),
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_name (name),
      INDEX idx_is_active (is_active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('\u2705 Table "certificate_templates" created');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS courses (
      id VARCHAR(191) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      short_name VARCHAR(10) NOT NULL COMMENT '\u041A\u043E\u0440\u043E\u0442\u043A\u043E\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0438\u0437 4-5 \u0437\u0430\u0433\u043B\u0430\u0432\u043D\u044B\u0445 \u0431\u0443\u043A\u0432',
      code VARCHAR(20) NOT NULL UNIQUE COMMENT '\u041A\u043E\u0434 \u043A\u0443\u0440\u0441\u0430, \u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440 2400001',
      description TEXT,
      total_hours INT NOT NULL DEFAULT 0 COMMENT '\u041E\u0431\u0449\u0435\u0435 \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u0430\u043A\u0430\u0434\u0435\u043C\u0438\u0447\u0435\u0441\u043A\u0438\u0445 \u0447\u0430\u0441\u043E\u0432',
      certificate_template_id VARCHAR(191),
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_name (name),
      INDEX idx_short_name (short_name),
      INDEX idx_code (code),
      INDEX idx_is_active (is_active),
      INDEX idx_certificate_template (certificate_template_id),
      FULLTEXT INDEX ft_course_search (name, short_name, description),
      
      CONSTRAINT fk_courses_certificate_template 
        FOREIGN KEY (certificate_template_id) REFERENCES certificate_templates(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('\u2705 Table "courses" created');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS disciplines (
      id VARCHAR(191) PRIMARY KEY,
      course_id VARCHAR(191) NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      hours INT NOT NULL DEFAULT 0 COMMENT '\u041E\u0431\u0449\u0435\u0435 \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u0430\u043A\u0430\u0434\u0435\u043C\u0438\u0447\u0435\u0441\u043A\u0438\u0445 \u0447\u0430\u0441\u043E\u0432 (\u0430\u0432\u0442\u043E-\u0432\u044B\u0447\u0438\u0441\u043B\u044F\u0435\u043C\u043E\u0435)',
      theory_hours INT NOT NULL DEFAULT 0 COMMENT '\u0427\u0430\u0441\u044B \u0442\u0435\u043E\u0440\u0435\u0442\u0438\u0447\u0435\u0441\u043A\u043E\u0433\u043E \u043E\u0431\u0443\u0447\u0435\u043D\u0438\u044F',
      practice_hours INT NOT NULL DEFAULT 0 COMMENT '\u0427\u0430\u0441\u044B \u043F\u0440\u0430\u043A\u0442\u0438\u0447\u0435\u0441\u043A\u043E\u0433\u043E \u043E\u0431\u0443\u0447\u0435\u043D\u0438\u044F',
      assessment_hours INT NOT NULL DEFAULT 0 COMMENT '\u0427\u0430\u0441\u044B \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0438 \u0437\u043D\u0430\u043D\u0438\u0439',
      order_index INT NOT NULL DEFAULT 0 COMMENT '\u041F\u043E\u0440\u044F\u0434\u043E\u043A \u043E\u0442\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F \u0432 \u043A\u0443\u0440\u0441\u0435',
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_course_id (course_id),
      INDEX idx_name (name),
      INDEX idx_order (order_index),
      
      CONSTRAINT fk_disciplines_course 
        FOREIGN KEY (course_id) REFERENCES courses(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
      
      CONSTRAINT chk_theory_hours_positive CHECK (theory_hours >= 0),
      CONSTRAINT chk_practice_hours_positive CHECK (practice_hours >= 0),
      CONSTRAINT chk_assessment_hours_positive CHECK (assessment_hours >= 0),
      CONSTRAINT chk_total_hours_positive CHECK ((theory_hours + practice_hours + assessment_hours) > 0)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('\u2705 Table "disciplines" created');
  await connection.query(`DROP TRIGGER IF EXISTS disciplines_calculate_hours_insert`);
  await connection.query(`DROP TRIGGER IF EXISTS disciplines_calculate_hours_update`);
  await connection.query(`
    CREATE TRIGGER disciplines_calculate_hours_insert
    BEFORE INSERT ON disciplines
    FOR EACH ROW
    BEGIN
      SET NEW.hours = NEW.theory_hours + NEW.practice_hours + NEW.assessment_hours;
    END
  `);
  await connection.query(`
    CREATE TRIGGER disciplines_calculate_hours_update
    BEFORE UPDATE ON disciplines
    FOR EACH ROW
    BEGIN
      SET NEW.hours = NEW.theory_hours + NEW.practice_hours + NEW.assessment_hours;
    END
  `);
  console.log("\u2705 Triggers for disciplines.hours auto-calculation created");
  await connection.query(`
    CREATE TABLE IF NOT EXISTS discipline_instructors (
      id VARCHAR(191) PRIMARY KEY,
      discipline_id VARCHAR(191) NOT NULL,
      instructor_id VARCHAR(191) NOT NULL,
      is_primary BOOLEAN DEFAULT FALSE COMMENT '\u041E\u0441\u043D\u043E\u0432\u043D\u043E\u0439 \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440 \u0434\u0438\u0441\u0446\u0438\u043F\u043B\u0438\u043D\u044B',
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      
      INDEX idx_discipline_id (discipline_id),
      INDEX idx_instructor_id (instructor_id),
      UNIQUE INDEX idx_discipline_instructor (discipline_id, instructor_id),
      
      CONSTRAINT fk_di_discipline 
        FOREIGN KEY (discipline_id) REFERENCES disciplines(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_di_instructor 
        FOREIGN KEY (instructor_id) REFERENCES instructors(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('\u2705 Table "discipline_instructors" created');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS folders (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      uuid CHAR(36) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      parent_id INT UNSIGNED NULL,
      path VARCHAR(1024) NOT NULL,
      user_id VARCHAR(36) NULL,
      password_hash VARCHAR(255) NULL COMMENT '\u0425\u0435\u0448 \u043F\u0430\u0440\u043E\u043B\u044F \u0434\u043B\u044F \u0437\u0430\u0449\u0438\u0442\u044B \u043F\u0430\u043F\u043A\u0438',
      is_system BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      
      INDEX idx_parent_id (parent_id),
      INDEX idx_path (path(255)),
      INDEX idx_deleted_at (deleted_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('\u2705 Table "folders" created');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS files (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      
      uuid CHAR(36) NOT NULL UNIQUE COMMENT '\u041F\u0443\u0431\u043B\u0438\u0447\u043D\u044B\u0439 UUID \u0434\u043B\u044F \u0434\u043E\u0441\u0442\u0443\u043F\u0430 \u043A \u0444\u0430\u0439\u043B\u0443',
      filename VARCHAR(255) NOT NULL COMMENT '\u041E\u0440\u0438\u0433\u0438\u043D\u0430\u043B\u044C\u043D\u043E\u0435 \u0438\u043C\u044F \u0444\u0430\u0439\u043B\u0430',
      stored_name VARCHAR(255) NOT NULL COMMENT '\u0418\u043C\u044F \u0444\u0430\u0439\u043B\u0430 \u043D\u0430 \u0434\u0438\u0441\u043A\u0435 (\u0441 \u0445\u0435\u0448\u0435\u043C)',
      
      mime_type VARCHAR(100) NOT NULL COMMENT 'MIME \u0442\u0438\u043F \u0444\u0430\u0439\u043B\u0430',
      size_bytes INT UNSIGNED NOT NULL COMMENT '\u0420\u0430\u0437\u043C\u0435\u0440 \u0444\u0430\u0439\u043B\u0430 \u0432 \u0431\u0430\u0439\u0442\u0430\u0445',
      extension VARCHAR(10) NOT NULL COMMENT '\u0420\u0430\u0441\u0448\u0438\u0440\u0435\u043D\u0438\u0435 \u0444\u0430\u0439\u043B\u0430',
      
      storage_path VARCHAR(500) NOT NULL COMMENT '\u041E\u0442\u043D\u043E\u0441\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0439 \u043F\u0443\u0442\u044C \u043A \u0434\u0438\u0440\u0435\u043A\u0442\u043E\u0440\u0438\u0438',
      full_path VARCHAR(1000) NOT NULL COMMENT '\u041F\u043E\u043B\u043D\u044B\u0439 \u043F\u0443\u0442\u044C \u043A \u0444\u0430\u0439\u043B\u0443',
      
      category ENUM(
        'profile',
        'certificate_template',
        'certificate_generated',
        'course_material',
        'course_media',
        'course_cover',
        'group_gallery',
        'group_file',
        'assignment',
        'other'
      ) NOT NULL COMMENT '\u041A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F \u0444\u0430\u0439\u043B\u0430',
      
      folder_id INT UNSIGNED NULL COMMENT '\u0421\u0441\u044B\u043B\u043A\u0430 \u043D\u0430 \u043F\u0430\u043F\u043A\u0443',
      
      user_id VARCHAR(36) NULL COMMENT 'UUID \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F',
      course_id INT UNSIGNED NULL COMMENT '\u0421\u0432\u044F\u0437\u044C \u0441 \u043A\u0443\u0440\u0441\u043E\u043C',
      group_id INT UNSIGNED NULL COMMENT '\u0421\u0432\u044F\u0437\u044C \u0441 \u0433\u0440\u0443\u043F\u043F\u043E\u0439',
      assignment_id INT UNSIGNED NULL COMMENT '\u0421\u0432\u044F\u0437\u044C \u0441 \u0437\u0430\u0434\u0430\u043D\u0438\u0435\u043C',
      
      metadata JSON NULL COMMENT '\u0414\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0435 \u043C\u0435\u0442\u0430\u0434\u0430\u043D\u043D\u044B\u0435',
      
      is_public BOOLEAN DEFAULT FALSE COMMENT '\u041F\u0443\u0431\u043B\u0438\u0447\u043D\u044B\u0439 \u0434\u043E\u0441\u0442\u0443\u043F',
      access_level ENUM('public', 'authenticated', 'owner', 'admin') DEFAULT 'authenticated',
      
      uploaded_by VARCHAR(36) NOT NULL COMMENT 'UUID \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F \u043A\u0442\u043E \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u043B',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      deleted_at TIMESTAMP NULL,
      
      INDEX idx_uuid (uuid),
      INDEX idx_category (category),
      INDEX idx_folder_id (folder_id),
      INDEX idx_user_id (user_id),
      INDEX idx_course_id (course_id),
      INDEX idx_group_id (group_id),
      INDEX idx_uploaded_by (uploaded_by),
      INDEX idx_deleted_at (deleted_at),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('\u2705 Table "files" created');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(191) NOT NULL COMMENT 'ID \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F, \u0432\u044B\u043F\u043E\u043B\u043D\u0438\u0432\u0448\u0435\u0433\u043E \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435',
      
      action_type ENUM(
        'CREATE',
        'UPDATE',
        'DELETE',
        'LOGIN',
        'LOGOUT',
        'IMPORT',
        'EXPORT'
      ) NOT NULL COMMENT '\u0422\u0438\u043F \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F',
      
      entity_type ENUM(
        'USER',
        'STUDENT',
        'CERTIFICATE',
        'COURSE',
        'DISCIPLINE',
        'INSTRUCTOR',
        'FILE',
        'FOLDER',
        'SYSTEM'
      ) NOT NULL COMMENT '\u0422\u0438\u043F \u0441\u0443\u0449\u043D\u043E\u0441\u0442\u0438',
      
      entity_id VARCHAR(191) NULL COMMENT 'ID \u0441\u0443\u0449\u043D\u043E\u0441\u0442\u0438, \u043D\u0430\u0434 \u043A\u043E\u0442\u043E\u0440\u043E\u0439 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u043E \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435',
      entity_name VARCHAR(255) NULL COMMENT '\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0441\u0443\u0449\u043D\u043E\u0441\u0442\u0438 \u0434\u043B\u044F \u043E\u0442\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F',
      
      details JSON NULL COMMENT '\u0414\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435 \u043E \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0438',
      
      ip_address VARCHAR(45) NULL COMMENT 'IP \u0430\u0434\u0440\u0435\u0441 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F',
      user_agent TEXT NULL COMMENT 'User Agent \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0430',
      
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '\u0414\u0430\u0442\u0430 \u0438 \u0432\u0440\u0435\u043C\u044F \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F',
      
      INDEX idx_user_id (user_id),
      INDEX idx_action_type (action_type),
      INDEX idx_entity_type (entity_type),
      INDEX idx_entity_id (entity_id),
      INDEX idx_created_at (created_at),
      INDEX idx_user_created (user_id, created_at DESC)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('\u2705 Table "activity_logs" created');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS study_groups (
      id VARCHAR(191) PRIMARY KEY,
      code VARCHAR(50) NOT NULL UNIQUE COMMENT '\u0423\u043D\u0438\u043A\u0430\u043B\u044C\u043D\u044B\u0439 \u043A\u043E\u0434 \u0433\u0440\u0443\u043F\u043F\u044B, \u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440 \u0410\u041F\u0410\u041A-20',
      course_id VARCHAR(191) NOT NULL COMMENT 'ID \u0443\u0447\u0435\u0431\u043D\u043E\u0439 \u043F\u0440\u043E\u0433\u0440\u0430\u043C\u043C\u044B',
      start_date DATE NOT NULL COMMENT '\u0414\u0430\u0442\u0430 \u043D\u0430\u0447\u0430\u043B\u0430 \u043E\u0431\u0443\u0447\u0435\u043D\u0438\u044F',
      end_date DATE NOT NULL COMMENT '\u0414\u0430\u0442\u0430 \u043E\u043A\u043E\u043D\u0447\u0430\u043D\u0438\u044F \u043E\u0431\u0443\u0447\u0435\u043D\u0438\u044F',
      classroom VARCHAR(100) COMMENT '\u0410\u0443\u0434\u0438\u0442\u043E\u0440\u0438\u044F',
      description TEXT COMMENT '\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u0433\u0440\u0443\u043F\u043F\u044B',
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_code (code),
      INDEX idx_course_id (course_id),
      INDEX idx_start_date (start_date),
      INDEX idx_end_date (end_date),
      INDEX idx_is_active (is_active),
      INDEX idx_dates (start_date, end_date),
      
      CONSTRAINT fk_study_groups_course 
        FOREIGN KEY (course_id) REFERENCES courses(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
        
      CONSTRAINT chk_dates CHECK (end_date >= start_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('\u2705 Table "study_groups" created');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS study_group_students (
      id VARCHAR(191) PRIMARY KEY,
      group_id VARCHAR(191) NOT NULL COMMENT 'ID \u0443\u0447\u0435\u0431\u043D\u043E\u0439 \u0433\u0440\u0443\u043F\u043F\u044B',
      student_id VARCHAR(191) NOT NULL COMMENT 'ID \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u044F',
      enrolled_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) COMMENT '\u0414\u0430\u0442\u0430 \u0437\u0430\u0447\u0438\u0441\u043B\u0435\u043D\u0438\u044F \u0432 \u0433\u0440\u0443\u043F\u043F\u0443',
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      
      INDEX idx_group_id (group_id),
      INDEX idx_student_id (student_id),
      UNIQUE INDEX idx_group_student (group_id, student_id),
      
      CONSTRAINT fk_sgs_group 
        FOREIGN KEY (group_id) REFERENCES study_groups(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_sgs_student 
        FOREIGN KEY (student_id) REFERENCES students(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('\u2705 Table "study_group_students" created');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS classrooms (
      id VARCHAR(191) PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE COMMENT '\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0430\u0443\u0434\u0438\u0442\u043E\u0440\u0438\u0438, \u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440 "101" \u0438\u043B\u0438 "\u041A\u043E\u043D\u0444\u0435\u0440\u0435\u043D\u0446-\u0437\u0430\u043B"',
      capacity INT DEFAULT 0 COMMENT '\u0412\u043C\u0435\u0441\u0442\u0438\u043C\u043E\u0441\u0442\u044C \u0430\u0443\u0434\u0438\u0442\u043E\u0440\u0438\u0438',
      description TEXT COMMENT '\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u0430\u0443\u0434\u0438\u0442\u043E\u0440\u0438\u0438',
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_name (name),
      INDEX idx_is_active (is_active)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('\u2705 Table "classrooms" created');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schedule_events (
      id VARCHAR(191) PRIMARY KEY,
      title VARCHAR(255) NOT NULL COMMENT '\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0437\u0430\u043D\u044F\u0442\u0438\u044F',
      description TEXT COMMENT '\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u0437\u0430\u043D\u044F\u0442\u0438\u044F',
      group_id VARCHAR(191) COMMENT 'ID \u0443\u0447\u0435\u0431\u043D\u043E\u0439 \u0433\u0440\u0443\u043F\u043F\u044B',
      discipline_id VARCHAR(191) COMMENT 'ID \u0434\u0438\u0441\u0446\u0438\u043F\u043B\u0438\u043D\u044B (\u043E\u043F\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E)',
      instructor_id VARCHAR(191) COMMENT 'ID \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440\u0430',
      classroom_id VARCHAR(191) COMMENT 'ID \u0430\u0443\u0434\u0438\u0442\u043E\u0440\u0438\u0438',
      start_time DATETIME NOT NULL COMMENT '\u0414\u0430\u0442\u0430 \u0438 \u0432\u0440\u0435\u043C\u044F \u043D\u0430\u0447\u0430\u043B\u0430',
      end_time DATETIME NOT NULL COMMENT '\u0414\u0430\u0442\u0430 \u0438 \u0432\u0440\u0435\u043C\u044F \u043E\u043A\u043E\u043D\u0447\u0430\u043D\u0438\u044F',
      is_all_day BOOLEAN DEFAULT FALSE COMMENT '\u0421\u043E\u0431\u044B\u0442\u0438\u0435 \u043D\u0430 \u0432\u0435\u0441\u044C \u0434\u0435\u043D\u044C',
      color VARCHAR(20) DEFAULT 'primary' COMMENT '\u0426\u0432\u0435\u0442 \u0441\u043E\u0431\u044B\u0442\u0438\u044F: primary, success, warning, danger',
      event_type ENUM('theory', 'practice', 'assessment', 'other') DEFAULT 'theory' 
        COMMENT '\u0422\u0438\u043F \u0437\u0430\u043D\u044F\u0442\u0438\u044F: theory (\u0442\u0435\u043E\u0440\u0438\u044F), practice (\u043F\u0440\u0430\u043A\u0442\u0438\u043A\u0430), assessment (\u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u0437\u043D\u0430\u043D\u0438\u0439), other (\u0434\u0440\u0443\u0433\u043E\u0435)',
      is_recurring BOOLEAN DEFAULT FALSE COMMENT '\u041F\u043E\u0432\u0442\u043E\u0440\u044F\u044E\u0449\u0435\u0435\u0441\u044F \u0441\u043E\u0431\u044B\u0442\u0438\u0435',
      recurrence_rule TEXT COMMENT '\u041F\u0440\u0430\u0432\u0438\u043B\u043E \u043F\u043E\u0432\u0442\u043E\u0440\u0435\u043D\u0438\u044F (iCal RRULE)',
      notes TEXT COMMENT '\u0414\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0435 \u0437\u0430\u043C\u0435\u0442\u043A\u0438',
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_group_id (group_id),
      INDEX idx_discipline_id (discipline_id),
      INDEX idx_instructor_id (instructor_id),
      INDEX idx_classroom_id (classroom_id),
      INDEX idx_start_time (start_time),
      INDEX idx_end_time (end_time),
      INDEX idx_date_range (start_time, end_time),
      INDEX idx_event_type (event_type),
      
      CONSTRAINT fk_schedule_group 
        FOREIGN KEY (group_id) REFERENCES study_groups(id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_schedule_discipline 
        FOREIGN KEY (discipline_id) REFERENCES disciplines(id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_schedule_instructor 
        FOREIGN KEY (instructor_id) REFERENCES instructors(id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_schedule_classroom 
        FOREIGN KEY (classroom_id) REFERENCES classrooms(id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
        
      CONSTRAINT chk_schedule_dates CHECK (end_time > start_time)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('\u2705 Table "schedule_events" created');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS schedule_periods (
      id INT PRIMARY KEY AUTO_INCREMENT,
      period_number INT NOT NULL COMMENT '\u041D\u043E\u043C\u0435\u0440 \u043F\u0430\u0440\u044B (1-12)',
      start_time VARCHAR(5) NOT NULL COMMENT '\u0412\u0440\u0435\u043C\u044F \u043D\u0430\u0447\u0430\u043B\u0430 (HH:MM)',
      end_time VARCHAR(5) NOT NULL COMMENT '\u0412\u0440\u0435\u043C\u044F \u043E\u043A\u043E\u043D\u0447\u0430\u043D\u0438\u044F (HH:MM)',
      is_after_break BOOLEAN DEFAULT FALSE COMMENT '\u0421\u043B\u0435\u0434\u0443\u0435\u0442 \u043B\u0438 \u043F\u043E\u0441\u043B\u0435 \u0431\u043E\u043B\u044C\u0448\u043E\u0433\u043E \u043F\u0435\u0440\u0435\u0440\u044B\u0432\u0430',
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
    CREATE TABLE IF NOT EXISTS organization_representatives (
      id VARCHAR(191) PRIMARY KEY,
      organization_id VARCHAR(191) NOT NULL COMMENT '\u0421\u0441\u044B\u043B\u043A\u0430 \u043D\u0430 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044E',
      full_name VARCHAR(255) NOT NULL COMMENT '\u0424\u0418\u041E \u043F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u0438\u0442\u0435\u043B\u044F',
      phone VARCHAR(20) NOT NULL COMMENT '\u041D\u043E\u043C\u0435\u0440 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0430',
      telegram_chat_id BIGINT UNIQUE COMMENT 'Telegram Chat ID',
      telegram_username VARCHAR(100) COMMENT 'Username \u0432 Telegram',
      status ENUM('pending', 'approved', 'blocked') NOT NULL DEFAULT 'pending' COMMENT '\u0421\u0442\u0430\u0442\u0443\u0441 \u0434\u043E\u0441\u0442\u0443\u043F\u0430',
      access_groups JSON COMMENT 'JSON \u043C\u0430\u0441\u0441\u0438\u0432 ID \u0433\u0440\u0443\u043F\u043F \u0434\u043B\u044F \u0434\u043E\u0441\u0442\u0443\u043F\u0430 (null = \u0432\u0441\u0435 \u0433\u0440\u0443\u043F\u043F\u044B \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438)',
      notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE COMMENT '\u041F\u043E\u043B\u0443\u0447\u0430\u0442\u044C \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F',
      last_activity_at DATETIME(3) COMMENT '\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u044F\u044F \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0441\u0442\u044C \u0432 \u0431\u043E\u0442\u0435',
      approved_by VARCHAR(191) COMMENT '\u041A\u0442\u043E \u043E\u0434\u043E\u0431\u0440\u0438\u043B \u0437\u0430\u044F\u0432\u043A\u0443',
      approved_at DATETIME(3) COMMENT '\u041A\u043E\u0433\u0434\u0430 \u043E\u0434\u043E\u0431\u0440\u0438\u043B\u0438',
      blocked_reason TEXT COMMENT '\u041F\u0440\u0438\u0447\u0438\u043D\u0430 \u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u043A\u0438',
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_organization_id (organization_id),
      INDEX idx_telegram_chat_id (telegram_chat_id),
      INDEX idx_status (status),
      INDEX idx_phone (phone),
      FULLTEXT INDEX ft_search (full_name, phone),
      
      CONSTRAINT fk_representatives_organization 
        FOREIGN KEY (organization_id) REFERENCES organizations(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_representatives_approved_by 
        FOREIGN KEY (approved_by) REFERENCES users(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('\u2705 Table "organization_representatives" created');
  await connection.query(`
    CREATE TABLE IF NOT EXISTS telegram_bot_sessions (
      id VARCHAR(191) PRIMARY KEY,
      chat_id BIGINT NOT NULL UNIQUE COMMENT 'Telegram Chat ID',
      state VARCHAR(50) NOT NULL DEFAULT 'idle' COMMENT '\u0422\u0435\u043A\u0443\u0449\u0435\u0435 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435 FSM',
      data JSON COMMENT '\u0414\u0430\u043D\u043D\u044B\u0435 \u0441\u0435\u0441\u0441\u0438\u0438 (\u0432\u0440\u0435\u043C\u0435\u043D\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438 \u0438 \u0442.\u0434.)',
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_chat_id (chat_id),
      INDEX idx_state (state)
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
    console.log("\u2705 Default admin user created (admin@atc.uz / admin123)");
  } else {
    console.log("\u2139\uFE0F  Admin user already exists");
  }
  const [existingTemplates] = await connection.query(
    "SELECT COUNT(*) as count FROM certificate_templates"
  );
  if (existingTemplates[0].count === 0) {
    const templates = [
      { id: randomUUID(), name: "\u0421\u0442\u0430\u043D\u0434\u0430\u0440\u0442\u043D\u044B\u0439 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442", description: "\u0411\u0430\u0437\u043E\u0432\u044B\u0439 \u0448\u0430\u0431\u043B\u043E\u043D \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430 \u043E \u043F\u0440\u043E\u0445\u043E\u0436\u0434\u0435\u043D\u0438\u0438 \u043A\u0443\u0440\u0441\u0430" },
      { id: randomUUID(), name: "\u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 \u0441 \u043E\u0442\u043B\u0438\u0447\u0438\u0435\u043C", description: "\u0428\u0430\u0431\u043B\u043E\u043D \u0434\u043B\u044F \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u043E\u0432, \u043E\u043A\u043E\u043D\u0447\u0438\u0432\u0448\u0438\u0445 \u043A\u0443\u0440\u0441 \u0441 \u043E\u0442\u043B\u0438\u0447\u0438\u0435\u043C" },
      { id: randomUUID(), name: "\u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 \u043F\u043E\u0432\u044B\u0448\u0435\u043D\u0438\u044F \u043A\u0432\u0430\u043B\u0438\u0444\u0438\u043A\u0430\u0446\u0438\u0438", description: "\u041E\u0444\u0438\u0446\u0438\u0430\u043B\u044C\u043D\u044B\u0439 \u0448\u0430\u0431\u043B\u043E\u043D \u0434\u043B\u044F \u043A\u0443\u0440\u0441\u043E\u0432 \u043F\u043E\u0432\u044B\u0448\u0435\u043D\u0438\u044F \u043A\u0432\u0430\u043B\u0438\u0444\u0438\u043A\u0430\u0446\u0438\u0438" }
    ];
    for (const template of templates) {
      await connection.query(
        `INSERT INTO certificate_templates (id, name, description) VALUES (?, ?, ?)`,
        [template.id, template.name, template.description]
      );
    }
    console.log("\u2705 Certificate templates created");
  }
  const [existingFolders] = await connection.query(
    "SELECT COUNT(*) as count FROM folders WHERE is_system = TRUE"
  );
  if (existingFolders[0].count === 0) {
    const systemFolders = [
      { name: "\u041A\u0443\u0440\u0441\u044B", path: "/\u041A\u0443\u0440\u0441\u044B" },
      { name: "\u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u044B", path: "/\u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u044B" },
      { name: "\u041F\u0440\u043E\u0444\u0438\u043B\u0438", path: "/\u041F\u0440\u043E\u0444\u0438\u043B\u0438" },
      { name: "\u0413\u0440\u0443\u043F\u043F\u044B", path: "/\u0413\u0440\u0443\u043F\u043F\u044B" },
      { name: "\u041F\u0440\u043E\u0447\u0435\u0435", path: "/\u041F\u0440\u043E\u0447\u0435\u0435" }
    ];
    for (const folder of systemFolders) {
      await connection.query(
        `INSERT INTO folders (uuid, name, parent_id, path, is_system) VALUES (?, ?, NULL, ?, TRUE)`,
        [randomUUID(), folder.name, folder.path]
      );
    }
    console.log("\u2705 System folders created");
  }
  const [existingClassrooms] = await connection.query(
    "SELECT COUNT(*) as count FROM classrooms"
  );
  if (existingClassrooms[0].count === 0) {
    const classrooms = [
      { id: randomUUID(), name: "101", capacity: 30, description: "\u0423\u0447\u0435\u0431\u043D\u0430\u044F \u0430\u0443\u0434\u0438\u0442\u043E\u0440\u0438\u044F" },
      { id: randomUUID(), name: "102", capacity: 25, description: "\u0423\u0447\u0435\u0431\u043D\u0430\u044F \u0430\u0443\u0434\u0438\u0442\u043E\u0440\u0438\u044F" },
      { id: randomUUID(), name: "201", capacity: 40, description: "\u041B\u0435\u043A\u0446\u0438\u043E\u043D\u043D\u044B\u0439 \u0437\u0430\u043B" },
      { id: randomUUID(), name: "202", capacity: 20, description: "\u041A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u043D\u044B\u0439 \u043A\u043B\u0430\u0441\u0441" },
      { id: randomUUID(), name: "\u041A\u043E\u043D\u0444\u0435\u0440\u0435\u043D\u0446-\u0437\u0430\u043B", capacity: 100, description: "\u0411\u043E\u043B\u044C\u0448\u043E\u0439 \u043A\u043E\u043D\u0444\u0435\u0440\u0435\u043D\u0446-\u0437\u0430\u043B" }
    ];
    for (const classroom of classrooms) {
      await connection.query(
        `INSERT INTO classrooms (id, name, capacity, description) VALUES (?, ?, ?, ?)`,
        [classroom.id, classroom.name, classroom.capacity, classroom.description]
      );
    }
    console.log("\u2705 Classrooms created");
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
      (5, '12:00', '12:40', FALSE),
      (6, '12:40', '13:20', FALSE),
      (7, '14:00', '14:40', TRUE),
      (8, '14:40', '15:20', FALSE),
      (9, '15:30', '16:10', FALSE),
      (10, '16:10', '16:50', FALSE),
      (11, '17:00', '17:40', FALSE),
      (12, '17:40', '18:20', FALSE)
    `);
    console.log("\u2705 Schedule periods created");
  }
  const [existingSettings] = await connection.query(
    "SELECT COUNT(*) as count FROM schedule_settings"
  );
  if (existingSettings[0].count === 0) {
    await connection.query(`
      INSERT INTO schedule_settings (setting_key, setting_value, description) VALUES
      ('lunch_break_start', '13:20', '\u041D\u0430\u0447\u0430\u043B\u043E \u0431\u043E\u043B\u044C\u0448\u043E\u0433\u043E \u043F\u0435\u0440\u0435\u0440\u044B\u0432\u0430'),
      ('lunch_break_end', '14:00', '\u041A\u043E\u043D\u0435\u0446 \u0431\u043E\u043B\u044C\u0448\u043E\u0433\u043E \u043F\u0435\u0440\u0435\u0440\u044B\u0432\u0430'),
      ('period_duration_minutes', '40', '\u0414\u043B\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C \u043E\u0434\u043D\u043E\u0433\u043E \u0430\u043A\u0430\u0434\u0435\u043C\u0438\u0447\u0435\u0441\u043A\u043E\u0433\u043E \u0447\u0430\u0441\u0430 \u0432 \u043C\u0438\u043D\u0443\u0442\u0430\u0445'),
      ('short_break_minutes', '10', '\u0414\u043B\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C \u043A\u043E\u0440\u043E\u0442\u043A\u043E\u0433\u043E \u043F\u0435\u0440\u0435\u0440\u044B\u0432\u0430 \u0432 \u043C\u0438\u043D\u0443\u0442\u0430\u0445'),
      ('snap_to_periods', 'true', '\u041F\u0440\u0438\u0432\u044F\u0437\u043A\u0430 \u0441\u043E\u0431\u044B\u0442\u0438\u0439 \u043A \u0430\u043A\u0430\u0434\u0435\u043C\u0438\u0447\u0435\u0441\u043A\u0438\u043C \u0447\u0430\u0441\u0430\u043C'),
      ('show_period_numbers', 'true', '\u041F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u043D\u043E\u043C\u0435\u0440\u0430 \u043F\u0430\u0440 \u0432 \u043A\u0430\u043B\u0435\u043D\u0434\u0430\u0440\u0435')
    `);
    console.log("\u2705 Schedule settings created");
  }
  console.log("");
  console.log("\u{1F389} Consolidated migration completed successfully!");
  console.log("\u{1F4CA} Created 20 tables with all indexes, constraints, and seed data");
};
const down$f = async (connection) => {
  console.log("\u{1F504} Rolling back consolidated migration...");
  await connection.query(`DROP TRIGGER IF EXISTS disciplines_calculate_hours_insert`);
  await connection.query(`DROP TRIGGER IF EXISTS disciplines_calculate_hours_update`);
  const tables = [
    "telegram_bot_sessions",
    "organization_representatives",
    "schedule_settings",
    "schedule_periods",
    "schedule_events",
    "classrooms",
    "study_group_students",
    "study_groups",
    "activity_logs",
    "files",
    "folders",
    "discipline_instructors",
    "disciplines",
    "courses",
    "certificate_templates",
    "instructors",
    "certificates",
    "students",
    "organizations",
    "users"
  ];
  for (const table of tables) {
    await connection.query(`DROP TABLE IF EXISTS ${table}`);
    console.log(`\u2705 Table "${table}" dropped`);
  }
  console.log("\u{1F389} Rollback completed");
};

const description$b = "\u0421\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u0442\u0430\u0431\u043B\u0438\u0446 \u0434\u043B\u044F \u0441\u0438\u0441\u0442\u0435\u043C\u044B \u043F\u043E\u0441\u0435\u0449\u0430\u0435\u043C\u043E\u0441\u0442\u0438 \u0438 \u043E\u0446\u0435\u043D\u043E\u043A";
async function up$e(connection) {
  console.log("  Creating attendance table...");
  await connection.query(`
    CREATE TABLE IF NOT EXISTS attendance (
      id VARCHAR(191) PRIMARY KEY,
      student_id VARCHAR(191) NOT NULL COMMENT 'ID \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u044F',
      schedule_event_id VARCHAR(191) NOT NULL COMMENT 'ID \u0437\u0430\u043D\u044F\u0442\u0438\u044F \u0438\u0437 \u0440\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u044F',
      hours_attended DECIMAL(3,1) NOT NULL DEFAULT 0 COMMENT '\u041F\u043E\u0441\u0435\u0449\u0451\u043D\u043D\u044B\u0435 \u0430\u043A\u0430\u0434\u0435\u043C\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u0447\u0430\u0441\u044B',
      max_hours DECIMAL(3,1) NOT NULL COMMENT '\u041C\u0430\u043A\u0441\u0438\u043C\u0430\u043B\u044C\u043D\u044B\u0435 \u0447\u0430\u0441\u044B \u0437\u0430\u043D\u044F\u0442\u0438\u044F (\u0434\u043B\u044F \u0440\u0430\u0441\u0447\u0451\u0442\u0430 %)',
      notes TEXT COMMENT '\u041F\u0440\u0438\u043C\u0435\u0447\u0430\u043D\u0438\u044F (\u043F\u0440\u0438\u0447\u0438\u043D\u0430 \u043E\u0442\u0441\u0443\u0442\u0441\u0442\u0432\u0438\u044F \u0438 \u0442.\u0434.)',
      marked_by VARCHAR(191) COMMENT '\u041A\u0442\u043E \u043E\u0442\u043C\u0435\u0442\u0438\u043B',
      marked_at DATETIME(3) COMMENT '\u041A\u043E\u0433\u0434\u0430 \u043E\u0442\u043C\u0435\u0442\u0438\u043B',
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      UNIQUE INDEX idx_attendance_student_event (student_id, schedule_event_id),
      INDEX idx_attendance_schedule_event_id (schedule_event_id),
      INDEX idx_attendance_marked_by (marked_by),
      
      CONSTRAINT fk_attendance_student 
        FOREIGN KEY (student_id) REFERENCES students(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_attendance_event 
        FOREIGN KEY (schedule_event_id) REFERENCES schedule_events(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_attendance_marked_by 
        FOREIGN KEY (marked_by) REFERENCES users(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("  Creating grades table...");
  await connection.query(`
    CREATE TABLE IF NOT EXISTS grades (
      id VARCHAR(191) PRIMARY KEY,
      student_id VARCHAR(191) NOT NULL COMMENT 'ID \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u044F',
      schedule_event_id VARCHAR(191) NOT NULL COMMENT 'ID \u0437\u0430\u043D\u044F\u0442\u0438\u044F (assessment)',
      grade INT NOT NULL COMMENT '\u041E\u0446\u0435\u043D\u043A\u0430 (0-100)',
      notes TEXT COMMENT '\u041A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0439 \u043A \u043E\u0446\u0435\u043D\u043A\u0435',
      graded_by VARCHAR(191) COMMENT '\u041A\u0442\u043E \u0432\u044B\u0441\u0442\u0430\u0432\u0438\u043B \u043E\u0446\u0435\u043D\u043A\u0443',
      graded_at DATETIME(3) COMMENT '\u041A\u043E\u0433\u0434\u0430 \u0432\u044B\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u0430',
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      UNIQUE INDEX idx_grades_student_event (student_id, schedule_event_id),
      INDEX idx_grades_schedule_event_id (schedule_event_id),
      INDEX idx_grades_graded_by (graded_by),
      INDEX idx_grades_grade (grade),
      
      CONSTRAINT fk_grades_student 
        FOREIGN KEY (student_id) REFERENCES students(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_grades_event 
        FOREIGN KEY (schedule_event_id) REFERENCES schedule_events(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_grades_graded_by 
        FOREIGN KEY (graded_by) REFERENCES users(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("  Creating final_grades table...");
  await connection.query(`
    CREATE TABLE IF NOT EXISTS final_grades (
      id VARCHAR(191) PRIMARY KEY,
      student_id VARCHAR(191) NOT NULL COMMENT 'ID \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u044F',
      group_id VARCHAR(191) NOT NULL COMMENT 'ID \u0433\u0440\u0443\u043F\u043F\u044B',
      discipline_id VARCHAR(191) NOT NULL COMMENT 'ID \u0434\u0438\u0441\u0446\u0438\u043F\u043B\u0438\u043D\u044B',
      final_grade INT COMMENT '\u0418\u0442\u043E\u0433\u043E\u0432\u0430\u044F \u043E\u0446\u0435\u043D\u043A\u0430 (0-100)',
      attendance_percent DECIMAL(5,2) COMMENT '\u041F\u0440\u043E\u0446\u0435\u043D\u0442 \u043F\u043E\u0441\u0435\u0449\u0430\u0435\u043C\u043E\u0441\u0442\u0438',
      status ENUM('in_progress', 'passed', 'failed', 'not_allowed') NOT NULL DEFAULT 'in_progress' 
        COMMENT '\u0421\u0442\u0430\u0442\u0443\u0441: \u0432 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u0435, \u0441\u0434\u0430\u043B, \u043D\u0435 \u0441\u0434\u0430\u043B, \u043D\u0435 \u0434\u043E\u043F\u0443\u0449\u0435\u043D',
      notes TEXT COMMENT '\u041F\u0440\u0438\u043C\u0435\u0447\u0430\u043D\u0438\u044F',
      graded_by VARCHAR(191) COMMENT '\u041A\u0442\u043E \u0432\u044B\u0441\u0442\u0430\u0432\u0438\u043B \u0438\u0442\u043E\u0433\u043E\u0432\u0443\u044E \u043E\u0446\u0435\u043D\u043A\u0443',
      graded_at DATETIME(3) COMMENT '\u041A\u043E\u0433\u0434\u0430 \u0432\u044B\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u0430',
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      UNIQUE INDEX idx_final_grades_student_group_discipline (student_id, group_id, discipline_id),
      INDEX idx_final_grades_group_discipline (group_id, discipline_id),
      INDEX idx_final_grades_status (status),
      INDEX idx_final_grades_graded_by (graded_by),
      
      CONSTRAINT fk_final_grades_student 
        FOREIGN KEY (student_id) REFERENCES students(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_final_grades_group 
        FOREIGN KEY (group_id) REFERENCES study_groups(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_final_grades_discipline 
        FOREIGN KEY (discipline_id) REFERENCES disciplines(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_final_grades_graded_by 
        FOREIGN KEY (graded_by) REFERENCES users(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("  Updating activity_logs entity_type enum...");
  try {
    await connection.query(`
      ALTER TABLE activity_logs 
      MODIFY COLUMN entity_type ENUM(
        'USER', 'STUDENT', 'CERTIFICATE', 'COURSE', 'DISCIPLINE', 
        'INSTRUCTOR', 'FILE', 'FOLDER', 'SYSTEM', 'GROUP', 
        'SCHEDULE', 'ATTENDANCE', 'GRADE', 'ORGANIZATION', 'REPRESENTATIVE'
      ) NOT NULL
    `);
  } catch (error) {
    if (!error.message?.includes("Duplicate")) {
      console.log("  Note: activity_logs entity_type enum may already be updated");
    }
  }
  console.log("  \u2705 Attendance and grades tables created");
}
async function down$e(connection) {
  console.log("  Dropping attendance and grades tables...");
  await connection.query("DROP TABLE IF EXISTS final_grades");
  await connection.query("DROP TABLE IF EXISTS grades");
  await connection.query("DROP TABLE IF EXISTS attendance");
  console.log("  \u2705 Tables dropped");
}

const up$d = async (connection) => {
  console.log("\u{1F504} Running migration: certificate_templates_extended");
  await connection.query(`
    ALTER TABLE certificate_templates 
    ADD COLUMN IF NOT EXISTS original_file_url VARCHAR(500) COMMENT '\u041F\u0443\u0442\u044C \u043A \u043E\u0440\u0438\u0433\u0438\u043D\u0430\u043B\u044C\u043D\u043E\u043C\u0443 DOCX \u0444\u0430\u0439\u043B\u0443',
    ADD COLUMN IF NOT EXISTS variables JSON COMMENT '\u041C\u0430\u043F\u043F\u0438\u043D\u0433 \u043F\u0435\u0440\u0435\u043C\u0435\u043D\u043D\u044B\u0445 \u0448\u0430\u0431\u043B\u043E\u043D\u0430',
    ADD COLUMN IF NOT EXISTS qr_settings JSON COMMENT '\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 QR-\u043A\u043E\u0434\u0430 (\u043F\u043E\u0437\u0438\u0446\u0438\u044F, \u0440\u0430\u0437\u043C\u0435\u0440)',
    ADD COLUMN IF NOT EXISTS number_format VARCHAR(100) DEFAULT 'ATC{YY}_{CODE}_{NUM}' COMMENT '\u0424\u043E\u0440\u043C\u0430\u0442 \u043D\u043E\u043C\u0435\u0440\u0430 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430',
    ADD COLUMN IF NOT EXISTS last_number INT DEFAULT 0 COMMENT '\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0439 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u043D\u044B\u0439 \u043D\u043E\u043C\u0435\u0440 \u0434\u043B\u044F \u0438\u043D\u043A\u0440\u0435\u043C\u0435\u043D\u0442\u0430'
  `);
  await connection.query(`
    CREATE TABLE IF NOT EXISTS issued_certificates (
      id VARCHAR(191) PRIMARY KEY,
      group_id VARCHAR(191) NOT NULL,
      student_id VARCHAR(191) NOT NULL,
      template_id VARCHAR(191) NOT NULL,
      certificate_number VARCHAR(100) NOT NULL UNIQUE,
      issue_date DATE NOT NULL,
      
      -- \u0424\u0430\u0439\u043B\u044B
      docx_file_url VARCHAR(500) COMMENT '\u041F\u0443\u0442\u044C \u043A \u0441\u0433\u0435\u043D\u0435\u0440\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u043E\u043C\u0443 DOCX',
      pdf_file_url VARCHAR(500) COMMENT '\u041F\u0443\u0442\u044C \u043A \u0441\u0433\u0435\u043D\u0435\u0440\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u043E\u043C\u0443 PDF',
      
      -- \u0421\u0442\u0430\u0442\u0443\u0441 \u0438 \u0434\u0430\u043D\u043D\u044B\u0435
      status ENUM('draft', 'issued', 'revoked') DEFAULT 'draft',
      variables_data JSON COMMENT '\u0414\u0430\u043D\u043D\u044B\u0435, \u043F\u043E\u0434\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u043D\u044B\u0435 \u0432 \u0448\u0430\u0431\u043B\u043E\u043D',
      
      -- \u041F\u0440\u0435\u0434\u0443\u043F\u0440\u0435\u0436\u0434\u0435\u043D\u0438\u044F \u043F\u0440\u0438 \u0432\u044B\u0434\u0430\u0447\u0435
      warnings JSON COMMENT '\u041F\u0440\u0435\u0434\u0443\u043F\u0440\u0435\u0436\u0434\u0435\u043D\u0438\u044F \u043F\u0440\u0438 \u0432\u044B\u0434\u0430\u0447\u0435 (\u043D\u0438\u0437\u043A\u0430\u044F \u043F\u043E\u0441\u0435\u0449\u0430\u0435\u043C\u043E\u0441\u0442\u044C \u0438 \u0442.\u0434.)',
      override_warnings BOOLEAN DEFAULT FALSE COMMENT '\u0411\u044B\u043B\u0438 \u043B\u0438 \u043F\u0440\u043E\u0438\u0433\u043D\u043E\u0440\u0438\u0440\u043E\u0432\u0430\u043D\u044B \u043F\u0440\u0435\u0434\u0443\u043F\u0440\u0435\u0436\u0434\u0435\u043D\u0438\u044F',
      
      -- \u0410\u0443\u0434\u0438\u0442
      issued_by VARCHAR(191) COMMENT 'ID \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F, \u0432\u044B\u0434\u0430\u0432\u0448\u0435\u0433\u043E \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442',
      issued_at DATETIME(3) COMMENT '\u0414\u0430\u0442\u0430 \u0438 \u0432\u0440\u0435\u043C\u044F \u0432\u044B\u0434\u0430\u0447\u0438',
      revoked_by VARCHAR(191) COMMENT 'ID \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F, \u043E\u0442\u043E\u0437\u0432\u0430\u0432\u0448\u0435\u0433\u043E \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442',
      revoked_at DATETIME(3) COMMENT '\u0414\u0430\u0442\u0430 \u0438 \u0432\u0440\u0435\u043C\u044F \u043E\u0442\u0437\u044B\u0432\u0430',
      revoke_reason TEXT COMMENT '\u041F\u0440\u0438\u0447\u0438\u043D\u0430 \u043E\u0442\u0437\u044B\u0432\u0430',
      
      notes TEXT COMMENT '\u041F\u0440\u0438\u043C\u0435\u0447\u0430\u043D\u0438\u044F',
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      -- \u0418\u043D\u0434\u0435\u043A\u0441\u044B
      INDEX idx_group_id (group_id),
      INDEX idx_student_id (student_id),
      INDEX idx_template_id (template_id),
      INDEX idx_certificate_number (certificate_number),
      INDEX idx_status (status),
      INDEX idx_issue_date (issue_date),
      UNIQUE INDEX idx_student_group (student_id, group_id),
      
      -- \u0412\u043D\u0435\u0448\u043D\u0438\u0435 \u043A\u043B\u044E\u0447\u0438
      CONSTRAINT fk_issued_cert_group 
        FOREIGN KEY (group_id) REFERENCES study_groups(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_issued_cert_student 
        FOREIGN KEY (student_id) REFERENCES students(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT fk_issued_cert_template 
        FOREIGN KEY (template_id) REFERENCES certificate_templates(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
      CONSTRAINT fk_issued_cert_issued_by 
        FOREIGN KEY (issued_by) REFERENCES users(id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
      CONSTRAINT fk_issued_cert_revoked_by 
        FOREIGN KEY (revoked_by) REFERENCES users(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  await connection.query(`
    ALTER TABLE activity_logs 
    MODIFY COLUMN entity_type ENUM(
      'USER', 'STUDENT', 'CERTIFICATE', 'COURSE', 'DISCIPLINE', 
      'INSTRUCTOR', 'FILE', 'FOLDER', 'SYSTEM', 'GROUP', 
      'SCHEDULE', 'ATTENDANCE', 'GRADE', 'ORGANIZATION', 'REPRESENTATIVE',
      'CERTIFICATE_TEMPLATE', 'ISSUED_CERTIFICATE'
    ) NOT NULL
  `);
  console.log("\u2705 Migration completed successfully");
};
const down$d = async (connection) => {
  console.log("\u{1F504} Rolling back migration: certificate_templates_extended");
  await connection.query(`DROP TABLE IF EXISTS issued_certificates`);
  await connection.query(`
    ALTER TABLE certificate_templates 
    DROP COLUMN IF EXISTS original_file_url,
    DROP COLUMN IF EXISTS variables,
    DROP COLUMN IF EXISTS qr_settings,
    DROP COLUMN IF EXISTS number_format,
    DROP COLUMN IF EXISTS last_number
  `);
  console.log("\u2705 Rollback completed successfully");
};
const description$a = "\u0420\u0430\u0441\u0448\u0438\u0440\u0435\u043D\u0438\u0435 \u0448\u0430\u0431\u043B\u043E\u043D\u043E\u0432 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432 \u0438 \u0442\u0430\u0431\u043B\u0438\u0446\u0430 \u0432\u044B\u0434\u0430\u043D\u043D\u044B\u0445 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432";

const up$c = async (connection) => {
  console.log("\u{1F504} Running migration: certificate_visual_editor");
  await connection.query(`
    ALTER TABLE certificate_templates 
    ADD COLUMN IF NOT EXISTS template_data JSON COMMENT 'JSON-\u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0430 \u0432\u0438\u0437\u0443\u0430\u043B\u044C\u043D\u043E\u0433\u043E \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440\u0430 (\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u044B, \u043F\u043E\u0437\u0438\u0446\u0438\u0438, \u0441\u0442\u0438\u043B\u0438)',
    ADD COLUMN IF NOT EXISTS layout VARCHAR(20) DEFAULT 'A4_landscape' COMMENT '\u041C\u0430\u043A\u0435\u0442: A4_portrait, A4_landscape, letter_portrait, letter_landscape',
    ADD COLUMN IF NOT EXISTS background_url VARCHAR(500) COMMENT 'URL \u0444\u043E\u043D\u043E\u0432\u043E\u0433\u043E \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F \u0434\u043B\u044F \u0448\u0430\u0431\u043B\u043E\u043D\u0430'
  `);
  await connection.query(`
    CREATE INDEX IF NOT EXISTS idx_layout ON certificate_templates(layout)
  `).catch(() => {
    console.log("\u2139\uFE0F  Index idx_layout already exists or cannot be created");
  });
  console.log("\u2705 Migration completed successfully");
};
const down$c = async (connection) => {
  console.log("\u{1F504} Rolling back migration: certificate_visual_editor");
  await connection.query(`
    DROP INDEX IF EXISTS idx_layout ON certificate_templates
  `).catch(() => {
    console.log("\u2139\uFE0F  Index idx_layout does not exist");
  });
  await connection.query(`
    ALTER TABLE certificate_templates 
    DROP COLUMN IF EXISTS template_data,
    DROP COLUMN IF EXISTS layout,
    DROP COLUMN IF EXISTS background_url
  `);
  console.log("\u2705 Rollback completed successfully");
};
const description$9 = "\u0414\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043F\u043E\u043B\u0435\u0439 \u0434\u043B\u044F \u0432\u0438\u0437\u0443\u0430\u043B\u044C\u043D\u043E\u0433\u043E \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440\u0430 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432 (template_data, layout, background_url)";

const description$8 = "\u0421\u0440\u043E\u043A \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432 \u0438 \u0440\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u0438\u044F \u043F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u0438\u0442\u0435\u043B\u0435\u0439";
const up$b = async (connection) => {
  console.log("\u{1F504} Running migration: certificate_validity_and_permissions");
  await connection.query(`
    ALTER TABLE courses 
    ADD COLUMN IF NOT EXISTS certificate_validity_months INT DEFAULT NULL 
    COMMENT '\u0421\u0440\u043E\u043A \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430 \u0432 \u043C\u0435\u0441\u044F\u0446\u0430\u0445 (NULL = \u0431\u0435\u0441\u0441\u0440\u043E\u0447\u043D\u044B\u0439)'
  `);
  console.log("\u2705 Added certificate_validity_months to courses");
  await connection.query(`
    ALTER TABLE issued_certificates 
    ADD COLUMN IF NOT EXISTS expiry_date DATE NULL 
    COMMENT '\u0414\u0430\u0442\u0430 \u043E\u043A\u043E\u043D\u0447\u0430\u043D\u0438\u044F \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430 (NULL = \u0431\u0435\u0441\u0441\u0440\u043E\u0447\u043D\u044B\u0439)',
    ADD COLUMN IF NOT EXISTS is_sent_via_telegram BOOLEAN DEFAULT FALSE 
    COMMENT '\u0411\u044B\u043B \u043B\u0438 \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D \u0447\u0435\u0440\u0435\u0437 Telegram',
    ADD COLUMN IF NOT EXISTS sent_at DATETIME(3) NULL 
    COMMENT '\u0414\u0430\u0442\u0430 \u0438 \u0432\u0440\u0435\u043C\u044F \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0438 \u0447\u0435\u0440\u0435\u0437 Telegram',
    ADD INDEX IF NOT EXISTS idx_expiry_date (expiry_date)
  `);
  console.log("\u2705 Added expiry_date, is_sent_via_telegram, sent_at to issued_certificates");
  await connection.query(`
    ALTER TABLE organization_representatives 
    ADD COLUMN IF NOT EXISTS permissions JSON 
    COMMENT '\u0420\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u0438\u044F: {can_view_students: bool, can_view_schedule: bool, can_view_certificates: bool, can_request_certificates: bool}',
    ADD COLUMN IF NOT EXISTS can_receive_notifications BOOLEAN DEFAULT TRUE 
    COMMENT '\u041C\u043E\u0436\u0435\u0442 \u043F\u043E\u043B\u0443\u0447\u0430\u0442\u044C \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F \u043E \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u044F\u0445'
  `);
  console.log("\u2705 Added permissions, can_receive_notifications to organization_representatives");
  await connection.query(`
    UPDATE organization_representatives 
    SET permissions = JSON_OBJECT(
      'can_view_students', TRUE,
      'can_view_schedule', TRUE,
      'can_view_certificates', TRUE,
      'can_request_certificates', TRUE
    )
    WHERE permissions IS NULL
  `);
  console.log("\u2705 Set default permissions for existing representatives");
  try {
    await connection.query(`
      ALTER TABLE activity_logs 
      MODIFY COLUMN entity_type ENUM(
        'USER', 'STUDENT', 'CERTIFICATE', 'COURSE', 'DISCIPLINE', 
        'INSTRUCTOR', 'FILE', 'FOLDER', 'SYSTEM', 'GROUP', 
        'SCHEDULE', 'ATTENDANCE', 'GRADE', 'ORGANIZATION', 'REPRESENTATIVE',
        'CERTIFICATE_TEMPLATE', 'ISSUED_CERTIFICATE', 'CERTIFICATE_DATABASE'
      ) NOT NULL
    `);
    console.log("\u2705 Added CERTIFICATE_DATABASE entity type to activity_logs");
  } catch (error) {
    console.log("\u2139\uFE0F  entity_type already has the required values or modification skipped");
  }
  await connection.query(`
    UPDATE issued_certificates ic
    JOIN study_groups g ON ic.group_id = g.id
    JOIN courses c ON g.course_id = c.id
    SET ic.expiry_date = DATE_ADD(ic.issue_date, INTERVAL COALESCE(c.certificate_validity_months, 60) MONTH)
    WHERE ic.expiry_date IS NULL AND c.certificate_validity_months IS NOT NULL
  `);
  console.log("\u2705 Calculated expiry_date for existing certificates based on course settings");
  console.log("\u2705 Migration completed successfully");
};
const down$b = async (connection) => {
  console.log("\u{1F504} Rolling back migration: certificate_validity_and_permissions");
  try {
    await connection.query(`
      ALTER TABLE issued_certificates 
      DROP COLUMN IF EXISTS expiry_date,
      DROP COLUMN IF EXISTS is_sent_via_telegram,
      DROP COLUMN IF EXISTS sent_at
    `);
  } catch (error) {
    console.log("\u2139\uFE0F  Columns may not exist in issued_certificates");
  }
  try {
    await connection.query(`
      ALTER TABLE courses 
      DROP COLUMN IF EXISTS certificate_validity_months
    `);
  } catch (error) {
    console.log("\u2139\uFE0F  Column may not exist in courses");
  }
  try {
    await connection.query(`
      ALTER TABLE organization_representatives 
      DROP COLUMN IF EXISTS permissions,
      DROP COLUMN IF EXISTS can_receive_notifications
    `);
  } catch (error) {
    console.log("\u2139\uFE0F  Columns may not exist in organization_representatives");
  }
  console.log("\u2705 Rollback completed successfully");
};

const description$7 = "\u0416\u0443\u0440\u043D\u0430\u043B \u0437\u0430\u043F\u0440\u043E\u0441\u043E\u0432 \u043F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u0438\u0442\u0435\u043B\u0435\u0439 \u0432 Telegram-\u0431\u043E\u0442\u0435";
const up$a = async (connection) => {
  console.log("\u{1F504} Running migration: telegram_bot_requests");
  await connection.query(`
    CREATE TABLE IF NOT EXISTS telegram_bot_requests (
      id VARCHAR(191) PRIMARY KEY,
      representative_id VARCHAR(191) NOT NULL COMMENT 'ID \u043F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u0438\u0442\u0435\u043B\u044F',
      chat_id BIGINT NOT NULL COMMENT 'Telegram Chat ID',
      command VARCHAR(100) NOT NULL COMMENT '\u041A\u043E\u043C\u0430\u043D\u0434\u0430 \u0438\u043B\u0438 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435',
      request_type ENUM('command', 'callback', 'message') NOT NULL DEFAULT 'command' COMMENT '\u0422\u0438\u043F \u0437\u0430\u043F\u0440\u043E\u0441\u0430',
      request_data JSON COMMENT '\u0414\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435 \u0437\u0430\u043F\u0440\u043E\u0441\u0430',
      status ENUM('success', 'error', 'denied') NOT NULL DEFAULT 'success' COMMENT '\u0421\u0442\u0430\u0442\u0443\u0441 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u044F',
      error_message TEXT COMMENT '\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u043E\u0431 \u043E\u0448\u0438\u0431\u043A\u0435',
      response_time_ms INT COMMENT '\u0412\u0440\u0435\u043C\u044F \u043E\u0442\u0432\u0435\u0442\u0430 \u0432 \u043C\u0438\u043B\u043B\u0438\u0441\u0435\u043A\u0443\u043D\u0434\u0430\u0445',
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      
      INDEX idx_representative_id (representative_id),
      INDEX idx_chat_id (chat_id),
      INDEX idx_command (command),
      INDEX idx_request_type (request_type),
      INDEX idx_status (status),
      INDEX idx_created_at (created_at),
      INDEX idx_rep_created (representative_id, created_at DESC),
      
      CONSTRAINT fk_bot_requests_representative 
        FOREIGN KEY (representative_id) REFERENCES organization_representatives(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('\u2705 Table "telegram_bot_requests" created');
  try {
    await connection.query(`
      ALTER TABLE activity_logs 
      MODIFY COLUMN entity_type ENUM(
        'USER', 'STUDENT', 'CERTIFICATE', 'COURSE', 'DISCIPLINE', 
        'INSTRUCTOR', 'FILE', 'FOLDER', 'SYSTEM', 'GROUP', 
        'SCHEDULE', 'ATTENDANCE', 'GRADE', 'ORGANIZATION', 'REPRESENTATIVE',
        'CERTIFICATE_TEMPLATE', 'ISSUED_CERTIFICATE', 'CERTIFICATE_DATABASE',
        'TELEGRAM_BOT_REQUEST'
      ) NOT NULL
    `);
    console.log("\u2705 Added TELEGRAM_BOT_REQUEST entity type to activity_logs");
  } catch (error) {
    console.log("\u2139\uFE0F  entity_type already has the required values or modification skipped");
  }
  console.log("\u2705 Migration completed successfully");
};
const down$a = async (connection) => {
  console.log("\u{1F504} Rolling back migration: telegram_bot_requests");
  await connection.query(`DROP TABLE IF EXISTS telegram_bot_requests`);
  console.log("\u2705 Rollback completed successfully");
};

const up$9 = async (connection) => {
  console.log("\u{1F504} Running migration: unify_certificates");
  const [tables] = await connection.query(
    `SELECT TABLE_NAME FROM information_schema.TABLES 
     WHERE TABLE_SCHEMA = DATABASE() 
     AND TABLE_NAME IN ('certificates', 'issued_certificates')`
  );
  const tableNames = tables.map((t) => t.TABLE_NAME);
  console.log(`\u{1F4CB} Found tables: ${tableNames.join(", ")}`);
  if (!tableNames.includes("certificates")) {
    console.log('\u2139\uFE0F  Table "certificates" does not exist, skipping migration');
    return;
  }
  if (!tableNames.includes("issued_certificates")) {
    console.log('\u26A0\uFE0F  Table "issued_certificates" does not exist. Creating it first...');
    throw new Error("issued_certificates table must exist before this migration");
  }
  try {
    await connection.query(`
      ALTER TABLE issued_certificates 
      ADD COLUMN IF NOT EXISTS legacy_id VARCHAR(191) NULL 
      COMMENT 'ID \u0438\u0437 \u0441\u0442\u0430\u0440\u043E\u0439 \u0442\u0430\u0431\u043B\u0438\u0446\u044B certificates (\u0434\u043B\u044F \u043E\u0442\u0441\u043B\u0435\u0436\u0438\u0432\u0430\u043D\u0438\u044F \u043C\u0438\u0433\u0440\u0430\u0446\u0438\u0438)'
    `);
    console.log("\u2705 Added legacy_id column to issued_certificates");
  } catch (err) {
    console.log("\u2139\uFE0F  legacy_id column may already exist");
  }
  const [countResult] = await connection.query(
    "SELECT COUNT(*) as total FROM certificates"
  );
  const totalRecords = countResult[0].total;
  console.log(`\u{1F4CA} Found ${totalRecords} records to migrate from certificates`);
  if (totalRecords === 0) {
    console.log("\u2139\uFE0F  No records to migrate");
  } else {
    const [existingTemplate] = await connection.query(
      `SELECT id FROM certificate_templates WHERE name = '\u041C\u0438\u0433\u0440\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0439 (legacy)' LIMIT 1`
    );
    let legacyTemplateId;
    if (existingTemplate.length === 0) {
      legacyTemplateId = crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        return (c === "x" ? r : r & 3 | 8).toString(16);
      });
      await connection.query(`
        INSERT INTO certificate_templates (id, name, description, is_active, created_at, updated_at)
        VALUES (?, '\u041C\u0438\u0433\u0440\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0439 (legacy)', '\u0428\u0430\u0431\u043B\u043E\u043D \u0434\u043B\u044F \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432, \u043C\u0438\u0433\u0440\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0445 \u0438\u0437 \u0441\u0442\u0430\u0440\u043E\u0439 \u0441\u0438\u0441\u0442\u0435\u043C\u044B', FALSE, NOW(3), NOW(3))
      `, [legacyTemplateId]);
      console.log("\u2705 Created legacy certificate template");
    } else {
      legacyTemplateId = existingTemplate[0].id;
    }
    const [existingGroup] = await connection.query(
      `SELECT id FROM study_groups WHERE code = 'LEGACY-MIGRATION' LIMIT 1`
    );
    let legacyGroupId;
    if (existingGroup.length === 0) {
      const [existingCourse] = await connection.query(
        `SELECT id FROM courses WHERE code = 'LEGACY' LIMIT 1`
      );
      let legacyCourseId;
      if (existingCourse.length === 0) {
        legacyCourseId = crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0;
          return (c === "x" ? r : r & 3 | 8).toString(16);
        });
        await connection.query(`
          INSERT INTO courses (id, name, short_name, code, description, total_hours, is_active, created_at, updated_at)
          VALUES (?, '\u041C\u0438\u0433\u0440\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0435 \u043A\u0443\u0440\u0441\u044B', 'LEGCY', 'LEGACY', '\u041A\u0443\u0440\u0441\u044B \u0438\u0437 \u0441\u0442\u0430\u0440\u043E\u0439 \u0441\u0438\u0441\u0442\u0435\u043C\u044B \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432', 0, FALSE, NOW(3), NOW(3))
        `, [legacyCourseId]);
        console.log("\u2705 Created legacy course");
      } else {
        legacyCourseId = existingCourse[0].id;
      }
      legacyGroupId = crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        return (c === "x" ? r : r & 3 | 8).toString(16);
      });
      await connection.query(`
        INSERT INTO study_groups (id, code, course_id, start_date, end_date, description, is_active, created_at, updated_at)
        VALUES (?, 'LEGACY-MIGRATION', ?, '2000-01-01', '2099-12-31', '\u0413\u0440\u0443\u043F\u043F\u0430 \u0434\u043B\u044F \u043C\u0438\u0433\u0440\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0445 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432', FALSE, NOW(3), NOW(3))
      `, [legacyGroupId, legacyCourseId]);
      console.log("\u2705 Created legacy study group");
    } else {
      legacyGroupId = existingGroup[0].id;
    }
    const [certificates] = await connection.query("SELECT * FROM certificates");
    let migrated = 0;
    let skipped = 0;
    for (const cert of certificates) {
      const [existing] = await connection.query(
        `SELECT id FROM issued_certificates WHERE legacy_id = ? OR certificate_number = ? LIMIT 1`,
        [cert.id, cert.certificate_number]
      );
      if (existing.length > 0) {
        skipped++;
        continue;
      }
      const newId = crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        return (c === "x" ? r : r & 3 | 8).toString(16);
      });
      const variablesData = JSON.stringify({
        courseName: cert.course_name,
        legacyMigration: true,
        originalId: cert.id
      });
      await connection.query(`
        INSERT INTO issued_certificates (
          id, group_id, student_id, template_id, certificate_number,
          issue_date, pdf_file_url, status, variables_data, 
          expiry_date, legacy_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'issued', ?, ?, ?, ?, ?)
      `, [
        newId,
        legacyGroupId,
        cert.student_id,
        legacyTemplateId,
        cert.certificate_number,
        cert.issue_date,
        cert.file_url,
        variablesData,
        cert.expiry_date,
        cert.id,
        // legacy_id
        cert.created_at || /* @__PURE__ */ new Date(),
        cert.updated_at || /* @__PURE__ */ new Date()
      ]);
      migrated++;
    }
    console.log(`\u2705 Migrated ${migrated} certificates, skipped ${skipped} (already exist)`);
  }
  console.log("\u{1F5D1}\uFE0F  Dropping old certificates table...");
  await connection.query("DROP TABLE IF EXISTS certificates");
  console.log("\u2705 Dropped certificates table");
  console.log("\u2705 Migration completed successfully");
};
const down$9 = async (connection) => {
  console.log("\u{1F504} Rolling back migration: unify_certificates");
  await connection.query(`
    CREATE TABLE IF NOT EXISTS certificates (
      id VARCHAR(191) PRIMARY KEY,
      student_id VARCHAR(191) NOT NULL,
      course_name VARCHAR(255) NOT NULL,
      issue_date DATE NOT NULL,
      certificate_number VARCHAR(100) NOT NULL,
      file_url VARCHAR(500),
      expiry_date DATE,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      INDEX idx_student_id (student_id),
      INDEX idx_certificate_number (certificate_number),
      INDEX idx_issue_date (issue_date),
      INDEX idx_expiry_date (expiry_date),
      
      CONSTRAINT fk_certificates_student 
        FOREIGN KEY (student_id) REFERENCES students(id) 
        ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("\u2705 Recreated certificates table");
  const [legacyCerts] = await connection.query(
    `SELECT * FROM issued_certificates WHERE legacy_id IS NOT NULL`
  );
  for (const cert of legacyCerts) {
    let courseName = "Unknown Course";
    try {
      const varsData = JSON.parse(cert.variables_data || "{}");
      courseName = varsData.courseName || courseName;
    } catch {
    }
    await connection.query(`
      INSERT INTO certificates (id, student_id, course_name, issue_date, certificate_number, file_url, expiry_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      cert.legacy_id,
      cert.student_id,
      courseName,
      cert.issue_date,
      cert.certificate_number,
      cert.pdf_file_url,
      cert.expiry_date,
      cert.created_at,
      cert.updated_at
    ]);
  }
  console.log(`\u2705 Restored ${legacyCerts.length} records to certificates table`);
  await connection.query(`DELETE FROM issued_certificates WHERE legacy_id IS NOT NULL`);
  console.log("\u2705 Removed legacy records from issued_certificates");
  try {
    await connection.query(`ALTER TABLE issued_certificates DROP COLUMN legacy_id`);
  } catch {
  }
  await connection.query(`DELETE FROM study_groups WHERE code = 'LEGACY-MIGRATION'`);
  await connection.query(`DELETE FROM courses WHERE code = 'LEGACY'`);
  await connection.query(`DELETE FROM certificate_templates WHERE name = '\u041C\u0438\u0433\u0440\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0439 (legacy)'`);
  console.log("\u2705 Rollback completed");
};
const description$6 = "\u041E\u0431\u044A\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u0435 \u0442\u0430\u0431\u043B\u0438\u0446 certificates \u0438 issued_certificates \u0432 \u0435\u0434\u0438\u043D\u0443\u044E \u0441\u0438\u0441\u0442\u0435\u043C\u0443";

const description$5 = "\u0414\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u0438\u0435 user_id \u0432 \u0442\u0430\u0431\u043B\u0438\u0446\u044B students \u0438 instructors \u0434\u043B\u044F \u0441\u0438\u0441\u0442\u0435\u043C\u044B \u0440\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u0438\u0439";
async function up$8() {
  console.log("[Migration] Adding user_id to instructors and students tables...");
  try {
    await executeQuery(`
      ALTER TABLE instructors
      ADD COLUMN user_id VARCHAR(191) NULL AFTER id
    `);
    console.log("[Migration] Added user_id column to instructors");
  } catch (error) {
    if (error.code === "ER_DUP_FIELDNAME") {
      console.log("[Migration] Column user_id already exists in instructors, skipping...");
    } else {
      throw error;
    }
  }
  try {
    await executeQuery(`
      ALTER TABLE instructors
      ADD CONSTRAINT fk_instructors_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE
    `);
    console.log("[Migration] Added foreign key fk_instructors_user");
  } catch (error) {
    if (error.code === "ER_DUP_KEYNAME" || error.code === "ER_FK_DUP_NAME") {
      console.log("[Migration] Foreign key fk_instructors_user already exists, skipping...");
    } else {
      throw error;
    }
  }
  try {
    await executeQuery(`
      ALTER TABLE instructors
      ADD UNIQUE INDEX idx_instructors_user_id (user_id)
    `);
    console.log("[Migration] Added unique index idx_instructors_user_id");
  } catch (error) {
    if (error.code === "ER_DUP_KEYNAME") {
      console.log("[Migration] Index idx_instructors_user_id already exists, skipping...");
    } else {
      throw error;
    }
  }
  try {
    await executeQuery(`
      ALTER TABLE students
      ADD COLUMN user_id VARCHAR(191) NULL AFTER id
    `);
    console.log("[Migration] Added user_id column to students");
  } catch (error) {
    if (error.code === "ER_DUP_FIELDNAME") {
      console.log("[Migration] Column user_id already exists in students, skipping...");
    } else {
      throw error;
    }
  }
  try {
    await executeQuery(`
      ALTER TABLE students
      ADD CONSTRAINT fk_students_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE
    `);
    console.log("[Migration] Added foreign key fk_students_user");
  } catch (error) {
    if (error.code === "ER_DUP_KEYNAME" || error.code === "ER_FK_DUP_NAME") {
      console.log("[Migration] Foreign key fk_students_user already exists, skipping...");
    } else {
      throw error;
    }
  }
  try {
    await executeQuery(`
      ALTER TABLE students
      ADD UNIQUE INDEX idx_students_user_id (user_id)
    `);
    console.log("[Migration] Added unique index idx_students_user_id");
  } catch (error) {
    if (error.code === "ER_DUP_KEYNAME") {
      console.log("[Migration] Index idx_students_user_id already exists, skipping...");
    } else {
      throw error;
    }
  }
  console.log("[Migration] User entity links migration completed successfully!");
}
async function down$8() {
  console.log("[Migration] Reverting user entity links...");
  try {
    await executeQuery("ALTER TABLE instructors DROP FOREIGN KEY fk_instructors_user");
  } catch (error) {
    console.warn("[Migration] Could not drop fk_instructors_user");
  }
  try {
    await executeQuery("ALTER TABLE instructors DROP INDEX idx_instructors_user_id");
  } catch (error) {
    console.warn("[Migration] Could not drop idx_instructors_user_id");
  }
  try {
    await executeQuery("ALTER TABLE instructors DROP COLUMN user_id");
  } catch (error) {
    console.warn("[Migration] Could not drop user_id from instructors");
  }
  try {
    await executeQuery("ALTER TABLE students DROP FOREIGN KEY fk_students_user");
  } catch (error) {
    console.warn("[Migration] Could not drop fk_students_user");
  }
  try {
    await executeQuery("ALTER TABLE students DROP INDEX idx_students_user_id");
  } catch (error) {
    console.warn("[Migration] Could not drop idx_students_user_id");
  }
  try {
    await executeQuery("ALTER TABLE students DROP COLUMN user_id");
  } catch (error) {
    console.warn("[Migration] Could not drop user_id from students");
  }
  console.log("[Migration] Revert completed!");
}

const description$4 = "Expand activity_logs ENUM columns (action_type, entity_type)";
async function up$7() {
  console.log("[Migration] \u0420\u0430\u0441\u0448\u0438\u0440\u0435\u043D\u0438\u0435 ENUM action_type (\u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u0438\u0435 VIEW)...");
  await executeQuery(`
    ALTER TABLE activity_logs 
    MODIFY COLUMN action_type ENUM('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', 'LOGOUT', 'IMPORT', 'EXPORT') NOT NULL
  `);
  console.log("[Migration] \u2705 action_type ENUM \u043E\u0431\u043D\u043E\u0432\u043B\u0451\u043D");
  console.log("[Migration] \u0420\u0430\u0441\u0448\u0438\u0440\u0435\u043D\u0438\u0435 ENUM entity_type...");
  await executeQuery(`
    ALTER TABLE activity_logs 
    MODIFY COLUMN entity_type ENUM(
      'USER', 
      'STUDENT', 
      'CERTIFICATE', 
      'CERTIFICATE_TEMPLATE',
      'ISSUED_CERTIFICATE',
      'COURSE', 
      'DISCIPLINE', 
      'INSTRUCTOR', 
      'FILE', 
      'FOLDER', 
      'SCHEDULE',
      'GROUP',
      'CLASSROOM',
      'ORGANIZATION',
      'REPRESENTATIVE',
      'ATTENDANCE',
      'GRADE',
      'SYSTEM'
    ) NOT NULL
  `);
  console.log("[Migration] \u2705 entity_type ENUM \u043E\u0431\u043D\u043E\u0432\u043B\u0451\u043D");
}
async function down$7() {
  console.log("[Migration] \u041E\u0442\u043A\u0430\u0442: \u0441\u0443\u0436\u0435\u043D\u0438\u0435 ENUM...");
  await executeQuery(`
    DELETE FROM activity_logs WHERE action_type = 'VIEW'
  `);
  await executeQuery(`
    DELETE FROM activity_logs WHERE entity_type IN (
      'CERTIFICATE_TEMPLATE', 'ISSUED_CERTIFICATE', 'SCHEDULE', 
      'GROUP', 'CLASSROOM', 'ORGANIZATION', 'REPRESENTATIVE', 
      'ATTENDANCE', 'GRADE'
    )
  `);
  await executeQuery(`
    ALTER TABLE activity_logs 
    MODIFY COLUMN action_type ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'IMPORT', 'EXPORT') NOT NULL
  `);
  await executeQuery(`
    ALTER TABLE activity_logs 
    MODIFY COLUMN entity_type ENUM('USER', 'STUDENT', 'CERTIFICATE', 'COURSE', 'DISCIPLINE', 'INSTRUCTOR', 'FILE', 'FOLDER', 'SYSTEM') NOT NULL
  `);
  console.log("[Migration] \u2705 ENUM \u043E\u0442\u043A\u0430\u0447\u0435\u043D\u044B \u043A \u0438\u0441\u0445\u043E\u0434\u043D\u043E\u043C\u0443 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u044E");
}

const up$6 = async (connection) => {
  console.log("\u{1F504} Running migration: 20260104_028_testing_system");
  await connection.query(`
    CREATE TABLE IF NOT EXISTS question_banks (
      id VARCHAR(191) NOT NULL,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(50) NOT NULL,
      description TEXT NULL,
      category VARCHAR(100) NULL,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_by VARCHAR(191) NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      PRIMARY KEY (id),
      UNIQUE KEY uk_code (code),
      INDEX idx_category (category),
      INDEX idx_is_active (is_active),
      INDEX idx_created_by (created_by),
      FULLTEXT INDEX ft_search (name, description, category),
      
      CONSTRAINT fk_question_banks_created_by 
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("  \u2705 Created table: question_banks");
  await connection.query(`
    CREATE TABLE IF NOT EXISTS questions (
      id VARCHAR(191) NOT NULL,
      bank_id VARCHAR(191) NOT NULL,
      question_type ENUM('single', 'multiple', 'text', 'order', 'match') NOT NULL DEFAULT 'single',
      question_text TEXT NOT NULL,
      question_media JSON NULL COMMENT '\u041C\u0435\u0434\u0438\u0430: [{type, url, caption}]',
      options JSON NOT NULL COMMENT '\u0412\u0430\u0440\u0438\u0430\u043D\u0442\u044B \u043E\u0442\u0432\u0435\u0442\u043E\u0432 \u0432 \u0444\u043E\u0440\u043C\u0430\u0442\u0435 JSON',
      points INT NOT NULL DEFAULT 1,
      explanation TEXT NULL COMMENT '\u041E\u0431\u044A\u044F\u0441\u043D\u0435\u043D\u0438\u0435 \u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u043E\u0433\u043E \u043E\u0442\u0432\u0435\u0442\u0430',
      difficulty ENUM('easy', 'medium', 'hard') NOT NULL DEFAULT 'medium',
      tags JSON NULL COMMENT '["\u0442\u0435\u04331", "\u0442\u0435\u04332"]',
      order_index INT NOT NULL DEFAULT 0,
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      PRIMARY KEY (id),
      INDEX idx_bank_id (bank_id),
      INDEX idx_question_type (question_type),
      INDEX idx_difficulty (difficulty),
      INDEX idx_is_active (is_active),
      INDEX idx_order (order_index),
      FULLTEXT INDEX ft_question_text (question_text),
      
      CONSTRAINT fk_questions_bank 
        FOREIGN KEY (bank_id) REFERENCES question_banks(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("  \u2705 Created table: questions");
  await connection.query(`
    CREATE TABLE IF NOT EXISTS test_templates (
      id VARCHAR(191) NOT NULL,
      bank_id VARCHAR(191) NOT NULL,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(50) NOT NULL,
      description TEXT NULL,
      questions_mode ENUM('all', 'random', 'manual') NOT NULL DEFAULT 'all' COMMENT 'all=\u0432\u0441\u0435 \u0432\u043E\u043F\u0440\u043E\u0441\u044B, random=\u0441\u043B\u0443\u0447\u0430\u0439\u043D\u044B\u0435 N, manual=\u0432\u0440\u0443\u0447\u043D\u0443\u044E \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u044B\u0435',
      questions_count INT NULL COMMENT '\u041A\u043E\u043B-\u0432\u043E \u0432\u043E\u043F\u0440\u043E\u0441\u043E\u0432 \u0434\u043B\u044F \u0440\u0435\u0436\u0438\u043C\u0430 random',
      time_limit_minutes INT NULL COMMENT '\u041B\u0438\u043C\u0438\u0442 \u0432\u0440\u0435\u043C\u0435\u043D\u0438 \u0432 \u043C\u0438\u043D\u0443\u0442\u0430\u0445 (NULL = \u0431\u0435\u0437 \u043B\u0438\u043C\u0438\u0442\u0430)',
      passing_score INT NOT NULL DEFAULT 60 COMMENT '\u041F\u0440\u043E\u0445\u043E\u0434\u043D\u043E\u0439 \u0431\u0430\u043B\u043B \u0432 \u043F\u0440\u043E\u0446\u0435\u043D\u0442\u0430\u0445',
      max_attempts INT NOT NULL DEFAULT 1 COMMENT '\u041C\u0430\u043A\u0441. \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u043F\u043E\u043F\u044B\u0442\u043E\u043A',
      shuffle_questions BOOLEAN NOT NULL DEFAULT TRUE COMMENT '\u041F\u0435\u0440\u0435\u043C\u0435\u0448\u0438\u0432\u0430\u0442\u044C \u0432\u043E\u043F\u0440\u043E\u0441\u044B',
      shuffle_options BOOLEAN NOT NULL DEFAULT TRUE COMMENT '\u041F\u0435\u0440\u0435\u043C\u0435\u0448\u0438\u0432\u0430\u0442\u044C \u0432\u0430\u0440\u0438\u0430\u043D\u0442\u044B \u043E\u0442\u0432\u0435\u0442\u043E\u0432',
      questions_per_page INT NOT NULL DEFAULT 1 COMMENT '\u0412\u043E\u043F\u0440\u043E\u0441\u043E\u0432 \u043D\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0435 (1 = \u043F\u043E \u043E\u0434\u043D\u043E\u043C\u0443)',
      show_results ENUM('immediately', 'after_deadline', 'manual', 'never') NOT NULL DEFAULT 'immediately',
      allow_back BOOLEAN NOT NULL DEFAULT TRUE COMMENT '\u0420\u0430\u0437\u0440\u0435\u0448\u0438\u0442\u044C \u0432\u043E\u0437\u0432\u0440\u0430\u0442 \u043A \u0432\u043E\u043F\u0440\u043E\u0441\u0430\u043C',
      proctoring_enabled BOOLEAN NOT NULL DEFAULT FALSE COMMENT '\u0412\u043A\u043B\u044E\u0447\u0451\u043D \u043B\u0438 \u0430\u043D\u0442\u0438\u043F\u0440\u043E\u043A\u0442\u043E\u0440\u0438\u043D\u0433',
      proctoring_settings JSON NULL COMMENT '{blockTabSwitch: true, ...}',
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      created_by VARCHAR(191) NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      PRIMARY KEY (id),
      UNIQUE KEY uk_code (code),
      INDEX idx_bank_id (bank_id),
      INDEX idx_is_active (is_active),
      INDEX idx_created_by (created_by),
      
      CONSTRAINT fk_test_templates_bank 
        FOREIGN KEY (bank_id) REFERENCES question_banks(id) ON DELETE CASCADE,
      CONSTRAINT fk_test_templates_created_by 
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("  \u2705 Created table: test_templates");
  await connection.query(`
    CREATE TABLE IF NOT EXISTS test_template_questions (
      id VARCHAR(191) NOT NULL,
      template_id VARCHAR(191) NOT NULL,
      question_id VARCHAR(191) NOT NULL,
      order_index INT NOT NULL DEFAULT 0,
      points_override INT NULL COMMENT '\u041F\u0435\u0440\u0435\u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0451\u043D\u043D\u044B\u0435 \u0431\u0430\u043B\u043B\u044B (NULL = \u0438\u0437 \u0432\u043E\u043F\u0440\u043E\u0441\u0430)',
      
      PRIMARY KEY (id),
      UNIQUE KEY uk_template_question (template_id, question_id),
      INDEX idx_template_id (template_id),
      INDEX idx_question_id (question_id),
      INDEX idx_order (order_index),
      
      CONSTRAINT fk_ttq_template 
        FOREIGN KEY (template_id) REFERENCES test_templates(id) ON DELETE CASCADE,
      CONSTRAINT fk_ttq_question 
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("  \u2705 Created table: test_template_questions");
  await connection.query(`
    CREATE TABLE IF NOT EXISTS discipline_tests (
      id VARCHAR(191) NOT NULL,
      discipline_id VARCHAR(191) NOT NULL,
      test_template_id VARCHAR(191) NOT NULL,
      is_required BOOLEAN NOT NULL DEFAULT FALSE COMMENT '\u041E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u044B\u0439 \u043B\u0438 \u0442\u0435\u0441\u0442',
      order_index INT NOT NULL DEFAULT 0,
      notes TEXT NULL COMMENT '\u041F\u0440\u0438\u043C\u0435\u0447\u0430\u043D\u0438\u044F',
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      
      PRIMARY KEY (id),
      UNIQUE KEY uk_discipline_test (discipline_id, test_template_id),
      INDEX idx_discipline_id (discipline_id),
      INDEX idx_test_template_id (test_template_id),
      INDEX idx_order (order_index),
      
      CONSTRAINT fk_discipline_tests_discipline 
        FOREIGN KEY (discipline_id) REFERENCES disciplines(id) ON DELETE CASCADE,
      CONSTRAINT fk_discipline_tests_template 
        FOREIGN KEY (test_template_id) REFERENCES test_templates(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("  \u2705 Created table: discipline_tests");
  await connection.query(`
    CREATE TABLE IF NOT EXISTS test_assignments (
      id VARCHAR(191) NOT NULL,
      schedule_event_id VARCHAR(191) NOT NULL,
      test_template_id VARCHAR(191) NOT NULL,
      group_id VARCHAR(191) NOT NULL,
      time_limit_override INT NULL COMMENT '\u041F\u0435\u0440\u0435\u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0438\u0442\u044C \u043B\u0438\u043C\u0438\u0442 \u0432\u0440\u0435\u043C\u0435\u043D\u0438',
      passing_score_override INT NULL COMMENT '\u041F\u0435\u0440\u0435\u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0438\u0442\u044C \u043F\u0440\u043E\u0445\u043E\u0434\u043D\u043E\u0439 \u0431\u0430\u043B\u043B',
      start_date DATETIME(3) NULL COMMENT '\u041A\u043E\u0433\u0434\u0430 \u043E\u0442\u043A\u0440\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u0442\u0435\u0441\u0442',
      end_date DATETIME(3) NULL COMMENT '\u041A\u0440\u0430\u0439\u043D\u0438\u0439 \u0441\u0440\u043E\u043A',
      status ENUM('scheduled', 'in_progress', 'completed', 'cancelled') NOT NULL DEFAULT 'scheduled',
      assigned_by VARCHAR(191) NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      PRIMARY KEY (id),
      UNIQUE KEY uk_schedule_event (schedule_event_id),
      INDEX idx_test_template_id (test_template_id),
      INDEX idx_group_id (group_id),
      INDEX idx_status (status),
      INDEX idx_start_date (start_date),
      INDEX idx_end_date (end_date),
      INDEX idx_assigned_by (assigned_by),
      
      CONSTRAINT fk_test_assignments_event 
        FOREIGN KEY (schedule_event_id) REFERENCES schedule_events(id) ON DELETE CASCADE,
      CONSTRAINT fk_test_assignments_template 
        FOREIGN KEY (test_template_id) REFERENCES test_templates(id) ON DELETE RESTRICT,
      CONSTRAINT fk_test_assignments_group 
        FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE CASCADE,
      CONSTRAINT fk_test_assignments_assigned_by 
        FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("  \u2705 Created table: test_assignments");
  await connection.query(`
    CREATE TABLE IF NOT EXISTS test_sessions (
      id VARCHAR(191) NOT NULL,
      assignment_id VARCHAR(191) NOT NULL,
      student_id VARCHAR(191) NOT NULL,
      attempt_number INT NOT NULL DEFAULT 1 COMMENT '\u041D\u043E\u043C\u0435\u0440 \u043F\u043E\u043F\u044B\u0442\u043A\u0438 (1, 2, 3...)',
      status ENUM('in_progress', 'completed', 'timeout', 'cancelled', 'violation') NOT NULL DEFAULT 'in_progress',
      questions_order JSON NULL COMMENT '[{questionId, shuffledOptions}]',
      current_question_index INT NOT NULL DEFAULT 0 COMMENT '\u0422\u0435\u043A\u0443\u0449\u0438\u0439 \u0432\u043E\u043F\u0440\u043E\u0441 (\u0434\u043B\u044F \u043D\u0430\u0432\u0438\u0433\u0430\u0446\u0438\u0438)',
      started_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      completed_at DATETIME(3) NULL,
      time_spent_seconds INT NULL COMMENT '\u041F\u043E\u0442\u0440\u0430\u0447\u0435\u043D\u043D\u043E\u0435 \u0432\u0440\u0435\u043C\u044F \u0432 \u0441\u0435\u043A\u0443\u043D\u0434\u0430\u0445',
      total_points INT NULL COMMENT '\u041D\u0430\u0431\u0440\u0430\u043D\u043D\u044B\u0435 \u0431\u0430\u043B\u043B\u044B',
      max_points INT NULL COMMENT '\u041C\u0430\u043A\u0441\u0438\u043C\u0430\u043B\u044C\u043D\u044B\u0435 \u0431\u0430\u043B\u043B\u044B',
      score_percent DECIMAL(5, 2) NULL COMMENT '\u041F\u0440\u043E\u0446\u0435\u043D\u0442 \u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u044B\u0445 \u043E\u0442\u0432\u0435\u0442\u043E\u0432',
      passed BOOLEAN NULL COMMENT '\u0421\u0434\u0430\u043B \u043B\u0438 \u0442\u0435\u0441\u0442',
      grade INT NULL COMMENT '\u0418\u0442\u043E\u0433\u043E\u0432\u0430\u044F \u043E\u0446\u0435\u043D\u043A\u0430 0-100',
      violations JSON NULL COMMENT '[{type, timestamp, details}]',
      ip_address VARCHAR(45) NULL,
      user_agent TEXT NULL,
      created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      
      PRIMARY KEY (id),
      UNIQUE KEY uk_assignment_student_attempt (assignment_id, student_id, attempt_number),
      INDEX idx_assignment_id (assignment_id),
      INDEX idx_student_id (student_id),
      INDEX idx_status (status),
      INDEX idx_started_at (started_at),
      INDEX idx_completed_at (completed_at),
      
      CONSTRAINT fk_test_sessions_assignment 
        FOREIGN KEY (assignment_id) REFERENCES test_assignments(id) ON DELETE CASCADE,
      CONSTRAINT fk_test_sessions_student 
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("  \u2705 Created table: test_sessions");
  await connection.query(`
    CREATE TABLE IF NOT EXISTS test_answers (
      id VARCHAR(191) NOT NULL,
      session_id VARCHAR(191) NOT NULL,
      question_id VARCHAR(191) NOT NULL,
      answer_data JSON NOT NULL COMMENT '\u041E\u0442\u0432\u0435\u0442 \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u0430 ({selectedOption: "b"} \u0434\u043B\u044F single)',
      is_correct BOOLEAN NULL COMMENT '\u041F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u044B\u0439 \u043B\u0438 \u043E\u0442\u0432\u0435\u0442',
      points_earned INT NOT NULL DEFAULT 0 COMMENT '\u0417\u0430\u0440\u0430\u0431\u043E\u0442\u0430\u043D\u043D\u044B\u0435 \u0431\u0430\u043B\u043B\u044B',
      answered_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      time_spent_seconds INT NULL COMMENT '\u0412\u0440\u0435\u043C\u044F \u043D\u0430 \u0432\u043E\u043F\u0440\u043E\u0441 \u0432 \u0441\u0435\u043A\u0443\u043D\u0434\u0430\u0445',
      
      PRIMARY KEY (id),
      UNIQUE KEY uk_session_question (session_id, question_id),
      INDEX idx_session_id (session_id),
      INDEX idx_question_id (question_id),
      INDEX idx_is_correct (is_correct),
      INDEX idx_answered_at (answered_at),
      
      CONSTRAINT fk_test_answers_session 
        FOREIGN KEY (session_id) REFERENCES test_sessions(id) ON DELETE CASCADE,
      CONSTRAINT fk_test_answers_question 
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log("  \u2705 Created table: test_answers");
  console.log("\u2705 Migration 20260104_028_testing_system completed successfully");
};
const down$6 = async (connection) => {
  console.log("\u{1F504} Rolling back migration: 20260104_028_testing_system");
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
    console.log(`  \u2705 Dropped table: ${table}`);
  }
  console.log("\u2705 Rollback 20260104_028_testing_system completed successfully");
};
const description$3 = "\u0421\u0438\u0441\u0442\u0435\u043C\u0430 \u0442\u0435\u0441\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u043E\u0432: \u0431\u0430\u043D\u043A\u0438 \u0432\u043E\u043F\u0440\u043E\u0441\u043E\u0432, \u0448\u0430\u0431\u043B\u043E\u043D\u044B \u0442\u0435\u0441\u0442\u043E\u0432, \u043D\u0430\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F, \u0441\u0435\u0441\u0441\u0438\u0438 \u043F\u0440\u043E\u0445\u043E\u0436\u0434\u0435\u043D\u0438\u044F \u0438 \u043E\u0442\u0432\u0435\u0442\u044B";

const name$2 = "Add preview mode support for test sessions";
async function up$5(connection) {
  await connection.execute(`
    ALTER TABLE test_sessions
    ADD COLUMN is_preview BOOLEAN NOT NULL DEFAULT FALSE
    AFTER status
  `);
  await connection.execute(`
    CREATE INDEX idx_test_sessions_preview 
    ON test_sessions(is_preview, created_at)
  `);
  await connection.execute(`
    ALTER TABLE test_sessions 
    MODIFY COLUMN is_preview BOOLEAN NOT NULL DEFAULT FALSE 
    COMMENT '\u0424\u043B\u0430\u0433 preview-\u0440\u0435\u0436\u0438\u043C\u0430 (\u0434\u043B\u044F \u043F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0430 \u0442\u0435\u0441\u0442\u0430 \u043F\u0440\u0435\u043F\u043E\u0434\u0430\u0432\u0430\u0442\u0435\u043B\u0435\u043C)'
  `);
}
async function down$5(connection) {
  await connection.execute(`
    DROP INDEX idx_test_sessions_preview ON test_sessions
  `);
  await connection.execute(`
    ALTER TABLE test_sessions
    DROP COLUMN is_preview
  `);
}

const name$1 = "Allow nullable assignment_id for preview sessions";
async function up$4(connection) {
  await connection.execute(`
    ALTER TABLE test_sessions
    DROP FOREIGN KEY fk_test_sessions_assignment
  `);
  await connection.execute(`
    ALTER TABLE test_sessions
    MODIFY COLUMN assignment_id VARCHAR(36) NULL
  `);
  await connection.execute(`
    ALTER TABLE test_sessions
    ADD CONSTRAINT fk_test_sessions_assignment
    FOREIGN KEY (assignment_id) REFERENCES test_assignments(id)
    ON DELETE SET NULL
  `);
}
async function down$4(connection) {
  await connection.execute(`
    DELETE FROM test_sessions WHERE is_preview = TRUE
  `);
  await connection.execute(`
    ALTER TABLE test_sessions
    DROP FOREIGN KEY fk_test_sessions_assignment
  `);
  await connection.execute(`
    ALTER TABLE test_sessions
    MODIFY COLUMN assignment_id VARCHAR(36) NOT NULL
  `);
  await connection.execute(`
    ALTER TABLE test_sessions
    ADD CONSTRAINT fk_test_sessions_assignment
    FOREIGN KEY (assignment_id) REFERENCES test_assignments(id)
    ON DELETE CASCADE
  `);
}

const name = "Allow nullable student_id for preview sessions";
async function up$3(connection) {
  console.log("\u{1F504} Running migration: 20260105_031_preview_sessions_nullable_student");
  await connection.execute(`
    ALTER TABLE test_sessions
    ADD COLUMN preview_user_id VARCHAR(191) NULL 
    COMMENT 'ID \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F (\u0443\u0447\u0438\u0442\u0435\u043B\u044C/\u0430\u0434\u043C\u0438\u043D), \u0437\u0430\u043F\u0443\u0441\u0442\u0438\u0432\u0448\u0435\u0433\u043E preview'
    AFTER is_preview
  `);
  console.log("  \u2705 Added column: preview_user_id");
  await connection.execute(`
    ALTER TABLE test_sessions
    ADD CONSTRAINT fk_test_sessions_preview_user
    FOREIGN KEY (preview_user_id) REFERENCES users(id)
    ON DELETE SET NULL
  `);
  console.log("  \u2705 Added FK: fk_test_sessions_preview_user");
  await connection.execute(`
    ALTER TABLE test_sessions
    DROP FOREIGN KEY fk_test_sessions_student
  `);
  console.log("  \u2705 Dropped FK: fk_test_sessions_student");
  await connection.execute(`
    ALTER TABLE test_sessions
    MODIFY COLUMN student_id VARCHAR(191) NULL
  `);
  console.log("  \u2705 Modified column: student_id is now nullable");
  await connection.execute(`
    ALTER TABLE test_sessions
    ADD CONSTRAINT fk_test_sessions_student
    FOREIGN KEY (student_id) REFERENCES students(id)
    ON DELETE SET NULL
  `);
  console.log("  \u2705 Recreated FK: fk_test_sessions_student with ON DELETE SET NULL");
  await connection.execute(`
    CREATE INDEX idx_test_sessions_preview_user 
    ON test_sessions(preview_user_id)
  `);
  console.log("  \u2705 Added index: idx_test_sessions_preview_user");
  console.log("\u2705 Migration 20260105_031_preview_sessions_nullable_student completed");
}
async function down$3(connection) {
  console.log("\u{1F504} Rolling back migration: 20260105_031_preview_sessions_nullable_student");
  await connection.execute(`
    DELETE FROM test_sessions WHERE is_preview = TRUE OR student_id IS NULL
  `);
  console.log("  \u2705 Deleted preview sessions");
  await connection.execute(`
    DROP INDEX idx_test_sessions_preview_user ON test_sessions
  `);
  console.log("  \u2705 Dropped index: idx_test_sessions_preview_user");
  await connection.execute(`
    ALTER TABLE test_sessions
    DROP FOREIGN KEY fk_test_sessions_preview_user
  `);
  console.log("  \u2705 Dropped FK: fk_test_sessions_preview_user");
  await connection.execute(`
    ALTER TABLE test_sessions
    DROP COLUMN preview_user_id
  `);
  console.log("  \u2705 Dropped column: preview_user_id");
  await connection.execute(`
    ALTER TABLE test_sessions
    DROP FOREIGN KEY fk_test_sessions_student
  `);
  console.log("  \u2705 Dropped FK: fk_test_sessions_student");
  await connection.execute(`
    ALTER TABLE test_sessions
    MODIFY COLUMN student_id VARCHAR(191) NOT NULL
  `);
  console.log("  \u2705 Modified column: student_id is now NOT NULL");
  await connection.execute(`
    ALTER TABLE test_sessions
    ADD CONSTRAINT fk_test_sessions_student
    FOREIGN KEY (student_id) REFERENCES students(id)
    ON DELETE CASCADE
  `);
  console.log("  \u2705 Recreated FK: fk_test_sessions_student with ON DELETE CASCADE");
  console.log("\u2705 Rollback 20260105_031_preview_sessions_nullable_student completed");
}

const description$2 = "\u0414\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043C\u043D\u043E\u0433\u043E\u044F\u0437\u044B\u0447\u043D\u043E\u0439 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0438: language \u0434\u043B\u044F \u0432\u043E\u043F\u0440\u043E\u0441\u043E\u0432 \u0438 \u0441\u0435\u0441\u0441\u0438\u0439, allowed_languages \u0434\u043B\u044F \u0448\u0430\u0431\u043B\u043E\u043D\u043E\u0432";
async function up$2(connection) {
  console.log("\u{1F504} Running migration: 20260105_032_multilang_questions");
  await connection.execute(`
        ALTER TABLE questions 
        ADD COLUMN language ENUM('en', 'ru', 'uz') NOT NULL DEFAULT 'ru' 
        COMMENT '\u042F\u0437\u044B\u043A \u0432\u043E\u043F\u0440\u043E\u0441\u0430: en=English, ru=\u0420\u0443\u0441\u0441\u043A\u0438\u0439, uz=O''zbek'
        AFTER difficulty
    `);
  console.log("  \u2705 Added column: questions.language (default: ru)");
  await connection.execute(`
        CREATE INDEX idx_questions_language ON questions(language)
    `);
  console.log("  \u2705 Added index: idx_questions_language");
  await connection.execute(`
        CREATE INDEX idx_questions_bank_language ON questions(bank_id, language)
    `);
  console.log("  \u2705 Added index: idx_questions_bank_language");
  await connection.execute(`
        ALTER TABLE test_templates 
        ADD COLUMN allowed_languages JSON DEFAULT NULL 
        COMMENT '\u0420\u0430\u0437\u0440\u0435\u0448\u0451\u043D\u043D\u044B\u0435 \u044F\u0437\u044B\u043A\u0438 \u0442\u0435\u0441\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F: ["ru", "uz", "en"]. NULL = \u0432\u0441\u0435 \u044F\u0437\u044B\u043A\u0438'
        AFTER proctoring_settings
    `);
  console.log("  \u2705 Added column: test_templates.allowed_languages");
  try {
    await connection.execute(`
            ALTER TABLE test_sessions 
            ADD COLUMN language ENUM('en', 'ru', 'uz') DEFAULT NULL 
            COMMENT '\u0412\u044B\u0431\u0440\u0430\u043D\u043D\u044B\u0439 \u044F\u0437\u044B\u043A \u0442\u0435\u0441\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F (\u0444\u0438\u043A\u0441\u0438\u0440\u0443\u0435\u0442\u0441\u044F \u043F\u0440\u0438 \u0441\u0442\u0430\u0440\u0442\u0435)'
            AFTER preview_user_id
        `);
  } catch {
    await connection.execute(`
            ALTER TABLE test_sessions 
            ADD COLUMN language ENUM('en', 'ru', 'uz') DEFAULT NULL 
            COMMENT '\u0412\u044B\u0431\u0440\u0430\u043D\u043D\u044B\u0439 \u044F\u0437\u044B\u043A \u0442\u0435\u0441\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F (\u0444\u0438\u043A\u0441\u0438\u0440\u0443\u0435\u0442\u0441\u044F \u043F\u0440\u0438 \u0441\u0442\u0430\u0440\u0442\u0435)'
            AFTER violations
        `);
  }
  console.log("  \u2705 Added column: test_sessions.language");
  await connection.execute(`
        CREATE INDEX idx_test_sessions_language ON test_sessions(language)
    `);
  console.log("  \u2705 Added index: idx_test_sessions_language");
  console.log("\u2705 Migration 20260105_032_multilang_questions completed");
}
async function down$2(connection) {
  console.log("\u{1F504} Rolling back migration: 20260105_032_multilang_questions");
  await connection.execute(`
        DROP INDEX idx_test_sessions_language ON test_sessions
    `);
  console.log("  \u2705 Dropped index: idx_test_sessions_language");
  await connection.execute(`
        ALTER TABLE test_sessions DROP COLUMN language
    `);
  console.log("  \u2705 Dropped column: test_sessions.language");
  await connection.execute(`
        ALTER TABLE test_templates DROP COLUMN allowed_languages
    `);
  console.log("  \u2705 Dropped column: test_templates.allowed_languages");
  await connection.execute(`
        DROP INDEX idx_questions_bank_language ON questions
    `);
  console.log("  \u2705 Dropped index: idx_questions_bank_language");
  await connection.execute(`
        DROP INDEX idx_questions_language ON questions
    `);
  console.log("  \u2705 Dropped index: idx_questions_language");
  await connection.execute(`
        ALTER TABLE questions DROP COLUMN language
    `);
  console.log("  \u2705 Dropped column: questions.language");
  console.log("\u2705 Rollback 20260105_032_multilang_questions completed");
}

const description$1 = "\u0414\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043F\u043E\u043B\u0435\u0439 \u0434\u043B\u044F \u043E\u0446\u0435\u043D\u043E\u043A \u0438\u0437 \u0442\u0435\u0441\u0442\u043E\u0432 \u0438 \u043E\u0442\u0441\u043B\u0435\u0436\u0438\u0432\u0430\u043D\u0438\u044F \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0439";
async function up$1(connection) {
  console.log("  Adding test-related fields to grades table...");
  await connection.query(`
    ALTER TABLE grades
    ADD COLUMN is_from_test BOOLEAN NOT NULL DEFAULT FALSE 
    COMMENT '\u041E\u0446\u0435\u043D\u043A\u0430 \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u0432\u044B\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u0430 \u0438\u0437 \u0442\u0435\u0441\u0442\u0430'
    AFTER grade
  `);
  console.log("  \u2705 Added column: is_from_test");
  await connection.query(`
    ALTER TABLE grades
    ADD COLUMN test_session_id VARCHAR(191) NULL 
    COMMENT 'ID \u0441\u0435\u0441\u0441\u0438\u0438 \u0442\u0435\u0441\u0442\u0430 (\u0435\u0441\u043B\u0438 \u043E\u0446\u0435\u043D\u043A\u0430 \u0438\u0437 \u0442\u0435\u0441\u0442\u0430)'
    AFTER is_from_test
  `);
  console.log("  \u2705 Added column: test_session_id");
  await connection.query(`
    ALTER TABLE grades
    ADD COLUMN original_grade INT NULL 
    COMMENT '\u0418\u0441\u0445\u043E\u0434\u043D\u0430\u044F \u043E\u0446\u0435\u043D\u043A\u0430 \u0438\u0437 \u0442\u0435\u0441\u0442\u0430 (\u0434\u043E \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440\u043E\u043C)'
    AFTER test_session_id
  `);
  console.log("  \u2705 Added column: original_grade");
  await connection.query(`
    ALTER TABLE grades
    ADD COLUMN is_modified BOOLEAN NOT NULL DEFAULT FALSE 
    COMMENT '\u041E\u0446\u0435\u043D\u043A\u0430 \u0431\u044B\u043B\u0430 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0430 \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440\u043E\u043C \u0432\u0440\u0443\u0447\u043D\u0443\u044E'
    AFTER original_grade
  `);
  console.log("  \u2705 Added column: is_modified");
  await connection.query(`
    ALTER TABLE grades
    ADD COLUMN modified_by VARCHAR(191) NULL 
    COMMENT '\u041A\u0442\u043E \u0438\u0437\u043C\u0435\u043D\u0438\u043B \u043E\u0446\u0435\u043D\u043A\u0443'
    AFTER is_modified
  `);
  console.log("  \u2705 Added column: modified_by");
  await connection.query(`
    ALTER TABLE grades
    ADD COLUMN modified_at DATETIME(3) NULL 
    COMMENT '\u041A\u043E\u0433\u0434\u0430 \u0431\u044B\u043B\u0430 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0430 \u043E\u0446\u0435\u043D\u043A\u0430'
    AFTER modified_by
  `);
  console.log("  \u2705 Added column: modified_at");
  await connection.query(`
    CREATE INDEX idx_grades_from_test ON grades(is_from_test)
  `);
  console.log("  \u2705 Added index: idx_grades_from_test");
  await connection.query(`
    CREATE INDEX idx_grades_modified ON grades(is_modified)
  `);
  console.log("  \u2705 Added index: idx_grades_modified");
  await connection.query(`
    ALTER TABLE grades
    ADD CONSTRAINT fk_grades_test_session
    FOREIGN KEY (test_session_id) REFERENCES test_sessions(id)
    ON DELETE SET NULL ON UPDATE CASCADE
  `);
  console.log("  \u2705 Added FK: fk_grades_test_session");
  await connection.query(`
    ALTER TABLE grades
    ADD CONSTRAINT fk_grades_modified_by
    FOREIGN KEY (modified_by) REFERENCES users(id)
    ON DELETE SET NULL ON UPDATE CASCADE
  `);
  console.log("  \u2705 Added FK: fk_grades_modified_by");
  console.log("  \u2705 Migration 033 completed: grades from test support added");
}
async function down$1(connection) {
  console.log("  Removing test-related fields from grades table...");
  try {
    await connection.query("ALTER TABLE grades DROP FOREIGN KEY fk_grades_modified_by");
  } catch (e) {
    console.log("  Note: FK fk_grades_modified_by may not exist");
  }
  try {
    await connection.query("ALTER TABLE grades DROP FOREIGN KEY fk_grades_test_session");
  } catch (e) {
    console.log("  Note: FK fk_grades_test_session may not exist");
  }
  try {
    await connection.query("DROP INDEX idx_grades_modified ON grades");
  } catch (e) {
    console.log("  Note: Index idx_grades_modified may not exist");
  }
  try {
    await connection.query("DROP INDEX idx_grades_from_test ON grades");
  } catch (e) {
    console.log("  Note: Index idx_grades_from_test may not exist");
  }
  await connection.query("ALTER TABLE grades DROP COLUMN IF EXISTS modified_at");
  await connection.query("ALTER TABLE grades DROP COLUMN IF EXISTS modified_by");
  await connection.query("ALTER TABLE grades DROP COLUMN IF EXISTS is_modified");
  await connection.query("ALTER TABLE grades DROP COLUMN IF EXISTS original_grade");
  await connection.query("ALTER TABLE grades DROP COLUMN IF EXISTS test_session_id");
  await connection.query("ALTER TABLE grades DROP COLUMN IF EXISTS is_from_test");
  console.log("  \u2705 Migration 033 rolled back");
}

const up = async (connection) => {
  console.log("\u{1F504} Running migration: certificate_standalone");
  try {
    await connection.query(`
      ALTER TABLE issued_certificates 
      DROP INDEX idx_student_group
    `);
    console.log("\u2705 Dropped unique index idx_student_group");
  } catch (error) {
    if (!error.message?.includes("check that it exists")) {
      console.log("\u2139\uFE0F  Index idx_student_group already removed or does not exist");
    }
  }
  try {
    await connection.query(`
      ALTER TABLE issued_certificates 
      DROP FOREIGN KEY fk_issued_cert_group
    `);
    console.log("\u2705 Dropped foreign key fk_issued_cert_group");
  } catch (error) {
    console.log("\u2139\uFE0F  Foreign key fk_issued_cert_group already removed or does not exist");
  }
  try {
    await connection.query(`
      ALTER TABLE issued_certificates 
      DROP FOREIGN KEY fk_issued_cert_template
    `);
    console.log("\u2705 Dropped foreign key fk_issued_cert_template");
  } catch (error) {
    console.log("\u2139\uFE0F  Foreign key fk_issued_cert_template already removed or does not exist");
  }
  await connection.query(`
    ALTER TABLE issued_certificates 
    MODIFY COLUMN group_id VARCHAR(191) NULL COMMENT 'ID \u0433\u0440\u0443\u043F\u043F\u044B (\u0434\u043B\u044F \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432 \u0438\u0437 \u0436\u0443\u0440\u043D\u0430\u043B\u0430)',
    MODIFY COLUMN template_id VARCHAR(191) NULL COMMENT 'ID \u0448\u0430\u0431\u043B\u043E\u043D\u0430 (\u0434\u043B\u044F \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432 \u0438\u0437 \u0436\u0443\u0440\u043D\u0430\u043B\u0430)'
  `);
  console.log("\u2705 Made group_id and template_id optional");
  await connection.query(`
    ALTER TABLE issued_certificates 
    ADD COLUMN course_name VARCHAR(255) NULL 
      COMMENT '\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043A\u0443\u0440\u0441\u0430 (\u0434\u043B\u044F standalone \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432)' AFTER template_id,
    ADD COLUMN course_code VARCHAR(50) NULL 
      COMMENT '\u041A\u043E\u0434 \u043A\u0443\u0440\u0441\u0430' AFTER course_name,
    ADD COLUMN course_hours INT NULL 
      COMMENT '\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u0447\u0430\u0441\u043E\u0432 \u043A\u0443\u0440\u0441\u0430' AFTER course_code,
    ADD COLUMN group_code VARCHAR(50) NULL 
      COMMENT '\u041A\u043E\u0434 \u0433\u0440\u0443\u043F\u043F\u044B (\u0442\u0435\u043A\u0441\u0442)' AFTER course_hours,
    ADD COLUMN group_start_date DATE NULL 
      COMMENT '\u0414\u0430\u0442\u0430 \u043D\u0430\u0447\u0430\u043B\u0430 \u043E\u0431\u0443\u0447\u0435\u043D\u0438\u044F' AFTER group_code,
    ADD COLUMN group_end_date DATE NULL 
      COMMENT '\u0414\u0430\u0442\u0430 \u043E\u043A\u043E\u043D\u0447\u0430\u043D\u0438\u044F \u043E\u0431\u0443\u0447\u0435\u043D\u0438\u044F' AFTER group_start_date,
    ADD COLUMN source_type ENUM('group_journal', 'manual', 'import') 
      NOT NULL DEFAULT 'group_journal' 
      COMMENT '\u0418\u0441\u0442\u043E\u0447\u043D\u0438\u043A \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430' AFTER group_end_date
  `);
  console.log("\u2705 Added standalone fields and source_type");
  await connection.query(`
    ALTER TABLE issued_certificates 
    ADD INDEX idx_source_type (source_type)
  `);
  console.log("\u2705 Added index for source_type");
  await connection.query(`
    ALTER TABLE issued_certificates 
    ADD INDEX idx_student_source (student_id, source_type)
  `);
  console.log("\u2705 Added composite index for student_id + source_type");
  const [updateResult] = await connection.query(`
    UPDATE issued_certificates 
    SET source_type = 'group_journal' 
    WHERE group_id IS NOT NULL AND template_id IS NOT NULL
  `);
  console.log(`\u2705 Updated existing certificates to source_type = 'group_journal'`, updateResult);
  try {
    await connection.query(`
      ALTER TABLE issued_certificates 
      ADD CONSTRAINT fk_issued_cert_group 
        FOREIGN KEY (group_id) REFERENCES study_groups(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
    `);
    console.log("\u2705 Re-added foreign key fk_issued_cert_group (with SET NULL on delete)");
  } catch (error) {
    console.log("\u26A0\uFE0F  Could not add foreign key fk_issued_cert_group:", error.message);
  }
  try {
    await connection.query(`
      ALTER TABLE issued_certificates 
      ADD CONSTRAINT fk_issued_cert_template 
        FOREIGN KEY (template_id) REFERENCES certificate_templates(id) 
        ON DELETE SET NULL ON UPDATE CASCADE
    `);
    console.log("\u2705 Re-added foreign key fk_issued_cert_template (with SET NULL on delete)");
  } catch (error) {
    console.log("\u26A0\uFE0F  Could not add foreign key fk_issued_cert_template:", error.message);
  }
  console.log("\u2705 Migration completed successfully");
};
const down = async (connection) => {
  console.log("\u{1F504} Rolling back migration: certificate_standalone");
  try {
    await connection.query(`ALTER TABLE issued_certificates DROP INDEX idx_source_type`);
  } catch {
  }
  try {
    await connection.query(`ALTER TABLE issued_certificates DROP INDEX idx_student_source`);
  } catch {
  }
  await connection.query(`
    ALTER TABLE issued_certificates 
    DROP COLUMN IF EXISTS course_name,
    DROP COLUMN IF EXISTS course_code,
    DROP COLUMN IF EXISTS course_hours,
    DROP COLUMN IF EXISTS group_code,
    DROP COLUMN IF EXISTS group_start_date,
    DROP COLUMN IF EXISTS group_end_date,
    DROP COLUMN IF EXISTS source_type
  `);
  console.log("\u2705 Removed standalone fields");
  console.log("\u26A0\uFE0F  Cannot fully restore NOT NULL constraints without data loss");
  try {
    await connection.query(`
      ALTER TABLE issued_certificates 
      ADD UNIQUE INDEX idx_student_group (student_id, group_id)
    `);
    console.log("\u2705 Restored unique index idx_student_group");
  } catch (error) {
    console.log("\u26A0\uFE0F  Could not restore unique index idx_student_group:", error.message);
  }
  console.log("\u2705 Rollback completed");
};
const description = "\u041F\u043E\u0434\u0434\u0435\u0440\u0436\u043A\u0430 standalone \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432 (\u0438\u043C\u043F\u043E\u0440\u0442 \u0438 \u0440\u0443\u0447\u043D\u043E\u0435 \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u0438\u0435)";

const MIGRATIONS_REGISTRY = [
  // ============================================================
  // Консолидированная миграция - полная схема БД
  // Объединяет все предыдущие миграции в одну актуальную
  // ============================================================
  {
    name: "20251224_001_consolidated_schema",
    up: up$f,
    down: down$f,
    description: description$c
  },
  // ============================================================
  // Миграция 020: Посещаемость и оценки
  // ============================================================
  {
    name: "20251225_020_attendance_grades",
    up: up$e,
    down: down$e,
    description: description$b
  },
  // ============================================================
  // Миграция 021: Расширение шаблонов сертификатов
  // ============================================================
  {
    name: "20251226_021_certificate_templates_extended",
    up: up$d,
    down: down$d,
    description: description$a
  },
  // ============================================================
  // Миграция 022: Визуальный редактор сертификатов
  // ============================================================
  {
    name: "20251226_022_certificate_visual_editor",
    up: up$c,
    down: down$c,
    description: description$9
  },
  // ============================================================
  // Миграция 023: Срок действия сертификатов и разрешения представителей
  // ============================================================
  {
    name: "20251229_023_certificate_validity_and_permissions",
    up: up$b,
    down: down$b,
    description: description$8
  },
  // ============================================================
  // Миграция 024: Журнал запросов Telegram-бота
  // ============================================================
  {
    name: "20251229_024_telegram_bot_requests",
    up: up$a,
    down: down$a,
    description: description$7
  },
  // ============================================================
  // Миграция 025: Объединение таблиц сертификатов
  // ============================================================
  {
    name: "20251229_025_unify_certificates",
    up: up$9,
    down: down$9,
    description: description$6
  },
  // ============================================================
  // Миграция 026: Связь Users с Students/Instructors для системы разрешений
  // ============================================================
  {
    name: "20251230_026_user_entity_links",
    up: up$8,
    down: down$8,
    description: description$5
  },
  // ============================================================
  // Миграция 027: Расширение ENUM для activity_logs
  // ============================================================
  {
    name: "20260103_027_activity_log_enum_expansion",
    up: up$7,
    down: down$7,
    description: description$4
  },
  // ============================================================
  // Миграция 028: Система тестирования студентов
  // ============================================================
  {
    name: "20260104_028_testing_system",
    up: up$6,
    down: down$6,
    description: description$3
  },
  // ============================================================
  // Миграция 029: Режим предпросмотра тестов
  // ============================================================
  {
    name: "20260105_029_test_preview_mode",
    up: up$5,
    down: down$5,
    description: name$2
  },
  // ============================================================
  // Миграция 030: Nullable assignment_id для preview-сессий
  // ============================================================
  {
    name: "20260105_030_preview_sessions_nullable_assignment",
    up: up$4,
    down: down$4,
    description: name$1
  },
  // ============================================================
  // Миграция 031: Nullable student_id для preview-сессий
  // ============================================================
  {
    name: "20260105_031_preview_sessions_nullable_student",
    up: up$3,
    down: down$3,
    description: name
  },
  // ============================================================
  // Миграция 032: Многоязычная поддержка вопросов
  // ============================================================
  {
    name: "20260105_032_multilang_questions",
    up: up$2,
    down: down$2,
    description: description$2
  },
  // ============================================================
  // Миграция 033: Поддержка оценок из тестов
  // ============================================================
  {
    name: "20260106_033_grades_from_test",
    up: up$1,
    down: down$1,
    description: description$1
  },
  // ============================================================
  // Миграция 034: Поддержка standalone сертификатов (импорт, ручное добавление)
  // ============================================================
  {
    name: "20260106_034_certificate_standalone",
    up: up,
    down: down,
    description: description
  }
  // ============================================================
  // Новые миграции добавлять ниже
  // ============================================================
];
const LEGACY_MIGRATIONS_INCLUDED_IN_CONSOLIDATED = [
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
  "20251224_016_create_schedule_settings_table"
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
  console.log(`\u{1F4CB} Loaded ${MIGRATIONS_REGISTRY.length} migrations from static registry`);
  return MIGRATIONS_REGISTRY;
}
function hasLegacyMigrationsApplied(executedMigrations) {
  return executedMigrations.some((m) => LEGACY_MIGRATIONS_INCLUDED_IN_CONSOLIDATED.includes(m));
}
async function consolidateMigrationRecords(connection) {
  console.log("\u{1F504} Consolidating old migration records...");
  for (const legacyMigration of LEGACY_MIGRATIONS_INCLUDED_IN_CONSOLIDATED) {
    await connection.query("DELETE FROM migrations WHERE name = ?", [legacyMigration]);
  }
  await connection.query(
    `INSERT IGNORE INTO migrations (name, description) VALUES (?, ?)`,
    ["20251224_001_consolidated_schema", description$c]
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
      let executedMigrations = await getExecutedMigrations(connection);
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
      console.log(`\u{1F504} Running ${pendingMigrations.length} pending migrations...`);
      for (const migration of pendingMigrations) {
        console.log(`
\u{1F4E6} Migration: ${migration.name}`);
        if (migration.description) {
          console.log(`   ${migration.description}`);
        }
        await connection.beginTransaction();
        try {
          await migration.up(connection);
          await recordMigration(connection, migration.name, migration.description);
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
const _gpkz_zHqxn7AWTiMFOTu68Ov9KAWhLxu7BfOEn5KwaE = defineNitroPlugin((nitroApp) => {
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
  const byGroup = students.reduce((acc, student) => {
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
  }, {});
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
  const byDate = events.reduce((acc, event) => {
    if (!acc[event.date]) {
      acc[event.date] = [];
    }
    acc[event.date].push(event);
    return acc;
  }, {});
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
  const byCourse = certificates.reduce((acc, cert) => {
    const key = `${cert.courseName} (${cert.groupCode})`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(cert);
    return acc;
  }, {});
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
      console.warn("[TelegramBot] TELEGRAM_BOT_TOKEN \u043D\u0435 \u0437\u0430\u0434\u0430\u043D \u0432 \u043F\u0435\u0440\u0435\u043C\u0435\u043D\u043D\u044B\u0445 \u043E\u043A\u0440\u0443\u0436\u0435\u043D\u0438\u044F");
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
    console.error("[TelegramBot] \u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0438 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F \u0441 \u043A\u043E\u043D\u0442\u0430\u043A\u0442\u043E\u043C:", error);
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
    conditions.push("(r.full_name LIKE ? OR r.phone LIKE ? OR r.telegram_username LIKE ? OR o.name LIKE ?)");
    const searchPattern = `%${search}%`;
    queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
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
    shortName: row.short_name,
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
    conditions.push("(name LIKE ? OR short_name LIKE ? OR code LIKE ?)");
    const searchPattern = `%${search}%`;
    queryParams.push(searchPattern, searchPattern, searchPattern);
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
  const rows = await executeQuery(
    dataQuery,
    [...queryParams, limit, offset]
  );
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
     WHERE name LIKE ? OR short_name LIKE ?
     ORDER BY name ASC
     LIMIT ?`,
    [`%${query}%`, `%${query}%`, limit]
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
     (id, code, name, short_name, contact_phone, contact_email, address, description, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      code,
      data.name.trim(),
      data.shortName?.trim() || null,
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
  if (data.shortName !== void 0) {
    updates.push("short_name = ?");
    params.push(data.shortName?.trim() || null);
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
async function getOrCreateOrganizationByName(name) {
  const trimmedName = name.trim();
  const existing = await getOrganizationByName(trimmedName);
  if (existing) {
    return existing;
  }
  return createOrganization({ name: trimmedName });
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
  const cleanCommand = command.split("@")[0].toLowerCase();
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
      await sendMessage(chatId, BOT_MESSAGES.STATUS_BLOCKED(representative.blockedReason || ""));
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
    await sendMessage(chatId, "\u{1F6AB} *\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0430*\n\n\u0423 \u0432\u0430\u0441 \u043D\u0435\u0442 \u0440\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u0438\u044F \u043D\u0430 \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440 \u0441\u043F\u0438\u0441\u043A\u0430 \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0435\u0439. \u041E\u0431\u0440\u0430\u0442\u0438\u0442\u0435\u0441\u044C \u043A \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0443 \u0443\u0447\u0435\u0431\u043D\u043E\u0433\u043E \u0446\u0435\u043D\u0442\u0440\u0430.");
    const { logBotRequest } = await import('../_/botLogger.mjs');
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
    const students = await getStudentsForRepresentative(representative);
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
    await sendMessage(chatId, "\u{1F465} *\u0421\u043F\u0438\u0441\u043E\u043A \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0435\u0439*\n\n\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043A\u0443\u0440\u0441 \u0434\u043B\u044F \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0430:", { replyMarkup: keyboard });
    await updateLastActivity(representative.id);
    const { logBotRequest } = await import('../_/botLogger.mjs');
    await logBotRequest({
      representativeId: representative.id,
      chatId,
      command: "/students",
      status: "success",
      requestData: { studentsCount: students.length, coursesCount: courses.size },
      responseTimeMs: Date.now() - startTime
    });
    console.log(`[TelegramBot] \u0421\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0438: \u043F\u043E\u043A\u0430\u0437\u0430\u043D\u044B \u043A\u0443\u0440\u0441\u044B (${courses.size}) \u0434\u043B\u044F chatId: ${chatId}`);
  } catch (error) {
    console.error("[TelegramBot] \u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0441\u0442\u0443\u0434\u0435\u043D\u0442\u043E\u0432:", error);
    await sendMessage(chatId, BOT_MESSAGES.ERROR_GENERAL);
    const { logBotRequest } = await import('../_/botLogger.mjs');
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
    await sendMessage(chatId, "\u{1F6AB} *\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0430*\n\n\u0423 \u0432\u0430\u0441 \u043D\u0435\u0442 \u0440\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u0438\u044F \u043D\u0430 \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440 \u0440\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u044F. \u041E\u0431\u0440\u0430\u0442\u0438\u0442\u0435\u0441\u044C \u043A \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0443 \u0443\u0447\u0435\u0431\u043D\u043E\u0433\u043E \u0446\u0435\u043D\u0442\u0440\u0430.");
    const { logBotRequest } = await import('../_/botLogger.mjs');
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
    const schedule = await getScheduleForRepresentative(representative);
    const message = formatSchedule(schedule);
    await sendMessage(chatId, message);
    await updateLastActivity(representative.id);
    const { logBotRequest } = await import('../_/botLogger.mjs');
    await logBotRequest({
      representativeId: representative.id,
      chatId,
      command: "/schedule",
      status: "success",
      requestData: { eventsCount: schedule.length },
      responseTimeMs: Date.now() - startTime
    });
  } catch (error) {
    console.error("[TelegramBot] \u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0440\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u044F:", error);
    await sendMessage(chatId, BOT_MESSAGES.ERROR_GENERAL);
    const { logBotRequest } = await import('../_/botLogger.mjs');
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
    await sendMessage(chatId, "\u{1F6AB} *\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0430*\n\n\u0423 \u0432\u0430\u0441 \u043D\u0435\u0442 \u0440\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u0438\u044F \u043D\u0430 \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432. \u041E\u0431\u0440\u0430\u0442\u0438\u0442\u0435\u0441\u044C \u043A \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0443 \u0443\u0447\u0435\u0431\u043D\u043E\u0433\u043E \u0446\u0435\u043D\u0442\u0440\u0430.");
    const { logBotRequest } = await import('../_/botLogger.mjs');
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
    const certificates = await getCertificatesForRepresentative(representative);
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
    await sendMessage(chatId, "\u{1F4DC} *\u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u044B \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0435\u0439*\n\n\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043F\u0435\u0440\u0438\u043E\u0434 \u0434\u043B\u044F \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0430 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432:", { replyMarkup: keyboard });
    await updateLastActivity(representative.id);
    const { logBotRequest } = await import('../_/botLogger.mjs');
    await logBotRequest({
      representativeId: representative.id,
      chatId,
      command: "/certificates",
      status: "success",
      requestData: { certificatesCount: certificates.length, periodsCount: sortedPeriods.length },
      responseTimeMs: Date.now() - startTime
    });
    console.log(`[TelegramBot] \u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u044B: \u043F\u043E\u043A\u0430\u0437\u0430\u043D\u044B \u043F\u0435\u0440\u0438\u043E\u0434\u044B (${sortedPeriods.length}) \u0434\u043B\u044F chatId: ${chatId}`);
  } catch (error) {
    console.error("[TelegramBot] \u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432:", error);
    await sendMessage(chatId, BOT_MESSAGES.ERROR_GENERAL);
    const { logBotRequest } = await import('../_/botLogger.mjs');
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
    await sendMessage(chatId, BOT_MESSAGES.ASK_ORGANIZATION, { replyMarkup: keyboard });
  } else {
    await sendMessage(chatId, BOT_MESSAGES.ASK_ORGANIZATION);
  }
  console.log(`[TelegramBot] chatId ${chatId}: \u0442\u0435\u043B\u0435\u0444\u043E\u043D \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D - ${normalized}`);
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
    console.log(`[TelegramBot] chatId ${chatId}: \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F \u0432\u044B\u0431\u0440\u0430\u043D\u0430 - ${organization.name}`);
  } catch (error) {
    console.error("[TelegramBot] \u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u043F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u0438\u0442\u0435\u043B\u044F:", error);
    await sendMessage(chatId, BOT_MESSAGES.ERROR_GENERAL);
  }
}
async function handleCallbackQuery(query) {
  const chatId = String(query.from.id);
  const data = query.data || "";
  console.log(`[TelegramBot] Callback \u043E\u0442 ${chatId}: ${data}`);
  const bot = getBot();
  if (bot) {
    await bot.api.answerCallbackQuery(query.id);
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
    await createRepresentativeFromSession(chatId, session.data, organization.id);
    console.log(`[TelegramBot] chatId ${chatId}: \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F \u0432\u044B\u0431\u0440\u0430\u043D\u0430 \u043F\u043E ID - ${organization.name}`);
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
    await sendMessage(chatId, "\u{1F6AB} *\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0430*\n\n\u0423 \u0432\u0430\u0441 \u043D\u0435\u0442 \u0440\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u0438\u044F \u043D\u0430 \u0437\u0430\u043F\u0440\u043E\u0441 \u0444\u0430\u0439\u043B\u043E\u0432 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432. \u041E\u0431\u0440\u0430\u0442\u0438\u0442\u0435\u0441\u044C \u043A \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0443 \u0443\u0447\u0435\u0431\u043D\u043E\u0433\u043E \u0446\u0435\u043D\u0442\u0440\u0430.");
    return;
  }
  try {
    await sendMessage(chatId, BOT_MESSAGES.CERTIFICATE_REQUEST_RECEIVED);
    const certificates = await getCertificatesForRepresentative(representative);
    const issuedCerts = certificates.filter((c) => c.status === "issued" && c.pdfFileUrl);
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
            await sendMessage(chatId, BOT_MESSAGES.CERTIFICATE_SEND_ERROR(cert.studentName));
            continue;
          }
          await bot.api.sendDocument(chatId, new (await import('grammy')).InputFile(filePath), {
            caption: `\u{1F4DC} *\u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442*
${cert.studentName}
\u2116 ${cert.certificateNumber}
${cert.courseName}`,
            parse_mode: "Markdown"
          });
          await markCertificateAsSent(cert.id);
          sentCount++;
        }
      } catch (error) {
        console.error(`[TelegramBot] \u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0438 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430 ${cert.id}:`, error);
        await sendMessage(chatId, BOT_MESSAGES.CERTIFICATE_SEND_ERROR(cert.studentName));
      }
    }
    if (sentCount > 0) {
      await sendMessage(chatId, `\u2705 \u041E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E ${sentCount} \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432`);
      if (issuedCerts.length > 10) {
        await sendMessage(chatId, BOT_MESSAGES.CERTIFICATE_SENDING_LIMIT);
      }
    }
    await updateLastActivity(representative.id);
    console.log(`[TelegramBot] \u041E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043E ${sentCount} \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432 \u0434\u043B\u044F chatId: ${chatId}`);
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
    await sendMessage(chatId, "\u{1F6AB} *\u041D\u0435\u0442 \u0434\u043E\u0441\u0442\u0443\u043F\u0430*\n\n\u0423 \u0432\u0430\u0441 \u043D\u0435\u0442 \u0440\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u0438\u044F \u043D\u0430 \u0437\u0430\u043F\u0440\u043E\u0441 \u0444\u0430\u0439\u043B\u043E\u0432 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0432.");
    return;
  }
  try {
    const { executeQuery } = await Promise.resolve().then(function () { return db; });
    const { getOrganizationById: getOrganizationById2 } = await Promise.resolve().then(function () { return organizationRepository; });
    const organization = await getOrganizationById2(representative.organizationId);
    if (!organization) {
      await sendMessage(chatId, BOT_MESSAGES.ERROR_GENERAL);
      return;
    }
    const certs = await executeQuery(`
      SELECT ic.*, s.full_name as student_name, s.organization, c.name as course_name
      FROM issued_certificates ic
      JOIN students s ON ic.student_id = s.id
      JOIN study_groups g ON ic.group_id = g.id
      JOIN courses c ON g.course_id = c.id
      WHERE ic.id = ? AND s.organization = ?
    `, [certificateId, organization.name]);
    if (certs.length === 0) {
      await sendMessage(chatId, "\u274C \u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u0438\u043B\u0438 \u043D\u0435 \u043F\u0440\u0438\u043D\u0430\u0434\u043B\u0435\u0436\u0438\u0442 \u0432\u0430\u0448\u0435\u0439 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438");
      return;
    }
    const cert = certs[0];
    if (!cert.pdf_file_url) {
      await sendMessage(chatId, BOT_MESSAGES.CERTIFICATE_SEND_ERROR(cert.student_name));
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
      await sendMessage(chatId, BOT_MESSAGES.CERTIFICATE_SEND_ERROR(cert.student_name));
      return;
    }
    await bot.api.sendDocument(chatId, new (await import('grammy')).InputFile(filePath), {
      caption: `\u{1F4DC} *\u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442*
${cert.student_name}
\u2116 ${cert.certificate_number}
${cert.course_name}`,
      parse_mode: "Markdown"
    });
    await markCertificateAsSent(certificateId);
    await sendMessage(chatId, BOT_MESSAGES.CERTIFICATE_SENT(cert.student_name, cert.certificate_number));
    await updateLastActivity(representative.id);
    console.log(`[TelegramBot] \u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442 ${certificateId} \u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D \u0434\u043B\u044F chatId: ${chatId}`);
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
      keyboard.text("\u{1F4E5} \u041F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u0432\u0441\u0435 \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u044B", "get_all_certs");
      const issuedCerts = certificates.filter((c) => c.status === "issued" && c.pdfFileUrl);
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
    console.log(`[TelegramBot] \u041F\u043E\u043A\u0430\u0437\u0430\u043D\u044B \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u044B \u0437\u0430 \u043F\u0435\u0440\u0438\u043E\u0434 ${period} \u0434\u043B\u044F chatId: ${chatId}, \u043D\u0430\u0439\u0434\u0435\u043D\u043E: ${certificates.length}`);
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
      await sendMessage(chatId, "\u{1F4CB} \u0421\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0438 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B \u0434\u043B\u044F \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u043E\u0433\u043E \u043A\u0443\u0440\u0441\u0430.");
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
    console.log(`[TelegramBot] \u041F\u043E\u043A\u0430\u0437\u0430\u043D\u044B \u0441\u043B\u0443\u0448\u0430\u0442\u0435\u043B\u0438: \u043A\u0443\u0440\u0441=${courseName || "all"}, \u043F\u0435\u0440\u0438\u043E\u0434=${period}, \u043D\u0430\u0439\u0434\u0435\u043D\u043E: ${students.length}`);
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
    console.log(`[TelegramBot] \u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044F \u043F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u0438\u0442\u0435\u043B\u044F: ${representative.id}, \u0424\u0418\u041E: ${representative.fullName}, \u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F: ${organizationId}`);
    console.log(`[TelegramBot] \u0421\u043E\u0437\u0434\u0430\u043D\u0430 \u0437\u0430\u044F\u0432\u043A\u0430 \u043F\u0440\u0435\u0434\u0441\u0442\u0430\u0432\u0438\u0442\u0435\u043B\u044F: ${representative.id}`);
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
    return {
      date: startDate.toISOString().split("T")[0],
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
      console.warn("[TelegramBot] \u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0440\u0430\u0441\u043F\u0430\u0440\u0441\u0438\u0442\u044C warnings \u0434\u043B\u044F \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u0430:", row.id, e);
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

const _ye0NEfsOOJwAUXks6qLO3aMCTUbAShBWClOEYByVebE = defineNitroPlugin(async (nitroApp) => {
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
  _gpkz_zHqxn7AWTiMFOTu68Ov9KAWhLxu7BfOEn5KwaE,
_ye0NEfsOOJwAUXks6qLO3aMCTUbAShBWClOEYByVebE
];

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
  return parts[1];
}
function toPublicUser(user) {
  const { password_hash, ...publicUser } = user;
  return publicUser;
}
function createTokenPayload(user) {
  return {
    userId: user.id,
    email: user.email,
    role: user.role
  };
}

const auth = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  createTokenPayload: createTokenPayload,
  extractToken: extractToken,
  generateRefreshToken: generateRefreshToken,
  generateToken: generateToken,
  hashPassword: hashPassword,
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
  "/api/debug"
  // Debug endpoints (только для разработки!)
];
const ROLE_PROTECTED_ROUTES = {
  "/api/admin": [UserRole.ADMIN],
  "/api/users": [UserRole.ADMIN, UserRole.MANAGER],
  "/api/teachers": [UserRole.ADMIN, UserRole.MANAGER],
  "/api/students": [UserRole.ADMIN, UserRole.MANAGER, UserRole.TEACHER]
};
function isPublicRoute(path) {
  return PUBLIC_ROUTES.some((route) => path.startsWith(route));
}
function getRequiredRoles(path) {
  for (const [route, roles] of Object.entries(ROLE_PROTECTED_ROUTES)) {
    if (path.startsWith(route)) {
      return roles;
    }
  }
  return null;
}
function hasRequiredRole(userRole, requiredRoles) {
  return requiredRoles.includes(userRole);
}
const _A3tcEE = defineEventHandler(async (event) => {
  const path = event.path;
  if (!path.startsWith("/api")) {
    return;
  }
  if (isPublicRoute(path)) {
    return;
  }
  const authHeader = getHeader(event, "authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw createError$1({
      statusCode: 401,
      statusMessage: "Unauthorized",
      message: "\u0422\u043E\u043A\u0435\u043D \u043D\u0435 \u043F\u0440\u0435\u0434\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D. \u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F \u0430\u0443\u0442\u0435\u043D\u0442\u0438\u0444\u0438\u043A\u0430\u0446\u0438\u044F."
    });
  }
  const token = authHeader.substring(7);
  const payload = verifyToken(token);
  if (!payload) {
    throw createError$1({
      statusCode: 401,
      statusMessage: "Unauthorized",
      message: "\u041D\u0435\u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0439 \u0438\u043B\u0438 \u0438\u0441\u0442\u0435\u043A\u0448\u0438\u0439 \u0442\u043E\u043A\u0435\u043D."
    });
  }
  const requiredRoles = getRequiredRoles(path);
  if (requiredRoles && !hasRequiredRole(payload.role, requiredRoles)) {
    throw createError$1({
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

const _lazy_BenSys = () => import('../routes/api/index.get.mjs');
const _lazy_UJpMYS = () => import('../routes/api/activity-logs/user/_userId_.get.mjs');
const _lazy_waR5hI = () => import('../routes/api/index.post.mjs');
const _lazy_7DhW_J = () => import('../routes/api/attendance/journal.get.mjs');
const _lazy_pqzhUq = () => import('../routes/api/auth/login.post.mjs');
const _lazy_30c9_B = () => import('../routes/api/auth/logout.post.mjs');
const _lazy_ocon7u = () => import('../routes/api/auth/refresh.post.mjs');
const _lazy_Jqn9Wj = () => import('../routes/api/auth/register.post.mjs');
const _lazy_Hyih_J = () => import('../routes/api/auth/verify.get.mjs');
const _lazy_TKcfPb = () => import('../routes/api/certificates/_id_.delete.mjs');
const _lazy_mQC2IT = () => import('../routes/api/certificates/_id/revoke.patch.mjs');
const _lazy_gq1gPO = () => import('../routes/api/certificates/download/_id_.get.mjs');
const _lazy_RJmOhb = () => import('../routes/api/certificates/import/analyze.post.mjs');
const _lazy_ChjlqN = () => import('../routes/api/certificates/import/execute.post.mjs');
const _lazy_2xpMl6 = () => import('../routes/api/certificates/import/status/_id_.get.mjs');
const _lazy_oun7vB = () => import('../routes/api/index.get2.mjs');
const _lazy_eM_TKB = () => import('../routes/api/certificates/issue/_groupId_.get.mjs');
const _lazy_KUky59 = () => import('../routes/api/certificates/issue/_groupId_.post.mjs');
const _lazy_SmC5Rr = () => import('../routes/api/certificates/manual.post.mjs');
const _lazy_T1Tp7I = () => import('../routes/api/certificates/my.get.mjs');
const _lazy_ffVDl4 = () => import('../routes/api/certificates/templates/_id_.delete.mjs');
const _lazy_ZdRb_F = () => import('../routes/api/certificates/templates/_id_.get.mjs');
const _lazy_qTDtaz = () => import('../routes/api/certificates/templates/_id_.put.mjs');
const _lazy_HtQ5Ta = () => import('../routes/api/certificates/templates/_id/preview.get.mjs');
const _lazy_8uk7m1 = () => import('../routes/api/certificates/index.get.mjs');
const _lazy_wmyZvj = () => import('../routes/api/certificates/index.post.mjs');
const _lazy_avwzjZ = () => import('../routes/api/certificates/templates/sources.get.mjs');
const _lazy_b2xg46 = () => import('../routes/api/index.get3.mjs');
const _lazy_LjTE2j = () => import('../routes/api/courses/_id_.delete.mjs');
const _lazy_fvAB2D = () => import('../routes/api/courses/_id_.get.mjs');
const _lazy_XBCfSV = () => import('../routes/api/courses/_id_.put.mjs');
const _lazy_Q27yhh = () => import('../routes/api/courses/_id/disciplines.post.mjs');
const _lazy_O_syEX = () => import('../routes/api/courses/_id/disciplines/_disciplineId_.delete.mjs');
const _lazy_LTqFiY = () => import('../routes/api/courses/_id/disciplines/_disciplineId_.patch.mjs');
const _lazy_cdi94A = () => import('../routes/api/index.get4.mjs');
const _lazy_rEMFr0 = () => import('../routes/api/index.post2.mjs');
const _lazy_D41Mx4 = () => import('../routes/api/courses/templates.get.mjs');
const _lazy_NafhLA = () => import('../routes/api/db/init.get.mjs');
const _lazy_FWoKq9 = () => import('../routes/api/debug/fix-instructor-link.get.mjs');
const _lazy_14mRR2 = () => import('../routes/api/discipline-tests/_id_.delete.mjs');
const _lazy_M21QCm = () => import('../routes/api/discipline-tests/_id_.put.mjs');
const _lazy_jFNZRe = () => import('../routes/api/index.get5.mjs');
const _lazy_Qfhe2P = () => import('../routes/api/index.post3.mjs');
const _lazy_A2wLpn = () => import('../routes/api/files/_uuid_.delete.mjs');
const _lazy_oJ3v3v = () => import('../routes/api/files/_uuid_.get.mjs');
const _lazy_EsD_eN = () => import('../routes/api/files/_uuid/rename.put.mjs');
const _lazy_47pGU9 = () => import('../routes/api/index.get6.mjs');
const _lazy_ux5582 = () => import('../routes/api/files/sync.post.mjs');
const _lazy_fZoFPW = () => import('../routes/api/files/upload.post.mjs');
const _lazy_ki3SqX = () => import('../routes/api/index.post4.mjs');
const _lazy_fhrqGn = () => import('../routes/api/folders/_id/contents.get.mjs');
const _lazy_H2Vnzq = () => import('../routes/api/folders/_id/move.put.mjs');
const _lazy_hwLx7l = () => import('../routes/api/folders/_id/path.get.mjs');
const _lazy_8VXIy9 = () => import('../routes/api/folders/_id/remove-password.delete.mjs');
const _lazy_b70iR9 = () => import('../routes/api/folders/_id/rename.put.mjs');
const _lazy_fJOe_G = () => import('../routes/api/folders/_id/set-password.post.mjs');
const _lazy_A8oBr4 = () => import('../routes/api/folders/_id/verify-password.post.mjs');
const _lazy_pN0oxo = () => import('../routes/api/folders/by-name/_name_.get.mjs');
const _lazy_ev4YJT = () => import('../routes/api/index.get7.mjs');
const _lazy_cVW6zd = () => import('../routes/api/index.post5.mjs');
const _lazy_e1aZfO = () => import('../routes/api/index.post6.mjs');
const _lazy_P5wJhz = () => import('../routes/api/groups/_id_.delete.mjs');
const _lazy_l4zslZ = () => import('../routes/api/groups/_id_.get.mjs');
const _lazy_AcjFXs = () => import('../routes/api/groups/_id_.put.mjs');
const _lazy_ytSOpk = () => import('../routes/api/groups/_id/disciplines.get.mjs');
const _lazy_NA6lvg = () => import('../routes/api/groups/_id/students/_studentId_.delete.mjs');
const _lazy_qRiiBS = () => import('../routes/api/groups/_id/index.post.mjs');
const _lazy_Nw5dOb = () => import('../routes/api/groups/_id/students/transfer.post.mjs');
const _lazy_7OKM9o = () => import('../routes/api/index.get8.mjs');
const _lazy_3eWJ9q = () => import('../routes/api/index.post7.mjs');
const _lazy_EDHHGE = () => import('../routes/api/groups/select.get.mjs');
const _lazy_zP_dxB = () => import('../routes/api/instructors/_id_.delete.mjs');
const _lazy_SAarCw = () => import('../routes/api/instructors/_id_.get.mjs');
const _lazy_tJdZsE = () => import('../routes/api/instructors/_id_.put.mjs');
const _lazy_cpj386 = () => import('../routes/api/instructors/_id/course-history.get.mjs');
const _lazy_tTPI5m = () => import('../routes/api/instructors/_id/hours.get.mjs');
const _lazy_ioExaA = () => import('../routes/api/instructors/_id/hours/check.get.mjs');
const _lazy_izJvBB = () => import('../routes/api/instructors/all.get.mjs');
const _lazy_dxQbzG = () => import('../routes/api/index.get9.mjs');
const _lazy_2aqeTh = () => import('../routes/api/index.post8.mjs');
const _lazy_QrpV18 = () => import('../routes/api/organizations/_id_.delete.mjs');
const _lazy_7QGBpt = () => import('../routes/api/organizations/_id_.get.mjs');
const _lazy_maMvAc = () => import('../routes/api/organizations/_id_.put.mjs');
const _lazy_56bpZu = () => import('../routes/api/index.get10.mjs');
const _lazy_houJpA = () => import('../routes/api/index.post9.mjs');
const _lazy_4ZnhsD = () => import('../routes/api/organizations/search.get.mjs');
const _lazy_RATrjr = () => import('../routes/api/organizations/stats.get.mjs');
const _lazy_U29bYH = () => import('../routes/api/profile/activity.get.mjs');
const _lazy_Ft0xj3 = () => import('../routes/api/index.get11.mjs');
const _lazy_pwCu52 = () => import('../routes/api/index.put.mjs');
const _lazy_6i_T19 = () => import('../routes/api/profile/password.put.mjs');
const _lazy_FQ9hs5 = () => import('../routes/api/profile/stats/admin.get.mjs');
const _lazy_2nJxCP = () => import('../routes/api/representatives/_id_.delete.mjs');
const _lazy_esUqje = () => import('../routes/api/representatives/_id_.get.mjs');
const _lazy_MPhW8v = () => import('../routes/api/representatives/_id_.patch.mjs');
const _lazy_mZ3KNI = () => import('../routes/api/representatives/_id/approve.post.mjs');
const _lazy_KA53YA = () => import('../routes/api/representatives/_id/block.post.mjs');
const _lazy_f7uIRw = () => import('../routes/api/representatives/_id/requests.get.mjs');
const _lazy_AQb3Eo = () => import('../routes/api/index.get12.mjs');
const _lazy_hSzamN = () => import('../routes/api/representatives/pending.get.mjs');
const _lazy_1zYyqR = () => import('../routes/api/representatives/stats.get.mjs');
const _lazy_u4sgAJ = () => import('../routes/api/schedule/_id_.delete.mjs');
const _lazy_wwrOb6 = () => import('../routes/api/schedule/_id_.put.mjs');
const _lazy_1DUaOY = () => import('../routes/api/index.get13.mjs');
const _lazy_a_RhJW = () => import('../routes/api/index.post10.mjs');
const _lazy_Hayc2V = () => import('../routes/api/schedule/index.get.mjs');
const _lazy_tn83tT = () => import('../routes/api/schedule/index.put.mjs');
const _lazy_2Z6Wvd = () => import('../routes/api/schedule/index.get2.mjs');
const _lazy_Gs5isW = () => import('../routes/api/schedule/index.put2.mjs');
const _lazy_NYciAe = () => import('../routes/api/students/_id_.delete.mjs');
const _lazy_taakGp = () => import('../routes/api/students/_id_.get.mjs');
const _lazy_yk8eCv = () => import('../routes/api/students/_id_.put.mjs');
const _lazy_Neq_PD = () => import('../routes/api/students/_id/certificates.post.mjs');
const _lazy_H4Rc5O = () => import('../routes/api/students/_id/reset-password.post.mjs');
const _lazy_7TKAR6 = () => import('../routes/api/students/import/analyze.post.mjs');
const _lazy_E1c2f4 = () => import('../routes/api/students/import/execute.post.mjs');
const _lazy_TNPpwd = () => import('../routes/api/students/import/status/_jobId_.get.mjs');
const _lazy_t8ckNo = () => import('../routes/api/index.get14.mjs');
const _lazy_o7iH2F = () => import('../routes/api/index.post11.mjs');
const _lazy_h3P33A = () => import('../routes/api/telegram/send.post.mjs');
const _lazy_Fn3Y3a = () => import('../routes/api/telegram/setup-webhook.post.mjs');
const _lazy_fRSkTE = () => import('../routes/api/telegram/webhook-info.get.mjs');
const _lazy_8xhJ2Q = () => import('../routes/api/telegram/webhook.delete.mjs');
const _lazy_gjQtIC = () => import('../routes/api/telegram/webhook.post.mjs');
const _lazy_r5Dirz = () => import('../routes/api/test-bank/banks/_id_.delete.mjs');
const _lazy_hX4fco = () => import('../routes/api/test-bank/banks/_id_.get.mjs');
const _lazy_r1Vlij = () => import('../routes/api/test-bank/banks/_id_.put.mjs');
const _lazy_GesbCY = () => import('../routes/api/test-bank/banks/_id/validate-languages.get.mjs');
const _lazy_4YRX1a = () => import('../routes/api/test-bank/banks/categories.get.mjs');
const _lazy_9wHVvd = () => import('../routes/api/test-bank/index.get.mjs');
const _lazy_2dNl_6 = () => import('../routes/api/test-bank/index.post.mjs');
const _lazy_Rg89vc = () => import('../routes/api/test-bank/banks/select.get.mjs');
const _lazy_2koIOT = () => import('../routes/api/test-bank/questions/_id_.delete.mjs');
const _lazy_Dct1c0 = () => import('../routes/api/test-bank/questions/_id_.get.mjs');
const _lazy_lfgS3J = () => import('../routes/api/test-bank/questions/_id_.put.mjs');
const _lazy_QD9v0c = () => import('../routes/api/test-bank/questions/import.post.mjs');
const _lazy_zkywTQ = () => import('../routes/api/test-bank/index.get2.mjs');
const _lazy_h0DrSa = () => import('../routes/api/test-bank/index.post2.mjs');
const _lazy_uwBgmO = () => import('../routes/api/test-bank/questions/reorder.put.mjs');
const _lazy_0shWLb = () => import('../routes/api/test-bank/questions/stats-by-language.get.mjs');
const _lazy_FP6WP7 = () => import('../routes/api/test-bank/templates/_id_.delete.mjs');
const _lazy_JQqaOU = () => import('../routes/api/test-bank/templates/_id_.get.mjs');
const _lazy_bOVT_a = () => import('../routes/api/test-bank/templates/_id_.put.mjs');
const _lazy_khbZH2 = () => import('../routes/api/test-bank/templates/_id/analytics.get.mjs');
const _lazy_f6Zdn1 = () => import('../routes/api/test-bank/templates/_id/preview.post.mjs');
const _lazy_146waN = () => import('../routes/api/test-bank/templates/_id/questions.put.mjs');
const _lazy__8UMgc = () => import('../routes/api/test-bank/templates/_id/validate-languages.get.mjs');
const _lazy_qjJV38 = () => import('../routes/api/test-bank/index.get3.mjs');
const _lazy__Bhgzy = () => import('../routes/api/test-bank/index.post3.mjs');
const _lazy_QvuCQa = () => import('../routes/api/test-bank/templates/select.get.mjs');
const _lazy_Kr78Sz = () => import('../routes/api/test/check-instructor.get.mjs');
const _lazy_qhtE3Q = () => import('../routes/api/test/db-check.get.mjs');
const _lazy_i1oRsK = () => import('../routes/api/test/fix-instructor-link.post.mjs');
const _lazy_PjXEIk = () => import('../routes/api/test/permission-context.get.mjs');
const _lazy_45Yec1 = () => import('../routes/api/tests/assignments/_id_.delete.mjs');
const _lazy_eSUflL = () => import('../routes/api/tests/assignments/_id_.get.mjs');
const _lazy_j5IVV_ = () => import('../routes/api/tests/assignments/_id/available-languages.get.mjs');
const _lazy_sw1ine = () => import('../routes/api/tests/assignments/_id/results.get.mjs');
const _lazy_fMJver = () => import('../routes/api/tests/assignments/by-event/_eventId_.get.mjs');
const _lazy_jKGZh0 = () => import('../routes/api/tests/index.post.mjs');
const _lazy_2JnEhS = () => import('../routes/api/tests/my.get.mjs');
const _lazy_tb4JEa = () => import('../routes/api/tests/sessions/_id_.get.mjs');
const _lazy_Lz9Ldl = () => import('../routes/api/tests/sessions/_id/answer.post.mjs');
const _lazy_fLyE0S = () => import('../routes/api/tests/sessions/_id/details.get.mjs');
const _lazy_WnJkzl = () => import('../routes/api/tests/sessions/_id/finish.post.mjs');
const _lazy_KNRWQf = () => import('../routes/api/tests/sessions/_id/violation.post.mjs');
const _lazy_3xOmJy = () => import('../routes/api/tests/sessions/start.post.mjs');
const _lazy_KCJAgp = () => import('../routes/api/users/_id_.delete.mjs');
const _lazy_PBYOzV = () => import('../routes/api/users/_id_.get.mjs');
const _lazy_5z1LeN = () => import('../routes/api/users/_id_.put.mjs');
const _lazy_fMmrHc = () => import('../routes/api/index.get15.mjs');
const _lazy__pSRI0 = () => import('../routes/api/index.post12.mjs');
const _lazy_5NzYVg = () => import('../routes/renderer.mjs').then(function (n) { return n.r; });

const handlers = [
  { route: '', handler: _A3tcEE, lazy: false, middleware: true, method: undefined },
  { route: '/api/activity-logs', handler: _lazy_BenSys, lazy: true, middleware: false, method: "get" },
  { route: '/api/activity-logs/user/:userId', handler: _lazy_UJpMYS, lazy: true, middleware: false, method: "get" },
  { route: '/api/attendance', handler: _lazy_waR5hI, lazy: true, middleware: false, method: "post" },
  { route: '/api/attendance/journal', handler: _lazy_7DhW_J, lazy: true, middleware: false, method: "get" },
  { route: '/api/auth/login', handler: _lazy_pqzhUq, lazy: true, middleware: false, method: "post" },
  { route: '/api/auth/logout', handler: _lazy_30c9_B, lazy: true, middleware: false, method: "post" },
  { route: '/api/auth/refresh', handler: _lazy_ocon7u, lazy: true, middleware: false, method: "post" },
  { route: '/api/auth/register', handler: _lazy_Jqn9Wj, lazy: true, middleware: false, method: "post" },
  { route: '/api/auth/verify', handler: _lazy_Hyih_J, lazy: true, middleware: false, method: "get" },
  { route: '/api/certificates/:id', handler: _lazy_TKcfPb, lazy: true, middleware: false, method: "delete" },
  { route: '/api/certificates/:id/revoke', handler: _lazy_mQC2IT, lazy: true, middleware: false, method: "patch" },
  { route: '/api/certificates/download/:id', handler: _lazy_gq1gPO, lazy: true, middleware: false, method: "get" },
  { route: '/api/certificates/import/analyze', handler: _lazy_RJmOhb, lazy: true, middleware: false, method: "post" },
  { route: '/api/certificates/import/execute', handler: _lazy_ChjlqN, lazy: true, middleware: false, method: "post" },
  { route: '/api/certificates/import/status/:id', handler: _lazy_2xpMl6, lazy: true, middleware: false, method: "get" },
  { route: '/api/certificates', handler: _lazy_oun7vB, lazy: true, middleware: false, method: "get" },
  { route: '/api/certificates/issue/:groupId', handler: _lazy_eM_TKB, lazy: true, middleware: false, method: "get" },
  { route: '/api/certificates/issue/:groupId', handler: _lazy_KUky59, lazy: true, middleware: false, method: "post" },
  { route: '/api/certificates/manual', handler: _lazy_SmC5Rr, lazy: true, middleware: false, method: "post" },
  { route: '/api/certificates/my', handler: _lazy_T1Tp7I, lazy: true, middleware: false, method: "get" },
  { route: '/api/certificates/templates/:id', handler: _lazy_ffVDl4, lazy: true, middleware: false, method: "delete" },
  { route: '/api/certificates/templates/:id', handler: _lazy_ZdRb_F, lazy: true, middleware: false, method: "get" },
  { route: '/api/certificates/templates/:id', handler: _lazy_qTDtaz, lazy: true, middleware: false, method: "put" },
  { route: '/api/certificates/templates/:id/preview', handler: _lazy_HtQ5Ta, lazy: true, middleware: false, method: "get" },
  { route: '/api/certificates/templates', handler: _lazy_8uk7m1, lazy: true, middleware: false, method: "get" },
  { route: '/api/certificates/templates', handler: _lazy_wmyZvj, lazy: true, middleware: false, method: "post" },
  { route: '/api/certificates/templates/sources', handler: _lazy_avwzjZ, lazy: true, middleware: false, method: "get" },
  { route: '/api/classrooms', handler: _lazy_b2xg46, lazy: true, middleware: false, method: "get" },
  { route: '/api/courses/:id', handler: _lazy_LjTE2j, lazy: true, middleware: false, method: "delete" },
  { route: '/api/courses/:id', handler: _lazy_fvAB2D, lazy: true, middleware: false, method: "get" },
  { route: '/api/courses/:id', handler: _lazy_XBCfSV, lazy: true, middleware: false, method: "put" },
  { route: '/api/courses/:id/disciplines', handler: _lazy_Q27yhh, lazy: true, middleware: false, method: "post" },
  { route: '/api/courses/:id/disciplines/:disciplineId', handler: _lazy_O_syEX, lazy: true, middleware: false, method: "delete" },
  { route: '/api/courses/:id/disciplines/:disciplineId', handler: _lazy_LTqFiY, lazy: true, middleware: false, method: "patch" },
  { route: '/api/courses', handler: _lazy_cdi94A, lazy: true, middleware: false, method: "get" },
  { route: '/api/courses', handler: _lazy_rEMFr0, lazy: true, middleware: false, method: "post" },
  { route: '/api/courses/templates', handler: _lazy_D41Mx4, lazy: true, middleware: false, method: "get" },
  { route: '/api/db/init', handler: _lazy_NafhLA, lazy: true, middleware: false, method: "get" },
  { route: '/api/debug/fix-instructor-link', handler: _lazy_FWoKq9, lazy: true, middleware: false, method: "get" },
  { route: '/api/discipline-tests/:id', handler: _lazy_14mRR2, lazy: true, middleware: false, method: "delete" },
  { route: '/api/discipline-tests/:id', handler: _lazy_M21QCm, lazy: true, middleware: false, method: "put" },
  { route: '/api/discipline-tests', handler: _lazy_jFNZRe, lazy: true, middleware: false, method: "get" },
  { route: '/api/discipline-tests', handler: _lazy_Qfhe2P, lazy: true, middleware: false, method: "post" },
  { route: '/api/files/:uuid', handler: _lazy_A2wLpn, lazy: true, middleware: false, method: "delete" },
  { route: '/api/files/:uuid', handler: _lazy_oJ3v3v, lazy: true, middleware: false, method: "get" },
  { route: '/api/files/:uuid/rename', handler: _lazy_EsD_eN, lazy: true, middleware: false, method: "put" },
  { route: '/api/files', handler: _lazy_47pGU9, lazy: true, middleware: false, method: "get" },
  { route: '/api/files/sync', handler: _lazy_ux5582, lazy: true, middleware: false, method: "post" },
  { route: '/api/files/upload', handler: _lazy_fZoFPW, lazy: true, middleware: false, method: "post" },
  { route: '/api/final-grades', handler: _lazy_ki3SqX, lazy: true, middleware: false, method: "post" },
  { route: '/api/folders/:id/contents', handler: _lazy_fhrqGn, lazy: true, middleware: false, method: "get" },
  { route: '/api/folders/:id/move', handler: _lazy_H2Vnzq, lazy: true, middleware: false, method: "put" },
  { route: '/api/folders/:id/path', handler: _lazy_hwLx7l, lazy: true, middleware: false, method: "get" },
  { route: '/api/folders/:id/remove-password', handler: _lazy_8VXIy9, lazy: true, middleware: false, method: "delete" },
  { route: '/api/folders/:id/rename', handler: _lazy_b70iR9, lazy: true, middleware: false, method: "put" },
  { route: '/api/folders/:id/set-password', handler: _lazy_fJOe_G, lazy: true, middleware: false, method: "post" },
  { route: '/api/folders/:id/verify-password', handler: _lazy_A8oBr4, lazy: true, middleware: false, method: "post" },
  { route: '/api/folders/by-name/:name', handler: _lazy_pN0oxo, lazy: true, middleware: false, method: "get" },
  { route: '/api/folders', handler: _lazy_ev4YJT, lazy: true, middleware: false, method: "get" },
  { route: '/api/folders', handler: _lazy_cVW6zd, lazy: true, middleware: false, method: "post" },
  { route: '/api/grades', handler: _lazy_e1aZfO, lazy: true, middleware: false, method: "post" },
  { route: '/api/groups/:id', handler: _lazy_P5wJhz, lazy: true, middleware: false, method: "delete" },
  { route: '/api/groups/:id', handler: _lazy_l4zslZ, lazy: true, middleware: false, method: "get" },
  { route: '/api/groups/:id', handler: _lazy_AcjFXs, lazy: true, middleware: false, method: "put" },
  { route: '/api/groups/:id/disciplines', handler: _lazy_ytSOpk, lazy: true, middleware: false, method: "get" },
  { route: '/api/groups/:id/students/:studentId', handler: _lazy_NA6lvg, lazy: true, middleware: false, method: "delete" },
  { route: '/api/groups/:id/students', handler: _lazy_qRiiBS, lazy: true, middleware: false, method: "post" },
  { route: '/api/groups/:id/students/transfer', handler: _lazy_Nw5dOb, lazy: true, middleware: false, method: "post" },
  { route: '/api/groups', handler: _lazy_7OKM9o, lazy: true, middleware: false, method: "get" },
  { route: '/api/groups', handler: _lazy_3eWJ9q, lazy: true, middleware: false, method: "post" },
  { route: '/api/groups/select', handler: _lazy_EDHHGE, lazy: true, middleware: false, method: "get" },
  { route: '/api/instructors/:id', handler: _lazy_zP_dxB, lazy: true, middleware: false, method: "delete" },
  { route: '/api/instructors/:id', handler: _lazy_SAarCw, lazy: true, middleware: false, method: "get" },
  { route: '/api/instructors/:id', handler: _lazy_tJdZsE, lazy: true, middleware: false, method: "put" },
  { route: '/api/instructors/:id/course-history', handler: _lazy_cpj386, lazy: true, middleware: false, method: "get" },
  { route: '/api/instructors/:id/hours', handler: _lazy_tTPI5m, lazy: true, middleware: false, method: "get" },
  { route: '/api/instructors/:id/hours/check', handler: _lazy_ioExaA, lazy: true, middleware: false, method: "get" },
  { route: '/api/instructors/all', handler: _lazy_izJvBB, lazy: true, middleware: false, method: "get" },
  { route: '/api/instructors', handler: _lazy_dxQbzG, lazy: true, middleware: false, method: "get" },
  { route: '/api/instructors', handler: _lazy_2aqeTh, lazy: true, middleware: false, method: "post" },
  { route: '/api/organizations/:id', handler: _lazy_QrpV18, lazy: true, middleware: false, method: "delete" },
  { route: '/api/organizations/:id', handler: _lazy_7QGBpt, lazy: true, middleware: false, method: "get" },
  { route: '/api/organizations/:id', handler: _lazy_maMvAc, lazy: true, middleware: false, method: "put" },
  { route: '/api/organizations', handler: _lazy_56bpZu, lazy: true, middleware: false, method: "get" },
  { route: '/api/organizations', handler: _lazy_houJpA, lazy: true, middleware: false, method: "post" },
  { route: '/api/organizations/search', handler: _lazy_4ZnhsD, lazy: true, middleware: false, method: "get" },
  { route: '/api/organizations/stats', handler: _lazy_RATrjr, lazy: true, middleware: false, method: "get" },
  { route: '/api/profile/activity', handler: _lazy_U29bYH, lazy: true, middleware: false, method: "get" },
  { route: '/api/profile', handler: _lazy_Ft0xj3, lazy: true, middleware: false, method: "get" },
  { route: '/api/profile', handler: _lazy_pwCu52, lazy: true, middleware: false, method: "put" },
  { route: '/api/profile/password', handler: _lazy_6i_T19, lazy: true, middleware: false, method: "put" },
  { route: '/api/profile/stats/admin', handler: _lazy_FQ9hs5, lazy: true, middleware: false, method: "get" },
  { route: '/api/representatives/:id', handler: _lazy_2nJxCP, lazy: true, middleware: false, method: "delete" },
  { route: '/api/representatives/:id', handler: _lazy_esUqje, lazy: true, middleware: false, method: "get" },
  { route: '/api/representatives/:id', handler: _lazy_MPhW8v, lazy: true, middleware: false, method: "patch" },
  { route: '/api/representatives/:id/approve', handler: _lazy_mZ3KNI, lazy: true, middleware: false, method: "post" },
  { route: '/api/representatives/:id/block', handler: _lazy_KA53YA, lazy: true, middleware: false, method: "post" },
  { route: '/api/representatives/:id/requests', handler: _lazy_f7uIRw, lazy: true, middleware: false, method: "get" },
  { route: '/api/representatives', handler: _lazy_AQb3Eo, lazy: true, middleware: false, method: "get" },
  { route: '/api/representatives/pending', handler: _lazy_hSzamN, lazy: true, middleware: false, method: "get" },
  { route: '/api/representatives/stats', handler: _lazy_1zYyqR, lazy: true, middleware: false, method: "get" },
  { route: '/api/schedule/:id', handler: _lazy_u4sgAJ, lazy: true, middleware: false, method: "delete" },
  { route: '/api/schedule/:id', handler: _lazy_wwrOb6, lazy: true, middleware: false, method: "put" },
  { route: '/api/schedule', handler: _lazy_1DUaOY, lazy: true, middleware: false, method: "get" },
  { route: '/api/schedule', handler: _lazy_a_RhJW, lazy: true, middleware: false, method: "post" },
  { route: '/api/schedule/periods', handler: _lazy_Hayc2V, lazy: true, middleware: false, method: "get" },
  { route: '/api/schedule/periods', handler: _lazy_tn83tT, lazy: true, middleware: false, method: "put" },
  { route: '/api/schedule/settings', handler: _lazy_2Z6Wvd, lazy: true, middleware: false, method: "get" },
  { route: '/api/schedule/settings', handler: _lazy_Gs5isW, lazy: true, middleware: false, method: "put" },
  { route: '/api/students/:id', handler: _lazy_NYciAe, lazy: true, middleware: false, method: "delete" },
  { route: '/api/students/:id', handler: _lazy_taakGp, lazy: true, middleware: false, method: "get" },
  { route: '/api/students/:id', handler: _lazy_yk8eCv, lazy: true, middleware: false, method: "put" },
  { route: '/api/students/:id/certificates', handler: _lazy_Neq_PD, lazy: true, middleware: false, method: "post" },
  { route: '/api/students/:id/reset-password', handler: _lazy_H4Rc5O, lazy: true, middleware: false, method: "post" },
  { route: '/api/students/import/analyze', handler: _lazy_7TKAR6, lazy: true, middleware: false, method: "post" },
  { route: '/api/students/import/execute', handler: _lazy_E1c2f4, lazy: true, middleware: false, method: "post" },
  { route: '/api/students/import/status/:jobId', handler: _lazy_TNPpwd, lazy: true, middleware: false, method: "get" },
  { route: '/api/students', handler: _lazy_t8ckNo, lazy: true, middleware: false, method: "get" },
  { route: '/api/students', handler: _lazy_o7iH2F, lazy: true, middleware: false, method: "post" },
  { route: '/api/telegram/send', handler: _lazy_h3P33A, lazy: true, middleware: false, method: "post" },
  { route: '/api/telegram/setup-webhook', handler: _lazy_Fn3Y3a, lazy: true, middleware: false, method: "post" },
  { route: '/api/telegram/webhook-info', handler: _lazy_fRSkTE, lazy: true, middleware: false, method: "get" },
  { route: '/api/telegram/webhook', handler: _lazy_8xhJ2Q, lazy: true, middleware: false, method: "delete" },
  { route: '/api/telegram/webhook', handler: _lazy_gjQtIC, lazy: true, middleware: false, method: "post" },
  { route: '/api/test-bank/banks/:id', handler: _lazy_r5Dirz, lazy: true, middleware: false, method: "delete" },
  { route: '/api/test-bank/banks/:id', handler: _lazy_hX4fco, lazy: true, middleware: false, method: "get" },
  { route: '/api/test-bank/banks/:id', handler: _lazy_r1Vlij, lazy: true, middleware: false, method: "put" },
  { route: '/api/test-bank/banks/:id/validate-languages', handler: _lazy_GesbCY, lazy: true, middleware: false, method: "get" },
  { route: '/api/test-bank/banks/categories', handler: _lazy_4YRX1a, lazy: true, middleware: false, method: "get" },
  { route: '/api/test-bank/banks', handler: _lazy_9wHVvd, lazy: true, middleware: false, method: "get" },
  { route: '/api/test-bank/banks', handler: _lazy_2dNl_6, lazy: true, middleware: false, method: "post" },
  { route: '/api/test-bank/banks/select', handler: _lazy_Rg89vc, lazy: true, middleware: false, method: "get" },
  { route: '/api/test-bank/questions/:id', handler: _lazy_2koIOT, lazy: true, middleware: false, method: "delete" },
  { route: '/api/test-bank/questions/:id', handler: _lazy_Dct1c0, lazy: true, middleware: false, method: "get" },
  { route: '/api/test-bank/questions/:id', handler: _lazy_lfgS3J, lazy: true, middleware: false, method: "put" },
  { route: '/api/test-bank/questions/import', handler: _lazy_QD9v0c, lazy: true, middleware: false, method: "post" },
  { route: '/api/test-bank/questions', handler: _lazy_zkywTQ, lazy: true, middleware: false, method: "get" },
  { route: '/api/test-bank/questions', handler: _lazy_h0DrSa, lazy: true, middleware: false, method: "post" },
  { route: '/api/test-bank/questions/reorder', handler: _lazy_uwBgmO, lazy: true, middleware: false, method: "put" },
  { route: '/api/test-bank/questions/stats-by-language', handler: _lazy_0shWLb, lazy: true, middleware: false, method: "get" },
  { route: '/api/test-bank/templates/:id', handler: _lazy_FP6WP7, lazy: true, middleware: false, method: "delete" },
  { route: '/api/test-bank/templates/:id', handler: _lazy_JQqaOU, lazy: true, middleware: false, method: "get" },
  { route: '/api/test-bank/templates/:id', handler: _lazy_bOVT_a, lazy: true, middleware: false, method: "put" },
  { route: '/api/test-bank/templates/:id/analytics', handler: _lazy_khbZH2, lazy: true, middleware: false, method: "get" },
  { route: '/api/test-bank/templates/:id/preview', handler: _lazy_f6Zdn1, lazy: true, middleware: false, method: "post" },
  { route: '/api/test-bank/templates/:id/questions', handler: _lazy_146waN, lazy: true, middleware: false, method: "put" },
  { route: '/api/test-bank/templates/:id/validate-languages', handler: _lazy__8UMgc, lazy: true, middleware: false, method: "get" },
  { route: '/api/test-bank/templates', handler: _lazy_qjJV38, lazy: true, middleware: false, method: "get" },
  { route: '/api/test-bank/templates', handler: _lazy__Bhgzy, lazy: true, middleware: false, method: "post" },
  { route: '/api/test-bank/templates/select', handler: _lazy_QvuCQa, lazy: true, middleware: false, method: "get" },
  { route: '/api/test/check-instructor', handler: _lazy_Kr78Sz, lazy: true, middleware: false, method: "get" },
  { route: '/api/test/db-check', handler: _lazy_qhtE3Q, lazy: true, middleware: false, method: "get" },
  { route: '/api/test/fix-instructor-link', handler: _lazy_i1oRsK, lazy: true, middleware: false, method: "post" },
  { route: '/api/test/permission-context', handler: _lazy_PjXEIk, lazy: true, middleware: false, method: "get" },
  { route: '/api/tests/assignments/:id', handler: _lazy_45Yec1, lazy: true, middleware: false, method: "delete" },
  { route: '/api/tests/assignments/:id', handler: _lazy_eSUflL, lazy: true, middleware: false, method: "get" },
  { route: '/api/tests/assignments/:id/available-languages', handler: _lazy_j5IVV_, lazy: true, middleware: false, method: "get" },
  { route: '/api/tests/assignments/:id/results', handler: _lazy_sw1ine, lazy: true, middleware: false, method: "get" },
  { route: '/api/tests/assignments/by-event/:eventId', handler: _lazy_fMJver, lazy: true, middleware: false, method: "get" },
  { route: '/api/tests/assignments', handler: _lazy_jKGZh0, lazy: true, middleware: false, method: "post" },
  { route: '/api/tests/my', handler: _lazy_2JnEhS, lazy: true, middleware: false, method: "get" },
  { route: '/api/tests/sessions/:id', handler: _lazy_tb4JEa, lazy: true, middleware: false, method: "get" },
  { route: '/api/tests/sessions/:id/answer', handler: _lazy_Lz9Ldl, lazy: true, middleware: false, method: "post" },
  { route: '/api/tests/sessions/:id/details', handler: _lazy_fLyE0S, lazy: true, middleware: false, method: "get" },
  { route: '/api/tests/sessions/:id/finish', handler: _lazy_WnJkzl, lazy: true, middleware: false, method: "post" },
  { route: '/api/tests/sessions/:id/violation', handler: _lazy_KNRWQf, lazy: true, middleware: false, method: "post" },
  { route: '/api/tests/sessions/start', handler: _lazy_3xOmJy, lazy: true, middleware: false, method: "post" },
  { route: '/api/users/:id', handler: _lazy_KCJAgp, lazy: true, middleware: false, method: "delete" },
  { route: '/api/users/:id', handler: _lazy_PBYOzV, lazy: true, middleware: false, method: "get" },
  { route: '/api/users/:id', handler: _lazy_5z1LeN, lazy: true, middleware: false, method: "put" },
  { route: '/api/users', handler: _lazy_fMmrHc, lazy: true, middleware: false, method: "get" },
  { route: '/api/users', handler: _lazy__pSRI0, lazy: true, middleware: false, method: "post" },
  { route: '/__nuxt_error', handler: _lazy_5NzYVg, lazy: true, middleware: false, method: undefined },
  { route: '/__nuxt_island/**', handler: _SxA8c9, lazy: false, middleware: false, method: undefined },
  { route: '/**', handler: _lazy_5NzYVg, lazy: true, middleware: false, method: undefined }
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
      await nitroApp$1.hooks.callHook("request", event).catch((error) => {
        captureError(error, { event, tags: ["request"] });
      });
    },
    onBeforeResponse: async (event, response) => {
      await nitroApp$1.hooks.callHook("beforeResponse", event, response).catch((error) => {
        captureError(error, { event, tags: ["request", "response"] });
      });
    },
    onAfterResponse: async (event, response) => {
      await nitroApp$1.hooks.callHook("afterResponse", event, response).catch((error) => {
        captureError(error, { event, tags: ["request", "response"] });
      });
    }
  });
  const router = createRouter({
    preemptive: true
  });
  const nodeHandler = toNodeListener(h3App);
  const localCall = (aRequest) => b(
    nodeHandler,
    aRequest
  );
  const localFetch = (input, init) => {
    if (!input.toString().startsWith("/")) {
      return globalThis.fetch(input, init);
    }
    return C(
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
const nitroApp$1 = createNitroApp();
function useNitroApp() {
  return nitroApp$1;
}
runNitroPlugins(nitroApp$1);

function defineRenderHandler(render) {
  const runtimeConfig = useRuntimeConfig();
  return eventHandler(async (event) => {
    const nitroApp = useNitroApp();
    const ctx = { event, render, response: void 0 };
    await nitroApp.hooks.callHook("render:before", ctx);
    if (!ctx.response) {
      if (event.path === `${runtimeConfig.app.baseURL}favicon.ico`) {
        setResponseHeader(event, "Content-Type", "image/x-icon");
        return send(
          event,
          "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        );
      }
      ctx.response = await ctx.render(event);
      if (!ctx.response) {
        const _currentStatus = getResponseStatus(event);
        setResponseStatus(event, _currentStatus === 200 ? 500 : _currentStatus);
        return send(
          event,
          "No response returned from render handler: " + event.path
        );
      }
    }
    await nitroApp.hooks.callHook("render:response", ctx.response, ctx);
    if (ctx.response.headers) {
      setResponseHeaders(event, ctx.response.headers);
    }
    if (ctx.response.statusCode || ctx.response.statusMessage) {
      setResponseStatus(
        event,
        ctx.response.statusCode,
        ctx.response.statusMessage
      );
    }
    return ctx.response.body;
  });
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

const nitroApp = useNitroApp();
const handler = async (req) => {
  const url = new URL(req.url);
  const relativeUrl = `${url.pathname}${url.search}`;
  const r = await nitroApp.localCall({
    url: relativeUrl,
    headers: req.headers,
    method: req.method,
    body: req.body
  });
  const headers = normalizeResponseHeaders({
    ...getCacheHeaders(url.pathname),
    ...r.headers
  });
  return new Response(r.body, {
    status: r.status,
    headers
  });
};
const ONE_YEAR_IN_SECONDS = 365 * 24 * 60 * 60;
function normalizeResponseHeaders(headers) {
  const outgoingHeaders = new Headers();
  for (const [name, header] of Object.entries(headers)) {
    if (name === "set-cookie") {
      for (const cookie of normalizeCookieHeader(header)) {
        outgoingHeaders.append("set-cookie", cookie);
      }
    } else if (header !== void 0) {
      outgoingHeaders.set(name, joinHeaders(header));
    }
  }
  return outgoingHeaders;
}
function getCacheHeaders(url) {
  const { isr } = getRouteRulesForPath(url);
  if (isr) {
    const maxAge = typeof isr === "number" ? isr : ONE_YEAR_IN_SECONDS;
    const revalidateDirective = typeof isr === "number" ? `stale-while-revalidate=${ONE_YEAR_IN_SECONDS}` : "must-revalidate";
    return {
      "Cache-Control": "public, max-age=0, must-revalidate",
      "Netlify-CDN-Cache-Control": `public, max-age=${maxAge}, ${revalidateDirective}, durable`
    };
  }
  return {};
}

export { destr as $, organizationCodeExists as A, updateOrganization as B, getOrganizationsPaginated as C, createOrganization as D, searchOrganizations as E, getAllOrganizations as F, getOrganizationsStats as G, getRepresentativeById as H, deleteRepresentative as I, updateRepresentative as J, approveRepresentative as K, sendMessage as L, BOT_MESSAGES as M, blockRepresentative as N, getRepresentativesPaginated as O, getPendingRepresentatives as P, getRepresentativeStats as Q, getBot as R, verifyWebhookSecret as S, handleUpdate as T, UserRole as U, getHeaders as V, joinRelativeURL as W, useRuntimeConfig as X, getResponseStatusText as Y, getResponseStatus as Z, defineRenderHandler as _, getRouterParam as a, getRouteRules as a0, useNitroApp as a1, klona as a2, hasProtocol as a3, isScriptProtocol as a4, joinURL as a5, withQuery as a6, parse as a7, getRequestHeader as a8, isEqual as a9, sanitizeStatusCode as aa, getContext as ab, setCookie as ac, getCookie as ad, deleteCookie as ae, $fetch as af, createHooks as ag, executeAsync as ah, toRouteMatcher as ai, createRouter$1 as aj, defu as ak, parseQuery as al, withTrailingSlash as am, withoutTrailingSlash as an, handler as ao, auth as ap, createTokenPayload as b, createError$1 as c, defineEventHandler as d, executeQuery as e, generateToken as f, getQuery as g, generateRefreshToken as h, toPublicUser as i, verifyRefreshToken as j, hashPassword as k, getHeader as l, extractToken as m, verifyToken as n, readMultipartFormData as o, executeTransaction as p, getRequestIP as q, readBody as r, setHeader as s, testConnection as t, getOrCreateOrganizationByName as u, verifyPassword as v, updateStudentsCount as w, runMigrations as x, getOrganizationById as y, deleteOrganization as z };
//# sourceMappingURL=nitro.mjs.map
