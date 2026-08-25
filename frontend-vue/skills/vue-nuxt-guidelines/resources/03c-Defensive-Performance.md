---
title: 防禦性編程與效能優化
category: Best Practices
tags: [Defensive Programming, Error Handling, Performance, Zod, Facade Pattern]
version: 2025-12
maintainer: Zoe Chan
last_updated: 2026-01-28
description: 前端防禦性編程實踐、統一錯誤處理架構、UI 系統封裝與大型列表效能優化
---

# 防禦性編程與效能優化

**Maintainer**: Zoe Chan  
**Version**: 2025-12  
**Last Updated**: 2026-01-28

---

## 防禦性編程與錯誤處理

### 核心原則: 不信任原則
高品質的前端應用必須建立在「不信任」的基礎上：不信任網路、使用者輸入、後端資料格式與第三方套件。

### 1. 嚴格的 Props 驗證與 TypeScript
- **編譯時**: TypeScript
- **運行時**: Vue Props Validator (使用 `validator` 函式)
- **資料層**: Zod (Runtime Validation)

### 2. 全域 API 攔截與錯誤標準化
透過 `$fetch.create` 的 `onResponseError` 統一處理 401, 403, 500 等狀態碼，並拋出標準化錯誤物件。

### 3. Error Boundaries 與優雅降級
使用 `<NuxtErrorBoundary>` 隔離非關鍵組件錯誤，防止單一組件崩潰導致全頁白屏。

### 4. Runtime Validation (Zod)
```ts
// services/userService.ts
export const UserService = {
  async getUser(id: string): Promise<User> {
    const rawData = await api(`/users/${id}`)
    return UserSchema.parse(rawData) // ✅ 確保資料格式正確
  }
}
```

---

## UI 系統封裝 (Facade Pattern)

**目的**: 避免與第三方 UI 庫強耦合。透過 Base 組件（如 `AppInput.vue`）限制暴露屬性，統一風格並降低遷移成本。

---

## 大型列表效能優化

| 技術 | 原理 | 適用場景 |
|------|------|----------|
| **虛擬滾動** | 僅渲染可見範圍的 DOM | 1000+ 項目列表 |
| **v-memo** | 跳過未變更子樹的 Diff | 複雜列表項目 |
| **Immutable 更新** | 淺層監聽觸發更新 | 大型陣列操作 |

### 虛擬滾動實作範例
```vue
<template>
  <v-virtual-scroll :items="products" :item-height="80">
    <template #default="{ item }">
      <ProductCard v-memo="[item.id, item.stock]" :product="item" />
    </template>
  </v-virtual-scroll>
</template>
```

---

## 效能黃金法則
- 避免對大型陣列使用 `deep: true` 的 `watch`。
- 使用淺層監聽 + Immutable 更新參考。
- 僅監聽必要的屬性（如 `products.value.length`）。
