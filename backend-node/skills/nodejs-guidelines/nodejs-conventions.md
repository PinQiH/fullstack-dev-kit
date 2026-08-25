# Node.js 後端編碼規範

這些規則在所有 Node.js / TypeScript 專案中永遠生效，不需要明確載入 `nodejs-guidelines` skill。
詳細說明、Sequelize 規範與 generalRepo 用法請參閱 `nodejs-guidelines` skill。

---

## 命名

- 變數、function、檔名、input、output：**camelCase**
- 不得以底線開頭或結尾（`_name` ❌、`name_` ❌）
- function 名稱一律**動詞 + 名詞**：`getUser`、`addCourse`、`deleteOrder`
- CRUD 動詞固定用：`add / update / delete / get / detail`
- 常數：全大寫底線分隔，`MAX_RETRY_COUNT`

## 程式碼結構

- 一律使用 **early return**，避免深層巢狀
- 迴圈不超過**三層**；條件判斷超過三層需抽成 function
- 多條件判斷：`switch case` 優先於 `else if`
- 縮排：**1 tab**（一層縮排 = 1 個 tab，顯示寬度 2）
- `if / else / for / while / try / catch` 一律加 `{}`

## 語法

- 變數宣告使用 **Just-In-Time**（在第一次使用前宣告）
- 非同步一律使用 `async / await`，禁止裸用 `.then().catch()`
- `undefined` 判斷使用 `typeof value === 'undefined'`，不直接比對 `=== undefined`
- `this` 指向只能用 `self`
- 迴圈優先使用 `map`；複雜邏輯才用 `for`
- UUID 一律使用 `crypto.randomUUID()`，**禁止**額外安裝 `uuid` 套件

## 參數傳遞

所有 function 參數**一律物件解構**：

```js
// ❌
async function createOrder(userId, data, transaction) {}

// ✅
async function createOrder({ userId, data, transaction }) {}
```

## 分層職責

| 層 | 職責 | 禁止事項 |
|----|------|---------|
| Controller | 接收、驗證、呼叫 Service、回傳 | 不寫業務邏輯、不直接操作 DB |
| Service | 業務邏輯、條件判斷、資料組合 | 不碰 `req` / `res`、不引用 Express |
| Repository | 封裝所有 DB 操作、處理 DB 例外 | 不混入業務邏輯、不做格式轉換 |

多表操作必須使用 **Transaction**。

## API 回傳格式

所有 API 一律回傳以下結構，HTTP Status 成功與業務錯誤**皆用 200**：

```js
{
  rtnCode: "0000",  // "0000" = 成功
  rtnMsg: "成功",
  data: {}
}
```

| Status | 對應 Error 類型 |
|--------|----------------|
| 401 | AuthenticationError |
| 403 | PermissionError |
| 409 | DatabaseConflictError |
| 422 | ValidationError |
| 500 | 系統錯誤 |

## Repository 錯誤處理

```js
catch (err) {
  console.log("REPO_NAME_ERR:", err)   // REPO名稱大寫 + ERR
  throw new DatabaseConflictError("自定義錯誤訊息")
}
```

## TypeScript 附加規範

- `tsconfig.json` 必須開啟 `"strict": true`
- 禁止使用 `any`，必要時用 `unknown` + Type Guard
- 物件結構用 `interface`，聯合/交集型別用 `type`
- Controller 和 Service 的 function 必須**明確標示回傳型別**
- `req.body`、`req.query`、`req.params` 取得的資料必須先宣告對應 Interface
