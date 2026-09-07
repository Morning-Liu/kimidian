/**
 * kimi CLI 路径解析：设置留空或指向不存在的文件时按候选顺序自动探测。
 *
 * 背景：issue #2 —— 默认值曾写死作者本机路径，其他用户装上即 ENOENT；
 * 且 CLI 自 0.37 起可自更新、0.40 起改 Node 发行（npm 全局为 kimi.cmd），
 * 路径随安装方式变化，写死任何单一位置都不可靠。
 *
 * 候选优先级：
 *   1. 设置页手动配置（存在才用）
 *   2. %KIMI_INSTALL_DIR%\bin\kimi.exe（官方 install.ps1 支持的环境变量）
 *   3. %USERPROFILE%\.kimi-code\bin\kimi.exe（官方 install.ps1 默认位置）
 *   4. %APPDATA%\npm\kimi.cmd / kimi（npm i -g 的 Windows shim）
 *   5. PATH 各目录下的 kimi.exe / kimi.cmd / kimi
 * 全部落空 → 返回手动值（原样）或官方默认路径，让 spawn 报出明确错误。
 */
import { existsSync } from "fs";
import { join } from "path";

export interface CliPathCandidate {
  path: string;
  exists: boolean;
  source: string;
}

export interface CliPathResult {
  /** 最终采用路径（落空时为兜底路径，调用方仍可尝试 spawn） */
  path: string;
  /** 命中来源；null = 全部落空，用了兜底 */
  source: string | null;
  /** 全部候选及命中情况（诊断展示用） */
  candidates: CliPathCandidate[];
}

/** 官方 install.ps1 的默认安装位置（env 参数便于单测注入） */
export function officialDefaultCliPath(env: NodeJS.ProcessEnv = process.env): string {
  return join(env.USERPROFILE || "C:\\Users\\Public", ".kimi-code", "bin", "kimi.exe");
}

/** 按优先级生成候选（纯函数，便于单测；fs 访问集中在本文件底部） */
export function cliPathCandidates(env: NodeJS.ProcessEnv = process.env): CliPathCandidate[] {
  const out: CliPathCandidate[] = [];
  const push = (p: string, source: string) => {
    if (p && !out.some((c) => c.path.toLowerCase() === p.toLowerCase())) {
      out.push({ path: p, exists: false, source });
    }
  };

  const installDir = env.KIMI_INSTALL_DIR;
  if (installDir) push(join(installDir, "bin", "kimi.exe"), "KIMI_INSTALL_DIR 环境变量");
  push(officialDefaultCliPath(env), "官方安装脚本默认位置");

  const appdata = env.APPDATA;
  if (appdata) {
    push(join(appdata, "npm", "kimi.cmd"), "npm 全局 (APPDATA\\npm)");
    push(join(appdata, "npm", "kimi"), "npm 全局 (APPDATA\\npm)");
  }

  // PATH 逐目录扫描（PATHEXT 决定可执行后缀；至少尝试 exe/cmd/无后缀）
  const pathEnv = env.PATH || env.Path || "";
  for (const dir of pathEnv.split(";")) {
    if (!dir) continue;
    const clean = dir.trim().replace(/^"|"$/g, "");
    if (!clean) continue;
    push(join(clean, "kimi.exe"), "PATH 目录");
    push(join(clean, "kimi.cmd"), "PATH 目录");
    push(join(clean, "kimi"), "PATH 目录");
  }
  return out;
}

/**
 * 解析最终应使用的 CLI 路径。
 * @param manual 设置页手动配置（空串 = 全自动）
 */
export function resolveCliPath(manual?: string, env: NodeJS.ProcessEnv = process.env): CliPathResult {
  const candidates: CliPathCandidate[] = [];
  const consider = (p: string, source: string): CliPathCandidate => {
    const c = { path: p, exists: existsSync(p), source };
    candidates.push(c);
    return c;
  };

  const manualTrim = (manual ?? "").trim();
  if (manualTrim) {
    const c = consider(manualTrim, "设置页手动配置");
    if (c.exists) return { path: c.path, source: c.source, candidates };
  }

  for (const cand of cliPathCandidates(env)) {
    cand.exists = existsSync(cand.path);
    candidates.push(cand);
    if (cand.exists) return { path: cand.path, source: cand.source, candidates };
  }

  // 全部落空：手动值原样保留（含错误信息价值），否则退回官方默认位置
  const fallback = manualTrim || officialDefaultCliPath(env);
  return { path: fallback, source: null, candidates };
}
