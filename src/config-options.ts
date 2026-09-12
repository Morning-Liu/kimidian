/**
 * ACP configOptions → 状态下拉 的纯映射逻辑（不依赖 Obsidian / Node，便于单测）。
 *
 * 背景：模型/思考强度下拉的渲染此前内联在 chat-view 里，回归无法单测；
 * 这里抽出为纯函数，chat-view 只负责把 SelectViewState 翻译成 DOM。
 */

/** configOptions 里的单个选项值（与 CLI 实测结构一致：{value, name} 对象） */
export interface ConfigOptionValue {
  value: string;
  name: string;
}

/** configOptions 里的一条配置项（model / thinking / mode …） */
export interface ConfigOption {
  id: string;
  name: string;
  category?: string;
  currentValue?: string;
  options?: ConfigOptionValue[];
}

/** 默认模型（用户从未手动选择时使用） */
export const DEFAULT_MODEL = "kimi-code/k3";

/** 内置模型兜底表：设置页在还没有任何会话记录时使用（与 CLI config.toml 实测一致） */
export const BUILTIN_MODEL_OPTIONS: ConfigOptionValue[] = [
  { value: "kimi-code/kimi-for-coding", name: "K2.8 Preview" },
  { value: "kimi-code/kimi-for-coding-highspeed", name: "K2.7 Coding Highspeed" },
  { value: "kimi-code/k3", name: "K3" },
  { value: "kimi-code/k3-256k", name: "K3 256K" },
];

/**
 * 模型显示名覆盖：kimi-for-coding 入口的实际模型已换成 K2.8 Preview（2026-09-11 官方公告，
 * Model ID 不变），但 CLI/服务端目录的显示名可能滞后或被刷新回 "K2.7 Coding"。
 * 下拉展示一律以此表优先，保证用户看到的是真实模型名。
 */
export const MODEL_DISPLAY_OVERRIDES: Record<string, string> = {
  "kimi-code/kimi-for-coding": "K2.8 Preview",
};

/** 模型显示名：覆盖表优先，否则用 CLI/兜底表给的名字 */
export function modelDisplayName(value: string, fallbackName: string): string {
  return MODEL_DISPLAY_OVERRIDES[value] ?? fallbackName;
}

/** 从 configOptions 中挑出模型项（id=model 优先，名称正则兜底） */
export function pickModelOption(
  opts: readonly ConfigOption[] | null | undefined
): ConfigOption | null {
  if (!opts) return null;
  return (
    opts.find((o) => o.id === "model" || /model|模型/i.test(o.name ?? "")) ??
    null
  );
}

/** 从 configOptions 中挑出思考强度项（thinking / effort / category=thought_level） */
export function pickThinkingOption(
  opts: readonly ConfigOption[] | null | undefined
): ConfigOption | null {
  if (!opts) return null;
  return (
    opts.find(
      (o) =>
        o.id === "thinking" ||
        o.id === "effort" ||
        o.category === "thought_level"
    ) ?? null
  );
}

/**
 * 思考档位短标签：CLI 侧选项名形如 "Thinking Max"，
 * 状态栏空间有限且"Thinking"与左侧"思考："标签重复，只保留档位词。
 * "Thinking Max" → "Max"；单词原样返回（"Standard"/"High"/"Max"…）。
 */
export function shortThinkingLabel(name: string): string {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return trimmed;
  const parts = trimmed.split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1] : trimmed;
}

/** 下拉渲染状态机：placeholder（无会话/无数据）/ hidden（思考单档）/ single（单选文本）/ select */
export type SelectViewState =
  | { kind: "placeholder"; text: string }
  | { kind: "hidden" }
  | { kind: "single"; text: string }
  | {
      kind: "select";
      options: { value: string; label: string }[];
      current: string;
    };

/**
 * 计算一个 config option 下拉该渲染成什么。
 * label="思考" 时单档隐藏（不占位）；label="模型" 时单档显示为文本。
 */
export function selectViewState(params: {
  option: ConfigOption | null;
  label: string;
  hasSession: boolean;
  fallbackText: string | null;
}): SelectViewState {
  const { option, label, hasSession, fallbackText } = params;
  const options = option?.options ?? [];
  if (!option || options.length === 0 || !hasSession) {
    return fallbackText
      ? { kind: "placeholder", text: `${label}：${fallbackText}` }
      : { kind: "hidden" };
  }
  if (options.length === 1) {
    if (label === "思考") return { kind: "hidden" };
    if (label === "模型") {
      return { kind: "single", text: `${label}：${modelDisplayName(options[0].value, options[0].name || options[0].value)}` };
    }
    return { kind: "single", text: `${label}：${options[0].name || options[0].value}` };
  }
  const labeled = options.map((o) => ({
    value: o.value,
    // 模型：K2.8 等显示名以覆盖表优先；思考档位用短标签（去 "Thinking" 前缀）
    label:
      label === "思考"
        ? shortThinkingLabel(o.name) || o.value
        : label === "模型"
          ? modelDisplayName(o.value, o.name || o.value)
          : o.name || o.value,
  }));
  return {
    kind: "select",
    options: labeled,
    current: option.currentValue ?? "",
  };
}

/** 模型输入归一化结果 */
export interface NormalizedModel {
  /** 归一化后的完整模型 ID（可直接下发 set_config_option） */
  value: string;
  /** 是否被 configOptions 证实为合法选项 */
  recognized: boolean;
}

/**
 * 把用户输入（设置页文本 / 持久化值）归一化为合法模型 ID。
 * 接受：完整 value（kimi-code/k3）、显示名（K3，大小写不敏感）、value 末段（k3）。
 * 空输入 → fallback（默认模型）。无法识别 → recognized=false，调用方不应下发。
 */
export function normalizeModelInput(
  input: string,
  option: ConfigOption | null,
  fallback: string
): NormalizedModel {
  const raw = (input ?? "").trim();
  if (!raw) return { value: fallback, recognized: true };
  const options = option?.options ?? [];
  if (options.length === 0) {
    // 没有选项表可参考：只能原样透传（未证实）
    return { value: raw, recognized: false };
  }
  const byValue = options.find((o) => o.value === raw);
  if (byValue) return { value: byValue.value, recognized: true };
  const lower = raw.toLowerCase();
  const byName = options.find((o) => (o.name ?? "").toLowerCase() === lower);
  if (byName) return { value: byName.value, recognized: true };
  const byTail = options.find(
    (o) => o.value.split("/").filter(Boolean).pop()?.toLowerCase() === lower
  );
  if (byTail) return { value: byTail.value, recognized: true };
  return { value: raw, recognized: false };
}

/**
 * configOptions 一行摘要（诊断日志用）：
 * "3 项 [model=kimi-code/kimi-for-coding(3 选项), thinking=on(1), mode=default(4)]"
 */
export function summarizeConfigOptions(
  opts: readonly ConfigOption[] | null | undefined
): string {
  if (!opts || opts.length === 0) return "configOptions: <空>";
  const parts = opts.map(
    (o) => `${o.id}=${o.currentValue ?? "?"}(${o.options?.length ?? 0} 选项)`
  );
  return `configOptions: ${opts.length} 项 [${parts.join(", ")}]`;
}
