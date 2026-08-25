# fullstack-dev-kit

可重複使用的全端工程規範與工作流，同時支援 Claude Code 與 OpenAI Codex。四個 plugin 共用同一份 `skills/` 原始內容，並針對各平台提供對應的 manifest。

## 快速選擇

| Plugin             | 適用情境                                                   | Claude Code                     | Codex  |
| ------------------ | ---------------------------------------------------------- | ------------------------------- | ------ |
| `workflow-core`  | 團隊標準、Code Review、除錯、Git、決策、專案規劃、系統架構 | skills、commands、agents、hooks | skills |
| `backend-node`   | Node.js 分層、資料庫設計、後端測試與文件                   | skills、commands                | skills |
| `frontend-vue`   | Vue 3、Nuxt 3、TypeScript、UX 與前端測試                   | skills、commands                | skills |
| `python-toolkit` | Python 開發、Code Review 與虛擬環境                        | skills、command、agent          | skills |

建議所有人先安裝 `workflow-core`，再依專案技術棧選擇其餘 plugin。

## 功能一覽

### Skills：Claude Code 與 Codex 共用

| Plugin             | Skill                           | 用途                                                    |
| ------------------ | ------------------------------- | ------------------------------------------------------- |
| `workflow-core`  | `team-standards`              | 載入安全、命名、測試、Code Review 與 Git 團隊規範       |
| `workflow-core`  | `code-reviewer`               | 審查本機變更或 Pull Request 的正確性、安全性與可維護性  |
| `workflow-core`  | `debugger`                    | 系統化分析錯誤、stack trace 與根本原因                  |
| `workflow-core`  | `decision-helper`             | 比較選項、權衡利弊並記錄決策依據                        |
| `workflow-core`  | `git-workflow`                | 套用分支、commit message 與版本號規範                   |
| `workflow-core`  | `project-planner`             | 拆解任務、相依性、里程碑與時程                          |
| `workflow-core`  | `senior-architect`            | 系統設計、ADR、技術選型、相依性與架構圖                 |
| `workflow-core`  | `comment-conventions`         | 統一 Todo-Tree 與程式碼註解標記                         |
| `backend-node`   | `nodejs-guidelines`           | Node.js 分層、非同步處理、Repository 與 Controller 規範 |
| `backend-node`   | `database-design`             | 資料庫、資料表、欄位與 SQL 命名及設計規範               |
| `backend-node`   | `backend-testing-guidelines`  | Unit、Integration 與 Test Double 後端測試規範           |
| `frontend-vue`   | `vue-nuxt-guidelines`         | Vue／Nuxt 架構、API Service、TypeScript 與品質閘門      |
| `frontend-vue`   | `ux-heuristics`               | Nielsen 啟發式、表單、回饋狀態與無障礙檢查              |
| `frontend-vue`   | `frontend-testing-guidelines` | Vitest、Playwright、Mock 與測試命名規範                 |
| `python-toolkit` | `python-expert`               | Python 實作、除錯、型別、效能與 Code Review             |
| `python-toolkit` | `python-environment`          | 建立與使用 venv，避免污染系統 Python                    |

### Plugin commands：Claude Code 專屬

這裡的 command 是指 repository 內的 `commands/*.md` 元件，不是泛指所有 `/` 指令。安裝 Claude Code plugin 後，command 會加上 plugin namespace。完整內容與檔名規範請見 [COMMANDS.md](COMMANDS.md)。

| Plugin             | Command                            | 用途                            |
| ------------------ | ---------------------------------- | ------------------------------- |
| `workflow-core`  | `/workflow-core:code-review`     | 審查程式碼品質                  |
| `workflow-core`  | `/workflow-core:debug`           | 進行根本原因分析                |
| `workflow-core`  | `/workflow-core:git-commit`      | 依 Git 規範產生 commit message  |
| `workflow-core`  | `/workflow-core:security-review` | 審查目前分支的安全風險          |
| `backend-node`   | `/backend-node:api-doc`          | 撰寫 API 文件                   |
| `backend-node`   | `/backend-node:cronjob-doc`      | 撰寫排程文件                    |
| `backend-node`   | `/backend-node:test-backend`     | 撰寫 Node.js 後端測試           |
| `frontend-vue`   | `/frontend-vue:component-doc`    | 撰寫 Vue 元件與 Composable 文件 |
| `frontend-vue`   | `/frontend-vue:test-frontend`    | 撰寫 Vue／Nuxt 前端測試         |
| `python-toolkit` | `/python-toolkit:run-python`     | 在正確的虛擬環境執行 Python     |

