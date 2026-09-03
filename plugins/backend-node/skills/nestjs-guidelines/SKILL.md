---
name: nestjs-guidelines
description: NestJS 專屬開發規範。分層邊界、Module／Controller／DTO／Entity 慣例、AppError 錯誤體系、統一回應格式、設定注入、交易管理、稽核、測試與 Migration。撰寫或修改任何 NestJS 程式碼前載入。
---
# NestJS 開發規範

**適用前提**：本規範假設專案已具備 `AppError` 錯誤體系、`ResponseInterceptor`
統一回應、`TransactionService` 交易管理與 `AuditModule` 稽核機制；
新專案請先建立這些基礎設施，再套用本規範。

---

## 〇、與 nodejs-guidelines 的關係

通用的 Node.js 規範（camelCase、動詞＋名詞、物件解構參數、early return、
禁用 `any`、顯式回傳型別、strict mode）一律沿用 `nodejs-guidelines`，本檔不重複。

**但有三處 NestJS 必須覆寫，遇到時以本檔為準：**

| nodejs-guidelines                                   | NestJS 專案                                                          | 為什麼必須覆寫                                                                                                                         |
| --------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 「優先使用`interface` 定義 DTO」                  | **DTO 一定是 `class`**                                       | interface 編譯後完全消失，執行期沒有東西可掛裝飾器，`ValidationPipe` 也就沒有東西可驗。此專案第 2 站就是從 interface 改成 class 的   |
| 「Repository 專責所有 DB 操作」＋`generalRepo.js` | **不自建 Repository 層**                                       | 那套是 Sequelize 的做法。TypeORM 的`Repository` 本身就是 Repository 模式（Data Mapper）的實作，再包一層只轉發的 class 換不到任何東西 |
| Repository 錯誤處理拋`DatabaseConflictError`      | **Service 拋 `AppError` 子類，資料庫錯誤由 Filter 統一翻譯** | 見第六節                                                                                                                               |

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

---

## 三、DTO

### 3.1 一定是 class（覆寫 nodejs-guidelines）

見第〇節。

### 3.2 驗證裝飾器由寬到嚴「由上往下」寫

**裝飾器由下往上執行**，因此最基礎的檢查寫在最下面才會最先執行。

```ts
// 實際執行順序：IsNotEmpty → IsString → MaxLength
@MaxLength(200, { message: '標題長度不可超過 200 字' })
@IsString({ message: '標題必須是文字' })
@IsNotEmpty({ message: '標題不可為空' })
title: string;
```

搭配 `stopAtFirstError: true`，空字串得到的是「不可為空」而非「長度超過限制」。
**調整順序前先確認這個影響。**

### 3.3 `@IsOptional()` 的語意

是「沒帶或帶 undefined 就跳過**後續所有**驗證」，不是「允許空值」。

### 3.4 共用規則抽成常數

密碼規則同時被註冊與修改密碼使用，抽到 `common/constants/password.constant.ts`。
兩處各寫一份的話，調整規則只會改到其中一邊。

### 3.5 `ValidationPipe` 的四個關鍵選項

```ts
whitelist: true,              // DTO 作為欄位白名單的實際執行者
forbidNonWhitelisted: true,   // 送錯欄位直接報錯，不靜默剔除
transform: true,              // @Type / @Transform 才會生效
stopAtFirstError: true,       // 每欄只回報第一條失敗規則
transformOptions: { enableImplicitConversion: false },
```

**`enableImplicitConversion` 必須關閉**：隱式轉換依型別標註自動猜測，
布林值的猜測結果是錯的（`'false'` 會變成 `true`）。

---

## 四、Controller

### 4.1 裝飾器順序

由上而下：**Swagger 文件 → 權限 → 存取控制 → 限流 → HTTP**

Swagger 那組通常很長，集中在最上面才不會把真正影響行為的裝飾器淹掉。

### 4.2 靜態路徑必須宣告在動態參數之前

