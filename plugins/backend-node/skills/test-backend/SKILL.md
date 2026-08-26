---
name: test-backend
description: '為 Node.js Controller、Service 或 Repository 撰寫、補齊或審查測試，套用單元測試、整合測試、Test Double、生命週期與命名規範。'
---

# 後端測試撰寫與規範

> 速查：本 skill 同目錄附精簡速查檔 `testing-conventions.md`。

先讀取測試目標並判斷其架構層級，再依下列規範產生或審查測試。涵蓋成功路徑、錯誤路徑與邊界情境，完成後執行專案既有的後端測試指令。

本文件規範 Node.js 後端專案中各層級的測試標準，確保測試具備高覆蓋率、高穩定性與好維護的特性。

---

## 1. 測試金字塔與分層策略

後端測試應遵循測試金字塔原則，依據不同架構層級撰寫對應的測試：

1. **Controller 整合測試 (Integration Test)**
   - **目標**：驗證 API 路由、參數驗證、權限檢查、HTTP 狀態碼及核心中介軟體。
   - **特徵**：啟動 Express 實體、連接測試資料庫 (Test DB)、使用 Supertest 發送 HTTP Request。
   - **Mock 原則**：原則上不 Mock Service 與 Repository，走真實流程。僅 Mock 外部第三方 API 或非核心中介軟體。

2. **Service 單元測試 (Unit Test)**
   - **目標**：驗證核心商業邏輯、條件分支、錯誤處理與資料轉換。
   - **特徵**：純粹的邏輯測試，速度極快，不需要依賴真實的 DB 啟動。
   - **Mock 原則**：**必須 Mock Repository 層** (資料庫操作) 與外部依賴，專注測試業務邏輯本身。

3. **Repository 介接測試 (Integration/Unit Test)**
   - **目標**：驗證 SQL 查詢、ORM 操作、資料庫語法正確性。
   - **特徵**：需要連接真實的測試資料庫，不應依賴 Service 或 Controller。
   - **Mock 原則**：不 Mock 資料庫，寫入與讀取都在真實環境中發生。

---

## 2. 測試生命週期與環境隔離 (Lifecycle & Setup)

測試的生命週期管理是保證測試穩定的關鍵，避免「會互相干擾的非同步衝突」(Flaky Tests)。

### 2.1 BeforeAll / BeforeEach
- **整合/DB 測試**：在 `beforeAll` 中確認資料庫連線，建立基礎必須資料 (如測試帳號、依賴的其他配置表)。
- **單元/Service 測試**：在 `beforeEach` 中使用 `jest.clearAllMocks()` 或 `jest.resetAllMocks()`，確保前一個測試的 Mock 狀態不會污染下一個測試。

### 2.2 AfterAll
- **整合/DB 測試**：在 `afterAll` 必須包含 `force: true` 的刪除操作以清空產生的測試資料，最後務必 `close()` 關閉資料庫連線，避免佔用連線池。

**嚴禁事項：**
- 不得在中途手動留下髒資料給下一個測試檔。
- 不得在未清空測試資料時直接關閉連線。

---

## 3. 測試雙替身策略 (Test Doubles: Mock / Spy / Stub)

在撰寫單元測試時，請嚴格區分並合理使用 Jest 提供的 Test Doubles：

1. **Mock (模擬行為)**
   - 用於取代真實依賴（如取代 DB 的 `repository.findUser`）。
   - 範例：`jest.spyOn(repository, 'findUser').mockResolvedValue(mockData)`
2. **Spy (監視呼叫)**
   - 用於驗證一個方法「是否被正確呼叫」、「傳入次數」與「傳入參數」，但**不改變原行為**。
   - 範例：`expect(emailService.send).toHaveBeenCalledWith(userEmail)`
3. **不要過度 Mock**
   - 反模式：把所測物件的內部私有方法也 Mock 掉。只 Mock「邊界依賴」(如 DB、Redis、第三方 API)。

---

## 4. Controller 整合測試詳細 SOP (tests/controllers/)

### 4.1 檔案與結構規範
- 檔名：`[resource]Controller.test.js`
- 一個 Controller 對應一個測試檔，`it` 的命名需遵循 `[序號]. [HTTP METHOD] [路徑] - [行為描述]`。
  - 例如：`01. POST /courses - 建立課程成功`

### 4.2 中介軟體 (Middleware) 的處理
在整合測試中，我們專注於 Controller，因此通常建議 Mock 掉繁瑣的驗證或紀錄：

```javascript
// Mock 權限驗證，以便專注測 Controller 行為
const mockUser = { userId: "uuid", roles: [{ roleName: "admin" }] };
jest.mock("@middleware/auth", () => ({
  authenticated: (req, res, next) => { req.user = mockUser; next(); },
  // ... 其他驗證皆直接 next()
}));

// Mock Logger，減少測試雜訊
jest.mock("@middleware/operateLogger", () => (req, res, next) => next());
```

### 4.3 Assertions (斷言) 規範
每個整合測試成功案例**至少**驗證：
```javascript
expect(res.status).toBe(200);
expect(res.body.rtnCode).toBe("0000");   // 確認系統自定義成功碼
expect(res.body.data).toHaveProperty("id"); // 確認資料結構
```

---

## 5. 常見測試反模式 (Anti-patterns)

為了保持測試的高品質，嚴格禁止以下寫法：

1. **為了測試而去修改 Production Code**
   - 測試應該適應程式，而不是反過來。
2. **直接呼叫 Controller 函式**
   - 整合測試必須透過 `supertest` 發動 HTTP 請求，驗證完整 Request/Response 週期。
3. **斷言內部變數或實作細節**
   - 測試應該只驗證「對外可觀察結果」(回傳值、State、或是被 Mock 的邊界是否有正確參數傳入)。
4. **一個 `it` 裡面塞了三種不同邏輯 (Fat Tests)**
   - 一個 `it` 最好只專注一件事。例如：「建立失敗(缺少參數)」、「建立失敗(權限不足)」、「建立成功」應該是三個獨立的 `it`。

---

## 6. Definition of Done（測試完成標準）

- **涵蓋率 (Coverage)**：核心 Service 分支覆蓋率必須達 80% 以上。
- **隔離性 (Isolation)**：所有的測試都可以被平行或隨機順序單獨執行。
- **可讀性 (Readability)**：不需要閱讀 Controller / Service 原始碼，即可透過 `describe` 和 `it` 的敘述理解 API 的所有預期行為。
