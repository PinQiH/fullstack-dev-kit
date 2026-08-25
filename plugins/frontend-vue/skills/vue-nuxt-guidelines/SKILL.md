---
name: vue-nuxt-guidelines
description: >
  Vue 3 / Nuxt 3 前端架構師技能模組。
  當任務涉及 Vue/Nuxt 元件開發、API/Service 層設計、錯誤處理架構、
  TypeScript 型別系統、測試規範、命名規範、或 CI/CD 品質閘門時，
  應載入此技能。此技能強制執行奧卡姆剃刀原則（最小化設計）、
  防禦性設計，以及最小改動原則。
---

# Frontend Architect Skill

**Origin**: forked from Zoe Chan / Frontend Team（MIT）— 見 ATTRIBUTION.md
**Tech Stack**: Vue 3, Nuxt 3, TypeScript, Pinia, Vitest, Playwright
**Core Principles**: Occam's Razor | Defensive Design | Principle of Least Change

---

## 使用此技能的前置條件

在任何程式碼修改前，你必須：

1. **識別任務類型**（見下方決策樹）
2. **載入對應的 `resources/` 規範文件**
3. **參照對應的 `examples/` 程式碼範本**
4. **生成程式碼後，對照 [實作自我檢查清單] 驗證**

---

## AI 決策樹 (Thinking Process)

依據任務類型，執行對應的強制載入流程：

### CASE A：涉及 API 呼叫 / Service 層 / 錯誤處理

```
偵測到以下關鍵字時觸發：
makeApiCall, fetch, axios, service, result, AppError, composable, useAsyncState

強制執行：
1. 載入 resources/06-Architecture.md（Result Pattern 定義）
2. 載入 resources/07-API-Service.md（Service 實作標準）
3. 參照 examples/result-pattern.ts（型別定義）
4. 參照 examples/api-service-pattern.ts（Service 實作範本）
5. 參照 examples/composable-pattern.ts（Composable 消費範本）

防守規則：
- 禁止在 Service 層中呼叫任何 Toast / UI 函式
- 禁止在 Composable 層使用 try-catch 包裹 Service 呼叫（改用 Result 判斷）
- 所有 Service 函式必須包含 JSDoc @param 與 @returns
- makeApiCall 若業務錯誤需自行處理，必須設定 skipGlobalErrorHandler: true
```

CASE B：涉及 Vue 元件 / Nuxt 頁面開發

```
偵測到：.vue, defineProps, script setup, useAsyncData, useState, <ClientOnly>

強制執行：
1. 載入 resources/03a-Stack-Vue.md（Vue 核心規範）
2. 載入 resources/03b-Stack-Nuxt.md（Nuxt SSR 規範）
3. 載入 resources/02-Naming.md（命名規範）
4. 參照 examples/vue-component-pattern.vue
```

### CASE C：涉及 TypeScript / 型別定義

```
偵測到以下關鍵字時觸發：
interface, type, enum, as const, DTO, Domain, any, unknown

強制執行：
1. 載入 resources/04-Stack-TS.md（TypeScript 規範）
2. 載入 resources/02-Naming.md（命名規範的 TypeScript 段落）

防守規則：
- 禁止使用 any，必須使用 unknown 並進行 type narrowing
- Interface 名稱禁止 I 前綴（例：UserAccount，非 IUserAccount）
- DTO 與 Domain Model 必須嚴格分離，轉換邏輯集中在 Mapper
```

CASE D：涉及測試撰寫

```
偵測到：test, spec, vitest, describe, it, expect, vi.mock, Playwright

強制執行：
1. 前端測試已改由獨立 skill 負責：載入 `frontend-testing-guidelines`（Vitest 單元 + Playwright E2E 骨架、命名與 Mock 策略）
2. 後端測試規範另見 `backend-testing-guidelines`
```

### CASE E：涉及命名、檔案結構、目錄設計

