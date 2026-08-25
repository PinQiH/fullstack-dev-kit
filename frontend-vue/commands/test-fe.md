---
description: 前端測試撰寫（Vue/Nuxt）
---

# /test-fe — 前端測試撰寫

載入 `frontend-testing-guidelines` skill，依規範為指定的 Vue 元件 / composable / 頁面產生高品質測試。

## 觸發時機

- 為新元件或 composable 補充測試
- 重構後驗證 UI 行為與狀態沒有退化
- 補齊關鍵使用者流程的 E2E 測試
- 審查現有前端測試是否符合規範

## 執行流程

1. **載入測試 skill**：載入 `frontend-testing-guidelines`
2. **確認測試層級**：
   - 純函式 / composable → Vitest 單元測試
   - 元件（render / props / emit / 狀態）→ Vitest + Vue Test Utils
   - 關鍵使用者流程 → Playwright E2E
3. **讀取目標程式碼**：理解 props、emit、composable 回傳、三態（loading/error/empty）
4. **產出測試結構**：
   - `describe` 對應元件或流程
   - `it` 命名格式：`序號. 行為 - 預期結果`
   - 涵蓋成功、失敗、邊界與三態
5. **確認 Mock 邊界**：
   - Mock API / Service 層，不打真實後端
   - 不 Mock 被測元件的內部細節
6. **驗證生命週期**：
   - `beforeEach` 呼叫 `vi.clearAllMocks()`
   - E2E 測試後清理狀態

## 使用範例

```
/test-fe src/components/admin/IngestionJobList.vue
```

```
/test-fe 為 useAsyncState composable 補齊失敗與 loading 情境
```
