---
description: 後端測試撰寫（Node.js）
---

# /test-backend — 後端測試撰寫

載入 `backend-testing-guidelines` skill，依規範為指定模組產生高品質測試。

## 觸發時機

- 為新功能補充測試
- 重構後驗證行為沒有退化
- 提升模組覆蓋率
- 審查現有測試是否符合規範

## 執行流程

1. **載入測試 skill**：載入 `backend-testing-guidelines` skill
2. **確認測試層級**：
   - Controller → 整合測試（supertest + 真實流程）
   - Service → 單元測試（Mock Repository）
   - Repository → 介接測試（真實 DB）
3. **讀取目標程式碼**：理解函式簽名、回傳格式、錯誤情境
4. **產出測試結構**：
   - `describe` 對應模組或 API 路徑
   - `it` 命名格式：`序號. HTTP方法 路徑 - 行為描述`
   - 涵蓋成功路徑、錯誤路徑、邊界情境
5. **驗證生命週期**：
   - Service 測試確認有 `jest.clearAllMocks()`
   - DB 測試確認有 `afterAll` 清理

## 測試命名規範

```javascript
// ✅ 正確格式
it("01. POST /orders - 建立訂單成功，回傳訂單 id")
it("02. POST /orders - 缺少 productId，回傳 422")
it("03. POST /orders - 使用者未登入，回傳 401")
```

## 使用範例

```
/test-backend src/services/orderService.js
```

```
/test-backend 為 courseController 的 POST /courses 補齊測試，目前只有成功情境
```
