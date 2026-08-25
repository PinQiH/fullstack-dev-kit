---
title: Nuxt 3 架構規範
category: Framework
tags: [Nuxt3, SSR, Hydration, useState, useAsyncData]
version: 2025-12
maintainer: Zoe Chan
last_updated: 2026-01-28
description: Nuxt 3 專用開發規範，涵蓋 SSR 策略、Hydration Mismatch 防雷指南、狀態管理與 Composables
---

# Nuxt 3 架構規範

**Maintainer**: Zoe Chan  
**Version**: 2025-12  
**Last Updated**: 2026-01-28

---

## SSR 資料取得策略

| 情境 | 推薦方式 | 說明 |
|------|----------|------|
| **SSR 初始載入** | `useAsyncData` + `$fetch('/api/proxy')` | SEO 需求、首屏渲染 |
| **Client-only 會員功能** | `useAsyncState` (VueUse) | `immediate: false`，互動觸發 |
| **表單提交/互動** | Service function 直接呼叫 | 不需 SSR |

### 狀態隔離與命名空間策略
針對分頁狀態殘留與污染，應建立標準的 useState 管理規範。不應使用單一字串，而應採用具備層次感的 Key 生成邏輯 。

| 策略層次 | 實施細節 | 預期效果 |
|------|----------|------|
| **動態 Key 值** | `useState('program:${id}:pagination',...)` | 確保各節目分頁物理隔離，SPA 切換時數據不混淆 |
| **封裝組件** | 使用 `composables/useProgramPagination.ts` | 抽離邏輯至獨立層級，符合職責單一原則 |
| **清理鉤子** | 在 `onUnmounted` 或路由守衛中重置 `useState` | 減少內存佔用，防止長時間運行下的內存洩漏 |

### 水合防禦與 UX 同步化
消除 Loading 閃爍與水合不匹配的專業實踐：

- **穩定性保證**：針對隨機 ID 的需求，Nuxt 3.17+ 應全面採用 `useId()` 組合式函數，確保在 SSR 生成的 DOM 與客戶端掛載時擁有相同的標識符 。
- **渲染路徑分支**：對於高度動態或非同步的 Podcast 播放進度數據，應明確標註渲染環境：使用 `<ClientOnly>` 組件包裹瀏覽器特有功能（如頻譜視覺化） 。在 transform 階段對 API 回傳值進行 Fallback 處理，確保伺服器渲染的是「佔位狀態」而非「空崩潰狀態」 。
- **Loading Indicator 定製**：利用 Nuxt 3.17+ 的 `NuxtLoadingIndicator` 定製 props（如 `hideDelay`, `resetDelay`），平衡真實加載時間與視覺反饋 。

---

## Hydration Mismatch 防雷指南 (Critical)

**核心原則**：Server 渲染出的 DOM 結構，必須與 Client 端「第一次」渲染的 VDOM 結構**完全一致**。

1. **資料同步原則 (Payload Rule)**：Server 取得的資料，必須透過 `useAsyncData` + `useState` 自動同步給 Client。
2. **瀏覽器 API 隔離原則**：Server 不知道 `window` / `document`。依賴對象必須包在 `<ClientOnly>` 或 `onMounted` 執行。
3. **ClientOnly 使用時機**：不需要 SEO (如登入後資訊、彈窗) 且依賴瀏覽器 API 時。
4. **條件渲染確定性**：`v-if` 的判斷條件必須在雙端初始渲染時同步。

---

## SSR Hydration 狀態管理：`ref()` vs `useState()`

**問題**：`ref()` 的值不會被 Nuxt SSR Payload 序列化，導致 Client Hydration 時被重設。

### 解決方案：改用 `useState()`

```js
// ✅ 正確寫法：useState() 資料會從 SSR Payload 正確恢復
const blockList = useState('unique-key-block-list', () => [])
```

### 何時使用 `ref()` vs `useState()`

| 情境 | 推薦 | 原因 |
|------|------|------|
| SSR 初始載入的資料 | `useState()` | 需要從 Server 傳遞到 Client |
| Client-only 區域狀態 | `ref()` | 不需要 SSR，元件內部使用 |
| Loading/Error 狀態 | `ref()` | 暫時性狀態，不需持久化 |

---

## Nuxt Composables 範例

### useAsyncData 範例
```js
const { data, status, refresh } = await useAsyncData(
  'unique-key',
  async () => {
    const res = await $fetch('/api/proxy', { params: { url: 'endpoint' } })
    return res.rtnCode === '0000' ? res.data : []
  },
  { server: true, immediate: true }
)
```
---

## Plugin 註冊與使用

### 註冊 (plugins/axios.js)
```js
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.provide('makeApiCall', makeApiCall)
})
```
