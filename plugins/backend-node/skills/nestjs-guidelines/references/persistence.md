# Entity、交易、稽核與 Migration

適用於已採用本 kit NestJS 範本基礎設施的專案；先閱讀 [入口與適用範圍](../SKILL.md)。

## 四、Repository 層

### 4.1 查詢只能寫在 `*.repository.ts`

```
Service ── 呼叫 todoRepository.getTodosByOwner()，不知道查詢怎麼寫
TodoRepository（todo.repository.ts）── 注入 TypeORM Repository，寫 find／QueryBuilder
```

為什麼不讓 Service 直接用 TypeORM 的 `Repository<Todo>`：

- **查詢集中**：查效能問題、改查詢、code review 只看一個地方。
  散在各 Service 裡，同一個查詢很容易被複製成好幾份。
- **Service 好測**：mock 幾個語意清楚的方法，比 mock `Repository<Entity>`
  或 QueryBuilder 的鏈式呼叫簡單很多。
- **規則明確**：「查詢只能出現在 repository」可以用 lint 檢查（見 4.5），
  AI 與新成員都不容易寫錯位置。

### 4.2 方法要有業務語意，不做泛用轉發

```ts
@Injectable()
export class TodoRepository {
	constructor(
		@InjectRepository(Todo)
		private readonly ormRepository: Repository<Todo>,
		private readonly transactionService: TransactionService,
	) {}

	// - 交易內外都用同一個入口，見 11.2
	private get repository(): Repository<Todo> {
		return this.transactionService.resolveRepository(this.ormRepository);
	}

	async getTodosByOwner({ ownerId }: { ownerId: string }): Promise<Todo[]> {
		return this.repository.find({ where: { ownerId }, order: { createdAt: 'DESC' } });
	}

	async getOverdueTodoCount({ ownerId, now }: { ownerId: string; now: Date }): Promise<number> {
		return this.repository.createQueryBuilder('todo')
			.where('todo.ownerId = :ownerId', { ownerId })
			.andWhere('todo.dueAt < :now', { now })
			.andWhere('todo.isCompleted = false')
			.getCount();
	}
}
```

| ✅ 要                                     | ❌ 不要                                                 |
| ----------------------------------------- | ------------------------------------------------------- |
| `getTodosByOwner({ ownerId })`          | `find(options: FindManyOptions<Todo>)`：等於把 TypeORM 原封不動交給 Service |
| 回傳 Entity 或明確的型別                  | 回傳 `SelectQueryBuilder` 讓 Service 繼續串條件       |
| 一個查詢一個方法，名稱說明用途與風險      | `generalRepo` 式的萬用 CRUD                             |

Repository 不做業務判斷：查不到回 `null`，由 Service 決定要不要拋 `NotFoundError`。
資料庫錯誤照常往上拋，由 Filter 統一翻譯。

### 4.3 不寫原生 SQL

不使用 `dataSource.query()`、`manager.query()`、`queryRunner.query()`。
CTE、聚合、子查詢都拆成 QueryBuilder；QueryBuilder 表達不了的彙整改在 Service 計算。
原生 SQL 會繞過 Entity 的欄位對應與命名策略，改欄位時不會有任何編譯錯誤。

唯一例外是 Migration（見十四），且一律參數化。

### 4.4 `synchronize` 一律關閉

`TypeOrmModule.forRoot()` 的 `synchronize` 與 `dropSchema` 一律 `false`，
開發環境也一樣。schema 只由 Migration 改變；
開著 `synchronize` 時，Entity 少寫一個欄位就會直接刪掉資料表裡的那一欄。

### 4.5 用 ESLint 強制

```js
// eslint.config.js
const RAW_SQL = [
	{ selector: "CallExpression[callee.property.name='query'][callee.object.name=/^(dataSource|manager|entityManager|queryRunner)$/]", message: '不寫原生 SQL，改用 QueryBuilder' },
	{ selector: "CallExpression[callee.property.name='query'][callee.object.property.name=/^(dataSource|manager|entityManager|queryRunner)$/]", message: '不寫原生 SQL，改用 QueryBuilder' },
];
export default [
	{
		files: ['src/**/*.ts'],
		ignores: ['src/**/*.repository.ts', 'src/**/migrations/**', 'src/**/*.spec.ts', 'src/common/database/**'],
		rules: {
			'no-restricted-syntax': ['error',
				{ selector: "Decorator[expression.callee.name='InjectRepository']", message: '只有 *.repository.ts 可以注入 TypeORM Repository' },
				{ selector: "CallExpression[callee.property.name='createQueryBuilder']", message: '查詢只能寫在 *.repository.ts' },
				...RAW_SQL,
			],
		},
	},
	{
		files: ['src/**/*.repository.ts'],
		rules: { 'no-restricted-syntax': ['error', ...RAW_SQL] },
	},
];
```

`src/common/database/**` 是 `TransactionService` 等基礎設施的位置，依專案實際路徑調整。

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

## 十一、交易

### 11.1 TypeORM 的 Repository 不會自動加入外層交易

從 DataSource 取得的 Repository 綁的是連線池。
必須改用該交易的 `EntityManager` 取得 Repository。

### 11.2 用 `TransactionService`，不要把 manager 當參數傳

交易邊界由 Service 決定，Repository 內部用 `resolveRepository()` 自動加入外層交易
（getter 寫法見 4.2）：

```ts
// todo.service.ts
async addTodo(...) {
	return this.transactionService.run(async () => {
		const saved = await this.todoRepository.addTodo(...);
		await this.auditPublisher.publish({ ... });
		return saved;
	});
}
```

manager 一路傳參數是無聲失敗：忘記傳的地方會安靜地走另一條連線，
程式照跑、測試照過，直到某次回滾才發現有資料沒退回去。

### 11.3 Repository 的讀取也必須走 `resolveRepository()`

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
