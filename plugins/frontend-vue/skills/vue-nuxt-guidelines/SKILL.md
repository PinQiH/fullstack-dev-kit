---
name: vue-nuxt-guidelines
description: 'Vue 3／Nuxt 3 前端開發規範：元件、Service 與 Result 錯誤處理、Composable、Pinia、TypeScript、命名、目錄結構與無障礙。使用時機：撰寫、修改或審查 Vue／Nuxt 程式碼。Nuxt 專屬規範只在專案使用 Nuxt 時套用。不用於 UX 審查（改用 ux-heuristics）與測試（改用 test-frontend）。'
---

# Vue 3／Nuxt 3 前端開發規範

原則：最小設計（不引入不必要的中介層）、防禦性設計（處理 null 與 API 失敗）、最小改動（只改任務需要的部分）。
專案已有不同慣例時，以專案為準。來源與授權見 [ATTRIBUTION.md](ATTRIBUTION.md)。

## 開始前

1. 確認專案是純 Vue 還是 Nuxt：根目錄有 `nuxt.config.*` 才是 Nuxt。純 Vue 專案不載入 Nuxt 規範，也不套用 SSR 相關規則。
2. 依下表載入對應文件，只讀與任務相關的列。
3. 完成後對照文末的自我檢查清單。

## 依任務載入

| 任務 | 載入 | 參照範本 |
| --- | --- | --- |
| API 呼叫、Service 層、錯誤處理 | [06-Architecture.md](resources/06-Architecture.md)、[07-API-Service.md](resources/07-API-Service.md) | `examples/result-pattern.ts`、`examples/api-service-pattern.ts`、`examples/composable-pattern.ts` |
| Vue 元件、頁面 | [03a-Stack-Vue.md](resources/03a-Stack-Vue.md)、[02-Naming.md](resources/02-Naming.md) | `examples/vue-component-pattern.vue` |
| Nuxt 頁面、SSR、`useAsyncData`（僅 Nuxt 專案） | [03b-Stack-Nuxt.md](resources/03b-Stack-Nuxt.md) | — |
| 防禦性寫法、效能 | [03c-Defensive-Performance.md](resources/03c-Defensive-Performance.md) | — |
| TypeScript 型別、DTO 與 Domain Model | [04-Stack-TS.md](resources/04-Stack-TS.md)、[02-Naming.md](resources/02-Naming.md) | — |
| 命名、檔案與目錄結構 | [02-Naming.md](resources/02-Naming.md)、[07-API-Service.md](resources/07-API-Service.md) 的「目錄結構建議」 | — |
| Pinia store、共用狀態 | [08-Pinia.md](resources/08-Pinia.md) | — |
| ESLint、型別檢查、CI 品質閘門 | [05-Linter-Setup.md](resources/05-Linter-Setup.md) | — |
| 測試 | 改用 `test-frontend` | — |

## 分層規則

- Service 只負責呼叫 API 與轉換資料，不呼叫 toast 或其他 UI 函式。
- Composable 用 Result 判斷成功或失敗，不用 try-catch 包 Service 呼叫。
- Store 透過 Service 呼叫 API，不直接用 axios；不呼叫 toast、不導頁，action 回傳 Result 由呼叫端處理。
- 業務錯誤要自行處理時，`makeApiCall` 設定 `skipGlobalErrorHandler: true`，避免同時跳出全域錯誤提示。
- Service 函式寫 JSDoc 的 `@param` 與 `@returns`。

## 命名與結構

- Service 用具名匯出，不用 `export default`。
- Composable 以 `use` 開頭；Pinia store 命名為 `useXxxStore`。
- 元件取 store 的 state 與 getter 用 `storeToRefs`，不直接解構。
- 測試檔與原始碼放同一層，命名為 `[name].spec.ts` 或 `[name].test.ts`。

## TypeScript

- 禁止 `any`；改用 `unknown` 加上型別縮小。
- interface 名稱不加 `I` 前綴（`UserAccount`，不是 `IUserAccount`）。
- DTO 與 Domain Model 分開，轉換集中在 Mapper。

## 安全與環境變數

- 通用規則見 `team-standards`：SQL 參數化、XSS 跳脫、機密不 hardcode。
- Nuxt 專案的環境變數透過 `runtimeConfig` 讀取，不直接用 `process.env`。
- 純 Vue（Vite）專案用 `import.meta.env`，只有 `VITE_` 開頭的變數會進前端，不放機密。

## 無障礙

- 按鈕用 `<button>`，不用 `div`／`span` 模擬；圖示按鈕加 `aria-label`。
- input 透過 `for`／`id` 或 `aria-labelledby` 與 label 關聯。
- 顏色對比符合 WCAG 2.1 AA（一般文字 4.5:1，大字 3:1）；不只用顏色傳遞資訊。
- Tab 順序與畫面順序一致，不濫用 `tabindex`。
- Modal 要有 focus trap，可用 Esc 關閉。
- 動態更新的內容用 `aria-live` 通知螢幕閱讀器。

## 寫程式前自問

1. 收到 `null` 或 `undefined` 會怎樣？有沒有提前 return？
2. API 失敗時畫面顯示什麼？Loading、Error、Empty 三種狀態都有嗎？
3. 只是新增一個屬性，卻重寫了整個元件嗎？是的話退回只加那個屬性。
4. 有沒有不必要的中介層或設計模式？有沒有更直接的寫法？
5. 半年後的人能不能很快看懂這段程式的意圖？

## 自我檢查清單

- [ ] 命名、縮排、檔案結構和專案現有程式碼一致
- [ ] 處理了 null／undefined 與 API 失敗
- [ ] Service 函式有 `@param` 與 `@returns`
- [ ] 沒有 hardcode 的機密
- [ ] 邏輯容易測試（純函式、依賴可替換）
- [ ] 修改範圍沒有超出任務，沒有動到不相關的邏輯
- [ ] 沒有 `any`
- [ ] 只有跨頁共用的狀態放進 Pinia；store 沒有直接呼叫 axios 或 toast
- [ ] 畫面改動已對照 `ux-heuristics` 的自我檢查清單

## 影響範圍大的修改

下列修改容易牽動其他地方。任務沒有要求卻需要改時，先說明影響範圍並取得同意；任務明確要求時直接改，並在回報中列出受影響的呼叫端：

1. 事件處理器（`@click`、`@input`、`@change`）的參數結構
2. `useAsyncState`、`useFetch`、`useAsyncData` 的參數
3. Service 函式的呼叫簽名
4. `computed`、`watch`、`ref` 的依賴關係
5. props 的結構或 emit 的參數
6. `v-if`、`v-for` 的判斷條件或資料過濾邏輯
