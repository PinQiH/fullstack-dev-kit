# fullstack-dev-kit

可重複使用的全端工程規範與快捷工作流，同時支援 Claude Code 與 OpenAI Codex。

所有共用功能都以 Agent Skills 維護，因此功能名稱、frontmatter、規範內容與執行流程只有一份來源：

```text
Claude Code：/backend-node:test-backend
Codex：      $backend-node:test-backend
```

兩邊只有平台原生的觸發符號不同，plugin namespace 與功能名稱相同，也都能依自然語言自動選擇適合的 skill。

## 快速選擇

| Plugin | 適用情境 | 共用 Skills | Claude Code 增強 |
| --- | --- | --- | --- |
| `workflow-core` | 團隊標準、Code Review、除錯、Git、安全、決策與架構 | 10 | agents、hooks |
| `backend-node` | Node.js／NestJS 分層、資料庫、API、排程與後端測試 | 6 | 無 |
| `frontend-vue` | Vue 3、Nuxt 3、TypeScript、UX、元件文件與測試 | 4 | 無 |
| `python-toolkit` | Python 開發、Code Review、venv 與程式執行 | 3 | agent |

建議所有人先安裝 `workflow-core`，再依專案技術棧選擇其餘 plugin。

## 快捷工作流

| Plugin | Skill | 功能 | Claude Code | Codex |
| --- | --- | --- | --- | --- |
| `workflow-core` | `code-review` | 程式碼審查 | `/workflow-core:code-review` | `$workflow-core:code-review` |
| `workflow-core` | `debug` | 系統化除錯 | `/workflow-core:debug` | `$workflow-core:debug` |
| `workflow-core` | `git-commit` | Commit message | `/workflow-core:git-commit` | `$workflow-core:git-commit` |
| `workflow-core` | `security-review` | 安全性審查 | `/workflow-core:security-review` | `$workflow-core:security-review` |
| `backend-node` | `api-doc` | API 文件 | `/backend-node:api-doc` | `$backend-node:api-doc` |
| `backend-node` | `cronjob-doc` | 排程文件 | `/backend-node:cronjob-doc` | `$backend-node:cronjob-doc` |
| `backend-node` | `test-backend` | 後端測試 | `/backend-node:test-backend` | `$backend-node:test-backend` |
| `frontend-vue` | `component-doc` | 元件文件 | `/frontend-vue:component-doc` | `$frontend-vue:component-doc` |
| `frontend-vue` | `test-frontend` | 前端測試 | `/frontend-vue:test-frontend` | `$frontend-vue:test-frontend` |
| `python-toolkit` | `run-python` | 執行 Python | `/python-toolkit:run-python` | `$python-toolkit:run-python` |

完整用途與命名規範請見 [WORKFLOWS.md](WORKFLOWS.md)。

## 規範與專業 Skills

除了快捷工作流外，兩個平台也會載入以下規範：

| Plugin | Skill | 用途 |
| --- | --- | --- |
| `workflow-core` | `team-standards` | 安全、縮排、機密保護、測試與完成前自我審查 |
| `workflow-core` | `comment-conventions` | Todo-Tree 與程式碼註解標記 |
| `workflow-core` | `git-workflow` | 分支、commit message 與版本號規範 |
| `workflow-core` | `decision-helper` | 比較方案與記錄決策依據 |
| `workflow-core` | `project-planner` | 任務拆解、相依性、時程與里程碑 |
| `workflow-core` | `senior-architect` | 系統設計、ADR、技術選型與架構圖 |
| `backend-node` | `nodejs-guidelines` | Node.js 分層、非同步、Repository 與 Controller |
| `backend-node` | `nestjs-guidelines` | NestJS Module、DI、DTO、Pipes、Filters、Guards 與維運 |
| `backend-node` | `database-design` | 資料庫、資料表、欄位與 SQL 命名及設計 |
| `frontend-vue` | `vue-nuxt-guidelines` | Vue／Nuxt 架構、Service、TypeScript 與品質閘門 |
| `frontend-vue` | `ux-heuristics` | Nielsen 啟發式、三態、表單與無障礙 |
| `python-toolkit` | `python-expert` | Python 實作、除錯、型別、效能與 Code Review |
| `python-toolkit` | `python-environment` | 建立與使用 venv，避免污染系統 Python |

## 安裝 Claude Code

