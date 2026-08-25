---
title: UI 三態設計規範（Loading / Error / Empty）
category: UX
version: 2025-12
---

# UI 三態設計規範

**原則**：任何依賴非同步資料的 UI 區塊，必須定義 Loading、Error、Empty 三種狀態。

---

## 狀態決策樹

```
資料請求發出
    │
    ├─► Loading ──► 顯示 Skeleton / Spinner
    │
    └─► 請求完成
            │
            ├─► 錯誤 ──► Error State（含重試入口）
            │
            └─► 成功
                    │
                    ├─► 有資料 ──► 正常渲染
                    │
                    └─► 空資料 ──► Empty State
                                        │
                                        ├─ 初始無資料（引導新增）
                                        └─ 搜尋無結果（清除篩選）
```

---

## Vue 3 標準實作樣板

```vue
<template>
  <!-- Loading -->
  <div v-if="isLoading">
    <SkeletonList :count="5" />
  </div>

  <!-- Error -->
  <ErrorState
    v-else-if="isError"
    :message="errorMessage"
    @retry="refetch"
  />

  <!-- Empty（區分兩種語意）-->
  <EmptyState
    v-else-if="!data?.length"
    :type="hasFilter ? 'no-results' : 'no-data'"
  />

  <!-- 正常內容 -->
  <ul v-else>
    <li v-for="item in data" :key="item.id">...</li>
  </ul>
</template>
```

---

## 各狀態設計規範

### Loading State

| 規則 | 說明 |
|------|------|
| Skeleton 優先 | 比 Spinner 更能減少 Layout Shift |
| Skeleton 尺寸對應 | Skeleton 外觀應接近真實內容的高度與寬度 |
| 互動凍結 | Loading 時禁止用戶操作（防止重複送出） |
| 超時提示 | 超過 10 秒應顯示「載入較慢，請稍候」 |

### Error State

| 規則 | 說明 |
|------|------|
| 業務語言 | 「無法載入訂單列表」而非「HTTP 500」 |
| 可操作入口 | 至少一個「重試」或「返回」按鈕 |
| 不靜默失敗 | 禁止 catch 後不顯示任何 UI |
| 區分錯誤類型 | 網路錯誤 / 權限不足 / 資源不存在，各有不同文案 |

### Empty State

| 類型 | 標題 | 說明 | 行動按鈕 |
|------|------|------|---------|
| 初始無資料 | 「尚未有任何訂單」 | 說明如何建立第一筆 | [建立訂單] |
| 搜尋無結果 | 「找不到符合的結果」 | 建議修改搜尋條件 | [清除篩選] |
| 權限限制 | 「您沒有查看此內容的權限」 | 說明需要什麼權限 | [聯絡管理員] |
