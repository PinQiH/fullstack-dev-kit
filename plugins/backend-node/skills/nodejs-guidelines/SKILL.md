---
name: nodejs-guidelines
description: >
  Node.js 後端開發規範。包含核心開發原則、套件使用限制、命名格式、非同步處理、以及 Repository 和 Controller 撰寫原則。
---

# Node.js 後端開發規範

> 速查：本 skill 同目錄附精簡速查檔 `nodejs-conventions.md`。

## 一、核心開發原則（Coding Philosophy）

1. **可讀性與可維護性優先於效能**
   - 多條件判斷 → `switch case`
   - 非同步優先使用 `async / await`
2. **結構單純、提早返回**
   - API / function 一律使用 **early return**
3. **避免複雜度爆炸**
   - 迴圈不得超過 **三層**
   - 條件判斷超過 **三層需抽成 function**
4. **避免不必要的依賴**
   - UUID 一律使用 `crypto.randomUUID()`
   - 禁止額外安裝 `uuid` 套件

---

## 二、JavaScript / Node.js Coding 規範

### 2.1 命名與格式

1. 命名規範
   - 變數 / function / 檔名 / input / output：**camelCase**
   - 不得以底線開頭或結尾
2. Function 命名
   - 一律使用 **動詞 + 名詞**
   - CRUD：`add / update / delete / get / detail`
3. 常數
   - 全大寫，底線分隔（`MAX_RETRY_COUNT`）
4. 縮排
   - **1 tab**（一層縮排 = 1 個 tab，顯示寬度 2）
5. 區塊結構
   - 不同邏輯需空一行
   - `if / else / for / while / try / catch` 一律使用 `{}`

---

### 2.2 語法與寫法規範

1. 優先使用 **ES6+**
2. 變數宣告採用 **Just-In-Time Declaration**
3. 不直接用 `undefined` 判斷

   ```jsx
   typeof value === "undefined";
   ```

4. 條件簡單時優先使用：
   - 三元運算子
   - 邏輯運算子

5. 多條件判斷
   - `switch case` > `else if`

6. 非同步
   - `async / await` 為預設

7. 迴圈
   - 優先使用 `map`
   - 複雜邏輯才用 `for loop`

8. `this` 指向
   - 僅能使用 `self`

---

## 三、TypeScript 專屬規範 (Optional)

若專案使用 TypeScript，請嚴格遵守以下規範：

### 3.1 型別定義與使用

1. **嚴格模式**：
   - 專案的 `tsconfig.json` 必須開啟 `{"strict": true}`。
2. **禁止使用 `any`**：
   - 除非逼不得已（如接接歷史遺留且無文件的第三方套件），否則請使用 `unknown` 並進行 Type Guard 檢查。
3. **介面 (Interface) vs 型別變數 (Type)**：
   - 優先使用 `interface` 定義物件結構、Model 以及 DTO (Data Transfer Object)。
   - 使用 `type` 來定義聯合型別 (Unions) 或交集型別 (Intersections)。
4. **顯式回傳型別**：
   - Controller 和 Service 的 function 必須**明確標示回傳型別**，不依賴預設推論。

### 3.2 參數與 Request/Response (DTO)

1. **Controller 參數**：
   - 任何從 `req.body`, `req.query`, `req.params` 取得的資料，都必須事前宣告對應的 Interface。
2. **Service 與 Repository 參數**：
   - 同樣使用物件解構，但必須有明確的型別定義。

```typescript
interface CreateUserRequest {
  username: string;
  email: string;
}

async createUser(payload: CreateUserRequest): Promise<UserResponse> {
  // ...
}
```

---

## 四、Function 與參數設計

### 3.1 參數傳遞規範

1. **一律使用物件解構**

   ```jsx
   async myFunction({ data, userId, transaction }) {}

   ```

2. 好處
   - 不受順序影響
   - 新增參數不破壞舊程式
   - 可選參數可直接省略

---

## 五、Repository 層規範

### 4.1 通用規則

1. Repository 專責：
   - **所有 DB 操作**
2. Input / Output
   - 統一使用 camelCase
   - 無資料回傳 `null`
3. Repository 複雜時
   - 可將多個 model 操作集中在同一 repository function

---

### 4.2 Repository 參數與資料處理

1. Repository function
   - 使用 **物件解構接參數**
   - 函式內需再解構一次，明確定義 DB 欄位

2. ❌ 錯誤示範

   ```jsx
   db.create(myData);
   ```

3. ✅ 正確示範

   ```jsx
   const dataToCreate = {
     field1: myData.field1,
     field2: myData.field2,
   };
   ```

---

### 4.3 Repository 錯誤處理（統一格式）

```jsx
catch (err) {
  console.log("REPO_NAME_ERR:", err)
  throw new DatabaseConflictError("自定義錯誤訊息")
}

```

