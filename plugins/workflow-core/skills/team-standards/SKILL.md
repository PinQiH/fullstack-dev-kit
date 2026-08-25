---
name: team-standards
description: '全端團隊的共用技術標準。開始任何程式碼修改、重構、程式碼審查或提交前使用，確保安全、tab 縮排、機密保護與完成前自我審查要求都被遵守。'
---

# 團隊技術標準

以下規則適用於所有開發工作。

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

## 延伸規範

- Node.js、資料庫與後端測試：使用 `backend-node` plugin 中的對應 skill。
- Vue/Nuxt、UX 與前端測試：使用 `frontend-vue` plugin 中的對應 skill。
- Python 與虛擬環境：使用 `python-toolkit` plugin 中的對應 skill。
