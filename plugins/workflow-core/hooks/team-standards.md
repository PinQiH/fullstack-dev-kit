# 團隊技術標準（常駐）

以下為全端團隊的技術標準，每次工作皆適用。這些是**技術規範**，非個人偏好。

## 安全

- SQL 一律使用參數化查詢，禁止以字串拼接組 SQL。
- 使用者輸入輸出至 HTML 前必須跳脫，防止 XSS。
- API Key、密碼、Token 與私鑰禁止 hardcode，應使用環境變數或 Secrets Manager。
- 不主動讀取或編輯 `.env` 與其他機密檔。

## 排版

- 縮排使用 tab；一層縮排為一個 tab，顯示寬度為 2。
- 建議專案根目錄提供 `.editorconfig` 並設定 `indent_style = tab`。

## 流程

- 功能、修改或重構完成後，在回報完成或提交前，先自我 Code Review 異動內容並回報發現。
- 註解遵循 `comment-conventions` skill 的 Todo-Tree 標記格式。
- 撰寫或修改技術文件（README、SOP、規格、runbook、交接文件）前，先載入 `doc-style` skill。

## 驗證與回報

- 每次新增或串接 API，列出需要的測試，逐項標示「已補／建議補／不需要」並附理由。
- 能自己驗證的先驗證（測試、curl、容器內指令），再回報。
- 建置、單元測試、E2E、實機驗證分開回報；沒做的明確標示「未執行」與原因，不合併成一句「已測試」。

## 對應 skill（需要時自動載入）
- Node 後端規範 → `nodejs-guidelines`；NestJS 專屬規範 → `nestjs-guidelines`
- DB 命名 → `database-design`；後端測試 → `test-backend`
- Vue/Nuxt 架構 → `vue-nuxt-guidelines`；UX → `ux-heuristics`；前端測試 → `test-frontend`