```
偵測到以下關鍵字時觸發：
命名, 資料夾結構, 新增檔案, 目錄, 架構設計

強制執行：
1. 載入 resources/02-Naming.md
2. 載入 resources/07-API-Service.md 的「目錄結構建議」段落

防守規則：
- Service 檔案必須使用具名匯出，禁止 export default
- Composable 以 use 開頭，Pinia Store 以 useXxxStore 命名
- 測試檔案與源碼同層，命名為 [name].spec.ts 或 [name].test.ts
```

### CASE F：涉及安全性 / 環境變數

```
偵測到以下關鍵字時觸發：
.env, token, secret, API_KEY, auth, 環境變數, 敏感資訊

強制執行：
1. 通用安全規範見常駐 `security-absolutes`（SQL 參數化／XSS／機密不落地）

防守規則（Nuxt 專屬補充）：
- 任何敏感資訊絕對禁止 hardcode 在程式碼中
- 環境變數必須透過 runtimeConfig，不得使用 process.env 直接存取
```

### CASE G：涉及 UI 無障礙設計（A11y）

```
偵測到以下關鍵字時觸發：
aria, role, tabindex, keyboard, screen reader, 無障礙, 鍵盤導航,
focus, alt, WCAG, a11y, accessible

強制執行：
1. 確認互動元素（button, a, input）都有可讀的文字或 aria-label
2. 確認顏色對比度符合 WCAG 2.1 AA（文字 4.5:1，大文字 3:1）
3. 確認鍵盤導航順序符合視覺順序（tabindex 不濫用）
4. 確認 Modal / Dialog 有 focus trap 與 Esc 關閉支援

防守規則：
- 禁止使用 div / span 模擬按鈕（改用 <button> 或加 role="button" + tabindex="0"）
- 圖示按鈕必須有 aria-label（例：<button aria-label="關閉">×</button>）
- 表單 input 必須與 label 通過 for/id 或 aria-labelledby 關聯
- 動態內容更新必須通知 Screen Reader（使用 aria-live region）
- 禁止只用顏色傳遞資訊（色盲用戶無法分辨）
```

---

## 防禦性設計黃金法則

在生成任何程式碼之前，必須自問以下問題：

1. **空值防呆**：這個函式若接到 `null` 或 `undefined` 會發生什麼？是否有 Guard Clause？
2. **網路失敗**：API 呼叫失敗時，UI 會顯示什麼？是否有 Loading/Error/Empty 三態？
3. **最小改動**：我是否在新增一個屬性，卻重寫了整個元件？若是，請退回只插入該屬性。
4. **奧卡姆剃刀**：這個解法是否引入了不必要的中介層、Proxy 或設計模式？是否有更原生的做法？
5. **長期成本**：半年後的開發者看到這段程式碼，能否在 10 秒內理解它的意圖？

---

## 實作自我檢查清單

在提交任何程式碼前，逐項確認：

- [ ] **風格一致性**：命名、縮排、檔案結構是否與專案現有程式碼 100% 一致？
- [ ] **防呆設計**：是否處理了 null/undefined 與 API 失敗的情況？
- [ ] **JSDoc**：Service 函式是否包含 @param 與 @returns 註解？
- [ ] **環境變數**：是否有敏感資訊寫死在程式碼中？
- [ ] **測試友善**：這段邏輯是否容易進行單元測試（純函式、依賴可注入）？
- [ ] **最小改動**：修改範圍是否超出任務要求？有沒有動到不相關的邏輯？
- [ ] **無 any**：是否引入了 TypeScript any？若有，是否能以 unknown + narrowing 替代？

---

## 高風險操作警示

以下操作在執行前必須向使用者明確說明影響範圍，並獲得確認：

1. **修改事件處理器參數**（@click, @input, @change 的參數結構）
2. **修改 useAsyncState / useFetch / useAsyncData 的參數**
3. **修改 Service 層函式的呼叫簽名**
4. **修改 computed / watch / ref 的依賴關係**
5. **修改 props 的傳遞結構或 emit 的參數**
6. **修改 v-if / v-for 的判斷條件或資料過濾邏輯**