```ts
@Delete('completed')   // 必須在上面
@Delete(':id')
```

寫反的話 `completed` 被 `:id` 吃掉，`parseUuidPipe` 判定格式錯誤回 422，
**錯誤訊息會指向「id 格式不正確」，完全看不出是路由順序問題。**

### 4.3 Controller 只回傳資料本體

不要自己包 `{ rtnCode, rtnMsg, data }`，那是 `ResponseInterceptor` 的事。

### 4.4 回應狀態碼

- `@Post` 建立資源用預設 201，**不要明寫**（明寫會讓人以為有特殊考量）
- 登入這類非建立行為的 POST 要 `@HttpCode(HttpStatus.OK)`
- **刪除用 200 不用 204**：204 依定義不得帶 body，也就無法攜帶 `rtnCode`，
  前端得為刪除單獨寫例外處理。統一格式的價值來自「沒有例外」

### 4.5 重複的 Swagger 裝飾器抽成區域函式

```ts
const apiTodoNotFoundResponse = (): MethodDecorator =>
	ApiErrorResponse(
		HttpStatus.NOT_FOUND,
		RTN_CODE.NOT_FOUND,
		'指定的待辦事項不存在',
		'找不到 id 為 xxx 的待辦事項',
	);
```

---

## 五、Entity 與資料庫

### 5.1 欄位名交給 `SnakeNamingStrategy`，資料表名手寫

複數化不是機械規則能處理的，`@Entity('todos')` 明確指定。

### 5.2 時間一律 `timestamptz`

**不可用不帶時區的 `timestamp`，它會直接捨棄時區資訊。**
三層分工：資料庫 `timestamptz` → 程式內 `Date` → API 輸出 ISO 8601 UTC。
禁止以 varchar 儲存 ISO 字串。

### 5.3 明確指定長度，給資料庫層預設值

```ts
@Column({ type: 'varchar', length: 200 })      // 不放任 text
@Column({ type: 'boolean', default: false })   // 直接下 SQL 時也不會漏填
```

### 5.4 敏感欄位 `select: false`，以及它的代價

```ts
@Column({ type: 'varchar', length: 255, select: false })
password: string;
```

縱深防禦：即使某處忘了過濾輸出，查出來的物件本來就沒有這個欄位。

**代價**：用 `select: {...}` 明確指定欄位時，
**漏列的欄位會永遠是 undefined 而不報錯**。
此專案已因此無聲失效兩次（`lockedUntil` 讓帳號鎖定完全不生效、
`passwordChangedAt` 讓過期旗標永遠算錯）。
**新增欄位後要檢查所有用到 `select` 的查詢。**

### 5.5 外鍵策略依「資料在主體消失後還有沒有價值」決定

| 表                     | 外鍵                       | 理由                                               |
| ---------------------- | -------------------------- | -------------------------------------------------- |
| `audit_logs`         | **不設**             | 稽核紀錄要保存數年，使用者被刪時不可跟著消失       |
| `password_histories` | 設 ＋`ON DELETE CASCADE` | 舊密碼雜湊在使用者消失後只剩負債，是離線破解的素材 |

### 5.6 `tsconfig` 關閉 `strictPropertyInitialization`

全專案唯一放寬的 strict 選項，換取 Entity 欄位不必逐一加非空斷言。
（其餘 strict 規範沿用 `nodejs-guidelines`。）

---

## 六、錯誤處理

### 6.1 錯誤體系

```
AppError（abstract，自帶 httpStatus 與 rtnCode）
├── NotFoundError        404 / 4040
├── ValidationError      422 / 4220
├── AuthenticationError  401 / 4010
├── PermissionError      403 / 4030
├── ConflictError        409 / 4090
└── RateLimitError       429 / 4290
```

Filter 只負責取出來用，不做判斷。

### 6.2 安全邊界

**未預期的錯誤絕不可把原始訊息回給呼叫端**，一律回
`系統發生錯誤，請稍後再試`。完整內容只寫進伺服器日誌。
資料庫錯誤訊息會洩漏資料表結構、欄位名稱與 SQL 片段。