### Agents：Claude Code 專屬

| Plugin             | Agent                | 用途                                  |
| ------------------ | -------------------- | ------------------------------------- |
| `workflow-core`  | `code-reviewer`    | 獨立進行程式碼審查                    |
| `workflow-core`  | `project-planner`  | 建立任務拆解、時程、里程碑與風險分析  |
| `workflow-core`  | `senior-architect` | 分析系統架構並產出技術決策建議        |
| `python-toolkit` | `python-expert`    | 從正確性、型別、效能與風格審查 Python |

### Hooks：Claude Code 專屬

`workflow-core` 提供以下 lifecycle hooks：

| 時機                        | Hook                  | 用途                               |
| --------------------------- | --------------------- | ---------------------------------- |
| `SessionStart`            | `team-standards`    | 在工作階段開始時載入團隊標準       |
| `PreToolUse: Read/Glob`   | `env-guard`         | 阻擋讀取`.env` 類機密設定        |
| `PreToolUse: Bash`        | `env-guard`         | 阻擋透過 shell 存取`.env`        |
| `PreToolUse: Bash`        | `bash-safety`       | 檢查高風險 shell 操作              |
| `PreToolUse: Bash`        | `pre-commit-review` | 在 commit 前確認已完成 Code Review |
| `PostToolUse: Write/Edit` | `secrets-guard`     | 檢查異動是否包含疑似機密           |
| `PostToolUse: Write/Edit` | `lint-on-save`      | 依檔案類型執行可用的 lint 檢查     |

## 安裝 Claude Code

先加入 marketplace，再安裝需要的 plugin：

```text
/plugin marketplace add PinQiH/fullstack-dev-kit
/plugin install workflow-core@fullstack-dev-kit
/plugin install backend-node@fullstack-dev-kit
/plugin install frontend-vue@fullstack-dev-kit
/plugin install python-toolkit@fullstack-dev-kit
/reload-plugins
```

本機開發時可改用 repository 絕對路徑：

```text
/plugin marketplace add D:\_Personal\fullstack-dev-kit
```

## 安裝 Codex

```powershell
codex plugin marketplace add PinQiH/fullstack-dev-kit
codex plugin add workflow-core@fullstack-dev-kit
codex plugin add backend-node@fullstack-dev-kit
codex plugin add frontend-vue@fullstack-dev-kit
codex plugin add python-toolkit@fullstack-dev-kit
```

本機開發時可改用 repository 絕對路徑：

```powershell
codex plugin marketplace add D:\_Personal\fullstack-dev-kit
```

安裝或更新後請開啟新對話，讓 Codex 載入新的 skills。

## 如何使用

### Claude Code

直接執行 namespaced command：

```text
/workflow-core:debug
/backend-node:test-backend
/frontend-vue:test-frontend
/python-toolkit:run-python
```

也可以直接描述需求，讓 Claude Code 依 skill frontmatter 自動選擇功能；例如：「使用 `database-design` 檢查這份 schema」。

### Codex

Codex 會依 skill 的 `name` 與 `description` frontmatter 自動判斷是否載入。需要明確指定時，可以直接點名 plugin skill：

```text
$workflow-core:debugger 分析這個 stack trace 的根本原因
$backend-node:database-design 檢查這份 schema 的命名與索引
$frontend-vue:vue-nuxt-guidelines 審查這個 Vue 元件
$python-toolkit:python-expert 幫我改善這支 Python 程式
```

