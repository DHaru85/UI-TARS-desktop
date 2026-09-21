# UI-TARS-desktop 本地部署与试用指引

本文档汇总在 **Windows** 环境下从源码或发布包拉起 **UI-TARS Desktop** 与 **Agent TARS** 的步骤，以及常见问题处理。更完整的架构说明见 [ARCHITECTURE.md](./ARCHITECTURE.md)；官方桌面快速开始见 [docs/quick-start.md](./docs/quick-start.md)。

---

## 1. 先选产品线

| 目标 | 推荐方式 | Node 版本 | 是否需要编译整个 monorepo |
|------|----------|-----------|---------------------------|
| 通用多模态 Agent（浏览器 + MCP + Web UI） | `npx @agent-tars/cli` | ≥ 22.15 | 否 |
| 桌面 GUI Agent（控本机/浏览器） | 安装包或根目录 `pnpm run dev:ui-tars` | 20+（桌面开发） | 是（源码时） |
| 修改 Tarko / Agent TARS 源码 | `multimodal/` 下 `pnpm bootstrap` | ≥ 22 | 是 |

仓库是 **双 workspace**：

- **根目录**：`apps/ui-tars`、`packages/ui-tars`、`packages/agent-infra`（Electron 桌面）
- **`multimodal/`**：Tarko、Agent TARS、Omni-TARS（独立 `pnpm` workspace，当前栈版本 **0.3.0**）

从 GitHub 下载的 **Source code (zip)** 不是 git 仓库，根目录 `pnpm install` 可能因 **husky** 的 `prepare` 脚本失败，需按下文处理。

---

## 2. 环境准备（Windows）

### 2.1 Node.js

| 用途 | 建议版本 |
|------|----------|
| Agent TARS CLI / `multimodal` 源码 | **Node 22 LTS**（CLI 要求 ≥ 22.15） |
| UI-TARS Desktop 源码 | Node **20.x 或 22.x**（避免单独使用 Node 24 编译原生模块） |

安装后验证：

```powershell
node -v
npm -v
```

### 2.2 pnpm

桌面根仓库与 `multimodal` 均使用 **pnpm 9**（根 `packageManager`: `pnpm@9.10.0`）。

**全局安装（不要用 `npm install pnpm@9` 在项目目录内，会触发 `workspace:*` 错误）：**

```powershell
npm install -g pnpm@9
```

**Windows 上找不到 `pnpm` 命令：**

npm 11 已移除 `npm bin -g`，请用：

```powershell
npm prefix -g
# 一般为 C:\Users\<用户名>\AppData\Roaming\npm
# pnpm.cmd 在该目录下，不在 bin 子目录
```

当前窗口临时加入 PATH：

```powershell
$npmDir = npm prefix -g
$env:Path = "$npmDir;" + $env:Path
pnpm -v
```

永久加入用户 PATH 后**重新打开 PowerShell**。若使用 Conda，可先 `conda deactivate` 再试。

或使用 Corepack：

```powershell
corepack enable
corepack prepare pnpm@9.10.0 --activate
pnpm -v
```

### 2.3 其他

- **Chrome / Edge / Firefox**：Agent TARS 与 Desktop 的 Browser Operator 需要。
- **Visual Studio Build Tools**（可选）：桌面源码编译 `sharp`、nut.js 等原生模块时可能需要，勾选「使用 C++ 的桌面开发」。
- **单显示器**：官方文档说明 Desktop 多显示器可能导致任务失败。

### 2.4 国内镜像

- npm 包：`registry=https://registry.npmmirror.com`（用户级 `~/.npmrc` 或安装前 `$env:npm_config_registry`）。
- **Electron 二进制**不走 npm registry，必须单独设置（见第 4 节）。
- `multimodal/.npmrc` 默认 `registry=https://registry.npmjs.org`，在 `multimodal` 内安装时可临时：

  ```powershell
  $env:npm_config_registry = "https://registry.npmmirror.com"
  ```

`npm config set electron_mirror ...` 在 **npm 11** 会报错「不是合法 npm 选项」，请用环境变量或手写 `.npmrc`（见下）。

