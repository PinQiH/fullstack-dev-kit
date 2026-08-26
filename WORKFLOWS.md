# 快捷工作流索引

所有公開工作流都放在 `plugins/<plugin-name>/skills/<workflow-name>/SKILL.md`，名稱使用小寫 kebab-case，frontmatter 必須包含相同的 `name` 與用途明確的 `description`。

兩個平台載入同一份 skill，只保留平台原生的觸發符號差異：

- Claude Code：`/plugin-name:workflow-name`
- Codex：`$plugin-name:workflow-name`
- 自動觸發：直接用自然語言描述需求，兩邊都能依 `description` 選擇 skill

## Workflow Core

| Skill | Claude Code | Codex | 用途 |
| --- | --- | --- | --- |
| `code-review` | `/workflow-core:code-review` | `$workflow-core:code-review` | 審查本機變更或 Pull Request |
| `debug` | `/workflow-core:debug` | `$workflow-core:debug` | 系統化除錯與根本原因分析 |
| `git-commit` | `/workflow-core:git-commit` | `$workflow-core:git-commit` | 依 staged changes 產生 commit message |
| `security-review` | `/workflow-core:security-review` | `$workflow-core:security-review` | 審查變更新增的安全風險 |

## Backend Node

| Skill | Claude Code | Codex | 用途 |
| --- | --- | --- | --- |
| `api-doc` | `/backend-node:api-doc` | `$backend-node:api-doc` | 撰寫 API 文件 |
| `cronjob-doc` | `/backend-node:cronjob-doc` | `$backend-node:cronjob-doc` | 撰寫排程文件 |
| `test-backend` | `/backend-node:test-backend` | `$backend-node:test-backend` | 撰寫或審查 Node.js 後端測試 |

## Frontend Vue

| Skill | Claude Code | Codex | 用途 |
| --- | --- | --- | --- |
| `component-doc` | `/frontend-vue:component-doc` | `$frontend-vue:component-doc` | 撰寫 Vue 元件與 Composable 文件 |
| `test-frontend` | `/frontend-vue:test-frontend` | `$frontend-vue:test-frontend` | 撰寫或審查 Vue／Nuxt 前端測試 |

## Python Toolkit

| Skill | Claude Code | Codex | 用途 |
| --- | --- | --- | --- |
| `run-python` | `/python-toolkit:run-python` | `$python-toolkit:run-python` | 在隔離環境執行 Python 程式 |

## 維護規則

- 新增快捷功能時，只新增一份跨平台 skill，不建立 `commands/` 或 `codex/prompts/` 複本。
- Skill 目錄、frontmatter `name`、README 與本索引使用相同名稱。
- Skill 內容使用平台中立的工具描述，不使用 Claude Code 專屬的 dynamic context injection 或 Codex 專屬路徑。
- 平台特有能力保留在獨立元件，例如 Claude Code 的 agents 與 hooks，不得讓共用 skill 必須依賴它們才能完成核心工作流。
