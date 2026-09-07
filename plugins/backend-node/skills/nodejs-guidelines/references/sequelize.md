# Express／Sequelize 範本慣例

僅在目標專案已採用 generalRepo、DatabaseConflictError 與對應回應契約時使用。
先確認實際 middleware 的 HTTP 狀態處理；以下歷史範例不能覆蓋現有 API 契約。
NestJS／TypeORM 不套用本檔；見 [入口](../SKILL.md)。

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
