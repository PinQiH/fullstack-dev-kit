---
name: test-frontend
description: '為 Vue 3、Nuxt 3 或 TypeScript 的 Service、Composable、元件與使用者流程撰寫、補齊或審查 Vitest 與 Playwright 測試。'
---

# 前端測試撰寫與規範

**Tech Stack**：Vitest 2.x, Playwright 1.x, Vue Test Utils, TypeScript
**對應技術規範**：`vue-nuxt-guidelines` skill（測試對象的規範）
**觸發時機**：使用者說「產生測試」「幫我寫測試」「generate test」「新增 spec」時使用

---

## AI 決策樹：依測試對象路由

### CASE T1：Service 單元測試（`.spec.ts`）

**觸發**：測試對象為 `*Service.ts`、`*service.ts`

**生成規則：**
- 檔案位置：與 Service 同層，命名 `[ServiceName].spec.ts`
- 不依賴 UI 框架（不引入 Vue Test Utils）
- Mock 外部依賴（axios、其他 Service），不 Mock 內部純函式
- 每個 public 函式至少 3 個 it 區塊：正常流、API 失敗流、邊界值

```typescript
// 骨架範本：userService.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getUserById } from './userService'
import * as apiClient from '@/lib/apiClient'

vi.mock('@/lib/apiClient')

describe('userService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getUserById', () => {
    it('should return Ok with user data when API succeeds', async () => {
      vi.mocked(apiClient.get).mockResolvedValue({ id: 1, name: 'Alice' })
      const result = await getUserById(1)
      expect(result.ok).toBe(true)
      expect(result.value).toMatchObject({ id: 1 })
    })

    it('should return Err when API returns 404', async () => {
      vi.mocked(apiClient.get).mockRejectedValue({ status: 404 })
      const result = await getUserById(1)
      expect(result.ok).toBe(false)
      expect(result.error.code).toBe('NOT_FOUND')
    })

    it.todo('should return Err(INVALID_ID) when userId is null')
    it.todo('should return Err(INVALID_ID) when userId is negative')
  })
})
```

---

### CASE T2：Composable 單元測試（`.spec.ts`）

**觸發**：測試對象為 `use*.ts`

**生成規則：**
- 使用 `withSetup` 工廠函式包裝 composable（Vue 3 最佳實踐）
- Mock composable 依賴的 Service（不 Mock 整個 axios）
- 測試 reactive state 的變化，不測試 UI 渲染

```typescript
// 骨架範本：useUser.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { withSetup } from '@/test-utils/withSetup'
import { useUser } from './useUser'
import * as userService from '@/services/userService'

vi.mock('@/services/userService')

describe('useUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should set isLoading to true while fetching', async () => {
    vi.mocked(userService.getUserById).mockResolvedValue({
      ok: true,
      value: { id: 1, name: 'Alice' }
    })
    const [result] = withSetup(() => useUser())
    expect(result.isLoading.value).toBe(true)
  })

  it.todo('should set user data after successful fetch')
  it.todo('should set error state when service returns Err')
  it.todo('should reset state on unmount')
})
```

---

### CASE T3：Vue 元件單元測試（`.spec.ts`）

**觸發**：測試對象為 `*.vue`（頁面 / 元件）

**生成規則：**
- 使用 Vue Test Utils `mount` / `shallowMount`
- 只測試元件的**公開行為**（props in → emit out / DOM 變化）
- 不測試內部實作細節（不直接存取 ref 或 reactive）
- 複雜的業務邏輯由 Service / Composable 的測試覆蓋，元件測試只驗證「接線正確」

```typescript
// 骨架範本：UserCard.spec.ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import UserCard from './UserCard.vue'

describe('UserCard', () => {
  const defaultProps = {
    user: { id: 1, name: 'Alice', email: 'alice@example.com' }
  }

  it('should render user name correctly', () => {
    const wrapper = mount(UserCard, { props: defaultProps })
    expect(wrapper.text()).toContain('Alice')
  })

  it('should emit "edit" event when edit button is clicked', async () => {
    const wrapper = mount(UserCard, { props: defaultProps })
    await wrapper.find('[data-testid="edit-btn"]').trigger('click')
    expect(wrapper.emitted('edit')).toBeTruthy()
    expect(wrapper.emitted('edit')?.[0]).toEqual([1])
  })

  it.todo('should show loading skeleton when user prop is null')
  it.todo('should apply "admin" CSS class when user.role is admin')
})
```

---

### CASE T4：Playwright E2E 測試（`e2e/*.spec.ts`）

**觸發**：使用者說「E2E 測試」「端到端測試」「playwright」或測試對象為完整 User Flow

**生成規則：**
- 檔案位置：`e2e/[feature-name].spec.ts`
- 只測試**核心 Happy Path + 最重要的 Error Path**（不測試所有排列組合）
- 使用 `data-testid` 選取元素（不依賴 CSS class 或文字）
- 每個 spec 獨立，不依賴其他 spec 的狀態
- 使用 `page.goto` 明確設定起始狀態

```typescript
// 骨架範本：e2e/login.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.fill('[data-testid="email-input"]', 'user@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="submit-btn"]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('should show error message with invalid credentials', async ({ page }) => {
    await page.fill('[data-testid="email-input"]', 'wrong@example.com')
    await page.fill('[data-testid="password-input"]', 'wrongpass')
    await page.click('[data-testid="submit-btn"]')
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
  })

  test.todo('should redirect to /login when accessing protected route without auth')
  test.todo('should persist session after page refresh')
})
```

---

## 測試命名規範

```
describe('[測試對象名稱]', () => {
  describe('[方法 / 功能名稱]', () => {
    it('should [預期結果] when [情境條件]', ...)
  })
})
```

**範例（正確）：**
- `it('should return Err when userId is null')`
- `it('should emit "submit" event with form data when form is valid')`

**範例（錯誤，禁止）：**
- `it('test getUserById')`  ← 沒有說明預期結果
- `it('works correctly')`   ← 不具體

---

## Mock 策略指引

| 測試層級 | Mock 對象 | 不 Mock |
|---------|----------|---------|
| Service 測試 | `axios` / HTTP client / 外部 SDK | Service 內的純函式邏輯 |
| Composable 測試 | Service 層 | Vue reactivity |
| 元件測試 | Composable（複雜邏輯）、Router | 元件自身邏輯、簡單 Composable |
| E2E 測試 | 不 Mock（測試真實流程） | — |

**Mock 禁止：** 不得 Mock 資料庫連線（若有 Prisma 等 ORM 的整合測試應使用測試資料庫，參考 feedback 記憶中的「不 mock 資料庫」原則）

---

## 自我檢查清單（產出後核對）

- [ ] 每個 it 區塊名稱符合 `should [結果] when [條件]` 格式
- [ ] 未實作的場景使用 `it.todo()` 標注（不留空的 it block）
- [ ] Service 測試：有 Mock 外部依賴，有 `beforeEach(() => vi.clearAllMocks())`
- [ ] 元件測試：使用 `data-testid` 選取，不依賴 CSS class
- [ ] E2E 測試：每個 test 獨立，有 `beforeEach` 設定初始狀態
- [ ] `npm run test` 執行骨架後無語法錯誤（it.todo 的測試為 pending 狀態，不算失敗）