Codex 本身也有 `/plan`、`/review`、`/status` 等[內建 slash commands](https://learn.chatgpt.com/docs/developer-commands?surface=cli)。[Codex custom prompts](https://learn.chatgpt.com/docs/custom-prompts) 也能將 `~/.codex/prompts/*.md` 顯示成 `/prompts:<name>`，所以先前使用 `/` 觸發自訂內容並沒有錯；但官方已將 custom prompts 標為 deprecated，且它們只存在使用者本機，不會隨 plugin 或 repository 分享。這個 kit 因此以 plugin skills 作為 Codex 的正式入口，不再維護另一份 `codex/prompts/` 複本。

| Codex 機制 | 範例 | 是否由本 plugin 提供 |
| --- | --- | --- |
| 內建 slash command | `/review` | 否，由 Codex 內建 |
| Custom prompt（deprecated） | `/prompts:test-backend` | 否，位於個人的 `~/.codex/prompts/` |
| Plugin skill | `$backend-node:backend-testing-guidelines` | 是，可明確或自動觸發 |

若團隊規範必須在某個專案的每個 Codex 對話中強制生效，請將 [AGENTS.md 範本](plugins/workflow-core/templates/AGENTS.md) 複製到該專案根目錄並依專案調整。

## 常見工作流

| 需求              | Claude Code                     | Codex                                         |
| ----------------- | ------------------------------- | --------------------------------------------- |
| 分析錯誤          | `/workflow-core:debug`        | `$workflow-core:debugger`                   |
| 審查本機變更      | `/workflow-core:code-review`  | `$workflow-core:code-reviewer`              |
| 建立後端測試      | `/backend-node:test-backend`  | `$backend-node:backend-testing-guidelines`  |
| 建立前端測試      | `/frontend-vue:test-frontend` | `$frontend-vue:frontend-testing-guidelines` |
| 系統架構設計      | 使用`senior-architect` agent  | `$workflow-core:senior-architect`           |
| Python 實作或審查 | 使用`python-expert` agent     | `$python-toolkit:python-expert`             |

## 專案結構

```text
plugins/<plugin-name>/
	.claude-plugin/plugin.json    # Claude Code manifest
	.codex-plugin/plugin.json     # Codex manifest
	skills/                       # Claude Code 與 Codex 共用
	commands/                     # Claude Code plugin command
	agents/                       # Claude Code 專屬
	hooks/                        # Claude Code 專屬

.claude-plugin/marketplace.json # Claude Code marketplace
.agents/plugins/marketplace.json # Codex marketplace
```

## 平台差異

Claude Code plugin 可載入 `commands/`、`agents/` 與 lifecycle hooks；Codex 當然支援自己的 slash commands，但 Codex plugin 的可分享工作流應放在 `skills/`，不會把 Claude Code 的 `commands/` 當成 plugin 元件載入。Codex 也不會執行 Claude Code hooks，或把 plugin 規範自動注入每一個對話。

功能入口檔都使用 YAML frontmatter 描述用途：

- `skills/*/SKILL.md`：`name`、`description`
- `commands/*.md`：`description`
- `agents/*.md`：`name`、`description`、`tools`

一般說明文件、reference 與 README 不屬於可觸發入口，因此不強制加入 frontmatter。

## 環境需求與限制

- Claude Code hooks 是 Bash 腳本；Windows 需要可執行 Bash 的環境，例如 Git Bash。
- `env-guard`、`bash-safety`、`secrets-guard`、`pre-commit-review` 與 `lint-on-save` 會依序尋找 `python3`、`python`、`py`；找不到可用直譯器時採 fail-open，不阻斷工具操作。
- `lint-on-save` 只會使用專案或系統中既有的 ESLint、Ruff、Flake8，不會自行安裝套件。
- `team-standards` 不依賴 Python 或 jq。
- `senior-architect` agent 透過 `${CLAUDE_PLUGIN_ROOT}` 尋找附帶腳本，只適用於 plugin 執行環境。
- `third-party-skills.md` 列出的外部 skills 不會隨本 kit 安裝，必須依各自來源另外安裝。

## 更新與驗證

Claude Code：

```text
/plugin marketplace update fullstack-dev-kit
/reload-plugins
```

Codex：

```powershell
codex plugin marketplace upgrade fullstack-dev-kit
codex plugin add workflow-core@fullstack-dev-kit
```

將最後一行換成實際更新的 plugin。更新後請開新對話測試。

維護時請遵守：

- 共用規範只修改 `plugins/*/skills/`，兩端會取得同一份內容。
- Claude Code 專屬 command、agent、hook 保留在各 plugin 根目錄。
- command 檔名與 skill 名稱使用小寫 kebab-case。
- 所有功能入口檔必須提供用途明確的 frontmatter。
- `frontend-vue` 的 forked skills 必須保留各目錄中的 `ATTRIBUTION.md`。

## 授權

本 kit 採 MIT 授權；第三方 fork 的技能保留各自的授權與出處，詳見 [third-party-skills.md](third-party-skills.md)。