### 6.3 第三方例外要翻譯成自家錯誤

passport 拋英文 `Unauthorized`、`@nestjs/throttler` 拋英文
`Too Many Requests`。都要在 Guard 內覆寫轉成 `AppError`：

```ts
// LocalAuthGuard
handleRequest<TUser>(error: unknown, user: TUser): TUser {
	if (error instanceof AppError) throw error;   // 自己拋的保留原訊息
	if (error || !user) throw new AuthenticationError('帳號或密碼錯誤');
	return user;
}
```

否則錯誤格式與語言不一致，而且繞過整套錯誤體系。

### 6.4 錯誤訊息的顆粒度是安全決策

- 帳號不存在與密碼錯誤 → **完全相同**的訊息（否則可列舉帳號）
- 權限不足 → 不列出缺少哪個權限（否則等於公開權限碼清單）
- 限流 → 不含次數與剩餘秒數（剩餘時間放 `Retry-After` 標頭）

---

## 七、回應格式

```ts
{ rtnCode: '0000', rtnMsg: '成功', data: ... }
```

- 由 `ResponseInterceptor` 統一包裝，Controller 不參與
- `data` 為 `undefined` 時轉成 `null`——JSON 序列化會丟掉 undefined 欄位，
  導致前端有時看得到 `data`、有時看不到
- 需要原生格式的端點（如 terminus 的健康檢查）標 `@RawResponse()`
- 分頁結果整包放 `data` 內（`data.items` / `data.total`），
  維持「頂層永遠只有三個欄位」

---

## 八、設定

### 8.1 一律 `registerAs` ＋ `ConfigType`

```ts
export default registerAs('todo', () => ({ ... }));

constructor(
	@Inject(todoConfig.KEY)
	private readonly config: ConfigType<typeof todoConfig>,
) {}
```

**不用 `configService.get<string>('todo.xxx')`**——那要靠泛型斷言，
欄位改名不會被型別檢查抓到。

### 8.2 屬性名不可與 import 的設定同名

```ts
// ❌ TS2502：型別註解解析到屬性自己
private readonly securityConfig: ConfigType<typeof securityConfig>

// ✅
private readonly security: ConfigType<typeof securityConfig>
```

### 8.3 環境變數啟動時驗證

`env.validation.ts` 以 class-validator 驗證，失敗直接中止啟動。
設定錯誤要在啟動時爆炸，而不是等第一個請求打進來才發現。

**驗證訊息用英文**（給工程師看），且**只輸出欄位名與規則，不可輸出實際值**
（避免密碼被寫進啟動日誌）。

### 8.4 裝飾器需要的設定值另外處理

裝飾器在 class 定義期求值，那時 DI 容器還不存在。
`@Throttle()` 這類需要設定值的，另置一份讀 `process.env` 的模組層常數，
並在該處註解說明這個限制。

同類問題：`@Matches(PASSWORD_PATTERN)` 傳的是變數，
Swagger CLI plugin 靜態分析讀不到內容，需手寫
`@ApiProperty({ pattern: PASSWORD_PATTERN.source })`。

---

## 九、Module

### 9.1 四個欄位各回答一個問題

```
imports     ── 我需要用到哪些「別的模組」對外提供的東西
controllers ── 我要對外開哪些 HTTP 路由
providers   ── 我內部有哪些可被注入的零件
exports     ── 我願意把哪些零件借給 import 我的模組
```

`TypeOrmModule.forFeature([Todo])` 是「本模組要用到哪幾張表」的登記；
對照 `AppModule` 的 `forRoot`：連線設定全域一次，資料表各模組各自登記。

### 9.2 `@Global()` 只給基礎設施

已標記的：`ConfigModule`、`ValkeyModule`、`TransactionModule`、
`SessionModule`、`ThrottleModule`、`AuditModule`。

