# 設定、Module 與啟動順序

適用於已採用本 kit NestJS 範本基礎設施的專案；先閱讀 [入口與適用範圍](../SKILL.md)。

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
