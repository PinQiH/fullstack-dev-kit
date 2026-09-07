# 分層與命名

適用於已採用本 kit NestJS 範本基礎設施的專案；先閱讀 [入口與適用範圍](../SKILL.md)。

## 〇、與 nodejs-guidelines 的關係

通用的 Node.js 規範（camelCase、動詞＋名詞、物件解構參數、early return、
禁用 `any`、顯式回傳型別、strict mode）一律沿用 `nodejs-guidelines`，本檔不重複。

**但有三處 NestJS 必須覆寫，遇到時以本檔為準：**

| nodejs-guidelines                                   | NestJS 專案                                                          | 為什麼必須覆寫                                                                                                                         |
| --------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 「優先使用`interface` 定義 DTO」                  | **DTO 一定是 `class`**                                       | interface 編譯後完全消失，執行期沒有東西可掛裝飾器，`ValidationPipe` 也就沒有東西可驗。此專案第 2 站就是從 interface 改成 class 的   |
| 「Repository 專責所有 DB 操作」＋`generalRepo.js` | **不自建 Repository 層**                                       | 那套是 Sequelize 的做法。TypeORM 的`Repository` 本身就是 Repository 模式（Data Mapper）的實作，再包一層只轉發的 class 換不到任何東西 |
| Repository 錯誤處理拋`DatabaseConflictError`      | **Service 拋 `AppError` 子類，資料庫錯誤由 Filter 統一翻譯** | 見 [錯誤處理](http-validation.md)                                                                                                                               |

命名部分則是延用而非覆寫：`nodejs-guidelines` 的
CRUD 動詞（`add / update / delete / get / detail`）在此專案的體現是
`addTodo`／`updateTodo`／`deleteTodo`／`getTodos`／`getTodoDetail`——
**動詞後面要帶完整資源名**，不用 `findAll` 這種脫離上下文就看不懂的名字。

---

## 一、分層與職責邊界

```
Controller  ── HTTP 邊界。解析請求、呼叫 Service、回傳資料本體
Service     ── 業務判斷。不知道自己正在服務 HTTP
Repository  ── TypeORM 的 Repository 直接注入使用
```

### 1.1 Service 直接注入 Repository

```ts
constructor(
	@InjectRepository(Todo)
	private readonly todoRepository: Repository<Todo>,
) {}
```

真的要換 ORM 時，要改的是 Service 內的查詢寫法，
多一層轉發並不會讓那件事變簡單。

### 1.2 Service 不得認得 HTTP

Service 拋 `NotFoundError`（自訂），**不是** `NotFoundException`（NestJS 內建）。
內建例外本質是 HTTP 概念——同一段邏輯若改由排程呼叫，「404」毫無意義。
翻譯成狀態碼是 `AllExceptionsFilter` 在邊界上才做的事。

### 1.3 Controller 不得碰 Express

需要 `request.user` 時用 `@CurrentUser()`，不要 `@Req()`。
唯一例外是 session 的建立與銷毀（`logIn` / `logOut` / `session.destroy`），
那本來就是 HTTP 層的動作，沒有 Service 方法可放。

---

## 二、命名（NestJS 特有的部分）

### 2.1 主鍵是 `<entity>Id`，不是 `id`

```ts
@PrimaryGeneratedColumn('uuid')
todoId: string;   // 對應 todo_id
```

JOIN 時 `todos.todo_id = comments.todo_id` 兩側對稱，
不會出現 `todos.id = comments.todo_id` 這種左右不一致。

**但路由參數一樣使用 `:<entity>Id`**

### 2.2 方法名要標示用途與風險

`getUserForAuthentication`（會帶出密碼雜湊）、`getUserForPasswordChange`。
命名本身就是警告，避免被當成一般查詢誤用。

### 2.3 不使用 path alias

一律相對路徑。`baseUrl` 在 TypeScript 7 將失效，
且 alias 要同時處理 tsc、jest 與 dist 執行期三處解析。