**業務模組一律不得標 `@Global()`**——它讓依賴關係變得隱晦，
只有「連線、交易、稽核」這種每個模組都會用到的橫切資源才值得。

### 9.3 不需要就不 export

沒 export 的 provider 是模組私有的，外部注入會在**啟動階段**直接失敗——
這是好事，代表邊界有在生效。

`AuditModule` 刻意不 export `AuditService`，只 export `AuditEventPublisher`：
把寫入入口直接開放出去，「Service 不依賴稽核實作」的設計會逐步被繞過。

### 9.4 `forRootAsync` 的 `useFactory` 只看得到自己的 `imports`

沒有 `extraProviders` 這類選項。要注入自訂 provider 時，
必須把它包成獨立的小模組再 `imports` 進去。

---

## 十、橫切關注的註冊

### 10.1 需要注入依賴時必須用 `APP_*` provider

```ts
// ❌ 這樣建立的實例不在 DI 容器內，注入會是 undefined
app.useGlobalInterceptors(new ResponseInterceptor());

// ✅
{ provide: APP_INTERCEPTOR, useClass: ResponseInterceptor }
```

`APP_FILTER`、`APP_GUARD`、`APP_INTERCEPTOR`、`APP_PIPE` 同理。

### 10.2 `APP_GUARD` 依 providers 陣列順序執行

```
AppThrottlerGuard    ← 最便宜，先擋掉過量請求
AuthenticatedGuard   ← 你是誰（401）
PermissionsGuard     ← 你能不能做這件事（403）
```

**不可調換**：`PermissionsGuard` 需要 `request.user`。

### 10.3 存取控制的預設方向

| 機制     | 預設                                                   | 理由                                           |
| -------- | ------------------------------------------------------ | ---------------------------------------------- |
| 登入檢查 | **預設擋下**，開放要標 `@Public()`             | 漏標的結果是擋下來，不是對外開放               |
| 權限檢查 | **預設放行**，需要才標 `@RequirePermissions()` | 權限因端點而異，不存在對所有端點都正確的預設值 |

**程式碼只檢查權限，永不檢查角色。** 若寫成 `@RequireRoles('admin')`，
日後要讓其他角色也能執行同一操作時仍需改程式碼重新部署，RBAC 就失去意義。
角色只是「一組權限的名字」。

### 10.4 中介軟體順序（`app.setup.ts`）

```
setGlobalPrefix → trust proxy → session → passport.initialize
→ passport.session → requestContextMiddleware → validationPipe
```

`requestContextMiddleware` **必須在 `passport.session()` 之後**，
否則 `request.user` 永遠 undefined，稽核紀錄的操作者全部變成空的。

### 10.5 `configureApp()` 抽出來與 e2e 測試共用

測試自行重建一份會逐漸漂移。曾因測試漏掉 `passport.initialize()`，
401 的測試得到 500，測出來的行為與實際上線不符。

---

## 十一、交易

### 11.1 TypeORM 的 Repository 不會自動加入外層交易

從 DataSource 取得的 Repository 綁的是連線池。
必須改用該交易的 `EntityManager` 取得 Repository。

### 11.2 用 `TransactionService`，不要把 manager 當參數傳

```ts
private get repository(): Repository<Todo> {
	return this.transactionService.resolveRepository(this.todoRepository);
}

async addTodo(...) {
	return this.transactionService.run(async () => {
		const saved = await this.repository.save(...);
		await this.auditPublisher.publish({ ... });
		return saved;
	});
}
```

manager 一路傳參數是無聲失敗：忘記傳的地方會安靜地走另一條連線，
程式照跑、測試照過，直到某次回滾才發現有資料沒退回去。

### 11.3 讀取也必須走 `resolveRepository()`

**踩過**：`addUser` 最後呼叫 `getUserById` 重查剛建立的帳號，
用的是連線池另一條連線，交易未 commit 因此查無資料 → 整筆註冊回滾。

### 11.4 純查詢不包交易

沒有原子性問題，開交易只是多一次往返。

