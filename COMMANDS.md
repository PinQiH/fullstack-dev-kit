# Command 索引

本文件索引的是 Claude Code plugin 的 `commands/*.md`，不是 Codex 所有 `/` 指令。所有 command 檔名使用小寫 kebab-case，並以檔名作為短名稱。每個 command 必須包含 `description` frontmatter，第一個標題統一使用 `# /command — 用途`。

安裝 plugin 後，Claude Code 會加上 plugin namespace；例如 `test-backend.md` 的實際呼叫名稱是 `/backend-node:test-backend`。

Codex 的正式共用入口是同一個 plugin 內的 skills，可用 `$plugin-name:skill-name` 明確觸發，也能由 Codex 依 frontmatter 自動選擇。個人 `~/.codex/prompts/*.md` 仍可透過 `/prompts:<name>` 使用，但[官方已標示 deprecated](https://learn.chatgpt.com/docs/custom-prompts)，而且不會隨 repository 或 plugin 安裝。

## Workflow Core

| 檔案 | Claude Code 呼叫名稱 | 用途 |
| --- | --- | --- |
| `code-review.md` | `/workflow-core:code-review` | 呼叫獨立 agent 審查程式碼品質 |
| `debug.md` | `/workflow-core:debug` | 系統化除錯與根本原因分析 |
| `git-commit.md` | `/workflow-core:git-commit` | 依團隊規範產生 Git commit 訊息 |
| `security-review.md` | `/workflow-core:security-review` | 審查目前分支的安全性風險 |

## Backend Node

| 檔案 | Claude Code 呼叫名稱 | 用途 |
| --- | --- | --- |
| `api-doc.md` | `/backend-node:api-doc` | 撰寫 API 文件 |
| `cronjob-doc.md` | `/backend-node:cronjob-doc` | 撰寫排程文件 |
| `test-backend.md` | `/backend-node:test-backend` | 撰寫 Node.js 後端測試 |

## Frontend Vue

| 檔案 | Claude Code 呼叫名稱 | 用途 |
| --- | --- | --- |
| `component-doc.md` | `/frontend-vue:component-doc` | 撰寫 Vue 元件與 Composable 文件 |
| `test-frontend.md` | `/frontend-vue:test-frontend` | 撰寫 Vue／Nuxt 前端測試 |

## Python Toolkit

| 檔案 | Claude Code 呼叫名稱 | 用途 |
| --- | --- | --- |
| `run-python.md` | `/python-toolkit:run-python` | 執行 Python 程式並管理虛擬環境 |
