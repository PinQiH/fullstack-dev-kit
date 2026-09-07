# 測試、TypeScript 與反模式

適用於已採用本 kit NestJS 範本基礎設施的專案；先閱讀 [入口與適用範圍](../SKILL.md)。

## 十三、測試

### 13.1 命名格式

```ts
it('01. 查詢成功 - 應以建立時間新到舊排序', ...)
it('02. 更新失敗 - 查無資料應拋出 NotFoundError 且不呼叫 save', ...)
```

`編號. 情境 - 預期結果`，編號在**整個檔案內連續**（跨 describe 也連續）。

### 13.2 只替換邊界依賴

Service 測試替換 Repository，不連真實資料庫。
驗證的是業務判斷，不是資料有沒有真的寫進去——後者屬整合測試。

### 13.3 測試要鎖住「錯了也不會有徵兆」的東西

這類斷言價值最高，且要在註解寫清楚**改壞會怎樣**：

```ts
// !! 若實作改成 logOut() 之後才讀 request.sessionID，
// !! 記到的會是一個從來沒有人登入過的 id，與登入事件永遠配不起來。
// !! 程式不會報錯，資料看起來也很正常，只是完全對不上
```

### 13.4 預期值不從實作 import

```ts
// ✅ 用同一套演算法重算
const EXPECTED = createHash('sha256').update(ID).digest('hex').slice(0, 16);

// ❌ 從實作 import hashSessionId()——演算法被改掉時測試會跟著改，什麼也擋不住
```

### 13.5 單元測試測不出來的東西

交易行為、連線隔離、外部套件的單位約定，
都只有連真實資料庫／實際啟動才驗得出來。
**不要因為測試全過就宣稱功能正常。**

### 13.6 純 ESM 套件要加 `transformIgnorePatterns`

`@nestjs/passport`、`@nestjs/event-emitter` 都踩過。
`npx jest` 出現 `Unexpected token 'export'` 就是這個問題，
`package.json` 的 jest 設定與 `test/jest-e2e.json` **兩處都要加**。

---

## 十五、TypeScript（NestJS 特有的部分）

### 15.1 區分純型別與執行期需要的 class

`Request`、`ConfigType` 與純 interface 使用 `import type`，避免裝飾器 metadata
在 `isolatedModules` 等設定下錯誤引用不存在的執行期值。

`ValidationPipe` 需要的 DTO class，以及使用 class token 注入的 provider，
必須保留一般 import；不可一律改成 `import type`，否則執行期無法取得 class。

來源：[NestJS 驗證文件](https://docs.nestjs.com/techniques/validation)。

### 15.2 型別標註優於型別斷言

```ts
// ❌ 觸發 no-unnecessary-type-assertion，--fix 移除後又觸發 no-unsafe-enum-comparison
const status = exception.getStatus() as HttpStatus;

// ✅
const httpStatus: HttpStatus = exception.getStatus();
```

### 15.3 常數用 `as const` ＋ 字面值聯集

```ts
export const PERMISSION = { TODO_READ: 'todo:read', ... } as const;
export type PermissionCode = (typeof PERMISSION)[keyof typeof PERMISSION];
```

打錯會在編譯期被抓到，也換回全域搜尋的能力。

### 15.4 `noUncheckedIndexedAccess` 已開啟

陣列索引取值會是 `T | undefined`，需先檢查。

---

## 十六、註解與語言

### 16.1 標記（詳見 `comment-conventions` skill）

```ts
// > 區塊／class 標題
// - 函式或段落
// @ 重點說明：為什麼這樣寫、選擇的理由
// !! 警告：不這樣做會出什麼事
// TODO: 待辦
// ?? 疑問
```

### 16.2 `// !!` 是這個專案最重要的慣例

不是「注意」，而是「**這裡有踩過或預見的坑，改動前先讀完**」。
寫的時候要寫出**失效的方式**，特別是無聲失敗：

```ts
// !! 必須明確列出：select 一旦指定就只會撈出列到的欄位，
// !! 少了 lockedUntil，AuthService 會永遠判定為未鎖定，
// !! 整個帳號鎖定機制形同虛設而且沒有任何錯誤訊息
```

### 16.3 語言分界

| 內容                                        | 語言               |
| ------------------------------------------- | ------------------ |
| 註解                                        | 繁體中文           |
| 變數、函式、class 名                        | 英文               |
| `logger.*()` 訊息                         | **英文**     |
| 環境變數驗證訊息                            | **英文**     |
| `rtnMsg`、`AppError` 訊息、DTO 驗證訊息 | **繁體中文** |
| Swagger 的 summary／description             | 繁體中文           |

判準：**終端使用者看得到的用中文，工程師與機器看的用英文。**
不放 emoji。

---

## 十七、反模式清單

以下在此專案已明確拒絕，不要提議：

| 反模式                                 | 為什麼不做                                              |
| -------------------------------------- | ------------------------------------------------------- |
| 自建 Repository 轉發層                 | TypeORM Repository 已是 Repository 模式                 |
| DTO 用 interface                       | 執行期不存在，裝飾器無處可掛                            |
| Service 拋 NestJS 內建例外             | 業務層不該認得 HTTP                                     |
| `configService.get<T>('a.b')`        | 靠斷言，改名不會被抓到                                  |
| path alias                             | 要處理三處解析，且`baseUrl` 將失效                    |
| 業務模組標`@Global()`                | 依賴關係變隱晦                                          |
| `@RequireRoles()`                    | 程式碼認得具體角色，RBAC 失去意義                       |
| 刪除回 204                             | 無法攜帶`rtnCode`，前端要寫例外                       |
| 為幾十行程式碼引入套件                 | 已自寫`SnakeNamingStrategy`、Valkey throttler storage |
| `repository.delete(criteria)` 直接用 | 繞過稽核與稽查員，無聲漏記                              |
| `Promise.all` 平行跑 bcrypt          | 一口氣佔滿只有 4 條的 libuv 執行緒池                    |
| 交易中用`this.xxxRepository`         | 走連線池另一條連線，不屬於該交易                        |
| `eventEmitter.emit()` 發稽核事件     | 不等待，稽核失敗時業務照樣回成功                        |
