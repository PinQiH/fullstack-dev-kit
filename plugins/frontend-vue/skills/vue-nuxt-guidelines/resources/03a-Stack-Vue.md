---
title: Vue 3 核心規範
category: Framework
tags: [Vue3, Composition API, SOLID, Clean Architecture]
version: 2025-12
maintainer: Zoe Chan
last_updated: 2026-01-28
description: Vue 3 核心開發規範，涵蓋程式碼風格、Composition API 結構順序與 SOLID 原則應用
---

# Vue 3 核心規範

**Maintainer**: Zoe Chan  
**Version**: 2025-12  
**Last Updated**: 2026-01-28

---

## 程式碼風格

### **程式碼結構順序請照以下**:

1. `<script>`
   - 硬編碼要整理在一塊
   - 未做完的地方(例如使用假資料)請加上`//TODO`，並在交接文件上新增工項紀錄
2. `<template>`
3. `<style>`
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
- **程式碼要符合 SOLID 原則、Clean Code 原則**
- **封裝 sweetAlert.js 集中管理提示訊息，並在 service 用 Result Pattern 處理 API 回傳，只在 composables 中根據錯誤類型決定 UI 回饋，避免重複 alert**

---

## SOLID 原則在 Vue 3 中的應用

### 1. 單一職責原則 (SRP) — 組件職責分離

**核心理念**: 一個模組只有一個改變的理由。組件應專注於「視圖呈現」，而非混合業務邏輯。

#### 架構分層實踐

| 層級 | 職責 | 檔案類型 | 依賴方向 |
|------|------|----------|----------|
| **視圖層** | 模板渲染、Props/Emits 綁定 | `.vue` 檔案 | → 邏輯層 |
| **邏輯層** | 狀態管理、計算、流程控制 | `composables/`, `stores/` | → 服務層 |
| **服務層** | API 通訊、資料轉換 | `services/` | → 外部 API |

#### 實作範例

```vue
<!-- ✅ 符合 SRP: 邏輯提取至 Composable -->
<script setup>
import { useProductList } from '@/composables/useProductList'

const { products, loading, refresh } = useProductList({ inStockOnly: true })
</script>
```

---

### 2. 開放/封閉原則 (OCP) — 插槽驅動設計

**核心理念**: 對擴展開放，對修改封閉。透過 Slots 委派內容渲染權。

#### 組件設計策略對照

| 設計策略 | 特徵 | OCP 合規性 | 適用場景 |
|----------|------|------------|----------|
| **Props 驅動** | 透過 boolean/string 控制顯示邏輯 | ❌ 低 | 原子組件 |
| **Slots 驅動** | 透過插槽注入 DOM 結構 | ✅ 高 | 容器組件 |
| **Headless UI** | 僅提供邏輯與狀態,無樣式 | ✅ 極高 | 複雜交互 |

---

### 3. 依賴反轉原則 (DIP) — Provide/Inject 依賴注入

**核心理念**: 高層模組不應依賴低層模組，兩者都應依賴抽象。

#### 架構優勢
- ✅ **可測試性**: 測試時可輕鬆 Mock Service
- ✅ **避免 Prop Drilling**: 深層組件無需逐層傳遞 Props
- ✅ **解耦**: 組件不知道資料來源是 REST/GraphQL/LocalStorage
