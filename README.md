# Kimi Assistant

English | [中文](#功能)

Embed [Kimi Code CLI](https://moonshotai.github.io/kimi-code/) directly into Obsidian's right sidebar, turning Kimi into an AI collaborator for your vault.

**Protocol**: ACP (Agent Client Protocol, JSON-RPC over stdio). The plugin spawns `kimi.exe acp` as a child process and drives the session.

## Features

- **Sidebar Chat**: User / assistant bubbles, streaming Markdown rendering, collapsible thinking blocks, tool call blocks (tool name + status + target file).
- **Permission Approval**: Inline "Allow Once / Always Allow / Deny" buttons before file edits or command execution; YOLO auto-approve mode available in settings (off by default).
- **Session History**: Top "History" button lists past sessions for the current vault (via kimi acp `session/list`), click to restore and continue (`session/load`); hover an entry and click `×` to delete it.
- **Knowledge Base Integration**:
  - Automatically attach the active note path when sending (shown as a removable chip above the input; can be disabled in settings).
  - Type `@` to trigger note completion — ranked current note first, then notes from the same folder; selected notes attach as removable chips and their content is injected as `<file path="...">` (auto-truncated beyond 20K characters).
  - Drag files or folders from the file explorer into the input area to reference them (folders inject a `<folder>` block with a note listing).
  - Command "Send selected text to Kimi chat" + editor context menu.
- **Status Bar**: Current model and thinking effort (dropdown switchable; effort shown as short labels — Standard / High / Max), context usage indicator, connection status.
- **Cancel Generation**: Click "Stop" during generation to trigger `session/cancel`.
- **Zero-Config CLI Path**: The plugin auto-detects the Kimi CLI (official installer location → `KIMI_INSTALL_DIR` → npm global → `PATH`); manual override available in settings.

## Installation

1. Install [Kimi Code CLI](https://moonshotai.github.io/kimi-code/) and run `kimi login` in your terminal.
   - Windows one-liner: `irm https://code.kimi.com/kimi-code/install.ps1 | iex`
2. Build: `npm install && npm run build`.
3. Copy the entire folder (including `main.js`, `manifest.json`, `styles.css`) to `<your-vault>/.obsidian/plugins/kimidian/`.
4. Enable Kimi Assistant in Obsidian Settings → Community Plugins. The CLI path is auto-detected; adjust it in plugin settings only if needed.

## Usage

- Click the left ribbon icon, or run the command "Open Kimi Chat Sidebar".
- Type a question and press Enter to send; `@` or drag notes to reference them; click "Stop" during generation to interrupt.
- "New Chat" starts a fresh session; "History" restores or deletes past sessions.

---

# 功能

在 Obsidian 右侧边栏嵌入 [Kimi Code CLI](https://moonshotai.github.io/kimi-code/)，让 Kimi 直接成为你的笔记仓库 AI 协作者。

通信协议：ACP（Agent Client Protocol，JSON-RPC over stdio），插件作为 ACP client spawn `kimi.exe acp` 子进程并驱动会话。

## 功能

- **侧边栏聊天**：用户 / 助手气泡、Markdown 流式渲染、思考内容折叠、工具调用折叠块（工具名 + 状态 + 目标文件）。
- **权限审批**：文件修改 / 命令执行前在聊天内联显示「允许一次 / 始终允许 / 拒绝」按钮；设置里可开启 YOLO 自动批准（默认关闭）。
- **历史会话**：顶部「历史」按钮列出当前 vault 的过往会话（基于 kimi acp 的 `session/list`），点击恢复并继续对话（`session/load`）；悬停条目点 `×` 可删除。
- **知识库联动**：
  - 发送时自动附带当前活动笔记路径（输入框上方显示为可移除的引用 chip，可在设置关闭）。
  - 输入 `@` 触发笔记补全——当前笔记优先、同文件夹笔记次之；选中的笔记以可移除 chip 挂在输入框上方，内容以 `<file path="...">` 注入当条消息（超过 2 万字符自动截断）。
  - 从文件列表把文件 / 文件夹拖入输入区即可引用（文件夹注入 `<folder>` 块并附笔记清单）。
  - 命令「发送选中文本到 Kimi 聊天」+ 编辑器右键菜单。
- **底部状态栏**：当前模型与思考强度（均可下拉切换；思考强度显示为短标签——Standard / High / Max）、上下文用量指示、连接状态。
- **中断生成**：生成中点击「停止」触发 `session/cancel`。
- **CLI 路径零配置**：自动探测 Kimi CLI（官方安装默认位置 → `KIMI_INSTALL_DIR` → npm 全局 → `PATH`）；设置页可手动覆盖。

## 安装（开发版）

1. 安装 [Kimi Code CLI](https://moonshotai.github.io/kimi-code/)，并在终端运行 `kimi login` 完成登录。
   - Windows 一行命令：`irm https://code.kimi.com/kimi-code/install.ps1 | iex`
2. 构建：`npm install && npm run build`。
3. 把整个文件夹（含 `main.js`、`manifest.json`、`styles.css`）复制到 `<你的vault>/.obsidian/plugins/kimidian/`。
4. 在 Obsidian 设置 → 第三方插件中启用 Kimi Assistant；CLI 路径会自动探测，一般无需手动配置。

## 使用

- 点击左侧丝带图标，或命令面板执行「打开 Kimi 聊天侧边栏」。
- 输入问题回车发送；`@` 或拖拽笔记引用；生成中点「停止」中断。
- 「新对话」开启全新会话；「历史」恢复或删除过往会话。

## Smoke Test

```bash
node scripts/smoke-acp.mjs            # 仅 initialize 握手
node scripts/smoke-acp.mjs --prompt   # 加测 session/new + 流式 prompt（需已登录）
```
