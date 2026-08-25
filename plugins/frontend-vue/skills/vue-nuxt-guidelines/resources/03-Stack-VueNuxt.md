---
title: Vue & Nuxt 規範
category: Framework
tags: [Vue3, Nuxt3, Composition API, SSR, Hydration, SOLID, Clean Architecture, Performance]
version: 2025-12
maintainer: Zoe Chan
last_updated: 2026-01-28
description: Vue 3 與 Nuxt 3 開發規範,涵蓋程式碼風格、SOLID 原則、組件設計模式、SSR 水合、防禦性編程、效能優化等企業級最佳實踐
---

# Vue & Nuxt 規範

**Maintainer**: Zoe Chan  
**Version**: 2025-12  
**Last Updated**: 2026-01-28

---

## 目錄

### Vue 3 核心規範

#### 程式碼風格
- [程式碼結構順序](#程式碼結構順序請照以下)
- [Composition API 結構順序](#composition-api-script-setup-結構順序)
- [程式碼原則](#程式碼原則)

#### SOLID 原則在 Vue 3 中的應用
- [1. 單一職責原則 (SRP) — 組件職責分離](#1-單一職責原則-srp--組件職責分離)
  - [架構分層實踐](#架構分層實踐)
  - [實作範例](#實作範例)
- [2. 開放/封閉原則 (OCP) — 插槽驅動設計](#2-開放封閉原則-ocp--插槽驅動設計)
  - [組件設計策略對照](#組件設計策略對照)
  - [實作範例](#實作範例-1)
- [3. 依賴反轉原則 (DIP) — Provide/Inject 依賴注入](#3-依賴反轉原則-dip--provideinject-依賴注入)
  - [架構優勢](#架構優勢)
  - [實作範例](#實作範例-2)

#### 進階組件設計模式
- [1. 容器/展示組件模式 (Container/Presentational Pattern)](#1-容器展示組件模式-containerpresentational-pattern)
  - [職責劃分](#職責劃分)
  - [實作範例](#實作範例-3)
- [2. Composables vs Renderless Components](#2-composables-vs-renderless-components)
  - [深度比較](#深度比較)
  - [最佳實踐](#最佳實踐)
- [3. 複合組件模式 (Compound Component Pattern)](#3-複合組件模式-compound-component-pattern)
  - [實作策略](#實作策略)

---

### Nuxt 3 專用規範

#### SSR 與資料管理
- [SSR 資料取得策略](#ssr-資料取得策略)
- [Hydration Mismatch 防雷指南 (Critical)](#hydration-mismatch-防雷指南-critical)
  - [1. 資料同步原則 (Payload Rule)](#1-資料同步原則-payload-rule)
  - [2. 瀏覽器 API 隔離原則](#2-瀏覽器-api-隔離原則-browser-api-isolation)
  - [3. ClientOnly 使用時機](#3-clientonly-使用時機)
  - [4. 條件渲染確定性](#4-條件渲染確定性-deterministic-rendering)
- [SSR Hydration 狀態管理: ref() vs useState()](#ssr-hydration-狀態管理refvs-usestate)
  - [解決方案: 改用 useState()](#解決方案改用-usestate)
  - [使用 useState() 的注意事項](#使用-usestate-的注意事項)
  - [完整範例: Composable 中使用 useState](#完整範例composable-中使用-usestate)
  - [何時使用 ref() vs useState()](#何時使用-ref-vs-usestate)

#### Nuxt Composables
- [useAsyncData 範例](#useasyncdata-範例)
- [useAsyncState 範例 (Client-only 會員功能)](#useasyncstate-範例clientonly-會員功能)
- [Plugin 註冊與使用](#plugin-註冊與使用)
  - [註冊 (plugins/axios.js)](#註冊-pluginsaxiosjs)
  - [Service 內使用](#service-內使用)
  - [Vue 組件內使用](#vue-組件內使用)

---

### 防禦性編程與錯誤處理

#### 核心原則
- [不信任原則](#核心原則不信任原則)

#### 防禦性編程實踐
- [1. 嚴格的 Props 驗證與 TypeScript](#1-嚴格的-props-驗證與-typescript)
  - [Props 驗證層級](#props-驗證層級)
  - [實作範例](#實作範例-4)
- [2. 全域 API 攔截與錯誤標準化](#2-全域-api-攔截與錯誤標準化)
  - [統一錯誤處理架構](#統一錯誤處理架構)
- [3. Error Boundaries 與優雅降級](#3-error-boundaries-與優雅降級)
  - [實作策略](#實作策略-1)
  - [非同步組件錯誤處理](#非同步組件錯誤處理)
- [4. Runtime Validation (Zod/Valibot)](#4-runtime-validation-zodvalibot)
  - [為何需要 Runtime Validation?](#為何需要-runtime-validation)
  - [實作範例](#實作範例-5)
- [5. 防禦性編程檢查清單](#5-防禦性編程檢查清單)

---

### UI 系統封裝與效能優化

- [1. Facade Pattern: UI 庫的抽象層](#1-facade-patternui-庫的抽象層)
  - [實作策略](#實作策略-2)
  - [優勢](#優勢)
- [2. 大型列表效能優化](#2-大型列表效能優化)
  - [優化技術對照](#優化技術對照)
  - [實作範例](#實作範例-6)
- [3. 避免深度監聽的效能陷阱](#3-避免深度監聽的效能陷阱)

---

### 總結
- [企業級 Vue 3 開發準則](#總結企業級-vue-3-開發準則)
  - [架構設計](#架構設計)
  - [防禦性編程](#防禦性編程)
  - [效能優化](#效能優化)
  - [測試策略](#測試策略)

---

## Version: 2025-12

## 程式碼風格
### **程式碼結構順序請照以下**:

1. <script>
   - 硬編碼要整理在一塊
   - 未做完的地方(例如使用假資料)請加上`//TODO`，並在交接文件上新增工項紀錄
2. <templete>
3. <style>
   1. 若為單一使用或跨專案的通用組件，樣式才可寫在檔案內
   2. 盡量將樣式統一在一個樣式檔

### Composition API (<script setup>) 結構順序
1. **import 區** — 外部套件、元件、service
2. **defineProps / defineEmits / defineExpose**
3. **inject / provide** — 依賴注入
4. **useXxx()** — Composables (store, route, 自訂 composable)
5. **ref / reactive** — 響應式狀態
6. **computed** — 計算屬性
7. **watch / watchEffect** — 監聽器
8. **onMounted / onUnmounted 等 lifecycle hooks**
9. **一般函數** — 事件處理、業務邏輯

### **程式碼原則**

- **命名請照[命名規範](./02-Naming.md)，要語意化、一致**
- **程式碼要符合SOLID原則、Clean Code原則**
- **封裝 sweetAlert.js 集中管理提示訊息，並在service用Result Pattern處理API回傳，只在composables中根據錯誤類型決定 UI 回饋，避免重複alert**

---

## SOLID 原則在 Vue 3 中的應用

### 1. 單一職責原則 (SRP) — 組件職責分離

**核心理念**:一個模組只有一個改變的理由。組件應專注於「視圖呈現」,而非混合業務邏輯。

#### 架構分層實踐

| 層級 | 職責 | 檔案類型 | 依賴方向 |
|------|------|----------|----------|
| **視圖層** | 模板渲染、Props/Emits 綁定 | `.vue` 檔案 | → 邏輯層 |
| **邏輯層** | 狀態管理、計算、流程控制 | `composables/`, `stores/` | → 服務層 |
| **服務層** | API 通訊、資料轉換 | `services/` | → 外部 API |

#### 實作範例

```vue
<!-- ❌ 違反 SRP:組件混合 UI 與業務邏輯 -->
<script setup>
const products = ref([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  const res = await $fetch('/api/products')
  products.value = res.data.filter(p => p.stock > 0)
  loading.value = false
})
</script>

<!-- ✅ 符合 SRP:邏輯提取至 Composable -->
<script setup>
import { useProductList } from '@/composables/useProductList'

const { products, loading, refresh } = useProductList({ inStockOnly: true })
</script>
```

```js
// composables/useProductList.js
export function useProductList(options = {}) {
  const products = ref([])
  const loading = ref(false)

  async function fetchProducts() {
    loading.value = true
    try {
      const data = await ProductService.getList()
      products.value = options.inStockOnly 
        ? data.filter(p => p.stock > 0) 
        : data
    } finally {
      loading.value = false
    }
  }

  onMounted(fetchProducts)

  return { products, loading, refresh: fetchProducts }
}
```

---

### 2. 開放/封閉原則 (OCP) — 插槽驅動設計

**核心理念**:對擴展開放,對修改封閉。透過 Slots 委派內容渲染權。

#### 組件設計策略對照

| 設計策略 | 特徵 | OCP 合規性 | 適用場景 |
|----------|------|------------|----------|
| **Props 驅動** | 透過 boolean/string 控制顯示邏輯 | ❌ 低 (需修改內部 template) | 原子組件 (Button, Icon) |
| **Slots 驅動** | 透過插槽注入 DOM 結構 | ✅ 高 (擴展不需修改源碼) | 容器組件 (Card, Modal) |
| **Headless UI** | 僅提供邏輯與狀態,無樣式 | ✅ 極高 (完全解耦) | 複雜交互 (Combobox, Toggle) |

#### 實作範例

```vue
<!-- ❌ Props 驅動:每次新需求都要改組件 -->
<template>
  <div class="card">
    <div v-if="hasHeader" class="card-header">{{ title }}</div>
    <div class="card-body">{{ content }}</div>
    <div v-if="hasFooter" class="card-footer">
      <button v-if="showButton">{{ buttonText }}</button>
    </div>
  </div>
</template>

<!-- ✅ Slots 驅動:擴展不需修改源碼 -->
<template>
  <div class="card">
    <div v-if="$slots.header" class="card-header">
      <slot name="header" />
    </div>
    <div class="card-body">
      <slot />
    </div>
    <div v-if="$slots.actions" class="card-footer">
      <slot name="actions" />
    </div>
  </div>
</template>
```

---

### 3. 依賴反轉原則 (DIP) — Provide/Inject 依賴注入

**核心理念**:高層模組不應依賴低層模組,兩者都應依賴抽象。

#### 架構優勢

- ✅ **可測試性**:測試時可輕鬆 Mock Service
- ✅ **避免 Prop Drilling**:深層組件無需逐層傳遞 Props
- ✅ **解耦**:組件不知道資料來源是 REST/GraphQL/LocalStorage

#### 實作範例

```ts
// services/types.ts
export interface IUserService {
  login(payload: LoginPayload): Promise<User>
  logout(): Promise<void>
}

// plugins/services.ts
import type { IUserService } from '@/services/types'

export const UserServiceKey: InjectionKey<IUserService> = Symbol('UserService')

export default defineNuxtPlugin(() => {
  const userService: IUserService = new UserService()
  
  return {
    provide: {
      [UserServiceKey as symbol]: userService
    }
  }
})

// 組件中使用
<script setup>
import { UserServiceKey } from '@/plugins/services'

const userService = inject(UserServiceKey)
const handleLogin = () => userService.login(formData)
</script>
```

---

## 進階組件設計模式

### 1. 容器/展示組件模式 (Container/Presentational Pattern)

**核心思想**:將「數據獲取(How things work)」與「數據渲染(How things look)」分離。

#### 職責劃分

| 組件類型 | 職責 | 特徵 | 檔案命名 |
|----------|------|------|----------|
| **容器組件** | 與 Store 交互、發送 API、處理路由 | 包含業務邏輯,少量 CSS | `*Container.vue` |
| **展示組件** | 純 UI 渲染 | 僅依賴 Props/Emits,高度可複用 | `*View.vue`, `Base*.vue` |

#### 實作範例

```vue
<!-- ProductListContainer.vue (Smart Component) -->
<script setup>
import { useProductStore } from '@/stores/product'
import ProductListView from './ProductListView.vue'

const productStore = useProductStore()
const { products, loading } = storeToRefs(productStore)

onMounted(() => productStore.fetchProducts())

const handleDelete = (id) => productStore.deleteProduct(id)
</script>

<template>
  <ProductListView 
    :products="products" 
    :loading="loading"
    @delete="handleDelete" 
  />
</template>

<!-- ProductListView.vue (Dumb Component) -->
<script setup>
defineProps<{
  products: Product[]
  loading: boolean
}>()

defineEmits<{
  delete: [id: string]
}>()
</script>

<template>
  <div class="product-list">
    <v-progress-circular v-if="loading" />
    <ProductCard 
      v-for="product in products" 
      :key="product.id"
      :product="product"
      @delete="$emit('delete', product.id)"
    />
  </div>
</template>
```

---

### 2. Composables vs Renderless Components

**官方建議**:Composables 是複用有狀態邏輯的首選方式。

#### 深度比較

| 特性 | Composables | Renderless Components |
|------|-------------|----------------------|
| **本質** | 閉包函數 | Vue 組件實例 |
| **記憶體佔用** | ✅ 低 (無組件實例) | ❌ 高 (需創建 VNode) |
| **TypeScript 支援** | ✅ 完整類型推斷 | ⚠️ 需手動定義 Slot Props 類型 |
| **組合性** | ✅ 易於解構與組合 | ❌ 需透過 Scoped Slots |
| **適用場景** | 純邏輯複用 | 需提供預設 UI 結構 |

#### 最佳實踐

```js
// ✅ 推薦:使用 Composable 複用邏輯
export function useWindowSize() {
  const width = ref(window.innerWidth)
  const height = ref(window.innerHeight)

  const update = () => {
    width.value = window.innerWidth
    height.value = window.innerHeight
  }

  onMounted(() => window.addEventListener('resize', update))
  onUnmounted(() => window.removeEventListener('resize', update))

  return { width, height }
}

// ❌ 不推薦:僅為複用邏輯而創建組件
<template>
  <slot :width="width" :height="height" />
</template>
```

---

### 3. 複合組件模式 (Compound Component Pattern)

**適用場景**:Tabs、Accordion、Form 等需要多個子組件協同工作的 UI。

#### 實作策略

透過 `Provide/Inject` 實現父子組件的隱式通訊,簡化 API 使用。

```vue
<!-- Tabs.vue (父組件) -->
<script setup>
import { provide, ref } from 'vue'

const activeTabId = ref(null)

provide('tabsContext', {
  activeTabId,
  setActiveTab: (id) => activeTabId.value = id
})
</script>

<template>
  <div class="tabs">
    <slot />
  </div>
</template>

<!-- Tab.vue (子組件) -->
<script setup>
import { inject, computed } from 'vue'

const props = defineProps<{ id: string, title: string }>()

const { activeTabId, setActiveTab } = inject('tabsContext')
const isActive = computed(() => activeTabId.value === props.id)
</script>

<template>
  <div 
    :class="{ active: isActive }"
    @click="setActiveTab(id)"
  >
    {{ title }}
  </div>
</template>

<!-- 使用範例 -->
<Tabs>
  <Tab id="tab1" title="首頁" />
  <Tab id="tab2" title="設定" />
</Tabs>
```

---



# ==Nuxt 專用規範==

## Version: 2025-12

### SSR 資料取得策略

| 情境 | 推薦方式 | 說明 |
|------|----------|------|
| **SSR 初始載入** | `useAsyncData` + `$fetch('/api/proxy')` | SEO 需求、首屏渲染 |
| **Client-only 會員功能** | `useAsyncState` (VueUse) | `immediate: false`，互動觸發 |
| **表單提交/互動** | Service function 直接呼叫 | 不需 SSR |

---

### Hydration Mismatch 防雷指南 (Critical)

**核心原則**：Server 渲染出的 DOM 結構，必須與 Client 端「第一次」渲染的 VDOM 結構**完全一致**。若發生 Mismatch，Vue 將會拋棄 SSR 的結果並重新渲染，導致效能與 SEO 問題。

#### 1. 資料同步原則 (Payload Rule)
*   **原則**：Server 取得的資料，必須透過 `useAsyncData` + `useState` 自動將結果「塞」給 Client (Payload)，保證雙端拿到一樣的 JSON。
*   **禁止**：在 `setup` 頂層依賴不會被序列化的資料源（如隨機數、未同步的 API 呼叫）。

#### 2. 瀏覽器 API 隔離原則 (Browser API Isolation)
*   **原則**：Server 不知道視窗寬度、LocalStorage、Cookie (除非明確傳送)。任何依賴 `window` / `document` / `localStorage` 的判斷，都必須：
    *   包在 `<ClientOnly>` 中。
    *   或是在 `onMounted` 之後執行。

#### 3. ClientOnly 使用時機
*   **時機**：當內容**不需要 SEO** (如：登入後個人資訊、彈窗、複雜互動元件) 且**依賴瀏覽器 API** 時。
*   **副作用**：Server 只會輸出佔位符 `<!-- -->`。若內容包含重要的 `<h1>` 或 `meta tags`，SEO 會失效。
*   **限制**：`<ClientOnly>` 只能解決「內容」的 mismatch，無法解決「屬性」(class, style) 的 mismatch。

#### 4. 條件渲染確定性 (Deterministic Rendering)
*   **原則**：`v-if` 的判斷條件必須是「確定性」的。確保留給 `v-if` 的資料來源（Props 或 Store）在 Server 與 Client 端初次渲染時是同步的。

---

### SSR Hydration 狀態管理：`ref()` vs `useState()`

**問題**：`ref()` 的值不會被 Nuxt SSR Payload 序列化，導致 Client Hydration 時被重設為空陣列。

#### 解決方案：改用 `useState()`

```js
// ❌ 錯誤寫法：ref() 資料在 Hydration 時會遺失
const blockList = ref([])

// ✅ 正確寫法：useState() 資料會從 SSR Payload 正確恢復
const blockList = useState('unique-key-block-list', () => [])
```

#### 使用 `useState()` 的注意事項

| 特性 | 說明 |
|------|------|
| **全域持久化** | `useState` 的資料在整個應用生命週期中保持，換頁不會自動清除 |
| **唯一 Key** | 每個 `useState` 需要唯一的 key，避免不同元件/頁面資料衝突 |
| **清除時機** | 如需在換頁時清除資料，應提供 `reset` 方法手動清除 |

#### 完整範例：Composable 中使用 useState

```js
// composables/usePageBlocks.js
import { useState } from 'nuxt/app'
import { ref, computed } from 'vue'

export function usePageBlocks(pageId, options = {}) {
    const size = options.size || 1
    
    // ✅ 使用 useState 讓 SSR 資料能正確 Hydrate
    const seedState = useState(`${pageId}-seed`, () => null)
    const blockList = useState(`${pageId}-block-list`, () => [])
    
    // 這些不需要 SSR，可以用 ref
    const rowsCount = ref(0)
    const hasMore = ref(true)

    function updateBlockList(newData) {
        blockList.value = newData ?? []
        rowsCount.value = blockList.value.length
        hasMore.value = blockList.value.length >= size
    }

    // 重置方法：用於換頁時清除全域狀態
    function resetBlockList() {
        blockList.value = []
        rowsCount.value = 0
        hasMore.value = true
    }

    return {
        blockList,
        seedState,
        rowsCount,
        hasMore,
        updateBlockList,
        resetBlockList,
    }
}
```

#### 何時使用 `ref()` vs `useState()`

| 情境 | 推薦 | 原因 |
|------|------|------|
| SSR 初始載入的資料 | `useState()` | 需要從 Server 傳遞到 Client |
| Client-only 區域狀態 | `ref()` | 不需要 SSR，元件內部使用 |
| Loading/Error 狀態 | `ref()` | 暫時性狀態，不需持久化 |
| 分頁計數器 | `ref()` | Client 端計算即可 |


### useAsyncData 範例

```js
// SSR 初始載入
const { data, status, refresh, clear } = await useAsyncData(
  'unique-key', // 唯一鍵值，用於跨請求去重
  async () => {
    // SSR 時從 incoming request 取得 cookie
    const ssrHeaders = import.meta.server ? useRequestHeaders(['cookie']) : {}
    const clientOpts = import.meta.client ? { credentials: 'include' } : {}
    
    const res = await $fetch('/api/proxy', {
      headers: ssrHeaders,
      ...clientOpts,
      params: { url: 'endpoint', ...params }
    })
    
    return res.rtnCode === '0000' ? res.data : []
  },
  {
    default: () => [],           // 預設值，需與回傳型別一致
    server: true,                // 啟用 SSR
    immediate: true,             // 立即執行
    lazy: false,                 // 非延遲載入
    watch: [page]                // 監聽變數，變動時自動重取
  }
)
```

### useAsyncState 範例（Client-only 會員功能）

```js
import { useAsyncState } from '@vueuse/core'

// 會員功能初始化
const { state, isLoading, isReady, error, execute } = useAsyncState(
  () => UserService.getPlaylists(),
  [], // 預設值
  { immediate: false } // 不立即執行
)

// 登入後手動觸發
onMounted(() => {
  if (loginStore.isLogin) {
    execute()
  }
})

// 監聽參數變化重新執行
watch(params, () => {
  execute()
})
```

### Plugin 註冊與使用

#### 註冊 (plugins/axios.js)

```js
export default defineNuxtPlugin((nuxtApp) => {
  const api = axios.create({ ... })
  
  async function makeApiCall(method, url, data, config) {
    // ... 實作邏輯 ...
  }
  
  nuxtApp.provide('axios', api)
  nuxtApp.provide('makeApiCall', makeApiCall)
})
```

#### Service 內使用

```js
// services/authService.js
export const UserService = {
  async login(userData) {
    const { $makeApiCall } = useNuxtApp()
    return await $makeApiCall('POST', '/members/login', userData, {
      showSuccess: false,
      showWarn: true
    })
  }
}
```

#### Vue 組件內使用

```vue
<script setup>
import { UserService } from '@/services/authService'

}
</script>
```

---

## 防禦性編程與錯誤處理機制

### 核心原則:不信任原則

高品質的前端應用必須建立在「不信任」的基礎上:
- ❌ 不信任網路的穩定性
- ❌ 不信任使用者的輸入
- ❌ 不信任後端的資料格式
- ❌ 不信任第三方套件的穩定性

---

### 1. 嚴格的 Props 驗證與 TypeScript

#### Props 驗證層級

| 驗證層級 | 工具 | 時機 | 防護範圍 |
|----------|------|------|----------|
| **編譯時** | TypeScript | 開發階段 | 靜態類型錯誤 |
| **運行時** | Vue Props Validator | 組件實例化 | 動態資料錯誤 |
| **資料層** | Zod/Valibot | API 回應 | 後端資料格式錯誤 |

#### 實作範例

```vue
<script setup lang="ts">
import { PropType } from 'vue'

// ✅ 完整的 Props 驗證
const props = defineProps({
  status: {
    type: String as PropType<'pending' | 'success' | 'error'>,
    required: true,
    validator: (value: string) => ['pending', 'success', 'error'].includes(value)
  },
  items: {
    type: Array as PropType<Product[]>,
    default: () => [],
    validator: (value: Product[]) => {
      // 確保每個項目都有必要的屬性
      return value.every(item => item.id && item.name)
    }
  },
  price: {
    type: Number,
    required: true,
    validator: (value: number) => value >= 0 && value <= 999999
  }
})
</script>
```

---

### 2. 全域 API 攔截與錯誤標準化

#### 統一錯誤處理架構

```ts
// composables/useAPI.ts
export function useAPI() {
  const config = useRuntimeConfig()
  
  const api = $fetch.create({
    baseURL: config.public.apiBase,
    
    // Request 攔截器
    onRequest({ options }) {
      const token = useCookie('auth_token')
      if (token.value) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token.value}`
        }
      }
    },
    
    // Response 攔截器
    onResponse({ response }) {
      // 標準化成功回應
      if (response._data?.rtnCode === '0000') {
        return response._data.data
      }
    },
    
    // Error 攔截器
    onResponseError({ response }) {
      const statusCode = response.status
      
      // 統一錯誤處理
      switch (statusCode) {
        case 401:
          // 未授權:清除 Token 並導向登入
          navigateTo('/login')
          break
        case 403:
          showError({ statusCode: 403, message: '權限不足' })
          break
        case 500:
          showError({ statusCode: 500, message: '伺服器錯誤,請稍後再試' })
          break
        default:
          // 顯示後端回傳的錯誤訊息
          const message = response._data?.message || '發生未知錯誤'
          showToast({ type: 'error', message })
      }
      
      // 拋出標準化錯誤物件
      throw createError({
        statusCode,
        message: response._data?.message,
        data: response._data
      })
    }
  })
  
  return { api }
}
```

---

### 3. Error Boundaries 與優雅降級

#### 實作策略

```vue
<!-- layouts/default.vue -->
<template>
  <div>
    <Header />
    
    <!-- 主要內容區:錯誤不影響整體 -->
    <NuxtErrorBoundary>
      <slot />
      
      <template #error="{ error, clearError }">
        <div class="error-fallback">
          <h2>頁面載入失敗</h2>
          <p>{{ error.message }}</p>
          <v-btn @click="clearError">重試</v-btn>
        </div>
      </template>
    </NuxtErrorBoundary>
    
    <!-- 次要區塊:錯誤僅影響該區塊 -->
    <NuxtErrorBoundary>
      <RecommendedProducts />
      
      <template #error>
        <div class="widget-error">
          <p>推薦商品暫時無法載入</p>
        </div>
      </template>
    </NuxtErrorBoundary>
    
    <Footer />
  </div>
</template>
```

#### 非同步組件錯誤處理

```vue
<script setup>
// ✅ 正確:配合 Suspense 處理非同步 setup
const { data, error } = await useAsyncData('key', async () => {
  const result = await api.getData()
  if (!result) throw new Error('資料載入失敗')
  return result
})

// 在 template 中檢查錯誤
</script>

<template>
  <div v-if="error">
    <ErrorMessage :error="error" />
  </div>
  <div v-else>
    <DataDisplay :data="data" />
  </div>
</template>
```

---

### 4. Runtime Validation (Zod/Valibot)

#### 為何需要 Runtime Validation?

TypeScript 的介面定義在編譯後即消失,無法防止 API 回傳錯誤格式。

#### 實作範例

```ts
// schemas/user.schema.ts
import { z } from 'zod'

export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50),
  email: z.string().email(),
  age: z.number().int().min(0).max(150).optional(),
  role: z.enum(['admin', 'user', 'guest'])
})

export type User = z.infer<typeof UserSchema>

// services/userService.ts
export const UserService = {
  async getUser(id: string): Promise<User> {
    const { api } = useAPI()
    const rawData = await api(`/users/${id}`)
    
    // ✅ 運行時驗證:確保資料格式正確
    try {
      return UserSchema.parse(rawData)
    } catch (error) {
      console.error('API 資料格式錯誤:', error)
      throw new Error('使用者資料格式不符合預期')
    }
  }
}
```

---

### 5. 防禦性編程檢查清單

在生成任何程式碼後,請自我檢核:

- [ ] **Props 驗證**:是否定義了 `validator` 與 `default` 值?
- [ ] **Null/Undefined 處理**:是否使用了 Optional Chaining (`?.`) 與 Nullish Coalescing (`??`)?
- [ ] **API 錯誤處理**:是否包裹在 `try-catch` 或使用 Result Pattern?
- [ ] **陣列操作**:在 `.map()` / `.filter()` 前是否檢查了 `Array.isArray()`?
- [ ] **環境變數**:敏感資訊是否使用 `runtimeConfig` 而非硬編碼?
- [ ] **Loading 狀態**:非同步操作是否顯示 Loading UI?
- [ ] **Error Boundaries**:關鍵區塊是否包裹在 `<NuxtErrorBoundary>`?

---

## UI 系統封裝與效能優化

### 1. Facade Pattern:UI 庫的抽象層

**目的**:避免與第三方 UI 庫強耦合,降低未來更換成本。

#### 實作策略

```vue
<!-- components/base/AppInput.vue -->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: String,
  label: String,
  error: String,
  // 僅暴露專案允許的屬性
  size: {
    type: String,
    validator: (v) => ['small', 'medium', 'large'].includes(v),
    default: 'medium'
  }
})

const emit = defineEmits(['update:modelValue'])

// 映射專案規範到 Vuetify 規範
const densityMap = {
  small: 'compact',
  medium: 'default',
  large: 'comfortable'
}

const density = computed(() => densityMap[props.size])
</script>

<template>
  <v-text-field
    :model-value="modelValue"
    :label="label"
    :error-messages="error"
    :density="density"
    variant="outlined"
    v-bind="$attrs"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>
```

#### 優勢

- ✅ **統一風格**:全站自動套用 `variant="outlined"`
- ✅ **屬性收斂**:限制開發者只能使用規範允許的屬性
- ✅ **易於遷移**:未來更換 UI 庫只需修改 Base 組件

---

### 2. 大型列表效能優化

#### 優化技術對照

| 技術 | 原理 | 效能提升 | 適用場景 |
|------|------|----------|----------|
| **虛擬滾動** | 僅渲染可見範圍的 DOM | ⭐⭐⭐⭐⭐ | 1000+ 項目列表 |
| **v-memo** | 跳過未變更子樹的 Diff | ⭐⭐⭐⭐ | 複雜列表項目 |
| **v-once** | 僅渲染一次,永不更新 | ⭐⭐⭐ | 靜態內容 |
| **Immutable 更新** | 淺層監聽觸發更新 | ⭐⭐⭐ | 大型陣列操作 |

#### 實作範例

```vue
<template>
  <!-- ✅ 虛擬滾動:處理大量數據 -->
  <v-virtual-scroll
    :items="products"
    :item-height="80"
    height="600"
  >
    <template #default="{ item }">
      <!-- ✅ v-memo:僅在 item.id 或 item.stock 變化時重新渲染 -->
      <ProductCard 
        v-memo="[item.id, item.stock]"
        :product="item" 
      />
    </template>
  </v-virtual-scroll>
</template>

<script setup>
// ✅ Immutable 更新:觸發淺層監聽
const updateProduct = (id, newData) => {
  products.value = products.value.map(p => 
    p.id === id ? { ...p, ...newData } : p
  )
}

// ❌ 錯誤:直接修改不會觸發虛擬滾動更新
const wrongUpdate = (id, newData) => {
  const product = products.value.find(p => p.id === id)
  Object.assign(product, newData) // 不會觸發更新!
}
</script>
```

---

### 3. 避免深度監聽的效能陷阱

```js
// ❌ 危險:深度監聽大型陣列會造成效能災難
watch(products, () => {
  console.log('Products changed')
}, { deep: true }) // 每次任何屬性變更都會遍歷整個陣列!

// ✅ 正確:使用淺層監聽 + Immutable 更新
watch(products, () => {
  console.log('Products array reference changed')
}) // 僅在陣列參考變更時觸發

// ✅ 正確:僅監聽特定屬性
watch(() => products.value.length, (newLen) => {
  console.log('Product count:', newLen)
})
```

---

## 總結:企業級 Vue 3 開發準則

### 架構設計
- ✅ 遵循 SOLID 原則,保持組件單一職責
- ✅ 使用 Composables 複用邏輯,避免 Renderless Components
- ✅ 透過 Provide/Inject 實現依賴注入

### 防禦性編程
- ✅ 嚴格驗證 Props 與 API 資料
- ✅ 使用 Error Boundaries 隔離錯誤
- ✅ 實施 Runtime Validation (Zod)

### 效能優化
- ✅ 大型列表使用虛擬滾動 + v-memo
- ✅ 避免深度監聽,使用 Immutable 更新
- ✅ 封裝 UI 庫,降低耦合

### 測試策略
- ✅ 詳細測試規範請參考 [08-Testing.md](./08-Testing.md)
- ✅ 遵循測試金字塔,重點在單元測試
- ✅ Mock 所有外部依賴
- ✅ 覆蓋 Edge Cases

**核心理念**:構建能夠適應業務變化、容忍錯誤發生且易於團隊協作的系統。

