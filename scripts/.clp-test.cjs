var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/cli-path.ts
var cli_path_exports = {};
__export(cli_path_exports, {
  cliPathCandidates: () => cliPathCandidates,
  officialDefaultCliPath: () => officialDefaultCliPath,
  resolveCliPath: () => resolveCliPath
});
module.exports = __toCommonJS(cli_path_exports);
var import_fs = require("fs");
var import_path = require("path");
function officialDefaultCliPath(env = process.env) {
  return (0, import_path.join)(env.USERPROFILE || "C:\\Users\\Public", ".kimi-code", "bin", "kimi.exe");
}
function cliPathCandidates(env = process.env) {
  const out = [];
  const push = (p, source) => {
    if (p && !out.some((c) => c.path.toLowerCase() === p.toLowerCase())) {
      out.push({ path: p, exists: false, source });
    }
  };
  const installDir = env.KIMI_INSTALL_DIR;
  if (installDir) push((0, import_path.join)(installDir, "bin", "kimi.exe"), "KIMI_INSTALL_DIR \u73AF\u5883\u53D8\u91CF");
  push(officialDefaultCliPath(env), "\u5B98\u65B9\u5B89\u88C5\u811A\u672C\u9ED8\u8BA4\u4F4D\u7F6E");
  const appdata = env.APPDATA;
  if (appdata) {
    push((0, import_path.join)(appdata, "npm", "kimi.cmd"), "npm \u5168\u5C40 (APPDATA\\npm)");
    push((0, import_path.join)(appdata, "npm", "kimi"), "npm \u5168\u5C40 (APPDATA\\npm)");
  }
  const pathEnv = env.PATH || env.Path || "";
  for (const dir of pathEnv.split(";")) {
    if (!dir) continue;
    const clean = dir.trim().replace(/^"|"$/g, "");
    if (!clean) continue;
    push((0, import_path.join)(clean, "kimi.exe"), "PATH \u76EE\u5F55");
    push((0, import_path.join)(clean, "kimi.cmd"), "PATH \u76EE\u5F55");
    push((0, import_path.join)(clean, "kimi"), "PATH \u76EE\u5F55");
  }
  return out;
}
function resolveCliPath(manual, env = process.env) {
  const candidates = [];
  const consider = (p, source) => {
    const c = { path: p, exists: (0, import_fs.existsSync)(p), source };
    candidates.push(c);
    return c;
  };
  const manualTrim = (manual ?? "").trim();
  if (manualTrim) {
    const c = consider(manualTrim, "\u8BBE\u7F6E\u9875\u624B\u52A8\u914D\u7F6E");
    if (c.exists) return { path: c.path, source: c.source, candidates };
  }
  for (const cand of cliPathCandidates(env)) {
    cand.exists = (0, import_fs.existsSync)(cand.path);
    candidates.push(cand);
    if (cand.exists) return { path: cand.path, source: cand.source, candidates };
  }
  const fallback = manualTrim || officialDefaultCliPath(env);
  return { path: fallback, source: null, candidates };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  cliPathCandidates,
  officialDefaultCliPath,
  resolveCliPath
});