---

### 4.4 通用 Repository (`generalRepo.js`)

專案提供 `generalRepo.js` 封裝了常用的 Sequelize 操作，請優先使用：

- `create`, `bulkCreate`
- `update`, `destroy`
- `findAll`, `findOne`, `findAndCountAll`
- `count`, `sum`, `max`, `increment`
- `findOrCreate`

**使用範例：**

```jsx
// 取得列表並分頁
await repository.generalRepo.findAndCountAll({}, "FieldCategories", 1, 10);

// 批次新增
await repository.generalRepo.bulkCreate(
  [{ name: "A" }, { name: "B" }],
  "FieldCategories",
);
```

---

### 4.5 自定義 Repository

- 如果邏輯複雜，建議將相關的 Model 操作封裝在同一個 Repository 函式中。
- **錯誤處理**：必須使用 try-catch 包覆，並拋出 `DatabaseConflictError`。

  ```jsx
  catch (err) {
      console.log("GET_USER_ERR: ", err); // Repo名稱大寫 + ERR
      throw new DatabaseConflictError("取得使用者資料失敗");
  }

  ```

- **參數傳遞**：
  - 統一使用 **物件解構** 傳遞參數。
  - 在函式內部在做一次解構賦值，明確定義需要的欄位。

  ```jsx
  // 正確示範
  async myRepository ({ myData, creator, transaction }){
      const dataToCreate = {
          data_1 : myData.data1,
          data_2 : myData.data2
      };
      return await db.myModel.create(dataToCreate, { transaction });
  }

  ```

---

## 六、Database / Sequelize 規範

### 5.1 Migration

1. 盡量不使用 DB constraint
2. Table 必須包含：
   - `createdAt`
   - `updatedAt`
3. 關聯表需建立唯一索引

---

### 5.2 Model

1. Alias
   - 非必要不自定義

2. 明確指定：
   - `modelName`
   - `tableName`

3. 軟刪除

   ```jsx
   paranoid: true;
   ```

---

### 5.3 DB 操作規範

1. ❌ 禁止在 loop 中呼叫 DB
2. 建議：
   - `bulkCreate`
   - `bulkUpdate`
3. `Promise.all`
   - 僅限「**不同 model**」操作

---

## 七、API / Controller 規範

### 6.1 Controller 原則

1. 接收參數後
   - **立即驗證**
2. 涉及多表操作
   - 必須使用 **Transaction**
3. early return
4. 錯誤一律交由 middleware

---

### 6.2 API 回傳格式

- HTTP Status Code
  - 成功與業務錯誤皆回傳 `200`
- 以 `rtnCode` 判斷結果

```jsx
{
  rtnCode: "0000",
  rtnMsg: "成功",
  data: {}
}

```

---

### 6.3 Error Code 與 Status 對應

| 狀態碼 | 類型                  |
| ------ | --------------------- |
| 401    | AuthenticationError   |
| 403    | PermissionError       |
| 409    | DatabaseConflictError |
| 422    | ValidationError       |
| 500    | 系統錯誤              |

---

## 八、專案結構（標準化）

```
routes/
controllers/
repository/
models/
migrations/
middleware/
config/
utils/
cronJobs/
queue/
seeder/
seedData/
server.js

```

---

## 九、API 開發流程與分層職責

撰寫 API 功能程式 SOP / Checklist ─ 前置與實作流程：

### 9.1 前置設計階段 (Design & Plan)

- **釐清需求**：先弄懂給誰用、做什麼。
- **設計 API 行為**：確認 HTTP Method、Route 及單一職責。並決定成功與失敗的回傳情境。
- **權限與驗證**：明確定義登入需求、角色限制及參數驗證規則。

### 9.2 Controller (入口層)

- 負責：接收 request 資料、驗證參數、檢查權限、呼叫 Service、回傳 response。
- 限制：**絕對不可寫商業邏輯**、**不可直接操作 DB**。 Controller 只負責「接 → 驗 → 轉 → 回」。

### 9.3 Service (業務邏輯層)

- 負責：實作業務流程、條件判斷、組合資料及決定結果。
- 限制：**不碰 HTTP 物件 (req, res)**、**不直接依賴 Express**、必須容易單元測試。

### 9.4 Repository (資料存取層)

- 負責：封裝所有 DB 存取操作、處理 DB 例外。
- 限制：**一個 function 一種查詢**、**不混入業務邏輯**、不處理格式轉換（傳回乾淨的資料結構）。

### 9.5 錯誤與 Response 處理

- 將所有 Error 轉換為標準 `rtnCode` 與 `rtnMsg` (透過 Middleware 統整)。
- 始終回傳統一格式，Frontend 不需要為特殊 API 寫額外處理。