### 11.5 巢狀 `run()` 沿用外層交易

內層自成交易的話，外層回滾時內層已 commit 的部分不會退回。

### 11.6 「先 commit 再 throw」的情境

登入失敗計數必須在拋錯**之前**完成並 commit。
包進交易後才 `throw`，例外會讓交易回滾、計數消失，鎖定永遠不會發生。
作法是讓該方法自帶交易並在方法內結束，呼叫端才不可能寫錯。

---

## 十二、稽核

### 12.1 Service 發業務事件，不直接呼叫 AuditService

```ts
await this.auditPublisher.publish({
	action: AUDIT_ACTION.TODO_COMPLETED,
	description: `完成待辦「${todo.title}」`,
	entityName: AUDIT_ENTITY.TODOS,
	entityId: todo.todoId,
	changes: { before, after },
});
```

動作碼記的是**業務語意**（`todo.completed`），不是資料變更（`update`）。
同樣是 `is_completed` 變 true，可能是使用者自己勾選、主管代為結案或排程關閉，
ORM 層看到的完全一樣，只有 Service 知道差別。

### 12.2 `entityName` 必須是資料表名

開發期稽查員以「資料表名:主鍵」比對，填 class 名會永遠對不上。
用 `AUDIT_ENTITY` 常數。

### 12.3 批次操作走 `AuditedRepositoryService`

`repository.delete(criteria)` 繞過 entity 生命週期，稽核與稽查員都看不到，
**而且不會有錯誤訊息**。

### 12.4 稽核內容不得含敏感資料

密碼、雜湊、token、session id 原值。
session id 要存雜湊（相同 session 算出相同值，配對功能不受影響）。

### 12.5 事件必須用 `emitAsync` ＋ `suppressErrors: false`

`emit` 不等待非同步 listener，稽核寫入失敗時業務流程照樣回傳成功；
而 `@OnEvent` **預設會吞掉 listener 拋出的錯誤**，只印一行 log。
兩者都要處理，少一個就是無聲失敗。

`EventEmitterModule.forRoot({ wildcard: true, delimiter: '.' })`
也不可省略，否則 `audit.**` 完全收不到事件且無任何錯誤訊息。

---

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

## 十四、Migration

### 14.1 手寫並加註解，不直接用 generate 的產物

`migration:generate` 只用來**檢查 entity 與資料庫是否一致**
（回報 `No changes` 才算對齊）。

### 14.2 不 import 應用程式的常數

migration 是歷史紀錄，執行後就固定了；常數會隨開發演進而改變。
兩者耦合會讓已執行過的 migration 語意跟著改變，破壞可重現性。
權限碼之類的值**刻意重複書寫**。

### 14.3 加欄位要考慮既有資料的真實值

```sql
-- ❌ 既有使用者的密碼年齡會從執行 migration 那一刻起算，那是假的
ALTER TABLE users ADD password_changed_at timestamptz NOT NULL DEFAULT now();

-- ✅ 先可空 → 以 created_at 回填 → 才 SET NOT NULL
```

新增有業務語意的欄位時，一律先問「既有資料的真實值是什麼」。

### 14.4 一律參數化查詢

即使值目前是固定字串。字串拼接 SQL 不該養成習慣，
日後改為動態來源會直接成為注入點。

### 14.5 結構與種子資料分開成兩支

回滾時影響範圍較清楚，日後新增資料也只需再寫一支種子 migration。

---

## 十五、TypeScript（NestJS 特有的部分）

### 15.1 被裝飾器標記的簽章必須用 `import type`

```ts
// !! interface 執行期不存在，emitDecoratorMetadata 會試圖參照它 → TS1272
import type { Request } from 'express';
import type { ConfigType } from '@nestjs/config';
import type { AuthenticatedUser } from './interfaces/authenticated-user.interface';
```

此專案已出現**五次**：DTO、`Request`、`AuthenticatedUser`、`ConfigType`、
`@OnEvent` 的 payload。看到 TS1272 先想這件事。

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