```text
/plugin marketplace add PinQiH/fullstack-dev-kit
/plugin install workflow-core@fullstack-dev-kit
/plugin install backend-node@fullstack-dev-kit
/plugin install frontend-vue@fullstack-dev-kit
/plugin install python-toolkit@fullstack-dev-kit
/reload-plugins
```

本機開發時可將 repository URL 換成絕對路徑：

```text
/plugin marketplace add D:\_Personal\fullstack-dev-kit
```

安裝後可用 `/help` 搜尋 namespaced skills。

## 安裝 Codex

```powershell
codex plugin marketplace add D:\_Personal\fullstack-dev-kit
codex plugin add workflow-core@fullstack-dev-kit
codex plugin add backend-node@fullstack-dev-kit
codex plugin add frontend-vue@fullstack-dev-kit
codex plugin add python-toolkit@fullstack-dev-kit
```

安裝或更新後請開啟新 task，讓 Codex 載入新的 skills。

## 自然語言使用方式

不需要記住完整名稱，也可以直接描述需求：

```text
幫我找出這個 500 錯誤的根本原因。
依團隊規範審查目前 staged changes。
為 orderService 補齊後端測試。
替這個 Vue 元件補上 loading、error、empty 三態測試。
```

兩個平台會使用相同的 `name` 與 `description` frontmatter 判斷該載入哪個 skill。

## 平台差異

| 能力 | Claude Code | Codex |
| --- | --- | --- |
| 共用 skills | 支援，使用 `/plugin:skill` | 支援，使用 `$plugin:skill` |
| 自然語言自動選擇 skill | 支援 | 支援 |
| Claude agents | 支援 | 不載入；核心工作流不依賴 agent |
| Claude lifecycle hooks | 支援 | 不執行 |
| 強制專案規範 | SessionStart hook | 專案根目錄 `AGENTS.md` |

Codex 的 `~/.codex/prompts/*.md` 仍能建立 `/prompts:<name>`，但[官方已標示 deprecated](https://learn.chatgpt.com/docs/custom-prompts)，而且不會隨 plugin 分享，因此本 kit 不維護另一份 prompts 複本。

若規範必須在每個 Codex task 中強制生效，請將 [AGENTS.md 範本](plugins/workflow-core/templates/AGENTS.md) 複製到目標專案根目錄並依專案調整。

## Claude Code 專屬增強

### Agents

| Plugin | Agent | 用途 |
| --- | --- | --- |
| `workflow-core` | `code-reviewer` | 獨立進行程式碼審查 |
| `workflow-core` | `project-planner` | 建立任務拆解、時程、里程碑與風險分析 |
| `workflow-core` | `senior-architect` | 分析系統架構並產出技術決策建議 |
| `python-toolkit` | `python-expert` | 審查 Python 的正確性、型別、效能與風格 |

### Hooks

`workflow-core` 提供 SessionStart 團隊標準、安全操作防護、機密檢查、commit 前自我審查與可用 linter 檢查。Hook 是 Bash 腳本；Windows 需要 Git Bash。

需要 Python 的 hooks 會依序尋找 `python3`、`python`、`py`；找不到可用直譯器時採 fail-open，不阻斷工具操作。`lint-on-save` 只使用專案或系統既有的 ESLint、Ruff、Flake8，不會自行安裝套件。

## 專案結構

```text
plugins/<plugin-name>/
	.claude-plugin/plugin.json    # Claude Code manifest
	.codex-plugin/plugin.json     # Codex manifest
	skills/<name>/SKILL.md        # 兩平台共用規範與快捷工作流
	agents/                       # Claude Code 專屬增強
	hooks/                        # Claude Code 專屬增強
	templates/                    # 可複製的專案設定範本

.claude-plugin/marketplace.json  # Claude Code marketplace
.agents/plugins/marketplace.json # Codex marketplace
```

## Frontmatter 規範

- `skills/*/SKILL.md`：`name`、`description`
- `agents/*.md`：`name`、`description`、`tools`
- Skill 目錄名稱必須與 frontmatter `name` 完全相同
- `description` 必須描述功能、適用情境與重要邊界，讓兩個平台能正確路由
- 一般 README、reference 與 attribution 文件不是功能入口，不強制加入 frontmatter

## 更新

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

將最後一行換成實際更新的 plugin，並開啟新 task 測試。

## 授權

本 kit 採 MIT 授權；第三方 fork 的 skills 保留各自的授權與出處，詳見 [third-party-skills.md](third-party-skills.md)。
