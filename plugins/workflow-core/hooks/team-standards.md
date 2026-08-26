# 團隊技術標準（常駐）

以下為全端團隊的技術標準，每次工作皆適用。這些是**技術規範**，非個人偏好。

## 安全（不可退讓）
- SQL 一律參數化，禁止字串拼接查詢。
- 使用者輸入輸出到 HTML 前必須跳脫，防止 XSS。
- API Key / 密碼 / Token / 私鑰禁止 hardcode，一律走環境變數或 Secrets Manager。
- 不主動讀取或編輯 `.env` 及機密檔。

## 排版
- 縮排一律使用 **tab**，一層縮排 = 1 個 tab（顯示寬度 2）。
- 建議專案根目錄放 `.editorconfig`（`indent_style = tab`）以硬性約束。

## 流程
- 完成功能／修改／重構後，**回報完成或 commit 前**，必須先自我 Code Review 剛異動的程式，並回報發現。
- 註解遵循 Todo-Tree 標記格式（詳見 `comment-conventions` skill）。

## 對應 skill（需要時自動載入）
- Node 後端規範 → `nodejs-guidelines`；DB 命名 → `database-design`；後端測試 → `test-backend`
- Vue/Nuxt 架構 → `vue-nuxt-guidelines`；UX → `ux-heuristics`；前端測試 → `test-frontend`
