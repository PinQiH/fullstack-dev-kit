# DTO、HTTP 與錯誤回應

適用於已採用本 kit NestJS 範本基礎設施的專案；先閱讀 [入口與適用範圍](../SKILL.md)。

## 三、DTO

### 3.1 一定是 class（覆寫 nodejs-guidelines）

見 [與 Node.js 規範的關係](architecture.md)。

### 3.2 驗證裝飾器與錯誤順序

裝飾器的套用順序不等同於所有驗證器的完成順序，尤其含非同步驗證時。

`stopAtFirstError: true` 可減少同一欄位的錯誤，不能當成業務錯誤優先順序的保證。
需要固定訊息時，以專案版本的行為測試確認，或在錯誤格式化層明確排序。

### 3.3 `@IsOptional()` 的語意

欄位為 `null` 或 `undefined` 時，會略過該欄位的其他驗證器；空字串不會略過。
若規格允許省略但拒絕 `null`，可使用 `@ValidateIf((_, value) => value !== undefined)`
搭配實際型別驗證，並測試未提供、`null`、空字串與有效值。

來源：[class-validator 驗證裝飾器](https://github.com/typestack/class-validator#validation-decorators)。

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
