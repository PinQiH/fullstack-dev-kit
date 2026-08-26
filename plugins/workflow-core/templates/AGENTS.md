# 團隊技術標準

以下規則適用於此專案的所有開發工作。

## 安全

- SQL 一律使用參數化查詢，禁止字串拼接 SQL。
- 使用者輸入輸出至 HTML 前必須跳脫，防止 XSS。
- API Key、密碼、Token 與私鑰禁止 hardcode，應使用環境變數或 Secrets Manager。
- 不主動讀取或編輯 `.env` 與其他機密檔。

## 排版

- 縮排使用 tab；一層縮排為一個 tab，顯示寬度為 2。
- 專案應提供 `.editorconfig` 並設定 `indent_style = tab`。

## 流程

- 功能、修改或重構完成後，在回報完成或提交前，先自我 Code Review 異動內容並回報發現。
- 註解使用 Todo-Tree 標記：`// >`、`// -`、`// @`、`// TODO:`、`// FIXME:`、`// ??`、`// !!`。

## 已安裝技能

- 全端工作流：`team-standards`、`comment-conventions`、`git-workflow`、`git-commit`、`code-review`、`security-review`、`debug`、`decision-helper`、`project-planner`、`senior-architect`。
- 後端快捷工作流：`api-doc`、`cronjob-doc`、`test-backend`。
- 前端快捷工作流：`component-doc`、`test-frontend`。
- Python 快捷工作流：`run-python`。
- Node.js、資料庫與後端測試：安裝 `backend-node` 後使用對應技能。
- Vue/Nuxt、UX 與前端測試：安裝 `frontend-vue` 後使用對應技能。
- Python 與虛擬環境：安裝 `python-toolkit` 後使用對應技能。