---

## 3. 路径 A：Agent TARS CLI（推荐试用）

无需克隆/编译 monorepo，适合 Windows 快速验证。

### 3.1 安装与启动

```powershell
# 一次性
npx @agent-tars/cli@latest --provider openai --model <模型名> --baseURL http://127.0.0.1:8000/v1 --apiKey sk-local

# 或全局安装
npm install -g @agent-tars/cli@latest
agent-tars --provider volcengine --model doubao-1-5-thinking-vision-pro-250428 --apiKey <密钥>
```

浏览器打开控制台输出的地址，一般为 **http://localhost:8888**。

### 3.2 模型 Provider 说明（CLI）

CLI 支持例如 `volcengine`、`anthropic`、`openai` 等（见 [官方 Quick Start](https://agent-tars.com/guide/get-started/quick-start.html)）。本地 **OpenAI 兼容** 接口示例：

```powershell
agent-tars --provider openai --model <与 /v1/models 一致的 id> --baseURL http://127.0.0.1:8000/v1 --apiKey sk-local
```

### 3.3 可选：Workspace 配置

```powershell
agent-tars workspace --init
agent-tars workspace --open
```

在 workspace 中使用 `agent-tars.config.ts` 替代长命令行参数。

---

## 4. 路径 B：UI-TARS Desktop 安装包（Windows）

### 4.1 下载注意

- **Latest（v0.3.0）** 发布页主要是 **Agent TARS 栈** 变更说明，**通常不含** Windows 桌面 `.exe`。
- **桌面安装包** 在较早的桌面版本，例如 **[v0.2.4](https://github.com/bytedance/UI-TARS-desktop/releases/tag/v0.2.4)**：

  - 资产名：**`UI-TARS-0.2.4-Setup.exe`**
  - 不要下载 **Source code (zip)** 当作安装包。

macOS 可用 Homebrew：`brew install --cask ui-tars`（Windows 不适用）。

### 4.2 安装后

1. 安装 Chrome/Edge/Firefox（Browser Operator）。
2. 打开 **Settings**，配置 VLM（见第 7 节）。
3. 选择 **Local Computer** 或 **Local Browser**，开始对话。

**Remote Operator** 免费服务已于 **2025-08-20** 停止，请勿依赖文档中的远程试用入口。

---

## 5. 路径 C：源码运行 UI-TARS Desktop（根 workspace）

### 5.1 获取代码

```powershell
# 推荐 git clone；若仅用 zip，解压后路径中不要混用根目录与 multimodal 的安装步骤
cd D:\path\to\UI-TARS-desktop
```

### 5.2 安装依赖

```powershell
pnpm install
```

**Zip 源码无 `.git` 时**，`prepare` 中的 **husky** 可能失败，可：

```powershell
pnpm install --ignore-scripts
```

然后单独补 Electron（下一节）。若需完整脚本，请使用 `git clone` 或跳过 husky。

### 5.3 Electron 二进制（必做，否则 `Electron uninstall`）

`pnpm install` 只安装 npm 包；**Electron 运行时**由 `node_modules/electron/install.js` 另行下载。默认从 GitHub 拉 zip，国内常见 `read ECONNRESET`。

**PowerShell：**

```powershell
$env:ELECTRON_MIRROR = "https://npmmirror.com/mirrors/electron/"
$env:PUPPETEER_SKIP_DOWNLOAD = "true"

Remove-Item -Recurse -Force "$env:LOCALAPPDATA\electron\Cache" -ErrorAction SilentlyContinue

node ".\node_modules\electron\install.js"
```

验证：

```powershell
Test-Path ".\node_modules\electron\dist\electron.exe"
.\node_modules\electron\dist\electron.exe --version
```

若镜像不通，可换：

```powershell
$env:ELECTRON_MIRROR = "https://cdn.npmmirror.com/binaries/electron/"
```

**持久配置（勿用 `npm config set electron_mirror`，npm 11 不支持）：**

在 `C:\Users\<用户名>\.npmrc` 或项目根 `.npmrc` 增加：

```ini
electron_mirror=https://npmmirror.com/mirrors/electron/
```

`electron-ipc` 下若还有独立 `electron` 包，对其同样执行 `install.js`。

### 5.4 启动开发版桌面

```powershell
pnpm run dev:ui-tars
```

主进程热更新可选：`cd apps/ui-tars` 后 `pnpm run dev:w`（见 [CONTRIBUTING.md](./CONTRIBUTING.md)）。

---

## 6. 路径 D：源码构建 Agent TARS（multimodal workspace）

仅在你需要改 Tarko / Agent TARS 源码时使用；试用优先 **路径 A**。

### 6.1 步骤

```powershell
cd multimodal

$env:npm_config_registry = "https://registry.npmmirror.com"

# 不要在 multimodal 使用 --ignore-scripts（无 husky 问题，但会跳过必要 postinstall）
pnpm install

pnpm bootstrap
```

`bootstrap` 顺序：`tarko/**` → `gui-agent/**` → `agent-tars/**` → `omni-tars/**` 全量 **build**，耗时较长。

### 6.2 启动本地 CLI

```powershell
node .\agent-tars\cli\bin\cli.js --provider openai --model <模型名> --baseURL http://127.0.0.1:8000/v1 --apiKey sk-local
```

开发时可另开终端在 `multimodal` 执行 `pnpm dev` 或 `pnpm dev:core`（见 [multimodal/CONTRIBUTING.md](./multimodal/CONTRIBUTING.md)）。

### 6.3 Windows 源码构建已知问题与修复

以下问题在 **Linux/macOS CI** 上不易暴露，Windows 本地 `pnpm bootstrap` 可能遇到。

| 现象 | 原因 | 处理 |
|------|------|------|
| `@tarko/ui`：`Cannot find module '@rsbuild/plugin-react'` | `rslib.config.ts` 引用了插件但未写入 `devDependencies` | `pnpm add -D @rsbuild/plugin-react@1.1.1 --filter @tarko/ui`（注意拼写 **rsbuild**，不是 rsbild） |
| `@tarko/agio`：`No root type "'AgioEvent.Event'" found` | npm 脚本中单引号在 Windows 下被原样传给 `ts-json-schema-generator` | 将 `tarko/agio/package.json` 中 `build:json-schema` 改为无单引号：`--path src/index.ts --type AgioEvent.Event ...`（本仓库已修复） |
| 根目录 `pnpm install` 拉取 `turbo-darwin-*` 等并 ELIFECYCLE | 在**根目录**安装桌面 monorepo，且 husky/prepare 失败 | Agent TARS 只在 **`multimodal/`** 安装；根目录仅桌面需要 |
| `multimodal` 安装慢或超时 | `.npmrc` 指向 `registry.npmjs.org` | 临时设置 `$env:npm_config_registry` 为国内镜像 |

`agio` 包若仅需跳过 schema 生成调试，仓库内已有 `agio-schema.json`；正式修复仍建议改 `package.json` 后执行 `pnpm --filter @tarko/agio build`。

### 6.4 修改后进行重新编译

在 **`multimodal/`** 下按包构建，不要只在某个子目录盲目执行 `npx rslib build`（可能未走 workspace 依赖与 override）。

**全量（与首次一致）：**

```powershell
cd multimodal
pnpm bootstrap
```

**增量（改动了哪些包就 build 哪些）：** 见下文 **第 11 节** 的推荐顺序。

---

## 7. UI-TARS Desktop：VLM 与本地 OpenAI 兼容接口

Settings 里的 **VLM Provider** 不是「选 OpenAI / 火山 / Anthropic 云厂商」，而是选择 **UI-TARS 动作解析与系统提示词版本**：

| 界面选项 | 适用模型 |
|----------|----------|
| Hugging Face for UI-TARS-1.0 | UI-TARS 1.0 系 |
| Hugging Face for UI-TARS-1.5 | UI-TARS 1.5 系（本地 vLLM 等部署 1.5 时选此项） |
| VolcEngine Ark for Doubao-1.5-UI-TARS | Doubao 1.5 15B |
| VolcEngine Ark for Doubao-1.5-thinking-vision-pro | Doubao 1.5 20B |

**Base URL / API Key / Model Name** 仍指向你的 OpenAI 兼容服务，例如：

```text
VLM Base URL:  http://127.0.0.1:8000/v1
VLM API Key:   sk-local（本地不校验时可填占位）
VLM Model Name: 与 /v1/models 返回的 id 一致
```

- Base URL 需为合法 URL，一般以 **`/v1` 结尾**，不要写到 `/v1/chat/completions`。
- **Use Responses API** 本地多为 Chat Completions，建议 **关闭**。
- 使用 **Check Model Availability** 通过后再跑任务。

若 Provider 下拉框灰色：可能启用了远程 Preset，需 Reset to manual 或关闭 autoUpdate。

**能力边界：** Desktop 期望模型输出 UI-TARS 格式动作（`Thought` / `Action` / `click(start_box=...)`）。普通 GPT/Qwen 等即使用 OpenAI 协议对接，动作解析也可能失败；此类模型更适合 **Agent TARS CLI**。

---

## 8. 常见问题速查

| 问题 | 处理 |
|------|------|
| `pnpm` 不是内部或外部命令 | `npm prefix -g` 加入 PATH，或 Corepack |
| `npm install pnpm@9` 报 `workspace:*` | 必须在项目外 **`npm install -g pnpm@9`** |
| `npm bin` Unknown command | npm 11 已移除，用 `npm prefix -g` |
| `electron` postinstall `ECONNRESET` | 设置 `ELECTRON_MIRROR` 后重跑 `install.js` |
| `pnpm run dev:ui-tars` → `Electron uninstall` | 未下载 `electron.exe`，见第 5.3 节 |
| Release 只有 Source zip | 桌面 exe 见 **v0.2.4**；Agent 用 **npx @agent-tars/cli** |
| `bootstrap` 在 `@tarko/ui` / `@tarko/agio` 失败 | 见第 6.3 节 |
| Desktop 无法选 OpenAI Provider | 设计如此；按模型版本选 Provider + 填 Base URL |

---

## 9. 相关文档

| 文档 | 说明 |
|------|------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 双栈架构与技术路线 |
| [docs/quick-start.md](./docs/quick-start.md) | 官方桌面快速开始（macOS 较完整） |
| [docs/setting.md](./docs/setting.md) | Desktop 设置项说明 |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | 根 monorepo 开发 |
| [multimodal/CONTRIBUTING.md](./multimodal/CONTRIBUTING.md) | Agent TARS 源码开发 |
| [Agent TARS Quick Start](https://agent-tars.com/guide/get-started/quick-start.html) | CLI 与模型 Provider |

---

## 10. 本地定制修改与更新操作（Agent TARS 栈）

本节记录本仓库相对上游 **0.3.0** 在 **Agent TARS / Tarko / agent-infra** 上的定制改动，以及 **Windows 下从改代码到重新跑 CLI** 的推荐流程。适用于你在 **路径 D**（`multimodal` 源码）上调试浏览器 Agent、MCP 与上下文过长等问题。

### 10.1 背景：解决了哪些问题

| 现象 | 主要原因 | 定制方向 |
|------|----------|----------|
| 工具调用 JSON 解析失败（`Expected property name` / LLM 400） | 模型返回的工具 `arguments` 非严格 JSON 或已是对象 | `@tarko/agent` 统一规范化并安全解析参数 |
| 上下文暴涨、`HTML to Markdown conversion failed`（Turndown GFM） | 旧版 `toMarkdown` 失败时回退整页 HTML；DOM 模式下 MCP 的 `browser_get_markdown` 覆盖本地实现 | 安全 Markdown 转换 + DOM 策略不再注册 MCP 版 `browser_get_markdown` |
| `@agent-tars/core` build 报 `Package subpath './dist/server.cjs' is not defined by "exports"` | 深路径 import 未在 `exports` 中声明 | 改为包主入口 `@agent-infra/mcp-server-browser` |
| 声明文件生成失败：`McpServer` 类型不兼容 / `Unused '@ts-expect-error'` | 根目录与 `multimodal` 各有一份 `@modelcontextprotocol/sdk`；linked 包与 `@tarko/mcp-agent` 版本路径不一致 | 统一 SDK override + `as unknown as McpServer` |
| 仍打进 npm 旧包（如 `mcp-server-browser@1.1.10`、`shared@0.0.2`） | `multimodal` 与根 `packages/agent-infra` 为双 workspace | `pnpm.overrides` + `file:` / `link:` 指向本地包 |

### 10.2 涉及的主要文件（便于 diff / 合并上游）

| 区域 | 路径（相对仓库根） |
|------|-------------------|
| 工具参数解析 | `multimodal/tarko/agent/src/utils/parse-tool-call-arguments.ts`、`tool-processor.ts`、`NativeToolCallEngine.ts` |
| 安全 HTML→Markdown（core） | `multimodal/agent-tars/core/src/utils/safe-html-to-markdown.ts`、`content-extractor.ts` |
| DOM 浏览器策略 | `multimodal/agent-tars/core/src/environments/local/browser/browser-control-strategies/browser-dom-strategy.ts` |
| 本地 MCP 装配 | `multimodal/agent-tars/core/src/environments/local/index.ts` |
| MCP Browser 服务端 | `packages/agent-infra/mcp-servers/browser/src/`（含 `typings.ts`、`utils/safe-markdown.ts`、`tools/content.ts` 等） |
| 共享 Markdown（可选同步） | `packages/agent-infra/shared/src/browser/to-markdown.ts` |
| Workspace 依赖 | `multimodal/package.json`（`pnpm.overrides`）、`multimodal/agent-tars/core/package.json` |

### 10.3 依赖链接与 override（必做）

`multimodal` 默认从 npm 拉 `@agent-infra/*`，**不会**自动使用根目录 `packages/agent-infra` 的源码。定制后需在 **`multimodal/package.json`** 中保持：

```json
"pnpm": {
  "overrides": {
    "@agent-infra/shared": "link:../packages/agent-infra/shared",
    "@agent-infra/mcp-server-browser": "link:../packages/agent-infra/mcp-servers/browser",
    "@modelcontextprotocol/sdk": "1.15.1"
  }
}
```

`@agent-tars/core` 的 `devDependencies` 中另有 **`file:`** 指向本地 MCP / shared（与 override 配合，保证构建期解析到 monorepo 内源码）。

**每次改 override 或 `file:` 路径后：**

```powershell
cd D:\path\to\UI-TARS-desktop-0.3.0\multimodal
$env:npm_config_registry = "https://registry.npmmirror.com"   # 可选
pnpm install
```

若只改了 **`packages/agent-infra/**`** 且根目录也执行过 `pnpm install`，可能出现 **两套** `@modelcontextprotocol/sdk`（根 `node_modules` 与 `multimodal/node_modules`）。类型检查以 **在 `multimodal` 内 install + build** 为准。

### 10.4 推荐构建顺序（增量）

全量仍用 `pnpm bootstrap`（第 6.1 节）。仅更新定制相关包时，建议顺序：

```powershell
cd multimodal

# 1. 若改了 packages/agent-infra/shared
pnpm --filter @agent-infra/shared build

# 2. 若改了 packages/agent-infra/mcp-servers/browser（几乎总是先于 core）
pnpm --filter @agent-infra/mcp-server-browser build

# 3. 若改了 tarko/agent 等
pnpm --filter @tarko/agent build

# 4. Agent TARS 核心
pnpm --filter @agent-tars/core build

# 5. 若使用本地 CLI 入口
pnpm --filter @agent-tars/cli build
```

**注意：** `@agent-infra/mcp-server-browser` 未 build 时，`@agent-tars/core` 可能链接到空的或旧的 `dist/`，运行时仍会表现为 npm 旧逻辑。

### 10.5 关键实现说明（运维向）

1. **MCP Browser 导入**  
   `local/index.ts` 使用 `import * as browserModule from '@agent-infra/mcp-server-browser'`，**不要**写 `@agent-infra/mcp-server-browser/dist/server.cjs`（`exports` 未暴露该子路径）。

2. **In-memory MCP 与类型**  
   `browserModule.createServer(...)` 返回值在 TypeScript 上需写成 `as unknown as McpServer`（`McpServer` 来自 `@tarko/mcp-agent`），以避免 linked 包与 `mcp-agent` 引用不同物理路径的 SDK。

3. **externalBrowser**  
   MCP `GlobalConfig.externalBrowser` 支持 `LocalBrowser | RemoteBrowser`，与 `BrowserManager.getBrowser()` 一致。

4. **DOM 模式下的 `browser_get_markdown`**  
   由 `createContentTools()` + `safeHtmlToMarkdown`（Readability 管线）提供；从 MCP 工具列表中**排除** `browser_get_markdown`，避免 npm 内置的 `page.content()` + 旧 `toMarkdown` 再次注册并覆盖。

5. **构建警告 `Can't resolve 'canvas'`**  
   来自 `jsdom` 可选依赖，在 `@agent-infra/mcp-server-browser` → `browser-context` 链路上常见，一般为 **warning**，不阻止 `dist/index.js` 产出；若仅 d.ts 阶段失败，以第 10.6 节为准排查。

### 10.6 构建 / 运行验证

**构建成功：**

```powershell
pnpm --filter @agent-tars/core build
# 应无 TS2578 / TS2352 / exports 子路径错误
```

**粗略检查产物是否仍含旧 Markdown 路径（PowerShell）：**

```powershell
Select-String -Path ".\agent-tars\core\dist\index.js" -Pattern "safeHtmlToMarkdown" -SimpleMatch
# 期望有匹配

Select-String -Path ".\agent-tars\core\dist\index.js" -Pattern "browser_get_markdown" | Select-Object -First 5
# 需结合 DOM 策略理解：名称可能出现，但不应再依赖 MCP 旧版整页 HTML 回退逻辑
```

**运行本地 CLI（与 6.2 节相同）：**

```powershell
node .\agent-tars\cli\bin\cli.js --provider openai --model <模型名> --baseURL http://127.0.0.1:8000/v1 --apiKey sk-local
```

试用时关注：工具参数是否仍报 JSON 错误、长页面是否仍瞬间撑爆上下文、Turndown GFM 是否仍刷屏。

### 10.7 与本节相关的构建问题速查

| 现象 | 处理 |
|------|------|
| `./dist/server.cjs` is not defined by exports | 改用 `@agent-infra/mcp-server-browser` 主入口 import |
| `Unused '@ts-expect-error'` | 删除该行；主入口 import 已合法 |
| `McpServer` may be a mistake… convert to unknown first | 使用 `as unknown as McpServer`；并执行 `pnpm install` 使 SDK override 生效 |
| `RemoteBrowser` 不能赋给 `externalBrowser` | 拉取含 `typings.ts` 改动的代码后重新 `pnpm --filter @agent-infra/mcp-server-browser build` |
| core build 通过但运行仍像旧版 | 确认 `multimodal` 下 `pnpm install` + override 生效；重建 mcp-browser 与 core |

### 10.8 从上游合并或发版时注意

- 合并 **bytedance/UI-TARS-desktop** 时，重点冲突：`multimodal/package.json` overrides、`browser-dom-strategy.ts`、`local/index.ts`、MCP `content.ts` / `safe-markdown`。
- 若恢复使用 **纯 npm** 版 `@agent-infra/mcp-server-browser`，需自行评估是否重新暴露 `browser_get_markdown` 与上下文风险。
- 发版前建议在干净环境：`multimodal` 内 `pnpm install` → 按 10.4 顺序 build → 跑一条浏览器抓取/markdown 任务回归。

---

## 11. 修订说明

本文档基于仓库 **0.3.0** 源码结构与 Windows 本地部署实践整理；发布资产与 registry 策略以 GitHub Releases 与官方文档为准。

- 若已合并 `multimodal/tarko/agio` 的 Windows 构建脚本修复，重新拉取后 `pnpm bootstrap` 可少一步手动改 `agio/package.json`。
- **Agent TARS 本地定制**（工具参数、安全 Markdown、MCP 链接与构建顺序）见 **第 10 节**。
